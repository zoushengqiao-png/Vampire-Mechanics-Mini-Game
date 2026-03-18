import '../render';
import { ctx } from '../render';
import Player from './player';
import Enemy from './enemy';
// import SceneObject from './sceneObject'; // 场景道具系统已移除
import BackGround from '../runtime/background';
import GameInfo from '../runtime/gameinfo';
import LevelUpSystem from './levelUpSystem';
import VirtualJoystick from '../runtime/virtualJoystick';
import DataBus from '../databus';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';
import CoinSystem from './coinSystem';
import ItemSystem from './itemSystem';
import InfiniteMap from './infiniteMap';
import AttributeSystem from './attributeSystem';
import ShopSystem from './shopSystem';

// console.log('=== Main module loaded ===');
// console.log('Before creating databus, GameGlobal.databus:', typeof GameGlobal.databus);

if (!GameGlobal.databus || !(GameGlobal.databus instanceof DataBus)) {
  // console.log('Creating new DataBus instance');
  GameGlobal.databus = new DataBus();
} else {
  // console.log('Using existing DataBus instance');
}
// console.log('After creating databus, GameGlobal.databus:', typeof GameGlobal.databus);
// console.log('Is DataBus instance:', GameGlobal.databus instanceof DataBus);

// 初始化新系统
GameGlobal.databus.coinSystem = new CoinSystem();
GameGlobal.databus.itemSystem = new ItemSystem();
GameGlobal.databus.infiniteMap = new InfiniteMap();

export default class Main {
  constructor() {
    // console.log('=== Main.constructor() called ===');
    // console.log('GameGlobal.databus type:', typeof GameGlobal.databus);
    // console.log('GameGlobal.databus is DataBus:', GameGlobal.databus instanceof DataBus);

    this.bg = new BackGround();
    this.player = new Player();
    this.gameInfo = new GameInfo();
    this.levelUpSystem = new LevelUpSystem();
    this.joystick = new VirtualJoystick();
    this.attributeSystem = new AttributeSystem();
    this.shopSystem = new ShopSystem();

    GameGlobal.databus.player = this.player;

    // 状态变量
    this.isPaused = false;
    this.showSettings = false;
    this.isRunning = false;  // 添加运行标志
    this.settings = {
      soundEffect: true,
      bgMusic: true
    };

    // 演示模式（游戏结束后的AI战斗演示）
    this.demoMode = {
      active: false,
      aiPlayer: null,
      enemies: [],
      waveNumber: 1,
      lastSpawnTime: 0,
      spawnInterval: 120 // 2秒生成一个敌人
    };

    // 过渡动画（点击开始游戏时的淡入淡出）
    this.transition = {
      active: false,
      alpha: 0,
      duration: 60, // 1 秒（60 帧）
      phase: 'out', // 'out' -> 'hold' -> 'in'
      callback: null,
      holdTime: 60, // 保持黑色遮罩的时间（1 秒）
      holdTimer: 0 // 保持阶段计时器
    };

    // 初始化无限地图
    GameGlobal.databus.infiniteMap.init();

    const callback = () => {
      // console.log('=== levelUpCallback executed ===');
      // console.log('this in callback:', this);
      // console.log('this.levelUpSystem:', this.levelUpSystem);
      this.levelUpSystem.trigger();
    };
    GameGlobal.databus.levelUpCallback = callback;
    // console.log('levelUpCallback registered successfully');
    // console.log('Callback function:', typeof callback);
    // console.log('Callback set on databus:', GameGlobal.databus.levelUpCallback);

    this.lastObjectSpawnTime = 0;
    this.objectSpawnInterval = 15000; // 每15秒生成一个道具

    // 新的波次敌人生成系统
    this.enemyEnhancementSystem = {
      baseIntensity: 1, // 初始强度倍率
      currentIntensity: 1, // 当前强度倍率
      startDelay: 3, // 3秒后开始生成敌人（180帧）
      waveCount: 0, // 波数计数
      currentStageIndex: 0, // 当前阶段索引
      difficultyNotification: null, // 难度提示通知
      notificationDuration: 180, // 通知显示3秒
      superEliteSpawned: 0, // 当前波次已生成的超级精英怪数量

      // 波次系统
      waveNumber: 0, // 当前波数
      initialWaveEnemyCount: 150, // 初始波次敌人总量
      firstWaveEnemyCount: 250, // 第一波及后续波次敌人总量
      waveGrowthRate: 0.25, // 波次增长率25%
      scoreMultiplier: 1.0, // 分数倍率（每波增加25%）

      // 当前波次信息
      currentWaveTotalEnemies: 150, // 当前波次敌人总量
      enemiesSpawnedInCurrentWave: 0, // 当前波次已生成敌人数量
      waveStartTime: 0, // 当前波次开始时间（帧）
      waveDuration: 5400, // 每波持续时间90秒（5400帧）
      spawnInterval: 300, // 生成间隔5秒（300帧）
      lastSpawnTime: 0, // 上次生成时间
      waveComplete: false, // 当前波次是否完成
      nextWaveDelay: 300, // 下一波延迟5秒（300帧）
      nextWaveTimer: 0, // 下一波计时器

      // 特殊敌人出现条件（基于剩余敌人比例）
      eliteThreshold: 0.60, // 精英怪在剩余60%时出现
      superEliteThreshold: 0.40, // 超级精英怪在剩余40%时出现
      bossThreshold: 0.20, // Boss在剩余20%时出现

      // 调试信息
      debugInfo: {
        currentWave: 0,
        waveTotalEnemies: 0,
        spawnedEnemies: 0,
        remainingEnemies: 0,
        progress: 0,
        waveStatus: ''
      }
    };

    this.init();
  }

  init() {
    this.reset();
    this.start();

    // 临时测试代码已注释
    // setTimeout(() => {
    //   if (GameGlobal.databus.infiniteMap) {
    //     const map = GameGlobal.databus.infiniteMap;
    //     const angle = Math.random() * Math.PI * 2;
    //     const spawnDistance = 300;
    //     const spawnX = map.playerMapX + Math.cos(angle) * spawnDistance;
    //     const spawnY = map.playerMapY + Math.sin(angle) * spawnDistance;
    //     const rangedEnemy = new Enemy();
    //     rangedEnemy.x = spawnX;
    //     rangedEnemy.y = spawnY;
    //     const tempEnemy = new Enemy();
    //     tempEnemy.init('ranged', 1.0);
    //     rangedEnemy.width = tempEnemy.width;
    //     rangedEnemy.height = tempEnemy.height;
    //     rangedEnemy.type = tempEnemy.type;
    //     rangedEnemy.maxHealth = tempEnemy.maxHealth;
    //     rangedEnemy.currentHealth = tempEnemy.currentHealth;
    //     rangedEnemy.speed = tempEnemy.speed;
    //     rangedEnemy.damage = tempEnemy.damage;
    //     rangedEnemy.exp = tempEnemy.exp;
    //     rangedEnemy.color = tempEnemy.color;
    //     rangedEnemy.isRanged = tempEnemy.isRanged;
    //     rangedEnemy.attackRange = tempEnemy.attackRange;
    //     rangedEnemy.attackCooldown = tempEnemy.attackCooldown;
    //     rangedEnemy.currentAttackCooldown = 0;
    //     rangedEnemy.projectileSpeed = tempEnemy.projectileSpeed;
    //     rangedEnemy.projectileDamage = tempEnemy.projectileDamage;
    //     rangedEnemy.isActive = true;
    //     rangedEnemy.visible = true;
    //     rangedEnemy.flashTime = 0;
    //     rangedEnemy.collisionCooldown = 0;
    //     rangedEnemy.aiState = {
    //       lastMoveAttempt: { x: 0, y: 0 },
    //       stuckFrames: 0,
    //       stuckThreshold: 30,
    //       avoidanceAngle: 0,
    //       isAvoiding: false,
    //       avoidanceCooldown: 0,
    //       lastPosition: { x: spawnX, y: spawnY },
    //       positionStuckFrames: 0
    //     };
    //     GameGlobal.databus.enemies.push(rangedEnemy);
    //   }
    // }, 5000);
  }

  reset() {
    // 先恢复 GameGlobal.databus.player（避免演示模式影响）
    GameGlobal.databus.player = this.player;
    
    // console.log('=== Main.reset() called ===');
    // console.log('Before reset, levelUpCallback:', GameGlobal.databus.levelUpCallback);
    GameGlobal.databus.reset();
    // console.log('After reset, levelUpCallback:', GameGlobal.databus.levelUpCallback);
    this.player.reset();
    this.levelUpSystem.reset();

    // 停止演示模式
    this.demoMode.active = false;

    // 重新生成地图（随机刷新障碍物）
    const map = GameGlobal.databus.infiniteMap;
    if (map) {
      // 清空固定障碍物，让地图重新生成
      map.fixedObstacles = [];
      map.itemBoxes = [];
      map.init();
    }

    // 玩家在地图随机位置复活
    if (map) {
      const margin = 100;
      const newX = margin + Math.random() * (map.mapWidth - margin * 2 - this.player.width);
      const newY = margin + Math.random() * (map.mapHeight - margin * 2 - this.player.height);
      map.playerMapX = newX;
      map.playerMapY = newY;
      map.offsetX = SCREEN_WIDTH / 2 - newX - this.player.width / 2;
      map.offsetY = SCREEN_HEIGHT / 2 - newY - this.player.height / 2;
      console.log(`[重新开始] 玩家在随机位置复活: (${newX.toFixed(0)}, ${newY.toFixed(0)})`);
    }

    // 确保玩家可见且在屏幕中心渲染
    this.player.visible = true;
    this.player.isActive = true;
    this.player.x = SCREEN_WIDTH / 2 - this.player.width / 2;
    this.player.y = SCREEN_HEIGHT / 2 - this.player.height / 2;

    this.gameFrame = 0;
    this.waveTime = 0;
    this.difficulty = 1;
    this.lastObjectSpawnTime = 0;

    // 重置敌人增强系统
    this.enemyEnhancementSystem.currentIntensity = this.enemyEnhancementSystem.baseIntensity;
    this.enemyEnhancementSystem.waveCount = 0;
    this.enemyEnhancementSystem.currentStageIndex = 0;
    this.enemyEnhancementSystem.difficultyNotification = null;
    this.enemyEnhancementSystem.superEliteSpawned = 0;

    // 重置波次系统
    this.enemyEnhancementSystem.waveNumber = 0;
    this.enemyEnhancementSystem.currentWaveTotalEnemies = 150;
    this.enemyEnhancementSystem.enemiesSpawnedInCurrentWave = 0;
    this.enemyEnhancementSystem.waveStartTime = 0;
    this.enemyEnhancementSystem.lastSpawnTime = 0;
    this.enemyEnhancementSystem.waveComplete = false;
    this.enemyEnhancementSystem.nextWaveTimer = 0;
    this.enemyEnhancementSystem.scoreMultiplier = 1.0;

    // 重置调试信息
    this.enemyEnhancementSystem.debugInfo = {
      currentWave: 0,
      waveTotalEnemies: 0,
      spawnedEnemies: 0,
      remainingEnemies: 0,
      progress: 0,
      waveStatus: ''
    };
  }

