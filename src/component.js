"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rvjsTools = require("rvjs-tools");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Component = function () {
	function Component(htmlElement, props) {
		_classCallCheck(this, Component);

		var self = this;

		Object.defineProperty(self, 'element', {
			get: function get() {
				return htmlElement;
			}
		});

		self.props = props;
	}

	_createClass(Component, [{
		key: "open",
		value: function open() {
			(0, _rvjsTools.Log)(new Error("open function must be overloaded"));
		}
	}, {
		key: "update",
		value: function update(props) {
			Object.assign(this.props, props);
			this.open();
		}
	}, {
		key: "close",
		value: function close() {
			var element = this.element || {};
			while (element.firstChild) {
				element.removeChild(element.firstChild);
			}
		}
	}]);

	return Component;
}();

exports.default = Component;