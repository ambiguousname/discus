
import { PassageLink } from 'chapbook/src/runtime/template/custom-elements/passage-link';
import { DrawError, DrawErrorType, EntityDraw } from '../draw.mjs';
import { twodot } from '../game.mjs';

declare global {
	interface Window {
		getForm: (formName: string) => FormSubmission,
	}
}

type FormEntry = Promise<SVGElement> | string | boolean | number;
type FormSubmission = Map<string, FormEntry>;

/**
 * A list of pending {@link SubmitPassageLink} results to be evaluated by a story-defined script.
 * 
 * Currently under the assumption that forms will be used and evaluated as soon as you click to the next paragraph.
 * This should be stored into localStorage otherwise.
 */
let forms : Map<string, FormSubmission> = new Map();

export class SubmitPassageLink extends PassageLink {
	#parent : HTMLFormElement;
	constructor() {
		super();
		if (this.parentElement instanceof HTMLFormElement) {
			this.#parent = this.parentElement;
		} else {
			throw Error("Could not find <form> parent.");
		}
		this.addEventListener("click", this.submitPassageForm.bind(this), {
			capture: true
		});
		
	}

	async submitPassageForm(ev : Event) {
		document.getElementById("draw-error")?.remove();

		let inputs : Record<string, any> = {};

		for (let child of this.#parent.children) {
			if (child === this) {
				continue;
			}
			try {
				if (child instanceof EntityDraw) {
					if (child.hasAttribute("required")) {
						child.checkValidation();
					}
					let name = child.id;
					if (name !== null){
						inputs[name] = child;
					}
				}
				if (child instanceof HTMLInputElement) {
					if (child.required && child.value === "") {
						throw new Error("You did not fill in the required fields, ya bourgeois barnacle.");
					}
					inputs[child.id] = child;
				}
			} catch (err) {
				ev.preventDefault();
				ev.stopPropagation();
				let errorMsg : string = "*Shrugs cutely*";
				if (err instanceof DrawError) {
					switch (err.type) {
						case DrawErrorType.EMPTY:
							errorMsg = "You gotta draw something, you detrital debutante!";
							break;
						default:
							errorMsg = "Something went wrong with your canvas. Make no sudden movements and pray to the Spider Lord.";
							break;
					}
				} else if (err instanceof Error) {
					errorMsg = err.message;
				}
				let errorText = document.createElement("div");

				errorText.innerHTML = `<p>You hear your grandfather's words in your mind: "${errorMsg}"</p> <p>Surprised by his sudden outburst, you take a minute to compose yourself.</p>`;
				errorText.id = "draw-error";

				this.#parent.insertBefore(errorText, this);
			}
		}

		let submission : FormSubmission = new Map();

		for (let inputName in inputs) {
			let input = inputs[inputName];
			if (input instanceof EntityDraw) {
				submission.set(inputName, input.finish("image/svg+xml"));
			} else if (input instanceof HTMLInputElement) {
				switch (input.type) {
					case "checkbox":
						submission.set(inputName, input.checked);
						break;
					case "number":
						submission.set(inputName, parseFloat(input.value));
					default:
						submission.set(inputName, input.value);
						break;
				}
			}
		}
		forms.set(this.#parent.id, submission);
	}
}
window.customElements.define('submit-passage-link', SubmitPassageLink);

window.getForm = (formName : string) : FormSubmission => {
	let form = forms.get(formName);
	if (form !== undefined) {
		forms.delete(formName);
		return form;
	} else {
		throw new Error(`Could not get form: ${formName}`);
	}
}