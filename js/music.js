// Короткие звуки событий. Файлы CC0: Kenney Sci-Fi Sounds (попадания,
// взрывы) и 80 CC0 Creature SFX (вой). Набор стартовый,
// заменяется без правки кода — только файлы в assets/music/sfx
const sfxLibrary = {
  hit: {
    files: [
      'assets/music/sfx/hit_01.ogg',
      'assets/music/sfx/hit_02.ogg',
      'assets/music/sfx/hit_03.ogg',
    ],
    volume: 0.12,
    minIntervalMilliseconds: 90,
  },
  explosionLow: {
    files: ['assets/music/sfx/explosion_low.ogg'],
    volume: 0.28,
    minIntervalMilliseconds: 200,
  },
};

class Music {
  constructor() {
    // click.wav пока нет, клик временно звучит файлом ховера
    this.menu = new Audio('assets/music/menu.flac');
    this.game = new Audio('assets/music/gametest.wav');
    this.hover = new Audio('assets/music/hover.wav');

    this.menu.loop = true;
    this.menu.volume = 0.07;

    this.game.loop = true;
    this.game.volume = 0.22;

    this.hover.volume = 0.02;
    this.lastHoverTime = 0;
    this.lastSfxTimes = {};
    this.howlTimer = null;
  }

  startMenu() {
    this.stopGame();
    this.menu.play().catch(() => {});
    this.scheduleHowl();
  }

  startGame() {
    this.stopMenu();
    this.game.currentTime = 0;
    this.game.play().catch(() => {});
  }

  stopMenu() {
    this.menu.pause();
    this.menu.currentTime = 0;
    clearTimeout(this.howlTimer);
    this.howlTimer = null;
  }

  stopGame() {
    this.game.pause();
    this.game.currentTime = 0;
  }

  buttonSound(type) {
    if (type === 'hover') {
      const now = performance.now();
      if (now - this.lastHoverTime < 90) return;
      this.lastHoverTime = now;
    }

    const sound = this.hover.cloneNode();
    sound.volume = this.hover.volume;
    sound.play().catch(() => {});
  }

  // Короткий звук события со случайной вариацией и защитой от спама
  playSfx(name) {
    const sound = sfxLibrary[name];
    if (!sound) return;

    const now = performance.now();
    if (now - (this.lastSfxTimes[name] || 0) < sound.minIntervalMilliseconds) {
      return;
    }
    this.lastSfxTimes[name] = now;

    const file = sound.files[Math.floor(Math.random() * sound.files.length)];
    const audio = new Audio(file);
    audio.volume = sound.volume;
    audio.play().catch(() => {});
  }

  // Редкий вой в меню: раз в 12-25 секунд, совсем тихо, для нагнетающего вайба
  scheduleHowl() {
    if (this.howlTimer) return;
    this.howlTimer = setTimeout(() => {
      this.howlTimer = null;
      const audio = new Audio('assets/music/sfx/howl_01.ogg');
      audio.volume = 0.05;
      audio.play().catch(() => {});
      this.scheduleHowl();
    }, 12000 + Math.random() * 13000);
  }

  bindButtons(buttons) {
    for (const button of buttons) {
      button.addEventListener('mouseenter', () => this.buttonSound('hover'));
      button.addEventListener('click', () => this.buttonSound('click'));
    }
  }
}

const music = new Music();
