# Asteroids

A clone of the classic arcade game **Asteroids**, implemented using pure HTML5 Canvas with no dependencies or bundlers.

## Description

Pilot a spaceship through an asteroid field featuring screen wrapping (toroidal space). Destroy asteroids to score points: large ones split into medium ones, and medium ones into small ones. Includes special power-ups and unique asteroid types, such as the shooting star.

## Technologies

- **HTML5 Canvas** — 2D rendering
- **JavaScript (ES6+)** — game logic contained in a single `game.js` file
- No frameworks, no bundlers, no dependencies

## How to Run

Open `index.html` directly in your browser (double-click), or use a local server:

```bash
npx serve .
```

Then visit `http://localhost:3000`.

## Controls

| Key       | Action      |
| --------- | ----------- |
| `←` `→`   | Rotate ship |
| `↑`       | Thrust      |
| `Space`   | Shoot       |
| `Space` + `Shift` (hold 2s, release) | Fire a **triple shot** burst (3 bullets) |
| `Space` + `Alt/Option` (⌥, hold 3s, release) | Fire a **super shoot** (double damage, 3 per level) |

## Scoring

| Asteroid      | Points |
| ------------- | ------ |
| Large         | 20     |
| Medium        | 50     |
| Small         | 100    |
| Shooting star | 1000   |

## Features

- 3 lives with temporary invincibility upon respawning (flicker effect)
- Asteroids split into smaller fragments when destroyed
- **Shield**: complete an asteroid chain (a large asteroid plus all of its fragments) to gain a 5-second shield that absorbs one hit from an asteroid. A glowing cyan ring around your ship shows the remaining time.
- **Triple shot**: hold `Space` + `Shift` for 2s to charge, then **release to fire** a burst of 3 bullets in quick succession. Releasing before the charge is full cancels it. A charge glow builds up behind the ship and a message appears when it's ready.
- **Super shoot**: hold `Space` + `Alt`/`Option` (`⌥`) for 3s to charge, then **release the keys to fire** a big shot that vaporizes an entire asteroid chain at once (double damage). Releasing before the bar is full cancels the charge. You get 3 super shoots per level — track them via the cyan HUD icons and charge bar.
- Explosion particles when destroying asteroids
- A blue shooting star suddenly streaks across the screen at random intervals — shoot it for 1000 points before it fades away or flies off-screen
