$('#hide').hide();
var nickname = prompt('Enter your name: ');
var userImg = "";
var currentPokemon; //store information of candidate
// if (nickname == "xinyang" || nickname == 'zxy' || nickname == '阳哥'){
//   userImg = "img/xiaozhi.gif";
// }else{
//   userImg = "img/joan.jpg";
// }
userImg = "img/xiaozhi.gif";

var socket = io();

function scrollToBottom () {
    window.scrollTo(0,document.body.scrollHeight);
};

function evolve(){
  socket.emit('evolution');
}

function confirm(){
  socket.emit('confirm');
}

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
                                        +'<span class = "hp">HP</span> '+res.hitpoints.toString()+' <span class = "att">ATT</span> '+res.attack.toString() + ' <span class = "def">DEF</span> '+res.defense.toString() +'</div>'));
  $('#messages').append($('<li>').html('<b>Move:</b> '+res.moves.name+ ' | <b>Damage:</b> '+res.moves.damage + ' | <b>Power Gain:</b> '+res.moves.energyInc + ' | <b>Command:</b> '+res.move_command));
  $('#messages').append($('<li>').html('<b>Supermove:</b> '+res.supermoves.name+ ' | <b>Damage:</b> '+res.supermoves.damage + ' | <b>Power Cost:</b> '+res.supermoves.energyCost * 100 + ' | <b>Command:</b> '+res.supermove_command));
  $('#messages').append($('<li>').html("<button class = 'evolution' onclick = 'evolve()'>evolve</button><button class = 'confirm' onclick = 'confirm()'>confirm</button>"));
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
  $('#messages').append($('<li>').html('<div class = "dleft skyblue">my info</div>'+'<div class = "dright maroon"> opponent info</div>'));
  $('#messages').append($('<li>').html('<div class = "msg"><img src = '+selfPokemonImg+'></br><b>'
                                        +self.name+'</b></br><span class = '+self.type+'>'+self.type+'</span></br>'
                                        +'<span class = "hp">HP</span> '+self.hitpoints.toString()+' <span class = "att">ATT</span> '+self.attack.toString() + ' <span class = "def">DEF</span> '+self.defense.toString() +'</div>'

                                        +'<div class = "msg dright"><img src = '+opponentPokemonImg+'></br><b>'
                                        +opponent.name+'</b></br><span class = '+opponent.type+'>'+opponent.type+'</span></br>'
                                        +'<span class = "hp">HP</span> '+opponent.hitpoints.toString()+' <span class = "att">ATT</span> '+opponent.attack.toString() + ' <span class = "def">DEF</span> '+opponent.defense.toString() +'</div>'
                                        ));
  
  scrollToBottom();
});

socket.on('single_res',function(res){
  var self;
  var opponent;
  var selfPokemonImg = "";
  var opponentPokemonImg = "";
  var selfCurrentImg = "";
  var opponentCurrentImg = "";
  var statusArr  =['<span class = "gray">Lost</span>','<span class = "green">Draw</span>','<span class = "orange">Win</span>'];
  for(var key in res){
    if(res[key].username == nickname){
      self = res[key];
      selfPokemonImg = 'animation/'+res[key].pokemon.key + '.gif';
      selfCurrentImg = 'img/'+res[key].current + '.png';
    }else{
      opponent = res[key];
      opponentPokemonImg = 'animation/'+res[key].pokemon.key + '.gif';
      opponentCurrentImg = 'img/'+res[key].current+'.png';
    }
  }
  $('#messages').append($('<li>').html('#'+self.index));
  $('#messages').append($('<li>').html('<div class = "msg"><img src = '+selfPokemonImg+'><img class = "smaller" src = '+selfCurrentImg+'></br>'
                                          +'<div class = "dleft"><span class = "green glyphicon glyphicon-heart"></span> '+self.hp +'</div></br>'
                                          +'<div class = "dleft"><span class = "purple glyphicon glyphicon-fire"></span> '+self.mp +'</div></div>'

                                          +'<div class = "msg dright"><img class = "smaller" src = '+opponentCurrentImg+'><img src = '+opponentPokemonImg+'></br>'
                                          +'<div class = "dright">'+opponent.hp +' <span class = "green glyphicon glyphicon-heart"></span></div></br>'
                                          +'<div class = "dright">'+opponent.mp +' <span class = "purple glyphicon glyphicon-fire"></span></div></div>'
                                          ));
  scrollToBottom();

});

socket.on('move1_res',function(res){
  var self;
  var opponent;
  var selfPokemonImg = "";
  var opponentPokemonImg = "";
  var attacker = {};
  for(var key in res){
    if(res[key].username == nickname){
      self = res[key];
      selfPokemonImg = 'img/pokemons/'+res[key].pokemon.key + '.png';
    }else{
      opponent = res[key];
      opponentPokemonImg = 'img/pokemons/'+res[key].pokemon.key + '.png';
    }

    //determine attacker
    if(res[key].attacker === true){
      attacker = res[key];
    }
  }
  if(attacker.damage > 0){
    $('#messages').append($('<li>').html('<b>'+attacker.pokemon.name +'</b> releases <b>'+attacker.pokemon.moves.name+'</b>, causes <span class ="red"><b>'+attacker.damage +'</b></span> damage.'));
    $('#messages').append($('<li>').html('<div class = "msg"><img src = '+selfPokemonImg+'></br>'
                                          +'<div class = "dleft"><span class = "green glyphicon glyphicon-heart"></span> '+self.hp +'</div></br>'
                                          +'<div class = "dleft"><span class = "purple glyphicon glyphicon-fire"></span> '+self.mp +'</div></div>'

                                          +'<div class = "msg dright"><img src = '+opponentPokemonImg+'></br>'
                                          +'<div class = "dright">'+opponent.hp +' <span class = "green glyphicon glyphicon-heart"></span></div></br>'
                                          +'<div class = "dright">'+opponent.mp +' <span class = "purple glyphicon glyphicon-fire"></span></div></div>'
                                          ));
    scrollToBottom();
  }
  
  
});

