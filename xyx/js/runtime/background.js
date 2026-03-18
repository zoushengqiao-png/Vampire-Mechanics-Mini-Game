import Sprite from '../base/sprite';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

export default class BackGround extends Sprite {
  constructor() {
    super(null, SCREEN_WIDTH, SCREEN_HEIGHT);
    this.color = '#1a1a2e';
  }

  render(ctx) {
    // 绘制背景色
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制网格背景
    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 1;
    const gridSize = 50;

    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  update() {
    // 背景滚动效果
  }
}
