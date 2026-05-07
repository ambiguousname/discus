class_name Entity extends Node3D

## Does this entity persist through loads?
@export var is_const : bool = false;

func _ready() -> void:
	Bridge.register_entity(self);

func variant_to_json(v : Variant) -> Variant:
	if v is Node:
		return NodePath(v.get_path());
	elif v is Resource:
		return "resource_path:%s" % v.resource_path;
	elif v is Object:
		printerr("Cannot serialize objects: ", v);
		return null;
	else:
		return v;

func save_state() -> Dictionary:
	var state_dict : Dictionary[String, Variant] = {};
	for prop in get_property_list():
		var prop_name = prop["name"];
		var property = self.get(prop["name"]);
		match prop_name:
			# These are already covered by global_transform:
			"global_rotation", "global_position", "global_basis", "global_rotation_degrees": continue
			"multiplayer": continue
			_: pass
		property = variant_to_json(property);
		state_dict[prop_name] = property;
	state_dict["ClassName"] = self.get_class();
	return state_dict;

func load_state(state_dict : Dictionary, root : Node):
	if "owner" in state_dict && not is_const && state_dict["owner"] is NodePath:
		root.get_node(state_dict["owner"]).add_child(self);
	elif not is_const:
		printerr("Node %s does not have owner: %s" % [state_dict.get("name"), state_dict.get("owner")]);
		return;
	state_dict.erase("owner");
	
	# Wait for other nodes to be initialized:
	await get_tree().process_frame;
	
	for p in state_dict:
		var prop_value : Variant = state_dict[p];
		if prop_value is String:
			if prop_value.begins_with("resource_path:"):
				var resource_path = prop_value.substr(14);
				prop_value = load(resource_path);
		self.set(p, prop_value);

## Debugging purposes only. Do NOT use in production.
func _will_save(property_name : String) -> bool:
	if not OS.is_debug_build():
		printerr("_will_save is meant to be used for debugging only.");
	return property_name in self.save_state();
