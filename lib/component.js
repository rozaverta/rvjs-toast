import {Log} from "rvjs-tools";

export default class Component
{
	constructor(htmlElement, props)
	{
		let self = this;

		Object.defineProperty(self, 'element', {
			get() {
				return htmlElement
			}
		});

		self.props = props;
	}

	open()
	{
		Log(new Error("open function must be overloaded"))
	}

	update(props)
	{
		Object.assign(this.props, props);
		this.open()
	}

	close() {
		let element = this.element || {};
		while(element.firstChild) {
			element.removeChild(element.firstChild)
		}
	}
}