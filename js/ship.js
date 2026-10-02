class Bullet {
  constructor(startX, startY, directionAngle, options) {
    this.positionX = startX;
    this.positionY = startY;
    this.velocityX = Math.cos(directionAngle) * options.speed;
    this.velocityY = Math.sin(directionAngle) * options.speed;
    this.radiusPixels = options.radiusPixels;
    this.type = options.type;
    this.remainingSeconds = options.lifetimeSeconds;
  }

  update(elapsedSeconds) {
    this.positionX += this.velocityX * elapsedSeconds;
    this.positionY += this.velocityY * elapsedSeconds;
    this.remainingSeconds -= elapsedSeconds;

    if (this.positionX < -40 || this.positionX > worldWidth + 40
      || this.positionY < -40 || this.positionY > worldHeight + 40) {
      this.remainingSeconds = 0;
    }
  }

  draw(ctx) {
    const isSpecial = this.type === 'special';
    const sprite = isSpecial ? ASSETS.bigBullet : ASSETS.bullet;

    ctx.save();
    ctx.translate(this.positionX, this.positionY);
    ctx.rotate(Math.atan2(this.velocityY, this.velocityX) + Math.PI / 2);
    ctx.shadowColor = COLORS.foreground;
    ctx.shadowBlur = isSpecial ? 16 : 8;

    if (sprite.complete && sprite.naturalWidth > 0) {
      const width = isSpecial ? 44 : 12;
      const height = isSpecial ? 26 : 24;
      ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
    } else {
      ctx.strokeStyle = COLORS.foreground;
      ctx.lineWidth = this.radiusPixels;
      ctx.beginPath();
      ctx.moveTo(-this.velocityX * 0.025, -this.velocityY * 0.025);
      ctx.lineTo(0, 0);
      ctx.stroke();
    }
    ctx.restore();
  }
}

class Ship {
  constructor(startX, startY) {
    this.positionX = startX;
    this.positionY = startY;
    this.velocityX = 0;
    this.velocityY = 0;
    this.collisionRadiusPixels = 9;
    this.angleToMouseRadians = 0;
    this.bullets = [];

    this.hp = 100; this.maxHp = 100;
    this.secondsBetweenShots = 0.20; 
    this.timeUntilNextShotSeconds = 0;
    this.charge = 0;
    this.maxCharge = 5;
    this.chargeRegenerationPerSecond = 0.25;

    this.accelerationPixelsPerSecondSquared = 1700; // за секунду добавляет 1700 px/s скорости
    this.dragPerSecond = 5; // Показатель экспоненциального затухания скорости
    this.dashSpeedPixelsPerSecond = 900; // скорость рывка
    this.dashCooldownSeconds = 2; 
    this.availableDashCharges = 1;
    this.maxDashCharges = 1;
    this.dashEffectRemainingSeconds = 0; 
    this.dashDirectionRadians = 0; 
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

    this.dashEffectRemainingSeconds = Math.max(
      0,
      this.dashEffectRemainingSeconds - elapsedSeconds,
    );

    if (this.availableDashCharges < this.maxDashCharges) {
      this.availableDashCharges = Math.min(
        this.maxDashCharges,
        this.availableDashCharges + elapsedSeconds / this.dashCooldownSeconds,
      );
    }

    if (input.dashPressed && this.availableDashCharges >= 1) {
      let dashDirectionX = movementDirection.x;
      let dashDirectionY = movementDirection.y;

      if (movementVectorLength === 0) {
        dashDirectionX = Math.cos(this.angleToMouseRadians);
        dashDirectionY = Math.sin(this.angleToMouseRadians);
      }

      const dashDirectionMagnitude = Math.hypot(dashDirectionX, dashDirectionY);
      this.velocityX = dashDirectionX / dashDirectionMagnitude
        * this.dashSpeedPixelsPerSecond;
      this.velocityY = dashDirectionY / dashDirectionMagnitude
        * this.dashSpeedPixelsPerSecond;
      this.dashEffectRemainingSeconds = 0.18;
      this.dashDirectionRadians = Math.atan2(dashDirectionY, dashDirectionX);
      this.availableDashCharges -= 1;
    }

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

    this.timeUntilNextShotSeconds -= elapsedSeconds;
    if (input.shootPressed && this.timeUntilNextShotSeconds <= 0) {
      this.timeUntilNextShotSeconds = this.secondsBetweenShots;
      this.bullets.push(new Bullet(
        this.positionX + Math.cos(this.angleToMouseRadians) * this.collisionRadiusPixels,
        this.positionY + Math.sin(this.angleToMouseRadians) * this.collisionRadiusPixels,
        this.angleToMouseRadians,
        { type: 'regular', speed: 560, radiusPixels: 3, lifetimeSeconds: 1.4 }
      ));
    }

    this.charge = Math.min(
      this.maxCharge,
      this.charge + this.chargeRegenerationPerSecond * elapsedSeconds,
    );
    if (input.specialPressed && this.charge >= 1) {
      this.charge -= 1;
      this.bullets.push(new Bullet(
        this.positionX,
        this.positionY,
        this.angleToMouseRadians,
        { type: 'special', speed: 660, radiusPixels: 7, lifetimeSeconds: 2.2 },
      ));
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.positionX, this.positionY);
    ctx.rotate(this.angleToMouseRadians);
    ctx.shadowColor = COLORS.foreground;
    ctx.shadowBlur = this.dashEffectRemainingSeconds > 0 ? 20 : 8;

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