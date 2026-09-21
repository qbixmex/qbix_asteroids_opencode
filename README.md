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

## Scoring

| Asteroid | Points |
| -------- | ------ |
| Large    | 20     |
| Medium   | 50     |
| Small    | 100    |

## Features

- 3 lives with temporary invincibility upon respawning (flicker effect)
- Asteroids split into smaller fragments when destroyed
- Explosion particles when destroying asteroids
