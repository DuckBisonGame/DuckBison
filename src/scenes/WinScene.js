/**
 * WinScene — Bennett walks right (natively right-facing, no flip),
 * Mallory rides his back also facing right. Fireworks burst continuously.
 */

// Colour palettes (duplicated here — WinScene has no import from GameScene)
const C_BEN_BODY  = 0x5C3010;
const C_BEN_HUMP  = 0x6B3A14;
const C_BEN_FRONT = 0x3A1A06;
const C_BEN_HEAD  = 0x1E0A02;
const C_BEN_HORN  = 0xD4C080;

const C_BODY    = 0x8B5E3C;
const C_WING    = 0x6B4020;
const C_NECK    = 0xFFFFFF;
const C_HEAD    = 0x1A6B1A;
const C_BILL    = 0xC8C820;
const C_HAT     = 0x4A2810;
const C_HATBAND = 0xD4A017;

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

    // Characters layer
    this._charGfx = this.add.graphics().setDepth(2);

    // Bennett starts off left edge, walks right
    this._bx = -60;
    this._by = height * 0.74;  // feet at ground level

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

    this._charGfx.clear();
    this._drawBennettFree(this._charGfx, this._bx, this._by);
    this._drawMalloryOnBennett(this._charGfx, this._bx, this._by);
  }

  // ── Bennett — natively right-facing (head on RIGHT, tail on LEFT) ──────────
  // bx/by = feet anchor (centre-bottom of body)
  _drawBennettFree(gfx, bx, by) {
    // Body
    gfx.fillStyle(C_BEN_BODY).fillEllipse(bx, by - 26, 68, 40);

    // Hump (back = left side for right-facing bison)
    gfx.fillStyle(C_BEN_HUMP).fillEllipse(bx - 20, by - 44, 34, 28);

    // Shaggy front / chest (right side, near head)
    gfx.fillStyle(C_BEN_FRONT).fillEllipse(bx + 36, by - 24, 28, 44);

    // Head (right side)
    gfx.fillStyle(C_BEN_HEAD).fillEllipse(bx + 44, by - 36, 28, 22);

    // Horns (above head, right side)
    gfx.fillStyle(C_BEN_HORN);
    gfx.fillRect(bx + 38, by - 54,  4, 14);  // left horn (on head)
    gfx.fillRect(bx + 36, by - 54, 10,  4);
    gfx.fillRect(bx + 48, by - 54,  4, 14);  // right horn
    gfx.fillRect(bx + 46, by - 54, 12,  4);

    // Eye (right side of head)
    gfx.fillStyle(0xFFFFFF).fillCircle(bx + 48, by - 40, 3);
    gfx.fillStyle(0x111111).fillCircle(bx + 48, by - 40, 1.5);

    // Muzzle (far right)
    gfx.fillStyle(C_BEN_FRONT).fillEllipse(bx + 53, by - 28, 14, 10);

    // Tail (left side)
    gfx.fillStyle(C_BEN_BODY);
    gfx.fillRect(bx - 38, by - 32, 6, 14);
    gfx.fillStyle(0x3A1A06).fillEllipse(bx - 38, by - 20, 10, 14);

    // Legs (walking bob using ticker)
    const legSwing = Math.sin(this._ticker * 0.12) * 4;
    gfx.fillStyle(0x4A2010);
    gfx.fillRect(bx - 24, by - 10 + legSwing,  5, 10);
    gfx.fillRect(bx - 12, by - 10 - legSwing,  5, 10);
    gfx.fillRect(bx +  8, by - 10 + legSwing,  5, 10);
    gfx.fillRect(bx + 20, by - 10 - legSwing,  5, 10);
  }

  // ── Mallory on Bennett's back — right-facing, no flip ──────────────────────
  // Positioned on top of Bennett's back (left/rear area of bison)
  _drawMalloryOnBennett(gfx, bx, by) {
    const mx = bx - 10;   // slightly left of bison centre (on back)
    const my = by - 52;   // sitting atop the hump

    // Body
    gfx.fillStyle(C_BODY).fillEllipse(mx, my - 10, 22, 18);
    gfx.fillStyle(C_WING).fillEllipse(mx + 1, my - 10, 17, 14);

    // Neck
    gfx.fillStyle(C_NECK).fillEllipse(mx, my - 20, 11, 7);

    // Head
    gfx.fillStyle(C_HEAD).fillCircle(mx + 1, my - 26, 8);

    // Bill (facing right)
    gfx.fillStyle(C_BILL);
    gfx.fillRect(mx + 7, my - 29, 7, 3);
    gfx.fillRect(mx + 7, my - 26, 7, 3);

    // Eye
    gfx.fillStyle(0xFFFFFF).fillCircle(mx + 5, my - 27, 2);
    gfx.fillStyle(0x111111).fillCircle(mx + 5, my - 27, 1);

    // Cowboy hat
    const hb = my - 35;
    gfx.fillStyle(C_HAT);
    gfx.fillRect(mx - 10, hb,      22,  3);
    gfx.fillRect(mx -  5, hb - 10, 13, 10);
    gfx.fillStyle(C_HATBAND).fillRect(mx - 5, hb - 1, 13, 2);
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
