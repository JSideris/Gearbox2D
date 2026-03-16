# Coordinate System and Units

Gearbox2D uses a 2D Cartesian coordinate system and is fundamentally **unitless**. This means the engine does not care if a unit represents a meter, a kilometer, or a pixel. However, due to floating-point precision and fixed internal constants, there are significant practical considerations for stability and performance.

## The Coordinate System

- **X-Axis**: Increases to the right.
- **Y-Axis**: Increases upwards.
- **Rotation**: Measured in **radians**. Positive rotation is **counter-clockwise**.
- **Origin**: (0, 0) is the default reference point for the world.

## Recommended Units (MKS)

For the best numerical stability, it is strongly recommended to use the **MKS (Meters-Kilogram-Seconds)** system:
- **Length**: Meters (m)
- **Mass**: Kilograms (kg)
- **Time**: Seconds (s)

### Why MKS?
The engine is tuned for objects roughly between **0.1 and 10.0 units** in size. If you use pixels as units (where a typical character might be 64 or 128 units tall), the physics solver may struggle with:
1.  **Penetration Slop**: The engine allows a small overlap (`PENETRATION_SLOP = 0.008`) to prevent jitter. If your objects are very small (e.g., 0.01 units), this slop becomes a significant percentage of their size.
2.  **Stability**: Large coordinates and velocities can lead to floating-point precision loss.

## Best Practices for Scaling

### 1. Object Sizes
- **Dynamic Bodies**: Keep between 0.1 and 10 units. A human-sized character should be ~1.8 units tall.
- **Static Bodies**: Can be much larger (e.g., a 500-unit ground plane), but avoid extreme aspect ratios or scales compared to dynamic objects.

### 2. Mass and Density
- Aim for a **Density** around 1.0. 
- Avoid extremely light objects (mass < 0.01) or extremely heavy objects (mass > 1000) interacting with each other, as this creates a high mass ratio that can make the solver converge slowly or become unstable.

### 3. Simulation Speed
- The `World::step(dt)` function expects `dt` in seconds (e.g., `1.0 / 60.0`). 
- Avoid using very large or very small time steps.

## Multi-Scale Simulations

If your simulation operates on vastly different scales (e.g., a solar system or a microscopic environment):

- **Planetary Scale**: Instead of using actual kilometers, scale your world down so that your primary actors are within the "stable range" (0.1 - 10 units). You can apply a visual scaling factor in your renderer.
- **Microscopic Scale**: Scale up your units. If you are simulating microbes, 1 unit could represent 1 micrometer.

## Summary Table

| Property | Recommended Unit | Convention |
| :--- | :--- | :--- |
| Position | Meters | X right, Y up |
| Angle | Radians | Counter-clockwise |
| Mass | Kilograms | Positive non-zero |
| Velocity | Meters / Second | |
| Angular Velocity | Radians / Second | |
| Force | Newtons (kg·m/s²) | |
| Gravity | Meters / Second² | (0, -9.8) for Earth-like |

> [!TIP]
> Use a conversion factor (e.g., `pixels_per_meter = 30`) when translating between physics units and your rendering engine. Only convert to pixels in your draw call; keep the internal logic in physics units.
