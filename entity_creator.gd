class_name EntityCreator extends Node3D

var entity_script : Script = preload("res://entity.gd");

func _ready() -> void:
	Bridge.register_entity_creator(self);

func add_sprite_entity(entity_name : String, texture_path : String):
	var texture : Texture;
	var entity_texture_path : String = "user://%s_entity_texture.tres" % entity_name;
	if FileAccess.file_exists(texture_path):
		var svg = FileAccess.get_file_as_bytes(texture_path);
		var img = Image.new();
		img.load_svg_from_buffer(svg);
		texture = ImageTexture.create_from_image(img);
		ResourceSaver.save(texture, entity_texture_path);
		texture.resource_path = entity_texture_path;
	else:
		texture = PlaceholderTexture2D.new();
	var entity = Sprite3D.new();
	entity.texture = texture;
	entity.name = entity_name;
	entity.set_script(entity_script);
	entity.set(&"owner_path", self.get_path());
	self.add_child(entity);
	# Wait for the entity to finish setting up:
	await get_tree().process_frame;
