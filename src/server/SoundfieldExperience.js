import { Experience } from 'soundworks/server';
import midi from 'midi';
import { exec } from 'child_process';
import fse from 'fs-extra';

/**
 * The `SoundfieldExperience` makes the connection between the `soloist`
 * and the `player` client types.
 * More specifically, the module listens for messages containing the touch
 * coordinates from the `soloist` clients, calculates the distances from the
 * touch to every `player`, and sends a `play` or `stop`
 * message to the relevant `player` clients.
 */
export default class SoundfieldExperience extends Experience {
  /**
   * @param {Array} clientTypes - The client types the experience should be binded.
   */
  constructor(clientTypes, conductor) {
    super(clientTypes);

    /**
     * List of the connected players along with their formatted informations.
     * @type {Map<Object, Object>}
     */
    this.players = new Map();

    /**
     * List of the currently active players.
     * @type {Set}
     */
    this.activePlayers = new Set();

    this.sharedParams = this.require('shared-params');
    this.checkin = this.require('checkin');
    this.locator = this.require('locator');
    this.sync = this.require('sync');
    this.leap = this.require('leap');

    this.sharedConfig = this.require('shared-config');
    this.sharedConfig.share('setup', 'soloist');
    this.sharedConfig.share('resamplingVarMax', 'player');
    this.sharedConfig.share('bpm', 'player');
    this.area = this.sharedConfig.get('setup.area');
    this.inputRadius = this.sharedConfig.get('setup.radius');
    this.areaMaxFactor = (this.area.width > this.area.height ? this.area.width : this.area.height) / 1.7;

    this.midiIn = new midi.input();
    this.midiOut = new midi.output();

    this.onInputChange = this.onInputChange.bind(this);
    this.setRecording = this.setRecording.bind(this);
  }

  start() {
    this.leap.addListener(this.onInputChange);
    this.sharedParams.addParamListener('record', this.setRecording);
    this.setupMidi();
  }

  enter(client) {
    super.enter(client);
    // define what to do ccording to the `client` type (i.e. `player` or `soloist`)
    switch (client.type) {
      case 'soloist':
        this.onSoloistEnter(client);
        break;
      case 'player':
        this.onPlayerEnter(client);
            this.sharedParams.update('numPlayers', this.clients.length);
        break;
    }
  }

  exit(client) {
    if (client.type === 'player')
      this.onPlayerExit(client);

    this.sharedParams.update('numPlayers', this.clients.length);
  }

  setupMidi() {
    let controllerInPortNumber = null;
    let controllerOutPortNumber = null;
    const controllerName = this.sharedConfig.get('midiController');

    for (let i = 0; i < this.midiIn.getPortCount(); i++) {
      if (this.midiIn.getPortName(i) == controllerName) {
        controllerInPortNumber = i;
        break;
      }
    }

    for (let i = 0; i < this.midiOut.getPortCount(); i++) {
      if (this.midiOut.getPortName(i) == controllerName) {
        controllerOutPortNumber = i;
        break;
      }
    }

    if (controllerInPortNumber !== null && controllerOutPortNumber !== null) {
      this.midiIn.openPort(controllerInPortNumber);
      this.midiOut.openPort(controllerOutPortNumber);
      this.useMidi = true;

      this.midiIn.on('message', function(deltaTime, message) {
        console.log('m:' + message + ' d:' + deltaTime);
      });
    } else {
      console.warn('No midi controller found!');
      this.useMidi = false;
    }
  }

  setRecording(value) {
    if (value === 'start')
      this.startRecording();
    else if (value === 'stop')
      this.stopRecording();
  }

