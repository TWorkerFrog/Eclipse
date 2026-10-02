class Hud {
  constructor() {
    this.element = document.getElementById('hud');
    this.hpFill = this.element.querySelector('.hp-fill');
    this.dashBarFill = this.element.querySelector('.dash-bar-fill');
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

  formatTime(seconds) {
    const total = Math.floor(Math.max(0, seconds));
    const minutes = Math.floor(total / 60);
    const rest = String(total % 60).padStart(2, '0');
    return `${minutes}:${rest}`;
  }

  draw(ship, game) {
    this.setVisible(true);

    if (this.specialFills.length !== ship.maxCharge) {
      this.createSpecialSpires(ship.maxCharge);
    }

    const hp = this.clamp(ship.hp / ship.maxHp);
    const dash = this.clamp(ship.availableDashCharges / ship.maxDashCharges);

    this.hpFill.style.clipPath = `inset(0 ${(1 - hp) * 100}% 0 0)`;
    this.dashBarFill.style.clipPath = `inset(0 ${(1 - dash) * 100}% 0 0)`;

    this.timeDisplay.textContent = this.formatTime(game.elapsedRunSeconds);
    this.wave.textContent = `ВОЛНА ${game.wave}`;
    this.specialFills.forEach((fill, index) => {
      const charge = this.clamp(ship.charge - index);
      fill.style.clipPath = `inset(${(1 - charge) * 100}% 0 0 0)`;
    });

    this.hpCurrent.textContent = Math.ceil(ship.hp);
    this.hpMax.textContent = `/ ${ship.maxHp}`;
  }

  hide() {
    this.setVisible(false);
  }
}
