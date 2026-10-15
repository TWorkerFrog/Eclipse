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
};

ASSETS.ship.src = 'assets/textures/projectiles/Ship.svg';
ASSETS.bullet.src = 'assets/textures/projectiles/Bullet.svg';

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
    this.wave = 1;
    this.cameraOffsetX = 0;
    this.cameraOffsetY = 0;
    this.reset();
  }

  reset() {
    this.ship = new Ship(worldWidth / 2, worldHeight / 2);
    this.elapsedRunSeconds = 0;
  }

  toMenu() {
    this.state = STATE.MENU;
    this.reset();
    pauseDimmer.classList.add('hidden');
    menuEl.classList.remove('hidden');
    settingsEl.classList.add('hidden');
    pauseEl.classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
  }

  pause() {
    this.state = STATE.PAUSED;
    pauseDimmer.classList.remove('hidden');
    pauseEl.classList.remove('hidden');
  }

  resume() {
    this.state = STATE.PLAY;
    pauseDimmer.classList.add('hidden');
    pauseEl.classList.add('hidden');
    settingsEl.classList.add('hidden');
  }

  update(elapsedSeconds) {
    this.animationTimeSeconds += elapsedSeconds;

    if (this.state === STATE.MENU) {
      return;
    }

    if (this.state === STATE.PAUSED) {
      if (input.pausePressed) this.resume();
      return;
    }

    this.elapsedRunSeconds += elapsedSeconds;

    if (input.pausePressed) {
      this.pause();
      return;
    }

    this.ship.update(elapsedSeconds, input);

    const targetCameraX = (this.ship.positionX - worldWidth / 2) * 0.08;
    const targetCameraY = (this.ship.positionY - worldHeight / 2) * 0.08;
    this.cameraOffsetX += (targetCameraX - this.cameraOffsetX) * 3 * elapsedSeconds;
    this.cameraOffsetY += (targetCameraY - this.cameraOffsetY) * 3 * elapsedSeconds;
  }

  draw() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, worldWidth, worldHeight);

    ctx.save();
    ctx.translate(-this.cameraOffsetX, -this.cameraOffsetY);

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
      ctx.restore();
      return;
    }

    if (this.state === STATE.PAUSED) {
      this.ship.draw(ctx);
      ctx.restore();
      return;
    }

    this.ship.draw(ctx);

    ctx.restore();
  }
}

const menuEl = document.getElementById('menu');
const settingsEl = document.getElementById('settings');
const pauseEl = document.getElementById('pause');
const pauseDimmer = document.getElementById('pause-dimmer');

document.getElementById('btn-play').onclick = () => {
  menuEl.classList.add('hidden');
  settingsEl.classList.add('hidden');
  pauseEl.classList.add('hidden');
  pauseDimmer.classList.add('hidden');
  game.state = STATE.PLAY;
  game.reset();
  document.getElementById('hud').classList.remove('hidden');
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

  input.shootPressed = false;
  input.pausePressed = false;

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
