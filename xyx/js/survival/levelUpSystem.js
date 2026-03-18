// 动态获取屏幕尺寸，避免模块加载时序问题
const getScreenSize = () => ({
  width: GameGlobal?.SCREEN_WIDTH || GameGlobal?.canvas?.width || 375,
  height: GameGlobal?.SCREEN_HEIGHT || GameGlobal?.canvas?.height || 667
});

const SKILL_POOL = [
  {
    type: 'weapon',
    id: 'magic_orb',
    name: '魔法弹',
    description: '向最近的敌人发射魔法弹',
    rarity: 'common'
  },
  {
    type: 'weapon',
    id: 'whirlwind',
    name: '旋风斩',
    description: '旋转的剑刃攻击周围的敌人',
    rarity: 'common'
  },
  {
    type: 'weapon',
    id: 'holy_domain',
    name: '神圣领域',
    description: '持续伤害周围的敌人',
    rarity: 'rare'
  },
  {
    type: 'weapon',
    id: 'lightning',
    name: '闪电',
    description: '连锁闪电攻击多个敌人',
    rarity: 'rare'
  },
  {
    type: 'weapon',
    id: 'axe',
    name: '回旋斧',
    description: '抛物线飞行，穿透2个敌人',
    rarity: 'common'
  },
  {
    type: 'weapon',
    id: 'fire_ball',
    name: '火球术',
    description: '发射火球造成范围爆炸伤害',
    rarity: 'rare'
  },
  {
    type: 'weapon',
    id: 'ice_storm',
    name: '冰风暴',
    description: '冻结并伤害周围的敌人，减速50%',
    rarity: 'epic'
  },
  {
    type: 'weapon',
    id: 'poison_cloud',
    name: '毒云',
    description: '释放毒云造成持续中毒伤害',
    rarity: 'rare'
  },
  {
    type: 'weapon',
    id: 'holy_shield',
    name: '圣盾',
    description: '临时无敌，短时间内免疫所有伤害',
    rarity: 'epic'
  },
  {
    type: 'weapon',
    id: 'speed_boost',
    name: '加速',
    description: '移动速度大幅提升',
    rarity: 'common'
  },
  {
    type: 'weapon',
    id: 'damage_boost',
    name: '强击',
    description: '伤害输出大幅提升',
    rarity: 'common'
  },
  {
    type: 'weapon',
    id: 'healing_aura',
    name: '治疗光环',
    description: '持续恢复生命值',
    rarity: 'common'
  },
  {
    type: 'weapon',
    id: 'protection_aura',
    name: '守护光环',
    description: '减少受到的所有伤害',
    rarity: 'epic'
  },
  {
    type: 'weapon',
    id: 'mana_regen',
    name: '冷却光环',
    description: '技能冷却时间缩短',
    rarity: 'rare'
  },
  {
    type: 'weapon',
    id: 'teleport',
    name: '传送',
    description: '受伤后随机传送到安全位置',
    rarity: 'legendary'
  },
  {
    type: 'weapon',
    id: 'time_slow',
    name: '时间减速',
    description: '减缓周围敌人的移动速度',
    rarity: 'epic'
  },
  {
    type: 'weapon',
    id: 'trap',
    name: '陷阱',
    description: '放置陷阱，敌人触发时造成大量伤害，最大2个陷阱',
    rarity: 'common'
  },
  // === 新增武器技能 ===
  {
    type: 'weapon',
    id: 'thunder_orb',
    name: '雷暴弹',
    description: '向最近敌人发射带电魔法弹，命中触发雷电范围伤害',
    rarity: 'rare'
  },
  {
    type: 'weapon',
    id: 'armor_pierce_shot',
    name: '穿甲霰弹',
    description: '发射3发穿甲霰弹，每发可穿透1个敌人',
    rarity: 'common'
  },
  {
    type: 'weapon',
    id: 'vampire_dart',
    name: '吸血飞镖',
    description: '发射5枚吸血魔法飞镖，命中敌人后回复自身血量',
    rarity: 'common'
  },
  {
    type: 'weapon',
    id: 'molotov',
    name: '燃烧瓶',
    description: '投掷燃烧瓶，制造持续4秒的火海区域',
    rarity: 'common'
  },
  {
    type: 'weapon',
    id: 'sound_shock',
    name: '声波震荡',
    description: '释放环形声波，击退周围敌人',
    rarity: 'common'
  },
  {
    type: 'weapon',
    id: 'poison_fog',
    name: '毒雾喷射',
    description: '向敌人喷射毒雾，造成持续中毒效果',
    rarity: 'common'
  },
  {
    type: 'weapon',
    id: 'rock_blast',
    name: '碎石轰击',
    description: '召唤3块碎石随机砸落，造成高额伤害',
    rarity: 'common'
  },
  {
    type: 'weapon',
    id: 'frost_barrage',
    name: '冰霜弹幕',
    description: '发射8枚冰弹，冻结敌人并造成额外伤害',
    rarity: 'rare'
  },
  {
    type: 'weapon',
    id: 'suicide_drone',
    name: '自爆无人机',
    description: '发射追踪无人机，接近敌人后自爆造成范围伤害',
    rarity: 'rare'
  },
  {
    type: 'weapon',
    id: 'gravity_whirl',
    name: '引力漩涡',
    description: '制造引力场，吸附并减速敌人',
    rarity: 'epic'
  },
  {
    type: 'weapon',
    id: 'bounce_blade',
    name: '反弹光刃',
    description: '发射可反弹的光刃，每次反弹伤害递增',
    rarity: 'epic'
  },
  {
    type: 'weapon',
    id: 'time_stasis',
    name: '时间缓滞',
    description: '强减速敌人并提升自身移动速度',
    rarity: 'epic'
  },
  {
    type: 'weapon',
    id: 'blink_slash',
    name: '瞬移斩',
    description: '瞬移至敌人背后斩击，低血量敌人直接秒杀',
    rarity: 'legendary'
  },
  {
    type: 'weapon',
    id: 'lava_fist',
    name: '熔岩拳套',
    description: '下次普攻变为范围拳击，附带灼烧效果',
    rarity: 'legendary'
  },
  {
    type: 'passive',
    id: 'damage_boost',
    name: '力量提升',
    description: '所有武器伤害提升10%',
    rarity: 'rare'
  },
  {
    type: 'passive',
    id: 'speed_boost',
    name: '敏捷提升',
    description: '攻击速度提升10%',
    rarity: 'rare'
  },
  {
    type: 'passive',
    id: 'attack_range_boost',
    name: '攻击范围',
    description: '攻击范围提升15%',
    rarity: 'epic'
  },
  {
    type: 'passive',
    id: 'skill_area_boost',
    name: '技能范围',
    description: '技能范围提升15%',
    rarity: 'rare'
  },
  {
    type: 'passive',
    id: 'move_speed',
    name: '移速提升',
    description: '移动速度提升15%',
    rarity: 'common'
  },
  {
    type: 'passive',
    id: 'health_boost',
    name: '生命提升',
    description: '最大生命值提升20',
    rarity: 'common'
  },
  {
    type: 'passive',
    id: 'magnet_boost',
    name: '磁力增强',
    description: '经验拾取范围提升20%',
    rarity: 'common'
  },
  {
    type: 'passive',
    id: 'exp_boost',
    name: '经验增幅',
    description: '所有途径获得的经验值提升 10%',
    rarity: 'common'
  },
  {
    type: 'passive',
    id: 'gold_boost',
    name: '金币增幅',
    description: '所有途径获得的金币数量提升 10%',
    rarity: 'common'
  },
  {
    type: 'passive',
    id: 'armor_boost',
    name: '护甲提升',
    description: '减少受到的伤害2点',
    rarity: 'common'
  },
  {
    type: 'passive',
    id: 'projectile_count',
    name: '多重射击',
    description: '所有武器发射子弹+1',
    rarity: 'legendary'
  },
  {
    type: 'passive',
    id: 'extra_salvo',
    name: '额外弹道',
    description: '所有武器弹道+1',
    rarity: 'epic'
  },
  {
    type: 'passive',
    id: 'cooldown_reduction',
    name: '急速冷却',
    description: '所有技能冷却时间-10%',
    rarity: 'rare'
  },
  {
    type: 'passive',
    id: 'duration_boost',
    name: '持续时间',
    description: '所有增益状态持续时间+15%',
    rarity: 'common'
  },
  {
    type: 'passive',
    id: 'penetration_boost',
    name: '穿透增强',
    description: '所有武器穿透效果+1',
    rarity: 'epic'
  },
  {
    type: 'passive',
    id: 'bounce_boost',
    name: '弹射增强',
    description: '所有武器弹射+1',
    rarity: 'legendary'
  },
  {
    type: 'passive',
    id: 'super_cooling',
    name: '超频冷却',
    description: '所有技能冷却时间-15%',
    rarity: 'legendary'
  },
  // === 新增被动技能 ===
  {
    type: 'passive',
    id: 'precision_strike',
    name: '精准打击',
    description: '锁定类技能命中率+20%，暴击率+10%',
    rarity: 'common'
  },
  {
    type: 'passive',
    id: 'quick_reload',
    name: '快速装填',
    description: '物理系弹药攻速+15%、冷却-10%',
    rarity: 'rare'
  },
  {
    type: 'passive',
    id: 'element_affinity',
    name: '元素亲和',
    description: '元素技能伤害+25%',
    rarity: 'epic'
  },
  {
    type: 'passive',
    id: 'tough_body',
    name: '坚韧身躯',
    description: '受到范围伤害-30%，控制时长-50%',
    rarity: 'common'
  },
  {
    type: 'passive',
    id: 'trap_master',
    name: '陷阱大师',
    description: '陷阱最大数量+2，陷阱伤害+40%',
    rarity: 'rare'
  },
  {
    type: 'passive',
    id: 'energy_siphon',
    name: '能量虹吸',
    description: '击败敌人后50%概率获得冷却-20%',
    rarity: 'epic'
  },
  {
    type: 'passive',
    id: 'desperate_strike',
    name: '绝境反击',
    description: '血量<20%时，伤害+50%，移速+20%',
    rarity: 'legendary'
  }
];

