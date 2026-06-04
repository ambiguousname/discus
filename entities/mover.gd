## An entity that supports navigation around level.
class_name Mover extends Entity

@onready var agent : NavigationAgent3D = $NavigationAgent3D;
@onready var controller : CharacterBody3D = $".";
@onready var collision : CollisionShape3D = $CollisionShape3D;

@export var move_target : Variant:
	set(v):
		if !is_node_ready():
			await ready;
		if v is Vector3:
			if v == Vector3.INF:
				move_target = null;
				return;
			agent.target_position = v;
			move_target = v;
		elif v is Node3D:
			agent.target_position = v.global_position;
			move_target = v.global_position;
		else:
			move_target = null;
	get():
		if !is_node_ready():
			await ready;
		return move_target;

func _ready() -> void:
	super();
	agent.velocity_computed.connect(func(safe_velocity : Vector3):
		self.velocity = safe_velocity;
	);

func _physics_process(delta: float) -> void:
	if move_target == null:
		return;
	var pos = agent.get_next_path_position();
	var dir = (pos - self.global_position).normalized();
	self.global_rotation.y = lerpf(self.global_rotation.y, -Vector3.FORWARD.angle_to(dir), delta);
	if !controller.is_on_floor():
		self.velocity.y -= 9.8;
	
	agent.velocity = dir;
	controller.move_and_slide();
