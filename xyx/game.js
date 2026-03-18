// 初始化游戏框架
import GameFramework from './js/platform/core/GameFramework';

// 创建并初始化框架
if (!GameGlobal.gameFramework) {
  GameGlobal.gameFramework = new GameFramework();
  GameGlobal.gameFramework.init();
}

// 延迟加载 main 模块，确保微信环境完全初始化
if (typeof wx !== 'undefined') {
  // 使用微信的 onShow 或 ready 事件
  if (wx.onShow) {
    wx.onShow(() => {
      console.log('Game onShow, loading main module...');
      require('./js/survival/main');
    });
  } else {
    // 如果没有 onShow，使用 setTimeout 延迟加载
    setTimeout(() => {
      console.log('Delayed loading main module...');
      require('./js/survival/main');
    }, 100);
  }
} else {
  // 非微信环境，直接加载
  require('./js/survival/main');
}

// 启动吸血鬼幸存者游戏
// Main 在 main.js 内部自动初始化

