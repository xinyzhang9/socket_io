var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendfile('index.html');
});

var nicknames = {};
var userColors = {};

var djb2Code = function(str){
	var hash = 5381;
	for(var i = 0; i < str.length; i++){
		var charCode = str[i].charCodeAt(0)
		hash = ((hash << 5) + hash) + charCode;
	}
	return hash;
}

var colors = ['black','orange','blue','steelblue','skyblue','purple','pink','gray','darkgreen','lightgreen'];
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
  	
  	io.emit('left room',msg)
  });
  socket.on('enter room',function(name){
  	//set user nickname
  	nicknames[socket.id] = name;
  	//set user color
  	userColors[socket.id] = getUserColor(socket.id);
  	var msg = '';
  	if(name){
  		msg = "----- " + name + ' has joined the chat -----';
  	}else{
  		msg = "----- Someone has joined the chat -----"
  	}	
  	io.emit('enter room',msg)
  });

  socket.on('chat message', function(msg){
  	var str = nicknames[socket.id] +" says: " + msg
    socket.broadcast.emit('chat message',{msg:str,color:userColors[socket.id]});
  });
});

http.listen(3000, function(){
  console.log('listening on port:3000');
});