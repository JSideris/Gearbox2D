# Remaining Tasks

## Stability & Quality
- [ ] **Address Restitution Energy Conservation**: `StabilityTest.RestitutionEnergyConservation` is failing. Aggressive position correction may be injecting energy. Consider implementing a full KRB (Kinematic Restitution Balancing) "tax" on bounces to pay for position correction.
- [ ] **Tune Slopes & Inclines**: Verify that "Lean Pseudo-Friction" and current stability fixes behave correctly on steep slopes.
- [ ] **Solver Iterations**: Investigate the impact of iteration counts on deep stacks. If bottom objects still sink randomly, it may require more iterations or a more advanced PGS (Projected Gauss-Seidel) tuning.

## Refactoring & Maintenance
- [ ] **Move Constants to `constants.h`**: The following magic numbers should be moved to the constants file:
    - Slop (`0.004f`) in `ContactConstraint::preSolve`.
    - Position Bias Cap (`-30.0f`) in `ContactConstraint::preSolve`.
- [ ] **Formalize Pseudo-Friction**: The "Lean Pseudo-Friction" is currently a simplified implementation. Consider upgrading to a full 2x2 mass matrix solver for position correction if complex multi-body constraints become unstable.
- [ ] **Optimize Sleep Logic**: Further refine the relationship between `WAKE_MOVEMENT_THRESHOLD` and `SLEEP_VELOCITY_THRESHOLD` to prevent "sleep-wake loops" in micro-jitter scenarios.

## Testing
- [ ] **Programmatic Sinking Tests**: Expand `RegressionPileTest` to include more varied stacking scenarios (e.g., pyramids, mixed shapes).
