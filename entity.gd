class_name Entity extends Node3D

## Does this entity persist through loads?
@export var is_const : bool = false;

func _ready() -> void:
	Bridge.register_entity(self);

func variant_to_json(v : Variant) -> Variant:
	if v is Node:
		return "path:%s" % v.get_path();
	elif v is Resource:
		return "resource_path:%s" % v.resource_path;
	elif v is Color:
		return v.to_html();
	elif v is Vector3:
		return [v.x, v.y, v.z];
	elif v is Vector2:
		return [v.x, v.y];
	elif v is Quaternion:
		return [v.x, v.y, v.z, v.w];
	elif v is Transform3D:
		return [variant_to_json(v.basis), variant_to_json(v.origin)];
	elif v is Basis:
		return [variant_to_json(v.x), variant_to_json(v.y), variant_to_json(v.z)];
	else:
		return v;

func json_to_variant(v : Variant, prop_type : Variant.Type) -> Variant:
	match prop_type:
		TYPE_VECTOR2 when v is Array && v.size() == 2:
			return Vector2(v[0], v[1]);
		TYPE_VECTOR3 when v is Array && v.size() == 3:
			return Vector3(v[0], v[1], v[2]);
		TYPE_QUATERNION when v is Array && v.size() == 3:
			return Quaternion(v[0], v[1], v[2], v[3]);
		TYPE_TRANSFORM3D when v is Array && v.size() == 2:
			return Transform3D(json_to_variant(v[0], TYPE_BASIS), json_to_variant(v[1], TYPE_VECTOR3));
		TYPE_BASIS when v is Array && v.size() == 3:
			return Basis(json_to_variant(v[0], TYPE_VECTOR3), json_to_variant(v[1], TYPE_VECTOR3), json_to_variant(v[2], TYPE_VECTOR3));
		_:
			return v;

func save_state() -> Dictionary[String, Variant]:
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
	if "owner" in state_dict && not is_const:
		root.get_node(state_dict["owner"].substr(5)).add_child(self);
	elif not is_const:
		printerr("Node %s does not have owner." % state_dict.get("name"));
		return;
	state_dict.erase("owner");
	
	# Wait for other nodes to be initialized:
	await get_tree().process_frame;
	
	for p in state_dict:
		var prop_value : Variant = state_dict[p];
		if prop_value is String:
			if prop_value.begins_with("path:"):
				var node_path = prop_value.substr(5);
				prop_value = root.get_node(node_path);
			elif prop_value.begins_with("resource_path:"):
				var resource_path = prop_value.substr(14);
				prop_value = load(resource_path);
		var prop_type : Variant.Type = typeof(self.get(p)) as Variant.Type;
		self.set(p, json_to_variant(prop_value, prop_type));

## Debugging purposes only. Do NOT use in production.
func _will_save(property_name : String) -> bool:
	if not OS.is_debug_build():
		printerr("_will_save is meant to be used for debugging only.");
	return property_name in self.save_state();
