/**
 * GameScene — main gameplay scene.
 * Phase 4, Steps 1–3: world rendering, Mallory sprite, movement, jump, camera.
 *
 * Physics are manual (no Arcade Physics body on the duck) so they match the
 * v17 prototype values exactly.  All units are px/frame at 60 fps; fdt
 * (frame-delta multiplier) keeps motion frame-rate-independent.
 */

// ── World constants ──────────────────────────────────────────────────────────
export const WORLD_W        = 3800;
export const WORLD_H        = 450;
export const LAND_Y         = 310;   // ground surface (duck feet rest here)
export const WATER_START    = 1200;
export const WATER_END      = 2400;
export const WATER_SURFACE  = 240;   // duck floats at this y when in water
export const WATER_FLOOR    = 410;
export const FLY_CEILING    = 60;
export const MOUNTAIN_H     = 130;   // peak at LAND_Y - 130 = 180

export const CAGE_W = 105;
export const CAGE_H = 115;
export const CAGE_X = WORLD_W - 280;   // 3520
export const CAGE_Y = LAND_Y - CAGE_H; // 195
export const KEY_X  = CAGE_X - 20;     // 3500
export const KEY_Y  = LAND_Y - 140;    // 170 — jump to reach

// ── Static obstacle data ─────────────────────────────────────────────────────
const MOUNTAINS = [
  { x: 900,  w: 100 },
  { x: 2900, w: 110 },
];
const CAMPFIRES = [
  { x: 550 },
  { x: 2600 },
];

