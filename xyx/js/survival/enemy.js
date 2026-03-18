import Animation from '../base/animation';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

const ENEMY_TYPES = {
  NORMAL: 'normal',
  ELITE: 'elite',
  RANGED: 'ranged',
  SUPER_ELITE: 'super_elite',
  SUPER_BOSS: 'super_boss'
};

const enemyTypeManager = {
  types: ENEMY_TYPES,
  descriptions: {
    [ENEMY_TYPES.NORMAL]: '普通敌人 - 快速移动',
    [ENEMY_TYPES.ELITE]: '精英敌人 - 高伤害',
    [ENEMY_TYPES.RANGED]: '远程敌人 - 发射弹幕',
    [ENEMY_TYPES.SUPER_ELITE]: '超级精英 - 双重攻击模式',
    [ENEMY_TYPES.SUPER_BOSS]: '超级Boss - 最强敌人'
  },
  configs: {
    [ENEMY_TYPES.NORMAL]: {
      width: 18,
      height: 18,
      health: Math.floor(10 * 1.15),
      speed: 1.4,
      damage: Math.floor(5 * 1.15),
      exp: 20,
      color: '#ff4444',
      isRanged: false,
      attackRange: 50,
      attackCooldown: 60,
      description: 'Fast attack enemy'
    },
    [ENEMY_TYPES.ELITE]: {
      width: 21,
      height: 21,
      health: Math.floor(25 * 1.15),
      speed: 1.05,
      damage: Math.floor(10 * 1.15),
      exp: 60,
      color: '#aa44ff',
      isRanged: false,
      attackRange: 60,
      attackCooldown: 45,
      description: 'High damage elite enemy'
    },
    [ENEMY_TYPES.RANGED]: {
      width: 20,
      height: 20,
      health: Math.floor(20 * 1.15),
      speed: 0.8,
      damage: Math.floor(8 * 1.15),
      exp: 50,
      color: '#44aaff',
      isRanged: true,
      attackRange: 200,
      attackCooldown: 180,
      projectileSpeed: 5,
      projectileDamage: Math.floor(15 * 1.15),
      description: 'Ranged enemy that fires projectiles'
    },
    [ENEMY_TYPES.SUPER_ELITE]: {
      width: 42,
      height: 42,
      health: Math.floor(200 * 1.15),
      speed: 0.35,
      damage: Math.floor(30 * 1.15),
      exp: 100,
      color: '#ff8800',
      attackModes: {
        melee: {
          isRanged: false,
          attackRange: 80,
          attackCooldown: 60,
          description: 'Melee attack'
        },
        ranged: {
          isRanged: true,
          attackRange: 250,
          attackCooldown: 240,
          projectileSpeed: 4,
          projectileDamage: Math.floor(35 * 1.15),
          description: 'Ranged attack'
        }
      },
      currentAttackMode: 'melee',
      description: 'Super elite with dual attack modes'
    },
    [ENEMY_TYPES.SUPER_BOSS]: {
      width: 56,
      height: 56,
      health: 800,
      speed: 0.35,
      damage: 50,
      exp: 200,
      color: '#ff00ff',
      attackModes: {
        melee: {
          isRanged: false,
          attackRange: 100,
          attackCooldown: 90,
          description: 'Melee attack'
        },
        ranged: {
          isRanged: true,
          attackRange: 300,
          attackCooldown: 300,
          projectileSpeed: 6,
          projectileDamage: Math.floor(30 * 1.15),
          description: 'Ranged attack'
        }
      },
      currentAttackMode: 'melee',
      description: 'Super Boss - final boss'
    }
  },

  getAllTypes() {
    return Object.keys(this.types);
  },

  getDescription(type) {
    return this.descriptions[type] || 'Unknown enemy type';
  },

  getConfig(type) {
    return this.configs[type];
  },

  addType(type, config) {
    this.types[type.toUpperCase()] = type;
    this.configs[type] = config;
    this.descriptions[type] = config.description || 'New enemy type';
  }
};

export default class Enemy extends Animation {
  constructor() {
    super(null, 40, 40);
    this.lastMoveDirection = { x: 0, y: 0 }; // 记录上一帧的移动方向
  }

