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

## pokemon fighting game
This is the round based fighting game realized via socket.io. User can have a pvp or pve battle via the pokemons. The game engine is the game theory of rock-scissor-paper. The pokemon can release supermoves if its moves are not overtaken by the opponents for certain rounds.  
### basic features
- [x] normal chat/notice channel
- [x] generate random pokemon candidates
- [x] design game engine of rock-scissor-paper 
- [x] player vs player battle 
- [x] automatic opponent searching

### advanced features
- [x] private chat/notice channel
- [x] optimized hitpoints/energy display
- [x] optimized move/supermove judgement
- [x] reasonable damage/energy calculation
- [x] optimized UI for battle field
- [x] battle room management
- [x] design an AI for battle (not fully tested yet)
- [x] add evolution option

### get it run locally
```
clone or download this repo
cd [path to this repo]
npm install
node server.js
open your browser at localhost:3000
```
### game instructions
#### All commands should be entered via the message box .  
'?': view battle instructions  
'#': select a pokemon randomly  
'~': view your pokemon information at any time  
'+': add AI to the battle  
'-': reset your game status

#### battle commands
'r' for rock, 's' for scissors, 'p' for paper.  
You should input a length-6 sequence after '@'.  
For example, @rsrrpp  
If your move command is 'rs' and your supermove command is 'rsp', you can input '@12s' which equals '@rsrsps'.  
You can also input '@1ss1' which equals '@rsssrs'.  


### screenshots
#### ready scene
![alt tag](https://raw.githubusercontent.com/xinyzhang9/socket_io/master/pokefight/ready.png)
#### play with AI
![alt tag](https://raw.githubusercontent.com/xinyzhang9/socket_io/master/pokefight/ai.png)




