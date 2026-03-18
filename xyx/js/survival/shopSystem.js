import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

// 商城标签页类型
const SHOP_TABS = {
  ENEMIES: 'enemies',    // 敌人
  CHARACTERS: 'characters', // 角色
  MAPS: 'maps',         // 地图
  ITEMS: 'items',       // 道具
  ATTRIBUTES: 'attributes' // 属性
};

// 角色属性配置（可升级属性）
const PLAYER_ATTRIBUTES = [
  { id: 'maxHealth', name: '生命值', icon: '❤️', baseValue: 100, upgradePerLevel: 10, unit: '' },
  { id: 'moveSpeed', name: '移动速度', icon: '👟', baseValue: 3.24, upgradePerLevel: 0.2, unit: '' },
  { id: 'attack', name: '攻击力', icon: '⚔️', baseValue: 0, upgradePerLevel: 5, unit: '' },
  { id: 'armor', name: '护甲', icon: '🛡️', baseValue: 0, upgradePerLevel: 2, unit: '' },
  { id: 'luck', name: '幸运', icon: '🍀', baseValue: 1, upgradePerLevel: 0.5, unit: '' },
  { id: 'magnetRadius', name: '磁力范围', icon: '🧲', baseValue: 80, upgradePerLevel: 15, unit: '' }
];

// 商品数据
const SHOP_ITEMS = {
  enemies: [
    { id: 'enemy_skin_1', name: '红色小怪', price: 100, type: 'skin', target: 'normal', preview: '#ff4444' },
    { id: 'enemy_skin_2', name: '蓝色精英', price: 200, type: 'skin', target: 'elite', preview: '#4444ff' },
    { id: 'enemy_skin_3', name: '紫色Boss', price: 500, type: 'skin', target: 'super_boss', preview: '#aa44ff' },
  ],
  characters: [
    { id: 'char_skin_1', name: '金色战士', price: 300, type: 'character', preview: '#ffd700' },
    { id: 'char_skin_2', name: '暗黑骑士', price: 400, type: 'character', preview: '#333333' },
    { id: 'char_skin_3', name: '翠绿游侠', price: 350, type: 'character', preview: '#228B22' },
  ],
  maps: [
    { id: 'map_theme_1', name: '沙漠主题', price: 600, type: 'map', preview: '#DEB887' },
    { id: 'map_theme_2', name: '冰雪主题', price: 600, type: 'map', preview: '#E0FFFF' },
    { id: 'map_theme_3', name: '暗夜主题', price: 800, type: 'map', preview: '#191970' },
  ],
  items: [
    { id: 'item_boost_1', name: '经验加成x2', price: 150, type: 'boost', effect: 'exp_boost', preview: '#00ff00' },
    { id: 'item_boost_2', name: '金币加成x2', price: 150, type: 'boost', effect: 'gold_boost', preview: '#ffff00' },
    { id: 'item_boost_3', name: '移速加成', price: 200, type: 'boost', effect: 'speed_boost', preview: '#00ffff' },
  ],
  attributes: [] // 属性页面不显示商品列表
};

