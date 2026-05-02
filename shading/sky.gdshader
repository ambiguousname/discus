shader_type sky;
render_mode use_debanding;

uniform vec3 sky_color : source_color = vec3(1.0);
uniform float sun_angle_max = 0.877;

void sky() {
	vec3 sky = sky_color;

	if (LIGHT0_ENABLED) {
		float sun_angle = dot(LIGHT0_DIRECTION, EYEDIR);
		//float sun_size = cos(LIGHT0_SIZE);
		if (sun_angle > sun_angle_max) {
			sky = LIGHT0_COLOR * LIGHT0_ENERGY;
		}
	}

	COLOR = sky;
}
