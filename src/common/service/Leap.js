import {Activity, serviceManager} from 'soundworks/server';
import leap from 'leapjs';

function clip(x) {
   return Math.min(1, Math.max(x, 0));
}

class Leap extends Activity {
	constructor() {
		super('service:leap');

		this.listeners = [];
		this.leapPosition = [];
	}

	start() {
		leap.loop({enableGestures: true}, (frame) => {

			if (frame.hands.length > 0) {
				for (let i = 0; i < frame.hands.length; i++) {

					const hand = frame.hands[i];

					if (hand.type !== 'right') continue;

					const x = clip((hand.palmPosition[0] + 300) / 600);
					const y = clip((hand.palmPosition[2] - 300) / 600 * -1);
					const z = clip(hand.palmPosition[1] / 500);
					// const height = clip(hand.palmPosition[1] / 500);
					// const grab = clip(hand.grabStrength);
					// const pinch = clip(hand.pinchStrength);

					this.leapPosition[0] = x;
					this.leapPosition[1] = 1 - y;
					this.leapPosition[2] = z;
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

