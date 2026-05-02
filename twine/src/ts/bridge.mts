import {setLookup} from 'chapbook/src/runtime/state';
import { add as addModifier } from 'chapbook/src/runtime/template/modifiers';

type GodotVariant = String | number | null;
type GodotEventCallback = (name : String, value : GodotVariant) => void;

export class TwodotBridge {
	#godotEventCallback : GodotEventCallback = () => {};
	constructor() {
		addModifier({
			match: /event.*/,
			process: (output, options) => {
				console.log(output, options);
				return output;
			}
		});
	}

	registerGodot(godotEventCallback : GodotEventCallback) {
		this.#godotEventCallback = godotEventCallback;
	}

	sendGodotEvent(name : String, value : GodotVariant) {
		this.#godotEventCallback(name, value);
	}

	sendTwineEvent(name : String, value : GodotVariant) {
		
	}
};