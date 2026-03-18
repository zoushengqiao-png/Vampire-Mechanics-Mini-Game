const OBJECT_TYPES = {
  VASE: 'vase',
  CHEST: 'chest',
  CRYSTAL: 'crystal'
};

const OBJECT_CONFIG = {
  [OBJECT_TYPES.VASE]: {
    width: 30,
    height: 40,
    color: '#8B4513',
    borderColor: '#654321',
    healDropRate: 0.5 // 50%概率掉落回血道具
  },
  [OBJECT_TYPES.CHEST]: {
    width: 35,
    height: 30,
    color: '#FFD700',
    borderColor: '#B8860B',
    healDropRate: 0.5 // 50%概率掉落回血道具
  },
  [OBJECT_TYPES.CRYSTAL]: {
    width: 25,
    height: 35,
    color: '#9370DB',
    borderColor: '#8A2BE2',
    healDropRate: 0.5 // 50%概率掉落回血道具
  }
};

export default class SceneObject {
  constructor() {
    this.width = 30;
    this.height = 30;
    this.x = 0;
    this.y = 0;
    this.type = OBJECT_TYPES.VASE;
    this.isActive = true;
    this.visible = true;
  }

  init(mapWidth = 2000, mapHeight = 2000) {
    const types = Object.values(OBJECT_TYPES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    const config = OBJECT_CONFIG[randomType];

    this.type = randomType;
    this.width = config.width;
    this.height = config.height;
    this.color = config.color;
    this.borderColor = config.borderColor;
    this.healDropRate = config.healDropRate;

    // 随机生成位置，确保在地图范围内且不与边缘重叠
    this.x = Math.random() * (mapWidth - this.width - 40) + 20;
    this.y = Math.random() * (mapHeight - this.height - 40) + 20;

    this.isActive = true;
    this.visible = true;
  }

  // 被攻击后触发
  onAttacked() {
    if (!this.isActive) return;

    this.isActive = false;
    this.visible = false;

    // 概率掉落回血道具
    if (Math.random() < this.healDropRate) {
      this.dropHealItem();
    }
  }

  dropHealItem() {
    if (!GameGlobal.databus.healItems) {
      GameGlobal.databus.healItems = [];
    }

    GameGlobal.databus.healItems.push({
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      healAmount: 0.2, // 20%血量恢复
      active: true,
      size: 8
    });
  }

  render(ctx) {
    if (!this.visible || !this.isActive) return;

    ctx.save();

    // 绘制道具主体
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // 绘制边框
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // 绘制装饰性图案
    ctx.fillStyle = this.borderColor;
    if (this.type === OBJECT_TYPES.VASE) {
      // 绘制花瓶口
      ctx.fillRect(this.x + this.width * 0.2, this.y - 5, this.width * 0.6, 5);
    } else if (this.type === OBJECT_TYPES.CHEST) {
      // 绘制宝箱锁
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === OBJECT_TYPES.CRYSTAL) {
      // 绘制水晶光泽
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(this.x + this.width * 0.3, this.y + this.height * 0.2, 2, this.height * 0.6);
    }

    ctx.restore();
  }

  isCollideWith(sprite) {
    return !(
      this.x > sprite.x + sprite.width ||
      this.x + this.width < sprite.x ||
      this.y > sprite.y + sprite.height ||
      this.y + this.height < sprite.y
    );
  }

  remove() {
    this.isActive = false;
    this.visible = false;
  }
}