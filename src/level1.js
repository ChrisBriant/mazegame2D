import Phaser from "phaser";
import {randomNumber} from './include.js';

export default new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function Level1() {
        Phaser.Scene.call(this, { key: 'Level1' , active: true  })
    },

    preload: function () {
        // map made with Tiled in JSON format
        this.load.tilemapTiledJSON('map', 'assets/level1.json');
        // tiles in spritesheet
        this.load.spritesheet('tilemap', 'assets/tilemap.png', {frameWidth: 64, frameHeight: 32});
        // player animations
        this.load.atlas('player', 'assets/player.png', 'assets/player.json');
    },

   create: function() {
      // load the map
      this.map = this.make.tilemap({key: 'map'});

      // tiles for the ground layer
      var levelTiles = this.map.addTilesetImage('tilemap');

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
      this.player = this.physics.add.sprite(playerLayer[0].x+16, playerLayer[0].y-16, 'player',0);
      this.player.setCollideWorldBounds(true); // don't go out of the map
      this.player.body.setAllowGravity(false);

      //this.physics.add.collider(this.player, this.shelves);

      // small fix to our player images, we resize the physics body object slightly
      this.player.body.setSize(this.player.width-8, this.player.height-8 );

      // player will collide with the level tiles
      //this.physics.add.overlap(this.shelves, this.player,function(player,shelve) {
        //console.log(player);
      //},null,this);

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
      /*
      this.anims.create({
          key: 'walk-down-left',
          frames: this.anims.generateFrameNames('warrior-flipped', {prefix: 'coronawarrior-FLIPPED ',suffix: '.aseprite', start: 0, end: 7}),
          frameRate: 10,
          repeat: -1
      });
      this.anims.create({
          key: 'walk-up-right',
          frames: this.anims.generateFrameNames('warrior-flipped', {prefix: 'coronawarrior-FLIPPED ',suffix: '.aseprite', start: 8, end: 15}),
          frameRate: 10,
          repeat: -1
      });
      this.anims.create({
          key: 'walk-down-right',
          frames: this.anims.generateFrameNames('warrior', {prefix: 'coronawarrior ',suffix: '.aseprite', start: 0, end: 7}),
          frameRate: 10,
          repeat: -1
      });
      this.anims.create({
          key: 'walk-up-left',
          frames: this.anims.generateFrameNames('warrior', {prefix: 'coronawarrior ',suffix: '.aseprite', start: 8, end: 15}),
          frameRate: 10,
          repeat: -1
      });
      this.anims.create({
          key: 'idle',
          frames: this.anims.generateFrameNames('warrior', {prefix: 'coronawarrior ',suffix: '.aseprite', start: 3, end: 3}),
          frameRate: 10,
          repeat: -1
      });
      this.player.anims.play('idle',true);

      this.player.on('animationcomplete',function () {
          if(this.player.anims.currentAnim.key == 'jump' && !this.jumping) {

          }

      }, this );
      */


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

      // this text will show the score
      this.text = this.add.text(20, 570, '0', {
          fontSize: '20px',
          fill: '#ffffff'
      });
      this.text.setScrollFactor(0);

      //Used for debugging only
      this.graphics = this.add.graphics({ fillStyle: { color: 0x0000ff } });

  },


  update: function(time, delta) {
      //Update the display with the new velocity
      //this.speed.setText(this.player.body.velocity.x);

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
  }


});