  start() {
    // 先停止旧 loop（确保只有一个 loop 运行）
    this.isRunning = false;
    
    // 取消旧循环
    if (this.aniId) {
      cancelAnimationFrame(this.aniId);
    }
    
    // 等待一小段时间，确保旧 loop 完全停止
    setTimeout(() => {
      // 启动新 loop
      this.isRunning = true;
      
      // 定义循环函数（使用递归确保只有一个 loop）
      const loopFunc = () => {
        if (!this.isRunning) return;
        this.update();
        this.render();
        this.aniId = requestAnimationFrame(loopFunc);
      };
      
      // 启动循环
      loopFunc();
    }, 100);
  }

  update() {
    // 更新过渡动画
    if (this.transition.active) {
      this.updateTransition();
      return;
    }

    // 更新演示模式（游戏结束后的AI战斗）
    if (this.demoMode.active) {
      this.updateDemoMode();
      return;
    }

    if (GameGlobal.databus.isGameOver) return;

    // 暂停时冻结游戏
    if (this.isPaused) return;

    if (this.levelUpSystem.isPaused) {
      this.levelUpSystem.update();
      return;
    }

    this.gameFrame++;
    this.waveTime++;
    GameGlobal.databus.frame++;

    // 更新敌人增强系统
    this.updateEnemyEnhancement();

    // 处理虚拟方向盘持续移动
    if (this.joystick.isActive) {
      const direction = this.joystick.direction;
      const angle = this.joystick.angle;
      if (Math.abs(direction.x) > 0.1 || Math.abs(direction.y) > 0.1) {
        // 玩家移动，地图跟随（相机系统）
        this.player.moveWithJoystick(direction, angle);
      } else {
        this.player.isMoving = false;
      }
    } else {
      this.player.isMoving = false;
    }

    this.spawnEnemies();
    // 道具箱由infiniteMap系统管理，不再使用spawnSceneObjects
    // this.spawnSceneObjects();
    this.player.update();

    // 更新无限地图（清理障碍物）
    if (GameGlobal.databus.infiniteMap) {
      GameGlobal.databus.infiniteMap.update();
    }

    // 更新敌人投射物
    this.updateEnemyProjectiles();

    // 更新敌人（这会让敌人移动和攻击）
    GameGlobal.databus.enemies.forEach(enemy => {
      if (enemy.isActive) {
        enemy.update(this.player);
      }
    });

    // 双向碰撞检测：确保无论谁先移动，碰撞都会被检测到
    // 这个检测在敌人和玩家都更新完毕后执行，避免更新顺序导致的碰撞遗漏
    this.checkPlayerEnemyCollisions();

    // 过滤不活跃的敌人
    GameGlobal.databus.enemies = GameGlobal.databus.enemies.filter(
      enemy => enemy.isActive
    );

    // 场景道具系统已移除，不再过滤 sceneObjects
    // GameGlobal.databus.sceneObjects = GameGlobal.databus.sceneObjects.filter(
    //   obj => obj.isActive
    // );

    GameGlobal.databus.healItems = GameGlobal.databus.healItems.filter(
      item => item.active
    );

    if (this.player.stats.currentHealth <= 0) {
      GameGlobal.databus.gameOver();
      
      // 延迟启动演示模式（等待游戏结束状态稳定）
      setTimeout(() => {
        this.initDemoMode();
      }, 100);
    }
  }

  spawnEnemies() {
    const system = this.enemyEnhancementSystem;

    // 延迟开始生成敌人
    if (this.gameFrame < system.startDelay * 60) return;

    // 如果当前波次完成，等待下一波
    if (system.waveComplete) {
      system.nextWaveTimer++;

      // 等待5秒后开始下一波
      if (system.nextWaveTimer >= system.nextWaveDelay) {
        this.startNextWave();
      }
      return;
    }

    // 检查是否需要开始新波次
    if (system.enemiesSpawnedInCurrentWave === 0 && system.waveStartTime === 0) {
      system.waveStartTime = this.gameFrame;
      console.log(`\n========== 开始第${system.waveNumber}波 ==========`);
      console.log(`[波次信息] 敌人总量: ${system.currentWaveTotalEnemies}, 生成间隔: ${system.spawnInterval / 60}秒`);
    }

    // 检查是否所有敌人生成完毕
    if (system.enemiesSpawnedInCurrentWave >= system.currentWaveTotalEnemies) {
      system.waveComplete = true;
      console.log(`[波次完成] 第${system.waveNumber}波所有敌人生成完毕，共${system.enemiesSpawnedInCurrentWave}个`);
      return;
    }

    // 计算生成间隔
    const timeSinceLastSpawn = this.gameFrame - system.lastSpawnTime;

    // 达到生成间隔，生成敌人
    if (timeSinceLastSpawn >= system.spawnInterval) {
      this.spawnWaveEnemies();
      system.lastSpawnTime = this.gameFrame;
    }
  }

  // 开始下一波
  startNextWave() {
    const system = this.enemyEnhancementSystem;

    system.waveNumber++;
    system.waveCount = system.waveNumber;

    // 计算新波次的敌人总量
    if (system.waveNumber === 1) {
      // 第一波：250个敌人
      system.currentWaveTotalEnemies = system.firstWaveEnemyCount;
    } else {
      // 后续波次：每波增长25%
      system.currentWaveTotalEnemies = Math.floor(system.firstWaveEnemyCount * Math.pow(1 + system.waveGrowthRate, system.waveNumber - 1));
    }

    // 重置波次状态
    system.enemiesSpawnedInCurrentWave = 0;
    system.waveStartTime = 0;
    system.lastSpawnTime = 0;
    system.waveComplete = false;
    system.nextWaveTimer = 0;
    system.superEliteSpawned = 0;

    // 更新强度倍率
    system.currentIntensity = 2.0 + system.waveNumber;
    this.difficulty = system.currentIntensity;

    // 更新分数倍率（每波增加25%）
    if (system.waveNumber > 0) {
      system.scoreMultiplier = 1.0 + (system.waveNumber - 1) * 0.25;
    }

    // 数字转中文
    const toChineseNumber = (num) => {
      const chineseNums = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
      if (num <= 10) return chineseNums[num];
      if (num < 20) return '十' + (num > 10 ? chineseNums[num - 10] : '');
      if (num < 100) {
        const ten = Math.floor(num / 10);
        const one = num % 10;
        return (ten > 1 ? chineseNums[ten] : '') + '十' + (one > 0 ? chineseNums[one] : '');
      }
      return num.toString();
    };

    // 显示波次通知
    const waveText = toChineseNumber(system.waveNumber);
    this.showDifficultyNotification(
      `第${waveText}波！敌人总量${system.currentWaveTotalEnemies}个`,
      '#ff8800'
    );

    console.log(`[波次切换] 开始第${waveText}波，敌人总量: ${system.currentWaveTotalEnemies}，强度: ${system.currentIntensity}倍，分数倍率: ${system.scoreMultiplier.toFixed(2)}倍`);
  }

  // 生成当前波次的敌人
  spawnWaveEnemies() {
    const system = this.enemyEnhancementSystem;

    // 计算本次生成的敌人数量
    // 总量在90秒内分18批次生成（每5秒一次）
    const totalBatches = Math.floor(system.waveDuration / system.spawnInterval); // 18批次
    const remainingEnemies = system.currentWaveTotalEnemies - system.enemiesSpawnedInCurrentWave;
    const remainingBatches = totalBatches - Math.floor((this.gameFrame - system.waveStartTime) / system.spawnInterval);

    // 均匀分配剩余敌人到剩余批次
    let enemiesToSpawn = Math.ceil(remainingEnemies / Math.max(1, remainingBatches));

    // 确保不超过剩余数量
    enemiesToSpawn = Math.min(enemiesToSpawn, remainingEnemies);

    // 获取当前强度倍率
    let intensityMultiplier = system.currentIntensity;

    // 第0波强度倍率：降低60%（0.4倍）
    if (system.waveNumber === 0) {
      intensityMultiplier = 0.4;
    }

    // 根据剩余敌人比例确定特殊敌人类型
    const remainingRatio = remainingEnemies / system.currentWaveTotalEnemies;

    // 生成敌人
    for (let i = 0; i < enemiesToSpawn; i++) {
      const enemyType = this.selectEnemyTypeByRemainingRatio(remainingRatio);
      const enemy = new Enemy();

      let finalIntensityMultiplier = intensityMultiplier;

      // 超级Boss：强度为原Boss的20-30倍
      if (enemyType === 'super_boss') {
        const waveCount = system.waveCount;
        let superBossMultiplier;

        if (waveCount <= 3) {
          const rand = Math.random();
          if (rand < 0.5) superBossMultiplier = 20;
          else if (rand < 0.8) superBossMultiplier = 21;
          else if (rand < 0.95) superBossMultiplier = 22;
          else superBossMultiplier = 23;
        } else if (waveCount <= 7) {
          const rand = Math.random();
          if (rand < 0.3) superBossMultiplier = 22;
          else if (rand < 0.6) superBossMultiplier = 24;
          else if (rand < 0.85) superBossMultiplier = 26;
          else superBossMultiplier = 27;
        } else {
          const rand = Math.random();
          if (rand < 0.2) superBossMultiplier = 25;
          else if (rand < 0.5) superBossMultiplier = 26;
          else if (rand < 0.75) superBossMultiplier = 28;
          else if (rand < 0.9) superBossMultiplier = 29;
          else superBossMultiplier = 30;
        }

        finalIntensityMultiplier *= superBossMultiplier;
      }
      // 超级精英怪：强度为精英怪的5-10倍
      else if (enemyType === 'super_elite') {
        const waveCount = system.waveCount;
        let eliteMultiplier;

        if (waveCount <= 3) {
          const rand = Math.random();
          if (rand < 0.5) eliteMultiplier = 5;
          else if (rand < 0.9) eliteMultiplier = 6;
          else eliteMultiplier = 7;
        } else if (waveCount <= 7) {
          const rand = Math.random();
          if (rand < 0.3) eliteMultiplier = 6;
          else if (rand < 0.7) eliteMultiplier = 7;
          else eliteMultiplier = 8;
        } else {
          const rand = Math.random();
          if (rand < 0.25) eliteMultiplier = 7;
          else if (rand < 0.5) eliteMultiplier = 8;
          else if (rand < 0.75) eliteMultiplier = 9;
          else eliteMultiplier = 10;
        }

        finalIntensityMultiplier *= eliteMultiplier;
      }

      enemy.init(enemyType, finalIntensityMultiplier);
      this.spawnEnemyAtRandomPosition(enemy);
      GameGlobal.databus.enemies.push(enemy);

      system.enemiesSpawnedInCurrentWave++;

      // 如果生成的是超级Boss，停止本次批次生成
      if (enemyType === 'super_boss') {
        break;
      }
    }

    // console.log(`[生成敌人] 波次${system.waveNumber}, 本次生成${enemiesToSpawn}个, 已生成${system.enemiesSpawnedInCurrentWave}/${system.currentWaveTotalEnemies}`);
  }

