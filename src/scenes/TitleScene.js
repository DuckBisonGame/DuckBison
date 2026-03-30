/**
 * TitleScene — title screen with START button drawn on canvas.
 * Matches the prototype's "all buttons drawn on canvas" rule.
 */
export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Sky gradient background
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x5C8AE6, 0x5C8AE6, 0x87CEEB, 0x87CEEB, 1);
    sky.fillRect(0, 0, width, height);

    // Ground strip
    const ground = this.add.graphics();
    ground.fillStyle(0x4a7c2f).fillRect(0, height - 60, width, 60);

    // Title image — centered, scaled to fit nicely in upper portion of screen
    const img = this.add.image(width / 2, height * 0.38, 'title-image').setOrigin(0.5, 0.5);
    const maxW = width * 0.72;
    const maxH = height * 0.52;
    const scale = Math.min(maxW / img.width, maxH / img.height);
    img.setScale(scale);

    // Title text
    this.add.text(width / 2, height * 0.08, 'DUCK BISON', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '64px',
      color: '#f7c948',
      stroke: '#3a1a06',
      strokeThickness: 8,
    }).setOrigin(0.5);

    // START button (canvas-drawn, no HTML elements)
    const btnX = width / 2;
    const btnY = height * 0.75;
    const btnW = 200;
    const btnH = 52;

    const btn = this.add.graphics();
    this._drawBtn(btn, btnX, btnY, btnW, btnH, false);

    const btnText = this.add.text(btnX, btnY, 'START', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '28px',
      color: '#3a1a06',
    }).setOrigin(0.5);

    // Hit zone
    const hitZone = this.add.zone(btnX, btnY, btnW, btnH).setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => this._drawBtn(btn, btnX, btnY, btnW, btnH, true));
    hitZone.on('pointerout',  () => this._drawBtn(btn, btnX, btnY, btnW, btnH, false));
    hitZone.on('pointerdown', () => this.scene.start('GameScene'));

    // Also allow ENTER / SPACE to start
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'));
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));

    // Credits
    this.add.text(width / 2, height - 16, 'By Zack', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#cccccc',
    }).setOrigin(0.5);
  }

  _drawBtn(gfx, x, y, w, h, hover) {
    gfx.clear();
    gfx.fillStyle(hover ? 0xffe066 : 0xf7c948)
       .fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    gfx.lineStyle(3, 0x3a1a06)
       .strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
  }
}
