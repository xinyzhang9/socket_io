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
  	
  	io.emit('left room',msg)
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
    //check pokemon
    if(msg.startsWith('#')){
      //random index for pokemon
      var post = msg.slice(1);
      var randomIndex = Math.floor(Math.random()*151+1);
      var index = (0 <= parseInt(post) && parseInt(post) <= 151)? post : randomIndex.toString();
      var data = pokemons[index];
      if(data === null){
        var error = "error: no results found.";
        socket.emit('error',error);
      }else{
        var len1 = data.moves.length;
        var len2 = data.supermoves.length;
        var rand1 = Math.floor(Math.random()*len1);
        var rand2 = Math.floor(Math.random()*len2);
        var res = Object.assign({},
                                data,
                                {key:index},
                                {username:nicknames[socket.id]},
                                {usercolor:userColors[socket.id]},
                                {moves:data.moves[rand1]},
                                {supermoves:data.supermoves[rand2]}
                                );
        console.log(res);
        socket.emit('info',res);
      }
    //normal talk
    }else{
      var title = nicknames[socket.id];
      var msg = msg;
      socket.broadcast.emit('chat message',{
        title:title,
        msg:msg,
        color:userColors[socket.id],
        img:userImgs[socket.id]
      });
    }
  	
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