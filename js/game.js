const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const STATE = { MENU: 0, PLAY: 1, PAUSED: 2 };

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
  worldWidth = canvas.width = window.innerWidth;
  worldHeight = canvas.height = window.innerHeight;
  makeStars();
}

function gameColor(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

const ASSETS = {
  ship: new Image(),
  bullet: new Image(),
  bigBullet: new Image(),
};

ASSETS.ship.src = 'assets/textures/projectiles/Ship.svg';
ASSETS.bullet.src = 'assets/textures/projectiles/Bullet.svg';
ASSETS.bigBullet.src = 'assets/textures/projectiles/BigBullet.svg';


const COLORS = {
  background: gameColor('--bg'),
  foreground: gameColor('--fg'),
  muted: gameColor('--muted'),
};

window.addEventListener('resize', resize);

class Game {
  constructor() {
    this.state = STATE.MENU;
    this.animationTimeSeconds = 0;
    this.hud = new Hud();
    this.wave = 1;
    this.cameraOffsetX = 0;
    this.cameraOffsetY = 0;
    this.cameraTilt = 0;
    this.reset();
  }

  reset() {
    this.ship = new Ship(worldWidth / 2, worldHeight / 2);
    this.elapsedRunSeconds = 0;
  }

  toMenu() {
    this.state = STATE.MENU;
    this.reset();
    updateCameraOverlay('MENU');
    pauseDimmer.classList.add('hidden');
    menuEl.classList.remove('hidden');
    settingsEl.classList.add('hidden');
    pauseEl.classList.add('hidden');
  }

  pause() {
    this.state = STATE.PAUSED;
    updateCameraOverlay('PAUSE');
    pauseDimmer.classList.remove('hidden');
    pauseEl.classList.remove('hidden');
  }

  resume() {
    this.state = STATE.PLAY;
    updateCameraOverlay('GAME');
    pauseDimmer.classList.add('hidden');
    pauseEl.classList.add('hidden');
  }

  update(elapsedSeconds) {
    this.animationTimeSeconds += elapsedSeconds;

    if (this.state === STATE.MENU || this.state === STATE.PAUSED) {
      this.cameraTilt += (0 - this.cameraTilt) * Math.min(1, 6 * elapsedSeconds);
      return;
    }

    this.elapsedRunSeconds += elapsedSeconds;

    if (input.pausePressed || input.escapePressed) {
      this.pause();
      return;
    }

    this.ship.update(elapsedSeconds, input);

    // 0.03 radians is about 1.7 degrees; the effect lasts 0.18 seconds.
    const targetTilt = this.ship.dashEffectRemainingSeconds > 0
      ? Math.sin(this.ship.dashDirectionRadians) * 0.03
      : 0;
    this.cameraTilt += (targetTilt - this.cameraTilt) * Math.min(1, 6 * elapsedSeconds);

    const targetCameraX = (this.ship.positionX - worldWidth / 2) * 0.08;
    const targetCameraY = (this.ship.positionY - worldHeight / 2) * 0.08;
    this.cameraOffsetX += (targetCameraX - this.cameraOffsetX) * 3 * elapsedSeconds;
    this.cameraOffsetY += (targetCameraY - this.cameraOffsetY) * 3 * elapsedSeconds;

    for (const bullet of this.ship.bullets) {
      bullet.update(elapsedSeconds);
    }

    this.ship.bullets = this.ship.bullets.filter(
      (bullet) => bullet.remainingSeconds > 0,
    );
  }

  draw() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, worldWidth, worldHeight);

    ctx.save();
    ctx.translate(worldWidth / 2, worldHeight / 2);
    ctx.rotate(this.cameraTilt);
    ctx.translate(
      -worldWidth / 2 - this.cameraOffsetX,
      -worldHeight / 2 - this.cameraOffsetY,
    );

    if (this.state === STATE.PLAY) {
      const gradient = ctx.createRadialGradient(
        this.ship.positionX, this.ship.positionY, 0,
        this.ship.positionX, this.ship.positionY, 320
      );
      gradient.addColorStop(0, COLORS.foreground);
      gradient.addColorStop(0.35, COLORS.foreground);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.06;
      ctx.fillRect(this.ship.positionX - 320, this.ship.positionY - 320, 640, 640);
      ctx.globalAlpha = 1;
    }

    const isPaused = this.state === STATE.PAUSED;
    const starOpacity = isPaused ? 0.4 : 1;
    const twinkleSpeed = isPaused ? 0.5 : 2;

    ctx.fillStyle = COLORS.muted;
    for (const star of stars) {
      ctx.globalAlpha = starOpacity * star.brightness * (
        0.35 + 0.65 * Math.sin(this.animationTimeSeconds * twinkleSpeed + star.phase)
      );
      ctx.fillRect(star.x, star.y, star.radius, star.radius);
    }
    ctx.globalAlpha = 1;

    if (this.state !== STATE.PLAY) {
      const spotlightX = input.mouse.x + this.cameraOffsetX;
      const spotlightY = input.mouse.y + this.cameraOffsetY;
      const gradient = ctx.createRadialGradient(
        spotlightX, spotlightY, 0,
        spotlightX, spotlightY, 260
      );
      gradient.addColorStop(0, COLORS.foreground);
      gradient.addColorStop(0.35, COLORS.foreground);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.08;
      ctx.fillRect(spotlightX - 260, spotlightY - 260, 520, 520);
      ctx.globalAlpha = 1;
    }

    if (this.state === STATE.MENU) {
      this.hud.hide();
      ctx.restore();
      return;
    }

    if (this.state === STATE.PAUSED) {
      // В паузе рисуем корабль и пули, но не обновляем
      for (const bullet of this.ship.bullets) {
        bullet.draw(ctx);
      }
      this.ship.draw(ctx);
      ctx.restore();
      this.hud.draw(this.ship, this);
      return;
    }

    for (const bullet of this.ship.bullets) {
      bullet.draw(ctx);
    }

    this.ship.draw(ctx);

    ctx.restore();

    this.hud.draw(this.ship, this);
  }
}

