import DataBus from '../databus';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

const WEAPON_TYPES = {
  // === Common Skills ===
  MAGIC_ORB: 'magic_orb', // Magic Orb: Auto-lock nearest enemy
  SPEED_BOOST: 'speed_boost', // Speed Boost: Increase movement speed
  DAMAGE_BOOST: 'damage_boost', // Damage Boost: Increase all damage
  AXE: 'axe', // Axe: Parabolic flight, pierce 2 enemies
  TRAP: 'trap', // Trap: Place traps, enemies trigger
  HEALING_AURA: 'healing_aura', // Healing Aura: Continuous health regeneration
  WHIRLWIND: 'whirlwind', // Whirlwind: Rotating blades, continuous damage
  ARMOR_PIERCE_SHOT: 'armor_pierce_shot', // Armor Pierce Shot: 3 piercing shots with armor break
  MOLOTOV: 'molotov', // Molotov: Throw fire bottle, create fire field
  SOUND_SHOCK: 'sound_shock', // Sound Shock: Ring-shaped shockwave with knockback
  POISON_FOG: 'poison_fog', // Poison Fog: Spray poison fog at enemy
  ROCK_BLAST: 'rock_blast', // Rock Blast: Random falling rocks
  VAMPIRE_DART: 'vampire_dart', // Vampire Dart: Life-stealing darts
  
  // === Rare Skills ===
  HOLY_DOMAIN: 'holy_domain', // Holy Domain: High frequency area damage
  LIGHTNING: 'lightning', // Lightning Chain: Auto chain multiple enemies
  FIRE_BALL: 'fire_ball', // Fire Ball: Linear flight, explode on hit
  POISON_CLOUD: 'poison_cloud', // Poison Cloud: Random release, continuous poison
  THUNDER_ORB: 'thunder_orb', // Thunder Orb: Electric orb with chain lightning
  FROST_BARRAGE: 'frost_barrage', // Frost Barrage: Random ice missiles with freeze
  SUICIDE_DRONE: 'suicide_drone', // Suicide Drone: Tracking explosive drone
  MANA_REGEN: 'mana_regen', // Mana Regen: Cooldown reduction aura

  // === Epic Skills ===
  ICE_STORM: 'ice_storm', // Ice Storm: Slow + damage
  HOLY_SHIELD: 'holy_shield', // Holy Shield: Temporary invincibility
  PROTECTION_AURA: 'protection_aura', // Protection Aura: Damage reduction
  TIME_SLOW: 'time_slow', // Time Slow: Large area enemy slow
  GRAVITY_WHIRL: 'gravity_whirl', // Gravity Whirl: Pull enemies to center
  BOUNCE_BLADE: 'bounce_blade', // Bounce Blade: Bouncing magic blade
  TIME_STASIS: 'time_stasis', // Time Stasis: Strong slow + self speed boost
  
  // === Legendary Skills ===
  TELEPORT: 'teleport', // Teleport: Random teleport after taking damage
  BLINK_SLASH: 'blink_slash', // Blink Slash: Teleport behind enemy, execute low HP
  LAVA_FIST: 'lava_fist' // Lava Fist: Next attack becomes area punch
};

// 投射物行为标志枚举（参考 eBulletFlags）
const ProjectileFlags = {
  NONE: 0,
  FROM_POS: 1,        // 从位置发射
  MISSILE: 2,        // 导弹追踪
  CHAIN: 4,          // 连锁闪电
  GRENADE: 8,        // 抛物线/手榴弹
  OWNER_POS: 16,     // 从所有者位置
  DIR_UPDATE: 32,    // 方向更新
  END_SKILL: 64,     // 结束时触发技能
  HP_BOMB: 128,      // HP 低时爆炸
  UPDATE_TARGET: 256, // 更新目标
  IGNORE_FROM: 512,   // 忽略来源
  RANDOM_DIR: 1024,   // 随机方向
  SKILL_POS: 2048,    // 技能位置
  RANDOM_SPREAD: 4096, // 随机散布
  TARGET_POS_DIR: 8192 // 朝目标位置方向
};

// 武器运行时状态标志（参考 ActorData_Weapon）
const WeaponStateFlags = {
  NONE: 0,
  IS_ROTATING: 1,      // 是否旋转
  IS_LANDING: 2,       // 是否着陆
  IS_CHARGING: 4,      // 是否充能
  IS_COOLDOWN: 8,      // 是否冷却中
  HAS_TARGET: 16,      // 是否有目标
  IS_ACTIVE: 32        // 是否激活状态
};

// 状态效果类型枚举（新增）
const StatusEffectType = {
  NONE: 0,
  SLOW: 1,             // 减速
  FROZEN: 2,           // 冻结
  POISON: 4,           // 中毒
  BURN: 8,             // 燃烧
  ARMOR_BREAK: 16,     // 破甲
  STUN: 32,            // 眩晕
  INVINCIBLE: 64,      // 无敌
  SPEED_UP: 128,       // 加速
  DAMAGE_UP: 256,      // 伤害提升
  HEAL: 512,           // 治疗
  SHIELD: 1024         // 护盾
};

// 技能效果类型枚举（新增）
const SkillEffectType = {
  NONE: 0,
  DAMAGE: 1,           // 伤害效果
  HEAL: 2,             // 治疗效果
  BUFF: 4,             // 增益效果
  DEBUFF: 8,           // 减益效果
  TELEPORT: 16,        // 传送效果
  SUMMON: 32,          // 召唤效果
  SHIELD: 64,          // 护盾效果
  TRAP: 128,           // 陷阱效果
  FIELD: 256,          // 领域效果
  CHAIN: 512,          // 连锁效果
  EXPLOSION: 1024,     // 爆炸效果
  DOT: 2048,           // 持续伤害
  HOMING: 4096,        // 追踪效果
  BOUNCE: 8192,        // 弹射效果
  PIERCE: 16384,       // 穿透效果
  AREA: 32768          // 范围效果
};

// 武器基础配置数据类（参考 WeaponData.cs）
class WeaponConfig {
  constructor(type) {
    this.type = type;
    this.id = type;
    this.damage = 0;           // 基础伤害
    this.attackSpeed = 60;     // 攻击速度（帧数）
    this.projectileSpeed = 5;  // 投射物速度
    this.projectileCount = 1;  // 投射物数量
    this.pierce = 0;           // 穿透数
    this.bounce = 0;           // 弹射次数
    this.range = 200;          // 射程/范围
    this.radius = 0;           // 半径（范围技能）
    this.duration = 0;         // 持续时间
    this.cooldown = 0;         // 冷却时间
    this.damageMultiplier = 1; // 伤害倍率
    this.hasWeight = false;    // 是否有重力
    this.canBounce = false;    // 是否可以弹射
    this.hasTarget = false;    // 是否有目标锁定
    this.isAreaEffect = false; // 是否范围效果
    this.flags = WeaponStateFlags.NONE; // 状态标志
  }
  
  // 从配置表初始化属性（类似 WeaponData.InitAttrs）
  initFromStats(stats) {
    Object.assign(this, stats);
    return this;
  }
  
  // 获取运行时状态（类似 ActorData_Weapon 的属性）
  getRuntimeState() {
    return {
      isRotating: !!(this.flags & WeaponStateFlags.IS_ROTATING),
      isLanding: !!(this.flags & WeaponStateFlags.IS_LANDING),
      isCharging: !!(this.flags & WeaponStateFlags.IS_CHARGING),
      isCooldown: !!(this.flags & WeaponStateFlags.IS_COOLDOWN),
      hasTarget: !!(this.flags & WeaponStateFlags.HAS_TARGET),
      isActive: !!(this.flags & WeaponStateFlags.IS_ACTIVE)
    };
  }
  
  // 设置运行时状态
  setRuntimeState(state, value) {
    const flagMap = {
      'isRotating': WeaponStateFlags.IS_ROTATING,
      'isLanding': WeaponStateFlags.IS_LANDING,
      'isCharging': WeaponStateFlags.IS_CHARGING,
      'isCooldown': WeaponStateFlags.IS_COOLDOWN,
      'hasTarget': WeaponStateFlags.HAS_TARGET,
      'isActive': WeaponStateFlags.IS_ACTIVE
    };
    
    const flag = flagMap[state];
    if (flag) {
      if (value) {
        this.flags |= flag;
      } else {
        this.flags &= ~flag;
      }
    }
  }
}

export default class WeaponSystem {
  constructor(player) {
    this.player = player;
    this.weapons = new Map();
    this.projectiles = [];
    this.damageMultiplier = 1;
    this.attackSpeedMultiplier = 1;
    this.attackRangeMultiplier = 0;  // 攻击范围倍率，初始为 0
    this.skillAreaMultiplier = 0;    // 技能范围倍率，初始为 0
    this.projectileCountMultiplier = 0;  // 初始为 0，只在选择"多重射击"后增加
    this.extraSalvoMultiplier = 0;  // 初始为 0，只在选择"额外弹道"后增加
    this.cooldownReductionMultiplier = 1;  // 冷却缩减倍率，初始为 1（无缩减）
    this.durationMultiplier = 0;  // 持续时间倍率，初始为 0
    this.penetrationMultiplier = 0;  // 初始为 0，只在选择"穿透增强"后增加
    this.bounceMultiplier = 0;  // 初始为 0，只在选择"弹射增强"后增加
    this.elementDamageBoost = 0;  // 元素伤害加成，初始为 0
    
    // 新增：状态效果管理
    this.activeStatusEffects = new Map(); // 激活的状态效果
    this.critChance = 0;  // 暴击率
    this.critDamage = 2.0;  // 暴击伤害倍率
    
    // 投射物配置缓存（类似 JBulletData 配置）
    this.projectileConfigs = new Map();
  }

  addWeapon(type, level = 1) {
    if (this.weapons.has(type)) {
      const weapon = this.weapons.get(type);
      weapon.level = Math.min(weapon.level + 1, 8);
      weapon.updateStats();
    } else {
      const weapon = this.createWeapon(type, level);
      if (weapon && this.weapons.size < 6) {
        this.weapons.set(type, weapon);
      } else if (this.weapons.size >= 6) {
        console.warn(`[武器添加] 武器数量已达上限（6 个），无法添加：${type}`);
      } else {
        console.error(`[武器添加] 创建武器失败：${type}`);
      }
    }
  }

  createWeapon(type, level) {
    const baseStats = {
      [WEAPON_TYPES.MAGIC_ORB]: {
        damage: 5.60625, // 基础伤害
        attackSpeed: 78, // 1.3秒冷却（78帧）
        projectileSpeed: 8,
        projectileCount: 1, // 基础1发子弹
        pierce: 0,  // 初始无穿透，通过"穿透增强"被动技能获得
        range: 300, // 魔法球射程：300像素（约10米）
        canBounce: true  // 可以弹射
      },
      [WEAPON_TYPES.WHIRLWIND]: {
        damage: 4.3125, // 基础伤害
        attackSpeed: 156, // 2.6秒冷却
        radius: 80,
        duration: 120,
        range: 80 // 旋风范围：80像素
      },
      [WEAPON_TYPES.HOLY_DOMAIN]: {
        damage: 2.5875, // 基础伤害
        attackSpeed: 156, // 2.6秒冷却
        radius: 100,
        tickCount: 1,
        range: 100 // 神圣领域范围：100像素
      },
      [WEAPON_TYPES.LIGHTNING]: {
        damage: 9.375, // 基础伤害
        attackSpeed: 156, // 2.6秒冷却
        chainCount: 1, // 连锁1次（修正：配置表是1次）
        range: 150 // 闪电射程：150像素（修正：配置表是150）
      },
      [WEAPON_TYPES.AXE]: {
        damage: 12.9375, // 降低25%后提高15%：11.25 * 1.15 = 12.9375
        attackSpeed: 156, // 2.6秒冷却
        projectileSpeed: 6,
        arc: true,
        gravity: 0.3,
        pierce: 0,  // 初始无穿透，通过"穿透增强"被动技能获得
        range: 200 // 回旋斧射程：200像素（抛物线投射，无锁定）
      },
      // === 新增：范围伤害类 ===
      [WEAPON_TYPES.FIRE_BALL]: {
        damage: 11.25, // 基础伤害（降低6点）
        attackSpeed: 117, // 1.95秒冷却（117帧）
        projectileSpeed: 5,
        explosionRadius: 80,
        range: 250, // 火球射程：250像素
        pierce: 0,  // 初始无穿透，通过"穿透增强"被动技能获得
        hasTarget: true // 半追踪标记
      },
      [WEAPON_TYPES.ICE_STORM]: {
        damage: 6.9, // 基础伤害
        attackSpeed: 390, // 6.5秒冷却（390帧）
        radius: 150,
        slowEffect: 0.5, // 减速50%
        slowDuration: 180, // 减速3秒（180帧）
        range: 150 // 冰风暴范围：150像素
      },
      [WEAPON_TYPES.POISON_CLOUD]: {
        damage: 2.5875, // 基础伤害（实际上不使用这个值）
        attackSpeed: 390, // 6.5秒冷却（390帧）
        radius: 100,
        poisonDamage: 1.725, // 每秒中毒伤害
        poisonDuration: 300, // 中毒5秒（300帧）
        range: 100, // 毒云范围：100像素
        randomSpawn: true, // 地图随机释放
        targetEnemyDirection: true // 优先在敌人方向释放
      },
      // === 新增：状态增益类 ===
      [WEAPON_TYPES.HOLY_SHIELD]: {
        duration: 120, // 护盾持续2秒
        cooldown: 3900, // 冷却65秒
        triggerOnDamage: true, // 受到伤害后触发
        damageReduction: 1.0, // 100%减伤（无敌）
        range: 0 // 自身技能
      },
      [WEAPON_TYPES.SPEED_BOOST]: {
        duration: 360, // 加速持续6秒
        cooldown: 1170, // 冷却19.5秒
        speedMultiplier: 3.0, // 速度提升300%
        range: 0 // 自身技能
      },
      [WEAPON_TYPES.DAMAGE_BOOST]: {
        duration: 240, // 强击持续4秒
        cooldown: 1170, // 冷却19.5秒
        damageMultiplier: 2.0, // 伤害提升200%
        range: 0 // 自身技能
      },
      // === 新增：团队辅助类 ===
      [WEAPON_TYPES.HEALING_AURA]: {
        healAmount: 4.3125, // 降低25%后提高15%：3.75 * 1.15 = 4.3125 每次回血点数
        healInterval: 6, // 每6帧回血一次（每秒10次）
        radius: 120,
        range: 120 // 治疗光环范围：120像素
      },
      [WEAPON_TYPES.PROTECTION_AURA]: {
        damageReduction: 0.2, // Reduce 20% damage (initial value)
        radius: 120,
        range: 120 // Protection Aura range: 120 pixels
      },
      [WEAPON_TYPES.MANA_REGEN]: {
        cooldownReduction: 1.0, // 冷却时间减少 100%（冷却为 0）
        radius: 100,
        range: 100, // 冷却光环范围：100 像素
        duration: 300, // 持续时间 5 秒（300 帧）
        attackSpeed: 60 // 攻击速度：每 60 帧（1 秒）触发一次光环效果
      },
      // === 新增：战术技能类 ===
      [WEAPON_TYPES.TELEPORT]: {
        teleportDistance: 200, // 传送距离200像素
        cooldown: 3900, // 冷却65秒（3900帧）
        triggerOnDamage: true, // 受到伤害后触发
        range: 0 // 自身技能
      },
      [WEAPON_TYPES.TIME_SLOW]: {
        slowMultiplier: 0.2, // 敌人速度降低20%
        duration: 120, // 持续2秒
        radius: 200,
        range: 200 // 时间减速范围：200像素
      },
      [WEAPON_TYPES.TRAP]: {
        damage: 21.5625, // 降低 25% 后提高 15%：18.75 * 1.15 = 21.5625
        attackSpeed: 180, // 3 秒冷却（180 帧）
        trapRadius: 40,
        maxTraps: 2, // 最大 2 个陷阱
        triggerRadius: 30,
        randomSpawn: true, // 地图随机释放
        range: 150, // 陷阱放置范围：150 像素
        hasWeight: false // 陷阱无重量，但也不受弹射影响（因为不移动）
      },
      // === 新增技能：Common ===
      [WEAPON_TYPES.ARMOR_PIERCE_SHOT]: {
        damage: 6.7, // 基础伤害
        attackSpeed: 62, // 1.03秒冷却
        projectileSpeed: 7,
        projectileCount: 2, // 2发霰弹（削减33%）
        pierce: 1, // 穿透1个敌人
        pierceDamageDecay: 0.3, // 穿透后伤害衰减30%
        armorBreakChance: 0.2, // 20%破甲概率
        armorBreakDuration: 120, // 破甲持续2秒
        spreadAngle: Math.PI / 12, // 15度散射
        range: 200,
        hasWeight: true, // 有重量
        canBounce: true  // 可以弹射
      },
      [WEAPON_TYPES.MOLOTOV]: {
        damage: 7.9, // 基础伤害
        attackSpeed: 390, // 6.5 秒冷却
        projectileSpeed: 5,
        fireRadius: 60, // 火海半径
        fireDuration: 240, // 火海持续 4 秒
        fireDamageMultiplier: 0.8, // 每秒 0.8 倍伤害
        range: 250, // 投掷距离
        gravity: 0.15, // 重力加速度
        randomSpawn: true,
        hasWeight: true // 有重量
      },
      [WEAPON_TYPES.SOUND_SHOCK]: {
        damage: 3.8, // 基础伤害
        attackSpeed: 156, // 2.6秒冷却
        radius: 200, // 声波扩散半径
        knockbackDistance: 50, // 击退50像素
        range: 200,
        hasWeight: false // 无重量
      },
      [WEAPON_TYPES.POISON_FOG]: {
        damage: 4.2, // 基础伤害
        attackSpeed: 66, // 1.1秒冷却
        fogRadius: 150, // 毒雾半径
        fogDuration: 120, // 毒雾持续2秒
        poisonDamageMultiplier: 0.5, // 每秒0.5倍伤害
        poisonDuration: 180, // 中毒持续3秒
        range: 150,
        hasWeight: false // 无重量
      },
      [WEAPON_TYPES.ROCK_BLAST]: {
        damage: 7.5, // 基础伤害
        attackSpeed: 546, // 9.1秒冷却
        rockCount: 2, // 2块碎石（削减33%）
        rockRadius: 30, // 碎石半径
        damageMultiplier: 1.8, // 1.8倍伤害
        range: 150, // 砸落范围
        randomSpawn: true,
        hasWeight: false // 无重量
      },
      [WEAPON_TYPES.VAMPIRE_DART]: {
        damage: 10, // 基础伤害（取整）
        attackSpeed: 74, // 1.23 秒冷却
        projectileSpeed: 7,
        projectileCount: 5, // 5 枚飞镖
        damagePerDart: 0.4, // 每枚 40% 伤害
        lifeStealPercent: 0.25, // 吸血 25%
        range: 200,
        hasWeight: false, // 无重量
        canBounce: true  // 可以弹射
      },
      // === 新增技能：Rare ===
      [WEAPON_TYPES.THUNDER_ORB]: {
        damage: 8.4, // 基础伤害
        attackSpeed: 78, // 1.3 秒冷却
        projectileSpeed: 6, // 降低速度以便观察
        lightningRadius: 80, // 雷电范围
        chainCount: 1, // 连锁 1 次
        chainDamageMultiplier: 0.5, // 连锁伤害 50%
        chainRange: 100, // 连锁范围
        range: 500, // 增加射程
        hasWeight: false // 无重量
      },
      [WEAPON_TYPES.FROST_BARRAGE]: {
        damage: 4.5, // 基础伤害
        attackSpeed: 140, // 2.33秒冷却
        projectileSpeed: 6,
        projectileCount: 5, // 5枚冰弹（削减37.5%）
        freezeDuration: 60, // 冻结1秒
        freezeDamageBonus: 0.2, // 冻结期间受伤+20%
        range: 400,
        hasWeight: false, // 无重量
        canBounce: true  // 可以弹射
      },
      [WEAPON_TYPES.SUICIDE_DRONE]: {
        damage: 11.5, // 基础伤害
        attackSpeed: 663, // 11.05秒冷却
        projectileSpeed: 5,
        explosionRadius: 90, // 爆炸范围
        explosionDamageMultiplier: 2.0, // 2倍伤害
        attractDuration: 120, // 吸引火力2秒
        range: 300,
        hasWeight: true // 有重量
      },
      // === 新增技能：Epic ===
      [WEAPON_TYPES.GRAVITY_WHIRL]: {
        damage: 5.2, // 基础伤害
        attackSpeed: 624, // 10.4秒冷却
        radius: 120, // 引力场半径
        duration: 180, // 持续3秒
        slowEffect: 0.5, // 减速50%
        pullStrength: 2, // 吸引力强度
        tickInterval: 30, // 每0.5秒造成伤害
        range: 120,
        hasWeight: false // 无重量
      },
      [WEAPON_TYPES.BOUNCE_BLADE]: {
        damage: 9.6, // 基础伤害
        attackSpeed: 585, // 9.75秒冷却
        projectileSpeed: 9,
        bounceCount: 3, // 反弹3次
        bounceDamageIncrease: 0.1, // 每次反弹伤害+10%
        range: 300,
        hasWeight: false // 无重量
      },
      [WEAPON_TYPES.TIME_STASIS]: {
        damage: 0, // 无伤害
        attackSpeed: 741, // 12.35秒冷却
        radius: 150, // 范围
        slowEffect: 0.7, // 减速70%
        duration: 150, // 持续2.5秒
        selfSpeedBoost: 0.3, // 自身加速30%
        range: 150,
        hasWeight: false // 无重量
      },
      // === 新增技能：Legendary ===
      [WEAPON_TYPES.BLINK_SLASH]: {
        damage: 18.7, // 基础伤害
        attackSpeed: 702, // 11.7秒冷却
        teleportDistance: 100, // 瞬移距离
        damageMultiplier: 2.0, // 2倍伤害
        invincibleDuration: 60, // 无敌1秒
        executeThreshold: 0.3, // 秒杀阈值30%
        range: 100,
        hasWeight: false // 无重量
      },
      [WEAPON_TYPES.LAVA_FIST]: {
        damage: 16.8, // 基础伤害
        attackSpeed: 780, // 13秒冷却
        radius: 90, // 拳击范围
        damageMultiplier: 2.5, // 2.5倍伤害
        burnDamageMultiplier: 0.3, // 灼烧0.3倍伤害
        burnDuration: 120, // 灼烧2秒
        range: 90,
        hasWeight: false // 无重量
      }
    };

    const stats = baseStats[type];
    if (!stats) return null;

    // 使用 WeaponConfig 创建武器配置（类似 WeaponData）
    const config = new WeaponConfig(type);
    config.initFromStats(stats);
    
    // 创建武器实例（类似 ActorData_Weapon）
    return {
      type,
      level,
      config, // 武器配置数据
      baseStats: { ...stats },
      currentStats: { ...stats },
      frameCounter: 0,
      
      // 运行时状态（参考 ActorData_Weapon 属性）
      state: {
        isRotating: false,
        isLanding: false,
        isCharging: false,
        isCooldown: false,
        hasTarget: false,
        isActive: true
      },
      
      // 获取运行时状态（类似 getRuntimeState）
      getRuntimeState: function() {
        return { ...this.state };
      },
      
      // 设置运行时状态（类似 setRuntimeState）
      setRuntimeState: function(stateName, value) {
        if (this.state.hasOwnProperty(stateName)) {
          this.state[stateName] = value;
          // 同步更新 config 的 flags
          this.config.setRuntimeState(stateName, value);
        }
      },
      
      // 更新武器属性（等级提升时调用）
      updateStats: function() {
        this.currentStats.damage = Math.floor(this.baseStats.damage * (1 + (this.level - 1) * 0.2));
        this.currentStats.attackSpeed = Math.max(15, this.baseStats.attackSpeed - (this.level - 1) * 5);

        // 弹丸数量和连锁次数在等级升级时保持基础值，不自动增加
        // 只通过被动技能（多重射击、额外弹道）来增加
        if (this.baseStats.projectileCount !== undefined) {
          this.currentStats.projectileCount = this.baseStats.projectileCount;
        }
        if (this.baseStats.pierce !== undefined) {
          this.currentStats.pierce = this.baseStats.pierce;
        }
        if (this.baseStats.radius !== undefined) {
          this.currentStats.radius = this.baseStats.radius + (this.level - 1) * 10;
        }
        if (this.baseStats.chainCount !== undefined) {
          this.currentStats.chainCount = this.baseStats.chainCount;
        }
        
        // 同步更新 config
        this.config.damage = this.currentStats.damage;
        this.config.attackSpeed = this.currentStats.attackSpeed;
      }
    };
  }

