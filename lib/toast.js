
import { Evn, ClassName, Element, StyleSheets } from "rvjs-dom";
import Component from './component';
import ComponentDefault from './component-default';
import Tools, {Log} from "rvjs-tools";

const Noop = () => {};
const PrivateFire = ["constructor", "open", "update", "close"];

let _init = false;

let NODE_TERM = null, NODE_WRAP = null, autoID = 0, resizeBackout = Noop, calcPrefix = "";

let toasts = [],
	components = {},
	opened = false;

let termTop = 10;
let termDir = "TR";
let prevDir = null;
let centerCalc = false;

function toastFound(id)
{
	for( let i = 0, length = toasts.length; i < length; i++ ) {
		if( toasts[i].id === id ) {
			return i
		}
	}
	return -1
}

function toastInit()
{
	if( !_init && Tools.isBrowser ) {

		let style = document.createElement("div").style,
			isCalc = pref => {
				try {
					let b = pref + "calc(100% - 1px)";
					style.left = b;

					if( style.left === b ) {
						calcPrefix = pref;
						return true
					}
				}
				catch(e) {}

				return false
			};

		centerCalc = isCalc("") || isCalc("-webkit-");

		// create elements

		NODE_TERM = Element.create({name: "div.toast-container", style: {display: "none"}, parent: (document.body || document.documentElement)});
		NODE_WRAP = Element.create({name: "div.toast-wrap", parent: NODE_TERM});
		Toast.dir = termDir;

		// add stylesheets

		StyleSheets({
			".toast-container": 'position:fixed;left:0;right:0;height:0',
			".toast-container .toast-wrap,.toast-container .toast": 'position:relative',
			".toast-container .toast": 'padding:10px;background-color:rgba(0,0,0,.92);color:white',
			".toast-container.dir-top": 'top:0',
			".toast-container.dir-bottom": 'bottom:0',
			".toast-element": 'position:absolute;max-width:' + (centerCalc ? (calcPrefix + 'calc(100% - 20px)') : '98%'),
			".toast-container.dir-left .toast-element": 'left:10px',
			".toast-container.dir-right .toast-element": 'right:10px',
		});

		if( !centerCalc ) {
			StyleSheets({
				".toast-container.dir-center .toast-element": 'left:50%',
				".toast-container.dir-center .toast": 'left:-50%',
			})
		}

		_init = true;
	}

	return _init
}

function toastFire(instance, name, args)
{
	let fire = instance[name],
		result = void 0;

	if(typeof fire === "function")
		try {
			if(arguments.length > 2) {
				result = fire.apply(instance, args)
			}
			else {
				result = fire.call(instance)
			}
		}
		catch(e) {Log(e)}

	return result
}

function toastOpen(props)
{
	// open ...
	if( !toastInit() ) {
		throw Error("Document page is not ready")
	}

	let payload = typeof props === 'string' ? {message: props} : Object.assign({}, props),
		type = "default",
		defaultProps;

	if(!payload.type) {
		payload.type = type
	}
	else {
		type = payload.type
	}

	if(components[type]) {
		defaultProps = components[type].defaultProps
	}
	else if(type !== "default") {
		throw new Error("Unknown toast type " + type)
	}

	if( !payload.id ) {
		payload.id = ('auto-' + (++autoID));
	}

	let id = payload.id,
		found = toastFound(id),
		calculate = found < 0,
		toast = calculate ? {id, type, close() { toastClose(id) }} : toasts[found];

	if(calculate) {
		toasts.push(toast);

		// create node element
		toast.element = Element.create({ name: "div#toast-" + id + '.toast-element.fade', parent: NODE_WRAP});

		if(typeof defaultProps === "object" && defaultProps !== null) {
			Object.keys(defaultProps).forEach(name => {
				if(payload[name] === undefined) {
					payload[name] = defaultProps[name]
				}
			})
		}
	}
	else {

		// merge payload data
		payload = Object.assign(toast.payload, payload);

		// move to top
		if(payload.updateStack !== false) {
			toasts.splice(found, 1);
			toasts.push(toast);
		}

		if(toast.type !== "type") {
			toastFire(toast.instance, "close");
			calculate = false
		}

		// remove old timeout
		if(toast.timeout) {
			clearTimeout(toast.timeout);
			toast.timeout = 0;
			ClassName.add( toast.element, "in" )
		}
	}

	payload.closable = payload.closable !== false;
	payload.level = (payload.level || 'debug').toLowerCase();
	payload.close = toast.close;

	// create new timeout

	if( payload.timeout !== false ) {

		let time = typeof payload.timeout === 'number' ? payload.timeout : 10;

		if( time < 30 ) {
			time *= 1000;
		}
		else if( time < 1000 ) {
			time = 5000;
		}

		toast.timeout = setTimeout(toast.close, time);
	}

	toast.payload = payload;

	if( calculate ) {
		toast.instance = components[type] ? new components[type](toast.element, payload) : new ComponentDefault(toast.element, payload);
		toastFire(toast.instance, "open")
	}
	else {
		toastFire(toast.instance, "update", [payload])
	}

	if( !opened ) {
		opened = true;
		NODE_TERM.style.display = 'block';

		Evn.resize(updateStack, off => {
			resizeBackout = () => {
				resizeBackout = Noop;
				off()
			}
		})
	}

	updateStack();

	if( calculate ) {
		setTimeout(() => {
				let found = toastFound(id);
				if( ~found && toasts[found].element.parentNode) {
					ClassName.add(toasts[found].element, "in")
				}
			}, 10);
	}

	return id
}

