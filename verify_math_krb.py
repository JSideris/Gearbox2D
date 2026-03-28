import math

def simulate(mode="new", steps=20, dt=1.0/60.0):
    L = 10.0
    m = 1.0
    g = -9.81
    beta = 0.2
    
    y = -9.5
    v = 0.0
    
    def get_energy(y, v):
        ke = 0.5 * m * v**2
        pe = m * abs(g) * y
        return ke + pe
    
    energies = []
    
    for i in range(steps):
        f_ext = m * g
        a_ext = f_ext / m
        v_force = a_ext * dt
        
        v += v_force
        
        n = 1.0 if y > 0 else -1.0
        d = abs(y)
        C = d - L
        
        forceVn = v_force * n
        v_bias_ideal = beta * C / dt
        expectedDisplacement = v_bias_ideal * dt
        accVn = forceVn / dt
        workTerm = 2.0 * accVn * expectedDisplacement
        
        v_bias_sq = v_bias_ideal**2
        
        if mode == "old":
            if workTerm > 0.0:
                adjusted_v_bias_sq = max(0.0, v_bias_sq - workTerm)
                v_bias_actual = math.sqrt(adjusted_v_bias_sq)
                bias = (v_bias_actual if v_bias_ideal > 0 else -v_bias_actual) - forceVn
            else:
                bias = v_bias_ideal - forceVn
        elif mode == "new":
            adjusted_v_bias_sq = max(0.0, v_bias_sq - workTerm)
            v_bias_actual = math.sqrt(adjusted_v_bias_sq)
            bias = (v_bias_actual if v_bias_ideal > 0 else -v_bias_actual) - forceVn
        else:
            bias = v_bias_ideal
            
        relative_vn = v * n - forceVn
        eff_mass = m
        lambda_impulse = -eff_mass * (relative_vn + bias)
        
        v += (lambda_impulse * n) / m
        y += v * dt
        
        energies.append(get_energy(y, v))
        
    return energies

old_e = simulate("old")
new_e = simulate("new")

print("Step | Old Energy | New Energy | Diff")
print("-" * 45)
for i in range(len(old_e)):
    print(f"{i:4d} | {old_e[i]:10.4f} | {new_e[i]:10.4f} | {new_e[i]-old_e[i]:.4f}")
