// Import Soundworks modules (client side)
import * as soundworks from 'soundworks/client';
const SpaceView = soundworks.SpaceView;
const View = soundworks.View;
const viewport = soundworks.viewport;
const TouchSurface = soundworks.TouchSurface;

// define the template of the view used by the experience
// the template uses some of the helper classes defined in `sass/_02-commons.scss`
const viewTemplate = `
  <div class="background fit-container"></div>
  <div class="foreground fit-container"></div>
`;


/**
 * The `SoloistPerformance` class is responsible for:
 * - displaying the positions of the player` client in the given `area`
 * - tracking the soloist's touche(s) on screen and sending their
 *   coordinates to the server.
 */
export default class SoloistExperience extends soundworks.Experience {
  constructor() {
    super();

    // the experience requires 2 service:
    // - the `platform` service can create the home page of the application
    this.platform = this.require('platform', { showDialog: true });
    // - the `shared-config` assure the experience has access to certain
    //   server configuration options when it starts
    this.sharedConfig = this.require('shared-config');

    /**
     * Area of the scenario.
     * @type {Object}
     */
    this.area = null;

    /**
     * Radius of the excited zone relative to the setup area definition.
     * @type {Number}
     */
    this.radius = 1;

    /**
     * Object containing the current touch coordinates, ids of the
     * touch events are used as keys.
     * @type {Object<String, Array<Number>>}
     */
    this.touches = {};

    /**
     * Object containing the object used to render the feedback of the touches,
     * ids of the touch events are used as keys.
     * @type {Object<String, Array<Number>>}
     */
    this.renderedTouches = {};

    /**
     * List of the timeout ids for each touch events, ids of the touch events
     * are used as keys.
     * @type {Object<String, Number>}
     */
    this.timeouts = {};

    /**
     * The delay in which a touch event is cancelled of no touch move or touch
     * end occured since its start.
     * @type {Numeber}
     */
    this.timeoutDelay = 6000;

    // bind methods to the instance to keep a safe `this` in callbacks
    // this.onTouchStart = this.onTouchStart.bind(this);
    // this.onTouchMove = this.onTouchMove.bind(this);
    // this.onTouchEnd = this.onTouchEnd.bind(this);

    this.onPlayerList = this.onPlayerList.bind(this);
    this.onPlayerAdd = this.onPlayerAdd.bind(this);
    this.onPlayerRemove = this.onPlayerRemove.bind(this);

    this.handleLeapInput = this.handleLeapInput.bind(this);
  }

  /**
   * Initialize the experience when all services are ready.
   */
  init() {
    this.area = this.sharedConfig.get('setup.area');
    this.area.background = undefined;
    // initialize the view of the experience
    this.viewTemplate = viewTemplate;
    this.viewCtor = View;
    this.view = this.createView();
    // create a background `SpaceView` to display players positions
    this.playersSpace = new SpaceView();
    this.playersSpace.setArea(this.area);
    // create a foreground `SpaceView` for interactions feedback
    this.interactionsSpace = new SpaceView();
    this.interactionsSpace.setArea(this.area);
    // add the 2 spaces to the main view
    this.view.setViewComponent('.background', this.playersSpace);
    this.view.setViewComponent('.foreground', this.interactionsSpace);
  }

  /**
   * Start the experience when all services are ready.
   */
  start() {
    super.start();

    if (!this.hasStarted)
      this.init();

    this.show();

    // Setup listeners for player connections / disconnections
    this.receive('player:list', this.onPlayerList);
    this.receive('player:add', this.onPlayerAdd);
    this.receive('player:remove', this.onPlayerRemove);

    // // Add a `TouchSurface` to the area svg. The `TouchSurface` is a helper
    // // which send normalized coordinates on touch events according to the given
    // // `DOMElement`
    // const surface = new TouchSurface(this.interactionsSpace.$svg);
    // // setup listeners to the `TouchSurface` events
    // surface.addListener('touchstart', this.onTouchStart);
    // surface.addListener('touchmove', this.onTouchMove);
    // surface.addListener('touchend', this.onTouchEnd);

    this.receive('leap:simple:coordinates', this.handleLeapInput);
  }

