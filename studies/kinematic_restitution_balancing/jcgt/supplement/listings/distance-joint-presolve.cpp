// Distance-joint preSolve bias (Component A + B).
forceVn = dot(bodyB.forceVelocity - bodyA.forceVelocity, n)
v_bias_ideal = beta * C / dt
expectedDisplacement = v_bias_ideal * dt
workTerm = 2 * (forceVn / dt) * expectedDisplacement
v_bias_sq = v_bias_ideal * v_bias_ideal
v_bias_actual = sqrt(max(0, v_bias_sq - workTerm))
bias = (v_bias_ideal > 0 ? v_bias_actual : -v_bias_actual) - forceVn
// During the velocity solve, -forceVn is folded into bias so
// relative_vn is not double-corrected.
