import Animation from '../base/animation';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';
import WeaponSystem from './weaponSystem';

const PLAYER_WIDTH = 21; // 降低30%（原为30）
const PLAYER_HEIGHT = 21; // 降低30%（原为30）

export default class Player extends Animation {
  constructor() {
    super(null, PLAYER_WIDTH, PLAYER_HEIGHT);
    this.color = '#4CAF50'; // 绿色
    this.weaponSystem = new WeaponSystem(this);
    this.init();
    this.initStats();
    this.initEvent();
  }

  init() {
    // 玩家在屏幕中心初始化（地图会跟随玩家移动）
    this.x = SCREEN_WIDTH / 2 - this.width / 2;
    this.y = SCREEN_HEIGHT / 2 - this.height / 2;
    this.touched = false;
    this.isActive = true;
    this.visible = true;
  }

  initStats() {
    // === 角色基础属性 ===
    this.stats = {
      // 生存属性
      maxHealth: 100,        // 最大生命值
      currentHealth: 100,    // 当前生命值
      armor: 0,              // 防御力（减伤）
      
      // 攻击属性
      attack: 10,            // 基础攻击力
      attackSpeed: 1.0,      // 攻击速度倍率（1.0 为基础）
      attackRange: 1.0,      // 攻击范围倍率（1.0 为基础）
      penetration: 0,        // 穿透效果（穿透敌人数）
      bounce: 0,             // 弹射效果（弹射次数）
      
      // 移动属性
      moveSpeed: 3.24,       // 移动速度（降低 10%，原为 3.6）
      magnetRadius: 80,      // 磁力半径
      
      // 成长属性
      luck: 1,               // 幸运值（影响掉落率）
      expToNextLevel: 50,    // 初始升级经验值
      level: 1,              // 角色等级
      totalExp: 0,           // 总经验值
      totalCoins: 0          // 总金币数
    };
    
    this.lastMoveAngle = 0;  // 角色朝向角度（弧度）
    this.isMoving = false;   // 是否正在移动

    // === 新增状态属性 ===
    this.lavaFistReady = false;
    this.lavaFistDamage = 0;
    this.lavaFistRadius = 0;
    this.lavaFistBurnDamage = 0;
    this.lavaFistBurnDuration = 0;

    this.speedBoostDuration = 0;
    this.speedBoostMultiplier = 1;

    // 经验增幅：经验值倍率
    this.expBoost = 0;

    // 金币增幅：金币倍率
    this.goldBoost = 0;

    this.invincibleDuration = 0;
  }

  // 获取移动向量（不改变玩家位置）
  getMoveVector(direction) {
    // 直接使用 direction 向量和移动速度计算移动距离
    const moveSpeed = this.stats.moveSpeed;

    return {
      x: direction.x * moveSpeed,
      y: direction.y * moveSpeed
    };
  }

  initEvent() {
    // 触摸事件由 main.js 统一处理，这里移除重复注册
  }

  // 禁用点触移动，保留方法但不再使用
  handleTouchStart(x, y) {
    // if (GameGlobal.databus.isGameOver) return;
    // this.touched = true;
    // this.setPlayerPosition(x, y);
  }

  handleTouchMove(x, y) {
    // if (GameGlobal.databus.isGameOver || !this.touched) return;
    // this.setPlayerPosition(x, y);
  }

  handleTouchEnd() {
    // this.touched = false;
  }

  // 点触移动方法已禁用，仅保留虚拟方向盘移动
  setPlayerPosition(targetX, targetY) {
    // 计算移动方向角度
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const dx = targetX - centerX;
    const dy = targetY - centerY;
    
    // 计算距离，判断是否在移动
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.isMoving = distance > 2; // 移动阈值
    
    if (this.isMoving) {
      this.lastMoveAngle = Math.atan2(dy, dx);
    }
    
    // 直接移动到触摸位置，不再使用移动速度限制，实现实时拖拽
    const newX = targetX - this.width / 2;
    const newY = targetY - this.height / 2;

    // 检查障碍物碰撞（使用无限地图系统）
    if (GameGlobal.databus.infiniteMap) {
      // 计算世界坐标
      const worldX = newX;
      const worldY = newY;
      const isColliding = GameGlobal.databus.infiniteMap.checkCollisionWithObstacles(worldX, worldY, this.width, this.height);

      if (!isColliding) {
        this.x = newX;
        this.y = newY;
      }
    } else {
      this.x = newX;
      this.y = newY;

      // 边界限制（仅在非无限地图模式下）
      this.x = Math.max(0, Math.min(this.x, SCREEN_WIDTH - this.width));
      this.y = Math.max(0, Math.min(this.y, SCREEN_HEIGHT - this.height));
    }
  }