  startRecording() {
    let count = 0;
    let offset = 0;

    const note = this.sharedConfig.get('baseNote');
    const steps = this.sharedConfig.get('steps');
    const recordDuration = this.sharedConfig.get('recordDuration');
    const recordPeriod = this.sharedConfig.get('recordPeriod');

    this.intervalId = setInterval(() => {
      const currentStep = (count % steps);

      offset = !currentStep ? steps-1 : -1;

      if (this.useMidi) {
        this.midiOut.sendMessage([144, note + currentStep, 127]);
        this.midiOut.sendMessage([128, note + currentStep + offset, 0]);
      }

      const publicPath = `sounds/${currentStep}.mp3`;
      const file = `public/${publicPath}`;
      const command = `rec --clobber -c 1 ${file} trim 0 ${recordDuration}`;

      fse.remove(file, (err) => {
        if (err)
          console.error(err);

        exec(command, (err, stdout, stderr) => {
          if (err) {
            console.error("rec command failed:", err);
            return;
          }

          for (let player of this.players.keys()) {
            if ((player.index % steps) === currentStep)
              this.send(player, 'load:file', publicPath);
          }
        });
      });

      count++;
    }, recordPeriod * 1000);
  }

  stopRecording() {
    if (this.useMidi) {
      const note = this.sharedConfig.get('baseNote');

      for (let i = 0; i < this.sharedConfig.get('steps'); i++)
        this.midiOut.sendMessage([128, note+i, 0]);

      this.midiIn.closePort();
      this.midiOut.closePort();
    }

    clearInterval(this.intervalId);
  }

  /**
   * Specific `enter` routine for clients of type `soloist`.
   */
  onSoloistEnter(client) {
    // send the list of connected players
    const playerInfos = Array.from(this.players.values())
    this.send(client, 'player:list', playerInfos);
  }

  /**
   * Specific `enter` routine for clients of type `player`.
   */
  onPlayerEnter(client) {
    // format infos from the player to be consmumed by the solist
    const infos = this.formatClientInformations(client);
    // keep track of the informations
    this.players.set(client, infos);
    // send the informations of the new client to all the connected soloists
    this.broadcast('soloist', null, 'player:add', infos);
  }

  onPlayerExit(client) {
    // retrieve stored informations from the client
    const infos = this.players.get(client);
    // delete it from the stack of client `player`
    this.players.delete(client);
    // send the informations of the exited client to all the connected soloists
    this.broadcast('soloist', null, 'player:remove', infos);
  }

  formatClientInformations(client) {
    return {
      id: client.uuid,
      x: client.coordinates[0],
      y: client.coordinates[1],
    };
  }

  onInputChange(hand) {

    let radius = this.inputRadius;

    const coordinates = [hand[0], hand[1], hand[2]];
    const height = coordinates[2];
    const handId = hand[3];
    const activePlayers = this.activePlayers;
    const players = new Set(this.players.keys());

    radius *= height * this.areaMaxFactor;

    // if coordinates are empty, stop all players, else defines if a client
    // should be sent a `start` or `stop` message according to its previous
    // state and if it is or not in an zone that is excited by the soloist.
    if (Object.keys(coordinates).length === 0) {
      activePlayers.forEach((player) => this.send(player, 'stop'));
      activePlayers.clear();
    } else {
      players.forEach((player) => {
        let inArea = false;
        const isActive = activePlayers.has(player);
        const distance = this.getDistance(player.coordinates, coordinates);

        if (distance < radius)
          inArea = true;

        const normalizedDistance = 1 - (distance / radius);
        const normalizedHeight = height;

        if (inArea) {
          if (!isActive) {
            this.send(player, 'start', normalizedDistance);
            activePlayers.add(player);
          } else {
            this.send(player, 'distance', normalizedDistance);
            //this.send(player, 'height', normalizedHeight);
          }
        }

        if (isActive && !inArea) {
          this.send(player, 'stop');
          activePlayers.delete(player);
        }
      });
    }

    this.broadcast('soloist', null, 'leap:simple:coordinates', coordinates, radius, handId);
  }

  getDistance(point, center) {
    const centerX = center[0] * this.area.width;
    const centerY = center[1] * this.area.height;
    const x = point[0] - centerX;
    const y = point[1] - centerY;
    const sqrDistance = x * x + y * y;

    return Math.sqrt(sqrDistance);
  }
}
