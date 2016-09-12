# socket_io
This repo contains my projects using socket.io with node.js.  
Check the official website http://socket.io/ for more info.  

## chat room
This is a interative chatroom for multiple users. Based on the basic functions implemented in the tutorial, I also added some advanced features.
### how to use
clone or download the repo "chat"
```
cd [folder that contains 'chat']
npm install
node server.js
```
open your browser at localhost:3000   
### basic
- [x] Set up a node server to enble chat between users.
- [x] Use socket.io APIs to fire and respond to events.

### features
- [x] Broadcast a message to connected users when someone connects or disconnects
- [x] Add support for nicknames
- [x] Add support for user avatars
- [x] Add support for user colors
- [x] Don’t send the same message to the user that sent it himself. Instead, append the message directly as soon as he presses enter.
- [x] Add “{user} is typing” functionality
- [x] Show who’s online
- [ ] Add private messaging

### screenshots
![alt tag](https://raw.githubusercontent.com/xinyzhang9/socket_io/master/chat/cy.png)

## poke fight
This is the advanced pratice of socket.io. I plan to make a pvp and pve interative games featuring pokemons.
### basic
- [x] user chat channel
- [x] generate random pokemon candidate
- [x] before-battle preparation  

### To do list
- [ ] add hitpoints to each pokemon
- [ ] hitpoint/energy display
- [ ] add types to each moves and supermoves
- [ ] design game engine of rock-scissor-paper
- [ ] design UI of battle field
- [ ] animations and effects  

### screenshots
![alt tag](https://raw.githubusercontent.com/xinyzhang9/socket_io/master/pokefight/poke_fight.png)
