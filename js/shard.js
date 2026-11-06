class Shard {
  constructor(x, y) {
    this.positionX = x;
    this.positionY = y;

    const angle = Math.random() * Math.PI * 2;
    const scatterSpeed = 40 + Math.random() * 90;
    this.velocityX = Math.cos(angle) * scatterSpeed;
    this.velocityY = Math.sin(angle) * scatterSpeed;

    this.totalLifetimeSeconds = 3; // Длительность жизни
    this.lifetimeSeconds = this.totalLifetimeSeconds;
    this.collisionRadiusPixels = 6;

    this.chargeValue = 0.25; // Процент заряда от одного осколка

    this.attractionRadiusPixels = 90;
    this.pickupRadiusPixels = 20;
    this.rotationRadians = Math.random() * Math.PI;
    this.isAttracted = false;
    this.homingSpeed = 300;
    this.magnetCooldownSeconds = 0;
    this.magnetCooldownDurationSeconds = 0.4; // Пауза магнита после отлипания
  }

  update(elapsedSeconds, ship) {
    this.rotationRadians += elapsedSeconds * 2;

    const dx = ship.positionX - this.positionX;
    const dy = ship.positionY - this.positionY;
    const distance = Math.hypot(dx, dy);

    if (distance < this.pickupRadiusPixels + ship.collisionRadiusPixels) {
      return 'collected';
    }

    this.magnetCooldownSeconds = Math.max(
      0,
      this.magnetCooldownSeconds - elapsedSeconds,
    );

    // Проверка активации притягивания
    const wasAttracted = this.isAttracted;
    this.isAttracted = distance < this.attractionRadiusPixels
      && this.magnetCooldownSeconds <= 0;
    if (wasAttracted && !this.isAttracted) {
      this.magnetCooldownSeconds = this.magnetCooldownDurationSeconds;
    }

    if (this.isAttracted) {
      this.velocityX = dx / distance * this.homingSpeed;
      this.velocityY = dy / distance * this.homingSpeed;
      const travel = Math.min(this.homingSpeed * elapsedSeconds, distance);
      this.positionX += dx / distance * travel;
      this.positionY += dy / distance * travel;
      return true; 
    }

    this.lifetimeSeconds -= elapsedSeconds;

    // Трение
    const dragMultiplier = Math.exp(-2.5 * elapsedSeconds);
    this.velocityX *= dragMultiplier;
    this.velocityY *= dragMultiplier;

    this.positionX += this.velocityX * elapsedSeconds;
    this.positionY += this.velocityY * elapsedSeconds;

    return this.lifetimeSeconds > 0;
  }

  draw(ctx) {
    const blinksBeforeDeathSeconds = 1;
    let alpha = 0.9;
    if (this.lifetimeSeconds < blinksBeforeDeathSeconds) {
      alpha = 0.9 * (0.5 + 0.5 * Math.abs(Math.sin(this.lifetimeSeconds * 12)));
    }

    ctx.save();
    ctx.translate(this.positionX, this.positionY);
    ctx.rotate(this.rotationRadians);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colors.foreground;
    ctx.shadowColor = colors.foreground;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