const ITEM_POOL = [
  {
    type: 'item',
    id: 'heal_potion',
    name: '治疗药水',
    description: '立即恢复30%最大生命值',
    rarity: 'common',
    healPercent: 0.3
  },
  {
    type: 'item',
    id: 'great_heal_potion',
    name: '大治疗药水',
    description: '立即恢复50%最大生命值',
    rarity: 'rare',
    healPercent: 0.5
  },
  {
    type: 'item',
    id: 'full_heal_potion',
    name: '完全恢复药水',
    description: '立即恢复100%最大生命值',
    rarity: 'epic',
    healPercent: 1.0
  },
  {
    type: 'item',
    id: 'regeneration',
    name: '生命再生',
    description: '恢复生命值',
    rarity: 'rare',
    healPercent: 0.05,
    duration: 600 // 10秒 = 600帧
  },
  {
    type: 'item',
    id: 'max_health_boost',
    name: '生命上限提升',
    description: '最大生命值永久提升50',
    rarity: 'rare',
    maxHealthBonus: 50
  },
  {
    type: 'item',
    id: 'resurrection',
    name: '复活药水',
    description: '受到致命伤害时自动复活并恢复30%生命值',
    rarity: 'legendary',
    healPercent: 0.3
  }
];

const RARITY_COLORS = {
  common: '#ffffff',
  rare: '#4169e1',
  epic: '#9400d3',
  legendary: '#ffd700'
};

