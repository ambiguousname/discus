import Editor, { AbstractToolbar, BackgroundComponentBackgroundType, Color4, EditorSettings, EraserTool, PanZoomTool, PenTool, ToolEnabledGroup } from "js-draw";
import 'js-draw/styles';

const settings : Partial<EditorSettings> = {
	// Only capture mouse wheel events if the editor has focus. This is useful
	// when the editor is part of a larger, scrolling page.
	wheelEventsEnabled: false,
};

class EntityDraw extends HTMLElement {
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
		let pen = new PenTool(this.#editor, this.#editor.localization.penTool(1), {
			color: Color4.white,
		});
		pen.setToolGroup(group);

		let penTwo = new PenTool(this.#editor, this.#editor.localization.penTool(2), {
			color: Color4.red,
		});
		penTwo.setToolGroup(group);

		let eraser = new EraserTool(this.#editor, this.#editor.localization.eraser, {});
		eraser.setToolGroup(group);

		tools.setTools([pen, penTwo, eraser], group);
		pen.setEnabled(true);
		
		this.#toolbar = this.#editor.addToolbar(false);
		this.#toolbar.addUndoRedoButtons();
		this.#toolbar.addWidgetsForPrimaryTools();
	}

	finish() : string {
		let serializer = new XMLSerializer();
		let str = serializer.serializeToString(this.#editor.toSVG());
		this.#editor.remove();
		return str;
	}
};

window.customElements.define("entity-draw", EntityDraw);