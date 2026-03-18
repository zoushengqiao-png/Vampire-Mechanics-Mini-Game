// 创建画布 - 添加错误处理和延迟初始化
let canvas, ctx, SCREEN_WIDTH, SCREEN_HEIGHT;

try {
  // 确保微信环境已准备好
  if (typeof wx !== 'undefined' && wx.createCanvas) {
    canvas = wx.createCanvas();
    ctx = canvas.getContext('2d');
    
    // 设置画布尺寸
    SCREEN_WIDTH = canvas.width;
    SCREEN_HEIGHT = canvas.height;
    
    // 将canvas设为全局属性
    if (typeof GameGlobal !== 'undefined') {
      GameGlobal.canvas = canvas;
      GameGlobal.SCREEN_WIDTH = SCREEN_WIDTH;
      GameGlobal.SCREEN_HEIGHT = SCREEN_HEIGHT;
    }
  } else {
    // 如果微信API不可用，使用默认值
    console.warn('wx.createCanvas not available, using default values');
    SCREEN_WIDTH = 375;
    SCREEN_HEIGHT = 667;
  }
} catch (error) {
  console.error('Error creating canvas:', error);
  // 使用默认值
  SCREEN_WIDTH = 375;
  SCREEN_HEIGHT = 667;
}

// 导出画布和上下文
export { canvas, ctx, SCREEN_WIDTH, SCREEN_HEIGHT };
