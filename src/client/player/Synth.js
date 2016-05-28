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
  constructor() {
    this.output = audioContext.createGain();
    this.output.connect(audioContext.destination);
    this.output.gain.value = 1;

    this.scheduler = audio.getScheduler();

    this.engines = [];
    for (let index = 0; index < 2; index++) {
      const env = audioContext.createGain();
      env.connect(audioContext.destination);
      env.gain.value = 0;

      const engine = new audio.GranularEngine();
      engine.connect(env);

      this.engines[index] = { env, engine };
    }

    this.currentIndex = 0;
    this.crossFadeDuration = 2;
    this.hasStarted = false;

    this.setBuffer = this.setBuffer.bind(this);
  }

  start(gain) {
    // const now = audioContext.currentTime;
    // const { env, engine, inScheduler } = this.engines[this.currentIndex];

    // // this.scheduler.add(engine);
    // env.gain.cancelScheduledValues(now);
    // env.gain.setValueAtTime(env.gain.value, now);
    // env.gain.linearRampToValueAtTime(gain, now + 0.02);

    this.hasStarted = true;
  }

  stop() {
    const now = audioContext.currentTime;
    const { env, engine } = this.engines[this.currentIndex];
    const release = 5 + Math.random() * 5;

    env.gain.cancelScheduledValues(now);
    env.gain.setValueAtTime(env.gain.value, now);
    env.gain.linearRampToValueAtTime(0.00001, now + release);

    setTimeout(() => {
      this.scheduler.remove(engine);
    }, (release + 0.5) * 1000);

    return release;
  }

  setCrossFadeDuration(value) {
    this.crossFadeDuration = value;
  }

  // cross fade between currentEngine and next engine when new buffer
  setBuffer(buffer) {
    const now = audioContext.currentTime;
    const prevIndex = this.currentIndex;
    this.currentIndex = (this.currentIndex + 1) % 2;

    const prevEngine = this.engines[prevIndex].engine;
    const prevEnv = this.engines[prevIndex].env;
    const nextEngine = this.engines[this.currentIndex].engine;
    const nextEnv = this.engines[this.currentIndex].env;

    prevEnv.gain.cancelScheduledValues(now);
    prevEnv.gain.setValueAtTime(prevEnv.gain.value, now);
    prevEnv.gain.linearRampToValueAtTime(0, now + this.crossFadeDuration);

    this.scheduler.add(nextEngine);
    nextEngine.position = Math.random() * buffer.duration;
    nextEngine.buffer = buffer;

    nextEnv.gain.cancelScheduledValues(now);
    nextEnv.gain.value = 0;
    nextEnv.gain.setValueAtTime(0, now);
    nextEnv.gain.linearRampToValueAtTime(1, now + this.crossFadeDuration);

    setTimeout(() => {
      if (this.scheduler.has(prevEngine))
        this.scheduler.remove(prevEngine);
    }, (this.crossFadeDuration + 0.5) * 1000);
  }

  setGain(gain) {
    // gain *= this._gainMultiplier;
    // const now = audioContext.currentTime;
    // this.output.gain.cancelScheduledValues(now);
    // this.output.gain.setValueAtTime(this.output.gain.value, now);
    // this.output.gain.linearRampToValueAtTime(gain, now + 0.02);
  }

  setResamplingVar(resamplingVar) {
    this.engines.forEach((engine) => {
      engine.engine.resamplingVar = resamplingVar;
    });
  }

  setPeriodAbs(value) {
    this.engines.forEach((engine) => {
      engine.engine.periodAbs = value;
    });
  }

  setDurationAbs(value) {
    this.engines.forEach((engine) => {
      engine.engine.durationAbs = value;
    });
  }

  setPositionVar(value) {
    this.engines.forEach((engine) => {
      engine.engine.positionVar = value;
    });
  }

  setGainMultiplier(value) {
    this._gainMultiplier = value;
  }
}
