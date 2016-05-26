// enable source-maps in node
import 'source-map-support/register';
// import soundworks (server-side) and experience
import * as soundworks from 'soundworks/server';
import SoundfieldExperience from './SoundfieldExperience';
// import leap service
import '../common/service/Leap';

class ConductorExperience extends soundworks.Experience {
  constructor() {
    super('conductor');

    this.sharedParams = this.require('shared-params');
    // this.sharedParams.addText('numPlayers', 'num players', 0, ['conductor']);
    this.sharedParams.addEnum('record', 'record', ['start', 'stop'], 'stop');
  }
}

// sets the size of the area, orther setup informations are not needed
const setup = {
  area: { height: 5, width: 8 },
  radius: 1,
}

const midiController = 'LPD8';
const recordPeriod = 1;
const recordDuration = 2;
const baseNote = 44;
const steps = 8;
const resamplingVarMax = 1200;

// initialize the server with configuration informations
soundworks.server.init({
  setup,
  appName: 'Soundfield',
  midiController,
  recordPeriod,
  recordDuration,
  baseNote,
  steps,
  resamplingVarMax
});

// define the configuration object to be passed to the `.ejs` template
soundworks.server.setClientConfigDefinition((clientType, config, httpRequest) => {
  return {
    clientType: clientType,
    socketIO: config.socketIO,
    appName: config.appName,
    version: config.version,
    defaultType: config.defaultClient,
    assetsDomain: config.assetsDomain,
  };
});

// create the common server experience for both the soloists and the players
const conductor = new ConductorExperience();
const soundfieldExperience = new SoundfieldExperience(['player', 'soloist']);

// start the application
soundworks.server.start();
