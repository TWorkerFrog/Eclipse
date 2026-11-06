const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const states = { Menu: 0, Play: 1, Paused: 2, GameOver: 3, Victory: 4 };

let worldWidth = 0;
let worldHeight = 0;
let stars = [];

function makeStars() {
  stars = Array.from({ length: Math.round(worldWidth * worldHeight / 8000) }, () => ({
    x: Math.random() * worldWidth,
    y: Math.random() * worldHeight,
    radius: 0.6 + Math.random() * 1.8,
    phase: Math.random() * Math.PI * 2,
    brightness: 0.5 + Math.random() * 0.5,
  }));
}

function resize() {
  const pixelRatio = window.devicePixelRatio || 1;
  worldWidth = window.innerWidth;
  worldHeight = window.innerHeight;
  canvas.width = Math.round(worldWidth * pixelRatio);
  canvas.height = Math.round(worldHeight * pixelRatio);
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  makeStars();
}

function gameColor(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

const assets = {
  ship: new Image(),
  bullet: new Image(),
  bigBullet: new Image(),
};

assets.ship.src = 'assets/textures/projectiles/Ship.svg';
assets.bullet.src = 'assets/textures/projectiles/Bullet.svg';
assets.bigBullet.src = 'assets/textures/projectiles/BigBullet.svg';

const colors = {
  background: gameColor('--bg'),
  foreground: gameColor('--fg'),
  muted: gameColor('--muted'),
};

window.addEventListener('resize', resize);

// Проверка колизии предметов
function circlesOverlap(a, b) {
  const dx = b.positionX - a.positionX;
  const dy = b.positionY - a.positionY;
  return Math.hypot(dx, dy) < a.collisionRadiusPixels + b.collisionRadiusPixels;
}

function formatRunTime(seconds) {
  const total = Math.floor(Math.max(0, seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// Основной класс игры. Содержит состояние, все массивы объектов (пули, враги, осколки)
class Game {
  constructor() {
    this.state = states.Menu;
    this.animationTimeSeconds = 0;
    this.cameraOffsetX = 0;
    this.cameraOffsetY = 0;
    this.waveManager = new WaveManager();
    this.hud = new Hud();
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.shards = [];
    this.reset();
  }

  reset() {
    this.ship = new Ship(worldWidth / 2, worldHeight / 2);
    this.elapsedRunSeconds = 0;
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.shards = [];
    this.cameraOffsetX = 0;
    this.cameraOffsetY = 0;
    this.waveManager.startRun();
  }

  startRun() {
    hideAllScreens();
    this.state = states.Play;
    this.reset();
  }

  toMenu() {
    this.state = states.Menu;
    this.reset();
    hideAllScreens();
    menuEl.classList.remove('hidden');
    this.hud.hide();
  }

  pause() {
    this.state = states.Paused;
    pauseDimmer.classList.remove('hidden');
    pauseEl.classList.remove('hidden');
  }

  resume() {
    this.state = states.Play;
    pauseDimmer.classList.add('hidden');
    pauseEl.classList.add('hidden');
    settingsEl.classList.add('hidden');
  }

  endRun(victory) {
    this.state = victory ? states.Victory : states.GameOver;
    this.hud.hide();
    pauseDimmer.classList.remove('hidden');
    const time = formatRunTime(this.elapsedRunSeconds);

    if (victory) {
      document.getElementById('victory-time').textContent = time;
      victoryEl.classList.remove('hidden');
    } else {
      document.getElementById('defeat-time').textContent = time;
      gameoverEl.classList.remove('hidden');
    }
  }

  // Главный кадр игры. Вызывается каждый тик (~60 раз в секунду).
  update(elapsedSeconds) {
    this.animationTimeSeconds += elapsedSeconds;

    if (this.state === states.Menu) {
      return;
    }

    if (this.state === states.Paused) {
      if (input.pausePressed) this.resume();
      return;
    }

    if (this.state !== states.Play) {
      return;
    }

    this.elapsedRunSeconds += elapsedSeconds;

    if (input.pausePressed) {
      this.pause();
      return;
    }

    this.ship.update(elapsedSeconds, input, this.playerBullets, this.cameraOffsetX, this.cameraOffsetY);
    this.spawnWaveEnemies(elapsedSeconds);
    this.updateEntities(elapsedSeconds);
    this.handleCollisions();
    this.updateCamera(elapsedSeconds);

    if (this.ship.hp <= 0) {
      this.endRun(false);
    } else if (this.waveManager.isRunComplete()) {
      this.endRun(true);
    }
  }

  // Спавн врагов текущей волны. Спрашивает у WaveManager, нужно ли создать нового врага и если да — создаёт его у случайного края экрана.
  spawnWaveEnemies(elapsedSeconds) {
    const enemyType = this.waveManager.update(elapsedSeconds, this.enemies);
    if (enemyType) {
      this.enemies.push(this.createEdgeEnemy(enemyType));
    }
  }

  // Создаёт нового врага на случайном краю арены (сверху, снизу, слева или справа).
  createEdgeEnemy(type) {
    const margin = 50;
    const side = Math.floor(Math.random() * 4);
    let x;
    let y;

    if (side === 0) {
      x = margin + Math.random() * (worldWidth - margin * 2);
      y = margin;
    } else if (side === 1) {
      x = worldWidth - margin;
      y = margin + Math.random() * (worldHeight - margin * 2);
    } else if (side === 2) {
      x = margin + Math.random() * (worldWidth - margin * 2);
      y = worldHeight - margin;
    } else {
      x = margin;
      y = margin + Math.random() * (worldHeight - margin * 2);
    }

    return new Enemy(x, y, enemyConfigs[type]);
  }

  // Движение и жизнь всех объектов на сцене: пули игрока, пули врагов, враги, осколки.
  updateEntities(elapsedSeconds) {
    this.playerBullets = this.playerBullets.filter(
      (bullet) => bullet.update(elapsedSeconds),
    );
    this.enemyBullets = this.enemyBullets.filter(
      (bullet) => bullet.update(elapsedSeconds),
    );

    for (const enemy of this.enemies) {
      enemy.update(elapsedSeconds, this.ship, this.enemyBullets);
    }

    this.shards = this.shards.filter((shard) => {
      const result = shard.update(elapsedSeconds, this.ship);
      if (result === 'collected') {
        this.ship.addCharge(shard.chargeValue);
        return false;
      }
      return result;
    });
  }

  // Обработка всех взаимодействий (столкновений) между объектами:
  handleCollisions() {
    const ship = this.ship;

    for (const bullet of this.playerBullets) {
      for (const enemy of this.enemies) {
        if (enemy.isSpawning) continue;
        if (bullet.type === 'regular' && bullet.lifetimeSeconds <= 0) break;
        if (bullet.hitEnemies.has(enemy)) continue;
        if (!circlesOverlap(bullet, enemy)) continue;

        bullet.hitEnemies.add(enemy);
        this.damageEnemy(enemy, bullet.damage);
        if (bullet.type === 'regular') {
          bullet.lifetimeSeconds = 0;
          break;
        }
      }

      if (bullet.type === 'special') {
        this.enemyBullets = this.enemyBullets.filter(
          (enemyBullet) => !circlesOverlap(bullet, enemyBullet),
        );
      }
    }
    this.playerBullets = this.playerBullets.filter(
      (bullet) => bullet.lifetimeSeconds > 0,
    );

    for (const enemyBullet of this.enemyBullets) {
      if (!circlesOverlap(enemyBullet, ship)) continue;
      ship.takeDamage(enemyBullet.damage);
      enemyBullet.lifetimeSeconds = 0;
      break;
    }
    this.enemyBullets = this.enemyBullets.filter(
      (bullet) => bullet.lifetimeSeconds > 0,
    );

    for (const enemy of this.enemies) {
      if (enemy.isSpawning) continue;
      if (enemy.contactCooldownSeconds > 0) continue;
      if (!circlesOverlap(enemy, ship)) continue;

      ship.takeDamage(enemy.contactDamage);
      enemy.contactCooldownSeconds = enemy.contactDamageCooldownSeconds;
      this.damageEnemy(enemy, enemy.contactDamage);
      break;
    }
    this.enemies = this.enemies.filter((enemy) => enemy.hp > 0);
  }


  // Нанесение урона конкретному врагу. Если hp <= 0 — враг считается убитым:
  damageEnemy(enemy, damage) {
    if (!enemy.takeDamage(damage)) return;
    this.waveManager.registerKill();
    for (let index = 0; index < enemy.shardCount; index += 1) {
      this.shards.push(new Shard(
        enemy.positionX + (Math.random() - 0.5) * 24,
        enemy.positionY + (Math.random() - 0.5) * 24,
      ));
    }
  }

  // Плавное следование камеры за кораблем игрока.
  updateCamera(elapsedSeconds) {
    const targetCameraX = (this.ship.positionX - worldWidth / 2) * 0.08;
    const targetCameraY = (this.ship.positionY - worldHeight / 2) * 0.08;
    this.cameraOffsetX += (targetCameraX - this.cameraOffsetX) * 3 * elapsedSeconds;
    this.cameraOffsetY += (targetCameraY - this.cameraOffsetY) * 3 * elapsedSeconds;
  }

  // Отрисовка всего кадра: звёзды, враги, пули, осколки, корабль и HUD.
  draw() {
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, worldWidth, worldHeight);

    ctx.save();
    ctx.translate(-this.cameraOffsetX, -this.cameraOffsetY);

    const isPaused = this.state === states.Paused;
    const starOpacity = isPaused ? 0.4 : 1;
    const twinkleSpeed = isPaused ? 0.5 : 2;

    ctx.fillStyle = colors.muted;
    for (const star of stars) {
      ctx.globalAlpha = starOpacity * star.brightness * (
        0.35 + 0.65 * Math.sin(this.animationTimeSeconds * twinkleSpeed + star.phase)
      );
      ctx.fillRect(star.x, star.y, star.radius, star.radius);
    }
    ctx.globalAlpha = 1;

    if (this.state === states.Menu) {
      const spotlightX = input.mouse.x + this.cameraOffsetX;
      const spotlightY = input.mouse.y + this.cameraOffsetY;
      const gradient = ctx.createRadialGradient(
        spotlightX, spotlightY, 0,
        spotlightX, spotlightY, 260
      );
      gradient.addColorStop(0, colors.foreground);
      gradient.addColorStop(0.35, colors.foreground);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.08;
      ctx.fillRect(spotlightX - 260, spotlightY - 260, 520, 520);
      ctx.globalAlpha = 1;
      ctx.restore();
      return;
    }

    for (const shard of this.shards) {
      shard.draw(ctx);
    }

    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }

    for (const bullet of this.enemyBullets) {
      bullet.draw(ctx);
    }

    for (const bullet of this.playerBullets) {
      bullet.draw(ctx);
    }

    this.ship.draw(ctx);

    ctx.restore();

    if (this.state === states.Play || this.state === states.Paused) {
      this.hud.draw(this.ship, this);
    }
  }
}

const menuEl = document.getElementById('menu');
const settingsEl = document.getElementById('settings');
const pauseEl = document.getElementById('pause');
const pauseDimmer = document.getElementById('pause-dimmer');
const victoryEl = document.getElementById('victory');
const gameoverEl = document.getElementById('gameover');

function hideAllScreens() {
  for (const element of [menuEl, settingsEl, pauseEl, victoryEl, gameoverEl]) {
    element.classList.add('hidden');
  }
  pauseDimmer.classList.add('hidden');
}

document.getElementById('btn-play').onclick = () => game.startRun();
document.getElementById('btn-again').onclick = () => game.startRun();
document.getElementById('btn-restart').onclick = () => game.startRun();
document.getElementById('btn-victory-menu').onclick = () => game.toMenu();
document.getElementById('btn-gameover-menu').onclick = () => game.toMenu();

document.getElementById('btn-settings').onclick = () => {
  menuEl.classList.add('hidden');
  settingsEl.classList.remove('hidden');
};

document.getElementById('btn-back').onclick = () => {
  settingsEl.classList.add('hidden');

  if (game.state === states.Paused) {
    pauseEl.classList.remove('hidden');
    return;
  }

  menuEl.classList.remove('hidden');
};

document.getElementById('btn-exit').onclick = () => window.close();
document.getElementById('btn-resume').onclick = () => game.resume();

document.getElementById('btn-pause-settings').onclick = () => {
  pauseEl.classList.add('hidden');
  settingsEl.classList.remove('hidden');
};

document.getElementById('btn-pause-menu').onclick = () => game.toMenu();

resize();
const game = new Game();
let lastFrameTimeMilliseconds = performance.now();

// Главный игровой цикл (requestAnimationFrame). Считает время между кадрами.
function loop(frameTimeMilliseconds) {
  const elapsedSeconds = Math.min(
    (frameTimeMilliseconds - lastFrameTimeMilliseconds) / 1000,
    0.05,
  );
  lastFrameTimeMilliseconds = frameTimeMilliseconds;

  game.update(elapsedSeconds);
  game.draw();

  input.shootPressed = false;
  input.specialPressed = false;
  input.pausePressed = false;

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
