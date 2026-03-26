/**
 * DeadScene — shown when Mallory dies.
 * Displays a TRY AGAIN button (drawn on canvas, no HTML).
 */
export default class DeadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DeadScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Dark overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65);

    this.add.text(width / 2, height * 0.3, 'OH NO!', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '72px',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.48, 'Mallory needs your help...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // TRY AGAIN button
    const btnX = width / 2;
    const btnY = height * 0.68;
    const btnW = 220;
    const btnH = 52;

    const btn = this.add.graphics();
    this._drawBtn(btn, btnX, btnY, btnW, btnH, false);

    this.add.text(btnX, btnY, 'TRY AGAIN', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '26px',
      color: '#3a1a06',
    }).setOrigin(0.5);

    const hitZone = this.add.zone(btnX, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
    hitZone.on('pointerover', () => this._drawBtn(btn, btnX, btnY, btnW, btnH, true));
    hitZone.on('pointerout',  () => this._drawBtn(btn, btnX, btnY, btnW, btnH, false));
    hitZone.on('pointerdown', () => this.scene.start('GameScene'));

    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'));
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
  }

  _drawBtn(gfx, x, y, w, h, hover) {
    gfx.clear();
    gfx.fillStyle(hover ? 0xff6666 : 0xee3333)
       .fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    gfx.lineStyle(3, 0xffffff)
       .strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
  }
}