  moveWithJoystick(direction, angle) {
    if (GameGlobal.databus.isGameOver) return;

    // 更新角色朝向
    this.lastMoveAngle = angle;
    this.isMoving = Math.abs(direction.x) > 0.1 || Math.abs(direction.y) > 0.1;

    if (this.isMoving) {
      // 玩家在屏幕坐标系中移动
      const moveSpeed = this.stats.moveSpeed;
      const newX = this.x + direction.x * moveSpeed;
      const newY = this.y + direction.y * moveSpeed;

      if (GameGlobal.databus.infiniteMap) {
        // 检查障碍物碰撞（需要将屏幕坐标转换为地图坐标）
        const map = GameGlobal.databus.infiniteMap;
        const playerMapX = map.playerMapX + direction.x * moveSpeed;
        const playerMapY = map.playerMapY + direction.y * moveSpeed;
        
        const isColliding = map.checkCollisionWithObstacles(playerMapX, playerMapY, this.width, this.height);

        if (!isColliding) {
          // 玩家保持在屏幕中心附近，更新地图坐标
          map.update(direction.x * moveSpeed, direction.y * moveSpeed);
        }
      } else {
        // 无限地图模式下：不更新屏幕坐标，只更新地图坐标
        // 屏幕坐标由地图偏移（offsetX, offsetY）控制
        // 玩家始终保持在屏幕中心
      }
    }
  }

  stopMove() {
    this.isMoving = false;
  }

  addExp(amount) {
    // 应用经验增幅
    const boostedAmount = amount * (1 + this.expBoost);
    this.stats.totalExp += boostedAmount;

    while (this.stats.totalExp >= this.stats.expToNextLevel) {
      // 升级并保留多余经验
      this.levelUp();
    }
  }

  levelUp() {
    // console.log('=== Player.levelUp() called ===');
    // console.log('Current level:', this.stats.level);
    // console.log('Total exp before deduction:', this.stats.totalExp);
    // console.log('Exp to next level:', this.stats.expToNextLevel);

    // 减去当前等级所需经验，保留剩余经验
    this.stats.totalExp -= this.stats.expToNextLevel;
    this.stats.level++;

    // 每次升级经验槽上限提高50%
    this.stats.expToNextLevel = Math.floor(this.stats.expToNextLevel * 1.5);

    this.stats.currentHealth = Math.min(
      this.stats.currentHealth + this.stats.maxHealth * 0.1,
      this.stats.maxHealth
    );

    // console.log(`[玩家升级] 等级：${this.stats.level}, 触发升级回调`);

    if (GameGlobal.databus && typeof GameGlobal.databus.triggerLevelUp === 'function') {
      // console.log('[玩家升级] 调用 triggerLevelUp()');
      GameGlobal.databus.triggerLevelUp();
    } else {
      // console.error('[玩家升级] GameGlobal.databus.triggerLevelUp 不存在或不是函数');
    }
  }