  init(type = ENEMY_TYPES.NORMAL, difficultyMultiplier = 1) {
    const config = enemyTypeManager.getConfig(type);

    this.width = config.width;
    this.height = config.height;
    this.type = type;
    this.maxHealth = Math.floor(config.health * difficultyMultiplier);
    this.currentHealth = this.maxHealth;
    this.speed = config.speed;
    this.damage = Math.floor(config.damage * difficultyMultiplier);
    // 经验值不受难度倍率影响，始终为基础值
    this.exp = config.exp;
    this.color = config.color;

    this.attackRange = 0;
    this.attackCooldown = 60;
    this.currentAttackCooldown = 0;
    this.projectileSpeed = 5;
    this.projectileDamage = this.damage;
    this.isRanged = false;

    if (config.attackModes) {
      if (type === ENEMY_TYPES.SUPER_ELITE || type === ENEMY_TYPES.SUPER_BOSS) {
        this.currentAttackMode = Math.random() < 0.5 ? 'melee' : 'ranged';
      } else {
        this.currentAttackMode = config.isRanged ? 'ranged' : 'melee';
      }

      const attackModeConfig = config.attackModes[this.currentAttackMode];
      this.isRanged = attackModeConfig.isRanged || false;

      if (this.isRanged) {
        this.attackRange = attackModeConfig.attackRange;
        this.attackCooldown = attackModeConfig.attackCooldown;
        this.projectileSpeed = attackModeConfig.projectileSpeed;
        this.projectileDamage = Math.floor(attackModeConfig.projectileDamage * difficultyMultiplier);
      }
    } else {
      this.isRanged = config.isRanged || false;

      if (this.isRanged) {
        this.attackRange = config.attackRange;
        this.attackCooldown = config.attackCooldown;
        this.projectileSpeed = config.projectileSpeed;
        this.projectileDamage = Math.floor(config.projectileDamage * difficultyMultiplier);
      } else {
        this.attackRange = 50;
      }
    }

    this.spawnFromEdge();

    this.isActive = true;
    this.visible = true;

    // === 新增状态效果 ===
    this.frozen = false;
    this.freezeDuration = 0;
    this.freezeDamageBonus = 0;

    this.poisoned = false;
    this.poisonDuration = 0;
    this.poisonDamage = 0;

    this.armorBroken = false;
    this.armorBreakDuration = 0;

    this.slowed = false;
    this.slowEffect = 0;
    this.slowDuration = 0;
    this.flashTime = 0;
    this.collisionCooldown = 0;

    this.aiState = {
      lastMoveAttempt: { x: 0, y: 0 },
      stuckFrames: 0,
      stuckThreshold: 30,
      avoidanceAngle: 0,
      isAvoiding: false,
      avoidanceCooldown: 0,
      lastPosition: { x: this.x, y: this.y },
      positionStuckFrames: 0
    };
  }

  spawnFromEdge(sideParam = null) {
    const side = sideParam === null ? Math.floor(Math.random() * 4) : sideParam;

    const mapWidth = GameGlobal.databus.infiniteMap ? GameGlobal.databus.infiniteMap.mapWidth : SCREEN_WIDTH;
    const mapHeight = GameGlobal.databus.infiniteMap ? GameGlobal.databus.infiniteMap.mapHeight : SCREEN_HEIGHT;

    switch (side) {
      case 0:
        this.x = Math.random() * (mapWidth - this.width);
        this.y = -this.height;
        break;
      case 1:
        this.x = mapWidth;
        this.y = Math.random() * (mapHeight - this.height);
        break;
      case 2:
        this.x = Math.random() * (mapWidth - this.width);
        this.y = mapHeight;
        break;
      case 3:
        this.x = -this.width;
        this.y = Math.random() * (mapHeight - this.height);
        break;
    }
  }

