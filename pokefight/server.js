var express = require('express');
var app = express();
// var bodyParser = require('body-parser');
// app.use(bodyParser.json());
var http = require('http').Server(app);
var io = require('socket.io')(http);


var path = require('path');
app.use(express.static(path.join(__dirname,'./client')));

var pokemons = require('./pokemons.json');

app.get('/', function(req, res){
  res.sendfile('index.html');
});

var nicknames = {};
var userImgs = {}
var userColors = {};
var userPokemons = {};
var vs = {}; //1 vs 1

var djb2Code = function(str){
	var hash = 5381;
	for(var i = 0; i < str.length; i++){
		var charCode = str[i].charCodeAt(0)
		hash = ((hash << 5) + hash) + charCode;
	}
	return hash;
}

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
          }
        }
               
        break;
      case '@':
        //handle rsp

        break;
      case '?':
        //answer questions about rsp
        var msg = "<b>Helper:</b> <p>r-rock, s-scissors, p-paper.</p><p>You should input a length-6 sequence after '@'.</p><p>For example, @rsrrpp </p><p>If your move command is 'rs' and your supermove command is 'rsp', you can input '@12s' which equals '@rsrsps'.</p><p>You can also input '@1ss1' which equals '@rsssrs'.</p>";
        socket.emit('notice',msg);
        break;
      default:
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