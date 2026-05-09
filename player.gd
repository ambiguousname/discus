class_name Player extends Entity

@onready var cam : Camera3D = $Camera3D;
@onready var fps_cam : PhantomCamera3D = $FPS;

@onready var agent : NavigationAgent3D = $NavigationAgent3D;

var look_at_node : Node3D;
@export var look_at: Variant:
	set(v):
		look_at = v;
		if look_at_node != null:
			look_at_node.queue_free();
		
		if look_at is Node3D:
			fps_cam.look_at_target = look_at;
		elif look_at is NodePath:
			fps_cam.look_at_target = get_node(look_at);
		elif look_at is Vector3:
			look_at_node = Node3D.new();
			self.add_child(look_at_node);
			look_at_node.global_position = look_at;
			fps_cam.look_at_target = look_at_node;
		elif look_at == null:
			fps_cam.look_at_target = null;
	get():
		return look_at;

@export var move_target : Vector3 = Vector3.INF:
	set(v):
		if v == Vector3.INF:
			return;
		move_target = v;
		agent.target_position = v;
	get():
		return move_target;

@onready var controller : CharacterBody3D = $".";
func _ready() -> void:
	super();
	agent.velocity_computed.connect(func(safe_velocity : Vector3):
		self.velocity = safe_velocity;
	);

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
	var pos = agent.get_next_path_position();
	var dir = (pos - self.global_position).normalized();
	self.global_rotation.y = lerpf(self.global_rotation.y, -Vector3.FORWARD.angle_to(dir), delta);
	if fps_cam.look_at_target == null:
		fps_cam.global_rotation = fps_cam.global_rotation.lerp(Vector3.ZERO, delta);
	
	if !controller.is_on_floor():
		self.velocity.y -= 9.8;
	
	agent.velocity = dir;
	controller.move_and_slide();
	
