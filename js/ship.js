class Ship {
  constructor(startX, startY) {
    this.positionX = startX;
    this.positionY = startY;
    this.velocityX = 0;
    this.velocityY = 0;
    this.collisionRadiusPixels = 9;
    this.angleToMouseRadians = 0;

    this.hp = 100; this.maxHp = 100;

    this.accelerationPixelsPerSecondSquared = 1700;
    this.dragPerSecond = 3;
  }

  update(elapsedSeconds, input) {
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

    if (this.positionX < this.collisionRadiusPixels) {
      this.positionX = this.collisionRadiusPixels;
      this.velocityX *= -0.4;
    }
    if (this.positionX > worldWidth - this.collisionRadiusPixels) {
      this.positionX = worldWidth - this.collisionRadiusPixels;
      this.velocityX *= -0.4;
    }
    if (this.positionY < this.collisionRadiusPixels) {
      this.positionY = this.collisionRadiusPixels;
      this.velocityY *= -0.4;
    }
    if (this.positionY > worldHeight - this.collisionRadiusPixels) {
      this.positionY = worldHeight - this.collisionRadiusPixels;
      this.velocityY *= -0.4;
    }

    this.angleToMouseRadians = Math.atan2(
      input.mouse.y - this.positionY,
      input.mouse.x - this.positionX,
    );
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