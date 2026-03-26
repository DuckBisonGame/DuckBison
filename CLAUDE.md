# CLAUDE.md — DuckBison Project

## Project Overview
DuckBison is a 2D Mario-style platformer built by Rose Kaslow and her son Zack.
- **Hero:** Mallory the Mallard — brown body, green head, cowboy hat
- **Goal:** Save Bennett the Bison, locked in a cage at the end of Level 1
- **Prototype:** HTML5 Canvas v17 — COMPLETE, all features working
- **Next step:** Phaser.js build in VS Code using Claude Code Pro

---

## Team
- **Rose** — project owner, uses Claude + Claude Code Pro, no hand-coding, Windows/PowerShell/VS Code
- **Zack** — game designer and co-creator, provides design feedback
- **Claude** — code generation

---

## ✅ Prototype v17 — Feature Complete

All gameplay features are implemented and confirmed working:

| Feature | Status |
|---------|--------|
| Land → Water → Land world (3800px) | ✅ |
| Scrolling camera | ✅ |
| Mallory walk / swim / fly / ride animations | ✅ |
| 2-second flight cap + fly bar | ✅ |
| Fly ceiling at y=60 | ✅ |
| Mountain slope collision (land only, fly over snow peak) | ✅ |
| Campfire obstacles | ✅ |
| Water swimming + diving (DOWN/UP) | ✅ |
| Water buoyancy | ✅ |
| Snapper surface hunter | ✅ |
| Cage solid collision | ✅ |
| Key in air left of cage, jump to grab | ✅ |
| Touch cage left side to free Bennett | ✅ |
| Bennett walks right on win (natively right-facing draw) | ✅ |
| Mallory rides Bennett's back facing right (separate draw fn, no flip) | ✅ |
| Both face same direction in win sequence | ✅ |
| Fireworks on win | ✅ |
| Background fish fixed to water zone | ✅ |
| Water predators clamped to water zone | ✅ |
| All buttons drawn on canvas (no HTML buttons) | ✅ |
| Gold star invincibility, speed boost, silver coins | ✅ |
| Snake, raccoon, fox, coyote, hawk, eagle, pike, bass, snapper | ✅ |

---

## World Layout — Level 1

```
[LAND: x=0–1200] → [WATER: x=1200–2400] → [LAND: x=2400–3800]
```

### Key constants
| Constant | Value | Notes |
|----------|-------|-------|
| `LAND_Y` | 310 | Ground level |
| `WATER_SURFACE` | 240 | Duck floats here |
| `WATER_FLOOR` | 410 | Max dive depth |
| `FLY_CEILING` | 60 | Max fly height |
| `MOUNTAIN_H` | 130 | Peak at y=180, must fly above |
| `CAGE_X` | WORLD_W-280 | = 3520 |
| `CAGE_Y` | LAND_Y-115 | = 195 |
| `KEY_X` | CAGE_X-20 | = 3500 |
| `KEY_Y` | LAND_Y-140 | = 170, jump to reach |

### Controls
| Key | Action |
|-----|--------|
| RIGHT/LEFT | Walk / swim |
| UP | Fly (2 sec max) / swim up |
| DOWN | Dive underwater |

---

## Characters

### Mallory the Mallard
- Body `#8B5E3C`, wing `#6B4020`, speculum `#2255AA`
- White neck ring, green head `#1A6B1A`, bill `#C8C820`
- Brown cowboy hat with gold band
- Orange legs `#FFA500`
- **Win sequence:** `drawMalloryOnBennett()` — separate function, NO flip, always right-facing

### Bennett the Bison
- Body `#5C3010`, hump `#6B3A14`, shaggy front `#3A1A06`
- Dark head `#1E0A02`, tan horns `#D4C080`
- **Caged:** `drawBennettCaged()` — left-facing draw, normal
- **Free (win):** `drawBennettFree()` — completely separate right-facing draw
  - Head, eye, hump, horns, muzzle explicitly positioned on RIGHT side
  - Tail on LEFT side
  - No `ctx.scale` used — avoids all center-point flip bugs

