var express = require('express');
var app = express();
// var bodyParser = require('body-parser');
// app.use(bodyParser.json());
var http = require('http').Server(app);
var io = require('socket.io')(http);


var path = require('path');
app.use(express.static(path.join(__dirname,'./client')));

var pokemons = require('./pokemons.json');
var poketypes = require('./poketypes.json');

app.get('/', function(req, res){
  res.sendfile('index.html');
});

var nicknames = {};
var userImgs = {}
var userColors = {};
var userPokemons = {};
var vs = {}; //1 vs 1
//initialize commands object
var playerCmds = {};
var playerOriCmds = {};


function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function damage(source,target,att_type){
  var dmg = 0;
  var res = 0;
  var msg = "";
  var fact = 1;
  var att_type = userPokemons[source].type;
  var def_type = userPokemons[target].type;
  var att = userPokemons[source].attack;
  var def = userPokemons[target].defense;
  switch(att_type){
    case '1':
      //original damage
      dmg = userPokemons[source].moves.damage;
      //mp gain
      if(userPokemons[source].mp + userPokemons[source].moves.energyInc > 100){
        userPokemons[source].mp = 100;
      }else{
        userPokemons[source].mp += userPokemons[source].moves.energyInc;
      }
      if(poketypes[att_type].def_type){
        fact *= poketypes[att_type].def_type;
        if(poketypes[att_type].def_type < 1){
          msg = "not effective";
        }else{
          msg = "very effective";
        }
      }
      res = Math.floor(dmg * fact * att/(att + def));
      break;
    case '2':
      if(userPokemons[source].supermoves.energyCost * 100 > userPokemons[source].mp){
        res = 0;
        msg = "not enough MP to release the supermove!";
      }else{
        userPokemons[source].mp -= userPokemons[source].supermoves.energyCost * 100;
        dmg = userPokemons[source].supermoves.damage;
        var rand = Math.random();
        if(poketypes[att_type].def_type){
          fact *= poketypes[att_type].def_type;
          if(poketypes[att_type].def_type < 1){
            msg = "not effective";
          }else{
            msg = "very effective";
          }
        }
        if(rand < userPokemons[source].supermoves.criticalRatio){
          fact *= 2;
          msg = "critical";
        }
        
        res = Math.floor(dmg * fact * att/(att + def));
      }
      break;
    default:
      dmg = 5;
      if(poketypes[att_type].def_type){
        fact *= poketypes[att_type].def_type;
      }
      res = Math.floor(dmg * fact * att/(att + def));
      break;
  }//end switch
  return{
    "message":msg,
    "damage":res
  }
}

var djb2Code = function(str){
	var hash = 5381;
	for(var i = 0; i < str.length; i++){
		var charCode = str[i].charCodeAt(0)
		hash = ((hash << 5) + hash) + charCode;
	}
	return hash;
};

var isCommandValid = function(str){
  if (str.length !== 6){
    return false;
  }
  var s = str.toLowerCase();
  for(var i = 0; i < s.length; i++){
    if(s[i] !== 'r' && s[i] !== 's' && s[i] !== 'p'){
      return false;
    }
  }
  return true;
};

