class Projectile {
  constructor(x, y, angleRadians, speed) {
    this.positionX = x;
    this.positionY = y;
    this.velocityX = Math.cos(angleRadians) * speed;
    this.velocityY = Math.sin(angleRadians) * speed;
  }

  update(elapsedSeconds) {
    this.positionX += this.velocityX * elapsedSeconds;
    this.positionY += this.velocityY * elapsedSeconds;
    this.lifetimeSeconds -= elapsedSeconds;
    return this.lifetimeSeconds > 0 && this.isInsideArena();
  }

  isInsideArena() {
    return this.positionX > -40
      && this.positionX < worldWidth + 40
      && this.positionY > -40
      && this.positionY < worldHeight + 40;
  }
}

class Bullet extends Projectile {
  constructor(x, y, angleRadians, options = {}) {
    const type = options.type || 'regular';
    const base = bulletBase[type];

    super(x, y, angleRadians, options.speed ?? base.speed);

    this.type = type;
    this.collisionRadiusPixels = options.collisionRadiusPixels ?? base.radius;
    this.lifetimeSeconds = options.lifetimeSeconds ?? base.lifetimeSeconds;
    this.damage = options.damage ?? base.damage;
    this.hitEnemies = new Set();
  }

  draw(ctx) {
    const isSpecial = this.type === 'special';
    const sprite = isSpecial ? assets.bigBullet : assets.bullet;

    ctx.save();
    ctx.translate(this.positionX, this.positionY);
    ctx.rotate(Math.atan2(this.velocityY, this.velocityX) + Math.PI / 2);
    ctx.shadowColor = colors.foreground;
    ctx.shadowBlur = isSpecial ? 16 : 8;

    // Отрисовка на случай не прогрузки svg
    if (sprite.complete && sprite.naturalWidth > 0) {
      const width = isSpecial ? 44 : 12;
      const height = isSpecial ? 26 : 24;
      ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
    } else {
      ctx.strokeStyle = colors.foreground;
      ctx.lineWidth = isSpecial ? 6 : this.collisionRadiusPixels;
      ctx.beginPath();
      ctx.moveTo(-this.velocityX * 0.025, -this.velocityY * 0.025);
      ctx.lineTo(0, 0);
      ctx.stroke();
    }
    ctx.restore();
  }
}

class EnemyBullet extends Projectile {
  constructor(x, y, angleRadians, options) {
    super(x, y, angleRadians, options.speed);

    this.collisionRadiusPixels = options.collisionRadiusPixels ?? enemyBulletBase.radius;
    this.damage = options.damage;
    this.lifetimeSeconds = options.lifetimeSeconds ?? enemyBulletBase.lifetimeSeconds;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.positionX, this.positionY);
    ctx.rotate(Math.atan2(this.velocityY, this.velocityX));
    ctx.strokeStyle = colors.foreground;
    ctx.lineWidth = 3;
    ctx.shadowColor = colors.foreground;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(4, 0);
    ctx.stroke();
    ctx.restore();
  }
}
