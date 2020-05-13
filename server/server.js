var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var cors = require('cors');

var players_OLD = {};
var players = []
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


app.use(express.static(__dirname + '/public'));
app.use(cors());

/*
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});*/

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
  	players.push({playerId:socket.id, playerNo:1, otherPlayer:null});
  } else {
  	if(players[players.length-1].otherPlayer === null) {
  		players[players.length-1].otherPlayer = socket.id;
  		players.push({playerId:socket.id, playerNo:2, otherPlayer:players[players.length-1].playerId});
  	} else {
  		players.push({playerId:socket.id, playerNo:1, otherPlayer:null});
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
  	io.to(movementData.otherId).emit('opponentmove',movementData);
  });
  
  //Initialize zombie positions
  socket.on('zombiestart', function (zombies) {
  	console.log("zombieStart");
  	zombieData = zombies;
  	setInterval(function() {
  		zombieData.forEach(z => function() {
  			console.log(z);
  		});
  		console.log("timer triggered");
  	}, 500);
  });  	

  
});

server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});
