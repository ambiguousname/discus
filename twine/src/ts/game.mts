import "chapbook/src/runtime";
import "../../../build/Discus";
import { TwodotBridge } from "./bridge.mjs";
import "./draw.mjs";
import "./interactions.mjs";

let canvas = document.getElementById("canvas");

if (canvas instanceof HTMLCanvasElement) {
	let aspectRatio = 1152/648;
	canvas.width = window.innerHeight * aspectRatio;
	canvas.height = window.innerHeight;
	window["Twodot"] = new TwodotBridge(canvas);
}
let twodot : TwodotBridge = window["Twodot"];

async function init() {
	let res = await fetch("Discus.json");
	let config = JSON.parse(await res.text());

	const GODOT_THREADS_ENABLED = config["threads_enabled"];

	let modifiedConfig = config["config"];
	// modifiedConfig["onPrint"] = (msg) => {
	// 	console.log(msg);
	// };

	let Engine = window['Engine'];
	const missing = Engine.getMissingFeatures({
		threads: GODOT_THREADS_ENABLED,
	});

	if (missing.length !== 0) {
		if (modifiedConfig['serviceWorker'] && modifiedConfig['ensureCrossOriginIsolationHeaders'] && 'serviceWorker' in navigator) {
			let serviceWorkerRegistrationPromise;
			try {
				serviceWorkerRegistrationPromise = navigator.serviceWorker.getRegistration();
			} catch (err) {
				serviceWorkerRegistrationPromise = Promise.reject(new Error('Service worker registration failed.'));
			}
			// There's a chance that installing the service worker would fix the issue
			Promise.race([
				serviceWorkerRegistrationPromise.then((registration) => {
					if (registration != null) {
						return Promise.reject(new Error('Service worker already exists.'));
					}
					return registration;
				}).then(() => engine.installServiceWorker()),
				// For some reason, `getRegistration()` can stall
				new Promise((resolve) => {
					setTimeout(() => resolve(null), 2000);
				}),
			]).then(() => {
				// Reload if there was no error.
				window.location.reload();
			}).catch((err) => {
				console.error('Error while registering service worker:', err);
			});
		} else {
			// Display the message as usual
			const missingMsg = 'Error\nThe following features required to run Godot projects on the Web are missing:\n';
			alert(missingMsg + missing.join('\n'));
		}
	}

	let page = document.getElementById("content");
	let progress = document.getElementById("godot-progress-percent");
	let progressDiv = document.getElementById("godot-load-progress");

	// Do not resize the canvas, we handle that:
	modifiedConfig["canvasResizePolicy"] = 0;
	modifiedConfig["canvas"] = canvas;
	modifiedConfig["focusCanvas"] = false;
	modifiedConfig["onProgress"] = (current : number, total : number) => {
		if (progress instanceof HTMLSpanElement) {
			let p = current/total;
			if (p === 1) {
				p = 0.9999;
			}
			progress.innerText = `${Math.floor(p * 10000)/100}%`;
		}
	}

	let engine = new Engine(modifiedConfig);
	engine.startGame().then(() => {
		// Disable tabbing:
		if (canvas instanceof HTMLElement) {
			canvas.tabIndex = -1;
		}
		// Wait for Godot to finish loading fully, then do the transitions:
		setTimeout(() => {
			if (progress instanceof HTMLSpanElement) {
				progress.innerText = "100%";
			}
			if (progressDiv instanceof HTMLElement) {
				progressDiv.style.opacity = "0%";
				progressDiv.ontransitionend = () => {
					progressDiv.style.display = "none";
				};
				progressDiv.style.zIndex = "-1";
			}
			if (page instanceof HTMLElement) {
				page.style.opacity = "100%";
			}
		}, 100);
	});
}

init();

export {
	twodot
};