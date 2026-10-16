const ENEMY_CONFIGS = {
  kamikaze: {
    type: 'kamikaze',
    hp: 10,
    radius: 8,
    acceleration: 560,
    maxSpeed: 330,
    contactDamage: 12,
    shardCount: 1,
    shapeSides: 3,
  },
  basic: {
    type: 'basic',
    hp: 30,
    radius: 12,
    acceleration: 420,
    maxSpeed: 190,
    contactDamage: 10,
    shardCount: 2,
    shapeSides: 5,
    preferredDistance: 300,
    fireCooldownSeconds: 1.8,
    firstShotDelaySeconds: 1.2,
  },
  tank: {
    type: 'tank',
    hp: 130,
    radius: 20,
    acceleration: 170,
    maxSpeed: 75,
    contactDamage: 20,
    shardCount: 4,
    shapeSides: 6,
    preferredDistance: 380,
    areaAttackCooldownSeconds: 2.4,
    areaCastSeconds: 0.9,
    areaRadiusPixels: 70,
    areaDamage: 25,
  },
};

class Enemy {
  constructor(x, y, config) {
    this.type = config.type;
    this.positionX = x;
    this.positionY = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.acceleration = config.acceleration;
    this.maxSpeed = config.maxSpeed;
    this.collisionRadiusPixels = config.radius;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.contactDamage = config.contactDamage;
    this.shardCount = config.shardCount;
    this.shapeSides = config.shapeSides;

    this.introSeconds = 2.5;

    this.preferredDistance = config.preferredDistance ?? 0;
    this.fireCooldownSeconds = config.fireCooldownSeconds ?? 0;
    this.timeUntilShotSeconds = config.firstShotDelaySeconds ?? 0;
    this.areaAttackCooldownSeconds = config.areaAttackCooldownSeconds ?? 0;
    this.areaCastSeconds = config.areaCastSeconds ?? 0;
    this.areaRadiusPixels = config.areaRadiusPixels ?? 0;
    this.areaDamage = config.areaDamage ?? 0;
    this.areaCastRemainingSeconds = 0;
    this.strikeFlashSeconds = 0;
    this.strikeFlashDurationSeconds = 0.3;
    this.areaTargetX = 0;
    this.areaTargetY = 0;

    this.angleRadians = 0;
    this.strafeDirection = Math.random() < 0.5 ? 1 : -1;
    this.strafeTimerSeconds = 1 + Math.random();
    this.hitFlashSeconds = 0;
  }

  get isSpawning() {
    return this.introSeconds > 0;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlashSeconds = 0.08;
    return this.hp <= 0;
  }

  update(elapsedSeconds, ship, enemyBullets) {
    this.introSeconds = Math.max(0, this.introSeconds - elapsedSeconds);
    this.hitFlashSeconds = Math.max(0, this.hitFlashSeconds - elapsedSeconds);
    this.angleRadians = Math.atan2(
      ship.positionY - this.positionY,
      ship.positionX - this.positionX,
    );

    if (this.isSpawning) return;

    this.updateMovement(elapsedSeconds, ship);

    if (this.type === 'basic') {
      this.updateShooting(elapsedSeconds, enemyBullets);
    } else if (this.type === 'tank') {
      this.updateAreaAttack(elapsedSeconds, ship);
    }
  }

  updateMovement(elapsedSeconds, ship) {
    const dx = ship.positionX - this.positionX;
    const dy = ship.positionY - this.positionY;
    const distance = Math.hypot(dx, dy) || 1;

    let desiredDirectionX;
    let desiredDirectionY;

    if (this.type === 'kamikaze') {
      desiredDirectionX = dx / distance;
      desiredDirectionY = dy / distance;
    } else {
      const radialFactor = Math.max(
        -1,
        Math.min(1, (distance - this.preferredDistance) / this.preferredDistance),
      );
      const strafeX = -dy / distance * this.strafeDirection;
      const strafeY = dx / distance * this.strafeDirection;

      this.strafeTimerSeconds -= elapsedSeconds;
      if (this.strafeTimerSeconds <= 0) {
        this.strafeTimerSeconds = 1.5 + Math.random() * 1.5;
        this.strafeDirection *= -1;
      }

      desiredDirectionX = dx / distance * radialFactor + strafeX * 0.6;
      desiredDirectionY = dy / distance * radialFactor + strafeY * 0.6;
      const desiredLength = Math.hypot(desiredDirectionX, desiredDirectionY) || 1;
      desiredDirectionX /= desiredLength;
      desiredDirectionY /= desiredLength;
    }

    this.velocityX += desiredDirectionX * this.acceleration * elapsedSeconds;
    this.velocityY += desiredDirectionY * this.acceleration * elapsedSeconds;

    const speed = Math.hypot(this.velocityX, this.velocityY);
    if (speed > this.maxSpeed) {
      this.velocityX = this.velocityX / speed * this.maxSpeed;
      this.velocityY = this.velocityY / speed * this.maxSpeed;
    }

    this.positionX += this.velocityX * elapsedSeconds;
    this.positionY += this.velocityY * elapsedSeconds;

    this.positionX = Math.max(
      this.collisionRadiusPixels,
      Math.min(worldWidth - this.collisionRadiusPixels, this.positionX),
    );
    this.positionY = Math.max(
      this.collisionRadiusPixels,
      Math.min(worldHeight - this.collisionRadiusPixels, this.positionY),
    );
  }

