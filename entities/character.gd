@tool
## A mover that is displayed with a sprite.
class_name Character extends Mover

@onready var sprite : Sprite3D = $"Sprite";

## Used by Twine.
@export var character_name : String = "Unknown";
@export var texture : Texture2D:
	set(v):
		texture = v;
		if !is_node_ready():
			await ready;
		self.sprite.texture = v;
		update_sprite_display();
@export var texture_scale: float:
	set(v):
		texture_scale = v;
		if !is_node_ready():
			await ready;
		sprite.scale = Vector3(v, v, v);
		update_sprite_display();

func update_sprite_display():
	# Place the sprite starting at the "feet":
	if sprite.texture != null:
		sprite.position.y = sprite.texture.get_height() * sprite.pixel_size/2 * texture_scale;

func to_look_at() -> Node3D:
	return sprite;

func _init() -> void:
	if !Engine.is_editor_hint():
		# We don't want this to be set in the editor, just during runtime (for serialization):
		self.scene = preload("character.tscn");

func _ready() -> void:
	if !Engine.is_editor_hint():
		super();

func _physics_process(delta: float) -> void:
	if !Engine.is_editor_hint():
		super(delta);
