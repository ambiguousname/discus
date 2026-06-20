import Editor, { AbstractToolbar, BackgroundComponentBackgroundType, Color4, EditorSettings, EraserTool, EraserToolWidget, PanZoomTool, PenTool, PenToolWidget, ToolEnabledGroup, Vec3 } from "js-draw";
import 'js-draw/styles';

const settings : Partial<EditorSettings> = {
	// Only capture mouse wheel events if the editor has focus. This is useful
	// when the editor is part of a larger, scrolling page.
	wheelEventsEnabled: false,
};

export enum DrawErrorType {
	EMPTY
}

export class DrawError {
	type : DrawErrorType;
	constructor(t : DrawErrorType) {
		this.type = t;
	}
}

class OpaquePenTool extends PenTool {
	setColor(color: Color4): void {
		if (color.a < 1.0) {
			color = Color4.ofRGB(color.r, color.g, color.b);
		}
		super.setColor(color);
	}
}

class OpaquePenToolWidget extends PenToolWidget {
	fillDropdown(dropdown: HTMLElement, helpDisplay) {
		let out = super.fillDropdown(dropdown, helpDisplay);
		let input = dropdown.querySelector("input.coloris_input");
		if (input instanceof HTMLInputElement) {
			input.addEventListener("input", () => {
				let c = Color4.fromHex(input.value);
				if (c.a < 1.0) {
					input.value = Color4.ofRGB(c.r, c.g, c.b).toHexString();
				}
			}, {
				capture: true
			});
		}
		return out;
	}
}

export class EntityDraw extends HTMLElement {
	#editor : Editor;
	#toolbar : AbstractToolbar;
	constructor() {
		super();
		this.#editor = new Editor(this, settings);
		this.#editor.dispatch(this.#editor.setBackgroundStyle({
			color: Color4.ofRGBA(0, 0, 0, 1),
			type: BackgroundComponentBackgroundType.SolidColor,
			autoresize: true 
		}), false);

		let tools = this.#editor.toolController;

		let group = new ToolEnabledGroup();
		let pen = new OpaquePenTool(this.#editor, this.#editor.localization.penTool(1), {
			color: Color4.white,
		});
		pen.setToolGroup(group);

		let penTwo = new OpaquePenTool(this.#editor, this.#editor.localization.penTool(2), {
			color: Color4.red,
		});
		penTwo.setToolGroup(group);

		let eraser = new EraserTool(this.#editor, this.#editor.localization.eraser, {});
		eraser.setToolGroup(group);

		tools.setTools([pen, penTwo, eraser], group);
		pen.setEnabled(true);
		
		this.#toolbar = this.#editor.addToolbar(false);
		this.#toolbar.addUndoRedoButtons();
		this.#toolbar.addWidget(new OpaquePenToolWidget(this.#editor, pen, this.#editor.localization));
		this.#toolbar.addWidget(new OpaquePenToolWidget(this.#editor, penTwo, this.#editor.localization));
		this.#toolbar.addWidget(new EraserToolWidget(this.#editor, eraser, this.#editor.localization));
		// this.#toolbar.addWidgetsForPrimaryTools();
	}

	checkValidation() {
		if (this.#editor.image.getAllComponents().length === 0) {
			throw new DrawError(DrawErrorType.EMPTY);
		}
	}

	finish(format : "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml", outputSize? : Vec3) : Promise<SVGElement> | string {
		this.checkValidation();
		let out : Promise<SVGElement> | string;
		switch (format) {
			case "image/svg+xml":
				out = this.#editor.toSVGAsync();
				break;
			default:
				out = this.#editor.toDataURL(format);
		}
		this.#editor.remove();
		return out;
	}
};

window.customElements.define("entity-draw", EntityDraw);