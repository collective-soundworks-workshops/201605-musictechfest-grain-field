import * as soundworks from 'soundworks/client';
import Synth from './Synth';
import BeatSynth from './BeatSynth';
import MovingAverage from './MovingAverage';
import throttle from 'lodash.throttle';


// html template used by `View` of the `PlayerExperience`
const template = `
  <div class="section-top"></div>
  <div class="section-center flex-center">
    <p class="big"><%= center %></p>
  </div>
  <div class="section-bottom"></div>
`;


const files = ['/sounds/beats-hh.wav', '/sounds/beats-sd.wav'];
//const files = ['/sounds/mindbox-extract.mp3'];
const client = soundworks.client;

const colors = [
  '#dd0085', // 'pink'
  '#ee0000', // 'red'
  '#ff7700', // 'orange'
  '#ffaa00', // 'yellow'
  '#43af00', // 'green'
  '#0062e2', // 'darkBlue'
  '#009ed8', // 'lightBlue'
  '#6b7884', // 'grey'
  '#6700f7', // 'purple'
];

/**
 * The `PlayerExperience` requires the `players` to give its approximative
 * position into the `area` (see `src/server/index`) of the experience.
 * The device of the player is then remote controlled by another type of
 * client (i.e. `soloist`) that can control the `start` and `stop` of the
 * synthesizer from its own interface.
 */
export default class PlayerExperience extends soundworks.Experience {
  constructor() {
    super();

    // the experience requires 2 services:
    // - the `platform` service checks for the availability of the requested
    //   features of the application, and display the home screen of the
    //   application
    this.require('platform', { features: 'web-audio' });
    // - the `locator` service provide a view asking for the approximative
    //   position of the user in the defined `area`
    this.require('locator');
    this.require('checkin');

    this.checkin = this.require('checkin');
    this.loader = this.require('loader', { files });
    this.sharedParams = this.require('shared-params');

    this.sharedConfig = this.require('shared-config');

    this.syncScheduler = this.require('scheduler');
    this.sync = this.require('sync');

    this.motionInput = this.require('motion-input', {
      descriptors: ['accelerationIncludingGravity'],
    });

    // bind methods to the instance to keep a safe `this` in callbacks
    this.onStartMessage = this.onStartMessage.bind(this);
    this.onEndPerformanceMessage = this.onEndPerformanceMessage.bind(this);
    this.onDistanceMessage = this.onDistanceMessage.bind(this);
    // this.onHeightMessage = this.onHeightMessage.bind(this);
    this.onLoadFileMessage = this.onLoadFileMessage.bind(this);
    this.processAccelerationData = throttle(this.processAccelerationData.bind(this), 50);
  }

  /**
   * Initialize the experience when all services are ready.
   */
  init() {
    /**
     * The Synthesizer used in the experience.
     * @type {WhiteNoiseSynth}
     */
    this.synth = new Synth();
    this.beatSynth = new BeatSynth(this.sync, this.sharedConfig.get('bpm'), this.loader.buffers[0], this.loader.buffers[1]);

    // configure and instanciate the view of the experience
    this.viewContent = { center: 'Listen!' };
    this.viewTemplate = template;
    this.viewCtor = soundworks.SegmentedView;
    this.view = this.createView();

    this.currentColorIndex = null;
    this.performanceEnded = false;

    this.positionFilter = new MovingAverage(4);
    this.cutoffFilter = new MovingAverage(8);
  }

  /**
   * Start the experience when all services are ready.
   */
  start() {
    super.start();

    // if the experience has never started, initialize it
    if (!this.hasStarted)
      this.init();

    // request the `viewManager` to display the view of the experience
    this.show();
    // setup socket listeners for server messages
    this.receive('start', this.onStartMessage);
    this.receive('stop', this.onStopMessage);
    this.receive('distance', this.onDistanceMessage);
    // this.receive('height', this.onHeightMessage);
    this.receive('load:file', this.onLoadFileMessage);

    this.sharedParams.addParamListener('periodAbs', (value) => {
      this.synth.setPeriodAbs(value);
    });

    this.sharedParams.addParamListener('durationAbs', (value) => {
      this.synth.setDurationAbs(value);
    });

    this.sharedParams.addParamListener('positionVar', (value) => {
      this.synth.setPositionVar(value);
    });

    this.sharedParams.addParamListener('gainMult', (value) => {
      this.synth.setGain(value);
      this.beatSynth.setGainMultiplier(value);
    });

    this.sharedParams.addParamListener('endPerformance', () => {
      this.onEndPerformanceMessage();
    });

    this.motionInput.addListener('accelerationIncludingGravity', this.processAccelerationData);

    // @todo - move this in `onStartMessage`
    this.syncScheduler.add(this.beatSynth);
    this.beatSynth.setGain(1);
  }

  processAccelerationData(data) {
    const acc = { x: data[0], y: data[1], z: data[2] };
    const pitch = -2 * Math.atan(acc.y / Math.sqrt(acc.z * acc.z + acc.x * acc.x)) / Math.PI;
    const roll = -2 * Math.atan(acc.x / Math.sqrt(acc.y * acc.y + acc.z * acc.z)) / Math.PI;

    let normRoll = 0.5 * roll;
    let normPitch = 1 + pitch;

    normRoll = this.positionFilter.process(normRoll);
    normPitch = 1 - this.cutoffFilter.process(normPitch);

    normRoll = Math.min(1, Math.max(0, normRoll)); // rotation around y axis
    normPitch = Math.min(1, Math.max(0, normPitch));

    this.synth.setPositionFromRoll(normRoll);
    this.synth.setResamplingVarFromPitch(normPitch);

    this.beatSynth.setCutoff(normPitch);
  }

  onLoadFileMessage(path) {
    if (this.performanceEnded) { return; }

    this.loader.load({ file: path }).then(() => {
      if (this.performanceEnded) { return; }

      const buffer = this.loader.get('file');
      this.synth.setBuffer(buffer);

      if (!this.synth.hasStarted)
        this.synth.start();

      // pick a new color
      let newColorIndex = Math.floor(Math.random() * colors.length);
      while (newColorIndex === this.currentColorIndex)
        newColorIndex  = Math.floor(Math.random() * colors.length);

      const backgroundColor = colors[newColorIndex];
      this.view.$el.style.backgroundColor = backgroundColor;
      this.currentColorIndex = newColorIndex;
    }).catch((err) => {
      console.error(err.stack);
    });
  }

  onStartMessage(normalizedDistance) {
    this.syncScheduler.add(this.beatSynth);
    this.beatSynth.setGain(normalizedDistance);
  }

  onStopMessage() {
    this.syncScheduler.remove(this.beatSynth);
  }

  onDistanceMessage(normalizedDistance) {
    this.beatSynth.setGain(normalizedDistance);
  }

  // onHeightMessage(normalizedHeight) {

  // }

  // end of the performance
  onEndPerformanceMessage() {
    this.performanceEnded = true;
    const releaseTime = this.synth.stop();
    this.view.$el.style.transition = `background-color ${releaseTime}s`;
    this.view.$el.style.backgroundColor = 'transparent';
  }
}
