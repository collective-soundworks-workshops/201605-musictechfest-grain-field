import { audio, audioContext } from 'soundworks/client';

/**
 * Populate a mono `AudioBuffer` with random values and returns it.
 * @return {AudioBuffer}
 */
function createWhiteNoiseBuffer() {
  const sampleRate = audioContext.sampleRate;
  const bufferSize = 2 * sampleRate; // 2 sec
  const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  for (var i = 0; i < bufferSize; i++)
    data[i] = Math.random() * 2 - 1;

  return buffer;
}

/**
 * Simple synthesizer producing white noise.
 */
export default class Synth {
  constructor(buffer) {
    this.output = audioContext.createGain();
    this.output.connect(audioContext.destination);
    this.output.gain.value = 0;

    this.scheduler = audio.getScheduler();
    this.engine = new audio.GranularEngine();
    this.engine.connect(this.output);
    this.engine.buffer = buffer;
    this.engine.periodAbs = 0.01;
    this.engine.durationAbs = 0.2;
    this.engine.positionVar = buffer.duration - 0.2;

    // this.source = audioContext.createOscillator();
    // this.source.connect(this.output);
    // this.source.type = 'sine';
    // this.source.frequency.value = 300;
    // this.source.start(0);
  }

  start(gain) {
    const now = audioContext.currentTime;
    this.scheduler.add(this.engine);
    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setValueAtTime(this.output.gain.value, now);
    this.output.gain.linearRampToValueAtTime(gain, now + 0.02);
  }

  stop() {
    const now = audioContext.currentTime;
    this.scheduler.remove(this.engine);
    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setValueAtTime(this.output.gain.value, now);
    this.output.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
  }

  setGain(gain) {
    const now = audioContext.currentTime;
    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setValueAtTime(this.output.gain.value, now);
    this.output.gain.linearRampToValueAtTime(gain, now + 0.02);
  }
}