// 商城系统
export class ShopSystem {
  constructor() {
    this.isVisible = false;
    this.currentTab = SHOP_TABS.ENEMIES;
    this.scrollOffset = 0;
    this.selectedItem = null;
    this.purchasedItems = this.loadPurchasedItems();
    this.attributeLevels = this.loadAttributeLevels(); // 加载属性等级
    this.tabs = [
      { key: SHOP_TABS.ATTRIBUTES, name: '属性', icon: '📊' },
      { key: SHOP_TABS.ENEMIES, name: '敌人', icon: '👹' },
      { key: SHOP_TABS.CHARACTERS, name: '角色', icon: '🧙' },
      { key: SHOP_TABS.MAPS, name: '地图', icon: '🗺' },
      { key: SHOP_TABS.ITEMS, name: '道具', icon: '🎁' }
    ];
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
    const defaults = {};
    PLAYER_ATTRIBUTES.forEach(attr => {
      defaults[attr.id] = 0;
    });
    return defaults;
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
  getAttributeValue(attrId) {
    const attr = PLAYER_ATTRIBUTES.find(a => a.id === attrId);
    if (!attr) return 0;
    const level = this.attributeLevels[attrId] || 0;
    return attr.baseValue + attr.upgradePerLevel * level;
  }

  // 获取升级价格（等级 * 100）
  getUpgradePrice(attrId) {
    const level = this.attributeLevels[attrId] || 0;
    if (level >= 20) return 0; // 已满级
    return (level + 1) * 100; // 1级=100, 2级=200, ...
  }

  // 升级属性
  upgradeAttribute(attrId) {
    const level = this.attributeLevels[attrId] || 0;
    if (level >= 20) {
      return { success: false, message: '已满级' };
    }

    const price = this.getUpgradePrice(attrId);
    const coinSystem = GameGlobal.databus.coinSystem;
    if (!coinSystem || coinSystem.totalCoins < price) {
      return { success: false, message: '金币不足' };
    }

    // 扣除金币并升级
    coinSystem.spendCoins(price);
    this.attributeLevels[attrId] = level + 1;
    this.saveAttributeLevels();

    // 更新玩家属性
    this.applyAttributesToPlayer();

    return { success: true, message: '升级成功' };
  }

  // 应用属性到玩家
  applyAttributesToPlayer() {
    const player = GameGlobal.databus.player;
    if (!player) return;

    PLAYER_ATTRIBUTES.forEach(attr => {
      const value = this.getAttributeValue(attr.id);
      if (attr.id === 'maxHealth') {
        const oldMax = player.stats.maxHealth;
        player.stats.maxHealth = value;
        // 按比例恢复血量
        if (oldMax > 0) {
          player.stats.currentHealth = Math.min(
            player.stats.currentHealth * (value / oldMax),
            value
          );
        }
      } else if (player.stats[attr.id] !== undefined) {
        player.stats[attr.id] = value;
      }
    });
  }

  // 加载已购买商品
  loadPurchasedItems() {
    try {
      const saved = wx.getStorageSync('survival_purchasedItems');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  // 保存已购买商品
  savePurchasedItems() {
    try {
      wx.setStorageSync('survival_purchasedItems', JSON.stringify(this.purchasedItems));
    } catch (e) {
      console.log('保存购买记录失败:', e);
    }
  }

  // 检查商品是否已购买
  isPurchased(itemId) {
    return this.purchasedItems.includes(itemId);
  }

  // 购买商品
  purchaseItem(itemId) {
    if (this.isPurchased(itemId)) {
      return { success: false, message: '已拥有该商品' };
    }

    // 查找商品
    let item = null;
    for (const category of Object.values(SHOP_ITEMS)) {
      const found = category.find(i => i.id === itemId);
      if (found) {
        item = found;
        break;
      }
    }

    if (!item) {
      return { success: false, message: '商品不存在' };
    }

    // 检查金币是否足够
    const coinSystem = GameGlobal.databus.coinSystem;
    if (!coinSystem || coinSystem.totalCoins < item.price) {
      return { success: false, message: '金币不足' };
    }

    // 扣除金币
    coinSystem.spendCoins(item.price);
    
    // 记录购买
    this.purchasedItems.push(itemId);
    this.savePurchasedItems();

    return { success: true, message: '购买成功！' };
  }

  // 显示商城
  show() {
    this.isVisible = true;
    this.scrollOffset = 0;
    this.selectedItem = null;
  }

  // 隐藏商城
  hide() {
    this.isVisible = false;
    this.selectedItem = null;
  }

  // 切换标签页
  switchTab(tabKey) {
    this.currentTab = tabKey;
    this.scrollOffset = 0;
    this.selectedItem = null;
  }

  // 获取当前标签页的商品
  getCurrentItems() {
    return SHOP_ITEMS[this.currentTab] || [];
  }

  // 渲染商城界面
  render(ctx) {
    if (!this.isVisible) return;

    // 半透明背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 商城面板
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
    ctx.fillText('商 城', SCREEN_WIDTH / 2, panelY + 35);

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

    // 标签页
    const tabY = panelY + 55;
    const tabHeight = 40;
    const tabWidth = (panelWidth - 20) / this.tabs.length;
    
    this.tabs.forEach((tab, index) => {
      const tabX = panelX + 10 + index * tabWidth;
      const isActive = this.currentTab === tab.key;
      
      // 标签背景
      ctx.fillStyle = isActive ? 'rgba(100, 100, 150, 0.8)' : 'rgba(60, 60, 70, 0.6)';
      this.roundRect(ctx, tabX, tabY, tabWidth - 5, tabHeight, 8);
      ctx.fill();
      
      // 标签文字
      ctx.fillStyle = isActive ? '#ffffff' : '#aaaaaa';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${tab.icon} ${tab.name}`, tabX + tabWidth / 2 - 2, tabY + 26);
    });

    // 商品列表区域
    const listY = tabY + tabHeight + 15;
    const listHeight = panelHeight - tabHeight - 80;

    // 属性页面特殊渲染
    if (this.currentTab === SHOP_TABS.ATTRIBUTES) {
      this.renderAttributes(ctx, panelX, listY, panelWidth, listHeight);
      return;
    }

    const items = this.getCurrentItems();
    const itemHeight = 70;
    const itemPadding = 10;

    // 创建裁剪区域
    ctx.save();
    ctx.beginPath();
    ctx.rect(panelX + 10, listY, panelWidth - 20, listHeight);
    ctx.clip();

    items.forEach((item, index) => {
      const itemY = listY + index * (itemHeight + itemPadding) - this.scrollOffset;
      
      // 跳过不可见区域
      if (itemY + itemHeight < listY || itemY > listY + listHeight) return;

      const itemX = panelX + 15;
      const itemWidth = panelWidth - 30;
      const isPurchased = this.isPurchased(item.id);
      const isSelected = this.selectedItem === item.id;

      // 商品背景
      ctx.fillStyle = isSelected ? 'rgba(80, 80, 100, 0.9)' : 'rgba(50, 50, 60, 0.8)';
      this.roundRect(ctx, itemX, itemY, itemWidth, itemHeight, 8);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        this.roundRect(ctx, itemX, itemY, itemWidth, itemHeight, 8);
        ctx.stroke();
      }

      // 预览色块
      ctx.fillStyle = item.preview;
      this.roundRect(ctx, itemX + 10, itemY + 10, 50, 50, 6);
      ctx.fill();

      // 商品名称
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(item.name, itemX + 70, itemY + 30);

      // 价格或状态
      if (isPurchased) {
        ctx.fillStyle = '#4CAF50';
        ctx.font = '14px Arial';
        ctx.fillText('已拥有', itemX + 70, itemY + 52);
      } else {
        ctx.fillStyle = '#FFD700';
        ctx.font = '14px Arial';
        ctx.fillText(`${item.price} 金币`, itemX + 70, itemY + 52);
      }

      // 购买/已拥有按钮
      const btnX = itemX + itemWidth - 70;
      const btnY = itemY + 20;
      const btnWidth = 60;
      const btnHeight = 30;

      if (isPurchased) {
        ctx.fillStyle = 'rgba(76, 175, 80, 0.6)';
      } else {
        ctx.fillStyle = isSelected ? '#4CAF50' : 'rgba(100, 100, 150, 0.8)';
      }
      this.roundRect(ctx, btnX, btnY, btnWidth, btnHeight, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(isPurchased ? '已购买' : '购买', btnX + btnWidth / 2, btnY + 20);
    });

    ctx.restore();

    // 购买提示
    if (this.selectedItem) {
      const selectedItemData = items.find(i => i.id === this.selectedItem);
      if (selectedItemData && !this.isPurchased(selectedItemData.id)) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('点击"购买"按钮确认购买', SCREEN_WIDTH / 2, panelY + panelHeight - 20);
      }
    }
  }

  // 渲染属性页面
  renderAttributes(ctx, panelX, listY, panelWidth, listHeight) {
    const attrHeight = 65;
    const attrPadding = 8;
    const attrX = panelX + 15;
    const attrWidth = panelWidth - 30;

    PLAYER_ATTRIBUTES.forEach((attr, index) => {
      const attrY = listY + index * (attrHeight + attrPadding);
      if (attrY + attrHeight > listY + listHeight) return;

      const level = this.attributeLevels[attr.id] || 0;
      const currentValue = this.getAttributeValue(attr.id);
      const upgradePrice = this.getUpgradePrice(attr.id);
      const isMaxLevel = level >= 20;

      // 属性背景
      ctx.fillStyle = 'rgba(50, 50, 60, 0.8)';
      this.roundRect(ctx, attrX, attrY, attrWidth, attrHeight, 8);
      ctx.fill();

      // 图标和名称
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${attr.icon} ${attr.name}`, attrX + 10, attrY + 22);

      // 等级显示
      ctx.fillStyle = '#4CAF50';
      ctx.font = '14px Arial';
      ctx.fillText(`Lv.${level}/20`, attrX + 10, attrY + 42);

      // 当前值
      ctx.fillStyle = '#FFD700';
      ctx.font = '14px Arial';
      const valueText = attr.id === 'moveSpeed' || attr.id === 'luck'
        ? currentValue.toFixed(2)
        : Math.floor(currentValue);
      ctx.fillText(`当前: ${valueText}${attr.unit}`, attrX + 80, attrY + 42);

      // 升级按钮
      const btnX = attrX + attrWidth - 90;
      const btnY = attrY + 15;
      const btnWidth = 80;
      const btnHeight = 35;

      if (isMaxLevel) {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
        this.roundRect(ctx, btnX, btnY, btnWidth, btnHeight, 6);
        ctx.fill();
        ctx.fillStyle = '#888888';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('已满级', btnX + btnWidth / 2, btnY + 22);
      } else {
        ctx.fillStyle = '#4CAF50';
        this.roundRect(ctx, btnX, btnY, btnWidth, btnHeight, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${upgradePrice}金币升级`, btnX + btnWidth / 2, btnY + 22);
      }
    });
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
    if (Math.sqrt((x - closeBtnX) ** 2 + (y - closeBtnY - 10) ** 2) < 15) {
      this.hide();
      return true;
    }

    // 标签页切换
    const tabY = panelY + 55;
    const tabHeight = 40;
    const tabWidth = (panelWidth - 20) / this.tabs.length;

    if (y >= tabY && y <= tabY + tabHeight) {
      this.tabs.forEach((tab, index) => {
        const tabX = panelX + 10 + index * tabWidth;
        if (x >= tabX && x <= tabX + tabWidth - 5) {
          this.switchTab(tab.key);
        }
      });
      return true;
    }

    // 列表区域
    const listY = tabY + tabHeight + 15;
    const listHeight = panelHeight - tabHeight - 80;

    // 属性页面触摸处理
    if (this.currentTab === SHOP_TABS.ATTRIBUTES) {
      const attrHeight = 65;
      const attrPadding = 8;
      const attrX = panelX + 15;
      const attrWidth = panelWidth - 30;

      PLAYER_ATTRIBUTES.forEach((attr, index) => {
        const attrY = listY + index * (attrHeight + attrPadding);
        const level = this.attributeLevels[attr.id] || 0;
        const isMaxLevel = level >= 20;

        if (!isMaxLevel) {
          const btnX = attrX + attrWidth - 90;
          const btnY = attrY + 15;
          const btnWidth = 80;
          const btnHeight = 35;

          if (x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight) {
            const result = this.upgradeAttribute(attr.id);
            if (result.success) {
              wx.showToast({ title: result.message, icon: 'success' });
            } else {
              wx.showToast({ title: result.message, icon: 'none' });
            }
          }
        }
      });
      return true;
    }

    // 商品列表
    const items = this.getCurrentItems();
    const itemHeight = 70;
    const itemPadding = 10;

    items.forEach((item, index) => {
      const itemY = listY + index * (itemHeight + itemPadding) - this.scrollOffset;
      const itemX = panelX + 15;
      const itemWidth = panelWidth - 30;

      if (y >= itemY && y <= itemY + itemHeight && x >= itemX && x <= itemX + itemWidth) {
        // 选中商品
        this.selectedItem = item.id;

        // 检查是否点击购买按钮
        const btnX = itemX + itemWidth - 70;
        const btnY = itemY + 20;
        const btnWidth = 60;
        const btnHeight = 30;

        if (x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight) {
          if (!this.isPurchased(item.id)) {
            const result = this.purchaseItem(item.id);
            if (result.success) {
              wx.showToast({ title: result.message, icon: 'success' });
            } else {
              wx.showToast({ title: result.message, icon: 'none' });
            }
          }
        }
      }
    });

    return true;
  }
}

export default ShopSystem;
