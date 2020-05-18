import Phaser from "phaser";
import Level1 from "./level1.js";
import Multiplayer from "./multiplayer.js";
import WebfontLoaderPlugin from 'phaser3-rex-plugins/plugins/webfontloader-plugin.js';
import RoundRectanglePlugin from 'phaser3-rex-plugins/plugins/roundrectangle-plugin.js';
//import ChangeLevel from "./changelevel.js";

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 500},
            debug: true
        }
    },
    plugins: {
      global: [{
          key: 'rexRoundRectanglePlugin',
          plugin: RoundRectanglePlugin,
          start: true
      },
      {
        key: 'rexWebfontLoader',
        plugin: WebfontLoaderPlugin,
        start: true
      },]
    },
    scene: [Multiplayer]
}

var game = new Phaser.Game(config);

//Set Global
game.registry.set('score',0);
game.registry.set('level',1);
game.registry.set('lives',0);
//Multiplayer Keys
//game.registry.set('multiplayer',false);
game.registry.set('wins',{1:false,2:false,3:false,4:false,5:false})
