import { add as addInsert } from 'chapbook/src/runtime/template/inserts';
import { renderLink } from 'chapbook/src/runtime/template/links';

addInsert({
	match: /glink/i,
	render(target, {label}) {
		if (target === null) {
			return;
		}
		return renderLink(target, label);
	}
})