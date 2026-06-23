import { Entity, Vector3 } from './entity.mjs';
import "./character.mjs";
import "./form.mjs";

import { add as addInsert } from 'chapbook/src/runtime/template/inserts';
import { add as addModifier } from 'chapbook/src/runtime/template/modifiers';
import { htmlify } from 'chapbook/src/runtime/util';
import { twodot } from '../game.mjs';
import { JSONVariant } from '../bridge.mjs';
import { Character } from './character.mjs';

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

export type InteractionType = Vector3 | Array<InteractionType> | string | number | Entity | null;

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
		} else if (i instanceof Entity) {
			return `e:${i.name}`;
		} else {
			return null;
		}
	}

	static JSONVariantToVector3(j : JSONVariant) : Vector3 | null {
		if (typeof j == "string" && j[0] === "(" && j[j.length - 1] === ")") {
			let splits = j.substring(1, j.length - 1).split(",");
			if (splits.length === 3) {
				return new Vector3(parseFloat(splits[0]), parseFloat(splits[1]), parseFloat(splits[2]));
			} else {
				console.error("Expected length 3, got: ", splits);
				return null;
			}
		} else {
			console.error("Could not convert to Vector3: ", j);
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

	static populateActorFromEntity(entityName : string) {
		
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

	/** Given a {@link SVGElement} from {@link EntityDraw}, process and save to Godot's file system. */
	async saveSVG(imgName : string, svg : SVGElement) : Promise<string> {
		for (let child of svg.getElementsByClassName("js-draw-image-background")) {
			child.remove();
		}
		
		let serializer = new XMLSerializer();
		let str = serializer.serializeToString(svg);
		let result = await twodot.sendRecvGodotEvent("save_drawing", JSON.stringify({
			img: str,
			type: "image/svg+xml",
			name: imgName,
		}));
		if (typeof result === "string") {
			return result;
		} else {
			throw new Error(`Unable to save SVG: ${result}`);
		}
	}

	// TODO: Scale based on SVG dimensions.
	async createCustomCharacter(entityName: string, imagePath: string, textureScale : number = 2.5, spriteScale : number = 0.2) : Promise<Character> {
		let texturePath = `user://${entityName}_character_texture.tres`;
		twodot.sendGodotEvent("create_texture", JSON.stringify({
			img: imagePath,
			type: "image/svg+xml",
			texturePath: texturePath,
			scale: textureScale,
		}));
		let c = await this.createCharacter(entityName, texturePath);
		c.set("texture_scale", spriteScale);
		return c;
	}

	async createCharacter(entityName: string, texturePath: string) : Promise<Character> {
		return twodot.sendRecvGodotEvent("create_entity", JSON.stringify({
			texturePath: texturePath,
			entityName: entityName,
			entityType: "character"
		})).then((v) => { return new Character(entityName); });
	}
}

addModifier({
	match: /OnSubmit/i,
	processRaw(output, options) {
		let text = output.text;


		output.text = "";
	},
});