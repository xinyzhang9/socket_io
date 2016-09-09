$('#hide').hide();
var nickname = prompt('Enter your name: ');
var userImg = "";
if (nickname == "xinyang" || nickname == 'zxy'){
  userImg = "img/gengar.png";
}else{
  userImg = "img/joan.jpg";
}

var socket = io();

function scrollToBottom () {
    window.scrollTo(0,document.body.scrollHeight);
};

socket.emit('enter room',{name: nickname,img:userImg});
$('form').submit(function(){
  var msg = $('#m').val();
  socket.emit('chat message', msg);
  $('#messages').append($('<li class = "right">').html('<div class ="msg"><img src = '+userImg + '></br>'+nickname+'</div>' + '&nbsp;' + '<div class = "msg" >' +msg +'</div>'));
  $('#m').val('');
  return false;
});

$('#m').keydown(function(){
  socket.emit('inputing',nickname);
});
$('#check_online').click(function(){
  socket.emit('check online',nickname);
  $('#check_online').hide();
  $('#hide').show();
});
$('#hide').click(function(){
  $('#online').html('');
  $('#hide').hide();
  $('#check_online').show();
});
socket.on('chat message',function(data){
  $('#status').html('&nbsp;');
  $('#messages').append($('<li class = '+data.color +'>').html('<div class = "msg"><img src ='+ data.img+'></br>'+data.title+'</div>' + '&nbsp;' + '<div class = "msg">'+data.msg+'</div>'));
  scrollToBottom();
});
socket.on('enter room',function(msg){
   $('#status').html('&nbsp;');
   $('#messages').append($('<li class = "green">').text(msg));
})
socket.on('left room',function(msg){
   $('#status').html('&nbsp;');
   $('#messages').append($('<li class = "red">').text(msg));
})
socket.on('user inputing',function(msg){
  $('#status').html(msg);
})
socket.on('online',function(data){
  $('#online').html('online users('+data.nums+'): '+data.list);
})
socket.on('error',function(err){
   $('#status').text(err);
})
socket.on('info',function(data){
  $('#status').html('&nbsp;');
  $('#messages').append($('<li>').html('name: '+data.name));
  $('#messages').append($('<li>').html('type: '+data.type));
  $('#messages').append($('<li>').html('att: '+data.attack.toString()));
  $('#messages').append($('<li>').html('def: '+data.defense.toString()));
  scrollToBottom();
})