/**
 * 消消乐游戏
 * 核心机制：图案匹配、连锁消除
 */

import { GridGame } from '../core/BaseGame';

export default class Match3Game extends GridGame {
  constructor() {
    super(8, 8, 50); // 8x8网格，50px单元格
    this.name = '消消乐';
    this.description = '消除三个相同图案！';

    // 糖果类型
    this.candyTypes = [
      { color: '#e74c3c', shape: 'circle' },   // 红色圆形
      { color: '#3498db', shape: 'square' },   // 蓝色方形
      { color: '#2ecc71', shape: 'triangle' }, // 绿色三角形
      { color: '#f39c12', shape: 'diamond' },  // 橙色菱形
      { color: '#9b59b6', shape: 'star' },     // 紫色星形
      { color: '#1abc9c', shape: 'hexagon' }   // 青色六边形
    ];

    this.selectedCell = null;
    this.isSwapping = false;
    this.isAnimating = false;
    this.comboCount = 0;
    this.moveCount = 0;
    this.maxMoves = 30;
  }

  /**
   * 初始化游戏
   */
  init() {
    super.init();
    this.grid = [];
    this.createInitialGrid();
    this.checkInitialMatches();
  }

  /**
   * 创建初始网格
   */
  createInitialGrid() {
    for (let row = 0; row < this.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        this.grid[row][col] = this.createCandy(row, col);
      }
    }
  }

  /**
   * 创建糖果
   */
  createCandy(row, col, excludeTypes = []) {
    let type;
    do {
      type = Math.floor(Math.random() * this.candyTypes.length);
    } while (excludeTypes.includes(type));

    return {
      type,
      row,
      col,
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      scale: 1,
      alpha: 1
    };
  }

  /**
   * 检查并消除初始匹配
   */
  checkInitialMatches() {
    let hasMatches = true;
    while (hasMatches) {
      hasMatches = this.findAndRemoveMatches(false);
      this.fillEmptyCells();
    }
  }

  /**
   * 设置触摸事件
   */
  setupTouchEvents() {
    this.addTouchHandler('start', (event) => {
      if (this.gameState !== 'playing' || this.isSwapping || this.isAnimating) {
        return;
      }

      const { clientX, clientY } = event.touches[0];
      const cell = this.getClickedCell(clientX, clientY);

      if (cell) {
        this.handleCellClick(cell.row, cell.col);
      }
    });
  }

  /**
   * 处理单元格点击
   */
  handleCellClick(row, col) {
    if (!this.selectedCell) {
      // 选择第一个
      this.selectedCell = { row, col };
      this.grid[row][col].scale = 1.1;
    } else {
      const prevRow = this.selectedCell.row;
      const prevCol = this.selectedCell.col;

      // 恢复缩放
      this.grid[prevRow][prevCol].scale = 1;

      if (row === prevRow && col === prevCol) {
        // 点击同一个，取消选择
        this.selectedCell = null;
      } else if (this.isAdjacent(prevRow, prevCol, row, col)) {
        // 相邻，尝试交换
        this.trySwap(prevRow, prevCol, row, col);
        this.selectedCell = null;
      } else {
        // 不相邻，选择新的
        this.selectedCell = { row, col };
        this.grid[row][col].scale = 1.1;
      }
    }
  }

  /**
   * 检查是否相邻
   */
  isAdjacent(row1, col1, row2, col2) {
    return (Math.abs(row1 - row2) === 1 && col1 === col2) ||
           (Math.abs(col1 - col2) === 1 && row1 === row2);
  }

  /**
   * 尝试交换
   */
  trySwap(row1, col1, row2, col2) {
    this.isSwapping = true;

    // 交换
    this.swapCells(row1, col1, row2, col2);

    // 检查是否有匹配
    const hasMatch = this.findMatches().length > 0;

    if (hasMatch) {
      this.moveCount++;
      this.comboCount = 0;
      this.processMatches();
    } else {
      // 没有匹配，交换回来
      setTimeout(() => {
        this.swapCells(row1, col1, row2, col2);
        this.isSwapping = false;
      }, 300);
    }
  }

  /**
   * 交换单元格
   */
  swapCells(row1, col1, row2, col2) {
    const temp = this.grid[row1][col1];
    this.grid[row1][col1] = this.grid[row2][col2];
    this.grid[row2][col2] = temp;

    // 更新位置信息
    this.grid[row1][col1].row = row1;
    this.grid[row1][col1].col = col1;
    this.grid[row2][col2].row = row2;
    this.grid[row2][col2].col = col2;
  }

  /**
   * 查找所有匹配
   */
  findMatches() {
    const matches = [];
    const matched = new Set();

    // 检查水平匹配
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols - 2; col++) {
        const type = this.grid[row][col].type;
        if (type === -1) continue;

        let matchLength = 1;
        while (col + matchLength < this.cols &&
               this.grid[row][col + matchLength].type === type) {
          matchLength++;
        }

        if (matchLength >= 3) {
          const match = {
            cells: [],
            type: 'horizontal',
            length: matchLength
          };
          for (let i = 0; i < matchLength; i++) {
            match.cells.push({ row, col: col + i });
            matched.add(`${row},${col + i}`);
          }
          matches.push(match);
          col += matchLength - 1;
        }
      }
    }

    // 检查垂直匹配
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows - 2; row++) {
        const type = this.grid[row][col].type;
        if (type === -1) continue;

        let matchLength = 1;
        while (row + matchLength < this.rows &&
               this.grid[row + matchLength][col].type === type) {
          matchLength++;
        }

        if (matchLength >= 3) {
          const match = {
            cells: [],
            type: 'vertical',
            length: matchLength
          };
          for (let i = 0; i < matchLength; i++) {
            match.cells.push({ row: row + i, col });
            matched.add(`${row + i},${col}`);
          }
          matches.push(match);
          row += matchLength - 1;
        }
      }
    }

    return matches;
  }

  /**
   * 查找并移除匹配
   */
  findAndRemoveMatches(score = true) {
    const matches = this.findMatches();
    if (matches.length === 0) return false;

    // 移除匹配的糖果
    matches.forEach(match => {
      match.cells.forEach(cell => {
        this.grid[cell.row][cell.col].type = -1; // 标记为空

        if (score) {
          const baseScore = match.length * 10;
          const comboBonus = this.comboCount * 5;
          this.addScore(baseScore + comboBonus);
        }
      });
    });

    return true;
  }

  /**
   * 处理匹配（包括连锁反应）
   */
  async processMatches() {
    this.isAnimating = true;
    let hasMatches = true;

    while (hasMatches) {
      hasMatches = this.findAndRemoveMatches(true);

      if (hasMatches) {
        this.comboCount++;

        // 等待消除动画
        await this.wait(300);

        // 填充空格
        this.fillEmptyCells();

        // 等待下落动画
        await this.wait(400);
      }
    }

    this.isAnimating = false;
    this.isSwapping = false;

    // 检查游戏结束
    if (this.moveCount >= this.maxMoves) {
      this.endGame();
    }
  }

  /**
   * 填充空单元格
   */
  fillEmptyCells() {
    // 下落
    for (let col = 0; col < this.cols; col++) {
      let emptyRow = this.rows - 1;

      for (let row = this.rows - 1; row >= 0; row--) {
        if (this.grid[row][col].type !== -1) {
          if (row !== emptyRow) {
            this.grid[emptyRow][col] = this.grid[row][col];
            this.grid[emptyRow][col].row = emptyRow;
            this.grid[row][col] = this.createCandy(row, col);
            this.grid[row][col].type = -1;
          }
          emptyRow--;
        }
      }

      // 填充顶部空格
      for (let row = emptyRow; row >= 0; row--) {
        this.grid[row][col] = this.createCandy(row, col);
      }
    }
  }

  /**
   * 等待函数
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 更新
   */
  update() {
    super.update();
    // 可以在这里添加动画更新逻辑
  }

  /**
   * 检查游戏完成
   */
  checkCompletion() {
    return this.score >= 1000;
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
    this.renderGameInfo(ctx);

    // 渲染网格背景
    this.renderGrid(ctx);

    // 渲染糖果
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const candy = this.grid[row][col];
        if (candy.type !== -1) {
          const pos = this.getCellPosition(row, col);
          this.renderCandy(ctx, pos.x, pos.y, candy);
        }
      }
    }

    // 连击提示
    if (this.comboCount > 1) {
      this.renderComboText(ctx);
    }
  }

  /**
   * 渲染糖果
   */
  renderCandy(ctx, x, y, candy) {
    const candyType = this.candyTypes[candy.type];
    const size = this.cellSize * candy.scale;

    ctx.save();
    ctx.translate(x + this.cellSize / 2, y + this.cellSize / 2);
    ctx.scale(candy.scale, candy.scale);
    ctx.globalAlpha = candy.alpha;

    ctx.fillStyle = candyType.color;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;

    switch (candyType.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, size / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      case 'square':
        ctx.fillRect(-size / 2 + 2, -size / 2 + 2, size - 4, size - 4);
        ctx.strokeRect(-size / 2 + 2, -size / 2 + 2, size - 4, size - 4);
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -size / 2 + 2);
        ctx.lineTo(size / 2 - 2, size / 2 - 2);
        ctx.lineTo(-size / 2 + 2, size / 2 - 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(0, -size / 2 + 2);
        ctx.lineTo(size / 2 - 2, 0);
        ctx.lineTo(0, size / 2 - 2);
        ctx.lineTo(-size / 2 + 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      case 'star':
        this.drawStar(ctx, 0, 0, 5, size / 2 - 2, size / 4);
        break;
      case 'hexagon':
        this.drawHexagon(ctx, 0, 0, size / 2 - 2);
        break;
    }

    ctx.restore();
  }

  /**
   * 绘制星形
   */
  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  /**
   * 绘制六边形
   */
  drawHexagon(ctx, cx, cy, radius) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 30) * Math.PI / 180;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  /**
   * 渲染游戏信息
   */
  renderGameInfo(ctx) {
    const { SCREEN_WIDTH } = GameGlobal;
    const colors = this.framework?.sharedResources?.ui?.colors || {
      text: '#ffffff'
    };

    // 剩余步数
    ctx.fillStyle = colors.text;
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`剩余步数: ${this.maxMoves - this.moveCount}`, 20, 80);

    // 目标分数
    ctx.textAlign = 'right';
    ctx.fillText(`目标: 1000`, SCREEN_WIDTH - 20, 80);
  }

  /**
   * 渲染连击文字
   */
  renderComboText(ctx) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;
    const colors = this.framework?.sharedResources?.ui?.colors || {
      text: '#ffffff'
    };

    ctx.save();
    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.8;
    ctx.fillText(`${this.comboCount}连击!`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    ctx.restore();
  }

  /**
   * 获取游戏信息
   */
  static getGameInfo() {
    return {
      id: 'match3',
      name: '消消乐',
      description: '消除三个相同图案，挑战高分！',
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
      '点击两个相邻的糖果交换位置',
      '三个或更多相同糖果连成一线即可消除',
      '消除越多得分越高',
      '连击可获得额外加分',
      '在有限步数内达到目标分数'
    ];
  }
}
