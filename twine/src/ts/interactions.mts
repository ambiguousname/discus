import { add as addInsert } from 'chapbook/src/runtime/template/inserts';
import { htmlify } from 'chapbook/src/runtime/util';
import { twodot } from './game.mjs';
import { JSONVariant } from './bridge.mjs';
import { PassageLink } from 'chapbook/src/runtime/template/custom-elements/passage-link';
import { warn } from 'chapbook/src/runtime/logger';
import { DrawError, DrawErrorType } from './draw.mjs';

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

export class SubmitPassageLink extends PassageLink {
	constructor() {
		super();
		this.addEventListener("click", async (ev) => {
			let promise : Promise<SVGElement> | DrawError = new Function(this.getAttribute("validate") ?? "")();
			let svg : SVGElement;
			if (promise instanceof DrawError) {
				ev.preventDefault();
				ev.stopPropagation();
				document.getElementById("draw-error")?.remove();
				let errorText = document.createElement("div");

				let errorMsg : string;
				switch (promise.type) {
					case DrawErrorType.EMPTY:
						errorMsg = "Creation flows from substance. You cannot create from nothing!";
						break;
					default:
						errorMsg = "I cannot determine the source of your problems. Please contact the creator of your reality at your soonest convenience.";
						break;
				}
				errorText.innerHTML = `<p>You hear your grandfather's words in your mind: "${errorMsg}"</p> <p>Surprised by his sudden outburst, you take a minute to compose yourself.</p>`;
				errorText.id = "draw-error";
				if (this.parentNode !== null) {
					this.parentNode.insertBefore(errorText, this);
				}
				return;
			} else {
				svg = await promise;
			}
			for (let child of svg.getElementsByClassName("js-draw-image-background")) {
				child.remove();
			}
			
			let serializer = new XMLSerializer();
			let str = serializer.serializeToString(svg);
			twodot.sendGodotEvent("create-entity", JSON.stringify({
				img: str,
				type: "image/svg+xml",
				name: this.getAttribute("name"),
			}));
		}, {
			capture: true
		});
	}
}
window.customElements.define('submit-passage-link', SubmitPassageLink);

addInsert({
	match: /finish_draw/i,
	render(target, options) {
		if (target === null) {
			return;
		}
		
		let label = options["label"];
		let id = options["id"];
		if (id === undefined) { 
			console.error("ID for entity-draw is not defined.");
		}

		return htmlify('submit-passage-link', {
			class: 'link',
			validate: `return document.getElementById("${id}").finish();`,
			name: options["name"],
			to: target
		}, [ label ?? target ]);
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

type InteractionType = Vector3 | Array<InteractionType> | string | number | null;

class Interactions {
	#activeFocus : InteractionType = null;
	#interactionStringToVariant(i : InteractionType) : JSONVariant | null {
		if (typeof i == "string") {
			return i;
		} else if (typeof i == "number") {
			return i;
		} else if (i instanceof Vector3) {
			return [i.x, i.y, i.z];
		} else if (i instanceof Array) {
			return i.map((inner) => {
				return this.#interactionStringToVariant(inner);
			}, this);
		} else {
			return null;
		}
	}

	static insertStringToInteractionString(i : any) : string {
		if (typeof i == 'string') {
			return `'${i}'`;
		} else if (i instanceof Array) {
			return `[${i}]`;
		} {
			return `${i}`;
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
