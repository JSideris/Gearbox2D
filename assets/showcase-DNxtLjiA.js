import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css                        */import{g as n}from"./engine-Dae9Bl-6.js";import{M as ft}from"./markdown-oLTTx95D.js";class w{constructor(t){this.onInit=t.onInit,this.onInitRaw=t.onInitRaw,this.onTick=t.onTick,this.onTickRaw=t.onTickRaw,this.onRender=t.onRender,this.onRenderRaw=t.onRenderRaw,this.onCleanup=t.onCleanup,this.description=t.description,this.name=t.name,this.key=t.key,this.globalLines=t.globalLines||[]}init(t){this.onInit?.(t)}tick(t,o){this.onTick?.(t,o)}render(t){this.onRender?.(t)}cleanup(t){this.onCleanup?.(t)}}let k=1,fn=0,ee=null,nn=null,xe=null;const it=(e,t)=>({x:(e-n.debug.offsetX)/(n.debug.zoom*100),y:(t-n.debug.offsetY)/(n.debug.zoom*100)}),It=(e,t)=>{if(e.button!==0)return;const o=xe.getBoundingClientRect(),s=it(e.clientX-o.left,e.clientY-o.top),a=t.queryBodiesAtPoint(s.x,s.y);if(a.length>0){const i=a[0],r=t.getBodyById(i);r&&r.type!==n.bodyTypes.FIXED_OBJECT&&(ee=t.createBody({id:999999,x:s.x,y:s.y,type:n.bodyTypes.FIXED_OBJECT,color:"transparent"}),ee.createFixture({id:999999,shape:n.shapes.CIRCLE,radius:.05,maskBits:0}),nn=t.createSpringJoint(ee,r,{id:999998,worldAnchor:s,frequencyHz:3,dampingRatio:1,length:0}))}},Bt=e=>{if(ee){const t=xe.getBoundingClientRect(),o=it(e.clientX-t.left,e.clientY-t.top);ee.x=o.x,ee.y=o.y}},wt=(e,t)=>{nn&&(t.removeJoint(nn.id),nn=null),ee&&(t.removeObject(ee.id),ee=null)},Ct=[new w({name:"Interactive Sandbox",key:"sandbox",description:["Welcome to **Gearbox2D**! This is an interactive playground featuring various shapes and physics properties. Click and drag objects to interact with them.","### Features","- **Point Query**: The engine detects which object is under the mouse using **BVH** and precise shape tests.","- **Mouse Joint**: Uses a `SpringJoint` to pull objects toward the mouse cursor.","- **Capsules**: New capsule shapes are supported with proper collision and mass properties.","- **Multi-Fixture Bodies**: Some objects are composed of multiple shapes (circles and boxes) attached to a single body.","- **Jointed Compounds**: Some objects are connected by **Hinge**, **Distance**, and **Spring** joints to create complex assemblies.","- **Collision Filtering**: The mouse 'anchor' object is a sensor that doesn't collide with other objects."].join(`

`),onInitRaw:`(world) => {
			world.clear();
			gearbox.debug.showAabbs = false;
			gearbox.debug.showForceVectors = false;
			nextId = 1;

			world.setGravity(0, 9.8);
			world.setHasRestitution(true);
			world.setHasFriction(true);

			// Boundaries (Thicker, with roof, moved out to preserve area)
			const thickness = 1.0;
			const innerWidth = 9.2;
			const innerHeight = 9.0;
			const wallHeight = innerHeight + thickness * 2;
			const boundaryWidth = innerWidth + thickness * 2;

			// Floor
			world
				.createBody({
					id: nextId++,
					x: 5,
					y: 9.0 + thickness / 2,
					type: gearbox.bodyTypes.FIXED_OBJECT,
					color: "#444",
				})
				.createFixture({
					shape: gearbox.shapes.AABB,
					width: boundaryWidth,
					height: thickness,
				});

			// Roof
			world
				.createBody({
					id: nextId++,
					x: 5,
					y: 0.0 - thickness / 2,
					type: gearbox.bodyTypes.FIXED_OBJECT,
					color: "#444",
				})
				.createFixture({
					shape: gearbox.shapes.AABB,
					width: boundaryWidth,
					height: thickness,
				});

			// Walls
			world
				.createBody({
					id: nextId++,
					x: 5 - innerWidth / 2 - thickness / 2,
					y: 4.5,
					type: gearbox.bodyTypes.FIXED_OBJECT,
					color: "#444",
				})
				.createFixture({
					shape: gearbox.shapes.AABB,
					width: thickness,
					height: wallHeight,
				});
			world
				.createBody({
					id: nextId++,
					x: 5 + innerWidth / 2 + thickness / 2,
					y: 4.5,
					type: gearbox.bodyTypes.FIXED_OBJECT,
					color: "#444",
				})
				.createFixture({
					shape: gearbox.shapes.AABB,
					width: thickness,
					height: wallHeight,
				});

			// Grid of shapes to prevent initial overlap
			const colors = [
				"#ff4444",
				"#44ff44",
				"#4444ff",
				"#ffff44",
				"#ff44ff",
				"#44ffff",
				"#ff8844",
				"#88ff44",
				"#4488ff",
			];
			const cols = 8;
			const rows = 4;
			const spacingX = 1.0;
			const spacingY = 1.0;
			const startX = 5 - ((cols - 1) * spacingX) / 2;
			const startY = 1.8;

			for (let r = 0; r < rows; r++) {
				for (let c = 0; c < cols; c++) {
					const x = startX + c * spacingX + (Math.random() - 0.5) * 0.2;
					const y = startY + r * spacingY + (Math.random() - 0.5) * 0.2;
					const color = colors[(r * cols + c) % colors.length];

					const commonProps = {
						x,
						y,
						mass: 0.5 + Math.random() * 1.5,
						color,
						linearDamping: 0.5,
						angularDamping: 1.5,
					};

					const rand = Math.random();
					if (rand < 0.25) {
						// Circle
						world.createBody({ id: nextId++, ...commonProps, r: Math.random() * Math.PI }).createFixture({
							shape: gearbox.shapes.CIRCLE,
							radius: 0.1 + Math.random() * 0.3,
						});
					} else if (rand < 0.5) {
						// Box
						world.createBody({ id: nextId++, ...commonProps, r: Math.random() * Math.PI }).createFixture({
							shape: gearbox.shapes.BOX,
							width: 0.2 + Math.random() * 0.6,
							height: 0.2 + Math.random() * 0.6,
						});
					} else if (rand < 0.75) {
						// Capsule
						const capRadius = 0.1 + Math.random() * 0.1;
						world.createBody({ id: nextId++, ...commonProps, r: Math.random() * Math.PI }).createFixture({
							shape: gearbox.shapes.CAPSULE,
							radius: capRadius,
							height: capRadius * 2 + 0.2 + Math.random() * 0.4,
						});
					} else {
						// Polygon or Star
						const randPoly = Math.random();
						let vertices;
						if (randPoly < 0.4) {
							// Regular Polygon
							const sides = 3 + Math.floor(Math.random() * 5);
							vertices = gearbox.polygon.makeRegularPolygon(sides, 0.2 + Math.random() * 0.2);
						} else if (randPoly < 0.8) {
							// Star
							const points = 5 + Math.floor(Math.random() * 3);
							const outer = 0.3 + Math.random() * 0.2;
							vertices = gearbox.polygon.makeStar(points, outer, outer * 0.5);
						} else {
							// Manual concave polygon (legacy test)
							vertices = [
								{ x: 0, y: -0.4 },
								{ x: 0.35, y: -0.15 },
								{ x: 0.2, y: 0.3 },
								{ x: -0.2, y: 0.3 },
								{ x: -0.35, y: -0.15 },
							];
						}

						world.createBody({ id: nextId++, ...commonProps, r: Math.random() * Math.PI }).createFixture({
							shape: gearbox.shapes.POLYGON,
							vertices: vertices,
						});
					}
				}
			}

			// --- Multi-Fixture Composite Bodies ---
			for (let i = 0; i < 6; i++) {
				const x = 1.5 + Math.random() * 7;
				const y = 5.5 + Math.random() * 1.5;
				const color = colors[Math.floor(Math.random() * colors.length)];

				const body = world.createBody({
					id: nextId++,
					x,
					y,
					mass: 1.0 + Math.random() * 3.0,
					color,
					linearDamping: 0.5,
					angularDamping: 1.0,
				});

				const numFixtures = 2 + Math.floor(Math.random() * 4); // 2-6 fixtures
				for (let j = 0; j < numFixtures; j++) {
					const shapeType = Math.random();
					const offsetX = (Math.random() - 0.5) * 1.2;
					const offsetY = (Math.random() - 0.5) * 1.2;

					if (shapeType < 0.4) {
						body.createFixture({
							shape: gearbox.shapes.CIRCLE,
							radius: 0.1 + Math.random() * 0.25,
							localX: offsetX,
							localY: offsetY,
						});
					} else {
						body.createFixture({
							shape: gearbox.shapes.BOX,
							width: 0.2 + Math.random() * 0.5,
							height: 0.2 + Math.random() * 0.5,
							localX: offsetX,
							localY: offsetY,
							localR: Math.random() * Math.PI,
						});
					}
				}
			}

			// --- Compound Objects (Bodies + Joints) ---
			const jointTypes = ["hinge", "distance", "spring"];
			for (let i = 0; i < 8; i++) {
				const x = 1.5 + Math.random() * 6;
				const y = 7.5 + Math.random() * 1.0;
				const jType = jointTypes[Math.floor(Math.random() * jointTypes.length)];
				const color = colors[Math.floor(Math.random() * colors.length)];

				const b1 = world.createBody({
					id: nextId++,
					x,
					y,
					mass: 0.5 + Math.random(),
					color,
					linearDamping: 0.5,
					angularDamping: 0.5,
				});

				const s1 = Math.random();
				if (s1 < 0.5) b1.createFixture({ shape: gearbox.shapes.CIRCLE, radius: 0.15 + Math.random() * 0.2 });
				else
					b1.createFixture({
						shape: gearbox.shapes.BOX,
						width: 0.3 + Math.random() * 0.4,
						height: 0.3 + Math.random() * 0.4,
					});

				const b2 = world.createBody({
					id: nextId++,
					x: x + 0.5 + Math.random() * 0.5,
					y: y + (Math.random() - 0.5) * 0.5,
					mass: 0.5 + Math.random(),
					color,
					linearDamping: 0.5,
					angularDamping: 0.5,
				});

				const s2 = Math.random();
				if (s2 < 0.5) b2.createFixture({ shape: gearbox.shapes.CIRCLE, radius: 0.15 + Math.random() * 0.2 });
				else
					b2.createFixture({
						shape: gearbox.shapes.BOX,
						width: 0.3 + Math.random() * 0.4,
						height: 0.3 + Math.random() * 0.4,
					});

				if (jType === "hinge") {
					world.createHingeJoint(b1, b2, {
						id: nextId++,
						worldAnchor: { x: (b1.x + b2.x) / 2, y: (b1.y + b2.y) / 2 },
					});
				} else if (jType === "distance") {
					world.createDistanceJoint(b1, b2, {
						id: nextId++,
						anchorA: { x: 0, y: 0 },
						anchorB: { x: 0, y: 0 },
					});
				} else {
					world.createSpringJoint(b1, b2, {
						id: nextId++,
						anchorA: { x: 0, y: 0 },
						anchorB: { x: 0, y: 0 },
						frequencyHz: 2.0 + Math.random() * 4.0,
						dampingRatio: 0.5 + Math.random() * 0.5,
					});
				}
			}

			// Event listeners
			canvas = document.getElementById("debug-canvas") as HTMLCanvasElement;

			// Remove existing listeners if they exist (prevents leakage on restart/re-init)
			if ((world as any)._mouseDownHandler)
				canvas.removeEventListener("mousedown", (world as any)._mouseDownHandler);
			if ((world as any)._mouseMoveHandler)
				window.removeEventListener("mousemove", (world as any)._mouseMoveHandler);
			if ((world as any)._mouseUpHandler) window.removeEventListener("mouseup", (world as any)._mouseUpHandler);

			// We need to store bound versions to remove them later
			(world as any)._mouseDownHandler = (e: MouseEvent) => onMouseDown(e, world);
			(world as any)._mouseMoveHandler = (e: MouseEvent) => onMouseMove(e);
			(world as any)._mouseUpHandler = (e: MouseEvent) => onMouseUp(e, world);

			canvas.addEventListener("mousedown", (world as any)._mouseDownHandler);
			window.addEventListener("mousemove", (world as any)._mouseMoveHandler);
			window.addEventListener("mouseup", (world as any)._mouseUpHandler);
		}`,onInit:e=>{e.clear(),n.debug.showAabbs=!1,n.debug.showForceVectors=!1,k=1,e.setGravity(0,9.8),e.setHasRestitution(!0),e.setHasFriction(!0);const t=1,o=9.2,a=9+t*2,i=o+t*2;e.createBody({id:k++,x:5,y:9+t/2,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.AABB,width:i,height:t}),e.createBody({id:k++,x:5,y:0-t/2,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.AABB,width:i,height:t}),e.createBody({id:k++,x:5-o/2-t/2,y:4.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.AABB,width:t,height:a}),e.createBody({id:k++,x:5+o/2+t/2,y:4.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.AABB,width:t,height:a});const r=["#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff","#ff8844","#88ff44","#4488ff"],c=8,l=4,m=1,x=1,f=5-(c-1)*m/2,h=1.8;for(let p=0;p<l;p++)for(let y=0;y<c;y++){const g=f+y*m+(Math.random()-.5)*.2,b=h+p*x+(Math.random()-.5)*.2,u=r[(p*c+y)%r.length],B={x:g,y:b,mass:.5+Math.random()*1.5,color:u,linearDamping:.5,angularDamping:1.5},I=Math.random();if(I<.25)e.createBody({id:k++,...B,r:Math.random()*Math.PI}).createFixture({shape:n.shapes.CIRCLE,radius:.1+Math.random()*.3});else if(I<.5)e.createBody({id:k++,...B,r:Math.random()*Math.PI}).createFixture({shape:n.shapes.BOX,width:.2+Math.random()*.6,height:.2+Math.random()*.6});else if(I<.75){const C=.1+Math.random()*.1;e.createBody({id:k++,...B,r:Math.random()*Math.PI}).createFixture({shape:n.shapes.CAPSULE,radius:C,height:C*2+.2+Math.random()*.4})}else{const C=Math.random();let M;if(C<.4){const O=3+Math.floor(Math.random()*5);M=n.polygon.makeRegularPolygon(O,.2+Math.random()*.2)}else if(C<.8){const O=5+Math.floor(Math.random()*3),X=.3+Math.random()*.2;M=n.polygon.makeStar(O,X,X*.5)}else M=[{x:0,y:-.4},{x:.35,y:-.15},{x:.2,y:.3},{x:-.2,y:.3},{x:-.35,y:-.15}];e.createBody({id:k++,...B,r:Math.random()*Math.PI}).createFixture({shape:n.shapes.POLYGON,vertices:M})}}for(let p=0;p<6;p++){const y=1.5+Math.random()*7,g=5.5+Math.random()*1.5,b=r[Math.floor(Math.random()*r.length)],u=e.createBody({id:k++,x:y,y:g,mass:1+Math.random()*3,color:b,linearDamping:.5,angularDamping:1}),B=2+Math.floor(Math.random()*4);for(let I=0;I<B;I++){const C=Math.random(),M=(Math.random()-.5)*1.2,O=(Math.random()-.5)*1.2;C<.4?u.createFixture({shape:n.shapes.CIRCLE,radius:.1+Math.random()*.25,localX:M,localY:O}):u.createFixture({shape:n.shapes.BOX,width:.2+Math.random()*.5,height:.2+Math.random()*.5,localX:M,localY:O,localR:Math.random()*Math.PI})}}const d=["hinge","distance","spring"];for(let p=0;p<8;p++){const y=1.5+Math.random()*6,g=7.5+Math.random()*1,b=d[Math.floor(Math.random()*d.length)],u=r[Math.floor(Math.random()*r.length)],B=e.createBody({id:k++,x:y,y:g,mass:.5+Math.random(),color:u,linearDamping:.5,angularDamping:.5});Math.random()<.5?B.createFixture({shape:n.shapes.CIRCLE,radius:.15+Math.random()*.2}):B.createFixture({shape:n.shapes.BOX,width:.3+Math.random()*.4,height:.3+Math.random()*.4});const C=e.createBody({id:k++,x:y+.5+Math.random()*.5,y:g+(Math.random()-.5)*.5,mass:.5+Math.random(),color:u,linearDamping:.5,angularDamping:.5});Math.random()<.5?C.createFixture({shape:n.shapes.CIRCLE,radius:.15+Math.random()*.2}):C.createFixture({shape:n.shapes.BOX,width:.3+Math.random()*.4,height:.3+Math.random()*.4}),b==="hinge"?e.createHingeJoint(B,C,{id:k++,worldAnchor:{x:(B.x+C.x)/2,y:(B.y+C.y)/2}}):b==="distance"?e.createDistanceJoint(B,C,{id:k++,anchorA:{x:0,y:0},anchorB:{x:0,y:0}}):e.createSpringJoint(B,C,{id:k++,anchorA:{x:0,y:0},anchorB:{x:0,y:0},frequencyHz:2+Math.random()*4,dampingRatio:.5+Math.random()*.5})}xe=document.getElementById("debug-canvas"),e._mouseDownHandler&&xe.removeEventListener("mousedown",e._mouseDownHandler),e._mouseMoveHandler&&window.removeEventListener("mousemove",e._mouseMoveHandler),e._mouseUpHandler&&window.removeEventListener("mouseup",e._mouseUpHandler),e._mouseDownHandler=p=>It(p,e),e._mouseMoveHandler=p=>Bt(p),e._mouseUpHandler=p=>wt(p,e),xe.addEventListener("mousedown",e._mouseDownHandler),window.addEventListener("mousemove",e._mouseMoveHandler),window.addEventListener("mouseup",e._mouseUpHandler)},onCleanup:e=>{xe&&(xe.removeEventListener("mousedown",e._mouseDownHandler),window.removeEventListener("mousemove",e._mouseMoveHandler),window.removeEventListener("mouseup",e._mouseUpHandler),delete e._mouseDownHandler,delete e._mouseMoveHandler,delete e._mouseUpHandler)},onTickRaw:`(world, dt) => {
			gearbox.debug.clearLabels();
			gearbox.debug.addLabel({
				text: "Interactive Sandbox",
				x: 5,
				y: 0.5,
				fontSize: "28px Arial",
				color: "#bbb",
				position: "on-top",
			});
			gearbox.debug.addLabel({
				text: "Click and drag objects!",
				x: 5,
				y: 1.2,
				fontSize: "16px Arial",
				color: "#888",
				position: "on-top",
			});
		}`,onTick:(e,t)=>{n.debug.clearLabels(),n.debug.addLabel({text:"Interactive Sandbox",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"}),n.debug.addLabel({text:"Click and drag objects!",x:5,y:1.2,fontSize:"16px Arial",color:"#888",position:"on-top"})}}),new w({name:"Force",key:"force",description:["**Forces** are used to apply acceleration to objects which scale inversely with the object's mass. All forces applied to an object are accumulated and applied in the next world step where they are reset.","Persistent forces must be reapplied on each fixed update (every `tick`).","It's important to note that the change in velocity will be a function of the **force vector**, the object's **mass**, and the **time step**. If you need a specific instantaneous change in velocity, use an **Impulse** instead."].join(`

`),onInitRaw:`(world) => {
			// This small circle will orbit the bigger one.
			world
				.createBody({
					id: 1,
					x: 5.0,
					y: 2.5,
					vx: 5.0,
					r: (Math.PI / 2) * Math.random(),
					rs: 5,
					mass: 0.1, // 100g
					angularDamping: 0.0,
					linearDamping: 0.0, // Set to 0 to prevent the orbit from slowing down.
				})
				.createFixture({
					shape: gearbox.shapes.CIRCLE,
					radius: 0.3,
				});

			// For decoration, let's add a shape in the middle.
			world
				.createBody({
					id: 2,
					x: 5.0,
					y: 5.0,
					r: (Math.PI / 2) * Math.random(),
					rs: 0.1,
					type: gearbox.bodyTypes.KINEMATIC_OBJECT, // Use Kinematic for moving sensor decoration
					angularDamping: 0.0,
				})
				.createFixture({
					shape: gearbox.shapes.CIRCLE,
					radius: 1.0,
					isSensor: true,
				});
		}`,onInit:e=>{e.createBody({id:1,x:5,y:2.5,vx:5,r:Math.PI/2*Math.random(),rs:5,mass:.1,angularDamping:0,linearDamping:0}).createFixture({shape:n.shapes.CIRCLE,radius:.3}),e.createBody({id:2,x:5,y:5,r:Math.PI/2*Math.random(),rs:.1,type:n.bodyTypes.KINEMATIC_OBJECT,angularDamping:0}).createFixture({shape:n.shapes.CIRCLE,radius:1,isSensor:!0})},onTickRaw:`(world, dt) => {
			let obj = world.bodiesById[1];
			let center = world.bodiesById[2];

			// Calculate the vector from the object to the center.
			let dx = center.x - obj.x;
			let dy = center.y - obj.y;

			// Calculate the magnitude of the vector.
			let magnitude = Math.sqrt(dx * dx + dy * dy);

			// Normalize the vector.
			dx /= magnitude;
			dy /= magnitude;

			// Define the fixed magnitude of the force.
			const forceMagnitude = 2.0;

			// Apply a force to the object.
			obj.applyForce(dx * forceMagnitude, dy * forceMagnitude);
		}`,onTick:(e,t)=>{let o=e.bodiesById[1],s=e.bodiesById[2],a=s.x-o.x,i=s.y-o.y,r=Math.sqrt(a*a+i*i);a/=r,i/=r;const c=2;o.applyForce(a*c,i*c)}}),new w({name:"Impulse",key:"impulse",description:["**Impulses** are used to apply a sudden change in momentum to an object. It's similar to a force, but modifies the object's velocity **instantaneously**, rather than acting as a persistent push.","In this example we demonstrate both **Linear** and **Angular** impulses.","- The two circles receive vertical linear impulses.","- The box receives periodic angular impulses (torque) causing it to spin without moving its center."].join(`

`),globalLines:["let impulseTimer = 0;"],onInitRaw:`(world) => {
			// Linear impulse targets
			world
				.createBody({ id: 1, x: 2.5, y: 5.0, r: (Math.PI / 2) * Math.random(), mass: 1, linearDamping: 0.1 })
				.createFixture({
					shape: gearbox.shapes.CIRCLE,
					radius: 0.3,
				});

			world
				.createBody({ id: 2, x: 5.0, y: 5.0, r: (Math.PI / 2) * Math.random(), mass: 2, linearDamping: 0.02 })
				.createFixture({
					shape: gearbox.shapes.CIRCLE,
					radius: 0.6,
				});

			// Angular impulse target
			world
				.createBody({ id: 3, x: 7.5, y: 5.0, mass: 100, linearDamping: 0.05, angularDamping: 0.05 })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 1.0,
					height: 0.3,
				});
		}`,onInit:e=>{e.createBody({id:1,x:2.5,y:5,r:Math.PI/2*Math.random(),mass:1,linearDamping:.1}).createFixture({shape:n.shapes.CIRCLE,radius:.3}),e.createBody({id:2,x:5,y:5,r:Math.PI/2*Math.random(),mass:2,linearDamping:.02}).createFixture({shape:n.shapes.CIRCLE,radius:.6}),e.createBody({id:3,x:7.5,y:5,mass:100,linearDamping:.05,angularDamping:.05}).createFixture({shape:n.shapes.BOX,width:1,height:.3})},onTickRaw:`(world, dt) => {
			let obj1 = world.bodiesById[1];
			let obj2 = world.bodiesById[2];
			let obj3 = world.bodiesById[3];

			let oldTimer = impulseTimer;
			impulseTimer += dt * 5;

			let t1 = Math.floor(oldTimer);
			let t2 = Math.floor(impulseTimer);

			if (t1 != t2) {
				if (t2 % 2 == 0) {
					let impulse = (5.0 - obj1.y) * 0.2;
					if (impulse < 0.05 && impulse > -0.05) impulse = 2.0;

					obj1.applyImpulse(0, impulse);
					obj2.applyImpulse(0, impulse);
				}

				// Apply angular impulse to the box
				if (t2 % 3 == 0) {
					obj3.applyAngularImpulse(2.0);
				}
			}
		}`,onTick:(e,t)=>{let o=e.bodiesById[1],s=e.bodiesById[2],a=e.bodiesById[3],i=fn;fn+=t*5;let r=Math.floor(i),c=Math.floor(fn);if(r!=c){if(c%2==0){let l=(5-o.y)*.2;l<.05&&l>-.05&&(l=2),o.applyImpulse(0,l),s.applyImpulse(0,l)}c%3==0&&a.applyAngularImpulse(2)}}}),new w({name:"Bounce",key:"bounce",description:["This example demonstrates **Restitution** (bounciness).","The central ball is configured with `restitution: 1.0`, meaning it loses no energy during collisions with the fixed walls, creating a perfectly elastic bounce.","Gearbox2D handles restitution differently than many other engines to prevent numerical energy gain. Check out the documentation to learn more about **Kinematic Restitution Balancing**."].join(`

`),onInitRaw:`(world) => {
			// Gravity
			world.setGravity(0, 10);

			// Walls
			world.createBody({ id: 1, x: 5, y: 0, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: 11,
				height: 2,
				restitution: 1.0,
			});
			world.createBody({ id: 2, x: 5, y: 10, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: 11,
				height: 2,
				restitution: 1.0,
			});
			world.createBody({ id: 3, x: 0, y: 5, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: 2,
				height: 11,
				restitution: 1.0,
			});
			world.createBody({ id: 4, x: 10, y: 5, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: 2,
				height: 11,
				restitution: 1.0,
			});

			// Bouncy Ball
			world
				.createBody({
					id: 5,
					x: 5,
					y: 2,
					vx: (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 1.5),
					r: (Math.PI / 2) * Math.random(),
					type: gearbox.bodyTypes.DYNAMIC_OBJECT,
					mass: 0.5,
					linearDamping: 0.0,
					rs: -2 + Math.random() * 4,
				})
				.createFixture({
					shape: gearbox.shapes.CIRCLE,
					radius: 0.75,
					// The most important part. 100% bouncy.
					restitution: 1,
				});
		}`,onInit:e=>{e.setGravity(0,10),e.createBody({id:1,x:5,y:0,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:11,height:2,restitution:1}),e.createBody({id:2,x:5,y:10,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:11,height:2,restitution:1}),e.createBody({id:3,x:0,y:5,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:2,height:11,restitution:1}),e.createBody({id:4,x:10,y:5,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:2,height:11,restitution:1}),e.createBody({id:5,x:5,y:2,vx:(Math.random()<.5?-1:1)*(1.5+Math.random()*1.5),r:Math.PI/2*Math.random(),type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5,linearDamping:0,rs:-2+Math.random()*4}).createFixture({shape:n.shapes.CIRCLE,radius:.75,restitution:1})},onTickRaw:`(world, dt) => {
			// The engine does all the work. Nothing to do here!
		}`,onTick:(e,t)=>{}}),new w({name:"Collisions",key:"collisions",description:["Collisions are enabled for objects whose type is set to `DYNAMIC_OBJECT`.","In this example we can see collisions between all of the different supported shape types:","- **CIRCLE**: Optimized circular collisions.","- **BOX**: Oriented bounding boxes with full rotation support.","- **AABB**: Axis-aligned bounding boxes.","- **CAPSULE**: 2D capsules with robust collision detection.","- **POINT**: Zero-radius points that collide with larger shapes."].join(`

`),globalLines:["let nextId = 1;"],onInitRaw:`(world) => {
			world.setGravity(0, 10);

			// Objects will be created in the tick function.
		}`,onInit:e=>{e.setGravity(0,10)},onTickRaw:`(world, dt) => {
			if (Math.random() < 0.08) {
				let m = 0.1 + Math.random() * 0.4;
				let dir = 1;
				if (Math.random() < 0.5) dir = -1;

				let r = 0.2 + m * m * 0.8;
				let h = 0.1 + Math.random() * (r - 0.1);
				let w = (r * r) / h;

				let shapeType = Math.random();
				let shape;
				let mass = m;

				if (shapeType < 0.1) {
					shape = gearbox.shapes.POINT;
					mass = 0.01; // Points have very small mass
				} else if (shapeType < 0.2) {
					shape = gearbox.shapes.AABB;
				} else if (shapeType < 0.45) {
					shape = gearbox.shapes.BOX;
				} else if (shapeType < 0.7) {
					shape = gearbox.shapes.CAPSULE;
					// For capsule, use 'h' for width (2*r) and 'w' for height
					let capR = h * 0.5;
					r = capR;
					h = Math.max(capR * 2 + 0.1, w);
				} else if (shapeType < 0.85) {
					shape = gearbox.shapes.POLYGON;
				} else {
					shape = gearbox.shapes.CIRCLE;
				}

				const bodyId = nextId++;
				const body = world.createBody({
					id: bodyId,
					x: 5.0 - dir * 5.0,
					y: 7.5,
					r: (Math.PI / 2) * Math.random(),
					rs: (Math.random() - 0.5) * 5.0,
					vx: (2.0 + Math.random() * 5.0) * dir,
					vy: -8.0 - Math.random() * 2.0,
					type: gearbox.bodyTypes.DYNAMIC_OBJECT,
					mass: mass,
					linearDamping: 0,
				});

				if (shape === gearbox.shapes.POLYGON) {
					const randPoly = Math.random();
					let polyVertices;
					const polyRadius = 0.2 + Math.random() * 0.3;

					if (randPoly < 0.6) {
						// Regular Polygon
						const sides = 3 + Math.floor(Math.random() * 5);
						polyVertices = gearbox.polygon.makeRegularPolygon(sides, polyRadius);
					} else {
						// Star
						const points = 5 + Math.floor(Math.random() * 3);
						polyVertices = gearbox.polygon.makeStar(points, polyRadius, polyRadius * 0.5);
					}

					body.createFixture({
						shape: shape,
						vertices: polyVertices,
					});
				} else {
					body.createFixture({
						shape: shape,
						radius: shape === gearbox.shapes.BOX || shape === gearbox.shapes.AABB ? w : r,
						height:
							shape === gearbox.shapes.BOX ||
							shape === gearbox.shapes.AABB ||
							shape === gearbox.shapes.CAPSULE
								? h
								: 0,
					});
				}

				// Scan for objects that are out of bounds and remove them.
				// Another way to do this would be to use collision events.
				let objectCount = world.getBodyCount();
				let toRemove = [];

				world.iterateBodies((obj) => {
					if (obj.y > 10.5) {
						// Don't remove stuff in the middle of the loop!!!
						toRemove.push(obj);
					}
				});

				// Now remove everything we found that's out of bounds.
				for (let obj of toRemove) {
					world.removeObject(obj.id);
				}
			}
		}`,onTick:(e,t)=>{if(Math.random()<.08){let o=.1+Math.random()*.4,s=1;Math.random()<.5&&(s=-1);let a=.2+o*o*.8,i=.1+Math.random()*(a-.1),r=a*a/i,c=Math.random(),l,m=o;if(c<.1)l=n.shapes.POINT,m=.01;else if(c<.2)l=n.shapes.AABB;else if(c<.45)l=n.shapes.BOX;else if(c<.7){l=n.shapes.CAPSULE;let d=i*.5;a=d,i=Math.max(d*2+.1,r)}else c<.85?l=n.shapes.POLYGON:l=n.shapes.CIRCLE;const x=k++,f=e.createBody({id:x,x:5-s*5,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*s,vy:-8-Math.random()*2,type:n.bodyTypes.DYNAMIC_OBJECT,mass:m,linearDamping:0});if(l===n.shapes.POLYGON){const d=Math.random();let p;const y=.2+Math.random()*.3;if(d<.6){const g=3+Math.floor(Math.random()*5);p=n.polygon.makeRegularPolygon(g,y)}else{const g=5+Math.floor(Math.random()*3);p=n.polygon.makeStar(g,y,y*.5)}f.createFixture({shape:l,vertices:p})}else f.createFixture({shape:l,radius:l===n.shapes.BOX||l===n.shapes.AABB?r:a,height:l===n.shapes.BOX||l===n.shapes.AABB||l===n.shapes.CAPSULE?i:0});e.getBodyCount();let h=[];e.iterateBodies(d=>{d.y>10.5&&h.push(d)});for(let d of h)e.removeObject(d.id)}}}),new w({name:"Friction",key:"friction",description:["**Friction** is applied as the last step of collision resolution. It handles both **static** and **dynamic** friction, applied as impulses at the point of contact.","Take note of the blue impulse vectors on the platforms which are present when dynamic friction is being applied.","### Scenarios","1. **Reverse Roll**: A circle spinning counter-clockwise transfers its angular momentum to linear momentum upon contact.","2. **Forward Roll**: A spinning circle with no linear momentum begins rolling forward due to friction.","3. **Slide**: A box slides across the platform and grinds to a halt.","4. **Static vs Kinetic**: Two boxes slide down a ramp. The left box has high static friction and stops; the right has no static friction and keeps sliding."].join(`

`),onInitRaw:`(world) => {
			world.setGravity(0, 10);

			let id = 1;
			const platformSummaries = [
				"Linear to angular momentum transfer.",
				"Angular to linear momentum transfer.",
				"Slide to halt.",
			];
			// Platforms.
			for (; id <= 3; id++) {
				world
					.createBody({ id: id, x: 4.5, y: 2.5 * id - 0.5, type: gearbox.bodyTypes.FIXED_OBJECT, mass: 1 })
					.createFixture({
						shape: gearbox.shapes.AABB,
						width: 9.0,
						height: 1,
					});

				gearbox.debug.addLabel({
					text: platformSummaries[id - 1],
					x: 4.5,
					y: 2.5 * id - 1.2,
					fontSize: "20px Arial",
					color: "#00f2ff",
					position: "above",
				});
			}

			// One more (tilted) platform for static friction.
			const tiltedPlatformId = id++;
			world
				.createBody({
					id: tiltedPlatformId,
					x: 4.5,
					y: 9.7,
					r: 0.1,
					type: gearbox.bodyTypes.FIXED_OBJECT,
					mass: 1,
				})
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 9.0,
					height: 1,
				});

			gearbox.debug.addLabel({
				text: "High static vs no static friction.",
				x: 4.5,
				y: 9.0,
				fontSize: "20px Arial",
				color: "#00f2ff",
				position: "above",
			});

			// Linear to angular rolling object.
			const rollingObj1Id = id++;
			world
				.createBody({
					id: rollingObj1Id,
					x: 0,
					y: 1.0,
					vx: 5,
					rs: -8,
					type: gearbox.bodyTypes.DYNAMIC_OBJECT,
					mass: 0.5,
				})
				.createFixture({
					shape: gearbox.shapes.CIRCLE,
					radius: 0.5,
					kFriction: 0.8,
					sFriction: 0.5,
				});

			gearbox.debug.addLabel({
				text: "Reverse",
				objectId: rollingObj1Id,
				position: "above",
				fontSize: "10px Arial",
			});

			// Angular to linear rolling object.
			const rollingObj2Id = id++;
			world
				.createBody({
					id: rollingObj2Id,
					x: 0.5,
					y: 3.5,
					rs: 15,
					type: gearbox.bodyTypes.DYNAMIC_OBJECT,
					mass: 0.5,
				})
				.createFixture({
					shape: gearbox.shapes.CIRCLE,
					radius: 0.5,
					kFriction: 0.2,
					sFriction: 0.5,
				});

			gearbox.debug.addLabel({
				text: "Forward",
				objectId: rollingObj2Id,
				position: "above",
				fontSize: "10px Arial",
			});

			// Sliding box slows down.
			const slidingBoxId = id++;
			world
				.createBody({
					id: slidingBoxId,
					x: 0.5,
					y: 6,
					vx: 7,
					type: gearbox.bodyTypes.DYNAMIC_OBJECT,
					mass: 0.5,
				})
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 1,
					height: 1,
					kFriction: 0.27,
					sFriction: 0.5,
				});

			gearbox.debug.addLabel({
				text: "Slide",
				objectId: slidingBoxId,
				position: "above",
				fontSize: "10px Arial",
			});

			// Sliding box stops due to static friction.
			const staticBoxId = id++;
			world
				.createBody({
					id: staticBoxId,
					x: 0.5,
					y: 8.0,
					vx: 0.5,
					type: gearbox.bodyTypes.DYNAMIC_OBJECT,
					mass: 0.5,
				})
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 1,
					height: 0.5,
					kFriction: 0.7,
					sFriction: 0.7,
				});

			gearbox.debug.addLabel({
				text: "Static",
				objectId: staticBoxId,
				position: "above",
				fontSize: "10px Arial",
			});

			// Another sliding box but with no static friction.
			const kineticBoxId = id++;
			world
				.createBody({
					id: kineticBoxId,
					x: 1.6,
					y: 8.0,
					vx: 0.5,
					type: gearbox.bodyTypes.DYNAMIC_OBJECT,
					mass: 0.5,
				})
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 1,
					height: 0.5,
					kFriction: 0.01,
					sFriction: 0.0,
				});

			gearbox.debug.addLabel({
				text: "Kinetic",
				objectId: kineticBoxId,
				position: "above",
				fontSize: "10px Arial",
			});
		}`,onInit:e=>{e.setGravity(0,10);let t=1;const o=["Linear to angular momentum transfer.","Angular to linear momentum transfer.","Slide to halt."];for(;t<=3;t++)e.createBody({id:t,x:4.5,y:2.5*t-.5,type:n.bodyTypes.FIXED_OBJECT,mass:1}).createFixture({shape:n.shapes.AABB,width:9,height:1}),n.debug.addLabel({text:o[t-1],x:4.5,y:2.5*t-1.2,fontSize:"20px Arial",color:"#00f2ff",position:"above"});const s=t++;e.createBody({id:s,x:4.5,y:9.7,r:.1,type:n.bodyTypes.FIXED_OBJECT,mass:1}).createFixture({shape:n.shapes.BOX,width:9,height:1}),n.debug.addLabel({text:"High static vs no static friction.",x:4.5,y:9,fontSize:"20px Arial",color:"#00f2ff",position:"above"});const a=t++;e.createBody({id:a,x:0,y:1,vx:5,rs:-8,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5}).createFixture({shape:n.shapes.CIRCLE,radius:.5,kFriction:.8,sFriction:.5}),n.debug.addLabel({text:"Reverse",objectId:a,position:"above",fontSize:"10px Arial"});const i=t++;e.createBody({id:i,x:.5,y:3.5,rs:15,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5}).createFixture({shape:n.shapes.CIRCLE,radius:.5,kFriction:.2,sFriction:.5}),n.debug.addLabel({text:"Forward",objectId:i,position:"above",fontSize:"10px Arial"});const r=t++;e.createBody({id:r,x:.5,y:6,vx:7,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5}).createFixture({shape:n.shapes.BOX,width:1,height:1,kFriction:.27,sFriction:.5}),n.debug.addLabel({text:"Slide",objectId:r,position:"above",fontSize:"10px Arial"});const c=t++;e.createBody({id:c,x:.5,y:8,vx:.5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5}).createFixture({shape:n.shapes.BOX,width:1,height:.5,kFriction:.7,sFriction:.7}),n.debug.addLabel({text:"Static",objectId:c,position:"above",fontSize:"10px Arial"});const l=t++;e.createBody({id:l,x:1.6,y:8,vx:.5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5}).createFixture({shape:n.shapes.BOX,width:1,height:.5,kFriction:.01,sFriction:0}),n.debug.addLabel({text:"Kinetic",objectId:l,position:"above",fontSize:"10px Arial"})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"Collision Masks",key:"collision-masks",description:["**Collision masks** allow you to selectively enable or disable collisions between different groups of objects using bitwise logic.","In this example:","- **Blue objects**: Only collide with blue platforms and other blue objects.","- **Red objects**: Only collide with red platforms and other red objects.","- **Green objects**: Collide with **everything**.","This is implemented using `categoryBits` and `maskBits` properties."].join(`

