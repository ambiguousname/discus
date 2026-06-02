import { add as addInsert } from 'chapbook/src/runtime/template/inserts';
import { htmlify } from 'chapbook/src/runtime/util';
import { twodot } from './game.mjs';
import { GodotUpdateEntityValue, JSONVariant } from './bridge.mjs';
import { PassageLink } from 'chapbook/src/runtime/template/custom-elements/passage-link';
import { warn } from 'chapbook/src/runtime/logger';
import { DrawError, DrawErrorType, EntityDraw } from './draw.mjs';

declare global {
	interface Window { 
		Vector3: Function,
		Entity: Function,
	}
}

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
	#parent : HTMLFormElement;
	constructor() {
		super();
		if (this.parentElement instanceof HTMLFormElement) {
			this.#parent = this.parentElement;
		} else {
			throw Error("Could not find <form> parent.");
		}
		this.addEventListener("click", this.submitPassageForm.bind(this), {
			capture: true
		});
	}

	async submitPassageForm(ev : Event) {
		document.getElementById("draw-error")?.remove();

		let inputs : Record<string, any> = {};

		for (let child of this.#parent.children) {
			if (child === this) {
				continue;
			}
			try {
				if (child instanceof EntityDraw) {
					if (child.hasAttribute("required")) {
						child.checkValidation();
					}
					let name = child.getAttribute("name");
					if (name !== null){
						inputs[name] = child;
					}
				}
				if (child instanceof HTMLInputElement) {
					if (child.required && child.value === "") {
						throw new Error("You did not fill in all the required information, young child.");
					}
					inputs[child.name] = child;
				}
			} catch (err) {
				ev.preventDefault();
				ev.stopPropagation();
				let errorMsg : string = "Undefined error.";
				if (err instanceof DrawError) {
					switch (err.type) {
						case DrawErrorType.EMPTY:
							errorMsg = "Creation flows from substance. You cannot create from nothing!";
							break;
						default:
							errorMsg = "I cannot determine the source of your problems. Please contact the creator of your reality at your soonest convenience.";
							break;
					}
				} else if (err instanceof Error) {
					errorMsg = err.message;
				}
				let errorText = document.createElement("div");

				errorText.innerHTML = `<p>You hear your grandfather's words in your mind: "${errorMsg}"</p> <p>Surprised by his sudden outburst, you take a minute to compose yourself.</p>`;
				errorText.id = "draw-error";

				this.#parent.insertBefore(errorText, this);
			}
		}

		for (let inputName in inputs) {
			let input = inputs[inputName];
			if (input instanceof EntityDraw) {
				input.finish().then((svg) => {
					for (let child of svg.getElementsByClassName("js-draw-image-background")) {
						child.remove();
					}
					
					let serializer = new XMLSerializer();
					let str = serializer.serializeToString(svg);
					twodot.sendGodotEvent("save_drawing", JSON.stringify({
						img: str,
						type: "image/svg+xml",
						name: inputName,
					}));
				});
			} else if (input instanceof HTMLInputElement) {
				let props = {};
				let propName = input.getAttribute("godot-prop-name");
				if (propName === null) {
					console.error(`Property name for ${inputName} is null.`);
				} else {
					let entity = new Entity(inputName);
					switch (input.type) {
						case "checkbox":
							props[propName] = input.checked;
							break;
						case "number":
							props[propName] = parseFloat(input.value);
						default:
							props[propName] = input.value;
							break;
					}
					entity.update(props, {});
				}
			}
		}
	}
}
window.customElements.define('submit-passage-link', SubmitPassageLink);

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
window.Vector3 = Vector3;

type InteractionType = Vector3 | Array<InteractionType> | string | number | null;

/** Wrapper for a Godot Entity. */
class Entity {
	#name : string;
	#id : number= -1;
	constructor(name : string) {
		this.#name = name;
		window.Twodot.sendRecvGodotEvent("get_entity", this.#name).then((v) => {
			if (typeof v == "number" && v >= 0) {
				this.#id = v;
			} else {
				throw new Error(`Entity ${this.#name} not found: ${v}`);
			}
		});
	}

	update(properties : Record<string, InteractionType>, functions : Record<string, InteractionType[]>) {
		let props = {};
		let funcs = {};
		for (let prop in properties) {
			props[prop] = Interactions.interactionStringToVariant(properties[prop]);
		}
		for (let f in functions) {
			funcs[f] = functions[f].map((v) => {
				return Interactions.interactionStringToVariant(v);
			});
		}
		
		let v : GodotUpdateEntityValue = {
			entityName: this.#name,
			props: props,
			funcs: funcs
		};
		twodot.sendGodotEvent("entity_update", JSON.stringify(v));
	}

	async getState() : Promise<any> {
		let state = await twodot.sendRecvGodotEvent("get_entity_state", this.#name);
		if (typeof state === "string") {
			return JSON.parse(state);
		} else {
			return "<unknown>";
		}
	}

	globalTranslate(v : Vector3) {
		this.update({}, {
			global_translate: [v]
		});
	}

	set globalRotationDeg(v : Vector3) {
		this.update({
			global_rotation_degrees: v
		}, {});
	}
}
window.Entity = Entity;

export class Interactions {
	#activeFocus : InteractionType = null;
	player : Entity | null = new Entity("Player");

	static interactionStringToVariant(i : InteractionType) : JSONVariant | null {
		if (typeof i == "string") {
			return i;
		} else if (typeof i == "number") {
			return i;
		} else if (i instanceof Vector3) {
			return [i.x, i.y, i.z];
		} else if (i instanceof Array) {
			return i.map((inner) => {
				return Interactions.interactionStringToVariant(inner);
			});
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
		if (permanent) {
			this.#activeFocus = target;
		}
		this.player?.update({}, {
			set_look_at: [target]
		})
	}
	resetCameraFocus() {
		this.cameraFocus(this.#activeFocus, true);
	}
	
	moveTo(target : InteractionType) {
		this.player?.update({}, {
			set_move_target: [target]
		});
	}

	createEntity(entityName: string, texturePath: string) {
		twodot.sendGodotEvent("create_entity", JSON.stringify({
			texturePath: texturePath,
			entityName: entityName
		}));
	}
}
