import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

// 金币类型
const COIN_TYPES = {
  NORMAL: 'normal',      // 普通金币
  SILVER: 'silver',      // 银币
  GOLD: 'gold'           // 金币
};

// 金币系统
export class CoinSystem {
  constructor() {
    this.coins = [];
    this.totalCoins = 0;  // 玩家总金币数
  }

  // 创建金币
  createCoin(x, y, amount = 1, type = COIN_TYPES.NORMAL) {
    const coin = {
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 3,  // 水平速度（随机）
      vy: (Math.random() - 0.5) * 3 - 2,  // 垂直速度（向上抛出）
      amount: amount,
      type: type,
      active: true,
      size: 6,
      duration: 900,  // 15 秒 = 900 帧 (60fps)
      bounceCount: 0,
      maxBounce: 3,
      value: this.getCoinValue(type)
    };

    this.coins.push(coin);
    return coin;
  }

  // 生成金币（简单版本，用于 itemSystem 调用）
  spawnCoin(x, y, amount = 1, type = COIN_TYPES.NORMAL) {
    return this.createCoin(x, y, amount, type);
  }

  // 获取金币价值
  getCoinValue(type) {
    switch (type) {
      case COIN_TYPES.NORMAL:
        return 1;
      case COIN_TYPES.SILVER:
        return 5;
      case COIN_TYPES.GOLD:
        return 10;
      default:
        return 1;
    }
  }

  // 掉落金币（根据敌人类型）
  dropCoins(enemyType, x, y) {
    let dropRate = 0.25;  // 普通怪物 15% 掉率
    let minAmount = 1;
    let maxAmount = 1;
    let coinType = COIN_TYPES.NORMAL;

    // 根据敌人类型调整掉率、数量和类型
    switch (enemyType) {
      case 'normal':
        dropRate = 0.15;
        minAmount = 1;
        maxAmount = 1;
        coinType = COIN_TYPES.NORMAL;
        break;
      case 'elite':
      case 'ranged':
        dropRate = 0.50;  // 精英怪 50% 掉率
        minAmount = 1;
        maxAmount = 1;
        coinType = COIN_TYPES.SILVER;
        break;
      case 'super_elite':
        dropRate = 0.80;  // 超级精英怪 80% 掉率
        minAmount = 3;
        maxAmount = 3;
        coinType = COIN_TYPES.SILVER;
        break;
      case 'super_boss':
        dropRate = 1.0;  // BOSS 100% 掉率
        minAmount = 5;
        maxAmount = 5;
        coinType = COIN_TYPES.GOLD;
        break;
    }

    // 判断是否掉落
    if (Math.random() < dropRate) {
      const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

      // 立即创建所有金币，不使用 setTimeout 避免游戏重置后继续掉落
      for (let i = 0; i < amount; i++) {
        this.createCoin(
          x + (Math.random() - 0.5) * 30,
          y + (Math.random() - 0.5) * 30,
          1,
          coinType
        );
      }

      return amount;  // 返回掉落的金币总数
    }

    return 0;
  }

  // 箱子掉落金币
  dropCoinsFromBox(x, y) {
    // 箱子掉落金币概率：30%
    if (Math.random() < 0.30) {
      const amount = Math.floor(Math.random() * 5) + 1;  // 1-5 个金币

      // 立即创建所有金币，不使用 setTimeout 避免游戏重置后继续掉落
      for (let i = 0; i < amount; i++) {
        this.createCoin(
          x + (Math.random() - 0.5) * 30,
          y + (Math.random() - 0.5) * 30,
          1,
          COIN_TYPES.NORMAL
        );
      }
    }
  }

