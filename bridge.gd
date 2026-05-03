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

var entities : Dictionary[String, Node];
func register_entity(e : Node):
	self.entities[e.name] = e;

func sendEvent(event_name : String, event_value : Variant):
	js_twodot.sendTwineEvent(event_name, event_value);

func receiveEvent(args : Array):
	if args.size() != 2:
		printerr("Expected two arguments: [event name] [event value], got %s" % args);
	var event_name : String = args[0];
	var event_value : Variant = args[1];
	match event_name:
		"entity_update":
			var update_data : Dictionary = JSON.parse_string(event_value);
			var entity_name : String = update_data.get("entityName");
			if entity_name == null:
				printerr("No entityName found in update_data: %s" % update_data);
				return;
			
			var entity : Node = entities.get(entity_name);
			if entity == null:
				printerr("Entity %s not found." % entity_name);
				return;
			
			var props = update_data.get("props");
			if props != null:
				for p in props:
					entity.set(p, json_to_variant(props[p]));
			
			var funcs = update_data.get("funcs");
			if funcs != null:
				for f in funcs:
					if funcs[f] is not Array:
						printerr("Found invalid call to %s: %s must be in an array" % [f, funcs[f]]);
						return;
					entity.callv(f, jsons_to_variant(funcs[f]));

func jsons_to_variant(json_variants : Array[Variant]) -> Array[Variant]:
	var out = [];
	for j in json_variants:
		out.append(json_to_variant(j));
	return out;

## Attempt to do some smart conversions to types.
func json_to_variant(json_variant : Variant) -> Variant:
	if json_variant is String:
		if has_node(json_variant):
			return get_node(json_variant);
		elif json_variant.begins_with("e:"):
			return self.entities[json_variant.substr(2)];
		else:
			return json_variant;
	elif json_variant is Array && json_variant.size() == 3 && json_variant[0] is float && json_variant[1] is float && json_variant[2] is float:
			return Vector3(json_variant[0], json_variant[1], json_variant[2]);
	else:
		return json_variant;
