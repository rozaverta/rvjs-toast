import Component from "./component";

export default class ComponentDefault extends Component
{
	open()
	{
		let self = this,
			props = self.props;

		self.element.innerHTML = '<div class="toast level-' + props.level + '"><div class="toast-box"><div class="text">' + props.message + '</div></div></div>';
	}
}