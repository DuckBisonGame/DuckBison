/**
 * GameScene — all 10 fixes applied.
 */

// ── World constants ────────────────────────────────────────────────────────────
export const WORLD_W       = 3800;
export const WORLD_H       = 450;
export const LAND_Y        = 310;
export const WATER_START   = 1200;
export const WATER_END     = 2400;
export const WATER_SURFACE = 240;
export const WATER_FLOOR   = 410;
export const FLY_CEILING   = 60;
export const MOUNTAIN_H    = 130;
export const FLY_DURATION  = 120;

export const CAGE_W = 105;
export const CAGE_H = 115;
export const CAGE_X = WORLD_W - 280;
export const CAGE_Y = LAND_Y - CAGE_H;
export const KEY_X  = CAGE_X - 20;
export const KEY_Y  = LAND_Y - 140;

// ── Static obstacle data ───────────────────────────────────────────────────────
const MOUNTAINS = [{ x: 900, w: 100 }, { x: 2900, w: 110 }];
const CAMPFIRES = [{ x: 550, h: 95  }, { x: 2600, h: 100 }];

// ── Colour palettes ────────────────────────────────────────────────────────────
const C_BODY    = 0x8B5E3C;
const C_WING    = 0x6B4020;
const C_SPEC    = 0x2255AA;
const C_NECK    = 0xFFFFFF;
const C_HEAD    = 0x1A6B1A;
const C_BILL    = 0xC8C820;
const C_HAT     = 0x4A2810;
const C_HATBAND = 0xD4A017;
const C_LEG     = 0xFFA500;

const C_BEN_BODY  = 0x5C3010;
const C_BEN_HUMP  = 0x6B3A14;
const C_BEN_FRONT = 0x3A1A06;
const C_BEN_HEAD  = 0x1E0A02;
const C_BEN_HORN  = 0xD4C080;

// ── Mountain slope helper (module-level) ──────────────────────────────────────
function mSurfY(m, wx) {
  if (wx < m.x || wx > m.x + m.w) return LAND_Y;
  const peakX = m.x + m.w / 2;
  const peakY = LAND_Y - MOUNTAIN_H;
  if (wx <= peakX) {
    return LAND_Y - ((wx - m.x) / (peakX - m.x)) * MOUNTAIN_H;
  } else {
    return LAND_Y - (1 - (wx - peakX) / (m.x + m.w - peakX)) * MOUNTAIN_H;
  }
}

