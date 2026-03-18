import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

// 障碍物类型
const OBSTACLE_TYPES = {
  WALL: 'wall',           // 墙壁（不可破坏）
  ROCK: 'rock',           // 石头（不可破坏）
  TREE: 'tree',           // 树木（不可破坏）
  BOX: 'box'              // 箱子（可破坏）
};

// 无限地图系统
export class InfiniteMap {
  constructor() {
    // 地图总尺寸（3000x3000像素）
    this.mapWidth = 3000;
    this.mapHeight = 3000;

    // 地图偏移量（屏幕坐标偏移）
    this.offsetX = SCREEN_WIDTH / 2 - this.mapWidth / 2;
    this.offsetY = SCREEN_HEIGHT / 2 - this.mapHeight / 2;

    // 道具箱生成系统
    this.itemBoxes = []; // 道具箱数组
    this.nextBoxSpawnTime = 30000; // 下一次生成时间（毫秒）- 30秒
    this.boxSpawnDelay = 30000; // 当前生成延迟
    this.boxSpawnIncrement = 10000; // 每次增加的延迟
    this.maxBoxes = 2; // 同时存在的最大道具箱数量
    this.lastBoxSpawnTime = 0; // 上次生成时间

    // 弱箱子生成系统（每分钟生成一个只有1点血的箱子）
    this.weakBoxSpawnInterval = 60000; // 1分钟（60000毫秒）
    this.lastWeakBoxSpawnTime = Date.now(); // 上次生成弱箱子时间

    // 固定不可破坏道具系统
    this.fixedObstacles = []; // 固定道具数组

    // 初始化地图
    this.init();
  }

  // 初始化地图
  init() {
    // 直接生成障碍物（使用世界坐标）
    this.generateObstacles();

    // 重置玩家位置到地图中心
    this.playerMapX = this.mapWidth / 2;
    this.playerMapY = this.mapHeight / 2;

    // 初始偏移量：地图中心对齐屏幕中心
    this.offsetX = SCREEN_WIDTH / 2 - this.mapWidth / 2;
    this.offsetY = SCREEN_HEIGHT / 2 - this.mapHeight / 2;
  }

  // 直接生成障碍物（简化版，移除mapCache）
  generateObstacles() {
    // 不再使用mapCache系统
    // 障碍物将在需要时直接在世界坐标中生成

    // 生成固定不可破坏道具（10-15个）
    this.generateFixedObstacles();
  }

  // 生成固定不可破坏道具
  generateFixedObstacles() {
    // 如果已经生成过，就跳过
    if (this.fixedObstacles && this.fixedObstacles.length > 0) {
      return;
    }

    this.fixedObstacles = [];
    const obstacleCount = 15 + Math.floor(Math.random() * 6); // 15-20个

    // 避开中心区域（玩家出生点）- 减小到 150，让更多空间给玩家
    const centerZone = 150; // 中心区域半径（从 200 减小到 150）
    const mapMargin = 100; // 地图边缘缓冲区（从 150 减小到 100）

    for (let i = 0; i < obstacleCount; i++) {
      let x, y, isValidPosition;
      let attempts = 0;
      const maxAttempts = 100;

      do {
        x = mapMargin + Math.random() * (this.mapWidth - mapMargin * 2 - 100);
        y = mapMargin + Math.random() * (this.mapHeight - mapMargin * 2 - 100);

        // 检查是否在中心区域
        const centerX = this.mapWidth / 2;
        const centerY = this.mapHeight / 2;
        const distFromCenter = Math.sqrt(
          Math.pow(x + 50 - centerX, 2) +
          Math.pow(y + 50 - centerY, 2)
        );

        isValidPosition = distFromCenter > centerZone;

        // 检查是否与其他固定道具重叠（增加间距检查）
        if (isValidPosition) {
          const minSpacing = 80; // 最小间距（新增：确保障碍物之间有足够空间）
          for (const obstacle of this.fixedObstacles) {
            // 使用扩展的碰撞检测（包含最小间距）
            const overlapping = !(
              x + 100 + minSpacing < obstacle.x ||
              x > obstacle.x + 100 + minSpacing ||
              y + 100 + minSpacing < obstacle.y ||
              y > obstacle.y + 100 + minSpacing
            );
            if (overlapping) {
              isValidPosition = false;
              break;
            }
          }
        }

        attempts++;
      } while (!isValidPosition && attempts < maxAttempts);

      if (isValidPosition) {
        // 随机选择障碍物类型
        const types = [OBSTACLE_TYPES.WALL, OBSTACLE_TYPES.ROCK, OBSTACLE_TYPES.TREE];
        const type = types[Math.floor(Math.random() * types.length)];

        // 减小障碍物尺寸：从 60-100 改为 40-60
        const obstacle = {
          x: x,
          y: y,
          width: 40 + Math.floor(Math.random() * 20), // 40-60（从 60-100 减小）
          height: 40 + Math.floor(Math.random() * 20), // 40-60（从 60-100 减小）
          type: type,
          isDestructible: false, // 不可破坏
          health: Infinity,
          active: true,
          color: this.getObstacleColor(type)
        };

        this.fixedObstacles.push(obstacle);
        console.log(`[生成固定道具] 类型: ${type}, 位置: (${x.toFixed(0)}, ${y.toFixed(0)}), 尺寸: ${obstacle.width.toFixed(0)}x${obstacle.height.toFixed(0)}, 数量: ${this.fixedObstacles.length}`);
      }
    }
  }

