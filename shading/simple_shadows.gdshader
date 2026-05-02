shader_type spatial;

uniform vec3 mat_color : source_color = vec3(1.0);
uniform sampler2D tex : hint_default_transparent;
uniform vec3 tex_tint : source_color = vec3(1.0);

void fragment() {
	vec4 t = texture(tex, UV);
	ALBEDO = mix(mat_color, t.rgb * tex_tint, t.a);
}

#include "simple_shadows.gdshaderinc"
