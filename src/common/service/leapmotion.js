
import {Activity, serviceManager} from 'soundworks/server';
import leap from 'leapjs';

function clip(x){
    return x<0 ? 0 : x>1 ? 1 : x;
}

class Leap extends Activity {
	constructor() {
		super('service:leap');

		this.listeners = [];
		this.leapPosition = {};
	}

	start() {
		leap.loop({enableGestures: true}, (frame) => {

			if (frame.hands.length > 0) {
				for (var i = 0; i < frame.hands.length; i++) {

					var hand = frame.hands[i];

					if (hand.type != 'right') continue;

					var x = clip((hand.palmPosition[0] + 300) / 600);
					var y = clip((hand.palmPosition[2] - 300) / 600 * -1);
					var z = clip(hand.palmPosition[1] / 500);
					//var height = clip(hand.palmPosition[1] / 500);
					//var grab = clip(hand.grabStrength);
					//var pinch = clip(hand.pinchStrength);

					this.leapPosition.x = x;
					this.leapPosition.y = 1-y;
					this.leapPosition.z = z;

					// send
					this.listeners.forEach((callback) => callback(this.leapPosition));
				}
			}
		});


	}

	addListener(callback) {
		this.listeners.push(callback);
	}
}

serviceManager.register('service:leap', Leap);

