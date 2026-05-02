class_name Player extends CharacterBody3D

@onready var cam : Camera3D = $Camera3D;
@onready var fps_cam : PhantomCamera3D = $FPS;

func _ready() -> void:
	Bridge.register_player(self);

var look_at_node : Node3D;
func set_look_at(look_target : Variant):
	if look_at_node != null:
		look_at_node.queue_free();
	if look_target is String:
		fps_cam.look_at_target = get_node(look_target);
	elif look_target is Array:
		if look_target.size() == 3:
			look_at_node = Node3D.new();
			self.add_child(look_at_node);
			look_at_node.global_position = Vector3(look_target[0], look_target[1], look_target[2]);
			fps_cam.look_at_target = look_at_node;
