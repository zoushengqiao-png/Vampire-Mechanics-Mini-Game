export default class Pool {
  constructor() {
    this.pool = {};
  }

  getItemByClass(name, className) {
    return new className();
  }

  recover(name, instance) {}
}
