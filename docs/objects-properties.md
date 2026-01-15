# Object Properties

## Mass and Inertia

In Gearbox2D, the mass and moment of inertia of a body are primarily determined by its fixtures. Each fixture has a `density` property, and the engine calculates the mass and inertia based on the fixture's shape and its distance from the body's center of mass.

### Manual Mass Override

You can manually set the mass of a body by providing a `mass` value in the body options or by calling `setMass(m)`. 

When a manual mass is set:
- The body is flagged as having a **Fixed Mass**.
- The engine will respect this total mass value exactly.
- The fixtures are still used to determine the **distribution** of mass. The engine will calculate the center of mass and the moment of inertia based on the fixtures, but it will scale the final inertia to match your manually specified total mass.

This allows you to easily control the total weight of an object (e.g., "this car weighs 1500kg") while still benefiting from realistic physical rotations based on how its fixtures are arranged.

### Automatic Mass Calculation

If you do not specify a mass for the body (or set it to `0`), the engine will automatically calculate the body's total mass as the sum of the masses of all its fixtures. In this mode, changing a fixture's density or size will automatically update the body's total mass.
