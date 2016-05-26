// import soundworks (client side) and Soundfield experience
import * as soundworks from 'soundworks/client';

function bootstrap() {
  // configuration received from the server through the `index.html`
  // @see {~/src/server/index.js}
  // @see {~/html/default.ejs}
  const { appName, clientType, socketIO }  = window.soundworksConfig;
  // initialize the 'player' client
  soundworks.client.init(clientType, { socketIO, appName });
  // instanciate the experience of the `player`
  const conductor = new soundworks.Conductor();
  conductor.setGuiOptions('record', { type: 'buttons' });
  // start the application
  soundworks.client.start();
}

window.addEventListener('load', bootstrap);
