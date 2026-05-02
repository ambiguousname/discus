type GodotVariant = String | number | null;
type GodotEventCallback = (name : String, value : GodotVariant) => void;

export class TwodotBridge {
	#godotEventCallback : GodotEventCallback = () => {};
	registerGodot(godotEventCallback : GodotEventCallback) {
		this.#godotEventCallback = godotEventCallback;
	}

	sendEvent(name : String, value : GodotVariant) {
		console.log("Sending... ", name, value);
		this.#godotEventCallback(name, value);
	}
};