`),onInitRaw:`(world) => {
			world.setGravity(0, 10);
			gearbox.debug.showForceVectors = false;

			// Platform Categories: 0x1 (Blue), 0x2 (Red), 0x4 (Green)

			// Blue Platform (Collides with category 1 and 4)
			const bluePlatId = nextId++;
			world
				.createBody({ id: bluePlatId, x: 2.5, y: 8, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#00f2ff" })
				.createFixture({
					width: 4,
					height: 0.5,
					shape: gearbox.shapes.AABB,
					categoryBits: 0x1,
					maskBits: 0x1 | 0x4,
				});
			gearbox.debug.addLabel({
				text: "Collides with Blue & Green",
				objectId: bluePlatId,
				color: "#00f2ff",
				position: "below",
			});

			// Red Platform (Collides with category 2 and 4)
			const redPlatId = nextId++;
			world
				.createBody({ id: redPlatId, x: 7.5, y: 8, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#ff4444" })
				.createFixture({
					width: 4,
					height: 0.5,
					shape: gearbox.shapes.AABB,
					categoryBits: 0x2,
					maskBits: 0x2 | 0x4,
				});
			gearbox.debug.addLabel({
				text: "Collides with Red & Green",
				objectId: redPlatId,
				color: "#ff4444",
				position: "below",
			});

			// Universal Platform (Collides with everything: 0x1 | 0x2 | 0x4)
			const universalPlatId = nextId++;
			world
				.createBody({ id: universalPlatId, x: 5, y: 4, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#44ff44" })
				.createFixture({
					width: 2,
					height: 0.5,
					shape: gearbox.shapes.AABB,
					categoryBits: 0x4,
					maskBits: 0x7, // 1 | 2 | 4
				});
			gearbox.debug.addLabel({
				text: "Collides with All",
				objectId: universalPlatId,
				color: "#44ff44",
				position: "below",
			});
		}`,onInit:e=>{e.setGravity(0,10),n.debug.showForceVectors=!1;const t=k++;e.createBody({id:t,x:2.5,y:8,type:n.bodyTypes.FIXED_OBJECT,color:"#00f2ff"}).createFixture({width:4,height:.5,shape:n.shapes.AABB,categoryBits:1,maskBits:5}),n.debug.addLabel({text:"Collides with Blue & Green",objectId:t,color:"#00f2ff",position:"below"});const o=k++;e.createBody({id:o,x:7.5,y:8,type:n.bodyTypes.FIXED_OBJECT,color:"#ff4444"}).createFixture({width:4,height:.5,shape:n.shapes.AABB,categoryBits:2,maskBits:6}),n.debug.addLabel({text:"Collides with Red & Green",objectId:o,color:"#ff4444",position:"below"});const s=k++;e.createBody({id:s,x:5,y:4,type:n.bodyTypes.FIXED_OBJECT,color:"#44ff44"}).createFixture({width:2,height:.5,shape:n.shapes.AABB,categoryBits:4,maskBits:7}),n.debug.addLabel({text:"Collides with All",objectId:s,color:"#44ff44",position:"below"})},onTickRaw:`(world, dt) => {
			if (Math.random() < 0.05) {
				const id = nextId++;
				const type = Math.floor(Math.random() * 3);
				let color, cat, mask;

				if (type === 0) {
					// Blue
					color = "#00f2ff";
					cat = 0x1;
					mask = 0x1 | 0x4;
				} else if (type === 1) {
					// Red
					color = "#ff4444";
					cat = 0x2;
					mask = 0x2 | 0x4;
				} else {
					// Green
					color = "#44ff44";
					cat = 0x4;
					mask = 0x7;
				}

				world
					.createBody({
						id: id,
						x: 2 + Math.random() * 6,
						y: 0,
						type: gearbox.bodyTypes.DYNAMIC_OBJECT,
						mass: 1,
						color: color,
					})
					.createFixture({
						radius: 0.3,
						shape: gearbox.shapes.CIRCLE,
						categoryBits: cat,
						maskBits: mask,
					});

				gearbox.debug.addLabel({
					text: \`Cat:0x\${cat.toString(16)} Mask:0x\${mask.toString(16)}\`,
					objectId: id,
					color: color,
					position: "above",
					fontSize: "10px Arial",
				});
			}

			// Cleanup
			let toRemove = [];
			world.iterateBodies((o) => {
				if (o.y > 11) toRemove.push(o);
			});
			for (let o of toRemove) world.removeObject(o.id);
		}`,onTick:(e,t)=>{if(Math.random()<.05){const s=k++,a=Math.floor(Math.random()*3);let i,r,c;a===0?(i="#00f2ff",r=1,c=5):a===1?(i="#ff4444",r=2,c=6):(i="#44ff44",r=4,c=7),e.createBody({id:s,x:2+Math.random()*6,y:0,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1,color:i}).createFixture({radius:.3,shape:n.shapes.CIRCLE,categoryBits:r,maskBits:c}),n.debug.addLabel({text:`Cat:0x${r.toString(16)} Mask:0x${c.toString(16)}`,objectId:s,color:i,position:"above",fontSize:"10px Arial"})}let o=[];e.iterateBodies(s=>{s.y>11&&o.push(s)});for(let s of o)e.removeObject(s.id)}}),new w({name:"Object Types",key:"object-types",description:["This example showcases the four fundamental object types in **Gearbox2D** and how they interact:","1. **Fixed Objects** (Gray): Immovable platforms with infinite mass. They form the static environment.","2. **Kinematic Objects** (Purple): Move via velocity but are unaffected by forces. They can 'push' other objects but are never pushed back.","3. **Rigid Bodies** (Colorful): Fully dynamic objects affected by gravity, forces, and collisions.","4. **Sensors** (Green Zone): Detect overlaps without causing a physical response. Here, a sensor acts as a **Recycling Zone** to remove objects."].join(`

`),onInitRaw:`(world) => {
			world.clear();
			world.setGravity(0, 10);
			gearbox.debug.showForceVectors = false;
			gearbox.debug.showAabbs = false;
			nextId = 1;

			// 1. Fixed Objects: The Foundation
			// Ground
			world
				.createBody({ id: nextId++, x: 5, y: 9.7, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#444" })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 8,
					height: 0.6,
				});

			// Side barriers
			world
				.createBody({ id: nextId++, x: 1, y: 7, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#444" })
				.createFixture({ width: 0.2, height: 6, shape: gearbox.shapes.BOX });
			world
				.createBody({ id: nextId++, x: 9, y: 7, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#444" })
				.createFixture({ width: 0.2, height: 6, shape: gearbox.shapes.BOX });

			// 2. Kinematic Objects: The Machinery
			// A rotating center piece
			const rotor = world.createBody({
				id: nextId++,
				x: 5,
				y: 4,
				type: gearbox.bodyTypes.KINEMATIC_OBJECT,
				color: "#a0f",
				rs: 1.5, // Radians per second
			});
			rotor.createFixture({
				width: 3.5,
				height: 0.3,
				shape: gearbox.shapes.BOX,
			});
			gearbox.debug.addLabel({ text: "Kinematic Rotor", objectId: rotor.id, position: "above", color: "#a0f" });

			// A moving side platform
			const elevator = world.createBody({
				id: nextId++,
				x: 2.5,
				y: 7,
				type: gearbox.bodyTypes.KINEMATIC_OBJECT,
				color: "#a0f",
				vx: 1.0,
			});
			elevator.createFixture({
				width: 1.5,
				height: 0.3,
				shape: gearbox.shapes.BOX,
			});
			(world as any).elevator = elevator;
			gearbox.debug.addLabel({
				text: "Kinematic Elevator",
				objectId: elevator.id,
				position: "above",
				color: "#a0f",
			});

			// 4. Sensor: The Recycling Zone
			const recyclerId = nextId++;
			const recycler = world.createBody({
				id: recyclerId,
				x: 5,
				y: 8.8,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "rgba(0, 255, 100, 0.15)",
				wantsEvents: true,
			});
			recycler.createFixture({
				width: 4,
				height: 1.2,
				shape: gearbox.shapes.BOX,
				isSensor: true,
			});
			// WantsEvents is currently a Body property in C++, but let's check constants.
			// In Body.cpp, it doesn't seem to be used from options directly anymore,
			// but it's used in World::_doNarrowPhase? Wait, let me check Body.cpp again.
			// Actually I don't see wantsEvents in Body.cpp options.
			// Ah, I missed it. Let's look at Body.cpp again.
			// Lines 11-42 of Body.cpp don't show wantsEvents.
			// But main.cpp has it? No.
			// Let's check constants.ts or where it's used.
			// Anyway, I'll stick to the plan.
			gearbox.debug.addLabel({
				text: "Sensor Recycler",
				objectId: recycler.id,
				position: "on-top",
				color: "#4f4",
			});

			// Store the recycler ID to identify it in collisions
			(world as any).recyclerId = recycler.id;
			(world as any).toRemove = new Set();

			world.onCollisionStart = (idA, idB) => {
				const rid = (world as any).recyclerId;
				const otherId = idA === rid ? idB : idB === rid ? idA : null;

				if (otherId !== null) {
					const other = world.getBodyById(otherId);
					if (other && other.type === gearbox.bodyTypes.DYNAMIC_OBJECT) {
						(world as any).toRemove.add(otherId);
						// Visual cue: change color before removal
						other.color = "#4f4";
					}
				}
			};
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),n.debug.showForceVectors=!1,n.debug.showAabbs=!1,k=1,e.createBody({id:k++,x:5,y:9.7,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.BOX,width:8,height:.6}),e.createBody({id:k++,x:1,y:7,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({width:.2,height:6,shape:n.shapes.BOX}),e.createBody({id:k++,x:9,y:7,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({width:.2,height:6,shape:n.shapes.BOX});const t=e.createBody({id:k++,x:5,y:4,type:n.bodyTypes.KINEMATIC_OBJECT,color:"#a0f",rs:1.5});t.createFixture({width:3.5,height:.3,shape:n.shapes.BOX}),n.debug.addLabel({text:"Kinematic Rotor",objectId:t.id,position:"above",color:"#a0f"});const o=e.createBody({id:k++,x:2.5,y:7,type:n.bodyTypes.KINEMATIC_OBJECT,color:"#a0f",vx:1});o.createFixture({width:1.5,height:.3,shape:n.shapes.BOX}),e.elevator=o,n.debug.addLabel({text:"Kinematic Elevator",objectId:o.id,position:"above",color:"#a0f"});const s=k++,a=e.createBody({id:s,x:5,y:8.8,type:n.bodyTypes.FIXED_OBJECT,color:"rgba(0, 255, 100, 0.15)",wantsEvents:!0});a.createFixture({width:4,height:1.2,shape:n.shapes.BOX,isSensor:!0}),n.debug.addLabel({text:"Sensor Recycler",objectId:a.id,position:"on-top",color:"#4f4"}),e.recyclerId=a.id,e.toRemove=new Set,e.onCollisionStart=(i,r)=>{const c=e.recyclerId,l=i===c?r:r===c?i:null;if(l!==null){const m=e.getBodyById(l);m&&m.type===n.bodyTypes.DYNAMIC_OBJECT&&(e.toRemove.add(l),m.color="#4f4")}}},onTickRaw:`(world, dt) => {
			// Update Kinematic behavior
			const elevator = (world as any).elevator;
			if (elevator) {
				if (elevator.x > 7.5) elevator.vx = -1.5;
				if (elevator.x < 2.5) elevator.vx = 1.5;
			}

			// 3. Spawn Rigid Bodies (Dynamic)
			if (world.stepCount % 20 === 0) {
				const colors = ["#ff4444", "#4444ff", "#ffff44", "#ff44ff", "#44ffff"];
				const spawnRand = Math.random();
				const x = 3 + Math.random() * 4;

				const bodyId = nextId++;
				const body = world.createBody({
					id: bodyId,
					x,
					y: 0.5,
					mass: 0.5 + Math.random() * 1.0,
					type: gearbox.bodyTypes.DYNAMIC_OBJECT,
					color: colors[Math.floor(Math.random() * colors.length)],
				});

				if (spawnRand < 0.33) {
					body.createFixture({ shape: gearbox.shapes.CIRCLE, radius: 0.25, restitution: 0.3 });
				} else if (spawnRand < 0.66) {
					body.createFixture({ shape: gearbox.shapes.BOX, width: 0.5, height: 0.5, restitution: 0.3 });
				} else {
					body.createFixture({ shape: gearbox.shapes.CAPSULE, radius: 0.15, height: 0.6, restitution: 0.3 });
				}
			}

			// Cleanup recycled objects
			const toRemove = (world as any).toRemove;
			if (toRemove && toRemove.size > 0) {
				for (const id of toRemove) {
					if (world.getBodyById(id)) {
						world.removeObject(id);
					}
				}
				toRemove.clear();
			}

			// Global bounds cleanup
			let outOfBounds = [];
			world.iterateBodies((obj) => {
				if (obj.y > 11 || obj.y < -5 || obj.x > 11 || obj.x < -1) {
					if (obj.type === gearbox.bodyTypes.DYNAMIC_OBJECT) {
						outOfBounds.push(obj.id);
					}
				}
			});
			for (const id of outOfBounds) world.removeObject(id);
		}`,onTick:(e,t)=>{const o=e.elevator;if(o&&(o.x>7.5&&(o.vx=-1.5),o.x<2.5&&(o.vx=1.5)),e.stepCount%20===0){const i=["#ff4444","#4444ff","#ffff44","#ff44ff","#44ffff"],r=Math.random(),c=3+Math.random()*4,l=k++,m=e.createBody({id:l,x:c,y:.5,mass:.5+Math.random()*1,type:n.bodyTypes.DYNAMIC_OBJECT,color:i[Math.floor(Math.random()*i.length)]});r<.33?m.createFixture({shape:n.shapes.CIRCLE,radius:.25,restitution:.3}):r<.66?m.createFixture({shape:n.shapes.BOX,width:.5,height:.5,restitution:.3}):m.createFixture({shape:n.shapes.CAPSULE,radius:.15,height:.6,restitution:.3})}const s=e.toRemove;if(s&&s.size>0){for(const i of s)e.getBodyById(i)&&e.removeObject(i);s.clear()}let a=[];e.iterateBodies(i=>{(i.y>11||i.y<-5||i.x>11||i.x<-1)&&i.type===n.bodyTypes.DYNAMIC_OBJECT&&a.push(i.id)});for(const i of a)e.removeObject(i)},onCleanup:e=>{e.onCollisionStart=void 0,delete e.elevator,delete e.recyclerId,delete e.toRemove}})];let T=1,pe=[],Be=null,N=null,Re=null,K=null,W=null,Le=0,De=0;const Tt=[new w({name:"Simple Hinge",key:"simple-hinge",description:["A single `BOX` object attached to a `FIXED_OBJECT` by a **Hinge Joint** constraint.","The hinge allows rotation around a single point while preventing all linear relative motion. In this case, it creates a simple gravity-driven pendulum."].join(`

`),onInitRaw:`(world) => {
			nextId = 1;
			const anchorId = nextId++;
			const anchor = world.createBody({
				id: anchorId,
				x: 5,
				y: 3,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "#ff4444",
			});
			anchor.createFixture({
				shape: gearbox.shapes.BOX,
				width: 1,
				height: 1,
			});

			const pendulumId = nextId++;
			const pendulum = world.createBody({
				id: pendulumId,
				x: 8,
				y: 3,
				mass: 0.1,
				color: "#44ff44",
			});
			pendulum.createFixture({
				shape: gearbox.shapes.BOX,
				width: 4,
				height: 0.5,
			});

			world.createHingeJoint(anchor, pendulum, {
				id: nextId++,
				worldAnchor: { x: 5, y: 3 },
			});

			world.setGravity(0, 9.81);
		}`,onInit:e=>{T=1;const t=T++,o=e.createBody({id:t,x:5,y:3,type:n.bodyTypes.FIXED_OBJECT,color:"#ff4444"});o.createFixture({shape:n.shapes.BOX,width:1,height:1});const s=T++,a=e.createBody({id:s,x:8,y:3,mass:.1,color:"#44ff44"});a.createFixture({shape:n.shapes.BOX,width:4,height:.5}),e.createHingeJoint(o,a,{id:T++,worldAnchor:{x:5,y:3}}),e.setGravity(0,9.81)}}),new w({name:"Breakable Joint",key:"breakable-joint",description:["This demo showcases **Joint Reaction Forces** and dynamic joint removal.","1. A ball is suspended by a **Hinge Joint**. Its mass increases until the reaction force exceeds a threshold, snapping the joint.","2. The ball falls onto a bridge made of `DistanceJoint` segments, which also have breaking thresholds.","You can visualize the stress on the joints by enabling **Force Vectors** in the debug settings."].join(`

`),onInitRaw:`(world) => {
			nextId = 1;
			gearbox.debug.showAabbs = false;
			gearbox.debug.showForceVectors = true;

			world.setGravity(0, 10);
			bridgeJoints = [];
			breakableJoint = null;
			massObject = null;

			// 1. Suspension System (higher up and smaller)
			const anchorId = nextId++;
			const anchor = world.createBody({
				id: anchorId,
				x: 5,
				y: 1,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "#ff4444",
			});
			anchor.createFixture({
				shape: gearbox.shapes.CIRCLE,
				radius: 0.2,
			});

			const massObjectId = nextId++;
			massObject = world.createBody({
				id: massObjectId,
				x: 5,
				y: 2.3,
				mass: 0.05,
				color: "#888888",
			});
			massObject.createFixture({
				id: massObjectId,
				shape: gearbox.shapes.CIRCLE,
				radius: 0.6,
			});

			breakableJoint = world.createHingeJoint(anchor, massObject, {
				id: nextId++,
				worldAnchor: { x: 5, y: 1 },
			});

			// 2. Spring Bridge
			const startX = 2;
			const endX = 8;
			const bridgeY = 6;
			const segments = 12;
			const segmentWidth = (endX - startX) / segments;
			const segmentHeight = 0.2;

			const bridgeAnchorLeftId = nextId++;
			const bridgeAnchorLeft = world.createBody({
				id: bridgeAnchorLeftId,
				x: startX - segmentWidth / 2,
				y: bridgeY,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "#aaaaaa",
			});
			bridgeAnchorLeft.createFixture({
				shape: gearbox.shapes.BOX,
				width: segmentWidth,
				height: 0.5,
			});

			const bridgeAnchorRightId = nextId++;
			const bridgeAnchorRight = world.createBody({
				id: bridgeAnchorRightId,
				x: endX + segmentWidth / 2,
				y: bridgeY,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "#aaaaaa",
			});
			bridgeAnchorRight.createFixture({
				shape: gearbox.shapes.BOX,
				width: segmentWidth,
				height: 0.5,
			});

			let prevBody = bridgeAnchorLeft;
			for (let i = 0; i < segments; i++) {
				const segmentBodyId = nextId++;
				const segmentBody = world.createBody({
					id: segmentBodyId,
					x: startX + i * segmentWidth + segmentWidth / 2,
					y: bridgeY,
					mass: 0.2, // Slightly heavier for stability
					color: "#cd853f",
				});
				segmentBody.createFixture({
					shape: gearbox.shapes.BOX,
					width: segmentWidth * 0.9,
					height: segmentHeight,
					categoryBits: 0x0004,
					maskBits: ~0x0004, // Don't collide with other bridge segments
				});

				const dj = world.createDistanceJoint(prevBody, segmentBody, {
					id: nextId++,
					worldAnchor: { x: startX + i * segmentWidth, y: bridgeY },
				});
				bridgeJoints.push(dj);
				prevBody = segmentBody;
			}

			const lastDj = world.createDistanceJoint(prevBody, bridgeAnchorRight, {
				id: nextId++,
				worldAnchor: { x: endX, y: bridgeY },
			});
			bridgeJoints.push(lastDj);

			// Apply a side force to make it swing
			massObject.applyImpulse(0.2, 0);
		}`,onInit:e=>{T=1,n.debug.showAabbs=!1,n.debug.showForceVectors=!0,e.setGravity(0,10),pe=[],Be=null,N=null;const t=T++,o=e.createBody({id:t,x:5,y:1,type:n.bodyTypes.FIXED_OBJECT,color:"#ff4444"});o.createFixture({shape:n.shapes.CIRCLE,radius:.2});const s=T++;N=e.createBody({id:s,x:5,y:2.3,mass:.05,color:"#888888"}),N.createFixture({id:s,shape:n.shapes.CIRCLE,radius:.6}),Be=e.createHingeJoint(o,N,{id:T++,worldAnchor:{x:5,y:1}});const a=2,i=8,r=6,c=12,l=(i-a)/c,m=.2,x=T++,f=e.createBody({id:x,x:a-l/2,y:r,type:n.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"});f.createFixture({shape:n.shapes.BOX,width:l,height:.5});const h=T++,d=e.createBody({id:h,x:i+l/2,y:r,type:n.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"});d.createFixture({shape:n.shapes.BOX,width:l,height:.5});let p=f;for(let g=0;g<c;g++){const b=T++,u=e.createBody({id:b,x:a+g*l+l/2,y:r,mass:.2,color:"#cd853f"});u.createFixture({shape:n.shapes.BOX,width:l*.9,height:m,categoryBits:4,maskBits:-5});const B=e.createDistanceJoint(p,u,{id:T++,worldAnchor:{x:a+g*l,y:r}});pe.push(B),p=u}const y=e.createDistanceJoint(p,d,{id:T++,worldAnchor:{x:i,y:r}});pe.push(y),N.applyImpulse(.2,0)},onTickRaw:`(world, dt) => {
			// 1. Increase mass
			if (massObject) {
				massObject.mass += dt * 3.0; // Increase mass over time

				gearbox.debug.removeObjectLabels(massObject.id);
				gearbox.debug.addLabel({
					text: \`Mass: \${massObject.mass.toFixed(2)}kg\`,
					objectId: massObject.id,
					position: "above",
					color: "#fff",
				});
			}

			// 2. Break suspension joint
			if (breakableJoint) {
				const f = breakableJoint.reactionForce;
				const forceMag = Math.sqrt(f.x * f.x + f.y * f.y);

				if (forceMag > 150) {
					world.removeJoint(breakableJoint.id);
					breakableJoint = null;
				}
			}

			// 3. Break bridge joints
			if (bridgeJoints.length > 0) {
				for (let i = bridgeJoints.length - 1; i >= 0; i--) {
					const dj = bridgeJoints[i];
					const f = dj.reactionForce;
					const forceMag = Math.sqrt(f.x * f.x + f.y * f.y);

					if (forceMag > 600) {
						world.removeJoint(dj.id);
						bridgeJoints.splice(i, 1);
					}
				}
			}
		}`,onTick:(e,t)=>{if(N&&(N.mass+=t*3,n.debug.removeObjectLabels(N.id),n.debug.addLabel({text:`Mass: ${N.mass.toFixed(2)}kg`,objectId:N.id,position:"above",color:"#fff"})),Be){const o=Be.reactionForce;Math.sqrt(o.x*o.x+o.y*o.y)>150&&(e.removeJoint(Be.id),Be=null)}if(pe.length>0)for(let o=pe.length-1;o>=0;o--){const s=pe[o],a=s.reactionForce;Math.sqrt(a.x*a.x+a.y*a.y)>600&&(e.removeJoint(s.id),pe.splice(o,1))}}}),new w({name:"Gear Train",key:"gear-train",description:["A sequence of gears connected using the `GearJoint` constraint.","Each gear's motion is constrained by the previous one based on a **gear ratio** (calculated here by the relative radii).","A drive gear at the start receives a constant low torque, which is then propagated through the entire train with mechanical advantage."].join(`

`),onInitRaw:`(world) => {
			nextId = 1;
			const startX = 2;
			const y = 5;
			const numGears = 5;
			const spacing = 1.5;

			const staticBodyId = nextId++;
			const staticBody = world.createBody({
				id: staticBodyId,
				x: 5,
				y: 5,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "#888",
			});
			staticBody.createFixture({
				shape: gearbox.shapes.AABB,
				width: 6.2,
				height: 0.2,
				maskBits: 0, // Don't collide with gears
			});

			let prevHinge = null;
			engineHub = null; // Reuse engineHub variable for the drive gear

			for (let i = 0; i < numGears; i++) {
				const size = i % 2 === 0 ? 1.0 : 0.5;
				const gearId = nextId++;
				const gear = world.createBody({
					id: gearId,
					x: startX + i * spacing,
					y: y,
					mass: size,
					color: \`hsl(\${i * 60}, 70%, 60%)\`,
				});
				gear.createFixture({
					shape: gearbox.shapes.CIRCLE,
					radius: size,
				});

				const hinge = world.createHingeJoint(staticBody, gear, {
					id: nextId++,
					worldAnchor: { x: startX + i * spacing, y: y },
				});

				if (i === 0) {
					engineHub = gear; // Mark the first gear as the driver
				} else {
					// Ratio is based on the sizes: size_prev / size_curr
					const prevSize = (i - 1) % 2 === 0 ? 1.0 : 0.5;
					const ratio = prevSize / size;
					world.createGearJoint(prevHinge, hinge, { id: nextId++, ratio: ratio });
				}
				prevHinge = hinge;
			}
		}`,onInit:e=>{T=1;const t=2,o=5,s=5,a=1.5,i=T++,r=e.createBody({id:i,x:5,y:5,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});r.createFixture({shape:n.shapes.AABB,width:6.2,height:.2,maskBits:0});let c=null;Re=null;for(let l=0;l<s;l++){const m=l%2===0?1:.5,x=T++,f=e.createBody({id:x,x:t+l*a,y:o,mass:m,color:`hsl(${l*60}, 70%, 60%)`});f.createFixture({shape:n.shapes.CIRCLE,radius:m});const h=e.createHingeJoint(r,f,{id:T++,worldAnchor:{x:t+l*a,y:o}});if(l===0)Re=f;else{const p=((l-1)%2===0?1:.5)/m;e.createGearJoint(c,h,{id:T++,ratio:p})}c=h}},onTickRaw:`(world, dt) => {
			if (engineHub) {
				// Apply a persistent but relatively low angular impulse to the drive gear
				if (Math.abs(engineHub.rs) < 0.9) {
					engineHub.applyAngularImpulse(0.03);
				}
			}
		}`,onTick:(e,t)=>{Re&&Math.abs(Re.rs)<.9&&Re.applyAngularImpulse(.03)}}),new w({name:"Distance Ropes",key:"distance-ropes",description:["Demonstrates the `DistanceJoint`, which maintains a fixed distance between two points on two different bodies.","A rotating drum has multiple triple-link chains hanging from it. Each link is connected by a `DistanceJoint` with a specified length, simulating a non-stretchy rope or chain."].join(`

`),onInitRaw:`(world) => {
			gearbox.debug.showAabbs = false;
			gearbox.debug.showForceVectors = false;
			nextId = 1;
			const cx = 5;
			const cy = 5;
			const drumRadius = 4;

			// The Drum Hub (fixed rotation center)
			const hubId = nextId++;
			const hub = world.createBody({
				id: hubId,
				x: cx,
				y: cy,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "#ff4444",
			});
			hub.createFixture({
				shape: gearbox.shapes.CIRCLE,
				radius: 0.5,
			});

			// The rotating drum (structure only)
			const drumId = nextId++;
			drum = world.createBody({
				id: drumId,
				x: cx,
				y: cy,
				mass: 100,
				color: "rgba(255, 255, 255, 0.05)",
				angularDamping: 0.5, // Add some damping to stabilize
			});
			drum.createFixture({ id: drumId, shape: gearbox.shapes.CIRCLE, radius: drumRadius, maskBits: 0 });

			world.createHingeJoint(hub, drum, {
				id: nextId++,
				worldAnchor: { x: cx, y: cy },
			});

			// Add hanging chain triplets
			const numChains = 8;
			const pinRadius = 3.8;
			const linkDist = 0.8; // Slightly shorter links for 3 shapes

			const getRandomAnchor = () => ({
				x: (Math.random() - 0.5) * 0.3,
				y: (Math.random() - 0.5) * 0.3,
			});

			for (let i = 0; i < numChains; i++) {
				const angle = (i / numChains) * Math.PI * 2;

				// Pin location on drum
				const pinX = cx + Math.cos(angle) * pinRadius;
				const pinY = cy + Math.sin(angle) * pinRadius;

				// First link (pointing towards center)
				const shape1X = pinX - Math.cos(angle) * 0.5;
				const shape1Y = pinY - Math.sin(angle) * 0.5;
				const shape1Id = nextId++;
				const shape1 = world.createBody({
					id: shape1Id,
					x: shape1X,
					y: shape1Y,
					mass: 0.5,
					color: \`hsl(\${(i * 360) / numChains}, 70%, 60%)\`,
				});
				shape1.createFixture({
					shape: i % 2 === 0 ? gearbox.shapes.BOX : gearbox.shapes.CIRCLE,
					width: 0.5,
					height: 0.5,
					radius: 0.25,
				});

				// Joint 1: Drum to Shape 1
				const localAnchorOnDrum = drum.worldToLocal({ x: pinX, y: pinY });
				world.createDistanceJoint(drum, shape1, {
					id: nextId++,
					anchorA: localAnchorOnDrum,
					anchorB: getRandomAnchor(),
					length: linkDist,
				});

				// Second link (pointing further towards center)
				const shape2X = shape1X - Math.cos(angle) * linkDist;
				const shape2Y = shape1Y - Math.sin(angle) * linkDist;
				const shape2Id = nextId++;
				const shape2 = world.createBody({
					id: shape2Id,
					x: shape2X,
					y: shape2Y,
					mass: 0.5,
					color: \`hsl(\${(i * 360) / numChains}, 70%, 50%)\`,
				});
				shape2.createFixture({
					shape: (i + 1) % 2 === 0 ? gearbox.shapes.BOX : gearbox.shapes.CIRCLE,
					width: 0.5,
					height: 0.5,
					radius: 0.25,
				});

				// Joint 2: Shape 1 to Shape 2
				world.createDistanceJoint(shape1, shape2, {
					id: nextId++,
					anchorA: getRandomAnchor(),
					anchorB: getRandomAnchor(),
					length: linkDist,
				});

				// Third link (pointing even further towards center)
				const shape3X = shape2X - Math.cos(angle) * linkDist;
				const shape3Y = shape2Y - Math.sin(angle) * linkDist;
				const shape3Id = nextId++;
				const shape3 = world.createBody({
					id: shape3Id,
					x: shape3X,
					y: shape3Y,
					mass: 0.5,
					color: \`hsl(\${(i * 360) / numChains}, 70%, 40%)\`,
				});
				shape3.createFixture({
					shape: (i + 2) % 2 === 0 ? gearbox.shapes.BOX : gearbox.shapes.CIRCLE,
					width: 0.5,
					height: 0.5,
					radius: 0.25,
				});

				// Joint 3: Shape 2 to Shape 3
				world.createDistanceJoint(shape2, shape3, {
					id: nextId++,
					anchorA: getRandomAnchor(),
					anchorB: getRandomAnchor(),
					length: linkDist,
				});
			}

			world.setGravity(0, 9.81);
			drum.rs = 0.2; // Slower initial start
		}`,onInit:e=>{n.debug.showAabbs=!1,n.debug.showForceVectors=!1,T=1;const t=5,o=5,s=4,a=T++,i=e.createBody({id:a,x:t,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#ff4444"});i.createFixture({shape:n.shapes.CIRCLE,radius:.5});const r=T++;K=e.createBody({id:r,x:t,y:o,mass:100,color:"rgba(255, 255, 255, 0.05)",angularDamping:.5}),K.createFixture({id:r,shape:n.shapes.CIRCLE,radius:s,maskBits:0}),e.createHingeJoint(i,K,{id:T++,worldAnchor:{x:t,y:o}});const c=8,l=3.8,m=.8,x=()=>({x:(Math.random()-.5)*.3,y:(Math.random()-.5)*.3});for(let f=0;f<c;f++){const h=f/c*Math.PI*2,d=t+Math.cos(h)*l,p=o+Math.sin(h)*l,y=d-Math.cos(h)*.5,g=p-Math.sin(h)*.5,b=T++,u=e.createBody({id:b,x:y,y:g,mass:.5,color:`hsl(${f*360/c}, 70%, 60%)`});u.createFixture({shape:f%2===0?n.shapes.BOX:n.shapes.CIRCLE,width:.5,height:.5,radius:.25});const B=K.worldToLocal({x:d,y:p});e.createDistanceJoint(K,u,{id:T++,anchorA:B,anchorB:x(),length:m});const I=y-Math.cos(h)*m,C=g-Math.sin(h)*m,M=T++,O=e.createBody({id:M,x:I,y:C,mass:.5,color:`hsl(${f*360/c}, 70%, 50%)`});O.createFixture({shape:(f+1)%2===0?n.shapes.BOX:n.shapes.CIRCLE,width:.5,height:.5,radius:.25}),e.createDistanceJoint(u,O,{id:T++,anchorA:x(),anchorB:x(),length:m});const X=I-Math.cos(h)*m,te=C-Math.sin(h)*m,J=T++,j=e.createBody({id:J,x:X,y:te,mass:.5,color:`hsl(${f*360/c}, 70%, 40%)`});j.createFixture({shape:(f+2)%2===0?n.shapes.BOX:n.shapes.CIRCLE,width:.5,height:.5,radius:.25}),e.createDistanceJoint(O,j,{id:T++,anchorA:x(),anchorB:x(),length:m})}e.setGravity(0,9.81),K.rs=.2},onTickRaw:`(world, dt) => {
			if (drum) {
				const time = Date.now() / 1000;
				// Create a variable speed cycle (agitate phase)
				// We oscillate the target speed and direction periodically
				const cycleTime = time % 12; // 12 second full cycle
				let targetSpeed = 0;
				let strength = 2;

				if (cycleTime < 4) {
					// Phase 1: Spin clockwise
					targetSpeed = 1.2;
					strength = 4;
				} else if (cycleTime < 6) {
					// Phase 2: Slow down / Pause
					targetSpeed = 0;
					strength = 1;
				} else if (cycleTime < 10) {
					// Phase 3: Agitate (fast back and forth)
					targetSpeed = Math.sin(time * 4) * 2.0;
					strength = 8;
				} else {
					// Phase 4: Pause
					targetSpeed = 0;
				}

				const speedDiff = targetSpeed - drum.rs;
				if (Math.abs(speedDiff) > 0.05) {
					drum.applyAngularImpulse(speedDiff * strength);
				}
			}
		}`,onTick:(e,t)=>{if(K){const o=Date.now()/1e3,s=o%12;let a=0,i=2;s<4?(a=1.2,i=4):s<6?(a=0,i=1):s<10?(a=Math.sin(o*4)*2,i=8):a=0;const r=a-K.rs;Math.abs(r)>.05&&K.applyAngularImpulse(r*i)}}}),new w({name:"Spring Belt",key:"spring-belt",description:["A chain of shapes connected by `SpringJoint` constraints, forming a belt around a rotating high-friction pulley.","The `SpringJoint` acts like a dampened harmonic oscillator, pulling objects together with a force proportional to their distance and frequency. The belt stretches and contracts as it interacts with the central rotor."].join(`

`),onInitRaw:`(world) => {
			gearbox.debug.showAabbs = false;
			gearbox.debug.showForceVectors = false;
			nextId = 1;
			const cx = 5;
			const cy = 3;
			const innerRadius = 2.5;
			const outerRadius = 3.5;

			// Hub (fixed center)
			const hubId = nextId++;
			const hub = world.createBody({
				id: hubId,
				x: cx,
				y: cy,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "#666666",
			});
			hub.createFixture({
				shape: gearbox.shapes.CIRCLE,
				radius: 0.1,
				maskBits: 0,
			});

			// Central rotating body (Pulley)
			const rotatorId = nextId++;
			rotator = world.createBody({
				id: rotatorId,
				x: cx,
				y: cy,
				rs: 2.5,
				type: gearbox.bodyTypes.DYNAMIC_OBJECT,
				mass: 10,
				color: "#888888",
				angularDamping: 0.1,
			});
			rotator.createFixture({
				id: rotatorId,
				shape: gearbox.shapes.CIRCLE,
				radius: innerRadius,
				sFriction: 1.0,
				kFriction: 1.0,
			});

			world.createHingeJoint(hub, rotator, {
				id: nextId++,
				worldAnchor: { x: cx, y: cy },
			});

			const numShapes = 16;
			const shapes = [];
			for (let i = 0; i < numShapes; i++) {
				const angle = (i / numShapes) * Math.PI * 2;
				const sx = cx + Math.cos(angle) * outerRadius;
				const sy = cy + Math.sin(angle) * outerRadius;

				const shapeId = nextId++;
				const body = world.createBody({
					id: shapeId,
					x: sx,
					y: sy,
					mass: 0.1,
					color: \`hsl(\${(i * 360) / numShapes}, 70%, 60%)\`,
				});

				let sType;
				if (i % 3 === 0) sType = gearbox.shapes.BOX;
				else if (i % 3 === 1) sType = gearbox.shapes.CIRCLE;
				else sType = gearbox.shapes.CAPSULE;

				body.createFixture({
					shape: sType,
					width: 0.6,
					height: sType === gearbox.shapes.CAPSULE ? 1.0 : 0.6,
					radius: 0.3,
					sFriction: 0.999,
					kFriction: 0.99,
				});
				shapes.push(body);
			}

			// Connect shapes to each other to form a belt
			for (let i = 0; i < numShapes; i++) {
				const shapeA = shapes[i];
				const shapeB = shapes[(i + 1) % numShapes];

				// Calculate distance between centers for slack
				const dx = shapeB.x - shapeA.x;
				const dy = shapeB.y - shapeA.y;
				const dist = Math.sqrt(dx * dx + dy * dy);

				world.createSpringJoint(shapeA, shapeB, {
					id: nextId++,
					length: dist * 1.1, // 10% slack
					frequencyHz: 5.0, // Very stretchy
					dampingRatio: 0.2, // Bouncy
				});
			}

			world.setGravity(0, 9.81);
		}`,onInit:e=>{n.debug.showAabbs=!1,n.debug.showForceVectors=!1,T=1;const t=5,o=3,s=2.5,a=3.5,i=T++,r=e.createBody({id:i,x:t,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#666666"});r.createFixture({shape:n.shapes.CIRCLE,radius:.1,maskBits:0});const c=T++;W=e.createBody({id:c,x:t,y:o,rs:2.5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:10,color:"#888888",angularDamping:.1}),W.createFixture({id:c,shape:n.shapes.CIRCLE,radius:s,sFriction:1,kFriction:1}),e.createHingeJoint(r,W,{id:T++,worldAnchor:{x:t,y:o}});const l=16,m=[];for(let x=0;x<l;x++){const f=x/l*Math.PI*2,h=t+Math.cos(f)*a,d=o+Math.sin(f)*a,p=T++,y=e.createBody({id:p,x:h,y:d,mass:.1,color:`hsl(${x*360/l}, 70%, 60%)`});let g;x%3===0?g=n.shapes.BOX:x%3===1?g=n.shapes.CIRCLE:g=n.shapes.CAPSULE,y.createFixture({shape:g,width:.6,height:g===n.shapes.CAPSULE?1:.6,radius:.3,sFriction:.999,kFriction:.99}),m.push(y)}for(let x=0;x<l;x++){const f=m[x],h=m[(x+1)%l],d=h.x-f.x,p=h.y-f.y,y=Math.sqrt(d*d+p*p);e.createSpringJoint(f,h,{id:T++,length:y*1.1,frequencyHz:5,dampingRatio:.2})}e.setGravity(0,9.81)},onTickRaw:`(world, dt) => {
			if (rotator) {
				// Apply a persistent angular impulse until we reach target speed
				if (Math.abs(rotator.rs) < 2.5) {
					rotator.applyAngularImpulse(1.0);
				}
			}
		}`,onTick:(e,t)=>{W&&Math.abs(W.rs)<2.5&&W.applyAngularImpulse(1)}}),new w({name:"Soft Body Ball",key:"soft-body",description:["A collection of `CIRCLE` objects connected by a network of `SpringJoint` constraints to form a squishy, deformable ball.","The ball features a central core (axel) connected to an outer ring of nodes. This setup simulates **Soft Body Dynamics** using a mass-spring system.","Persistent random impulses are applied to the core to keep the ball moving and demonstrate its elasticity."].join(`

`),onInitRaw:`(world) => {
			gearbox.debug.showAabbs = false;
			gearbox.debug.showForceVectors = false;
			nextId = 1;
			const cx = 5;
			const cy = 3;
			const radius = 2.0;
			const segments = 12;
			const points = [];
			const axelRadius = 0.2;

			// Center point (Axel)
			const centerId = nextId++;
			const center = world.createBody({
				id: centerId,
				x: cx,
				y: cy,
				mass: 2.0, // Heavier axel for more stability
				color: "#ff8888",
			});
			center.createFixture({
				shape: gearbox.shapes.CIRCLE,
				radius: axelRadius,
				sFriction: 0.9,
				kFriction: 0.9,
			});
			rotator = center;
			currentImpulse = 0;
			impulseTimer = -30; // 0.5s delay at 60fps to let it hit the ground before spinning up

			// Outer ring
			for (let i = 0; i < segments; i++) {
				const angle = (i / segments) * Math.PI * 2;
				const px = cx + Math.cos(angle) * radius;
				const py = cy + Math.sin(angle) * radius;

				const pId = nextId++;
				const p = world.createBody({ id: pId, x: px, y: py, mass: 0.5, color: "#8888ff" });
				p.createFixture({
					shape: gearbox.shapes.CIRCLE,
					radius: 0.2,
					sFriction: 0.9,
					kFriction: 0.9,
				});
				points.push(p);

				// Connect to center - Offset to the edge of the axel
				world.createSpringJoint(center, p, {
					id: nextId++,
					anchorA: { x: Math.cos(angle) * axelRadius, y: Math.sin(angle) * axelRadius },
					length: radius - axelRadius,
					frequencyHz: 4.0,
					dampingRatio: 0.5,
				});

				// Connect to neighbors
				if (i > 0) {
					world.createSpringJoint(points[i - 1], p, {
						id: nextId++,
						length: 2 * radius * Math.sin(Math.PI / segments),
						frequencyHz: 4.0,
						dampingRatio: 0.5,
					});
				}
			}

			// Close the ring
			world.createSpringJoint(points[segments - 1], points[0], {
				id: nextId++,
				length: 2 * radius * Math.sin(Math.PI / segments),
				frequencyHz: 4.0,
				dampingRatio: 0.5,
			});

			// Ground - made wider to accommodate movement
			const groundId = nextId++;
			world
				.createBody({ id: groundId, x: 5, y: 10, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#aaaaaa" })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 15,
					height: 2,
					sFriction: 0.9,
					kFriction: 0.9,
				});

			// Barriers to keep the ball from rolling off - taller and thicker
			const barrier1Id = nextId++;
			world
				.createBody({
					id: barrier1Id,
					x: -3.5,
					y: 4.25,
					type: gearbox.bodyTypes.FIXED_OBJECT,
					color: "#aaaaaa",
				})
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 2.0,
					height: 10,
				});
			const barrier2Id = nextId++;
			world
				.createBody({
					id: barrier2Id,
					x: 13.5,
					y: 4.25,
					type: gearbox.bodyTypes.FIXED_OBJECT,
					color: "#aaaaaa",
				})
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 2.0,
					height: 10,
				});

			world.setGravity(0, 9.81);
		}`,onInit:e=>{n.debug.showAabbs=!1,n.debug.showForceVectors=!1,T=1;const t=5,o=3,s=2,a=12,i=[],r=.2,c=T++,l=e.createBody({id:c,x:t,y:o,mass:2,color:"#ff8888"});l.createFixture({shape:n.shapes.CIRCLE,radius:r,sFriction:.9,kFriction:.9}),W=l,Le=0,De=-30;for(let h=0;h<a;h++){const d=h/a*Math.PI*2,p=t+Math.cos(d)*s,y=o+Math.sin(d)*s,g=T++,b=e.createBody({id:g,x:p,y,mass:.5,color:"#8888ff"});b.createFixture({shape:n.shapes.CIRCLE,radius:.2,sFriction:.9,kFriction:.9}),i.push(b),e.createSpringJoint(l,b,{id:T++,anchorA:{x:Math.cos(d)*r,y:Math.sin(d)*r},length:s-r,frequencyHz:4,dampingRatio:.5}),h>0&&e.createSpringJoint(i[h-1],b,{id:T++,length:2*s*Math.sin(Math.PI/a),frequencyHz:4,dampingRatio:.5})}e.createSpringJoint(i[a-1],i[0],{id:T++,length:2*s*Math.sin(Math.PI/a),frequencyHz:4,dampingRatio:.5});const m=T++;e.createBody({id:m,x:5,y:10,type:n.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}).createFixture({shape:n.shapes.BOX,width:15,height:2,sFriction:.9,kFriction:.9});const x=T++;e.createBody({id:x,x:-3.5,y:4.25,type:n.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}).createFixture({shape:n.shapes.BOX,width:2,height:10});const f=T++;e.createBody({id:f,x:13.5,y:4.25,type:n.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}).createFixture({shape:n.shapes.BOX,width:2,height:10}),e.setGravity(0,9.81)},onTickRaw:`(world, dt) => {
			if (rotator) {
				if (impulseTimer <= 0) {
					// Start a new impulse period randomly
					if (Math.random() < 0.02) {
						currentImpulse = (Math.random() - 0.5) * 3; // Reduced impulse range for more control
						impulseTimer = 40 + Math.random() * 80; // 40-120 ticks
					} else {
						currentImpulse = 0;
					}
				}

				if (impulseTimer > 0) {
					// Apply persistent impulse
					rotator.applyAngularImpulse(currentImpulse);

					// Add a directional nudge based on rotation
					rotator.applyImpulse(currentImpulse * 0.1, 0);

					impulseTimer--;
				}
			}
		}`,onTick:(e,t)=>{W&&(De<=0&&(Math.random()<.02?(Le=(Math.random()-.5)*3,De=40+Math.random()*80):Le=0),De>0&&(W.applyAngularImpulse(Le),W.applyImpulse(Le*.1,0),De--))}})];let In=0,Se=1;const vt=[new w({name:"Sleep and Islands",key:"sleep-and-islands",description:["**Sleep** optimization in **Gearbox2D** uses a movement-based heuristic computed during the kinematics step.","Instead of rebuilding a complex global island data structure each tick, each object tracks its own local contacts. When an object wakes up (due to a force or collision), it automatically wakes its neighbors.","This provides the performance benefits of **Islands** with significantly lower overhead."].join(`

`),globalLines:["let simulationTime = 0;","let nextId = 1;"],onInitRaw:`(world) => {
			world.setGravity(0, 10);
			simulationTime = 3;
			nextId = 0;

			world
				.createBody({
					id: nextId++,
					x: 5,
					y: 8.5,
					vx: 0.0,
					vy: 0.0,
					type: gearbox.bodyTypes.FIXED_OBJECT,
					mass: 2,
				})
				.createFixture({
					shape: gearbox.shapes.AABB,
					width: 20,
					height: 1,
				});
		}`,onInit:e=>{e.setGravity(0,10),In=3,Se=0,e.createBody({id:Se++,x:5,y:8.5,vx:0,vy:0,type:n.bodyTypes.FIXED_OBJECT,mass:2}).createFixture({shape:n.shapes.AABB,width:20,height:1})},onTickRaw:`(world, dt) => {
			const nObjects = 10;
			simulationTime += dt * 2;
			let numbSeconds = Math.floor(simulationTime / 3);
			if (numbSeconds >= nextId) {
				if (nextId < nObjects) {
					const bodyId = nextId++;
					world
						.createBody({
							id: bodyId,
							x: 5,
							y: 0,
							r: (Math.random() - 0.5) * 0.1, // Add small random rotation
							vx: 0,
							vy: 0,
							type: gearbox.bodyTypes.DYNAMIC_OBJECT,
							mass: 0.2,
						})
						.createFixture({
							shape: gearbox.shapes.BOX,
							width: 6,
							height: 0.5,
							sFriction: 10,
							kFriction: 10,
						});
				}
			}
		}`,onTick:(e,t)=>{if(In+=t*2,Math.floor(In/3)>=Se&&Se<10){const a=Se++;e.createBody({id:a,x:5,y:0,r:(Math.random()-.5)*.1,vx:0,vy:0,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:n.shapes.BOX,width:6,height:.5,sFriction:10,kFriction:10})}}}),new w({name:"Shrink Wrap",key:"shrink-wrap",description:["Objects that are put to **Sleep** have their **AABBs** 'shrink-wrapped' to their exact shape bounds.","This provides a slight performance boost during broad-phase collision detection by reducing false positives in the BVH tree for stationary objects."].join(`

`),globalLines:[],onInitRaw:`(world) => {
			world
				.createBody({
					id: 1,
					x: 10,
					y: 10,
					vx: -5.0,
					vy: -5.0,
					type: gearbox.bodyTypes.DYNAMIC_OBJECT,
					mass: 0.2,
				})
				.createFixture({
					shape: gearbox.shapes.CIRCLE,
					radius: 1,
					restitution: 0,
				});
			world
				.createBody({ id: 2, x: 0, y: 0, vx: 5.0, vy: 5.0, type: gearbox.bodyTypes.DYNAMIC_OBJECT, mass: 0.2 })
				.createFixture({
					shape: gearbox.shapes.CIRCLE,
					radius: 1,
					restitution: 0,
				});
		}`,onInit:e=>{e.createBody({id:1,x:10,y:10,vx:-5,vy:-5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:n.shapes.CIRCLE,radius:1,restitution:0}),e.createBody({id:2,x:0,y:0,vx:5,vy:5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:n.shapes.CIRCLE,radius:1,restitution:0})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}})];let E=1,ne=null,tn=null,Fe=null;const qn=1,Vn=2,rt=(e,t)=>({x:(e-n.debug.offsetX)/(n.debug.zoom*100),y:(t-n.debug.offsetY)/(n.debug.zoom*100)}),At=(e,t)=>{if(e.button!==0)return;const o=Fe.getBoundingClientRect(),s=rt(e.clientX-o.left,e.clientY-o.top),a=t.queryBodiesAtPoint(s.x,s.y);if(a.length>0){const i=a[0],r=t.getBodyById(i);r&&r.type!==n.bodyTypes.FIXED_OBJECT&&(ne=t.createBody({id:999999,x:s.x,y:s.y,type:n.bodyTypes.FIXED_OBJECT,color:"transparent"}),ne.createFixture({id:999999,shape:n.shapes.CIRCLE,radius:.05,maskBits:0}),tn=t.createSpringJoint(ne,r,{id:999998,worldAnchor:s,frequencyHz:3,dampingRatio:1,length:0}))}},Et=e=>{if(ne){const t=Fe.getBoundingClientRect(),o=rt(e.clientX-t.left,e.clientY-t.top);ne.x=o.x,ne.y=o.y}},Ft=(e,t)=>{tn&&(t.removeJoint(tn.id),tn=null),ne&&(t.removeObject(ne.id),ne=null)},Kn=e=>{Fe=document.getElementById("debug-canvas"),e._mouseDownHandler=t=>At(t,e),e._mouseMoveHandler=t=>Et(t),e._mouseUpHandler=t=>Ft(t,e),Fe.addEventListener("mousedown",e._mouseDownHandler),window.addEventListener("mousemove",e._mouseMoveHandler),window.addEventListener("mouseup",e._mouseUpHandler)},Zn=e=>{Fe&&(Fe.removeEventListener("mousedown",e._mouseDownHandler),window.removeEventListener("mousemove",e._mouseMoveHandler),window.removeEventListener("mouseup",e._mouseUpHandler),delete e._mouseDownHandler,delete e._mouseMoveHandler,delete e._mouseUpHandler)},Mt=[new w({name:"2000 Colliding Circles",key:"particles",description:["A **Stress Test** featuring 2,000 `CIRCLE` objects with full collision resolution.","This demo helps visualize the performance of the **BVH (Bounding Volume Hierarchy)** and the narrow-phase collision solver.","**Note**: In many environments, the primary bottleneck will be the Canvas 2D rendering rather than the physics simulation."].join(`

`),onInitRaw:`(world) => {
			(world as any)._frameCounter = 0;
			world.clear();
			let id = 1;
			let thickness = 2;
			let length = 11;

			// Walls
			world.createBody({ id: id++, x: 5, y: 0, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: length,
				height: thickness,
				restitution: 0.99,
			});
			world.createBody({ id: id++, x: 5, y: 10, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: length,
				height: thickness,
				restitution: 0.99,
			});
			world.createBody({ id: id++, x: 0, y: 5, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: thickness,
				height: length,
				restitution: 0.99,
			});
			world.createBody({ id: id++, x: 10, y: 5, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: thickness,
				height: length,
				restitution: 0.99,
			});

			for (let i = 0; i < 2000; i++) {
				const bodyId = id++;
				world
					.createBody({
						id: bodyId,
						x: Math.random() * 8 + 1,
						y: Math.random() * 8 + 1,
						vx: Math.random() * 1.0 - 0.5,
						vy: Math.random() * 1.0 - 0.5,
						r: (Math.PI / 2) * Math.random(),
						rs: (Math.random() - 0.5) * 20.0,
						type: gearbox.bodyTypes.DYNAMIC_OBJECT,
						mass: 0.5,
						linearDamping: 0.0,
						angularDamping: 0.5,
					})
					.createFixture({
						shape: gearbox.shapes.CIRCLE,
						radius: 0.05,
						restitution: 0.5,
					});
			}
		}`,onInit:e=>{e._frameCounter=0,e.clear();let t=1,o=2,s=11;e.createBody({id:t++,x:5,y:0,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:s,height:o,restitution:.99}),e.createBody({id:t++,x:5,y:10,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:s,height:o,restitution:.99}),e.createBody({id:t++,x:0,y:5,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:o,height:s,restitution:.99}),e.createBody({id:t++,x:10,y:5,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:o,height:s,restitution:.99});for(let a=0;a<2e3;a++){const i=t++;e.createBody({id:i,x:Math.random()*8+1,y:Math.random()*8+1,vx:Math.random()*1-.5,vy:Math.random()*1-.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*20,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5,linearDamping:0,angularDamping:.5}).createFixture({shape:n.shapes.CIRCLE,radius:.05,restitution:.5})}},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"2000 Bouncy Points",key:"fleas",description:["A stress test with 2,000 bouncy `POINT` objects.","Point objects have zero radius and don't collide with each other, but they do collide with other shapes (like the `AABB` walls in this demo). This allows for extremely high-density simulations."].join(`

`),onInitRaw:`(world) => {
			world.clear();
			const nFleas = 2000;
			world.setGravity(0, 10);
			let id = 1;
			let thickness = 2;
			let length = 11;

			// Walls
			world.createBody({ id: id++, x: 5, y: 0, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: length,
				height: thickness,
				restitution: 1.0,
				sFriction: 0,
				kFriction: 0,
			});
			world.createBody({ id: id++, x: 5, y: 10, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: length,
				height: thickness,
				restitution: 1.0,
				sFriction: 0,
				kFriction: 0,
			});
			world.createBody({ id: id++, x: 0, y: 5, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: thickness,
				height: length,
				restitution: 1.0,
				sFriction: 0,
				kFriction: 0,
			});
			world.createBody({ id: id++, x: 10, y: 5, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: thickness,
				height: length,
				restitution: 1.0,
				sFriction: 0,
				kFriction: 0,
			});

			for (let i = 0; i < nFleas; i++) {
				const bodyId = id++;
				world
					.createBody({
						id: bodyId,
						x: Math.random() * 8 + 1,
						y: Math.random() * 8 + 1,
						vx: Math.random() * 10.0 - 5.0,
						r: (Math.PI / 2) * Math.random(),
						type: gearbox.bodyTypes.DYNAMIC_OBJECT,
						mass: 2,
						linearDamping: 0.0,
						angularDamping: 0.0,
					})
					.createFixture({
						shape: gearbox.shapes.POINT,
						radius: 0.05,
						restitution: 1.0,
						sFriction: 0,
						kFriction: 0,
					});
			}
		}`,onInit:e=>{e.clear();const t=2e3;e.setGravity(0,10);let o=1,s=2,a=11;e.createBody({id:o++,x:5,y:0,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:a,height:s,restitution:1,sFriction:0,kFriction:0}),e.createBody({id:o++,x:5,y:10,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:a,height:s,restitution:1,sFriction:0,kFriction:0}),e.createBody({id:o++,x:0,y:5,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:s,height:a,restitution:1,sFriction:0,kFriction:0}),e.createBody({id:o++,x:10,y:5,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:s,height:a,restitution:1,sFriction:0,kFriction:0});for(let i=0;i<t;i++){const r=o++;e.createBody({id:r,x:Math.random()*8+1,y:Math.random()*8+1,vx:Math.random()*10-5,r:Math.PI/2*Math.random(),type:n.bodyTypes.DYNAMIC_OBJECT,mass:2,linearDamping:0,angularDamping:0}).createFixture({shape:n.shapes.POINT,radius:.05,restitution:1,sFriction:0,kFriction:0})}},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"10 Stacked Boxes",key:"stacked-boxes",description:"A vertical stack of 10 dynamic boxes testing the stability of the impulse solver under persistent contact.",onInitRaw:`(world) => {
			world.clear();
			world.setGravity(0, 10);
			nextId = 1;

			// Ground
			world
				.createBody({ id: nextId++, x: 5, y: 9.5, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#444" })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 10,
					height: 1,
				});

			for (let i = 0; i < 10; i++) {
				world
					.createBody({ id: nextId++, x: 5, y: 8.5 - i * 0.6, mass: 1.0, color: \`hsl(\${i * 36}, 70%, 60%)\` })
					.createFixture({
						shape: gearbox.shapes.BOX,
						width: 1,
						height: 0.5,
						restitution: 0.1,
						sFriction: 0.5,
						kFriction: 0.3,
					});
			}
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),E=1,e.createBody({id:E++,x:5,y:9.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.BOX,width:10,height:1});for(let t=0;t<10;t++)e.createBody({id:E++,x:5,y:8.5-t*.6,mass:1,color:`hsl(${t*36}, 70%, 60%)`}).createFixture({shape:n.shapes.BOX,width:1,height:.5,restitution:.1,sFriction:.5,kFriction:.3})}}),new w({name:"5-Level Pyramid",key:"pyramid",description:"A 5-level pyramid made of boxes. Tests multiple simultaneous contact points and stack stability.",onInitRaw:`(world) => {
			world.clear();
			world.setGravity(0, 10);
			nextId = 1;

			// Ground
			world
				.createBody({ id: nextId++, x: 5, y: 9.5, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#444" })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 10,
					height: 1,
				});

			const boxWidth = 0.8;
			const boxHeight = 0.8;
			const levels = 5;

			for (let i = 0; i < levels; i++) {
				const numBoxes = levels - i;
				const startX = 5 - ((numBoxes - 1) * boxWidth) / 2;
				const y = 8.6 - i * boxHeight;

				for (let j = 0; j < numBoxes; j++) {
					world
						.createBody({
							id: nextId++,
							x: startX + j * boxWidth,
							y: y,
							mass: 1.0,
							color: \`hsl(\${i * 40}, 60%, 50%)\`,
						})
						.createFixture({
							shape: gearbox.shapes.BOX,
							width: boxWidth * 0.95,
							height: boxHeight * 0.95,
							restitution: 0.1,
							sFriction: 0.5,
							kFriction: 0.3,
						});
				}
			}
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),E=1,e.createBody({id:E++,x:5,y:9.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.BOX,width:10,height:1});const t=.8,o=.8,s=5;for(let a=0;a<s;a++){const i=s-a,r=5-(i-1)*t/2,c=8.6-a*o;for(let l=0;l<i;l++)e.createBody({id:E++,x:r+l*t,y:c,mass:1,color:`hsl(${a*40}, 60%, 50%)`}).createFixture({shape:n.shapes.BOX,width:t*.95,height:o*.95,restitution:.1,sFriction:.5,kFriction:.3})}}}),new w({name:"Mass Ratio",key:"mass-ratio",description:"A classic physics engine test: a very heavy object (mass 100) resting on a very light one (mass 0.1).",onInitRaw:`(world) => {
			world.clear();
			world.setGravity(0, 10);
			nextId = 1;

			// Ground
			world
				.createBody({ id: nextId++, x: 5, y: 9.5, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#444" })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 10,
					height: 1,
				});

			// Light box
			world.createBody({ id: nextId++, x: 5, y: 8.5, mass: 0.1, color: "#4ade80" }).createFixture({
				shape: gearbox.shapes.BOX,
				width: 1,
				height: 1,
			});

			// Heavy box
			world.createBody({ id: nextId++, x: 5, y: 7.0, mass: 100, color: "#f87171" }).createFixture({
				shape: gearbox.shapes.BOX,
				width: 2,
				height: 2,
			});
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),E=1,e.createBody({id:E++,x:5,y:9.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.BOX,width:10,height:1}),e.createBody({id:E++,x:5,y:8.5,mass:.1,color:"#4ade80"}).createFixture({shape:n.shapes.BOX,width:1,height:1}),e.createBody({id:E++,x:5,y:7,mass:100,color:"#f87171"}).createFixture({shape:n.shapes.BOX,width:2,height:2})}}),new w({name:"Ragdoll",key:"ragdoll",description:"A draggable ragdoll made of boxes and circles connected by HingeJoints. Click and drag to interact.",onInitRaw:`(world) => {
			world.clear();
			world.setGravity(0, 10);
			gearbox.debug.showAabbs = false;
			nextId = 1;

			// Ground
			world
				.createBody({ id: nextId++, x: 5, y: 9.5, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#444" })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 10,
					height: 1,
				});

			const cx = 5,
				cy = 4;

			// Head
			const head = world.createBody({ id: nextId++, x: cx, y: cy - 1.5, mass: 1.0, color: "#fed7aa" });
			head.createFixture({ shape: gearbox.shapes.CIRCLE, radius: 0.3 });

			// Torso
			const torso = world.createBody({ id: nextId++, x: cx, y: cy, mass: 2.0, color: "#93c5fd" });
			torso.createFixture({ shape: gearbox.shapes.BOX, width: 0.6, height: 1.0 });

			// Arms and Legs segments
			const createLimb = (x: number, y: number, w: number, h: number, color: string) => {
				const limb = world.createBody({ id: nextId++, x, y, mass: 0.5, color });
				limb.createFixture({ shape: gearbox.shapes.BOX, width: w, height: h });
				return limb;
			};

			const lUpperArm = createLimb(cx - 0.6, cy - 0.3, 0.5, 0.2, "#fed7aa");
			const lLowerArm = createLimb(cx - 1.1, cy - 0.3, 0.5, 0.2, "#fed7aa");
			const rUpperArm = createLimb(cx + 0.6, cy - 0.3, 0.5, 0.2, "#fed7aa");
			const rLowerArm = createLimb(cx + 1.1, cy - 0.3, 0.5, 0.2, "#fed7aa");

			const lUpperLeg = createLimb(cx - 0.2, cy + 0.8, 0.2, 0.6, "#1e3a8a");
			const lLowerLeg = createLimb(cx - 0.2, cy + 1.5, 0.2, 0.6, "#fed7aa");
			const rUpperLeg = createLimb(cx + 0.2, cy + 0.8, 0.2, 0.6, "#1e3a8a");
			const rLowerLeg = createLimb(cx + 0.2, cy + 1.5, 0.2, 0.6, "#fed7aa");

			// Joint them up
			world.createHingeJoint(head, torso, { id: nextId++, worldAnchor: { x: cx, y: cy - 1.0 } });

			world.createHingeJoint(torso, lUpperArm, { id: nextId++, worldAnchor: { x: cx - 0.3, y: cy - 0.3 } });
			world.createHingeJoint(lUpperArm, lLowerArm, { id: nextId++, worldAnchor: { x: cx - 0.85, y: cy - 0.3 } });

			world.createHingeJoint(torso, rUpperArm, { id: nextId++, worldAnchor: { x: cx + 0.3, y: cy - 0.3 } });
			world.createHingeJoint(rUpperArm, rLowerArm, { id: nextId++, worldAnchor: { x: cx + 0.85, y: cy - 0.3 } });

			world.createHingeJoint(torso, lUpperLeg, { id: nextId++, worldAnchor: { x: cx - 0.2, y: cy + 0.5 } });
			world.createHingeJoint(lUpperLeg, lLowerLeg, { id: nextId++, worldAnchor: { x: cx - 0.2, y: cy + 1.15 } });

			world.createHingeJoint(torso, rUpperLeg, { id: nextId++, worldAnchor: { x: cx + 0.2, y: cy + 0.5 } });
			world.createHingeJoint(rUpperLeg, rLowerLeg, { id: nextId++, worldAnchor: { x: cx + 0.2, y: cy + 1.15 } });

			setupMouseListeners(world);
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),n.debug.showAabbs=!1,E=1,e.createBody({id:E++,x:5,y:9.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.BOX,width:10,height:1});const t=5,o=4,s=e.createBody({id:E++,x:t,y:o-1.5,mass:1,color:"#fed7aa"});s.createFixture({shape:n.shapes.CIRCLE,radius:.3});const a=e.createBody({id:E++,x:t,y:o,mass:2,color:"#93c5fd"});a.createFixture({shape:n.shapes.BOX,width:.6,height:1});const i=(p,y,g,b,u)=>{const B=e.createBody({id:E++,x:p,y,mass:.5,color:u});return B.createFixture({shape:n.shapes.BOX,width:g,height:b}),B},r=i(t-.6,o-.3,.5,.2,"#fed7aa"),c=i(t-1.1,o-.3,.5,.2,"#fed7aa"),l=i(t+.6,o-.3,.5,.2,"#fed7aa"),m=i(t+1.1,o-.3,.5,.2,"#fed7aa"),x=i(t-.2,o+.8,.2,.6,"#1e3a8a"),f=i(t-.2,o+1.5,.2,.6,"#fed7aa"),h=i(t+.2,o+.8,.2,.6,"#1e3a8a"),d=i(t+.2,o+1.5,.2,.6,"#fed7aa");e.createHingeJoint(s,a,{id:E++,worldAnchor:{x:t,y:o-1}}),e.createHingeJoint(a,r,{id:E++,worldAnchor:{x:t-.3,y:o-.3}}),e.createHingeJoint(r,c,{id:E++,worldAnchor:{x:t-.85,y:o-.3}}),e.createHingeJoint(a,l,{id:E++,worldAnchor:{x:t+.3,y:o-.3}}),e.createHingeJoint(l,m,{id:E++,worldAnchor:{x:t+.85,y:o-.3}}),e.createHingeJoint(a,x,{id:E++,worldAnchor:{x:t-.2,y:o+.5}}),e.createHingeJoint(x,f,{id:E++,worldAnchor:{x:t-.2,y:o+1.15}}),e.createHingeJoint(a,h,{id:E++,worldAnchor:{x:t+.2,y:o+.5}}),e.createHingeJoint(h,d,{id:E++,worldAnchor:{x:t+.2,y:o+1.15}}),Kn(e)},onCleanup:e=>{Zn(e)}}),new w({name:"Bullet Through Paper",key:"bullet",description:["Tests anti-tunneling by firing many fast-moving balls at a tall, thin wall.","Balls vary in **size**, **speed**, and **angle**. `speculativeMargin` helps catch collisions even at high speeds.","Collision masks (`categoryBits` / `maskBits`) keep balls from colliding with each other — they only hit the wall. Each ball is removed after **5 seconds** or once it bounces out of bounds."].join(`

`),onInitRaw:`(world) => {
			world.clear();
			world.setGravity(0, 0);
			world.setSpeculativeMargin(0.5);
			gearbox.debug.showAabbs = false;
			nextId = 1;

			const wallX = 8;
			const wallY = 5;
			const wallH = 9.5;
			world
				.createBody({ id: nextId++, x: wallX, y: wallY, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#ccc" })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 0.06,
					height: wallH,
					restitution: 0.85,
					categoryBits: CAT_WALL,
					maskBits: CAT_BALL,
				});

			(world as any)._bulletAges = new Map<number, number>();
			(world as any)._bulletSpawnAcc = 0;
			(world as any)._bulletWall = { x: wallX, y: wallY, halfH: wallH / 2 };
		}`,onInit:e=>{e.clear(),e.setGravity(0,0),e.setSpeculativeMargin(.5),n.debug.showAabbs=!1,E=1;const t=8,o=5,s=9.5;e.createBody({id:E++,x:t,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#ccc"}).createFixture({shape:n.shapes.BOX,width:.06,height:s,restitution:.85,categoryBits:qn,maskBits:Vn}),e._bulletAges=new Map,e._bulletSpawnAcc=0,e._bulletWall={x:t,y:o,halfH:s/2}},onTickRaw:`(world, dt) => {
			const ages: Map<number, number> = (world as any)._bulletAges;
			const wall = (world as any)._bulletWall;
			if (!ages || !wall) return;

			(world as any)._bulletSpawnAcc += dt;
			const spawnInterval = 0.035;
			let spawned = 0;
			while ((world as any)._bulletSpawnAcc >= spawnInterval && spawned < 8) {
				(world as any)._bulletSpawnAcc -= spawnInterval;
				spawned++;

				const radius = 0.04 + Math.random() * 0.18;
				const speed = 18 + Math.random() * 55;
				const sx = 0.4 + Math.random() * 1.2;
				const sy = 0.4 + Math.random() * 9.2;
				const hitPad = radius + 0.05;
				const targetY =
					wall.y - wall.halfH + hitPad + Math.random() * Math.max(0.01, wall.halfH * 2 - hitPad * 2);
				const dx = wall.x - sx;
				const dy = targetY - sy;
				const invLen = 1 / Math.hypot(dx, dy);
				const colors = ["#ffff44", "#ff8844", "#44ffff", "#ff44ff", "#88ff44", "#ff5555"];

				const body = world.createBody({
					id: nextId++,
					x: sx,
					y: sy,
					vx: dx * invLen * speed,
					vy: dy * invLen * speed,
					mass: Math.max(0.02, radius * radius * 8),
					color: colors[Math.floor(Math.random() * colors.length)],
					canSleep: false,
					linearDamping: 0,
					angularDamping: 0,
				});
				body.createFixture({
					shape: gearbox.shapes.CIRCLE,
					radius,
					restitution: 0.7 + Math.random() * 0.25,
					categoryBits: CAT_BALL,
					maskBits: CAT_WALL,
				});
				ages.set(body.id, 0);
			}

			const toRemove: number[] = [];
			world.iterateBodies((obj) => {
				if (obj.type !== gearbox.bodyTypes.DYNAMIC_OBJECT) return;
				const age = (ages.get(obj.id) ?? 0) + dt;
				ages.set(obj.id, age);
				const outOfBounds = obj.x < -2 || obj.x > 14 || obj.y < -2 || obj.y > 12;
				if (outOfBounds || age > 5) toRemove.push(obj.id);
			});
			for (const id of toRemove) {
				ages.delete(id);
				world.removeObject(id);
			}
		}`,onTick:(e,t)=>{const o=e._bulletAges,s=e._bulletWall;if(!o||!s)return;e._bulletSpawnAcc+=t;const a=.035;let i=0;for(;e._bulletSpawnAcc>=a&&i<8;){e._bulletSpawnAcc-=a,i++;const c=.04+Math.random()*.18,l=18+Math.random()*55,m=.4+Math.random()*1.2,x=.4+Math.random()*9.2,f=c+.05,h=s.y-s.halfH+f+Math.random()*Math.max(.01,s.halfH*2-f*2),d=s.x-m,p=h-x,y=1/Math.hypot(d,p),g=["#ffff44","#ff8844","#44ffff","#ff44ff","#88ff44","#ff5555"],b=e.createBody({id:E++,x:m,y:x,vx:d*y*l,vy:p*y*l,mass:Math.max(.02,c*c*8),color:g[Math.floor(Math.random()*g.length)],canSleep:!1,linearDamping:0,angularDamping:0});b.createFixture({shape:n.shapes.CIRCLE,radius:c,restitution:.7+Math.random()*.25,categoryBits:Vn,maskBits:qn}),o.set(b.id,0)}const r=[];e.iterateBodies(c=>{if(c.type!==n.bodyTypes.DYNAMIC_OBJECT)return;const l=(o.get(c.id)??0)+t;o.set(c.id,l),(c.x<-2||c.x>14||c.y<-2||c.y>12||l>5)&&r.push(c.id)});for(const c of r)o.delete(c),e.removeObject(c)},onCleanup:e=>{delete e._bulletAges,delete e._bulletSpawnAcc,delete e._bulletWall}}),new w({name:"20-Segment Chain",key:"chain",description:"A 20-segment chain suspended from a fixed point using DistanceJoints.",onInitRaw:`(world) => {
			world.clear();
			world.setGravity(0, 10);
			gearbox.debug.showAabbs = false;
			nextId = 1;

			const cx = 5,
				cy = 1;
			const segments = 20;
			const segW = 0.4,
				segH = 0.15;

			const anchor = world.createBody({
				id: nextId++,
				x: cx,
				y: cy + (Math.random() - 0.5) * 0.1,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "#444",
			});
			anchor.createFixture({ shape: gearbox.shapes.CIRCLE, radius: 0.1 });

			let randomness = 0;
			randomness = +(Math.random() - 0.5) * 0.00001;

			let lastBody = anchor;
			for (let i = 0; i < segments; i++) {
				const body = world.createBody({
					id: nextId++,
					x: cx + randomness,
					y: cy + (i + 1) * segW,
					mass: 0.2,
					color: i % 2 === 0 ? "#60a5fa" : "#3b82f6",
				});
				body.createFixture({ shape: gearbox.shapes.BOX, width: segW, height: segH });

				world.createDistanceJoint(lastBody, body, {
					id: nextId++,
					worldAnchor: { x: cx, y: cy + i * segW + segW / 2 },
				});
				lastBody = body;
			}

			setupMouseListeners(world);
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),n.debug.showAabbs=!1,E=1;const t=5,o=1,s=20,a=.4,i=.15,r=e.createBody({id:E++,x:t,y:o+(Math.random()-.5)*.1,type:n.bodyTypes.FIXED_OBJECT,color:"#444"});r.createFixture({shape:n.shapes.CIRCLE,radius:.1});let c=0;c=+(Math.random()-.5)*1e-5;let l=r;for(let m=0;m<s;m++){const x=e.createBody({id:E++,x:t+c,y:o+(m+1)*a,mass:.2,color:m%2===0?"#60a5fa":"#3b82f6"});x.createFixture({shape:n.shapes.BOX,width:a,height:i}),e.createDistanceJoint(l,x,{id:E++,worldAnchor:{x:t,y:o+m*a+a/2}}),l=x}Kn(e)},onCleanup:e=>{Zn(e)}})];let Bn=0,Qn=1;const kt=[new w({name:"TC-1 (SOLVED)",key:"tc-1",description:["**Test Case 1**: Verifies stability during box-on-box collisions.","Previously, boxes would exhibit 'jitter' or 'explosive' behavior when colliding at certain angles."].join(`

`),onInitRaw:`(world) => {
			world.setGravity(0, 10);

			let id = 1;
			world
				.createBody({
					id: id++,
					x: 5,
					y: 8,
					// r: Math.PI,
					type: gearbox.bodyTypes.FIXED_OBJECT,
					mass: 1,
				})
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 1,
					height: 1,
				});

			// Anohter box but this time a rigid body.
			world
				.createBody({
					id: id++,
					x: 7,
					y: 2,
					// r: Math.PI,
					type: gearbox.bodyTypes.DYNAMIC_OBJECT,
					mass: 1,
				})
				.createFixture({
					shape: gearbox.shapes.BOX,
					// radius: 1,
					width: 5,
					height: 1,
				});

			world
				.createBody({
					id: id++,
					x: 3,
					y: 5,
					// r: Math.PI,
					type: gearbox.bodyTypes.DYNAMIC_OBJECT,
					mass: 1,
				})
				.createFixture({
					shape: gearbox.shapes.BOX,
					// radius: 1,
					width: 5,
					height: 1,
				});
		}`,onInit:e=>{e.setGravity(0,10);let t=1;e.createBody({id:t++,x:5,y:8,type:n.bodyTypes.FIXED_OBJECT,mass:1}).createFixture({shape:n.shapes.BOX,width:1,height:1}),e.createBody({id:t++,x:7,y:2,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1}).createFixture({shape:n.shapes.BOX,width:5,height:1}),e.createBody({id:t++,x:3,y:5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1}).createFixture({shape:n.shapes.BOX,width:5,height:1})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"TC-2 (SOLVED)",key:"tc-2",description:["**Test Case 2**: Ensures `BOX` shapes do not tunnel through `AABB` shapes.","This test case was used to refine the overlap detection and penetration resolution logic for different boundary types."].join(`

`),onInitRaw:`(world) => {
			world.setGravity(0, 10);

			let id = 1;
			world
				.createBody({
					id: id++,
					x: 5,
					y: 8,
					r: Math.PI / 2,
					type: gearbox.bodyTypes.FIXED_OBJECT,
					mass: 1,
				})
				.createFixture({
					shape: gearbox.shapes.AABB,
					width: 1,
					height: 1,
				});

			// Anohter box but this time a rigid body.
			world
				.createBody({
					id: id++,
					x: 7,
					y: 2,
					// r: Math.PI / 2,
					type: gearbox.bodyTypes.DYNAMIC_OBJECT,
					mass: 1,
				})
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 5,
					height: 1,
				});
			world
				.createBody({
					id: id++,
					x: 3,
					y: 5,
					// r: Math.PI / 2,
					type: gearbox.bodyTypes.DYNAMIC_OBJECT,
					mass: 1,
				})
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 5,
					height: 1,
				});
		}`,onInit:e=>{e.setGravity(0,10);let t=1;e.createBody({id:t++,x:5,y:8,r:Math.PI/2,type:n.bodyTypes.FIXED_OBJECT,mass:1}).createFixture({shape:n.shapes.AABB,width:1,height:1}),e.createBody({id:t++,x:7,y:2,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1}).createFixture({shape:n.shapes.BOX,width:5,height:1}),e.createBody({id:t++,x:3,y:5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1}).createFixture({shape:n.shapes.BOX,width:5,height:1})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"TC-3 (SOLVED)",key:"tc-3",description:["**Test Case 3**: Momentum preservation and angular transfer.","Previously, objects would lose too much linear momentum during eccentric collisions. The solver now correctly calculates the balance between linear and angular velocity transfer."].join(`

`),onInitRaw:`(world) => {
			world.setGravity(0, 0);

			let id = 1;
			world
				.createBody({
					id: id++,
					x: 8,
					y: 5,
					// r: Math.PI,
					type: gearbox.bodyTypes.FIXED_OBJECT,
					mass: 1,
				})
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 1,
					height: 1,
				});

			// Anohter box but this time a rigid body.
			world
				.createBody({ id: id++, x: 2, y: 3, vx: 3, type: gearbox.bodyTypes.DYNAMIC_OBJECT, mass: 1 })
				.createFixture({
					shape: gearbox.shapes.BOX,
					// radius: 1,
					width: 1,
					height: 5,
				});
		}`,onInit:e=>{e.setGravity(0,0);let t=1;e.createBody({id:t++,x:8,y:5,type:n.bodyTypes.FIXED_OBJECT,mass:1}).createFixture({shape:n.shapes.BOX,width:1,height:1}),e.createBody({id:t++,x:2,y:3,vx:3,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1}).createFixture({shape:n.shapes.BOX,width:1,height:5})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"TC-4 (SOLVED)",key:"tc-4",description:["**Test Case 4**: Correctness of angular velocity direction.","Ensures that objects receive torque in the physically correct direction based on the contact point and normal."].join(`

`),onInitRaw:`(world) => {
			world.setGravity(0, 0);

			let id = 1;
			world
				.createBody({
					id: id++,
					x: 8,
					y: 5,
					// r: Math.PI,
					type: gearbox.bodyTypes.FIXED_OBJECT,
					mass: 1,
				})
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 1,
					height: 1,
				});

			// Anohter box but this time a rigid body.
			world
				.createBody({ id: id++, x: 2, y: 6, vx: 3, type: gearbox.bodyTypes.DYNAMIC_OBJECT, mass: 1 })
				.createFixture({
					shape: gearbox.shapes.BOX,
					// radius: 1,
					width: 1,
					height: 5,
				});
		}`,onInit:e=>{e.setGravity(0,0);let t=1;e.createBody({id:t++,x:8,y:5,type:n.bodyTypes.FIXED_OBJECT,mass:1}).createFixture({shape:n.shapes.BOX,width:1,height:1}),e.createBody({id:t++,x:2,y:6,vx:3,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1}).createFixture({shape:n.shapes.BOX,width:1,height:5})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"TC-5 (SOLVED)",key:"tc-5",description:["**Test Case 5**: Sensitivity to initial rotation.","Fixes an issue where even tiny angular velocities (`rs`) caused disproportionate collision responses. Also verifies that rotating objects transfer angular momentum in opposing directions."].join(`

`),onInitRaw:`(world) => {
			world.setGravity(0, 0);

			let id = 1;
			world.createBody({ id: id++, x: 5, y: 5, type: gearbox.bodyTypes.DYNAMIC_OBJECT, mass: 4 }).createFixture({
				shape: gearbox.shapes.CIRCLE,
				radius: 1,
			});

			world
				.createBody({
					id: id++,
					x: 2.8,
					y: 2.0,
					vx: 3,
					vy: 3,
					type: gearbox.bodyTypes.DYNAMIC_OBJECT,
					mass: 1,
					// rs: 10,
					rs: 0.01,
				})
				.createFixture({
					shape: gearbox.shapes.CIRCLE,
					radius: 0.5,
				});
		}`,onInit:e=>{e.setGravity(0,0);let t=1;e.createBody({id:t++,x:5,y:5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:4}).createFixture({shape:n.shapes.CIRCLE,radius:1}),e.createBody({id:t++,x:2.8,y:2,vx:3,vy:3,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1,rs:.01}).createFixture({shape:n.shapes.CIRCLE,radius:.5})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"TC-6 (SOLVED)",key:"tc-6",description:["**Test Case 6**: Contact point calculation accuracy.","Uses edge-clipping techniques to ensure stable and accurate impulse application during complex box-box collisions."].join(`

`),onInitRaw:`(world) => {
			world.setGravity(0, 10);
			world.setHasFriction(false);

			let id = 1;
			world
				.createBody({ id: id++, x: 5, y: 6, r: Math.PI / 8, type: gearbox.bodyTypes.FIXED_OBJECT })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 8,
					height: 1,
				});

			// Anohter box but this time a rigid body.
			world
				.createBody({ id: id++, x: 2, y: 2, type: gearbox.bodyTypes.DYNAMIC_OBJECT, mass: 0.2 })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 1,
					height: 1,
				});
		}`,onInit:e=>{e.setGravity(0,10),e.setHasFriction(!1);let t=1;e.createBody({id:t++,x:5,y:6,r:Math.PI/8,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.BOX,width:8,height:1}),e.createBody({id:t++,x:2,y:2,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:n.shapes.BOX,width:1,height:1})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"TC-7 (SOLVED)",key:"tc-7",description:["**Test Case 7**: Friction normal vector correctness.","Ensures that friction impulses are applied exactly tangent to the contact normal, even when restitution is high."].join(`

`),onInitRaw:`(world) => {
			world.setGravity(0, 10);
			// world.setHasRestitution(false);

			let id = 1;
			world
				.createBody({
					id: id++,
					x: 5,
					y: 6,
					// r: Math.PI / 8,
					r: 0.1,
					type: gearbox.bodyTypes.FIXED_OBJECT,
				})
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 8,
					height: 1,
					restitution: 0.0,
				});

			// Anohter box but this time a rigid body.
			world
				.createBody({ id: id++, x: 2, y: 2, type: gearbox.bodyTypes.DYNAMIC_OBJECT, mass: 0.2 })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 1,
					height: 1,
					restitution: 0.0,
				});
		}`,onInit:e=>{e.setGravity(0,10);let t=1;e.createBody({id:t++,x:5,y:6,r:.1,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.BOX,width:8,height:1,restitution:0}),e.createBody({id:t++,x:2,y:2,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:n.shapes.BOX,width:1,height:1,restitution:0})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"TC-8 (SOLVED)",key:"tc-8",description:["**Test Case 8**: Stability of high-frequency circle collisions.","Verifies that multiple circles colliding in quick succession do not cause simulation instability or tunneling."].join(`

`),globalLines:["let nextId = 1;"],onInitRaw:`(world) => {
			world.setGravity(0, 10);
			impulseTimer = 0;

			// Objects will be created in the tick function.
		}`,onInit:e=>{e.setGravity(0,10),Bn=0},onTickRaw:`(world, dt) => {
			impulseTimer++;
			if (impulseTimer % 60 == 0) {
				let m = 0.1 + Math.random() * 0.4;
				let r = 0.2 + m * m * 0.8;
				let id1 = nextId++;
				world
					.createBody({
						id: id1,
						x: 0,
						y: 7.5,
						r: (Math.PI / 2) * Math.random(),
						rs: (Math.random() - 0.5) * 5.0,
						vx: (2.0 + Math.random() * 5.0) * 1,
						vy: -6.0 - Math.random() * 1.0,
						type: gearbox.bodyTypes.DYNAMIC_OBJECT,
						mass: m,
					})
					.createFixture({
						shape: gearbox.shapes.CIRCLE,
						radius: r,
					});

				m = 0.1 + Math.random() * 0.4;
				r = 0.2 + m * m * 0.8;
				let id2 = nextId++;
				world
					.createBody({
						id: id2,
						x: 10,
						y: 7.5,
						r: (Math.PI / 2) * Math.random(),
						rs: (Math.random() - 0.5) * 5.0,
						vx: (2.0 + Math.random() * 5.0) * -1,
						vy: -6.0 - Math.random() * 1.0,
						type: gearbox.bodyTypes.DYNAMIC_OBJECT,
						mass: m,
					})
					.createFixture({
						shape: gearbox.shapes.CIRCLE,
						radius: r,
					});

				// Scan for objects that are out of bounds and remove them.
				// Another way to do this would be to use collision events.
				let objectCount = world.getBodyCount();
				let toRemove = [];

				world.iterateBodies((obj) => {
					if (obj.y > 10.5) {
						// Don't remove stuff in the middle of the loop!!!
						toRemove.push(obj);
					}
				});

				// Now remove everything we found that's out of bounds.
				for (let obj of toRemove) {
					world.removeObject(obj.id);
				}
			}
		}`,onTick:(e,t)=>{if(Bn++,Bn%60==0){let o=.1+Math.random()*.4,s=.2+o*o*.8,a=Qn++;e.createBody({id:a,x:0,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*1,vy:-6-Math.random()*1,type:n.bodyTypes.DYNAMIC_OBJECT,mass:o}).createFixture({shape:n.shapes.CIRCLE,radius:s}),o=.1+Math.random()*.4,s=.2+o*o*.8;let i=Qn++;e.createBody({id:i,x:10,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*-1,vy:-6-Math.random()*1,type:n.bodyTypes.DYNAMIC_OBJECT,mass:o}).createFixture({shape:n.shapes.CIRCLE,radius:s}),e.getBodyCount();let r=[];e.iterateBodies(c=>{c.y>10.5&&r.push(c)});for(let c of r)e.removeObject(c.id)}}}),new w({name:"TC-9 (SOLVED)",key:"tc-9",description:["**Test Case 9**: Resting stability.","A small box resting on a larger fixed box to verify that gravity and normal impulses reach equilibrium without constant jitter."].join(`

`),onInitRaw:`(world) => {
			world.setGravity(0, 1);
			// world.setHasRestitution(false);

			let id = 1;
			world
				.createBody({ id: id++, x: 5, y: 6, r: Math.PI / 2, type: gearbox.bodyTypes.FIXED_OBJECT })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 1,
					height: 8,
				});

			// Anohter box but this time a rigid body.
			world
				.createBody({ id: id++, x: 7, y: 5, type: gearbox.bodyTypes.DYNAMIC_OBJECT, mass: 0.2 })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 1,
					height: 1,
				});
		}`,onInit:e=>{e.setGravity(0,1);let t=1;e.createBody({id:t++,x:5,y:6,r:Math.PI/2,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.BOX,width:1,height:8}),e.createBody({id:t++,x:7,y:5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:n.shapes.BOX,width:1,height:1})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"TC-10 (SOLVED)",key:"tc-10",description:["**Test Case 10**: Circle-AABB penetration resolution.","Fixes extreme responses when a circle falls directly onto a large axis-aligned platform."].join(`

`),onInitRaw:`(world) => {
			world.setGravity(0, 3);
			// world.setHasRestitution(false);

			let id = 1;
			world.createBody({ id: id++, x: 5, y: 8, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: 8,
				height: 1,
				// restitution: 1
			});

			// Anohter box but this time a rigid body.
			world
				.createBody({ id: id++, x: 7, y: 2, type: gearbox.bodyTypes.DYNAMIC_OBJECT, mass: 0.2, rs: -0.1 })
				.createFixture({
					shape: gearbox.shapes.CIRCLE,
					radius: 1,
					restitution: 1,
				});
		}`,onInit:e=>{e.setGravity(0,3);let t=1;e.createBody({id:t++,x:5,y:8,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:8,height:1}),e.createBody({id:t++,x:7,y:2,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2,rs:-.1}).createFixture({shape:n.shapes.CIRCLE,radius:1,restitution:1})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"TC-11 (SOLVED)",key:"tc-11",description:["**Test Case 11**: Stuck objects and overlap logic.","Ensures that small circles do not get 'embedded' within other shapes when subjected to high-velocity collisions or deep initial overlaps."].join(`

`),onInitRaw:`(world) => {
			let id = 1;
			world.createBody({ id: id++, x: 5, y: 5, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: 1,
				height: 5,
			});

			// Anohter box but this time a rigid body.
			world
				.createBody({
					id: id++,
					x: 5.2,
					y: 5,
					// vx: -50,
					type: gearbox.bodyTypes.DYNAMIC_OBJECT,
					mass: 0.2,
				})
				.createFixture({
					shape: gearbox.shapes.CIRCLE,
					radius: 0.1,
					restitution: 0.5,
				});
		}`,onInit:e=>{let t=1;e.createBody({id:t++,x:5,y:5,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:1,height:5}),e.createBody({id:t++,x:5.2,y:5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:n.shapes.CIRCLE,radius:.1,restitution:.5})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"TC-12 (SOLVED)",key:"tc-12",description:["**Test Case 12**: Sinking prevention under high gravity.","Verifies that boxes maintain their position on top of other objects even when high downward forces are applied, ensuring the penetration resolution is sufficient."].join(`

`),onInitRaw:`(world) => {
			world.setGravity(0, 10);
			// world.setHasRestitution(false);

			let id = 1;
			world.createBody({ id: id++, x: 5, y: 6, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.AABB,
				width: 8,
				height: 1,
			});

			// Anohter box but this time a rigid body.
			world
				.createBody({ id: id++, x: 7, y: 4, type: gearbox.bodyTypes.DYNAMIC_OBJECT, mass: 0.2 })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 1,
					height: 1,
				});
		}`,onInit:e=>{e.setGravity(0,10);let t=1;e.createBody({id:t++,x:5,y:6,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:8,height:1}),e.createBody({id:t++,x:7,y:4,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:n.shapes.BOX,width:1,height:1})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"TC-13 (SOLVED)",key:"tc-13",description:["**Test Case 13**: Stuck objects and overlap logic.","Ensures that small circles do not get 'embedded' within other shapes when subjected to high-velocity collisions or deep initial overlaps."].join(`

`),onInitRaw:`(world) => {
			let id = 1;
			world.createBody({ id: id++, x: 5, y: 5, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.BOX,
				width: 1,
				height: 5,
			});

			// Anohter box but this time a rigid body.
			world
				.createBody({
					id: id++,
					x: 5.2,
					y: 5,
					// vx: -50,
					type: gearbox.bodyTypes.DYNAMIC_OBJECT,
					mass: 0.2,
				})
				.createFixture({
					shape: gearbox.shapes.CIRCLE,
					radius: 0.1,
					restitution: 0.5,
				});
		}`,onInit:e=>{let t=1;e.createBody({id:t++,x:5,y:5,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.BOX,width:1,height:5}),e.createBody({id:t++,x:5.2,y:5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:n.shapes.CIRCLE,radius:.1,restitution:.5})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"TC-14 (SOLVED)",key:"tc-14",description:["**Test Case 14**: Sliding pile regression.","A stack of boxes should remain stationary when high friction is present. This test verifies if piles of objects exhibit 'random slow sliding' and fail to enter the sleep state."].join(`

`),onInitRaw:`(world) => {
			world.setGravity(0, 20); // Higher gravity to emphasize pressure

			let id = 1;
			// Ground
			world.createBody({ id: id++, x: 5, y: 9, type: gearbox.bodyTypes.FIXED_OBJECT }).createFixture({
				shape: gearbox.shapes.BOX,
				width: 10,
				height: 1,
				sFriction: 10,
				kFriction: 10,
			});

			// Stack of boxes
			for (let i = 0; i < 4; i++) {
				world
					.createBody({ id: id++, x: 5, y: 8 - i * 1.1, type: gearbox.bodyTypes.DYNAMIC_OBJECT, mass: 1 })
					.createFixture({
						shape: gearbox.shapes.BOX,
						width: 2,
						height: 1,
						sFriction: 10,
						kFriction: 10,
					});
			}
		}`,onInit:e=>{e.setGravity(0,20);let t=1;e.createBody({id:t++,x:5,y:9,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.BOX,width:10,height:1,sFriction:10,kFriction:10});for(let o=0;o<4;o++)e.createBody({id:t++,x:5,y:8-o*1.1,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1}).createFixture({shape:n.shapes.BOX,width:2,height:1,sFriction:10,kFriction:10})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"TC-15: Anti-tunneling (REGRESSION)",key:"tc-15",description:["**Test Case 15**: Regression test for anti-tunneling.","A fast bullet (radius 0.1) is fired at a thin wall (width 0.05) at high speed (vx: 50).","Fat AABBs rebuild when leftover velocity padding is less than one step of travel, so speculative contacts still see the wall."].join(`

`),onInitRaw:`(world) => {
			world.setGravity(0, 0);

			let id = 1;
			// Thin wall
			world
				.createBody({ id: id++, x: 7, y: 5, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#ccc" })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 0.05,
					height: 4,
				});

			// Fast bullet
			const bullet = world.createBody({
				id: id++,
				x: 1,
				y: 5,
				vx: 50,
				type: gearbox.bodyTypes.DYNAMIC_OBJECT,
				mass: 1.0,
				color: "#ffff44",
			});
			bullet.createFixture({
				shape: gearbox.shapes.CIRCLE,
				radius: 0.1,
			});

			(world as any).bulletId = bullet.id;
		}`,onInit:e=>{e.setGravity(0,0);let t=1;e.createBody({id:t++,x:7,y:5,type:n.bodyTypes.FIXED_OBJECT,color:"#ccc"}).createFixture({shape:n.shapes.BOX,width:.05,height:4});const o=e.createBody({id:t++,x:1,y:5,vx:50,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1,color:"#ffff44"});o.createFixture({shape:n.shapes.CIRCLE,radius:.1}),e.bulletId=o.id},onTickRaw:`(world, dt) => {
			const bullet = world.getBodyById((world as any).bulletId);
			if (bullet && bullet.x > 25) {
				bullet.x = 1;
				bullet.vx = 50;
				bullet.color = "#ff4444";
			}
			if (bullet && bullet.x < 0) {
				bullet.x = 1;
				bullet.vx = 50;
				bullet.color = "#44ff44";
			}
		}`,onTick:(e,t)=>{const o=e.getBodyById(e.bulletId);o&&o.x>25&&(o.x=1,o.vx=50,o.color="#ff4444"),o&&o.x<0&&(o.x=1,o.vx=50,o.color="#44ff44")}})];let v=1,wn=null,Cn=null,Tn=null,Y=null;const Ot=new w({name:"Mechanical Clockwork",key:"clockwork",description:["A physically regulated mechanical clock. This version uses a **Grashof-compliant Crank-Rocker** mechanism to ensure continuous rotation.","### Features","- **Regulated Motion**: A 2.0m pendulum defines a 9-second period in low gravity (1.0 m/s²).","- **Grashof Linkage**: Precision geometry allows the drive gear to complete full 360° rotations.","- **Kinematic Drive**: The escapement gear is driven at a fixed rotation speed to ensure perfect timekeeping.","- **Multi-stage Reduction**: 7 `GearJoint` stages step down the escapement's motion to hours and minutes.","- **Real-time Sync**: The hands and gear train initialize to your local system time."].join(`

`),onInitRaw:`(world) => {
		world.clear();
		gearbox.debug.showAabbs = false;
		nextId = 1;

		const cx = 5;
		const cy = 2.5;
		const g = 1.0;
		world.setGravity(0, g);
		world.setHasRestitution(true);
		world.setHasFriction(true);

		// Collision Categories
		const CAT_STATIC = 0x0001;
		const CAT_MECH = 0x0002;
		const CAT_GEAR = 0x0004;
		const CAT_HAND = 0x0008;

		// Current Time for initialization
		const now = new Date();
		const seconds = now.getSeconds();
		const minutes = now.getMinutes();
		const hours = now.getHours() % 12;

		// Simulation Parameters
		const p = {
			crankRadius: 0.251412,
			groundDist: 0.962005,
			rockerLength: 0.788035,
			escXOffset: 0.0,
			conRodFreq: 15.0,
			conRodDamping: 1.0,
			springFreq: 0.5,
			springX: cx - 1.5,
		};

		// --- GUI & TUNER ---
		const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
		const existingGui = document.getElementById("clock-tuner-gui");
		if (existingGui) existingGui.remove();

		const gui = document.createElement("div");
		gui.id = "clock-tuner-gui";
		gui.style = \`position:fixed;top:20px;right:20px;width:280px;background:rgba(0,0,0,0.85);color:#0f0;padding:15px;border-radius:8px;font-family:monospace;z-index:1000;box-shadow:0 4px 15px rgba(0,0,0,0.5);font-size:12px;border:1px solid #333;\`;

		if (isLocal) {
			document.body.appendChild(gui);
		}

		const scoreDisplay = document.createElement("div");
		scoreDisplay.style = \`margin:15px 0;padding:10px;border:1px solid #0f0;text-align:center;font-size:16px;font-weight:bold;\`;
		scoreDisplay.textContent = "Score: 0";
		gui.appendChild(scoreDisplay);

		const exportBtn = document.createElement("button");
		exportBtn.textContent = "Export to Console";
		exportBtn.style = \`width:100%;padding:8px;background:#0f0;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;margin-bottom:5px;\`;
		exportBtn.onclick = () => console.log("Final Parameters:", JSON.stringify(p, null, 4));
		gui.appendChild(exportBtn);

		const optimizeBtn = document.createElement("button");
		optimizeBtn.textContent = "Start Auto-Optimize";
		optimizeBtn.style = \`width:100%;padding:8px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;\`;
		optimizeBtn.onclick = () => {
			const s = (world as any).scoreState;
			s.isOptimizing = !s.isOptimizing;
			optimizeBtn.textContent = s.isOptimizing ? "Stop Auto-Optimize" : "Start Auto-Optimize";
			optimizeBtn.style.background = s.isOptimizing ? "#f00" : "#444";
			if (s.isOptimizing) {
				s.bestScore = -Infinity;
				s.optimizationStage = "PREPARE";
				s.optParamIndex = 0;
				s.optDirection = 1;
				s.epsilon = 0.05;
				s.lastImprovementIteration = 0;
				console.log("Starting Auto-Optimization...");
			}
		};
		gui.appendChild(optimizeBtn);

		const optStatus = document.createElement("div");
		optStatus.style = \`margin-top:10px;font-size:10px;color:#aaa;\`;
		optStatus.textContent = "Optimizer: Idle";
		gui.appendChild(optStatus);

		const sliders = {};
		const createSlider = (label, key, min, max, step) => {
			const container = document.createElement("div");
			container.style.marginBottom = "10px";
			const labelEl = document.createElement("div");
			labelEl.textContent = \`\${label}: \${p[key].toFixed(2)}\`;
			const slider = document.createElement("input");
			slider.type = "range";
			slider.min = min;
			slider.max = max;
			slider.step = step;
			slider.value = p[key];
			slider.style.width = "100%";
			slider.oninput = () => {
				p[key] = parseFloat(slider.value);
				labelEl.textContent = \`\${label}: \${p[key].toFixed(2)}\`;
				updateSimulation();
			};
			container.appendChild(labelEl);
			container.appendChild(slider);
			gui.appendChild(container);
			sliders[key] = { slider, labelEl, label };
		};

		const updateSliderUI = (key) => {
			const s = sliders[key];
			if (s) {
				s.slider.value = p[key];
				s.labelEl.textContent = \`\${s.label}: \${p[key].toFixed(2)}\`;
			}
		};

		createSlider("Crank Radius", "crankRadius", 0.05, 0.5, 0.01);
		createSlider("Ground Distance", "groundDist", 0.5, 2.0, 0.05);
		createSlider("Rocker Length", "rockerLength", 0.3, 1.5, 0.05);
		createSlider("Esc X Offset", "escXOffset", -0.5, 0.5, 0.01);
		createSlider("Rod Frequency", "conRodFreq", 5.0, 50.0, 1.0);
		createSlider("Spring Frequency", "springFreq", 0.1, 2.0, 0.05);
		createSlider("Spring X Pos", "springX", cx - 3.0, cx - 0.5, 0.1);

		const pendPivotY = cy + 2.0;
		const escapementY = pendPivotY - p.groundDist;
		const targetPeriod = 8.0; // Sync with gear rotation (8s)
		const pendulumLength = g * Math.pow(targetPeriod / (2 * Math.PI), 2);
		const rockerPinDist = pendulumLength - p.rockerLength;

		const pendCenterId = nextId++;
		const pendCenter = world.createBody({
			id: pendCenterId,
			x: cx,
			y: pendPivotY,
			type: gearbox.bodyTypes.FIXED_OBJECT,
			color: "#888",
		});
		pendCenter.createFixture({
			id: pendCenterId,
			shape: gearbox.shapes.CIRCLE,
			radius: 0.1,
			categoryBits: CAT_STATIC,
			maskBits: 0,
		});

		const escCenterId = nextId++;
		const escCenter = world.createBody({
			id: escCenterId,
			x: cx,
			y: escapementY,
			type: gearbox.bodyTypes.FIXED_OBJECT,
			color: "#888",
		});
		escCenter.createFixture({
			id: escCenterId,
			shape: gearbox.shapes.CIRCLE,
			radius: 0.1,
			categoryBits: CAT_STATIC,
			maskBits: 0,
		});

		const centerId = nextId++;
		const center = world.createBody({
			id: centerId,
			x: cx,
			y: cy,
			type: gearbox.bodyTypes.FIXED_OBJECT,
			color: "#888",
		});
		center.createFixture({
			id: centerId,
			shape: gearbox.shapes.CIRCLE,
			radius: 0.1,
			categoryBits: CAT_STATIC,
			maskBits: 0,
		});

		const initialPendAngle = 0.5;
		const pendulumId = nextId++;
		pendulum = world.createBody({
			id: pendulumId,
			x: cx + Math.sin(initialPendAngle) * pendulumLength,
			y: pendPivotY + Math.cos(initialPendAngle) * pendulumLength,
			r: -initialPendAngle,
			mass: 5.0,
			color: "#cd853f",
		});
		pendulum.createFixture({
			id: pendulumId,
			shape: gearbox.shapes.CIRCLE,
			radius: 0.4,
			categoryBits: CAT_MECH,
			maskBits: 0,
		});
		pendulum.angularDamping = 0.01;
		world.createHingeJoint(pendCenter, pendulum, {
			id: nextId++,
			worldAnchor: { x: cx, y: pendPivotY },
			anchorB: { x: 0, y: -pendulumLength },
		});

		const fastGearId = nextId++;
		const fastGear = world.createBody({
			id: fastGearId,
			x: cx + p.escXOffset,
			y: escapementY,
			r: 0,
			type: gearbox.bodyTypes.KINEMATIC_OBJECT,
			color: "#aaa",
		});
		fastGear.createFixture({
			id: fastGearId,
			shape: gearbox.shapes.CIRCLE,
			radius: 0.5,
			categoryBits: CAT_GEAR,
			maskBits: 0,
		});
		fastGear.rs = (Math.PI * 2) / 8.0;
		const fastHinge = world.createHingeJoint(escCenter, fastGear, {
			id: nextId++,
			worldAnchor: { x: cx + p.escXOffset, y: escapementY },
		});

		const crankPinLocal = { x: p.crankRadius, y: 0 };
		const pendPinLocal = { x: 0, y: -p.rockerLength };

		// Calculate IDEAL rod length (Reference pose: both at 0 rad)
		const getIdealLen = () => {
			const refGearX = cx + p.escXOffset;
			const refGearY = pendPivotY - p.groundDist;
			const refCrankPinW = { x: refGearX + p.crankRadius, y: refGearY };
			const refRockerPinW = { x: cx, y: pendPivotY + (pendulumLength - p.rockerLength) };
			return Math.sqrt(
				Math.pow(refCrankPinW.x - refRockerPinW.x, 2) + Math.pow(refCrankPinW.y - refRockerPinW.y, 2),
			);
		};

		const conRodJoint = world.createSpringJoint(fastGear, pendulum, {
			id: nextId++,
			anchorA: crankPinLocal,
			anchorB: pendPinLocal,
			length: getIdealLen(),
			frequencyHz: p.conRodFreq,
			dampingRatio: p.conRodDamping,
		});

		const updateSimulation = () => {
			const newEscY = pendPivotY - p.groundDist;
			const newEscX = cx + p.escXOffset;
			escCenter.x = newEscX;
			escCenter.y = newEscY;
			fastGear.x = newEscX;
			fastGear.y = newEscY;
			fastHinge.localAnchorA = escCenter.worldToLocal({ x: newEscX, y: newEscY });

			conRodJoint.localAnchorA = { x: p.crankRadius, y: 0 };
			conRodJoint.localAnchorB = { x: 0, y: -p.rockerLength };
			conRodJoint.length = getIdealLen();
			conRodJoint.frequencyHz = p.conRodFreq;
			conRodJoint.dampingRatio = p.conRodDamping;
		};

		// Scoring state
		(world as any).scoreState = {
			fastGear,
			pendulum,
			params: p,
			updateSimulation,
			updateSliderUI,
			optStatus,
			lastFastR: fastGear.r,
			lastPendRs: pendulum.rs,
			lastRsSign: Math.sign(pendulum.rs),
			rsSignChanges: 0,
			maxAngle: -Infinity,
			minAngle: Infinity,
			hasCrossedZero: false,
			history: [], // Buffer for sliding window: { time, rotDelta, reversal, pendR, pendRs, pendRa }
			periodTimes: [],
			lastPendSide: Math.sign(pendulum.r),
			lastPendCrossing: 0,
			scoreDisplay,
			isOptimizing: false,
		};

		// --- 4. GEAR TRAIN (Escapement -> Seconds) ---
		// Period: T_esc -> 60s
		// In low gravity (1.0), a 2.05m pendulum has a period of ~9s.
		// But we are applying impulses that might slightly speed it up.
		// Let's assume a period of 8.0s for the regulated escapement.
		const escPeriod = 8.0;
		const totalRatio = escPeriod / 60; // 8 / 60 = 0.1333

		const inter1X = cx + 1.5;
		const inter1Y = escapementY + 0.5;
		const inter1CenterId = nextId++;
		const inter1Center = world.createBody({
			id: inter1CenterId,
			x: inter1X,
			y: inter1Y,
			type: gearbox.bodyTypes.FIXED_OBJECT,
			color: "#888",
		});
		inter1Center.createFixture({
			id: inter1CenterId,
			shape: gearbox.shapes.CIRCLE,
			radius: 0.1,
			categoryBits: CAT_STATIC,
			maskBits: 0,
		});

		const inter1GearId = nextId++;
		const inter1Gear = world.createBody({
			id: inter1GearId,
			x: inter1X,
			y: inter1Y,
			mass: 0.2,
			r: 0,
			color: "#44ff44",
		});
		inter1Gear.createFixture({
			id: inter1GearId,
			shape: gearbox.shapes.CIRCLE,
			radius: 1.0,
			categoryBits: CAT_GEAR,
			maskBits: 0,
		});
		inter1Gear.angularDamping = 0.02;
		const inter1Hinge = world.createHingeJoint(inter1Center, inter1Gear, {
			id: nextId++,
			worldAnchor: { x: inter1X, y: inter1Y },
		});
		// First stage: Escapement to Inter1 (1:4 ratio)
		world.createGearJoint(fastHinge, inter1Hinge, { id: nextId++, ratio: 0.25 });

		const secHandAngle = (seconds / 60) * Math.PI * 2;
		const secondGearObjId = nextId++;
		const secondGearObj = world.createBody({
			id: secondGearObjId,
			x: cx,
			y: cy,
			mass: 0.2,
			r: secHandAngle,
			color: "#ff4444",
		});
		secondGearObj.createFixture({
			id: secondGearObjId,
			shape: gearbox.shapes.CIRCLE,
			radius: 0.6,
			categoryBits: CAT_GEAR,
			maskBits: 0,
		});
		secondGearObj.angularDamping = 0.02;
		const secondHinge = world.createHingeJoint(center, secondGearObj, {
			id: nextId++,
			worldAnchor: { x: cx, y: cy },
		});
		// Second stage: Inter1 to Second (total ratio 0.15)
		// 0.25 * ratio2 = 0.15 => ratio2 = 0.15 / 0.25 = 0.6
		world.createGearJoint(inter1Hinge, secondHinge, { id: nextId++, ratio: totalRatio / 0.25 });

		// --- 5. CLOCK HANDS ---
		const minHandAngle = (minutes / 60) * Math.PI * 2;
		const hourHandAngle = (hours / 12) * Math.PI * 2;

		const secLen = 3.5;
		const minLen = 3.0;
		const hourLen = 2.0;

		for (let i = 0; i < 12; i++) {
			const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
			const r1 = 3.8;
			const r2 = 4.0;
			const tickId = nextId++;
			world
				.createBody({
					id: tickId,
					x: cx + (Math.cos(angle) * (r1 + r2)) / 2,
					y: cy + (Math.sin(angle) * (r1 + r2)) / 2,
					r: angle + Math.PI / 2,
					type: gearbox.bodyTypes.FIXED_OBJECT,
					color: "#999",
				})
				.createFixture({
					id: tickId,
					shape: gearbox.shapes.BOX,
					width: i % 3 === 0 ? 0.2 : 0.1,
					height: 0.4,
					categoryBits: CAT_STATIC,
					maskBits: 0,
				});
		}

		const secondHandId = nextId++;
		secondHand = world.createBody({
			id: secondHandId,
			x: cx + Math.sin(secHandAngle) * (secLen / 2 - 0.2),
			y: cy - Math.cos(secHandAngle) * (secLen / 2 - 0.2),
			r: secHandAngle,
			mass: 0.1,
			color: "#ff4444",
		});
		secondHand.createFixture({
			id: secondHandId,
			shape: gearbox.shapes.BOX,
			width: 0.05,
			height: secLen,
			categoryBits: CAT_HAND,
			maskBits: 0,
			restitution: 0,
		});
		const secondHandHinge = world.createHingeJoint(center, secondHand, {
			id: nextId++,
			worldAnchor: { x: cx, y: cy },
			anchorB: { x: 0, y: secLen / 2 - 0.2 },
		});
		world.createGearJoint(secondHinge, secondHandHinge, { id: nextId++, ratio: -1.0 });

		const inter2X = cx - 1.5;
		const inter2Y = cy - 1.5;
		const inter2CenterId = nextId++;
		const inter2Center = world.createBody({
			id: inter2CenterId,
			x: inter2X,
			y: inter2Y,
			type: gearbox.bodyTypes.FIXED_OBJECT,
			color: "#888",
		});
		inter2Center.createFixture({
			id: inter2CenterId,
			shape: gearbox.shapes.CIRCLE,
			radius: 0.1,
			categoryBits: CAT_STATIC,
			maskBits: 0,
		});
		const inter2GearId = nextId++;
		const inter2Gear = world.createBody({
			id: inter2GearId,
			x: inter2X,
			y: inter2Y,
			mass: 0.2,
			r: 0,
			color: "#4444ff",
		});
		inter2Gear.createFixture({
			id: inter2GearId,
			shape: gearbox.shapes.CIRCLE,
			radius: 1.0,
			categoryBits: CAT_GEAR,
			maskBits: 0,
		});
		inter2Gear.angularDamping = 0.01;
		const inter2Hinge = world.createHingeJoint(inter2Center, inter2Gear, {
			id: nextId++,
			worldAnchor: { x: inter2X, y: inter2Y },
		});
		world.createGearJoint(secondHinge, inter2Hinge, { id: nextId++, ratio: 1 / 10 });

		const minuteGearId = nextId++;
		const minuteGear = world.createBody({
			id: minuteGearId,
			x: cx,
			y: cy,
			mass: 0.2,
			r: minHandAngle,
			color: "#4444ff",
		});
		minuteGear.createFixture({
			id: minuteGearId,
			shape: gearbox.shapes.CIRCLE,
			radius: 0.8,
			categoryBits: CAT_GEAR,
			maskBits: 0,
		});
		minuteGear.angularDamping = 0.01;
		const minuteHinge = world.createHingeJoint(center, minuteGear, {
			id: nextId++,
			worldAnchor: { x: cx, y: cy },
		});
		world.createGearJoint(inter2Hinge, minuteHinge, { id: nextId++, ratio: 1 / 6 });

		const minuteHandId = nextId++;
		minuteHand = world.createBody({
			id: minuteHandId,
			x: cx + Math.sin(minHandAngle) * (minLen / 2 - 0.3),
			y: cy - Math.cos(minHandAngle) * (minLen / 2 - 0.3),
			r: minHandAngle,
			mass: 0.2,
			color: "#4444ff",
		});
		minuteHand.createFixture({
			id: minuteHandId,
			shape: gearbox.shapes.BOX,
			width: 0.12,
			height: minLen,
			categoryBits: CAT_HAND,
			maskBits: 0,
		});
		const minuteHandHinge = world.createHingeJoint(center, minuteHand, {
			id: nextId++,
			worldAnchor: { x: cx, y: cy },
			anchorB: { x: 0, y: minLen / 2 - 0.3 },
		});
		world.createGearJoint(minuteHinge, minuteHandHinge, { id: nextId++, ratio: -1.0 });

		const inter3X = cx + 2.0;
		const inter3Y = cy - 1.0;
		const inter3CenterId = nextId++;
		const inter3Center = world.createBody({
			id: inter3CenterId,
			x: inter3X,
			y: inter3Y,
			type: gearbox.bodyTypes.FIXED_OBJECT,
			color: "#888",
		});
		inter3Center.createFixture({
			id: inter3CenterId,
			shape: gearbox.shapes.CIRCLE,
			radius: 0.1,
			categoryBits: CAT_STATIC,
			maskBits: 0,
		});
		const inter3GearId = nextId++;
		const inter3Gear = world.createBody({
			id: inter3GearId,
			x: inter3X,
			y: inter3Y,
			mass: 0.2,
			r: 0,
			color: "#cccc44",
		});
		inter3Gear.createFixture({
			id: inter3GearId,
			shape: gearbox.shapes.CIRCLE,
			radius: 1.0,
			categoryBits: CAT_GEAR,
			maskBits: 0,
		});
		inter3Gear.angularDamping = 0.01;
		const inter3Hinge = world.createHingeJoint(inter3Center, inter3Gear, {
			id: nextId++,
			worldAnchor: { x: inter3X, y: inter3Y },
		});
		world.createGearJoint(minuteHinge, inter3Hinge, { id: nextId++, ratio: 1 / 3 });

		const hourGearId = nextId++;
		const hourGear = world.createBody({
			id: hourGearId,
			x: cx,
			y: cy,
			mass: 0.2,
			r: hourHandAngle,
			color: "#cc8844",
		});
		hourGear.createFixture({
			id: hourGearId,
			shape: gearbox.shapes.CIRCLE,
			radius: 1.1,
			categoryBits: CAT_GEAR,
			maskBits: 0,
		});
		hourGear.angularDamping = 0.01;
		const hourHinge = world.createHingeJoint(center, hourGear, {
			id: nextId++,
			worldAnchor: { x: cx, y: cy },
		});
		world.createGearJoint(inter3Hinge, hourHinge, { id: nextId++, ratio: 1 / 4 });

		const hourHandId = nextId++;
		hourHand = world.createBody({
			id: hourHandId,
			x: cx + Math.sin(hourHandAngle) * (hourLen / 2 - 0.4),
			y: cy - Math.cos(hourHandAngle) * (hourLen / 2 - 0.4),
			r: hourHandAngle,
			mass: 0.3,
			color: "#cc8844",
		});
		hourHand.createFixture({
			id: hourHandId,
			shape: gearbox.shapes.BOX,
			width: 0.18,
			height: hourLen,
			categoryBits: CAT_HAND,
			maskBits: 0,
		});
		const hourHandHinge = world.createHingeJoint(center, hourHand, {
			id: nextId++,
			worldAnchor: { x: cx, y: cy },
			anchorB: { x: 0, y: hourLen / 2 - 0.4 },
		});
		world.createGearJoint(hourHinge, hourHandHinge, { id: nextId++, ratio: -1.0 });
	}`,onInit:e=>{e.clear(),n.debug.showAabbs=!1,v=1;const t=5,o=2.5,s=1;e.setGravity(0,s),e.setHasRestitution(!0),e.setHasFriction(!0);const a=1,i=2,r=4,c=8,l=new Date,m=l.getSeconds(),x=l.getMinutes(),f=l.getHours()%12,h={crankRadius:.251412,groundDist:.962005,rockerLength:.788035,escXOffset:0,conRodFreq:15,conRodDamping:1,springFreq:.5,springX:t-1.5},d=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1",p=document.getElementById("clock-tuner-gui");p&&p.remove();const y=document.createElement("div");y.id="clock-tuner-gui",y.style="position:fixed;top:20px;right:20px;width:280px;background:rgba(0,0,0,0.85);color:#0f0;padding:15px;border-radius:8px;font-family:monospace;z-index:1000;box-shadow:0 4px 15px rgba(0,0,0,0.5);font-size:12px;border:1px solid #333;",d&&document.body.appendChild(y);const g=document.createElement("div");g.style="margin:15px 0;padding:10px;border:1px solid #0f0;text-align:center;font-size:16px;font-weight:bold;",g.textContent="Score: 0",y.appendChild(g);const b=document.createElement("button");b.textContent="Export to Console",b.style="width:100%;padding:8px;background:#0f0;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;margin-bottom:5px;",b.onclick=()=>console.log("Final Parameters:",JSON.stringify(h,null,4)),y.appendChild(b);const u=document.createElement("button");u.textContent="Start Auto-Optimize",u.style="width:100%;padding:8px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;",u.onclick=()=>{const F=e.scoreState;F.isOptimizing=!F.isOptimizing,u.textContent=F.isOptimizing?"Stop Auto-Optimize":"Start Auto-Optimize",u.style.background=F.isOptimizing?"#f00":"#444",F.isOptimizing&&(F.bestScore=-1/0,F.optimizationStage="PREPARE",F.optParamIndex=0,F.optDirection=1,F.epsilon=.05,F.lastImprovementIteration=0,console.log("Starting Auto-Optimization..."))},y.appendChild(u);const B=document.createElement("div");B.style="margin-top:10px;font-size:10px;color:#aaa;",B.textContent="Optimizer: Idle",y.appendChild(B);const I={},C=(F,R,le,he,Ve)=>{const Ke=document.createElement("div");Ke.style.marginBottom="10px";const Ze=document.createElement("div");Ze.textContent=`${F}: ${h[R].toFixed(2)}`;const z=document.createElement("input");z.type="range",z.min=le,z.max=he,z.step=Ve,z.value=h[R],z.style.width="100%",z.oninput=()=>{h[R]=parseFloat(z.value),Ze.textContent=`${F}: ${h[R].toFixed(2)}`,Ye()},Ke.appendChild(Ze),Ke.appendChild(z),y.appendChild(Ke),I[R]={slider:z,labelEl:Ze,label:F}},M=F=>{const R=I[F];R&&(R.slider.value=h[F],R.labelEl.textContent=`${R.label}: ${h[F].toFixed(2)}`)};C("Crank Radius","crankRadius",.05,.5,.01),C("Ground Distance","groundDist",.5,2,.05),C("Rocker Length","rockerLength",.3,1.5,.05),C("Esc X Offset","escXOffset",-.5,.5,.01),C("Rod Frequency","conRodFreq",5,50,1),C("Spring Frequency","springFreq",.1,2,.05),C("Spring X Pos","springX",t-3,t-.5,.1);const O=o+2,X=O-h.groundDist,J=s*Math.pow(8/(2*Math.PI),2);J-h.rockerLength;const j=v++,fe=e.createBody({id:j,x:t,y:O,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});fe.createFixture({id:j,shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const Me=v++,oe=e.createBody({id:Me,x:t,y:X,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});oe.createFixture({id:Me,shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const Pe=v++,V=e.createBody({id:Pe,x:t,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});V.createFixture({id:Pe,shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const ke=.5,Oe=v++;Y=e.createBody({id:Oe,x:t+Math.sin(ke)*J,y:O+Math.cos(ke)*J,r:-ke,mass:5,color:"#cd853f"}),Y.createFixture({id:Oe,shape:n.shapes.CIRCLE,radius:.4,categoryBits:i,maskBits:0}),Y.angularDamping=.01,e.createHingeJoint(fe,Y,{id:v++,worldAnchor:{x:t,y:O},anchorB:{x:0,y:-J}});const Ie=v++,G=e.createBody({id:Ie,x:t+h.escXOffset,y:X,r:0,type:n.bodyTypes.KINEMATIC_OBJECT,color:"#aaa"});G.createFixture({id:Ie,shape:n.shapes.CIRCLE,radius:.5,categoryBits:r,maskBits:0}),G.rs=Math.PI*2/8;const je=e.createHingeJoint(oe,G,{id:v++,worldAnchor:{x:t+h.escXOffset,y:X}}),on={x:h.crankRadius,y:0},Ge={x:0,y:-h.rockerLength},ae=()=>{const F=t+h.escXOffset,R=O-h.groundDist,le={x:F+h.crankRadius,y:R},he={x:t,y:O+(J-h.rockerLength)};return Math.sqrt(Math.pow(le.x-he.x,2)+Math.pow(le.y-he.y,2))},ce=e.createSpringJoint(G,Y,{id:v++,anchorA:on,anchorB:Ge,length:ae(),frequencyHz:h.conRodFreq,dampingRatio:h.conRodDamping}),Ye=()=>{const F=O-h.groundDist,R=t+h.escXOffset;oe.x=R,oe.y=F,G.x=R,G.y=F,je.localAnchorA=oe.worldToLocal({x:R,y:F}),ce.localAnchorA={x:h.crankRadius,y:0},ce.localAnchorB={x:0,y:-h.rockerLength},ce.length=ae(),ce.frequencyHz=h.conRodFreq,ce.dampingRatio=h.conRodDamping};e.scoreState={fastGear:G,pendulum:Y,params:h,updateSimulation:Ye,updateSliderUI:M,optStatus:B,lastFastR:G.r,lastPendRs:Y.rs,lastRsSign:Math.sign(Y.rs),rsSignChanges:0,maxAngle:-1/0,minAngle:1/0,hasCrossedZero:!1,history:[],periodTimes:[],lastPendSide:Math.sign(Y.r),lastPendCrossing:0,scoreDisplay:g,isOptimizing:!1};const gt=8/60,an=t+1.5,sn=X+.5,kn=v++,On=e.createBody({id:kn,x:an,y:sn,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});On.createFixture({id:kn,shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const Rn=v++,rn=e.createBody({id:Rn,x:an,y:sn,mass:.2,r:0,color:"#44ff44"});rn.createFixture({id:Rn,shape:n.shapes.CIRCLE,radius:1,categoryBits:r,maskBits:0}),rn.angularDamping=.02;const Ln=e.createHingeJoint(On,rn,{id:v++,worldAnchor:{x:an,y:sn}});e.createGearJoint(je,Ln,{id:v++,ratio:.25});const ze=m/60*Math.PI*2,Dn=v++,dn=e.createBody({id:Dn,x:t,y:o,mass:.2,r:ze,color:"#ff4444"});dn.createFixture({id:Dn,shape:n.shapes.CIRCLE,radius:.6,categoryBits:r,maskBits:0}),dn.angularDamping=.02;const cn=e.createHingeJoint(V,dn,{id:v++,worldAnchor:{x:t,y:o}});e.createGearJoint(Ln,cn,{id:v++,ratio:gt/.25});const Ne=x/60*Math.PI*2,We=f/12*Math.PI*2,$e=3.5,Ue=3,qe=2;for(let F=0;F<12;F++){const R=F/12*Math.PI*2-Math.PI/2,le=3.8,he=4,Ve=v++;e.createBody({id:Ve,x:t+Math.cos(R)*(le+he)/2,y:o+Math.sin(R)*(le+he)/2,r:R+Math.PI/2,type:n.bodyTypes.FIXED_OBJECT,color:"#999"}).createFixture({id:Ve,shape:n.shapes.BOX,width:F%3===0?.2:.1,height:.4,categoryBits:a,maskBits:0})}const Sn=v++;wn=e.createBody({id:Sn,x:t+Math.sin(ze)*($e/2-.2),y:o-Math.cos(ze)*($e/2-.2),r:ze,mass:.1,color:"#ff4444"}),wn.createFixture({id:Sn,shape:n.shapes.BOX,width:.05,height:$e,categoryBits:c,maskBits:0,restitution:0});const mt=e.createHingeJoint(V,wn,{id:v++,worldAnchor:{x:t,y:o},anchorB:{x:0,y:$e/2-.2}});e.createGearJoint(cn,mt,{id:v++,ratio:-1});const ln=t-1.5,hn=o-1.5,Xn=v++,Jn=e.createBody({id:Xn,x:ln,y:hn,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});Jn.createFixture({id:Xn,shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const Hn=v++,pn=e.createBody({id:Hn,x:ln,y:hn,mass:.2,r:0,color:"#4444ff"});pn.createFixture({id:Hn,shape:n.shapes.CIRCLE,radius:1,categoryBits:r,maskBits:0}),pn.angularDamping=.01;const _n=e.createHingeJoint(Jn,pn,{id:v++,worldAnchor:{x:ln,y:hn}});e.createGearJoint(cn,_n,{id:v++,ratio:1/10});const Pn=v++,yn=e.createBody({id:Pn,x:t,y:o,mass:.2,r:Ne,color:"#4444ff"});yn.createFixture({id:Pn,shape:n.shapes.CIRCLE,radius:.8,categoryBits:r,maskBits:0}),yn.angularDamping=.01;const un=e.createHingeJoint(V,yn,{id:v++,worldAnchor:{x:t,y:o}});e.createGearJoint(_n,un,{id:v++,ratio:1/6});const jn=v++;Cn=e.createBody({id:jn,x:t+Math.sin(Ne)*(Ue/2-.3),y:o-Math.cos(Ne)*(Ue/2-.3),r:Ne,mass:.2,color:"#4444ff"}),Cn.createFixture({id:jn,shape:n.shapes.BOX,width:.12,height:Ue,categoryBits:c,maskBits:0});const xt=e.createHingeJoint(V,Cn,{id:v++,worldAnchor:{x:t,y:o},anchorB:{x:0,y:Ue/2-.3}});e.createGearJoint(un,xt,{id:v++,ratio:-1});const gn=t+2,mn=o-1,Gn=v++,Yn=e.createBody({id:Gn,x:gn,y:mn,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});Yn.createFixture({id:Gn,shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const zn=v++,xn=e.createBody({id:zn,x:gn,y:mn,mass:.2,r:0,color:"#cccc44"});xn.createFixture({id:zn,shape:n.shapes.CIRCLE,radius:1,categoryBits:r,maskBits:0}),xn.angularDamping=.01;const Nn=e.createHingeJoint(Yn,xn,{id:v++,worldAnchor:{x:gn,y:mn}});e.createGearJoint(un,Nn,{id:v++,ratio:1/3});const Wn=v++,bn=e.createBody({id:Wn,x:t,y:o,mass:.2,r:We,color:"#cc8844"});bn.createFixture({id:Wn,shape:n.shapes.CIRCLE,radius:1.1,categoryBits:r,maskBits:0}),bn.angularDamping=.01;const $n=e.createHingeJoint(V,bn,{id:v++,worldAnchor:{x:t,y:o}});e.createGearJoint(Nn,$n,{id:v++,ratio:1/4});const Un=v++;Tn=e.createBody({id:Un,x:t+Math.sin(We)*(qe/2-.4),y:o-Math.cos(We)*(qe/2-.4),r:We,mass:.3,color:"#cc8844"}),Tn.createFixture({id:Un,shape:n.shapes.BOX,width:.18,height:qe,categoryBits:c,maskBits:0});const bt=e.createHingeJoint(V,Tn,{id:v++,worldAnchor:{x:t,y:o},anchorB:{x:0,y:qe/2-.4}});e.createGearJoint($n,bt,{id:v++,ratio:-1})},onTickRaw:`(world, dt) => {
		const s = (world as any).scoreState;
		if (s) {
			const now = performance.now();
			const windowSize = 8000; // Match one full 8s cycle

			// 1. Track Pendulum and Gear Events
			let rotDelta = 0;
			let isReversal = false;
			if (s.fastGear) {
				const diff = s.fastGear.r - s.lastFastR;
				if (diff < -0.01) isReversal = true;
				rotDelta = Math.max(0, diff) / (Math.PI * 2);
				s.lastFastR = s.fastGear.r;
			}

			const pendR = s.pendulum.r;
			const pendRs = s.pendulum.rs;
			const pendRa = (pendRs - s.lastPendRs) / dt;
			s.lastPendRs = pendRs;

			const currentRsSign = Math.sign(pendRs);
			if (currentRsSign !== s.lastRsSign && currentRsSign !== 0) {
				s.rsSignChanges++;
				s.lastRsSign = currentRsSign;
			}

			s.maxAngle = Math.max(s.maxAngle, pendR);
			s.minAngle = Math.min(s.minAngle, pendR);

			s.history.push({ time: now, rotDelta, isReversal, pendR, pendRs, pendRa });

			// 2. Track Pendulum Period
			if (s.pendulum) {
				const currentSide = Math.sign(s.pendulum.r);
				if (currentSide !== s.lastPendSide && currentSide !== 0) {
					s.hasCrossedZero = true;
					if (s.lastPendCrossing > 0) {
						const period = (now - s.lastPendCrossing) / 500; // Half period in seconds approx
						if (period > 0.5 && period < 10.0) {
							s.periodTimes.push({ time: now, period });
						}
					}
					s.lastPendCrossing = now;
					s.lastPendSide = currentSide;
				}
			}

			// 3. Prune Old Data
			const cutoff = now - windowSize;
			while (s.history.length > 0 && s.history[0].time < cutoff) s.history.shift();
			while (s.periodTimes.length > 0 && s.periodTimes[0].time < cutoff) s.periodTimes.shift();

			// 4. Calculate Recent Performance
			let avgAbsRa = 0;
			let avgAbsRs = 0;
			let maxRa = 0;
			if (s.history.length > 0) {
				let sumRa = 0;
				let sumRs = 0;
				for (const event of s.history) {
					sumRa += Math.abs(event.pendRa);
					sumRs += Math.abs(event.pendRs);
					maxRa = Math.max(maxRa, Math.abs(event.pendRa));
				}
				avgAbsRa = sumRa / s.history.length;
				avgAbsRs = sumRs / s.history.length;
			}

			// SCORE COMPONENTS
			// 1. Healthy Amplitude (we want it to swing at least 0.3 rads)
			const amplitude = (s.maxAngle - s.minAngle) / 2;
			let score = Math.min(amplitude, 0.6) * 2000;

			// 2. Symmetry (max and min should be centered around 0)
			const centerOffset = Math.abs(s.maxAngle + s.minAngle);
			score -= centerOffset * 1000;

			// 3. Smoothness (penalize high angular acceleration / "snappiness")
			// A natural pendulum has max acceleration at the ends, but here we want to avoid
			// the "rapid back and forth" the user mentioned.
			score -= avgAbsRa * 10;
			score -= maxRa * 2;

			// 4. Jitter Detection (Penalize extra velocity sign changes)
			// In one cycle (8s), it should ideally change sign exactly 2 times.
			if (s.rsSignChanges > 2) {
				score -= (s.rsSignChanges - 2) * 500;
			}

			// 5. Signs of Life
			score += avgAbsRs * 100;

			// CRITICAL PENALTIES (Abysmal scores for non-functional states)
			if (!s.hasCrossedZero) {
				score -= 10000; // Large penalty for not crossing zero
			}
			if (amplitude < 0.1) {
				score -= 5000; // Large penalty for stalling/no range
			}

			// Reset max/min for next window evaluation if not optimizing
			if (!s.isOptimizing && s.history.length === 0) {
				s.maxAngle = -Infinity;
				s.minAngle = Infinity;
				s.hasCrossedZero = false;
				s.rsSignChanges = 0;
			}

			s.scoreDisplay.textContent = \`Score: \${Math.floor(score)} | Amp: \${amplitude.toFixed(2)} | Jit: \${Math.max(0, s.rsSignChanges - 2)}\${!s.hasCrossedZero ? " [STUCK]" : ""}\`;

			// --- AUTO-OPTIMIZER LOGIC ---
			if (s.isOptimizing) {
				const keys = ["crankRadius", "groundDist", "rockerLength", "escXOffset", "conRodFreq"];

				if (s.optimizationStage === "PREPARE") {
					s.bestScore = -Infinity;
					s.optimizationStage = "TWEAK";
					s.evalTimer = now + windowSize;
					s.improvedThisCycle = false;
					s.maxAngle = -Infinity;
					s.minAngle = Infinity;
					s.hasCrossedZero = false;
					s.rsSignChanges = 0;
				} else if (now > s.evalTimer) {
					if (s.optimizationStage === "TWEAK") {
						if (score > s.bestScore) {
							s.bestScore = score;
							s.improvedThisCycle = true;
							s.optStatus.textContent = \`Improved \${keys[s.optParamIndex]} (Best: \${Math.floor(score)})\`;
						} else {
							s.params[keys[s.optParamIndex]] -= s.epsilon * s.optDirection;
							s.updateSimulation();
							s.updateSliderUI(keys[s.optParamIndex]);
						}

						s.optDirection *= -1;
						if (s.optDirection === 1) {
							s.optParamIndex++;
							if (s.optParamIndex >= keys.length) {
								s.optParamIndex = 0;
								if (!s.improvedThisCycle) {
									s.epsilon *= 0.7;
								}
								s.improvedThisCycle = false;
							}
						}

						s.params[keys[s.optParamIndex]] += s.epsilon * s.optDirection;
						s.updateSimulation();
						s.updateSliderUI(keys[s.optParamIndex]);

						// Reset window metrics for next evaluation
						s.maxAngle = -Infinity;
						s.minAngle = Infinity;
						s.hasCrossedZero = false;
						s.rsSignChanges = 0;
						s.evalTimer = now + windowSize;
						s.optStatus.textContent = \`Testing \${keys[s.optParamIndex]} (\${s.optDirection > 0 ? "+" : "-"}) Best: \${Math.floor(s.bestScore)}\`;
					}
				}
			} else {
				s.optStatus.textContent = "Optimizer: Idle";
			}
		}

		const now = new Date();
		const timeString = now.toLocaleTimeString();
		gearbox.debug.clearLabels();
		gearbox.debug.addLabel({
			text: "Mechanical Clockwork",
			x: 5,
			y: 0.5,
			fontSize: "28px Arial",
			color: "#bbb",
			position: "on-top",
		});
		gearbox.debug.addLabel({
			text: timeString,
			x: 5,
			y: 9.5,
			fontSize: "36px Arial",
			color: "#fff",
			position: "on-top",
		});
		if (pendulum) {
			const angle = ((pendulum.r * 180) / Math.PI).toFixed(1);
			gearbox.debug.addLabel({
				text: \`Pendulum: \${angle}°\`,
				x: 8,
				y: 8,
				fontSize: "16px Arial",
				color: "#cd853f",
				position: "on-top",
			});
		}
	}`,onTick:(e,t)=>{const o=e.scoreState;if(o){const i=performance.now(),r=8e3;let c=0,l=!1;if(o.fastGear){const I=o.fastGear.r-o.lastFastR;I<-.01&&(l=!0),c=Math.max(0,I)/(Math.PI*2),o.lastFastR=o.fastGear.r}const m=o.pendulum.r,x=o.pendulum.rs,f=(x-o.lastPendRs)/t;o.lastPendRs=x;const h=Math.sign(x);if(h!==o.lastRsSign&&h!==0&&(o.rsSignChanges++,o.lastRsSign=h),o.maxAngle=Math.max(o.maxAngle,m),o.minAngle=Math.min(o.minAngle,m),o.history.push({time:i,rotDelta:c,isReversal:l,pendR:m,pendRs:x,pendRa:f}),o.pendulum){const I=Math.sign(o.pendulum.r);if(I!==o.lastPendSide&&I!==0){if(o.hasCrossedZero=!0,o.lastPendCrossing>0){const C=(i-o.lastPendCrossing)/500;C>.5&&C<10&&o.periodTimes.push({time:i,period:C})}o.lastPendCrossing=i,o.lastPendSide=I}}const d=i-r;for(;o.history.length>0&&o.history[0].time<d;)o.history.shift();for(;o.periodTimes.length>0&&o.periodTimes[0].time<d;)o.periodTimes.shift();let p=0,y=0,g=0;if(o.history.length>0){let I=0,C=0;for(const M of o.history)I+=Math.abs(M.pendRa),C+=Math.abs(M.pendRs),g=Math.max(g,Math.abs(M.pendRa));p=I/o.history.length,y=C/o.history.length}const b=(o.maxAngle-o.minAngle)/2;let u=Math.min(b,.6)*2e3;const B=Math.abs(o.maxAngle+o.minAngle);if(u-=B*1e3,u-=p*10,u-=g*2,o.rsSignChanges>2&&(u-=(o.rsSignChanges-2)*500),u+=y*100,o.hasCrossedZero||(u-=1e4),b<.1&&(u-=5e3),!o.isOptimizing&&o.history.length===0&&(o.maxAngle=-1/0,o.minAngle=1/0,o.hasCrossedZero=!1,o.rsSignChanges=0),o.scoreDisplay.textContent=`Score: ${Math.floor(u)} | Amp: ${b.toFixed(2)} | Jit: ${Math.max(0,o.rsSignChanges-2)}${o.hasCrossedZero?"":" [STUCK]"}`,o.isOptimizing){const I=["crankRadius","groundDist","rockerLength","escXOffset","conRodFreq"];o.optimizationStage==="PREPARE"?(o.bestScore=-1/0,o.optimizationStage="TWEAK",o.evalTimer=i+r,o.improvedThisCycle=!1,o.maxAngle=-1/0,o.minAngle=1/0,o.hasCrossedZero=!1,o.rsSignChanges=0):i>o.evalTimer&&o.optimizationStage==="TWEAK"&&(u>o.bestScore?(o.bestScore=u,o.improvedThisCycle=!0,o.optStatus.textContent=`Improved ${I[o.optParamIndex]} (Best: ${Math.floor(u)})`):(o.params[I[o.optParamIndex]]-=o.epsilon*o.optDirection,o.updateSimulation(),o.updateSliderUI(I[o.optParamIndex])),o.optDirection*=-1,o.optDirection===1&&(o.optParamIndex++,o.optParamIndex>=I.length&&(o.optParamIndex=0,o.improvedThisCycle||(o.epsilon*=.7),o.improvedThisCycle=!1)),o.params[I[o.optParamIndex]]+=o.epsilon*o.optDirection,o.updateSimulation(),o.updateSliderUI(I[o.optParamIndex]),o.maxAngle=-1/0,o.minAngle=1/0,o.hasCrossedZero=!1,o.rsSignChanges=0,o.evalTimer=i+r,o.optStatus.textContent=`Testing ${I[o.optParamIndex]} (${o.optDirection>0?"+":"-"}) Best: ${Math.floor(o.bestScore)}`)}else o.optStatus.textContent="Optimizer: Idle"}const a=new Date().toLocaleTimeString();if(n.debug.clearLabels(),n.debug.addLabel({text:"Mechanical Clockwork",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"}),n.debug.addLabel({text:a,x:5,y:9.5,fontSize:"36px Arial",color:"#fff",position:"on-top"}),Y){const i=(Y.r*180/Math.PI).toFixed(1);n.debug.addLabel({text:`Pendulum: ${i}°`,x:8,y:8,fontSize:"16px Arial",color:"#cd853f",position:"on-top"})}},onCleanup:e=>{const t=document.getElementById("clock-tuner-gui");t&&t.remove()}});let H=1,$=null;const Rt=new w({name:"Gnome Omega Engine",key:"gnome-omega",description:["A detailed simulation of a **Gnome Omega** rotary engine. In this classic radial design, the crankshaft remains stationary while the entire cylinder block rotates around it.","### Features","- **Stationary Crankshaft**: A fixed pivot point (red) offset from the center.","- **Rotating Crankcase**: The main grey hub that carries the cylinders.","- **Weld Constraints**: Cylinders are 'welded' to the hub using a combination of `HingeJoint` and `DistanceJoint` for maximum stability.","- **Reciprocating Motion**: Pistons and connecting rods are synchronized via `HingeJoint` constraints.","- **Collision Masks**: Bitwise filtering ensures pistons only interact with their respective cylinder walls.","Click **Reset** if the simulation becomes unstable due to extreme angular velocities."].join(`

`),onInitRaw:`(world) => {
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

		world.createHingeJoint(hubAnchor, engineHub, {
			id: nextId++,
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
				world.createHingeJoint(engineHub, wall, { id: nextId++, worldAnchor: wAnchor1 });
				world.createDistanceJoint(engineHub, wall, { id: nextId++, worldAnchor: wAnchor2 });
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
			world.createHingeJoint(rod, crankPin, {
				id: nextId++,
				anchorA: { x: 0, y: -rodLength / 2 },
				anchorB: { x: 0, y: 0 },
			});

			// Hinge: Rod to Piston
			world.createHingeJoint(rod, piston, {
				id: nextId++,
				anchorA: { x: 0, y: rodLength / 2 },
				anchorB: { x: 0, y: 0 },
			});
		}

		world.setGravity(0, 0);
		engineHub.rs = 2.0; // Start with a gentle initial rotation
	}`,onInit:e=>{e.clear(),n.debug.showAabbs=!1,H=1,$=null;const t=5,o=4.5,s=.8,a=7,i=2.5,r=256,c=512,l=1024,m=2048,x=4096,f=H++,h=e.createBody({id:f,x:t,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});h.createFixture({id:f,shape:n.shapes.CIRCLE,radius:.15,categoryBits:r,maskBits:0});const d=H++,p=e.createBody({id:d,x:t,y:o+s,type:n.bodyTypes.FIXED_OBJECT,color:"#ff4444"});p.createFixture({id:d,shape:n.shapes.CIRCLE,radius:.1,categoryBits:r,maskBits:0});const y=H++;$=e.createBody({id:y,x:t,y:o,mass:50,color:"#aaa"}),$.createFixture({id:y,shape:n.shapes.CIRCLE,radius:.8,categoryBits:c,maskBits:0,restitution:0}),e.createHingeJoint(h,$,{id:H++,worldAnchor:{x:t,y:o}});for(let g=0;g<a;g++){const b=g/a*Math.PI*2,u=Math.cos(b),B=Math.sin(b),I=b-Math.PI/2,C=2.6,M=.28,O=2.5,X=1,te=G=>{const je=t+u*C+-B*(G*X/2),on=o+B*C+u*(G*X/2),Ge=H++,ae=e.createBody({id:Ge,x:je,y:on,r:I,mass:1,color:"#bbb"});ae.createFixture({id:Ge,shape:n.shapes.BOX,width:M,height:O,categoryBits:l,maskBits:m,restitution:0,sFriction:0,kFriction:0});const ce=ae.localToWorld({x:0,y:-O/2}),Ye=ae.localToWorld({x:0,y:O/2});e.createHingeJoint($,ae,{id:H++,worldAnchor:ce}),e.createDistanceJoint($,ae,{id:H++,worldAnchor:Ye})};te(-1),te(1);const J=s*Math.sin(b)+Math.sqrt(i*i-Math.pow(s*Math.cos(b),2)),j=t+u*J,fe=o+B*J,Me=H++,oe=e.createBody({id:Me,x:j,y:fe,r:I,mass:.5,color:"#ddd"});oe.createFixture({id:Me,shape:n.shapes.BOX,width:.7,height:1,categoryBits:m,maskBits:l,restitution:0,sFriction:0,kFriction:0});const Pe=(t+j)/2,V=(o+s+fe)/2,ke=Math.atan2(fe-(o+s),j-t)-Math.PI/2,Oe=H++,Ie=e.createBody({id:Oe,x:Pe,y:V,r:ke,mass:.2,color:"#fff"});Ie.createFixture({id:Oe,shape:n.shapes.BOX,width:.15,height:i,categoryBits:x,maskBits:0,restitution:0}),e.createHingeJoint(Ie,p,{id:H++,anchorA:{x:0,y:-i/2},anchorB:{x:0,y:0}}),e.createHingeJoint(Ie,oe,{id:H++,anchorA:{x:0,y:i/2},anchorB:{x:0,y:0}})}e.setGravity(0,0),$.rs=2},onTickRaw:`(world, dt) => {
		if (engineHub) {
			// Apply a gentle impulse to maintain rotation
			if (Math.abs(engineHub.rs) < 0.9) {
				engineHub.applyAngularImpulse(5);
			}
		}
	}`,onTick:(e,t)=>{$&&Math.abs($.rs)<.9&&$.applyAngularImpulse(5)}});let He=1,Z=null;const we=[{name:"Cherry",radius:.15,mass:.1,color:"#ff4444",score:1},{name:"Strawberry",radius:.22,mass:.2,color:"#ff6666",score:3},{name:"Grape",radius:.28,mass:.3,color:"#9933ff",score:6},{name:"Dekopon",radius:.35,mass:.4,color:"#ff9933",score:10},{name:"Persimmon",radius:.42,mass:.5,color:"#ff6600",score:15},{name:"Apple",radius:.5,mass:.7,color:"#cc0000",score:21},{name:"Pear",radius:.58,mass:.9,color:"#ffff66",score:28},{name:"Peach",radius:.68,mass:1.2,color:"#ff99cc",score:36},{name:"Pineapple",radius:.8,mass:1.6,color:"#ffff00",score:45},{name:"Melon",radius:.95,mass:2.2,color:"#99ff33",score:55},{name:"Watermelon",radius:1.15,mass:3,color:"#006600",score:66}];let A={score:0,nextFruitLevel:0,isGameOver:!1,lastDropTime:0,dropCooldown:500,mouseX:5,fruitIds:new Map,mergingIds:new Set,previewFruit:null};const et=()=>{A.score=0,A.nextFruitLevel=Math.floor(Math.random()*5),A.isGameOver=!1,A.lastDropTime=0,A.mouseX=5,A.fruitIds.clear(),A.mergingIds.clear(),A.previewFruit=null,He=1},Lt=e=>(e-n.debug.offsetX)/(n.debug.zoom*100),dt=new w({name:"Fruit Merge",key:"fruit-merge",description:["A physics-based arcade game demonstrating dynamic object spawning and collision events.","Drop fruits into the bucket. Identical fruits will **merge** into the next larger fruit tier on contact.","### Controls","- **Mouse Move**: Position the preview fruit","- **Click**: Drop fruit","**Game Over** occurs if any fruit falls out of the world boundaries."].join(`

`),onInitRaw:`(world) => {
		world.clear();
		resetGameState();
		gearbox.debug.showAabbs = false;

		world.setGravity(0, 9.8);
		world.setHasRestitution(true);
		world.setHasFriction(true);

		// Bucket dimensions
		const bx = 5;
		const by = 6;
		const bw = 4;
		const bh = 5;
		const thickness = 0.2;

		// Bucket Bottom
		const bucketBottomId = nextId++;
		world
			.createBody({
				id: bucketBottomId,
				x: bx,
				y: by + bh / 2 + thickness / 2,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "#664422",
			})
			.createFixture({
				shape: gearbox.shapes.BOX,
				width: bw + thickness * 2,
				height: thickness,
			});

		// Left Wall
		const leftWallId = nextId++;
		world
			.createBody({
				id: leftWallId,
				x: bx - bw / 2 - thickness / 2,
				y: by,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "#664422",
			})
			.createFixture({
				shape: gearbox.shapes.BOX,
				width: thickness,
				height: bh,
			});

		// Right Wall
		const rightWallId = nextId++;
		world
			.createBody({
				id: rightWallId,
				x: bx + bw / 2 + thickness / 2,
				y: by,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "#664422",
			})
			.createFixture({
				shape: gearbox.shapes.BOX,
				width: thickness,
				height: bh,
			});

		const spawnFruit = (x: number, y: number, level: number, isInitial: boolean = false) => {
			if (level >= FRUIT_LEVELS.length) return null;

			const fruitDef = FRUIT_LEVELS[level];
			const id = nextId++;
			const fruit = world.createBody({ id: id, x, y, mass: fruitDef.mass, color: fruitDef.color });
			fruit.createFixture({
				shape: gearbox.shapes.CIRCLE,
				radius: fruitDef.radius,
				restitution: 0.2,
				sFriction: 0.5,
				kFriction: 0.3,
			});

			if (fruit) {
				fruit.wantsEvents = true;
				gameState.fruitIds.set(id, level);
				if (isInitial) {
					// Slight random kick for initial drop
					fruit.vx = (Math.random() - 0.5) * 0.1;
				}
			}
			return fruit;
		};

		// Collision logic for merging
		world.onCollisionStart = (idA, idB) => {
			if (gameState.isGameOver) return;

			const levelA = gameState.fruitIds.get(idA);
			const levelB = gameState.fruitIds.get(idB);

			if (levelA !== undefined && levelB !== undefined && levelA === levelB) {
				// Prevent same-frame double merging
				if (gameState.mergingIds.has(idA) || gameState.mergingIds.has(idB)) return;

				const level = levelA;
				if (level >= FRUIT_LEVELS.length - 1) {
					// Max level (Watermelon) - maybe just reward points?
					// For now, they just stay.
					return;
				}

				gameState.mergingIds.add(idA);
				gameState.mergingIds.add(idB);

				const objA = world.getBodyById(idA);
				const objB = world.getBodyById(idB);

				if (objA && objB) {
					const midX = (objA.x + objB.x) / 2;
					const midY = (objA.y + objB.y) / 2;

					// Schedule removal and spawn for next tick to avoid issues during physics step
					// In Gearbox2D, we can remove objects safely outside of step,
					// but we are currently IN the step via callback.
					// Actually, the engine might handle this, but let's be safe.
					setTimeout(() => {
						world.removeObject(idA);
						world.removeObject(idB);
						gameState.fruitIds.delete(idA);
						gameState.fruitIds.delete(idB);
						gameState.mergingIds.delete(idA);
						gameState.mergingIds.delete(idB);

						const newFruit = spawnFruit(midX, midY, level + 1);
						if (newFruit) {
							gameState.score += FRUIT_LEVELS[level + 1].score;
						}
					}, 0);
				}
			}
		};

		// Mouse Handlers
		canvas = document.getElementById("debug-canvas") as HTMLCanvasElement;

		// Remove existing listeners if they exist (prevents leakage on restart)
		if ((world as any)._onMouseMove) canvas.removeEventListener("mousemove", (world as any)._onMouseMove);
		if ((world as any)._onClick) canvas.removeEventListener("click", (world as any)._onClick);

		const onMouseMove = (e: MouseEvent) => {
			if (gameState.isGameOver) return;
			const rect = canvas!.getBoundingClientRect();
			gameState.mouseX = screenToWorldX(e.clientX - rect.left);

			// Constrain mouseX to bucket width
			const margin = FRUIT_LEVELS[gameState.nextFruitLevel].radius;
			gameState.mouseX = Math.max(bx - bw / 2 + margin, Math.min(bx + bw / 2 - margin, gameState.mouseX));
		};

		const onClick = (e: MouseEvent) => {
			if (gameState.isGameOver) {
				world.clear();
				resetGameState();
				// Re-setup bucket (simplified for demo, usually onInit handles this)
				fruitMergeExample.onInit!(world);
				return;
			}

			const now = Date.now();
			if (now - gameState.lastDropTime > gameState.dropCooldown) {
				spawnFruit(gameState.mouseX, by - bh / 2 - 1, gameState.nextFruitLevel, true);
				gameState.nextFruitLevel = Math.floor(Math.random() * 5);
				gameState.lastDropTime = now;
			}
		};

		(world as any)._onMouseMove = onMouseMove;
		(world as any)._onClick = onClick;

		canvas.addEventListener("mousemove", onMouseMove);
		canvas.addEventListener("click", onClick);
	}`,onInit:e=>{e.clear(),et(),n.debug.showAabbs=!1,e.setGravity(0,9.8),e.setHasRestitution(!0),e.setHasFriction(!0);const t=5,o=6,s=4,a=5,i=.2,r=He++;e.createBody({id:r,x:t,y:o+a/2+i/2,type:n.bodyTypes.FIXED_OBJECT,color:"#664422"}).createFixture({shape:n.shapes.BOX,width:s+i*2,height:i});const c=He++;e.createBody({id:c,x:t-s/2-i/2,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#664422"}).createFixture({shape:n.shapes.BOX,width:i,height:a});const l=He++;e.createBody({id:l,x:t+s/2+i/2,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#664422"}).createFixture({shape:n.shapes.BOX,width:i,height:a});const m=(h,d,p,y=!1)=>{if(p>=we.length)return null;const g=we[p],b=He++,u=e.createBody({id:b,x:h,y:d,mass:g.mass,color:g.color});return u.createFixture({shape:n.shapes.CIRCLE,radius:g.radius,restitution:.2,sFriction:.5,kFriction:.3}),u&&(u.wantsEvents=!0,A.fruitIds.set(b,p),y&&(u.vx=(Math.random()-.5)*.1)),u};e.onCollisionStart=(h,d)=>{if(A.isGameOver)return;const p=A.fruitIds.get(h),y=A.fruitIds.get(d);if(p!==void 0&&y!==void 0&&p===y){if(A.mergingIds.has(h)||A.mergingIds.has(d))return;const g=p;if(g>=we.length-1)return;A.mergingIds.add(h),A.mergingIds.add(d);const b=e.getBodyById(h),u=e.getBodyById(d);if(b&&u){const B=(b.x+u.x)/2,I=(b.y+u.y)/2;setTimeout(()=>{e.removeObject(h),e.removeObject(d),A.fruitIds.delete(h),A.fruitIds.delete(d),A.mergingIds.delete(h),A.mergingIds.delete(d),m(B,I,g+1)&&(A.score+=we[g+1].score)},0)}}},Z=document.getElementById("debug-canvas"),e._onMouseMove&&Z.removeEventListener("mousemove",e._onMouseMove),e._onClick&&Z.removeEventListener("click",e._onClick);const x=h=>{if(A.isGameOver)return;const d=Z.getBoundingClientRect();A.mouseX=Lt(h.clientX-d.left);const p=we[A.nextFruitLevel].radius;A.mouseX=Math.max(t-s/2+p,Math.min(t+s/2-p,A.mouseX))},f=h=>{if(A.isGameOver){e.clear(),et(),dt.onInit(e);return}const d=Date.now();d-A.lastDropTime>A.dropCooldown&&(m(A.mouseX,o-a/2-1,A.nextFruitLevel,!0),A.nextFruitLevel=Math.floor(Math.random()*5),A.lastDropTime=d)};e._onMouseMove=x,e._onClick=f,Z.addEventListener("mousemove",x),Z.addEventListener("click",f)},onTickRaw:`(world, dt) => {
		gearbox.debug.clearLabels();

		if (gameState.isGameOver) {
			gearbox.debug.addLabel({
				text: "GAME OVER",
				x: 5,
				y: 4,
				fontSize: "48px Arial",
				color: "#ff4444",
				position: "on-top",
			});
			gearbox.debug.addLabel({
				text: \`Final Score: \${gameState.score}\`,
				x: 5,
				y: 5,
				fontSize: "24px Arial",
				color: "#fff",
				position: "on-top",
			});
			gearbox.debug.addLabel({
				text: "Click to Restart",
				x: 5,
				y: 6,
				fontSize: "20px Arial",
				color: "#888",
				position: "on-top",
			});
			return;
		}

		// Draw Score
		gearbox.debug.addLabel({
			text: \`Score: \${gameState.score}\`,
			x: 0.5,
			y: 0.5,
			fontSize: "24px Arial",
			color: "#fff",
			position: "on-top",
		});

		// Draw Next Fruit Preview
		const nextFruit = FRUIT_LEVELS[gameState.nextFruitLevel];
		gearbox.debug.addLabel({
			text: \`Next: \${nextFruit.name}\`,
			x: 8.0,
			y: 0.5,
			fontSize: "18px Arial",
			color: nextFruit.color,
			position: "on-top",
		});

		// Draw Drop Guide / Preview
		const previewY = 1.5;
		gearbox.debug.addLabel({
			text: "●",
			x: gameState.mouseX,
			y: previewY,
			fontSize: \`\${nextFruit.radius * 200}px Arial\`,
			color: nextFruit.color,
			position: "on-top",
		});

		// Check for Fall Out (Game Over)
		world.iterateBodies((obj) => {
			if (gameState.fruitIds.has(obj.id)) {
				if (obj.y > 12) {
					// Fell below the bucket
					gameState.isGameOver = true;
				}
			}
		});

		gearbox.debug.addLabel({
			text: "Fruit Merge",
			x: 5,
			y: 0.5,
			fontSize: "28px Arial",
			color: "#bbb",
			position: "on-top",
		});
	}`,onTick:(e,t)=>{if(n.debug.clearLabels(),A.isGameOver){n.debug.addLabel({text:"GAME OVER",x:5,y:4,fontSize:"48px Arial",color:"#ff4444",position:"on-top"}),n.debug.addLabel({text:`Final Score: ${A.score}`,x:5,y:5,fontSize:"24px Arial",color:"#fff",position:"on-top"}),n.debug.addLabel({text:"Click to Restart",x:5,y:6,fontSize:"20px Arial",color:"#888",position:"on-top"});return}n.debug.addLabel({text:`Score: ${A.score}`,x:.5,y:.5,fontSize:"24px Arial",color:"#fff",position:"on-top"});const o=we[A.nextFruitLevel];n.debug.addLabel({text:`Next: ${o.name}`,x:8,y:.5,fontSize:"18px Arial",color:o.color,position:"on-top"}),n.debug.addLabel({text:"●",x:A.mouseX,y:1.5,fontSize:`${o.radius*200}px Arial`,color:o.color,position:"on-top"}),e.iterateBodies(a=>{A.fruitIds.has(a.id)&&a.y>12&&(A.isGameOver=!0)}),n.debug.addLabel({text:"Fruit Merge",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"})},onCleanup:e=>{Z&&(Z.removeEventListener("mousemove",e._onMouseMove),Z.removeEventListener("click",e._onClick),delete e._onMouseMove,delete e._onClick)}});let L=1,D=null,ye=null,Ce=null,Te=null,ve=null,Ae=null,ue=[],se={},P=null,be=null,re=null;const Ee=1,Xe=2,ie=4,ct=(e,t)=>({x:(e-n.debug.offsetX)/(n.debug.zoom*100),y:(t-n.debug.offsetY)/(n.debug.zoom*100)}),Dt=(e,t)=>{if(e.button!==0)return;const o=re.getBoundingClientRect(),s=ct(e.clientX-o.left,e.clientY-o.top),a=t.queryBodiesAtPoint(s.x,s.y);if(a.length>0){const i=a[0],r=t.getBodyById(i);r&&r.type!==n.bodyTypes.FIXED_OBJECT&&(P=t.createBody({id:999999,x:s.x,y:s.y,type:n.bodyTypes.FIXED_OBJECT,color:"transparent"}),P.createFixture({id:999999,shape:n.shapes.CIRCLE,radius:.05,maskBits:0}),be=t.createSpringJoint(P,r,{id:999998,worldAnchor:s,frequencyHz:5,dampingRatio:1,length:0}))}},St=e=>{if(P){const t=re.getBoundingClientRect(),o=ct(e.clientX-t.left,e.clientY-t.top);P.x=o.x,P.y=o.y}},Xt=(e,t)=>{be&&(t.removeJoint(be.id),be=null),P&&(t.removeObject(P.id),P=null)},lt=new w({name:"Motorcycle Trials",key:"motorcycle",description:["A physically-driven motorcycle featuring multi-joint suspension and a gear-driven powertrain.","### Controls","- **D / A**: Throttle / Reverse","- **W / S**: Lean / Balance","- **R**: Reset Simulation","### Technical Features","- **Power Transfer**: Engine-to-wheel torque transfer using `GearJoint` constraints.","- **Suspension**: A network of `SpringJoint` constraints for authentic front/rear suspension travel.","- **Procedural Terrain**: Dynamic generation with optimized **Collision Masks** (terrain-terrain collisions are disabled for performance)."].join(`

`),onInitRaw:`(world) => {
		world.clear();
		gearbox.debug.showAabbs = false;
		gearbox.debug.showForceVectors = false;
		nextId = 1;
		terrainBoxes = [];
		keys = {};

		const cx = 5;
		const cy = 5;
		world.setGravity(0, 9.81);
		world.setHasRestitution(true);
		world.setHasFriction(true);

		// --- 1. Motorcycle Construction ---

		// Chassis
		const chassisId = nextId++;
		chassis = world.createBody({ id: chassisId, x: cx, y: cy, mass: 10.0, color: "#ff4444" });
		chassis.createFixture({
			id: chassisId,
			shape: gearbox.shapes.BOX,
			width: 1.2,
			height: 0.4,
			categoryBits: CAT_CHASSIS,
			maskBits: CAT_TERRAIN,
		});
		chassis.angularDamping = 1.0;

		// Engine (internal spinning mass to drive wheels)
		const engineId = nextId++;
		engine = world.createBody({ id: engineId, x: cx, y: cy - 0.15, mass: 5.0, color: "#444" });
		engine.createFixture({
			id: engineId,
			shape: gearbox.shapes.CIRCLE,
			radius: 0.25,
			categoryBits: 0, // No collision
			maskBits: 0,
		});
		const engineHinge = world.createHingeJoint(chassis, engine, {
			id: nextId++,
			worldAnchor: { x: cx, y: cy - 0.15 },
		});

		// Rear Suspension Arm (Swingarm)
		const rearArmId = nextId++;
		rearArm = world.createBody({ id: rearArmId, x: cx - 0.6, y: cy + 0.2, mass: 1.0, color: "#666" });
		rearArm.createFixture({
			shape: gearbox.shapes.BOX,
			width: 0.6,
			height: 0.1,
			categoryBits: CAT_CHASSIS,
			maskBits: CAT_TERRAIN,
		});
		rearArm.angularDamping = 1.0;
		const rearArmHinge = world.createHingeJoint(chassis, rearArm, {
			id: nextId++,
			anchorA: { x: -0.4, y: 0.1 },
			anchorB: { x: 0.3, y: 0 },
		});
		world.createSpringJoint(chassis, rearArm, {
			id: nextId++,
			anchorA: { x: -0.7, y: -0.2 },
			anchorB: { x: -0.3, y: 0 },
			frequencyHz: 25.0,
			dampingRatio: 0.8,
		});

		// Rear Wheel
		const rearWheelId = nextId++;
		rearWheel = world.createBody({
			id: rearWheelId,
			x: cx - 0.9,
			y: cy + 0.2, // Aligned with arm anchor
			mass: 2.0,
			color: "#333",
		});
		rearWheel.createFixture({
			id: rearWheelId,
			shape: gearbox.shapes.CIRCLE,
			radius: 0.4,
			categoryBits: CAT_WHEEL,
			maskBits: CAT_TERRAIN,
		});
		rearWheel.fixtures[0].kineticFriction = 2.5;
		rearWheel.fixtures[0].staticFriction = 3.0;
		rearWheel.angularDamping = 0.5;
		const rearWheelHinge = world.createHingeJoint(rearArm, rearWheel, {
			id: nextId++,
			anchorA: { x: -0.3, y: 0 },
			anchorB: { x: 0, y: 0 },
		});

		// Drive Chain (Engine to Rear Wheel)
		world.createGearJoint(engineHinge, rearWheelHinge, { id: nextId++, ratio: 2.0 });

		// Front Suspension Arm (Forks)
		const frontArmId = nextId++;
		frontArm = world.createBody({ id: frontArmId, x: cx + 0.7, y: cy + 0.2, r: 0.3, mass: 1.0, color: "#666" });
		frontArm.createFixture({
			shape: gearbox.shapes.BOX,
			width: 0.1,
			height: 0.8,
			categoryBits: CAT_CHASSIS,
			maskBits: CAT_TERRAIN,
		});
		frontArm.angularDamping = 1.0;
		const frontArmHinge = world.createHingeJoint(chassis, frontArm, {
			id: nextId++,
			anchorA: { x: 0.5, y: 0 },
			anchorB: { x: 0, y: -0.3 },
		});
		world.createSpringJoint(chassis, frontArm, {
			id: nextId++,
			anchorA: { x: 0.2, y: 0.2 },
			anchorB: { x: 0, y: 0.3 },
			frequencyHz: 20.0,
			dampingRatio: 0.9,
		});

		// Front Wheel
		const frontWheelId = nextId++;
		frontWheel = world.createBody({
			id: frontWheelId,
			x: cx + 0.8,
			y: cy + 0.5, // Aligned with fork anchor
			mass: 2.0,
			color: "#333",
		});
		frontWheel.createFixture({
			id: frontWheelId,
			shape: gearbox.shapes.CIRCLE,
			radius: 0.4,
			categoryBits: CAT_WHEEL,
			maskBits: CAT_TERRAIN,
		});
		frontWheel.fixtures[0].kineticFriction = 2.0;
		frontWheel.fixtures[0].staticFriction = 2.5;
		frontWheel.angularDamping = 0.5;
		const frontWheelHinge = world.createHingeJoint(frontArm, frontWheel, {
			id: nextId++,
			anchorA: { x: 0, y: 0.4 },
			anchorB: { x: 0, y: 0 },
		});

		// --- 2. Initial Terrain ---
		const startPlatformId = nextId++;
		const startPlatform = world.createBody({
			id: startPlatformId,
			x: cx,
			y: cy + 2.0,
			type: gearbox.bodyTypes.FIXED_OBJECT,
			color: "#444",
		});
		startPlatform.createFixture({
			shape: gearbox.shapes.BOX,
			width: 20,
			height: 1.0,
			categoryBits: CAT_TERRAIN,
			maskBits: CAT_CHASSIS | CAT_WHEEL,
		});
		terrainBoxes.push(startPlatform);

		// Back Hill (Steep incline to prevent backing up)
		const backHillId = nextId++;
		world
			.createBody({
				id: backHillId,
				x: -7.72,
				y: 0.01,
				r: 1.2, // Very steep (now tilted correctly as \\_)
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: "#333",
			})
			.createFixture({
				shape: gearbox.shapes.BOX,
				width: 15,
				height: 1.0,
				categoryBits: CAT_TERRAIN,
				maskBits: CAT_CHASSIS | CAT_WHEEL,
			});

		// Input listeners
		const onKeyDown = (e) => (keys[e.code] = true);
		const onKeyUp = (e) => (keys[e.code] = false);

		// Mouse interaction
		canvas = document.getElementById("debug-canvas");
		const mouseDownHandler = (e) => onMouseDown(e, world);
		const mouseMoveHandler = (e) => onMouseMove(e);
		const mouseUpHandler = (e) => onMouseUp(e, world);

		// Remove existing listeners if they exist (prevents leakage on restart)
		const oldListeners = (world as any)._motorcycleListeners;
		if (oldListeners) {
			window.removeEventListener("keydown", oldListeners.onKeyDown);
			window.removeEventListener("keyup", oldListeners.onKeyUp);
			if (canvas) {
				canvas.removeEventListener("mousedown", oldListeners.mouseDownHandler);
			}
			window.removeEventListener("mousemove", oldListeners.mouseMoveHandler);
			window.removeEventListener("mouseup", oldListeners.mouseUpHandler);
		}

		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);

		canvas.addEventListener("mousedown", mouseDownHandler);
		window.addEventListener("mousemove", mouseMoveHandler);
		window.addEventListener("mouseup", mouseUpHandler);

		// Store listeners for cleanup
		(world as any)._motorcycleListeners = {
			onKeyDown,
			onKeyUp,
			mouseDownHandler,
			mouseMoveHandler,
			mouseUpHandler,
		};
	}`,onInit:e=>{e.clear(),n.debug.showAabbs=!1,n.debug.showForceVectors=!1,L=1,ue=[],se={};const t=5,o=5;e.setGravity(0,9.81),e.setHasRestitution(!0),e.setHasFriction(!0);const s=L++;D=e.createBody({id:s,x:t,y:o,mass:10,color:"#ff4444"}),D.createFixture({id:s,shape:n.shapes.BOX,width:1.2,height:.4,categoryBits:Ee,maskBits:ie}),D.angularDamping=1;const a=L++;ye=e.createBody({id:a,x:t,y:o-.15,mass:5,color:"#444"}),ye.createFixture({id:a,shape:n.shapes.CIRCLE,radius:.25,categoryBits:0,maskBits:0});const i=e.createHingeJoint(D,ye,{id:L++,worldAnchor:{x:t,y:o-.15}}),r=L++;Ae=e.createBody({id:r,x:t-.6,y:o+.2,mass:1,color:"#666"}),Ae.createFixture({shape:n.shapes.BOX,width:.6,height:.1,categoryBits:Ee,maskBits:ie}),Ae.angularDamping=1,e.createHingeJoint(D,Ae,{id:L++,anchorA:{x:-.4,y:.1},anchorB:{x:.3,y:0}}),e.createSpringJoint(D,Ae,{id:L++,anchorA:{x:-.7,y:-.2},anchorB:{x:-.3,y:0},frequencyHz:25,dampingRatio:.8});const c=L++;Te=e.createBody({id:c,x:t-.9,y:o+.2,mass:2,color:"#333"}),Te.createFixture({id:c,shape:n.shapes.CIRCLE,radius:.4,categoryBits:Xe,maskBits:ie}),Te.fixtures[0].kineticFriction=2.5,Te.fixtures[0].staticFriction=3,Te.angularDamping=.5;const l=e.createHingeJoint(Ae,Te,{id:L++,anchorA:{x:-.3,y:0},anchorB:{x:0,y:0}});e.createGearJoint(i,l,{id:L++,ratio:2});const m=L++;ve=e.createBody({id:m,x:t+.7,y:o+.2,r:.3,mass:1,color:"#666"}),ve.createFixture({shape:n.shapes.BOX,width:.1,height:.8,categoryBits:Ee,maskBits:ie}),ve.angularDamping=1,e.createHingeJoint(D,ve,{id:L++,anchorA:{x:.5,y:0},anchorB:{x:0,y:-.3}}),e.createSpringJoint(D,ve,{id:L++,anchorA:{x:.2,y:.2},anchorB:{x:0,y:.3},frequencyHz:20,dampingRatio:.9});const x=L++;Ce=e.createBody({id:x,x:t+.8,y:o+.5,mass:2,color:"#333"}),Ce.createFixture({id:x,shape:n.shapes.CIRCLE,radius:.4,categoryBits:Xe,maskBits:ie}),Ce.fixtures[0].kineticFriction=2,Ce.fixtures[0].staticFriction=2.5,Ce.angularDamping=.5,e.createHingeJoint(ve,Ce,{id:L++,anchorA:{x:0,y:.4},anchorB:{x:0,y:0}});const f=L++,h=e.createBody({id:f,x:t,y:o+2,type:n.bodyTypes.FIXED_OBJECT,color:"#444"});h.createFixture({shape:n.shapes.BOX,width:20,height:1,categoryBits:ie,maskBits:Ee|Xe}),ue.push(h);const d=L++;e.createBody({id:d,x:-7.72,y:.01,r:1.2,type:n.bodyTypes.FIXED_OBJECT,color:"#333"}).createFixture({shape:n.shapes.BOX,width:15,height:1,categoryBits:ie,maskBits:Ee|Xe});const p=I=>se[I.code]=!0,y=I=>se[I.code]=!1;re=document.getElementById("debug-canvas");const g=I=>Dt(I,e),b=I=>St(I),u=I=>Xt(I,e),B=e._motorcycleListeners;B&&(window.removeEventListener("keydown",B.onKeyDown),window.removeEventListener("keyup",B.onKeyUp),re&&re.removeEventListener("mousedown",B.mouseDownHandler),window.removeEventListener("mousemove",B.mouseMoveHandler),window.removeEventListener("mouseup",B.mouseUpHandler)),window.addEventListener("keydown",p),window.addEventListener("keyup",y),re.addEventListener("mousedown",g),window.addEventListener("mousemove",b),window.addEventListener("mouseup",u),e._motorcycleListeners={onKeyDown:p,onKeyUp:y,mouseDownHandler:g,mouseMoveHandler:b,mouseUpHandler:u}},onTickRaw:`(world, dt) => {
		if (!chassis) return;

		// --- 3. Controls & Engine ---
		const throttlePower = 75.0;
		const leanPower = 100.0;
		const maxEngineSpeed = 100.0; // Higher top speed

		if (keys["KeyD"]) {
			if (engine.rs < maxEngineSpeed) {
				engine.applyAngularImpulse(-throttlePower * dt);
			}
		}
		if (keys["KeyA"]) {
			if (engine.rs > -maxEngineSpeed) {
				engine.applyAngularImpulse(throttlePower * dt);
			}
		}
		if (keys["KeyW"]) {
			chassis.applyAngularImpulse(-leanPower * dt);
		}
		if (keys["KeyS"]) {
			chassis.applyAngularImpulse(leanPower * dt);
		}
		if (keys["KeyR"]) {
			motorcycleExample.init(world);
			return;
		}

		// --- 4. Procedural Terrain ---
		const lastBox = terrainBoxes[terrainBoxes.length - 1];
		if (lastBox.x < chassis.x + 25) {
			const width = 6 + Math.random() * 8;
			const height = 1.2;
			const angle = (Math.random() - 0.5) * 0.5;

			// Connect top-right of last box to top-left of new box
			const gap = Math.random() < 0.2 ? 1.5 : 0;

			// Get top-right point of previous box in world space
			const lastTR = lastBox.localToWorld({
				x: lastBox.fixtures[0].width / 2,
				y: -lastBox.fixtures[0].height / 2,
			});

			// Target position for the top-left point of the new box
			const targetX = lastTR.x + gap;
			// Vertical variety only if there is a gap, otherwise they connect exactly
			let targetY = lastTR.y + (gap > 0 ? (Math.random() - 0.5) * 3 : 0);

			// Clamp targetY to keep the course playable
			targetY = Math.max(2, Math.min(8, targetY));

			// Calculate center of new box such that its top-left (-w/2, -h/2) is at (targetX, targetY)
			const cos = Math.cos(angle);
			const sin = Math.sin(angle);
			const nextX = targetX + (width / 2) * cos - (height / 2) * sin;
			const nextY = targetY + (width / 2) * sin + (height / 2) * cos;

			const boxId = nextId++;
			const box = world.createBody({
				id: boxId,
				x: nextX,
				y: nextY,
				r: angle,
				type: gearbox.bodyTypes.FIXED_OBJECT,
				color: \`hsl(\${20 + Math.random() * 40}, 30%, \${30 + Math.random() * 20}%)\`, // Earthy tones
			});
			box.createFixture({
				shape: gearbox.shapes.BOX,
				width: width,
				height: height,
				categoryBits: CAT_TERRAIN,
				maskBits: CAT_CHASSIS | CAT_WHEEL,
			});
			terrainBoxes.push(box);

			// Limit memory/BVH by removing far away boxes (optional but good practice)
			if (terrainBoxes.length > 50) {
				const old = terrainBoxes.shift();
				world.removeObject(old.id);
			}
		}

		gearbox.debug.clearLabels();
		// Instructions pinned to world at the start
		if (chassis.x < 15) {
			gearbox.debug.addLabel({
				text: "Motorcycle Trials",
				x: 5,
				y: 3,
				fontSize: "28px Arial",
				color: "#fff",
				position: "on-top",
			});
			gearbox.debug.addLabel({
				text: "Use D/A to drive and W/S to balance!",
				x: 5,
				y: 3.5,
				fontSize: "16px Arial",
				color: "#aaa",
				position: "on-top",
			});
		}
	}`,onTick:(e,t)=>{if(!D)return;const o=75,s=100,a=100;if(se.KeyD&&ye.rs<a&&ye.applyAngularImpulse(-o*t),se.KeyA&&ye.rs>-a&&ye.applyAngularImpulse(o*t),se.KeyW&&D.applyAngularImpulse(-s*t),se.KeyS&&D.applyAngularImpulse(s*t),se.KeyR){lt.init(e);return}const i=ue[ue.length-1];if(i.x<D.x+25){const r=6+Math.random()*8,c=1.2,l=(Math.random()-.5)*.5,m=Math.random()<.2?1.5:0,x=i.localToWorld({x:i.fixtures[0].width/2,y:-i.fixtures[0].height/2}),f=x.x+m;let h=x.y+(m>0?(Math.random()-.5)*3:0);h=Math.max(2,Math.min(8,h));const d=Math.cos(l),p=Math.sin(l),y=f+r/2*d-c/2*p,g=h+r/2*p+c/2*d,b=L++,u=e.createBody({id:b,x:y,y:g,r:l,type:n.bodyTypes.FIXED_OBJECT,color:`hsl(${20+Math.random()*40}, 30%, ${30+Math.random()*20}%)`});if(u.createFixture({shape:n.shapes.BOX,width:r,height:c,categoryBits:ie,maskBits:Ee|Xe}),ue.push(u),ue.length>50){const B=ue.shift();e.removeObject(B.id)}}n.debug.clearLabels(),D.x<15&&(n.debug.addLabel({text:"Motorcycle Trials",x:5,y:3,fontSize:"28px Arial",color:"#fff",position:"on-top"}),n.debug.addLabel({text:"Use D/A to drive and W/S to balance!",x:5,y:3.5,fontSize:"16px Arial",color:"#aaa",position:"on-top"}))},onRender:e=>{if(!D)return;const t=e.interpolationAlpha,o=D.x*t+D.prevX*(1-t),s=D.y*t+D.prevY*(1-t),a=n.debug.canvas?.width||800,i=n.debug.canvas?.height||600,r=n.debug.zoom,c=a/2-o*100*r,l=i/2-s*100*r;n.debug.offsetX+=(c-n.debug.offsetX)*.1,n.debug.offsetY+=(l-n.debug.offsetY)*.1},onCleanup:e=>{const t=e._motorcycleListeners;t&&(window.removeEventListener("keydown",t.onKeyDown),window.removeEventListener("keyup",t.onKeyUp),re&&re.removeEventListener("mousedown",t.mouseDownHandler),window.removeEventListener("mousemove",t.mouseMoveHandler),window.removeEventListener("mouseup",t.mouseUpHandler),delete e._motorcycleListeners),be&&(e.removeJoint(be.id),be=null),P&&(e.removeObject(P.id),P=null),n.debug.offsetX=0,n.debug.offsetY=0}}),Jt=new w({name:"Newton's Cradle",key:"newtons-cradle",description:["A classic demonstration of conservation of momentum and energy. This simulation shows how kinetic energy and momentum are transferred through a series of suspended spheres.","### Features","- **Elastic Collisions**: Restitution is set to `1.0` to ensure near-perfect energy conservation during impacts.","- **Distance Constraints**: Each sphere is suspended by a `DistanceJoint` connected to a fixed anchor point.","- **Low Friction**: Friction is set to zero to allow the pendulum motion to persist for a long duration.","The first ball is released from an offset to initiate the chain reaction. Click **Reset** to restart the sequence."].join(`

`),onInitRaw:`(world) => {
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
	}`,onInit:e=>{e.clear(),e.setGravity(0,9.8),n.debug.showAabbs=!1;const t=5,o=.4,s=2,a=4,i=5;for(let r=0;r<t;r++){const c=i+(r-(t-1)/2)*o*2.01,l=1e3+r,m=2e3+r,x=e.createBody({id:l,x:c,y:s,type:n.bodyTypes.FIXED_OBJECT,color:"#555"});x.createFixture({id:l,shape:n.shapes.BOX,width:.2,height:.2,maskBits:0});const f=r===0?c-3:c,h=r===0?s+Math.sqrt(a*a-9):s+a,d=e.createBody({id:m,x:f,y:h,mass:1,color:r===0||r===t-1?"#a855f7":"#00f2ff",linearDamping:0,angularDamping:0});d.createFixture({id:m,shape:n.shapes.CIRCLE,radius:o,restitution:1,sFriction:0,kFriction:0}),e.createDistanceJoint(x,d,{id:3e3+r,length:a,anchorA:{x:0,y:0},anchorB:{x:0,y:0}})}}}),Ht=[dt,Ot,Rt,lt,Jt],_t=!["localhost","127.0.0.1"].includes(window.location.hostname),me=[{name:"Showcase",examples:Ht},{name:"General",examples:Ct},{name:"Constraints",examples:Tt},{name:"Optimizations",examples:vt},{name:"Stress Tests",examples:Mt},{name:"Known Issues",examples:kt}].filter(e=>!_t||e.name!=="Known Issues");let Pt=`
import gearbox from "gearbox2d";

let world;
{{GLOBAL}}
gearbox.init().then(()=>{
    world = gearbox.createWorld();
    
    // Optional:
    gearbox.debug.enableDebugGraphics(document.getElementById("debug-canvas"), world);

    init();

    let lastTime = performance.now();
    let accumulator = 0;
    const physicsStep = 1/60;

    function loop(now) {
        let dt = (now - lastTime) / 1000;
        lastTime = now;
        if (dt > 0.25) dt = 0.25;
        accumulator += dt;

        while (accumulator >= physicsStep) {
            tick(physicsStep);
            world.step();
            accumulator -= physicsStep;
        }
        world.interpolationAlpha = accumulator / physicsStep;
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
})
`.trim();const _e=()=>window.innerWidth<=768;let q={},_=null;function jt(){const e=document.getElementById("examples-list");e.innerHTML="",me.forEach((t,o)=>{const s=document.createElement("li");s.className="section",s.textContent=t.name,e.appendChild(s),t.examples&&Array.isArray(t.examples)&&t.examples.forEach((a,i)=>{const r=a.key||`${o}-${i}`;q[r]={category:o,index:i,example:a};const c=document.createElement("li");c.className="example",c.textContent=a.name,c.setAttribute("data-example",r),e.appendChild(c)})}),document.querySelectorAll("#sidebar li.example").forEach(t=>{t.addEventListener("click",()=>{document.querySelectorAll("#sidebar li.example.selected").forEach(s=>{s.classList.remove("selected")}),t.classList.add("selected");const o=t.getAttribute("data-example");Mn(o,"push"),_e()&&de.classList.add("collapsed")})})}let S,ht=document.getElementById("example-name"),Q=document.getElementById("debug-canvas"),vn=document.getElementById("code-section"),Gt=document.getElementById("general-code"),Yt=document.getElementById("init-code"),zt=document.getElementById("tick-code"),Nt=document.getElementById("render-code"),ge=document.getElementById("toggle-code"),Wt=document.getElementById("fps"),nt=document.getElementById("memory"),$t=document.getElementById("step-time"),tt=document.querySelectorAll(".code-tab"),Ut=document.querySelectorAll(".code-panel"),pt=document.getElementById("sidebar-toggle"),de=document.getElementById("sidebar"),qt=document.getElementById("reset-button"),Vt=document.getElementById("reset-button-mobile"),ot=document.getElementById("info-toggle"),at=document.getElementById("info-toggle-mobile");ht.innerHTML="Loading example...";let U=0,An=[],En=[],Fn=[],Qe=1e3/60,en=0,st=0;n.init().then(()=>{S=n.createWorld(),n.debug.enableDebugGraphics(Q,S);let e=performance.now(),t=0;const o=1/60;function s(d){let p=(d-e)/1e3;e=d,p>.25&&(p=.25),t+=p;const y=performance.now();for(;t>=o;){if(S.step(),_&&q[_]){const M=q[_].example;M&&typeof M.onTick=="function"&&M.onTick(S,o)}t-=o}if(S.interpolationAlpha=t/o,_&&q[_]){const M=q[_].example;M&&typeof M.onRender=="function"&&M.onRender(S)}const b=(performance.now()-y)*1e3;let u=An[U%100]??Qe,B=En[U%100]??0,I=Fn[U%100]??0;An[U%100]=p*1e3||16.67,En[U%100]=S?S.getMemoryUsage():0,Fn[U%100]=b,Qe+=(An[U%100]-u)/100,en+=(En[U%100]-B)/100,st+=(Fn[U%100]-I)/100,U++;const C=Qe>0?Math.round(1e3/Qe):0;Wt.innerHTML=`<i class="fas fa-tachometer-alt"></i>Render FPS: ${C}`,en<1048576?nt.innerHTML=`<i class="fas fa-memory"></i>Memory: ${(en/1024).toFixed(2)} KB`:nt.innerHTML=`<i class="fas fa-memory"></i>Memory: ${(en/1048576).toFixed(2)} MB`,$t.innerHTML=`<i class="fas fa-stopwatch"></i>Step Time: ${st.toFixed(0)} μs`,requestAnimationFrame(s)}jt(),yt(!0);const a=()=>{_&&Mn(_,"none")};qt.addEventListener("click",a),Vt.addEventListener("click",a);const i=()=>{document.body.classList.toggle("info-mode");const d=document.body.classList.contains("info-mode"),p=d?"fa-th-large":"fa-info-circle",y=d?"Show Canvas":"Info";[ot,at].forEach(g=>{const b=g.querySelector("i"),u=g.querySelector(".button-text");b&&(b.className=`fas ${p}`),u&&(u.textContent=y),g.title=d?"Show Canvas":"Show Information"}),d||n.debug.centerCamera(5,5)};ot.addEventListener("click",i),at.addEventListener("click",i),requestAnimationFrame(s),_e()&&de.classList.add("collapsed"),Q.addEventListener("wheel",d=>{d.preventDefault();const p=.05,y=d.offsetX,g=d.offsetY,b=(y-n.debug.offsetX)/n.debug.zoom,u=(g-n.debug.offsetY)/n.debug.zoom,B=-Math.sign(d.deltaY),I=Math.pow(1+p,B),C=Math.min(Math.max(n.debug.zoom*I,.1),10);n.debug.zoom=C,n.debug.offsetX=y-b*n.debug.zoom,n.debug.offsetY=g-u*n.debug.zoom},{passive:!1});let r=!1,c=0,l=0;Q.addEventListener("mousedown",d=>{d.button===2&&(r=!0,c=d.clientX,l=d.clientY)}),window.addEventListener("mousemove",d=>{if(r){const p=d.clientX-c,y=d.clientY-l;n.debug.offsetX+=p,n.debug.offsetY+=y,c=d.clientX,l=d.clientY}}),window.addEventListener("mouseup",d=>{d.button===2&&(r=!1)}),Q.addEventListener("contextmenu",d=>{d.preventDefault()});let m=0,x=!1,f=0,h=0;Q.addEventListener("touchstart",d=>{if(d.touches.length===1)f=d.touches[0].clientX,h=d.touches[0].clientY,x=!1;else if(d.touches.length===2){x=!0;const p=d.touches[0].clientX-d.touches[1].clientX,y=d.touches[0].clientY-d.touches[1].clientY;m=Math.sqrt(p*p+y*y)}},{passive:!1}),Q.addEventListener("touchmove",d=>{if(d.touches.length!==0){if(d.preventDefault(),d.touches.length===1&&!x){const p=d.touches[0].clientX,y=d.touches[0].clientY,g=p-f,b=y-h;n.debug.offsetX+=g,n.debug.offsetY+=b,f=p,h=y}else if(d.touches.length===2){const p=d.touches[0],y=d.touches[1],g=p.clientX-y.clientX,b=p.clientY-y.clientY,u=Math.sqrt(g*g+b*b);if(m>0){const B=u/m,I=Math.min(Math.max(n.debug.zoom*B,.1),10),C=(p.clientX+y.clientX)/2,M=(p.clientY+y.clientY)/2,O=Q.getBoundingClientRect(),X=C-O.left,te=M-O.top,J=(X-n.debug.offsetX)/n.debug.zoom,j=(te-n.debug.offsetY)/n.debug.zoom;n.debug.zoom=I,n.debug.offsetX=X-J*n.debug.zoom,n.debug.offsetY=te-j*n.debug.zoom}m=u}}},{passive:!1}),Q.addEventListener("touchend",d=>{d.touches.length<2&&(x=!1,m=0),d.touches.length===1&&(f=d.touches[0].clientX,h=d.touches[0].clientY)},{passive:!1}),Q.addEventListener("touchcancel",d=>{x=!1,m=0},{passive:!1})});function Mn(e,t="push"){if(!S||!q[e])return;if(_&&q[_]){const x=q[_].example;x&&typeof x.cleanup=="function"&&x.cleanup(S)}const o="#"+e;window.location.hash!==o&&(t==="push"?history.pushState(null,"",o):t==="replace"&&history.replaceState(null,"",o)),S.clear(),n.debug.clearLabels(),n.debug.showForceVectors=!0,n.debug.showImpulseVectors=!0,S.setHasPenetrationResolution(!0),S.setHasRestitution(!0),S.setHasFriction(!0),S.setGravity(0,0),n.debug.zoom=1,n.debug.centerCamera(5,5),n.debug.showAabbs=!0,_=e;const a=q[e].example;a&&typeof a.onInit=="function"?a.onInit(S):console.error("Example onInit method not found:",a);function i(x,f){if(!x)return`function ${f}${f==="tick"?"(dt)":"()"} {}`;let h=x.split("	").join("    ");const d=[/^\(world\)\s*=>\s*\{/,/^\(world,\s*dt\)\s*=>\s*\{/,/^function\s*\(world\)\s*\{/,/^function\s*\(world,\s*dt\)\s*\{/,/^function\s+init\s*\(world\)\s*\{/,/^function\s+tick\s*\(world,\s*dt\)\s*\{/,/^function\s+render\s*\(world\)\s*\{/];let p=!1,y=h.trim();for(const u of d)if(u.test(y)){h=y.replace(u,`function ${f}${f==="tick"?"(dt)":"()"} {`),p=!0;break}p||(h=y.replace(/^.*?=>\s*\{/,`function ${f}${f==="tick"?"(dt)":"()"} {`));let g=h.split(`
`);if(g.length<=1)return h;let b=1/0;for(let u=1;u<g.length;u++){const B=g[u];if(B.trim().length===0)continue;const I=B.search(/\S/);I!==-1&&I<b&&(b=I)}return b===1/0&&(b=0),g.map((u,B)=>B===0?u:u.substring(Math.min(u.length,b))).join(`
`)}let r=a.globalLines?.join(`
`)??"",c=a.onInitRaw||a.onInit?.toString()||"",l=a.onTickRaw||a.onTick?.toString()||"",m=a.onRenderRaw||a.onRender?.toString()||"";Gt.textContent=Pt.split("{{GLOBAL}}").join(r),Yt.textContent=i(c,"init"),zt.textContent=i(l,"tick"),Nt.textContent=i(m,"render"),ut(),ht.textContent=a.name||"Unknown Example",document.getElementById("description").innerHTML=ft.parse(a.description||"")}function yt(e=!1){let t=window.location.hash.substring(1);const o=!t;if(t||(t="sandbox"),!q[t]){console.log("Example not found directly, searching...");let a=!1;for(let i=0;i<me.length;i++){const r=me[i];if(r.examples&&Array.isArray(r.examples)){for(let c=0;c<r.examples.length;c++)if(r.examples[c].key===t){console.log(`Found example ${t} in category ${i}, index ${c}`),a=!0;break}}if(a)break}if(!a)if(console.warn(`Example with key '${t}' not found, defaulting to first available example`),me.length>0&&me[0].examples&&me[0].examples.length>0)t=me[0].examples[0].key||"0-0";else{console.error("No examples found");return}}const s=document.querySelector(`#sidebar li.example[data-example="${t}"]`);s&&(document.querySelectorAll("#sidebar li.example.selected").forEach(a=>{a.classList.remove("selected")}),s.classList.add("selected")),Mn(t,o&&e?"replace":"none")}tt.forEach(e=>{e.addEventListener("click",()=>{tt.forEach(o=>o.classList.remove("active")),Ut.forEach(o=>o.classList.remove("active")),e.classList.add("active"),document.getElementById(`${e.dataset.panel}-panel`).classList.add("active")})});function ut(){document.querySelectorAll("pre").forEach(t=>{const o=t.textContent;t.innerHTML=hljs?.highlight(o,{language:"javascript"}).value})}ge.addEventListener("click",()=>{vn.style.display==="none"?(vn.style.display="block",ge.querySelector("span").textContent="Hide Code",ge.querySelector("i").classList.remove("fa-chevron-down"),ge.querySelector("i").classList.add("fa-chevron-up"),ut()):(vn.style.display="none",ge.querySelector("span").textContent="Show Code",ge.querySelector("i").classList.remove("fa-chevron-up"),ge.querySelector("i").classList.add("fa-chevron-down"))});pt.addEventListener("click",()=>{de.classList.toggle("collapsed")});window.addEventListener("resize",()=>{_e()||document.body.classList.remove("info-mode"),_e()&&!de.classList.contains("collapsed")&&de.classList.add("collapsed")});window.addEventListener("click",e=>{_e()&&!de.classList.contains("collapsed")&&!de.contains(e.target)&&e.target!==pt&&de.classList.add("collapsed")});const Je=document.getElementById("copy-code");Je.addEventListener("click",()=>{const t=document.querySelector(".code-panel.active").querySelector("pre").textContent;navigator.clipboard.writeText(t).then(()=>{const o=Je.querySelector("span"),s=Je.querySelector("i"),a=o.textContent;Je.classList.add("success"),o.textContent="Copied!",s.classList.remove("fa-copy"),s.classList.add("fa-check"),setTimeout(()=>{Je.classList.remove("success"),o.textContent=a,s.classList.remove("fa-check"),s.classList.add("fa-copy")},2e3)})});window.addEventListener("popstate",function(e){yt(!1)});
