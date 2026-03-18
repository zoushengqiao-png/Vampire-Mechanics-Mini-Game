/**
 * 游戏框架 - 核心架构
 * 统一管理所有子游戏的场景切换、得分系统、存档功能
 */

export default class GameFramework {
  constructor() {
    this.games = new Map(); // 游戏注册表
    this.currentGame = null;
    this.previousGame = null;
    this.scene = 'menu'; // menu, game, pause, gameOver
    this.sharedResources = null;

    // 通用游戏状态
    this.gameState = {
      totalScore: 0,
      playTime: 0,
      gamesPlayed: 0,
      achievements: new Set()
    };

    // 存档系统
    this.saveSystem = {
      key: 'minigame_platform_save',
      data: null,
      load: () => this.loadGameData(),
      save: () => this.saveGameData()
    };
  }

  /**
   * 初始化框架
   */
  init() {
    this.loadGameData();
    this.initSharedResources();
    this.setupGlobalEvents();
  }

  /**
   * 注册游戏
   * @param {string} gameId - 游戏ID
   * @param {Object} gameInstance - 游戏实例
   */
  registerGame(gameId, gameInstance) {
    this.games.set(gameId, gameInstance);
    gameInstance.setFramework(this);
  }

  /**
   * 启动指定游戏
   * @param {string} gameId - 游戏ID
   */
  launchGame(gameId) {
    if (!this.games.has(gameId)) {
      console.error(`游戏 ${gameId} 未注册`);
      return;
    }

    // 保存当前游戏状态
    if (this.currentGame && this.currentGame.pause) {
      this.currentGame.pause();
    }

    this.previousGame = this.currentGame;
    this.currentGame = this.games.get(gameId);
    this.scene = 'game';

    // 初始化游戏
    this.currentGame.init();

    // 统计
    this.gameState.gamesPlayed++;
    this.saveGameData();
  }

  /**
   * 返回主菜单
   */
  returnToMenu() {
    if (this.currentGame && this.currentGame.pause) {
      this.currentGame.pause();
    }

    this.currentGame = null;
    this.scene = 'menu';
  }

  /**
   * 切换到上一个游戏
   */
  switchToPrevious() {
    if (this.previousGame) {
      const gameId = Array.from(this.games.entries()).find(
        ([id, game]) => game === this.previousGame
      )?.[0];

      if (gameId) {
        this.launchGame(gameId);
      }
    }
  }

  /**
   * 暂停游戏
   */
  pauseGame() {
    if (this.currentGame && this.scene === 'game') {
      this.scene = 'pause';
      if (this.currentGame.pause) {
        this.currentGame.pause();
      }
    }
  }

  /**
   * 恢复游戏
   */
  resumeGame() {
    if (this.currentGame && this.scene === 'pause') {
      this.scene = 'game';
      if (this.currentGame.resume) {
        this.currentGame.resume();
      }
    }
  }

  /**
   * 游戏结束
   * @param {Object} result - 游戏结果 { score, completed, etc. }
   */
  gameOver(result = {}) {
    this.scene = 'gameOver';

    // 更新统计数据
    if (result.score) {
      this.gameState.totalScore += result.score;
    }

    this.saveGameData();

    // 调用游戏的游戏结束逻辑
    if (this.currentGame && this.currentGame.onGameOver) {
      this.currentGame.onGameOver(result);
    }
  }

  /**
   * 重新开始当前游戏
   */
  restartGame() {
    if (this.currentGame) {
      this.currentGame.reset();
      this.scene = 'game';
    }
  }

  /**
   * 初始化共享资源
   */
  initSharedResources() {
    this.sharedResources = {
      audio: new AudioManager(),
      ui: new UIManager(),
      storage: new StorageManager(),
      animation: new AnimationManager()
    };
  }

  /**
   * 设置全局事件
   */
  setupGlobalEvents() {
    // 背景音乐控制
    wx.onAudioInterruptionBegin(() => {
      this.sharedResources.audio.pauseBackgroundMusic();
    });

    wx.onAudioInterruptionEnd(() => {
      this.sharedResources.audio.resumeBackgroundMusic();
    });
  }

  /**
   * 加载游戏数据
   */
  loadGameData() {
    try {
      const savedData = wx.getStorageSync(this.saveSystem.key);
      if (savedData) {
        this.gameState = {
          ...this.gameState,
          ...savedData,
          achievements: new Set(savedData.achievements || [])
        };
      }
    } catch (error) {
      console.error('加载存档失败:', error);
    }
  }

  /**
   * 保存游戏数据
   */
  saveGameData() {
    try {
      const dataToSave = {
        ...this.gameState,
        achievements: Array.from(this.gameState.achievements)
      };
      wx.setStorageSync(this.saveSystem.key, dataToSave);
    } catch (error) {
      console.error('保存存档失败:', error);
    }
  }