var thisRound = function(cmd,oricmd){
  console.log('this round!');
  var users = [],
      user1,
      user2,
      single1 = [],
      single2 = [],
      move1 = [],
      move2 = [],
      supermove1 = [],
      supermove2 = [];
      
  for (var key in cmd){
    users.push(key);
  }
  //assign user
  user1 = users[0];
  user2 = users[1];
  var cmd1 = cmd[user1];
  var cmd2 = cmd[user2];
  var oricmd1 = oricmd[user1];
  var oricmd2 = oricmd[user2];

  for(var i = 0; i < cmd1.length; i++){
    switch(cmd1[i]){
      case 'r':
        switch(cmd2[i]){
          case 'r':
            single1.push(0);
            single2.push(0);
            break;
          case 's':
            single1.push(1);
            single2.push(-1);
            break;
          case 'p':
            single1.push(-1);
            single2.push(1);
            break;
          default:
            break;
        }
        break;
      case 's':
        switch(cmd2[i]){
          case 'r':
            single1.push(-1);
            single2.push(1);
            break;
          case 's':
            single1.push(0);
            single2.push(0);
            break;
          case 'p':
            single1.push(1);
            single2.push(-1);
            break;
          default:
            break;
        }
        break;
      case 'p':
        switch(cmd2[i]){
          case 'r':
            single1.push(1);
            single2.push(-1);
            break;
          case 's':
            single1.push(-1);
            single2.push(1);
            break;
          case 'p':
            single1.push(0);
            single2.push(0);
            break;
          default:
            break;
        }
        break;
    }//end big switch
  }//end big for

  console.log('single1',single1);
  console.log('single2',single2);

  //check if moves are successful
  var move_index1 = [];
  var move_index2 = [];
  var supermove_index1 = [];
  var supermove_index2 = [];
  //p1 move index
  var cnt = 0;
  for(var i = 0; i < oricmd1.length; i++){
    if(oricmd1[i] !== '1' && oricmd1[i] !== '2'){
      cnt += 1;
      continue;
    }
    else if(oricmd1[i] === '1'){
      move_index1.push([cnt,cnt+1]);
      cnt += 2;
    }else{
      supermove_index1.push([cnt,cnt+1,cnt+2]);
      cnt += 3;
    }
  }

  for(var i = 0; i < move_index1.length; i++){
    var tmpList = move_index1[i];
    var flag = 0;
    for(var j = 0; j < tmpList.length; j++){
      var index = tmpList[j];
      if(single1[index] === -1){
        flag = -100;
        break;
      }else{
        flag += single1[index];
      }
    }
    if(flag >= 0){
      move1.push(true);
    }else{
      move1.push(false);
    }
  }
  console.log('move1',move1);

  for(var i = 0; i < supermove_index1.length; i++){
    var tmpList = supermove_index1[i];
    var flag = 0;
    for(var j = 0; j < tmpList.length; j++){
      var index = tmpList[j];
      if(single1[index] === -1){
        flag = -100;
        break;
      }else{
        flag += single1[index];
      }
    }
    if(flag >= 0){
      supermove1.push(true);
    }else{
      supermove1.push(false);
    }
  }
  console.log('supermove1',supermove1);

  //p2 move index
  cnt = 0; //reset cnt
  for(var i = 0; i < oricmd2.length; i++){
    if(oricmd2[i] !== '1' && oricmd2[i] !== '2'){
      cnt += 1;
      continue;
    }
    else if(oricmd2[i] === '1'){
      move_index2.push([cnt,cnt+1]);
      cnt += 2;
    }else{
      supermove_index2.push([cnt,cnt+1,cnt+2]);
      cnt += 3;
    }
  }

  for(var i = 0; i < move_index2.length; i++){
    var tmpList = move_index2[i];
    var flag = 0;
    for(var j = 0; j < tmpList.length; j++){
      var index = tmpList[j];
      if(single2[index] === -1){
        flag = -100;
        break;
      }else{
        flag += single2[index];
      }
    }
    if(flag >= 0){
      move2.push(true);
    }else{
      move2.push(false);
    }
  }
  console.log('move2',move2);

  for(var i = 0; i < supermove_index2.length; i++){
    var tmpList = supermove_index2[i];
    var flag = 0;
    for(var j = 0; j < tmpList.length; j++){
      var index = tmpList[j];
      if(single2[index] === -1){
        flag = -100;
        break;
      }else{
        flag += single2[index];
      }
    }
    if(flag >= 0){
      supermove2.push(true);
    }else{
      supermove2.push(false);
    }
  }
  console.log('supermove2',supermove2);

  console.log('move_index1',move_index1);
  console.log('supermove_index1',supermove_index1);

  return {
    'user1':user1,
    'user2':user2,
    'single1':single1,
    'single2':single2,
    'move1':move1,
    'move2':move2,
    'supermove1':supermove1,
    'supermove2':supermove2
  };

}//end thisRound

var colors = ['black','orange','blue','steelblue','skyblue','purple','pink','gray','maroon','olive'];
var getUserColor = function(str){
	var len = colors.length;
	var index = djb2Code(str) % len;
	return colors[index];
}

