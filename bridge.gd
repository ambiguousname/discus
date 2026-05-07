extends Node

var cb : JavaScriptObject;
var js_twodot : JavaScriptObject;

func _ready() -> void:
	## Mock save:
	#await get_tree().process_frame;
	#var state : Dictionary = {};
	#for e in entities:
		#var entity = entities[e];
		#state[entity.name] = entity.save_state();
	## Mock load:
	#_send_state_data(state, func(d): 
		#_load_state(d);
	#);

	if OS.get_name() != "Web":
		self.queue_free();
		return; 
	print("Godot creating JS bridge...");
	cb = JavaScriptBridge.create_callback(receiveEvent);
	js_twodot = JavaScriptBridge.get_interface("Twodot");
	js_twodot.registerGodot(cb);

var entities : Dictionary[String, Entity];
func register_entity(e : Entity):
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
		"save_state":
			var state : Dictionary = {};
			for e in entities:
				var entity = entities[e];
				state[entity.name] = entity.save_state();
			_send_state_data(state, func(dat):
				self.sendEvent("godotStateUpdate", dat);
			);
		"load_state":
			_load_state(event_value);

func _send_state_data(state : Dictionary, callback : Callable):
	var gzip = StreamPeerGZIP.new();
	gzip.start_compression();
	gzip.put_data(var_to_bytes(state));
	gzip.finish();
	var out : Array = gzip.get_data(gzip.get_available_bytes());
	if out[0] != OK:
		printerr("Could not compress data: ", out);
	callback.call(Marshalls.raw_to_base64(out[1]));
	gzip.clear();

func _load_state_data(dat : String) -> Dictionary:
	var gzip = StreamPeerGZIP.new();
	gzip.start_decompression();
	gzip.put_data(Marshalls.base64_to_raw(dat));
	var out : Array = gzip.get_data(gzip.get_available_bytes());
	if out[0] != OK:
		printerr("Could not load state data: ", out[0]);
		return {};
	gzip.clear();
	return bytes_to_var(out[1]);
	
func _load_state(state_data : String):
	for e in entities:
		var entity = entities[e];
		if !entity.is_const:
			entity.queue_free();
			entities.erase(e);

	var state : Dictionary = _load_state_data(state_data);
	for entity_name in state:
		var entity_data : Dictionary = state[entity_name];
		if entity_name in entities:
			entities[entity_name].load_state(entity_data, get_tree().root);
		else:
			if "ClassName" in entity_data:
				var class_n : String = entity_data["ClassName"];
				var obj : Object = ClassDB.instantiate(class_n);
				entity_data.erase("ClassName");
				if obj is Node:
					var script = entity_data.get("script");
					if script is String:
						script = script.replace("resource_path:", "");
						var script_res = load(script);
						obj.set_script(script_res);
						entity_data.erase("script");
						
						if obj is Entity:
							obj.load_state(entity_data, get_tree().root);
				else:
					printerr("Entity %s is not a node (is a %s)." %  [entity_name, class_n]);
					obj.free();
			else:
				printerr("Could not find ClassName for save state of entity %s" % entity_name);

## JS -> GDScript conversion.
func jsons_to_variant(json_variants : Array[Variant]) -> Array[Variant]:
	var out = [];
	for j in json_variants:
		out.append(json_to_variant(j));
	return out;

## JS -> GDScript conversion.
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
