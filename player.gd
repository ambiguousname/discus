class_name Player extends CharacterBody3D

@onready var cam : Camera3D = $Camera3D;
@onready var fps_cam : PhantomCamera3D = $FPS;

@onready var agent : NavigationAgent3D = $NavigationAgent3D;

@export var look_at: Variant:
	set(v):
		self.set_look_at(v);

@export var move_target : Vector3:
	set(v):
		move_target = v;
		agent.target_position = v;

func _ready() -> void:
	Bridge.register_entity(self);
	agent.velocity_computed.connect(func(safe_velocity : Vector3):
		self.velocity = safe_velocity;
	);

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
	elif look_target == null:
		fps_cam.look_at_target = null;

func _physics_process(delta: float) -> void:
	var pos = agent.get_next_path_position();
	var dir = (pos - self.global_position).normalized();
	self.global_rotation.y = lerpf(self.global_rotation.y, -Vector3.FORWARD.angle_to(dir), delta);
	if fps_cam.look_at_target == null:
		fps_cam.global_rotation = fps_cam.global_rotation.lerp(Vector3.ZERO, delta);
	
	if !self.is_on_floor():
		self.velocity.y -= 9.8;
	
	agent.velocity = dir;
	self.move_and_slide();
	
