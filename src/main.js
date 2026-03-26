import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';
import DeadScene from './scenes/DeadScene.js';
import WinScene from './scenes/WinScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 450,
  backgroundColor: '#5C8AE6',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },   // We handle gravity manually to match prototype values
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, GameScene, DeadScene, WinScene],
};

new Phaser.Game(config);
