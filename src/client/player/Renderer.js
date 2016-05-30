import * as soundworks from 'soundworks/client';

export default class Circles extends soundworks.Renderer {
  constructor() {
    super();

    this._position = null;
  }

  setPosition(value) {
    this._position = value;
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    const x = this._position * this.canvasWidth;
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, this.canvasHeight);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }
}