// ── Mallory colour palette (exact from v17 prototype) ────────────────────────
const C_BODY     = 0x8B5E3C;
const C_WING     = 0x6B4020;
const C_SPEC     = 0x2255AA;  // speculum (blue wing stripe)
const C_NECK     = 0xFFFFFF;  // white neck ring
const C_HEAD     = 0x1A6B1A;  // green head
const C_BILL     = 0xC8C820;  // yellow bill
const C_HAT      = 0x4A2810;  // dark brown hat
const C_HATBAND  = 0xD4A017;  // gold hat band
const C_LEG      = 0xFFA500;  // orange legs / feet

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  // ── create ──────────────────────────────────────────────────────────────────
  create() {
    // World background (static, drawn once)
    this._drawWorld();

    // Camera bounds — world is wider than the 800 px viewport
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    // Arrow keys
    this.cursors = this.input.keyboard.createCursorKeys();

    // ── Duck physics state (mirrors v17 prototype duck object) ─────────────────
    this.duck = {
      x: 80,
      y: LAND_Y,
      vx: 0,
      vy: 0,
      facing:   1,      // 1 = right, -1 = left
      onGround: true,
      jumpHeld: false,
      jumpFrames: 0,    // frames UP has been held during current jump
    };

    // ── Mallory rendering ──────────────────────────────────────────────────────
    // Container sits at duck world position; all drawing is relative to (0,0)
    // which equals duck feet.  scaleX = facing flips the sprite left/right.
    this.malloryGfx       = this.add.graphics();
    this.malloryContainer = this.add.container(this.duck.x, this.duck.y, [this.malloryGfx])
                                .setDepth(5);

    // Camera follows the container with a small lerp for smoothness
    this.cameras.main.startFollow(this.malloryContainer, true, 0.1, 0);

    // ── HUD ────────────────────────────────────────────────────────────────────
    this._buildHUD();

    // ── Game state ─────────────────────────────────────────────────────────────
    this.coins     = 0;
    this.hasKey    = false;
    this.flyFrames = 0;      // frames of fly used (0–120)
    this.invincible = false;
    this.boosted    = false;
  }

  // ── update ──────────────────────────────────────────────────────────────────
  update(_time, delta) {
    // fdt: how many 60-fps frames fit in this tick (1.0 at steady 60 fps)
    const fdt  = delta / 16.667;
    const duck = this.duck;
    const cur  = this.cursors;

    // ── Horizontal movement ────────────────────────────────────────────────────
    if (cur.left.isDown) {
      duck.vx     = -3.5;
      duck.facing = -1;
    } else if (cur.right.isDown) {
      duck.vx     = 3.5;
      duck.facing = 1;
    } else {
      duck.vx = 0;
    }

    // ── Jump (UP key) ──────────────────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(cur.up) && duck.onGround) {
      duck.vy         = -6;   // initial jump impulse (px/frame)
      duck.onGround   = false;
      duck.jumpHeld   = true;
      duck.jumpFrames = 0;
    }
    // Variable-height jump: hold UP to extend rise (max 20 frames, -0.6/frame)
    if (cur.up.isDown && duck.jumpHeld && duck.jumpFrames < 20) {
      duck.vy         -= 0.6 * fdt;
      duck.jumpFrames += fdt;
    }
    if (!cur.up.isDown) {
      duck.jumpHeld = false;
    }

    // ── Gravity ────────────────────────────────────────────────────────────────
    // Apply every tick; ground collision will zero vy when landed.
    duck.vy += 0.5 * fdt;   // land gravity: 0.5 px/frame²

    // ── Apply velocity ─────────────────────────────────────────────────────────
    duck.x += duck.vx * fdt;
    duck.y += duck.vy * fdt;

    // ── Ground collision ───────────────────────────────────────────────────────
    // In the water zone use WATER_SURFACE so the duck floats; everywhere else
    // use LAND_Y.  Full swim / dive physics come in Phase 4 Step 5.
    const inWater = duck.x > WATER_START && duck.x < WATER_END;
    const floorY  = inWater ? WATER_SURFACE : LAND_Y;

    if (duck.y >= floorY) {
      duck.y        = floorY;
      duck.vy       = 0;
      duck.onGround = true;
      duck.jumpHeld = false;
    } else {
      duck.onGround = false;
    }

    // Keep duck within world horizontal bounds
    duck.x = Phaser.Math.Clamp(duck.x, 16, WORLD_W - 16);

    // ── Sync Mallory container to duck position ────────────────────────────────
    this.malloryContainer.setPosition(duck.x, duck.y);
    this.malloryContainer.scaleX = duck.facing;   // -1 flips sprite left

    // Redraw Mallory every frame so animations can be added later
    this._drawMallory(this.malloryGfx);

    // ── HUD refresh ───────────────────────────────────────────────────────────
    this.hudCoins.setText(`Coins: ${this.coins}`);
    this.hudKey.setText(`Key: ${this.hasKey ? 'YES ✓' : 'NO'}`);
    // Fly bar fills left→right; shrinks as flyFrames increases
    const flyPct = Math.max(0, 1 - this.flyFrames / 120);
    this.hudFlyBar.scaleX = flyPct;
  }

  // ── Mallory drawing ──────────────────────────────────────────────────────────
  // Always drawn facing RIGHT.  The container's scaleX = -1 handles left-facing.
  // (0, 0) = feet / bottom-centre of sprite.
  _drawMallory(gfx) {
    gfx.clear();

    // ── Legs ─────────────────────────────────────────────────────────────────
    gfx.fillStyle(C_LEG);
    gfx.fillRect(-7, -11, 4, 11);   // left leg
    gfx.fillRect(3,  -11, 4, 11);   // right leg
    // Feet (small horizontal bars)
    gfx.fillRect(-9, -3, 6, 3);     // left foot
    gfx.fillRect(2,  -3, 6, 3);     // right foot

    // ── Body ──────────────────────────────────────────────────────────────────
    gfx.fillStyle(C_BODY);
    gfx.fillEllipse(0, -22, 28, 24);

    // ── Wing (slightly darker, offset toward back) ────────────────────────────
    gfx.fillStyle(C_WING);
    gfx.fillEllipse(1, -22, 22, 19);

    // ── Speculum (blue stripe on wing) ───────────────────────────────────────
    gfx.fillStyle(C_SPEC);
    gfx.fillRect(-1, -25, 10, 6);

    // ── White neck ring ───────────────────────────────────────────────────────
    gfx.fillStyle(C_NECK);
    gfx.fillEllipse(0, -33, 13, 8);

    // ── Green head ────────────────────────────────────────────────────────────
    gfx.fillStyle(C_HEAD);
    gfx.fillCircle(1, -39, 10);

    // ── Bill (right side of head, pointing right) ─────────────────────────────
    gfx.fillStyle(C_BILL);
    gfx.fillRect(9, -42, 10, 5);    // upper mandible
    gfx.fillRect(9, -38, 10, 3);    // lower mandible / jaw line

    // ── Eye (small white dot on head) ────────────────────────────────────────
    gfx.fillStyle(0xFFFFFF);
    gfx.fillCircle(5, -41, 2);
    gfx.fillStyle(0x000000);
    gfx.fillCircle(5, -41, 1);

    // ── Cowboy hat — brim ─────────────────────────────────────────────────────
    gfx.fillStyle(C_HAT);
    gfx.fillRect(-13, -51, 26, 4);  // wide brim

    // Hat crown
    gfx.fillRect(-7, -63, 17, 14);  // crown body

    // Hat band (gold stripe just above brim)
    gfx.fillStyle(C_HATBAND);
    gfx.fillRect(-7, -52, 17, 3);
  }

  // ── World background (drawn once in create) ──────────────────────────────────
  _drawWorld() {
    const gfx = this.add.graphics().setDepth(0);

    // Sky — two-tone gradient approximation
    gfx.fillStyle(0x4878B8);
    gfx.fillRect(0, 0, WORLD_W, 200);
    gfx.fillStyle(0x87CEEB);
    gfx.fillRect(0, 200, WORLD_W, LAND_Y - 200);

    // ── Water zone ────────────────────────────────────────────────────────────
    // Deep water body
    gfx.fillStyle(0x1860A0);
    gfx.fillRect(WATER_START, WATER_SURFACE, WATER_END - WATER_START,
                 WATER_FLOOR - WATER_SURFACE);
    // Surface shimmer strip
    gfx.fillStyle(0x4DB8E8, 0.5);
    gfx.fillRect(WATER_START, WATER_SURFACE, WATER_END - WATER_START, 12);

    // ── Ground — left land ────────────────────────────────────────────────────
    gfx.fillStyle(0x3A5C1E);
    gfx.fillRect(0, LAND_Y, WATER_START, WORLD_H - LAND_Y);
    gfx.fillStyle(0x4E8A28);
    gfx.fillRect(0, LAND_Y, WATER_START, 8);           // grass top

    // ── Ground — right land ───────────────────────────────────────────────────
    gfx.fillStyle(0x3A5C1E);
    gfx.fillRect(WATER_END, LAND_Y, WORLD_W - WATER_END, WORLD_H - LAND_Y);
    gfx.fillStyle(0x4E8A28);
    gfx.fillRect(WATER_END, LAND_Y, WORLD_W - WATER_END, 8);

    // ── Sandy shore transitions ───────────────────────────────────────────────
    gfx.fillStyle(0xC8A44A);
    gfx.fillRect(WATER_START - 28, LAND_Y - 6, 56, 14);
    gfx.fillRect(WATER_END   - 28, LAND_Y - 6, 56, 14);

    // ── Mountains ─────────────────────────────────────────────────────────────
    MOUNTAINS.forEach(m => this._drawMountain(gfx, m));

    // ── Campfires ─────────────────────────────────────────────────────────────
    CAMPFIRES.forEach(cf => this._drawCampfire(gfx, cf));

    // ── Cage ──────────────────────────────────────────────────────────────────
    this._drawCage(gfx);

    // ── Key (yellow circle with a notch) ─────────────────────────────────────
    gfx.fillStyle(C_BILL);
    gfx.fillCircle(KEY_X, KEY_Y, 8);
    gfx.fillStyle(0xAA7800);
    gfx.fillCircle(KEY_X, KEY_Y, 4);   // key hole ring
    gfx.fillStyle(C_BILL);
    gfx.fillRect(KEY_X + 3, KEY_Y, 3, 8);   // key shaft
    gfx.fillRect(KEY_X + 3, KEY_Y + 5, 6, 2); // key tooth
  }

  _drawMountain(gfx, m) {
    const peakX = m.x + m.w / 2;
    const peakY = LAND_Y - MOUNTAIN_H;   // y = 180

    // Mountain body (grey)
    gfx.fillStyle(0x7A7A8C);
    gfx.fillPoints([
      { x: m.x,        y: LAND_Y },
      { x: m.x + m.w,  y: LAND_Y },
      { x: peakX,      y: peakY  },
    ], true);

    // Rocky shading on right face
    gfx.fillStyle(0x5A5A6C);
    gfx.fillPoints([
      { x: peakX,          y: peakY },
      { x: m.x + m.w,      y: LAND_Y },
      { x: peakX + m.w * 0.1, y: LAND_Y },
    ], true);

    // Snow cap (top ~28 px of mountain)
    const snowH  = 28;
    const snowFrac = snowH / MOUNTAIN_H;
    const snowHW   = (m.w / 2) * snowFrac;
    gfx.fillStyle(0xF0F0FF);
    gfx.fillPoints([
      { x: peakX - snowHW, y: peakY + snowH },
      { x: peakX + snowHW, y: peakY + snowH },
      { x: peakX,          y: peakY         },
    ], true);
  }

  _drawCampfire(gfx, cf) {
    const bx = cf.x;
    const by = LAND_Y;

    // Logs (X shape)
    gfx.fillStyle(0x5C3010);
    gfx.fillRect(bx - 14, by - 5, 28, 5);   // horizontal log
    gfx.fillRect(bx - 5,  by - 16, 5, 16);  // left diagonal (simplified)
    gfx.fillRect(bx + 1,  by - 16, 5, 16);  // right diagonal

    // Flames — four layers, innermost brightest
    const flames = [
      { col: 0xDD1100, w: 18, h: 20 },
      { col: 0xFF4400, w: 14, h: 16 },
      { col: 0xFF8800, w: 10, h: 12 },
      { col: 0xFFCC00, w: 6,  h: 8  },
    ];
    flames.forEach(f => {
      gfx.fillStyle(f.col);
      gfx.fillPoints([
        { x: bx - f.w / 2, y: by - 5       },
        { x: bx + f.w / 2, y: by - 5       },
        { x: bx,           y: by - 5 - f.h },
      ], true);
    });
  }

  _drawCage(gfx) {
    const x = CAGE_X, y = CAGE_Y, w = CAGE_W, h = CAGE_H;

    // Floor slab
    gfx.fillStyle(0x666666);
    gfx.fillRect(x, y + h - 6, w, 6);

    // Roof slab
    gfx.fillStyle(0x888888);
    gfx.fillRect(x - 4, y, w + 8, 6);

    // Vertical bars (7 bars including end posts)
    gfx.fillStyle(0x999999);
    for (let i = 0; i <= 6; i++) {
      const bx = x + Math.round((w / 6) * i);
      gfx.fillRect(bx - 3, y, 5, h);
    }

    // Bennett placeholder inside cage (rough brown blob)
    gfx.fillStyle(0x5C3010);
    gfx.fillEllipse(x + w * 0.55, y + h - 30, 48, 38);
    gfx.fillStyle(0x1E0A02);
    gfx.fillCircle(x + w * 0.35, y + h - 46, 16);
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────
  _buildHUD() {
    const sw = this.scale.width;
    const style = {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    };

    this.hudCoins = this.add.text(16, 14, 'Coins: 0', style)
      .setScrollFactor(0).setDepth(20);
    this.hudKey = this.add.text(16, 38, 'Key: NO', style)
      .setScrollFactor(0).setDepth(20);

    // Fly bar (right side)
    this.add.text(sw - 158, 14, 'FLY', style)
      .setScrollFactor(0).setDepth(20);

    // Background track
    this.add.rectangle(sw - 54, 24, 100, 14, 0x222222)
      .setScrollFactor(0).setDepth(20);

    // Fill bar — origin at left edge so scaleX shrinks it rightward
    this.hudFlyBar = this.add.rectangle(sw - 104, 24, 100, 14, 0x44AAFF)
      .setScrollFactor(0).setDepth(21)
      .setOrigin(0, 0.5);
  }
}
