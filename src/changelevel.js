import Phaser from "phaser";
import Level1 from "./level1.js";

export default new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function PlayerDied() {
        Phaser.Scene.call(this, { key: 'ChangeLevel' });
    },

    preload: function ()
    {

    },

    create: function ()
    {
      this.scene.remove('level1');
      this.scene.add
    },


});