  // 获取玩家在地图上的坐标
  getPlayerMapCoords() {
    if (GameGlobal.databus.infiniteMap) {
      const map = GameGlobal.databus.infiniteMap;
      return {
        x: map.playerMapX + this.player.width / 2,
        y: map.playerMapY + this.player.height / 2
      };
    } else {
      return {
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height / 2
      };
    }
  }

  // 创建投射物配置（类似 JBulletData）
  createProjectileConfig(type, overrides = {}) {
    const config = {
      type,
      flags: ProjectileFlags.NONE,
      size: 8,
      speed: 5,
      damage: 0,
      pierce: 0,
      bounce: 0,
      range: 200,
      duration: undefined,
      hasWeight: false,
      canBounce: false,
      hasTarget: false,
      isMissile: false,
      isChain: false,
      isGrenade: false,
      ...overrides
    };
    
    // 根据类型设置默认标志
    if (config.isMissile) config.flags |= ProjectileFlags.MISSILE;
    if (config.isChain) config.flags |= ProjectileFlags.CHAIN;
    if (config.isGrenade) config.flags |= ProjectileFlags.GRENADE;
    if (config.hasTarget) config.flags |= ProjectileFlags.TARGET_POS_DIR;
    
    return config;
  }

  // 创建投射物（使用配置）
  createProjectile(config, x, y, angle, extras = {}) {
    const projectile = {
      type: config.type,
      x,
      y,
      startX: x,
      startY: y,
      vx: Math.cos(angle) * config.speed,
      vy: Math.sin(angle) * config.speed,
      trajectoryAngle: angle,
      damage: config.damage,
      pierce: config.pierce,
      range: config.range,
      hitEnemies: new Set(),
      bounceCount: config.bounce,
      maxBounceCount: config.bounce,
      hasWeight: config.hasWeight,
      canBounce: config.canBounce,
      size: config.size,
      color: config.color || '#ffffff',
      hasTarget: config.hasTarget,
      isMissile: config.isMissile,
      isChain: config.isChain,
      isGrenade: config.isGrenade,
      flags: config.flags,
      duration: config.duration,
      ...extras
    };
    
    return projectile;
  }

  // === 新增：增强的伤害计算系统 ===
  
  // 计算伤害（支持暴击、状态效果等）
  calculateDamage(weapon, target, options = {}) {
    let damage = weapon.currentStats.damage || 0;
    
    // 1. 基础伤害倍率
    damage *= this.damageMultiplier;
    
    // 2. 元素伤害加成
    if (weapon.elementType || this.elementDamageBoost > 0) {
      damage *= (1 + this.elementDamageBoost);
    }
    
    // 3. 暴击计算
    const critChance = options.critChance || this.critChance;
    if (Math.random() < critChance) {
      damage *= this.critDamage;
      if (options.isCrit !== undefined) {
        options.isCrit = true;
      }
    }
    
    // 4. 破甲效果（对破甲目标造成额外伤害）
    if (target && (target.armorBroken || options.armorBreak)) {
      damage *= 1.5; // 对破甲目标造成 1.5 倍伤害
    }
    
    // 5. 距离伤害衰减（可选）
    if (options.distance && weapon.currentStats.damageDecay) {
      const decayFactor = Math.max(0, 1 - options.distance / (weapon.currentStats.range || 300));
      damage *= decayFactor;
    }
    
    // 6. 范围伤害衰减（可选）
    if (options.isAreaDamage && options.distanceFromCenter && weapon.currentStats.radius) {
      const areaDecay = Math.max(0.5, 1 - options.distanceFromCenter / weapon.currentStats.radius * 0.5);
      damage *= areaDecay;
    }
    
    // 7. 技能特定加成
    if (options.damageMultiplier) {
      damage *= options.damageMultiplier;
    }
    
    // 8. 陷阱大师伤害加成
    if (weapon.type === WEAPON_TYPES.TRAP && this.trapDamageBonus) {
      damage *= (1 + this.trapDamageBonus);
    }
    
    return Math.floor(damage);
  }

  // === 新增：状态效果管理系统 ===
  
  // 应用状态效果到目标
  applyStatusEffect(target, effectType, value, duration) {
    if (!target || !effectType) return;
    
    const effect = {
      type: effectType,
      value: value,
      duration: duration,
      startTime: GameGlobal.databus.frame,
      endTime: GameGlobal.databus.frame + duration
    };
    
    // 如果目标已有相同效果，取持续时间较长的
    const existingEffect = target.activeEffects && target.activeEffects.get(effectType);
    if (existingEffect) {
      if (effect.endTime > existingEffect.endTime) {
        target.activeEffects.set(effectType, effect);
      }
    } else {
      // 初始化效果 Map
      if (!target.activeEffects) {
        target.activeEffects = new Map();
      }
      target.activeEffects.set(effectType, effect);
      
      // 应用即时效果
      this.applyImmediateEffect(target, effect);
    }
  }
  
  // 应用即时效果
  applyImmediateEffect(target, effect) {
    switch (effect.type) {
      case StatusEffectType.SLOW:
        target.slowed = true;
        target.slowEffect = effect.value;
        target.slowEndTime = effect.endTime;
        break;
      case StatusEffectType.FROZEN:
        target.frozen = true;
        target.freezeDuration = effect.duration;
        break;
      case StatusEffectType.POISON:
        target.poisoned = true;
        target.poisonDuration = effect.duration;
        break;
      case StatusEffectType.BURN:
        target.burning = true;
        target.burnDuration = effect.duration;
        break;
      case StatusEffectType.ARMOR_BREAK:
        target.armorBroken = true;
        target.armorBreakDuration = effect.duration;
        break;
      case StatusEffectType.STUN:
        target.stunned = true;
        target.stunDuration = effect.duration;
        break;
      case StatusEffectType.INVINCIBLE:
        target.invincible = true;
        target.invincibleDuration = effect.duration;
        break;
      case StatusEffectType.SPEED_UP:
        target.speedBoost = true;
        target.speedBoostMultiplier = 1 + effect.value;
        target.speedBoostDuration = effect.duration;
        break;
      case StatusEffectType.DAMAGE_UP:
        target.damageBoost = true;
        target.damageBoostMultiplier = 1 + effect.value;
        target.damageBoostDuration = effect.duration;
        break;
    }
  }
  
  // 更新目标的状态效果（每帧调用）
  updateStatusEffects(target) {
    if (!target || !target.activeEffects) return;
    
    const currentFrame = GameGlobal.databus.frame;
    
    for (const [effectType, effect] of target.activeEffects) {
      if (currentFrame >= effect.endTime) {
        // 效果结束，移除并恢复状态
        this.removeStatusEffect(target, effectType);
      }
    }
  }
  
  // 移除状态效果
  removeStatusEffect(target, effectType) {
    if (!target || !target.activeEffects) return;
    
    target.activeEffects.delete(effectType);
    
    // 恢复目标状态
    switch (effectType) {
      case StatusEffectType.SLOW:
        if (!target.activeEffects.has(StatusEffectType.SLOW)) {
          target.slowed = false;
          target.slowEffect = 0;
        }
        break;
      case StatusEffectType.FROZEN:
        if (!target.activeEffects.has(StatusEffectType.FROZEN)) {
          target.frozen = false;
        }
        break;
      case StatusEffectType.POISON:
        if (!target.activeEffects.has(StatusEffectType.POISON)) {
          target.poisoned = false;
        }
        break;
      case StatusEffectType.BURN:
        if (!target.activeEffects.has(StatusEffectType.BURN)) {
          target.burning = false;
        }
        break;
      case StatusEffectType.ARMOR_BREAK:
        if (!target.activeEffects.has(StatusEffectType.ARMOR_BREAK)) {
          target.armorBroken = false;
        }
        break;
      case StatusEffectType.STUN:
        if (!target.activeEffects.has(StatusEffectType.STUN)) {
          target.stunned = false;
        }
        break;
      case StatusEffectType.INVINCIBLE:
        if (!target.activeEffects.has(StatusEffectType.INVINCIBLE)) {
          target.invincible = false;
        }
        break;
      case StatusEffectType.SPEED_UP:
        if (!target.activeEffects.has(StatusEffectType.SPEED_UP)) {
          target.speedBoost = false;
          target.speedBoostMultiplier = 1;
        }
        break;
      case StatusEffectType.DAMAGE_UP:
        if (!target.activeEffects.has(StatusEffectType.DAMAGE_UP)) {
          target.damageBoost = false;
          target.damageBoostMultiplier = 1;
        }
        break;
    }
  }
  
  // 对目标造成伤害（整合状态效果）
  damageTarget(target, damage, options = {}) {
    if (!target || !target.isActive) return 0;
    
    // 检查无敌状态
    if (target.invincible) return 0;
    
    // 计算最终伤害
    const finalDamage = this.calculateDamage(null, target, {
      ...options,
      damageMultiplier: damage
    });
    
    // 应用伤害
    target.takeDamage(finalDamage);
    
    // 应用附加状态效果
    if (options.applyEffect) {
      this.applyStatusEffect(target, options.applyEffect, options.effectValue, options.effectDuration);
    }
    
    return finalDamage;
  }


  update(enemies) {
    this.weapons.forEach(weapon => {
      weapon.frameCounter++;

      // 计算攻速倍率（应用快速装填效果）
      let attackSpeedMult = this.attackSpeedMultiplier;
      let cooldownReductionMult = this.cooldownReductionMultiplier;

      if (this.quickReloadBoost && weapon.baseStats.hasWeight) {
        attackSpeedMult *= 1.15; // 有重量弹药攻速 +15%
        cooldownReductionMult *= 0.9; // 冷却 -10%
      }

      const effectiveAttackSpeed = Math.max(5, Math.floor(
        weapon.currentStats.attackSpeed / attackSpeedMult / cooldownReductionMult
      ));

      if (weapon.frameCounter >= effectiveAttackSpeed) {
        weapon.frameCounter = 0;

        // 基础攻击
        this.attack(weapon, enemies);

        // 额外弹道：在每帧延迟后发射额外攻击
        for (let i = 0; i < this.extraSalvoMultiplier; i++) {
          setTimeout(() => {
            if (GameGlobal.databus && !GameGlobal.databus.isGameOver) {
              this.attack(weapon, enemies);
            }
          }, (i + 1) * 100);
        }
      }
    });

    this.updateProjectiles();
    this.checkTrapTrigger();
  }

  // 技能事件触发机制（参考 SkillEvent.TriggerChilds）
  triggerSkillEvent(eventName, weapon, data = {}) {
    // 设置武器状态为激活
    weapon.setRuntimeState('isActive', true);
    
    // 触发事件（可以扩展为事件总线）
    if (GameGlobal.databus && GameGlobal.databus.emit) {
      GameGlobal.databus.emit('skillEvent', {
        eventName,
        weaponType: weapon.type,
        weaponLevel: weapon.level,
        ...data
      });
    }
    
    // 根据事件类型设置特殊状态
    if (eventName === 'attack_start') {
      weapon.setRuntimeState('isCharging', true);
    } else if (eventName === 'attack_end') {
      weapon.setRuntimeState('isCharging', false);
      weapon.setRuntimeState('isCooldown', true);
      
      // 冷却结束后重置状态
      const cooldownTime = weapon.currentStats.attackSpeed || 60;
      setTimeout(() => {
        weapon.setRuntimeState('isCooldown', false);
      }, cooldownTime * 16); // 转换为毫秒（假设 60fps）
    }
  }

