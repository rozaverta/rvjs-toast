import Component from "./component";

export default class ComponentDefault extends Component
{
	open()
	{
		let self = this,
			props = self.props;

		self.element.innerHTML = '<div class="toast-item__body level-' + props.level + '">' + props.message + '</div>';
	}
}