import * as soundworks from 'soundworks/client';
import Synth from './Synth';


// html template used by `View` of the `PlayerExperience`
const template = `
  <div class="section-top"></div>
  <div class="section-center flex-center">
    <p class="big"><%= center %></p>
  </div>
  <div class="section-bottom"></div>
`;


const files = ['/sounds/violin.wav'];
//const files = ['/sounds/mindbox-extract.mp3'];
const client = soundworks.client;

// 'pink': '#dd0085',
// 'red': '#ee0000',
// 'orange': '#ff7700',
// 'yellow': '#ffaa00',
// 'green': '#43af00',
// 'darkBlue': '#0062e2',
// 'lightBlue': '#009ed8',
// 'grey': '#6b7884',
// 'purple': '#6700f7',

const colors = [
  '#dd0085',
  '#ee0000',
  '#ff7700',
  '#ffaa00',
  '#43af00',
  '#0062e2',
  '#009ed8',
  '#6b7884',
  '#6700f7',
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

    // bind methods to the instance to keep a safe `this` in callbacks
    // this.onStartMessage = this.onStartMessage.bind(this);
    this.onEndPerformanceMessage = this.onEndPerformanceMessage.bind(this);
    this.onDistanceMessage = this.onDistanceMessage.bind(this);
    this.onHeightMessage = this.onHeightMessage.bind(this);
    this.onLoadFileMessage = this.onLoadFileMessage.bind(this);
  }

  /**
   * Initialize the experience when all services are ready.
   */
  init() {
    /**
     * The Synthesizer used in the experience.
     * @type {WhiteNoiseSynth}
     */
    this.synth = new Synth(this.loader.buffers[0]);

    // configure and instanciate the view of the experience
    this.viewContent = { center: 'Listen!' };
    this.viewTemplate = template;
    this.viewCtor = soundworks.SegmentedView;
    this.view = this.createView();

    this.currentColorIndex = null;
    this.performanceEnded = false;
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
    this.receive('height', this.onHeightMessage);
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
      this.synth.setGainMultiplier(value);
    });

    this.sharedParams.addParamListener('endPerformance', () => {
      this.onEndPerformanceMessage();
    });
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

  /**
   * Callback to be executed when receiving the `start` message from the server.
   */
  onStartMessage(normalizedDistance) {

  }

  onStopMessage() {

  }

  onDistanceMessage(normalizedDistance) {

  }

  onHeightMessage(normalizedHeight) {
  }

  // end of the performance
  onEndPerformanceMessage() {
    this.performanceEnded = true;
    const releaseTime = this.synth.stop();
    this.view.$el.style.transition = `background-color ${releaseTime}s`;
    this.view.$el.style.backgroundColor = 'transparent';
  }
}