export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  // ── create ──────────────────────────────────────────────────────────────────
  create() {
    this._drawWorld();
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cursors = this.input.keyboard.createCursorKeys();

    this.duck = {
      x: 80, y: LAND_Y,
      vx: 0, vy: 0,
      facing: 1,
      onGround: true,
      jumpHeld: false, jumpFrames: 0,
      flyFrames: 0, isFlying: false,
      underwater: false, prevInWater: false,
      stepTimer: 0,
    };

    this.malloryGfx       = this.add.graphics();
    this.malloryContainer = this.add.container(this.duck.x, this.duck.y, [this.malloryGfx]).setDepth(5);
    this.cameras.main.startFollow(this.malloryContainer, true, 0.1, 0);

    this.itemsGfx = this.add.graphics().setDepth(3);
    this.predGfx  = this.add.graphics().setDepth(4);

    // ── Game state ─────────────────────────────────────────────────────────
    this.coins      = 0;
    this.hasKey     = false;
    this.keyCollected = false;
    this.invincible = false;
    this.boosted    = false;
    this.invTimer   = 0;
    this.boostTimer = 0;
    this._tick      = 0;

    // ── Coins (26 total: 8 left land, 5 water surface, 5 underwater, 8 right land) ──
    this.coinData = [
      {x:200,  y:LAND_Y-30},        {x:310,  y:LAND_Y-30},
      {x:450,  y:LAND_Y-30},        {x:610,  y:LAND_Y-30},
      {x:730,  y:LAND_Y-30},        {x:840,  y:LAND_Y-30},
      {x:1000, y:LAND_Y-30},        {x:1100, y:LAND_Y-30},
      {x:1350, y:WATER_SURFACE-22}, {x:1500, y:WATER_SURFACE-22},
      {x:1700, y:WATER_SURFACE-22}, {x:1950, y:WATER_SURFACE-22},
      {x:2200, y:WATER_SURFACE-22},
      {x:1400, y:WATER_SURFACE+80}, {x:1600, y:WATER_SURFACE+80},
      {x:1800, y:WATER_SURFACE+80}, {x:2050, y:WATER_SURFACE+80},
      {x:2280, y:WATER_SURFACE+80},
      {x:2500, y:LAND_Y-30},        {x:2660, y:LAND_Y-30},
      {x:2810, y:LAND_Y-30},        {x:2960, y:LAND_Y-30},
      {x:3060, y:LAND_Y-30},        {x:3160, y:LAND_Y-30},
      {x:3310, y:LAND_Y-30},        {x:3430, y:LAND_Y-30},
    ].map(c => ({ ...c, collected: false }));

    // ── Powerups ────────────────────────────────────────────────────────────
    this.powerups = [
      { type:'star',  x:300,  y:LAND_Y-60,        collected:false },
      { type:'star',  x:1800, y:WATER_SURFACE-28,  collected:false },
      { type:'boost', x:650,  y:LAND_Y-60,         collected:false },
      { type:'boost', x:2700, y:LAND_Y-60,         collected:false },
    ];

    // ── Enemies ─────────────────────────────────────────────────────────────
    this.enemies = [
      // land
      { type:'snake',   x:400,  y:LAND_Y,            vx: 1.0, startX:400,  range:120, killR:15 },
      { type:'snake',   x:700,  y:LAND_Y,            vx:-0.9, startX:700,  range:100, killR:15 },
      { type:'raccoon', x:2500, y:LAND_Y,            vx: 1.1, startX:2500, range:160, killR:20 },
      { type:'fox',     x:2750, y:LAND_Y,            vx: 1.3, startX:2750, range:180, killR:20 },
      { type:'coyote',  x:3200, y:LAND_Y,            vx:-1.4, startX:3200, range:200, killR:22 },
      // air
      { type:'hawk',  x:350,  y:80, vx: 2.2, startX:350,  range:300, killR:22, bobT:0 },
      { type:'eagle', x:1600, y:90, vx: 2.5, startX:1600, range:300, killR:25, bobT:Math.PI },
      // water
      { type:'pike',    x:1400, y:WATER_SURFACE+60, vx: 1.2, startX:1400, range:300, killR:20 },
      { type:'bass',    x:1900, y:WATER_SURFACE+90, vx: 1.0, startX:1900, range:300, killR:20 },
      { type:'snapper', x:1600, y:WATER_SURFACE+10, vx: 1.5, startX:1600, range:200, killR:18 },
    ];

    this._buildHUD();
  }

  // ── update ──────────────────────────────────────────────────────────────────
  update(_time, delta) {
    const fdt  = delta / 16.667;
    const duck = this.duck;
    const cur  = this.cursors;
    this._tick++;

    // Timers
    if (this.invTimer > 0) {
      this.invTimer -= fdt;
      if (this.invTimer <= 0) { this.invincible = false; this.invTimer = 0; }
    }
    if (this.boostTimer > 0) {
      this.boostTimer -= fdt;
      if (this.boostTimer <= 0) { this.boosted = false; this.boostTimer = 0; }
    }

    const inWater = duck.x > WATER_START && duck.x < WATER_END;

    // Zone transitions
    if (inWater && !duck.prevInWater) {
      if (duck.y > WATER_SURFACE) { duck.y = WATER_SURFACE; duck.vy = 0; }
      duck.flyFrames = 0; duck.jumpHeld = false; duck.isFlying = false;
    }
    if (!inWater && duck.prevInWater) {
      if (duck.y > LAND_Y) { duck.y = LAND_Y; duck.vy = 0; duck.onGround = true; }
    }
    duck.prevInWater = inWater;

    // Horizontal movement
    const speed = this.boosted ? 5.5 : 3.5;
    if      (cur.left.isDown)  { duck.vx = -speed; duck.facing = -1; }
    else if (cur.right.isDown) { duck.vx =  speed; duck.facing =  1; }
    else                       { duck.vx = 0; }

    if (inWater) {
      // ── Water physics ──────────────────────────────────────────────────
      if (cur.up.isDown)   duck.vy -= 0.3  * fdt;
      if (cur.down.isDown) duck.vy += 0.3  * fdt;
      duck.vy += 0.10 * fdt;
      duck.vx *= Math.pow(0.88, fdt);
      duck.vy *= Math.pow(0.82, fdt);
      if (!cur.up.isDown && !cur.down.isDown) duck.vy -= 0.12 * fdt;

      duck.x += duck.vx * fdt;
      duck.y += duck.vy * fdt;

      if (duck.y <= WATER_SURFACE) { duck.y = WATER_SURFACE; duck.vy = Math.max(0, duck.vy); duck.onGround = true; }
      else                         { duck.onGround = false; }
      if (duck.y >= WATER_FLOOR)   { duck.y = WATER_FLOOR;   duck.vy = Math.min(0, duck.vy); }

      duck.isFlying  = false;
      duck.underwater = duck.y > WATER_SURFACE + 2;

    } else {
      // ── Land physics ───────────────────────────────────────────────────
      duck.underwater = false;

      if (Phaser.Input.Keyboard.JustDown(cur.up) && duck.onGround) {
        duck.vy = -6; duck.onGround = false; duck.jumpHeld = true; duck.jumpFrames = 0;
      }

      const flyAvail = !duck.onGround && duck.flyFrames < FLY_DURATION;
      duck.isFlying  = cur.up.isDown && flyAvail;

      if (duck.isFlying) {
        duck.vy = -2.0; duck.flyFrames += fdt; duck.jumpHeld = false;
      } else {
        if (cur.up.isDown && duck.jumpHeld && duck.jumpFrames < 20) {
          duck.vy -= 0.6 * fdt; duck.jumpFrames += fdt;
        }
        if (!cur.up.isDown) duck.jumpHeld = false;
        duck.vy += 0.5 * fdt;
      }

      duck.x += duck.vx * fdt;
      duck.y += duck.vy * fdt;

      if (duck.y < FLY_CEILING) { duck.y = FLY_CEILING; duck.vy = 0; }

      // ── Mountain collision ────────────────────────────────────────────────
      // Slope and side walls are mutually exclusive (if/else).
      // Side walls block at ground level so Mallory must jump to get over.
      duck.onGround = false;
      for (const m of MOUNTAINS) {
        if (duck.x >= m.x && duck.x <= m.x + m.w) {
          // On slope footprint — push up to slope surface
          const sy = mSurfY(m, duck.x);
          if (duck.y >= sy) {
            duck.y = sy;
            if (duck.vy > 0) duck.vy = 0;
            duck.onGround = true;
            duck.jumpHeld = false;
            duck.flyFrames = 0;
          }
        } else if (duck.y > LAND_Y - 40) {
          // Near ground — solid walls at mountain base (must jump to bypass)
          if (duck.x < m.x && duck.x > m.x - 18 && duck.vx > 0) {
            duck.x = m.x - 4; duck.vx = 0;
          }
          if (duck.x > m.x + m.w && duck.x < m.x + m.w + 18 && duck.vx < 0) {
            duck.x = m.x + m.w + 4; duck.vx = 0;
          }
        }
      }

      // Flat ground
      if (!duck.onGround && duck.y >= LAND_Y) {
        duck.y = LAND_Y; duck.vy = 0; duck.onGround = true; duck.jumpHeld = false; duck.flyFrames = 0;
      }

      // ── Campfire AABB death ───────────────────────────────────────────────
      // Box: cf.x ±18 horizontal, LAND_Y down to LAND_Y-cf.h vertical.
      // Duck feet (duck.y) must be below the flame top to take damage.
      if (!this.invincible) {
        for (const cf of CAMPFIRES) {
          if (Math.abs(duck.x - cf.x) < 18 && duck.y > LAND_Y - cf.h) {
            this.scene.start('DeadScene'); return;
          }
        }
      }
    }

    duck.x = Phaser.Math.Clamp(duck.x, 16, WORLD_W - 16);

    // ── Step timer ──────────────────────────────────────────────────────────
    if (duck.onGround && !inWater && Math.abs(duck.vx) > 0.5) {
      duck.stepTimer += fdt;          // walking
    } else if (!inWater && !duck.onGround) {
      duck.stepTimer += fdt;          // flying (wing flap)
    } else if (inWater) {
      duck.stepTimer += fdt;          // swimming paddle
    } else {
      duck.stepTimer = 0;             // standing still
    }

    // ── Collectibles ────────────────────────────────────────────────────────
    if (!this.keyCollected && Math.abs(duck.x - KEY_X) < 16 && Math.abs(duck.y - KEY_Y) < 18) {
      this.keyCollected = true; this.hasKey = true;
    }
    if (this.hasKey && duck.x > CAGE_X - 22 && duck.x < CAGE_X + 15 &&
        duck.y > CAGE_Y && duck.y < CAGE_Y + CAGE_H) {
      this.scene.start('WinScene'); return;
    }
    for (const c of this.coinData) {
      if (!c.collected && Math.abs(duck.x - c.x) < 14 && Math.abs(duck.y - c.y) < 14) {
        c.collected = true; this.coins++;
      }
    }
    for (const p of this.powerups) {
      if (!p.collected && Math.abs(duck.x - p.x) < 18 && Math.abs(duck.y - p.y) < 18) {
        p.collected = true;
        if (p.type === 'star')  { this.invincible = true; this.invTimer   = 360; }
        else                    { this.boosted    = true; this.boostTimer = 270; }
      }
    }

    // ── Enemies ─────────────────────────────────────────────────────────────
    if (this._updateEnemies(fdt, duck, inWater)) return;

    // ── Draw state ───────────────────────────────────────────────────────────
    let drawState;
    if (inWater)                            drawState = duck.underwater ? 'dive' : 'swim';
    else if (duck.isFlying)                 drawState = 'fly';    // UP held + energy
    else if (!duck.onGround)                drawState = 'stand';  // plain jump, no wings
    else if (Math.abs(duck.vx) > 0.5)      drawState = 'walk';
    else                                    drawState = 'stand';

    this.malloryContainer.setPosition(duck.x, duck.y);
    this.malloryContainer.scaleX = duck.facing;
    this.malloryContainer.setAlpha(this.invincible && Math.floor(this._tick / 4) % 2 === 0 ? 0.3 : 1.0);
    this._drawMallory(this.malloryGfx, duck.stepTimer, drawState);

    this._drawItems();

    // HUD
    this.hudCoins.setText(`Coins: ${this.coins}`);
    this.hudKey.setText(`Key: ${this.hasKey ? 'YES ✓' : 'NO'}`);
    const flyPct = Math.max(0, 1 - duck.flyFrames / FLY_DURATION);
    this.hudFlyBar.scaleX    = flyPct;
    this.hudFlyBar.fillColor = flyPct > 0 ? 0x44AAFF : 0xFF4444;
    this.hudFlyLabel.setAlpha(flyPct > 0 ? 1 : 0.45);
  }

  // ── Enemy AI & draw ─────────────────────────────────────────────────────────
  // Returns true if duck died (caller should return immediately).
  _updateEnemies(fdt, duck, inWater) {
    const gfx = this.predGfx;
    gfx.clear();

    for (const e of this.enemies) {
      const isWater = (e.type === 'pike' || e.type === 'bass' || e.type === 'snapper');
      const isAir   = (e.type === 'hawk' || e.type === 'eagle');

      // Snapper: surface-hunt if duck is floating
      if (e.type === 'snapper' && inWater && duck.y <= WATER_SURFACE + 8 && Math.abs(duck.x - e.x) < 180) {
        e.vx = duck.x > e.x ? Math.abs(e.vx) : -Math.abs(e.vx);
      }

      // Patrol bounce
      if (e.x < e.startX - e.range / 2) e.vx =  Math.abs(e.vx);
      if (e.x > e.startX + e.range / 2) e.vx = -Math.abs(e.vx);
      e.x += e.vx * fdt;

      // Water predator x clamp
      if (isWater) e.x = Phaser.Math.Clamp(e.x, WATER_START + 10, WATER_END - 50);

      // Air bob
      if (isAir) {
        e.bobT = (e.bobT || 0) + 0.03 * fdt;
        e.y = (e.type === 'hawk' ? 80 : 90) + Math.sin(e.bobT) * 20;
      }

      // Death collision
      if (!this.invincible) {
        const dx = duck.x - e.x;
        const dy = duck.y - e.y;
        if (Math.sqrt(dx * dx + dy * dy) < e.killR + 10) {
          if (isWater && inWater)    { this.scene.start('DeadScene'); return true; }
          if (!isWater && !isAir && !inWater) { this.scene.start('DeadScene'); return true; }
          if (isAir && !inWater)     { this.scene.start('DeadScene'); return true; }
        }
      }

      this._drawEnemy(gfx, e);
    }
    return false;
  }

  _drawEnemy(gfx, e) {
    const x = e.x, y = e.y;
    const f = e.vx >= 0 ? 1 : -1;   // facing: 1=right, -1=left

    switch (e.type) {
      case 'snake': {
        gfx.fillStyle(0x226622).fillEllipse(x, y - 4, 22, 8);
        gfx.fillEllipse(x + f * 10, y - 8, 14, 8);
        gfx.fillStyle(0x44AA44).fillEllipse(x + f * 17, y - 10, 13, 9);
        gfx.fillStyle(0xFF0000).fillRect(x + f * 22, y - 11, f * 5, 2);
        break;
      }
      case 'raccoon': {
        gfx.fillStyle(0x888888).fillEllipse(x, y - 14, 26, 22);
        gfx.fillStyle(0x555555).fillEllipse(x + f * 12, y - 19, 16, 14);
        gfx.fillStyle(0x111111).fillRect(x + f * 10, y - 23, f * 8, 5);
        gfx.fillStyle(0xCCCCCC).fillEllipse(x + f * 17, y - 15, 8, 6);
        gfx.fillStyle(0x666666).fillEllipse(x - f * 14, y - 9, 8, 20);
        gfx.fillStyle(0x333333);
        gfx.fillRect(x - f * 16, y - 18, 4, 4);
        gfx.fillRect(x - f * 16, y - 10, 4, 4);
        break;
      }
      case 'fox': {
        gfx.fillStyle(0xCC5500).fillEllipse(x, y - 14, 30, 20);
        gfx.fillStyle(0xCC5500).fillEllipse(x + f * 14, y - 20, 18, 14);
        gfx.fillStyle(0xCC5500).fillPoints([
          {x: x + f * 10, y: y - 28}, {x: x + f * 16, y: y - 28}, {x: x + f * 13, y: y - 37},
        ], true);
        gfx.fillStyle(0xFFCC88).fillEllipse(x + f * 18, y - 17, 10, 7);
        gfx.fillStyle(0xCC5500).fillEllipse(x - f * 16, y - 7, 14, 18);
        gfx.fillStyle(0xFFFFFF).fillEllipse(x - f * 16, y - 2, 8, 8);
        break;
      }
      case 'coyote': {
        gfx.fillStyle(0xAA8844).fillEllipse(x, y - 16, 36, 22);
        gfx.fillStyle(0xAA8844).fillEllipse(x + f * 16, y - 22, 20, 15);
        gfx.fillStyle(0xAA8844).fillPoints([
          {x: x + f * 12, y: y - 30}, {x: x + f * 18, y: y - 30}, {x: x + f * 15, y: y - 40},
        ], true);
        gfx.fillPoints([
          {x: x + f * 20, y: y - 28}, {x: x + f * 26, y: y - 28}, {x: x + f * 23, y: y - 38},
        ], true);
        gfx.fillStyle(0xCCAA66).fillEllipse(x + f * 20, y - 18, 10, 7);
        gfx.fillStyle(0xAA8844);
        [-10, -2, 6, 14].forEach(ox => gfx.fillRect(x + ox, y - 8, 5, 8));
        break;
      }
      case 'hawk': {
        gfx.fillStyle(0x885533).fillEllipse(x, y, 28, 12);
        gfx.fillPoints([{x:x-20,y:y+4},{x:x,y:y-4},{x:x-4,y:y+8}], true);
        gfx.fillPoints([{x:x+20,y:y+4},{x:x,y:y-4},{x:x+4,y:y+8}], true);
        gfx.fillStyle(0xFFCC88).fillEllipse(x + f * 12, y - 2, 10, 8);
        gfx.fillStyle(0xDDAA00).fillRect(x + f * 16, y, f * 5, 3);
        break;
      }
      case 'eagle': {
        gfx.fillStyle(0x221100).fillEllipse(x, y, 32, 14);
        gfx.fillPoints([{x:x-24,y:y+6},{x:x,y:y-6},{x:x-4,y:y+10}], true);
        gfx.fillPoints([{x:x+24,y:y+6},{x:x,y:y-6},{x:x+4,y:y+10}], true);
        gfx.fillStyle(0xFFFFFF).fillEllipse(x + f * 14, y - 2, 12, 10);
        gfx.fillStyle(0xDDAA00).fillRect(x + f * 18, y + 1, f * 6, 3);
        break;
      }
      case 'pike': {
        gfx.fillStyle(0x1A5522).fillEllipse(x, y, 36, 10);
        gfx.fillPoints([
          {x:x-f*18,y:y},{x:x-f*26,y:y-7},{x:x-f*26,y:y+7},
        ], true);
        gfx.fillStyle(0x117733).fillEllipse(x + f * 14, y, 12, 8);
        gfx.fillStyle(0xFFFFFF).fillRect(x + f * 16, y - 1, f * 5, 2);
        break;
      }
      case 'bass': {
        gfx.fillStyle(0x336644).fillEllipse(x, y, 30, 14);
        gfx.fillPoints([
          {x:x-f*15,y:y},{x:x-f*22,y:y-8},{x:x-f*22,y:y+8},
        ], true);
        gfx.fillStyle(0x44AA66).fillEllipse(x + f * 12, y, 10, 10);
        gfx.fillStyle(0x225533).fillPoints([
          {x:x,y:y-7},{x:x+f*5,y:y-7},{x:x+f*2,y:y-14},
        ], true);
        break;
      }
      case 'snapper': {
        gfx.fillStyle(0x334422).fillEllipse(x, y, 28, 18);
        gfx.fillStyle(0x556633).fillEllipse(x, y, 22, 14);
        gfx.fillStyle(0x223311).fillEllipse(x + f * 14, y + 2, 16, 10);
        gfx.fillStyle(0x334422);
        gfx.fillRect(x - 8, y + 6, 5, 6);
        gfx.fillRect(x + 4, y + 6, 5, 6);
        gfx.fillRect(x - 14, y - 4, 5, 8);
        gfx.fillRect(x + 10, y - 4, 5, 8);
        break;
      }
    }
  }

  // ── Items (coins, powerups, key) ────────────────────────────────────────────
  _drawItems() {
    const gfx = this.itemsGfx;
    gfx.clear();

    // Key
    if (!this.keyCollected) {
      const kx = KEY_X, ky = KEY_Y;
      gfx.fillStyle(0xC8C820).fillCircle(kx, ky, 8);
      gfx.fillStyle(0xAA7800).fillCircle(kx, ky, 4);
      gfx.fillStyle(0xC8C820);
      gfx.fillRect(kx + 3, ky, 3, 9);
      gfx.fillRect(kx + 3, ky + 6, 7, 2);
      gfx.fillRect(kx + 3, ky + 9, 5, 2);
    }

    // Coins
    for (const c of this.coinData) {
      if (!c.collected) {
        gfx.fillStyle(0xF7C948).fillCircle(c.x, c.y, 7);
        gfx.fillStyle(0xDDAA00).fillCircle(c.x, c.y, 4);
      }
    }

    // Powerups
    for (const p of this.powerups) {
      if (p.collected) continue;
      if (p.type === 'star') {
        gfx.fillStyle(0xFFDD00).fillCircle(p.x, p.y, 13);
        gfx.fillStyle(0xFFAA00).fillCircle(p.x, p.y, 8);
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          gfx.fillStyle(0xFFDD00).fillCircle(p.x + Math.cos(a) * 12, p.y + Math.sin(a) * 12, 4);
        }
      } else {
        // Speed boost — blue circle with white lightning bolt
        gfx.fillStyle(0x2299FF).fillCircle(p.x, p.y, 13);
        gfx.fillStyle(0xFFFFFF).fillPoints([
          {x:p.x+3, y:p.y-11}, {x:p.x-2, y:p.y-1}, {x:p.x+3, y:p.y-1},
          {x:p.x-3, y:p.y+11}, {x:p.x+2, y:p.y+1}, {x:p.x-3, y:p.y+1},
        ], true);
      }
    }
  }

  // ── Mallory drawing ─────────────────────────────────────────────────────────
  // Always drawn facing RIGHT. Container.scaleX = duck.facing flips for left.
  // (0,0) = duck feet / anchor (bottom centre on land; water-surface level in water).
  _drawMallory(gfx, stepTimer, state) {
    gfx.clear();
    const isDive   = (state === 'dive');
    const inWater  = (state === 'swim' || isDive);
    const isFlying = (state === 'fly');

    // ── Flying wings — drawn FIRST (behind body) ───────────────────────────
    // Only 'fly' state (UP held + energy remaining). Math.sin gives wing flap.
    if (isFlying) {
      const wA     = Math.sin(stepTimer * 0.4);   // -1..1
      const spread = 20 + wA * 12;                // 8..32 px each side
      const tipY   = -26 + wA * 10;              // -36 upstroke → -16 downstroke
      gfx.fillStyle(C_WING);
      gfx.fillPoints([{x: 4,y:-30},{x: 4+spread,y:tipY},{x: 4,y:-18}], true);
      gfx.fillPoints([{x:-4,y:-30},{x:-4-spread,y:tipY},{x:-4,y:-18}], true);
      gfx.fillStyle(C_SPEC);
      gfx.fillPoints([{x: 4,y:-27},{x: 4+spread*0.65,y:tipY+4},{x: 4,y:-22}], true);
      gfx.fillPoints([{x:-4,y:-27},{x:-4-spread*0.65,y:tipY+4},{x:-4,y:-22}], true);
    }

    // ── Webbed feet — dive only, drawn before body so body overlaps legs ───
    // kick = Math.sin(stepTimer*0.35): right/left feet alternate ±7 px.
    if (isDive) {
      gfx.fillStyle(C_LEG);
      const kick = Math.sin(stepTimer * 0.35) * 7;
      // Right foot
      gfx.fillRect( 3,  kick,     4, 8);    // upper leg
      gfx.fillRect( 1,  kick + 6, 9, 3);   // webbed foot
      // Left foot (opposite phase)
      gfx.fillRect(-7, -kick,     4, 8);
      gfx.fillRect(-9, -kick + 6, 9, 3);
    }

    // ── Land legs & feet (not flying, not in water) ────────────────────────
    if (!inWater && !isFlying) {
      gfx.fillStyle(C_LEG);
      if (state === 'walk') {
        const s = Math.sin(stepTimer * 0.3) * 10;   // ±10 px stride
        gfx.fillRect( 2 + s, -14, 4, 14);           // right shin
        gfx.fillRect( s,      -3, 8,  3);           // right foot
        gfx.fillRect(-6 - s, -14, 4, 14);           // left shin
        gfx.fillRect(-8 - s,  -3, 8,  3);           // left foot
      } else {
        gfx.fillRect(-7, -13, 4, 13);  gfx.fillRect(-9, -3, 7, 3);
        gfx.fillRect( 3, -13, 4, 13);  gfx.fillRect( 2, -3, 7, 3);
      }
    }

    // ── Body, neck, head ───────────────────────────────────────────────────
    // swim (surface): bodyY=0 → centre at water-surface, exactly half-submerged.
    // dive (underwater): bodyY=-10 → duck fully below surface, legs visible below.
    // land/fly: bodyY=-22 → upright posture above ground.
    let bodyY, neckY, headY;
    if (isDive)        { bodyY = -10; neckY = -20; headY = -28; }
    else if (inWater)  { bodyY =   0; neckY = -12; headY = -20; }
    else               { bodyY = -22; neckY = -31; headY = -37; }

    const bW = inWater ? 32 : 28,  bH = inWater ? 18 : 24;
    gfx.fillStyle(C_BODY).fillEllipse(0, bodyY, bW, bH);
    gfx.fillStyle(C_WING).fillEllipse(0, bodyY - 2, inWater ? 26 : 23, inWater ? 13 : 18);
    gfx.fillStyle(C_SPEC).fillRect(-3, bodyY - (inWater ? 5 : 4), 13, inWater ? 5 : 6);

    // Neck ring
    gfx.fillStyle(C_NECK).fillEllipse(0, neckY, 13, 8);

    // Head
    gfx.fillStyle(C_HEAD).fillCircle(2, headY, 9);

    // Bill
    gfx.fillStyle(C_BILL);
    gfx.fillRect(9, headY - 3, 8, 3);
    gfx.fillRect(9, headY + 1, 8, 3);

    // Eye
    gfx.fillStyle(0xFFFFFF).fillCircle(6, headY - 2, 2);
    gfx.fillStyle(0x111111).fillCircle(6, headY - 2, 1);

    // Cowboy hat (land & fly only — hat comes off underwater)
    if (!inWater) {
      const hb = headY - 10;
      gfx.fillStyle(C_HAT);
      gfx.fillRect(-11, hb,      24,  4);
      gfx.fillRect( -6, hb - 11, 14, 11);
      gfx.fillStyle(C_HATBAND).fillRect(-6, hb - 1, 14, 2);
    }
  }

  // ── World background (drawn once in create) ─────────────────────────────────
  _drawWorld() {
    const gfx = this.add.graphics().setDepth(0);

    gfx.fillStyle(0x4878B8).fillRect(0, 0, WORLD_W, 200);
    gfx.fillStyle(0x87CEEB).fillRect(0, 200, WORLD_W, LAND_Y - 200);

    gfx.fillStyle(0x1860A0)
       .fillRect(WATER_START, WATER_SURFACE, WATER_END - WATER_START, WATER_FLOOR - WATER_SURFACE);
    gfx.fillStyle(0x4DB8E8, 0.5)
       .fillRect(WATER_START, WATER_SURFACE, WATER_END - WATER_START, 12);

    gfx.fillStyle(0x3A5C1E).fillRect(0,          LAND_Y, WATER_START,        WORLD_H - LAND_Y);
    gfx.fillStyle(0x4E8A28).fillRect(0,          LAND_Y, WATER_START,        8);
    gfx.fillStyle(0x3A5C1E).fillRect(WATER_END,  LAND_Y, WORLD_W - WATER_END, WORLD_H - LAND_Y);
    gfx.fillStyle(0x4E8A28).fillRect(WATER_END,  LAND_Y, WORLD_W - WATER_END, 8);

    gfx.fillStyle(0xC8A44A);
    gfx.fillRect(WATER_START - 28, LAND_Y - 6, 56, 14);
    gfx.fillRect(WATER_END   - 28, LAND_Y - 6, 56, 14);

    MOUNTAINS.forEach(m  => this._drawMountain(gfx, m));
    CAMPFIRES.forEach(cf => this._drawCampfire(gfx, cf));
    this._drawCage(gfx);
  }

  _drawMountain(gfx, m) {
    const peakX = m.x + m.w / 2, peakY = LAND_Y - MOUNTAIN_H;
    gfx.fillStyle(0x7A7A8C).fillPoints(
      [{x:m.x,y:LAND_Y},{x:m.x+m.w,y:LAND_Y},{x:peakX,y:peakY}], true);
    gfx.fillStyle(0x5A5A6C).fillPoints(
      [{x:peakX,y:peakY},{x:m.x+m.w,y:LAND_Y},{x:peakX+m.w*0.1,y:LAND_Y}], true);
    const snowH = 28, snowHW = (m.w / 2) * (snowH / MOUNTAIN_H);
    gfx.fillStyle(0xF0F0FF).fillPoints(
      [{x:peakX-snowHW,y:peakY+snowH},{x:peakX+snowHW,y:peakY+snowH},{x:peakX,y:peakY}], true);
  }

  _drawCampfire(gfx, cf) {
    const bx = cf.x, by = LAND_Y, fh = cf.h - 6;
    gfx.fillStyle(0x5C3010);
    gfx.fillRect(bx - 14, by - 5,  28, 5);
    gfx.fillRect(bx - 5,  by - 16,  5, 16);
    gfx.fillRect(bx + 1,  by - 16,  5, 16);
    [{col:0xDD1100,wf:1.00,hf:1.00},{col:0xFF4400,wf:0.75,hf:0.80},
     {col:0xFF8800,wf:0.50,hf:0.58},{col:0xFFCC00,wf:0.28,hf:0.34}]
    .forEach(f => {
      gfx.fillStyle(f.col).fillPoints([
        {x:bx-10*f.wf,y:by-5},{x:bx+10*f.wf,y:by-5},{x:bx,y:by-5-fh*f.hf},
      ], true);
    });
  }

  _drawCage(gfx) {
    const x = CAGE_X, y = CAGE_Y, w = CAGE_W, h = CAGE_H;
    gfx.fillStyle(0x1A0800).fillRect(x + 5, y + 6, w - 10, h - 12);

    const bx = x + 62, by = y + h - 12;
    gfx.fillStyle(C_BEN_BODY).fillEllipse(bx - 5, by - 26, 68, 40);
    gfx.fillStyle(C_BEN_HUMP).fillEllipse(bx + 20, by - 44, 34, 28);
    gfx.fillStyle(C_BEN_FRONT).fillEllipse(bx - 36, by - 24, 28, 44);
    gfx.fillStyle(C_BEN_HEAD).fillEllipse(bx - 44, by - 36, 28, 22);
    gfx.fillStyle(C_BEN_HORN);
    gfx.fillRect(bx - 52, by - 54,  4, 14);
    gfx.fillRect(bx - 58, by - 54, 10,  4);
    gfx.fillRect(bx - 42, by - 54,  4, 14);
    gfx.fillRect(bx - 46, by - 54, 12,  4);
    gfx.fillStyle(0xFFFFFF).fillCircle(bx - 48, by - 40, 3);
    gfx.fillStyle(0x111111).fillCircle(bx - 48, by - 40, 1.5);
    gfx.fillStyle(C_BEN_FRONT).fillEllipse(bx - 53, by - 28, 14, 10);
    gfx.fillStyle(0x4A2010);
    gfx.fillRect(bx - 28, by - 10, 5, 10);
    gfx.fillRect(bx - 18, by - 10, 5, 10);
    gfx.fillRect(bx +  4, by - 10, 5, 10);
    gfx.fillRect(bx + 14, by - 10, 5, 10);

    gfx.fillStyle(0x888888).fillRect(x - 4, y,         w + 8, 6);
    gfx.fillStyle(0x666666).fillRect(x,     y + h - 6, w,     6);
    gfx.fillStyle(0x999999);
    for (let i = 0; i <= 6; i++) {
      gfx.fillRect(x + Math.round((w / 6) * i) - 3, y, 5, h);
    }
  }

  _buildHUD() {
    const sw = this.scale.width;
    const style = {
      fontFamily: 'Arial, sans-serif', fontSize: '18px',
      color: '#ffffff', stroke: '#000000', strokeThickness: 3,
    };
    this.hudCoins    = this.add.text(16, 14, 'Coins: 0', style).setScrollFactor(0).setDepth(20);
    this.hudKey      = this.add.text(16, 38, 'Key: NO',  style).setScrollFactor(0).setDepth(20);
    this.hudFlyLabel = this.add.text(sw - 156, 14, 'FLY', style).setScrollFactor(0).setDepth(20);
    this.add.rectangle(sw - 52, 24, 100, 14, 0x222222).setScrollFactor(0).setDepth(20);
    this.hudFlyBar = this.add.rectangle(sw - 102, 24, 100, 14, 0x44AAFF)
      .setScrollFactor(0).setDepth(21).setOrigin(0, 0.5);
  }
}
