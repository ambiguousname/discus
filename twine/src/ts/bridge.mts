import {setLookup} from 'chapbook/src/runtime/state';
import { add as addModifier } from 'chapbook/src/runtime/template/modifiers';
import { add as addInsert } from 'chapbook/src/runtime/template/inserts';

// https://github.com/godotengine/godot/blob/16bb065ac31b79c0ed24b3b944d3b5275123e854/platform/web/javascript_bridge_singleton.cpp#L210
type GodotVariant = string | number | boolean | null;
type GodotEventCallback = (name : String, value : GodotVariant) => void;

export class TwodotBridge {
	#godotEventCallback : GodotEventCallback = () => {};

	#canvas;
	constructor(canvas : HTMLCanvasElement) {
		this.#canvas = canvas;
		addModifier({
			match: /event.*/,
			process: (output, options) => {
				console.log(output, options);
				return output;
			}
		});
		addModifier({
			match: /progress/,
			process: (output, options) => {
				let original = output.text;
				if (!this.#finished) {
					let id = `godot-percent-${this.#onFinish.length}`;
					output.text = `<div id="${id}">Loading... <span class="godot-percentage">0%</span></div>`;
					this.#addOnFinish(() => {
						let element = document.getElementById(id);
						if (element !== null) {
							element.innerHTML = original;
						}
					});
				}
			}
		});
	}

	#percentage : number = 0;
	#finished : boolean = false;
	godotProgress(current : number, total : number) {
		this.#percentage = current/total;
		// Gate until Godot says we're ready:
		if (this.#percentage === 1) {
			this.#percentage = 0.9999;
		}
		for (var element of document.getElementsByClassName("godot-percentage")) {
			element.innerHTML = `${Math.floor(this.#percentage * 10000)/100}%`;
		}
	}

	#onFinish : Array<Function> = [];
	#addOnFinish(cb: () => void) {
		this.#onFinish.push(cb);
	}

	finishProgress() {
		this.#percentage = 1;
		for (var element of document.getElementsByClassName("godot-percentage")) {
			element.innerHTML = `100%`;
		}
		this.#finished = true;
		for (let cb of this.#onFinish) {
			cb();
		}
		this.#onFinish = [];
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
	sendTwineEvent(name : String, value : GodotVariant) {}
};