### Win Sequence Flow
1. `winGame()` → `gameState='won'`, fireworks spawn
2. `bennett.vx=2.2` (walks right), `duck.onBennett=true` (immediate)
3. Each frame: `duck.x = bennett.x+24`, `duck.y = bennett.y+10`
4. `drawBennettFree()` first, then `drawMallory()` (which calls `drawMalloryOnBennett()`)
5. Both drawn natively right-facing — no flipping involved
6. Camera follows duck.x
7. Fireworks respawn every 100 frames

---

## Obstacles

### Mountains
- Positions: `{x:900, w:100}` and `{x:2900, w:110}` — both on LAND, never in water
- Height: 130px, peak at y=180
- Collision: slope-based `mSurfY(m, wx)` — samples duck bottom, pushes up onto slope
- Side blocks only at base (y > LAND_Y-30)
- Flying over: FLY_CEILING=60 is above peak y=180, so duck can fly freely over

### Campfires
- `{x:550, h:95}` and `{x:2600, h:100}` — both on land
- Kill on contact unless invincible

### Cage
- Solid AABB: `solidCollide(CAGE_X, CAGE_Y, CAGE_W, CAGE_H)`
- Cage dimensions: 105×115px

---

## Predators

### Land
| Type | Start X | Speed | Range |
|------|---------|-------|-------|
| Snake | 400, 700 | 1.0, 0.9 | 120, 100 |
| Raccoon | 2500 | 1.1 | 160 |
| Fox | 2750 | 1.3 | 180 |
| Coyote | 3200 | 1.4 | 200 |

### Air
| Type | Start X | Y | Speed |
|------|---------|---|-------|
| Hawk | 350 | 80 | 2.2 |
| Eagle | 1600 | 90 | 2.5 |
Both bob up/down between y=60–110.

### Water (all clamped to `minX: WATER_START+10`, `maxX: WATER_END-50`)
| Type | Start X | Depth | Behavior |
|------|---------|-------|----------|
| Pike | 1400 | +60 | Patrol |
| Bass | 1900 | +90 | Patrol |
| Snapper | 1600 | +10 | **Surface hunter** — chases when duck at surface within 180px, dive to escape |

---

## Background Decorative Fish
Fixed world positions — never scroll outside water:
```js
const BG_FISH = [
  {wx:1350, y:WATER_SURFACE+55},
  {wx:1550, y:WATER_SURFACE+70},
  {wx:1750, y:WATER_SURFACE+45},
  {wx:1950, y:WATER_SURFACE+65},
  {wx:2150, y:WATER_SURFACE+50},
  {wx:2300, y:WATER_SURFACE+60},
];
```
Draw condition: `sx > wl-20 && sx < wr+20` (only when screen-x is inside visible water area).

---

## Rewards & Powerups
| Item | World X | Effect | Duration |
|------|---------|--------|----------|
| Gold star | 300, 1800 | Invincibility | 360 frames |
| Speed boost | 650, 2700 | Speed 5.5 | 270 frames |
| Silver coins | Various | +1 count | — |
| Cage key | CAGE_X-20 | Required to free Bennett | — |

---

## Session History

| Session | Work Done |
|---------|-----------|
| 1 | Full prototype from scratch — world, characters, predators, rewards, win/death |
| 2 | Zack Round 1: Mallory colours, Bennett rename, jump cap, diving, snapper, eye fix, campfire, 2-sec flight |
| 3 | Zack Round 2: mountains to land only, slope collision, solid cage, key mechanic, win sequence |
| 4 | Mountain in water fixed; fly-over-mountain collision rebuilt (slope-based, no ceiling block) |
| 5 | Key height fixed (jumpable); mountain fly-over refined; Bennett exit + Mallory ride rebuilt |
| 6 | Bennett facing fix: rewrote `drawBennettFree()` as native right-facing draw (no flip); fish fixed to water zone with `BG_FISH` array |

---

## 🚀 Phaser.js Build Plan

