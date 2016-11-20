// enable source-maps in node
import 'source-map-support/register';
// import soundworks (server-side) and experience
import * as soundworks from 'soundworks/server';
import SoundfieldExperience from './SoundfieldExperience';
import ConductorExperience from './ConductorExperience';
// import leap service
import '../shared/service/Leap';

import defaultConfig from './config/default';


let config = null;

switch(process.env.ENV) {
  default:
    config = defaultConfig;
    break;
}

process.env.NODE_ENV = config.env;

// sets the size of the area, orther setup informations are not needed
// const setup = {
//   area: {
//     height: 8,
//     width: 6,
//     background: '/img/saal1_floorplan.svg',
//   },
//   radius: 1,
// }

config.midiController = 'LPD8';
config.bpm = 60;
config.recordPeriod = 60 / config.bpm;
config.recordDuration = 2 * config.recordPeriod;
config.baseNote = 44;
config.steps = 8;
config.resamplingVarMax = 1200;

// initialize the server with configuration informations
soundworks.server.init(config);

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
