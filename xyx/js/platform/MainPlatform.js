/**
 * 小游戏平台主程序
 * 统一管理所有子游戏的加载和切换
 */

import GameFramework from './core/GameFramework';
import Game2048 from '../games/Game2048';
import Match3Game from '../games/Match3Game';
import SpiderSolitaire from '../games/SpiderSolitaire';
import PuzzleGame from '../games/PuzzleGame';

const ctx = canvas.getContext('2d');

// 全局变量
GameGlobal.SCREEN_WIDTH = canvas.width;
GameGlobal.SCREEN_HEIGHT = canvas.height;
GameGlobal.databus = {
  frame: 0,
  score: 0
};

export default class MainPlatform {
  constructor() {
    this.framework = new GameFramework();
    this.isRunning = true;
    this.aniId = 0;

    // 将 framework 暴露到全局，供游戏模块访问
    GameGlobal.gameFramework = this.framework;

    this.init();
  }

  /**
   * 初始化平台
   */
  init() {
    // 初始化框架
    this.framework.init();

    // 注册所有游戏
    this.registerGames();

    // 设置全局事件
    this.setupGlobalEvents();

    // 启动主循环
    this.startLoop();
  }

  /**
   * 注册所有游戏
   */
  registerGames() {
    // 注册2048游戏
    const game2048 = new Game2048();
    this.framework.registerGame('game2048', game2048);

    // 注册消消乐游戏
    const match3Game = new Match3Game();
    this.framework.registerGame('match3', match3Game);

    // 注册蜘蛛纸牌游戏
    const spiderSolitaire = new SpiderSolitaire();
    this.framework.registerGame('spider_solitaire', spiderSolitaire);

    // 注册拼图游戏
    const puzzleGame = new PuzzleGame();
    this.framework.registerGame('puzzle', puzzleGame);
  }

  /**
   * 设置全局事件
   */
  setupGlobalEvents() {
    // 触摸事件
    wx.onTouchStart((e) => {
      this.handleTouch('start', e);
    });

    wx.onTouchMove((e) => {
      this.handleTouch('move', e);
    });

    wx.onTouchEnd((e) => {
      this.handleTouch('end', e);
    });

    wx.onTouchCancel((e) => {
      this.handleTouch('cancel', e);
    });

    // 屏幕尺寸变化
    wx.onWindowResize(() => {
      GameGlobal.SCREEN_WIDTH = canvas.width;
      GameGlobal.SCREEN_HEIGHT = canvas.height;
    });
  }

  /**
   * 处理触摸事件
   */
  handleTouch(type, event) {
    // 主菜单场景
    if (this.framework.scene === 'menu') {
      this.handleMenuTouch(type, event);
    }
    // 游戏场景
    else if (this.framework.scene === 'game' || this.framework.scene === 'paused') {
      this.handleGameTouch(type, event);
    }
    // 游戏结束场景
    else if (this.framework.scene === 'gameOver') {
      this.handleGameOverTouch(type, event);
    }
  }

  /**
   * 处理主菜单触摸
   */
  handleMenuTouch(type, event) {
    if (type !== 'start') return;

    const { clientX, clientY } = event.touches[0];
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;

    // 游戏列表区域
    let startY = 320;
    const games = Array.from(this.framework.games.entries());

    games.forEach(([gameId, game], index) => {
      const y = startY + index * 100;

      if (clientX >= 40 && clientX <= SCREEN_WIDTH - 40 &&
          clientY >= y && clientY <= y + 80) {
        // 启动游戏
        this.framework.launchGame(gameId);
      }
    });
  }

  /**
   * 处理游戏触摸
   */
  handleGameTouch(type, event) {
    const currentGame = this.framework.currentGame;
    if (!currentGame) return;

    // 传递给当前游戏处理
    currentGame.handleTouchEvent(type, event);

    // 处理UI按钮（返回、暂停等）
    if (type === 'start') {
      const { clientX, clientY } = event.touches[0];

      // 暂停界面点击
      if (this.framework.scene === 'paused') {
        this.handlePauseMenuTouch(clientX, clientY);
      }
      // 游戏结束界面点击
      else if (this.framework.scene === 'gameOver') {
        this.handleGameOverTouch(clientX, clientY);
      }
      // 游戏中的UI点击
      else {
        currentGame.handleUIClick(clientX, clientY);
      }
    }
  }

  /**
   * 处理暂停菜单触摸
   */
  handlePauseMenuTouch(x, y) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;

    // 恢复按钮
    const resumeButton = {
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2,
      width: 120,
      height: 40
    };

