import { Experience } from 'soundworks/server';

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
  constructor(clientTypes) {
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

    // the `shared-config` service is used by the `soloist` clients to get
    // informations from the server configuration
    this.sharedConfig = this.require('shared-config');
    // this instruction adds the sharing of the `setup` entry of the server
    // configuration as a requirement for `soloist`
    this.sharedConfig.share('setup', 'soloist');
    this.area = this.sharedConfig.get('setup.area');
    this.inputRadius = this.sharedConfig.get('setup.radius');

    // the `locator` service is required by the `player` clients to get their
    // approximative position into the defined area
    this.locator = this.require('locator');

    this.leap = this.require('leap');

    this.onInputChange = this.onInputChange.bind(this);
  }

  start() {
    this.leap.addListener(this.onInputChange);
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
        break;
    }
  }

  exit(client) {
    if (client.type === 'player')
      this.onPlayerExit(client);
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

  onInputChange(coordinates) {
    const radius = this.inputRadius;
    const activePlayers = this.activePlayers;
    const players = new Set(this.players.keys());

    // if coordinates are empty, stop all players, else defines if a client
    // should be sent a `start` or `stop` message according to its previous
    // state and if it is or not in an zone that is excited by the soloist
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

        if (inArea) {
          if (!isActive) {
            this.send(player, 'start', normalizedDistance);
            activePlayers.add(player);
          } else {
            this.send(player, 'distance', normalizedDistance);
          }
        }

        if (isActive && !inArea) {
          this.send(player, 'stop');
          activePlayers.delete(player);
        }
      });
    }

    this.broadcast('soloist', null, 'leap:simple:coordinates', coordinates);
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