  // 创建地图单元（已废弃，不再使用mapCache系统）
  /*
  createMapUnit(gridX, gridY) {
    const key = `${gridX},${gridY}`;

    // 如果已存在，直接返回
    if (this.mapCache.has(key)) {
      return this.mapCache.get(key);
    }

    // 创建新的地图单元 - 使用传入的gridX和gridY而不是centerX/centerY
    const mapUnit = {
      gridX: gridX,
      gridY: gridY,
      obstacles: this.generateObstaclesForGrid(gridX, gridY),
      // 使用确定性随机生成，保证相同坐标的地图单元内容一致
      seed: this.hashCoordinates(gridX, gridY)
    };

    this.mapCache.set(key, mapUnit);
    return mapUnit;
  }

  // 坐标哈希（用于确定性随机生成）（已废弃）
  /*
  hashCoordinates(x, y) {
    // 简单的坐标哈希算法
    const seed = (x * 374761393 + y * 668265263) ^ (x * y * 123456789);
    return Math.abs(seed) % 1000000;
  }

  // 伪随机数生成器（使用种子）（已废弃）
  /*
  seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  // 为指定网格生成障碍物（已废弃，不再使用mapCache系统）
  /*
  generateObstaclesForGrid(gridX, gridY) {
    const obstacles = [];

    // 障碍物数量减少40% (原14-22个,现在改为4-7个)
    let seed = this.hashCoordinates(gridX, gridY);
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const baseCount = 4 + Math.floor((seed / 0x7fffffff) * 3); // 4-7个

    let obstacleIndex = 0;

    for (let i = 0; i < baseCount; i++) {
      // 使用确定性随机
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const rand = seed / 0x7fffffff;

      // 随机类型
      const types = [OBSTACLE_TYPES.WALL, OBSTACLE_TYPES.ROCK, OBSTACLE_TYPES.TREE, OBSTACLE_TYPES.BOX];
      const type = types[Math.floor(rand * types.length)];

      // 随机尺寸
      let width, height;
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const sizeRand = seed / 0x7fffffff;

      switch (type) {
        case OBSTACLE_TYPES.WALL:
          width = 40 + Math.floor(sizeRand * 60);
          height = 20 + Math.floor(sizeRand * 40);
          break;
        case OBSTACLE_TYPES.ROCK:
          width = 30 + Math.floor(sizeRand * 30);
          height = 30 + Math.floor(sizeRand * 30);
          break;
        case OBSTACLE_TYPES.TREE:
          width = 30 + Math.floor(sizeRand * 20);
          height = 30 + Math.floor(sizeRand * 20);
          break;
        case OBSTACLE_TYPES.BOX:
          width = 30 + Math.floor(sizeRand * 20);
          height = 30 + Math.floor(sizeRand * 20);
          break;
      }

      // 随机位置（在地图单元范围内）
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const posX = (seed / 0x7fffffff) * (this.mapUnitWidth - width);
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const posY = (seed / 0x7fffffff) * (this.mapUnitHeight - height);

      // 检查是否与其他障碍物重叠
      let overlapping = false;
      for (const existingObstacle of obstacles) {
        const overlappingCheck = !(
          posX + width < existingObstacle.x ||
          posX > existingObstacle.x + existingObstacle.width ||
          posY + height < existingObstacle.y ||
          posY > existingObstacle.y + existingObstacle.height
        );

        if (overlappingCheck) {
          overlapping = true;
          break;
        }
      }

      if (!overlapping) {
        const obstacle = {
          x: posX,
          y: posY,
          width: width,
          height: height,
          type: type,
          isDestructible: type === OBSTACLE_TYPES.BOX,
          health: type === OBSTACLE_TYPES.BOX ? 20 : Infinity, // 箱子血量减少60% (从50改为20)
          maxHealth: type === OBSTACLE_TYPES.BOX ? 20 : Infinity,
          active: true,
          color: this.getObstacleColor(type),
          gridX: gridX,
          gridY: gridY,
          index: obstacleIndex++
        };

        obstacles.push(obstacle);
      }
    }

    return obstacles;
  }
  */