    if (x >= resumeButton.x && x <= resumeButton.x + resumeButton.width &&
        y >= resumeButton.y && y <= resumeButton.y + resumeButton.height) {
      this.framework.resumeGame();
      return;
    }

    // 返回菜单按钮
    const returnButton = {
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2 + 60,
      width: 120,
      height: 40
    };

    if (x >= returnButton.x && x <= returnButton.x + returnButton.width &&
        y >= returnButton.y && y <= returnButton.y + returnButton.height) {
      this.framework.returnToMenu();
      return;
    }
  }

  /**
   * 处理游戏结束触摸
   */
  handleGameOverTouch(x, y) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;

    // 重新开始按钮
    const restartButton = {
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2,
      width: 120,
      height: 40
    };

    if (x >= restartButton.x && x <= restartButton.x + restartButton.width &&
        y >= restartButton.y && y <= restartButton.y + restartButton.height) {
      this.framework.restartGame();
      return;
    }

    // 返回菜单按钮
    const returnButton = {
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2 + 60,
      width: 120,
      height: 40
    };

    if (x >= returnButton.x && x <= returnButton.x + returnButton.width &&
        y >= returnButton.y && y <= returnButton.y + returnButton.height) {
      this.framework.returnToMenu();
      return;
    }
  }

  /**
   * 启动主循环
   */
  startLoop() {
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  /**
   * 主循环
   */
  loop() {
    if (!this.isRunning) return;

    // 更新
    this.update();

    // 渲染
    this.render();

    // 请求下一帧
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  /**
   * 更新逻辑
   */
  update() {
    GameGlobal.databus.frame++;

    // 更新框架
    this.framework.update();
  }

  /**
   * 渲染逻辑
   */
  render() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 渲染框架
    this.framework.render(ctx);

    // 渲染暂停菜单
    if (this.framework.scene === 'paused') {
      this.renderPauseMenu(ctx);
    }

    // 渲染游戏结束菜单
    if (this.framework.scene === 'gameOver') {
      this.renderGameOverMenu(ctx);
    }
  }

  /**
   * 渲染暂停菜单
   */
  renderPauseMenu(ctx) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;
    const colors = this.framework.sharedResources.ui.colors;

    // 暂停按钮
    const resumeButton = {
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2,
      width: 120,
      height: 40
    };

    ctx.fillStyle = colors.primary;
    ctx.fillRect(resumeButton.x, resumeButton.y, resumeButton.width, resumeButton.height);

    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2;
    ctx.strokeRect(resumeButton.x, resumeButton.y, resumeButton.width, resumeButton.height);

    ctx.fillStyle = colors.text;
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('继续游戏', SCREEN_WIDTH / 2, resumeButton.y + 26);

    // 返回按钮
    const returnButton = {
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2 + 60,
      width: 120,
      height: 40
    };

    ctx.fillStyle = colors.secondary;
    ctx.fillRect(returnButton.x, returnButton.y, returnButton.width, returnButton.height);

    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2;
    ctx.strokeRect(returnButton.x, returnButton.y, returnButton.width, returnButton.height);

    ctx.fillStyle = colors.text;
    ctx.fillText('返回菜单', SCREEN_WIDTH / 2, returnButton.y + 26);
  }

  /**
   * 渲染游戏结束菜单
   */
  renderGameOverMenu(ctx) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;
    const colors = this.framework.sharedResources.ui.colors;
    const currentGame = this.framework.currentGame;

    // 游戏结果
    ctx.fillStyle = colors.text;
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`最终得分: ${currentGame.score}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 80);

    if (currentGame.score >= currentGame.highScore) {
      ctx.fillStyle = colors.success;
      ctx.fillText('新纪录!', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50);
    }

    // 重新开始按钮
    const restartButton = {
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2,
      width: 120,
      height: 40
    };

    ctx.fillStyle = colors.primary;
    ctx.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);

    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2;
    ctx.strokeRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);

    ctx.fillStyle = colors.text;
    ctx.font = '18px Arial';
    ctx.fillText('重新开始', SCREEN_WIDTH / 2, restartButton.y + 26);

    // 返回按钮
    const returnButton = {
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2 + 60,
      width: 120,
      height: 40
    };

    ctx.fillStyle = colors.secondary;
    ctx.fillRect(returnButton.x, returnButton.y, returnButton.width, returnButton.height);

    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2;
    ctx.strokeRect(returnButton.x, returnButton.y, returnButton.width, returnButton.height);

    ctx.fillStyle = colors.text;
    ctx.fillText('返回菜单', SCREEN_WIDTH / 2, returnButton.y + 26);
  }

  /**
   * 销毁平台
   */
  destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.aniId);
  }
}

// 启动平台
new MainPlatform();
