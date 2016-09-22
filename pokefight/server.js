var express = require('express');
var app = express();
// var bodyParser = require('body-parser');
// app.use(bodyParser.json());
var http = require('http').Server(app);
var io = require('socket.io')(http);

var client = require('socket.io-client');
var AI = client.connect("http://localhost:3000");
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
var vs = {}; //contains all battle rooms!!!
var userStatus = {}; //record user status

//initialize commands object
// var playerCmds = {};
// var playerOriCmds = {};

// var isAI = false;

//utility functions
function roomAnounce(roomid,msg,type){
  var room = vs[roomid];
  for(var i = 0; i < room.players.length; i++){
    var player = room.players[i];
    io.to(player).emit(type,msg);
  }
}

function battleOn(user1,user2){
  var pokemon1 = userPokemons[user1];
  var pokemon2 = userPokemons[user2];
  if (pokemon1.hitpoints > 0 && pokemon2.hitpoints > 0){
    return true;
  }else{
    return false;
  }
}

function battleWinner(user1,user2){
  var pokemon1 = userPokemons[user1];
  var pokemon2 = userPokemons[user2];
  if(pokemon1.hitpoints > 0){
    return user1;
  }else{
    return user2;
  }
}
function displayHP(user){
  var index = userPokemons[user].key;
  var original_hp = pokemons[index].hitpoints;
  var total_units = Math.floor(original_hp / 5);
  var current_hp = userPokemons[user].hitpoints;
  var current_units = Math.floor(current_hp / 5);
  //begin draw
  var res = "";
  res += '<b><span class = "red">';
  for(var i = 0; i < total_units; i++){
    if(i < current_units){
      res += '|';
    }else if(i === current_units){
      res += '</span>';
    }else{
      res += '|';
    }
  }
  res += '</b>';
  return res;
}

function displayMP(user){
  var index = userPokemons[user].key;
  var total_units = 20;
  var current_mp = userPokemons[user].mp;
  var current_units = Math.floor(current_mp / 5);
  //begin draw
  var res = "";
  res += '<b><span class = "skyblue">';
  for(var i = 0; i < total_units; i++){
    if(i < current_units){
      res += '|';
    }else if(i === current_units){
      res += '</span>';
    }else{
      res += '|';
    }
  }
  res += '</b>';
  return res;
}


