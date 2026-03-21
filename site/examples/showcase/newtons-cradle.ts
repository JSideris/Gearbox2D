import Example from "../engine-wrapper.js";
import gearbox from "gearbox2d";

export const newtonsCradleExample = new Example({
	name: "Newton's Cradle",
	key: "newtons-cradle",
	description: [
		"A classic demonstration of conservation of momentum and energy. This simulation shows how kinetic energy and momentum are transferred through a series of suspended spheres.",
		"### Features",
		"- **Elastic Collisions**: Restitution is set to `1.0` to ensure near-perfect energy conservation during impacts.",
		"- **Distance Constraints**: Each sphere is suspended by a `DistanceJoint` connected to a fixed anchor point.",
		"- **Low Friction**: Friction is set to zero to allow the pendulum motion to persist for a long duration.",
		"The first ball is released from an offset to initiate the chain reaction. Click **Reset** to restart the sequence.",
	].join("\n\n"),
	onInit: (world) => {
		world.clear();
		world.setGravity(0, 9.8);

		// Hide AABBs for a cleaner look
		gearbox.debug.showAabbs = false;

		const count = 5;
		const radius = 0.4;
		const startY = 2;
		const length = 4;
		const cx = 5;

		for (let i = 0; i < count; i++) {
			const x = cx + (i - (count - 1) / 2) * radius * 2.01;
			const anchorId = 1000 + i;
			const ballId = 2000 + i;

			// Create anchor (static body)
			const anchor = world.createBody({
				id: anchorId,
				x: x,
				y: startY,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "#555",
			});
			anchor.createFixture({
				id: anchorId,
				shape: gearbox.shapes.BOX,
				width: 0.2,
				height: 0.2,
				maskBits: 0, // Collide with nothing
			});

			// Create ball
			// Offset the first ball to start the motion
			const ballX = i === 0 ? x - 3 : x;
			const ballY = i === 0 ? startY + Math.sqrt(length * length - 3 * 3) : startY + length;

			const ball = world.createBody({
				id: ballId,
				x: ballX,
				y: ballY,
				mass: 1.0,
				color: i === 0 || i === count - 1 ? "#a855f7" : "#00f2ff",
				linearDamping: 0.0,
				angularDamping: 0.0,
			});

			ball.createFixture({
				id: ballId,
				shape: gearbox.shapes.CIRCLE,
				radius: radius,
				restitution: 1.0,
				sFriction: 0,
				kFriction: 0,
			});

			// Connect with distance joint
			world.createDistanceJoint(anchor, ball, {
				id: 3000 + i,
				length: length,
				anchorA: { x: 0, y: 0 },
				anchorB: { x: 0, y: 0 },
			});
		}
	},
});
