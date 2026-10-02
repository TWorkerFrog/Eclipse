class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { x: innerWidth / 2, y: innerHeight / 2 };
    this.shootPressed = false;   
    this.specialPressed = false; 
    this.dashPressed = false;  
    this.escapePressed = false; 
    this.pausePressed = false;  

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener('mousedown', (e) => {
      if (e.target !== canvas) return; 
      if (e.button === 0) this.shootPressed = true;
      if (e.button === 2) this.specialPressed = true;
    });
    window.addEventListener('contextmenu', (e) => {
      if (e.target === canvas) e.preventDefault(); 
    });

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space') {
        this.dashPressed = true;
        e.preventDefault();
      }
      if (e.code === 'Escape' && !e.repeat) this.escapePressed = true;
      if (e.code === 'KeyP' && !e.repeat) this.pausePressed = true;
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  movementDirection() {
    return {
      x: (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0),
      y: (this.keys.has('KeyS') ? 1 : 0) - (this.keys.has('KeyW') ? 1 : 0),
    };
  }
}