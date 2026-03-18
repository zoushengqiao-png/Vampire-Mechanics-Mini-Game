/**
 * 基础游戏类 - 所有子游戏的父类
 * 提供统一的接口和通用功能
 */

import GameFramework from './GameFramework';

export default class BaseGame {
  constructor() {
    this.framework = null;
    this.gameState = 'ready'; // ready, playing, paused, gameOver
    this.score = 0;
    this.highScore = 0;
    this.startTime = 0;
    this.playTime = 0;
    this.isPaused = false;

    // 触控相关
    this.touchHandlers = new Map();
  }

  /**
   * 设置框架引用
   */
  setFramework(framework) {
    this.framework = framework;
  }

  /**
   * 初始化游戏 - 子类重写
   */
  init() {
    this.reset();
    this.gameState = 'playing';
    this.startTime = Date.now();
    this.loadHighScore();
    this.setupTouchEvents();
  }

  /**
   * 重置游戏 - 子类重写
   */
  reset() {
    this.score = 0;
    this.gameState = 'ready';
    this.startTime = 0;
    this.playTime = 0;
    this.isPaused = false;
  }

  /**
   * 更新游戏逻辑 - 子类重写
   */
  update() {
    if (this.gameState !== 'playing' || this.isPaused) return;

    this.playTime = Date.now() - this.startTime;
  }

  /**
   * 渲染游戏 - 子类重写
   */
  render(ctx) {
    // 子类实现具体渲染逻辑
  }

  /**
   * 暂停游戏
   */
  pause() {
    this.isPaused = true;
    this.gameState = 'paused';
  }

  /**
   * 恢复游戏
   */
  resume() {
    this.isPaused = false;
    this.gameState = 'playing';
    this.startTime = Date.now() - this.playTime;
  }

  /**
   * 游戏结束
   */
  endGame() {
    this.gameState = 'gameOver';
    this.saveHighScore();

    this.framework.gameOver({
      score: this.score,
      playTime: this.playTime,
      completed: this.checkCompletion()
    });
  }

  /**
   * 检查游戏完成 - 子类重写
   */
  checkCompletion() {
    return false;
  }

  /**
   * 加载最高分
   */
  loadHighScore() {
    const key = `highscore_${this.constructor.name}`;
    this.highScore = this.framework.sharedResources.storage.get(key, 0);
  }

