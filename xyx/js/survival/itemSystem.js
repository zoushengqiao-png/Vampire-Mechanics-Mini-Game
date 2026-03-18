import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

// 道具类型
const ITEM_TYPES = {
  MAGNET: 'magnet',           // 磁力吸附
  CLEAR_SCREEN: 'clear_screen' // 清屏炸弹
};

// 道具系统
export class ItemSystem {
  constructor() {
    this.items = [];
  }

  // 创建道具
  createItem(x, y, type) {
    const item = {
      x: x,
      y: y,
      type: type,
      active: true,
      size: 15,
      duration: 1800,  // 30秒 = 1800帧
      color: this.getItemColor(type),
      name: this.getItemName(type),
      description: this.getItemDescription(type)
    };

    this.items.push(item);
    return item;
  }

  // 获取道具颜色
  getItemColor(type) {
    switch (type) {
      case ITEM_TYPES.MAGNET:
        return '#00BFFF';  // 深蓝色
      case ITEM_TYPES.CLEAR_SCREEN:
        return '#FF4500';  // 橙红色
      default:
        return '#FFFFFF';
    }
  }

  // 获取道具名称
  getItemName(type) {
    switch (type) {
      case ITEM_TYPES.MAGNET:
        return '磁力吸附';
      case ITEM_TYPES.CLEAR_SCREEN:
        return '清屏炸弹';
      default:
        return '未知道具';
    }
  }

  // 获取道具描述
  getItemDescription(type) {
    switch (type) {
      case ITEM_TYPES.MAGNET:
        return '瞬间吸附屏幕内所有经验、金币';
      case ITEM_TYPES.CLEAR_SCREEN:
        return '瞬间杀死屏幕内所有敌人';
      default:
        return '';
    }
  }

  // 掉落道具（从箱子）
  dropItemFromBox(x, y) {
    // 掉落概率：25%
    if (Math.random() < 0.25) {
      // 随机选择道具类型
      const types = [ITEM_TYPES.MAGNET, ITEM_TYPES.CLEAR_SCREEN];
      const type = types[Math.floor(Math.random() * types.length)];

      this.createItem(x, y, type);
      return true;
    }
    return false;
  }

  // 从低血量箱子掉落道具或金币（道具25%，金币50%）
  dropFromWeakBox(x, y) {
    const rand = Math.random();

    // 25%概率掉落道具
    if (rand < 0.25) {
      const types = [ITEM_TYPES.MAGNET, ITEM_TYPES.CLEAR_SCREEN];
      const type = types[Math.floor(Math.random() * types.length)];
      this.createItem(x, y, type);
      return 'item';
    }
    // 50%概率掉落金币
    else if (rand < 0.75) {
      if (GameGlobal.databus.coinSystem) {
        GameGlobal.databus.coinSystem.spawnCoin(x, y);
      }
      return 'coin';
    }
    return null;
  }

  // 掉落道具（从敌人）
  dropItemFromEnemy(x, y, enemyType) {
    // 超级精英怪和BOSS有更高概率掉落道具
    let dropRate = 0.02;  // 普通怪物2%掉率

    if (enemyType === 'elite' || enemyType === 'ranged') {
      dropRate = 0.05;  // 精英怪5%掉率
    } else if (enemyType === 'super_elite') {
      dropRate = 0.20;  // 超级精英怪20%掉率
    } else if (enemyType === 'super_boss') {
      dropRate = 0.30;  // BOSS 30%掉率
    }

    if (Math.random() < dropRate) {
      // 随机选择道具类型
      const types = [ITEM_TYPES.MAGNET, ITEM_TYPES.CLEAR_SCREEN];
      const type = types[Math.floor(Math.random() * types.length)];

      this.createItem(x, y, type);
      return true;
    }
    return false;
  }

  // 更新道具状态
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

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];

      if (!item.active) {
        this.items.splice(i, 1);
        continue;
      }

      // 计算道具与玩家的距离（道具使用世界坐标）
      const dx = playerCenterX - item.x;
      const dy = playerCenterY - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // 判断是否被玩家拾取
      if (dist < magnetRadius) {
        // 磁力吸附效果：更新道具的世界坐标
        const speed = 6;
        item.x += (dx / dist) * speed;
        item.y += (dy / dist) * speed;

        // 重新计算距离
        const newDist = Math.sqrt(
          (playerCenterX - item.x) ** 2 + (playerCenterY - item.y) ** 2
        );

        // 拾取道具
        if (newDist < player.width / 2 + item.size) {
          this.useItem(item);
          this.items.splice(i, 1);
          continue;
        }
      } else {
        // 超时消失
        item.duration--;
        if (item.duration <= 0) {
          this.items.splice(i, 1);
          continue;
        }
      }
    }
  }

  // 使用道具
  useItem(item) {
    console.log(`使用道具: ${item.name}`);

    switch (item.type) {
      case ITEM_TYPES.MAGNET:
        // 磁力吸附：吸附所有经验和金币
        if (GameGlobal.databus.coinSystem) {
          GameGlobal.databus.coinSystem.magnetAll(GameGlobal.databus.player);
        }
        if (GameGlobal.databus.expBalls) {
          // 吸附所有经验球
          const player = GameGlobal.databus.player;
          const playerCenterX = player.x + player.width / 2;
          const playerCenterY = player.y + player.height / 2;

          for (const expBall of GameGlobal.databus.expBalls) {
            if (expBall.active) {
              GameGlobal.databus.player.addExp(expBall.exp);
              expBall.active = false;
            }
          }
          // 清空经验球数组
          GameGlobal.databus.expBalls = [];
        }
        break;

      case ITEM_TYPES.CLEAR_SCREEN:
        // 清屏炸弹：杀死所有敌人
        if (GameGlobal.databus.enemies) {
          const enemies = [...GameGlobal.databus.enemies];

          for (const enemy of enemies) {
            if (enemy.isActive) {
              // 被炸弹杀死的敌人正常掉落经验和金币
              enemy.takeDamage(enemy.currentHealth);
            }
          }
        }
        break;
    }

    // 显示道具使用提示
    this.showItemUseNotification(item.name);
  }

  // 显示道具使用提示
  showItemUseNotification(itemName) {
    // 可以在游戏界面上显示提示信息
    console.log(`已使用道具: ${itemName}`);
  }

  // 渲染道具
  render(ctx) {
    // 道具已经在 ctx.translate 内部，直接使用世界坐标
    for (const item of this.items) {
      if (!item.active) continue;

      // 道具使用世界坐标，不需要额外偏移
      const renderX = item.x;
      const renderY = item.y;

      // 绘制道具背景
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(renderX, renderY, item.size, 0, Math.PI * 2);
      ctx.fill();

      // 绘制道具边框
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(renderX, renderY, item.size, 0, Math.PI * 2);
      ctx.stroke();

      // 绘制道具图标（简单表示）
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 根据道具类型绘制不同图标
      switch (item.type) {
        case ITEM_TYPES.MAGNET:
          ctx.fillText('⚡', renderX, renderY);
          break;
        case ITEM_TYPES.CLEAR_SCREEN:
          ctx.fillText('💣', renderX, renderY);
          break;
      }

      // 绘制道具名称（可选）
      // ctx.fillStyle = '#FFFFFF';
      // ctx.font = '10px Arial';
      // ctx.fillText(item.name, renderX, renderY + item.size + 12);
    }
  }

  // 重置道具系统
  reset() {
    this.items = [];
  }
}

export default ItemSystem;
