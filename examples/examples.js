
class Example{
	constructor({onInit, onTick, description, globalLines}){
		this.onInit = onInit;
		this.onTick = onTick;
		this.description = description;
		this.globalLines = globalLines || [];
	}

	init(gb2d, world){
		if(this.onInit) this.onInit(gb2d, world);
	}

	tick(gb2d, world, dt){
		if(this.onTick) this.onTick(gb2d, world, dt);
	}
}

let impulseTimer = 0;
let nextId = 1;

const examples = {
	// Basic Examples
	"hello-world": new Example({
		description: "A very simple demo showing how to set up a simulation, add an object, and rotate it.\n\nIt's best to imagine all values in SI units. But ultimately, it's arbitrary.",
		onInit: (gb2d, world)=>{
			// The first (and only required) argument is the ID.
			// All objects must have a unique ID.
			world.makeObject(1337, {
				x: 500, // X position.
				y: 500, // Y position.
				r: 0, // Rotation in radians.
				shape: gb2d.BOX, // shape.
				width: 300, // Box width when rotated at 0.
				height: 200, // Box height when rotated at 0.

				// This is the preferred way to have a perminently rotating object.
				rs: 0.02, // Rotation speed in radians per second.
				rotationalDamping: 0.0 // Rotational damping. Set to 0 to disable.
			});
		},
		onTick: (gb2d, world, dt)=>{
			// The rotation can also be set directly as follows.

			// Get the object with ID 1337 and rotate it.
			// world.objectsById[1337].r += dt / 20;
		}
	}),

	shapes: new Example({
		description: "A simple example featuring a few supported shapes: circle, box, another circle, AABB.",
		onInit: (gb2d, world)=>{
			let id = 1;
			let spacing = 200;

			world.makeObject(id++, {
				x: (id-1) * spacing,
				y: (id-1) * spacing,
				shape: gb2d.CIRCLE,
				radius: 50,
			});

			world.makeObject(id++, {
				x: (id-1) * spacing,
				y: (id-1) * spacing,
				r: Math.PI / 4,
				shape: gb2d.BOX,
				width: 80,
				height: 95,
			});

			world.makeObject(id++, {
				x: (id-1) * spacing,
				y: (id-1) * spacing,
				shape: gb2d.CIRCLE,
				radius: 100,
			});
			
			// Note that the rotation (r) doesn't do anything for AABBs.
			world.makeObject(id++, {
				x: (id-1) * spacing,
				y: (id-1) * spacing,
				r: Math.PI / 4,
				shape: gb2d.AABB,
				width: 100,
				height: 75,
			});
		}
	}),

	force: new Example({
		description: "Forces are used to apply acceleration to objects which scale inversely with the object's mass. All forces applied to an object are accumulated and applied in the next world step where they are reset. Persistant forces must be reapplied on each fixed update.\n\nIt's important to note that the change in velocity will be a function of the force vector, the object's mass, and the time step. If you need a specific instantaneous change in velocity, use an impulse instead.",
		onInit: (gb2d, world)=>{

			// This small circle will orbit the bigger one.
			world.makeObject(1, {
				x: 500,
				y: 250,
				vx: 500,
				mass: 0.1,
				shape: gb2d.CIRCLE,
				radius: 30,
				damping: 0.0
			});

			// For decoration, let's add a shape in the middle.
			world.makeObject(2, {
				x: 500,
				y: 500,
				shape: gb2d.CIRCLE,
				type: gb2d.SENSOR, // Sensors don't collide with other objects.
				radius: 100,
			});
		},

		onTick: (gb2d, world, dt)=>{
			let obj = world.objectsById[1];
			let center = world.objectsById[2];

			// Calculate the vector from the object to the center.
			let dx = center.x - obj.x;
			let dy = center.y - obj.y;

			// Calculate the magnitude of the vector.
			let magnitude = Math.sqrt(dx * dx + dy * dy);

			// Normalize the vector.
			dx /= magnitude;
			dy /= magnitude;

			// Define the fixed magnitude of the force.
			const forceMagnitude = 200;

			// Apply a force to the object.
			obj.applyForce(dx * forceMagnitude, dy * forceMagnitude);
		}
	}),

	impulse: new Example({
		description: "Impulses are used to apply a sudden change in momentum to an object. It's similar to a force, but modifies the object's velocity instantaneously, rather than acting as a persistant push. Momentum is defined as the product of velocity and mass. So the change in velocity is the impulse vector divided by the object's mass.\n\nImpulse is used for things like explosions, bullets, and other sudden changes in velocity. This is different from forces, which are typically applied over long periods of time.\n\nIn this example we have a heavy object and a light object, and we apply the same impulses to both on an interval.",
		
		globalLines: [
			"let impulseTimer = 0;",
		],

		onInit: (gb2d, world)=>{

			// This small circle will orbit the bigger one.
			world.makeObject(1, {
				x: 250,
				y: 500,
				shape: gb2d.CIRCLE,
				radius: 30,
				mass: 10,
				damping: 0.1
			});

			world.makeObject(2, {
				x: 750,
				y: 500,
				shape: gb2d.CIRCLE,
				radius: 60,
				mass: 20,
				damping: 0.1
			});
		},

		onTick: (gb2d, world, dt)=>{

			let obj1 = world.objectsById[1];
			let obj2 = world.objectsById[2];

			let oldTimer = impulseTimer;
			impulseTimer += dt * 5;

			let t1 = Math.floor(oldTimer) ;
			let t2 = Math.floor(impulseTimer);
			if(t1 != t2 && t2 % 2 == 0){
				let impulse = (500 - obj1.y) * 20;
				if(impulse < 50 && impulse > -50) impulse = 2000;

				obj1.applyImpulse(0, impulse);
				obj2.applyImpulse(0, impulse);
			}
			
		}
	}),

	gravity: new Example({
		description: "Gravity is a 2D acceleration vector that can be set on World objects. Gravity is automatically applied as a force to all objects in the world.\n\nOne of the cool things about this example in particular is that you can also see the influence of damping on the net force.",
		globalLines: ["let nextId = 1;"],
		onInit: (gb2d, world)=>{
			// Mind you that while we like to think of things in terms of SI units, the scale is arbitrary.
			// In this case, the canvas is 1000x1000 units. So it won't be very exciting to just apply a 10 m/s^2 gravity.
			world.setGravity(0, 1000);

			// Objects will be created in the tick function.
		},
		onTick: (gb2d, world, dt)=>{
			if(Math.random() < 0.05){
				let m = 1 + Math.random() * 20;
				world.makeObject(nextId++, {
					x: 0,
					y: 750,
					vx: 100 + Math.random() * 500,
					vy: -400 - Math.random() * 400,
					shape: gb2d.CIRCLE,
					type: gb2d.SENSOR,
					radius: 2 + m * 2,

					// Remember, gravity is an acceleration vector. So it affects all masses equally. 
					// This mass was selected to make the force vectors look good for the demo.
					mass: m / 50, 
				});

				// Scan for objects that are out of bounds and remove them.
				// Another way to do this would be to use collision events.
				let objectCount = world.objectCount;
				let toRemove = [];

				world.iterateObjects(obj=>{
					
					if(obj.y > 1050){
						// Don't remove stuff in the middle of the loop!!!
						toRemove.push(obj);
					}
				});

				// Now remove everything we found that's out of bounds.
				for(let obj of toRemove){
					world.removeObject(obj.id);
				}
			}
		}
	}),
	// collisions: new Example({
	// 	description
	// }),

	// Load Tests
	particles: new Example({
		description: "A load test featuring 10 thousand particles. No collisions. Note that a significant FPS cost is the debug rendering itself. On an Intel Core i9-9900KF this was benchmarked with an average step time of about 6.5-8.5 ms, if the weather is good.",
		onInit: (gb2d, world)=>{
			for(let i = 0; i < 10000; i++){

				world.makeObject(i+1, {
					x: Math.random() * 1000,
					y: Math.random() * 1000,
					vx: Math.random() * 100 - 50,
					vy: Math.random() * 100 - 50,
					// Disable damping so they'll move forever.
					damping: 0,
					shape: gb2d.POINT,
				});
			}
		},
		onTick: (gb2d, world, dt)=>{

			// Make the objects bounce off the walls.
			world.iterateObjects(obj => {
				if(obj.x < 0){
					obj.x = 0;
					obj.vx = -obj.vx;
				}
				if(obj.x > 1000){
					obj.x = 1000;
					obj.vx = -obj.vx;
				}
				if(obj.y < 0){
					obj.y = 0;
					obj.vy = -obj.vy;
				}
				if(obj.y > 1000){
					obj.y = 1000;
					obj.vy = -obj.vy;
				}
			});
		}
	})
}

export default examples;