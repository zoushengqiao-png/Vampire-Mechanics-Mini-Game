import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

export default class VirtualJoystick {
  constructor() {
    this.centerX = 0;
    this.centerY = 0;
    this.outerRadius = 60;
    this.innerRadius = 30;
    
    this.isActive = false;
    this.touchId = null;
    this.innerX = 0;
    this.innerY = 0;
    this.direction = { x: 0, y: 0 };
    this.angle = 0;
    
    this.init();
  }
  
  init() {
    if (typeof SCREEN_WIDTH !== 'undefined' && typeof SCREEN_HEIGHT !== 'undefined') {
      this.centerX = SCREEN_WIDTH / 2;
      this.centerY = SCREEN_HEIGHT - 120;
      this.innerX = this.centerX;
      this.innerY = this.centerY;
    } else {
      this.centerX = 187;
      this.centerY = 547;
      this.innerX = this.centerX;
      this.innerY = this.centerY;
    }
  }

  handleTouchStart(touches) {
    const isUIHidden = GameGlobal.mainInstance && (
      GameGlobal.mainInstance.isPaused || 
      GameGlobal.databus.isGameOver || 
      GameGlobal.mainInstance.showSettings ||
      (GameGlobal.mainInstance.levelUpSystem && GameGlobal.mainInstance.levelUpSystem.isPaused) ||
      (GameGlobal.mainInstance.transition && GameGlobal.mainInstance.transition.active)
    );
    
    if (isUIHidden) return false;
    
    for (let touch of touches) {
      if (touch.clientY > SCREEN_HEIGHT * 0.6) {
        const dist = this.getDistance(touch.clientX, touch.clientY, this.centerX, this.centerY);
        
        if (dist <= this.outerRadius + 30) {
          this.isActive = true;
          this.touchId = touch.identifier;
          this.updateInnerPosition(touch.clientX, touch.clientY);
          return true;
        }
      }
    }
    return false;
  }

  handleTouchMove(touches) {
    const isUIHidden = GameGlobal.mainInstance && (
      GameGlobal.mainInstance.isPaused || 
      GameGlobal.databus.isGameOver || 
      GameGlobal.mainInstance.showSettings ||
      (GameGlobal.mainInstance.levelUpSystem && GameGlobal.mainInstance.levelUpSystem.isPaused) ||
      (GameGlobal.mainInstance.transition && GameGlobal.mainInstance.transition.active)
    );
    
    if (isUIHidden) return false;
    
    if (!this.isActive) return false;

    for (let touch of touches) {
      if (touch.identifier === this.touchId) {
        this.updateInnerPosition(touch.clientX, touch.clientY);
        return true;
      }
    }
    return false;
  }

  handleTouchEnd(touches) {
    const isUIHidden = GameGlobal.mainInstance && (
      GameGlobal.mainInstance.isPaused || 
      GameGlobal.databus.isGameOver || 
      GameGlobal.mainInstance.showSettings ||
      (GameGlobal.mainInstance.levelUpSystem && GameGlobal.mainInstance.levelUpSystem.isPaused) ||
      (GameGlobal.mainInstance.transition && GameGlobal.mainInstance.transition.active)
    );
    
    if (isUIHidden) return false;
    
    if (!this.isActive) return false;

    let touchEnded = false;
    for (let touch of touches) {
      if (touch.identifier === this.touchId) {
        touchEnded = true;
        break;
      }
    }

    if (touchEnded || touches.length === 0) {
      this.isActive = false;
      this.touchId = null;
      this.innerX = this.centerX;
      this.innerY = this.centerY;
      this.direction = { x: 0, y: 0 };
      this.angle = 0;
      return true;
    }
    return false;
  }

  updateInnerPosition(touchX, touchY) {
    let dx = touchX - this.centerX;
    let dy = touchY - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= this.outerRadius) {
      this.innerX = touchX;
      this.innerY = touchY;
    } else {
      const ratio = this.outerRadius / dist;
      this.innerX = this.centerX + dx * ratio;
      this.innerY = this.centerY + dy * ratio;
    }

    const finalDx = this.innerX - this.centerX;
    const finalDy = this.innerY - this.centerY;
    const finalDist = Math.sqrt(finalDx * finalDx + finalDy * finalDy);

    if (finalDist > this.outerRadius * 0.1) {
      const normalizedX = finalDx / finalDist;
      const normalizedY = finalDy / finalDist;
      this.direction = {
        x: normalizedX,
        y: normalizedY
      };
      this.angle = Math.atan2(finalDy, finalDx);
    } else {
      this.direction = { x: 0, y: 0 };
      this.angle = 0;
    }
  }

  getDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  render(ctx) {
    const isUIHidden = GameGlobal.mainInstance && (
      GameGlobal.mainInstance.isPaused || 
      GameGlobal.databus.isGameOver || 
      GameGlobal.mainInstance.showSettings ||
      (GameGlobal.mainInstance.levelUpSystem && GameGlobal.mainInstance.levelUpSystem.isPaused) ||
      (GameGlobal.mainInstance.transition && GameGlobal.mainInstance.transition.active)
    );
    
    if (isUIHidden) return;
    
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.outerRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#333333';
    ctx.globalAlpha = 0.2;
    ctx.fill();
    
    ctx.globalAlpha = this.isActive ? 0.6 : 0.4;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.innerX, this.innerY, this.innerRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
  }
}