  // 根据剩余敌人比例选择敌人类型
  selectEnemyTypeByRemainingRatio(remainingRatio) {
    const rand = Math.random();
    const level = this.player.stats.level;
    const system = this.enemyEnhancementSystem;

    // Boss：剩余20%时出现，玩家等级≥10，5%概率
    if (remainingRatio <= system.bossThreshold && level >= 10 && rand < 0.05) {
      const bossCount = GameGlobal.databus.enemies.filter(e => e.type === 'super_boss').length;
      if (bossCount === 0) {
        return 'super_boss';
      }
    }

    // 超级精英怪：剩余40%时出现，玩家等级≥10，10%概率
    if (remainingRatio <= system.superEliteThreshold && level >= 10 && rand < 0.1) {
      const maxSuperElite = system.waveCount + 1;
      if (system.superEliteSpawned < maxSuperElite) {
        system.superEliteSpawned++;
        return 'super_elite';
      }
    }

    // 精英怪：剩余60%时出现，玩家等级≥5，15%概率
    if (remainingRatio <= system.eliteThreshold && level >= 5 && rand < 0.25) {
      return 'elite';
    }

    // 远程怪物：玩家等级≥3，10%概率
    if (level >= 3 && rand < 0.15) {
      return 'ranged';
    }

    // 普通怪物：默认类型
    return 'normal';
  }

  // 在地图范围内生成敌人
  spawnEnemyAtRandomPosition(enemy) {
    // 如果没有地图,使用屏幕坐标
    if (!GameGlobal.databus.infiniteMap) {
      // 从屏幕四个边缘随机选择一个方向生成
      const side = Math.floor(Math.random() * 4);
      const offset = 30; // 距离屏幕的距离

      switch (side) {
        case 0: // 上方
          enemy.x = Math.random() * SCREEN_WIDTH;
          enemy.y = -enemy.height - offset;
          break;
        case 1: // 右方
          enemy.x = SCREEN_WIDTH + offset;
          enemy.y = Math.random() * SCREEN_HEIGHT;
          break;
        case 2: // 下方
          enemy.x = Math.random() * SCREEN_WIDTH;
          enemy.y = SCREEN_HEIGHT + offset;
          break;
        case 3: // 左方
          enemy.x = -enemy.width - offset;
          enemy.y = Math.random() * SCREEN_HEIGHT;
          break;
      }
      return;
    }

    // 使用地图坐标系统 - 在整个地图范围内随机生成
    const map = GameGlobal.databus.infiniteMap;

    // 在整个地图范围内随机生成敌人（避开固定道具10像素范围内）
    const margin = 100; // 边缘缓冲区
    const obstacleMargin = 10; // 固定道具边距
    let x, y, isValidPosition;
    let attempts = 0;
    const maxAttempts = 50;

    do {
      x = margin + Math.random() * (map.mapWidth - enemy.width - margin * 2);
      y = margin + Math.random() * (map.mapHeight - enemy.height - margin * 2);

      isValidPosition = true;

      // 检查是否与固定道具重叠（避开10像素范围内）
      for (const obstacle of map.fixedObstacles) {
        if (!obstacle.active) continue;

        // AABB碰撞检测（带10像素边距）
        const overlapping = !(
          x + enemy.width + obstacleMargin < obstacle.x ||
          x - obstacleMargin > obstacle.x + obstacle.width ||
          y + enemy.height + obstacleMargin < obstacle.y ||
          y - obstacleMargin > obstacle.y + obstacle.height
        );

        if (overlapping) {
          isValidPosition = false;
          break;
        }
      }

      attempts++;
    } while (!isValidPosition && attempts < maxAttempts);

    if (isValidPosition) {
      enemy.x = x;
      enemy.y = y;
    } else {
      // 如果多次尝试都失败，使用边缘位置作为后备方案
      enemy.x = margin;
      enemy.y = margin;
    }
  }

  // ===== 保留的辅助函数 =====

  // 在屏幕范围外生成敌人

  // spawnSceneObjects() {
  //   const currentTime = Date.now();
  //   
  //   // 获取地图尺寸
  //   const mapWidth = GameGlobal.databus.infiniteMap ? GameGlobal.databus.infiniteMap.mapWidth : 2000;
  //   const mapHeight = GameGlobal.databus.infiniteMap ? GameGlobal.databus.infiniteMap.mapHeight : 2000;
  //   
  //   // 初始化时生成第一个道具
  //   if (GameGlobal.databus.sceneObjects.length === 0 && this.gameFrame === 1) {
  //     const obj = new SceneObject();
  //     obj.init(mapWidth, mapHeight);
  //     GameGlobal.databus.sceneObjects.push(obj);
  //     this.lastObjectSpawnTime = currentTime;
  //     return;
  //   }

  //   // 根据游戏时间动态计算生成间隔（毫秒）
  //   const gameTimeInSeconds = this.gameFrame / 60; // 游戏时间（秒）
  //   let spawnInterval;
  //   
  //   if (gameTimeInSeconds < 300) {
  //     // 1-5分钟：1分钟生成一次
  //     spawnInterval = 60000; // 60秒
  //   } else if (gameTimeInSeconds < 600) {
  //     // 5-10分钟：2分钟生成一次
  //     spawnInterval = 120000; // 120秒
  //   } else {
  //     // 10分钟后：3分钟生成一次
  //     spawnInterval = 180000; // 180秒
  //   }

  //   // 按间隔生成新道具
  //   if (currentTime - this.lastObjectSpawnTime > spawnInterval) {
  //     const obj = new SceneObject();
  //     obj.init(mapWidth, mapHeight);
  //     GameGlobal.databus.sceneObjects.push(obj);
  //     this.lastObjectSpawnTime = currentTime;
  //   }
  // }

  isPlayerNearItem(item) {
    const player = this.player;
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const itemCenterX = item.x;
    const itemCenterY = item.y;
    
    const dx = playerCenterX - itemCenterX;
    const dy = playerCenterY - itemCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 拾取范围
    const pickupRange = 30;
    return distance < pickupRange;
  }

  selectEnemyType() {
    const rand = Math.random();
    const level = this.player.stats.level;

    // 远程怪物：玩家等级≥3，15%概率
    if (level >= 3 && rand < 0.15) {
      return 'ranged';
    }
    // 精英怪物：玩家等级≥5，10%概率
    else if (level >= 5 && rand < 0.25) {
      return 'elite';
    }
    // 普通怪物：默认类型
    return 'normal';
  }

  render() {
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 过渡动画期间，只渲染动画，不渲染游戏内容（避免卡顿和画面闪烁）
    if (this.transition.active) {
      this.renderTransition(ctx);
      return;
    }

    // 判断是否需要隐藏游戏 UI（显示弹窗时）
    const shouldHideGameUI = this.isPaused ||
                              this.showSettings ||
                              this.shopSystem.isVisible ||
                              this.attributeSystem.isVisible ||
                              GameGlobal.databus.isGameOver;

    // 判断是否处于演示模式（游戏结束后的 AI 战斗演示）
    const isDemoMode = this.demoMode.active;

    // 渲染地图背景（所有情况下都渲染）
    this.bg.render(ctx);

    // 保存上下文,应用地图偏移
    ctx.save();

    // 地图跟随玩家移动（相机系统）
    if (GameGlobal.databus.infiniteMap) {
      const map = GameGlobal.databus.infiniteMap;
      ctx.translate(map.offsetX, map.offsetY);
    }

    // 渲染无限地图（障碍物）- 演示模式不渲染地图（避免红线）
    if (GameGlobal.databus.infiniteMap && !isDemoMode) {
      GameGlobal.databus.infiniteMap.render(ctx);
    }

    // 恢复上下文，移除地图偏移
    ctx.restore();

    // 演示模式：渲染AI玩家和敌人
    if (isDemoMode) {
      this.renderDemoMode(ctx);
    }

    // 如果需要隐藏游戏UI，只渲染弹窗
    if (shouldHideGameUI) {
      // 渲染暂停界面（非游戏结束时）
      if (!GameGlobal.databus.isGameOver) {
        this.renderPause(ctx);
      }

      // 渲染游戏结束界面
      if (GameGlobal.databus.isGameOver) {
        this.renderGameOver(ctx);
      }

      // 渲染设置弹窗
      this.renderSettings(ctx);

      // 渲染商城界面
      this.shopSystem.render(ctx);

      // 渲染属性界面
      this.attributeSystem.render(ctx);

      return; // 提前返回，不渲染游戏UI
    }

    // 以下是游戏进行时的渲染

    // 重新保存上下文，应用地图偏移（用于渲染游戏对象）
    ctx.save();

    // 地图跟随玩家移动（相机系统）
    if (GameGlobal.databus.infiniteMap) {
      const map = GameGlobal.databus.infiniteMap;
      ctx.translate(map.offsetX, map.offsetY);
    }

    // 所有地图对象都使用地图坐标渲染
    GameGlobal.databus.enemies.forEach((enemy) => enemy.render(ctx));

    // 渲染玩家投射物（使用地图坐标）
    this.renderPlayerProjectiles(ctx);

    this.renderExpBalls(ctx);
    this.renderHealItems(ctx);
    this.renderEnemyProjectiles(ctx);

    // 渲染金币
    if (GameGlobal.databus.coinSystem) {
      GameGlobal.databus.coinSystem.render(ctx);
    }

    // 渲染道具
    if (GameGlobal.databus.itemSystem) {
      GameGlobal.databus.itemSystem.render(ctx);
    }

    // 恢复上下文，移除地图偏移
    ctx.restore();

    // 玩家在屏幕中心渲染（不受地图偏移影响）
    this.player.render(ctx);

    this.gameInfo.render(ctx);

    // 渲染虚拟方向盘
    this.joystick.render(ctx);

    if (this.levelUpSystem.isPaused) {
      // console.log('Main.render() - Rendering level up popup');
      this.levelUpSystem.render(ctx);
    }

    // 渲染暂停界面
    this.renderPause(ctx);

    // 渲染设置弹窗（设置弹窗时只显示地图背景，隐藏所有 UI）
    if (this.showSettings) {
      // 渲染遮罩
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      // 渲染设置弹窗
      this.renderSettings(ctx);
    } else {
      // 渲染商城界面
      this.shopSystem.render(ctx);

      // 渲染属性界面
      this.attributeSystem.render(ctx);
    }

    if (GameGlobal.databus.isGameOver) {
      this.renderGameOver(ctx);
    }

    // 渲染难度通知
    this.renderDifficultyNotification(ctx);

    // 渲染过渡动画（最后渲染，覆盖在最上层）
    this.renderTransition(ctx);
  }

  // 渲染世界坐标线
  renderWorldGrid(ctx) {
    const gridSpacing = 200; // 每200像素一条线

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // 绘制垂直线
    for (let x = 0; x <= 2000; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 2000);
      ctx.stroke();

      // 绘制坐标文字
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(x.toString(), x, 15);
    }

    // 绘制水平线
    for (let y = 0; y <= 2000; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(2000, y);
      ctx.stroke();

      // 绘制坐标文字
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(y.toString(), 5, y - 5);
    }

