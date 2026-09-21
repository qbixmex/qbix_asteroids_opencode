# General Overview

## Project Structure

- **index.html** — Entry point. Loads `game.js` (deferred) and a `<canvas>` element (800×600).
- **game.js** — Single-file game logic (~423 lines). All classes, game loop, and mechanics live here.
- **styles.css** — Minimal styling: black background, centered canvas, 1px border.
- **favicon.svg** — Page favicon.

## How It Works

- Pure HTML5 Canvas + vanilla JavaScript (ES6+). No frameworks, bundlers, or dependencies.
- Main loop uses `requestAnimationFrame` with a fixed timestep (`dt` capped at 0.05s).
- Each frame calls `update(dt)` (game logic) then `draw()` (rendering).
- State machine: `'playing'` → `'dead'` (respawn timer) → `'playing'`, or `'gameover'` (Space to restart).

## Core Systems

| System | Details |
|--------|---------|
| **Input** | `keydown`/`keyup` listeners; `justPressed` for one-shot actions |
| **Screen wrap** | `wrap(v, max)` — toroidal space (edges connect) |
| **Ship** | Rotate (`←` `→`), thrust (`↑`), shoot (`Space`); 3 lives, 3s invincibility with flicker |
| **Bullets** | Spawn at ship nose, travel at 520 px/s, TTL 1.1s |
| **Asteroids** | 3 sizes (large=3, medium=2, small=1); split into 2 smaller on destruction; speed/radius vary by size |
| **Particles** | Explosion fragments; fade out based on life ratio |
| **Scoring** | Small=100, Medium=50, Large=20 points |
| **Levels** | Start with 4 asteroids; each level adds 3 + level number |
| **Collisions** | Bullet-asteroid: destroy both, split asteroid, add score. Ship-asteroid: kill ship (unless invincible) |

## Key Constants

- Canvas: **W = 800**, **H = 600**
- Asteroid radii by size: `[0, 16, 30, 50]`
- Asteroid speeds by size: `[0, 85, 55, 32]` px/s
- Ship rotation: 3.5 rad/s; Thrust: 260 px/s²; Drag: 0.987
- Bullet speed: 520 px/s; TTL: 1.1s
- Invincibility duration: 3 seconds
- Safe spawn radius from center: 130px

## Running

Open `index.html` directly in a browser, or serve locally:

```bash
npx serve .
```

Then visit `http://localhost:3000`.

## Notes

- No build step, tests, lint, or CI — verification is by playing in a browser.
- All code is in `game.js` with no module system; every class is globally scoped.