  update(player) {
    if (!this.isActive || !player) return;

    if (this.currentAttackCooldown > 0) {
      this.currentAttackCooldown--;
    }

    if (this.collisionCooldown > 0) {
      this.collisionCooldown--;
    }

    this.updateStatusEffects();

    const config = enemyTypeManager.getConfig(this.type);

    let playerCenterX, playerCenterY;
    if (GameGlobal.databus.infiniteMap) {
      const map = GameGlobal.databus.infiniteMap;
      playerCenterX = map.playerMapX + player.width / 2;
      playerCenterY = map.playerMapY + player.height / 2;
    } else {
      playerCenterX = player.x + player.width / 2;
      playerCenterY = player.y + player.height / 2;
    }

    const enemyCenterX = this.x + this.width / 2;
    const enemyCenterY = this.y + this.height / 2;

    const dx = playerCenterX - enemyCenterX;
    const dy = playerCenterY - enemyCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const attackModeConfig = config?.attackModes?.[this.currentAttackMode];
    if (attackModeConfig) {
      this.attackRange = attackModeConfig.attackRange;
      this.attackCooldown = attackModeConfig.attackCooldown;
      this.isRanged = attackModeConfig.isRanged;

      // console.log(`[临时测试] 远程敌人已生成，位置: (${this.x}, ${this.y}), isRanged: ${this.isRanged}, attackRange: ${this.attackRange}`);

      if (this.isRanged) {
        this.projectileSpeed = attackModeConfig.projectileSpeed;
        this.projectileDamage = attackModeConfig.projectileDamage;
      }
    }

    // Record current position before movement
    const oldX = this.x;
    const oldY = this.y;

    if (this.isRanged) {
      // 远程敌人：移动和攻击
      this.handleRangedMovement(distance, dx, dy);

      // 在攻击范围内且冷却完成时攻击
      const effectiveAttackRange = this.attackRange || 200;
      if (distance <= effectiveAttackRange && this.currentAttackCooldown <= 0) {
        this.fireProjectile(player);
        this.currentAttackCooldown = this.attackCooldown || 180;
      }
    } else {
      this.handleMeleeMovement(distance, dx, dy);
    }

    // Calculate movement direction after movement
    const moveDx = this.x - oldX;
    const moveDy = this.y - oldY;
    const moveDistance = Math.sqrt(moveDx * moveDx + moveDy * moveDy);

    if (moveDistance > 0.01) {
      this.lastMoveDirection.x = moveDx / moveDistance;
      this.lastMoveDirection.y = moveDy / moveDistance;
    } else {
      this.lastMoveDirection.x = 0;
      this.lastMoveDirection.y = 0;
    }

    if (this.flashTime > 0) {
      this.flashTime--;
    }

    this.checkPlayerCollision(player);

    this.checkBoundaries();
  }

  checkPlayerCollision(player) {
    // Collision damage is now handled by Main.checkPlayerEnemyCollisions()
    // which implements bidirectional collision damage regardless of
    // who initiated the collision.
    // This method is now minimal - enemy movement logic handles
    // orbiting behavior, so we don't push enemies away here.
    // Enemies will orbit slowly around player when in contact.
  }

  getSmartMoveDistance() {
    switch (this.type) {
      case ENEMY_TYPES.NORMAL:
        return 100;
      case ENEMY_TYPES.ELITE:
        return 150;
      case ENEMY_TYPES.RANGED:
        return 250;
      case ENEMY_TYPES.SUPER_ELITE:
        return 200;
      case ENEMY_TYPES.SUPER_BOSS:
        return 300;
      default:
        return 100;
    }
  }

  handleRangedMovement(distance, dx, dy) {
    // 获取实际攻击范围
    const effectiveAttackRange = this.attackRange || 200;

    const minDistance = effectiveAttackRange * 0.7; // 最小保持距离 (140px)

    if (distance > effectiveAttackRange) {
      // 距离大于攻击范围，追击玩家
      this.moveWithObstacleAvoidance(dx, dy, distance, 0.8);
    } else if (distance < minDistance) {
      // 距离太近（<100px），远离玩家
      this.moveWithObstacleAvoidance(-dx, -dy, distance, 0.6);
    }
    // 在 minDistance (140px) 和 effectiveAttackRange (200px) 之间时，保持静止
  }

