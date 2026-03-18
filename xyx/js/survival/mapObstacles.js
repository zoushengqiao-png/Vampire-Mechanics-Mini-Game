// 障碍物类型
const OBSTACLE_TYPES = {
  WALL: 'wall',           // 墙壁
  ROCK: 'rock',           // 石头
  TREE: 'tree',           // 树木
  BOX: 'box'              // 箱子（可破坏）
};

// 障碍物系统
export class MapObstacles {
  constructor() {
    this.obstacles = [];
    this.boxCount = 0;
  }

  // 创建障碍物
  createObstacle(x, y, width, height, type, isDestructible = false, health = 100) {
    const obstacle = {
      x: x,
      y: y,
      width: width,
      height: height,
      type: type,
      isDestructible: isDestructible,
      health: health,
      maxHealth: health,
      active: true,
      color: this.getObstacleColor(type)
    };

    this.obstacles.push(obstacle);

    if (type === OBSTACLE_TYPES.BOX) {
      this.boxCount++;
    }

    return obstacle;
  }

  // 获取障碍物颜色
  getObstacleColor(type) {
    switch (type) {
      case OBSTACLE_TYPES.WALL:
        return '#666666';  // 深灰色
      case OBSTACLE_TYPES.ROCK:
        return '#8B4513';  // 棕色
      case OBSTACLE_TYPES.TREE:
        return '#228B22';  // 森林绿
      case OBSTACLE_TYPES.BOX:
        return '#DAA520';  // 金黄色
      default:
        return '#666666';
    }
  }

  // 初始化地图障碍物
  initMapObstacles(mapWidth = 2000, mapHeight = 2000) {
    this.obstacles = [];
    this.boxCount = 0;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    // 生成随机障碍物
    const obstacleCount = 15 + Math.floor(Math.random() * 10);  // 15-25个障碍物

    for (let i = 0; i < obstacleCount; i++) {
      this.createRandomObstacle();
    }

    // 生成箱子（5-10个）
    const boxCount = 5 + Math.floor(Math.random() * 6);
    for (let i = 0; i < boxCount; i++) {
      this.createBox();
    }
  }

  // 创建随机障碍物
  createRandomObstacle() {
    const types = [OBSTACLE_TYPES.WALL, OBSTACLE_TYPES.ROCK, OBSTACLE_TYPES.TREE];
    const type = types[Math.floor(Math.random() * types.length)];

    let width, height;

    switch (type) {
      case OBSTACLE_TYPES.WALL:
        width = 40 + Math.floor(Math.random() * 60);
        height = 20 + Math.floor(Math.random() * 40);
        break;
      case OBSTACLE_TYPES.ROCK:
        width = 30 + Math.floor(Math.random() * 30);
        height = 30 + Math.floor(Math.random() * 30);
        break;
      case OBSTACLE_TYPES.TREE:
        width = 30 + Math.floor(Math.random() * 20);
        height = 30 + Math.floor(Math.random() * 20);
        break;
    }

    // 随机位置（避开中心区域，玩家出生点）
    let x, y, isValidPosition;
    let attempts = 0;
    const maxAttempts = 50;

    do {
      x = Math.random() * (this.mapWidth - width);
      y = Math.random() * (this.mapHeight - height);

      // 检查是否在中心区域（玩家出生点）
      const centerX = this.mapWidth / 2;
      const centerY = this.mapHeight / 2;
      const distFromCenter = Math.sqrt(
        Math.pow(x + width / 2 - centerX, 2) +
        Math.pow(y + height / 2 - centerY, 2)
      );

      isValidPosition = distFromCenter > 100;  // 避开中心100像素

      // 检查是否与其他障碍物重叠
      if (isValidPosition) {
        for (const obstacle of this.obstacles) {
          const overlapping = !(x + width < obstacle.x ||
                              x > obstacle.x + obstacle.width ||
                              y + height < obstacle.y ||
                              y > obstacle.y + obstacle.height);
          if (overlapping) {
            isValidPosition = false;
            break;
          }
        }
      }

      attempts++;
    } while (!isValidPosition && attempts < maxAttempts);

    if (isValidPosition) {
      this.createObstacle(x, y, width, height, type);
    }
  }

  // 创建箱子
  createBox() {
    const width = 30 + Math.floor(Math.random() * 20);
    const height = 30 + Math.floor(Math.random() * 20);

    // 随机位置（避开中心区域）
    let x, y, isValidPosition;
    let attempts = 0;
    const maxAttempts = 50;

    do {
      x = Math.random() * (this.mapWidth - width);
      y = Math.random() * (this.mapHeight - height);

      // 检查是否在中心区域（玩家出生点）
      const centerX = this.mapWidth / 2;
      const centerY = this.mapHeight / 2;
      const distFromCenter = Math.sqrt(
        Math.pow(x + width / 2 - centerX, 2) +
        Math.pow(y + height / 2 - centerY, 2)
      );

      isValidPosition = distFromCenter > 80;  // 避开中心80像素

      // 检查是否与其他障碍物重叠
      if (isValidPosition) {
        for (const obstacle of this.obstacles) {
          const overlapping = !(x + width < obstacle.x ||
                              x > obstacle.x + obstacle.width ||
                              y + height < obstacle.y ||
                              y > obstacle.y + obstacle.height);
          if (overlapping) {
            isValidPosition = false;
            break;
          }
        }
      }

      attempts++;
    } while (!isValidPosition && attempts < maxAttempts);

    if (isValidPosition) {
      // 箱子可破坏，血量50
      this.createObstacle(x, y, width, height, OBSTACLE_TYPES.BOX, true, 50);
    }
  }

