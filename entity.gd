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
		elif property is Resource:
			property = "resource_path:%s" % property.resource_path;
		elif property is Color:
			property = property.to_html();
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
	
	for p in state_dict:
		var prop_value : Variant = state_dict[p];
		if prop_value is String:
			if prop_value.begins_with("path:"):
				var node_path = prop_value.substr(5);
				prop_value = root.get_node(node_path);
			elif prop_value.begins_with("resource_path:"):
				var resource_path = prop_value.substr(14);
				prop_value = load(resource_path);
		
		self.set(p, prop_value);
