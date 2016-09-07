var app = require('express')();
var http = require('http').Server(app);

app.get('/',function(req,res){
	res.sendFile(__dirname + '/index.html');
});

http.listen(8888,function(){
	console.log('listening on port:8888');
});