// import soundworks (client side) and Soundfield experience
import * as soundworks from 'soundworks/client';
import viewTemplates from '../shared/viewTemplates';
import viewContent from '../shared/viewContent';

function bootstrap() {
  // configuration received from the server through the `index.html`
  // @see {~/src/server/index.js}
  // @see {~/html/default.ejs}
  const config = window.soundworksConfig;
  soundworks.client.init(config.clientType, config);
  soundworks.client.setViewContentDefinitions(viewContent);
  soundworks.client.setViewTemplateDefinitions(viewTemplates);
  // instanciate the experience of the `player`
  const conductor = new soundworks.BasicSharedController();

  conductor.setGuiOptions('record', { type: 'buttons' });
  conductor.setGuiOptions('endPerformance', { confirm: true });

  conductor.setGuiOptions('periodAbs', { type: 'slider' });
  conductor.setGuiOptions('durationAbs', { type: 'slider' });
  conductor.setGuiOptions('positionVar', { type: 'slider' });
  conductor.setGuiOptions('gainMult', { type: 'slider' });
  // start the application
  soundworks.client.start();
}

window.addEventListener('load', bootstrap);