  /**
   * Display all the players from a list in the space visualization.
   * @param {Object[]} playerList List of players.
   */
  onPlayerList(playerList) {
    this.playersSpace.addPoints(playerList);
  }

  /**
   * Add a player to the space visualization.
   * @param {Object} player Player.
   */
  onPlayerAdd(playerInfos) {
    this.playersSpace.addPoint(playerInfos);
  }

  /**
   * Remove a player from the space visualization.
   * @param {Object} player Player.
   */
  onPlayerRemove(playerInfos) {
    this.playersSpace.deletePoint(playerInfos.id);
  }

  handleLeapInput(coordinates, radius) {
    if (Object.keys(this.renderedTouches).length === 0)
      this.createDrawingZone(1, coordinates[0], coordinates[1], radius);
    else
      this.updateDrawingZone(1, coordinates[0], coordinates[1], radius);
  }

  /**
   * Callback for the `touchstart` event.
   * @param {Number} id - The id of the touch event as given by the browser.
   * @param {Number} x - The normalized x coordinate of the touch according to the
   *  listened `DOMElement`.
   * @param {Number} y - The normalized y coordinate of the touch according to the
   *  listened `DOMElement`.
   */
  createDrawingZone(id, x, y, radius) {
    // define the position according to the area (`x` and `y` are normalized values)
    const area = this.area;
    x = x * area.width;
    y = y * area.height;

    // add the coordinates to the ones sended to the server
    // this.touches[id] = [x, y];
    this.sendCoordinates();

    // defines the radius of excitation in pixels according to the rendered area.
    radius = (radius / area.width) * this.interactionsSpace.areaWidth;

    // create an object to be rendered by the `interactionsSpace`
    const point = { id, x, y, radius };

    // keep a reference to the rendered point for update
    this.renderedTouches[id] = point;
    // render the point
    this.interactionsSpace.addPoint(point);

    // timeout if the `touchend` does not trigger
    clearTimeout(this.timeouts[id]);
    this.timeouts[id] = setTimeout(() => this.removeDrawingZone(id), this.timeoutDelay);
  }

  /**
   * Callback for the `touchmove` event.
   * @param {Number} id - The id of the touch event as given by the browser.
   * @param {Number} x - The normalized x coordinate of the touch according to the
   *  listened `DOMElement`.
   * @param {Number} y - The normalized y coordinate of the touch according to the
   *  listened `DOMElement`.
   */
  updateDrawingZone(id, x, y, radius) {
    const area = this.area;
    x = x * area.width;
    y = y * area.height;

    // update the feedback point
    const point = this.renderedTouches[id];
    point.x = x;
    point.y = y;
    point.radius = (radius / area.width) * this.interactionsSpace.areaWidth;

    this.interactionsSpace.updatePoint(point);

    // set a new timeout if the `touchend` does not trigger
    clearTimeout(this.timeouts[id]);
    this.timeouts[id] = setTimeout(() => this.removeDrawingZone(id), this.timeoutDelay);
  }

  /**
   * Callback for the `touchend` and `touchcancel` events.
   * @param {Number} id - The id of the touch event as given by the browser.
   * @param {Number} x - The normalized x coordinate of the touch according to the
   *  listened `DOMElement`.
   * @param {Number} y - The normalized y coordinate of the touch according to the
   *  listened `DOMElement`.
   */
  removeDrawingZone(id) {
    // cancel preventive timeout for this id
    clearTimeout(this.timeouts[id]);

    // remove feedback point
    const point = this.renderedTouches[id];
    this.interactionsSpace.deletePoint(point.id);
    // destroy references to this particular touch event
    delete this.touches[id];
    delete this.renderedTouches[id];
  }

  /**
   * Send the current state of the touche coordinates to the server.
   */
  sendCoordinates() {
    this.send('input:change', this.radius, this.touches);
  }
}