socket.on('move2_res',function(res){
  var self;
  var opponent;
  var selfPokemonImg = "";
  var opponentPokemonImg = "";
  var attacker = {};
  for(var key in res){
    if(res[key].username == nickname){
      self = res[key];
      selfPokemonImg = 'img/pokemons/'+res[key].pokemon.key + '.png';
    }else{
      opponent = res[key];
      opponentPokemonImg = 'img/pokemons/'+res[key].pokemon.key + '.png';
    }

    //determine attacker
    if(res[key].attacker === true){
      attacker = res[key];
    }
  }

  if(attacker.damage > 0){
    $('#messages').append($('<li>').html('<b>'+attacker.pokemon.name +'</b> releases <b>'+attacker.pokemon.moves.name+'</b>, causes <span class ="red"><b>'+attacker.damage +'</b></span> damage.'));
    $('#messages').append($('<li>').html('<div class = "msg"><img src = '+selfPokemonImg+'></br>'
                                          +'<div class = "dleft"><span class = "green glyphicon glyphicon-heart"></span> '+self.hp +'</div></br>'
                                          +'<div class = "dleft"><span class = "purple glyphicon glyphicon-fire"></span> '+self.mp +'</div></div>'

                                          +'<div class = "msg dright"><img src = '+opponentPokemonImg+'></br>'
                                          +'<div class = "dright">'+opponent.hp +' <span class = "green glyphicon glyphicon-heart"></span></div></br>'
                                          +'<div class = "dright">'+opponent.mp +' <span class = "purple glyphicon glyphicon-fire"></span></div></div>'
                                          ));
    scrollToBottom();
  }
  
  
});

socket.on('supermove1_res',function(res){
  var self;
  var opponent;
  var selfPokemonImg = "";
  var opponentPokemonImg = "";
  var attacker = {};
  for(var key in res){
    if(res[key].username == nickname){
      self = res[key];
      selfPokemonImg = 'img/pokemons/'+res[key].pokemon.key + '.png';
    }else{
      opponent = res[key];
      opponentPokemonImg = 'img/pokemons/'+res[key].pokemon.key + '.png';
    }

    //determine attacker
    if(res[key].attacker === true){
      attacker = res[key];
    }
  }

  if(attacker.damage > 0){
    $('#messages').append($('<li>').html('<b>'+attacker.pokemon.name +'</b> releases <b>'+attacker.pokemon.supermoves.name+'</b>, causes <span class ="red"><b>'+attacker.damage +'</b></span> damage. <span class = "green">'+attacker.message+'</span>'));
    $('#messages').append($('<li>').html('<div class = "msg"><img src = '+selfPokemonImg+'></br>'
                                          +'<div class = "dleft"><span class = "green glyphicon glyphicon-heart"></span> '+self.hp +'</div></br>'
                                          +'<div class = "dleft"><span class = "purple glyphicon glyphicon-fire"></span> '+self.mp +'</div></div>'

                                          +'<div class = "msg dright"><img src = '+opponentPokemonImg+'></br>'
                                          +'<div class = "dright">'+opponent.hp +' <span class = "green glyphicon glyphicon-heart"></span></div></br>'
                                          +'<div class = "dright">'+opponent.mp +' <span class = "purple glyphicon glyphicon-fire"></span></div></div>'
                                          ));
    scrollToBottom();
  }
});

socket.on('supermove2_res',function(res){
  var self;
  var opponent;
  var selfPokemonImg = "";
  var opponentPokemonImg = "";
  var attacker = {};
  for(var key in res){
    if(res[key].username == nickname){
      self = res[key];
      selfPokemonImg = 'img/pokemons/'+res[key].pokemon.key + '.png';
    }else{
      opponent = res[key];
      opponentPokemonImg = 'img/pokemons/'+res[key].pokemon.key + '.png';
    }

    //determine attacker
    if(res[key].attacker === true){
      attacker = res[key];
    }
  }

  if(attacker.damage > 0){
    $('#messages').append($('<li>').html('<b>'+attacker.pokemon.name +'</b> releases <b>'+attacker.pokemon.supermoves.name+'</b>, causes <span class ="red"><b>'+attacker.damage +'</b></span> damage. <span class = "green">'+attacker.message+'</span>'));
    $('#messages').append($('<li>').html('<div class = "msg"><img src = '+selfPokemonImg+'></br>'
                                          +'<div class = "dleft"><span class = "green glyphicon glyphicon-heart"></span> '+self.hp +'</div></br>'
                                          +'<div class = "dleft"><span class = "purple glyphicon glyphicon-fire"></span> '+self.mp +'</div></div>'

                                          +'<div class = "msg dright"><img src = '+opponentPokemonImg+'></br>'
                                          +'<div class = "dright">'+opponent.hp +' <span class = "green glyphicon glyphicon-heart"></span></div></br>'
                                          +'<div class = "dright">'+opponent.mp +' <span class = "purple glyphicon glyphicon-fire"></span></div></div>'
                                          ));
    scrollToBottom();
  }
});



