// Contact preSolve bias (Component A + B).
// restitution threshold = 0.01; maxPosCorr = 0.2 (dH max)
forceVn = dot(bodyB.forceVelocity - bodyA.forceVelocity, n)
relativeVn = vn - forceVn
vBounce = -e * relativeVn
shouldBounce = enableRestitution &&
	(relativeVn < -RESTITUTION_THRESHOLD ||
	 (depth < 0 && relativeVn < depth / dt))
if (shouldBounce) {
	if (depth > 0) {
		depthAfterVelocity = max(0, (depth - slop) - vBounce * dt)
		cumulativeFactor = 1 - pow(1 - beta, n)
		expectedDisplacement =
			min(depthAfterVelocity, maxPosCorr) * cumulativeFactor
	} else { expectedDisplacement = 0 }
	workTerm = 2 * (forceVn / dt) * expectedDisplacement
	vFinal = e * sqrt(max(0, relativeVn * relativeVn + workTerm))
	bias = (depth < 0) ? -max(vFinal, depth / dt) : -vFinal
} else if (depth < 0) { bias = -depth / dt } else { bias = 0 }