  handleMeleeMovement(distance, dx, dy) {
    this.updateAIState();

    // Calculate contact distance (enemy width + player width) / 2
    const contactDistance = (this.width + GameGlobal.databus.player.width) / 2;
    const targetDistance = contactDistance + 2; // Target distance with 2px overlap

    if (distance > targetDistance) {
      // Distance greater than target, charge towards player
      this.moveWithObstacleAvoidance(dx, dy, distance, 1.0);
    } else {
      // In contact range - orbit slowly around player
      // Calculate perpendicular angle for orbit movement
      const angle = Math.atan2(dy, dx);
      const orbitAngle = angle + Math.PI / 2; // Perpendicular angle (90 degrees)

      const orbitDx = Math.cos(orbitAngle);
      const orbitDy = Math.sin(orbitAngle);

      // Very slow orbit around player (30% speed)
      // Enemies will circle around the player while maintaining contact
      this.moveWithObstacleAvoidance(orbitDx, orbitDy, 1, 0.3);
    }
  }

  moveWithObstacleAvoidance(dx, dy, distance, speedMultiplier = 1.0) {
    let moveX = 0, moveY = 0;
    if (distance > 0) {
      moveX = (dx / distance) * this.speed * speedMultiplier;
      moveY = (dy / distance) * this.speed * speedMultiplier;
    } else {
      moveX = dx * this.speed * speedMultiplier;
      moveY = dy * this.speed * speedMultiplier;
    }

    const newX = this.x + moveX;
    const newY = this.y + moveY;

    if (GameGlobal.databus.infiniteMap) {
      const canMoveMain = !GameGlobal.databus.infiniteMap.checkCollisionWithObstacles(newX, newY, this.width, this.height);

      if (canMoveMain) {
        this.x = newX;
        this.y = newY;
        this.aiState.isAvoiding = false;
        return true;
      } else {
        return this.tryAvoidObstacles(moveX, moveY);
      }
    } else {
      this.x = newX;
      this.y = newY;
      return true;
    }
  }

  tryAvoidObstacles(preferredMoveX, preferredMoveY) {
    const avoidanceStrength = 0.7;
    const angleStep = Math.PI / 4;

    const targetAngle = Math.atan2(preferredMoveY, preferredMoveX);

    const testAngles = [];
    for (let i = 1; i <= 3; i++) {
      const angleOffset = angleStep * i;
      testAngles.push(targetAngle + angleOffset);
      testAngles.push(targetAngle - angleOffset);
    }

    testAngles.sort((a, b) => {
      const diffA = Math.abs(a - targetAngle);
      const diffB = Math.abs(b - targetAngle);
      return diffA - diffB;
    });

    for (const testAngle of testAngles) {
      const testMoveX = Math.cos(testAngle) * this.speed * avoidanceStrength;
      const testMoveY = Math.sin(testAngle) * this.speed * avoidanceStrength;

      const testNewX = this.x + testMoveX;
      const testNewY = this.y + testMoveY;

      if (!GameGlobal.databus.infiniteMap.checkCollisionWithObstacles(testNewX, testNewY, this.width, this.height)) {
        this.x = testNewX;
        this.y = testNewY;
        this.aiState.isAvoiding = true;
        this.aiState.avoidanceAngle = testAngle;
        return true;
      }
    }

    if (Math.abs(preferredMoveX) > 0 || Math.abs(preferredMoveY) > 0) {
      const backAngle = Math.atan2(preferredMoveY, preferredMoveX) + Math.PI;
      const backMoveX = Math.cos(backAngle) * this.speed * 0.5;
      const backMoveY = Math.sin(backAngle) * this.speed * 0.5;

      const backNewX = this.x + backMoveX;
      const backNewY = this.y + backMoveY;

      if (!GameGlobal.databus.infiniteMap.checkCollisionWithObstacles(backNewX, backNewY, this.width, this.height)) {
        this.x = backNewX;
        this.y = backNewY;
        return true;
      }
    }

    return false;
  }

