extends Node

var cb : JavaScriptObject;
var res_cb : JavaScriptObject;
var js_twodot : JavaScriptObject;

var is_loading : bool = false;
signal loading_done();

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
	res_cb = JavaScriptBridge.create_callback(receiveEventWithResponse);
	js_twodot = JavaScriptBridge.get_interface("Twodot");
	js_twodot.registerGodot(cb, res_cb);

var entities : Dictionary[String, Entity];
func register_entity(e : Entity):
	self.entities[e.name] = e;

var entity_creator : EntityCreator;
func register_entity_creator(e : EntityCreator):
	entity_creator = e;

func sendEvent(event_name : String, event_value : Variant):
	js_twodot.sendTwineEvent(event_name, event_value);

func receiveEventWithResponse(args : Array):
	if args.size() != 3:
		printerr("Expected three arguments: [event name] [response ID] [event value], got ", args);
	var event_name : String = args[0];
	var event_value : Variant = args[2];
	var response_id : int = args[1];
	var ret = await execute_event(event_name, event_value);
	js_twodot.godotReply(response_id, ret);

func receiveEvent(args : Array):
	if args.size() != 2:
		printerr("Expected two arguments: [event name] [event value], got %s" % args);
	var event_name : String = args[0];
	var event_value : Variant = args[1];
	execute_event(event_name, event_value);

func execute_event(event_name : String, event_value: Variant) -> Variant:
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
			# DO NOT SAVE WHILE WE ARE LOADING
			if is_loading:
				await loading_done;
			var state : Dictionary = {};
			for e in entities:
				var entity = entities[e];
				state[entity.name] = await entity.save_state();
			return _send_state_data(state);
		"load_state":
			_load_state(event_value);
		"save_drawing":
			return save_drawing(JSON.parse_string(event_value));
		"create_texture":
			create_texture(JSON.parse_string(event_value));
		"download_file":
			if not FileAccess.file_exists(event_value):
				printerr("Could not read: ", event_value);
				return;
			var file = FileAccess.open(event_value, FileAccess.READ);
			var buffer = file.get_buffer(file.get_length());
			file.close();
			JavaScriptBridge.download_buffer(buffer, event_value.get_file());
		"list_files":
			return JSON.stringify(DirAccess.get_files_at(event_value));
		"create_entity":
			# Do not return until the entity has been created.
			await create_entity(JSON.parse_string(event_value));
		"get_entity":
			var n = entities.get(event_value);
			var script = n.get_script();
			var entity_class : Variant = null;
			if script is Script:
				entity_class = script.get_global_name();
			if n is Entity:
				return JSON.stringify({
					"id": n.get_instance_id(),
					"entityClass": entity_class,
				});
			else:
				return null;
		"get_entity_prop":
			return get_entity_prop(JSON.parse_string(event_value));
		"get_entity_state":
			var e = entities.get(event_value);
			if e is Entity:
				return JSON.stringify(e.save_state());
			else:
				return null;
		"free_entity":
			var e = entities.get(event_value);
			if e is Entity:
				e.queue_free();
				entities.erase(event_value);
			else:
				printerr("Could not get entity %s: " % event_value, e);
	return null;

func get_entity_prop(d : Dictionary):
	var entity_name = d.get("entityName");
	if entity_name is not String:
		printerr("entityName is not string: ", entity_name);
		return null;
	if not entities.has(entity_name):
		printerr("Error getting prop of %s: entity does not exist in registered entities." % entity_name);
		return null;
	var prop_name = d.get("propName");
	if prop_name is not String:
		printerr("Error getting prop of %s: propName is not string: " % entity_name, prop_name);
	return JSON.stringify(Entity.variant_to_json(entities.get(entity_name).get(prop_name)));

func save_drawing(d : Dictionary) -> Variant:
	var mime_type = d.get("type");
	if mime_type != "image/svg+xml":
		printerr("Mime type %s not supported." % mime_type);
		return null;
	var img_name = d.get("name");
	if !(img_name is String):
		printerr("Image name should be a string: ", img_name);
		return null;
	var svg_str = d.get("img");
	if svg_str is String:
		var f = FileAccess.open("user://%s.svg" % img_name, FileAccess.WRITE);
		f.store_string(svg_str);
		f.close();
		return img_name;
	else:
		printerr("SVG is not a string: ", svg_str);
		return null;

func create_texture(d : Dictionary):
	var img_path = d.get("img");
	if img_path is not String:
		printerr("Expected image path to be string: ", img_path);
		return;
	
	var mime_type = d.get("type");
	if mime_type != "image/svg+xml":
		printerr("Mime type %s not supported." % mime_type);
		return;
	
	var texture_path = d.get("texturePath");
	if texture_path is String:
		if not FileAccess.file_exists(img_path):
			printerr("File %s does not exist." % img_path);
			return;
		var svg = FileAccess.get_file_as_bytes(img_path);
		var img = Image.new();
		var scale = d.get("scale", 1.0);
		img.load_svg_from_buffer(svg, scale);
		
		var texture = ImageTexture.create_from_image(img);
		ResourceSaver.save(texture, texture_path);
	else:
		printerr("Expected texturePath to be string: ", texture_path);

func create_entity(d : Dictionary):
	var entity_name = d.get("entityName");
	if not (entity_name is String):
		printerr("Entity name is not String for create_entity call:", entity_name, " ", d);
		return;
	var entity_type = d.get("entityType");
	match entity_type:
		"character":
			var texture_path = d.get("texturePath");
			if not (texture_path is String):
				printerr("Texture path is not String for %s: " % entity_name, texture_path);
				return;
			# Let the entity finish creation:
			await entity_creator.add_character_entity(entity_name, texture_path);
		_:
			printerr("Unrecognized entity type: ", entity_type);

func _send_state_data(state : Dictionary) -> String:
	var gzip = StreamPeerGZIP.new();
	gzip.start_compression();
	gzip.put_data(var_to_bytes(state));
	gzip.finish();
	var out : Array = gzip.get_data(gzip.get_available_bytes());
	if out[0] != OK:
		printerr("Could not compress data: ", out);
	var ret = Marshalls.raw_to_base64(out[1]);
	gzip.clear();
	return ret;

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
	# Wait for the existing entities to be freed.
	await get_tree().process_frame;
	
	var state : Dictionary = _load_state_data(state_data);
	# We will defer all calls here to ensure that all entity state loads are done in the same frame.
	for entity_name in state:
		var entity_data : Dictionary = state[entity_name];
		if entity_name in entities:
			entities[entity_name].load_state.call_deferred(entity_data, get_tree().root);
		else:
			var scene = Entity.extract_resource_path(entity_data.get("scene"));
			if scene is not PackedScene:
				printerr("Could not find scene to initialize %s: " % entity_name, scene);
				continue;
			
			var obj : Object = scene.instantiate();
			if obj is Entity:
				obj.is_loading = true;
				obj.load_state.call_deferred(entity_data, get_tree().root);
			else:
				printerr("Expected scene loaded %s to be an entity (is a %s)" %  [entity_name, obj.get_class()]);
				obj.free();
	# Let the entities finish initializing:
	await get_tree().process_frame;
	is_loading = false;
	loading_done.emit.call_deferred();

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
