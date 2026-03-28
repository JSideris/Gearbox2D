import math

class Particle:
    def __init__(self, y, v):
        self.y = y
        self.v = v
        self.mass = 1.0
        self.force_v = 0.0

def simulate_newtons_cradle(use_comp_b, steps=600):
    dt = 1.0 / 60.0
    gravity = -9.81
    
    # Distance joint length
    L = 10.0
    beta = 0.2
    
    # Pendulum starts slightly stretched or displaced
    # Let's start it exactly at rest but at L (0, -L)
    # Actually, pendulums swing. Let's simulate a 2D pendulum.
    # Pendulum anchor at (0,0)
    p = [5.0, -math.sqrt(L**2 - 5.0**2)] # x, y
    v = [0.0, 0.0]
    
    energies = []
    
    for _ in range(steps):
        # 1. Apply gravity (implicit in force velocity)
        forceV_x = 0.0
        forceV_y = gravity * dt
        
        v[0] += forceV_x
        v[1] += forceV_y
        
        # 2. Solve Distance Constraint
        # Vector from anchor (0,0) to p
        dx = p[0]
        dy = p[1]
        dist = math.sqrt(dx*dx + dy*dy)
        
        # Normal points from anchor to p
        nx = dx / dist
        ny = dy / dist
        
        # Error C = distance - L (positive if stretched)
        C = dist - L
        
        # force velocity dotted with normal
        forceVn = forceV_x * nx + forceV_y * ny
        
        # v_relative is just v dotted with normal (since anchor is fixed)
        v_rel_n = v[0] * nx + v[1] * ny
        
        # Component A
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
            
        # Lambda
        # effective mass for 1 particle and fixed anchor is just mass
        lambd = -1.0 * (v_rel_n - forceVn + bias)  # The code in whitepaper says: relative_vn = v_relative.dot(normal) - forceVn
        
        # Apply impulse
        impulse_x = lambd * nx
        impulse_y = lambd * ny
        
        v[0] += impulse_x
        v[1] += impulse_y
        
        # 3. Integrate position
        p[0] += v[0] * dt
        p[1] += v[1] * dt
        
        # Energy
        ke = 0.5 * 1.0 * (v[0]**2 + v[1]**2)
        pe = 1.0 * 9.81 * p[1]
        te = ke + pe
        
        energies.append(te)
        
    return energies

energies_a = simulate_newtons_cradle(False, 1000)
energies_ab = simulate_newtons_cradle(True, 1000)

print(f"Start Energy: {energies_a[0]:.4f}")
print(f"End Energy (No Comp B): {energies_a[-1]:.4f} (diff: {energies_a[-1]-energies_a[0]:.4f})")
print(f"End Energy (With Comp B): {energies_ab[-1]:.4f} (diff: {energies_ab[-1]-energies_ab[0]:.4f})")
