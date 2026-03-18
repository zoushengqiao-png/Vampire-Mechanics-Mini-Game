/**
 * 拼图游戏
 * 核心机制：碎片旋转、位置匹配
 */

import BaseGame from '../core/BaseGame';

export default class PuzzleGame extends BaseGame {
  constructor() {
    super();
    this.name = '拼图';
    this.description = '旋转碎片，完成拼图！';

    // 游戏配置
    this.gridSize = 3; // 3x3网格
    this.puzzleImage = null;
    this.pieces = [];
    this.selectedPiece = null;

    // 拼图尺寸
    this.puzzleWidth = 270;
    this.puzzleHeight = 270;
    this.pieceWidth = this.puzzleWidth / this.gridSize;
    this.pieceHeight = this.puzzleHeight / this.gridSize;

    // 旋转角度
    this.rotationAngles = [0, 90, 180, 270];
  }

  /**
   * 初始化游戏
   */
  init() {
    super.init();
    this.createPuzzle();
  }

  /**
   * 创建拼图
   */
  createPuzzle() {
    this.pieces = [];

    // 创建拼图碎片
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const piece = {
          row,
          col,
          correctRow: row,
          correctCol: col,
          x: 0,
          y: 0,
          rotation: this.rotationAngles[Math.floor(Math.random() * 4)],
          correctRotation: 0,
          isCorrect: false,
          color: this.getPieceColor(row, col)
        };

        // 初始位置
        this.updatePiecePosition(piece);
        this.pieces.push(piece);
      }
    }

    // 随机打乱位置
    this.shufflePieces();
  }

  /**
   * 获取碎片颜色（模拟图片效果）
   */
  getPieceColor(row, col) {
    const hue = (row * 30 + col * 30) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }

  /**
   * 更新碎片位置
   */
  updatePiecePosition(piece) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;
    const puzzleX = (SCREEN_WIDTH - this.puzzleWidth) / 2;
    const puzzleY = (SCREEN_HEIGHT - this.puzzleHeight) / 2 + 30;

    piece.x = puzzleX + piece.col * this.pieceWidth;
    piece.y = puzzleY + piece.row * this.pieceHeight;
  }

  /**
   * 打乱碎片
   */
  shufflePieces() {
    // Fisher-Yates洗牌算法
    for (let i = this.pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      // 交换位置
      const tempRow = this.pieces[i].row;
      const tempCol = this.pieces[i].col;
      this.pieces[i].row = this.pieces[j].row;
      this.pieces[i].col = this.pieces[j].col;
      this.pieces[j].row = tempRow;
      this.pieces[j].col = tempCol;

      // 更新位置
      this.updatePiecePosition(this.pieces[i]);
      this.updatePiecePosition(this.pieces[j]);
    }

    // 随机旋转
    this.pieces.forEach(piece => {
      piece.rotation = this.rotationAngles[Math.floor(Math.random() * 4)];
    });

    this.checkCorrectPieces();
  }

  /**
   * 设置触摸事件
   */
  setupTouchEvents() {
    this.addTouchHandler('start', (event) => {
      if (this.gameState !== 'playing') return;

      const { clientX, clientY } = event.touches[0];
      this.handleClick(clientX, clientY);
    });
  }

  /**
   * 处理点击
   */
  handleClick(x, y) {
    // 检查是否点击了碎片
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const piece = this.pieces[i];
      if (x >= piece.x && x <= piece.x + this.pieceWidth &&
          y >= piece.y && y <= piece.y + this.pieceHeight) {

        this.handlePieceClick(piece);
        return;
      }
    }

    // 检查是否点击了按钮
    if (this.handleUIClick(x, y)) {
      return;
    }
  }

  /**
   * 处理碎片点击
   */
  handlePieceClick(piece) {
    if (piece.isCorrect) return; // 已正确的碎片不能旋转

    // 顺时针旋转90度
    const currentIndex = this.rotationAngles.indexOf(piece.rotation);
    const nextIndex = (currentIndex + 1) % this.rotationAngles.length;
    piece.rotation = this.rotationAngles[nextIndex];

    // 检查碎片是否正确
    this.checkPiece(piece);

    // 检查游戏是否完成
    this.checkCompletion();
  }

  /**
   * 检查单个碎片
   */
  checkPiece(piece) {
    const isPositionCorrect = piece.row === piece.correctRow &&
                               piece.col === piece.correctCol;
    const isRotationCorrect = piece.rotation === piece.correctRotation;

    piece.isCorrect = isPositionCorrect && isRotationCorrect;

    if (piece.isCorrect) {
      this.addScore(10);
    }
  }

  /**
   * 检查所有碎片
   */
  checkCorrectPieces() {
    this.pieces.forEach(piece => {
      this.checkPiece(piece);
    });
  }

  /**
   * 检查游戏完成
   */
  checkCompletion() {
    const allCorrect = this.pieces.every(piece => piece.isCorrect);

    if (allCorrect) {
      this.addScore(this.pieces.length * 20); // 完成奖励
      this.endGame();
    }

    return allCorrect;
  }

  /**
   * 渲染游戏
   */
  render(ctx) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;

    // 背景
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 渲染UI
    this.renderCommonUI(ctx);

    // 渲染拼图框架
    this.renderPuzzleFrame(ctx);

    // 渲染碎片
    this.pieces.forEach(piece => {
      this.renderPiece(ctx, piece);
    });

    // 渲染提示
    this.renderHint(ctx);

    // 渲染操作按钮
    this.renderButtons(ctx);
  }

  /**
   * 渲染拼图框架
   */
  renderPuzzleFrame(ctx) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;
    const puzzleX = (SCREEN_WIDTH - this.puzzleWidth) / 2;
    const puzzleY = (SCREEN_HEIGHT - this.puzzleHeight) / 2 + 30;

    // 边框
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.strokeRect(puzzleX - 2, puzzleY - 2, this.puzzleWidth + 4, this.puzzleHeight + 4);

    // 网格线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;

    for (let i = 1; i < this.gridSize; i++) {
      // 横线
      const y = puzzleY + i * this.pieceHeight;
      ctx.beginPath();
      ctx.moveTo(puzzleX, y);
      ctx.lineTo(puzzleX + this.puzzleWidth, y);
      ctx.stroke();

      // 竖线
      const x = puzzleX + i * this.pieceWidth;
      ctx.beginPath();
      ctx.moveTo(x, puzzleY);
      ctx.lineTo(x, puzzleY + this.puzzleHeight);
      ctx.stroke();
    }
  }

  /**
   * 渲染碎片
   */
  renderPiece(ctx, piece) {
    ctx.save();

    // 设置原点到碎片中心
    const centerX = piece.x + this.pieceWidth / 2;
    const centerY = piece.y + this.pieceHeight / 2;
    ctx.translate(centerX, centerY);

    // 旋转
    ctx.rotate(piece.rotation * Math.PI / 180);

    // 绘制碎片
    ctx.fillStyle = piece.color;
    ctx.fillRect(-this.pieceWidth / 2, -this.pieceHeight / 2,
                 this.pieceWidth, this.pieceHeight);

    // 添加纹理或图案
    this.renderPiecePattern(ctx, piece);

    // 边框
    ctx.strokeStyle = piece.isCorrect ? '#27ae60' : 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = piece.isCorrect ? 3 : 1;
    ctx.strokeRect(-this.pieceWidth / 2, -this.pieceHeight / 2,
                   this.pieceWidth, this.pieceHeight);

    // 方向指示器
    this.renderDirectionIndicator(ctx);

    ctx.restore();
  }

  /**
   * 渲染碎片图案
   */
  renderPiecePattern(ctx, piece) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';

    // 根据位置绘制不同图案
    const pattern = (piece.correctRow + piece.correctCol) % 3;

    switch (pattern) {
      case 0:
        // 圆形
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 1:
        // 三角形
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(20, 15);
        ctx.lineTo(-20, 15);
        ctx.closePath();
        ctx.fill();
        break;
      case 2:
        // 正方形
        ctx.fillRect(-15, -15, 30, 30);
        break;
    }

    // 显示数字提示
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const number = piece.correctRow * this.gridSize + piece.correctCol + 1;
    ctx.fillText(number, 0, 0);
  }

  /**
   * 渲染方向指示器
   */
  renderDirectionIndicator(ctx) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.moveTo(0, -this.pieceHeight / 2 + 10);
    ctx.lineTo(5, -this.pieceHeight / 2 + 20);
    ctx.lineTo(-5, -this.pieceHeight / 2 + 20);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 渲染提示
   */
  renderHint(ctx) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;
    const colors = this.framework?.sharedResources?.ui?.colors || {
      text: '#ffffff'
    };

    // 进度
    const correctCount = this.pieces.filter(p => p.isCorrect).length;
    const totalCount = this.pieces.length;
    const progress = Math.floor((correctCount / totalCount) * 100);

    ctx.fillStyle = colors.text;
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`进度: ${correctCount}/${totalCount} (${progress}%)`,
                 SCREEN_WIDTH / 2, SCREEN_HEIGHT - 120);

    // 提示文字
    ctx.fillStyle = '#888';
    ctx.font = '14px Arial';
    ctx.fillText('点击碎片旋转，使所有碎片位置和方向正确',
                 SCREEN_WIDTH / 2, SCREEN_HEIGHT - 95);
  }

  /**
   * 渲染按钮
   */
  renderButtons(ctx) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;
    const colors = this.framework?.sharedResources?.ui?.colors || {
      secondary: '#0f3460',
      text: '#ffffff'
    };

    // 重新打乱按钮
    const buttonY = SCREEN_HEIGHT - 70;
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonX = (SCREEN_WIDTH - buttonWidth) / 2;

    ctx.fillStyle = colors.secondary;
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2;
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

    ctx.fillStyle = colors.text;
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('重新打乱', SCREEN_WIDTH / 2, buttonY + 26);
  }

  /**
   * 处理UI点击
   */
  handleUIClick(x, y) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;

    // 重新打乱按钮
    const buttonY = SCREEN_HEIGHT - 70;
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonX = (SCREEN_WIDTH - buttonWidth) / 2;

    if (x >= buttonX && x <= buttonX + buttonWidth &&
        y >= buttonY && y <= buttonY + buttonHeight) {
      this.shufflePieces();
      return true;
    }

    return super.handleUIClick(x, y);
  }

  /**
   * 获取游戏信息
   */
  static getGameInfo() {
    return {
      id: 'puzzle',
      name: '拼图',
      description: '旋转碎片，完成美丽拼图！',
      version: '1.0.0',
      author: '',
      thumbnail: ''
    };
  }

  /**
   * 获取游戏规则
   */
  static getRules() {
    return [
      '点击碎片可以旋转90度',
      '碎片有数字提示正确位置',
      '上方的三角形指示正确的方向',
      '所有碎片位置和方向正确即完成',
      '用最少的点击次数完成获得高分'
    ];
  }
}
