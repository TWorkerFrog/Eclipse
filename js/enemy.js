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
    this.contactCooldownSeconds = 0;
    this.contactDamageCooldownSeconds = config.contactDamageCooldownSeconds ?? 1;
    this.shardCount = config.shardCount;
    this.shapeSides = config.shapeSides; // фигура врага

    this.introSeconds = 2.5; // Время на появление
    this.preferredDistance = config.preferredDistance ?? 0; // расстояние от игрока

    this.attackCooldownSeconds = config.attackCooldownSeconds ?? 0; // пауза между атаками
    this.timeUntilShotSeconds = config.firstShotDelaySeconds ?? 0; // таймер до следующей атаки
    this.bulletSpeed = config.bulletSpeed ?? 0;
    this.damage = config.damage ?? 0; 

    // Характеристики для танка
    this.areaCastSeconds = config.areaCastSeconds ?? 0; // Длительность предупреждения о выстреле
    this.areaRadiusPixels = config.areaRadiusPixels ?? 0;
    this.areaCastStarted = false; // Фиксация места выстрела
    this.strikeFlashSeconds = 0; 
    this.strikeFlashDurationSeconds = 0.3; // Время вспышки после выстрела
    this.areaTargetX = 0;
    this.areaTargetY = 0;

    this.angleRadians = 0;
    this.strafeDirection = Math.random() < 0.5 ? 1 : -1; // Направление уклонения
    this.strafeTimerSeconds = 1 + Math.random();
    this.hitFlashSeconds = 0; // Подстветка, сигнализирующая о попадании

    // Отброс от тарана: не ограничен maxSpeed и живёт по своему таймеру
    this.knockbackVelocityX = 0;
    this.knockbackVelocityY = 0;
    this.knockbackRemainingSeconds = 0;
  }

  // Время на спавн, чтобы не наносился урон
  get isSpawning() {
    return this.introSeconds > 0;
  }

  // Наносит урон врагу
  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlashSeconds = 0.08;
    return this.hp <= 0;
  }

  // Обновление одного врага за кадр
  update(elapsedSeconds, ship, enemyBullets) {
    this.introSeconds = Math.max(0, this.introSeconds - elapsedSeconds);
    this.hitFlashSeconds = Math.max(0, this.hitFlashSeconds - elapsedSeconds);
    this.contactCooldownSeconds = Math.max(
      0,
      this.contactCooldownSeconds - elapsedSeconds,
    );
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

  // Движение врага
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

    if (this.knockbackRemainingSeconds > 0) {
      this.knockbackRemainingSeconds = Math.max(
        0,
        this.knockbackRemainingSeconds - elapsedSeconds,
      );
      this.positionX += this.knockbackVelocityX * elapsedSeconds;
      this.positionY += this.knockbackVelocityY * elapsedSeconds;
      if (this.knockbackRemainingSeconds <= 0) {
        this.knockbackVelocityX = 0;
        this.knockbackVelocityY = 0;
      }
    }

    this.positionX = Math.max(
      this.collisionRadiusPixels,
      Math.min(worldWidth - this.collisionRadiusPixels, this.positionX),
    );
    this.positionY = Math.max(
      this.collisionRadiusPixels,
      Math.min(worldHeight - this.collisionRadiusPixels, this.positionY),
    );
  }

  // Стрельба обычного врага
  updateShooting(elapsedSeconds, enemyBullets) {
    this.timeUntilShotSeconds -= elapsedSeconds;
    if (this.timeUntilShotSeconds > 0) return;

    this.timeUntilShotSeconds = this.attackCooldownSeconds
      * (0.85 + Math.random() * 0.3);

    enemyBullets.push(new EnemyBullet(
      this.positionX + Math.cos(this.angleRadians) * this.collisionRadiusPixels,
      this.positionY + Math.sin(this.angleRadians) * this.collisionRadiusPixels,
      this.angleRadians,
      { speed: this.bulletSpeed, damage: this.damage },
    ));
  }

  updateAreaAttack(elapsedSeconds, ship) {
    if (this.strikeFlashSeconds > 0) {
      this.strikeFlashSeconds -= elapsedSeconds;
      return;
    }

    this.timeUntilShotSeconds -= elapsedSeconds;

    // Прокаст от танка
    if (this.timeUntilShotSeconds > 0 && this.timeUntilShotSeconds <= this.areaCastSeconds) {
      if (!this.areaCastStarted) {
        this.areaCastStarted = true;
        this.areaTargetX = ship.positionX;
        this.areaTargetY = ship.positionY;
      }
    } else {
      this.areaCastStarted = false;
    }

    if (this.timeUntilShotSeconds > 0) {
      return;
    }


    this.timeUntilShotSeconds = this.attackCooldownSeconds + this.areaCastSeconds;
    this.strikeFlashSeconds = this.strikeFlashDurationSeconds;
    const distanceToShip = Math.hypot(
      ship.positionX - this.areaTargetX,
      ship.positionY - this.areaTargetY,
    );
    if (distanceToShip < this.areaRadiusPixels + ship.collisionRadiusPixels) {
      ship.takeDamage(this.damage);
    }
  }

  // Отрисовка корабля врага
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
      if (this.timeUntilShotSeconds <= this.areaCastSeconds && this.timeUntilShotSeconds > 0) {
        this.drawTelegraph(ctx);
      } else if (this.strikeFlashSeconds > 0) {
        this.drawStrike(ctx);
      }
    }

    ctx.save();
    ctx.translate(this.positionX, this.positionY);
    ctx.rotate(this.angleRadians);
    ctx.shadowColor = colors.foreground;
    ctx.shadowBlur = 8;

    // Фаза спавна
    if (this.isSpawning) {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = colors.foreground;
      ctx.lineWidth = 2;
      this.traceShape(ctx);
      ctx.stroke();
    } else {
      ctx.fillStyle = this.hitFlashSeconds > 0
        ? colors.foreground
        : colors.background;
      ctx.strokeStyle = colors.foreground;
      ctx.lineWidth = 2;
      this.traceShape(ctx);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // Прокаст
  drawTelegraph(ctx) {
    const progress = 1 - this.timeUntilShotSeconds / this.areaCastSeconds;

    ctx.save();
    ctx.translate(this.areaTargetX, this.areaTargetY);
    ctx.strokeStyle = colors.foreground;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);

    ctx.globalAlpha = 0.2 + 0.4 * progress;
    ctx.beginPath();
    ctx.arc(0, 0, this.areaRadiusPixels, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha *= 0.4;
    ctx.fillStyle = colors.foreground;
    ctx.fill();
    ctx.restore();
  }

  // Атака танка
  drawStrike(ctx) {
    const progress = Math.max(0, this.strikeFlashSeconds)
      / this.strikeFlashDurationSeconds;

    ctx.save();
    ctx.translate(this.areaTargetX, this.areaTargetY);
    ctx.shadowColor = colors.foreground;
    ctx.shadowBlur = 20;

    ctx.globalAlpha = 0.5 * progress;
    ctx.fillStyle = colors.foreground;
    ctx.beginPath();
    ctx.arc(0, 0, this.areaRadiusPixels, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = Math.min(1, 0.9 * progress);
    ctx.strokeStyle = colors.foreground;
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