  updateAIState() {
    const posDeltaX = Math.abs(this.x - this.aiState.lastPosition.x);
    const posDeltaY = Math.abs(this.y - this.aiState.lastPosition.y);

    if (posDeltaX < 0.5 && posDeltaY < 0.5) {
      this.aiState.positionStuckFrames++;
    } else {
      this.aiState.positionStuckFrames = 0;
    }

    this.aiState.lastPosition.x = this.x;
    this.aiState.lastPosition.y = this.y;

    if (this.aiState.avoidanceCooldown > 0) {
      this.aiState.avoidanceCooldown--;
    }
  }

  handleRangedCombat(distance, smartMoveDistance, dx, dy) {
    const effectiveAttackRange = this.attackRange || 200;
    const effectiveAttackCooldown = this.attackCooldown || 180;

    if (distance <= effectiveAttackRange) {
      if (this.currentAttackCooldown <= 0) {
        this.fireProjectile(GameGlobal.databus.player);
        this.currentAttackCooldown = effectiveAttackCooldown;
      }

      if (distance < smartMoveDistance * 0.7) {
        const awayDx = -dx / distance;
        const awayDy = -dy / distance;
        this.moveWithObstacleAvoidance(awayDx, awayDy, 1, 0.5);
      } else {
        const angle = Math.atan2(dy, dx);
        const lateralAngle = angle + Math.PI / 2;
        const lateralDx = Math.cos(lateralAngle);
        const lateralDy = Math.sin(lateralAngle);

        const direction = Math.random() < 0.5 ? 1 : -1;
        this.moveWithObstacleAvoidance(lateralDx * direction, lateralDy * direction, 1, 0.3);
      }
    } else if (distance > smartMoveDistance * 1.3) {
      this.moveWithObstacleAvoidance(dx, dy, distance, 0.6);
    } else {
      const approachDx = dx / distance;
      const approachDy = dy / distance;
      this.moveWithObstacleAvoidance(approachDx, approachDy, 1, 0.5);
    }
  }

  checkBoundaries() {
    const margin = 50;
    if (GameGlobal.databus.infiniteMap) {
      const map = GameGlobal.databus.infiniteMap;
      if (this.x < -margin) this.x = -margin;
      if (this.y < -margin) this.y = -margin;
      if (this.x > map.mapWidth + margin) this.x = map.mapWidth + margin;
      if (this.y > map.mapHeight + margin) this.y = map.mapHeight + margin;
    } else {
      if (this.x < -margin) this.x = -margin;
      if (this.y < -margin) this.y = -margin;
      if (this.x > SCREEN_WIDTH + margin) this.x = SCREEN_WIDTH + margin;
      if (this.y > SCREEN_HEIGHT + margin) this.y = SCREEN_HEIGHT + margin;
    }
  }

  fireProjectile(player) {
    let playerCenterX, playerCenterY;
    if (GameGlobal.databus.infiniteMap) {
      const map = GameGlobal.databus.infiniteMap;
      playerCenterX = map.playerMapX + player.width / 2;
      playerCenterY = map.playerMapY + player.height / 2;
    } else {
      playerCenterX = player.x + player.width / 2;
      playerCenterY = player.y + player.height / 2;
    }

    const projectile = {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      damage: this.projectileDamage || this.damage,
      speed: this.projectileSpeed || 5,
      active: true,
      color: '#ff00ff',
      type: 'enemy_projectile',
      size: 15
    };

    const dx = playerCenterX - projectile.x;
    const dy = playerCenterY - projectile.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      projectile.vx = (dx / distance) * projectile.speed;
      projectile.vy = (dy / distance) * projectile.speed;
    } else {
      projectile.vx = 0;
      projectile.vy = -projectile.speed;
    }

