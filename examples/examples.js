import gb2d from '../dist/js/gb2d.js';

/**
 * @callback OnInitCallback
 * @param {gb2d.World} world - The physics world
 * @returns {void}
 */

/**
 * @callback OnTickCallback
 * @param {gb2d.World} world - The physics world
 * @param {number} dt - Delta time
 * @returns {void}
 */

class Example{
	/**
	 * @param {object} options - Constructor options.
	 * @param {OnInitCallback} [options.onInit] - Optional. Called when the example is initialized.
	 * @param {OnTickCallback} [options.onTick] - Optional. Called on each simulation tick.
	 * @param {string} options.description - A description of the example.
	 * @param {string} options.name - The display name of the example.
	 * @param {string} options.key - A unique key for the example (e.g., for URLs).
	 * @param {string[]} [options.globalLines] - Optional. Lines of code to be executed in the global scope for this example.
	 */
	constructor({
		onInit, 
		onTick, 
		description, 
		name, 
		key, 
		globalLines
	}){
		/** @type {OnInitCallback|undefined} */
		this.onInit = onInit;
		/** @type {OnTickCallback|undefined} */
		this.onTick = onTick;
		/** @type {string} */
		this.description = description;
		/** @type {string} */
		this.name = name;
		/** @type {string} */
		this.key = key;
		/** @type {string[]} */
		this.globalLines = globalLines || [];
	}

	/**
	 * @function
	 * @param {gb2d.World} world
	 */
	init(world){
		if(this.onInit) this.onInit(world);
	}

	/**
	 * @function
	 * @param {gb2d.World} world
	 * @param {number} dt
	 */
	tick(world, dt){
		if(this.onTick) this.onTick(world, dt);
	}
}

let simulationTime = 0;
let impulseTimer = 0;
let nextId = 1;