  attack(weapon, enemies) {
    // 触发攻击开始事件
    this.triggerSkillEvent('attack_start', weapon);
    
    switch (weapon.type) {
      // === 魔法弹药类（保留锁定） ===
      case WEAPON_TYPES.MAGIC_ORB:
        this.magicOrbAttack(weapon, enemies);
        break;
      // === 连锁类（保留锁定） ===
      case WEAPON_TYPES.LIGHTNING:
        this.lightningAttack(weapon, enemies);
        break;
      // === 物理弹药类（无锁定） ===
      case WEAPON_TYPES.AXE:
        this.axeAttack(weapon, enemies);
        break;
      // === 范围类（无锁定） ===
      case WEAPON_TYPES.WHIRLWIND:
        this.whirlwindAttack(weapon, enemies);
        break;
      case WEAPON_TYPES.HOLY_DOMAIN:
        this.holyDomainAttack(weapon, enemies);
        break;
      // === 范围伤害类 ===
      case WEAPON_TYPES.FIRE_BALL:
        this.fireBallAttack(weapon);
        break;
      case WEAPON_TYPES.ICE_STORM:
        this.iceStormAttack(weapon, enemies);
        break;
      case WEAPON_TYPES.POISON_CLOUD:
        this.poisonCloudAttack(weapon, enemies);
        break;
      // === 状态增益类 ===
      case WEAPON_TYPES.HOLY_SHIELD:
        this.holyShieldAttack(weapon);
        break;
      case WEAPON_TYPES.SPEED_BOOST:
        this.speedBoostAttack(weapon);
        break;
      case WEAPON_TYPES.DAMAGE_BOOST:
        this.damageBoostAttack(weapon);
        break;
      // === Team Support Class ===
      case WEAPON_TYPES.HEALING_AURA:
        this.healingAuraAttack(weapon);
        break;
      case WEAPON_TYPES.PROTECTION_AURA:
        this.protectionAuraAttack(weapon);
        break;
      case WEAPON_TYPES.MANA_REGEN:
        this.manaRegenAttack(weapon);
        break;
      // === Tactical Skill Class ===
      case WEAPON_TYPES.TELEPORT:
        this.teleportAttack(weapon);
        break;
      case WEAPON_TYPES.TIME_SLOW:
        this.timeSlowAttack(weapon, enemies);
        break;
      case WEAPON_TYPES.TRAP:
        this.trapAttack(weapon);
        break;
      // === 新增技能 ===
      case WEAPON_TYPES.THUNDER_ORB:
        this.thunderOrbAttack(weapon, enemies);
        break;
      case WEAPON_TYPES.ARMOR_PIERCE_SHOT:
        this.armorPierceShotAttack(weapon, enemies);
        break;
      case WEAPON_TYPES.VAMPIRE_DART:
        this.vampireDartAttack(weapon, enemies);
        break;
      // === 新增技能：Common ===
      case WEAPON_TYPES.MOLOTOV:
        this.molotovAttack(weapon);
        break;
      case WEAPON_TYPES.SOUND_SHOCK:
        this.soundShockAttack(weapon);
        break;
      case WEAPON_TYPES.POISON_FOG:
        this.poisonFogAttack(weapon, enemies);
        break;
      case WEAPON_TYPES.ROCK_BLAST:
        this.rockBlastAttack(weapon);
        break;
      // === 新增技能：Rare ===
      case WEAPON_TYPES.FROST_BARRAGE:
        this.frostBarrageAttack(weapon, enemies);
        break;
      case WEAPON_TYPES.SUICIDE_DRONE:
        this.suicideDroneAttack(weapon, enemies);
        break;
      // === 新增技能：Epic ===
      case WEAPON_TYPES.GRAVITY_WHIRL:
        this.gravityWhirlAttack(weapon);
        break;
      case WEAPON_TYPES.BOUNCE_BLADE:
        this.bounceBladeAttack(weapon, enemies);
        break;
      case WEAPON_TYPES.TIME_STASIS:
        this.timeStasisAttack(weapon);
        break;
      // === 新增技能：Legendary ===
      case WEAPON_TYPES.BLINK_SLASH:
        this.blinkSlashAttack(weapon, enemies);
        break;
      case WEAPON_TYPES.LAVA_FIST:
        this.lavaFistAttack(weapon);
        break;
    }
    
    // 触发攻击结束事件
    this.triggerSkillEvent('attack_end', weapon);
  }

  magicOrbAttack(weapon, enemies) {
    const count = weapon.currentStats.projectileCount + this.projectileCountMultiplier;
    const damage = weapon.currentStats.damage * this.damageMultiplier;
    const speed = weapon.currentStats.projectileSpeed;
    const range = weapon.currentStats.range + this.attackRangeMultiplier;

    // 获取玩家地图坐标
    const playerCoords = this.getPlayerMapCoords();

    // 查找最近的敌人作为弹道目标
    let targetEnemy = this.findNearestEnemy(enemies);
    let trajectoryAngle = this.player.lastMoveAngle || 0; // 默认使用角色朝向

    if (targetEnemy) {
      // 如果有敌人，弹道指向最近敌人
      trajectoryAngle = Math.atan2(
        targetEnemy.y + targetEnemy.height/2 - playerCoords.y,
        targetEnemy.x + targetEnemy.width/2 - playerCoords.x
      );
    }

    for (let i = 0; i < count; i++) {
      const spreadAngle = (Math.PI / 6) * (i - Math.floor(count / 2));
      const finalAngle = trajectoryAngle + spreadAngle;

      const basePierce = weapon.currentStats.pierce || 0;
      
      // 使用配置创建投射物
      const config = this.createProjectileConfig(WEAPON_TYPES.MAGIC_ORB, {
        speed,
        damage,
        pierce: Math.floor(basePierce + this.penetrationMultiplier),
        range,
        bounce: Math.floor(this.bounceMultiplier),
        canBounce: weapon.currentStats.canBounce || false,
        hasWeight: weapon.currentStats.hasWeight || false,
        size: 8,
        color: '#00ffff'
      });
      
      const projectile = this.createProjectile(config, playerCoords.x, playerCoords.y, finalAngle, {
        hasTarget: false // 标记为尚未确定目标，启用半锁敌追踪
      });
      
      this.projectiles.push(projectile);
    }
  }

  whirlwindAttack(weapon, enemies) {
    const damage = weapon.currentStats.damage * this.damageMultiplier;
    const radius = weapon.currentStats.radius + this.skillAreaMultiplier;
    const sceneObjects = GameGlobal.databus.sceneObjects || [];

    // 获取玩家地图坐标
    const playerCoords = this.getPlayerMapCoords();

    // 攻击敌人
    enemies.forEach(enemy => {
      if (!enemy.isActive) return;

      const dist = this.getDistance(
        playerCoords.x,
        playerCoords.y,
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2
      );

      if (dist <= radius) {
        enemy.takeDamage(damage);
      }
    });

    // 攻击场景道具
    sceneObjects.forEach(obj => {
      if (!obj.isActive) return;

      const dist = this.getDistance(
        playerCoords.x,
        playerCoords.y,
        obj.x + obj.width / 2,
        obj.y + obj.height / 2
      );

      if (dist <= radius) {
        obj.onAttacked();
      }
    });

    // 添加视觉效果 - 灰色旋风范围
    this.projectiles.push({
      type: WEAPON_TYPES.WHIRLWIND,
      x: playerCoords.x,
      y: playerCoords.y,
      radius,
      duration: 30,
      size: radius * 2,
      color: 'rgba(150, 150, 150, 0.1)'
    });
  }

  holyDomainAttack(weapon, enemies) {
    const damage = weapon.currentStats.damage * this.damageMultiplier;
    const radius = weapon.currentStats.radius + this.skillAreaMultiplier;
    const sceneObjects = GameGlobal.databus.sceneObjects || [];

    // 获取玩家地图坐标
    const playerCoords = this.getPlayerMapCoords();

    // 攻击敌人
    enemies.forEach(enemy => {
      if (!enemy.isActive) return;

      const dist = this.getDistance(
        playerCoords.x,
        playerCoords.y,
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2
      );

      if (dist <= radius) {
        enemy.takeDamage(damage);
      }
    });

    // 攻击场景道具
    sceneObjects.forEach(obj => {
      if (!obj.isActive) return;

      const dist = this.getDistance(
        playerCoords.x,
        playerCoords.y,
        obj.x + obj.width / 2,
        obj.y + obj.height / 2
      );

      if (dist <= radius) {
        obj.onAttacked();
      }
    });

    // 添加视觉效果 - 淡金色神圣领域范围
    this.projectiles.push({
      type: WEAPON_TYPES.HOLY_DOMAIN,
      x: playerCoords.x,
      y: playerCoords.y,
      radius,
      duration: 30,
      size: radius * 2,
      color: 'rgba(255, 215, 0, 0.15)'
    });
  }

  lightningAttack(weapon, enemies) {
    const damage = this.calculateDamageWithElementBoost(weapon, weapon.currentStats.damage);
    // Apply bounce multiplier to chain count
    const baseChainCount = weapon.currentStats.chainCount || 1;
    const chainCount = baseChainCount + this.bounceMultiplier;
    const range = weapon.currentStats.range + this.attackRangeMultiplier;

    // Get player map coordinates
    const playerCoords = this.getPlayerMapCoords();

    let target = this.findNearestEnemy(enemies);
    const hitEnemies = new Set();

    // Use the modified chain count with bounce multiplier applied
    // Lightning chains from last hit enemy to next enemy, not always from player
    let lastHitPosition = { x: playerCoords.x, y: playerCoords.y };
    const maxChainRange = 300; // Maximum range between chain targets (300 pixels)

    for (let i = 0; i < chainCount && target; i++) {
      if (hitEnemies.has(target)) break;

      // Check if target is within range from last hit position (for chaining)
      const distFromLast = this.getDistance(
        lastHitPosition.x,
        lastHitPosition.y,
        target.x + target.width / 2,
        target.y + target.height / 2
      );

      if (distFromLast > maxChainRange) break; // Too far from last hit, stop chain

      // Check if target is within overall attack range from player (first target only)
      if (i === 0) {
        const distFromPlayer = this.getDistance(
          playerCoords.x,
          playerCoords.y,
          target.x + target.width / 2,
          target.y + target.height / 2
        );
        if (distFromPlayer > range) break; // Out of range from player
      }

      // Damage the target
      target.takeDamage(damage);
      hitEnemies.add(target);

      // Store current target center as last hit position for next chain
      lastHitPosition = {
        x: target.x + target.width / 2,
        y: target.y + target.height / 2
      };

      // Draw lightning effect
      this.projectiles.push({
        type: WEAPON_TYPES.LIGHTNING,
        x: i === 0 ? playerCoords.x : lastHitPosition.x,
        y: i === 0 ? playerCoords.y : lastHitPosition.y,
        targetX: target.x + target.width / 2,
        targetY: target.y + target.height / 2,
        duration: 10,
        size: 3,
        color: '#ffff00'
      });

      // Find next enemy (nearest to current target, not player)
      target = this.findNearestEnemy(enemies, hitEnemies, {
        x: lastHitPosition.x,
        y: lastHitPosition.y
      });
    }
  }

  axeAttack(weapon, enemies) {
    const damage = weapon.currentStats.damage * this.damageMultiplier;
    const speed = weapon.currentStats.projectileSpeed;
    const gravity = weapon.currentStats.gravity;
    const range = weapon.currentStats.range + this.attackRangeMultiplier;

    // 获取玩家地图坐标
    const playerCoords = this.getPlayerMapCoords();

    // 物理弹药类：完全不锁定，使用角色朝向
    // 移除了所有寻找最近敌人的逻辑
    let trajectoryAngle = this.player.lastMoveAngle || 0; // 使用角色朝向

    const basePierce = weapon.currentStats.pierce || 0;
    
    // 使用配置创建投射物
    const config = this.createProjectileConfig(WEAPON_TYPES.AXE, {
      speed,
      damage,
      gravity,
      range,
      pierce: Math.floor(basePierce + this.penetrationMultiplier),
      bounce: Math.floor(this.bounceMultiplier),
      canBounce: true,
      hasWeight: true,
      size: 20,
      color: '#ff6600'
    });
    
    const projectile = this.createProjectile(config, playerCoords.x, playerCoords.y, trajectoryAngle, {
      rotation: 0,
      hasTarget: false // 标记为目标已确定，后续不再追踪
    });
    
    this.projectiles.push(projectile);
  }

