var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var cors = require('cors');

var players_OLD = {};
var players = [];
var zombieData = [];
var pairId = 0;
var pairs = [];
var iconGroups = [];
var restartCount = 0;
var port = process.env.PORT || 443;

app.use(express.static(__dirname + '/public'));
app.use(cors());


app.get('/', (req, res) => {
  res.send('<h1>I am running</h1>');
});


// Function to generate random number
function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

io.on('connection', function (socket) {
  //send the id
  socket.emit('socketID',socket.id);
  // create a new player and add it to our players object
  if(players.length == 0) {
  	players.push({playerId:socket.id, playerNo:1, otherPlayer:null,score:0,lives:3});
  } else {
  	if(players[players.length-1].otherPlayer === null) {
  		players[players.length-1].otherPlayer = socket.id;
  		players.push({playerId:socket.id, playerNo:2, otherPlayer:players[players.length-1].playerId,score:0,lives:3});
  	} else {
  		players.push({playerId:socket.id, playerNo:1, otherPlayer:null,score:0,lives:3});
  	}
  }
  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // send the star object to the new player
  // send the current scores
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // when a player disconnects, remove them from our players object
  socket.on('disconnect', function () {
    //get pair
    var player = players.filter(p => p.playerId == socket.id)[0];
    var otherPlayer = players.filter(p => p.playerId == player.otherPlayer)[0];;
    var pair = pairs.filter(p => p.pairId == player.pairId);
    if(pair.length > 0) {
      if(!pair[0].gameOver) {
        //Signal that he other player has gone
        //Need to send scores
        io.to(player.otherPlayer).emit('otherPlayerDisconnected',player,otherPlayer.score);
      }
      var pairId = pair[0].pairId;
      //Cleanup
      iconGroups = iconGroups.filter(gr => gr.pairId != pairId);
      pairs = pairs.filter(p => p.pairId != pairId);
      zombieData = zombieData.filter(z => z.pairId != pairId);
    }
    //remove player
    players = players.filter(p => p.playerId != socket.id);
    //delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);
  });

  // when players are paired, notify the players it is ready
  socket.on('player2Ready', function (player) {
    var player = players.filter(p => p.playerId === player.player.playerId)[0];
  	var pair = [];
  	var otherPlayer = players.filter(p => p.playerId === player.otherPlayer)[0];
  	//Assign a pair ID
  	player.pairId = pairId;
  	otherPlayer.pairId = pairId;
    pair.push(player);
    pair.push(otherPlayer);
  	//Add to the pair array and then send the signal to the client that the pair is ready
  	pairs.push({'pairId':pairId,'playerId':player.playerId,'playerScore':0,'playerLives':3,'otherId':otherPlayer.playerId,'otherScore':0,'otherLives':3,'level':1,'moving':false});
  	pairId++;
  	io.to(player.playerId).emit('pair',pair);
  	io.to(otherPlayer.playerId).emit('pair',pair);
  });


    // when a player moves, update the player data
  socket.on('movement', function (movementData) {
  	//Get zombie position to send as well
    var pair = pairs.filter(p => p.pairId == movementData.pairId);
    if(pair.length > 0) {
      pair = pair[0];
    	var zombies = zombieData.filter(z => z.pairId == movementData.pairId);
      if(zombies.length == 0) {
        var zombs = [];
      } else {
        var zombs = zombies[0].zombies;
      }
      //Get the icons to send
      var iconGr = iconGroups.filter(ig => ig.pairId == movementData.pairId);
      //Get the scores

      if(pair.playerId == movementData.id) {
        p2 = players.filter(p => p.playerId == movementData.id)[0];
        p1 = players.filter(p => p.playerId == movementData.otherId)[0];
      } else {
        p1 = players.filter(p => p.playerId == movementData.id)[0];
        p2 = players.filter(p => p.playerId == movementData.otherId)[0];
      }

      var pair = pairs.filter(p => p.pairId == movementData.pairId);
      if(pair[0].moving) {
    	   io.to(movementData.otherId).emit('opponentmove',movementData,zombs,iconGr,{'p1':p1.score,'p2':p2.score},{'p1':p1.lives,'p2':p2.lives});
    	   io.to(movementData.id).emit('opponentmove',movementData,zombs,iconGr,{'p1':p1.score,'p2':p2.score},{'p1':p1.lives,'p2':p2.lives});
      }
    }
  });

  //Initialize zombie positions
  socket.on('zombiestart', function (zombies,pairId) {
  	zombieData.push(zombies);
    //Start movement
    var pair = pairs.filter(p => p.pairId == pairId)[0];
    pair.moving = true;
  });

  socket.on('sendicons', function(icons) {
  	iconGroups.push(icons);
  });

  socket.on('collected', function(pairId,playerId,icon) {
  	//Update score
  	var iconGr = iconGroups.filter(ig => ig.pairId == pairId)[0];
  	var icon = iconGr.icons[icon];
  	var pair = pairs.filter(p => p.pairId == pairId)[0];
    var player = players.filter(p => p.playerId == playerId)[0];
    player.score = icon.points;
    icon.collected = true;
    icon.player = player.playerId;
    //If the icon is the last one then the level is over

  });

  socket.on('newLevel', function(playerId,pairId) {
    var player = players.filter(p => p.playerId == playerId)[0];
    //Signal pair to client
    var pair = [];
    var otherPlayer = players.filter(p => p.playerId === player.otherPlayer)[0];
    player.pairId = pairId;
    otherPlayer.pairId = pairId;
    pair.push(player);
    pair.push(otherPlayer);
    io.to(playerId).emit('pair',pair);
    //io.to(otherPlayer.playerId).emit('pair',pair);
  });

  socket.on('levelEnd', function(playerId,pairId) {
    //stop moving
    var pair = pairs.filter(p => p.pairId == pairId)[0];
    pair.moving = false;
    var player = players.filter(p => p.playerId == playerId)[0];
    if(player.playerNo == 1) {
      //remove Zombie data for pair
      zombieData = zombieData.filter(z => z.pairId != pairId);
      //remove icon data for pair
      iconGroups = iconGroups.filter(ig => ig.pairId != pairId);
    }
    io.to(playerId).emit('restartLevel');
  });


  socket.on('playerDied', function(playerId,pairId) {
    console.log("Player Died");
    //stop moving
    var pair = pairs.filter(p => p.pairId == pairId)[0];
    var player = players.filter(p => p.playerId == playerId)[0];
    player.lives--;
    io.to(pair.playerId).emit('playerDeath',player);
    io.to(pair.otherId).emit('playerDeath',player);
  });


  socket.on('playerLivesGone', function(playerId,pairId) {
    console.log("Player Game Over");
    //stop moving
    var pair = pairs.filter(p => p.pairId == pairId)[0];
    var player = players.filter(p => p.playerId == playerId)[0];
    var otherScore = players.filter(p => p.playerId == player.otherPlayer)[0].score;
    player.lives--;
    io.to(pair.playerId).emit('playerGameOver',player,otherScore);
    io.to(pair.otherId).emit('playerGameOver',player,otherScore);
    //Might be needed later
    pair.gameOver = true;
    pair.moving = false;
  });

  //Here I need to capture the request to move a zombie
  socket.on('movezombie', function() {
    console.log(zombieData);
    for(var i=0;i<zombieData.length;i++) {
      var zombies = zombieData[i].zombies
      for(var j=0;j<zombies.length;j++) {
        var tiles = getAdjacentTiles(zombies[j].x,zombies[j].y,zombieData[i].map);
        moveZombie(tiles,zombies[j]);
      }
    }
  });

});

