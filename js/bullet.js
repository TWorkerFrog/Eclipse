class Bullet {
  constructor(x, y, angleRadians, options = {}) {
    this.type = options.type || 'regular';
    const isSpecial = this.type === 'special';
    const speed = options.speed ?? (isSpecial ? 660 : 820);

    this.positionX = x;
    this.positionY = y;
    this.velocityX = Math.cos(angleRadians) * speed;
    this.velocityY = Math.sin(angleRadians) * speed;
    this.radiusPixels = options.radiusPixels ?? (isSpecial ? 7 : 4);
    this.collisionRadiusPixels = this.radiusPixels;
    this.lifetimeSeconds = options.lifetimeSeconds ?? (isSpecial ? 2.2 : 1.15);
    this.damage = options.damage ?? (isSpecial ? 60 : 10);
    this.eraseRadiusPixels = isSpecial ? 30 : 0;
    this.hitEnemies = new Set();
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

class EnemyBullet {
  constructor(x, y, angleRadians, options = {}) {
    const speed = options.speed ?? 300;

    this.positionX = x;
    this.positionY = y;
    this.velocityX = Math.cos(angleRadians) * speed;
    this.velocityY = Math.sin(angleRadians) * speed;
    this.collisionRadiusPixels = options.radiusPixels ?? 5;
    this.damage = options.damage ?? 10;
    this.lifetimeSeconds = options.lifetimeSeconds ?? 4;
  }

  update(elapsedSeconds) {
    this.positionX += this.velocityX * elapsedSeconds;
    this.positionY += this.velocityY * elapsedSeconds;
    this.lifetimeSeconds -= elapsedSeconds;
    return this.lifetimeSeconds > 0 && this.isInsideArena();
  }

  isInsideArena() {
    return this.positionX > -20
      && this.positionX < worldWidth + 20
      && this.positionY > -20
      && this.positionY < worldHeight + 20;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.positionX, this.positionY);
    ctx.rotate(Math.atan2(this.velocityY, this.velocityX));
    ctx.strokeStyle = COLORS.foreground;
    ctx.lineWidth = 3;
    ctx.shadowColor = COLORS.foreground;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(4, 0);
    ctx.stroke();
    ctx.restore();
  }
}
