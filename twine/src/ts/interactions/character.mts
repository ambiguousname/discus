import { JSONVariant } from "../bridge.mjs";
import { Entity } from "./entity.mjs";

declare global {
	interface Window { 
		Character: Function,
	}
}

export class Character extends Entity {
	protected override readGodotEntity(dict: Record<string, JSONVariant>): void {
		let entityClass = dict["entityClass"];
		// Currently doesn't allow for subclasses, but we can create a subclass in Typescript which allows for more specificity:
		if (entityClass !== "Character") {
			throw new Error(`Tried to create Character entity from ${entityClass} class.`);
		}
	}

	/** Name of the current entity as set by Twine. */
	get characterName() : Promise<string| null> {
		return this.get("character_name").then((v) => {
			if (typeof v === "string") {
				return v;
			} else {
				return null;
			}
		});
	}

	set characterName(name : string) {
		this.set("character_name", name);
	}
}

window.Character = Character;