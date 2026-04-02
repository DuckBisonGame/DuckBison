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

    // STEP 2 — Camera background (failsafe for any uncovered pixels)
    this.cameras.main.setBackgroundColor('#1a3a6b');

    // STEP 1 — Fullscreen opaque background rect, first thing created, depth 0.
    // This guarantees nothing behind the image is transparent in WebGL mode.
    const bg = this.add.rectangle(0, 0, width, height, 0x1a3a6b);
    bg.setOrigin(0, 0);
    bg.setDepth(0);

    // Sky colour bands (above the ground strip)
    this.add.rectangle(width / 2, height * 0.72, width, height * 0.25, 0x1a3a6b).setDepth(0);

    // Ground strip
    this.add.rectangle(width / 2, height - 30, width, 60, 0x4a7c2f).setDepth(0);

    // Title text — created before image so we can measure its bottom edge
    const titleText = this.add.text(width / 2, height * 0.06, 'DUCK BISON', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '64px',
      color: '#f7c948',
      stroke: '#3a1a06',
      strokeThickness: 8,
    }).setOrigin(0.5, 0).setDepth(2);

    // START button geometry — defined early so image centres between title and button
    const btnX = width / 2;
    const btnY = height * 0.78;
    const btnW = 200;
    const btnH = 52;

    // Centre image between bottom of title text and top of START button
    const titleBottom = titleText.y + titleText.height;
    const btnTop      = btnY - btnH / 2;
    const imgCenterY  = (titleBottom + btnTop) / 2;
    const maxW        = width  * 0.72;
    const maxH        = btnTop - titleBottom - 16;

    // STEPS 3 & 5 — Image at depth 1 (above bg rect), NORMAL blend, fully opaque.
    // Using the .jpg which has NO alpha channel — eliminates checkerboard entirely.
    const img = this.add.image(width / 2, imgCenterY, 'title-image');
    img.setOrigin(0.5, 0.5);
    img.setDepth(1);
    img.setBlendMode(Phaser.BlendModes.NORMAL);
    img.clearTint();
    img.setAlpha(1);
    img.setScale(Math.min(maxW / img.width, maxH / img.height));

    // START button — graphics only for the button shape (no background use)
    const btn = this.add.graphics().setDepth(2);
    this._drawBtn(btn, btnX, btnY, btnW, btnH, false);

    this.add.text(btnX, btnY, 'START', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '28px',
      color: '#3a1a06',
    }).setOrigin(0.5).setDepth(2);

    // Hit zone
    const hitZone = this.add.zone(btnX, btnY, btnW, btnH)
      .setInteractive({ useHandCursor: true }).setDepth(2);
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
    }).setOrigin(0.5).setDepth(2);
  }

  _drawBtn(gfx, x, y, w, h, hover) {
    gfx.clear();
    gfx.fillStyle(hover ? 0xffe066 : 0xf7c948)
       .fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    gfx.lineStyle(3, 0x3a1a06)
       .strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
  }
}
