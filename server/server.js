var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var cors = require('cors');

var players_OLD = {};
var players = [];
/*
var star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50
};
var scores = {
  blue: 0,
  red: 0
};*/
var zombieData = [];
var pairId = 0;
var pairs = [];
var iconGroups = [];
var restartCount = 0;


app.use(express.static(__dirname + '/public'));
app.use(cors());

/*
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});*/

// Function to generate random number
function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}


io.on('connection', function (socket) {
  console.log('a user connected: ', socket.id);
  //send the id
  socket.emit('socketID',socket.id);
  // create a new player and add it to our players object
  /*
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
    team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
  };*/
  //Tried as array of players
  /*
  if(players.length == 0) {
  	players.push([{playerId:socket.id, playerNo:1}]);
  } else {
  	if(players[players.length-1].length < 2) {
  		players[players.length-1].push({playerId:socket.id, playerNo:2});
  	} else {
  		players.push([{playerId:socket.id, playerNo:1}]);
  	}
  }*/
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
  console.log(players);
  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // send the star object to the new player
  // send the current scores
  //socket.emit('scoreUpdate', scores);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // when a player disconnects, remove them from our players object
  socket.on('disconnect', function () {
    console.log('user disconnected: ', socket.id);
    players = players.filter(p => p.playerId != socket.id);
    //delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);
  });

  // when players are paired, notify the players it is ready
  socket.on('player2Ready', function (player) {
  	console.log("paired");

  	var pair = [];
  	//pair.push(players.filter(p => p.playerId == player.otherPlayer)[0]);
  	//pair.push(player);
  	var otherPlayer = players.filter(p => p.playerId === player.player.otherPlayer)[0];
  	pair.push(player.player);
  	pair.push(otherPlayer);
  	//Assign a pair ID
  	player.player.pairId = pairId;
  	otherPlayer.pairId = pairId;
  	//Add to the pair array and then send the signal to the client that the pair is ready
  	pairs.push({'pairId':pairId,'playerId':player.player.playerId,'playerScore':0,'playerLives':3,'otherId':otherPlayer.playerId,'otherScore':0,'otherLives':3,'level':1,'moving':false});
  	pairId++;
  	io.to(player.player.playerId).emit('pair',pair);
  	io.to(otherPlayer.playerId).emit('pair',pair);
  	//io.to(player.player.playerId).emit('pair',player.player);
  	//io.to(otherPlayer.playerId).emit('pair',otherPlayer);
    //socket.broadcast.emit('pair', pair);
  });

  // when a player moves, update the player data
  /*
  socket.on('playerMovement', function (movementData) {
  	console.log("playermoved");
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });*/

    // when a player moves, update the player data
  socket.on('movement', function (movementData) {
  	//console.log(movementData);
  	//Get zombie position to send as well
  	var zombies = zombieData.filter(z => z.pairId == movementData.pairId);
    if(zombies.length == 0) {
      var zombs = [];
    } else {
      var zombs = zombies[0].zombies;
    }
    //Get the icons to send
    var iconGr = iconGroups.filter(ig => ig.pairId == movementData.pairId);
    //Get the scores
    var pair = pairs.filter(p => p.pairId == movementData.pairId)[0];
    //console.log(movementData);
    //console.log(pairs);
    if(pair.playerId == movementData.id) {
      p2Score = players.filter(p => p.playerId == movementData.id)[0].score;
      p1Score = players.filter(p => p.playerId == movementData.otherId)[0].score;
    } else {
      p1Score = players.filter(p => p.playerId == movementData.id)[0].score;
      p2Score = players.filter(p => p.playerId == movementData.otherId)[0].score;
    }

    var pair = pairs.filter(p => p.pairId == movementData.pairId);
    console.log(pair);
    //var me = movementData.id;
    //var o = movementData.otherId;
    if(pair[0].moving) {
  	   io.to(movementData.otherId).emit('opponentmove',movementData,zombs,iconGr,{'p1':p1Score,'p2':p2Score});
  	   io.to(movementData.id).emit('opponentmove',movementData,zombs,iconGr,{'p1':p1Score,'p2':p2Score});
    }
  });

  //Initialize zombie positions
  socket.on('zombiestart', function (zombies,pairId) {
  	console.log("zombieStart");
  	zombieData.push(zombies);
    //Start movement
    var pair = pairs.filter(p => p.pairId == pairId)[0];
    //console.log(pairs);
    pair.moving = true;
    //Regularly update ZombieMovement


  	//var playerInPair = pairs.filter(p => p.pairId == zombies.pairId)[0];
  	//console.log(playerInPair.playerId);
  	/*
  	setInterval(function() {
  		//console.log(zombieData);
  		for(var i=0;i<zombieData.length;i++) {
  			console.log(zombieData[i]);
  			var zombieList = zombieData[i].zombies
  			if(zombieData[i].pairId == playerInPair.pairId) {
  				//console.log(playerInPair.playerId);
  				for(var j=0;j<zombieList.length;i++) {
  					//socket.broadcast.emit('zombieRequestTiles', players[socket.id]);
  					socket.to(playerInPair.playerId).emit('zombieRequestTiles',zombieList);
  				}
  			}
  		}
  		//console.log("timer triggered");
  	}, 500);
  	*/
  });

  socket.on('sendicons', function(icons) {
    console.log("iconssent");
    console.log(icons);
  	iconGroups.push(icons);
  });

  socket.on('collected', function(pairId,playerId,icon) {
  	//Update score
  	var iconGr = iconGroups.filter(ig => ig.pairId == pairId)[0];
    //console.log(iconGr);
  	var icon = iconGr.icons[icon];
  	var pair = pairs.filter(p => p.pairId == pairId)[0];
    var player = players.filter(p => p.playerId == playerId)[0];
    player.score = icon.points;
    /*
  	if(pair.id == playerId) {
  		pair.playerScore += icon.points;
  	} else {
      pair.otherScore += icon.points;
    }*/
    icon.collected = true;
    //If the icon is the last one then the level is over

  });

  socket.on('newLevel', function(playerId,pairId) {
    console.log('A New Level is Ready to start');
    console.log(restartCount);
    restartCount++;
    var player = players.filter(p => p.playerId == playerId)[0];
    //stop moving
    var pair = pairs.filter(p => p.pairId == pairId)[0];
    pair.moving = false;
    //console.log(zombieData);
    //remove Zombie data for pair
    zombieData = zombieData.filter(z => z.pairId != pairId);
    //zombieData.pop(pairId);
    //console.log("zombie data now");
    //console.log(zombieData);
    //console.log(pair);
    console.log(player);
    //Signal pair to client
    var pair = [];
    var otherPlayer = players.filter(p => p.playerId === player.otherPlayer)[0];
    console.log(player.playerId)
    console.log(player.playerNo);
    console.log(otherPlayer.playerNo);
    player.pairId = pairId;
    otherPlayer.pairId = pairId;
    pair.push(player);
    pair.push(otherPlayer);
    io.to(playerId).emit('pair',pair);
    //io.to(otherPlayer.playerId).emit('pair',pair);
  });

});

server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});





function getAdjacentTiles(x,y,map) {
	adjacentTiles = [];
	//console.log("zombie " + x + " " + y);
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

setInterval(function() {
    //console.log(zombieData);
    for(var i=0;i<zombieData.length;i++) {
      var zombies = zombieData[i].zombies
      for(var j=0;j<zombies.length;j++) {
        //console.log(zombies);
        //console.log("adj");
        var tiles = getAdjacentTiles(zombies[j].x,zombies[j].y,zombieData[i].map);
        //console.log(tiles);
        moveZombie(tiles,zombies[j]);
      }
    }
    //console.log("timer triggered");
}, 500);
