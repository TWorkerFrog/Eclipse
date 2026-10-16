class Shard {
  constructor(x, y) {
    this.positionX = x;
    this.positionY = y;

    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 90;
    this.velocityX = Math.cos(angle) * speed;
    this.velocityY = Math.sin(angle) * speed;

    this.totalLifetimeSeconds = 3;
    this.lifetimeSeconds = 3;
    this.collisionRadiusPixels = 6;

    this.chargeValue = 0.25;

    this.attractionRadiusPixels = 90;
    this.attractionPixelsPerSecondSquared = 1500;
    this.pickupRadiusPixels = 20;
    this.rotationRadians = Math.random() * Math.PI;
  }

  update(elapsedSeconds, ship) {
    this.lifetimeSeconds -= elapsedSeconds;
    this.rotationRadians += elapsedSeconds * 2;

    const dx = ship.positionX - this.positionX;
    const dy = ship.positionY - this.positionY;
    const distance = Math.hypot(dx, dy);

    if (distance < this.pickupRadiusPixels + ship.collisionRadiusPixels) {
      return 'collected';
    }

    if (distance < this.attractionRadiusPixels) {
      this.velocityX += dx / distance
        * this.attractionPixelsPerSecondSquared * elapsedSeconds;
      this.velocityY += dy / distance
        * this.attractionPixelsPerSecondSquared * elapsedSeconds;
    }

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
    ctx.fillStyle = COLORS.foreground;
    ctx.shadowColor = COLORS.foreground;
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
