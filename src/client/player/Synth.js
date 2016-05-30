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

    this.scheduler = audio.getScheduler();

    this.engines = [];
    for (let index = 0; index < 2; index++) {
      const env = audioContext.createGain();
      env.connect(this.output);
      env.gain.value = 0;

      const engine = new audio.GranularEngine();
      engine.connect(env);

      this.engines[index] = { env, engine };
    }

    this.currentIndex = 0;
    this.crossFadeDuration = 2;
    this.hasStarted = false;
    this.currentPosition = Math.random();

    this.setBuffer = this.setBuffer.bind(this);

    this.resamplingValues = [0, 1200, 2400, 3600, 4800];
  }

  start() {
    this.hasStarted = true;
  }

  stop(releaseTime) {
    const now = audioContext.currentTime;
    const { env, engine } = this.engines[this.currentIndex];

    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setValueAtTime(this.output.gain.value, now);
    this.output.gain.linearRampToValueAtTime(0, now + releaseTime);

    setTimeout(() => {
      if (this.scheduler.has(engine))
        this.scheduler.remove(engine);
    }, (releaseTime + 0.5) * 1000);
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
    nextEngine.position = this.currentPosition * buffer.duration;
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

  // roll
  setPositionFromRoll(normValue) {
    const { engine } = this.engines[this.currentIndex];
    const buffer = engine.buffer;
    this.currentNormPosition = normValue;

    if (buffer)
      engine.position = normValue * buffer.duration;
  }

  // pitch
  setResamplingVarFromPitch(value) {
    const { engine } = this.engines[this.currentIndex];
    engine.resamplingVar = value * 100;
  }

  setResamplingVar(resamplingVar) {
    this.engines.forEach((entry) => {
      entry.engine.resamplingVar = resamplingVar;
    });
  }

  setPeriodAbs(value) {
    this.engines.forEach((entry) => {
      entry.engine.periodAbs = value;
    });
  }

  setDurationAbs(value) {
    this.engines.forEach((entry) => {
      entry.engine.durationAbs = value;
    });
  }

  setPositionVar(value) {
    this.engines.forEach((entry) => {
      entry.engine.positionVar = value;
    });
  }

  setGain(gain) {
    const now = audioContext.currentTime;
    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setValueAtTime(this.output.gain.value, now);
    this.output.gain.linearRampToValueAtTime(gain, now + 0.02);
  }
}