  // 获取障碍物颜色
  getObstacleColor(type) {
    switch (type) {
      case OBSTACLE_TYPES.WALL:
        return '#666666';
      case OBSTACLE_TYPES.ROCK:
        return '#8B4513';
      case OBSTACLE_TYPES.TREE:
        return '#228B22';
      case OBSTACLE_TYPES.BOX:
        return '#DAA520';
      default:
        return '#666666';
    }
  }

  // 更新地图（根据玩家移动，可选参数）
  update(playerDeltaX = 0, playerDeltaY = 0) {
    // 获取玩家实际宽高（从全局玩家对象）
    let playerWidth = 21; // 默认值
    let playerHeight = 21; // 默认值
    
    if (GameGlobal.databus && GameGlobal.databus.player) {
      const player = GameGlobal.databus.player;
      playerWidth = player.width;
      playerHeight = player.height;
    }

    // 调试用：每60帧打印碰撞区域信息（已注释）
    // if (GameGlobal.databus.frame % 60 === 0) {
    //   const buffer = 2;  // 碰撞缓冲区
    //   const checkWidth = playerWidth - buffer * 2;
    //   const checkHeight = playerHeight - buffer * 2;
    //   console.log(`[碰撞区域] 玩家视觉大小: ${playerWidth}x${playerHeight}, 碰撞检测区域: ${checkWidth}x${checkHeight}, 缓冲区: ${buffer}px`);
    // }

    // 关键修复：每帧都更新玩家地图坐标，不仅仅是移动时
    // 计算玩家当前在地图中的位置（基于屏幕坐标）
    const playerScreenX = GameGlobal.databus.player.x;
    const playerScreenY = GameGlobal.databus.player.y;
    
    // 将玩家屏幕坐标转换为地图坐标
    const newPlayerMapX = playerScreenX - this.offsetX;
    const newPlayerMapY = playerScreenY - this.offsetY;
    
    // 如果提供了移动增量，应用移动
    if (playerDeltaX !== 0 || playerDeltaY !== 0) {
      const targetPlayerMapX = newPlayerMapX + playerDeltaX;
      const targetPlayerMapY = newPlayerMapY + playerDeltaY;

      // 检查是否超出地图边界
      const clampedX = Math.max(0, Math.min(this.mapWidth - playerWidth, targetPlayerMapX));
      const clampedY = Math.max(0, Math.min(this.mapHeight - playerHeight, targetPlayerMapY));

      // 检查障碍物碰撞
      const isColliding = this.checkCollisionWithObstacles(clampedX, clampedY, playerWidth, playerHeight);

      if (!isColliding) {
        this.playerMapX = clampedX;
        this.playerMapY = clampedY;
        
        // 更新玩家屏幕坐标（保持玩家在屏幕中心）
        GameGlobal.databus.player.x = SCREEN_WIDTH / 2 - playerWidth / 2;
        GameGlobal.databus.player.y = SCREEN_HEIGHT / 2 - playerHeight / 2;
      }

      // 更新地图偏移量（相机跟随玩家）
      this.offsetX = SCREEN_WIDTH / 2 - this.playerMapX - playerWidth / 2;
      this.offsetY = SCREEN_HEIGHT / 2 - this.playerMapY - playerHeight / 2;
    } else {
      // 玩家静止时，也要更新玩家地图坐标
      // 确保敌人碰撞检测使用的是最新的玩家位置
      this.playerMapX = newPlayerMapX;
      this.playerMapY = newPlayerMapY;
      
      // 更新地图偏移量（保持相机正确）
      this.offsetX = SCREEN_WIDTH / 2 - this.playerMapX - playerWidth / 2;
      this.offsetY = SCREEN_HEIGHT / 2 - this.playerMapY - playerHeight / 2;
    }

    // 更新道具箱
    this.updateItemBoxes();
  }

