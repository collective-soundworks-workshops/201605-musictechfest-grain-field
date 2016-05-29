export default class MovingAverage {
  constructor(size) {
    this.buffer = new Float32Array(size);
    this.index = 0;
  }

  process(value) {
    this.buffer[this.index] = value;

    const len = this.buffer.length;
    let sum = 0;

    for (let i = 0; i < len; i++)
      sum += this.buffer[i];

    this.index = (this.index + 1) % len;

    return sum / len;
  }
}