### Prerequisites (do these before opening VS Code)
- [ ] Create GitHub repo named `duckbison` (public or private, Rose's account)
- [ ] Install Node.js if not already installed (nodejs.org — LTS version)
- [ ] Have VS Code open with Claude Code Pro active

### Phase 1 — Project Scaffold
In VS Code with Claude Code Pro, ask Claude Code to:
```
Scaffold a Phaser.js 3 project using Vite as the bundler.
Project name: duckbison
Include: TypeScript (optional, or plain JS is fine)
Structure: src/scenes/, src/sprites/, src/assets/
Install dependencies and confirm it runs with npm run dev
```

### Phase 2 — Asset Creation (do before coding)
Use these free tools to create game assets:

| Asset | Tool | Notes |
|-------|------|-------|
| Mallory sprite sheet | Piskel (piskelapp.com) | Walk (4fr), swim (4fr), fly (4fr), idle (1fr) — 48×48px recommended |
| Bennett sprite | Piskel | Walk (4fr), idle (1fr) — 96×64px |
| Predator sprites | Piskel | One sprite each: snake, raccoon, fox, coyote, hawk, eagle, pike, bass, snapper |
| Tileset | Piskel or LibreSprite | Land tile, water tile, grass edge, shore tile — 32×32px |
| Key, star, coin, boost | Piskel | Simple 32×32px icons |
| Level 1 map | Tiled Map Editor (mapeditor.org) | Use your tileset, export as JSON for Phaser |
| Sound effects | Bfxr (bfxr.net) | Jump, collect coin, splash, death, win |
| Animal sounds | Freesound.org | Optional: quack, bison grunt |

### Phase 3 — Core Phaser Scenes
Ask Claude Code to implement these scenes in order:

1. **BootScene** — load all assets (images, spritesheets, tilemaps, audio)
2. **TitleScene** — title screen with START button
3. **GameScene** — main gameplay (see Game Design Spec below)
4. **DeadScene** — death screen with TRY AGAIN
5. **WinScene** — win screen with fireworks and Bennett/Mallory ride

### Phase 4 — GameScene Implementation Order
Give Claude Code these tasks one at a time:

1. Load tilemap (Tiled JSON), set up camera bounds
2. Add Mallory sprite with Arcade Physics, basic movement (LEFT/RIGHT)
3. Add jump (UP key), gravity, land on ground tiles
4. Add fly mechanic (hold UP, 2-sec cap, fly bar HUD)
5. Add water zone detection, swim/dive physics
6. Add mountains with slope tiles (or polygon colliders in Tiled)
7. Add cage as static physics body
8. Add floating key, jump to collect
9. Add Bennett in cage, win trigger on cage touch with key
10. Add all predators with patrol AI
11. Add snapper surface-hunter AI
12. Add powerups (star, boost, coins)
13. Add campfire hazard
14. Add win sequence (Bennett walks, Mallory rides, fireworks)
15. Add HUD (coins, timer, fly bar)
16. Add sound effects

### Phase 5 — Polish
- Parallax background layers (sky, clouds, hills)
- Particle effects (coin collect, death, win)
- Camera shake on death
- High score / best time tracking (localStorage)
- Mobile touch controls (optional)

---

## Game Design Spec (reference for Phaser build)

### Physics values to replicate
| Parameter | Value |
|-----------|-------|
| Walk speed | 3.5 (normal), 5.5 (boosted) |
| Jump velocity | -6 (initial), -0.6/frame (held) |
| Gravity (land) | 0.5/frame |
| Gravity (water) | 0.10/frame |
| Water drag vx | ×0.88/frame |
| Water drag vy | ×0.82/frame |
| Buoyancy | vy -= 0.12 when idle in water |
| Fly duration | 120 frames max |
| Invincibility | 360 frames |
| Speed boost | 270 frames |

### Zones
| Zone | X range | Y range |
|------|---------|---------|
| Left land | 0–1200 | ground at y=310 |
| Water | 1200–2400 | surface y=240, floor y=410 |
| Right land | 2400–3800 | ground at y=310 |

---

## Free Tools Reference
| Tool | Purpose | URL |
|------|---------|-----|
| Phaser.js 3 | Game engine | phaser.io |
| Piskel | Pixel art & sprite animation | piskelapp.com |
| LibreSprite | Desktop sprite editor | libresprite.github.io |
| Tiled | Level map editor | mapeditor.org |
| Bfxr | Retro sound effects | bfxr.net |
| Freesound | Animal/ambient sounds | freesound.org |
| Bing Image Creator | AI reference art | bing.com/create |
| Node.js | Required for Vite/Phaser | nodejs.org |
