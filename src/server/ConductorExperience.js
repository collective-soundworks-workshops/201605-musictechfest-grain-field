import * as soundworks from 'soundworks/server';

export default class ConductorExperience extends soundworks.Experience {
  constructor() {
    super('conductor');

    this.sharedParams = this.require('shared-params');

    this.sharedParams.addText('numPlayers', 'num players', 0, ['conductor']);
    this.sharedParams.addEnum('record', 'record', ['start', 'stop'], 'stop');
    this.sharedParams.addTrigger('endPerformance', 'endPerformance', 'player');

    // this.sharedParams.addNumber('periodAbs', 'periodAbs', 1, 10, 0.01, 10, 'soloist');
    // params for granular engine
    this.sharedParams.addNumber('periodAbs', 'periodAbs', 0.02, 0.2, 0.001, 0.05, 'player');
    this.sharedParams.addNumber('durationAbs', 'durationAbs', 0.01, 0.5, 0.001, 0.2, 'player');
    this.sharedParams.addNumber('positionVar', 'positionVar', 0.01, 0.5, 0.001, 0.02, 'player');
    this.sharedParams.addNumber('gainMult', 'gainMult', 1, 100, 0.1, 20, 'player');
  }
}
