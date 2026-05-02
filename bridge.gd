extends Node

var cb : JavaScriptObject;

func _ready() -> void:
	print("Godot creating JS bridge...");
	cb = JavaScriptBridge.create_callback(receiveEvent);
	var js_twodot := JavaScriptBridge.get_interface("Twodot");
	js_twodot.registerGodot(cb);

func receiveEvent(args : Array):
	if args.size() != 2:
		printerr("Expected two arguments: [event name] [event value], got %s" % args);
	var event_name : String = args[0];
	var event_value : Variant = args[1];
	print(event_name, event_value);
