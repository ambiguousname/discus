extends Node

var cb : JavaScriptObject;
var js_twodot : JavaScriptObject;

func _ready() -> void:
	if OS.get_name() != "Web":
		self.queue_free();
		return; 
	print("Godot creating JS bridge...");
	cb = JavaScriptBridge.create_callback(receiveEvent);
	js_twodot = JavaScriptBridge.get_interface("Twodot");
	js_twodot.registerGodot(cb);

var player : Player;
func register_player(p : Player):
	self.player = p;

func sendEvent(event_name : String, event_value : Variant):
	js_twodot.sendTwineEvent(event_name, event_value);

func receiveEvent(args : Array):
	if args.size() != 2:
		printerr("Expected two arguments: [event name] [event value], got %s" % args);
	var event_name : String = args[0];
	var event_value : Variant = args[1];
	match event_name:
		"cam_update":
			var update_data = JSON.parse_string(event_value);
			if ("lookAt" in update_data):
				player.set_look_at(update_data["lookAt"])
