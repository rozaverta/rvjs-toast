'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Component = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _rvjsDom = require('rvjs-dom');

var _component = require('./component');

var _component2 = _interopRequireDefault(_component);

var _componentDefault = require('./component-default');

var _componentDefault2 = _interopRequireDefault(_componentDefault);

var _rvjsTools = require('rvjs-tools');

var _rvjsTools2 = _interopRequireDefault(_rvjsTools);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Noop = function Noop() {};
var PrivateFire = ["constructor", "open", "update", "close"];

var _init = false;

var NODE_TERM = null,
    NODE_WRAP = null,
    autoID = 0,
    _resizeBackout = Noop,
    calcPrefix = "";

var toasts = [],
    components = {},
    opened = false;

var termTop = 10;
var termDir = "BC";
var prevDir = null;
var centerCalc = false;

function toastFound(id) {
	for (var i = 0, length = toasts.length; i < length; i++) {
		if (toasts[i].id === id) {
			return i;
		}
	}
	return -1;
}

function toastInit() {
	if (!_init && _rvjsTools2.default.isBrowser) {

		var style = document.createElement("div").style,
		    isCalc = function isCalc(pref) {
			try {
				var b = pref + "calc(100% - 1px)";
				style.left = b;

				if (style.left === b) {
					calcPrefix = pref;
					return true;
				}
			} catch (e) {}

			return false;
		};

		centerCalc = isCalc("") || isCalc("-webkit-");

		// create elements

		NODE_TERM = _rvjsDom.Element.create({ name: "div." + getContainerClassName("."), style: { display: "none" }, parent: document.body || document.documentElement });
		NODE_WRAP = _rvjsDom.Element.create({ name: "div.toast-wrap", parent: NODE_TERM });
		Toast.dir = termDir;

		// add stylesheets

		(0, _rvjsDom.StyleSheets)({
			".toast-container": 'position:fixed;left:0;right:0;height:0;z-index:5000',
			".toast-container .toast-wrap,.toast-container .toast": 'position:relative',
			".toast-container .toast": 'padding:10px;background-color:rgba(0,0,0,.92);color:white;display:inline-block',
			".toast-container.dir-top": 'top:0',
			".toast-container.dir-bottom": 'bottom:0',
			".toast-element": 'position:absolute;max-width:' + (centerCalc ? calcPrefix + 'calc(100% - 20px)' : '98%'),
			".toast-container.dir-left .toast-element": 'left:10px',
			".toast-container.dir-right .toast-element": 'right:10px'
		});

		if (!centerCalc) {
			(0, _rvjsDom.StyleSheets)({
				".toast-container.dir-center .toast-element": 'left:50%',
				".toast-container.dir-center .toast": 'left:-50%'
			});
		}

		_init = true;
	}

	return _init;
}

function toastFire(instance, name, args) {
	var fire = instance[name],
	    result = void 0;

	if (typeof fire === "function") try {
		if (arguments.length > 2) {
			result = fire.apply(instance, args);
		} else {
			result = fire.call(instance);
		}
	} catch (e) {
		(0, _rvjsTools.Log)(e);
	}

	return result;
}

function toastOpen(props) {
	// open ...
	if (!toastInit()) {
		throw Error("Document page is not ready");
	}

	var payload = typeof props === 'string' ? { message: props } : Object.assign({}, props),
	    type = "default",
	    defaultProps = void 0;

	if (!payload.type) {
		payload.type = type;
	} else {
		type = payload.type;
	}

	if (components[type]) {
		defaultProps = components[type].defaultProps;
	} else if (type !== "default") {
		throw new Error("Unknown toast type " + type);
	}

	if (!payload.id) {
		payload.id = 'auto-' + ++autoID;
	}

	var id = payload.id,
	    found = toastFound(id),
	    calculate = found < 0,
	    toast = calculate ? { id: id, type: type, close: function close() {
			toastClose(id);
		}
	} : toasts[found];

	if (calculate) {
		toasts.push(toast);

		// create node element
		toast.element = _rvjsDom.Element.create({ name: "div#toast-" + id + '.toast-element.fade', parent: NODE_WRAP });

		if ((typeof defaultProps === 'undefined' ? 'undefined' : _typeof(defaultProps)) === "object" && defaultProps !== null) {
			Object.keys(defaultProps).forEach(function (name) {
				if (payload[name] === undefined) {
					payload[name] = defaultProps[name];
				}
			});
		}
	} else {

		// merge payload data
		payload = Object.assign(toast.payload, payload);

		// move to top
		if (payload.updateStack !== false) {
			toasts.splice(found, 1);
			toasts.push(toast);
		}

		if (toast.type !== "type") {
			toastFire(toast.instance, "close");
			calculate = false;
		}

		// remove old timeout
		if (toast.timeout) {
			clearTimeout(toast.timeout);
			toast.timeout = 0;
			_rvjsDom.ClassName.add(toast.element, "in");
		}
	}

	payload.closable = payload.closable !== false;
	payload.level = (payload.level || 'debug').toLowerCase();
	payload.close = toast.close;

	// create new timeout

	if (payload.timeout !== false) {

		var time = typeof payload.timeout === 'number' ? payload.timeout : 10;

		if (time < 30) {
			time *= 1000;
		} else if (time < 1000) {
			time = 5000;
		}

		toast.timeout = setTimeout(toast.close, time);
	}

	toast.payload = payload;

	if (calculate) {
		toast.instance = components[type] ? new components[type](toast.element, payload) : new _componentDefault2.default(toast.element, payload);
		toastFire(toast.instance, "open");
	} else {
		toastFire(toast.instance, "update", [payload]);
	}

	if (!opened) {
		opened = true;
		NODE_TERM.style.display = 'block';

		_rvjsDom.Evn.resize(updateStack, function (off) {
			_resizeBackout = function resizeBackout() {
				_resizeBackout = Noop;
				off();
			};
		});
	}

	updateStack();

	if (calculate) {
		setTimeout(function () {
			var found = toastFound(id);
			if (~found && toasts[found].element.parentNode) {
				_rvjsDom.ClassName.add(toasts[found].element, "in");
			}
		}, 10);
	}

	return id;
}

