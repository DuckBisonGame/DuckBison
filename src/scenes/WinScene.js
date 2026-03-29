/**
 * WinScene — Bennett walks right with Mallory riding his back. Fireworks burst continuously.
 * Characters use PNG sprites loaded in BootScene.
 */

export default class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WinScene' });
    this._fireworks = [];
    this._ticker    = 0;
  }

  create() {
    const { width, height } = this.scale;

    // Sky
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a2e);
    // Ground strip
    this.add.rectangle(width / 2, height * 0.88, width, height * 0.24, 0x3A5C1E);
    this.add.rectangle(width / 2, height * 0.76, width, 8, 0x4E8A28);

    this.add.text(width / 2, height * 0.14, 'YOU DID IT!', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '62px', color: '#f7c948',
      stroke: '#3a1a06', strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.30, 'Bennett is free!\nMallory & Bennett ride into the sunset.', {
      fontFamily: 'Arial, sans-serif', fontSize: '20px',
      color: '#ffffff', stroke: '#000000', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5);

    // Fireworks layer (behind characters)
    this._fwGfx = this.add.graphics().setDepth(1);

    // Bennett starts off left edge, walks right
    this._bx = -60;
    this._by = height * 0.74;  // feet at ground level

    // Bennett PNG — faces right (no flip), ~80px tall, origin bottom-centre
    this.bennettSprite = this.add.image(this._bx, this._by, 'bison-walk')
      .setOrigin(0.5, 1.0).setDepth(2);
    this.bennettSprite.setScale(80 / this.bennettSprite.height);
    this._benH = this.bennettSprite.displayHeight;  // stored for Mallory offset

    // Mallory PNG — faces right (no flip), ~50px tall, rides on Bennett's back
    this.malloryWinSprite = this.add.image(this._bx, this._by - this._benH * 0.62, 'mallard-walk')
      .setOrigin(0.5, 1.0).setDepth(3);
    this.malloryWinSprite.setScale(50 / this.malloryWinSprite.height);

    // PLAY AGAIN button
    const btnX = width / 2, btnY = height * 0.88;
    const btnW = 220, btnH = 52;
    const btn = this.add.graphics().setDepth(5);
    this._drawBtn(btn, btnX, btnY, btnW, btnH, false);

    this.add.text(btnX, btnY, 'PLAY AGAIN', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '26px', color: '#3a1a06',
    }).setOrigin(0.5).setDepth(6);

    const hitZone = this.add.zone(btnX, btnY, btnW, btnH).setInteractive({ useHandCursor: true }).setDepth(6);
    hitZone.on('pointerover', () => this._drawBtn(btn, btnX, btnY, btnW, btnH, true));
    hitZone.on('pointerout',  () => this._drawBtn(btn, btnX, btnY, btnW, btnH, false));
    hitZone.on('pointerdown', () => this.scene.start('TitleScene'));

    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('TitleScene'));
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('TitleScene'));

    this._spawnFireworks();
  }

  update() {
    const { width } = this.scale;
    this._ticker++;

    // Spawn fireworks every ~100 frames
    if (this._ticker % 100 === 0) this._spawnFireworks();

    // Advance fireworks
    this._fwGfx.clear();
    this._fireworks = this._fireworks.filter(fw => {
      fw.life--;
      if (fw.life <= 0) return false;
      const alpha = fw.life / fw.maxLife;
      fw.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.05;
        this._fwGfx.fillStyle(fw.color, alpha);
        this._fwGfx.fillCircle(p.x, p.y, 3);
      });
      return true;
    });

    // Walk Bennett (and Mallory) right; wrap back to left edge
    this._bx += 1.2;
    if (this._bx > width + 80) this._bx = -80;

    this.bennettSprite.setX(this._bx);
    this.malloryWinSprite.setPosition(this._bx, this._by - this._benH * 0.62);
  }

  _spawnFireworks() {
    const { width, height } = this.scale;
    const colors = [0xff4444, 0xf7c948, 0x44ff88, 0x44aaff, 0xff88ff, 0xffffff];
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(60, width - 60);
      const y = Phaser.Math.Between(40, height * 0.55);
      const color = Phaser.Utils.Array.GetRandom(colors);
      const maxLife = Phaser.Math.Between(40, 70);
      const count = Phaser.Math.Between(14, 22);
      const particles = [];
      for (let j = 0; j < count; j++) {
        const angle = (j / count) * Math.PI * 2;
        const speed = Phaser.Math.FloatBetween(1.5, 3.5);
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
      }
      this._fireworks.push({ color, life: maxLife, maxLife, particles });
    }
  }

  _drawBtn(gfx, x, y, w, h, hover) {
    gfx.clear();
    gfx.fillStyle(hover ? 0xffe066 : 0xf7c948).fillRoundedRect(x - w/2, y - h/2, w, h, 12);
    gfx.lineStyle(3, 0x3a1a06).strokeRoundedRect(x - w/2, y - h/2, w, h, 12);
  }
}