    if (!GameGlobal.databus.enemyProjectiles) {
      GameGlobal.databus.enemyProjectiles = [];
    }
    GameGlobal.databus.enemyProjectiles.push(projectile);
  }

  takeDamage(amount) {
    // 破甲效果：敌人被破甲时，受伤增加50%
    if (this.armorBroken) {
      amount *= 1.5;
    }

    this.currentHealth -= amount;
    this.flashTime = 5;

    if (this.currentHealth <= 0) {
      this.die();
    }
  }

  applySlow(slowMultiplier, duration) {
    if (!this.originalSpeed) {
      this.originalSpeed = this.speed;
    }
    this.speed = this.originalSpeed * (1 - slowMultiplier);
    this.slowDuration = duration;
    this.slowed = true;
  }

  applyFreeze(duration) {
    this.frozen = true;
    this.freezeDuration = duration;
    // 冻结时速度降为 0
    if (!this.originalSpeed) {
      this.originalSpeed = this.speed;
    }
    this.speed = 0;
  }

  applyPoison(damage, duration) {
    this.poisoned = true;
    this.poisonDamage = damage;
    this.poisonDuration = duration;
  }

  applyBurn(damage, duration) {
    this.burning = true;
    this.burnDamage = damage;
    this.burnDuration = duration;
  }

  applyArmorBreak(duration) {
    this.armorBroken = true;
    this.armorBreakDuration = duration;
  }

  updateStatusEffects() {
    if (this.slowDuration > 0) {
      this.slowDuration--;
      if (this.slowDuration <= 0 && this.originalSpeed) {
        this.speed = this.originalSpeed;
        this.slowed = false;
      }
    }

    // 处理冻结效果
    if (this.frozen && this.freezeDuration > 0) {
      this.freezeDuration--;
      if (this.freezeDuration <= 0) {
        this.frozen = false;
        if (this.originalSpeed) {
          this.speed = this.originalSpeed;
        }
      }
    }

    // 处理中毒效果
    if (this.poisoned && this.poisonDuration > 0) {
      this.poisonDuration--;
      // 每帧造成中毒伤害
      if (this.poisonDamage > 0) {
        this.takeDamage(this.poisonDamage / 60);
      }
      if (this.poisonDuration <= 0) {
        this.poisoned = false;
        this.poisonDamage = 0;
      }
    }

    // 处理燃烧效果
    if (this.burning && this.burnDuration > 0) {
      this.burnDuration--;
      // 每帧造成燃烧伤害
      if (this.burnDamage > 0) {
        this.takeDamage(this.burnDamage / 60);
      }
      if (this.burnDuration <= 0) {
        this.burning = false;
        this.burnDamage = 0;
      }
    }

    // 处理破甲效果
    if (this.armorBroken && this.armorBreakDuration > 0) {
      this.armorBreakDuration--;
      if (this.armorBreakDuration <= 0) {
        this.armorBroken = false;
      }
    }
  }

  die() {
    this.isActive = false;
    this.visible = false;
    this.dropExp();

    // 能量虹吸：击败敌人后50%概率获得冷却-20%
    const player = GameGlobal.databus.player;
    if (player && player.energySiphon && Math.random() < 0.5) {
      if (player.weaponSystem) {
        // 临时减少冷却时间20%，持续300帧（5秒）
        player.weaponSystem.tempCooldownReduction = (player.weaponSystem.tempCooldownReduction || 0) + 0.2;
        player.weaponSystem.tempCooldownReductionDuration = 300;
      }
    }
    
    // 根据敌人类型增加不同的分数
    let baseScore = 0;
    switch (this.type) {
      case ENEMY_TYPES.NORMAL:
        baseScore = 10;
        break;
      case ENEMY_TYPES.RANGED:
        baseScore = 10;
        break;
      case ENEMY_TYPES.ELITE:
        baseScore = 25;
        break;
      case ENEMY_TYPES.SUPER_ELITE:
        baseScore = 60;
        break;
      case ENEMY_TYPES.SUPER_BOSS:
        baseScore = 150;
        break;
    }
    
    // 应用波次分数倍率
    let scoreMultiplier = 1.0;
    if (GameGlobal.mainInstance && GameGlobal.mainInstance.enemyEnhancementSystem) {
      scoreMultiplier = GameGlobal.mainInstance.enemyEnhancementSystem.scoreMultiplier || 1.0;
    }
    
    GameGlobal.databus.score += Math.floor(baseScore * scoreMultiplier);
    
    GameGlobal.databus.removeEnemy(this);

    if (GameGlobal.databus.coinSystem) {
      GameGlobal.databus.coinSystem.dropCoins(
        this.type,
        this.x + this.width / 2,
        this.y + this.height / 2
      );
    }

    if (this.type === ENEMY_TYPES.SUPER_BOSS && GameGlobal.databus.levelUpCallback) {
      console.log(`${this.getTypeDescription()} died - triggering level up`);
      GameGlobal.databus.levelUpCallback();
    }

    if (this.type === ENEMY_TYPES.SUPER_ELITE) {
      console.log(`${this.getTypeDescription()} died - dropping bonus`);
      this.dropBonusReward();
    }

    if (this.type === ENEMY_TYPES.SUPER_BOSS && GameGlobal.databus.itemSystem) {
      GameGlobal.databus.itemSystem.dropItemFromEnemy(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.type
      );
    }
  }

  getTypeDescription() {
    return enemyTypeManager.getDescription(this.type) || 'Unknown enemy type';
  }

  dropBonusReward() {
    const bonusExp = 200 + Math.floor(Math.random() * 50);

    if (!GameGlobal.databus.expBalls) {
      GameGlobal.databus.expBalls = [];
    }

    GameGlobal.databus.expBalls.push({
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      exp: bonusExp,
      active: true,
      size: 8,
      isBonus: true
    });

    if (GameGlobal.databus.itemSystem) {
      GameGlobal.databus.itemSystem.dropItemFromEnemy(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.type
      );
    }

    console.log(`Super Elite dropped ${bonusExp} bonus exp`);
  }

  dropExp() {
    if (!GameGlobal.databus.expBalls) {
      GameGlobal.databus.expBalls = [];
    }

    let dropRate = 0.65;
    if (this.type === ENEMY_TYPES.ELITE || this.type === ENEMY_TYPES.RANGED) {
      dropRate = 0.80;
    } else if (this.type === ENEMY_TYPES.SUPER_ELITE || this.type === ENEMY_TYPES.SUPER_BOSS) {
      dropRate = 1.0;
    }

    if (Math.random() < dropRate) {
      GameGlobal.databus.expBalls.push({
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        exp: this.exp,
        active: true,
        size: 5
      });
    }
  }

  render(ctx) {
    if (!this.visible || !this.isActive) return;

    ctx.save();

    const screenX = this.x;
    const screenY = this.y;

    if (this.flashTime > 0) {
      ctx.globalAlpha = 0.5;
    }

    ctx.fillStyle = this.color;
    ctx.fillRect(screenX, screenY, this.width, this.height);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, screenY, this.width, this.height);

    ctx.fillStyle = '#ffffff';
    const eyeSize = Math.min(4, this.width / 8);
    const eyeOffset = Math.min(8, this.width / 5);
    ctx.beginPath();
    ctx.arc(screenX + this.width / 2 - eyeOffset, screenY + this.height / 2, eyeSize, 0, Math.PI * 2);
    ctx.arc(screenX + this.width / 2 + eyeOffset, screenY + this.height / 2, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    if (this.isRanged) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(screenX + this.width / 2, screenY + this.height / 2, this.attackRange, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (this.isRanged && this.currentAttackCooldown > 0) {
      const progress = 1 - (this.currentAttackCooldown / this.attackCooldown);
      const radius = 5 + progress * 10;
      ctx.fillStyle = `rgba(0, 255, 255, ${0.3 + progress * 0.7})`;
      ctx.beginPath();
      ctx.arc(screenX + this.width / 2, screenY + this.height / 2, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 显示敌人血量条
    this.renderHealthBar(ctx, screenX, screenY);

    ctx.restore();
  }

  renderHealthBar(ctx, screenX, screenY) {
    const barWidth = this.width;
    const barHeight = 4;
    const x = screenX;
    const y = screenY - 8;

    const healthPercent = this.currentHealth / this.maxHealth;

    // 背景
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, barWidth, barHeight);

    // 根据敌人类型设置血条颜色
    let healthColor = '#ff0000'; // 默认红色
    if (this.type === 'elite' || this.type === 'ranged') {
      healthColor = '#ff8800'; // 精英怪橙色
    } else if (this.type === 'super_elite') {
      healthColor = '#ff00ff'; // 超级精英怪紫色
    } else if (this.type === 'super_boss') {
      healthColor = '#ffd700'; // Boss金色
    }

    ctx.fillStyle = healthColor;
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
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
