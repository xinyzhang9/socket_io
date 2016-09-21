# pokemon fighting game
This is the round based fighting game realized via socket.io. User can have a pvp or pve battle via the pokemons. The game engine is the game theory of rock-scissor-paper. The pokemon can release supermoves if its moves are not overtaken by the opponents for certain rounds.  
## basic features
- [x] user chat channel
- [x] generate random pokemon candidates
- [x] design game engine of rock-scissor-paper 
- [x] player vs player battle 
- [x] add necessary game instructions

## advanced features
- [x] hitpoint/energy display
- [x] optimized move/supermove judgement
- [x] damage and magic consumption calculation
- [x] optimized UI for battle field
- [x] animations and effects
- [x] design an AI for battle

## get it run locally
```
clone or download this repo
cd [path to this repo]
npm install
node server.js
open your browser at localhost:3000
```
## game instructions
#### All commands should be entered via the message box .  
'?': view battle instructions  
'#': select a pokemon randomly  
'!': confirm pokemon selection  
'~': view your pokemon information at any time  
'+': add AI to the battle  
'-': remove AI and reset the battle

#### battle commands
'r' for rock, 's' for scissors, 'p' for paper.  
You should input a length-6 sequence after '@'.  
For example, @rsrrpp  
If your move command is 'rs' and your supermove command is 'rsp', you can input '@12s' which equals '@rsrsps'.  
You can also input '@1ss1' which equals '@rsssrs'.  


## screenshots
#### ready scene
![alt tag](https://raw.githubusercontent.com/xinyzhang9/socket_io/master/pokefight/poke_fight.png)
#### play with AI
![alt tag](https://raw.githubusercontent.com/xinyzhang9/socket_io/master/pokefight/ai.png)
