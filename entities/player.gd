class_name Player extends Mover

@onready var cam : Camera3D = $Camera3D;
@onready var fps_cam : PhantomCamera3D = $FPS;

var look_at_node : Node3D;
@export var look_at: Variant:
	set(v):
		look_at = v;
		if look_at_node != null:
			look_at_node.queue_free();
			look_at_node = null;
		
		var to_look = look_at;
		if to_look is NodePath:
			to_look = get_node(to_look);
		
		if to_look is Entity:
			fps_cam.look_at_target = to_look.to_look_at();
		elif to_look is Node3D:
			fps_cam.look_at_target = to_look;
		elif to_look is Vector3:
			look_at_node = Node3D.new();
			self.add_child(look_at_node);
			look_at_node.global_position = to_look;
			fps_cam.look_at_target = look_at_node;
		elif to_look == null:
			fps_cam.look_at_target = null;
	get():
		return look_at;

func set_look_at(look_target : Variant):
	self.look_at = look_target;

func set_move_target(v):
	if v is Vector3:
		move_target = v;
		return;
	
	if v is Node3D:
		move_target = v.global_position;
		return;
	

func _physics_process(delta: float) -> void:
	super(delta);
	if fps_cam.look_at_target == null:
		fps_cam.global_rotation = fps_cam.global_rotation.lerp(Vector3.ZERO, delta);
