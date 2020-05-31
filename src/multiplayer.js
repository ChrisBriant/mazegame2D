import Phaser from "phaser";
import {randomNumber} from './include.js';
import io from 'socket.io-client';

export default new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function Multiplayer() {
        Phaser.Scene.call(this, { key: 'Multiplayer' , active: false })
    },

    preload: function () {
        // map made with Tiled in JSON format
        this.load.tilemapTiledJSON('mmap1', 'assets/level1.json');
        this.load.tilemapTiledJSON('mmap2', 'assets/level2.json');
        this.load.tilemapTiledJSON('mmap3', 'assets/level3.json');
        this.load.tilemapTiledJSON('mmap4', 'assets/level4m.json');
        this.load.tilemapTiledJSON('mmap5', 'assets/level5m.json');
        // tiles in spritesheet
        this.load.spritesheet('tilemap', 'assets/tilemap.png', {frameWidth: 32, frameHeight: 32});
        // player animations
        this.load.atlas('player', 'assets/player.png', 'assets/player.json');
        this.load.atlas('player2', 'assets/player2.png', 'assets/player2.json');
        //Load icons
        this.load.image('beans', 'assets/icons/beans.png');
        this.load.image('toiletroll', 'assets/icons/toiletroll.png');
        this.load.image('sanitizer', 'assets/icons/sanitizer.png');
        this.load.image('rice', 'assets/icons/rice.png');
        this.load.image('pop', 'assets/icons/pop.png');
        this.load.image('bread', 'assets/icons/bread.png');
        //audio
        this.load.audio('bgmusic', 'assets/music/Lobo_Loco_-_02_-_Brain_-_Instrumental_Retro_ID_1271.mp3');
        this.load.audio('scoresound', 'assets/music/zapsplat_multimedia_game_tome_musical_synth_level_complete_etc_003_38429.mp3');
    },

   create: function() {
     this.level = this.registry.values.level;
     if(this.level > 1) {
       var socket_ID = this.registry.values.socket_ID;
       //Tell server nextlevel is ready
       this.socket = this.registry.values.socket;
       this.socket.removeAllListeners();
       this.socket.emit('newLevel',socket_ID,this.registry.values.pairId);
     } else {
       this.socket = io();
       this.socket = io.connect('https://coronamaze-multiplayer-server.herokuapp.com/');
       var socket_ID;
     }

     var playerNo = 0;
     //Create Audio
     var bgmusic = this.sound.add('bgmusic');
     bgmusic.play();

     this.gameMessage = "";
     this.levelComplete = false;
     this.playingDeathSeq = false;
     this.invincible = false;
     this.currentDirection = "ST";
     this.scoring = false;
     this.waitBox = [];
     this.running = true;

     this.paired = false;
     //var paired = this.paired;
     this.player;
     this.player2;
     var sc = this;
     //Key press escape go back to title
     this.input.keyboard.on('keydown_ESC', function (event) {
       sc.socket.disconnect();
       sc.scene.start('Title');
     });

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

     // player2 animations
     this.anims.create({
         key: 'p2walk',
         frames: this.anims.generateFrameNames('player2', {prefix: 'player2 ',suffix: '.aseprite', start: 0, end: 11}),
         frameRate: 10,
         repeat: -1
     });
     this.anims.create({
         key: 'p2reverse',
         frames: this.anims.generateFrameNames('player2', {prefix: 'player2 ',suffix: '.aseprite', start: 12, end: 23}),
         frameRate: 10,
         repeat: -1
     });
     this.anims.create({
         key: 'p2idle',
         frames: this.anims.generateFrameNames('player2', {prefix: 'player2 ',suffix: '.aseprite', start: 11, end: 11}),
         frameRate: 10,
         repeat: -1
     });
     this.anims.create({
         key: 'p2death',
         frames: this.anims.generateFrameNames('player2', {prefix: 'player2 ',suffix: '.aseprite', start: 24, end: 32}),
         frameRate: 10,
         repeat: 0
     });

     // load the map
     this.map = this.make.tilemap({key: 'mmap' + this.level});
     var levelTiles = this.map.addTilesetImage('tilemap');

     this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);


     this.floor = this.map.createDynamicLayer('floor', levelTiles, 0, 0);
     // create the shelves layer
     this.shelves = this.map.createDynamicLayer('walls', levelTiles, 0, 0);
     // the player will collide with this layer
     this.shelves.setCollisionByExclusion([-1]);

     //Get a representation of the map for the server
     var tileMapX = 16;
     var zombieMoveMap = [];
     for(var i=0;i<25;i++) {
       var col = []
       var tileMapY = 16;

       for(var j=0;j<18;j++){
         var idx = this.shelves.getTileAtWorldXY(tileMapX,tileMapY,true).index;
         col.push({'idx':idx, 'x':tileMapX,'y':tileMapY});
         tileMapY += 32;
       }
       zombieMoveMap.push(col);
       tileMapX += 32;
     }

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
     this.p1ScoreTxt = this.add.text(0, 0, 'Player 1: 0', {
         fontSize: '20px',
         fill: '#ffffff'
     });
     this.p1ScoreTxt.setScrollFactor(0);
     //display lives
     this.p1LivesTxt = this.add.text(300, 0, 'L: 3', {
         fontSize: '20px',
         fill: '#ffffff'
     });
     this.p1LivesTxt.setScrollFactor(0);

     // text which displays the score
     this.p2ScoreTxt = this.add.text(400, 0, 'Player 2: 0', {
         fontSize: '20px',
         fill: '#ffffff'
     });
     this.p2ScoreTxt.setScrollFactor(0);
     //display lives
     this.p2LivesTxt = this.add.text(700, 0, 'L: 3', {
         fontSize: '20px',
         fill: '#ffffff'
     });
     this.p2LivesTxt.setScrollFactor(0);

     this.messageTxt = this.add.text(0,0, '', {
         fontSize: '20px',
         fill: '#ffffff',
         align: "center"
     });
     this.messageTxt.setScrollFactor(0);
     this.messageTxt.setVisible(false);

     this.socket.on('socketID', function (socketID) {
       socket_ID= socketID;
     });

     this.socket.on('currentPlayers', function (players) {
       //When players is an array
        var player = players.filter(p => p.playerId === socket_ID)[0];
        if(player.playerNo == 2) {
          this.emit('player2Ready', { player });
        }

      });


      this.socket.on('opponentmove', (movementData,zombies,icons,scores,lives) =>  {
        //Scores and Lives
        this.p1ScoreTxt.setText('Player 1: '+scores.p1);
        this.p2ScoreTxt.setText('Player 2: '+scores.p2);
        this.p1LivesTxt.setText('L: '+lives.p1);
        this.p2LivesTxt.setText('L: '+lives.p2);

        if(movementData.otherId == socket_ID) {
          this.moveOtherPlayer(movementData.x+16,movementData.y+16);
          //Opponent animations
          if(movementData.direction == "UP")
            if(this.player.playerNo == 1) {
              this.player2.anims.play('p2reverse',true);
            } else {
              this.player2.anims.play('reverse',true);
            }
          else {

            if(this.player.playerNo == 1) {
              this.player2.anims.play('p2walk',true);
            } else {
              this.player2.anims.play('walk',true);
            }
          }
        }

        //Move zombies
        for(var i=0;i<zombies.length;i++) {
          var zombie = this.zombiegroup.children.entries.filter(zomb => zomb.trackingId == zombies[i].id)[0];
          if(!zombie.moved) {
            zombie.moved = true;
            this.tweens.add({
                targets: zombie,
                x: zombies[i].x,
                y: zombies[i].y,
                onComplete: function() {
                  zombie.moved = false;
                },
            });
            if(this.player.playerNo == 1) {
              this.socket.emit('movezombie');
            }
          }
        }
        //Deal with icons
        if(icons.length > 0) {
          var iconDetail = icons[0].icons[this.activeSprite.iconName];
          //An item is collected
          if(iconDetail.collected) {
            //Get next sprite
            this.activeSprite.destroy();
            if(iconDetail.order < 6) {
             this.activeSprite = this.icongroup.children.entries.filter(icon => icon.collectOrder == iconDetail.order+1)[0];
             this.activeSprite.setVisible(true);
             this.activeSprite.setActive(true);
           } else {
             if(!this.levelComplete) {
               this.levelComplete = true;
               var win;
               //Fade out screen
               var coverScreen = new Phaser.Geom.Rectangle(0, 0, this.map.widthInPixels,this.map.heightInPixels );
               this.blackRectangle.fillRectShape(coverScreen);
               this.tweens.add({
                   targets: this.blackRectangle,
                   alpha: 1,
               });
               this.player.setVisible(false);
               this.player2.setVisible(false);
               this.zombiegroup.setVisible(false);
               if(iconDetail.player == socket_ID) {
                 var completeTxt = "You Win";
                 win = true;
               } else {
                 var completeTxt = "You Lose";
                 win = false;
               }
               if(this.level + 1 > 5) {
                 this.messageTxt.setText("Game Complete!").setOrigin(0.5);
               } else {
                 this.messageTxt.setText("Level " + this.level + " Complete!\n" + completeTxt).setOrigin(0.5);
               }
               this.messageTxt.setPosition(400, 300);
               this.messageTxt.setVisible(true);
               this.levelCompleteTimer = this.time.addEvent({
                 delay: 3000,
                 callback: function() {
                   //go to next level
                   this.registry.set('level',this.level+1);
                   this.registry.values.socket_ID = socket_ID;
                   this.registry.values.socket = this.socket;
                   this.registry.values.pairId = this.player.pairId;
                   var wins = this.registry.values.wins;
                   wins[this.level] = win;
                   this.registry.set('wins',wins);
                   this.socket.emit('levelEnd',socket_ID,this.player.pairId);
                 },
                 callbackScope: this,
                 loop: false
               });
            }
           }
            this.scoring = false;
          }
        }
      });

      //Scene restart is triggered by server
      this.socket.on('restartLevel', () =>  {
        this.running = false;
        if(this.level + 1 > 5) {
          this.scene.start('Title');
        } else {
          this.scene.restart();
        }
      });


      this.socket.on('playerDeath', (player) => {
        //Handle player death
        this.invincible = true;
        var deathTxt = "";

        if(player.playerId == this.player.playerId) {
          this.player.dead = true;
          deathTxt = "You Died";
        } else {
          this.player2.dead = true;
          deathTxt = "Your Opponent Died";
        }

        //Add death screen text
        var coverScreen = new Phaser.Geom.Rectangle(0, 0, this.map.widthInPixels,this.map.heightInPixels );
        this.blackRectangle.fillRectShape(coverScreen);
        this.tweens.add({
            targets: this.blackRectangle,
            alpha: 1,
        });
        this.player.setVisible(false);
        this.player2.setVisible(false);
        this.zombiegroup.setVisible(false);
        this.icongroup.setVisible(false);
        this.messageTxt.setText(deathTxt).setOrigin(0.5);
        this.messageTxt.setPosition(400, 300);
        this.messageTxt.setVisible(true);
        this.respawnTimer = this.time.addEvent({
          delay: 3000,
          callback: function() {
            //go to next level
            this.blackRectangle.clear();
            this.player.setVisible(true);
            this.player2.setVisible(true);
            this.zombiegroup.setVisible(true);
            this.invincible = false;
            this.player.dead = false;
            this.player2.dead = false;
            this.playingDeathSeq = false;
          },
          callbackScope: this,
          loop: false
        });
      });



      this.socket.on('playerGameOver', (player,otherScore) => {
        //Handle player death
        this.invincible = true;
        var deathTxt = "";
        var win;

        if(player.playerId == this.player.playerId) {
          win = false;
          this.player.dead = true;
          deathTxt = "You Have Lost \n Your Opponent Wins";
        } else {
          win = true;
          this.player2.dead = true;
          deathTxt = "You Have Won \n Your Opponent Has Died";
        }

        //Add death screen text
        var coverScreen = new Phaser.Geom.Rectangle(0, 0, this.map.widthInPixels,this.map.heightInPixels );
        this.blackRectangle.fillRectShape(coverScreen);
        this.tweens.add({
            targets: this.blackRectangle,
            alpha: 1,
        });
        this.player.setVisible(false);
        this.player2.setVisible(false);
        this.zombiegroup.setVisible(false);
        this.icongroup.setVisible(false);
        this.messageTxt.setText(deathTxt).setOrigin(0.5);
        this.messageTxt.setPosition(400, 300);
        this.messageTxt.setVisible(true);
        this.respawnTimer = this.time.addEvent({
          delay: 3000,
          callback: function() {
            var wins = this.registry.values.wins;
            wins[this.level] = win;
            this.registry.set('wins',wins);
            //Draw the player stats
            this.drawGameOverPanel(win,player.score,otherScore)
          },
          callbackScope: this,
          loop: false
        });
      });


      this.socket.on('otherPlayerDisconnected', (player,otherScore) => {
        //Add death screen text
        var coverScreen = new Phaser.Geom.Rectangle(0, 0, this.map.widthInPixels,this.map.heightInPixels );
        this.blackRectangle.fillRectShape(coverScreen);
        this.tweens.add({
            targets: this.blackRectangle,
            alpha: 1,
        });
        this.player.setVisible(false);
        this.player2.setVisible(false);
        this.zombiegroup.setVisible(false);
        this.icongroup.setVisible(false);
        this.messageTxt.setText("You Have Won \n Your Opponent Quit").setOrigin(0.5);
        this.messageTxt.setPosition(400, 300);
        this.messageTxt.setVisible(true);
        this.respawnTimer = this.time.addEvent({
          delay: 3000,
          callback: function() {
            var wins = this.registry.values.wins;
            wins[this.level] = true;
            this.registry.set('wins',wins);
            //Draw the player stats
            this.drawGameOverPanel(true,otherScore,player.score)
          },
          callbackScope: this,
          loop: false
        });
      });


      this.socket.on('pair', function (pair) {
        //Destroy waiting items if the exist
        for(var i=0;i<sc.waitBox.length;i++){
          sc.waitBox[i].destroy();
        }
        //For server
        var zombieData = {'playerId':socket_ID,'zombies':[],'pairId':pair[0].pairId,'map':zombieMoveMap};
        //Send the tilemaps to the server
        if(!sc.paired) {
            sc.paired = true;
            // set bounds so the camera won't go outside the game world
            if(pair[0].playerId == socket_ID) {
              var me = pair[0];
              var otherPlayer = pair[1];
            } else {
              var me = pair[1];
              var otherPlayer = pair[0];
            }


            if(me.playerNo == 1) {
              // create the player sprite
              var playerLayer = sc.map.getObjectLayer('player')['objects'];
              var player2Layer = sc.map.getObjectLayer('player2')['objects'];
              //TEST
              //sc.player = sc.physics.add.sprite(560, 216, 'player',0);
              //Near zombie
              sc.player = sc.physics.add.sprite(playerLayer[0].x+16, playerLayer[0].y-16, 'player',0);
              sc.player2 = sc.physics.add.sprite(player2Layer[0].x+16, player2Layer[0].y-16, 'player2',0);
            } else {
              var playerLayer = sc.map.getObjectLayer('player2')['objects'];
              var player2Layer = sc.map.getObjectLayer('player')['objects'];
              sc.player = sc.physics.add.sprite(playerLayer[0].x+16, playerLayer[0].y-16, 'player2',0);
              sc.player2 = sc.physics.add.sprite(player2Layer[0].x+16, player2Layer[0].y-16, 'player',0);
            }
            sc.player.setCollideWorldBounds(true); // don't go out of the map
            sc.player.body.setAllowGravity(false);
            sc.player2.body.setAllowGravity(false);
            sc.player.dead = false;

            // small fix to our player images, we resize the physics body object slightly
            sc.player.body.setSize(sc.player.width-8, sc.player.height-8 );
            sc.player2.body.setSize(sc.player.width-8, sc.player.height-8 );
            // make the camera follow the player
            sc.cameras.main.startFollow(sc.player);
            sc.player.playerId = me.playerId;
            sc.player.playerNo = me.playerNo;
            sc.player.otherId = me.otherPlayer;
            sc.player.pairId = me.pairId;
            sc.player2.playerNo = otherPlayer.playerNo;
        }
        var zombies = sc.map.getObjectLayer('zombie')['objects'];
        sc.zombiegroup = sc.physics.add.group();

        var zombieIdx = 0;

        zombies.forEach(zombie => {
          var zombiesprite = sc.zombiegroup.create(zombie.x+16, zombie.y-16, 'player');
          zombiesprite.body.setAllowGravity(false);
          zombiesprite.visitedTiles = [];
          zombiesprite.trackingId = zombieIdx;
          zombiesprite.moved = false;
          zombieData.zombies.push({'id':zombieIdx,'x':zombiesprite.x,'y':zombiesprite.y,'visited':[]});
          zombieIdx++;
        });
        //Zombie animations
        sc.anims.create({
            key: 'zwalk',
            frames: sc.anims.generateFrameNames('player', {prefix: 'man ',suffix: '.aseprite', start: 24, end: 35}),
            frameRate: 10,
            repeat: -1
        });
        sc.anims.create({
            key: 'zreverse',
            frames: sc.anims.generateFrameNames('player', {prefix: 'man ',suffix: '.aseprite', start: 36, end: 47}),
            frameRate: 10,
            repeat: -1
        });

        sc.zombiegroup.playAnimation('zwalk');
        if(me.playerNo == 1) {
          this.emit("zombiestart",zombieData,me.pairId);
        }
        //Set up timer to send player movement
        sc.moveTimer = sc.time.addEvent({
          delay: 100,
          callback: function() {
            this.emit('movement', {'x':sc.player.x,'y':sc.player.y,'id':sc.player.playerId,'otherId':sc.player.otherId,'pairId':sc.player.pairId,'direction':sc.currentDirection});
          },
          callbackScope: this,
          loop: true
        });


        sc.iconOrder = {
          'pop' : {'order':1,'points':500,'collected':false},
          'beans' : {'order':2,'points':1000,'collected':false},
          'bread' : {'order':3,'points':1000,'collected':false},
          'sanitizer' : {'order':4,'points':2000,'collected':false},
          'rice' : {'order':5,'points':5000,'collected':false},
          'toiletroll' : {'order':6,'points':10000,'collected':false},
        }

        if(sc.player.playerNo == 1) {
          sc.socket.emit('sendicons', {'pairId':sc.player.pairId, 'icons':sc.iconOrder});
        }

        var icons = sc.map.getObjectLayer('icons')['objects'];
        sc.icongroup = sc.physics.add.group();
        //Define order of collection


        icons.forEach(icon => {
          var iconsprite = sc.icongroup.create(icon.x+16, icon.y-16, icon.name);
          iconsprite.body.setAllowGravity(false);
          iconsprite.collectOrder = sc.iconOrder[icon.name].order;
          iconsprite.points = sc.iconOrder[icon.name].points;
          iconsprite.iconName = icon.name
          if (sc.iconOrder[icon.name].order != 1) {
            iconsprite.setVisible(false);
            iconsprite.setActive(false);
          } else {
            sc.activeSprite = iconsprite;
          }
        });
        sc.player2.anims.play('p2walk');
      });

      // set the boundaries of our game world
      this.physics.world.bounds.width = this.map.widthInPixels;
      this.physics.world.bounds.height = this.map.heightInPixels;
      this.cursors = this.input.keyboard.createCursorKeys();

      // set background color, so the sky is not black
      this.drawGameStartPanel();
  },


  update: function(time, delta) {
    if(this.running) {
      //Update the display with the new velocity
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


      if(this.paired) {
        if(!this.player.dead) {
          if (this.cursors.down.isDown)
          {
            if(!this.playerCollides(this.player.body.x,this.player.body.y+4)) {
              if(this.player.playerNo == 1) {
                this.player.anims.play('walk',true);
              } else {
                this.player.anims.play('p2walk',true);
              }
              this.currentDirection = "DN";
              this.player.y+=2;
            }
          } else if (this.cursors.up.isDown) {
            if(!this.playerCollides(this.player.body.x,this.player.body.y-4)) {
              if(this.player.playerNo == 1) {
                this.player.anims.play('reverse',true);
              } else {
                this.player.anims.play('p2reverse',true);
              }
              this.currentDirection = "UP";
              this.player.y-=2;
            }
          } else if (this.cursors.right.isDown) {
            if(!this.playerCollides(this.player.body.x+4,this.player.body.y)) {
              if(this.player.playerNo == 1) {
                this.player.anims.play('walk',true);
              } else {
                this.player.anims.play('p2walk',true);
              }
              this.currentDirection = "R";
              this.player.x+=2;
            }
          } else if (this.cursors.left.isDown) {
            if(!this.playerCollides(this.player.body.x-4,this.player.body.y)) {
              if(this.player.playerNo == 1) {
                this.player.anims.play('walk',true);
              } else {
                this.player.anims.play('p2walk',true);
              }
              this.currentDirection = "L";
              this.player.x-=2;
            }
          } else {
            if(this.player.playerNo == 1) {
              this.player.anims.play('idle',true);
            } else {
              this.player.anims.play('p2idle',true);
            }
          }
          //Detect Zombie killing player
          this.zombiegroup.children.entries.forEach(zombie => this.zombieEatPlayer(zombie));
        } else {
          if(!this.playingDeathSeq) {
            this.playingDeathSeq = true;
            if(this.player.playerNo == 1) {
              this.player.anims.play('death',true);
            } else {
              this.player.anims.play('p2death',true);
            }
            this.registry.values.lives--;
          }
        }

        if(this.player2.dead) {
          if(this.player.playerNo == 2) {
            this.player2.anims.play('p2death',true);
          } else {
            this.player2.anims.play('death',true);
          }
        } else {
          if(this.player.playerNo == 2) {
            this.player2.anims.play('idle',true);
          } else {
            this.player2.anims.play('p2idle',true);
          }
        }
        //Get the active icon area and check for overlap
        if(!this.levelComplete) {
          var iconarea = new Phaser.Geom.Rectangle(this.activeSprite.x-16,this.activeSprite.y-16, 32, 32);
          if (iconarea.contains(this.player.x,this.player.y)) {
              var scoresound = this.sound.add('scoresound');
              scoresound.play();
              this.points.setText(this.activeSprite.points);
              this.points.setPosition(this.activeSprite.x, this.activeSprite.y-16);
              this.points.setVisible(true);
              if(!this.scoring) {
                this.scoring = true;
                this.socket.emit('collected',this.player.pairId,this.player.playerId,this.activeSprite.iconName);
              }
          }
        }

      }
    }
  },

  moveOtherPlayer: function (x,y) {
    this.player2.x = x-16;
    this.player2.y = y-16;
  },

  playerCollides: function (x,y) {
    var rect = new Phaser.Geom.Rectangle(x, y, 24, 24);
    var tiles = this.shelves.getTilesWithinShape(rect);
    var collidingTiles = tiles.filter(t => t.index != -1);
    if(collidingTiles.length > 0) {
      return true;
    } else {
      return false;
    }
  },

  zombieEatPlayer: function(zombie) {
    var deathRect = new Phaser.Geom.Rectangle(this.player.body.x, this.player.body.y, 32, 32);
    if(deathRect.contains(zombie.x,zombie.y) && !this.player.dead && !this.invincible) {
      if (this.registry.values.lives > 0 && !this.player.dead) {
        this.player.dead = true;
        this.socket.emit('playerDied',this.player.playerId,this.player.pairId);
      } else {
        //Game over for player
        this.socket.emit('playerLivesGone',this.player.playerId,this.player.pairId);
      }
    }
  },

  drawGameOverPanel: function(win,myScore,otherScore) {
    this.add.rexRoundRectangle(400, 300, 405, 405, 30, 0xc9d132);
    this.add.rexRoundRectangle(400, 300, 400, 400, 30, 0x7488a8);
    this.add.text(400, 120, 'Game Over', {
        fontSize: '20px',
        fill: '#c9d132'
    }).setOrigin(0.5);
    if(win) {
      var message = "You Win";
    } else {
      var message = "You Lose";
    }
    this.add.text(400, 150, message, {
        fontSize: '20px',
        fill: '#ffffff'
    }).setOrigin(0.5);
    this.add.text(320, 180, 'You', {
        fontSize: '20px',
        fill: '#c9d132'
    });
    this.add.text(420, 180, 'Opponent', {
        fontSize: '20px',
        fill: '#c9d132'
    });
    var textPos = 210;
    var wins = this.registry.values.wins;
    for(var i=1;i<=this.level;i++) {
      this.add.text(220, textPos, 'Level '+i, {
          fontSize: '20px',
          fill: '#c9d132'
      });

      if(wins[i]) {
        this.add.text(320, textPos, 'Win', {
            fontSize: '20px',
            fill: '#ffffff'
        });
        this.add.text(420, textPos, 'Lose', {
            fontSize: '20px',
            fill: '#ffffff'
        });
      } else {
        this.add.text(320, textPos, 'Lose', {
            fontSize: '20px',
            fill: '#ffffff'
        });
        this.add.text(420, textPos, 'Win', {
            fontSize: '20px',
            fill: '#ffffff'
        });
      }
      textPos += 30;
    }
    this.add.text(220, textPos, 'Score: ', {
        fontSize: '20px',
        fill: '#c9d132'
    });
    this.add.text(320, textPos, myScore, {
        fontSize: '20px',
        fill: '#ffffff'
    });
    this.add.text(420, textPos, otherScore, {
        fontSize: '20px',
        fill: '#ffffff'
    });
    this.socket.disconnect();
  },

  drawGameStartPanel: function() {
    var coverScreen = new Phaser.Geom.Rectangle(0, 0, this.map.widthInPixels,this.map.heightInPixels );
    var blackRectangle = this.add.graphics({ fillStyle: { color: 0x000000} }).setAlpha(0.5);
    blackRectangle.fillRectShape(coverScreen);
    var rect1 = this.add.rexRoundRectangle(400, 300, 305, 205, 30, 0xc9d132);
    var rect2 = this.add.rexRoundRectangle(400, 300, 300, 200, 30, 0x7488a8);
    var title = this.add.text(400, 270, 'Multiplayer Game', {
        fontSize: '20px',
        fill: '#c9d132'
    }).setOrigin(0.5);
    var waitTxt = this.add.text(400, 300, 'Waiting for Opponent', {
        fontSize: '20px',
        fill: '#ffffff'
    }).setOrigin(0.5);
    var waitOn = true;
    this.waitTimer = this.time.addEvent({
      delay: 500,
      callback: function() {
        if(waitOn) {
          waitTxt.setVisible(false);
          waitOn = false;
        } else {
          waitTxt.setVisible(true);
          waitOn = true;
        }
      },
      callbackScope: this,
      loop: true
    });
    this.waitBox.push(rect1);
    this.waitBox.push(rect2);
    this.waitBox.push(title);
    this.waitBox.push(waitTxt);
    this.waitBox.push(blackRectangle);
  }

});
