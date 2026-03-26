/**
 * WinScene — shown after Mallory frees Bennett.
 * Displays fireworks and a PLAY AGAIN button.
 */
export default class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WinScene' });
    this._fireworks = [];
    this._ticker = 0;
  }

  create() {
    const { width, height } = this.scale;

    // Sky
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a2e);

    this.add.text(width / 2, height * 0.22, 'YOU DID IT!', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '68px',
      color: '#f7c948',
      stroke: '#3a1a06',
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.40, 'Bennett is free!\nMallory & Bennett ride into the sunset.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5);

    // Fireworks graphics layer
    this._fwGfx = this.add.graphics();

    // PLAY AGAIN button
    const btnX = width / 2;
    const btnY = height * 0.78;
    const btnW = 220;
    const btnH = 52;

    const btn = this.add.graphics();
    this._drawBtn(btn, btnX, btnY, btnW, btnH, false);

    this.add.text(btnX, btnY, 'PLAY AGAIN', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '26px',
      color: '#3a1a06',
    }).setOrigin(0.5);

    const hitZone = this.add.zone(btnX, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
    hitZone.on('pointerover', () => this._drawBtn(btn, btnX, btnY, btnW, btnH, true));
    hitZone.on('pointerout',  () => this._drawBtn(btn, btnX, btnY, btnW, btnH, false));
    hitZone.on('pointerdown', () => this.scene.start('TitleScene'));

    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('TitleScene'));
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('TitleScene'));

    this._spawnFireworks();
  }

  update() {
    this._ticker++;
    if (this._ticker % 100 === 0) this._spawnFireworks();  // respawn every ~100 frames

    this._fwGfx.clear();
    this._fireworks = this._fireworks.filter(fw => {
      fw.life--;
      if (fw.life <= 0) return false;
      fw.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // tiny gravity
        const alpha = fw.life / fw.maxLife;
        this._fwGfx.fillStyle(fw.color, alpha);
        this._fwGfx.fillCircle(p.x, p.y, 3);
      });
      return true;
    });
  }

  _spawnFireworks() {
    const { width, height } = this.scale;
    const colors = [0xff4444, 0xf7c948, 0x44ff88, 0x44aaff, 0xff88ff, 0xffffff];
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(60, width - 60);
      const y = Phaser.Math.Between(40, height * 0.55);
      const color = Phaser.Utils.Array.GetRandom(colors);
      const maxLife = Phaser.Math.Between(40, 70);
      const particles = [];
      const count = Phaser.Math.Between(14, 22);
      for (let j = 0; j < count; j++) {
        const angle = (j / count) * Math.PI * 2;
        const speed = Phaser.Math.FloatBetween(1.5, 3.5);
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
      }
      this._fireworks.push({ x, y, color, life: maxLife, maxLife, particles });
    }
  }

  _drawBtn(gfx, x, y, w, h, hover) {
    gfx.clear();
    gfx.fillStyle(hover ? 0xffe066 : 0xf7c948)
       .fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    gfx.lineStyle(3, 0x3a1a06)
       .strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
  }
}
