import "chapbook/src/runtime";
import "../../../build/Discus";
// Will be created on build:

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

	let engine = new Engine(modifiedConfig);
	engine.startGame();
}

init();