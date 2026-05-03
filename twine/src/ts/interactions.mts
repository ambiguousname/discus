import { add as addInsert } from 'chapbook/src/runtime/template/inserts';
import { htmlify } from 'chapbook/src/runtime/util';
import { twodot } from './game.mjs';
import { JSONVariant } from './bridge.mjs';

addInsert({
	match: /glink/i,
	render(target, options) {
		if (target === null) {
			return;
		}

		let interaction = {
			onover: "",
			onclick: "",
			onout: ""
		};

		if ("lookAt" in options) {
			let lookAt = Interactions.insertStringToInteractionString(options["lookAt"]);
			interaction.onclick = `Interactions.cameraFocus(${lookAt}, true);`;

			if ((options["clickLook"] ?? false) === false) {
				interaction.onover += `Interactions.cameraFocus(${lookAt}, false);`;
				interaction.onout += `Interactions.resetCameraFocus();`;
			}
		}
		let label = options["label"];

		if ("moveTo" in options) {
			let moveTo = Interactions.insertStringToInteractionString(options["moveTo"]);
			interaction.onclick += `Interactions.moveTo(${moveTo});`;
		}

		return htmlify('passage-link', {
			class: 'link',
			onfocus: interaction.onover,
			onpointerover: interaction.onover,
			onclick: interaction.onclick,
			onfocusout: interaction.onout,
			onpointerout: interaction.onout,
			to: target
		}, [
			label ?? target
		]);
	}
});

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

type InteractionType = Vector3 | string | null;

class Interactions {
	#activeFocus : InteractionType = null;
	#interactionStringToVariant(i : InteractionType) : JSONVariant | null {
		if (i instanceof Vector3) {
			return [i.x, i.y, i.z];
		} else if (typeof i == "string") {
			return i;
		} else {
			return null;
		}
	}

	static insertStringToInteractionString(i : any) : string {
		if (typeof i == 'string') {
			return `'${i}'`;
		} else {
			return i;
		}
	}

	cameraFocus(target : InteractionType, permanent : boolean) {
		let lookAt : JSONVariant = this.#interactionStringToVariant(target);

		if (permanent) {
			this.#activeFocus = target;
		}

		twodot.sendGodotEvent("entity_update", JSON.stringify({
			"entityName": "Player",
			"funcs": {
				"set_look_at": [lookAt]
			}
		}));
	}
	resetCameraFocus() {
		this.cameraFocus(this.#activeFocus, true);
	}
	
	moveTo(target : InteractionType) {
		let moveTo : JSONVariant = this.#interactionStringToVariant(target);

		twodot.sendGodotEvent("entity_update", JSON.stringify({
			"entityName": "Player",
			"funcs": {
				"set_move_target": [moveTo]
			}
		}));
	}
}

window["Interactions"] = new Interactions();