  updateShooting(elapsedSeconds, enemyBullets) {
    this.timeUntilShotSeconds -= elapsedSeconds;
    if (this.timeUntilShotSeconds > 0) return;

    this.timeUntilShotSeconds = this.fireCooldownSeconds
      * (0.85 + Math.random() * 0.3);

    enemyBullets.push(new EnemyBullet(
      this.positionX + Math.cos(this.angleRadians) * this.collisionRadiusPixels,
      this.positionY + Math.sin(this.angleRadians) * this.collisionRadiusPixels,
      this.angleRadians,
      { speed: 300, damage: 10 },
    ));
  }

  updateAreaAttack(elapsedSeconds, ship) {
    if (this.strikeFlashSeconds > 0) {
      this.strikeFlashSeconds -= elapsedSeconds;
      return;
    }

    if (this.areaCastRemainingSeconds > 0) {
      this.areaCastRemainingSeconds -= elapsedSeconds;
      if (this.areaCastRemainingSeconds <= 0) {
        this.strikeFlashSeconds = this.strikeFlashDurationSeconds;
        const distanceToShip = Math.hypot(
          ship.positionX - this.areaTargetX,
          ship.positionY - this.areaTargetY,
        );
        if (distanceToShip < this.areaRadiusPixels + ship.collisionRadiusPixels) {
          ship.takeDamage(this.areaDamage);
        }
      }
      return;
    }

    this.areaAttackCooldownSeconds -= elapsedSeconds;
    if (this.areaAttackCooldownSeconds > 0) return;

    this.areaAttackCooldownSeconds = 3.6;
    this.areaTargetX = ship.positionX;
    this.areaTargetY = ship.positionY;
    this.areaCastRemainingSeconds = this.areaCastSeconds;
  }

  traceShape(ctx) {
    const radius = this.collisionRadiusPixels + 3;
    ctx.beginPath();
    for (let index = 0; index <= this.shapeSides; index += 1) {
      const angle = index / this.shapeSides * Math.PI * 2;
      const pointX = Math.cos(angle) * radius;
      const pointY = Math.sin(angle) * radius;
      if (index === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    }
    ctx.closePath();
  }

  draw(ctx) {
    if (this.type === 'tank') {
      if (this.areaCastRemainingSeconds > 0) {
        this.drawTelegraph(ctx);
      } else if (this.strikeFlashSeconds > 0) {
        this.drawStrike(ctx);
      }
    }

    ctx.save();
    ctx.translate(this.positionX, this.positionY);
    ctx.rotate(this.angleRadians);
    ctx.shadowColor = COLORS.foreground;
    ctx.shadowBlur = 8;

    if (this.isSpawning) {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = COLORS.foreground;
      ctx.lineWidth = 2;
      this.traceShape(ctx);
      ctx.stroke();
    } else {
      ctx.fillStyle = this.hitFlashSeconds > 0
        ? COLORS.foreground
        : COLORS.background;
      ctx.strokeStyle = COLORS.foreground;
      ctx.lineWidth = 2;
      this.traceShape(ctx);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  drawTelegraph(ctx) {
    const progress = 1 - this.areaCastRemainingSeconds / this.areaCastSeconds;

    ctx.save();
    ctx.translate(this.areaTargetX, this.areaTargetY);
    ctx.strokeStyle = COLORS.foreground;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);

    ctx.globalAlpha = 0.2 + 0.4 * progress;
    ctx.beginPath();
    ctx.arc(0, 0, this.areaRadiusPixels, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha *= 0.4;
    ctx.fillStyle = COLORS.foreground;
    ctx.fill();
    ctx.restore();
  }

  drawStrike(ctx) {
    const progress = Math.max(0, this.strikeFlashSeconds)
      / this.strikeFlashDurationSeconds;

    ctx.save();
    ctx.translate(this.areaTargetX, this.areaTargetY);
    ctx.shadowColor = COLORS.foreground;
    ctx.shadowBlur = 20;

    ctx.globalAlpha = 0.5 * progress;
    ctx.fillStyle = COLORS.foreground;
    ctx.beginPath();
    ctx.arc(0, 0, this.areaRadiusPixels, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = Math.min(1, 0.9 * progress);
    ctx.strokeStyle = COLORS.foreground;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      0, 0,
      this.areaRadiusPixels * (1 + (1 - progress) * 0.3),
      0, Math.PI * 2,
    );
    ctx.stroke();
    ctx.restore();
  }
}