  takeDamage(amount, damageType = 'normal') {
    // 演示模式特殊处理
    if (this.isDemoMode) {
      this.stats.currentHealth -= amount;
      this.flashTime = 5;
      
      if (this.stats.currentHealth <= 0) {
        if (this.onDemoDeath) {
          this.onDemoDeath();
        }
      }
      return;
    }

    // console.log(`[takeDamage] 原始伤害：${amount}, 当前生命：${this.stats.currentHealth}/${this.stats.maxHealth}, 圣盾：${this.holyShield?.active}, 圣盾对象：${this.holyShield ? JSON.stringify(this.holyShield) : '无'}`);

    // 检查圣盾
    if (this.holyShield && this.holyShield.active) {
      // console.log(`[takeDamage] 被圣盾阻挡，免疫伤害！圣盾结束时间: ${this.holyShield.endTime}`);
      return; // 圣盾激活时，免疫所有伤害
    }

    // 坚韧身躯：受到范围伤害-30%
    if (this.toughBody && damageType === 'projectile') {
      amount = Math.floor(amount * 0.7);
    }

    // 计算伤害减免
    let damageReduction = this.stats.armor;
    if (this.damageReduction && this.damageReduction.active) {
      damageReduction += this.damageReduction.damageReduction * amount; // 百分比减伤
    }

    // 检查圣盾技能（受到伤害后触发，在造成伤害前）
    if (this.weaponSystem) {
      const shieldWeapon = this.weaponSystem.weapons.get('holy_shield');
      if (shieldWeapon && shieldWeapon.baseStats.triggerOnDamage) {
        // 检查冷却
        if (!this.shieldCooldown || Date.now() > this.shieldCooldown) {
          // 触发圣盾
          this.weaponSystem.holyShieldAttack(shieldWeapon);
          // 设置冷却时间（50秒 = 3000帧，转换为毫秒）
          this.shieldCooldown = Date.now() + shieldWeapon.baseStats.cooldown * 16.67;
          // console.log(`[takeDamage] 触发圣盾技能`);
        }
      }
    }

    // 圣盾触发后，检查无敌效果（100%减伤）
    if (this.holyShield && this.holyShield.active) {
      damageReduction = amount; // 100%减伤
    }

    const actualDamage = Math.max(1, amount - damageReduction);
    // console.log(`[takeDamage] 实际伤害: ${actualDamage} (减免: ${damageReduction})`);

    this.stats.currentHealth -= actualDamage;
    // console.log(`[takeDamage] 受伤后生命: ${this.stats.currentHealth}/${this.stats.maxHealth}`);

    // 检查传送技能（受到伤害后触发）
    // 演示模式的AI玩家禁用瞬移
    if (this.weaponSystem && !this.isDemoAI) {
      const teleportWeapon = this.weaponSystem.weapons.get('teleport');
      if (teleportWeapon && teleportWeapon.baseStats.triggerOnDamage) {
        // 检查冷却
        if (!this.teleportCooldown || Date.now() > this.teleportCooldown) {
          // 触发传送
          this.weaponSystem.teleportAttack(teleportWeapon);
          // 设置冷却时间（50秒 = 3000帧，转换为毫秒）
          this.teleportCooldown = Date.now() + teleportWeapon.baseStats.cooldown * 16.67;
          // console.log(`[takeDamage] 触发传送技能`);
        }
      }
    }

    if (this.stats.currentHealth <= 0) {
      this.die();
    }
  }

  heal(amount) {
    this.stats.currentHealth = Math.min(
      this.stats.currentHealth + amount,
      this.stats.maxHealth
    );
  }

  increaseMaxHealth(amount) {
    this.stats.maxHealth += amount;
    this.stats.currentHealth += amount;
  }

  boostStat(stat, value) {
    if (this.stats[stat] !== undefined) {
      // 对于 moveSpeed 和 magnetRadius 使用乘法累积
      if (stat === 'moveSpeed' || stat === 'magnetRadius') {
        this.stats[stat] *= (1 + value);
      } else {
        // 其他属性使用加法累积
        this.stats[stat] += value;
      }
    }
  }

  // 应用圣盾效果
  applyShield(duration, damageReduction) {
    if (!this.holyShield) {
      this.holyShield = {
        active: true,
        endTime: Date.now() + duration * 16.67, // 将帧数转换为毫秒
        damageReduction: damageReduction
      };
    }
  }

  // 应用加速效果
  applySpeedBoost(duration, speedMultiplier) {
    // 如果已有激活的加速效果，先恢复原速度
    if (this.speedBoost && this.speedBoost.active) {
      this.stats.moveSpeed = this.speedBoost.originalSpeed;
    }

    // 应用新的加速效果
    this.speedBoost = {
      active: true,
      endTime: Date.now() + duration * 16.67,
      originalSpeed: this.stats.moveSpeed,
      speedMultiplier: speedMultiplier
    };
    this.stats.moveSpeed *= speedMultiplier;
  }