  /**
   * 保存最高分
   */
  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      const key = `highscore_${this.constructor.name}`;
      this.framework.sharedResources.storage.set(key, this.highScore);
      this.framework.unlockAchievement(`${this.constructor.name}_highscore`);
    }
  }

  /**
   * 添加分数
   */
  addScore(points) {
    this.score += points;
    this.onScoreChange();
  }

  /**
   * 分数变化回调
   */
  onScoreChange() {
    // 可以在这里实现分数动画效果
  }

  /**
   * 设置触摸事件处理器
   */
  setupTouchEvents() {
    // 清除之前的事件
    this.touchHandlers.clear();

    // 子类可以调用此方法添加事件
  }

  /**
   * 添加触摸处理器
   */
  addTouchHandler(type, handler) {
    if (!this.touchHandlers.has(type)) {
      this.touchHandlers.set(type, []);
    }
    this.touchHandlers.get(type).push(handler);
  }

  /**
   * 处理触摸事件
   */
  handleTouchEvent(type, event) {
    const handlers = this.touchHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        handler(event);
      });
    }
  }

  /**
   * 游戏结束回调
   */
  onGameOver(result) {
    // 子类可以重写
  }

  /**
   * 渲染通用UI（分数、时间等）
   */
  renderCommonUI(ctx) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;
    const colors = this.framework.sharedResources.ui.colors;

    // 顶部栏
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, SCREEN_WIDTH, 60);

    // 分数
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`分数: ${this.score}`, 20, 38);

    // 最高分
    ctx.font = '18px Arial';
    ctx.fillStyle = '#888';
    ctx.fillText(`最高: ${this.highScore}`, 20, 58);

    // 时间
    const minutes = Math.floor(this.playTime / 60000);
    const seconds = Math.floor((this.playTime % 60000) / 1000);
    ctx.textAlign = 'right';
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, SCREEN_WIDTH - 20, 38);

    // 返回按钮
    this.renderBackButton(ctx);
  }

  /**
   * 渲染返回按钮
   */
  renderBackButton(ctx) {
    const { SCREEN_WIDTH } = GameGlobal;
    const colors = this.framework.sharedResources.ui.colors;

    const buttonX = SCREEN_WIDTH - 50;
    const buttonY = 10;
    const buttonSize = 40;

    ctx.fillStyle = colors.secondary;
    ctx.fillRect(buttonX, buttonY, buttonSize, buttonSize);

    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2;
    ctx.strokeRect(buttonX, buttonY, buttonSize, buttonSize);

    // 绘制返回图标
    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(buttonX + buttonSize - 10, buttonY + buttonSize / 2);
    ctx.lineTo(buttonX + 10, buttonY + buttonSize / 2);
    ctx.lineTo(buttonX + 20, buttonY + 15);
    ctx.moveTo(buttonX + 10, buttonY + buttonSize / 2);
    ctx.lineTo(buttonX + 20, buttonY + buttonSize - 15);
    ctx.stroke();
  }

  /**
   * 渲染暂停按钮
   */
  renderPauseButton(ctx) {
    const { SCREEN_WIDTH } = GameGlobal;
    const colors = this.framework.sharedResources.ui.colors;

    const buttonX = SCREEN_WIDTH - 100;
    const buttonY = 10;
    const buttonSize = 40;

    ctx.fillStyle = colors.secondary;
    ctx.fillRect(buttonX, buttonY, buttonSize, buttonSize);

    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2;
    ctx.strokeRect(buttonX, buttonY, buttonSize, buttonSize);

    // 绘制暂停图标（两条竖线）
    ctx.fillStyle = colors.text;
    ctx.fillRect(buttonX + 12, buttonY + 10, 6, 20);
    ctx.fillRect(buttonX + 22, buttonY + 10, 6, 20);
  }

  /**
   * 检测点击是否在按钮区域
   */
  isButtonClick(x, y, buttonX, buttonY, size = 40) {
    return x >= buttonX && x <= buttonX + size &&
           y >= buttonY && y <= buttonY + size;
  }

  /**
   * 处理UI点击
   */
  handleUIClick(x, y) {
    const { SCREEN_WIDTH } = GameGlobal;

    // 返回按钮
    if (this.isButtonClick(x, y, SCREEN_WIDTH - 50, 10)) {
      this.framework.returnToMenu();
      return true;
    }

    // 暂停按钮
    if (this.isButtonClick(x, y, SCREEN_WIDTH - 100, 10)) {
      if (this.gameState === 'playing') {
        this.framework.pauseGame();
      } else if (this.gameState === 'paused') {
        this.framework.resumeGame();
      }
      return true;
    }

    return false;
  }

  /**
   * 游戏信息 - 子类必须实现
   */
  static getGameInfo() {
    return {
      id: '',
      name: '',
      description: '',
      version: '1.0.0',
      author: '',
      thumbnail: ''
    };
  }

  /**
   * 获取游戏规则描述 - 子类实现
   */
  static getRules() {
    return [];
  }
}

/**
 * 网格游戏基类（适用于2048、消消乐等）
 */
export class GridGame extends BaseGame {
  constructor(rows, cols, cellSize) {
    super();
    this.rows = rows;
    this.cols = cols;
    this.cellSize = cellSize;
    this.grid = [];
    this.gridOffsetX = 0;
    this.gridOffsetY = 0;

    this.calculateGridPosition();
  }

  /**
   * 计算网格居中位置
   */
  calculateGridPosition() {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;
    const totalWidth = this.cols * this.cellSize;
    const totalHeight = this.rows * this.cellSize;
    const gap = 10;
    const padding = 20;

    this.gridOffsetX = (SCREEN_WIDTH - totalWidth - (this.cols - 1) * gap) / 2;
    this.gridOffsetY = (SCREEN_HEIGHT - totalHeight - (this.rows - 1) * gap) / 2 + 30;
    this.gap = gap;
  }

