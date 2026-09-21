'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

/* ================================= INPUT ================================= */
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

/* =================================== UTILS =================================== */
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const hexToRgb = hex => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/* ================================== BULLET ================================== */
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ============================== ASTEROID ============================== */
const RADII  = [0, 16, 30, 50];  // by size 1, 2, 3
const SPEEDS = [0, 85, 55, 32];  // speed based by size
const POINTS = [0, 100, 50, 20]; // points by size

class Asteroid {
  constructor(x, y, size = 3, chainId = 0) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;
    this.chainId = chainId;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Irregular Polygon
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    const children = [
      new Asteroid(this.x, this.y, this.size - 1, this.chainId),
      new Asteroid(this.x, this.y, this.size - 1, this.chainId),
    ];
    chainState.set(this.chainId, chainState.get(this.chainId) + 2);
    return children;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

/* ========================= SHOOTING STAR ========================= */
const STAR_POINTS    = 1000;
const STAR_LIFETIME  = 30;       // seconds — fades out in place if still on screen
const STAR_MIN_SPEED = 150;      // px/s — faster than asteroids (~100 max)
const STAR_MAX_SPEED = 200;

// Draws a 5-pointed star path centered at (x, y)
function starPath(ctx, x, y, outer, inner) {
  ctx.beginPath();
  let rot = -Math.PI / 2;
  const step = Math.PI / 5;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    ctx.lineTo(x + Math.cos(rot) * r, y + Math.sin(rot) * r);
    rot += step;
  }
  ctx.closePath();
}

class ShootingStar {
  constructor() {
    // Spawn at a random edge, cross to a random point on the opposite edge
    const edge = randInt(0, 3);
    let tx, ty;
    if (edge === 0)      { this.x = rand(0, W); this.y = 0;         tx = rand(0, W);   ty = H; }
    else if (edge === 1) { this.x = W;          this.y = rand(0, H); tx = 0;           ty = rand(0, H); }
    else if (edge === 2) { this.x = rand(0, W); this.y = H;         tx = rand(0, W);   ty = 0; }
    else                 { this.x = 0;          this.y = rand(0, H); tx = W;           ty = rand(0, H); }

    const angle = Math.atan2(ty - this.y, tx - this.x);
    const speed = rand(STAR_MIN_SPEED, STAR_MAX_SPEED);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.radius  = 10;   // hit radius
    this.trail   = [];   // recent positions, for the streak
    this.age     = 0;
    this.fading  = false;
    this.fadeTtl = 0;
    this.alpha   = 1;
    this.dead    = false;
  }

  update(dt) {
    if (this.dead) return;
    this.age += dt;

    if (!this.fading) {
      this.trail.push([this.x, this.y]);
      if (this.trail.length > 14) this.trail.shift();
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    // 30-second cap: stop and fade out in place
    if (!this.fading && this.age >= STAR_LIFETIME) {
      this.fading  = true;
      this.fadeTtl = 0.6;
    }
    if (this.fading) {
      this.fadeTtl -= dt;
      this.alpha = Math.max(0, this.fadeTtl / 0.6);
      if (this.fadeTtl <= 0) this.dead = true;
      return;
    }

    // Fully off the screen (with margin for the trail) → gone
    const M = 50;
    if (this.x < -M || this.x > W + M || this.y < -M || this.y > H + M) this.dead = true;
  }

  draw() {
    const headX = this.x;
    const headY = this.y;

    // Streak trail
    for (let i = 1; i < this.trail.length; i++) {
      const t = i / this.trail.length;
      const [x0, y0] = this.trail[i - 1];
      const [x1, y1] = this.trail[i];
      ctx.strokeStyle = `rgba(110, 195, 255, ${(this.alpha * t * 0.7).toFixed(2)})`;
      ctx.lineWidth   = t * 3 + 0.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    // Soft outer glow
    ctx.save();
    ctx.globalAlpha = this.alpha * 0.35;
    ctx.fillStyle = '#59b6ff';
    starPath(ctx, headX, headY, 16, 7);
    ctx.fill();

    // Bright core
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = '#dff2ff';
    starPath(ctx, headX, headY, 10, 4.5);
    ctx.fill();
    ctx.restore();
  }
}

/* ========================= SHIP ========================= */
const CHARGE_TIME    = 2.0;  // segundos sosteniendo Shift+Space para cargar la ráfaga
const BURST_SHOTS    = 3;    // disparos por ráfaga
const BURST_INTERVAL = 0.1;  // segundos entre disparos de la ráfaga

class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x         = W / 2;
    this.y         = H / 2;
    this.angle     = -Math.PI / 2;
    this.vx        = 0;
    this.vy        = 0;
    this.radius    = 12;
    this.thrusting = false;
    this.invincible = 3;
    this.dead      = false;
    this.boost     = 0;
    // Disparo simple: Space pulsado dispara 1 bala (como antes)
    this.shootCooldown = 0;
    // Ráfaga triple: mantener Shift+Space 3 s y soltar
    this.chargeHold  = 0;        // segundos acumulados con Shift+Space pulsados
    this.charged     = false;    // carga completa (≥ 3 s): al soltar dispara 3
    this.wasSpaceHeld = false;   // estado de Space en el frame anterior
    this.burst       = 0;        // disparos restantes de la ráfaga actual
    this.burstTimer  = 0;        // tiempo hasta el siguiente disparo
    this.burstFlash  = 0;        // destello visual al disparar la ráfaga
  }