export default class LevelUpSystem {
  constructor() {
    this.isPaused = false;
    this.availableSkills = [];
    this.selectedSkill = null;
    this.selectionTimer = 0;
    this.autoSelectTime = 600;
    this.maxWeaponLevel = 8; // 武器最大升级次数
  }

  trigger() {
    // console.log('=== LevelUpSystem.trigger() called ===');
    // console.log('Before trigger - isPaused:', this.isPaused);
    this.isPaused = true;
    // console.log('After set isPaused - isPaused:', this.isPaused);
    this.generateSkills();
    // console.log('After generateSkills - availableSkills:', this.availableSkills.length);
    this.selectionTimer = this.autoSelectTime;
    // console.log('After trigger - isPaused:', this.isPaused);
    // console.log('Available skills:', this.availableSkills.length);
    // console.log('Screen size:', getScreenSize());
  }

  // 检查是否所有武器都已满级
  areAllWeaponsMaxLevel() {
    const player = GameGlobal.databus.player;
    if (!player || !player.weaponSystem) return false;

    const weaponCount = player.weaponSystem.weapons.size;
    // 武器数量达到5个且全部达到8级
    if (weaponCount >= 5) {
      for (const weapon of player.weaponSystem.weapons.values()) {
        if (weapon.level < this.maxWeaponLevel) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  generateSkills() {
    this.availableSkills = [];
    const usedSkills = new Set();

    // 检查是否所有武器都已满级，如果满级则显示道具
    const showItems = this.areAllWeaponsMaxLevel();

    for (let i = 0; i < 3; i++) {
      let item;
      let attempts = 0;

      do {
        item = showItems ? this.getRandomItem() : this.getRandomSkill();
        attempts++;
      } while (usedSkills.has(item.id) && attempts < 50);

      if (item) {
        usedSkills.add(item.id);
        this.availableSkills.push({
          ...item,
          index: i
        });
      }
    }
  }

  getRandomSkill() {
    const player = GameGlobal.databus.player;
    const weaponCount = player.weaponSystem.weapons.size;

    const weights = SKILL_POOL.map(skill => {
      let weight = 1;

      if (skill.rarity === 'common') weight *= 10;
      else if (skill.rarity === 'rare') weight *= 5;
      else if (skill.rarity === 'epic') weight *= 2;
      else if (skill.rarity === 'legendary') weight *= 1;

      if (skill.type === 'weapon') {
        if (weaponCount >= 5) weight *= 0.3;
        else if (weaponCount >= 4) weight *= 0.5;
      }

      if (skill.type === 'weapon' && player.weaponSystem.weapons.has(skill.id)) {
        // 武器已满级时降低权重
        const weapon = player.weaponSystem.weapons.get(skill.id);
        if (weapon && weapon.level >= this.maxWeaponLevel) {
          weight *= 0.1; // 极低权重
        } else {
          weight *= 3;
        }
      }

      return weight;
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < SKILL_POOL.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return SKILL_POOL[i];
      }
    }

    return SKILL_POOL[0];
  }

  getRandomItem() {
    const weights = ITEM_POOL.map(item => {
      let weight = 1;

      if (item.rarity === 'common') weight *= 10;
      else if (item.rarity === 'rare') weight *= 5;
      else if (item.rarity === 'epic') weight *= 2;
      else if (item.rarity === 'legendary') weight *= 1;

      return weight;
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < ITEM_POOL.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return ITEM_POOL[i];
      }
    }

    return ITEM_POOL[0];
  }

  selectSkill(index) {
    if (index < 0 || index >= this.availableSkills.length) return;

    this.selectedSkill = this.availableSkills[index];
    this.applySkill(this.selectedSkill);
    this.close();
  }

  applySkill(skill) {
    const player = GameGlobal.databus.player;

    if (skill.type === 'weapon') {
      player.weaponSystem.addWeapon(skill.id);
    } else if (skill.type === 'passive') {
      this.applyPassive(skill.id, player);
    } else if (skill.type === 'item') {
      this.applyItem(skill.id, player);
    }
  }

  applyPassive(skillId, player) {
    switch (skillId) {
      case 'damage_boost':
        player.weaponSystem.boostDamage(0.1);
        break;
      case 'speed_boost':
        player.weaponSystem.boostAttackSpeed(0.1);
        break;
      case 'attack_range_boost':
        player.weaponSystem.boostAttackRange(0.15);
        break;
      case 'skill_area_boost':
        player.weaponSystem.boostSkillArea(0.15);
        break;
      case 'move_speed':
        player.boostStat('moveSpeed', 0.15); // 使用乘法方式：原值 * 1.15
        break;
      case 'health_boost':
        player.increaseMaxHealth(20);
        break;
      case 'magnet_boost':
        player.boostStat('magnetRadius', 0.2); // 使用乘法方式：原值 * 1.2
        break;
      case 'exp_boost':
        // 经验增幅：所有途径获得的经验值提升 10%
        player.expBoost = (player.expBoost || 0) + 0.1;
        break;
      case 'gold_boost':
        // 金币增幅：所有途径获得的金币数量提升 10%
        player.goldBoost = (player.goldBoost || 0) + 0.1;
        break;
      case 'armor_boost':
        player.boostStat('armor', 2);
        break;
      case 'projectile_count':
        player.weaponSystem.boostProjectileCount(1);
        break;
      case 'extra_salvo':
        player.weaponSystem.boostExtraSalvo(1);
        break;
      case 'cooldown_reduction':
        player.weaponSystem.boostCooldownReduction(0.1);
        break;
      case 'duration_boost':
        player.weaponSystem.boostDuration(0.15);
        break;
      case 'penetration_boost':
        player.weaponSystem.boostPenetration(1);
        break;
      case 'bounce_boost':
        player.weaponSystem.boostBounce(1);
        break;
      case 'super_cooling':
        player.weaponSystem.boostCooldownReduction(0.15);
        break;
      case 'mana_regen':
        player.weaponSystem.boostCooldownReduction(1.0); // 冷却减少100%
        break;
      // === 新增被动技能实现 ===
      case 'precision_strike':
        // 精准打击：锁定类技能命中率+20%，暴击率+10%
        player.weaponSystem.precisionBoost = (player.weaponSystem.precisionBoost || 0) + 0.2;
        player.weaponSystem.critChanceBoost = (player.weaponSystem.critChanceBoost || 0) + 0.1;
        break;
      case 'quick_reload':
        // 快速装填：物理系弹药攻速+15%、冷却-10%
        player.weaponSystem.quickReloadBoost = true;
        break;
      case 'element_affinity':
        // 元素亲和：元素技能伤害+25%
        player.weaponSystem.elementDamageBoost = (player.weaponSystem.elementDamageBoost || 0) + 0.25;
        player.weaponSystem.boostDuration(60 / 60); // 持续时间+1秒
        break;
      case 'tough_body':
        // 坚韧身躯：受到范围伤害-30%，控制时长-50%
        player.toughBody = true;
        break;
      case 'trap_master':
        // 陷阱大师：陷阱最大数量+2，陷阱伤害+40%
        player.weaponSystem.trapMasterBonus = (player.weaponSystem.trapMasterBonus || 0) + 2;
        player.weaponSystem.trapDamageBonus = (player.weaponSystem.trapDamageBonus || 0) + 0.4;
        break;
      case 'energy_siphon':
        // 能量虹吸：击败敌人后50%概率获得冷却-20%
        player.energySiphon = true;
        break;
      case 'desperate_strike':
        // 绝境反击：血量<20%时，伤害+50%，移速+20%
        player.desperateStrike = true;
        break;
    }
  }

  applyItem(itemId, player) {
    switch (itemId) {
      case 'heal_potion':
        // 恢复30%生命值
        player.heal(player.stats.maxHealth * 0.3);
        console.log('使用治疗药水，恢复30%生命值');
        break;
      case 'great_heal_potion':
        // 恢复50%生命值
        player.heal(player.stats.maxHealth * 0.5);
        console.log('使用大治疗药水，恢复50%生命值');
        break;
      case 'full_heal_potion':
        // 恢复100%生命值
        player.heal(player.stats.maxHealth);
        console.log('使用完全恢复药水，恢复100%生命值');
        break;
      case 'regeneration':
        // 生命再生效果（需要扩展player来支持持续回血）
        player.heal(player.stats.maxHealth * 0.5); // 暂时立即恢复50%
        console.log('使用生命再生，恢复50%生命值');
        break;
      case 'max_health_boost':
        // 提升生命上限
        player.increaseMaxHealth(50);
        player.heal(50); // 同时恢复50点生命
        console.log('使用生命上限提升，提升50点');
        break;
      case 'resurrection':
        // 复活效果（需要扩展player来支持复活机制）
        // 暂时恢复30%生命值
        player.heal(player.stats.maxHealth * 0.3);
        console.log('使用复活药水，恢复30%生命值');
        break;
    }
  }

  close() {
    this.isPaused = false;
    this.availableSkills = [];
    this.selectedSkill = null;
    this.selectionTimer = 0;
  }

  update() {
    if (!this.isPaused) return;

    // console.log(`[技能选择更新] 计时器：${this.selectionTimer}, 可用技能数：${this.availableSkills.length}`);

    if (this.selectionTimer > 0) {
      this.selectionTimer--;
      if (this.selectionTimer <= 0) {
        // 检查是否有可用技能，如果没有则直接关闭
        if (this.availableSkills.length > 0) {
          // console.log('[技能选择更新] 自动选择技能');
          this.selectSkill(Math.floor(Math.random() * this.availableSkills.length));
        } else {
          // console.log('[技能选择更新] 无可用技能，关闭界面');
          this.close(); // 没有可用技能时自动关闭
        }
      }
    }
  }

  render(ctx) {
    if (!this.isPaused) {
      return;
    }

    // console.log('=== LevelUpSystem.render() called ===');
    const { width: canvasWidth, height: canvasHeight } = getScreenSize();
    // console.log('Canvas size:', canvasWidth, 'x', canvasHeight);
    // console.log('Available skills to render:', this.availableSkills.length);

    // 检查是否所有武器都已满级
    const showItems = this.areAllWeaponsMaxLevel();

    // 保存当前上下文状态
    ctx.save();

    // 绘制半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 弹窗大小缩减10%
    const scale = 0.9;
    const scaledWidth = canvasWidth * scale;
    const scaledHeight = canvasHeight * scale;
    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = (canvasHeight - scaledHeight) / 2;

    // 绘制标题（位置按比例调整）
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial'; // 缩减10%: 32->28
    ctx.textAlign = 'center';
    ctx.fillText(showItems ? '选择一个道具' : '升级！选择一个技能', canvasWidth / 2, offsetY + 90);

    // 绘制倒计时（位置按比例调整）
    ctx.font = '18px Arial'; // 缩减10%: 20->18
    ctx.fillText(`自动选择: ${Math.ceil(this.selectionTimer / 60)}秒`, canvasWidth / 2, offsetY + 126);

    // 绘制技能卡片（大小和位置按比例调整）
    const cardWidth = scaledWidth * 0.8;
    const cardHeight = 108; // 缩减10%: 120->108
    const startY = offsetY + 162; // 缩减10%: 180->162
    const gap = 18; // 缩减10%: 20->18

    // console.log('Rendering skill cards, count:', this.availableSkills.length);
    this.availableSkills.forEach((skill, index) => {
      const x = offsetX + (scaledWidth - cardWidth) / 2;
      const y = startY + (cardHeight + gap) * index;

      // 卡片背景
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(x, y, cardWidth, cardHeight);

      // 卡片边框
      ctx.strokeStyle = RARITY_COLORS[skill.rarity] || '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, cardWidth, cardHeight);

      // 技能名称（字体缩减10%: 24->22，位置调整）
      ctx.fillStyle = RARITY_COLORS[skill.rarity] || '#ffffff';
      ctx.font = 'bold 22px Arial'; // 缩减10%: 24->22
      ctx.textAlign = 'left';
      ctx.fillText(skill.name, x + 18, y + 36);

      // 稀有度标签
      ctx.font = '12px Arial'; // 缩减10%: 14->12
      ctx.fillStyle = '#888';
      ctx.fillText(this.getRarityText(skill.rarity), x + cardWidth - 72, y + 36);

      // 技能描述（字体缩减30%: 16->11）
      ctx.fillStyle = '#cccccc';
      ctx.font = '11px Arial'; // 缩减30%: 16->11
      ctx.fillText(skill.description, x + 18, y + 72);

      // 技能类型
      ctx.font = '12px Arial'; // 缩减10%: 14->12
      ctx.fillStyle = '#666';
      let typeText = '被动';
      if (skill.type === 'weapon') typeText = '武器';
      else if (skill.type === 'item') typeText = '道具';
      ctx.fillText(typeText, x + 18, y + 90);

      // console.log(`Rendered card ${index}: ${skill.name}`);
    });

    // 恢复上下文状态
    ctx.restore();
    // console.log('=== LevelUpSystem.render() completed ===');
  }

  getRarityText(rarity) {
    const texts = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说'
    };
    return texts[rarity] || '普通';
  }

  handleTouch(x, y) {
    // console.log(`[技能选择触摸] isPaused: ${this.isPaused}, 可用技能数：${this.availableSkills.length}`);
    
    if (!this.isPaused) {
      // console.log(`[技能选择触摸] 跳过：isPaused 为 false`);
      return false;
    }

    const { width: canvasWidth } = getScreenSize();
    const cardWidth = canvasWidth * 0.8;
    const cardHeight = 120;
    const startY = 180;
    const gap = 20;

    // console.log(`[技能选择触摸] 触摸位置：(${x}, ${y})`);

    for (let i = 0; i < this.availableSkills.length; i++) {
      const cardX = (canvasWidth - cardWidth) / 2;
      const cardY = startY + (cardHeight + gap) * i;

      // console.log(`[技能选择触摸] 技能 ${i} 区域：(${cardX}, ${cardY}) - (${cardX + cardWidth}, ${cardY + cardHeight})`);

      if (x >= cardX && x <= cardX + cardWidth &&
          y >= cardY && y <= cardY + cardHeight) {
        // console.log(`[技能选择触摸] 点击技能 ${i}`);
        this.selectSkill(i);
        return true;
      }
    }

    // console.log(`[技能选择触摸] 未点击任何技能`);
    return false;
  }

  reset() {
    this.isPaused = false;
    this.availableSkills = [];
    this.selectedSkill = null;
    this.selectionTimer = 0;
  }
}
