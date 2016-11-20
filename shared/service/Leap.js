'use strict';

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _server = require('soundworks/server');

var _leapjs = require('leapjs');

var _leapjs2 = _interopRequireDefault(_leapjs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function clip(x) {
	return Math.min(1, Math.max(x, 0));
}

var Leap = function (_Activity) {
	(0, _inherits3.default)(Leap, _Activity);

	function Leap() {
		(0, _classCallCheck3.default)(this, Leap);

		var _this = (0, _possibleConstructorReturn3.default)(this, (Leap.__proto__ || (0, _getPrototypeOf2.default)(Leap)).call(this, 'service:leap'));

		_this.listeners = [];
		_this.hand = [];
		return _this;
	}

	(0, _createClass3.default)(Leap, [{
		key: 'start',
		value: function start() {
			var _this2 = this;

			_leapjs2.default.loop({ enableGestures: true }, function (frame) {

				if (frame.hands.length > 0) {
					for (var i = 0; i < frame.hands.length; i++) {

						var hand = frame.hands[i];

						if (hand.type !== 'right') continue;

						var x = clip((hand.palmPosition[0] + 300) / 600);
						var y = clip((hand.palmPosition[2] - 300) / 600 * -1);
						var z = clip(hand.palmPosition[1] / 500);
						// const height = clip(hand.palmPosition[1] / 500);
						// const grab = clip(hand.grabStrength);
						// const pinch = clip(hand.pinchStrength);

						_this2.hand[0] = x;
						_this2.hand[1] = 1 - y;
						_this2.hand[2] = z;
						_this2.hand[3] = hand.type === 'right' ? 'r' : 'l';
						// send
						_this2.listeners.forEach(function (callback) {
							return callback(_this2.hand);
						});
					}
				} else {
					// send
					_this2.listeners.forEach(function (callback) {
						return callback(false);
					});
				}
			});
		}
	}, {
		key: 'addListener',
		value: function addListener(callback) {
			this.listeners.push(callback);
		}
	}]);
	return Leap;
}(_server.Activity);

_server.serviceManager.register('service:leap', Leap);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkxlYXAuanMiXSwibmFtZXMiOlsiY2xpcCIsIngiLCJNYXRoIiwibWluIiwibWF4IiwiTGVhcCIsImxpc3RlbmVycyIsImhhbmQiLCJsb29wIiwiZW5hYmxlR2VzdHVyZXMiLCJmcmFtZSIsImhhbmRzIiwibGVuZ3RoIiwiaSIsInR5cGUiLCJwYWxtUG9zaXRpb24iLCJ5IiwieiIsImZvckVhY2giLCJjYWxsYmFjayIsInB1c2giLCJyZWdpc3RlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztBQUNBOzs7Ozs7QUFFQSxTQUFTQSxJQUFULENBQWNDLENBQWQsRUFBaUI7QUFDZCxRQUFPQyxLQUFLQyxHQUFMLENBQVMsQ0FBVCxFQUFZRCxLQUFLRSxHQUFMLENBQVNILENBQVQsRUFBWSxDQUFaLENBQVosQ0FBUDtBQUNGOztJQUVLSSxJOzs7QUFDTCxpQkFBYztBQUFBOztBQUFBLGdJQUNQLGNBRE87O0FBR2IsUUFBS0MsU0FBTCxHQUFpQixFQUFqQjtBQUNBLFFBQUtDLElBQUwsR0FBWSxFQUFaO0FBSmE7QUFLYjs7OzswQkFFTztBQUFBOztBQUNQLG9CQUFLQyxJQUFMLENBQVUsRUFBQ0MsZ0JBQWdCLElBQWpCLEVBQVYsRUFBa0MsVUFBQ0MsS0FBRCxFQUFXOztBQUU1QyxRQUFJQSxNQUFNQyxLQUFOLENBQVlDLE1BQVosR0FBcUIsQ0FBekIsRUFBNEI7QUFDM0IsVUFBSyxJQUFJQyxJQUFJLENBQWIsRUFBZ0JBLElBQUlILE1BQU1DLEtBQU4sQ0FBWUMsTUFBaEMsRUFBd0NDLEdBQXhDLEVBQTZDOztBQUU1QyxVQUFNTixPQUFPRyxNQUFNQyxLQUFOLENBQVlFLENBQVosQ0FBYjs7QUFFQSxVQUFJTixLQUFLTyxJQUFMLEtBQWMsT0FBbEIsRUFBMkI7O0FBRTNCLFVBQU1iLElBQUlELEtBQUssQ0FBQ08sS0FBS1EsWUFBTCxDQUFrQixDQUFsQixJQUF1QixHQUF4QixJQUErQixHQUFwQyxDQUFWO0FBQ0EsVUFBTUMsSUFBSWhCLEtBQUssQ0FBQ08sS0FBS1EsWUFBTCxDQUFrQixDQUFsQixJQUF1QixHQUF4QixJQUErQixHQUEvQixHQUFxQyxDQUFDLENBQTNDLENBQVY7QUFDQSxVQUFNRSxJQUFJakIsS0FBS08sS0FBS1EsWUFBTCxDQUFrQixDQUFsQixJQUF1QixHQUE1QixDQUFWO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGFBQUtSLElBQUwsQ0FBVSxDQUFWLElBQWVOLENBQWY7QUFDQSxhQUFLTSxJQUFMLENBQVUsQ0FBVixJQUFlLElBQUlTLENBQW5CO0FBQ0EsYUFBS1QsSUFBTCxDQUFVLENBQVYsSUFBZVUsQ0FBZjtBQUNBLGFBQUtWLElBQUwsQ0FBVSxDQUFWLElBQWdCQSxLQUFLTyxJQUFMLEtBQWMsT0FBZixHQUEwQixHQUExQixHQUFnQyxHQUEvQztBQUNBO0FBQ0EsYUFBS1IsU0FBTCxDQUFlWSxPQUFmLENBQXVCLFVBQUNDLFFBQUQ7QUFBQSxjQUFjQSxTQUFTLE9BQUtaLElBQWQsQ0FBZDtBQUFBLE9BQXZCO0FBQ0E7QUFDRCxLQXJCRCxNQXFCTztBQUNOO0FBQ0MsWUFBS0QsU0FBTCxDQUFlWSxPQUFmLENBQXVCLFVBQUNDLFFBQUQ7QUFBQSxhQUFjQSxTQUFTLEtBQVQsQ0FBZDtBQUFBLE1BQXZCO0FBQ0Q7QUFDRCxJQTNCRDtBQTRCQTs7OzhCQUVXQSxRLEVBQVU7QUFDckIsUUFBS2IsU0FBTCxDQUFlYyxJQUFmLENBQW9CRCxRQUFwQjtBQUNBOzs7OztBQUdGLHVCQUFlRSxRQUFmLENBQXdCLGNBQXhCLEVBQXdDaEIsSUFBeEMiLCJmaWxlIjoiTGVhcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7QWN0aXZpdHksIHNlcnZpY2VNYW5hZ2VyfSBmcm9tICdzb3VuZHdvcmtzL3NlcnZlcic7XG5pbXBvcnQgbGVhcCBmcm9tICdsZWFwanMnO1xuXG5mdW5jdGlvbiBjbGlwKHgpIHtcbiAgIHJldHVybiBNYXRoLm1pbigxLCBNYXRoLm1heCh4LCAwKSk7XG59XG5cbmNsYXNzIExlYXAgZXh0ZW5kcyBBY3Rpdml0eSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdzZXJ2aWNlOmxlYXAnKTtcblxuXHRcdHRoaXMubGlzdGVuZXJzID0gW107XG5cdFx0dGhpcy5oYW5kID0gW107XG5cdH1cblxuXHRzdGFydCgpIHtcblx0XHRsZWFwLmxvb3Aoe2VuYWJsZUdlc3R1cmVzOiB0cnVlfSwgKGZyYW1lKSA9PiB7XG5cblx0XHRcdGlmIChmcmFtZS5oYW5kcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZnJhbWUuaGFuZHMubGVuZ3RoOyBpKyspIHtcblxuXHRcdFx0XHRcdGNvbnN0IGhhbmQgPSBmcmFtZS5oYW5kc1tpXTtcblxuXHRcdFx0XHRcdGlmIChoYW5kLnR5cGUgIT09ICdyaWdodCcpIGNvbnRpbnVlO1xuXG5cdFx0XHRcdFx0Y29uc3QgeCA9IGNsaXAoKGhhbmQucGFsbVBvc2l0aW9uWzBdICsgMzAwKSAvIDYwMCk7XG5cdFx0XHRcdFx0Y29uc3QgeSA9IGNsaXAoKGhhbmQucGFsbVBvc2l0aW9uWzJdIC0gMzAwKSAvIDYwMCAqIC0xKTtcblx0XHRcdFx0XHRjb25zdCB6ID0gY2xpcChoYW5kLnBhbG1Qb3NpdGlvblsxXSAvIDUwMCk7XG5cdFx0XHRcdFx0Ly8gY29uc3QgaGVpZ2h0ID0gY2xpcChoYW5kLnBhbG1Qb3NpdGlvblsxXSAvIDUwMCk7XG5cdFx0XHRcdFx0Ly8gY29uc3QgZ3JhYiA9IGNsaXAoaGFuZC5ncmFiU3RyZW5ndGgpO1xuXHRcdFx0XHRcdC8vIGNvbnN0IHBpbmNoID0gY2xpcChoYW5kLnBpbmNoU3RyZW5ndGgpO1xuXG5cdFx0XHRcdFx0dGhpcy5oYW5kWzBdID0geDtcblx0XHRcdFx0XHR0aGlzLmhhbmRbMV0gPSAxIC0geTtcblx0XHRcdFx0XHR0aGlzLmhhbmRbMl0gPSB6O1xuXHRcdFx0XHRcdHRoaXMuaGFuZFszXSA9IChoYW5kLnR5cGUgPT09ICdyaWdodCcpID8gJ3InIDogJ2wnO1xuXHRcdFx0XHRcdC8vIHNlbmRcblx0XHRcdFx0XHR0aGlzLmxpc3RlbmVycy5mb3JFYWNoKChjYWxsYmFjaykgPT4gY2FsbGJhY2sodGhpcy5oYW5kKSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIHNlbmRcblx0XHRcdFx0XHR0aGlzLmxpc3RlbmVycy5mb3JFYWNoKChjYWxsYmFjaykgPT4gY2FsbGJhY2soZmFsc2UpKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdGFkZExpc3RlbmVyKGNhbGxiYWNrKSB7XG5cdFx0dGhpcy5saXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG5cdH1cbn1cblxuc2VydmljZU1hbmFnZXIucmVnaXN0ZXIoJ3NlcnZpY2U6bGVhcCcsIExlYXApO1xuIl19