  activateBoost() {
    this.boost = 5;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.burstFlash > 0) this.burstFlash -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.boost > 0) this.boost -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      const thrust = this.boost > 0 ? THRUST * 1.5 : THRUST;
      this.vx += Math.cos(this.angle) * thrust * dt;
      this.vy += Math.sin(this.angle) * thrust * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    return [new Bullet(ox, oy, this.angle)];
  }

  // Ráfaga triple: mantener Shift+Space 3 s y soltar → 3 disparos seguidos.
  // Soltar Space antes de 3 s no dispara nada. Space sin Shift lo maneja tryShoot.
  shootCharge(dt) {
    if (this.dead) return [];

    const spaceHeld = !!keys['Space'];
    const shiftHeld = !!(keys['ShiftLeft'] || keys['ShiftRight']);

    if (spaceHeld && shiftHeld) {
      // Cargar solo mientras se mantienen pulsados Shift y Space
      if (!this.charged) {
        this.chargeHold += dt;
        if (this.chargeHold >= CHARGE_TIME) this.charged = true;
      }
    } else {
      // Soltar Space: si la carga estaba completa, dispara la ráfaga triple
      if (this.wasSpaceHeld && !spaceHeld && this.charged) {
        this.burst      = BURST_SHOTS;
        this.burstTimer = 0;        // primer disparo inmediato
        this.burstFlash = 0.35;
      }
      // Al soltar Space se reinicia la carga (si solo se soltó Shift, se pausa)
      if (!spaceHeld) {
        this.chargeHold = 0;
        this.charged    = false;
      }
    }
    this.wasSpaceHeld = spaceHeld;

    // Desplegar la ráfaga (tras soltar, aunque ya no haya teclas pulsadas)
    const shots = [];
    if (this.burst > 0) {
      this.burstTimer -= dt;
      if (this.burstTimer <= 0) {
        const NOSE = 21;
        const ox = this.x + Math.cos(this.angle) * NOSE;
        const oy = this.y + Math.sin(this.angle) * NOSE;
        shots.push(new Bullet(ox, oy, this.angle));
        this.burst--;
        this.burstTimer = BURST_INTERVAL;
        this.burstFlash = 0.18;
      }
    }
    return shots;
  }

  draw() {
    if (this.dead) return;
    // Flicker during respawn invincibility
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    // Boost flicker — gets faster as the 5 seconds run out
    let boostFlicker = false;
    if (this.boost > 0) {
      const elapsed = 5 - this.boost;
      const flickerRate = this.boost > 4 ? 8 : this.boost > 3 ? 10 : this.boost > 2 ? 12 : this.boost > 1 ? 14 : 16;
      boostFlicker = Math.floor(elapsed * flickerRate) % 2 === 0;
    }

    // Brillo de carga y destello de la ráfaga (detrás de la nave)
    const charge = Math.min(1, this.chargeHold / CHARGE_TIME);
    const t      = this.charged ? 1 : charge;
    const flash  = this.burstFlash > 0 ? Math.min(1, this.burstFlash / 0.35) : 0;
    if (t > 0 || flash > 0) {
      const glowR = 24 + t * 14 + flash * 10;
      const glowA = 0.15 + t * 0.4 + flash * 0.4;
      const cr = 255;
      const cg = Math.round(255 - t * 115);
      const cb = Math.round(255 - t * 255);
      const grad = ctx.createRadialGradient(this.x, this.y, 6, this.x, this.y, glowR);
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},${glowA})`);
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(this.x - glowR, this.y - glowR, glowR * 2, glowR * 2);
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = this.boost > 0 ? (boostFlicker ? '#ff0' : '#fff') : '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Classic silhouette: triangle with back cutout
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nose
    ctx.lineTo(-12, -9);   // left wing
    ctx.lineTo( -7,  0);   // rear notch
    ctx.lineTo(-12,  9);   // right wing
    ctx.closePath();
    ctx.stroke();

    // Thruster flame
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    ctx.restore();
  }
}

/* =============== PARTICLES (explosion) =============== */
class Particle {
  constructor(x, y, color = '#fff') {
    this.rgb = hexToRgb(color);
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(${this.rgb[0]},${this.rgb[1]},${this.rgb[2]},${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

/* ======================== GAME STATUS ======================== */
let ship, bullets, asteroids, particles;
let star;        // current ShootingStar, or null
let starTimer;   // seconds until the next star appears
let popups = []; // floating score popups
let score, lives, level;
let state; // 'playing' | 'dead' | 'gameover'
let deadTimer;
let nextChainId = 0;
const chainState = new Map();

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    const chainId = ++nextChainId;
    chainState.set(chainId, 1);
    asteroids.push(new Asteroid(x, y, 3, chainId));
  }
}

function scheduleStar() {
  starTimer = rand(10, 30);
}

function initGame() {
  nextChainId = 0;
  chainState.clear();
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  popups    = [];
  star      = null;
  scheduleStar();
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8, color = '#fff') {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

/* ============================ UPDATE ============================ */
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    popups.forEach(p => p.ttl -= dt);
    popups = popups.filter(p => p.ttl > 0);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    popups.forEach(p => p.ttl -= dt);
    popups = popups.filter(p => p.ttl > 0);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparo simple: pulsar Space sin Shift → 1 bala (como antes)
  const withShift = !!(keys['ShiftLeft'] || keys['ShiftRight']);
  if (pressed('Space') && !withShift) {
    bullets.push(...ship.tryShoot());
  }
  // Ráfaga triple: mantener Shift+Space 3 s y soltar
  bullets.push(...ship.shootCharge(dt));

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  popups.forEach(p => p.ttl -= dt);
  popups = popups.filter(p => p.ttl > 0);

  // Shooting star: spawn / advance / expire
  if (!star) {
    starTimer -= dt;
    if (starTimer <= 0) star = new ShootingStar();
  } else {
    star.update(dt);
    if (star.dead) { star = null; scheduleStar(); }
  }

  // Bullet vs Asteroid
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);

        const chain = chainState.get(a.chainId);
        if (chain !== undefined) {
          chainState.set(a.chainId, chain - 1);
        }

        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Bullet vs Shooting Star
  if (star) {
    for (const b of bullets) {
      if (!b.dead && dist(b, star) < star.radius) {
        b.dead = true;
        score += STAR_POINTS;
        explode(star.x, star.y, 18, '#59b6ff');
        popups.push({ x: star.x, y: star.y, text: `+${STAR_POINTS}`, ttl: 1, life: 1 });
        star = null;
        scheduleStar();
        break;
      }
    }
  }

  // Check for completed chains (large asteroid + all pieces destroyed)
  for (const [chainId, remaining] of chainState) {
    if (remaining === 0) {
      ship.activateBoost();
      chainState.delete(chainId);
    }
  }

  // Ship vs Asteroid
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Completed Level
  if (asteroids.length === 0) nextLevel();
}

/* ======================== DRAW ======================== */
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function drawPopups() {
  ctx.textAlign = 'center';
  ctx.font      = 'bold 20px monospace';
  for (const p of popups) {
    const t = 1 - p.ttl / p.life;
    ctx.globalAlpha = p.ttl / p.life;
    ctx.fillStyle   = '#7cc7ff';
    ctx.fillText(p.text, p.x, p.y - t * 30);
  }
  ctx.globalAlpha = 1;
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  if (star) star.draw();
  bullets.forEach(b => b.draw());
  ship.draw();

  // Mensaje cuando la ráfaga triple está lista (carga completa)
  if (ship.charged && !ship.dead) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font      = 'bold 17px monospace';
    ctx.fillStyle = '#ffb347';
    ctx.fillText('¡CARGA COMPLETA!', ship.x, ship.y + 30);
    ctx.font      = '12px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('SUELTA PARA DISPARAR TRIPLE', ship.x, ship.y + 44);
    ctx.restore();
  }

  drawPopups();
  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `SCORE: ${score}   —   SPACE TO RESTART`);
}

/* =========================== Loop principal =========================== */
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