  // 更新金币位置和状态
  update(player, magnetRadius) {
    // 获取玩家在世界地图中的位置
    let playerCenterX = player.x + player.width / 2;
    let playerCenterY = player.y + player.height / 2;

    // 如果有无限地图系统，使用玩家在世界中的位置
    if (GameGlobal.databus.infiniteMap) {
      const map = GameGlobal.databus.infiniteMap;
      playerCenterX = map.playerMapX + player.width / 2;
      playerCenterY = map.playerMapY + player.height / 2;
    }

    // 获取地图尺寸（用于物理运动）
    let mapWidth = SCREEN_WIDTH;
    let mapHeight = SCREEN_HEIGHT;
    if (GameGlobal.databus.infiniteMap) {
      mapWidth = GameGlobal.databus.infiniteMap.mapWidth;
      mapHeight = GameGlobal.databus.infiniteMap.mapHeight;
    }

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];

      if (!coin.active) {
        this.coins.splice(i, 1);
        continue;
      }

      // 计算金币与玩家的距离（金币使用世界坐标）
      const dx = playerCenterX - coin.x;
      const dy = playerCenterY - coin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // 判断是否被玩家拾取
      if (dist < magnetRadius) {
        // 磁力吸附效果：更新金币的世界坐标
        const speed = 8;
        coin.x += (dx / dist) * speed;
        coin.y += (dy / dist) * speed;

        // 重新计算距离
        const newDist = Math.sqrt(
          (playerCenterX - coin.x) ** 2 + (playerCenterY - coin.y) ** 2
        );

        // 拾取金币
        if (newDist < player.width / 2 + coin.size) {
          // 应用金币增幅
          const goldBoost = player.goldBoost || 0;
          const coinAmount = coin.value * coin.amount * (1 + goldBoost);
          this.totalCoins += Math.floor(coinAmount);
          this.coins.splice(i, 1);
          continue;
        }
      } else {
        // 移除物理效果，让金币在原地待着
        // 只保留轻微的随机抖动效果
        coin.x += (Math.random() - 0.5) * 0.2;
        coin.y += (Math.random() - 0.5) * 0.2;

        // 确保金币在地图范围内
        coin.x = Math.max(0, Math.min(mapWidth, coin.x));
        coin.y = Math.max(0, Math.min(mapHeight, coin.y));

        // 超时消失
        coin.duration--;
        if (coin.duration <= 0) {
          this.coins.splice(i, 1);
          continue;
        }
      }
    }
  }

  // 瞬间吸附所有金币
  magnetAll(player) {
    const goldBoost = player ? (player.goldBoost || 0) : 0;
    for (const coin of this.coins) {
      if (coin.active) {
        // 瞬间移动到玩家位置
        const coinAmount = coin.value * coin.amount * (1 + goldBoost);
        this.totalCoins += Math.floor(coinAmount);
        coin.active = false;
      }
    }

    // 清空金币数组
    this.coins = [];
  }

  // 渲染金币
  render(ctx) {
    // 金币已经在 ctx.translate 内部，直接使用世界坐标
    for (const coin of this.coins) {
      if (!coin.active) continue;

      // 根据金币类型设置颜色
      let color;
      switch (coin.type) {
        case COIN_TYPES.NORMAL:
          color = '#B87333';  // 红铜色（铜币）
          break;
        case COIN_TYPES.SILVER:
          color = '#C0C0C0';  // 银色
          break;
        case COIN_TYPES.GOLD:
          color = '#FFA500';  // 橙金色
          break;
        default:
          color = '#B87333';
      }

      // 金币使用世界坐标，不需要额外偏移
      const renderX = coin.x;
      const renderY = coin.y;

      // 绘制金币
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(renderX, renderY, coin.size, 0, Math.PI * 2);
      ctx.fill();

      // 绘制金币高光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(renderX - 2, renderY - 2, coin.size / 3, 0, Math.PI * 2);
      ctx.fill();

      // 绘制金币边缘
      ctx.strokeStyle = '#AA8800';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(renderX, renderY, coin.size, 0, Math.PI * 2);
      ctx.stroke();

      // 显示数量（如果大于1）
      if (coin.amount > 1) {
        ctx.fillStyle = '#000';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`×${coin.amount}`, renderX, renderY + 3);
      }
    }
  }

  // 重置金币系统
  reset() {
    this.coins = [];
    this.totalCoins = 0;
  }
}

export default CoinSystem;
