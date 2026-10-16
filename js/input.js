class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { x: innerWidth / 2, y: innerHeight / 2 };
    this.shootPressed = false;
    this.shootHeld = false;
    this.specialPressed = false;
    this.pausePressed = false;

    window.addEventListener('contextmenu', (e) => {
      if (e.target === canvas) e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener('mousedown', (e) => {
      if (e.target !== canvas) return;
      if (e.button === 0) {
        this.shootPressed = true;
        this.shootHeld = true;
      }
      if (e.button === 2) this.specialPressed = true;
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.shootHeld = false;
    });
    window.addEventListener('blur', () => {
      this.shootHeld = false;
    });

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'KeyP' && !e.repeat) this.pausePressed = true;
      if (e.code === 'KeyF' && !e.repeat) {
        e.preventDefault();
        window.dispatchEvent(new Event('fullscreen-toggle'));
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.shootHeld = false;
    });
  }

  movementDirection() {
    return {
      x: (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0),
      y: (this.keys.has('KeyS') ? 1 : 0) - (this.keys.has('KeyW') ? 1 : 0),
    };
  }
}