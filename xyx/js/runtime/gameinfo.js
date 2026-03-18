import TinyEmitter from '../libs/tinyemitter';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

export default class GameInfo extends TinyEmitter {
  constructor() {
    super();
    // 暂停按钮位置（左上角，原设置按钮位置）
    this.pauseButton = {
      x: 15,
      y: 40,
      width: 40,
      height: 40
    };
    // 设置按钮位置（暂停界面中使用）
    this.settingsButton = {
      x: 15,
      y: 40,
      width: 40,
      height: 40
    };
  }

  setFont(ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
  }

  // 绘制圆角矩形背景（深灰色半透明）
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';  // 白色，10% 透明度
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  render(ctx) {
    if (GameGlobal.databus) {
      const cornerRadius = 10;

      // ========== 左上角暂停按钮（暂停、游戏结束或显示设置弹窗时隐藏）==========
      const isPausedOrGameOver = GameGlobal.mainInstance && (GameGlobal.mainInstance.isPaused || GameGlobal.databus.isGameOver || GameGlobal.mainInstance.showSettings);
      if (!isPausedOrGameOver) {
        const pauseBtn = this.pauseButton;
        this.drawRoundedRect(ctx, pauseBtn.x, pauseBtn.y, pauseBtn.width, pauseBtn.height, cornerRadius);

        // 绘制暂停图标（两条竖线）
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(pauseBtn.x + 12, pauseBtn.y + 10, 6, 20);
        ctx.fillRect(pauseBtn.x + 22, pauseBtn.y + 10, 6, 20);
      }
      
      // ========== 右上角信息面板（时间、积分、金币）==========
      const rightPanelX = SCREEN_WIDTH - 147;
      const rightPanelY = 40;
      const rightPanelWidth = 132;
      const rightPanelHeight = 90;  // 上边距16 + 时间14 + 行距24 + 积分14 + 行距24 + 金币14 + 下边距16 = 122，调整为80，增加10
      
      // 绘制半透明圆角背景
      this.drawRoundedRect(ctx, rightPanelX, rightPanelY, rightPanelWidth, rightPanelHeight, cornerRadius);
      
      ctx.textAlign = 'left';
      ctx.font = '14px Arial';
      
      if (GameGlobal.mainInstance && GameGlobal.mainInstance.enemyEnhancementSystem) {
        // 计算游戏时间（1小时内显示分:秒，超过1小时显示时:分:秒），数字取整
        const totalFrames = Math.round(GameGlobal.mainInstance.gameFrame);
        const totalSeconds = Math.round(totalFrames / 60);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        let timeStr;
        if (hours > 0) {
          // 超过1小时，显示时:分:秒
          timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
          // 1小时内，显示分:秒
          timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // 第一行：时间（白色）
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`时间：${timeStr}`, rightPanelX + 16, rightPanelY + 28);
        
        // 第二行：积分（白色）
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`积分：${GameGlobal.databus.score}`, rightPanelX + 16, rightPanelY + 52);
        
        // 第三行：金币（白色）
        if (GameGlobal.databus.player) {
          const coins = GameGlobal.databus.player.stats.totalCoins || 0;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`金币：${coins}`, rightPanelX + 16, rightPanelY + 76);
        }
      }
    }
  }
  
  handleTouch(x, y) {
    // 检查暂停按钮
    const pauseBtn = this.pauseButton;
    if (x >= pauseBtn.x && x <= pauseBtn.x + pauseBtn.width && y >= pauseBtn.y && y <= pauseBtn.y + pauseBtn.height) {
      // 点击暂停按钮，暂停游戏
      if (GameGlobal.mainInstance) {
        GameGlobal.mainInstance.isPaused = true;
      }
      return true;
    }

    return false;
  }
}
