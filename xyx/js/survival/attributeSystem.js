import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

// 属性配置：每级增加的数值和基础值
const ATTRIBUTE_CONFIG = {
  maxHealth: {
    name: '最大生命值',
    baseValue: 100,
    increasePerLevel: 10,
    icon: '❤️',
    unit: ''
  },
  moveSpeed: {
    name: '移动速度',
    baseValue: 3.24,
    increasePerLevel: 0.2,
    icon: '👟',
    unit: ''
  },
  magnetRadius: {
    name: '磁力半径',
    baseValue: 80,
    increasePerLevel: 10,
    icon: '🧲',
    unit: ''
  },
  armor: {
    name: '护甲',
    baseValue: 0,
    increasePerLevel: 2,
    icon: '🛡️',
    unit: ''
  },
  luck: {
    name: '幸运值',
    baseValue: 1,
    increasePerLevel: 0.1,
    icon: '🍀',
    unit: ''
  }
};

// 属性系统
export class AttributeSystem {
  constructor() {
    this.isVisible = false;
    this.attributeLevels = this.loadAttributeLevels();
  }

  // 加载属性等级
  loadAttributeLevels() {
    try {
      const saved = wx.getStorageSync('survival_attributeLevels');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.log('加载属性等级失败:', e);
    }
    // 默认所有属性为0级
    return {
      maxHealth: 0,
      moveSpeed: 0,
      magnetRadius: 0,
      armor: 0,
      luck: 0
    };
  }

  // 保存属性等级
  saveAttributeLevels() {
    try {
      wx.setStorageSync('survival_attributeLevels', JSON.stringify(this.attributeLevels));
    } catch (e) {
      console.log('保存属性等级失败:', e);
    }
  }

  // 获取属性当前值
  getAttributeValue(attrKey) {
    const config = ATTRIBUTE_CONFIG[attrKey];
    const level = this.attributeLevels[attrKey] || 0;
    return config.baseValue + config.increasePerLevel * level;
  }

  // 获取升级所需金币
  getUpgradeCost(attrKey) {
    const level = this.attributeLevels[attrKey] || 0;
    // 基础100金币，每级增加50
    return 100 + level * 50;
  }

  // 升级属性
  upgradeAttribute(attrKey) {
    const currentLevel = this.attributeLevels[attrKey] || 0;
    
    // 检查是否已满级
    if (currentLevel >= 20) {
      return { success: false, message: '已满级' };
    }

    // 检查金币
    const cost = this.getUpgradeCost(attrKey);
    const coinSystem = GameGlobal.databus.coinSystem;
    if (!coinSystem || coinSystem.totalCoins < cost) {
      return { success: false, message: '金币不足' };
    }

    // 扣除金币并升级
    coinSystem.spendCoins(cost);
    this.attributeLevels[attrKey] = currentLevel + 1;
    this.saveAttributeLevels();

    // 应用到玩家
    this.applyToPlayer();

    return { success: true, message: '升级成功' };
  }

  // 应用属性到玩家
  applyToPlayer() {
    const player = GameGlobal.databus.player;
    if (!player) return;

    player.stats.maxHealth = this.getAttributeValue('maxHealth');
    player.stats.moveSpeed = this.getAttributeValue('moveSpeed');
    player.stats.magnetRadius = this.getAttributeValue('magnetRadius');
    player.stats.armor = this.getAttributeValue('armor');
    player.stats.luck = this.getAttributeValue('luck');
    
    // 确保当前生命值不超过最大值
    if (player.stats.currentHealth > player.stats.maxHealth) {
      player.stats.currentHealth = player.stats.maxHealth;
    }
  }

  // 显示属性界面
  show() {
    this.isVisible = true;
  }

  // 隐藏属性界面
  hide() {
    this.isVisible = false;
  }

  // 绘制圆角矩形
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // 渲染属性界面
  render(ctx) {
    if (!this.isVisible) return;

    // 半透明背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 属性面板
    const panelWidth = SCREEN_WIDTH - 40;
    const panelHeight = SCREEN_HEIGHT - 100;
    const panelX = 20;
    const panelY = 50;

    // 绘制面板背景
    ctx.fillStyle = 'rgba(40, 40, 50, 0.95)';
    this.roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    this.roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 16);
    ctx.stroke();

