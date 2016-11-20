// import soundworks (client side) and Soundfield experience
import * as soundworks from 'soundworks/client';
import PlayerExperience from './PlayerExperience';
import viewTemplates from '../shared/viewTemplates';
import viewContent from '../shared/viewContent';


function bootstrap() {
  // configuration received from the server through the `index.html`
  // @see {~/src/server/index.js}
  // @see {~/html/default.ejs}
  const config = window.soundworksConfig;

  const nameArr = window.soundworksConfig.appName.split('');
  nameArr.sort(() => Math.random() - 0.5);
  const name = nameArr.join('');

  // initialize the 'player' client
  config.appName = name;
  soundworks.client.init(config.clientType, config);
  soundworks.client.setViewContentDefinitions(viewContent);
  soundworks.client.setViewTemplateDefinitions(viewTemplates);
  // instanciate the experience of the `player`
  const playerExperience = new PlayerExperience();
  // start the application
  soundworks.client.start();
}

window.addEventListener('load', bootstrap);