  // 简化版的碰撞检测（不再使用mapCache）
  checkCollisionWithObstacles(x, y, width, height) {
    // 移除缓冲区，使碰撞检测与视觉大小一致
    // 之前有5像素缓冲区，导致实际碰撞区域是(21-10)x(21-10)=11x11
    // 而视觉玩家是21x21，所以敌人看起来接触了但没触发碰撞
    // 现在不使用缓冲区，使碰撞检测与视觉大小完全一致
    const checkX = x;
    const checkY = y;
    const checkWidth = width;
    const checkHeight = height;

    // 检测固定道具碰撞
    for (const obstacle of this.fixedObstacles) {
      if (!obstacle.active) continue;

      // AABB碰撞检测
      const overlapping = !(
        checkX + checkWidth < obstacle.x ||
        checkX > obstacle.x + obstacle.width ||
        checkY + checkHeight < obstacle.y ||
        checkY > obstacle.y + obstacle.height
      );

      if (overlapping) {
        return true; // 发生碰撞
      }
    }

    // 检测道具箱碰撞
    for (const box of this.itemBoxes) {
      if (!box.active) continue;

      const overlapping = !(
        checkX + checkWidth < box.x ||
        checkX > box.x + box.width ||
        checkY + checkHeight < box.y ||
        checkY > box.y + box.height
      );

      if (overlapping) {
        return true; // 发生碰撞
      }
    }

    return false; // 没有碰撞
  }

  // 更新道具箱系统
  updateItemBoxes() {
    const currentTime = Date.now();

    // 检查是否需要生成新的道具箱
    if (this.itemBoxes.length < this.maxBoxes && currentTime - this.lastBoxSpawnTime >= this.nextBoxSpawnTime) {
      this.spawnItemBox();
      this.lastBoxSpawnTime = currentTime;

      // 更新下一次生成时间（每次增加10秒）
      this.boxSpawnDelay += this.boxSpawnIncrement;
      this.nextBoxSpawnTime = this.boxSpawnDelay;
    }

    // 每分钟生成一个只有1点血的箱子
    if (currentTime - this.lastWeakBoxSpawnTime >= this.weakBoxSpawnInterval) {
      this.spawnWeakBox();
      this.lastWeakBoxSpawnTime = currentTime;
    }

    // 清理不活跃的道具箱
    this.itemBoxes = this.itemBoxes.filter(box => box.active);
  }

