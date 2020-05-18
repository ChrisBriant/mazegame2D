import Phaser from "phaser";


export default new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function Title() {
        Phaser.Scene.call(this, { key: 'Title', active: false });
    },

    preload: function ()
    {
      this.load.image('coronacartoon', 'assets/coronacartoon.png');
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
      this.add.image(50,50,'coronacartoon');
      //this.cameras.main.setBackgroundColor('#274a27');
      this.cameras.main.setBackgroundColor('#242b24');
    },


});