  // 应用伤害提升效果
  applyDamageBoost(duration, damageMultiplier) {
    // 如果已有激活的伤害提升效果，先恢复原伤害
    if (this.damageBoost && this.damageBoost.active) {
      this.weaponSystem.damageMultiplier /= this.damageBoost.damageMultiplier;
    }

    // 应用新的伤害提升效果
    this.damageBoost = {
      active: true,
      endTime: Date.now() + duration * 16.67,
      damageMultiplier: damageMultiplier
    };
    this.weaponSystem.damageMultiplier *= damageMultiplier;
  }

  // 应用减伤效果
  applyDamageReduction(damageReduction, duration) {
    // 如果已有激活的伤害减免效果，先清除
    if (this.damageReduction && this.damageReduction.active) {
      this.damageReduction.active = false;
    }

    this.damageReduction = {
      active: true,
      damageReduction: damageReduction,
      endTime: Date.now() + duration * 16.67 // 将帧数转换为毫秒
    };
  }

  // 更新状态效果
  updateStatusEffects() {
    const currentTime = Date.now();

    // 更新圣盾
    if (this.holyShield && this.holyShield.active && currentTime >= this.holyShield.endTime) {
      this.holyShield.active = false;
      this.holyShield = null;
    }

    // 更新加速
    if (this.speedBoost && this.speedBoost.active && currentTime >= this.speedBoost.endTime) {
      this.stats.moveSpeed = this.speedBoost.originalSpeed;
      this.speedBoost.active = false;
      this.speedBoost = null;
    }

    // 更新伤害提升
    if (this.damageBoost && this.damageBoost.active && currentTime >= this.damageBoost.endTime) {
      this.weaponSystem.damageMultiplier /= this.damageBoost.damageMultiplier;
      this.damageBoost.active = false;
      this.damageBoost = null;
    }

    // 更新伤害减免（守护光环）
    if (this.damageReduction && this.damageReduction.active && currentTime >= this.damageReduction.endTime) {
      this.damageReduction.active = false;
      this.damageReduction = null;
    }
  }

  die() {
    this.isActive = false;
    GameGlobal.databus.gameOver();
  }

  update() {
    if (GameGlobal.databus.isGameOver) return;

    this.updateStatusEffects();
    this.autoCollectExp();

    // 更新金币系统
    if (GameGlobal.databus.coinSystem) {
      GameGlobal.databus.coinSystem.update(this, this.stats.magnetRadius);
      // 同步金币到玩家属性
      this.stats.totalCoins = GameGlobal.databus.coinSystem.totalCoins;
    }

    // 更新道具系统
    if (GameGlobal.databus.itemSystem) {
      GameGlobal.databus.itemSystem.update(this, this.stats.magnetRadius);
    }

    this.weaponSystem.update(GameGlobal.databus.enemies);
  }

  autoCollectExp() {
    const expBalls = GameGlobal.databus.expBalls || [];

    // 获取玩家在地图上的位置（始终使用地图坐标）
    let playerMapX = this.x + this.width / 2;
    let playerMapY = this.y + this.height / 2;

    // 如果有无限地图系统,使用地图坐标（玩家在世界中的位置）
    if (GameGlobal.databus.infiniteMap) {
      const map = GameGlobal.databus.infiniteMap;
      playerMapX = map.playerMapX + this.width / 2;
      playerMapY = map.playerMapY + this.height / 2;
    }

    for (let i = expBalls.length - 1; i >= 0; i--) {
      const ball = expBalls[i];
      if (!ball.active) continue;

      // 经验球使用世界坐标存储，直接计算距离
      const dist = Math.sqrt(
        (playerMapX - ball.x) ** 2 + (playerMapY - ball.y) ** 2
      );

      if (dist <= this.stats.magnetRadius) {
        // 磁力吸附：更新经验球的世界坐标
        ball.x += (playerMapX - ball.x) * 0.15;
        ball.y += (playerMapY - ball.y) * 0.15;

        // 重新计算距离
        const newDist = Math.sqrt(
          (playerMapX - ball.x) ** 2 + (playerMapY - ball.y) ** 2
        );

        if (newDist < 20) {
          this.addExp(ball.exp);
          ball.active = false;
          expBalls.splice(i, 1);
        }
      }
    }
  }

