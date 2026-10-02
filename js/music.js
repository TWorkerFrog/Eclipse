/*
class Music {
  constructor() {
    this.menu = new Audio('assets/music/menu.flac');
    this.game = new Audio('assets/music/game.wav');
    this.hover = new Audio('assets/music/hover.wav');
    this.click = new Audio('assets/music/click.wav');
    this.lastHoverTime = 0;

    this.menu.loop = true;
    this.menu.volume = .18;

    this.game.loop = true;
    this.game.volume = .22;

    this.hover.volume = .50;
    this.click.volume = .3;
    this.muted = false;
  }

  startMenu() {
    this.stopGame();
    this.menu.play().catch(() => {});
  }

  startGame() {
    this.stopMenu();
    this.game.currentTime = 0;
    this.game.play().catch(() => {});
  }

  stopMenu() {
    this.menu.pause();
    this.menu.currentTime = 0;
  }

  stopGame() {
    this.game.pause();
    this.game.currentTime = 0;
  }

  setVolume(value) {
    const volume = Math.max(0, Math.min(1, value));
    this.menu.volume = volume * .8;
    this.game.volume = volume;
  }

  setMuted(value) {
    this.muted = value;
    this.menu.muted = value;
    this.game.muted = value;
  }

  buttonSound(type) {
    if (type === 'hover') {
      const now = performance.now();
      if (now - this.lastHoverTime < 90) return;
      this.lastHoverTime = now;
    }

    const source = type === 'hover' ? this.hover : this.click;
    const sound = source.cloneNode();
    sound.volume = source.volume;
    sound.play().catch(() => {});
  }

  bindButtons(buttons) {
    for (const button of buttons) {
      button.addEventListener('mouseenter', () => this.buttonSound('hover'));
      button.addEventListener('click', () => this.buttonSound('click'));
    }
  }
}

const music = new Music();
*/