    ctx.restore();
  }

  renderPlayerProjectiles(ctx) {
    // 调试用：每60帧打印一次（已注释）
    // if (GameGlobal.databus.frame % 60 === 0) {
    //   console.log(`[玩家投射物渲染] 投射物数量: ${this.player.weaponSystem.projectiles.length}`);
    // }

    // 渲染玩家投射物（需要在地图偏移上下文中调用）
    if (this.player && this.player.weaponSystem) {
      this.player.weaponSystem.renderProjectiles(ctx);
    }
  }

  renderExpBalls(ctx) {
    // 经验球已经在 ctx.translate 内部，直接使用世界坐标
    GameGlobal.databus.expBalls.forEach(ball => {
      if (!ball.active) return;

      // 根据经验值设置颜色
      let color = '#00ff00'; // 默认绿色 (0-20)
      if (ball.exp > 60) {
        color = '#ff0000'; // 红色 (60以上)
      } else if (ball.exp > 40) {
        color = '#ffff00'; // 黄色 (40-60)
      } else if (ball.exp > 20) {
        color = '#0080ff'; // 蓝色 (20-40)
      }

      ctx.save(); // 保存当前画布状态

      // 经验球使用世界坐标，不需要额外偏移
      const renderX = ball.x;
      const renderY = ball.y;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(renderX, renderY, ball.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // 恢复画布状态，清除发光效果
    });
  }

  renderHealItems(ctx) {
    // 回血道具已经在 ctx.translate 内部，直接使用世界坐标
    GameGlobal.databus.healItems.forEach(item => {
      if (!item.active) return;

      ctx.save(); // 保存当前画布状态

      // 回血道具使用世界坐标，不需要额外偏移
      const renderX = item.x;
      const renderY = item.y;

      // 绘制回血道具（红色心形）
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();

      // 绘制心形
      const size = item.size;

      ctx.moveTo(renderX, renderY + size * 0.3);
      ctx.bezierCurveTo(renderX - size * 0.5, renderY - size * 0.3, renderX - size, renderY + size * 0.2, renderX, renderY + size);
      ctx.bezierCurveTo(renderX + size, renderY + size * 0.2, renderX + size * 0.5, renderY - size * 0.3, renderX, renderY + size * 0.3);
      ctx.fill();

      // 绘制白色边框
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore(); // 恢复画布状态，清除发光效果
    });
  }

  // 更新敌人投射物
  updateEnemyProjectiles() {
    if (!GameGlobal.databus.enemyProjectiles) {
      GameGlobal.databus.enemyProjectiles = [];
      return;
    }

    // 调试用：打印投射物数量（已注释）
    // if (GameGlobal.databus.enemyProjectiles.length > 0 && GameGlobal.databus.frame % 30 === 0) {
    //   console.log(`[投射物更新] 活跃投射物数量: ${GameGlobal.databus.enemyProjectiles.length}`);
    //   GameGlobal.databus.enemyProjectiles.forEach((proj, i) => {
    //     if (proj.active) {
    //       console.log(`  投射物[${i}]: 位置(${proj.x.toFixed(0)}, ${proj.y.toFixed(0)}), 速度(${proj.vx.toFixed(2)}, ${proj.vy.toFixed(2)})`);
    //     }
    //   });
    // }

    // 获取地图偏移量（如果存在）
    let offsetX = 0;
    let offsetY = 0;
    if (GameGlobal.databus.infiniteMap) {
      const map = GameGlobal.databus.infiniteMap;
      offsetX = map.offsetX;
      offsetY = map.offsetY;
    }

    GameGlobal.databus.enemyProjectiles.forEach(projectile => {
      if (!projectile.active) return;

      // 更新位置
      projectile.x += projectile.vx;
      projectile.y += projectile.vy;

      // 计算投射物的屏幕坐标
      const screenX = projectile.x + offsetX;
      const screenY = projectile.y + offsetY;

      // 检测是否超出屏幕
      if (screenX < -50 || screenX > SCREEN_WIDTH + 50 ||
          screenY < -50 || screenY > SCREEN_HEIGHT + 50) {
        projectile.active = false;
        // console.log(`[投射物移除] 超出屏幕范围`);
        return;
      }

      // 检测与固定道具的碰撞（不可破坏的障碍物）
      if (GameGlobal.databus.infiniteMap) {
        const projectileSize = projectile.size || 8;
        const isCollidingWithObstacle = GameGlobal.databus.infiniteMap.checkCollisionWithObstacles(
          projectile.x - projectileSize / 2,
          projectile.y - projectileSize / 2,
          projectileSize,
          projectileSize
        );

        if (isCollidingWithObstacle) {
          projectile.active = false;
          // console.log(`[投射物被阻挡] 击中固定道具`);
          return;
        }
      }

      // 检测与玩家的碰撞
      if (this.isProjectileHitPlayer(projectile)) {
        this.player.takeDamage(projectile.damage);
        projectile.active = false;
        // console.log(`[投射物命中] 玩家受到 ${projectile.damage} 点伤害`);
      }
    });

    // 清理不活跃的投射物
    const oldLength = GameGlobal.databus.enemyProjectiles.length;
    GameGlobal.databus.enemyProjectiles = GameGlobal.databus.enemyProjectiles.filter(
      projectile => projectile.active
    );
    const newLength = GameGlobal.databus.enemyProjectiles.length;
    // if (oldLength !== newLength) {
    //   console.log(`[投射物清理] 清理前: ${oldLength}, 清理后: ${newLength}`);
    // }
  }

  // 检测投射物是否击中玩家
  isProjectileHitPlayer(projectile) {
    const player = this.player;

    // 获取玩家在世界地图中的位置
    let playerCenterX, playerCenterY;
    if (GameGlobal.databus.infiniteMap) {
      const map = GameGlobal.databus.infiniteMap;
      playerCenterX = map.playerMapX + player.width / 2;
      playerCenterY = map.playerMapY + player.height / 2;
    } else {
      playerCenterX = player.x + player.width / 2;
      playerCenterY = player.y + player.height / 2;
    }

    const projectileSize = 8; // 投射物大小

    const dx = projectile.x - playerCenterX;
    const dy = projectile.y - playerCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < (projectileSize + player.width / 2);
  }

  // 渲染敌人投射物
  renderEnemyProjectiles(ctx) {
    if (!GameGlobal.databus.enemyProjectiles || GameGlobal.databus.enemyProjectiles.length === 0) {
      return;
    }

    // 调试用：打印渲染的投射物数量（已注释）
    // if (GameGlobal.databus.frame % 30 === 0) {
    //   console.log(`[投射物渲染] 渲染 ${GameGlobal.databus.enemyProjectiles.length} 个投射物`);
    // }

    // 注意：这个方法在 main.js 的 ctx.translate(map.offsetX, map.offsetY) 上下文中调用
    // 所以不需要手动加 offsetX/Y，直接使用地图坐标即可

    GameGlobal.databus.enemyProjectiles.forEach((projectile, index) => {
      if (!projectile || !projectile.active) return;

      // 投射物使用地图坐标，ctx.translate 已经应用了地图偏移
      // 直接使用 projectile.x 和 projectile.y，不需要额外加偏移
      const screenX = projectile.x;
      const screenY = projectile.y;

      // 调试用：打印每个投射物的渲染信息（已注释）
      // if (GameGlobal.databus.frame % 30 === 0 && index === 0) {
      //   console.log(`[投射物渲染详情] 索引: ${index}, 世界坐标: (${projectile.x.toFixed(0)}, ${projectile.y.toFixed(0)}), 屏幕坐标: (${screenX.toFixed(0)}, ${screenY.toFixed(0)})`);
      // }

      // 调试用：绘制更大的投射物和更亮的颜色
      ctx.save();
      
      // 使用高对比度的颜色确保可见
      const color = projectile.color || '#ff0000';
      ctx.fillStyle = color;
      
      // 绘制发光效果（先绘制，这样实心圆会在上层）
      ctx.shadowBlur = 30; // 更强烈发光效果
      ctx.shadowColor = color;
      
      // 绘制实心圆 - 更大更醒目
      ctx.beginPath();
      ctx.arc(screenX, screenY, 15, 0, Math.PI * 2); // 更大的投射物
      ctx.fill();
      
      // 绘制内部高亮
      ctx.shadowBlur = 0; // 移除发光
      ctx.fillStyle = '#ffffff'; // 白色中心
      ctx.beginPath();
      ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // 绘制边框，让投射物更醒目
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(screenX, screenY, 15, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.restore();
    });
  }

  renderGameOver(ctx) {
    // 全屏半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 左上角设置按钮
    const settingsBtnX = 15;
    const settingsBtnY = 40;
    const settingsBtnSize = 40;
    const cornerRadius = 10;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(settingsBtnX + cornerRadius, settingsBtnY);
    ctx.lineTo(settingsBtnX + settingsBtnSize - cornerRadius, settingsBtnY);
    ctx.quadraticCurveTo(settingsBtnX + settingsBtnSize, settingsBtnY, settingsBtnX + settingsBtnSize, settingsBtnY + cornerRadius);
    ctx.lineTo(settingsBtnX + settingsBtnSize, settingsBtnY + settingsBtnSize - cornerRadius);
    ctx.quadraticCurveTo(settingsBtnX + settingsBtnSize, settingsBtnY + settingsBtnSize, settingsBtnX + settingsBtnSize - cornerRadius, settingsBtnY + settingsBtnSize);
    ctx.lineTo(settingsBtnX + cornerRadius, settingsBtnY + settingsBtnSize);
    ctx.quadraticCurveTo(settingsBtnX, settingsBtnY + settingsBtnSize, settingsBtnX, settingsBtnY + settingsBtnSize - cornerRadius);
    ctx.lineTo(settingsBtnX, settingsBtnY + cornerRadius);
    ctx.quadraticCurveTo(settingsBtnX, settingsBtnY, settingsBtnX + cornerRadius, settingsBtnY);
    ctx.closePath();
    ctx.fill();

    // 绘制齿轮图标
    ctx.fillStyle = '#ffffff';
    const gearX = settingsBtnX + settingsBtnSize / 2;
    const gearY = settingsBtnY + settingsBtnSize / 2;
    const gearOuterR = 10;
    const gearInnerR = 4;
    const gearTeeth = 6;

    ctx.beginPath();
    for (let i = 0; i < gearTeeth; i++) {
      const angle = (i * 2 * Math.PI) / gearTeeth;
      const x1 = gearX + Math.cos(angle) * gearOuterR;
      const y1 = gearY + Math.sin(angle) * gearOuterR;
      const x2 = gearX + Math.cos(angle + 0.3) * gearOuterR;
      const y2 = gearY + Math.sin(angle + 0.3) * gearOuterR;
      const x3 = gearX + Math.cos(angle + 0.3) * gearInnerR;
      const y3 = gearY + Math.sin(angle + 0.3) * gearInnerR;
      const x4 = gearX + Math.cos(angle) * gearInnerR;
      const y4 = gearY + Math.sin(angle) * gearInnerR;

      if (i === 0) {
        ctx.moveTo(x1, y1);
      }
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.lineTo(x4, y4);
    }
    ctx.closePath();
    ctx.fill();

    // 绘制齿轮中间圆孔
    ctx.beginPath();
    ctx.arc(gearX, gearY, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
    ctx.restore();

    // 游戏结束标题
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 140);

    // 信息面板背景（半透明圆角矩形）
    const panelX = SCREEN_WIDTH / 2 - 150;
    const panelY = SCREEN_HEIGHT / 2 - 80;
    const panelWidth = 300;
    const panelHeight = 180;
    const panelCornerRadius = 16;

    ctx.save();
    ctx.fillStyle = 'rgba(40, 40, 40, 0.85)';
    ctx.beginPath();
    ctx.moveTo(panelX + panelCornerRadius, panelY);
    ctx.lineTo(panelX + panelWidth - panelCornerRadius, panelY);
    ctx.quadraticCurveTo(panelX + panelWidth, panelY, panelX + panelWidth, panelY + panelCornerRadius);
    ctx.lineTo(panelX + panelWidth, panelY + panelHeight - panelCornerRadius);
    ctx.quadraticCurveTo(panelX + panelWidth, panelY + panelHeight, panelX + panelWidth - panelCornerRadius, panelY + panelHeight);
    ctx.lineTo(panelX + panelCornerRadius, panelY + panelHeight);
    ctx.quadraticCurveTo(panelX, panelY + panelHeight, panelX, panelY + panelHeight - panelCornerRadius);
    ctx.lineTo(panelX, panelY + panelCornerRadius);
    ctx.quadraticCurveTo(panelX, panelY, panelX + panelCornerRadius, panelY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 信息面板内容
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    const textX = panelX + 20;
    const textY = panelY + 40;
    const lineSpacing = 35;

    ctx.fillText(`存活等级：${this.player.stats.level}`, textX, textY);
    ctx.fillText(`击杀数量：${GameGlobal.databus.score}`, textX, textY + lineSpacing);
    ctx.fillText(`存活时间：${Math.floor(this.gameFrame / 60)}秒`, textX, textY + lineSpacing * 2);
    ctx.fillText(`最大波数：${this.enemyEnhancementSystem.waveCount}`, textX, textY + lineSpacing * 3);

    // 三个按钮：设置、商城、属性
    const buttonY = panelY + panelHeight + 20;
    const buttonWidth = 80;
    const buttonHeight = 45;
    const buttonRadius = 8;
    const buttonSpacing = 10;
    const totalWidth = buttonWidth * 3 + buttonSpacing * 2;
    const startX = (SCREEN_WIDTH - totalWidth) / 2;

    // 按钮绘制函数
    const drawButton = (x, text) => {
      // 按钮背景
      ctx.fillStyle = 'rgba(60, 60, 60, 0.8)';
      ctx.beginPath();
      ctx.moveTo(x + buttonRadius, buttonY);
      ctx.lineTo(x + buttonWidth - buttonRadius, buttonY);
      ctx.quadraticCurveTo(x + buttonWidth, buttonY, x + buttonWidth, buttonY + buttonRadius);
      ctx.lineTo(x + buttonWidth, buttonY + buttonHeight - buttonRadius);
      ctx.quadraticCurveTo(x + buttonWidth, buttonY + buttonHeight, x + buttonWidth - buttonRadius, buttonY + buttonHeight);
      ctx.lineTo(x + buttonRadius, buttonY + buttonHeight);
      ctx.quadraticCurveTo(x, buttonY + buttonHeight, x, buttonY + buttonHeight - buttonRadius);
      ctx.lineTo(x, buttonY + buttonRadius);
      ctx.quadraticCurveTo(x, buttonY, x + buttonRadius, buttonY);
      ctx.closePath();
      ctx.fill();

      // 按钮边框
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 按钮文字
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(text, x + buttonWidth / 2, buttonY + buttonHeight / 2 + 6);
    };

    drawButton(startX, '设置');
    drawButton(startX + buttonWidth + buttonSpacing, '商城');
    drawButton(startX + (buttonWidth + buttonSpacing) * 2, '属性');

    // 底部提示文字
    ctx.font = '24px Arial';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('点击屏幕开始游戏', SCREEN_WIDTH / 2, buttonY + buttonHeight + 50);
  }

  loop() {
    // 此方法已被 start() 中的 loopFunc 替代
    // 保留此方法以兼容其他可能的调用
    this.update();
    this.render();
  }

  handleTouch(x, y) {
    // 先处理升级弹窗的触摸
    if (this.levelUpSystem.handleTouch(x, y)) {
      return;
    }

    // 处理设置弹窗触摸
    if (this.handleSettingsTouch(x, y)) {
      return;
    }

    // 处理属性界面触摸
    if (this.attributeSystem.handleTouch(x, y)) {
      return;
    }

    // 处理商城界面触摸
    if (this.shopSystem.handleTouch(x, y)) {
      return;
    }

    // 处理暂停界面触摸
    if (this.handlePauseTouch(x, y)) {
      return;
    }

    // 处理游戏结束状态
    if (GameGlobal.databus.isGameOver) {
      // 检查左上角设置按钮
      const settingsBtnX = 15;
      const settingsBtnY = 40;
      const settingsBtnSize = 40;

      if (x >= settingsBtnX && x <= settingsBtnX + settingsBtnSize && y >= settingsBtnY && y <= settingsBtnY + settingsBtnSize) {
        this.showSettings = true;
        return;
      }

      // 检查三个按钮的点击区域
      const panelY = SCREEN_HEIGHT / 2 - 80;
      const panelHeight = 180;
      const buttonY = panelY + panelHeight + 20;
      const buttonWidth = 80;
      const buttonHeight = 45;
      const buttonSpacing = 10;
      const totalWidth = buttonWidth * 3 + buttonSpacing * 2;
      const startX = (SCREEN_WIDTH - totalWidth) / 2;

      // 设置按钮
      if (x >= startX && x <= startX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
        this.showSettings = true;
        return;
      }

      // 商城按钮
      if (x >= startX + buttonWidth + buttonSpacing && x <= startX + buttonWidth * 2 + buttonSpacing && y >= buttonY && y <= buttonY + buttonHeight) {
        this.shopSystem.show();
        return;
      }

      // 属性按钮
      if (x >= startX + (buttonWidth + buttonSpacing) * 2 && x <= startX + buttonWidth * 3 + buttonSpacing * 2 && y >= buttonY && y <= buttonY + buttonHeight) {
        this.attributeSystem.show();
        return;
      }

      // 检查"点击屏幕开始游戏"文字区域
      const textY = buttonY + buttonHeight + 50;
      const textWidth = 200;
      const textHeight = 30;
      const textX = SCREEN_WIDTH / 2 - textWidth / 2;
      const textTop = textY - 24;

      if (x >= textX && x <= textX + textWidth && y >= textTop && y <= textTop + textHeight) {
        // 停止演示模式
        this.demoMode.active = false;
        // 恢复地图偏移（避免红线出现）
        if (GameGlobal.databus.infiniteMap) {
          const map = GameGlobal.databus.infiniteMap;
          map.offsetX = SCREEN_WIDTH / 2 - map.playerMapX - 20;
          map.offsetY = SCREEN_HEIGHT / 2 - map.playerMapY - 20;
        }
        // 开始过渡动画
        this.startGameWithTransition();
      }
      return;
    }

    // 禁用角色点触移动，只能通过虚拟方向盘移动
    // this.player.handleTouchStart(x, y);
  }

  // 更新敌人增强系统（基于时间的阶段系统）
  updateEnemyEnhancement() {
    const system = this.enemyEnhancementSystem;

    // 初始化：设置初始参数
    if (this.gameFrame === 0) {
      system.currentIntensity = 1.0;
      // console.log(`【游戏开始】将在${system.startDelay}秒后开始生成敌人`);
      // console.log(`【初始波次】敌人总量: ${system.initialWaveEnemyCount}`);
      return;
    }

    // 更新调试信息
    system.debugInfo.currentWave = system.waveNumber;
    system.debugInfo.waveTotalEnemies = system.currentWaveTotalEnemies;
    system.debugInfo.spawnedEnemies = system.enemiesSpawnedInCurrentWave;
    system.debugInfo.remainingEnemies = system.currentWaveTotalEnemies - system.enemiesSpawnedInCurrentWave;
    system.debugInfo.progress = (system.enemiesSpawnedInCurrentWave / system.currentWaveTotalEnemies * 100).toFixed(1);
    system.debugInfo.waveStatus = system.waveComplete ? '等待下一波' : '生成中';

    // 更新全局难度倍率（保持兼容性）
    this.difficulty = system.currentIntensity;
  }

  // 显示难度通知
  showDifficultyNotification(message, color) {
    const system = this.enemyEnhancementSystem;
    system.difficultyNotification = {
      message,
      color,
      timeLeft: system.notificationDuration
    };
  }

  // 渲染难度通知
  renderDifficultyNotification(ctx) {
    const notification = this.enemyEnhancementSystem.difficultyNotification;

    if (!notification || notification.timeLeft <= 0) {
      return;
    }

    // 减少通知时间
    notification.timeLeft--;

    // 计算透明度（淡入淡出）
    let alpha = 1;
    if (notification.timeLeft < 30) {
      alpha = notification.timeLeft / 30;
    } else if (notification.timeLeft > 150) {
      alpha = (180 - notification.timeLeft) / 30;
    }

    // 绘制通知背景
    const padding = 20;
    const fontSize = 28;
    ctx.font = `bold ${fontSize}px Arial`;
    const textWidth = ctx.measureText(notification.message).width;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = fontSize + padding * 2;
    const boxX = (SCREEN_WIDTH - boxWidth) / 2;
    const boxY = 100;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // 绘制通知边框
    ctx.strokeStyle = notification.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // 绘制通知文字
    ctx.fillStyle = notification.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      notification.message,
      SCREEN_WIDTH / 2,
      boxY + boxHeight / 2
    );

    ctx.restore();
  }

  // 渲染暂停界面
  renderPause(ctx) {
    if (!this.isPaused) return;

    // 半透明背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 左上角设置按钮
    const settingsBtnX = 15;
    const settingsBtnY = 40;
    const settingsBtnSize = 40;
    const cornerRadius = 10;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(settingsBtnX + cornerRadius, settingsBtnY);
    ctx.lineTo(settingsBtnX + settingsBtnSize - cornerRadius, settingsBtnY);
    ctx.quadraticCurveTo(settingsBtnX + settingsBtnSize, settingsBtnY, settingsBtnX + settingsBtnSize, settingsBtnY + cornerRadius);
    ctx.lineTo(settingsBtnX + settingsBtnSize, settingsBtnY + settingsBtnSize - cornerRadius);
    ctx.quadraticCurveTo(settingsBtnX + settingsBtnSize, settingsBtnY + settingsBtnSize, settingsBtnX + settingsBtnSize - cornerRadius, settingsBtnY + settingsBtnSize);
    ctx.lineTo(settingsBtnX + cornerRadius, settingsBtnY + settingsBtnSize);
    ctx.quadraticCurveTo(settingsBtnX, settingsBtnY + settingsBtnSize, settingsBtnX, settingsBtnY + settingsBtnSize - cornerRadius);
    ctx.lineTo(settingsBtnX, settingsBtnY + cornerRadius);
    ctx.quadraticCurveTo(settingsBtnX, settingsBtnY, settingsBtnX + cornerRadius, settingsBtnY);
    ctx.closePath();
    ctx.fill();

    // 绘制齿轮图标
    ctx.fillStyle = '#ffffff';
    const gearX = settingsBtnX + settingsBtnSize / 2;
    const gearY = settingsBtnY + settingsBtnSize / 2;
    const gearOuterR = 10;
    const gearInnerR = 4;
    const gearTeeth = 6;

    ctx.beginPath();
    for (let i = 0; i < gearTeeth; i++) {
      const angle = (i * 2 * Math.PI) / gearTeeth;
      const x1 = gearX + Math.cos(angle) * gearOuterR;
      const y1 = gearY + Math.sin(angle) * gearOuterR;
      const x2 = gearX + Math.cos(angle + 0.3) * gearOuterR;
      const y2 = gearY + Math.sin(angle + 0.3) * gearOuterR;
      const x3 = gearX + Math.cos(angle + 0.3) * gearInnerR;
      const y3 = gearY + Math.sin(angle + 0.3) * gearInnerR;
      const x4 = gearX + Math.cos(angle) * gearInnerR;
      const y4 = gearY + Math.sin(angle) * gearInnerR;

      if (i === 0) {
        ctx.moveTo(x1, y1);
      }
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.lineTo(x4, y4);
    }
    ctx.closePath();
    ctx.fill();

    // 绘制齿轮中间圆孔
    ctx.beginPath();
    ctx.arc(gearX, gearY, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
    ctx.restore();

    // 暂停标题
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏暂停', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 100);

    // 信息面板背景
    const panelX = SCREEN_WIDTH / 2 - 150;
    const panelY = SCREEN_HEIGHT / 2 - 50;
    const panelWidth = 300;
    const panelHeight = 150;
    const panelCornerRadius = 16;

    ctx.save();
    ctx.fillStyle = 'rgba(40, 40, 40, 0.85)';
    ctx.beginPath();
    ctx.moveTo(panelX + panelCornerRadius, panelY);
    ctx.lineTo(panelX + panelWidth - panelCornerRadius, panelY);
    ctx.quadraticCurveTo(panelX + panelWidth, panelY, panelX + panelWidth, panelY + panelCornerRadius);
    ctx.lineTo(panelX + panelWidth, panelY + panelHeight - panelCornerRadius);
    ctx.quadraticCurveTo(panelX + panelWidth, panelY + panelHeight, panelX + panelWidth - panelCornerRadius, panelY + panelHeight);
    ctx.lineTo(panelX + panelCornerRadius, panelY + panelHeight);
    ctx.quadraticCurveTo(panelX, panelY + panelHeight, panelX, panelY + panelHeight - panelCornerRadius);
    ctx.lineTo(panelX, panelY + panelCornerRadius);
    ctx.quadraticCurveTo(panelX, panelY, panelX + panelCornerRadius, panelY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 面板内容
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    const textX = panelX + 20;
    const textY = panelY + 40;
    const lineSpacing = 35;

    ctx.fillText(`存活等级：${this.player.stats.level}`, textX, textY);
    ctx.fillText(`击杀数量：${GameGlobal.databus.score}`, textX, textY + lineSpacing);
    ctx.fillText(`存活时间：${Math.floor(this.gameFrame / 60)}秒`, textX, textY + lineSpacing * 2);

    // 底部重新开始按钮
    const buttonY = panelY + panelHeight + 30;
    const buttonWidth = 150;
    const buttonHeight = 50;
    const buttonX = (SCREEN_WIDTH - buttonWidth) / 2;
    const btnCornerRadius = 8;

    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.moveTo(buttonX + btnCornerRadius, buttonY);
    ctx.lineTo(buttonX + buttonWidth - btnCornerRadius, buttonY);
    ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY, buttonX + buttonWidth, buttonY + btnCornerRadius);
    ctx.lineTo(buttonX + buttonWidth, buttonY + buttonHeight - btnCornerRadius);
    ctx.quadraticCurveTo(buttonX + buttonWidth, buttonY + buttonHeight, buttonX + buttonWidth - btnCornerRadius, buttonY + buttonHeight);
    ctx.lineTo(buttonX + btnCornerRadius, buttonY + buttonHeight);
    ctx.quadraticCurveTo(buttonX, buttonY + buttonHeight, buttonX, buttonY + buttonHeight - btnCornerRadius);
    ctx.lineTo(buttonX, buttonY + btnCornerRadius);
    ctx.quadraticCurveTo(buttonX, buttonY, buttonX + btnCornerRadius, buttonY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('重新开始', SCREEN_WIDTH / 2, buttonY + buttonHeight / 2 + 6);

    // 底部提示s
    ctx.font = '18px Arial';
    ctx.fillStyle = '#888';
    ctx.fillText('点击屏幕继续游戏', SCREEN_WIDTH / 2, buttonY + buttonHeight + 40);
  }

  // 渲染设置弹窗
  renderSettings(ctx) {
    if (!this.showSettings) return;

    // 渲染地图背景（不渲染敌人、角色、场景道具）
    this.bg.render(ctx);

    // 保存上下文,应用地图偏移
    ctx.save();

    // 地图跟随玩家移动（相机系统）
    if (GameGlobal.databus.infiniteMap) {
      const map = GameGlobal.databus.infiniteMap;
      ctx.translate(map.offsetX, map.offsetY);
    }

    // 渲染无限地图（障碍物）
    if (GameGlobal.databus.infiniteMap) {
      GameGlobal.databus.infiniteMap.render(ctx);
    }

    // 恢复上下文，移除地图偏移
    ctx.restore();

    // 半透明背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 设置面板
    const panelWidth = 280;
    const panelHeight = 200;
    const panelX = (SCREEN_WIDTH - panelWidth) / 2;
    const panelY = (SCREEN_HEIGHT - panelHeight) / 2;
    const cornerRadius = 16;

    // 面板背景
    ctx.fillStyle = 'rgba(40, 40, 50, 0.95)';
    ctx.beginPath();
    ctx.moveTo(panelX + cornerRadius, panelY);
    ctx.lineTo(panelX + panelWidth - cornerRadius, panelY);
    ctx.quadraticCurveTo(panelX + panelWidth, panelY, panelX + panelWidth, panelY + cornerRadius);
    ctx.lineTo(panelX + panelWidth, panelY + panelHeight - cornerRadius);
    ctx.quadraticCurveTo(panelX + panelWidth, panelY + panelHeight, panelX + panelWidth - cornerRadius, panelY + panelHeight);
    ctx.lineTo(panelX + cornerRadius, panelY + panelHeight);
    ctx.quadraticCurveTo(panelX, panelY + panelHeight, panelX, panelY + panelHeight - cornerRadius);
    ctx.lineTo(panelX, panelY + cornerRadius);
    ctx.quadraticCurveTo(panelX, panelY, panelX + cornerRadius, panelY);
    ctx.closePath();
    ctx.fill();

    // 标题
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('设置', SCREEN_WIDTH / 2, panelY + 40);

    // 关闭按钮
    const closeBtnX = panelX + panelWidth - 25;
    const closeBtnY = panelY + 15;
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(closeBtnX, closeBtnY + 8, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('×', closeBtnX, closeBtnY + 13);

    // 设置项
    const itemHeight = 60;
    const startY = panelY + 60;

    // 音效开关
    const soundEffectY = startY;
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('音效', panelX + 30, soundEffectY + 25);

    // 开关按钮
    const switchWidth = 60;
    const switchHeight = 30;
    const switchX = panelX + panelWidth - 30 - switchWidth;
    const switchY = soundEffectY + 10;

    ctx.fillStyle = this.settings.soundEffect ? '#4CAF50' : '#666666';
    ctx.beginPath();
    ctx.moveTo(switchX + 15, switchY);
    ctx.lineTo(switchX + switchWidth - 15, switchY);
    ctx.quadraticCurveTo(switchX + switchWidth, switchY, switchX + switchWidth, switchY + 15);
    ctx.lineTo(switchX + switchWidth, switchY + switchHeight - 15);
    ctx.quadraticCurveTo(switchX + switchWidth, switchY + switchHeight, switchX + switchWidth - 15, switchY + switchHeight);
    ctx.lineTo(switchX + 15, switchY + switchHeight);
    ctx.quadraticCurveTo(switchX, switchY + switchHeight, switchX, switchY + switchHeight - 15);
    ctx.lineTo(switchX, switchY + 15);
    ctx.quadraticCurveTo(switchX, switchY, switchX + 15, switchY);
    ctx.closePath();
    ctx.fill();

    // 开关圆点
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const dotX = this.settings.soundEffect ? switchX + switchWidth - 15 : switchX + 15;
    ctx.arc(dotX, switchY + switchHeight / 2, 12, 0, Math.PI * 2);
    ctx.fill();

    // 背景音乐开关
    const bgMusicY = startY + itemHeight;
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('背景音乐', panelX + 30, bgMusicY + 25);

    // 开关按钮
    const bgSwitchY = bgMusicY + 10;
    ctx.fillStyle = this.settings.bgMusic ? '#4CAF50' : '#666666';
    ctx.beginPath();
    ctx.moveTo(switchX + 15, bgSwitchY);
    ctx.lineTo(switchX + switchWidth - 15, bgSwitchY);
    ctx.quadraticCurveTo(switchX + switchWidth, bgSwitchY, switchX + switchWidth, bgSwitchY + 15);
    ctx.lineTo(switchX + switchWidth, bgSwitchY + switchHeight - 15);
    ctx.quadraticCurveTo(switchX + switchWidth, bgSwitchY + switchHeight, switchX + switchWidth - 15, bgSwitchY + switchHeight);
    ctx.lineTo(switchX + 15, bgSwitchY + switchHeight);
    ctx.quadraticCurveTo(switchX, bgSwitchY + switchHeight, switchX, bgSwitchY + switchHeight - 15);
    ctx.lineTo(switchX, bgSwitchY + 15);
    ctx.quadraticCurveTo(switchX, bgSwitchY, switchX + 15, bgSwitchY);
    ctx.closePath();
    ctx.fill();

    // 开关圆点
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const bgDotX = this.settings.bgMusic ? switchX + switchWidth - 15 : switchX + 15;
    ctx.arc(bgDotX, bgSwitchY + switchHeight / 2, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // 处理设置弹窗触摸
  handleSettingsTouch(x, y) {
    if (!this.showSettings) return false;

    const panelWidth = 280;
    const panelHeight = 200;
    const panelX = (SCREEN_WIDTH - panelWidth) / 2;
    const panelY = (SCREEN_HEIGHT - panelHeight) / 2;

    // 关闭按钮
    const closeBtnX = panelX + panelWidth - 25;
    const closeBtnY = panelY + 15;
    if (Math.sqrt((x - closeBtnX) ** 2 + (y - (closeBtnY + 8)) ** 2) < 15) {
      this.showSettings = false;
      return true;
    }

    // 开关区域
    const switchWidth = 60;
    const switchHeight = 30;
    const switchX = panelX + panelWidth - 30 - switchWidth;
    const startY = panelY + 60;

    // 音效开关
    const soundEffectY = startY + 10;
    if (x >= switchX && x <= switchX + switchWidth && y >= soundEffectY && y <= soundEffectY + switchHeight) {
      this.settings.soundEffect = !this.settings.soundEffect;
      return true;
    }

    // 背景音乐开关
    const bgMusicY = startY + 60 + 10;
    if (x >= switchX && x <= switchX + switchWidth && y >= bgMusicY && y <= bgMusicY + switchHeight) {
      this.settings.bgMusic = !this.settings.bgMusic;
      return true;
    }

    // 点击面板外关闭
    if (x < panelX || x > panelX + panelWidth || y < panelY || y > panelY + panelHeight) {
      this.showSettings = false;
      return true;
    }

    return true; // 点击设置面板内任意位置都拦截事件
  }

  // 处理暂停界面触摸
  handlePauseTouch(x, y) {
    if (!this.isPaused) return false;

    // 左上角设置按钮
    const settingsBtnX = 15;
    const settingsBtnY = 40;
    const settingsBtnSize = 40;

    if (x >= settingsBtnX && x <= settingsBtnX + settingsBtnSize && y >= settingsBtnY && y <= settingsBtnY + settingsBtnSize) {
      this.showSettings = true;
      return true;
    }

    // 重新开始按钮
    const panelY = SCREEN_HEIGHT / 2 - 50;
    const panelHeight = 150;
    const buttonY = panelY + panelHeight + 30;
    const buttonWidth = 150;
    const buttonHeight = 50;
    const buttonX = (SCREEN_WIDTH - buttonWidth) / 2;

    if (x >= buttonX && x <= buttonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
      this.isPaused = false; // 取消暂停状态
      this.reset();
      this.start();
      return true;
    }

    // 点击屏幕其他地方继续游戏
    this.isPaused = false;
    return true;
  }

  // 渲染波次调试信息
  renderWaveDebugInfo(ctx) {
    const system = this.enemyEnhancementSystem;
    const debug = system.debugInfo;

    // 更新调试信息
    debug.currentWave = system.waveNumber;
    debug.waveTotalEnemies = system.currentWaveTotalEnemies;
    debug.spawnedEnemies = system.enemiesSpawnedInCurrentWave;
    debug.remainingEnemies = system.currentWaveTotalEnemies - system.enemiesSpawnedInCurrentWave;
    debug.progress = (system.enemiesSpawnedInCurrentWave / system.currentWaveTotalEnemies * 100).toFixed(1);
    debug.waveStatus = system.waveComplete ? '等待下一波' : '生成中';

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(10, 10, 320, 180);

    ctx.fillStyle = '#00ff00';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';

    let y = 30;
    ctx.fillText(`当前波次: ${debug.currentWave}`, 20, y);
    y += 20;
    ctx.fillText(`敌人总量: ${debug.waveTotalEnemies}`, 20, y);
    y += 20;
    ctx.fillText(`已生成: ${debug.spawnedEnemies}`, 20, y);
    y += 20;
    ctx.fillText(`剩余: ${debug.remainingEnemies}`, 20, y);
    y += 20;
    ctx.fillText(`进度: ${debug.progress}%`, 20, y);
    y += 20;
    ctx.fillText(`状态: ${debug.waveStatus}`, 20, y);
    y += 20;
    ctx.fillText(`强度: ${system.currentIntensity.toFixed(1)}倍`, 20, y);

    ctx.restore();
  }

  /**
   * Check player-enemy collisions
   * This is called after both player and enemies have updated to ensure
   * collision is detected regardless of update order
   * Implements bidirectional collision damage: player takes damage when
   * in contact with enemies, regardless of who initiated the collision
   */
  checkPlayerEnemyCollisions() {
    if (!this.player || !GameGlobal.databus.enemies) {
      return;
    }

    // Get player position (account for infinite map)
    let playerX, playerY;
    if (GameGlobal.databus.infiniteMap) {
      playerX = GameGlobal.databus.infiniteMap.playerMapX;
      playerY = GameGlobal.databus.infiniteMap.playerMapY;
    } else {
      playerX = this.player.x;
      playerY = this.player.y;
    }

    const playerWidth = this.player.width;
    const playerHeight = this.player.height;

    // Check each enemy
    GameGlobal.databus.enemies.forEach(enemy => {
      if (!enemy.isActive) {
        return;
      }

      // AABB collision detection
      const isColliding = !(
        enemy.x + enemy.width < playerX ||
        enemy.x > playerX + playerWidth ||
        enemy.y + enemy.height < playerY ||
        enemy.y > playerY + playerHeight
      );

      // Apply damage if colliding and cooldown is ready
      // Removed isMovingTowardsPlayer check - any contact causes damage
      if (isColliding && enemy.collisionCooldown <= 0) {
        // Calculate damage based on enemy type
        if (!enemy.isRanged) {
          // Melee enemies deal full damage
          this.player.takeDamage(enemy.damage);
        } else {
          // Ranged enemies deal reduced damage on contact
          const rangedDamage = Math.floor(enemy.damage * 0.5);
          this.player.takeDamage(rangedDamage);
        }

        // Set collision cooldown
        enemy.collisionCooldown = 60;
      }
    });
  }

  // ==================== 演示模式相关方法 ====================

  /**
   * 初始化演示模式（游戏结束后的 AI 战斗演示）
   * 使用真实的 Player 和 Enemy 类
   */
  initDemoMode() {
    this.demoMode.active = true;
    this.demoMode.waveNumber = 0; // 从第 0 波开始
    this.demoMode.lastSpawnTime = 0;
    this.demoMode.frame = 0;

    // 创建真实的 AI 玩家实例
    const aiPlayer = new Player();
    aiPlayer.stats.level = 10;
    aiPlayer.stats.maxHealth = 200;
    aiPlayer.stats.currentHealth = 200;
    aiPlayer.stats.moveSpeed = 3;
    // 清空默认武器并给 AI 玩家添加武器（weapons 是 Map，不是数组）
    // 演示模式只使用魔法弹和神圣领域，不使用瞬移
    aiPlayer.weaponSystem.weapons.clear();
    aiPlayer.weaponSystem.addWeapon('magic_orb');
    aiPlayer.weaponSystem.addWeapon('holy_domain');
    // 标记为演示模式的 AI 玩家，禁用瞬移等特殊技能
    aiPlayer.isDemoAI = true;
    
    // AI 玩家位置（屏幕中心）
    aiPlayer.x = SCREEN_WIDTH / 2 - aiPlayer.width / 2;
    aiPlayer.y = SCREEN_HEIGHT / 2 - aiPlayer.height / 2;
    
    // 初始化 AI 玩家方向（朝向右方）
    aiPlayer.lastMoveAngle = 0;

    this.demoMode.aiPlayer = aiPlayer;
    this.demoMode.aiTargetX = aiPlayer.x;
    this.demoMode.aiTargetY = aiPlayer.y;
    this.demoMode.aiMoveTimer = 0;

    // 清空演示敌人列表（使用真实的 Enemy 实例）
    this.demoMode.enemies = [];

    // 重置地图偏移（演示模式使用屏幕坐标，偏移为 0）
    if (GameGlobal.databus.infiniteMap) {
      const map = GameGlobal.databus.infiniteMap;
      // 演示模式使用屏幕坐标，地图偏移设为 0（不应用偏移）
      map.offsetX = 0;
      map.offsetY = 0;
      // 保持地图坐标在中央区域（用于敌人生成和 AI 移动范围计算）
      map.playerMapX = map.mapWidth / 2;
      map.playerMapY = map.mapHeight / 2;
    }

    // 生成初始敌人
    this.spawnEnemiesForDemo(5);
    
    // console.log('[演示模式] 初始化完成，AI 玩家位置:', aiPlayer.x, aiPlayer.y, '敌人数量:', this.demoMode.enemies.length);
  }

  /**
   * 更新演示模式
   */
  updateDemoMode() {
    const demo = this.demoMode;
    demo.frame++;

    // 临时保存原始数据
    const originalPlayer = GameGlobal.databus.player;
    const originalEnemies = GameGlobal.databus.enemies;

    // 临时设置演示模式的数据（让敌人能正确找到玩家）
    GameGlobal.databus.player = demo.aiPlayer;
    GameGlobal.databus.enemies = demo.enemies; // 临时设置敌人列表（让武器系统能正确检测碰撞）

    // 临时设置地图数据（演示模式使用屏幕坐标）
    if (GameGlobal.databus.infiniteMap) {
      GameGlobal.databus.infiniteMap.playerMapX = demo.aiPlayer.x;
      GameGlobal.databus.infiniteMap.playerMapY = demo.aiPlayer.y;
    }

    // 更新 AI 玩家移动
    this.updateDemoPlayerAI();

    // 再次更新地图坐标（AI 移动后位置已变化）
    if (GameGlobal.databus.infiniteMap) {
      GameGlobal.databus.infiniteMap.playerMapX = demo.aiPlayer.x;
      GameGlobal.databus.infiniteMap.playerMapY = demo.aiPlayer.y;
    }

    // 更新 AI 玩家武器系统（传入演示敌人列表）
    // 确保武器系统能正确找到敌人并攻击
    demo.aiPlayer.weaponSystem.update(demo.enemies);

    // 更新敌人（使用真实的 Enemy update 方法）
    demo.enemies.forEach((enemy) => {
      if (enemy.isActive) {
        enemy.update(demo.aiPlayer);
      }
    });

    // 更新敌人投射物
    this.updateEnemyProjectilesForDemo();

    // 检查 AI 玩家与敌人碰撞
    this.checkDemoPlayerCollisions();

    // 移除死亡的敌人
    demo.enemies = demo.enemies.filter(enemy => enemy.isActive);

    // 如果敌人全部死亡，立即生成新敌人（不要等待）
    if (demo.enemies.length === 0) {
      this.spawnEnemiesForDemo(3);
    }

    // 恢复原始数据
    GameGlobal.databus.player = originalPlayer;
    GameGlobal.databus.enemies = originalEnemies;

    // AI 玩家死亡后复活
    if (demo.aiPlayer.stats.currentHealth <= 0) {
      demo.aiPlayer.stats.currentHealth = demo.aiPlayer.stats.maxHealth;
      demo.aiPlayer.x = SCREEN_WIDTH / 2 - demo.aiPlayer.width / 2;
      demo.aiPlayer.y = SCREEN_HEIGHT / 2 - demo.aiPlayer.height / 2;
      // console.log('[演示模式] AI 玩家复活');
    }

    // 定期生成新敌人
    demo.lastSpawnTime++;
    if (demo.lastSpawnTime >= demo.spawnInterval) {
      demo.lastSpawnTime = 0;
      this.spawnEnemiesForDemo(2);
      demo.waveNumber++;
    }
  }

  /**
   * 更新演示模式AI玩家移动
   * 智能AI：躲避敌人、主动攻击
   */
  updateDemoPlayerAI() {
    const ai = this.demoMode.aiPlayer;
    const enemies = this.demoMode.enemies;
    
    const aiCenterX = ai.x + ai.width / 2;
    const aiCenterY = ai.y + ai.height / 2;

    // 找最近的敌人
    let nearestEnemy = null;
    let nearestDist = Infinity;
    enemies.forEach(enemy => {
      if (!enemy.isActive) return;
      const dist = Math.sqrt(
        (enemy.x + enemy.width / 2 - aiCenterX) ** 2 +
        (enemy.y + enemy.height / 2 - aiCenterY) ** 2
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    });

    let targetX = ai.x;
    let targetY = ai.y;

    // 智能移动逻辑
    if (nearestEnemy) {
      const dangerDistance = 250; // 危险距离（增加到 250，减少频繁躲避）
      
      if (nearestDist < dangerDistance) {
        // 敌人太近，躲避（减少躲避幅度，避免抖动）
        const avoidAngle = Math.atan2(
          aiCenterY - (nearestEnemy.y + nearestEnemy.height / 2),
          aiCenterX - (nearestEnemy.x + nearestEnemy.width / 2)
        );
        targetX = ai.x + Math.cos(avoidAngle) * 80;
        targetY = ai.y + Math.sin(avoidAngle) * 80;
      } else if (nearestDist < 350) {
        // 中等距离，保持距离并攻击（不移动，只朝向敌人）
        const angleToEnemy = Math.atan2(
          nearestEnemy.y + nearestEnemy.height / 2 - aiCenterY,
          nearestEnemy.x + nearestEnemy.width / 2 - aiCenterX
        );
        // 保持静止，只更新朝向敌人
        targetX = ai.x;
        targetY = ai.y;
        // 更新朝向敌人
        ai.lastMoveAngle = angleToEnemy;
      } else {
        // 敌人较远，向敌人移动
        targetX = nearestEnemy.x;
        targetY = nearestEnemy.y;
        // 更新朝向敌人
        const angleToEnemy = Math.atan2(
          nearestEnemy.y + nearestEnemy.height / 2 - aiCenterY,
          nearestEnemy.x + nearestEnemy.width / 2 - aiCenterX
        );
        ai.lastMoveAngle = angleToEnemy;
      }
    } else {
      // 没有敌人，随机移动（在屏幕安全区域内）
      this.demoMode.aiMoveTimer++;
      if (this.demoMode.aiMoveTimer >= 90) {
        this.demoMode.aiMoveTimer = 0;
        // 在屏幕中央区域随机移动（避开边缘）
        this.demoMode.aiTargetX = 100 + Math.random() * (SCREEN_WIDTH - 200) - ai.width / 2;
        this.demoMode.aiTargetY = 100 + Math.random() * (SCREEN_HEIGHT - 200) - ai.height / 2;
      }
      targetX = this.demoMode.aiTargetX;
      targetY = this.demoMode.aiTargetY;
    }

    // 边界检查（限制在屏幕安全区域内）
    targetX = Math.max(50, Math.min(SCREEN_WIDTH - 50 - ai.width, targetX));
    targetY = Math.max(50, Math.min(SCREEN_HEIGHT - 50 - ai.height, targetY));

    // 向目标移动
    const dx = targetX - ai.x;
    const dy = targetY - ai.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      const moveSpeed = ai.stats.moveSpeed;
      const newX = ai.x + (dx / dist) * moveSpeed;
      const newY = ai.y + (dy / dist) * moveSpeed;

      // 演示模式禁用障碍物碰撞检测（减少卡顿）
      ai.x = newX;
      ai.y = newY;

      ai.isMoving = true;
      if (nearestEnemy) {
        // 如果有敌人，保持朝向敌人
        ai.lastMoveAngle = Math.atan2(
          nearestEnemy.y + nearestEnemy.height / 2 - aiCenterY,
          nearestEnemy.x + nearestEnemy.width / 2 - aiCenterX
        );
      } else {
        ai.lastMoveAngle = Math.atan2(dy, dx);
      }
    } else {
      ai.isMoving = false;
    }
  }

  /**
   * 检查演示模式玩家碰撞
   */
  checkDemoPlayerCollisions() {
    const ai = this.demoMode.aiPlayer;
    if (!ai) return;

    this.demoMode.enemies.forEach(enemy => {
      if (!enemy.isActive) return;

      const aiCenterX = ai.x + ai.width / 2;
      const aiCenterY = ai.y + ai.height / 2;
      const enemyCenterX = enemy.x + enemy.width / 2;
      const enemyCenterY = enemy.y + enemy.height / 2;

      const dist = Math.sqrt((aiCenterX - enemyCenterX) ** 2 + (aiCenterY - enemyCenterY) ** 2);

      if (dist < 30 && enemy.collisionCooldown <= 0) {
        ai.stats.currentHealth -= enemy.damage || 5;
        enemy.collisionCooldown = 60;
      }
      if (enemy.collisionCooldown > 0) enemy.collisionCooldown--;
    });
  }

  /**
   * 更新演示模式的敌人投射物
   */
  updateEnemyProjectilesForDemo() {
    GameGlobal.databus.enemyProjectiles.forEach(proj => {
      if (!proj.active) return;

      // 移动投射物
      proj.x += proj.vx;
      proj.y += proj.vy;

      // 检查与AI玩家碰撞
      const ai = this.demoMode.aiPlayer;
      if (ai) {
        const dx = proj.x - (ai.x + ai.width / 2);
        const dy = proj.y - (ai.y + ai.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 20) {
          ai.stats.currentHealth -= proj.damage || 10;
          proj.active = false;
        }
      }

      // 超出屏幕则移除
      if (proj.x < 0 || proj.x > SCREEN_WIDTH || proj.y < 0 || proj.y > SCREEN_HEIGHT) {
        proj.active = false;
      }
    });

    // 过滤不活跃的投射物
    GameGlobal.databus.enemyProjectiles = GameGlobal.databus.enemyProjectiles.filter(p => p.active);
  }

  /**
   * 为演示模式生成敌人（使用真实的 Enemy 类）
   */
  spawnEnemiesForDemo(count) {
    const types = ['normal', 'normal', 'elite', 'ranged'];
    
    for (let i = 0; i < count; i++) {
      const enemy = new Enemy();
      const type = types[Math.floor(Math.random() * types.length)];
      enemy.init(type, 1.0);
      enemy.isActive = true;

      // 随机位置（在屏幕安全区域内，避开 AI 玩家）
      let x, y;
      const ai = this.demoMode.aiPlayer;
      
      do {
        x = 50 + Math.random() * (SCREEN_WIDTH - 100);
        y = 50 + Math.random() * (SCREEN_HEIGHT - 100);
      } while (Math.sqrt((x - ai.x) ** 2 + (y - ai.y) ** 2) < 150);

      enemy.x = x;
      enemy.y = y;
      enemy.aiState = {
        lastMoveAttempt: { x: 0, y: 0 },
        stuckFrames: 0,
        stuckThreshold: 30,
        avoidanceAngle: 0,
        isAvoiding: false,
        avoidanceCooldown: 0,
        lastPosition: { x, y },
        positionStuckFrames: 0
      };

      this.demoMode.enemies.push(enemy);
    }
  }

  /**
   * 渲染演示模式
   */
  renderDemoMode(ctx) {
    const demo = this.demoMode;

    // 渲染敌人
    demo.enemies.forEach(enemy => {
      if (enemy.isActive) {
        enemy.render(ctx);
      }
    });

    // 渲染敌人投射物
    GameGlobal.databus.enemyProjectiles.forEach(proj => {
      if (proj.active) {
        ctx.fillStyle = proj.color || '#ff6600';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius || 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 渲染 AI 玩家
    const ai = demo.aiPlayer;
    if (ai) {
      ai.render(ctx);
    }

    // 渲染 AI 玩家的投射物
    if (ai && ai.weaponSystem) {
      ai.weaponSystem.projectiles.forEach(proj => {
        // 渲染所有投射物（包括持续时间效果）
        if (proj.type === 'magic_orb' || proj.type === 'holy_domain' || proj.type === 'lightning' || proj.type === 'fire_ball') {
          ctx.fillStyle = proj.color || '#00ffff';
          
          // 持续时间类效果（如神圣领域）渲染为半透明圆形区域
          if (proj.duration) {
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.radius || proj.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
          } else {
            // 普通投射物
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.radius || 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
    }
    
    // 渲染演示模式信息（调试信息，已隐藏）
    // ctx.fillStyle = '#ffffff';
    // ctx.font = '14px Arial';
    // ctx.textAlign = 'left';
    // ctx.fillText(`演示模式 - 波次 ${demo.waveNumber}`, 20, SCREEN_HEIGHT - 60);
    // ctx.fillText(`敌人数量：${demo.enemies.length}`, 20, SCREEN_HEIGHT - 40);
    // ctx.fillText(`投射物数量：${ai && ai.weaponSystem ? ai.weaponSystem.projectiles.length : 0}`, 20, SCREEN_HEIGHT - 20);
  }

  // ==================== 过渡动画相关方法 ====================

  /**
   * 开始过渡动画
   */
  startGameWithTransition() {
    // 立即恢复 GameGlobal.databus.player（避免演示模式影响）
    GameGlobal.databus.player = this.player;
    
    this.transition.active = true;
    this.transition.alpha = 0;
    this.transition.phase = 'out';
    // 回调移到淡入阶段执行（避免卡顿）
  }

  /**
   * 更新过渡动画
   */
  updateTransition() {
    const t = this.transition;

    if (t.phase === 'out') {
      // 淡出
      t.alpha += 1 / t.duration;
      if (t.alpha >= 1) {
        t.alpha = 1;
        t.phase = 'hold';
        t.holdTimer = 0;
      }
    } else if (t.phase === 'hold') {
      // 保持黑色遮罩
      t.holdTimer++;
      if (t.holdTimer >= t.holdTime) {
        // 先关闭过渡动画，避免影响新 loop（防止速度变快）
        t.active = false;
        t.phase = 'in';
        // 再执行重置和启动
        this.reset();
        this.start();
      }
    } else if (t.phase === 'in') {
      // 淡入
      t.alpha -= 1 / t.duration;
      if (t.alpha <= 0) {
        t.alpha = 0;
        t.active = false;
        t.phase = 'out';
      }
    }
  }

  /**
   * 渲染过渡动画
   */
  renderTransition(ctx) {
    if (!this.transition.active) return;

    const t = this.transition;

    // 黑色遮罩
    ctx.fillStyle = `rgba(0, 0, 0, ${t.alpha})`;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 淡出和保持阶段显示加载进度条
    if ((t.phase === 'out' && t.alpha > 0.3) || t.phase === 'hold' || t.phase === 'in') {
      // 计算进度
      let progress = 0;
      if (t.phase === 'out') {
        progress = (t.alpha * 60) / 180;
      } else if (t.phase === 'hold') {
        progress = (60 + t.holdTimer) / 180;
      } else if (t.phase === 'in') {
        progress = (120 + (1 - t.alpha) * 60) / 180;
      }
      progress = Math.min(1, Math.max(0, progress));

      // 进度条参数
      const barWidth = 200;
      const barHeight = 24;
      const barX = SCREEN_WIDTH / 2 - barWidth / 2;
      const barY = SCREEN_HEIGHT - 100;

      // 进度条背景（固定灰色）
      ctx.fillStyle = '#333333';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // 进度条填充（固定白色）
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(barX, barY, barWidth * progress, barHeight);

      // 文字（在进度条内居中）
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('加载中...', SCREEN_WIDTH / 2, barY + barHeight / 2);
    }
  }
}

const mainInstance = new Main();

// Export mainInstance for other modules
GameGlobal.mainInstance = mainInstance;

wx.onTouchStart((e) => {
  if (mainInstance) {
    const { clientX: x, clientY: y } = e.touches[0];

    // Handle skill selection popup first (only if actually visible)
    if (mainInstance.levelUpSystem.isPaused && mainInstance.levelUpSystem.availableSkills.length > 0) {
      if (mainInstance.levelUpSystem.handleTouch(x, y)) {
        return; // Skill selection handled the touch event
      }
      // If handleTouch returns false, continue to other handlers
    }

    // Handle settings popup
    if (mainInstance.showSettings) {
      mainInstance.handleTouch(x, y);
      return;
    }

    // Handle attribute system
    if (mainInstance.attributeSystem.isVisible) {
      mainInstance.attributeSystem.handleTouch(x, y);
      return;
    }

    // Handle shop system
    if (mainInstance.shopSystem.isVisible) {
      mainInstance.shopSystem.handleTouch(x, y);
      return;
    }

    // Handle pause state
    if (mainInstance.isPaused) {
      mainInstance.handleTouch(x, y);
      return;
    }

    // Handle game over state (tap screen to restart)
    if (GameGlobal.databus.isGameOver) {
      mainInstance.handleTouch(x, y);
      return;
    }

    // Handle pause button and settings button in gameinfo
    if (mainInstance.gameInfo.handleTouch(x, y)) {
      return;
    }

    // Handle virtual joystick
    mainInstance.joystick.handleTouchStart(e.touches);
  }
});

wx.onTouchMove((e) => {
  if (mainInstance) {
    // Handle virtual joystick
    mainInstance.joystick.handleTouchMove(e.touches);
  }
});

wx.onTouchEnd((e) => {
  if (mainInstance) {
    // Handle virtual joystick
    mainInstance.joystick.handleTouchEnd(e.changedTouches);
  }
});

wx.onTouchCancel(() => {
  if (mainInstance) {
    // Handle virtual joystick
    mainInstance.joystick.handleTouchEnd([]);
  }
});
