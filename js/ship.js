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
  }

  // Добавление заряда
  addCharge(amount) {
    this.charge = Math.min(this.maxCharge, this.charge + amount);
  }

  // Нанесение урона
  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }

  // Обновление состояния корабля
  update(elapsedSeconds, input, bullets, cameraOffsetX = 0, cameraOffsetY = 0) {
    const movementDirection = input.movementDirection();
    const movementVectorLength = Math.hypot(
      movementDirection.x,
      movementDirection.y,
    );

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

    const worldMouseX = input.mouse.x + cameraOffsetX;
    const worldMouseY = input.mouse.y + cameraOffsetY;
    this.angleToMouseRadians = Math.atan2(
      worldMouseY - this.positionY,
      worldMouseX - this.positionX,
    );

    this.updateShooting(elapsedSeconds, input, bullets);
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
      ));
    }

    if (input.specialPressed && this.charge >= 1) {
      this.charge -= 1;
      bullets.push(new Bullet(
        this.positionX,
        this.positionY,
        this.angleToMouseRadians,
        { type: 'special' },
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