const examples = [
	
	{ // General
		name: "General",
		examples: [
			new Example({ // Hello World
				name: "Hello World",
				key: "hello-world",
				description: "A very simple demo showing how to set up a simulation, add an object, and rotate it.\n\nIt's best to imagine all values in SI units. But ultimately, it's arbitrary.",
				onInit: (world)=>{
					// The first (and only required) argument is the ID.
					// All objects must have a unique ID.
					world.makeObject(1337, {
						x: 5, // X position.
						y: 5, // Y position.
						r: 0, // Rotation in radians.
						shape: gb2d.shapes.BOX, // shape.
						width: 3, // Box width of 3 m when rotated at 0.
						height: 2, // Box height of 2 m when rotated at 0.

						// This is the preferred way to have a perminently rotating object.
						rs: 1, // Rotation speed in radians per second.
						rotationalDamping: 0.0 // Rotational damping. Set to 0 to disable.
					});
				},
				onTick: (world, dt)=>{
					// The rotation can also be set directly as follows.

					// Get the object with ID 1337 and rotate it.
					// world.objectsById[1337].r += dt / 20;
				}
			}),

			new Example({ // Shapes
				name: "Shapes",
				key: "shapes",
				description: "A simple example featuring a few supported shapes: circle, box, point, AABB.",
				onInit: (world)=>{
					let id = 1;
					let spacing = 2;

					world.makeObject(id++, {
						x: (id-1) * spacing,
						y: (id-1) * spacing,
						r: Math.PI / 4,
						shape: gb2d.shapes.CIRCLE,
						radius: .5,
					});

					world.makeObject(id++, {
						x: (id-1) * spacing,
						y: (id-1) * spacing,
						r: Math.PI / 4,
						shape: gb2d.shapes.BOX,
						width: .80,
						height: .95,
					});

					world.makeObject(id++, {
						x: (id-1) * spacing,
						y: (id-1) * spacing,
						shape: gb2d.shapes.POINT,
					});
					
					// Note that the rotation (r) doesn't do anything for AABBs.
					world.makeObject(id++, {
						x: (id-1) * spacing,
						y: (id-1) * spacing,
						r: Math.PI / 4,
						shape: gb2d.shapes.AABB,
						width: 1.00,
						height: .75,
					});
				}
			}),

			new Example({ // Force
				name: "Force",
				key: "force",
				description: "Forces are used to apply acceleration to objects which scale inversely with the object's mass. All forces applied to an object are accumulated and applied in the next world step where they are reset. Persistant forces must be reapplied on each fixed update.\n\nIt's important to note that the change in velocity will be a function of the force vector, the object's mass, and the time step. If you need a specific instantaneous change in velocity, use an impulse instead.",
				onInit: (world)=>{

					// This small circle will orbit the bigger one.
					world.makeObject(1, {
						x: 5.00,
						y: 2.50,
						vx: 5.00,
						r: Math.PI / 2 * Math.random(),
						rs: 5,
						mass: 0.1, // 100g
						shape: gb2d.shapes.CIRCLE,
						radius: .30,
						angularDamping: 0.0, 
						linearDamping: 0.0 // Set to 0 to prevent the orbit from slowing down.
					});

					// For decoration, let's add a shape in the middle.
					world.makeObject(2, {
						x: 5.00,
						y: 5.00,
						r: Math.PI / 2 * Math.random(),
						rs: .1,
						shape: gb2d.shapes.CIRCLE,
						type: gb2d.bodyTypes.SENSOR, // Sensors don't collide with other objects.
						radius: 1.00,
						angularDamping: 0.0, 
					});
				},

				onTick: (world, dt)=>{
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
					const forceMagnitude = 2.00;

					// Apply a force to the object.
					obj.applyForce(dx * forceMagnitude, dy * forceMagnitude);
				}
			}),

			new Example({ // Impulse
				name: "Impulse",
				key: "impulse",
				description: "Impulses are used to apply a sudden change in momentum to an object. It's similar to a force, but modifies the object's velocity instantaneously, rather than acting as a persistant push. Momentum is defined as the product of velocity and mass. So the change in velocity is the impulse vector divided by the object's mass.\n\nImpulse is used for things like explosions, bullets, and other sudden changes in velocity. This is different from forces, which are typically applied over long periods of time.\n\nIn this example we have a heavy object and a light object, and we apply the same impulses to both on an interval.",
				
				globalLines: [
					"let impulseTimer = 0;",
				],

				onInit: (world)=>{

					// This small circle will orbit the bigger one.
					world.makeObject(1, {
						x: 2.50,
						y: 5.00,
						r: Math.PI / 2 * Math.random(),
						shape: gb2d.shapes.CIRCLE,
						radius: .30,
						mass: 1,
						damping: 0.1
					});

					world.makeObject(2, {
						x: 7.50,
						y: 5.00,
						r: Math.PI / 2 * Math.random(),
						shape: gb2d.shapes.CIRCLE,
						radius: .60,
						mass: 2,
						damping: 0.02
					});
				},

				onTick: (world, dt)=>{

					let obj1 = world.objectsById[1];
					let obj2 = world.objectsById[2];

					let oldTimer = impulseTimer;
					impulseTimer += dt * 5;

					let t1 = Math.floor(oldTimer) ;
					let t2 = Math.floor(impulseTimer);
					if(t1 != t2 && t2 % 2 == 0){
						let impulse = (5.00 - obj1.y) * .20;
						if(impulse < .050 && impulse > -.050) impulse = 2.000;

						obj1.applyImpulse(0, impulse);
						obj2.applyImpulse(0, impulse);
					}
					
				}
			}),

			new Example({ // Gravity
				name: "Gravity",
				key: "gravity",
				description: "Gravity is a 2D acceleration vector that can be set on World objects. Gravity is automatically applied as a force to all objects in the world.\n\nOne of the cool things about this example in particular is that you can also see the influence of damping on the net force.",
				globalLines: ["let nextId = 1;"],
				onInit: (world)=>{
					// Mind you that while we like to think of things in terms of SI units, the scale is arbitrary.
					// In this case, the canvas is 1000x1000 units. So it won't be very exciting to just apply a 10 m/s^2 gravity.
					world.setGravity(0, 10);

					// Objects will be created in the tick function.
				},
				onTick: (world, dt)=>{
					if(Math.random() < 0.05){
						let m = .1 + Math.random() * .4;
						world.makeObject(nextId++, {
							x: 0,
							y: 7.50,
							r: Math.PI / 2 * Math.random(),
							rs: (Math.random() - 0.5) * 5.00,
							vx: 1.00 + Math.random() * 5.00,
							vy: -4.00 - Math.random() * 4.00,
							shape: gb2d.shapes.CIRCLE,
							type: gb2d.SENSOR,
							radius: .2 + m * .2,

							// Remember, gravity is an acceleration vector. So it affects all masses equally. 
							// This mass was selected to make the force vectors look good for the demo.
							mass: m,
						});

						// Scan for objects that are out of bounds and remove them.
						// Another way to do this would be to use collision events.
						let objectCount = world.objectCount;
						let toRemove = [];

						world.iterateObjects(obj=>{
							
							if(obj.y > 10.50){
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

			new Example({ // Bounce
				name: "Bounce",
				key: "bounce",
				description: "",
				onInit: (world)=>{
					// Gravity
					world.setGravity(0, 10);

					// Walls
					world.makeObject(1, {
						x: 5,
						y: 0,
						shape: gb2d.shapes.AABB,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: 11,
						height: 2,
						
					});
					world.makeObject(2, {
						x: 5,
						y: 10,
						shape: gb2d.shapes.AABB,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: 11,
						height: 2,
					});
					world.makeObject(3, {
						x: 0,
						y: 5,
						shape: gb2d.shapes.AABB,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: 2,
						height: 11,
					});
					world.makeObject(4, {
						x: 10,
						y: 5,
						shape: gb2d.shapes.AABB,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: 2,
						height: 11,
					});

					// Bouncy Ball
					world.makeObject(5, {
						x: 5,
						y: 2,
						vx: 3, 
						r: Math.PI / 2 * Math.random(),
						shape: gb2d.shapes.CIRCLE,
						type: gb2d.bodyTypes.RIGID_BODY,
						radius: .75,
						mass: 0.5,
						linearDamping: 0.0,

						// The most important part. 100% bouncy.
						restitution: 1,
					});
				},
				onTick: (world, dt)=>{
					// The engine does all the work. Nothing to do here!
				},
			}),
			
			new Example({ // Collisions
				name: "Collisions",
				key: "collisions",
				description: [
					"Collisions on objects are enabled by default. For more realistic collisions, set the mass of objects. Make sure the object type is set to RIGID_BODY.",
					"Note that while gb2d is in beta, glitches may be observed."
				].join("\n\n"),
				globalLines: ["let nextId = 1;"],
				onInit: (world)=>{
					world.setGravity(0, 10);

					// Objects will be created in the tick function.
				},
				// Once collisions are a bit more stable, the number of colliding objects can be doubled.
				onTick: (world, dt)=>{
					if(Math.random() < 0.05){
						let m = .1 + Math.random() * .4;
						let dir = 1;
						if(Math.random() < 0.5) dir = -1;

						let r = .2 + m*m * .8;
						let h = 0.1 + Math.random() * (r - 0.1);
						let w = r * r / h;
						// let isBox = false; //Math.random() < 0.5;
						let isBox = Math.random() < 0.5;
						world.makeObject(nextId++, {
							x: 5.00 - dir * 5.00,
							y: 7.50,
							r: Math.PI / 2 * Math.random(),
							rs: (Math.random() - 0.5) * 5.00,
							vx: (2.00 + Math.random() * 5.00) * dir,
							vy: -6.00 - Math.random() * 1.00,
							shape: isBox ? gb2d.shapes.BOX : gb2d.shapes.CIRCLE,
							type: gb2d.bodyTypes.RIGID_BODY,
							radius: isBox ? w : r,
							// width: isBox ? r * 2 : 0,
							height: isBox ? h : 0,
							mass: m, 
						});

						// Scan for objects that are out of bounds and remove them.
						// Another way to do this would be to use collision events.
						let objectCount = world.objectCount;
						let toRemove = [];

						world.iterateObjects(obj=>{
							
							if(obj.y > 10.50){
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

			new Example({ // Friction
				name: "Friction",
				key: "friction",
				description: [
					"Friction is applied as the last step of collision resolution. It deals with static and dynamic friction, applied as impulses at the point of contact, given the relative tangential velocity at that point. Take note of the blue impulse vector on the platforms wich are present when dynamic friction is being applied.",
					"Line 1: A circle spinning counterclockwise angular momentum switches to clockwise due to friction, then continues to roll.",
					"Line 2: A spinning circle with no linear momentum transfers momentum from angular to lienar due to friciton, then continues to roll.",
					"Line 3: A box slides across the platform and grinds to a halt due to friction.",
					"Line 4: Two boxes slide down a ramp. The left box has a high static friction, and eventually stops. The right box has no static friction and continues to slide as dynamic friction and gravitational forces dominate.",
				].join("\n\n"),
				onInit: (world)=>{

					world.setGravity(0, 10);

					let id = 1;
					// Platforms.
					for(; id <= 3; id++){
						world.makeObject(id, {
							x: 4.5,
							y: 2.5 * id - 0.5,
							shape: gb2d.shapes.AABB,
							type: gb2d.bodyTypes.FIXED_OBJECT,
							width: 9.0,
							height: 1,
							mass: 1,
						});
					}

					// One more (tilted) platform for static friction.
					world.makeObject(id++, {
						x: 4.5,
						y: 9.7,
						r: 0.1,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: 9.0,
						height: 1,
						mass: 1,
					});

					// Linear to angular rolling object.
					world.makeObject(id++, {
						x: 0,
						y: 1.0,
						vx: 5,
						rs: -5,
						kFriction: 0.2,
						sFriction: 0.5,
						shape: gb2d.shapes.CIRCLE,
						type: gb2d.bodyTypes.RIGID_BODY,
						radius: 0.5,
						mass: 0.5
					});

					// Angular to linear rolling object.
					world.makeObject(id++, {
						x: 0.5,
						y: 3.5,
						rs: 15,
						kFriction: 0.2,
						sFriction: 0.5,
						shape: gb2d.shapes.CIRCLE,
						type: gb2d.bodyTypes.RIGID_BODY,
						radius: 0.5,
						mass: 0.5
					});

					// Sliding box grinds to a halt.
					world.makeObject(id++, {
						x: 0.5,
						y: 6,
						vx: 7,
						kFriction: 0.5,
						sFriction: 0.5,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.RIGID_BODY,
						width: 1,
						height: 1,
						mass: 0.5
					});

					// Sliding box stops due to static friction.
					world.makeObject(id++, {
						x: 0.5,
						y: 8.0,
						vx: 0.5,
						kFriction: 0.7,
						sFriction: 0.7,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.RIGID_BODY,
						width: 1,
						height: .5,
						mass: 0.5
					});

					// Another sliding box but with no static friction.
					world.makeObject(id++, {
						x: 1.6,
						y: 8.0,
						vx: 0.5,
						kFriction: 0.01,
						sFriction: 0.0,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.RIGID_BODY,
						width: 1,
						height: .5,
						mass: 0.5
					});
				},
				onTick: (world, dt)=>{

				}
			}),
		]
	},

	// { // Advanced
	// 	name: "Advanced",
	// 	examples: [
	// 		// Composite
	// 		// Interactive
	// 		// Distance Constraint
	// 		// Spring Constraint
	// 		// Hinge Constraint
	// 		// Collision Events
	// 		// Breakable Constraint
	// 		// Masking
	// 	]
	// },

	// { // Capabilities
	// 	name: "Capabilities",
	// 	examples: [
	// 		// True drag
	// 		// Buoyancy
	// 		// Teleporting
	// 		// Resize
	// 		// Dynamic Object
	// 		// Anti-tunneling
	// 		// Collision Filtering
	// 		// Multiple worlds.
	// 		// Collision groups.
	// 		// Substeps
	// 	]
	// },

	{ // Optimizations
		name: "Optimizations",
		examples: [
			new Example({
				name: "* Sleep and Islands",
				key: "sleep-and-islands",
				description: [
					"Sleep works a little differently in Gearbox 2D.",
					"Sleep is based on movement, and is computed during the kinematics step. Objects wake up during collisions or forces. Each object tracks its own list of contacts, and wakes up its neighbours whet it wakes up. This gives us islands without having to rebuild an island data structure each tick like other engines."
				].join("\n\n"),
				globalLines: [
					"let simulationTime = 0;",
					"let nextId = 1;"
				],
				onInit: (world)=>{
					world.setGravity(0, 10);
					simulationTime = 3;
					nextId = 0;
		
					world.makeObject(nextId++, {
						x: 5,
						y: 8.50,
						width: 20,
						height: 1,
						vx: 0.0,
						vy: 0.0,
						shape: gb2d.shapes.AABB,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						mass: 2, 
					});
				},
				// Once collisions are a bit more stable, the number of colliding objects can be doubled.
				onTick: (world, dt)=>{
					simulationTime += dt;
					let numbSeconds = Math.floor(simulationTime / 3);
					if(numbSeconds > nextId){
						if(nextId < 10){
							world.makeObject(nextId++, {
								x: 5,
								y: 0,
								width: 6,
								height: 0.5,
								vx: 0,
								vy: 0,
								shape: gb2d.shapes.BOX,
								type: gb2d.bodyTypes.RIGID_BODY,
								mass: 0.2, 
								sFriction: 10,
								kFriction: 10,
							});
						}
					}
				}
			}),
			new Example({
				name: "Shrink Wrap",
				key: "shrink-wrap",
				description: [
					"Objects that are put to sleep get shrink wrapped AABBs providing a slight performance boost.",
				].join("\n\n"),
				globalLines: [
				],
				onInit: (world)=>{
		
					world.makeObject(1, {
						x: 10,
						y: 10,
						radius: 1,
						vx: -5.0,
						vy: -5.0,
						shape: gb2d.shapes.CIRCLE,
						type: gb2d.bodyTypes.RIGID_BODY,
						mass: 0.2, 
						restitution: 0,
					});
					world.makeObject(2, {
						x: 0,
						y: 0,
						radius: 1,
						vx: 5.0,
						vy: 5.0,
						shape: gb2d.shapes.CIRCLE,
						type: gb2d.bodyTypes.RIGID_BODY,
						mass: 0.2, 
						restitution: 0,
					});
				},
				// Once collisions are a bit more stable, the number of colliding objects can be doubled.
				onTick: (world, dt)=>{
				}
			}),
			// BVH Biasing.
		]
	},

	// { // Applications
	// 	name: "Applications",
	// 	examples: [
	// 		// Pong
	// 		// Cannon
	// 		// Brick Breaker
	// 		// Lunar Lander
	// 	]
	// },

	{ // Load tests
		name: "Load Tests",
		examples: [
			new Example({
				name: "Circles",
				// name: "Particles",
				key: "particles",
				description: "A load test featuring 2,000 circles. Note that the major bottleneck is canvas graphics.",
				// description: "A load test featuring 1,000 particles. Particles don't collide, but are inserted into the BVH. AABBs are hidden to prevent graphics from becomming a bottleneck.",
				onInit: (world)=>{

					let id = 1;
					let thickness = 2;
					let length = 11;

					// Walls
					world.makeObject(id++, {
						x: 5,
						y: 0,
						shape: gb2d.shapes.AABB,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: length,
						height: thickness,
						restitution: 0.99,
						
					});
					world.makeObject(id++, {
						x: 5,
						y: 10,
						shape: gb2d.shapes.AABB,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: length,
						height: thickness,
						restitution: 0.99,
					});
					world.makeObject(id++, {
						x: 0,
						y: 5,
						shape: gb2d.shapes.AABB,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: thickness,
						height: length,
						restitution: 0.99,
					});
					world.makeObject(id++, {
						x: 10,
						y: 5,
						shape: gb2d.shapes.AABB,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: thickness,
						height: length,
						restitution: 0.99,
					});

					for(let i = 0; i < 2000; i++){

						world.makeObject(id++, {
							x: Math.random() * 8 + 1,
							y: Math.random() * 8 + 1,
							vx: Math.random() * 1.00 - .50,
							vy: Math.random() * 1.00 - .50,
							r: Math.PI / 2 * Math.random(),
							shape: gb2d.shapes.CIRCLE,
							type: gb2d.bodyTypes.RIGID_BODY,
							radius: .05,
							mass: 0.5,
							linearDamping: 0.0,
							angularDamping: 0.5,
							restitution: 0.5,
						});
					}
				},
				onTick: (world, dt)=>{
				}
			}),
			new Example({
				name: "Fleas",
				key: "fleas",
				description: "2000 bouncy points. Point objects don't collide with each other.",
				onInit: (world)=>{

					world.setGravity(0, 10);

					let id = 1;
					let thickness = 2;
					let length = 11;

					// Walls
					world.makeObject(id++, {
						x: 5,
						y: 0,
						shape: gb2d.shapes.AABB,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: length,
						height: thickness,
						restitution: 0.99,
						
					});
					world.makeObject(id++, {
						x: 5,
						y: 10,
						shape: gb2d.shapes.AABB,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: length,
						height: thickness,
						restitution: 0.99,
					});
					world.makeObject(id++, {
						x: 0,
						y: 5,
						shape: gb2d.shapes.AABB,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: thickness,
						height: length,
						restitution: 0.99,
					});
					world.makeObject(id++, {
						x: 10,
						y: 5,
						shape: gb2d.shapes.AABB,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: thickness,
						height: length,
						restitution: 0.99,
					});

					for(let i = 0; i < 2000; i++){

						world.makeObject(id++, {
							x: Math.random() * 8 + 1,
							y: Math.random() * 8 + 1,
							vx: Math.random() * 10.00 - 5.0,
							// vy: Math.random() * 1.00 - .50,
							r: Math.PI / 2 * Math.random(),
							shape: gb2d.shapes.POINT,
							type: gb2d.bodyTypes.RIGID_BODY,
							radius: .05,
							mass: 2,
							linearDamping: 0.0,
							angularDamping: 0.5,
	
							restitution: 0.99,
						});
					}
				},
				onTick: (world, dt)=>{
				}
			}),
		],

		// TODO:
		// Rain
		// Washing Machine
		// Large stack of sleeping objects
		// Chaos (rapid creation and removal of objects)
		// Worse case scenario.
			// Many overlapping objects.
			// Pathological BVH.

	},

	{ // Known Issues
		name: "Known Issues",
		examples: [
			new Example({
				name: "TC-1 (SOLVED)",
				key: "tc-1",
				hidden: true,
				description: "Boxes colliding with other boxes go crazy.",
				onInit: (world)=>{
					world.setGravity(0, 10);
		
					let id = 1;
					world.makeObject(id++, {
						x: 5,
						y: 8,
						// r: Math.PI,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: 1,
						height: 1,
						mass: 1,
					});
		
					// Anohter box but this time a rigid body.
					world.makeObject(id++, {
						x: 7,
						y: 2,
						// r: Math.PI,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.RIGID_BODY,
						// radius: 1,
						width: 5,
						height: 1,
						mass: 1,
					});
		
					world.makeObject(id++, {
						x: 3,
						y: 5,
						// r: Math.PI,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.RIGID_BODY,
						// radius: 1,
						width: 5,
						height: 1,
						mass: 1,
					});
				},
				onTick: (world, dt)=>{
				}
			}),
			
			new Example({
				name: "TC-2 (SOLVED)",
				key: "tc-2",
				hidden: true,
				description: "Boxes warp right through AABBs.",
				onInit: (world)=>{
					world.setGravity(0, 10);
		
					let id = 1;
					world.makeObject(id++, {
						x: 5,
						y: 8,
						r: Math.PI / 2,
						shape: gb2d.shapes.AABB,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: 1,
						height: 1,
						mass: 1,
					});
		
					// Anohter box but this time a rigid body.
					world.makeObject(id++, {
						x: 7,
						y: 2,
						// r: Math.PI / 2,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.RIGID_BODY,
						width: 5,
						height: 1,
						mass: 1,
					});
					world.makeObject(id++, {
						x: 3,
						y: 5,
						// r: Math.PI / 2,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.RIGID_BODY,
						width: 5,
						height: 1,
						mass: 1,
					});
				},
				onTick: (world, dt)=>{
				}
			}),
		
			new Example({
				name: "TC-3 (SOLVED)",
				key: "tc-3",
				description: "This isn't bad, but could be made better. The moving object loses all of its x momentum after the collision. In an actual collision of this type, one might expect the collision to apply a bunch of angular momentum and for the moving object to continue moving.",
				onInit: (world)=>{
					world.setGravity(0, 0);
		
					let id = 1;
					world.makeObject(id++, {
						x: 8,
						y: 5,
						// r: Math.PI,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: 1,
						height: 1,
						mass: 1,
					});
		
					// Anohter box but this time a rigid body.
					world.makeObject(id++, {
						x: 2,
						y: 3,
						vx: 3,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.RIGID_BODY,
						// radius: 1,
						width: 1,
						height: 5,
						mass: 1,
					});
				},
				onTick: (world, dt)=>{
				}
			}),

			new Example({
				name: "TC-4 (SOLVED)",
				key: "tc-4",
				hidden: true,
				description: "The collision in this test is somewhat puzzling since hte object seems to receive angular velocity in the wrong direction.",
				onInit: (world)=>{
					world.setGravity(0, 0);
		
					let id = 1;
					world.makeObject(id++, {
						x: 8,
						y: 5,
						// r: Math.PI,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: 1,
						height: 1,
						mass: 1,
					});
		
					// Anohter box but this time a rigid body.
					world.makeObject(id++, {
						x: 2,
						y: 6,
						vx: 3,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.RIGID_BODY,
						// radius: 1,
						width: 1,
						height: 5,
						mass: 1,
					});
				},
				onTick: (world, dt)=>{
				}
			}),

			new Example({
				name: "TC-5 (SOLVED)",
				key: "tc-5",
				hidden: true,
				description: "Even the slightest rs for the moving circle causes a dramatic difference in the resulting collision response. If commenting out rs, the collision is completely linear in the diagonal direction. If setting rs to 10, the collision is the nearly identical to an rs of 0.01.\n\nThere's another weird thing going on here. Notice how both circles end up spinning in the same direction. That's noh how physics works.",
				onInit: (world)=>{
					world.setGravity(0, 0);
		
					let id = 1;
					world.makeObject(id++, {
						x: 5,
						y: 5,
						shape: gb2d.shapes.CIRCLE,
						type: gb2d.bodyTypes.RIGID_BODY,
						radius: 1,
						mass: 4,
					});
		
					world.makeObject(id++, {
						x: 2.8,
						y: 2.0,
						vx: 3,
						vy: 3,
						shape: gb2d.shapes.CIRCLE,
						type: gb2d.bodyTypes.RIGID_BODY,
						radius: 0.5,
						mass: 1,
		
						// rs: 10,
						rs: 0.01,
					});
				},
				onTick: (gb2d, world, dt)=>{
				}
			}),
		
			new Example({
				name: "TC-6 (SOLVED)",
				key: "tc-6",
				description: "Incorrect response impulse applied during certain box-box collisions. Likely due to an error in the contact point calculation. Reccomend doing an edge clipping technique.",
				onInit: (world)=>{
					world.setGravity(0, 10);
					world.setHasFriction(false);
		
					let id = 1;
					world.makeObject(id++, {
						x: 5,
						y: 6,
						r: Math.PI / 8,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: 8,
						height: 1,
					});
		
					// Anohter box but this time a rigid body.
					world.makeObject(id++, {
						x: 2,
						y: 2,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.RIGID_BODY,
						width: 1,
						height: 1,
						mass: 0.2,
					});
				},
				onTick: (gb2d, world, dt)=>{
				}
			}),
		
			new Example({
				name: "TC-7 (SOLVED)",
				key: "tc-7",
				description: "Friction applies an incorrect vector to certain collisions. Likely due to an incorrect normal vector. Problem doesn't happen when restitution is off, so this could be a symptom of TC-6.",
				onInit: (world)=>{
					world.setGravity(0, 10);
					// world.setHasRestitution(false);
		
					let id = 1;
					world.makeObject(id++, {
						x: 5,
						y: 6,
						// r: Math.PI / 8,
						r: 0.1,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: 8,
						height: 1,
					});
		
					// Anohter box but this time a rigid body.
					world.makeObject(id++, {
						x: 2,
						y: 2,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.RIGID_BODY,
						width: 1,
						height: 1,
						mass: 0.2,
					});
				},
				onTick: (gb2d, world, dt)=>{
				}
			}),
		
			new Example({
				name: "TC-8 (SOLVED)",
				key: "tc-8",
				description: [
					"Circle collisions sometimes glitch."
				].join("\n\n"),
				globalLines: ["let nextId = 1;"],
				onInit: (world)=>{
					world.setGravity(0, 10);
					impulseTimer = 0;
		
					// Objects will be created in the tick function.
				},
				// Once collisions are a bit more stable, the number of colliding objects can be doubled.
				onTick: (world, dt)=>{
					impulseTimer++;
					if(impulseTimer % 60 == 0){
						let m = .1 + Math.random() * .4;
						let r = .2 + m*m * .8;
						world.makeObject(nextId++, {
							x: 0,
							y: 7.50,
							r: Math.PI / 2 * Math.random(),
							rs: (Math.random() - 0.5) * 5.00,
							vx: (2.00 + Math.random() * 5.00) * 1,
							vy: -6.00 - Math.random() * 1.00,
							shape: gb2d.shapes.CIRCLE,
							type: gb2d.bodyTypes.RIGID_BODY,
							radius: r,
							mass: m, 
						});
		
						m = .1 + Math.random() * .4;
						r = .2 + m*m * .8;
						world.makeObject(nextId++, {
							x: 10,
							y: 7.50,
							r: Math.PI / 2 * Math.random(),
							rs: (Math.random() - 0.5) * 5.00,
							vx: (2.00 + Math.random() * 5.00) * -1,
							vy: -6.00 - Math.random() * 1.00,
							shape: gb2d.shapes.CIRCLE,
							type: gb2d.bodyTypes.RIGID_BODY,
							radius: r,
							mass: m, 
						});
		
						// Scan for objects that are out of bounds and remove them.
						// Another way to do this would be to use collision events.
						let objectCount = world.objectCount;
						let toRemove = [];
		
						world.iterateObjects(obj=>{
							
							if(obj.y > 10.50){
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

			new Example({
				name: "TC-9 (SOLVED)",
				key: "tc-9",
				description: "A small box resting on a long fixed box.",
				onInit: (world)=>{
					world.setGravity(0, 1);
					// world.setHasRestitution(false);
		
					let id = 1;
					world.makeObject(id++, {
						x: 5,
						y: 6,
						r: Math.PI / 2,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: 1,
						height: 8,
					});
		
					// Anohter box but this time a rigid body.
					world.makeObject(id++, {
						x: 7,
						y: 5,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.RIGID_BODY,
						width: 1,
						height: 1,
						mass: 0.2,
					});
				},
				onTick: (world, dt)=>{
				}
			}),

			new Example({
				name: "TC-10 (SOLVED)",
				key: "tc-10",
				description: "A circle falling on a platform. Collision resolution is crazy.",
				onInit: (world)=>{
					world.setGravity(0, 3);
					// world.setHasRestitution(false);
		
					let id = 1;
					world.makeObject(id++, {
						x: 5,
						y: 8,
						shape: gb2d.shapes.AABB,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: 8,
						height: 1,
						// restitution: 1
					});
		
					// Anohter box but this time a rigid body.
					world.makeObject(id++, {
						x: 7,
						y: 2,
						shape: gb2d.shapes.CIRCLE,
						type: gb2d.bodyTypes.RIGID_BODY,
						radius: 1,
						mass: 0.2,
						restitution: 1,
						rs: -0.1,
					});
				},
				onTick: (world, dt)=>{
				}
			}),
			new Example({
				name: "TC-11 (REGRESSION)",
				key: "tc-11",
				description: "Circles get stuck in other shapes.",
				onInit: (world)=>{
		
					let id = 1;
					world.makeObject(id++, {
						x: 5,
						y: 5,
						shape: gb2d.shapes.AABB,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: 1,
						height: 5,
					});
		
					// Anohter box but this time a rigid body.
					world.makeObject(id++, {
						x: 5.2,
						y: 5,
						// vx: -50,
						shape: gb2d.shapes.CIRCLE,
						type: gb2d.bodyTypes.RIGID_BODY,
						radius: 0.1,
						mass: 0.2,
						restitution: 0.5,
					});
				},
				onTick: (world, dt)=>{
				}
			}),

			new Example({
				name: "TC-12",
				key: "tc-12",
				description: "The box, under high gravity, sinks through the AABB.",
				onInit: (world)=>{
					world.setGravity(0, 10);
					// world.setHasRestitution(false);
		
					let id = 1;
					world.makeObject(id++, {
						x: 5,
						y: 6,
						shape: gb2d.shapes.AABB,
						type: gb2d.bodyTypes.FIXED_OBJECT,
						width: 8,
						height: 1,
					});
		
					// Anohter box but this time a rigid body.
					world.makeObject(id++, {
						x: 7,
						y: 4,
						shape: gb2d.shapes.BOX,
						type: gb2d.bodyTypes.RIGID_BODY,
						width: 1,
						height: 1,
						mass: 0.2,
					});
				},
				onTick: (world, dt)=>{
				}
			}),

		]

	},
]

export default examples;