function calcDamage(source,target,type){
  var dmg = 0;
  var res = 0;
  var msg = "";
  var fact = 1;
  var att_type = userPokemons[source].type;
  var def_type = userPokemons[target].type;
  var att = userPokemons[source].attack;
  var def = userPokemons[target].defense;

  switch(type){
    case '1':
      //original damage
      console.log('normal move!')
      dmg = userPokemons[source].moves.damage;
      //mp gain
      if(userPokemons[source].mp + userPokemons[source].moves.energyInc > 100){
        userPokemons[source].mp = 100;
      }else{
        //modify energy increase by *3
        userPokemons[source].mp += userPokemons[source].moves.energyInc * 3;
      }
      if(poketypes[att_type][def_type] !== undefined){
        fact *= poketypes[att_type][def_type];
        if(poketypes[att_type][def_type] < 1){
          msg = "not effective";
        }else{
          msg = "very effective";
        }
      }
      res = Math.floor(dmg * fact * att/(att + def));
      break;
    case '2':
      console.log('supermove!')
      if(userPokemons[source].supermoves.energyCost * 100 > userPokemons[source].mp){
        res = 0;
        msg = "not enough MP to release the supermove!";
      }else{
        userPokemons[source].mp -= userPokemons[source].supermoves.energyCost * 100;
        dmg = userPokemons[source].supermoves.damage;
        if(poketypes[att_type][def_type] !== undefined){
          fact *= poketypes[att_type][def_type];
          if(poketypes[att_type][def_type] < 1){
            msg = "not effective";
          }else{
            msg = "very effective";
          }
        }
        var rand = Math.random();
        if(rand < userPokemons[source].supermoves.criticalRatio){
          fact *= 2;
          msg = "critical";
        }
        
        res = Math.floor(dmg * fact * att/(att + def));
      }
      break;
    default:
      console.log('single move!')
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

  // console.log('single1',single1);
  // console.log('single2',single2);

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
  // console.log('move1',move1);

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
  // console.log('supermove1',supermove1);

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
  // console.log('move2',move2);

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
  // console.log('supermove2',supermove2);

  // console.log('move_index1',move_index1);
  // console.log('supermove_index1',supermove_index1);

  var res = {
    'user1':user1,
    'user2':user2,
    'single1':single1,
    'single2':single2,
    'move1':move1,
    'move2':move2,
    'cmd1':cmd1,
    'cmd2':cmd2,
    'supermove1':supermove1,
    'supermove2':supermove2
  };
  console.dir(res);
  return res;

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

    //find user's room
    if(userStatus[socket.id] !== undefined){
      if(userStatus[socket.id].status == 'home'){ //user is room owner
        var room = vs[userStatus[socket.id].roomId];
        if(room.status == 'waiting'){ //room only contains one player
          delete vs[userStatus[socket.id].roomId];; //just delete this room
        }else if(room.status == 'full'){ //room contains two players
          var playerIndex = room.players.indexOf(socket.id);
          room.players.splice(playerIndex,1); //delete user from playerlist
          if(room.players[0] == AI.id){
            delete vs[userStatus[socket.id].roomId];
          }else{
            room.status = 'waiting';
            room.ownner = room.players[0]; //transfer ownnership to another user
            userStatus[room.ownner] = Object.assign(userStatus[room.ownner],{status:'home'}); //change home ownner's userStatus
          }
        }        
      }else if(userStatus[socket.id].status == 'guest'){ //user is room guest
        var room = vs[userStatus[socket.id].roomId];
        //this room must have 2 players! otherwise the user status is 'home'
        var playerIndex = room.players.indexOf(socket.id);
        room.players.splice(playerIndex,1);
        room.status = 'waiting';
      }
      delete room.playerCmds[socket.id];
      delete room.playerOriCmds[socket.id]; //delete user commands
      delete room.pokemons[socket.id]; //delete room's pokemon
    }

    delete userStatus[socket.id]; //final step, delete his status

    console.dir(userStatus);
  	
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
    var notice = "<p>Welcome to pokemon fight game!</p><p>Enter <b>#</b> to select a pokemon.</p><p>Enter <b>?</b> to view the battle instructions.</p><p>Enter <b>~</b> to view your pokemon infomation at any time.</p><p>Enter <b>+</b> to add AI.</p><p>Enter <b>-</b> to remove AI and reset game.</p><p>Have fun!</p>";
    socket.emit('notice',notice);

  });

  socket.on('evolution',function(){
    if(userPokemons[socket.id] != undefined){
      var key = parseInt(userPokemons[socket.id].key);
      if(userPokemons[socket.id].evolveTo != undefined){
        var newKey = (key+1).toString();
        var data = pokemons[newKey];
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
                                  {key:newKey},
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
      }else{
        var error = 'no evolution available';
        socket.emit('notice',error);
      }
    }
  });
  
  socket.on('confirm',function(){
    //first, try to join other available rooms
    
    if(userStatus[socket.id] == undefined){
      for(var room in vs){
        if(vs[room].status == 'waiting'){
          vs[room].players.push(socket.id); //push user to playerList
          vs[room].status = 'full';
          userStatus[socket.id] = {
                                    status:"guest",
                                    roomId:vs[room].id
                                  };
          vs[room].pokemons[socket.id] = userPokemons[socket.id];
    
          break;
        }
      }
    }
    //otherwise, create new room
    if(userStatus[socket.id] == undefined){
      var players = [];
      players.push(socket.id);
      var playerCmds = {};
      var playerOriCmds = {};
      var pokemons = {};
      pokemons[socket.id] = userPokemons[socket.id];
      vs[socket.id] = {
        id: socket.id,
        players: players,
        status: 'waiting',
        ownner: socket.id,
        playerCmds: playerCmds,
        playerOriCmds: playerOriCmds,
        isAI: false,
        pokemons: pokemons
      };
      userStatus[socket.id] = {
                                status:"home",
                                roomId:socket.id
                              };
      var msg = "System Message: Searching for the opponent ...";
      socket.emit('notice',msg);
    }else{
      var room = vs[userStatus[socket.id].roomId];
      //send msg to 2 users in this room
      for(var i = 0; i < room.players.length; i++){
        var player = room.players[i];
        var msg = "System Message: Battle Begins!";
        io.to(player).emit('notice',msg);
        io.to(player).emit('begin',room.pokemons);
        var msg = "Please enter your battle commands ...(enter ? to see instructions)";
        io.to(player).emit('notice',msg);
      }
    }


    console.dir(userStatus);
  });
  

  socket.on('chat message', function(msg){
    var op = msg.slice(0,1);
    switch(op){
      case '#': // pokemon info
        if(userStatus[socket.id] != undefined){
          var msg = 'You cannot change your pokemon after confirmation. To reset, enter <b>-</b>';
          socket.emit('notice',msg);
          break;
        }
        //random index for pokemon
        var post = msg.slice(1);
        var randomIndex = Math.floor(Math.random()*151)+1;
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
      case '@':
        if(!userPokemons[socket.id]){ //undefined
          var msg = "System Message: You should input '#' first to choose a pokemon!";
          socket.emit('notice',msg);
        }else{ //else##
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
          }else{ //big big program starts here!
            if(userStatus[socket.id] == undefined){ //user has not confirm(ready to battle)
              var error = 'You must confirm a pokemon selection first!';
              socket.emit('notice',error);
            }else{ //first, find user's room
              var room = vs[userStatus[socket.id].roomId];
              var roomid = room.id;
              var msg = "Your command is "+str;
              socket.emit('notice',msg);
              room.playerCmds[socket.id] = str;
              room.playerOriCmds[socket.id] = commands;

              // just leave AI alone...
              if(room.isAI && userPokemons[AI.id] != undefined){
                var AI_Oricommands = "";
                var AI_commands = "";
                if(userPokemons[AI.id].mp >= userPokemons[AI.id].supermoves.energyCost){
                  AI_Oricommands = '22';
                  AI_commands = userPokemons[AI.id].supermove_command + userPokemons[AI.id].supermove_command;
                }else{
                  var rand1 = Math.floor(Math.random()*4);
                  
                  var rsp = ['r','s','p'];
                  switch(rand1){
                    case 0:
                      var rand2 = Math.floor(Math.random()*3);
                      var rand3 = Math.floor(Math.random()*3);
                      var c1 = rsp[rand2];
                      var c2 = rsp[rand3];
                      AI_Oricommands = c1 +'1'+c2+'1';
                      AI_commands = c1 + userPokemons[AI.id].move_command + c2 + userPokemons[AI.id].move_command;
                    break;
                    case 1:
                      var rand2 = Math.floor(Math.random()*3);
                      var rand3 = Math.floor(Math.random()*3);
                      var c1 = rsp[rand2];
                      var c2 = rsp[rand3];
                      AI_Oricommands = c1 + c2 +'11';
                      AI_commands = c1 + c2 + userPokemons[AI.id].move_command + userPokemons[AI.id].move_command;
                      break;
                    case 2:
                      var rand2 = Math.floor(Math.random()*3);
                      var rand3 = Math.floor(Math.random()*3);
                      var c1 = rsp[rand2];
                      var c2 = rsp[rand3];
                      AI_Oricommands = '1'+c1 + c2 +'1';
                      AI_commands = userPokemons[AI.id].move_command + c1 + c2 + userPokemons[AI.id].move_command;
                      break;
                    case 3:
                      var rand2 = Math.floor(Math.random()*3);
                      var rand3 = Math.floor(Math.random()*3);
                      var c1 = rsp[rand2];
                      var c2 = rsp[rand3];
                      AI_Oricommands = '11' + c1 + c2;
                      AI_commands = userPokemons[AI.id].move_command + userPokemons[AI.id].move_command + c1 + c2;
                      break;
                    default:
                      AI_Oricommands = '111';
                      AI_commands = userPokemons[AI.id].move_command + userPokemons[AI.id].move_command + userPokemons[AI.id].move_command;
                      break;
                  }//end switch
                }
                console.log('user',socket.id);
                console.log('ai',AI.id);
                room.playerCmds[AI.id] = AI_commands;
                room.playerOriCmds[AI.id] = AI_Oricommands;
                var msg = 'AI has entered his commands...';
                socket.emit('notice',msg);
                

              }//AI


              var len = Object.keys(room.playerCmds).length;
              if(len >= 2){
                var msg = "Commands are completed for this round...";
                socket.emit('notice',msg);
                var msg = "Results for this round ...";
                roomAnounce(roomid,msg,'notice');
                var round_res = thisRound(room.playerCmds,room.playerOriCmds); //important variable!
                // define the variable for the array index
                var i = 0; //for single
                var j1 = 0,j2 = 0; //for move
                var k1 = 0,k2 = 0;//for supermove

                showSingleRes(); // start by calling first delayed function

                // define the delayed loop function
              function showSingleRes()
              {
                if(++i >= 7)
                { 
                  showMoveRes1();
                  //reset for next round
                return;
                }
              // do action

              //apply single damage
              //user1 under attack
              var msg = ""; //initialize a message
              if(round_res.single1[i-1] < 0){
                var getDmg = calcDamage(round_res.user2,round_res.user1,'s');
                userPokemons[round_res.user1].hitpoints -= getDmg.damage;
                msg = getDmg.message;
                if(userPokemons[round_res.user1].hitpoints < 0){
                  userPokemons[round_res.user1].hitpoints = 0;
                }
              }
              //user2 under attack
              if(round_res.single2[i-1] < 0){
                var getDmg = calcDamage(round_res.user1,round_res.user2,'s');
                userPokemons[round_res.user2].hitpoints -= getDmg.damage;
                msg = getDmg.message;
                if(userPokemons[round_res.user2].hitpoints < 0){
                  userPokemons[round_res.user2].hitpoints = 0;
                }
              }
              var user1 = round_res.user1;
              var user2 = round_res.user2;
              var res = {
                user1:{
                  username:userPokemons[user1].username,
                  index:i,
                  hp:displayHP(user1),
                  mp:displayMP(user1),
                  message:msg,
                  pokemon:userPokemons[user1],
                  status:round_res.single1[i-1],
                  current:round_res.cmd1[i-1]
                },
                user2:{
                  username:userPokemons[user2].username,
                  index:i,
                  hp:displayHP(user2),
                  mp:displayMP(user2),
                  message:msg,
                  pokemon:userPokemons[user2],
                  status:round_res.single2[i-1],
                  current:round_res.cmd2[i-1]
                }
              }
              roomAnounce(roomid,res,'single_res');
              // io.emit("single_res",res);
              
              // recursively call the delayed loop function with a delay
              setTimeout(showSingleRes, 1000);
              }

              function showMoveRes1(){
                if(++j1 >= round_res.move1.length+1){
                  showMoveRes2();
                  return;
                }
                // var msg = "move res:" + round_res.move1[j-1];
                // io.emit('notice',msg);
                var user1 = round_res.user1;
                var user2 = round_res.user2;
                var damage = 0;
                //user1 move success
                var msg = ""; //initialize a message
                if(round_res.move1[j1-1]){
                  var getDmg = calcDamage(user1,user2,'1');
                  damage = getDmg.damage;
                  userPokemons[user2].hitpoints -= damage;
                  msg = getDmg.message;
                  if(userPokemons[user2].hitpoints < 0){
                    userPokemons[user2].hitpoints = 0;
                  }
                }
                
                var res = {
                  user1:{
                    hp:displayHP(user1),
                    mp:displayMP(user1),
                    username:userPokemons[user1].username,
                    attacker:true,
                    damage:damage,
                    message:msg,
                    pokemon:userPokemons[user1],
                    status:round_res.move1[j1-1],
                  },
                  user2:{
                    hp:displayHP(user2),
                    mp:displayMP(user2),
                    attacker:false,
                    username:userPokemons[user2].username,
                    pokemon:userPokemons[user2],
                  }
                }
                // console.log('move1');
                // console.dir(res);
                // io.emit("move1_res",res);
                roomAnounce(roomid,res,'move1_res');

                setTimeout(showMoveRes1, 1000);
              }

              function showMoveRes2(){
                if(++j2 >= round_res.move2.length+1){
                  showSupermoveRes1(); //next show user1 supermove
                  return;
                }
                // var msg = "move res:" + round_res.move1[j2-1];
                // io.emit('notice',msg);
                var user1 = round_res.user1;
                var user2 = round_res.user2;
                var damage = 0;
                //user2 move success
                var msg = ""; //initialize a message
                if(round_res.move2[j2-1]){
                  var getDmg = calcDamage(user2,user1,'1');
                  damage = getDmg.damage;
                  userPokemons[user1].hitpoints -= damage;
                  msg = getDmg.message;
                  if(userPokemons[user1].hitpoints < 0){
                    userPokemons[user1].hitpoints = 0;
                  }
                }
                
                var res = {
                  user1:{
                    hp:displayHP(user1),
                    mp:displayMP(user1),
                    attacker:false,
                    username:userPokemons[user1].username,
                    pokemon:userPokemons[user1],
                  },
                  user2:{
                    hp:displayHP(user2),
                    mp:displayMP(user2),
                    attacker:true,
                    damage:damage,
                    username:userPokemons[user2].username,
                    message:msg,
                    pokemon:userPokemons[user2],
                    status:round_res.move2[j2-1],
                  }
                }
                // console.log('move2');
                // console.dir(res);
                // io.emit("move2_res",res);
                roomAnounce(roomid,res,'move2_res');
                setTimeout(showMoveRes2, 1000);
              }

              function showSupermoveRes1(){
                if(++k1 >= round_res.supermove1.length+1){
                  if(!battleOn(round_res.user1,round_res.user2)){
                    var winner = battleWinner(round_res.user1,round_res.user2);
                    var notice = "<span class = 'glyphicon glyphicon-queen gold'></span> Battle ends! The winner is <b>"+userPokemons[winner].username+'</b>';
                    roomAnounce(roomid,notice,'notice');
                    
                    var notice = "Enter # to prepare for another battle!";
                    roomAnounce(roomid,notice,'notice');
                    for(var i = 0; i < room.players.length; i++){
                      var player = room.players[i];
                      delete userPokemons[player];
                      delete userStatus[player];
                    }
                    delete vs[room.id];
                  }else{
                    showSupermoveRes2(); //next show user2 supermove
                  }
                  
                  return;
                }
                // var msg = "supermove res:" + round_res.supermove1[k1-1];
                // io.emit('notice',msg);
                var user1 = round_res.user1;
                var user2 = round_res.user2;
                var damage = 0;
                //user1 supermove success
                var msg = ""; //initialize a message
                if(round_res.supermove1[k1-1]){
                  var getDmg = calcDamage(user1,user2,'2');
                  damage = getDmg.damage;
                  userPokemons[user2].hitpoints -= damage;
                  msg = getDmg.message;
                  if(userPokemons[user2].hitpoints < 0){
                    userPokemons[user2].hitpoints = 0;
                  }
                }
                
                var res = {
                  user1:{
                    hp:displayHP(user1),
                    mp:displayMP(user1),
                    attacker:true,
                    damage:damage,
                    username:userPokemons[user1].username,
                    message:msg,
                    pokemon:userPokemons[user1],
                    status:round_res.supermove1[k1-1],
                  },
                  user2:{
                    hp:displayHP(user2),
                    mp:displayMP(user2),
                    attacker:false,
                    username:userPokemons[user2].username,
                    pokemon:userPokemons[user2],
                  }
                }
                roomAnounce(roomid,res,'supermove1_res');
                setTimeout(showSupermoveRes1, 1000);
              }

              function showSupermoveRes2(){
                if(++k2 >= round_res.supermove2.length+1){
                  //end of all moves result. clear battle buffer
                  if(battleOn(round_res.user1,round_res.user2)){
                    room.playerCmds = {};
                    room.playerOriCmds = {};
                    var notice = "please enter your battle command: ";
                    roomAnounce(roomid,notice,'notice');
                  }else{
                    var winner = battleWinner(round_res.user1,round_res.user2);
                    var notice = "<span class = 'glyphicon glyphicon-queen gold'></span> Battle ends! The winner is <b>"+userPokemons[winner].username+'</b>';
                    roomAnounce(roomid,notice,'notice');
                    for(var i = 0; i < room.players.length; i++){
                      var player = room.players[i];
                      delete userPokemons[player];
                      delete userStatus[player];
                    }
                    var notice = "Enter # to prepare for another battle!";
                    roomAnounce(roomid,notice,'notice');
                    delete vs[roomid];
                  }
                  
                  return;
                }
                // var msg = "supermove res:" + round_res.supermove1[k2-1];
                // io.emit('notice',msg);
                var user1 = round_res.user1;
                var user2 = round_res.user2;
                var damage = 0;
                //user2 move success
                var msg = ""; //initialize a message
                if(round_res.supermove2[k2-1]){
                  var getDmg = calcDamage(user2,user1,'2');
                  damage = getDmg.damage;
                  userPokemons[user1].hitpoints -= damage;
                  msg = getDmg.message;
                  if(userPokemons[user1].hitpoints < 0){
                    userPokemons[user1].hitpoints = 0;
                  }
                }
                
                var res = {
                  user1:{
                    hp:displayHP(user1),
                    mp:displayMP(user1),
                    attacker:false,
                    username:userPokemons[user1].username,
                    pokemon:userPokemons[user1],
                  },
                  user2:{
                    hp:displayHP(user2),
                    mp:displayMP(user2),
                    attacker:true,
                    damage:damage,
                    username:userPokemons[user2].username,
                    message:msg,
                    pokemon:userPokemons[user2],
                    status:round_res.supermove2[k2-1],
                  }
                }
                roomAnounce(roomid,res,'supermove2_res');
                // io.emit("supermove2_res",res);
                setTimeout(showSupermoveRes2, 1000);
              }

              }else if(len == 1){
                var msg = "Waiting for opponent's commands ...";
                socket.emit('notice',msg);
              }
            } //everything should be inside this {}

          }
        } //end of else ##

        break;
      case '?':
        //answer questions about rsp
        var msg = "<p><b>Battle Helper:</b></p><p>r-rock, s-scissors, p-paper.</p><p>You should input a length-6 sequence after '@'.</p><p>For example, @rsrrpp </p><p>If your move command is 'rs' and your supermove command is 'rsp', you can input '@12s' which equals '@rsrsps'.</p><p>You can also input '@1ss1' which equals '@rsssrs'.</p><p>You can enter <b>~</b> to view your pokemon infomation at any times.</p><p>You can enter <b>-</b> to reset game at any time.</p>";
        socket.emit('notice',msg);
        break;
      case '~':
        if(userPokemons[socket.id] != undefined){
          var res = userPokemons[socket.id]
          socket.emit('info',res);
        }else{
          var notice = 'You have not selected a pokemon yet! To do that,enter #';
          socket.emit('notice',notice);
        }
        break;
      case '+':
        if(userStatus[socket.id] == undefined){
          var msg = 'You must confirm you pokemon first to enable an AI.';
          socket.emit('notice',msg);
          break;
        }
        var room = vs[userStatus[socket.id].roomId];
        if(room.status === 'full'){
          var msg = 'Fail to enable an AI. Your room is full.';
          socket.emit('notice',msg);
          break;
        }
        room.isAI = true;
        var notice = 'System Message: AI is added to the battle.';
        socket.emit('notice',notice);
        // AI join battle
        var AI_candidates = [3,6,9,31,34,59,62,65,68,71,76,94,103,107,110,112,123,127,128,130,131,141,143,144,145,146,149,150,151];
        var index = Math.floor(Math.random()*AI_candidates.length);
        var data = pokemons[AI_candidates[index]];
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
                                {key:AI_candidates[index]},
                                {username:'*AI*'},
                                {moves:data.moves[rand1]},
                                {supermoves:data.supermoves[rand2]},
                                {move_command:move_command},
                                {supermove_command:supermove_command}
                                );
        //set AI pokemon
        userPokemons[AI.id] = res;

        room.players.push(AI.id); //push user to playerList
        room.status = 'full';
        // userStatus[AI.id] = {
        //                       status:"guest",
        //                       roomId:room.id
        //                     };
        room.pokemons[AI.id] = userPokemons[AI.id];

        var msg = "System Message: Battle Begins!";
        socket.emit('notice',msg);
        socket.emit('begin',room.pokemons);
        var msg = "Please enter your battle commands ...(enter ? to see instructions)";
        socket.emit('notice',msg);

        break;
      case '-':
        if(userStatus[socket.id] != undefined){
          if(userStatus[socket.id].status == 'home'){ //user is room owner
            var room = vs[userStatus[socket.id].roomId];
            if(room.status == 'waiting'){ //room only contains one player
              delete vs[userStatus[socket.id].roomId];; //just delete this room
            }else if(room.status == 'full'){ //room contains two players
              var playerIndex = room.players.indexOf(socket.id);
              room.players.splice(playerIndex,1); //delete user from playerlist
              //if another player is AI, just delete this room
              if(room.players[0] == AI.id){
                delete vs[userStatus[socket.id].roomId];
              }else{
                room.status = 'waiting';
                room.ownner = room.players[0]; //transfer ownnership to another user
                userStatus[room.ownner] = Object.assign(userStatus[room.ownner],{status:'home'}); //change home ownner's userStatus
              }
            }
            
          }else if(userStatus[socket.id].status == 'guest'){ //user is room guest
            var room = vs[userStatus[socket.id].roomId];
            //this room must have 2 players! otherwise the user status is 'home'
            var playerIndex = room.players.indexOf(socket.id);
            room.players.splice(playerIndex,1);
            room.status = 'waiting';
          }
          delete room.playerCmds[socket.id];
          delete room.playerOriCmds[socket.id]; //delete user commands
          delete room.pokemons[socket.id]; //delete room's pokemon
        }
        delete userStatus[socket.id];

        var notice = 'Your game status is reset. You can enter enter <b>#</b> to choose another pokemon.';
        socket.emit('notice',notice);

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