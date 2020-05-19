import Phaser from "phaser";


export default new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function Title() {
        Phaser.Scene.call(this, { key: 'Title', active: false });
    },

    preload: function ()
    {
      this.load.rexWebFont({
        google: {
            families: ['Bangers','Gloria Hallelujah']
        },
        // testString: undefined,
        // testInterval: 20,
      });
      this.load.image('coronacartoon', 'assets/coronacartoon.png');
      this.load.image('title', 'assets/title.png');
      this.load.image('toiletroll', 'assets/icons/toiletroll.png');
      this.load.image('beans', 'assets/icons/beans.png');
      this.load.image('toiletroll', 'assets/icons/toiletroll.png');
      this.load.image('sanitizer', 'assets/icons/sanitizer.png');
      this.load.image('rice', 'assets/icons/rice.png');
      this.load.image('pop', 'assets/icons/pop.png');
      this.load.image('bread', 'assets/icons/bread.png');
    },

    create: function ()
    {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.singlePlayerSelected = true;
      this.iconOrder = {
        pop : {'order':1,'points':500,'collected':false},
        beans : {'order':2,'points':1000,'collected':false},
        bread : {'order':3,'points':1000,'collected':false},
        sanitizer : {'order':4,'points':2000,'collected':false},
        rice : {'order':5,'points':5000,'collected':false},
        toiletroll : {'order':6,'points':10000,'collected':false},
      }
      this.add.image(20,20,'coronacartoon').setOrigin(0,0);
      this.add.image(120,20,'title').setOrigin(0,0);
      this.add.image(600,20,'coronacartoon').setOrigin(0,0).setFlipX(true);
      this.add.text(140, 110, 'Have a Nice Lockdown!', { fontFamily: 'Gloria Hallelujah', fontSize: 40, color: '#7b4585' }).setOrigin(0,0);
      this.add.text(40, 190, 'Coronavirus is rampant! You\'re on a supply run to get the \nlast supplies before the corona virus gets you!' +
      '\nnavigate the supermarket and collect the items\non your shopping list.', { fontSize: 20, color: '#7b4585' }).setOrigin(0,0);
      //this.cameras.main.setBackgroundColor('#274a27');
      this.cameras.main.setBackgroundColor('#242b24');
      this.drawRulesPanel();
      this.selector = this.add.image(150,520,'coronacartoon').setScale(0.25).setOrigin(0,0);
      this.add.text(180, 520, 'Single Player', { fontFamily: 'Bangers', fontSize: 25, color: '#ffffff' }).setOrigin(0,0);
      this.add.text(480, 520, 'Multiplayer', { fontFamily: 'Bangers', fontSize: 25, color: '#ffffff' }).setOrigin(0,0);
      this.add.text(400, 580, 'Press Space', { fontSize: 20, color: '#ffffff' }).setOrigin(0.5);
    },

    update: function() {
      if(this.cursors.left.isDown) {
        this.selector.setPosition(150,520);
        this.singlePlayerSelected = true;
      } else if (this.cursors.right.isDown) {
        this.selector.setPosition(420,520);
        this.singlePlayerSelected = false;
      }

      if(this.cursors.space.isDown) {
        if(this.singlePlayerSelected) {
          this.scene.start('Level1');
        } else {
          this.scene.start('Multiplayer');
        }
      }
    },

    drawRulesPanel: function() {
      //var rect1 = this.add.rexRoundRectangle(400, 370, 605, 405, 30, 0xc9d132);
      //var rect2 = this.add.rexRoundRectangle(400, 370, 600, 400, 30, 0x7488a8);
      var title = this.add.text(400, 300, 'Rules', {
          fontSize: '20px',
          fill: '#c9d132'
      }).setOrigin(0.5);
      this.add.text(400, 330, 'Collect the items, collect the last toiletroll to win! \n Avoid the zombies or you\'ll contract Coronavirus', {
          fontSize: '20px',
          fill: '#c9d132'
      }).setOrigin(0.5);
      var yCount = 380;
      var xCount = 120
      var keys = Object.keys(this.iconOrder);
      for(var i=0;i<keys.length;i++) {
        if(i == 3) {
          xCount += 300;
          yCount = 380;
        }
        this.add.image(xCount,yCount,keys[i]).setOrigin(0,0);
        this.add.text(xCount+40,yCount,keys[i]+" " + this.iconOrder[keys[i]].points + " points",{
            fontSize: '20px',
            fill: '#c9d132'
        }).setOrigin(0,0);
        yCount += 40;
      }

    }
});
