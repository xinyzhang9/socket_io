var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendfile('index.html');
});

var nicknames = {};

io.on('connection', function(socket){
  socket.on('disconnect',function(){
  	var msg = ''
  	if((nicknames[socket.id])){
  		msg = nicknames[socket.id] + ' left the chat.';
  	}else{
  		msg = 'Someone left the chat.';
  	}
  	
  	io.emit('left room',msg)
  })
  socket.on('chat message', function(msg){
    io.emit('chat message',msg);
  });
  socket.on('enter room',function(name){
  	nicknames[socket.id] = name;
  	var msg = '';
  	if(name){
  		msg = name + ' has joined the chat.';
  	}else{
  		msg = "Someone has joined the chat."
  	}	
  	io.emit('enter room',msg)
  })
});

http.listen(3000, function(){
  console.log('listening on port:3000');
});