  /**
   * 获取单元格位置
   */
  getCellPosition(row, col) {
    return {
      x: this.gridOffsetX + col * (this.cellSize + this.gap),
      y: this.gridOffsetY + row * (this.cellSize + this.gap)
    };
  }

  /**
   * 渲染网格背景
   */
  renderGrid(ctx) {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const pos = this.getCellPosition(row, col);
        this.renderCell(ctx, pos.x, pos.y, this.cellSize, '#ccc');
      }
    }
  }

  /**
   * 渲染单元格
   */
  renderCell(ctx, x, y, size, color, value = '') {
    const colors = this.framework?.sharedResources?.ui?.colors || {
      background: '#1a1a2e',
      text: '#ffffff'
    };

    // 圆角矩形
    const radius = 5;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + size - radius, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
    ctx.lineTo(x + size, y + size - radius);
    ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
    ctx.lineTo(x + radius, y + size);
    ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    // 边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 值
    if (value) {
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(value, x + size / 2, y + size / 2);
    }
  }

  /**
   * 获取点击的单元格
   */
  getClickedCell(x, y) {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const pos = this.getCellPosition(row, col);
        if (x >= pos.x && x <= pos.x + this.cellSize &&
            y >= pos.y && y <= pos.y + this.cellSize) {
          return { row, col };
        }
      }
    }
    return null;
  }
}

/**
 * 卡牌游戏基类（适用于蜘蛛纸牌等）
 */
export class CardGame extends BaseGame {
  constructor() {
    super();
    this.cards = [];
    this.piles = [];
    this.selectedCard = null;
    this.draggedCard = null;
  }

  /**
   * 创建卡牌
   */
  createCard(suit, rank, faceUp = false) {
    return {
      suit,
      rank,
      faceUp,
      x: 0,
      y: 0,
      width: 60,
      height: 80,
      targetX: 0,
      targetY: 0
    };
  }

  /**
   * 渲染卡牌
   */
  renderCard(ctx, card) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;
    const colors = this.framework?.sharedResources?.ui?.colors || {
      background: '#1a1a2e',
      text: '#ffffff'
    };

    // 卡牌背景
    ctx.fillStyle = card.faceUp ? '#ffffff' : '#3a5a8a';
    ctx.fillRect(card.x, card.y, card.width, card.height);

    // 边框
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(card.x, card.y, card.width, card.height);

    if (card.faceUp) {
      // 花色颜色
      const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
      ctx.fillStyle = isRed ? '#e74c3c' : '#2c3e50';

      // 显示卡牌内容
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(this.getRankSymbol(card.rank), card.x + 5, card.y + 5);

      ctx.font = '16px Arial';
      ctx.fillText(this.getSuitSymbol(card.suit), card.x + 5, card.y + 25);

      // 中央花色
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        this.getSuitSymbol(card.suit),
        card.x + card.width / 2,
        card.y + card.height / 2
      );
    } else {
      // 背面图案
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(card.x + 5, card.y + 5, card.width - 10, card.height - 10);
    }
  }

  /**
   * 获取花色符号
   */
  getSuitSymbol(suit) {
    const symbols = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };
    return symbols[suit] || suit;
  }

  /**
   * 获取等级符号
   */
  getRankSymbol(rank) {
    const symbols = {
      1: 'A',
      11: 'J',
      12: 'Q',
      13: 'K'
    };
    return symbols[rank] || rank.toString();
  }

  /**
   * 检测点击的卡牌
   */
  getClickedCard(x, y, pile) {
    // 从上往下检测（渲染顺序的反向）
    for (let i = pile.cards.length - 1; i >= 0; i--) {
      const card = pile.cards[i];
      if (x >= card.x && x <= card.x + card.width &&
          y >= card.y && y <= card.y + card.height) {
        return { card, index: i };
      }
    }
    return null;
  }
}
