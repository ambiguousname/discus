extends Area3D
@onready var clip_safety : Node3D = $ClipSafety;

func _ready() -> void:
	self.body_entered.connect(func(n : Node3D): 
		n.global_position = clip_safety.global_position;
	);
