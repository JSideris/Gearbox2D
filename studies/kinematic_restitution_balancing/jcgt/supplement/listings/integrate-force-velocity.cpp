// Per dynamic body at integrate (before the constraint solve).
// a_ext is gravity plus external force before linear damping.
if (inverseMass > 0 && !sleeping) {
	forceVelocity = a_ext * dt; // two floats: v_force
} else {
	forceVelocity = 0;
}
