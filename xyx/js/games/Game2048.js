/**
 * 2048游戏
 * 核心机制：数字合并、网格移动
 */

import { GridGame } from '../core/BaseGame';

export default class Game2048 extends GridGame {
  constructor() {
    super(4, 4, 80); // 4x4网格，80px单元格
    this.name = '2048';
    this.description = '合并数字，挑战2048！';

    this.tileColors = {
      0: '#ccc0b3',
      2: '#eee4da',
      4: '#ede0c8',
      8: '#f2b179',
      16: '#f59563',
      32: '#f67c5f',
      64: '#f65e3b',
      128: '#edcf72',
      256: '#edcc61',
      512: '#edc850',
      1024: '#edc53f',
      2048: '#edc22e',
      4096: '#3c3a32'
    };

    this.touchStartX = 0;
    this.touchStartY = 0;
  }

  /**
   * 初始化游戏
   */
  init() {
    super.init();
    this.grid = Array(this.rows).fill(null).map(() =>
      Array(this.cols).fill(0)
    );
    this.addRandomTile();
    this.addRandomTile();
  }

  /**
   * 重置游戏
   */
  reset() {
    super.reset();
    this.grid = Array(this.rows).fill(null).map(() =>
      Array(this.cols).fill(0)
    );
    this.addRandomTile();
    this.addRandomTile();
  }

  /**
   * 添加随机方块
   */
  addRandomTile() {
    const emptyCells = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }

    if (emptyCells.length > 0) {
      const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.grid[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  /**
   * 设置触摸事件
   */
  setupTouchEvents() {
    this.addTouchHandler('start', (event) => {
      const { clientX, clientY } = event.touches[0];
      this.touchStartX = clientX;
      this.touchStartY = clientY;
    });

    this.addTouchHandler('end', (event) => {
      const { clientX, clientY } = event.changedTouches[0];
      this.handleSwipe(clientX, clientY);
    });
  }

  /**
   * 处理滑动
   */
  handleSwipe(endX, endY) {
    if (this.gameState !== 'playing' || this.isPaused) return;

    const dx = endX - this.touchStartX;
    const dy = endY - this.touchStartY;
    const minSwipeDistance = 30;

    if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) {
      return;
    }

    let moved = false;

    if (Math.abs(dx) > Math.abs(dy)) {
      // 水平滑动
      if (dx > 0) {
        moved = this.moveRight();
      } else {
        moved = this.moveLeft();
      }
    } else {
      // 垂直滑动
      if (dy > 0) {
        moved = this.moveDown();
      } else {
        moved = this.moveUp();
      }
    }

    if (moved) {
      this.addRandomTile();
      this.checkGameOver();
    }
  }

  /**
   * 向左移动
   */
  moveLeft() {
    let moved = false;
    for (let row = 0; row < this.rows; row++) {
      const result = this.mergeRow(this.grid[row]);
      if (result.moved) {
        moved = true;
        this.grid[row] = result.row;
      }
    }
    return moved;
  }

  /**
   * 向右移动
   */
  moveRight() {
    let moved = false;
    for (let row = 0; row < this.rows; row++) {
      const reversed = [...this.grid[row]].reverse();
      const result = this.mergeRow(reversed);
      if (result.moved) {
        moved = true;
        this.grid[row] = result.row.reverse();
      }
    }
    return moved;
  }

  /**
   * 向上移动
   */
  moveUp() {
    let moved = false;
    for (let col = 0; col < this.cols; col++) {
      const column = [];
      for (let row = 0; row < this.rows; row++) {
        column.push(this.grid[row][col]);
      }
      const result = this.mergeRow(column);
      if (result.moved) {
        moved = true;
        for (let row = 0; row < this.rows; row++) {
          this.grid[row][col] = result.row[row];
        }
      }
    }
    return moved;
  }

  /**
   * 向下移动
   */
  moveDown() {
    let moved = false;
    for (let col = 0; col < this.cols; col++) {
      const column = [];
      for (let row = 0; row < this.rows; row++) {
        column.push(this.grid[row][col]);
      }
      const reversed = column.reverse();
      const result = this.mergeRow(reversed);
      if (result.moved) {
        moved = true;
        const merged = result.row.reverse();
        for (let row = 0; row < this.rows; row++) {
          this.grid[row][col] = merged[row];
        }
      }
    }
    return moved;
  }

  /**
   * 合并一行
   */
  mergeRow(row) {
    let moved = false;
    const newRow = row.filter(val => val !== 0);
    const merged = [];

    for (let i = 0; i < newRow.length; i++) {
      if (i < newRow.length - 1 && newRow[i] === newRow[i + 1]) {
        const mergedValue = newRow[i] * 2;
        merged.push(mergedValue);
        this.addScore(mergedValue);
        i++; // 跳过下一个元素
      } else {
        merged.push(newRow[i]);
      }
    }

    // 补零
    while (merged.length < row.length) {
      merged.push(0);
    }

    // 检测是否有移动
    for (let i = 0; i < row.length; i++) {
      if (row[i] !== merged[i]) {
        moved = true;
        break;
      }
    }

    return { row: merged, moved };
  }

  /**
   * 检查游戏是否结束
   */
  checkGameOver() {
    // 检查是否有空格
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col] === 0) {
          return;
        }
      }
    }

    // 检查是否有可合并的相邻方块
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const current = this.grid[row][col];
        // 检查右边
        if (col < this.cols - 1 && current === this.grid[row][col + 1]) {
          return;
        }
        // 检查下边
        if (row < this.rows - 1 && current === this.grid[row + 1][col]) {
          return;
        }
      }
    }

    // 游戏结束
    this.endGame();
  }

  /**
   * 检查完成
   */
  checkCompletion() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col] >= 2048) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 渲染游戏
   */
  render(ctx) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;

    // 背景
    ctx.fillStyle = '#bbada0';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 渲染UI
    this.renderCommonUI(ctx);

    // 渲染网格背景
    this.renderGrid(ctx);

    // 渲染方块
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const value = this.grid[row][col];
        if (value !== 0) {
          const pos = this.getCellPosition(row, col);
          const color = this.tileColors[value] || '#3c3a32';
          this.renderTile(ctx, pos.x, pos.y, this.cellSize, color, value);
        }
      }
    }
  }

  /**
   * 渲染方块
   */
  renderTile(ctx, x, y, size, color, value) {
    const colors = this.framework?.sharedResources?.ui?.colors || {
      background: '#1a1a2e',
      text: '#ffffff'
    };

    // 方块背景
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);

    // 数字颜色（根据值深浅）
    const isDark = [2, 4].includes(value);
    ctx.fillStyle = isDark ? '#776e65' : '#f9f6f2';

    // 数字字体大小
    const fontSize = value >= 1000 ? 24 : value >= 100 ? 32 : 40;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value, x + size / 2, y + size / 2);
  }

  /**
   * 获取游戏信息
   */
  static getGameInfo() {
    return {
      id: 'game2048',
      name: '2048',
      description: '滑动方块合并数字，挑战2048！',
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
      '滑动屏幕移动方块',
      '相同数字的方块碰撞会合并',
      '每次合并获得对应分数',
      '目标是获得2048方块',
      '填满格子且无法合并时游戏结束'
    ];
  }
}