  // 碰撞检测（矩形碰撞）
  checkCollision(rect1, rect2) {
    return !(rect1.x + rect1.width < rect2.x ||
             rect1.x > rect2.x + rect2.width ||
             rect1.y + rect1.height < rect2.y ||
             rect1.y > rect2.y + rect2.height);
  }

  // 检查位置是否与障碍物碰撞
  isCollidingWithObstacles(x, y, width, height) {
    for (const obstacle of this.obstacles) {
      if (!obstacle.active) continue;

      if (this.checkCollision({ x, y, width, height }, obstacle)) {
        return true;
      }
    }
    return false;
  }

  // 检查障碍物是否在射程内（用于投射物）
  isObstacleInRange(x, y, range) {
    for (const obstacle of this.obstacles) {
      if (!obstacle.active) continue;

      const centerX = obstacle.x + obstacle.width / 2;
      const centerY = obstacle.y + obstacle.height / 2;
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

      if (dist <= range) {
        return true;
      }
    }
    return false;
  }

  // 对障碍物造成伤害
  damageObstacle(obstacle, damage) {
    if (!obstacle.isDestructible || !obstacle.active) return;

    obstacle.health -= damage;

    if (obstacle.health <= 0) {
      obstacle.active = false;

      // 箱子被破坏时掉落金币和道具
      if (obstacle.type === OBSTACLE_TYPES.BOX) {
        this.boxCount--;

        // 掉落金币
        if (GameGlobal.databus.coinSystem) {
          GameGlobal.databus.coinSystem.dropCoinsFromBox(
            obstacle.x + obstacle.width / 2,
            obstacle.y + obstacle.height / 2
          );
        }

        // 掉落道具
        if (GameGlobal.databus.itemSystem) {
          GameGlobal.databus.itemSystem.dropItemFromBox(
            obstacle.x + obstacle.width / 2,
            obstacle.y + obstacle.height / 2
          );
        }

        // 移除被破坏的箱子
        this.obstacles = this.obstacles.filter(o => o !== obstacle);
      }
    }
  }

  // 更新障碍物状态
  update() {
    // 清理不活跃的障碍物
    this.obstacles = this.obstacles.filter(o => o.active);
  }

  // 渲染障碍物
  render(ctx) {
    for (const obstacle of this.obstacles) {
      if (!obstacle.active) continue;

      // 绘制障碍物
      ctx.fillStyle = obstacle.color;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

      // 绘制边框
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

      // 如果是箱子，绘制生命条
      if (obstacle.isDestructible) {
        const healthPercent = obstacle.health / obstacle.maxHealth;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(obstacle.x, obstacle.y - 8, obstacle.width, 6);
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(obstacle.x, obstacle.y - 8, obstacle.width * healthPercent, 6);
      }

      // 根据类型绘制不同效果
      switch (obstacle.type) {
        case OBSTACLE_TYPES.WALL:
          // 墙壁纹理
          ctx.fillStyle = '#555555';
          ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 10);
          break;

        case OBSTACLE_TYPES.ROCK:
          // 石头纹理
          ctx.fillStyle = '#6B3610';
          ctx.beginPath();
          ctx.arc(
            obstacle.x + obstacle.width / 2,
            obstacle.y + obstacle.height / 2,
            Math.min(obstacle.width, obstacle.height) / 2 - 3,
            0, Math.PI * 2
          );
          ctx.fill();
          break;

        case OBSTACLE_TYPES.TREE:
          // 树叶纹理
          ctx.fillStyle = '#32CD32';
          ctx.beginPath();
          ctx.arc(
            obstacle.x + obstacle.width / 2,
            obstacle.y + obstacle.height / 2,
            Math.min(obstacle.width, obstacle.height) / 2 - 3,
            0, Math.PI * 2
          );
          ctx.fill();
          break;

        case OBSTACLE_TYPES.BOX:
          // 箱子纹理
          ctx.strokeStyle = '#B8860B';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(obstacle.x, obstacle.y);
          ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
          ctx.moveTo(obstacle.x + obstacle.width, obstacle.y);
          ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
          ctx.stroke();
          break;
      }
    }
  }

  // 重置障碍物系统
  reset() {
    this.obstacles = [];
    this.boxCount = 0;
  }
}

export default MapObstacles;