function toastClose( id )
{
	let found = toastFound(id);
	found > -1 && toastCloseToast(toasts[found])
}

function toastCloseToast(toast)
{
	if( toast.timeout ) {
		clearTimeout(toast.timeout)
	}

	ClassName.remove(toast.element, "in");

	toast.timeout = setTimeout(() => {

		let found = toastFound(toast.id);
		found > -1 && toasts.splice(found, 1);

		toastFire(toast.instance, "close");

		NODE_WRAP.removeChild(toast.element);

		if( toasts.length < 1 ) {
			opened = false;
			NODE_TERM.style.display = 'none';
			resizeBackout()
		}
		else {
			updateStack()
		}

	}, 300);
}

function updateStack()
{
	let val = 0,
		i = toasts.length - 1,
		top = termDir[0] === "T",
		key = top ? "top" : "bottom",
		cnt = centerCalc && termDir[1] === "C",
		changeVertical = (prevDir ? (prevDir[0] === "T" ? "top" : "bottom") : null) === key ? false : (top ? "bottom" : "top"),
		changeHorizontal = centerCalc && prevDir && !cnt && prevDir[1] === "C",
		element = NODE_WRAP.firstChild,
		fromValue, toValue;

	prevDir = termDir;

	for(; i >= 0; i --)
	{
		element = toasts[i].element;
		val += termTop;
		fromValue = element.style[key];
		toValue = val + 'px';

		if( fromValue !== toValue ) {
			element.style[key] = toValue
		}

		if( changeVertical ) {
			element.style[changeVertical] = "";
		}

		if( changeHorizontal ) {
			element.style.left = ""
		}
		else if( cnt ) {
			element.style.left = calcPrefix + "calc(50% - " + element.offsetWidth/2 + "px)"
		}

		val += element.offsetHeight;
	}
}

class ToastItem
{
	constructor(id)
	{
		Object.defineProperty(this, "id", {
			value: id,
			configurable: false,
			writable: false
		})
	}

	get isOpen()
	{
		return toastFound(this.id) > -1
	}

	close()
	{
		toastClose(this.id)
	}

	fire(name, ...args)
	{
		let found = toastFound(this.id);
		return found > -1 && PrivateFire.indexOf(name) < 0 ? toastFire(toasts[found].instance, name, args) : null
	}

	update(props = {})
	{
		let id = this.id;
		if( this.isOpen ) {
			if( typeof props === 'string' ) {
				props = {message: props}
			}
			props.id = id;
			toastOpen(props)
		}
	}
}

const Toast = {

	get divider()
	{
		return termTop
	},

	set divider(value)
	{
		if( typeof value === "number" && value >= 0 && value <= 50 ) {
			termTop = value
		}
	},

	get dir()
	{
		return termDir
	},

	set dir(value)
	{
		if( Tools.isBrowser ) {
			let newVal = "", className = "toast-container";
			value = String(value).toUpperCase();

			// bottom
			if( ~ value.indexOf("B") ) {
				newVal += 'B';
				className += " dir-bottom"
			}
			else {
				newVal += 'T';
				className += " dir-top"
			}

			if( ~ value.indexOf("L") ) {
				newVal += 'L';
				className += " dir-left"
			}
			else if( ~ value.indexOf("C") ) {
				newVal += 'C';
				className += " dir-center"
			}
			else {
				newVal += 'R';
				className += " dir-right"
			}

			termDir = newVal;
			if( NODE_TERM ) NODE_TERM.className = className;
			_init && updateStack();
		}
	},

	get isOpened()
	{
		return opened && toasts.length > 0
	},

	register(name, component)
	{
		if( component instanceof Component ) {
			components[name] = component
		}
		else {
			Log(new Error("The component must be inherited from the Toast/Component system element"))
		}
		return this
	},

	loaded(name)
	{
		return components.hasOwnProperty(name)
	},

	closeToast(id)
	{
		arguments.length > 0 && toastClose(id);
		return Toast
	},

	close()
	{
		toasts.forEach(toast => toastCloseToast(toast));
		return Toast
	},

	updateStack,

	open(props = {})
	{
		return new ToastItem( toastOpen(props) )
	}
};

export {Component};

export default Toast;
