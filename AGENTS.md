# Asteroids — Agent Notes

- Pure HTML5 Canvas + vanilla JS (`game.js`, 423 lines). No build, no bundler, no dependencies, no `package.json`.
- Open `index.html` directly in browser, or serve: `npx serve .` → `http://localhost:3000`.
- Canvas fixed at 800×600 (`W`, `H` in `game.js`). All game logic is in that single file; no modules.
- Key mechanics (verify in `game.js`): screen-wrap (`wrap`), asteroid split (`split`), particle explosions (`explode`), 3 lives with 3s invincibility flicker, score/level progression (`nextLevel`), bullet TTL 1.1s.
- No tests, lint, typecheck, or CI. Changes are verified by opening `index.html` and playing.