function toastClose(id) {
	var found = toastFound(id);
	found > -1 && toastCloseToast(toasts[found]);
}

function toastCloseToast(toast) {
	if (toast.timeout) {
		clearTimeout(toast.timeout);
	}

	_rvjsDom.ClassName.remove(toast.element, "in");

	toast.timeout = setTimeout(function () {

		var found = toastFound(toast.id);
		found > -1 && toasts.splice(found, 1);

		toastFire(toast.instance, "close");

		NODE_WRAP.removeChild(toast.element);

		if (toasts.length < 1) {
			opened = false;
			NODE_TERM.style.display = 'none';
			_resizeBackout();
		} else {
			updateStack();
		}
	}, 300);
}

function updateStack() {
	var val = 0,
	    i = toasts.length - 1,
	    top = termDir[0] === "T",
	    key = top ? "top" : "bottom",
	    cnt = centerCalc && termDir[1] === "C",
	    changeVertical = (prevDir ? prevDir[0] === "T" ? "top" : "bottom" : null) === key ? false : top ? "bottom" : "top",
	    changeHorizontal = centerCalc && prevDir && !cnt && prevDir[1] === "C",
	    element = NODE_WRAP.firstChild,
	    fromValue = void 0,
	    toValue = void 0,
	    width = void 0,
	    height = void 0;

	prevDir = termDir;

	for (; i >= 0; i--) {
		element = toasts[i].element;
		val += termTop;
		fromValue = element.style[key];
		toValue = val + 'px';

		if (fromValue !== toValue) {
			element.style[key] = toValue;
		}

		if (changeVertical) {
			element.style[changeVertical] = "";
		}

		element.style.left = "0px"; // fixed real width
		width = element.offsetWidth;
		height = element.offsetHeight;
		element.style.left = changeHorizontal ? "" : calcPrefix + "calc(50% - " + width / 2 + "px)";

		val += height;
	}
}

function getContainerClassName(del) {
	var classes = ["toast-container"];
	classes.push(~termDir.indexOf("B") ? "dir-bottom" : "dir-top");
	classes.push(~termDir.indexOf("L") ? "dir-left" : ~termDir.indexOf("C") ? "dir-center" : "dir-right");
	return classes.join(del);
}

var ToastItem = function () {
	function ToastItem(id) {
		_classCallCheck(this, ToastItem);

		Object.defineProperty(this, "id", {
			value: id,
			configurable: false,
			writable: false
		});
	}

	_createClass(ToastItem, [{
		key: 'close',
		value: function close() {
			toastClose(this.id);
		}
	}, {
		key: 'fire',
		value: function fire(name) {
			var found = toastFound(this.id);

			for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
				args[_key - 1] = arguments[_key];
			}

			return found > -1 && PrivateFire.indexOf(name) < 0 ? toastFire(toasts[found].instance, name, args) : null;
		}
	}, {
		key: 'update',
		value: function update() {
			var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

			var id = this.id;
			if (this.isOpen) {
				if (typeof props === 'string') {
					props = { message: props };
				}
				props.id = id;
				toastOpen(props);
			}
		}
	}, {
		key: 'isOpen',
		get: function get() {
			return toastFound(this.id) > -1;
		}
	}]);

	return ToastItem;
}();

var Toast = {

	get divider() {
		return termTop;
	},

	set divider(value) {
		if (typeof value === "number" && value >= 0 && value <= 50) {
			termTop = value;
		}
	},

	get dir() {
		return termDir;
	},

	set dir(value) {
		if (_rvjsTools2.default.isBrowser) {
			value = String(value).toUpperCase();
			termDir = (~value.indexOf("B") ? "B" : "T") + ( // vertical Y
			value.indexOf("L") ? "L" : ~value.indexOf("C") ? "C" : "R"); // horizontal X

			if (NODE_TERM) NODE_TERM.className = getContainerClassName(" ");
			_init && updateStack();
		}
	},

	get isOpened() {
		return opened && toasts.length > 0;
	},

	register: function register(name, component) {
		if (_component2.default.isPrototypeOf(component)) {
			components[name] = component;
		} else {
			(0, _rvjsTools.Log)(new Error("The component must be inherited from the Toast/Component system element"));
		}
		return this;
	},
	loaded: function loaded(name) {
		return components.hasOwnProperty(name);
	},
	closeToast: function closeToast(id) {
		arguments.length > 0 && toastClose(id);
		return Toast;
	},
	close: function close() {
		toasts.forEach(function (toast) {
			return toastCloseToast(toast);
		});
		return Toast;
	},


	updateStack: updateStack,

	open: function open() {
		var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		return new ToastItem(toastOpen(props));
	}
};

exports.Component = _component2.default;
exports.default = Toast;