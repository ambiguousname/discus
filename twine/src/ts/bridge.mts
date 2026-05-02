
// https://github.com/godotengine/godot/blob/16bb065ac31b79c0ed24b3b944d3b5275123e854/platform/web/javascript_bridge_singleton.cpp#L210
type GodotVariant = string | number | boolean | null;
type GodotEventCallback = (name : String, value : GodotVariant) => void;

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

export class TwodotBridge {
	#godotEventCallback : GodotEventCallback = () => {};

	#canvas;
	constructor(canvas : HTMLCanvasElement) {
		this.#canvas = canvas;
	}

	registerGodot(godotEventCallback : GodotEventCallback) {
		this.#godotEventCallback = godotEventCallback;
		// setTimeout(() => {

		// 	this.sendGodotEvent("cam_update", JSON.stringify({
		// 		"lookAt": [0, 100, -100]
		// 	}));
		// }, 5000);
	}

	setCameraLook(target : Vector3 | String) {
		let lookAt : String | Array<number> = "/root";
		if (target instanceof Vector3) {
			lookAt = [target.x, target.y, target.z];
		} else if (target instanceof String)  {
			lookAt = target;
		}

		this.sendGodotEvent("cam_update", JSON.stringify({
			"lookAt": lookAt
		}))
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