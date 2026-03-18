export default class Animation {
  constructor(imgSrc, width, height) {
    this.img = wx.createImage();
    if (imgSrc) {
      this.img.src = imgSrc;
    }
    this.width = width;
    this.height = height;
    this.x = 0;
    this.y = 0;
    this.visible = true;
    this.isActive = true;
    this.frames = [];
    this.currentFrame = 0;
    this.isPlaying = false;
    this.color = null;
  }

  initFrames(frames) {
    this.frames = frames;
  }

  playAnimation() {
    this.isPlaying = true;
    this.currentFrame = 0;
  }

  aniRender(ctx) {
    if (!this.isPlaying) return;
    // 简化动画处理
  }

  render(ctx) {
    if (!this.visible) return;
    // 如果有颜色则绘制色块，否则尝试绘制图片
    if (this.color) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    } else if (this.img.complete || this.img.width > 0) {
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
  }

  isCollideWith(sprite) {
    return !(
      this.x > sprite.x + sprite.width ||
      this.x + this.width < sprite.x ||
      this.y > sprite.y + sprite.height ||
      this.y + this.height < sprite.y
    );
  }
}
