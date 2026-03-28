import math

class Body:
    def __init__(self, x, y, inv_mass):
        self.p = [x, y]
        self.v = [0.0, 0.0]
        self.force_v = [0.0, 0.0]
        self.im = inv_mass

def simulate_pendulum(use_comp_b, steps=1000):
    dt = 1.0 / 60.0
    gravity = [0.0, -9.81]
    
    # Distance joint
    anchor = [0.0, 0.0]
    length = 10.0
    beta = 0.2
    
    # Pendulum starts perfectly at rest at bottom
    body = Body(0.0, -10.0, 1.0)
    
    # But wait, to see the energy leak, let's add a small horizontal perturbation
    # representing accumulated sway
    body.v[0] = 0.1 
    
    energies = []
    
    for step in range(steps):
        # 1. Apply Forces
        body.force_v[0] += gravity[0] * dt
        body.force_v[1] += gravity[1] * dt
        
        body.v[0] += gravity[0] * dt
        body.v[1] += gravity[1] * dt
        
        # 2. Solve Distance Constraint
        dx = body.p[0] - anchor[0]
        dy = body.p[1] - anchor[1]
        dist = math.sqrt(dx*dx + dy*dy)
        
        if dist > 1e-4:
            nx = dx / dist
            ny = dy / dist
        else:
            nx, ny = 0.0, 1.0
            
        C = dist - length
        
        forceVn = body.force_v[0] * nx + body.force_v[1] * ny
        v_rel_n = body.v[0] * nx + body.v[1] * ny
        
        # Reset force_v each frame after applying to constraint logic,
        # wait, Gearbox2D integrates forces every frame and clears them?
        # Actually forceVelocity is tracked per frame.
        
        v_bias_ideal = beta * C / dt
        
        if use_comp_b:
            expectedDisplacement = v_bias_ideal * dt
            accVn = forceVn / dt
            workTerm = 2.0 * accVn * expectedDisplacement
            
            v_bias_sq = v_bias_ideal * v_bias_ideal
            if workTerm > 0.0:
                adjusted_v_bias_sq = max(0.0, v_bias_sq - workTerm)
                v_bias_actual = math.sqrt(adjusted_v_bias_sq)
                bias = (v_bias_actual if v_bias_ideal > 0 else -v_bias_actual) - forceVn
            else:
                bias = v_bias_ideal - forceVn
        else:
            bias = v_bias_ideal - forceVn
            
        lambd = -1.0 * (v_rel_n - forceVn + bias)
        
        body.v[0] += nx * lambd
        body.v[1] += ny * lambd
        
        # 3. Integrate Position
        body.p[0] += body.v[0] * dt
        body.p[1] += body.v[1] * dt
        
        # 4. Clear force velocity for next frame
        body.force_v = [0.0, 0.0]
        
        # Calculate Energy
        ke = 0.5 * (body.v[0]**2 + body.v[1]**2)
        pe = 9.81 * body.p[1]
        
        energies.append(ke + pe)
        
    return energies

energies_no_b = simulate_pendulum(False, 1000)
energies_with_b = simulate_pendulum(True, 1000)

print("Energy leak demo:")
print(f"Start energy: {energies_no_b[0]:.4f}")
print(f"End energy (No Comp B): {energies_no_b[-1]:.4f} (Change: {energies_no_b[-1] - energies_no_b[0]:.4f})")
print(f"End energy (With Comp B): {energies_with_b[-1]:.4f} (Change: {energies_with_b[-1] - energies_with_b[0]:.4f})")

