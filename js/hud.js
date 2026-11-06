class Hud {
  constructor() {
    this.element = document.getElementById('hud');
    this.hpFill = this.element.querySelector('.hp-fill');
    this.specialSpires = this.element.querySelector('.special-spires');
    this.hpCurrent = this.element.querySelector('.hp-current');
    this.hpMax = this.element.querySelector('.hp-max');
    this.timeDisplay = this.element.querySelector('.hud-time');
    this.wave = this.element.querySelector('.hud-wave');
    this.specialFills = [];
  }

  clamp(value) {
    return Math.max(0, Math.min(1, value));
  }

  setVisible(visible) {
    this.element.classList.toggle('hidden', !visible);
  }

  createSpecialSpires(count) {
    this.specialSpires.replaceChildren();
    this.specialFills = [];

    for (let index = 0; index < count; index += 1) {
      const track = document.createElement('div');
      const fill = document.createElement('div');

      track.className = 'hud-track special-track';
      fill.className = 'hud-fill special-fill';
      track.append(fill);
      this.specialSpires.append(track);
      this.specialFills.push(fill);
    }
  }

  draw(ship, game) {
    this.setVisible(true);

    if (this.specialFills.length !== ship.maxCharge) {
      this.createSpecialSpires(ship.maxCharge);
    }

    const hp = this.clamp(ship.hp / ship.maxHp);
    this.hpFill.style.clipPath = `inset(0 ${(1 - hp) * 100}% 0 0)`;

    this.timeDisplay.textContent = formatRunTime(game.elapsedRunSeconds);
    this.wave.textContent = `ВОЛНА ${game.waveManager.wave}`;

    const charge = this.clamp(ship.charge);
    this.specialFills.forEach((fill) => {
      fill.style.clipPath = `inset(${(1 - charge) * 100}% 0 0 0)`;
    });

    this.hpCurrent.textContent = Math.ceil(ship.hp);
    this.hpMax.textContent = `/ ${ship.maxHp}`;
  }

  hide() {
    this.setVisible(false);
  }
}
