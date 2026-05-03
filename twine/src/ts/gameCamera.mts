import { add as addInsert } from 'chapbook/src/runtime/template/inserts';
import { htmlify } from 'chapbook/src/runtime/util';
import { twodot } from './game.mjs';

/** Link insert for Godot magic. */
interface GLink {
	label : string | null,
	/** Something for the camera to temporarily focus on */
	lookAt : string | null
}
addInsert({
	match: /glink/i,
	render(target, {label, lookAt}) {
		if (target === null) {
			return;
		}

		let lookAtObj = {};
		if (lookAt !== null) {
			lookAtObj = {
				onfocus: `cameraFocus('${lookAt}', false)`,
				onpointerover: `cameraFocus('${lookAt}', false)`,
				onclick: `cameraFocus('${lookAt}', true)`,
				onfocusout: `resetCameraFocus()`,
				onpointerout: `resetCameraFocus()`,
			};
		}
		
		return htmlify('passage-link', {
			class: 'link',
			...lookAtObj,
			to: target
		}, [
			label ?? target
		]);
	}
})

class Vector3 {
	x: number = 0;
	y: number = 0;
	z: number = 0;
	constructor(x : number, y : number, z : number) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
}

type Focusable = Vector3 | String | null;
let activeFocus : Focusable = new Vector3(0, 0, -100);

function cameraFocus(target : Focusable, permanent : boolean) {
	let lookAt : String | Array<number> | null = null;
	if (target instanceof Vector3) {
		lookAt = [target.x, target.y, target.z];
	} else if (typeof target === 'string')  {
		lookAt = target;
	}

	if (permanent) {
		activeFocus = target;
	}

	twodot.sendGodotEvent("entity_update", JSON.stringify({
		"entityName": "Player",
		"funcs": {
			"set_look_at": [lookAt]
		}
	}));
}
window["cameraFocus"] = cameraFocus;

window["resetCameraFocus"] = () => {
	cameraFocus(activeFocus, false);
}