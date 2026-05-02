void light() {
	float lambertian_light = clamp(dot(NORMAL, LIGHT), 0.0, 1.0) * ATTENUATION;
	float light = step(0.001, lambertian_light);
	
	// For the SPECULAR_AMOUNT - 1.0 term: SPECULAR_AMOUNT = 1.0 for DirectionalLight,
	// and 2.0 * light_specular for Spotlights and Omnilights.
	// For any lights that should take priority (like a muzzle flash),
	// we set the diffuse to zero and use the specular to combine any priority lights.
	// Set light_specular = 1.0 to set this priority.
	if (SPECULAR_AMOUNT > 1.0 && light >= 1.0) {
		// Multiply by SPECULAR_AMOUNT - 1.0 to get a priority based on light_specular.
		SPECULAR_LIGHT += light * LIGHT_COLOR * (SPECULAR_AMOUNT - 1.0);
		DIFFUSE_LIGHT = vec3(0.0);
	} else {
		DIFFUSE_LIGHT += light * LIGHT_COLOR;
	}
	//SPECULAR_LIGHT = (SPECULAR_AMOUNT - 1.0) * light * LIGHT_COLOR;
	// TODO: For getting multiple OmniLights to overlap (without having to subtract DIFFUSE_LIGHT above), you can use SPECULAR_LIGHT as a holder?
	//SPECULAR_LIGHT *= vec3(1.0 - step(clamp(LIGHT_COLOR.r, 0.0, 1.0) - clamp(DIFFUSE_LIGHT.r, 0.0, 1.0), 0.0)) * shadow_color;
}