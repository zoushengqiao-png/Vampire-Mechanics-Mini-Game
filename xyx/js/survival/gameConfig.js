// 游戏配置常量
export const GAME_CONFIG = {
  // 碰撞检测配置
  COLLISION: {
    BUFFER: 2,  // 碰撞缓冲区（像素）
    PLAYER_COOLDOWN: 60,  // 玩家碰撞冷却（帧）
    ENEMY_COOLDOWN: 60,   // 敌人碰撞冷却（帧）
    PUSH_DISTANCE_MELEE: 2,  // 近战敌人被推开距离
    PUSH_DISTANCE_RANGED: 3, // 远程敌人被推开距离
  },

  // 地图配置
  MAP: {
    WIDTH: 2000,
    HEIGHT: 2000,
    CENTER_ZONE: 200,      // 中心保护区域半径
    MARGIN: 150,            // 地图边缘缓冲区
    SCREEN_PADDING: 50,     // 屏幕外移除缓冲区
  },

  // 玩家配置
  PLAYER: {
    WIDTH: 21,
    HEIGHT: 21,
    INITIAL_SPEED: 3.24,
    INITIAL_HEALTH: 100,
    INITIAL_MAGNET_RADIUS: 80,
  },

  // 敌人配置
  ENEMY: {
    SPAWN_MARGIN: 100,      // 生成边缘缓冲
    MAX_ATTEMPTS: 100,      // 生成位置最大尝试次数
    SPAWN_INTERVAL: 60,     // 生成间隔（帧）
  },

  // 投射物配置
  PROJECTILE: {
    DEFAULT_SIZE: 5,
    DEFAULT_SPEED: 5,
    TRIGGER_RADIUS: 150,    // 追踪触发半径
    MAX_TURN_ANGLE: Math.PI / 22.5, // 最大转向角度（8度）
  },

  // 道具箱配置
  ITEM_BOX: {
    MARGIN: 100,            // 生成边缘缓冲区
    CENTER_AVOID: 150,      // 避开中心区域
    MAX_BOXES: 2,           // 最大同时存在数量
    SPAWN_DELAY: 30000,     // 初始生成延迟（毫秒）
    SPAWN_INCREMENT: 10000, // 每次增加的延迟（毫秒）
    HEALTH: 30,             // 道具箱血量
  },

  // 障碍物配置
  OBSTACLE: {
    COUNT_MIN: 10,
    COUNT_MAX: 15,
    OVERLAP_BUFFER: 100,    // 障碍物重叠检查缓冲区
  },

  // 帧率转换
  FRAME_RATE: 60,
  MS_PER_FRAME: 1000 / 60, // 约16.67毫秒每帧
};

// 辅助函数：将帧转换为毫秒
export const framesToMs = (frames) => Math.floor(frames * GAME_CONFIG.MS_PER_FRAME);

// 辅助函数：将毫秒转换为帧
export const msToFrames = (ms) => Math.floor(ms / GAME_CONFIG.MS_PER_FRAME);
