import Example from "../engine-wrapper.js";
import gearbox from "gearbox2d";

let nextId = 1;
let engineHub = null;

export const gnomeOmegaExample = new Example({
	name: "Gnome Omega Engine",
	key: "gnome-omega",
	description: [
		"A detailed simulation of a **Gnome Omega** rotary engine. In this classic radial design, the crankshaft remains stationary while the entire cylinder block rotates around it.",
		"### Features",
		"- **Stationary Crankshaft**: A fixed pivot point (red) offset from the center.",
		"- **Rotating Crankcase**: The main grey hub that carries the cylinders.",
		"- **Weld Constraints**: Cylinders are 'welded' to the hub using a combination of `HingeJoint` and `DistanceJoint` for maximum stability.",
		"- **Reciprocating Motion**: Pistons and connecting rods are synchronized via `HingeJoint` constraints.",
		"- **Collision Masks**: Bitwise filtering ensures pistons only interact with their respective cylinder walls.",
		"Click **Reset** if the simulation becomes unstable due to extreme angular velocities.",
	].join("\n\n"),
	onInit: (world) => {
		world.clear();
		gearbox.debug.showAabbs = false;
		nextId = 1;
		engineHub = null;

		const cx = 5;
		const cy = 4.5;
		const crankOffset = 0.8;
		const numCylinders = 7;
		const rodLength = 2.5;

		// Dedicated collision categories to prevent unintended interactions
		const CAT_FIXED = 0x100;
		const CAT_HUB = 0x200;
		const CAT_CYLINDER = 0x400;
		const CAT_PISTON = 0x800;
		const CAT_ROD = 0x1000;

		// Stationary center of the rotation
		const hubAnchorId = nextId++;
		const hubAnchor = world.createBody({
			id: hubAnchorId,
			x: cx,
			y: cy,
			type: gearbox.bodyTypes.FIXED_OBJECT,
			color: "#888",
		});
		hubAnchor.createFixture({
			id: hubAnchorId,
			shape: gearbox.shapes.CIRCLE,
			radius: 0.15,
			categoryBits: CAT_FIXED,
			maskBits: 0, // Collide with nothing
		});

		// The fixed crank pin (stationary throw)
		const crankPinId = nextId++;
		const crankPin = world.createBody({
			id: crankPinId,
			x: cx,
			y: cy + crankOffset,
			type: gearbox.bodyTypes.FIXED_OBJECT,
			color: "#ff4444",
		});
		crankPin.createFixture({
			id: crankPinId,
			shape: gearbox.shapes.CIRCLE,
			radius: 0.1,
			categoryBits: CAT_FIXED,
			maskBits: 0, // Collide with nothing
		});

		// The rotating hub (crankcase)
		const engineHubId = nextId++;
		engineHub = world.createBody({
			id: engineHubId,
			x: cx,
			y: cy,
			mass: 50.0, // Increased mass for stability
			color: "#aaa",
		});
		engineHub.createFixture({
			id: engineHubId,
			shape: gearbox.shapes.CIRCLE,
			radius: 0.8,
			categoryBits: CAT_HUB,
			maskBits: 0, // Collide with nothing
			restitution: 0,
		});

		world.createHingeJoint(nextId++, hubAnchor, engineHub, {
			worldAnchor: { x: cx, y: cy },
		});

		for (let i = 0; i < numCylinders; i++) {
			const angle = (i / numCylinders) * Math.PI * 2;
			const cos = Math.cos(angle);
			const sin = Math.sin(angle);

			// Gearbox2D Box rotation: 0 rad means Y-axis is (0, 1).
			// To point Y-axis along (cos, sin), we need r = angle - PI/2.
			const orientation = angle - Math.PI / 2;

			// Cylinder Walls
			const wallDist = 2.6;
			const wallWidth = 0.28;
			const wallHeight = 2.5;
			const wallGap = 1.0; // Distance between wall CENTERS
			// Inner gap = wallGap - wallWidth = 1.0 - 0.2 = 0.8

			const createWall = (side) => {
				const wallX = cx + cos * wallDist + -sin * ((side * wallGap) / 2);
				const wallY = cy + sin * wallDist + cos * ((side * wallGap) / 2);

				const wallId = nextId++;
				const wall = world.createBody({
					id: wallId,
					x: wallX,
					y: wallY,
					r: orientation,
					mass: 1.0,
					color: "#bbb",
				});
				wall.createFixture({
					id: wallId,
					shape: gearbox.shapes.BOX,
					width: wallWidth,
					height: wallHeight,
					categoryBits: CAT_CYLINDER,
					maskBits: CAT_PISTON, // Only collide with pistons
					restitution: 0,
					sFriction: 0,
					kFriction: 0,
				});

				// Weld wall to hub using one hinge and one distance joint.
				// Using a distance joint instead of a second hinge avoids over-constraining the system,
				// which significantly improves stability.
				const wAnchor1 = wall.localToWorld({ x: 0, y: -wallHeight / 2 });
				const wAnchor2 = wall.localToWorld({ x: 0, y: wallHeight / 2 });
				world.createHingeJoint(nextId++, engineHub, wall, { worldAnchor: wAnchor1 });
				world.createDistanceJoint(nextId++, engineHub, wall, { worldAnchor: wAnchor2 });
			};

			createWall(-1);
			createWall(1);

			// Precise piston distance calculation for stable start
			const pistonDist =
				crankOffset * Math.sin(angle) +
				Math.sqrt(rodLength * rodLength - Math.pow(crankOffset * Math.cos(angle), 2));

			const pistonX = cx + cos * pistonDist;
			const pistonY = cy + sin * pistonDist;
			const pistonId = nextId++;
			const piston = world.createBody({
				id: pistonId,
				x: pistonX,
				y: pistonY,
				r: orientation,
				mass: 0.5,
				color: "#ddd",
			});
			piston.createFixture({
				id: pistonId,
				shape: gearbox.shapes.BOX,
				width: 0.7,
				height: 1.0, // Piston width (0.7) is now less than inner gap (0.8)
				categoryBits: CAT_PISTON,
				maskBits: CAT_CYLINDER, // Only collide with cylinder walls
				restitution: 0,
				sFriction: 0,
				kFriction: 0,
			});

			const rodX = (cx + pistonX) / 2;
			const rodY = (cy + crankOffset + pistonY) / 2;
			// Rotate rod to point from crank pin to piston
			const rodAngle = Math.atan2(pistonY - (cy + crankOffset), pistonX - cx) - Math.PI / 2;

			const rodId = nextId++;
			const rod = world.createBody({ id: rodId, x: rodX, y: rodY, r: rodAngle, mass: 0.2, color: "#fff" });
			rod.createFixture({
				id: rodId,
				shape: gearbox.shapes.BOX,
				width: 0.15,
				height: rodLength,
				categoryBits: CAT_ROD,
				maskBits: 0, // Rods are non-colliding
				restitution: 0,
			});

			// Hinge: Rod to Crank Pin
			world.createHingeJoint(nextId++, rod, crankPin, {
				anchorA: { x: 0, y: -rodLength / 2 },
				anchorB: { x: 0, y: 0 },
			});

			// Hinge: Rod to Piston
			world.createHingeJoint(nextId++, rod, piston, {
				anchorA: { x: 0, y: rodLength / 2 },
				anchorB: { x: 0, y: 0 },
			});
		}

		world.setGravity(0, 0);
		engineHub.rs = 2.0; // Start with a gentle initial rotation
	},
	onTick: (world, dt) => {
		if (engineHub) {
			// Apply a gentle impulse to maintain rotation
			if (Math.abs(engineHub.rs) < 0.9) {
				engineHub.applyAngularImpulse(5);
			}
		}
	},
});
