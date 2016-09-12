$('#hide').hide();
var nickname = prompt('Enter your name: ');
var userImg = "";
var currentPokemon; //store information of candidate
if (nickname == "xinyang" || nickname == 'zxy' || nickname == '阳哥'){
  userImg = "img/xiaozhi.gif";
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
  scrollToBottom();
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
   scrollToBottom();
});
socket.on('left room',function(msg){
   $('#status').html('&nbsp;');
   $('#messages').append($('<li class = "red">').text(msg));
   scrollToBottom();
});
socket.on('user inputing',function(msg){
  $('#status').html(msg);
});
socket.on('online',function(data){
  $('#online').html('online users('+data.nums+'): '+data.list);
});
socket.on('notice',function(err){
   $('#status').html('&nbsp;');
   $('#messages').append($('<li class = "red">').html(err));
   scrollToBottom();
});
socket.on('info',function(res){
  // currentPokemon = Object.assign({},res);
  $('#status').html('A pokemon is ready.');
  var imgSrc = 'img/pokemons/'+res.key+'.png';
  $('#messages').append($('<li class ='+res.usercolor+'>').html('pokemon for '+res.username));
  $('#messages').append($('<li>').html('<div class = "msg"><img src = '+imgSrc+'></br><b>'
                                        +res.name+'</b></br><span class = '+res.type+'>'+res.type+'</span></br>'
                                        +'ATT: '+res.attack.toString() + ' | ' + 'DEF: '+res.defense.toString() +'</div>'));
  $('#messages').append($('<li>').html('<b>Move:</b> '+res.moves.name+ ' | <b>Damage:</b> '+res.moves.damage + ' | <b>Power Gain:</b> '+res.moves.energyInc + ' | <b>Command:</b> '+res.move_command));
  $('#messages').append($('<li>').html('<b>Supermove:</b> '+res.supermoves.name+ ' | <b>Damage:</b> '+res.supermoves.damage + ' | <b>Power Cost:</b> '+res.supermoves.energyCost * 100 + ' | <b>Command:</b> '+res.supermove_command));
  $('#messages').append($('<li class = "green">').text("input ! to choose this pokemon."));
  $('#messages').append($('<li class = "green">').text("input # to continue switching pokemons."));
  scrollToBottom();
});

  
socket.on('begin',function(res){
  var self;
  var opponent;
  var selfPokemonImg = "";
  var opponentPokemonImg = "";
  for(var key in res){
    if(res[key].username == nickname){
      self = res[key];
      selfPokemonImg = 'img/pokemons/'+res[key].key + '.png';
    }else{
      opponent = res[key];
      opponentPokemonImg = 'img/pokemons/'+res[key].key + '.png';
    }
  }
  $('#messages').append($('<li>').html('<div class = "dleft skyblue">my info</div>'+'<div class = "dright red"> opponent info</div>'));
  $('#messages').append($('<li>').html('<div class = "msg"><img src = '+selfPokemonImg+'></br><b>'
                                        +self.name+'</b></br><span class = '+self.type+'>'+self.type+'</span></br>'
                                        +'ATT: '+self.attack.toString() + ' | ' + 'DEF: '+self.defense.toString() +'</div>'

                                        +'<div class = "msg dright"><img src = '+opponentPokemonImg+'></br><b>'
                                        +opponent.name+'</b></br><span class = '+opponent.type+'>'+opponent.type+'</span></br>'
                                        +'ATT: '+opponent.attack.toString() + ' | ' + 'DEF: '+opponent.defense.toString() +'</div>'
                                        ));
  
  scrollToBottom();
})


