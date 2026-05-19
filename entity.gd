class_name Entity extends Node3D

## Does this entity persist through loads?
@export var is_const : bool = false;
var is_loading : bool = false;
signal loading_done();

## As a fallback for non-const nodes.
## Godot doesn't seem to like setting the value of `owner` in some cases,
## so this is a contingency for that case.
var owner_path : NodePath;

func _ready() -> void:
	# Wait until our name is registered:
	if is_loading:
		await loading_done;
	Bridge.register_entity.call_deferred(self);
	if owner != null:
		owner_path = owner.get_path();

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
	if is_loading:
		await loading_done;
	if owner == null && owner_path == null:
		printerr("NULL OWNER AND NULL PATH FOR %s" % name);
	var state_dict : Dictionary[String, Variant] = {};
	for prop in get_property_list():
		var prop_name = prop["name"];
		var property = self.get(prop["name"]);
		match prop_name:
			# These are already covered by global_transform:
			"global_rotation", "global_position", "global_basis", "global_rotation_degrees", "basis", "rotation", "position", "rotation_degrees", "transform": continue
			"multiplayer": continue
			_: pass
		# See https://github.com/godotengine/godot-proposals/discussions/10098
		if typeof(property) == TYPE_OBJECT && !is_instance_valid(property) && str(property) != "<Object#null>":
			printerr(name, " Invalid instance: ", prop_name, " ", property);
		else:
			property = variant_to_json(property);
		state_dict[prop_name] = property;
	state_dict["ClassName"] = self.get_class();
	if state_dict["owner"] == null:
		state_dict["owner"] = owner_path;
	return state_dict;

func load_state(state_dict : Dictionary, root : Node):
	is_loading = true;
	if "owner" in state_dict && not is_const && state_dict["owner"] is NodePath:
		owner_path = state_dict["owner"];
		root.get_node(state_dict["owner"]).add_child(self);
	elif not is_const:
		printerr("Node %s does not have owner: %s" % [state_dict.get("name"), state_dict.get("owner")]);
		return;
	state_dict.erase("owner");
	
	if "name" in state_dict && (state_dict["name"] is String or state_dict["name"] is StringName):
		self.name = state_dict["name"];
		state_dict.erase("name");
	
	# Wait for other nodes to be initialized:
	await get_tree().process_frame;
	
	for p in state_dict:
		var prop_value : Variant = state_dict[p];
		if prop_value is String:
			if prop_value.begins_with("resource_path:"):
				var resource_path = prop_value.substr(14);
				prop_value = load(resource_path);
		
		var prop_type = typeof(self.get(p));
		match prop_type:
			TYPE_OBJECT when prop_value is NodePath:
				self.set(p, get_node(prop_value));
			_: self.set(p, prop_value);
	
	is_loading = false;
	loading_done.emit.call_deferred();

## Debugging purposes only. Do NOT use in production.
func _will_save(property_name : String) -> bool:
	if not OS.is_debug_build():
		printerr("_will_save is meant to be used for debugging only.");
	return property_name in await self.save_state();
