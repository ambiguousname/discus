extends Marker3D

func _ready() -> void:
	Bridge.register_entity(self);