  /**
   * 解锁成就
   * @param {string} achievementId - 成就ID
   */
  unlockAchievement(achievementId) {
    if (!this.gameState.achievements.has(achievementId)) {
      this.gameState.achievements.add(achievementId);
      this.saveGameData();
      this.sharedResources.ui.showToast(`解锁成就: ${achievementId}`);
    }
  }

  /**
   * 主循环更新
   */
  update() {
    if (this.scene === 'game' && this.currentGame) {
      this.currentGame.update();
    }
  }

  /**
   * 主循环渲染
   */
  render(ctx) {
    if (this.scene === 'game' && this.currentGame) {
      this.currentGame.render(ctx);
    } else if (this.scene === 'menu') {
      this.renderMenu(ctx);
    } else if (this.scene === 'pause') {
      this.currentGame.render(ctx);
      this.renderPause(ctx);
    } else if (this.scene === 'gameOver') {
      this.currentGame.render(ctx);
      this.renderGameOver(ctx);
    }
  }

  /**
   * 渲染主菜单
   */
  renderMenu(ctx) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;

    // 背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 标题
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('小游戏合集', SCREEN_WIDTH / 2, 150);

    // 统计信息
    ctx.font = '20px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`总得分: ${this.gameState.totalScore}`, SCREEN_WIDTH / 2, 220);
    ctx.fillText(`游戏次数: ${this.gameState.gamesPlayed}`, SCREEN_WIDTH / 2, 250);

    // 游戏列表
    let startY = 320;
    const gameEntries = Array.from(this.games.entries());

    gameEntries.forEach(([gameId, game], index) => {
      const y = startY + index * 100;

      // 游戏卡片
      ctx.fillStyle = '#16213e';
      ctx.fillRect(40, y, SCREEN_WIDTH - 80, 80);

      // 游戏名称
      ctx.fillStyle = '#e94560';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(game.name, 60, y + 45);

      // 游戏描述
      ctx.fillStyle = '#888';
      ctx.font = '16px Arial';
      ctx.fillText(game.description, 60, y + 70);
    });
  }

  /**
   * 渲染暂停界面
   */
  renderPause(ctx) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏暂停', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50);
  }

  /**
   * 渲染游戏结束界面
   */
  renderGameOver(ctx) {
    const { SCREEN_WIDTH, SCREEN_HEIGHT } = GameGlobal;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 60);
  }
}

/**
 * 音频管理器
 */
class AudioManager {
  constructor() {
    this.backgroundMusic = null;
    this.soundEffects = new Map();
    this.muted = false;
    this.volume = 0.5;
    // 分别控制背景音乐和音效开关
    this.musicEnabled = true;
    this.soundEnabled = true;
  }

  playSound(soundId) {
    if (!this.soundEnabled || this.muted) return;
    // 实现音效播放
  }

  playBackgroundMusic(musicId) {
    if (!this.musicEnabled || this.muted) return;
    // 实现背景音乐播放
  }

  pauseBackgroundMusic() {
    // 暂停背景音乐
  }

  resumeBackgroundMusic() {
    // 恢复背景音乐
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    return this.musicEnabled;
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }
}

/**
 * UI管理器
 */
class UIManager {
  constructor() {
    this.fonts = new Map();
    this.colors = {
      primary: '#e94560',
      secondary: '#0f3460',
      background: '#1a1a2e',
      text: '#ffffff',
      success: '#4CAF50',
      warning: '#FFC107',
      danger: '#F44336'
    };
  }

  showToast(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  }

  showModal(title, content) {
    return new Promise((resolve) => {
      wx.showModal({
        title,
        content,
        success: (res) => {
          resolve(res.confirm);
        }
      });
    });
  }
}

/**
 * 存储管理器
 */
class StorageManager {
  set(key, value) {
    try {
      wx.setStorageSync(key, value);
      return true;
    } catch (error) {
      console.error('存储失败:', error);
      return false;
    }
  }

  get(key, defaultValue = null) {
    try {
      return wx.getStorageSync(key) || defaultValue;
    } catch (error) {
      console.error('读取失败:', error);
      return defaultValue;
    }
  }

  remove(key) {
    try {
      wx.removeStorageSync(key);
      return true;
    } catch (error) {
      console.error('删除失败:', error);
      return false;
    }
  }
}

/**
 * 动画管理器
 */
class AnimationManager {
  constructor() {
    this.animations = new Map();
  }

  create(key, options) {
    this.animations.set(key, {
      ...options,
      progress: 0,
      completed: false
    });
  }

  update() {
    this.animations.forEach((animation, key) => {
      if (animation.completed) return;

      animation.progress += animation.speed || 0.02;
      if (animation.progress >= 1) {
        animation.progress = 1;
        animation.completed = true;

        if (animation.onComplete) {
          animation.onComplete();
        }
      }
    });
  }

  get(key) {
    return this.animations.get(key);
  }

  remove(key) {
    this.animations.delete(key);
  }
}
