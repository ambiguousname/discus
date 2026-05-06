class_name Entity extends Node3D

## Does this entity persist through loads?
@export var is_const : bool = false;

func _ready() -> void:
	Bridge.register_entity(self);

func save_state() -> Dictionary[String, Variant]:
	var state_dict : Dictionary[String, Variant] = {};
	for prop in get_property_list():
		var prop_name = prop["name"];
		var property = self.get(prop["name"]);
		match prop_name:
			"multiplayer": continue
			_: pass
		if property is Node:
			property = "path:%s" % property.get_path();
		if property is Resource:
			property = "resource_path:%s" % property.resource_path;
		state_dict[prop_name] = property;
	state_dict["ClassName"] = self.get_class();
	return state_dict;

func load_state(state_dict : Dictionary):
	# Not every entity is initialized (and we might be dependent on certain nodes existing),
	# so we wait a frame to load:
	await get_tree().process_frame;
	
	for p in state_dict:
		var prop_value = state_dict[p];
		if prop_value is String:
			if prop_value.begins_with("path:"):
				var node_path = prop_value.substr(5);
				prop_value = get_tree().get_node(node_path);
		self.set(p, prop_value);
