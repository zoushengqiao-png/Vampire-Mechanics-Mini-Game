import TinyEmitter from './libs/tinyemitter';
import Animation from './base/animation';

class Pool {
  constructor() {
    this.pool = {};
  }

  getItemByClass(name, className) {
    return new className();
  }

  recover(name, instance) {
    // 对象池回收
  }
}

let instance;
export default class DataBus extends TinyEmitter {
  enemys = [];
  bullets = [];
  animations = [];
  frame = 0;
  score = 0;
  isGameOver = false;
  pool = new Pool();
  expBalls = [];
  enemies = [];
  healItems = [];
  enemyProjectiles = [];
  player = null;
  levelUpCallback = null;

  constructor() {
    super();
    if (instance) return instance;
    instance = this;
  }

  reset() {
    this.frame = 0;
    this.score = 0;
    this.bullets = [];
    this.enemys = [];
    this.enemies = [];
    this.healItems = [];
    this.enemyProjectiles = [];
    this.expBalls = [];
    this.animations = [];
    this.isGameOver = false;
    // 不要清空 levelUpCallback，它应该在整个游戏生命周期中保持
    // this.levelUpCallback = null;
  }

  gameOver() {
    this.isGameOver = true;
  }

  triggerLevelUp() {
    // console.log('=== DataBus.triggerLevelUp() called ===');
    // console.log('Callback exists:', !!this.levelUpCallback);
    // console.log('Callback type:', typeof this.levelUpCallback);
    if (this.levelUpCallback) {
      // console.log('Executing callback...');
      this.levelUpCallback();
    } else {
      // console.warn('WARNING: No levelUpCallback defined!');
    }
  }

  removeEnemy(enemy) {
    const index = this.enemies.indexOf(enemy);
    if (index > -1) {
      this.enemies.splice(index, 1);
    }
  }
}