  // 生成道具箱
  spawnItemBox() {
    const width = 35 + Math.floor(Math.random() * 15);
    const height = 35 + Math.floor(Math.random() * 15);

    // 随机位置（避开中心区域和边缘）
    let x, y, isValidPosition;
    let attempts = 0;
    const maxAttempts = 50;
    const margin = 100; // 边缘缓冲区

    do {
      x = margin + Math.random() * (this.mapWidth - width - margin * 2);
      y = margin + Math.random() * (this.mapHeight - height - margin * 2);

      // 检查是否在中心区域（玩家出生点）
      const centerX = this.mapWidth / 2;
      const centerY = this.mapHeight / 2;
      const distFromCenter = Math.sqrt(
        Math.pow(x + width / 2 - centerX, 2) +
        Math.pow(y + height / 2 - centerY, 2)
      );

      isValidPosition = distFromCenter > 150; // 避开中心150像素

      // 检查是否与其他障碍物或道具箱重叠
      if (isValidPosition) {
        // 检查与固定障碍物重叠
        for (const obstacle of this.fixedObstacles) {
          if (!obstacle.active) continue;

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

      // 检查与现有道具箱重叠
      if (isValidPosition) {
        for (const box of this.itemBoxes) {
          const overlapping = !(x + width < box.x ||
                              x > box.x + box.width ||
                              y + height < box.y ||
                              y > box.y + box.height);
          if (overlapping) {
            isValidPosition = false;
            break;
          }
        }
      }

      attempts++;
    } while (!isValidPosition && attempts < maxAttempts);

    if (isValidPosition) {
      const box = {
        x: x,
        y: y,
        width: width,
        height: height,
        type: 'item_box',
        isDestructible: true,
        health: 30, // 道具箱血量
        maxHealth: 30,
        active: true,
        color: '#FFD700', // 金色
        borderColor: '#B8860B'
      };

      this.itemBoxes.push(box);
      console.log(`[生成道具箱] 位置: (${x.toFixed(0)}, ${y.toFixed(0)}), 尺寸: ${box.width.toFixed(0)}x${box.height.toFixed(0)}, 数量: ${this.itemBoxes.length}`);
    }
  }

  // 生成弱箱子（只有1点血，每分钟生成一个）
  spawnWeakBox() {
    const width = 25 + Math.floor(Math.random() * 10);
    const height = 25 + Math.floor(Math.random() * 10);

    // 随机位置（避开中心区域和边缘）
    let x, y, isValidPosition;
    let attempts = 0;
    const maxAttempts = 50;
    const margin = 100; // 边缘缓冲区

    do {
      x = margin + Math.random() * (this.mapWidth - width - margin * 2);
      y = margin + Math.random() * (this.mapHeight - height - margin * 2);

      // 检查是否在中心区域（玩家出生点）
      const centerX = this.mapWidth / 2;
      const centerY = this.mapHeight / 2;
      const distFromCenter = Math.sqrt(
        Math.pow(x + width / 2 - centerX, 2) +
        Math.pow(y + height / 2 - centerY, 2)
      );

      isValidPosition = distFromCenter > 150; // 避开中心150像素

      // 检查是否与其他障碍物或道具箱重叠
      if (isValidPosition) {
        // 检查与固定障碍物重叠
        for (const obstacle of this.fixedObstacles) {
          if (!obstacle.active) continue;

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

      // 检查与现有道具箱重叠
      if (isValidPosition) {
        for (const box of this.itemBoxes) {
          const overlapping = !(x + width < box.x ||
                              x > box.x + box.width ||
                              y + height < box.y ||
                              y > box.y + box.height);
          if (overlapping) {
            isValidPosition = false;
            break;
          }
        }
      }

      attempts++;
    } while (!isValidPosition && attempts < maxAttempts);

    if (isValidPosition) {
      const box = {
        x: x,
        y: y,
        width: width,
        height: height,
        type: 'weak_box',
        isDestructible: true,
        isWeakBox: true, // 标记为弱箱子
        health: 1, // 只有1点血
        maxHealth: 1,
        active: true,
        color: '#90EE90', // 浅绿色
        borderColor: '#228B22' // 深绿色边框
      };

      this.itemBoxes.push(box);
      console.log(`[生成弱箱子] 位置: (${x.toFixed(0)}, ${y.toFixed(0)}), 尺寸: ${box.width.toFixed(0)}x${box.height.toFixed(0)}`);
    }
  }

  // 对道具箱造成伤害
  damageItemBox(box, damage, mapX, mapY) {
    if (!box.isDestructible || !box.active) return false;

    box.health -= damage;

    if (box.health <= 0) {
      box.active = false;

      // 区分弱箱子和普通箱子
      if (box.isWeakBox && GameGlobal.databus.itemSystem) {
        // 弱箱子：道具掉率25%，金币掉率50%
        GameGlobal.databus.itemSystem.dropFromWeakBox(
          mapX + box.width / 2,
          mapY + box.height / 2
        );
        console.log(`[弱箱子破坏] 掉落道具或金币`);
      } else if (GameGlobal.databus.itemSystem) {
        // 普通箱子：道具掉率25%
        GameGlobal.databus.itemSystem.dropItemFromBox(
          mapX + box.width / 2,
          mapY + box.height / 2
        );
        console.log(`[道具箱破坏] 掉落一次性道具`);
      }

      return true;
    }

    return false;
  }

  // 渲染地图
  render(ctx) {
    // 绘制红色边界线（让玩家知道地图边缘）
    // 边界线跟随地图移动
    ctx.strokeStyle = '#ff0000'; // 纯红色
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, this.mapWidth, this.mapHeight);

    // 渲染固定道具
    this.renderFixedObstacles(ctx);

    // 渲染道具箱
    this.renderItemBoxes(ctx);
  }

  // 渲染固定道具
  renderFixedObstacles(ctx) {
    for (const obstacle of this.fixedObstacles) {
      if (!obstacle.active) continue;

      // 视口剔除：如果完全在屏幕外，跳过渲染
      const screenX = obstacle.x;
      const screenY = obstacle.y;
      if (screenX > -this.offsetX + SCREEN_WIDTH || screenX + obstacle.width < -this.offsetX ||
          screenY > -this.offsetY + SCREEN_HEIGHT || screenY + obstacle.height < -this.offsetY) {
        continue;
      }

      ctx.save();

      // 绘制道具主体
      ctx.fillStyle = obstacle.color;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

      // 绘制边框
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

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
      }

      ctx.restore();
    }
  }

  // 渲染道具箱
  renderItemBoxes(ctx) {
    for (const box of this.itemBoxes) {
      if (!box.active) continue;

      // 道具箱使用地图坐标，跟随地图移动
      const screenX = box.x;
      const screenY = box.y;

      // 如果完全在屏幕外，跳过渲染
      if (screenX > -this.offsetX + SCREEN_WIDTH || screenX + box.width < -this.offsetX ||
          screenY > -this.offsetY + SCREEN_HEIGHT || screenY + box.height < -this.offsetY) {
        continue;
      }

      ctx.save();

      // 绘制道具箱主体（金色）
      ctx.fillStyle = box.color;
      ctx.fillRect(screenX, screenY, box.width, box.height);

      // 绘制边框
      ctx.strokeStyle = box.borderColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(screenX, screenY, box.width, box.height);

      // 绘制装饰性图案（宝箱样式）
      ctx.strokeStyle = box.borderColor;
      ctx.lineWidth = 2;
      
      // 绘制对角线
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(screenX + box.width, screenY + box.height);
      ctx.moveTo(screenX + box.width, screenY);
      ctx.lineTo(screenX, screenY + box.height);
      ctx.stroke();

      // 绘制锁
      ctx.fillStyle = box.borderColor;
      ctx.beginPath();
      ctx.arc(screenX + box.width / 2, screenY + box.height / 2, 4, 0, Math.PI * 2);
      ctx.fill();

      // 绘制生命条（如果受到伤害）
      if (box.health < box.maxHealth) {
        const healthPercent = box.health / box.maxHealth;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(screenX, screenY - 10, box.width, 6);
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(screenX, screenY - 10, box.width * healthPercent, 6);
      }

      ctx.restore();
    }
  }

  // 重置地图
  reset() {
    this.init();
  }
}

export default InfiniteMap;
