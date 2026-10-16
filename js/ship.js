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
    this.chargePerShard = 0.25;

    this.damageInvulnerabilitySeconds = 0;
    this.damageInvulnerabilityDurationSeconds = 0.7;
  }

  addCharge(amount) {
    this.charge = Math.min(this.maxCharge, this.charge + amount);
  }

  takeDamage(amount) {
    if (this.damageInvulnerabilitySeconds > 0) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.damageInvulnerabilitySeconds = this.damageInvulnerabilityDurationSeconds;
    return true;
  }

  update(elapsedSeconds, input, bullets) {
    const movementDirection = input.movementDirection();
    const movementVectorLength = Math.hypot(
      movementDirection.x,
      movementDirection.y,
    );

    if (movementVectorLength > 0) {
      this.velocityX += movementDirection.x / movementVectorLength
        * this.accelerationPixelsPerSecondSquared * elapsedSeconds;
      this.velocityY += movementDirection.y / movementVectorLength
        * this.accelerationPixelsPerSecondSquared * elapsedSeconds;
    }

    const dragMultiplier = Math.exp(-this.dragPerSecond * elapsedSeconds);
    this.velocityX *= dragMultiplier;
    this.velocityY *= dragMultiplier;

    this.positionX += this.velocityX * elapsedSeconds;
    this.positionY += this.velocityY * elapsedSeconds;

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

    this.angleToMouseRadians = Math.atan2(
      input.mouse.y - this.positionY,
      input.mouse.x - this.positionX,
    );

    this.damageInvulnerabilitySeconds = Math.max(
      0,
      this.damageInvulnerabilitySeconds - elapsedSeconds,
    );

    this.updateShooting(elapsedSeconds, input, bullets);
  }

  updateShooting(elapsedSeconds, input, bullets) {
    this.timeUntilNextShotSeconds -= elapsedSeconds;

    if (input.shootHeld && this.timeUntilNextShotSeconds <= 0) {
      this.timeUntilNextShotSeconds = this.fireCooldownSeconds;
      const muzzleOffsetPixels = 14;
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
    ctx.shadowColor = COLORS.foreground;
    ctx.shadowBlur = 8;

    if (ASSETS.ship.complete && ASSETS.ship.naturalWidth > 0) {
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(ASSETS.ship, -11.5, -14, 23, 28);
    } else {
      ctx.fillStyle = COLORS.foreground;
      ctx.beginPath();
      ctx.moveTo(13, 0); ctx.lineTo(-9, -8); ctx.lineTo(-4, 0); ctx.lineTo(-9, 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
