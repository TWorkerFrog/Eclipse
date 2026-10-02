// Анимация плавающих текстур
class FloatingTextures {
  constructor() {
    this.textures = [
      'assets/textures/effects/Texture_(1).png',
      'assets/textures/effects/Texture_(2).png',
      'assets/textures/effects/Texture_(3).png',
    ];
    this.spawnInterval = 9000;
    this.lastSpawn = 0;
    // Видео-текстура
    this.video = document.createElement('video');
    this.video.src = 'assets/textures/effects/Texture_(1).mp4';
    this.video.loop = true;
    this.video.muted = true;
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.style.display = 'none';
    document.body.appendChild(this.video);
    this.video.play().catch(() => console.log('Video autoplay blocked'));
  }

  spawn() {
    const now = performance.now();
    if (now - this.lastSpawn < this.spawnInterval) return;
    this.lastSpawn = now;

    const el = document.createElement('div');
    el.className = 'floating-texture';
    
    // 80% шанс видео, 20% статичная текстура
    const useVideo = Math.random() > 0.2;
    
    if (useVideo && this.video.readyState >= 2) {
      // Создаём canvas для видео-текстуры
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 96;
      el.appendChild(canvas);
      
      const ctx = canvas.getContext('2d');
      let frame = 0;
      const renderVideo = () => {
        if (!document.body.contains(el)) return;
        // Добавляем лёгкое мерцание
        const flicker = 0.85 + Math.sin(frame * 0.1) * 0.15;
        ctx.globalAlpha = flicker;
        ctx.drawImage(this.video, 0, 0, 96, 96);
        ctx.globalAlpha = 1;
        frame++;
        requestAnimationFrame(renderVideo);
      };
      renderVideo();
    } else {
      // Случайная статичная текстура
      const texIndex = Math.floor(Math.random() * this.textures.length);
      el.style.backgroundImage = `url('${this.textures[texIndex]}')`;
    }
    // Случайная позиция старта
    const startX = Math.random() * Math.max(0, window.innerWidth - 68);
    const startY = Math.random() * Math.max(0, window.innerHeight - 68);
    el.style.left = startX + 'px';
    el.style.top = startY + 'px';
    
    // Случайное направление движения (меньше амплитуда)
    const moveX = (Math.random() - 0.5) * 48;
    const moveY = (Math.random() - 0.5) * 48;
    
    el.style.setProperty('--tx', moveX + 'px');
    el.style.setProperty('--ty', moveY + 'px');
    const duration = 650 + Math.random() * 250;
    el.style.animation = `float-texture ${duration}ms ease-in-out forwards`;
    
    document.body.appendChild(el);
    
    // Удаляем после анимации
    setTimeout(() => el.remove(), duration);
  }

  update(isPlaying) {
    if (!isPlaying) return;

    this.spawn();
  }
}

const floatingTextures = new FloatingTextures();