  // 更新所有投射物（生命周期管理）
  // 参考 ActorData_Bullet.OnUpdate 流程
  updateProjectiles() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];

      // === 阶段 1：特殊投射物处理（不移动或特殊逻辑） ===
      
      // 陷阱：特殊处理，不移动，等待触发
      if (proj.type === WEAPON_TYPES.TRAP) {
        // 检查持续时间
        if (proj.duration) {
          proj.duration--;
          if (proj.duration <= 0) {
            this.projectiles.splice(i, 1);
            continue;
          }
        }
        // 陷阱不移动，检查触发逻辑在 checkTrapTrigger 中处理
        continue;
      }

      // 碎石轰击：从高处砸落
      if (proj.type === WEAPON_TYPES.ROCK_BLAST && proj.isFalling) {
        proj.y += proj.fallSpeed;
        
        // 到达目标位置后停止下落
        if (proj.y >= proj.targetY) {
          proj.y = proj.targetY;
          proj.isFalling = false;
        }
        continue;
      }

      // 毒云：持续中毒伤害（每帧造成伤害）
      if (proj.type === WEAPON_TYPES.POISON_CLOUD) {
        const enemies = GameGlobal.databus.enemies;
        enemies.forEach(enemy => {
          if (!enemy.isActive) return;
          const dist = this.getDistance(proj.x, proj.y, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          if (dist <= proj.radius) {
            // 每帧造成毒云伤害（60 帧=1 秒，所以每秒伤害是 poisonDamage * 60）
            const damage = proj.poisonDamage * this.damageMultiplier / 60;
            enemy.takeDamage(damage);
            // 中毒效果
            enemy.applyPoison(damage * 0.5, 60); // 1 秒中毒伤害
          }
        });
        proj.duration--;
        if (proj.duration <= 0) {
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      // 火海：持续燃烧伤害
      if (proj.type === 'fire_field') {
        proj.duration--;
        
        // 每 60 帧（1 秒）造成一次伤害
        // 使用相对帧数：firstTickFrame 记录第一次伤害的帧数
        if (proj.lastTickTime === -1) {
          // 第一次造成伤害
          const currentFrame = GameGlobal.databus.frame || 0;
          proj.lastTickTime = currentFrame;
          
          const enemies = GameGlobal.databus.enemies;
          enemies.forEach(enemy => {
            if (!enemy.isActive) return;
            const dist = this.getDistance(proj.x, proj.y, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            if (dist <= proj.radius) {
              enemy.takeDamage(proj.damage);
              proj.hitEnemies.add(enemy);
              // 燃烧效果
              enemy.applyBurn(proj.damage * 0.5, 180); // 3 秒燃烧伤害
            }
          });
        } else {
          const currentFrame = GameGlobal.databus.frame || 0;
          if (currentFrame - proj.lastTickTime >= proj.tickInterval) {
            proj.lastTickTime = currentFrame;
            
            const enemies = GameGlobal.databus.enemies;
            enemies.forEach(enemy => {
              if (!enemy.isActive || proj.hitEnemies.has(enemy)) return;
              const dist = this.getDistance(proj.x, proj.y, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
              if (dist <= proj.radius) {
                enemy.takeDamage(proj.damage);
                proj.hitEnemies.add(enemy);
                // 燃烧效果
                enemy.applyBurn(proj.damage * 0.5, 180); // 3 秒燃烧伤害
              }
            });
          }
        }
        
        if (proj.duration <= 0) {
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      // 持续时间类技能：闪电、范围效果、爆炸特效
      if (proj.type === WEAPON_TYPES.LIGHTNING ||
          proj.type === WEAPON_TYPES.HOLY_SHIELD ||
          proj.type === WEAPON_TYPES.SPEED_BOOST ||
          proj.type === WEAPON_TYPES.DAMAGE_BOOST ||
          proj.type === WEAPON_TYPES.HEALING_AURA ||
          proj.type === WEAPON_TYPES.PROTECTION_AURA ||
          proj.type === WEAPON_TYPES.MANA_REGEN ||
          proj.type === WEAPON_TYPES.TELEPORT ||
          proj.type === WEAPON_TYPES.TIME_SLOW ||
          proj.type === 'explosion_effect' ||
          proj.type === 'rock_effect' ||
          proj.type === 'lightning_effect' ||
          proj.type === WEAPON_TYPES.WHIRLWIND ||
          proj.type === WEAPON_TYPES.HOLY_DOMAIN) {
        proj.duration--;
        if (proj.duration <= 0) {
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      // 冰风暴：持续伤害和减速
      if (proj.type === WEAPON_TYPES.ICE_STORM) {
        const enemies = GameGlobal.databus.enemies;
        enemies.forEach(enemy => {
          if (!enemy.isActive) return;
          const dist = this.getDistance(proj.x, proj.y, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          if (dist <= proj.radius) {
            // 每帧造成冰风暴伤害
            enemy.takeDamage(proj.damage / 60);
            // 减速效果
            if (enemy.applySlow) {
              enemy.applySlow(proj.slowEffect, 30); // 持续 0.5 秒减速
            }
          }
        });
        proj.duration--;
        if (proj.duration <= 0) {
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      // === 阶段 2：物理更新（重力、追踪等） ===
      
      // 物理弹药类：斧头、燃烧瓶受重力影响
      if (proj.type === WEAPON_TYPES.AXE) {
        proj.vy += proj.gravity;
        proj.rotation += 0.2;
      }
      if (proj.type === WEAPON_TYPES.MOLOTOV) {
        proj.vy += proj.gravity || 0.15;
        proj.rotation += 0.15;
      }

      // 魔法弹药类：火球（半追踪）
      if (proj.type === WEAPON_TYPES.FIRE_BALL && !proj.hasTarget) {
        this.applySemiLockOn(proj);
      }

      // 半锁定机制：仅魔法弹药类（Magic Orb）和火球可以追踪敌人
      // 物理弹药类（Axe）和其他技能完全移除追踪功能
      if (proj.type === WEAPON_TYPES.MAGIC_ORB && !proj.hasTarget) {
        this.applySemiLockOn(proj);
      }

      // 更新位置
      proj.x += proj.vx;
      proj.y += proj.vy;

      // === 阶段 3：边界检查 ===
      
      // 获取地图偏移量，用于计算屏幕可见范围
      let offsetX = 0;
      let offsetY = 0;
      if (GameGlobal.databus.infiniteMap) {
        const map = GameGlobal.databus.infiniteMap;
        offsetX = map.offsetX;
        offsetY = map.offsetY;
      }

      // 计算投射物的屏幕坐标
      const screenX = proj.x + offsetX;
      const screenY = proj.y + offsetY;

      // 检查是否超出屏幕可见范围（留出 50 像素的缓冲）
      if (screenX < -50 || screenX > SCREEN_WIDTH + 50 ||
          screenY < -50 || screenY > SCREEN_HEIGHT + 50) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // 检查射程（仅对魔法弹药类应用射程限制，物理弹药类飞行到屏幕边缘）
      if (proj.range && proj.startX !== undefined && proj.startY !== undefined) {
        // 物理弹药类（如斧头、燃烧瓶、雷暴弹）不因射程消失，只检查屏幕边界
        if (proj.type !== WEAPON_TYPES.AXE && 
            proj.type !== WEAPON_TYPES.FIRE_BALL &&
            proj.type !== WEAPON_TYPES.MOLOTOV &&
            proj.type !== WEAPON_TYPES.THUNDER_ORB) {
          const dist = this.getDistance(proj.startX, proj.startY, proj.x, proj.y);
          if (dist > proj.range) {
            this.projectiles.splice(i, 1);
            continue;
          }
        }
      }

      // === 阶段 4：障碍物碰撞检测 ===
      
      // 障碍物碰撞检测
      if (GameGlobal.databus.mapObstacles) {
        const obstacles = GameGlobal.databus.mapObstacles;
        for (const obstacle of obstacles.obstacles) {
          if (!obstacle.active) continue;

          // 简单的矩形碰撞检测
          const projectileSize = proj.size || 5;
          const isColliding = !(
            proj.x + projectileSize < obstacle.x ||
            proj.x - projectileSize > obstacle.x + obstacle.width ||
            proj.y + projectileSize < obstacle.y ||
            proj.y - projectileSize > obstacle.y + obstacle.height
          );

          if (isColliding) {
            // 燃烧瓶和雷暴弹不受障碍物影响
            if (proj.type === WEAPON_TYPES.MOLOTOV || 
                proj.type === WEAPON_TYPES.THUNDER_ORB) {
              continue;
            }
            
            // 如果是可破坏障碍物（箱子），造成伤害
            if (obstacle.isDestructible) {
              obstacles.damageObstacle(obstacle, proj.damage);
            }

            // 移除投射物
            this.projectiles.splice(i, 1);
            break;
          }
        }

        // 如果投射物被移除了，跳过后续处理
        if (!this.projectiles[i]) {
          continue;
        }
      }

      // 障碍物碰撞检测（使用无限地图系统）
      if (GameGlobal.databus.infiniteMap) {
        const map = GameGlobal.databus.infiniteMap;

        // 固定不可破坏道具碰撞检测（所有子弹都会被阻挡并消失）
        for (const obstacle of map.fixedObstacles) {
          if (!obstacle.active) continue;

          // 简单的矩形碰撞检测
          const projectileSize = proj.size || 5;
          const isColliding = !(
            proj.x + projectileSize < obstacle.x ||
            proj.x - projectileSize > obstacle.x + obstacle.width ||
            proj.y + projectileSize < obstacle.y ||
            proj.y - projectileSize > obstacle.y + obstacle.height
          );

          if (isColliding) {
            // 燃烧瓶和雷暴弹不受固定障碍物影响
            if (proj.type === WEAPON_TYPES.MOLOTOV || 
                proj.type === WEAPON_TYPES.THUNDER_ORB) {
              continue;
            }
            
            // 子弹击中固定不可破坏道具，直接消失（范围技能除外）
            this.projectiles.splice(i, 1);
            break;
          }
        }

        // 如果投射物被移除了，跳过后续处理
        if (!this.projectiles[i]) {
          continue;
        }

        // 检查与固定障碍物的碰撞
        for (const obstacle of map.fixedObstacles) {
          if (!obstacle.active) continue;

          // 计算障碍物的世界坐标
          const obstacleWorldX = obstacle.x;
          const obstacleWorldY = obstacle.y;

          // 简单的矩形碰撞检测
          const projectileSize = proj.size || 5;
          const isColliding = !(
            proj.x + projectileSize < obstacleWorldX ||
            proj.x - projectileSize > obstacleWorldX + obstacle.width ||
            proj.y + projectileSize < obstacleWorldY ||
            proj.y - projectileSize > obstacleWorldY + obstacle.height
          );

          if (isColliding) {
            // 燃烧瓶和雷暴弹不受固定障碍物影响
            if (proj.type === WEAPON_TYPES.MOLOTOV || 
                proj.type === WEAPON_TYPES.THUNDER_ORB) {
              continue;
            }
            
            // 移除投射物（固定障碍物不可破坏）
            this.projectiles.splice(i, 1);
            break;
          }
        }

        // 如果投射物被移除了，跳过后续处理
        if (!this.projectiles[i]) {
          continue;
        }

        // 道具箱碰撞检测（使用地图坐标，因为proj使用地图坐标）
        for (const box of map.itemBoxes) {
          if (!box.active) continue;

          // 道具箱使用地图坐标，直接与投射物进行碰撞检测
          const projectileSize = proj.size || 5;
          const isColliding = !(
            proj.x + projectileSize < box.x ||
            proj.x - projectileSize > box.x + box.width ||
            proj.y + projectileSize < box.y ||
            proj.y - projectileSize > box.y + box.height
          );

          if (isColliding) {
            // 对道具箱造成伤害（使用地图坐标）
            const destroyed = map.damageItemBox(box, proj.damage, box.x, box.y);

            // 移除投射物
            this.projectiles.splice(i, 1);
            break;
          }
        }

        // 如果投射物被移除了，跳过后续处理
        if (!this.projectiles[i]) {
          continue;
        }
      }

      // === 阶段 5：敌人碰撞检测 ===
      
      // 如果投射物还存在，继续检测敌人碰撞
      if (this.projectiles[i]) {
        this.checkProjectileCollision(proj, i);
      }
    }
  }

  applySemiLockOn(proj) {
    const enemies = GameGlobal.databus.enemies;
    const trackingRadius = 150; // 追踪范围
    const maxTurnAngle = Math.PI / 22.5; // 最大转向角度（8度）
    const trajectoryAngle = proj.trajectoryAngle; // 弹道预设角度
    const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);

    // 获取玩家的地图坐标
    let playerCenterX, playerCenterY;
    if (GameGlobal.databus.infiniteMap) {
      const map = GameGlobal.databus.infiniteMap;
      playerCenterX = map.playerMapX + this.player.width / 2;
      playerCenterY = map.playerMapY + this.player.height / 2;
    } else {
      playerCenterX = this.player.x + this.player.width / 2;
      playerCenterY = this.player.y + this.player.height / 2;
    }

    // 查找弹道8度范围内的敌人
    let nearestEnemy = null;
    let minAngleDiff = maxTurnAngle; // 8度范围内

    for (const enemy of enemies) {
      if (!enemy.isActive) continue;

      // 如果投射物有 hitEnemies 属性，跳过已经击中的敌人
      if (proj.hitEnemies && proj.hitEnemies.has(enemy)) continue;

      const targetX = enemy.x + enemy.width / 2;
      const targetY = enemy.y + enemy.height / 2;

      // 计算从子弹到目标的角度
      const angleToTarget = Math.atan2(targetY - proj.y, targetX - proj.x);

      // 计算与弹道角度的差值
      let angleDiff = angleToTarget - trajectoryAngle;

      // 标准化角度差到 [-PI, PI] 范围
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      // 取绝对值
      const absAngleDiff = Math.abs(angleDiff);

      // 检查是否在弹道8度范围内
      if (absAngleDiff < minAngleDiff) {
        // 检查距离是否在追踪范围内
        const dist = this.getDistance(proj.x, proj.y, targetX, targetY);
        if (dist <= trackingRadius) {
          minAngleDiff = absAngleDiff;
          nearestEnemy = enemy;
        }
      }
    }

    // 如果找到弹道范围内的目标，轻微调整方向追踪
    if (nearestEnemy) {
      const targetX = nearestEnemy.x + nearestEnemy.width / 2;
      const targetY = nearestEnemy.y + nearestEnemy.height / 2;
      const targetAngle = Math.atan2(targetY - proj.y, targetX - proj.x);
      const currentAngle = Math.atan2(proj.vy, proj.vx);

      // 计算角度差
      let angleDiff = targetAngle - currentAngle;

      // 标准化角度差到 [-PI, PI] 范围
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      // 限制转向角度为8度以内（与弹道范围一致）
      const turnAngle = Math.max(-maxTurnAngle, Math.min(maxTurnAngle, angleDiff));
      const newAngle = currentAngle + turnAngle;

      // 更新速度向量
      proj.vx = Math.cos(newAngle) * speed;
      proj.vy = Math.sin(newAngle) * speed;
    }
    // 没有敌人时，子弹保持直线飞行（不做任何角度调整）
  }

  // 投射物碰撞检测（参考 ActorData_Bullet.OnCollider）
  checkProjectileCollision(proj, index) {
    const enemies = GameGlobal.databus.enemies;
    const sceneObjects = GameGlobal.databus.sceneObjects || [];

    // === 特殊投射物处理 ===
    
    // 火球爆炸特殊处理：击中任何目标时触发爆炸
    if (proj.type === WEAPON_TYPES.FIRE_BALL && proj.explosionRadius !== undefined) {
      let hasHit = false;

      // 检测与敌人的碰撞
      for (const enemy of enemies) {
        if (!enemy.isActive) continue;

        const dist = this.getDistance(proj.x, proj.y,
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2
        );

        if (dist <= proj.size + enemy.width / 2) {
          hasHit = true;
          break;
        }
      }

      // 检测与场景道具的碰撞
      if (!hasHit) {
        for (const obj of sceneObjects) {
          if (!obj.isActive) continue;

          const dist = this.getDistance(proj.x, proj.y,
            obj.x + obj.width / 2,
            obj.y + obj.height / 2
          );

          if (dist <= proj.size + Math.min(obj.width, obj.height) / 2) {
            hasHit = true;
            break;
          }
        }
      }

      // 如果击中任何目标，触发爆炸
      if (hasHit) {
        this.triggerExplosion(proj);
        this.projectiles.splice(index, 1);
        return;
      }

      // 没有击中目标，检查是否超出射程或屏幕边界
      if (proj.range && proj.startX !== undefined && proj.startY !== undefined) {
        const dist = this.getDistance(proj.startX, proj.startY, proj.x, proj.y);
        if (dist > proj.range) {
          // 超出射程也触发爆炸（可选）
          this.triggerExplosion(proj);
          this.projectiles.splice(index, 1);
          return;
        }
      }

      return; // 火球特殊处理完毕
    }

    // === 新增技能碰撞检测 ===

    // 雷暴弹：命中后触发雷电范围伤害
    if (proj.type === WEAPON_TYPES.THUNDER_ORB) {
      for (const enemy of enemies) {
        if (!enemy.isActive || proj.hitEnemies.has(enemy)) continue;

        const dist = this.getDistance(proj.x, proj.y,
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2
        );

        if (dist <= proj.size + enemy.width / 2) {
          enemy.takeDamage(proj.damage);
          proj.hitEnemies.add(enemy);

          // 触发雷电范围伤害
          this.triggerLightningDamage(proj, enemy);

          // 处理穿透
          if (proj.pierce !== undefined && proj.pierce > 0) {
            proj.pierce--;
            if (proj.pierce <= 0) {
              this.projectiles.splice(index, 1);
              return;
            }
          } else {
            this.projectiles.splice(index, 1);
            return;
          }
        }
      }
      return;
    }

    // 吸血飞镖：命中后回血
    if (proj.type === WEAPON_TYPES.VAMPIRE_DART) {
      for (const enemy of enemies) {
        if (!enemy.isActive || proj.hitEnemies.has(enemy)) continue;

        const dist = this.getDistance(proj.x, proj.y,
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2
        );

        if (dist <= proj.size + enemy.width / 2) {
          enemy.takeDamage(proj.damage);
          proj.hitEnemies.add(enemy);

          // 吸血效果
          if (proj.lifeStealPercent && this.player && this.player.stats) {
            const healAmount = proj.damage * proj.lifeStealPercent;
            this.player.stats.currentHealth = Math.min(
              this.player.stats.maxHealth,
              this.player.stats.currentHealth + healAmount
            );
          }

          // 处理穿透
          if (proj.pierce !== undefined && proj.pierce > 0) {
            proj.pierce--;
            if (proj.pierce <= 0) {
              this.projectiles.splice(index, 1);
              return;
            }
          } else {
            this.projectiles.splice(index, 1);
            return;
          }
        }
      }
      return;
    }

    // 穿甲霰弹：命中后破甲
    if (proj.type === WEAPON_TYPES.ARMOR_PIERCE_SHOT) {
      for (const enemy of enemies) {
        if (!enemy.isActive || proj.hitEnemies.has(enemy)) continue;

        const dist = this.getDistance(proj.x, proj.y,
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2
        );

        if (dist <= proj.size + enemy.width / 2) {
          enemy.takeDamage(proj.damage);
          proj.hitEnemies.add(enemy);

          // 破甲效果
          if (Math.random() < proj.armorBreakChance) {
            enemy.applyArmorBreak(proj.armorBreakDuration);
          }

          // 处理穿透（穿透后伤害衰减）
          if (proj.pierce !== undefined && proj.pierce > 0) {
            proj.pierce--;
            proj.damage *= (1 - proj.pierceDamageDecay);
            if (proj.pierce <= 0) {
              this.projectiles.splice(index, 1);
              return;
            }
          } else {
            this.projectiles.splice(index, 1);
            return;
          }
        }
      }
      return;
    }

    // 燃烧瓶：到达目标位置后制造火海
    if (proj.type === WEAPON_TYPES.MOLOTOV) {
      const dist = this.getDistance(proj.x, proj.y, proj.targetX, proj.targetY);
      if (dist <= 10) {
        // 创建独立的火海效果投射物
        const fireField = {
          type: 'fire_field',
          x: proj.targetX,
          y: proj.targetY,
          radius: proj.fireRadius,
          duration: proj.fireDuration,
          damage: proj.fireField.damage,
          tickInterval: proj.fireField.tickInterval,
          lastTickTime: -1, // 初始值设为 -1，表示第一帧就造成伤害
          hitEnemies: new Set(),
          size: proj.fireRadius * 2,
          color: 'rgba(255, 69, 0, 0.3)'
        };
        this.projectiles.push(fireField);
        
        // 移除燃烧瓶投射物
        this.projectiles.splice(index, 1);
        return;
      }
    }

    // 声波震荡：环形扩散
    if (proj.type === WEAPON_TYPES.SOUND_SHOCK) {
      if (proj.radius < proj.maxRadius) {
        proj.radius += proj.expandSpeed;

        // 检测范围内敌人并击退
        for (const enemy of enemies) {
          if (!enemy.isActive || proj.hitEnemies.has(enemy)) continue;

          const dist = this.getDistance(proj.x, proj.y,
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2
          );

          if (dist <= proj.radius && dist >= proj.radius - proj.expandSpeed * 2) {
            enemy.takeDamage(proj.damage);
            proj.hitEnemies.add(enemy);

            // 击退效果
            const angle = Math.atan2(
              enemy.y + enemy.height / 2 - proj.y,
              enemy.x + enemy.width / 2 - proj.x
            );
            enemy.x += Math.cos(angle) * proj.knockbackDistance;
            enemy.y += Math.sin(angle) * proj.knockbackDistance;
          }
        }
      } else {
        // 扩散完成，移除
        this.projectiles.splice(index, 1);
        return;
      }
      return;
    }

    // 毒雾喷射：持续中毒伤害
    if (proj.type === WEAPON_TYPES.POISON_FOG) {
      if (proj.duration > 0) {
        proj.duration--;

        // 每 60 帧造成一次伤害
        const currentFrame = GameGlobal.databus.frame || 0;
        if (currentFrame - proj.lastTickTime >= proj.tickInterval) {
          proj.lastTickTime = currentFrame;

          for (const enemy of enemies) {
            if (!enemy.isActive) continue;

            const dist = this.getDistance(proj.x, proj.y,
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2
            );

            if (dist <= proj.radius) {
              const poisonDamage = proj.damage * proj.poisonDamageMultiplier;
              enemy.takeDamage(poisonDamage);
              // 中毒效果
              enemy.applyPoison(poisonDamage * 0.5, proj.poisonDuration);
            }
          }
        }
      } else {
        this.projectiles.splice(index, 1);
        return;
      }
      return;
    }

    // 碎石轰击：到达目标位置后造成伤害
    if (proj.type === WEAPON_TYPES.ROCK_BLAST && !proj.isFalling) {
      // 检测范围内的敌人
      for (const enemy of enemies) {
        if (!enemy.isActive || proj.hitEnemies.has(enemy)) continue;

        const dist = this.getDistance(proj.x, proj.y,
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2
        );

        if (dist <= proj.rockRadius) {
          enemy.takeDamage(proj.damage);
          proj.hitEnemies.add(enemy);
        }
      }

      // 添加碎石效果
      this.projectiles.push({
        type: 'rock_effect',
        x: proj.x,
        y: proj.y,
        radius: proj.rockRadius,
        duration: 20,
        size: proj.rockRadius,
        color: '#8b4513'
      });

      this.projectiles.splice(index, 1);
      return;
    }

    // 冰霜弹幕：冻结效果
    if (proj.type === WEAPON_TYPES.FROST_BARRAGE) {
      for (const enemy of enemies) {
        if (!enemy.isActive || proj.hitEnemies.has(enemy)) continue;

        const dist = this.getDistance(proj.x, proj.y,
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2
        );

        if (dist <= proj.size + enemy.width / 2) {
          enemy.takeDamage(proj.damage);
          proj.hitEnemies.add(enemy);

          // 冻结效果
          enemy.applyFreeze(proj.freezeDuration);
          enemy.freezeDamageBonus = proj.freezeDamageBonus;

          this.projectiles.splice(index, 1);
          return;
        }
      }
      return;
    }

    // 自爆无人机：追踪并爆炸
    if (proj.type === WEAPON_TYPES.SUICIDE_DRONE) {
      // 追踪逻辑
      if (proj.isHoming) {
        const nearestEnemy = this.findNearestEnemy(enemies);
        if (nearestEnemy) {
          const angleToTarget = Math.atan2(
            nearestEnemy.y + nearestEnemy.height / 2 - proj.y,
            nearestEnemy.x + nearestEnemy.width / 2 - proj.x
          );
          const currentAngle = Math.atan2(proj.vy, proj.vx);
          let angleDiff = angleToTarget - currentAngle;

          while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
          while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

          const turnAngle = Math.max(-proj.homingStrength, Math.min(proj.homingStrength, angleDiff));
          const newAngle = currentAngle + turnAngle;
          const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);

          proj.vx = Math.cos(newAngle) * speed;
          proj.vy = Math.sin(newAngle) * speed;
        }
      }

      // 碰撞检测
      for (const enemy of enemies) {
        if (!enemy.isActive) continue;

        const dist = this.getDistance(proj.x, proj.y,
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2
        );

        if (dist <= proj.size + enemy.width / 2) {
          // 爆炸
          for (const e of enemies) {
            if (!e.isActive) continue;

            const explosionDist = this.getDistance(proj.x, proj.y,
              e.x + e.width / 2,
              e.y + e.height / 2
            );

            if (explosionDist <= proj.explosionRadius) {
              e.takeDamage(proj.damage);
            }
          }

          this.projectiles.splice(index, 1);
          return;
        }
      }
      return;
    }

    // 引力漩涡：吸附并伤害
    if (proj.type === WEAPON_TYPES.GRAVITY_WHIRL) {
      if (proj.duration > 0) {
        proj.duration--;

        // 吸附和减速效果
        for (const enemy of enemies) {
          if (!enemy.isActive) continue;

          const dist = this.getDistance(proj.x, proj.y,
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2
          );

          if (dist <= proj.radius) {
            // 吸附效果
            const angle = Math.atan2(
              proj.y - (enemy.y + enemy.height / 2),
              proj.x - (enemy.x + enemy.width / 2)
            );
            enemy.x += Math.cos(angle) * proj.pullStrength;
            enemy.y += Math.sin(angle) * proj.pullStrength;

            // 减速效果
            enemy.slowed = true;
            enemy.slowEffect = proj.slowEffect;

            // 伤害
            const currentFrame = GameGlobal.databus.frame;
            if (currentFrame - proj.lastTickTime >= proj.tickInterval) {
              enemy.takeDamage(proj.damage);
            }
          }
        }

        const currentFrame = GameGlobal.databus.frame;
        if (currentFrame - proj.lastTickTime >= proj.tickInterval) {
          proj.lastTickTime = currentFrame;
        }
      } else {
        this.projectiles.splice(index, 1);
        return;
      }
      return;
    }

    // 反弹光刃：可反弹
    if (proj.type === WEAPON_TYPES.BOUNCE_BLADE) {
      for (const enemy of enemies) {
        if (!enemy.isActive || proj.hitEnemies.has(enemy)) continue;

        const dist = this.getDistance(proj.x, proj.y,
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2
        );

        if (dist <= proj.size + enemy.width / 2) {
          // 伤害递增
          const currentDamage = proj.damage * (1 + proj.currentBounce * proj.bounceDamageIncrease);
          enemy.takeDamage(currentDamage);
          proj.hitEnemies.add(enemy);

          this.projectiles.splice(index, 1);
          return;
        }
      }

      // 墙壁反弹检测（简化版：超出屏幕边界时反弹）
      const map = GameGlobal.databus.infiniteMap;
      if (map) {
        const screenX = proj.x - map.offsetX;
        const screenY = proj.y - map.offsetY;

        if (screenX <= 0 || screenX >= map.screenWidth ||
            screenY <= 0 || screenY >= map.screenHeight) {
          if (proj.currentBounce < proj.bounceCount) {
            // 反弹
            proj.vx = -proj.vx;
            proj.vy = -proj.vy;
            proj.currentBounce++;
            proj.hitEnemies.clear(); // 清空已击中记录，可以再次击中
          } else {
            this.projectiles.splice(index, 1);
            return;
          }
        }
      }
      return;
    }

    // 时间缓滞：范围减速
    if (proj.type === WEAPON_TYPES.TIME_STASIS) {
      if (proj.duration > 0) {
        proj.duration--;

        // 减速范围内敌人
        for (const enemy of enemies) {
          if (!enemy.isActive) continue;

          const dist = this.getDistance(proj.x, proj.y,
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2
          );

          if (dist <= proj.radius) {
            enemy.slowed = true;
            enemy.slowEffect = proj.slowEffect;
          }
        }
      } else {
        // 移除玩家加速效果
        this.player.speedBoostDuration = 0;
        this.player.speedBoostMultiplier = 1;
        this.projectiles.splice(index, 1);
        return;
      }
      return;
    }

    // 瞬移斩：瞬移后斩击
    if (proj.type === WEAPON_TYPES.BLINK_SLASH) {
      if (proj.targetEnemy && proj.targetEnemy.isActive) {
        // 秒杀判断
        const healthPercent = proj.targetEnemy.health / proj.targetEnemy.maxHealth;
        if (healthPercent <= proj.executeThreshold) {
          // 秒杀
          proj.targetEnemy.takeDamage(proj.targetEnemy.health);
        } else {
          // 正常伤害
          proj.targetEnemy.takeDamage(proj.damage);
        }

        // 范围伤害
        for (const enemy of enemies) {
          if (!enemy.isActive || enemy === proj.targetEnemy) continue;

          const dist = this.getDistance(proj.x, proj.y,
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2
          );

          if (dist <= proj.range) {
            enemy.takeDamage(proj.damage * 0.5);
          }
        }
      }

      this.projectiles.splice(index, 1);
      return;
    }

    // 只有带有 hitEnemies 属性的投射物才需要进行碰撞检测
    // 魔法弹药类（Magic Orb, Fire Ball, Axe）有 hitEnemies
    if (!proj.hitEnemies) {
      return;
    }

    // 检测与敌人的碰撞
    for (const enemy of enemies) {
      if (!enemy.isActive || proj.hitEnemies.has(enemy)) continue;

      const dist = this.getDistance(proj.x, proj.y,
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2
      );

      if (dist <= proj.size + enemy.width / 2) {
        enemy.takeDamage(proj.damage);
        proj.hitEnemies.add(enemy);

        // 处理穿透：检查是否还有穿透次数
        if (proj.pierce !== undefined && proj.pierce !== null && proj.pierce > 0) {
          proj.pierce--;
          // 如果穿透次数用完，移除投射物
          if (proj.pierce <= 0) {
            this.projectiles.splice(index, 1);
            return;
          }
          // 还有穿透次数，继续飞行
          return;
        } else if (proj.pierce === undefined || proj.pierce === null || proj.pierce <= 0) {
          // 没有穿透属性或穿透次数已用完，击中后消失
          this.projectiles.splice(index, 1);
          return;
        }

        // 检查是否支持弹射（只有指定的弹射技能且有弹射次数）
        if (proj.canBounce === true && proj.bounceCount !== undefined && proj.bounceCount > 0) {
          // 弹射到下一个敌人
          const nextTarget = this.findNearestEnemy(enemies, proj.hitEnemies);
          if (nextTarget) {
            // 计算弹射方向（指向下一个敌人）
            const targetX = nextTarget.x + nextTarget.width / 2;
            const targetY = nextTarget.y + nextTarget.height / 2;
            const angleToTarget = Math.atan2(targetY - proj.y, targetX - proj.x);

            // 更新投射物速度方向
            const speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);
            proj.vx = Math.cos(angleToTarget) * speed;
            proj.vy = Math.sin(angleToTarget) * speed;
            proj.trajectoryAngle = angleToTarget;

            // 减少弹射次数
            proj.bounceCount--;

            // 不移除投射物，继续飞行
            return;
          }
        }
      }
    }

    // 检测与场景道具的碰撞
    for (const obj of sceneObjects) {
      if (!obj.isActive) continue;

      const dist = this.getDistance(proj.x, proj.y,
        obj.x + obj.width / 2,
        obj.y + obj.height / 2
      );

      if (dist <= proj.size + Math.min(obj.width, obj.height) / 2) {
        obj.onAttacked();

        // 处理穿透：只有当 pierce 有值时才减少
        if (proj.pierce !== undefined && proj.pierce !== null && proj.pierce > 0) {
          proj.pierce--;
          if (proj.pierce <= 0) {
            this.projectiles.splice(index, 1);
            return;
          }
        } else {
          // 没有穿透属性，击中后消失
          this.projectiles.splice(index, 1);
          return;
        }
      }
    }
  }

  // 触发火球爆炸
  triggerExplosion(proj) {
    const enemies = GameGlobal.databus.enemies;
    const sceneObjects = GameGlobal.databus.sceneObjects || [];

    // 爆炸范围内的所有敌人受到伤害
    enemies.forEach(enemy => {
      if (!enemy.isActive) return;

      const dist = this.getDistance(proj.x, proj.y,
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2
      );

      if (dist <= proj.explosionRadius) {
        // 根据距离计算爆炸伤害衰减
        const distanceFactor = 1 - (dist / proj.explosionRadius) * 0.5; // 最小造成50%伤害
        const explosionDamage = proj.damage * distanceFactor;
        enemy.takeDamage(explosionDamage);
      }
    });

    // 爆炸范围内的场景道具受到伤害
    sceneObjects.forEach(obj => {
      if (!obj.isActive) return;

      const dist = this.getDistance(proj.x, proj.y,
        obj.x + obj.width / 2,
        obj.y + obj.height / 2
      );

      if (dist <= proj.explosionRadius) {
        obj.onAttacked();
      }
    });

    // 添加爆炸视觉效果
    this.projectiles.push({
      type: 'explosion_effect',
      x: proj.x,
      y: proj.y,
      radius: proj.explosionRadius,
      duration: 15,
      size: proj.explosionRadius * 2,
      color: 'rgba(255, 100, 0, 0.6)'
    });
  }

  // 触发雷电范围伤害
  triggerLightningDamage(proj, targetEnemy) {
    const enemies = GameGlobal.databus.enemies;

    // 雷电范围内的敌人受到伤害
    for (const enemy of enemies) {
      if (!enemy.isActive || enemy === targetEnemy) continue;

      const dist = this.getDistance(proj.x, proj.y,
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2
      );

      if (dist <= proj.lightningRadius) {
        // 连锁伤害
        const chainDamage = proj.damage * proj.chainDamageMultiplier;
        enemy.takeDamage(chainDamage);

        // 连锁到下一个敌人
        if (proj.chainCount > 0) {
          const nextTarget = this.findNearestEnemy(enemies, new Set([targetEnemy, enemy]));
          if (nextTarget) {
            const nextDist = this.getDistance(
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2,
              nextTarget.x + nextTarget.width / 2,
              nextTarget.y + nextTarget.height / 2
            );
            if (nextDist <= proj.chainRange) {
              nextTarget.takeDamage(chainDamage * 0.5);
              proj.chainCount--;
            }
          }
        }
      }
    }

    // 添加雷电视觉效果
    this.projectiles.push({
      type: 'lightning_effect',
      x: proj.x,
      y: proj.y,
      radius: proj.lightningRadius,
      duration: 10,
      size: proj.lightningRadius,
      color: 'rgba(255, 255, 0, 0.5)'
    });
  }

  findNearestEnemy(enemies, excludeSet = null, preferNear = null) {
    let nearest = null;
    let minDist = Infinity;

    // 获取玩家的地图坐标
    let playerCenterX, playerCenterY;
    if (GameGlobal.databus.infiniteMap) {
      const map = GameGlobal.databus.infiniteMap;
      playerCenterX = map.playerMapX + this.player.width / 2;
      playerCenterY = map.playerMapY + this.player.height / 2;
    } else {
      playerCenterX = this.player.x + this.player.width / 2;
      playerCenterY = this.player.y + this.player.height / 2;
    }

    enemies.forEach(enemy => {
      if (!enemy.isActive) return;
      if (excludeSet && excludeSet.has(enemy)) return;

      const dist = this.getDistance(
        playerCenterX,
        playerCenterY,
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2
      );

      if (preferNear) {
        const distToRef = this.getDistance(
          preferNear.x + preferNear.width / 2,
          preferNear.y + preferNear.height / 2,
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2
        );
        const weightedDist = dist * 0.7 + distToRef * 0.3;
        if (weightedDist < minDist) {
          minDist = weightedDist;
          nearest = enemy;
        }
      } else {
        if (dist < minDist) {
          minDist = dist;
          nearest = enemy;
        }
      }
    });

    return nearest;
  }

  // === 新增：增强的目标选择系统 ===
  
  // 目标选择策略枚举
  static TargetSelector = {
    NEAREST: 'nearest',           // 最近目标
    STRONGEST: 'strongest',       // 最强目标（血量最高）
    WEAKEST: 'weakest',           // 最弱目标（血量最低）
    RANDOM: 'random',             // 随机目标
    PLAYER_DIRECTION: 'direction',// 玩家朝向
    LOWEST_HP: 'lowest_hp',       // 血量百分比最低
    WITH_STATUS: 'with_status',   // 带有特定状态
    BY_TYPE: 'by_type'            // 特定类型
  };

  // 增强的目标选择方法
  findTarget(enemies, options = {}) {
    const {
      selector = WeaponSystem.TargetSelector.NEAREST,
      maxTargets = 1,
      range = Infinity,
      excludeSet = null,
      statusEffect = null,
      enemyType = null,
      referencePoint = null
    } = options;

    const validEnemies = enemies.filter(enemy => {
      if (!enemy.isActive) return false;
      if (excludeSet && excludeSet.has(enemy)) return false;
      
      // 范围限制
      if (range !== Infinity) {
        const refX = referencePoint ? referencePoint.x : 
                    (GameGlobal.databus.infiniteMap ? 
                      GameGlobal.databus.infiniteMap.playerMapX + this.player.width / 2 : 
                      this.player.x + this.player.width / 2);
        const refY = referencePoint ? referencePoint.y : 
                    (GameGlobal.databus.infiniteMap ? 
                      GameGlobal.databus.infiniteMap.playerMapY + this.player.height / 2 : 
                      this.player.y + this.player.height / 2);
        
        const dist = this.getDistance(refX, refY, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        if (dist > range) return false;
      }
      
      // 状态效果过滤
      if (statusEffect && (!enemy.activeEffects || !enemy.activeEffects.has(statusEffect))) {
        return false;
      }
      
      // 类型过滤
      if (enemyType && enemy.type !== enemyType) {
        return false;
      }
      
      return true;
    });

    if (validEnemies.length === 0) return maxTargets === 1 ? null : [];

    // 根据选择策略排序
    switch (selector) {
      case WeaponSystem.TargetSelector.NEAREST: {
        const refX = referencePoint ? referencePoint.x : 
                    (GameGlobal.databus.infiniteMap ? 
                      GameGlobal.databus.infiniteMap.playerMapX + this.player.width / 2 : 
                      this.player.x + this.player.width / 2);
        const refY = referencePoint ? referencePoint.y : 
                    (GameGlobal.databus.infiniteMap ? 
                      GameGlobal.databus.infiniteMap.playerMapY + this.player.height / 2 : 
                      this.player.y + this.player.height / 2);
        
        validEnemies.sort((a, b) => {
          const distA = this.getDistance(refX, refY, a.x + a.width / 2, a.y + a.height / 2);
          const distB = this.getDistance(refX, refY, b.x + b.width / 2, b.y + b.height / 2);
          return distA - distB;
        });
        break;
      }
      
      case WeaponSystem.TargetSelector.STRONGEST:
        validEnemies.sort((a, b) => b.health - a.health);
        break;
      
      case WeaponSystem.TargetSelector.WEAKEST:
      case WeaponSystem.TargetSelector.LOWEST_HP:
        validEnemies.sort((a, b) => {
          const hpPercentA = a.health / a.maxHealth;
          const hpPercentB = b.health / b.maxHealth;
          return hpPercentA - hpPercentB;
        });
        break;
      
      case WeaponSystem.TargetSelector.RANDOM:
        // 随机打乱
        for (let i = validEnemies.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [validEnemies[i], validEnemies[j]] = [validEnemies[j], validEnemies[i]];
        }
        break;
      
      case WeaponSystem.TargetSelector.PLAYER_DIRECTION:
        // 使用玩家朝向，已在攻击方法中处理
        break;
    }

    return maxTargets === 1 ? validEnemies[0] : validEnemies.slice(0, maxTargets);
  }

  // 查找连锁目标（用于闪电链等）
  findChainTargets(enemies, startTarget, chainCount, chainRange) {
    const targets = [startTarget];
    const visited = new Set([startTarget]);
    
    let currentTarget = startTarget;
    
    for (let i = 0; i < chainCount; i++) {
      const nextTarget = this.findNearestEnemy(enemies, visited, currentTarget);
      if (!nextTarget) break;
      
      const dist = this.getDistance(
        currentTarget.x + currentTarget.width / 2,
        currentTarget.y + currentTarget.height / 2,
        nextTarget.x + nextTarget.width / 2,
        nextTarget.y + nextTarget.height / 2
      );
      
      if (dist <= chainRange) {
        targets.push(nextTarget);
        visited.add(nextTarget);
        currentTarget = nextTarget;
      } else {
        break;
      }
    }
    
    return targets;
  }

  getDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  // === 新增技能实现函数 ===

  // 火球术：范围爆炸（半追踪）
  fireBallAttack(weapon) {
    const damage = this.calculateDamageWithElementBoost(weapon, weapon.currentStats.damage);
    const speed = weapon.currentStats.projectileSpeed;
    const range = weapon.currentStats.range + this.attackRangeMultiplier;
    const explosionRadius = weapon.currentStats.explosionRadius + this.skillAreaMultiplier;

    // 获取玩家地图坐标
    const playerCoords = this.getPlayerMapCoords();

    // 查找最近敌人作为弹道目标
    let targetEnemy = this.findNearestEnemy(GameGlobal.databus.enemies);
    let trajectoryAngle = this.player.lastMoveAngle || 0; // 默认使用角色朝向

    if (targetEnemy) {
      // 如果有敌人，弹道指向最近敌人
      trajectoryAngle = Math.atan2(
        targetEnemy.y + targetEnemy.height/2 - playerCoords.y,
        targetEnemy.x + targetEnemy.width/2 - playerCoords.x
      );
    }

    const basePierce = weapon.currentStats.pierce || 0;
    
    // 使用配置创建投射物
    const config = this.createProjectileConfig(WEAPON_TYPES.FIRE_BALL, {
      speed,
      damage,
      range,
      pierce: Math.floor(basePierce + this.penetrationMultiplier),
      bounce: Math.floor(this.bounceMultiplier),
      canBounce: true,
      hasWeight: false,
      size: 12,
      color: '#ff4400'
    });
    
    const projectile = this.createProjectile(config, playerCoords.x, playerCoords.y, trajectoryAngle, {
      explosionRadius,
      hasTarget: false // 标记为尚未确定目标，启用半锁敌追踪
    });
    
    this.projectiles.push(projectile);
  }

  // 冰风暴：减速+范围伤害（无锁定）
  iceStormAttack(weapon, enemies) {
    const damage = this.calculateDamageWithElementBoost(weapon, weapon.currentStats.damage);
    const radius = weapon.currentStats.radius + this.skillAreaMultiplier;
    const slowEffect = weapon.currentStats.slowEffect;
    const slowDuration = weapon.currentStats.slowDuration + this.durationMultiplier;

    // 获取玩家地图坐标
    const playerCoords = this.getPlayerMapCoords();

    enemies.forEach(enemy => {
      if (!enemy.isActive) return;

      const dist = this.getDistance(
        playerCoords.x,
        playerCoords.y,
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2
      );

      if (dist <= radius) {
        enemy.takeDamage(damage);
        // 应用减速效果
        if (enemy.applySlow) {
          enemy.applySlow(slowEffect, slowDuration);
        }
      }
    });

    // 添加视觉效果 - 天蓝色冰霜范围
    this.projectiles.push({
      type: WEAPON_TYPES.ICE_STORM,
      x: playerCoords.x,
      y: playerCoords.y,
      radius,
      damage,
      slowEffect,
      duration: 30,
      size: radius * 2,
      color: 'rgba(0, 200, 255, 0.15)'
    });
  }

  // 毒云：持续中毒伤害（地图随机释放，优先敌人方向）
  poisonCloudAttack(weapon, enemies) {
    const poisonDamage = this.calculateDamageWithElementBoost(weapon, weapon.currentStats.poisonDamage);
    const radius = weapon.currentStats.radius + this.skillAreaMultiplier;
    const poisonDuration = weapon.currentStats.poisonDuration + this.durationMultiplier;

    // 获取玩家地图坐标
    const playerCoords = this.getPlayerMapCoords();

    // 地图随机释放位置
    let cloudX, cloudY;

    // 查找最近的敌人方向
    const targetEnemy = this.findNearestEnemy(enemies);

    if (targetEnemy && weapon.baseStats.targetEnemyDirection) {
      // 优先在敌人方向释放
      const angleToEnemy = Math.atan2(
        targetEnemy.y + targetEnemy.height / 2 - playerCoords.y,
        targetEnemy.x + targetEnemy.width / 2 - playerCoords.x
      );

      // 在敌人方向距离玩家一定距离的位置
      const spawnDistance = 150 + Math.random() * 100; // 150-250像素
      cloudX = playerCoords.x + Math.cos(angleToEnemy) * spawnDistance;
      cloudY = playerCoords.y + Math.sin(angleToEnemy) * spawnDistance;
    } else {
      // 没有敌人时，地图随机位置释放
      if (GameGlobal.databus.infiniteMap) {
        const map = GameGlobal.databus.infiniteMap;
        cloudX = Math.random() * map.mapWidth;
        cloudY = Math.random() * map.mapHeight;
      } else {
        cloudX = Math.random() * SCREEN_WIDTH;
        cloudY = Math.random() * SCREEN_HEIGHT;
      }
    }

    // 确保在地图范围内
    if (GameGlobal.databus.infiniteMap) {
      const map = GameGlobal.databus.infiniteMap;
      cloudX = Math.max(0, Math.min(map.mapWidth, cloudX));
      cloudY = Math.max(0, Math.min(map.mapHeight, cloudY));
    } else {
      cloudX = Math.max(0, Math.min(SCREEN_WIDTH, cloudX));
      cloudY = Math.max(0, Math.min(SCREEN_HEIGHT, cloudY));
    }

    // 添加视觉效果 - 绿色毒云范围
    this.projectiles.push({
      type: WEAPON_TYPES.POISON_CLOUD,
      x: cloudX,
      y: cloudY,
      radius,
      duration: poisonDuration, // 毒云持续时间
      poisonDamage, // 每秒毒伤（在update中每帧造成poisonDamage/60伤害）
      size: radius * 2,
      color: 'rgba(50, 205, 50, 0.15)'
    });
  }

  // 护盾：临时无敌
  holyShieldAttack(weapon) {
    const duration = weapon.currentStats.duration + this.durationMultiplier;
    const damageReduction = weapon.currentStats.damageReduction;

    // 获取玩家地图坐标
    const playerCoords = this.getPlayerMapCoords();

    // 应用护盾效果到玩家
    if (this.player.applyShield) {
      this.player.applyShield(duration, damageReduction);
    }

    // 添加视觉效果 - 金色护盾范围
    this.projectiles.push({
      type: WEAPON_TYPES.HOLY_SHIELD,
      x: playerCoords.x,
      y: playerCoords.y,
      radius: 40,
      duration,
      size: 80,
      color: 'rgba(255, 230, 150, 0.2)'
    });
  }

  // 加速：移速提升
  speedBoostAttack(weapon) {
    const duration = weapon.currentStats.duration + this.durationMultiplier;
    const speedMultiplier = weapon.currentStats.speedMultiplier;

    // 获取玩家地图坐标
    const playerCoords = this.getPlayerMapCoords();

    // 应用加速效果到玩家
    if (this.player.applySpeedBoost) {
      this.player.applySpeedBoost(duration, speedMultiplier);
    }

    // 添加视觉效果 - 黄色加速范围
    this.projectiles.push({
      type: WEAPON_TYPES.SPEED_BOOST,
      x: playerCoords.x,
      y: playerCoords.y,
      duration: 30,
      size: 60,
      color: 'rgba(255, 255, 100, 0.15)'
    });
  }

  // 强击：伤害提升
  damageBoostAttack(weapon, enemies) {
    const duration = weapon.currentStats.duration + this.durationMultiplier;
    const damageMultiplier = weapon.currentStats.damageMultiplier;

    // 获取玩家地图坐标
    const playerCoords = this.getPlayerMapCoords();

    // 应用强击效果到玩家
    this.player.applyDamageBoost(duration, damageMultiplier);

    // 添加视觉效果 - 橙色增伤范围
    this.projectiles.push({
      type: WEAPON_TYPES.DAMAGE_BOOST,
      x: playerCoords.x,
      y: playerCoords.y,
      duration: 30,
      size: 60,
      color: 'rgba(255, 150, 50, 0.15)'
    });
  }

  // 治疗光环：持续回血（无锁定）
  healingAuraAttack(weapon) {
    const healAmount = weapon.currentStats.healAmount;
    const healInterval = weapon.currentStats.healInterval;
    const radius = weapon.currentStats.radius + this.skillAreaMultiplier;

    // 获取玩家地图坐标
    const playerCoords = this.getPlayerMapCoords();

    // 每间隔回血一次
    if (weapon.frameCounter % healInterval === 0) {
      this.player.heal(healAmount);
    }

    // 添加视觉效果 - 粉绿色治疗光环范围
    this.projectiles.push({
      type: WEAPON_TYPES.HEALING_AURA,
      x: playerCoords.x,
      y: playerCoords.y,
      radius,
      duration: 10,
      size: radius * 2,
      color: 'rgba(100, 255, 150, 0.15)'
    });
  }

  // Protection Aura: Damage reduction (no lock)
  protectionAuraAttack(weapon) {
    const damageReduction = weapon.currentStats.damageReduction;
    const radius = weapon.currentStats.radius + this.skillAreaMultiplier;

    // Apply damage reduction effect to player
    if (this.player.applyDamageReduction) {
      this.player.applyDamageReduction(damageReduction);
    }

    // 获取玩家地图坐标
    const playerCoords = this.getPlayerMapCoords();

    // 添加视觉效果 - 银色护甲光环范围
    this.projectiles.push({
      type: WEAPON_TYPES.PROTECTION_AURA,
      x: playerCoords.x,
      y: playerCoords.y,
      radius,
      duration: 10,
      size: radius * 2,
      color: 'rgba(180, 180, 200, 0.15)'
    });
  }

  // Mana Regen: Cooldown reduction aura (no lock)
  manaRegenAttack(weapon) {
    const cooldownReduction = weapon.currentStats.cooldownReduction || 1.0;
    const radius = weapon.currentStats.radius + this.skillAreaMultiplier;
    const duration = weapon.currentStats.duration || 300; // 默认 5 秒

    // 获取玩家地图坐标
    const playerCoords = this.getPlayerMapCoords();

    // 激活冷却光环状态
    this.manaRegenActive = true;
    this.manaRegenEndTime = GameGlobal.databus.frame + duration;

    // 减少所有其他武器的当前冷却时间
    this.weapons.forEach((w) => {
      if (w !== weapon && w.frameCounter > 0) {
        // 根据冷却缩减减少当前冷却时间
        const reduction = Math.floor(w.frameCounter * cooldownReduction);
        w.frameCounter = Math.max(0, w.frameCounter - reduction);
      }
    });

    // 添加视觉效果 - 蓝色冷却光环
    this.projectiles.push({
      type: WEAPON_TYPES.MANA_REGEN,
      x: playerCoords.x,
      y: playerCoords.y,
      radius: radius,
      size: radius * 2,
      duration: duration,
      color: '#0080ff',
      isActive: true
    });
  }

  // Teleport: Instant movement (random teleport after taking damage)
  teleportAttack(weapon) {
    const teleportDistance = weapon.currentStats.teleportDistance;

    // 获取玩家地图坐标
    const playerCoords = this.getPlayerMapCoords();

    // 随机角度
    const angle = Math.random() * Math.PI * 2;
    const newMapX = playerCoords.x + Math.cos(angle) * teleportDistance;
    const newMapY = playerCoords.y + Math.sin(angle) * teleportDistance;

    if (GameGlobal.databus.infiniteMap) {
      const map = GameGlobal.databus.infiniteMap;
      // 限制在地图范围内
      map.playerMapX = Math.max(0, Math.min(map.mapWidth - this.player.width, newMapX));
      map.playerMapY = Math.max(0, Math.min(map.mapHeight - this.player.height, newMapY));
      // 更新地图偏移量
      map.offsetX = SCREEN_WIDTH / 2 - map.playerMapX - this.player.width / 2;
      map.offsetY = SCREEN_HEIGHT / 2 - map.playerMapY - this.player.height / 2;
    } else {
      // 限制在屏幕范围内
      this.player.x = Math.max(0, Math.min(SCREEN_WIDTH - this.player.width, newMapX));
      this.player.y = Math.max(0, Math.min(SCREEN_HEIGHT - this.player.height, newMapY));
    }

    // 获取传送后的坐标
    const afterTeleportCoords = this.getPlayerMapCoords();

    // 添加视觉效果（临时禁用以避免透明框干扰）
    // this.projectiles.push({
    //   type: WEAPON_TYPES.TELEPORT,
    //   x: afterTeleportCoords.x,
    //   y: afterTeleportCoords.y,
    //   duration: 20,
    //   size: 60,
    //   color: 'rgba(255, 0, 255, 0.5)'
    // });
  }

  // 时间减速：敌人减速（无锁定）
  timeSlowAttack(weapon, enemies) {
    const slowMultiplier = weapon.currentStats.slowMultiplier;
    const radius = weapon.currentStats.radius + this.skillAreaMultiplier;
    const slowDuration = weapon.currentStats.duration + this.durationMultiplier;

    // 获取玩家地图坐标
    const playerCoords = this.getPlayerMapCoords();

    enemies.forEach(enemy => {
      if (!enemy.isActive) return;

      const dist = this.getDistance(
        playerCoords.x,
        playerCoords.y,
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2
      );

      if (dist <= radius) {
        // 应用减速效果
        if (enemy.applySlow) {
          enemy.applySlow(slowMultiplier, slowDuration);
        }
      }
    });

    // 添加视觉效果 - 蓝色时间减速范围
    this.projectiles.push({
      type: WEAPON_TYPES.TIME_SLOW,
      x: playerCoords.x,
      y: playerCoords.y,
      radius,
      duration: 30,
      size: radius * 2,
      color: 'rgba(0, 100, 255, 0.15)'
    });
  }

  // Trap: Place traps, enemies trigger
  trapAttack(weapon) {
    // Check current trap count
    const currentTraps = this.projectiles.filter(p => p.type === WEAPON_TYPES.TRAP && p.active).length;
    const maxTraps = (weapon.currentStats.maxTraps || 2) + (this.trapMasterBonus || 0);

    if (currentTraps >= maxTraps) {
      // Remove oldest trap
      const trapIndex = this.projectiles.findIndex(p => p.type === WEAPON_TYPES.TRAP && p.active);
      if (trapIndex !== -1) {
        this.projectiles.splice(trapIndex, 1);
      }
    }

    let damage = weapon.currentStats.damage * this.damageMultiplier;
    // 陷阱大师伤害加成
    if (this.trapDamageBonus) {
      damage *= (1 + this.trapDamageBonus);
    }
    const trapRadius = weapon.currentStats.trapRadius;
    const triggerRadius = weapon.currentStats.triggerRadius;

    let trapX, trapY;

    // Check if using infinite map
    if (GameGlobal.databus.infiniteMap) {
      const map = GameGlobal.databus.infiniteMap;
      const playerMapX = map.playerMapX;
      const playerMapY = map.playerMapY;

      // Place trap in random position around player (not entire map)
      if (weapon.baseStats.randomSpawn) {
        // Random position within 150 pixels of player
        const range = weapon.baseStats.range || 150;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * range;
        trapX = playerMapX + Math.cos(angle) * distance;
        trapY = playerMapY + Math.sin(angle) * distance;
      } else {
        // Place trap in front of player (using map coordinates)
        let angle = this.player.lastMoveAngle || 0;
        trapX = playerMapX + Math.cos(angle) * 50;
        trapY = playerMapY + Math.sin(angle) * 50;
      }

      // Ensure trap is within map boundaries
      trapX = Math.max(0, Math.min(map.mapWidth, trapX));
      trapY = Math.max(0, Math.min(map.mapHeight, trapY));
    } else {
      // Not using infinite map, use screen coordinates
      if (weapon.baseStats.randomSpawn) {
        trapX = Math.random() * SCREEN_WIDTH;
        trapY = Math.random() * SCREEN_HEIGHT;
      } else {
        // Place trap in front of player
        let angle = this.player.lastMoveAngle || 0;
        trapX = this.player.x + Math.cos(angle) * 50;
        trapY = this.player.y + Math.sin(angle) * 50;
      }

      // Ensure trap is within screen
      trapX = Math.max(0, Math.min(SCREEN_WIDTH, trapX));
      trapY = Math.max(0, Math.min(SCREEN_HEIGHT, trapY));
    }

    this.projectiles.push({
      type: WEAPON_TYPES.TRAP,
      x: trapX,
      y: trapY,
      damage,
      trapRadius,
      triggerRadius,
      explosionRadius: trapRadius, // 爆炸范围等于陷阱半径
      active: true,
      size: 30,
      color: '#ff0000', // 红色
      duration: 600 // 陷阱持续 10 秒（600 帧）
    });
  }

  // 检查陷阱触发
  checkTrapTrigger() {
    const enemies = GameGlobal.databus.enemies;
    const traps = this.projectiles.filter(p => p.type === WEAPON_TYPES.TRAP && p.active);

    traps.forEach(trap => {
      for (const enemy of enemies) {
        if (!enemy.isActive) continue;

        const dist = this.getDistance(trap.x, trap.y,
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2
        );

        if (dist <= trap.triggerRadius + enemy.width / 2) {
          // 触发陷阱爆炸，对范围内所有敌人造成伤害
          this.triggerTrapExplosion(trap);
          trap.active = false;

          // 陷阱触发后消失
          const trapIndex = this.projectiles.indexOf(trap);
          if (trapIndex !== -1) {
            this.projectiles.splice(trapIndex, 1);
          }
          break;
        }
      }
    });
  }

  // 触发陷阱爆炸（范围伤害）
  triggerTrapExplosion(trap) {
    const enemies = GameGlobal.databus.enemies;
    const sceneObjects = GameGlobal.databus.sceneObjects || [];

    // 爆炸范围内的所有敌人受到伤害
    enemies.forEach(enemy => {
      if (!enemy.isActive) return;

      const dist = this.getDistance(trap.x, trap.y,
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2
      );

      if (dist <= trap.explosionRadius) {
        enemy.takeDamage(trap.damage);
      }
    });

    // 爆炸范围内的场景道具受到伤害
    sceneObjects.forEach(obj => {
      if (!obj.isActive) return;

      const dist = this.getDistance(trap.x, trap.y,
        obj.x + obj.width / 2,
        obj.y + obj.height / 2
      );

      if (dist <= trap.explosionRadius) {
        obj.onAttacked();
      }
    });

    // 添加爆炸视觉效果
    this.projectiles.push({
      type: 'trap_explosion_effect',
      x: trap.x,
      y: trap.y,
      radius: trap.explosionRadius,
      duration: 15,
      size: trap.explosionRadius * 2,
      color: 'rgba(255, 0, 0, 0.6)'
    });
  }

  boostDamage(value) {
    this.damageMultiplier *= (1 + value);
  }

  boostAttackSpeed(value) {
    this.attackSpeedMultiplier *= (1 + value);
  }

  boostAttackRange(value) {
    this.attackRangeMultiplier += value;
  }

  boostSkillArea(value) {
    this.skillAreaMultiplier += value;
  }

  // 保留boostArea以兼容旧代码
  boostArea(value) {
    this.attackRangeMultiplier += value;
  }

  boostProjectileCount(value) {
    this.projectileCountMultiplier += value;
  }

  boostExtraSalvo(value) {
    this.extraSalvoMultiplier += value;
  }

  boostCooldownReduction(value) {
    // 使用加法避免重复选择时快速增加
    // 例如：0.1 + 0.1 = 0.2（20%冷却缩减）而不是 1.1 * 1.1 = 1.21
    this.cooldownReductionMultiplier += value;
  }

  boostDuration(value) {
    this.durationMultiplier += value;
  }

  boostPenetration(value) {
    this.penetrationMultiplier += value;
  }

  boostBounce(value) {
    this.bounceMultiplier += value;
  }

  hasWeight(type) {
    const weapon = this.weapons.get(type);
    return weapon && weapon.baseStats.hasWeight === true;
  }

  getAttackSpeedMultiplierForWeapon(type) {
    let multiplier = this.attackSpeedMultiplier;
    if (this.quickReloadBoost && this.hasWeight(type)) {
      multiplier *= 1.15; // 有重量弹药攻速+15%
    }
    return multiplier;
  }

  getCooldownReductionForWeapon(type) {
    let reduction = this.cooldownReductionMultiplier;
    if (this.quickReloadBoost && this.hasWeight(type)) {
      reduction *= 0.9; // 冷却-10% (乘以0.9)
    }
    return reduction;
  }

  isBouncingSkill(type) {
    const bouncingSkills = [
      WEAPON_TYPES.ARMOR_PIERCE_SHOT,  // 穿甲霰弹
      WEAPON_TYPES.FROST_BARRAGE,       // 冰霜弹幕
      WEAPON_TYPES.VAMPIRE_DART,        // 吸血飞镖
      WEAPON_TYPES.MAGIC_ORB,           // 魔法弹
      WEAPON_TYPES.LIGHTNING            // 闪电链（使用chainCount）
    ];
    return bouncingSkills.includes(type);
  }

  isElementalWeapon(type) {
    const elementalTypes = [
      WEAPON_TYPES.FIRE_BALL,
      WEAPON_TYPES.MOLOTOV,
      WEAPON_TYPES.LAVA_FIST,
      WEAPON_TYPES.ICE_STORM,
      WEAPON_TYPES.FROST_BARRAGE,
      WEAPON_TYPES.LIGHTNING,
      WEAPON_TYPES.THUNDER_ORB,
      WEAPON_TYPES.POISON_CLOUD,
      WEAPON_TYPES.POISON_FOG,
      WEAPON_TYPES.ROCK_BLAST
    ];
    return elementalTypes.includes(type);
  }

  calculateDamageWithElementBoost(weapon, baseDamage) {
    let finalDamage = baseDamage * this.damageMultiplier;
    if (this.elementDamageBoost > 0 && this.isElementalWeapon(weapon.type)) {
      finalDamage *= (1 + this.elementDamageBoost);
    }
    return finalDamage;
  }

  // === 新增技能攻击方法 ===

  // 雷暴弹：锁定类魔法弹，命中触发雷电范围伤害
  thunderOrbAttack(weapon, enemies) {
    const count = weapon.currentStats.projectileCount + this.projectileCountMultiplier;
    const damage = this.calculateDamageWithElementBoost(weapon, weapon.currentStats.damage);
    const speed = weapon.currentStats.projectileSpeed;
    const range = weapon.currentStats.range + this.attackRangeMultiplier;
    const lightningRadius = weapon.currentStats.lightningRadius + this.skillAreaMultiplier;
    const chainCount = weapon.currentStats.chainCount;
    const chainDamage = damage * weapon.currentStats.chainDamageMultiplier;
    const chainRange = weapon.currentStats.chainRange;

    const playerCoords = this.getPlayerMapCoords();
    let targetEnemy = this.findNearestEnemy(enemies);
    let trajectoryAngle = this.player.lastMoveAngle || 0;

    if (targetEnemy) {
      trajectoryAngle = Math.atan2(
        targetEnemy.y + targetEnemy.height/2 - playerCoords.y,
        targetEnemy.x + targetEnemy.width/2 - playerCoords.x
      );
    }

    for (let i = 0; i < count; i++) {
      const spreadAngle = (Math.PI / 6) * (i - Math.floor(count / 2));
      const finalAngle = trajectoryAngle + spreadAngle;

      // 使用配置创建投射物
      const config = this.createProjectileConfig(WEAPON_TYPES.THUNDER_ORB, {
        speed,
        damage,
        range,
        size: 15, // 增加大小以便观察
        color: '#ffff00',
        hasWeight: false
      });
      
      const projectile = this.createProjectile(config, playerCoords.x, playerCoords.y, finalAngle, {
        lightningRadius,
        chainCount,
        chainDamage,
        chainRange,
        hasTarget: false
      });
      
      this.projectiles.push(projectile);
    }
  }

  // 穿甲霰弹：多发穿甲霰弹
  armorPierceShotAttack(weapon, enemies) {
    const baseCount = weapon.currentStats.projectileCount || 3;
    const count = baseCount + this.projectileCountMultiplier;
    const damage = weapon.currentStats.damage * this.damageMultiplier;
    const speed = weapon.currentStats.projectileSpeed;
    const range = weapon.currentStats.range + this.attackRangeMultiplier;
    const pierce = weapon.currentStats.pierce + this.penetrationMultiplier;
    const pierceDamageDecay = weapon.currentStats.pierceDamageDecay;
    const spreadAngle = weapon.currentStats.spreadAngle;

    const playerCoords = this.getPlayerMapCoords();
    let targetEnemy = this.findNearestEnemy(enemies);
    let trajectoryAngle = this.player.lastMoveAngle || 0;

    if (targetEnemy) {
      trajectoryAngle = Math.atan2(
        targetEnemy.y + targetEnemy.height/2 - playerCoords.y,
        targetEnemy.x + targetEnemy.width/2 - playerCoords.x
      );
    }

    for (let i = 0; i < count; i++) {
      const spread = spreadAngle * (i - (count - 1) / 2);
      const finalAngle = trajectoryAngle + spread;

      // 使用配置创建投射物
      const config = this.createProjectileConfig(WEAPON_TYPES.ARMOR_PIERCE_SHOT, {
        speed,
        damage,
        pierce,
        range,
        bounce: Math.floor(this.bounceMultiplier),
        canBounce: weapon.currentStats.canBounce || false,
        hasWeight: weapon.currentStats.hasWeight || false,
        size: 6,
        color: '#ff8c00'
      });
      
      const projectile = this.createProjectile(config, playerCoords.x, playerCoords.y, finalAngle, {
        pierceDamageDecay,
        armorBreakChance: weapon.currentStats.armorBreakChance,
        armorBreakDuration: weapon.currentStats.armorBreakDuration,
        hasTarget: false
      });
      
      this.projectiles.push(projectile);
    }
  }

  // 吸血飞镖：多发吸血飞镖
  vampireDartAttack(weapon, enemies) {
    const baseCount = weapon.currentStats.projectileCount || 5;
    const count = baseCount + this.projectileCountMultiplier;
    const baseDamage = weapon.currentStats.damage * this.damageMultiplier;
    const damagePerDart = baseDamage * weapon.currentStats.damagePerDart;
    const speed = weapon.currentStats.projectileSpeed;
    const range = weapon.currentStats.range + this.attackRangeMultiplier;
    const lifeStealPercent = weapon.currentStats.lifeStealPercent;

    const playerCoords = this.getPlayerMapCoords();
    let targetEnemy = this.findNearestEnemy(enemies);
    let trajectoryAngle = this.player.lastMoveAngle || 0;

    if (targetEnemy) {
      trajectoryAngle = Math.atan2(
        targetEnemy.y + targetEnemy.height/2 - playerCoords.y,
        targetEnemy.x + targetEnemy.width/2 - playerCoords.x
      );
    }

    for (let i = 0; i < count; i++) {
      const spreadAngle = (Math.PI / 8) * (i - Math.floor(count / 2));
      const finalAngle = trajectoryAngle + spreadAngle;

      // 使用配置创建投射物
      const config = this.createProjectileConfig(WEAPON_TYPES.VAMPIRE_DART, {
        speed,
        damage: damagePerDart,
        range,
        bounce: Math.floor(this.bounceMultiplier),
        canBounce: weapon.currentStats.canBounce || false,
        hasWeight: weapon.currentStats.hasWeight || false,
        size: 5,
        color: '#8b0000'
      });
      
      const projectile = this.createProjectile(config, playerCoords.x, playerCoords.y, finalAngle, {
        lifeStealPercent,
        hasTarget: false
      });
      
      this.projectiles.push(projectile);
    }
  }

  // 燃烧瓶：投掷燃烧瓶，制造火海
  molotovAttack(weapon) {
    const damage = this.calculateDamageWithElementBoost(weapon, weapon.currentStats.damage);
    const fireRadius = weapon.currentStats.fireRadius + this.skillAreaMultiplier;
    const fireDuration = weapon.currentStats.fireDuration + this.durationMultiplier;
    const range = weapon.currentStats.range + this.attackRangeMultiplier;

    const playerCoords = this.getPlayerMapCoords();
    const trajectoryAngle = this.player.lastMoveAngle || 0;

    // 在前方随机位置放置火海
    const randomDistance = range * (0.5 + Math.random() * 0.5);
    const randomAngle = trajectoryAngle + (Math.random() - 0.5) * Math.PI / 4;

    const targetX = playerCoords.x + Math.cos(randomAngle) * randomDistance;
    const targetY = playerCoords.y + Math.sin(randomAngle) * randomDistance;

    const projectile = {
      type: WEAPON_TYPES.MOLOTOV,
      x: playerCoords.x,
      y: playerCoords.y,
      startX: playerCoords.x,
      startY: playerCoords.y,
      targetX,
      targetY,
      damage,
      fireRadius,
      fireDuration,
      range,
      hitEnemies: new Set(),
      size: 12,
      color: '#ff4500',
      hasTarget: true,
      hasWeight: true,
      isAreaEffect: true,
      fireField: {
        x: targetX,
        y: targetY,
        radius: fireRadius,
        duration: fireDuration,
        damage: damage * weapon.currentStats.fireDamageMultiplier,
        tickInterval: 60,
        lastTickTime: 0,
        hitEnemies: new Set()
      }
    };
    this.projectiles.push(projectile);
  }

  // 声波震荡：环形声波击退敌人
  soundShockAttack(weapon) {
    const damage = weapon.currentStats.damage * this.damageMultiplier;
    const radius = weapon.currentStats.radius + this.skillAreaMultiplier;
    const knockbackDistance = weapon.currentStats.knockbackDistance;
    const range = weapon.currentStats.range + this.attackRangeMultiplier;

    const playerCoords = this.getPlayerMapCoords();

    // 创建环形声波效果
    const shockwave = {
      type: WEAPON_TYPES.SOUND_SHOCK,
      x: playerCoords.x,
      y: playerCoords.y,
      radius: 0,
      maxRadius: radius,
      expandSpeed: 8,
      damage,
      knockbackDistance,
      range,
      hitEnemies: new Set(),
      size: 20,
      color: '#00ffff',
      hasTarget: false,
      hasWeight: false,
      isAreaEffect: true
    };
    this.projectiles.push(shockwave);
  }

  // 毒雾喷射：向敌人喷射毒雾
  poisonFogAttack(weapon, enemies) {
    const damage = this.calculateDamageWithElementBoost(weapon, weapon.currentStats.damage);
    const fogRadius = weapon.currentStats.fogRadius + this.skillAreaMultiplier;
    const fogDuration = weapon.currentStats.fogDuration + this.durationMultiplier;
    const poisonDuration = weapon.currentStats.poisonDuration;
    const range = weapon.currentStats.range + this.attackRangeMultiplier;

    const playerCoords = this.getPlayerMapCoords();
    let targetEnemy = this.findNearestEnemy(enemies);
    let trajectoryAngle = this.player.lastMoveAngle || 0;

    if (targetEnemy) {
      trajectoryAngle = Math.atan2(
        targetEnemy.y + targetEnemy.height/2 - playerCoords.y,
        targetEnemy.x + targetEnemy.width/2 - playerCoords.x
      );
    }

    // 在敌人位置释放毒雾
    const fogDistance = range * 0.7;
    const fogX = playerCoords.x + Math.cos(trajectoryAngle) * fogDistance;
    const fogY = playerCoords.y + Math.sin(trajectoryAngle) * fogDistance;

    const poisonFog = {
      type: WEAPON_TYPES.POISON_FOG,
      x: fogX,
      y: fogY,
      radius: fogRadius,
      duration: fogDuration,
      damage,
      poisonDamageMultiplier: weapon.currentStats.poisonDamageMultiplier,
      poisonDuration,
      tickInterval: 60,
      lastTickTime: -1, // 初始值设为 -1，表示第一帧就造成伤害
      hitEnemies: new Set(),
      size: fogRadius,
      color: '#00ff00',
      hasTarget: false,
      hasWeight: false,
      isAreaEffect: true
    };
    this.projectiles.push(poisonFog);
  }

  // 碎石轰击：随机碎石砸落
  rockBlastAttack(weapon) {
    const damage = this.calculateDamageWithElementBoost(weapon, weapon.currentStats.damage);
    const rockCount = weapon.currentStats.rockCount;
    const rockRadius = weapon.currentStats.rockRadius;
    const range = weapon.currentStats.range + this.attackRangeMultiplier;
    const damageMultiplier = weapon.currentStats.damageMultiplier;

    const playerCoords = this.getPlayerMapCoords();

    for (let i = 0; i < rockCount; i++) {
      // 随机位置砸落
      const randomAngle = Math.random() * Math.PI * 2;
      const randomDistance = Math.random() * range;

      const targetX = playerCoords.x + Math.cos(randomAngle) * randomDistance;
      const targetY = playerCoords.y + Math.sin(randomAngle) * randomDistance;

      const rock = {
        type: WEAPON_TYPES.ROCK_BLAST,
        x: targetX,
        y: targetY - 300, // 从高处砸落
        targetX,
        targetY,
        damage: damage * damageMultiplier,
        rockRadius,
        range,
        hitEnemies: new Set(),
        size: rockRadius,
        color: '#8b4513',
        hasTarget: false,
        hasWeight: false,
        isFalling: true,
        fallSpeed: 15
      };
      this.projectiles.push(rock);
    }
  }

  // 冰霜弹幕：发射多枚冰弹
  frostBarrageAttack(weapon, enemies) {
    const baseCount = weapon.currentStats.projectileCount || 8;
    const count = baseCount + this.projectileCountMultiplier;
    const damage = this.calculateDamageWithElementBoost(weapon, weapon.currentStats.damage);
    const speed = weapon.currentStats.projectileSpeed;
    const range = weapon.currentStats.range + this.attackRangeMultiplier;
    const freezeDuration = weapon.currentStats.freezeDuration;
    const freezeDamageBonus = weapon.currentStats.freezeDamageBonus;

    const playerCoords = this.getPlayerMapCoords();

    for (let i = 0; i < count; i++) {
      // 随机方向发射
      const randomAngle = Math.random() * Math.PI * 2;

      // 使用配置创建投射物
      const config = this.createProjectileConfig(WEAPON_TYPES.FROST_BARRAGE, {
        speed,
        damage,
        range,
        bounce: Math.floor(this.bounceMultiplier),
        canBounce: weapon.currentStats.canBounce || false,
        hasWeight: weapon.currentStats.hasWeight || false,
        size: 8,
        color: '#00bfff'
      });
      
      const projectile = this.createProjectile(config, playerCoords.x, playerCoords.y, randomAngle, {
        freezeDuration,
        freezeDamageBonus,
        hasTarget: false
      });
      
      this.projectiles.push(projectile);
    }
  }

  // 自爆无人机：追踪并自爆
  suicideDroneAttack(weapon, enemies) {
    const damage = weapon.currentStats.damage * this.damageMultiplier;
    const speed = weapon.currentStats.projectileSpeed;
    const explosionRadius = weapon.currentStats.explosionRadius + this.skillAreaMultiplier;
    const explosionDamage = damage * weapon.currentStats.explosionDamageMultiplier;
    const attractDuration = weapon.currentStats.attractDuration;
    const range = weapon.currentStats.range + this.attackRangeMultiplier;

    const playerCoords = this.getPlayerMapCoords();
    let targetEnemy = this.findNearestEnemy(enemies);
    let trajectoryAngle = this.player.lastMoveAngle || 0;

    if (targetEnemy) {
      trajectoryAngle = Math.atan2(
        targetEnemy.y + targetEnemy.height/2 - playerCoords.y,
        targetEnemy.x + targetEnemy.width/2 - playerCoords.x
      );
    }

    // 使用配置创建投射物
    const config = this.createProjectileConfig(WEAPON_TYPES.SUICIDE_DRONE, {
      speed,
      damage: explosionDamage,
      range,
      size: 15,
      color: '#ff6347',
      hasWeight: true
    });
    
    const drone = this.createProjectile(config, playerCoords.x, playerCoords.y, trajectoryAngle, {
      explosionRadius,
      attractDuration,
      hasTarget: false,
      isHoming: true,
      homingStrength: 0.05
    });
    
    this.projectiles.push(drone);
  }

  // 引力漩涡：吸附敌人
  gravityWhirlAttack(weapon) {
    const damage = weapon.currentStats.damage * this.damageMultiplier;
    const radius = weapon.currentStats.radius + this.skillAreaMultiplier;
    const duration = weapon.currentStats.duration + this.durationMultiplier;
    const slowEffect = weapon.currentStats.slowEffect;
    const pullStrength = weapon.currentStats.pullStrength;
    const tickInterval = weapon.currentStats.tickInterval;
    const range = weapon.currentStats.range + this.attackRangeMultiplier;

    const playerCoords = this.getPlayerMapCoords();
    const trajectoryAngle = this.player.lastMoveAngle || 0;

    // 在前方释放引力场
    const fieldDistance = range;
    const fieldX = playerCoords.x + Math.cos(trajectoryAngle) * fieldDistance;
    const fieldY = playerCoords.y + Math.sin(trajectoryAngle) * fieldDistance;

    const gravityField = {
      type: WEAPON_TYPES.GRAVITY_WHIRL,
      x: fieldX,
      y: fieldY,
      radius,
      duration,
      damage,
      slowEffect,
      pullStrength,
      tickInterval,
      lastTickTime: 0,
      hitEnemies: new Set(),
      size: radius,
      color: '#9400d3',
      hasTarget: false,
      hasWeight: false,
      isAreaEffect: true
    };
    this.projectiles.push(gravityField);
  }

  // 反弹光刃：可反弹的光刃
  bounceBladeAttack(weapon, enemies) {
    const damage = weapon.currentStats.damage * this.damageMultiplier;
    const speed = weapon.currentStats.projectileSpeed;
    const bounceCount = weapon.currentStats.bounceCount + this.bounceMultiplier;
    const bounceDamageIncrease = weapon.currentStats.bounceDamageIncrease;
    const range = weapon.currentStats.range + this.attackRangeMultiplier;

    const playerCoords = this.getPlayerMapCoords();
    let targetEnemy = this.findNearestEnemy(enemies);
    let trajectoryAngle = this.player.lastMoveAngle || 0;

    if (targetEnemy) {
      trajectoryAngle = Math.atan2(
        targetEnemy.y + targetEnemy.height/2 - playerCoords.y,
        targetEnemy.x + targetEnemy.width/2 - playerCoords.x
      );
    }

    // 使用配置创建投射物
    const config = this.createProjectileConfig(WEAPON_TYPES.BOUNCE_BLADE, {
      speed,
      damage,
      range,
      size: 12,
      color: '#ffd700',
      hasWeight: weapon.currentStats.hasWeight || false
    });
    
    const blade = this.createProjectile(config, playerCoords.x, playerCoords.y, trajectoryAngle, {
      bounceCount,
      bounceDamageIncrease,
      currentBounce: 0,
      hasTarget: false,
      canBounce: false // 反弹光刃虽然是特殊技能，但不使用通用弹射逻辑
    });
    
    this.projectiles.push(blade);
  }

  // 时间缓滞：强减速+自身加速
  timeStasisAttack(weapon) {
    const radius = weapon.currentStats.radius + this.skillAreaMultiplier;
    const duration = weapon.currentStats.duration + this.durationMultiplier;
    const slowEffect = weapon.currentStats.slowEffect;
    const selfSpeedBoost = weapon.currentStats.selfSpeedBoost;
    const range = weapon.currentStats.range + this.attackRangeMultiplier;

    const playerCoords = this.getPlayerMapCoords();

    const timeField = {
      type: WEAPON_TYPES.TIME_STASIS,
      x: playerCoords.x,
      y: playerCoords.y,
      radius,
      duration,
      slowEffect,
      selfSpeedBoost,
      range,
      hitEnemies: new Set(),
      size: radius,
      color: '#e6e6fa',
      hasTarget: false,
      hasWeight: false,
      isAreaEffect: true
    };
    this.projectiles.push(timeField);

    // 给玩家加速
    this.player.speedBoostDuration = duration;
    this.player.speedBoostMultiplier = 1 + selfSpeedBoost;
  }

  // 瞬移斩：瞬移背后斩击
  blinkSlashAttack(weapon, enemies) {
    const damage = weapon.currentStats.damage * this.damageMultiplier;
    const damageMultiplier = weapon.currentStats.damageMultiplier;
    const invincibleDuration = weapon.currentStats.invincibleDuration;
    const executeThreshold = weapon.currentStats.executeThreshold;
    const range = weapon.currentStats.range + this.attackRangeMultiplier;

    const playerCoords = this.getPlayerMapCoords();
    let targetEnemy = this.findNearestEnemy(enemies);

    if (targetEnemy) {
      // 瞬移到敌人背后
      const angle = Math.atan2(
        targetEnemy.y + targetEnemy.height/2 - playerCoords.y,
        targetEnemy.x + targetEnemy.width/2 - playerCoords.x
      );
      const behindAngle = angle + Math.PI;

      const blinkX = targetEnemy.x + targetEnemy.width/2 + Math.cos(behindAngle) * 50;
      const blinkY = targetEnemy.y + targetEnemy.height/2 + Math.sin(behindAngle) * 50;

      // 使用配置创建投射物
      const config = this.createProjectileConfig(WEAPON_TYPES.BLINK_SLASH, {
        damage: damage * damageMultiplier,
        range: 80,
        size: 50,
        color: '#ff1493',
        hasWeight: false
      });
      
      const slash = this.createProjectile(config, blinkX, blinkY, 0, {
        invincibleDuration,
        executeThreshold,
        hasTarget: false,
        isAreaEffect: true,
        targetEnemy
      });
      
      this.projectiles.push(slash);

      // 给玩家无敌
      this.player.invincibleDuration = invincibleDuration;
    }
  }

  // 熔岩拳套：下次普攻变为范围拳击
  lavaFistAttack(weapon) {
    const damage = this.calculateDamageWithElementBoost(weapon, weapon.currentStats.damage);
    const damageMultiplier = weapon.currentStats.damageMultiplier;
    const radius = weapon.currentStats.radius + this.skillAreaMultiplier;
    const burnDamageMultiplier = weapon.currentStats.burnDamageMultiplier;
    const burnDuration = weapon.currentStats.burnDuration;

    // 标记玩家下次攻击为熔岩拳击
    this.player.lavaFistReady = true;
    this.player.lavaFistDamage = damage * damageMultiplier;
    this.player.lavaFistRadius = radius;
    this.player.lavaFistBurnDamage = damage * burnDamageMultiplier;
    this.player.lavaFistBurnDuration = burnDuration;
  }

  // 渲染范围技能（在玩家渲染时调用，使用屏幕坐标）
  renderRangeSkills(ctx, playerScreenX, playerScreenY) {
    this.weapons.forEach(weapon => {
      if (weapon.type === WEAPON_TYPES.HOLY_DOMAIN ||
          weapon.type === WEAPON_TYPES.WHIRLWIND ||
          weapon.type === WEAPON_TYPES.POISON_CLOUD) {

        // 调试用：打印范围技能渲染信息（已注释）
        // if (GameGlobal.databus.frame % 60 === 0) {
        //   console.log(`[范围技能渲染] 类型: ${weapon.type}, 玩家屏幕坐标: (${playerScreenX}, ${playerScreenY}), 半径: ${weapon.currentStats.radius + this.skillAreaMultiplier}`);
        // }

        ctx.save();
        if (weapon.type === WEAPON_TYPES.HOLY_DOMAIN) {
          ctx.strokeStyle = '#ffffaa';
        } else if (weapon.type === WEAPON_TYPES.WHIRLWIND) {
          ctx.strokeStyle = '#aaffaa';
        } else if (weapon.type === WEAPON_TYPES.POISON_CLOUD) {
          ctx.strokeStyle = '#00ff00';
        }
        ctx.lineWidth = 3;  // 增加线宽使其更明显
        ctx.setLineDash([5, 5]);
        ctx.globalAlpha = 0.5;  // 增加透明度使其更明显
        ctx.beginPath();
        // 使用玩家屏幕坐标，不受地图偏移影响
        ctx.arc(
          playerScreenX + this.player.width / 2,
          playerScreenY + this.player.height / 2,
          weapon.currentStats.radius + this.skillAreaMultiplier,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  // 渲染投射物（在地图偏移上下文中调用，使用地图坐标）
  renderProjectiles(ctx) {
    // 注意：这个方法在 main.js 的 ctx.translate(map.offsetX, map.offsetY) 上下文中调用
    // 所以不需要手动加 offsetX/Y，直接使用地图坐标即可

    this.projectiles.forEach(proj => {
      ctx.save();

      // 投射物使用地图坐标，ctx.translate 已经应用了地图偏移
      // 直接使用 proj.x 和 proj.y，不需要额外加偏移
      const renderX = proj.x;
      const renderY = proj.y;

      // === 连锁类（保留锁定） ===
      if (proj.type === WEAPON_TYPES.LIGHTNING) {
        ctx.beginPath();
        ctx.strokeStyle = proj.color;
        ctx.lineWidth = proj.size;
        ctx.moveTo(renderX, renderY);
        ctx.lineTo(proj.targetX, proj.targetY);
        ctx.stroke();
      }
      // === 物理弹药类（无锁定） ===
      else if (proj.type === WEAPON_TYPES.AXE) {
        ctx.translate(renderX, renderY);
        if (proj.rotation) {
          ctx.rotate(proj.rotation);
        }
        ctx.fillStyle = proj.color || '#ff6600';
        ctx.beginPath();
        ctx.arc(0, 0, (proj.size || 20) / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      // === 魔法弹药类（保留锁定） ===
      else if (proj.type === WEAPON_TYPES.MAGIC_ORB) {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.size / 2, 0, Math.PI * 2);
        ctx.fill();
        // 魔法球发光效果
        ctx.shadowBlur = 8;
        ctx.shadowColor = proj.color;
      }
      // === 范围伤害类（无锁定） ===
      else if (proj.type === WEAPON_TYPES.FIRE_BALL) {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = proj.color;
      }
      else if (proj.type === 'explosion_effect') {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      else if (proj.type === WEAPON_TYPES.ICE_STORM ||
               proj.type === WEAPON_TYPES.TIME_SLOW) {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      // === 状态增益类（无锁定） ===
      else if (proj.type === WEAPON_TYPES.HOLY_SHIELD ||
               proj.type === WEAPON_TYPES.SPEED_BOOST ||
               proj.type === WEAPON_TYPES.DAMAGE_BOOST) {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      // === 团队辅助类（无锁定） ===
      else if (proj.type === WEAPON_TYPES.HEALING_AURA ||
               proj.type === WEAPON_TYPES.PROTECTION_AURA ||
               proj.type === WEAPON_TYPES.MANA_REGEN) {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      // === 战术技能类（无锁定） ===
      else if (proj.type === WEAPON_TYPES.TELEPORT ||
               proj.type === WEAPON_TYPES.TRAP) {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        // Draw trap as a larger visible circle with border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.arc(renderX, renderY, proj.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Add inner circle for visual appeal
        ctx.beginPath();
        ctx.fillStyle = '#ff4444';
        ctx.arc(renderX, renderY, proj.size / 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // === 新增技能渲染 ===
      else if (proj.type === WEAPON_TYPES.THUNDER_ORB) {
        // 雷暴弹：黄色发光球体
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffff00';
        // 电弧效果
        ctx.strokeStyle = '#ffff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI * 2 / 4) * i + proj.rotation || 0;
          ctx.moveTo(renderX, renderY);
          ctx.lineTo(
            renderX + Math.cos(angle) * proj.size,
            renderY + Math.sin(angle) * proj.size
          );
        }
        ctx.stroke();
      }
      else if (proj.type === WEAPON_TYPES.ARMOR_PIERCE_SHOT) {
        // 穿甲霰弹：橙色尖锐形状
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.moveTo(renderX + proj.size, renderY);
        ctx.lineTo(renderX - proj.size / 2, renderY - proj.size / 2);
        ctx.lineTo(renderX - proj.size / 2, renderY + proj.size / 2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 5;
        ctx.shadowColor = proj.color;
      }
      else if (proj.type === WEAPON_TYPES.VAMPIRE_DART) {
        // 吸血飞镖：深红色小飞镖
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ff0000';
      }
      else if (proj.type === WEAPON_TYPES.MOLOTOV) {
        // 燃烧瓶：橙色瓶子形状
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.size / 2, 0, Math.PI * 2);
        ctx.fill();
        // 火焰效果
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff4500';
      }
      else if (proj.type === WEAPON_TYPES.SOUND_SHOCK) {
        // 声波震荡：扩散环形
        ctx.strokeStyle = proj.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1 - (proj.radius / proj.maxRadius);
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      else if (proj.type === WEAPON_TYPES.POISON_FOG) {
        // 毒雾：绿色半透明云团
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        // 毒雾边缘
        ctx.strokeStyle = 'rgba(0, 200, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      else if (proj.type === WEAPON_TYPES.POISON_CLOUD) {
        // 毒云：绿色半透明云团（持续伤害区域）
        ctx.fillStyle = 'rgba(50, 205, 50, 0.15)';
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        // 毒云边缘
        ctx.strokeStyle = 'rgba(50, 205, 50, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      else if (proj.type === 'fire_field') {
        // 火海：橙色半透明区域
        ctx.fillStyle = 'rgba(255, 69, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        // 火焰边缘
        ctx.strokeStyle = 'rgba(255, 100, 0, 0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();
        // 火焰效果
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff4500';
      }
      else if (proj.type === WEAPON_TYPES.ROCK_BLAST) {
        // 碎石：棕色岩石形状
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        // 不规则多边形
        ctx.moveTo(renderX + proj.size, renderY);
        ctx.lineTo(renderX + proj.size * 0.5, renderY + proj.size);
        ctx.lineTo(renderX - proj.size, renderY + proj.size * 0.7);
        ctx.lineTo(renderX - proj.size * 0.8, renderY - proj.size * 0.5);
        ctx.closePath();
        ctx.fill();
      }
      else if (proj.type === 'rock_effect') {
        // 碎石落地效果
        ctx.fillStyle = 'rgba(139, 69, 19, 0.5)';
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      else if (proj.type === WEAPON_TYPES.FROST_BARRAGE) {
        // 冰霜弹幕：冰蓝色冰晶
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        // 六角星形状
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
          const x = renderX + Math.cos(angle) * proj.size;
          const y = renderY + Math.sin(angle) * proj.size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00bfff';
      }
      else if (proj.type === WEAPON_TYPES.SUICIDE_DRONE) {
        // 自爆无人机：红色小飞机
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.size / 2, 0, Math.PI * 2);
        ctx.fill();
        // 尾焰
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(renderX, renderY);
        ctx.lineTo(renderX - proj.size, renderY);
        ctx.stroke();
      }
      else if (proj.type === WEAPON_TYPES.GRAVITY_WHIRL) {
        // 引力漩涡：紫色漩涡
        ctx.strokeStyle = proj.color;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.7;
        // 螺旋线
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          const startAngle = (Math.PI * 2 / 3) * i;
          for (let j = 0; j <= 20; j++) {
            const angle = startAngle + (j / 20) * Math.PI * 2;
            const r = (proj.radius / 20) * j;
            const x = renderX + Math.cos(angle) * r;
            const y = renderY + Math.sin(angle) * r;
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      else if (proj.type === WEAPON_TYPES.BOUNCE_BLADE) {
        // 反弹光刃：金色光刃
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        // 菱形光刃
        ctx.moveTo(renderX + proj.size, renderY);
        ctx.lineTo(renderX, renderY + proj.size / 3);
        ctx.lineTo(renderX - proj.size, renderY);
        ctx.lineTo(renderX, renderY - proj.size / 3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = proj.color;
        // 旋转效果
        if (!proj.rotation) proj.rotation = 0;
        proj.rotation += 0.2;
      }
      else if (proj.type === WEAPON_TYPES.TIME_STASIS) {
        // 时间缓滞：淡紫色时间场
        ctx.fillStyle = 'rgba(230, 230, 250, 0.5)';
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        // 时间刻度
        ctx.strokeStyle = 'rgba(180, 180, 220, 0.8)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 / 12) * i;
          ctx.beginPath();
          ctx.moveTo(
            renderX + Math.cos(angle) * (proj.radius * 0.7),
            renderY + Math.sin(angle) * (proj.radius * 0.7)
          );
          ctx.lineTo(
            renderX + Math.cos(angle) * proj.radius,
            renderY + Math.sin(angle) * proj.radius
          );
          ctx.stroke();
        }
      }
      else if (proj.type === WEAPON_TYPES.BLINK_SLASH) {
        // 瞬移斩：粉色斩击波
        ctx.strokeStyle = proj.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        // 弧形斩击
        ctx.arc(renderX, renderY, proj.size, 0, Math.PI);
        ctx.stroke();
        ctx.shadowBlur = 20;
        ctx.shadowColor = proj.color;
      }
      else if (proj.type === 'trap_explosion_effect') {
        // 陷阱爆炸效果
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      else if (proj.type === 'lightning_effect') {
        // 雷电效果
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        // 电弧
        ctx.strokeStyle = 'rgba(255, 255, 100, 0.8)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 / 8) * i;
          ctx.beginPath();
          ctx.moveTo(renderX, renderY);
          ctx.lineTo(
            renderX + Math.cos(angle) * proj.radius,
            renderY + Math.sin(angle) * proj.radius
          );
          ctx.stroke();
        }
      }
      // === 默认 ===
      else {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(renderX, renderY, proj.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // 范围技能已在方法开头渲染，避免重复渲染
  }

  /*
   * === 武器系统改进总结（参考 Unity 项目设计） ===
   * 
   * 1. 添加了投射物行为标志枚举（ProjectileFlags）
   *    - 参考 eBulletFlags.cs，定义了 14 种投射物行为标志
   *    - 包括：MISSILE（追踪）、CHAIN（连锁）、GRENADE（抛物线）等
   * 
   * 2. 添加了投射物配置系统
   *    - createProjectileConfig(): 创建投射物配置（类似 JBulletData）
   *    - createProjectile(): 使用配置创建投射物实例
   *    - 配置与实例分离，更易维护和调整
   * 
   * 3. 改进了投射物创建流程
   *    - 已改进的攻击方法：
   *      * magicOrbAttack - 魔法弹
   *      * axeAttack - 斧头
   *      * fireBallAttack - 火球
   *      * thunderOrbAttack - 雷暴弹
   *      * armorPierceShotAttack - 穿甲霰弹
   *      * vampireDartAttack - 吸血飞镖
   *      * frostBarrageAttack - 冰霜弹幕
   *      * suicideDroneAttack - 自爆无人机
   *      * bounceBladeAttack - 反弹光刃
   *      * blinkSlashAttack - 瞬移斩
   * 
   * 4. 改进了投射物生命周期管理
   *    - updateProjectiles() 方法添加了清晰的阶段注释：
   *      * 阶段 1：特殊投射物处理（不移动或特殊逻辑）
   *      * 阶段 2：物理更新（重力、追踪等）
   *      * 阶段 3：边界检查
   *      * 阶段 4：障碍物碰撞检测
   *      * 阶段 5：敌人碰撞检测
   * 
   * 5. 改进了碰撞检测方法
   *    - checkProjectileCollision() 添加了说明注释
   *    - 参考 ActorData_Bullet.OnCollider 流程
   * 
   * 6. 添加了武器配置数据系统（新增）
   *    - WeaponConfig 类：类似 WeaponData.cs 的配置数据
   *    - WeaponStateFlags 枚举：类似 ActorData_Weapon 的状态标志
   *    - 支持运行时状态管理：isRotating, isLanding, isCharging, isCooldown 等
   * 
   * 7. 改进了武器实例创建
   *    - 使用 WeaponConfig 创建配置
   *    - 添加运行时状态对象
   *    - 提供 getRuntimeState() 和 setRuntimeState() 方法
   *    - 状态同步到 config.flags
   * 
   * 8. 添加了技能事件触发机制（新增）
   *    - triggerSkillEvent(): 类似 SkillEvent.TriggerChilds
   *    - 支持 attack_start 和 attack_end 事件
   *    - 自动管理武器状态（isCharging, isCooldown）
   *    - 可扩展为事件总线系统
   * 
   * 设计原则：
   *    - 保持现有代码结构，不做大的重构
   *    - 添加配置系统使代码更易维护
   *    - 添加清晰注释说明流程
   *    - 参考 Unity 项目的设计思想
   *    - 没有破坏原有功能
   */

  reset() {
    this.weapons.clear();
    this.projectiles = [];
    this.damageMultiplier = 1;
    this.attackSpeedMultiplier = 1;
    this.attackRangeMultiplier = 0;  // 攻击范围倍率，初始为 0
    this.skillAreaMultiplier = 0;    // 技能范围倍率，初始为 0
    this.projectileCountMultiplier = 0;  // 初始为 0，只在选择"多重射击"后增加
    this.extraSalvoMultiplier = 0;  // 初始为 0，只在选择"额外弹道"后增加
    this.cooldownReductionMultiplier = 1;  // 冷却缩减倍率，初始为 1（无缩减）
    this.durationMultiplier = 0;  // 持续时间倍率，初始为 0
    this.penetrationMultiplier = 0;  // 初始为 0，只在选择"穿透增强"后增加
    this.bounceMultiplier = 0;  // 初始为 0，只在选择"弹射增强"后增加
    // 新增属性重置
    this.elementDamageBoost = 0;  // 元素伤害加成
    this.precisionBoost = 0;  // 精准打击加成
    this.critChanceBoost = 0;  // 暴击率加成
    this.quickReloadBoost = false;  // 快速装填
    this.trapMasterBonus = 0;  // 陷阱大师加成
    this.trapDamageBonus = 0;  // 陷阱伤害加成
    this.desperateStrikeActive = false;  // 绝境反击状态
    this.desperateStrikeDamageBonus = 0;  // 绝境反击伤害加成
    this.manaRegenActive = false;  // 冷却光环状态
    this.manaRegenEndTime = 0;  // 冷却光环结束时间
    this.originalCooldownReduction = 1;  // 原始冷却缩减
    // 状态效果系统重置
    this.activeStatusEffects = new Map();
    this.critChance = 0;
    this.critDamage = 2.0;
    this.projectileConfigs = new Map();
  }
}
