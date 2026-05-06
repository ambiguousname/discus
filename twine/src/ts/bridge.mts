
// https://github.com/godotengine/godot/blob/16bb065ac31b79c0ed24b3b944d3b5275123e854/platform/web/javascript_bridge_singleton.cpp#L210

import { get as getState, set as setState } from "chapbook/src/runtime/state";

export type JSONVariant = Array<JSONVariant> | string | number | boolean | null;
type GodotVariant = string | number | boolean | null;
type GodotEventCallback = (name : String, value : GodotVariant) => void;

export class TwodotBridge {
	#godotEventCallback : GodotEventCallback = () => {};

	#canvas;
	constructor(canvas : HTMLCanvasElement) {
		this.#canvas = canvas;

		// Get our initial state:
		let godotState = getState("godot-state");
		if (typeof godotState == "string") {
			this.sendGodotEvent("load_state", godotState);
		} else if (godotState !== null) {
			console.error("Could not load Godot State, got invalid value: ", godotState);
		}

		window.addEventListener("state-change", (ev) => {
			let detail = ev.detail;
			// If the trail has changed, then we need a snapshot of the current game state.
			if (detail.name === "trail") {
				this.sendGodotEvent("save_state", null);
			}
		});
	}

	registerGodot(godotEventCallback : GodotEventCallback) {
		this.#godotEventCallback = godotEventCallback;
	}

	sendGodotEvent(name : String, value : GodotVariant) {
		this.#godotEventCallback(name, value);
	}

	/**
	 * Sent from Godot to process here and send to twine.
	 * @param name Event name
	 * @param value Event value
	 */
	sendTwineEvent(name : String, value : GodotVariant) {
		if (name === "godotStateUpdate") {
			setState("godot-state", value);
		}
	}
};