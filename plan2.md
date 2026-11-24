# Solver stability follow-up

## Kinematic Restitution Balancing

KRB is implemented and enabled by default for each world. For bouncing contacts it compensates for force-induced velocity during the step and adjusts rebound speed to account for stabilization displacement. The [whitepaper](studies/kinematic_restitution_balancing/KRB_Whitepaper.md) describes the contact and joint rules, measurements, and limitations. The [research build instructions](readme.md#research-builds-krb-ablation) explain how to compare KRB on and off.

Regression coverage includes [restitution energy conservation](cpp/tests/stability_tests.cpp), the [energy harness](cpp/tests/energy-harness_tests.cpp), and a [per-world KRB comparison](cpp/tests/krb-runtime-ablation_tests.cpp).

## Remaining investigations

- Measure slipping and resting drift on steep inclines. Record the slope, friction, and timestep for any reproducible failure.
- Extend pile coverage with mixed shapes and pyramids. Measure penetration and drift at fixed solver settings.
- Check whether apparent resting jitter repeatedly wakes a sleeping body. Capture the sleep and wake transitions in a minimal test before changing thresholds.

See the [project roadmap](plan.md) for reported showcase issues and follow-up work.
