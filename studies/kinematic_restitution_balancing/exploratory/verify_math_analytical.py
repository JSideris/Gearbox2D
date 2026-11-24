import math

def verify_math_step():
    # Parameters
    dt = 1.0 / 60.0
    beta = 0.2
    mass = 1.0
    
    # State: A mass is attached to a joint, and the joint is stretched by C
    C = 0.1 # 10cm stretch
    gravity_y = -9.81
    
    # Anchor at (0,0), Body at (0, -L-C)
    # Normal points from A to B: (0, -1)
    ny = -1.0
    
    # Force velocity of body
    forceVy = gravity_y * dt
    
    # forceVn = forceV . n
    forceVn = forceVy * ny
    
    # 1. Ideal Baumgarte
    v_bias_ideal = beta * C / dt
    expectedDisplacement = v_bias_ideal * dt
    
    # Work done against gravity
    # accVn is acceleration along normal
    accVn = forceVn / dt 
    workTerm = 2.0 * accVn * expectedDisplacement
    
    # Calculate actual bias squared
    v_bias_sq = v_bias_ideal**2
    if workTerm > 0.0:
        adjusted_v_bias_sq = max(0.0, v_bias_sq - workTerm)
        v_bias_actual = math.sqrt(adjusted_v_bias_sq)
    else:
        v_bias_actual = v_bias_ideal
    
    # Energy comparison
    ideal_kinetic_energy = 0.5 * mass * v_bias_sq
    actual_kinetic_energy = 0.5 * mass * v_bias_actual**2
    
    # The work done against gravity is equivalent to the potential energy gained
    # The constraint moves the body by `expectedDisplacement` in the `-normal` direction
    # Normal is (0, -1), so `-normal` is (0, 1), which is UP.
    # Moving UP against gravity (which is -9.81) increases potential energy by m * g * h
    # where g = 9.81 and h = expectedDisplacement
    pe_gained = mass * abs(gravity_y) * expectedDisplacement
    
    print(f"Stretch C: {C}")
    print(f"forceVn: {forceVn:.4f}")
    print(f"accVn: {accVn:.4f}")
    print(f"workTerm: {workTerm:.4f}")
    print(f"Ideal Bias Velocity: {v_bias_ideal:.4f}")
    print(f"Actual Bias Velocity: {v_bias_actual:.4f}")
    print(f"Ideal Kinetic Energy: {ideal_kinetic_energy:.4f}")
    print(f"Actual Kinetic Energy: {actual_kinetic_energy:.4f}")
    print(f"Potential Energy Gained: {pe_gained:.4f}")
    
    # Check conservation
    energy_diff = ideal_kinetic_energy - actual_kinetic_energy
    print(f"Kinetic Energy Reduced By: {energy_diff:.4f}")
    print(f"Match with PE Gained: {'YES' if abs(energy_diff - pe_gained) < 1e-6 else 'NO'}")

verify_math_step()