const menuEl = document.getElementById('menu');
const settingsEl = document.getElementById('settings');
const pauseEl = document.getElementById('pause');
const pauseDimmer = document.getElementById('pause-dimmer');
const tapeTimeEl = document.querySelector('.cam-time');
const tapeDateEl = document.querySelector('.cam-date');
const cameraModeEl = document.getElementById('cam-mode');
const cameraRecEl = document.getElementById('cam-rec');
const cameraBatteryEl = document.getElementById('cam-battery');

function updateCameraOverlay(mode) {
  cameraModeEl.textContent = mode;
  cameraRecEl.classList.toggle('hidden', mode !== 'GAME');
  cameraBatteryEl.classList.toggle('hidden', mode !== 'GAME');
}

function updateTapeClock() {
  const now = new Date();
  const timeParts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(now);
  const getTimePart = (type) => timeParts.find((part) => part.type === type).value;

  tapeTimeEl.textContent = `${getTimePart('dayPeriod')} ${getTimePart('hour')}:${getTimePart('minute')}`;
  tapeDateEl.textContent = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(now).toUpperCase();
}

updateTapeClock();
setInterval(updateTapeClock, 1000);

document.getElementById('btn-play').onclick = () => {
  menuEl.classList.add('hidden');
  settingsEl.classList.add('hidden');
  pauseEl.classList.add('hidden');
  pauseDimmer.classList.add('hidden');
  game.state = STATE.PLAY;
  updateCameraOverlay('GAME');
  game.reset();
};

document.getElementById('btn-settings').onclick = () => {
  menuEl.classList.add('hidden');
  settingsEl.classList.remove('hidden');
};

document.getElementById('btn-back').onclick = () => {
  settingsEl.classList.add('hidden');

  if (game.state === STATE.PAUSED) {
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

function loop(frameTimeMilliseconds) {
  const elapsedSeconds = Math.min(
    (frameTimeMilliseconds - lastFrameTimeMilliseconds) / 1000,
    0.05,
  );
  lastFrameTimeMilliseconds = frameTimeMilliseconds;

  game.update(elapsedSeconds);
  game.draw();
  floatingTextures.update(game.state === STATE.PLAY);

  input.shootPressed = false;
  input.specialPressed = false;
  input.dashPressed = false;
  input.escapePressed = false;
  input.pausePressed = false;

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
