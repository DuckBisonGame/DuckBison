/**
 * BootScene — loads all game assets before any other scene starts.
 *
 * Phase 2 note: add real spritesheets, tilemaps, and audio here once
 * the Piskel / Tiled / Bfxr assets are created.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // ── Placeholder graphics (generated in code until real sprites are ready) ──
    // Once you have Piskel sprite sheets, replace these with:
    //   this.load.spritesheet('mallory', 'assets/mallory.png', { frameWidth: 48, frameHeight: 48 });
    //   this.load.spritesheet('bennett', 'assets/bennett.png', { frameWidth: 96, frameHeight: 64 });
    //   this.load.tilemapTiledJSON('level1', 'assets/level1.json');
    //   this.load.image('tiles', 'assets/tileset.png');
    //   this.load.audio('jump', 'assets/sfx/jump.wav');
    //   etc.

    // Loading bar (friendly feedback while assets load)
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
