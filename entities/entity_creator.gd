class_name EntityCreator extends Node3D

var entity_script : Script = preload("entity.gd");

func _ready() -> void:
	Bridge.register_entity_creator(self);

func add_character_entity(entity_name : String, texture_path : String):
	var texture : Texture;
	if FileAccess.file_exists(texture_path):
		texture = ResourceLoader.load(texture_path, "Texture2D");
		texture.resource_path = texture_path;
	else:
		texture = PlaceholderTexture2D.new();
	var entity = preload("res://entities/character.tscn").instantiate();
	entity.texture = texture;
	entity.name = entity_name;
	self.add_child(entity);
	# Wait for the entity to finish setting up:
	await get_tree().process_frame;
