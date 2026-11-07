class Ship {
  constructor(startX, startY) {
    this.positionX = startX;
    this.positionY = startY;
    this.velocityX = 0;
    this.velocityY = 0;
    this.collisionRadiusPixels = 9;
    this.angleToMouseRadians = 0;

    this.hp = 100;
    this.maxHp = 100;

    this.accelerationPixelsPerSecondSquared = 1700;
    this.dragPerSecond = 3;

    this.fireCooldownSeconds = 0.2;
    this.timeUntilNextShotSeconds = 0;

    this.charge = 0;
    this.maxCharge = 1;

    // Бонусы улучшений текущего забега поверх базы из config.js
    this.regularDamageBonus = 0;
    this.specialDamageBonus = 0;
    this.specialLifetimeBonusSeconds = 0;
    this.shardLifetimeBonusSeconds = 0;
    this.shardChargeBonus = 0;
    this.shardAttractionBonusPixels = 0;

    // Флаги и числа уникальных улучшений
    this.upgrades = {};
    this.ricochetBounces = 0;
    this.scavengerHealAmount = 0;
    this.boomDamage = 0;
    this.boomRadiusPixels = 0;
    this.ramDamage = 0;
    this.healingShardsHealAmount = 0;

    // Дэш: рывок с фиксированной скоростью и неуязвимостью на его время
    this.dashSpeedPixelsPerSecond = 900;
    this.dashDurationSeconds = 0.18;
    this.dashCooldownSeconds = 2;

    this.availableDashCharges = 1;
    this.maxDashCharges = 1;
    this.dashRechargeSeconds = 0;

    this.dashEffectRemainingSeconds = 0;
    this.dashDirectionRadians = 0;
    this.invulnerableSeconds = 0;

    this.dashHitEnemies = new Set();
  }

  // Добавление заряда
  addCharge(amount) {
    this.charge = Math.min(this.maxCharge, this.charge + amount);
  }

  // Нанесение урона
  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }

  // Лечение с потолком максимума
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  // Обновление состояния корабля
  update(
    elapsedSeconds,
    input,
    bullets,
    cameraOffsetX = 0,
    cameraOffsetY = 0,
    cameraTilt = 0,
  ) {
    // Мировые координаты мыши: смещение камеры плюс обратный поворот
    // при наклоне камеры во время дэша, иначе прицел уезжает
    const screenOffsetX = input.mouse.x - worldWidth / 2;
    const screenOffsetY = input.mouse.y - worldHeight / 2;
    const inverseCos = Math.cos(-cameraTilt);
    const inverseSin = Math.sin(-cameraTilt);
    const worldMouseX = screenOffsetX * inverseCos - screenOffsetY * inverseSin
      + worldWidth / 2 + cameraOffsetX;
    const worldMouseY = screenOffsetX * inverseSin + screenOffsetY * inverseCos
      + worldHeight / 2 + cameraOffsetY;
    this.angleToMouseRadians = Math.atan2(
      worldMouseY - this.positionY,
      worldMouseX - this.positionX,
    );

    this.updateDash(elapsedSeconds, input, worldMouseX, worldMouseY);

    const movementDirection = input.movementDirection();
    const movementVectorLength = Math.hypot(
      movementDirection.x,
      movementDirection.y,
    );

    if (this.dashEffectRemainingSeconds > 0) {
      // Рывок: позиция меняется напрямую, ускорение и трение не действуют.
      // Обычная скорость не трогается и продолжит действовать после рывка
      this.positionX += Math.cos(this.dashDirectionRadians)
        * this.dashSpeedPixelsPerSecond * elapsedSeconds;
      this.positionY += Math.sin(this.dashDirectionRadians)
        * this.dashSpeedPixelsPerSecond * elapsedSeconds;
    } else {
      // Нормализация скорости
      if (movementVectorLength > 0) {
        this.velocityX += movementDirection.x / movementVectorLength
          * this.accelerationPixelsPerSecondSquared * elapsedSeconds;
        this.velocityY += movementDirection.y / movementVectorLength
          * this.accelerationPixelsPerSecondSquared * elapsedSeconds;
      }

      // Трение
      const dragMultiplier = Math.exp(-this.dragPerSecond * elapsedSeconds);
      this.velocityX *= dragMultiplier;
      this.velocityY *= dragMultiplier;

      this.positionX += this.velocityX * elapsedSeconds;
      this.positionY += this.velocityY * elapsedSeconds;
    }

    // Сквозные границы
    if (this.positionX < -this.collisionRadiusPixels) {
      this.positionX = worldWidth + this.collisionRadiusPixels;
    } else if (this.positionX > worldWidth + this.collisionRadiusPixels) {
      this.positionX = -this.collisionRadiusPixels;
    }
    if (this.positionY < -this.collisionRadiusPixels) {
      this.positionY = worldHeight + this.collisionRadiusPixels;
    } else if (this.positionY > worldHeight + this.collisionRadiusPixels) {
      this.positionY = -this.collisionRadiusPixels;
    }

    this.updateShooting(elapsedSeconds, input, bullets);
  }

  // Таймеры дэша, восстановление заряда и запуск нового рывка
  updateDash(elapsedSeconds, input, worldMouseX, worldMouseY) {
    this.dashEffectRemainingSeconds = Math.max(
      0,
      this.dashEffectRemainingSeconds - elapsedSeconds,
    );
    this.invulnerableSeconds = Math.max(
      0,
      this.invulnerableSeconds - elapsedSeconds,
    );

    if (this.dashRechargeSeconds > 0) {
      this.dashRechargeSeconds = Math.max(
        0,
        this.dashRechargeSeconds - elapsedSeconds,
      );
      // Заряд восстановлен: если ждем ещё один, таймер запускается заново
      if (this.dashRechargeSeconds <= 0
        && this.availableDashCharges < this.maxDashCharges) {
        this.availableDashCharges += 1;
        if (this.availableDashCharges < this.maxDashCharges) {
          this.dashRechargeSeconds = this.dashCooldownSeconds;
        }
      }
    }

    if (!input.dashPressed || this.availableDashCharges <= 0) return;

    // Направление рывка: вектор WASD, а если он нулевой — к мыши
    const direction = input.movementDirection();
    if (direction.x !== 0 || direction.y !== 0) {
      this.dashDirectionRadians = Math.atan2(direction.y, direction.x);
    } else {
      this.dashDirectionRadians = Math.atan2(
        worldMouseY - this.positionY,
        worldMouseX - this.positionX,
      );
    }

    this.availableDashCharges -= 1;
    if (this.dashRechargeSeconds <= 0) {
      this.dashRechargeSeconds = this.dashCooldownSeconds;
    }
    this.dashEffectRemainingSeconds = this.dashDurationSeconds;
    this.invulnerableSeconds = this.dashDurationSeconds;
    this.dashHitEnemies.clear();
  }

  // Обновление стрельбы
  updateShooting(elapsedSeconds, input, bullets) {
    this.timeUntilNextShotSeconds -= elapsedSeconds;

    if (input.shootHeld && this.timeUntilNextShotSeconds <= 0) {
      this.timeUntilNextShotSeconds = this.fireCooldownSeconds;
      const muzzleOffsetPixels = 14; // Дальность спавна снаряда перед кораблём
      bullets.push(new Bullet(
        this.positionX
          + Math.cos(this.angleToMouseRadians) * muzzleOffsetPixels,
        this.positionY
          + Math.sin(this.angleToMouseRadians) * muzzleOffsetPixels,
        this.angleToMouseRadians,
        { damage: bulletBase.regular.damage + this.regularDamageBonus,
          bouncesRemaining: this.ricochetBounces },
      ));
    }

    if (input.specialPressed && this.charge >= 1) {
      this.charge -= 1;
      bullets.push(new Bullet(
        this.positionX,
        this.positionY,
        this.angleToMouseRadians,
        {
          type: 'special',
          damage: bulletBase.special.damage + this.specialDamageBonus,
          lifetimeSeconds: bulletBase.special.lifetimeSeconds
            + this.specialLifetimeBonusSeconds,
        },
      ));
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.positionX, this.positionY);
    ctx.rotate(this.angleToMouseRadians);
    ctx.shadowColor = colors.foreground;
    ctx.shadowBlur = 8;

    if (assets.ship.complete && assets.ship.naturalWidth > 0) {
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(assets.ship, -11.5, -14, 23, 28);
    } else {
      ctx.fillStyle = colors.foreground;
      ctx.beginPath();
      ctx.moveTo(13, 0); ctx.lineTo(-9, -8); ctx.lineTo(-4, 0); ctx.lineTo(-9, 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