    // 金币显示（标题左边）
    const coinSystem = GameGlobal.databus.coinSystem;
    const totalCoins = coinSystem ? coinSystem.totalCoins : 0;
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`💰 ${totalCoins}`, panelX + 20, panelY + 35);

    // 标题栏（居中）
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('角色属性', SCREEN_WIDTH / 2, panelY + 35);

    // 关闭按钮
    const closeBtnX = panelX + panelWidth - 30;
    const closeBtnY = panelY + 10;
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(closeBtnX, closeBtnY + 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('×', closeBtnX, closeBtnY + 15);

    // 属性列表
    const attrKeys = Object.keys(ATTRIBUTE_CONFIG);
    const itemHeight = 70;
    const startY = panelY + 60;

    attrKeys.forEach((key, index) => {
      const config = ATTRIBUTE_CONFIG[key];
      const level = this.attributeLevels[key] || 0;
      const currentValue = this.getAttributeValue(key);
      const cost = this.getUpgradeCost(key);
      const isMaxLevel = level >= 20;

      const itemY = startY + index * itemHeight;

      // 属性背景
      ctx.fillStyle = 'rgba(60, 60, 70, 0.6)';
      this.roundRect(ctx, panelX + 10, itemY, panelWidth - 20, itemHeight - 10, 8);
      ctx.fill();

      // 属性图标和名称
      ctx.textAlign = 'left';
      ctx.font = '18px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${config.icon} ${config.name}`, panelX + 25, itemY + 25);

      // 等级显示
      ctx.font = '14px Arial';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText(`Lv.${level}/20`, panelX + 25, itemY + 45);

      // 当前值显示
      ctx.textAlign = 'center';
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#4CAF50';
      let displayValue = currentValue.toFixed(config.increasePerLevel < 1 ? 2 : 0);
      ctx.fillText(displayValue + config.unit, panelX + panelWidth / 2, itemY + 35);

      // 升级按钮
      const btnWidth = 100;
      const btnHeight = 35;
      const btnX = panelX + panelWidth - btnWidth - 25;
      const btnY = itemY + 12;

      if (isMaxLevel) {
        // 已满级
        ctx.fillStyle = '#666666';
        this.roundRect(ctx, btnX, btnY, btnWidth, btnHeight, 6);
        ctx.fill();
        ctx.font = '14px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('已满级', btnX + btnWidth / 2, btnY + 22);
      } else {
        // 升级按钮
        const canAfford = totalCoins >= cost;
        ctx.fillStyle = canAfford ? '#4CAF50' : '#666666';
        this.roundRect(ctx, btnX, btnY, btnWidth, btnHeight, 6);
        ctx.fill();
        ctx.font = '14px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${cost}升级`, btnX + btnWidth / 2, btnY + 22);
      }
    });

    // 底部提示
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888888';
    ctx.fillText('升级属性将在下一局生效', SCREEN_WIDTH / 2, panelY + panelHeight - 20);
  }

  // 处理触摸事件
  handleTouch(x, y) {
    if (!this.isVisible) return false;

    const panelWidth = SCREEN_WIDTH - 40;
    const panelHeight = SCREEN_HEIGHT - 100;
    const panelX = 20;
    const panelY = 50;

    // 关闭按钮
    const closeBtnX = panelX + panelWidth - 30;
    const closeBtnY = panelY + 10;
    const closeBtnRadius = 12;
    const dist = Math.sqrt((x - closeBtnX) ** 2 + (y - (closeBtnY + 10)) ** 2);
    if (dist <= closeBtnRadius + 5) {
      this.hide();
      return true;
    }

    // 点击面板外关闭
    if (x < panelX || x > panelX + panelWidth || y < panelY || y > panelY + panelHeight) {
      this.hide();
      return true;
    }

    // 检查升级按钮点击
    const attrKeys = Object.keys(ATTRIBUTE_CONFIG);
    const itemHeight = 70;
    const startY = panelY + 60;
    const btnWidth = 100;
    const btnHeight = 35;

    attrKeys.forEach((key, index) => {
      const level = this.attributeLevels[key] || 0;
      if (level >= 20) return; // 已满级跳过

      const itemY = startY + index * itemHeight;
      const btnX = panelX + panelWidth - btnWidth - 25;
      const btnY = itemY + 12;

      if (x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight) {
        const result = this.upgradeAttribute(key);
        if (result.success) {
          wx.showToast({ title: '升级成功', icon: 'success' });
        } else {
          wx.showToast({ title: result.message, icon: 'none' });
        }
      }
    });

    return true;
  }
}

export default AttributeSystem;
