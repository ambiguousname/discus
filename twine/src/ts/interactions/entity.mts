import { GodotUpdateEntityValue, JSONVariant } from "../bridge.mjs";
import { twodot } from "../game.mjs";
import { Interactions, InteractionType } from "./index.mjs";

declare global {
	interface Window { 
		Vector3: Function,
		Entity: Function,
	}
}

/** Wrapper for a Godot Entity. */
export class Entity {
	#name : string;
	protected dict : Record<string, JSONVariant> = {};
	constructor(name : string) {
		this.#name = name;
		window.Twodot.sendRecvGodotEvent("get_entity", this.#name).then((v) => {
			if (typeof v === "string") {
				let dict = JSON.parse(v);
				if (typeof dict === "object") {
					this.readGodotEntity(dict);
				} else {
					throw new Error(`Could not parse return value for ${this.#name}: Expected dictionary, got ${v}`);
				}
			} else {
				throw new Error(`Entity ${this.#name} not found: ${v}`);
			}
		});
	}

	protected readGodotEntity(dict : Record<string, JSONVariant>) {
		this.dict = dict;
	}

	/** Name of the node. */
	get name() {
		return this.#name;
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

	set globalPosition(v : Vector3) {
		this.update({
			global_position: v
		}, {});
	}

	get(propName : string) : Promise<JSONVariant> {
		return twodot.sendRecvGodotEvent("get_entity_prop", JSON.stringify({
			entityName: this.#name,
			propName: propName,
		})).then((v) => {
			if (typeof v === "string") {
				return JSON.parse(v);
			} else {
				console.error("Could not parse property: ", v);
				return null;
			}
		});
	}

	set(propName : string, propValue : InteractionType) {
		let props = {};
		props[propName] = propValue;
		this.update(props, {});
	}

	queueFree() {
		twodot.sendGodotEvent("free_entity", this.#name);
	}

	get globalPosition() : Promise<Vector3 | null> {
		return this.get("global_position").then((out) => {
			if (typeof out === "string") {
				return Interactions.JSONVariantToVector3(out);
			}
			return null;
		});
	}

	set globalRotationDeg(v : Vector3) {
		this.update({
			global_rotation_degrees: v
		}, {});
	}
}
window.Entity = Entity;


export class Vector3 {
	x: number = 0;
	y: number = 0;
	z: number = 0;
	constructor(x : number, y : number, z : number) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	add(other : Vector3) : Vector3 {
		return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
	}

	sub(other : Vector3) : Vector3 {
		return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z);
	}

	mul(scalar : number) : Vector3 {
		return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
	}

	mulPairwise(other : Vector3) : Vector3 {
		return new Vector3(this.x * other.x, this.y * other.y, this.z * other.z);
	}

	dot(other : Vector3) : number {
		return this.x * other.x + this.y * other.y + this.z * other.z;
	}
}
window.Vector3 = Vector3;