io.on('connection', function(socket){
  socket.on('disconnect',function(){
  	var msg = ''
  	if((nicknames[socket.id])){
  		msg = "----- " + nicknames[socket.id] + ' left the chat -----';
  	}else{
  		msg = '----- Someone left the chat -----';
  	}

  	delete nicknames[socket.id];
  	delete userImgs[socket.id];
  	delete userColors[socket.id];
    delete userPokemons[socket.id];
    delete vs[socket.id];
    delete playerCmds[socket.id];
    delete playerOriCmds[socket.id];
  	
  	io.emit('left room',msg);
  });

  socket.on('enter room',function(data){
  	//set user nickname
  	nicknames[socket.id] = data.name;
  	//set user img
  	userImgs[socket.id] = data.img;
  	//set user color
  	userColors[socket.id] = getUserColor(socket.id);
  	var msg = '';
  	if(data.name){
  		msg = "----- " + data.name + ' has joined the chat -----';
  	}else{
  		msg = "----- Someone has joined the chat -----"
  	}	
  	io.emit('enter room',msg)
  });

  socket.on('chat message', function(msg){
    var op = msg.slice(0,1);
    switch(op){
      case '#': // pokemon info
        //random index for pokemon
        var post = msg.slice(1);
        var randomIndex = Math.floor(Math.random()*151+1);
        var index = (1 <= parseInt(post) && parseInt(post) <= 151)? post : randomIndex.toString();
        var data = pokemons[index];
        if(data === undefined){
          var error = "error: no results found.";
          socket.emit('notice',error);
        }else{
          var len1 = data.moves.length;
          var len2 = data.supermoves.length;
          var rand1 = Math.floor(Math.random()*len1);
          var rand2 = Math.floor(Math.random()*len2);
          var move_command = "";
          var supermove_command = "";
          //generate move list in rsp
          var rsp = ['r','s','p'];
          for(var i = 0; i < 5; i++){
            var r = Math.floor(Math.random()*3);
            if(i < 2){ //move
              move_command += rsp[r];
            }else{ //supermove
              supermove_command += rsp[r];
            }
          }
          var res = Object.assign({},
                                  data,
                                  {mp:100},
                                  {key:index},
                                  {username:nicknames[socket.id]},
                                  {usercolor:userColors[socket.id]},
                                  {moves:data.moves[rand1]},
                                  {supermoves:data.supermoves[rand2]},
                                  {move_command:move_command},
                                  {supermove_command:supermove_command}
                                  );
          //set user pokemon
          userPokemons[socket.id] = res;
          socket.emit('info',res);
        }
        break;
      case '!': //confirm pokemon
        if(!userPokemons[socket.id]){ //undefined
          var msg = "System Message: You should input '#' first to choose a pokemon!";
          socket.emit('notice',msg);
        }else{
          var len = Object.keys(vs).length;
          if(len >= 2){
            var msg = "System Message: Unable to join the battle. Queue is full.";
            socket.emit('notice',msg);
          }else if (len == 0){
            vs[socket.id] = Object.assign({},userPokemons[socket.id]);
            var msg = "System Message: Waiting for the opponent ...";
            socket.emit('notice',msg);
          }else{
            //begin fight
            vs[socket.id] = Object.assign({},userPokemons[socket.id]);
            var msg = "System Message: Battle Begins!";
            socket.emit('notice',msg);
            console.log(socket.id);
            io.emit('begin',vs);
            var msg = "Please enter your battle commands ...";
            io.emit('notice',msg);
          }
        }
               
        break;
      case '@':
        if(!userPokemons[socket.id]){ //undefined
          var msg = "System Message: You should input '#' first to choose a pokemon!";
          socket.emit('notice',msg);
        }else{
          //handle rsp
          var commands = msg.slice(1);
          //translate commands into pprrss
          var str = "";
          for(var i = 0; i < commands.length; i++){
            switch(commands[i]){
              case '1':
                str += userPokemons[socket.id].move_command;
                break;
              case '2':
                str += userPokemons[socket.id].supermove_command;
                break;
              default:
                str += commands[i];
                break;
            }//end switch
          }
          if(!isCommandValid(str)){
            var msg = "Invalid command! Enter '?' for more details.";
            socket.emit('notice',msg);
          }else{
            var msg = "Your command is "+str;
            socket.emit('notice',msg);

            playerCmds[socket.id] = str;
            playerOriCmds[socket.id] = commands;

            // console.log(playerCmds);
            // console.log(playerOriCmds);

            var len = Object.keys(playerCmds).length;
            if(len >=2){
              var msg = "Commands are completed for this round...";
              socket.emit('notice',msg);
              var msg = "Results for this round ...";
              io.emit('notice',msg);
              var round_res = thisRound(playerCmds,playerOriCmds);
              // define the variable for the array index
              var i = 0; //for single
              var j = 0; //for move
              var k = 0; //for supermove

              // define the delayed loop function
              function showSingleRes1()
              {
                if(++i >= 7)
                { 
                  showMoveRes1();
                  //reset for next round
                return;
                }
              // do action

              // var msg = round_res.single1[i-1];
              // io.emit('notice',msg);

              //apply single damage
              //user1 under attack
              if(round_res.single1[i-1] < 0){
                var getDmg = damage(round_res.user2,round_res.user1,'s');
                userPokemons[round_res.user1].hitpoints -= getDmg.damage;
                var msg = getDmg.message;
                if(userPokemons[round_res.user1].hitpoints < 0){
                  userPokemons[round_res.user1].hitpoints = 0;
                }
              }
              //user2 under attack
              if(round_res.single2[i-1] < 0){
                var getDmg = damage(round_res.user1,round_res.user2,'s');
                userPokemons[round_res.user2].hitpoints -= getDmg.damage;
                var msg = getDmg.message;
                if(userPokemons[round_res.user2].hitpoints < 0){
                  userPokemons[round_res.user2].hitpoints = 0;
                }
              }
              var user1 = round_res.user1;
              var user2 = round_res.user2;
              var res = {
                user1:{
                  username:nicknames[user1],
                  index:i,
                  pokemon:userPokemons[user1],
                  status:round_res.single1[i-1],
                  current:playerCmds[round_res.user1][i-1]
                },
                user2:{
                  username:nicknames[user2],
                  index:i,
                  pokemon:userPokemons[user2],
                  status:round_res.single2[i-1],
                  current:playerCmds[round_res.user2][i-1]
                }
              }
              console.dir(res);
              io.emit("single_res",res);
              
              // recursively call the delayed loop function with a delay
              setTimeout(showSingleRes1, 1000);
              }

              function showMoveRes1(){
                if(++j >= round_res.move1.length+1){
                  showSupermoveRes1();
                  return;
                }
                var msg = "move res:" + round_res.move1[j-1];
                io.emit('notice',msg);
                setTimeout(showMoveRes1, 1000);
              }

              function showSupermoveRes1(){
                if(++k >= round_res.supermove1.length+1){
                  return;
                }
                var msg = "supermove res:" + round_res.supermove1[k-1];
                io.emit('notice',msg);
                setTimeout(showSupermoveRes1, 1000);
              }

              showSingleRes1(); // start the loop

            }else if(len == 1){
              var msg = "Waiting for opponent's commands ...";
              socket.emit('notice',msg);
            }

          }
        }

        break;
      case '?':
        //answer questions about rsp
        var msg = "<b>Helper:</b> <p>r-rock, s-scissors, p-paper.</p><p>You should input a length-6 sequence after '@'.</p><p>For example, @rsrrpp </p><p>If your move command is 'rs' and your supermove command is 'rsp', you can input '@12s' which equals '@rsrsps'.</p><p>You can also input '@1ss1' which equals '@rsssrs'.</p>";
        socket.emit('notice',msg);
        break;
      default: //normal chat
        var title = nicknames[socket.id];
        var msg = msg;
        socket.broadcast.emit('chat message',{
          title:title,
          msg:msg,
          color:userColors[socket.id],
          img:userImgs[socket.id]
        });
        break;
      }//end switch  	
  });

  socket.on('inputing',function(name){
  	var msg = name + ' is typing ...';
  	socket.broadcast.emit('user inputing',msg);
  });

  socket.on('check online',function(){
  	var list = '';
  	for(key in nicknames){
  		list += nicknames[key]+' ';
  	}
  	socket.emit('online',{list:list,nums:Object.keys(nicknames).length});
  })
});

http.listen(3000, function(){
  console.log('listening on port:3000');
});