import Phaser from "phaser";
import {randomNumber} from './include.js';
//import 'socket.io-client' from '/socket.io/socket.io.js';
import io from 'socket.io-client';

export default new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function Multiplayer() {
        Phaser.Scene.call(this, { key: 'Multiplayer' , active: true  })
    },

    preload: function () {
        // map made with Tiled in JSON format
        this.load.tilemapTiledJSON('map1', 'assets/level1.json');
        this.load.tilemapTiledJSON('map2', 'assets/level2.json');
        this.load.tilemapTiledJSON('map3', 'assets/level2.json');
        // tiles in spritesheet
        this.load.spritesheet('tilemap', 'assets/tilemap.png', {frameWidth: 32, frameHeight: 32});
        //this.load.spritesheet('icons', 'assets/icons.png', {frameWidth: 32, frameHeight: 32});
        // player animations
        this.load.atlas('player', 'assets/player.png', 'assets/player.json');
        //Load icons
        this.load.image('beans', 'assets/icons/beans.png');
        this.load.image('toiletroll', 'assets/icons/toiletroll.png');
        this.load.image('sanitizer', 'assets/icons/sanitizer.png');
        this.load.image('rice', 'assets/icons/rice.png');
        this.load.image('pop', 'assets/icons/pop.png');
        this.load.image('bread', 'assets/icons/bread.png');
    },

   create: function() {
     this.socket = io();
     this.socket = io.connect('http://localhost:8081');
     //this.playerNo = 0;
     console.log(this.socket);
     //this.scene.pause();
     //var socketId = this.socket['id'];
     //console.log(this.socket._callbacks);
     var socket_ID;
     var playerNo = 0;

     this.socket.on('socketID', function (socketID) {
       //alert(socketID);
       console.log(socketID);
       socket_ID= socketID;
     });

     this.socket.on('currentPlayers', function (players) {
       //When players is an array
       /*
       for(var i=0;i<players.length;i++) {
         var player = players[i].filter(p => p.playerId === socket_ID);
         if(playerNo == 0) {
           //console.log("Here");
           if(player.length > 0) {
             console.log("Found Player");
             console.log(player);
             if(players[i].length > 1) {
               playerNo = player[0].playerNo;
               alert("I am player " + playerNo);
             }
           }
         }
       }*/
        //lert(socket_ID);
        var player = players.filter(p => p.playerId === socket_ID)[0];
        console.log("Player");
        console.log(player);
        if(player.playerNo == 2) {
          //alert("I am player 2");
          this.emit('player2Ready', { player });
        }
        /*
        Object.keys(players).forEach(function (id) {
          console.log(players[id].playerId);
          console.log(socket_ID);
          if (players[id].playerId === socket_ID) {
            if(players[id].player)
          }
        });*/
      });

      var paired = false;

      this.socket.on('pair', function (pair) {
        if(!paired) {
            var me = pair.filter(p => p.playerId == socket_ID);
            console.log(me);
            if(me.length > 0) {
              paired = true;
              alert(me[0]);
            }
        }
      });

      //this.socket.emit('playerMovement', { x: 28, y: 92, rotation: 44 });
      this.level = this.registry.values.level;
      console.log(this.level);
      //console.log(this.registry);
      this.score = this.registry.values.score;
      this.gameMessage = "";
      this.levelComplete = false;
      this.playingDeathSeq = false;

      // load the map
      this.map = this.make.tilemap({key: 'map' + this.level});

      // tiles for the ground layer
      var levelTiles = this.map.addTilesetImage('tilemap');
      //var iconTiles = this.map.addTilesetImage('icons');

      //world layer
      this.floor = this.map.createDynamicLayer('floor', levelTiles, 0, 0);
      // create the shelves layer
      this.shelves = this.map.createDynamicLayer('walls', levelTiles, 0, 0);
      // the player will collide with this layer
      this.shelves.setCollisionByExclusion([-1]);



      // set the boundaries of our game world
      this.physics.world.bounds.width = this.map.widthInPixels;
      this.physics.world.bounds.height = this.map.heightInPixels;

      // create the player sprite
      var playerLayer = this.map.getObjectLayer('player')['objects'];
      //this.player = this.physics.add.sprite(playerLayer[0].x+16, playerLayer[0].y-16, 'player',0);
      //TESTING
      //this.player = this.physics.add.sprite(560, 216, 'player',0);
      this.player = this.physics.add.sprite(752, 128, 'player',0);
      this.player.setCollideWorldBounds(true); // don't go out of the map
      this.player.body.setAllowGravity(false);
      this.player.dead = false;

      // small fix to our player images, we resize the physics body object slightly
      this.player.body.setSize(this.player.width-8, this.player.height-8 );

      // player animations
      this.anims.create({
          key: 'walk',
          frames: this.anims.generateFrameNames('player', {prefix: 'man ',suffix: '.aseprite', start: 0, end: 11}),
          frameRate: 10,
          repeat: -1
      });
      this.anims.create({
          key: 'reverse',
          frames: this.anims.generateFrameNames('player', {prefix: 'man ',suffix: '.aseprite', start: 12, end: 23}),
          frameRate: 10,
          repeat: -1
      });
      this.anims.create({
          key: 'idle',
          frames: this.anims.generateFrameNames('player', {prefix: 'man ',suffix: '.aseprite', start: 11, end: 11}),
          frameRate: 10,
          repeat: -1
      });
      this.anims.create({
          key: 'death',
          frames: this.anims.generateFrameNames('player', {prefix: 'man ',suffix: '.aseprite', start: 48, end: 56}),
          frameRate: 10,
          repeat: 0
      });

      //this.iconLayer = this.map.createDynamicLayer('icons', iconTiles, 0, 0);
      //this.icons = this.map.createFromObjects('icons', 'iconsprites', { key: 'icon' });

      //console.log(this.icons);
      var icons = this.map.getObjectLayer('icons')['objects'];
      this.icongroup = this.physics.add.group();
      //Define order of collection
      this.iconOrder = {
        'pop' : {'order':1,'points':500},
        'beans' : {'order':2,'points':1000},
        'bread' : {'order':3,'points':1000},
        'sanitizer' : {'order':4,'points':2000},
        'rice' : {'order':5,'points':5000},
        'toiletroll' : {'order':6,'points':10000},
      }

      console.log(this.iconOrder['beans']);

      icons.forEach(icon => {
        var iconsprite = this.icongroup.create(icon.x+16, icon.y-16, icon.name);
        iconsprite.body.setAllowGravity(false);
        iconsprite.collectOrder = this.iconOrder[icon.name].order;
        iconsprite.points = this.iconOrder[icon.name].points;
        if (this.iconOrder[icon.name].order != 1) {
          iconsprite.setVisible(false);
          iconsprite.setActive(false);
        } else {
          this.activeSprite = iconsprite;
        }
      });

      //For testing scene transition
      /*
      this.activeSprite.destroy();
      this.activeSprite = this.icongroup.children.entries.filter(icon => icon.collectOrder == 6)[0]
      console.log(this.activeSprite);
      this.activeSprite.setVisible(true);
      this.activeSprite.setActive(true);
      */
      console.log(this.activeSprite);

      var zombies = this.map.getObjectLayer('zombie')['objects'];
      this.zombiegroup = this.physics.add.group();

      zombies.forEach(zombie => {
        var zombiesprite = this.zombiegroup.create(zombie.x+16, zombie.y-16, 'player');
        zombiesprite.body.setAllowGravity(false);
        zombiesprite.visitedTiles = [];
      });

      //Zombie animations
      this.anims.create({
          key: 'zwalk',
          frames: this.anims.generateFrameNames('player', {prefix: 'man ',suffix: '.aseprite', start: 24, end: 35}),
          frameRate: 10,
          repeat: -1
      });
      this.anims.create({
          key: 'zreverse',
          frames: this.anims.generateFrameNames('player', {prefix: 'man ',suffix: '.aseprite', start: 36, end: 47}),
          frameRate: 10,
          repeat: -1
      });


      this.zombiegroup.playAnimation('zwalk');

      this.timer = this.time.addEvent({
        delay: 500,
        callback: function() {
          //Zombie movement
          this.zombiegroup.children.entries.forEach(zombie => this.moveZombie(zombie));
        },
        callbackScope: this,
        loop: true
       });

      this.cursors = this.input.keyboard.createCursorKeys();

      // set bounds so the camera won't go outside the game world
      this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
      // make the camera follow the player
      this.cameras.main.startFollow(this.player);

      // set background color, so the sky is not black
      //this.cameras.main.setBackgroundColor('#ccccff');


      this.blackRectangle = this.add.graphics({ fillStyle: { color: 0x000000} }).setAlpha(0);

      // text which floats to top when points scored
      this.points = this.add.text(0, 0, '', {
          fontSize: '20px',
          fill: '#ffffff'
      });
      this.points.setScrollFactor(0);
      this.points.setVisible(false);



      //Used for debugging only
      this.graphics = this.add.graphics({ fillStyle: { color: 0x0000ff } });
      //Score panel
      this.scorepanel = this.add.graphics({ fillStyle: { color: 0x000000, alpha:0.5 } });
      var scorerect = new Phaser.Geom.Rectangle(0, 0, this.map.widthInPixels,28 );
      this.scorepanel.fillRectShape(scorerect);

      // text which displays the score
      this.scoreTxt = this.add.text(0, 0, 'Score: ' +  this.score, {
          fontSize: '20px',
          fill: '#ffffff'
      });
      this.scoreTxt.setScrollFactor(0);
      //display lives
      this.livesTxt = this.add.text(300, 0, 'Lives: ' +  this.registry.values.lives, {
          fontSize: '20px',
          fill: '#ffffff'
      });
      this.livesTxt.setScrollFactor(0);

      //Centre of screen
      //this.screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
      //this.screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

      this.messageTxt = this.add.text(0,0, '', {
          fontSize: '20px',
          fill: '#ffffff',
          align: "center"
      });
      this.messageTxt.setScrollFactor(0);
      this.messageTxt.setVisible(false);
  },


  update: function(time, delta) {
      /*
      //Update the display with the new velocity
      //this.speed.setText(this.player.body.velocity.x);

      //Make text "float" upwards
      if(this.points.y != 0) {
        this.points.y -= 4;
      } else {
        this.points.setVisible(false);
      }

      //Make text "float" upwards
      if(this.messageTxt.y != 0) {
        this.messageTxt.y -= 4;
      } else {
        this.messageTxt.setVisible(false);
      }

      if(!this.player.dead) {
        if (this.cursors.down.isDown)
        {
          if(!this.playerCollides(this.player.body.x,this.player.body.y+4)) {
            this.player.anims.play('walk',true);
            this.player.y+=2;
          }
        } else if (this.cursors.up.isDown) {
          if(!this.playerCollides(this.player.body.x,this.player.body.y-4)) {
            this.player.anims.play('reverse',true);
            this.player.y-=2;
          }
        } else if (this.cursors.right.isDown) {
          if(!this.playerCollides(this.player.body.x+4,this.player.body.y)) {
            this.player.anims.play('walk',true);
            this.player.x+=2;
          }
        } else if (this.cursors.left.isDown) {
          if(!this.playerCollides(this.player.body.x-4,this.player.body.y)) {
            this.player.anims.play('walk',true);
            this.player.x-=2;
          }
        } else {
          this.player.anims.play('idle',true);
        }
        this.zombiegroup.children.entries.forEach(zombie => this.zombieEatPlayer(zombie));
      } else {
        if(!this.playingDeathSeq) {
          this.playingDeathSeq = true;
          this.player.anims.play('death',true);
          this.registry.values.lives--;
          if (this.registry.values.lives != -1) {
            this.livesTxt.setText('Lives: ' +  this.registry.values.lives);
          }
        }
      }

      //Get the active icon area and check for overlap
      if(!this.levelComplete) {
        var iconarea = new Phaser.Geom.Rectangle(this.activeSprite.x-16,this.activeSprite.y-16, 32, 32);
        if (iconarea.contains(this.player.x,this.player.y)) {
          if(this.activeSprite.collectOrder != 6) {
            var nextSprite = this.activeSprite.collectOrder;

            //Score text
            this.score += this.activeSprite.points;
            this.scoreTxt.setText('Score: '+this.score);
            this.points.setText(this.activeSprite.points);
            this.points.setPosition(this.activeSprite.x, this.activeSprite.y-16);
            this.points.setVisible(true);
            this.activeSprite.destroy();
            console.log(nextSprite);
            console.log(this.icongroup.children.entries);
            this.activeSprite = this.icongroup.children.entries.filter(icon => icon.collectOrder == nextSprite+1)[0];
            console.log(this.activeSprite);
            this.activeSprite.setVisible(true);
            this.activeSprite.setActive(true);
          } else {
            this.levelComplete = true;
            this.score += this.activeSprite.points;
            this.scoreTxt.setText('Score: '+this.score);
            this.points.setText(this.activeSprite.points);
            this.points.setPosition(this.activeSprite.x, this.activeSprite.y-16);
            this.points.setVisible(true);
            this.activeSprite.destroy();
            //Scene Transition
            this.gameMessage = "Level " + this.level + " Complete";
            this.messageTxt.setText(this.gameMessage).setOrigin(0.5);
            this.messageTxt.setPosition(400, 300);
            this.messageTxt.setVisible(true);
            this.levelCompleteTimer = this.time.addEvent({
              delay: 3000,
              callback: function() {
                //go to next level
                this.registry.set('score',this.score);
                this.registry.set('level',this.level+1);
                //this.load.start();
                this.scene.restart();
              },
              callbackScope: this,
              loop: false
            });
          }
        }
      }*/

      //this.graphics.clear();
      //this.graphics.fillRectShape(iconarea);
  },

  moveZombie: function (zombie) {
    var adjacentTiles = [];
    adjacentTiles[0] = this.shelves.getTileAtWorldXY(zombie.x,zombie.y+32,true);
    adjacentTiles[1] = this.shelves.getTileAtWorldXY(zombie.x,zombie.y-32,true);
    adjacentTiles[2] = this.shelves.getTileAtWorldXY(zombie.x+32,zombie.y,true);
    adjacentTiles[3] = this.shelves.getTileAtWorldXY(zombie.x-32,zombie.y,true);
    //Filter the tiles which are not blocked
    var spaces = adjacentTiles.filter(tile => tile.index == -1);
    spaces = spaces.filter(t => !zombie.visitedTiles.includes(t) );
    if(spaces.length > 0){
      var nextMoveIdx = randomNumber(0,spaces.length);
      zombie.visitedTiles.push(spaces[nextMoveIdx]);
      zombie.x = spaces[nextMoveIdx].pixelX + 16
      zombie.y = spaces[nextMoveIdx].pixelY + 16
    } else {
      //clear the visted path
      zombie.visitedTiles = [];
    }
    //console.log(adjacentTiles);
    //this.scene.pause();

  },

  playerCollides: function (x,y) {
    var rect = new Phaser.Geom.Rectangle(x, y, 24, 24);
    var tiles = this.shelves.getTilesWithinShape(rect);
    var collidingTiles = tiles.filter(t => t.index != -1);
    //this.graphics.clear();
    //this.graphics.fillRectShape(rect);
    if(collidingTiles.length > 0) {
      return true;
    } else {
      return false;
    }
  },

  zombieEatPlayer: function(zombie) {
    var deathRect = new Phaser.Geom.Rectangle(this.player.body.x, this.player.body.y, 32, 32);
    if(deathRect.contains(zombie.x,zombie.y) && !this.player.dead) {
      console.log("Player Died");
      this.player.dead = true;

      //Fade out screen
      var coverScreen = new Phaser.Geom.Rectangle(0, 0, this.map.widthInPixels,this.map.heightInPixels );
      this.blackRectangle.fillRectShape(coverScreen);
      this.tweens.add({
          targets: this.blackRectangle,
          alpha: 1,
      });

      if (this.registry.values.lives > 0) {

        this.gameMessage = "You Died!";
        this.messageTxt.setText(this.gameMessage).setOrigin(0.5);
        this.messageTxt.setPosition(400, 300);
        this.messageTxt.setVisible(true);
        //Respawn player
        this.respawnTimer = this.time.addEvent({
          delay: 3000,
          callback: function() {
            this.player.dead = false;
            this.playingDeathSeq = false;
            //this.fadeToBlack.destroy();
            //this.removeTween(this.fadeToBlack);
            this.blackRectangle.clear();
            console.log(this.tweens);
          },
          callbackScope: this,
          loop: false
        });

      } else {
        this.gameMessage = "Game Over";
        this.messageTxt.setText(this.gameMessage).setOrigin(0.5);
        this.messageTxt.setPosition(400, 300);
        this.messageTxt.setVisible(true);
      }

    }
  }


});
