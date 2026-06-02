
// https://github.com/godotengine/godot/blob/16bb065ac31b79c0ed24b3b944d3b5275123e854/platform/web/javascript_bridge_singleton.cpp#L210

import { get as getState, set as setState } from "chapbook/src/runtime/state";

export type JSONVariant = Array<JSONVariant> | string | number | boolean | null;
type GodotVariant = string | number | boolean | null;
type GodotEventCallback = (name : String, value : GodotVariant) => void;
type GodotEventResponseCallback = (name : String, response_id: number, value : GodotVariant) => void;

export interface GodotUpdateEntityValue {
	entityName : string,
	/**
	 * Key: Property to update
	 * Value: Value to set the property to.
	 */
	props? : Record<string, JSONVariant>,
	/**
	 * Key: Function to call.
	 * Value: Array of arguments to be passed into the function.
	 */
	funcs? : Record<string, Array<JSONVariant>>
};

type GodotMessageResolver = (v : GodotVariant) => void;

export class TwodotBridge {
	#godotEventCallback : GodotEventCallback = () => {};
	#responseCallback : GodotEventResponseCallback = () => {};

	#justSaved = false;

	#promises : Map<number, GodotMessageResolver> = new Map();
	constructor() {
		// TODO: Check only on click through to a new passage, rather than trail update.
		// Otherwise this gets more hacky.

		window.addEventListener("passage-navigate", (ev) => {
			// To avoid Godot loading our state after we just set it:
			this.#justSaved = true;
			this.sendRecvGodotEvent("save_state", null).then((v) => {
				setState("godot-state", v);
			});
		})

		window.addEventListener("state-change", (ev) => {
			let detail = ev.detail;
			if (detail.name === "godot-state") {
				if (this.#justSaved) {
					this.#justSaved = false;
				} else {
					this.loadGodotState();
				}
			}
		});
	}

	registerGodot(godotEventCallback : GodotEventCallback, responseCallback : GodotEventResponseCallback) {
		this.#godotEventCallback = godotEventCallback;
		this.#responseCallback = responseCallback;
	}

	sendGodotEvent(name : String, value : GodotVariant) {
		this.#godotEventCallback(name, value);
	}
	
	sendRecvGodotEvent(name : String, value : GodotVariant) : Promise<GodotVariant> {
		let id = this.#promises.size;
		let promise : Promise<GodotVariant> = new Promise((resolve, reject) => {
			resolve = resolve;
			this.#promises.set(id, resolve);
		});

		this.#responseCallback(name, id, value);
		return promise;
	}

	loadGodotState() {
		// Get our initial state:
		let godotState = getState("godot-state");
		if (typeof godotState == "string") {
			this.sendGodotEvent("load_state", godotState);
		} else if (godotState !== null && godotState !== undefined) {
			console.error("Could not load Godot State, got invalid value: ", godotState);
		}
	}

	/**
	 * Sent from Godot to process here and send to twine.
	 * @param name Event name
	 * @param value Event value
	 */
	sendTwineEvent(name : String, value : GodotVariant) {
	}

	godotReply(to : number, value : GodotVariant) {
		let val : GodotMessageResolver | undefined = this.#promises.get(to);
		if (val !== undefined) {
			val(value);
			this.#promises.delete(to);
		}
	}
};