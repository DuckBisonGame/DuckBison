/**
 * BootScene — loads all game assets before any other scene starts.
 *
 * Vite resolves the PNG imports to hashed URLs that work in both
 * dev mode and the production build.
 */

import mallardWalkUrl  from '../assets/mallory-walk.png';
import mallardFlyUrl   from '../assets/mallory-flying.png';
import mallardSwimUrl  from '../assets/mallory-on-water-swimming.png';
import mallardDiveUrl  from '../assets/mallory-underwater-swimming.png';
import bisonWalkUrl    from '../assets/bennett-walk.png';
import titleImageUrl   from '../assets/Mallory_on_top_of_Bennett.jpg';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // ── Mallory sprites ───────────────────────────────────────────────────────
    this.load.image('mallard-walk', mallardWalkUrl);
    this.load.image('mallard-fly',  mallardFlyUrl);
    this.load.image('mallard-swim', mallardSwimUrl);
    this.load.image('mallard-dive', mallardDiveUrl);

    // ── Bennett ───────────────────────────────────────────────────────────────
    this.load.image('bison-walk', bisonWalkUrl);

    // ── Title screen ──────────────────────────────────────────────────────────
    this.load.image('title-image', titleImageUrl);

    // ── Loading bar ───────────────────────────────────────────────────────────
    const { width, height } = this.scale;
    const bar = this.add.graphics();
    const box = this.add.graphics();

    box.fillStyle(0x222222).fillRect(width / 2 - 160, height / 2 - 15, 320, 30);

    this.load.on('progress', (value) => {
      bar.clear();
      bar.fillStyle(0xf7c948).fillRect(width / 2 - 158, height / 2 - 13, 316 * value, 26);
    });

    this.load.on('complete', () => {
      bar.destroy();
      box.destroy();
    });
  }

  create() {
    this.scene.start('TitleScene');
  }
}
