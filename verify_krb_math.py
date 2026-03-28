import math

def simulate(use_component_b=True, steps=1000):
    dt = 1.0 / 60.0
    gravity = -9.81
    
    # Setup
    # Particle at y = -10.0, attached to origin
    # Distance joint target length = 10.0
    target_length = 10.0
    y = -10.0
    v = 0.0
    mass = 1.0
    
    beta = 0.2
    
    energies = []
    
    for step in range(steps):
        # 1. Apply forces (Gravity)
        forceVn = gravity * dt
        v += forceVn
        
        # Calculate Potential Energy (PE = m * g * h)
        # Here h = y, gravity = -9.81, so PE = mass * (-gravity) * y
        # Actually, if gravity is -9.81, potential energy is mass * 9.81 * y
        pe = mass * 9.81 * y
        
        # 2. Positional and Velocity Constraint solving (Baumgarte + KRB)
        # Joint normal points from A (origin) to B (particle)
        # Origin is (0,0), Particle is (0,y)
        # So normal is (0, -1) since y is negative
        # Let's just do 1D scalar math. Normal is 1.0 (pointing down, towards negative y)
        # Let's assume positive is up, negative is down.
        # y is negative. Normal n = -1.0 (from 0 to y)
        # So forceVn_directed = forceVn * n = (-9.81 * dt) * (-1) = 9.81 * dt
        # Wait, relative velocity is v.
        # Let's stick to 1D vectors where direction matters.
        n = -1.0 if y < 0 else 1.0
        
        # Constraint C = distance - target_length
        dist = abs(y)
        C = dist - target_length
        
        # Velocity along normal
        v_relative_n = v * n
        forceVn_n = forceVn * n
        
        # Component A
        v_bias_ideal = beta * C / dt
        
        # Component B
        if use_component_b:
            expectedDisplacement = v_bias_ideal * dt
            accVn = forceVn_n / dt
            workTerm = 2.0 * accVn * expectedDisplacement
            
            v_bias_sq = v_bias_ideal * v_bias_ideal
            
            if workTerm > 0.0:
                adjusted_v_bias_sq = max(0.0, v_bias_sq - workTerm)
                v_bias_actual = math.sqrt(adjusted_v_bias_sq)
                bias = (v_bias_actual if v_bias_ideal > 0 else -v_bias_actual) - forceVn_n
            else:
                bias = v_bias_ideal - forceVn_n
        else:
            bias = v_bias_ideal - forceVn_n
            
        # Solve constraint
        # lambda = -mass * (v_relative_n + bias)
        # effective mass for 1 particle is just mass
        lambd = -mass * (v_relative_n + bias)
        
        # Apply impulse
        impulse = lambd / mass
        v += impulse * n
        
        # 3. Integrate position
        y += v * dt
        
        # Calculate Kinetic Energy
        ke = 0.5 * mass * v * v
        pe = mass * 9.81 * y
        te = ke + pe
        
        energies.append(te)
        
    return energies

energies_a = simulate(use_component_b=False, steps=600)
energies_ab = simulate(use_component_b=True, steps=600)

print("Energy after 600 steps (No Component B):", energies_a[-1])
print("Energy difference (No Component B):", energies_a[-1] - energies_a[0])

print("Energy after 600 steps (With Component B):", energies_ab[-1])
print("Energy difference (With Component B):", energies_ab[-1] - energies_ab[0])

# Let's also check if it exploded or stabilized
print("\nMax Energy (No B):", max(energies_a))
print("Min Energy (No B):", min(energies_a))
print("Max Energy (With B):", max(energies_ab))
print("Min Energy (With B):", min(energies_ab))
