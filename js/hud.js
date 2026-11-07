class Hud {
  constructor() {
    this.element = document.getElementById('hud');
    this.hpFill = this.element.querySelector('.hp-fill');
    this.dashTrack = this.element.querySelector('.dash-bar-track');
    this.dashFills = [];
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

  // Один сегмент полосы дэша на заряд: полоса делится на равные части
  createDashFills(count) {
    this.dashTrack.replaceChildren();
    this.dashFills = [];

    for (let index = 0; index < count; index += 1) {
      const fill = document.createElement('div');
      fill.className = 'hud-fill dash-bar-fill';
      this.dashTrack.append(fill);
      this.dashFills.push(fill);
    }
  }

  draw(ship, game) {
    this.setVisible(true);

    if (this.specialFills.length !== ship.maxCharge) {
      this.createSpecialSpires(ship.maxCharge);
    }
    if (this.dashFills.length !== ship.maxDashCharges) {
      this.createDashFills(ship.maxDashCharges);
    }

    const hp = this.clamp(ship.hp / ship.maxHp);
    this.hpFill.style.clipPath = `inset(0 ${(1 - hp) * 100}% 0 0)`;

    // Полоса дэша: свой сегмент на каждый заряд, идущая перезарядка
    // заполняет свой сегмент, а не всю полосу
    const dashSegment = 1 / ship.maxDashCharges;
    this.dashFills.forEach((fill, index) => {
      let level = 0;
      if (index < ship.availableDashCharges) {
        level = 1;
      } else if (index === ship.availableDashCharges
        && ship.dashRechargeSeconds > 0) {
        level = 1 - ship.dashRechargeSeconds / ship.dashCooldownSeconds;
      }
      const start = index * dashSegment * 100;
      const end = start + level * dashSegment * 100;
      fill.style.clipPath = `inset(0 ${100 - end}% 0 ${start}%)`;
    });

    this.timeDisplay.textContent = formatRunTime(game.elapsedRunSeconds);
    this.wave.textContent = `ВОЛНА ${game.waveManager.wave}`;

    // Каждый шип показывает свой уровень: при заряде 1.5 первый полон, второй наполовину
    this.specialFills.forEach((fill, index) => {
      const level = this.clamp(ship.charge - index);
      fill.style.clipPath = `inset(${(1 - level) * 100}% 0 0 0)`;
    });

    this.hpCurrent.textContent = Math.ceil(ship.hp);
    this.hpMax.textContent = `/ ${ship.maxHp}`;
  }

  hide() {
    this.setVisible(false);
  }
}