server.listen(port, function(){
  console.log('listening on *:' + port);
});

function getAdjacentTiles(x,y,map) {
	adjacentTiles = [];
	for(var i=0;i<map.length;i++) {
		//Filter each column
		var left = map[i].filter(col => col.x-32 == x && col.y == y);
		var right = map[i].filter(col => col.x+32 == x && col.y == y);
		var up = map[i].filter(col => col.x == x && col.y-32 == y);
		var down = map[i].filter(col => col.x == x && col.y+32 == y);
		if(left.length > 0) {
			adjacentTiles.push(left[0]);
		}
		if (right.length > 0) {
			adjacentTiles.push(right[0]);
		}
		if (up.length > 0) {
			adjacentTiles.push(up[0]);
		}
		if (down.length > 0) {
			adjacentTiles.push(down[0]);
		}
	}
	//Return the tiles the zombie can move to
	return adjacentTiles.filter(t => t.idx == -1);
}


function moveZombie(tiles,zombie) {
	spaces = tiles.filter(t => !zombie.visited.includes(t) );
	if(spaces.length > 0){
      var nextMoveIdx = randomNumber(0,spaces.length);
      zombie.visited.push(spaces[nextMoveIdx]);
      zombie.x = spaces[nextMoveIdx].x;
      zombie.y = spaces[nextMoveIdx].y;
    } else {
      //clear the visted path
      zombie.visited = [];
    }
}

/*
setInterval(function() {
    //console.log(zombieData);
    for(var i=0;i<zombieData.length;i++) {
      var zombies = zombieData[i].zombies
      for(var j=0;j<zombies.length;j++) {
        var tiles = getAdjacentTiles(zombies[j].x,zombies[j].y,zombieData[i].map);
        moveZombie(tiles,zombies[j]);
      }
    }
}, 500);*/