  render(ctx) {
    if (!this.visible) return;

    // 调试用：每60帧打印一次玩家渲染信息（已注释）
    // if (GameGlobal.databus.frame % 60 === 0) {
    //   console.log(`[玩家渲染] 位置: (${this.x.toFixed(0)}, ${this.y.toFixed(0)}), 武器数量: ${this.weaponSystem.weapons.size}`);
    // }

    ctx.save();

    // 玩家在屏幕中心渲染（使用屏幕坐标）
    const screenX = this.x;
    const screenY = this.y;

    // 移动到角色中心点
    const centerX = screenX + this.width / 2;
    const centerY = screenY + this.height / 2;
    ctx.translate(centerX, centerY);

    // 根据移动方向旋转角色
    ctx.rotate(this.lastMoveAngle);

    // 绘制角色主体（相对于中心点）
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // 绘制边框
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // 绘制眼睛（在旋转后的坐标系中，眼睛表示前方）
    ctx.fillStyle = '#ffffff';
    const eyeSize = 3;
    const eyeOffsetX = 6;
    const eyeOffsetY = 0; // 眼睛在中心位置
    ctx.beginPath();
    ctx.arc(-eyeOffsetX, eyeOffsetY - eyeSize/2, eyeSize, 0, Math.PI * 2);
    ctx.arc(eyeOffsetX, eyeOffsetY - eyeSize/2, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // 绘制方向指示器（角色前方的小箭头）
    if (this.isMoving) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.moveTo(0, -this.height / 2 - 5);
      ctx.lineTo(-3, -this.height / 2 - 10);
      ctx.lineTo(3, -this.height / 2 - 10);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // 渲染范围技能（使用屏幕坐标，不受地图偏移影响）
    this.weaponSystem.renderRangeSkills(ctx, screenX, screenY);

    // 渲染血条和经验条（使用屏幕坐标）
    this.renderHealthBar(ctx, screenX, screenY);
    this.renderExpBar(ctx, screenX, screenY);
  }

  renderHealthBar(ctx, screenX, screenY) {
    const barWidth = 40;
    const barHeight = 5;
    const x = screenX - 10; // 血条在角色中间居中（角色宽度21，血条宽度40，偏移(40-21)/2=9.5，取-10）
    const y = screenY - 15; // 向上移动5像素（从-10改为-15）

    const healthPercent = this.stats.currentHealth / this.stats.maxHealth;

    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' :
                    healthPercent > 0.25 ? '#FFC107' : '#F44336';
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }

  renderExpBar(ctx, screenX, screenY) {
    const barWidth = 40;
    const barHeight = 4;
    const x = screenX - 10; // 经验条在角色中间居中
    const y = screenY - 9; // 向上移动 5 像素（从 -4 改为 -9）

    const expPercent = this.stats.totalExp / this.stats.expToNextLevel;

    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = '#2196F3';
    ctx.fillRect(x, y, barWidth * Math.min(expPercent, 1), barHeight);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }

  // 应用被动技能
  applyPassive(passiveId) {
    switch (passiveId) {
      case 'move_speed':
        this.boostStat('moveSpeed', 0.15);
        break;
      case 'health_boost':
        this.increaseMaxHealth(20);
        break;
      case 'armor_boost':
        this.boostStat('armor', 2);
        break;
      case 'magnet_boost':
        this.boostStat('magnetRadius', 0.2);
        break;
      case 'exp_boost':
        this.expBoost = (this.expBoost || 0) + 0.1;
        break;
      case 'gold_boost':
        this.goldBoost = (this.goldBoost || 0) + 0.1;
        break;
      case 'precision_strike':
        this.weaponSystem.precisionBoost = (this.weaponSystem.precisionBoost || 0) + 0.2;
        this.weaponSystem.critChanceBoost = (this.weaponSystem.critChanceBoost || 0) + 0.1;
        break;
      case 'quick_reload':
        this.weaponSystem.quickReloadBoost = true;
        break;
      case 'element_affinity':
        this.weaponSystem.elementDamageBoost = (this.weaponSystem.elementDamageBoost || 0) + 0.25;
        this.weaponSystem.boostDuration(60);
        break;
      case 'tough_body':
        this.toughBody = true;
        break;
      case 'trap_master':
        this.weaponSystem.trapMasterBonus = (this.weaponSystem.trapMasterBonus || 0) + 2;
        this.weaponSystem.trapDamageBonus = (this.weaponSystem.trapDamageBonus || 0) + 0.4;
        break;
      case 'energy_siphon':
        this.energySiphon = true;
        break;
      case 'desperate_strike':
        this.desperateStrike = true;
        break;
      case 'projectile_count':
        this.weaponSystem.boostProjectileCount(1);
        break;
      case 'extra_salvo':
        this.weaponSystem.boostExtraSalvo(1);
        break;
      case 'cooldown_reduction':
        this.weaponSystem.boostCooldownReduction(0.1);
        break;
      case 'duration_boost':
        this.weaponSystem.boostDuration(0.15);
        break;
      case 'penetration_boost':
        this.weaponSystem.boostPenetration(1);
        break;
      case 'bounce_boost':
        this.weaponSystem.boostBounce(1);
        break;
      case 'super_cooling':
        this.weaponSystem.boostCooldownReduction(0.15);
        break;
      case 'mana_regen':
        this.weaponSystem.boostCooldownReduction(1.0);
        break;
    }
  }

  // 添加武器（支持指定等级）
  addWeapon(type, level = 1) {
    // 临时移除武器数量限制（用于测试角色）
    const originalMaxWeapons = 6;
    const currentWeapons = this.weaponSystem.weapons.size;

    if (currentWeapons < originalMaxWeapons || level > 1) {
      this.weaponSystem.addWeapon(type, level);
    } else {
      // 如果已达到上限但指定了更高等级，强制替换
      const firstWeapon = this.weaponSystem.weapons.keys().next().value;
      if (firstWeapon) {
        this.weaponSystem.weapons.delete(firstWeapon);
      }
      this.weaponSystem.addWeapon(type, level);
    }
  }

  // 演示模式死亡复活
  onDemoDeath() {
    setTimeout(() => {
      this.stats.currentHealth = this.stats.maxHealth;
      
      const map = GameGlobal.databus.infiniteMap;
      if (map) {
        this.x = map.mapWidth / 2;
        this.y = map.mapHeight / 2;
        map.playerMapX = this.x;
        map.playerMapY = this.y;
        map.offsetX = SCREEN_WIDTH / 2 - this.x - this.width / 2;
        map.offsetY = SCREEN_HEIGHT / 2 - this.y - this.height / 2;
        
        // 清除周围敌人
        GameGlobal.databus.enemies.forEach(enemy => {
          const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (dist < 200) {
            enemy.isActive = false;
          }
        });
      }
    }, 500);
  }

  // 设置演示模式
  setDemoMode(active) {
    this.isDemoMode = active;
    if (active) {
      this.stats.level = 10;
    }
  }

  reset() {
    // console.log(`[玩家重置] 开始重置玩家，清除圣盾和冷却`);

    // 清除所有状态效果
    this.holyShield = null;
    this.shieldCooldown = null;
    this.teleportCooldown = null;
    this.damageReduction = null;
    this.speedBoost = null;
    this.damageBoost = null;
    this.expBoost = 0; // 重置经验增幅
    this.goldBoost = 0; // 重置金币增幅

    this.init();
    this.initStats();
    this.weaponSystem.reset();
    // 重新添加初始武器
    this.weaponSystem.addWeapon('magic_orb');

    // console.log(`[玩家重置] 完成重置，当前血量: ${this.stats.currentHealth}/${this.stats.maxHealth}`);
  }
}
