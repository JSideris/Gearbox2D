import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css                        */import{g as n}from"./engine-FBfol09p.js";import{M as ft}from"./markdown-oLTTx95D.js";class w{constructor(t){this.onInit=t.onInit,this.onInitRaw=t.onInitRaw,this.onTick=t.onTick,this.onTickRaw=t.onTickRaw,this.onRender=t.onRender,this.onRenderRaw=t.onRenderRaw,this.onCleanup=t.onCleanup,this.description=t.description,this.name=t.name,this.key=t.key,this.globalLines=t.globalLines||[]}init(t){this.onInit?.(t)}tick(t,o){this.onTick?.(t,o)}render(t){this.onRender?.(t)}cleanup(t){this.onCleanup?.(t)}}let O=1,fn=0,te=null,nn=null,fe=null;const it=(e,t)=>({x:(e-n.debug.offsetX)/(n.debug.zoom*100),y:(t-n.debug.offsetY)/(n.debug.zoom*100)}),It=(e,t)=>{if(e.button!==0)return;const o=fe.getBoundingClientRect(),i=it(e.clientX-o.left,e.clientY-o.top),a=t.queryBodiesAtPoint(i.x,i.y);if(a.length>0){const s=a[0],r=t.getBodyById(s);r&&r.type!==n.bodyTypes.FIXED_OBJECT&&(te=t.createBody({id:999999,x:i.x,y:i.y,type:n.bodyTypes.FIXED_OBJECT,color:"transparent"}),te.createFixture({id:999999,shape:n.shapes.CIRCLE,radius:.05,maskBits:0}),nn=t.createSpringJoint(te,r,{id:999998,worldAnchor:i,frequencyHz:3,dampingRatio:1,length:0}))}},Bt=e=>{if(te){const t=fe.getBoundingClientRect(),o=it(e.clientX-t.left,e.clientY-t.top);te.x=o.x,te.y=o.y}},wt=(e,t)=>{nn&&(t.removeJoint(nn.id),nn=null),te&&(t.removeObject(te.id),te=null)},Ct=[new w({name:"Interactive Sandbox",key:"sandbox",description:["Welcome to **Gearbox2D**! This is an interactive playground featuring various shapes and physics properties. Click and drag objects to interact with them.","### Features","- **Point Query**: The engine detects which object is under the mouse using **BVH** and precise shape tests.","- **Mouse Joint**: Uses a `SpringJoint` to pull objects toward the mouse cursor.","- **Capsules**: New capsule shapes are supported with proper collision and mass properties.","- **Multi-Fixture Bodies**: Some objects are composed of multiple shapes (circles and boxes) attached to a single body.","- **Jointed Compounds**: Some objects are connected by **Hinge**, **Distance**, and **Spring** joints to create complex assemblies.","- **Collision Filtering**: The mouse 'anchor' object is a sensor that doesn't collide with other objects."].join(`

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
		}`,onInit:e=>{e.clear(),n.debug.showAabbs=!1,n.debug.showForceVectors=!1,O=1,e.setGravity(0,9.8),e.setHasRestitution(!0),e.setHasFriction(!0);const t=1,o=9.2,a=9+t*2,s=o+t*2;e.createBody({id:O++,x:5,y:9+t/2,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.AABB,width:s,height:t}),e.createBody({id:O++,x:5,y:0-t/2,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.AABB,width:s,height:t}),e.createBody({id:O++,x:5-o/2-t/2,y:4.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.AABB,width:t,height:a}),e.createBody({id:O++,x:5+o/2+t/2,y:4.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.AABB,width:t,height:a});const r=["#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff","#ff8844","#88ff44","#4488ff"],l=8,c=4,m=1,x=1,f=5-(l-1)*m/2,h=1.8;for(let p=0;p<c;p++)for(let u=0;u<l;u++){const g=f+u*m+(Math.random()-.5)*.2,b=h+p*x+(Math.random()-.5)*.2,y=r[(p*l+u)%r.length],B={x:g,y:b,mass:.5+Math.random()*1.5,color:y,linearDamping:.5,angularDamping:1.5},I=Math.random();if(I<.25)e.createBody({id:O++,...B,r:Math.random()*Math.PI}).createFixture({shape:n.shapes.CIRCLE,radius:.1+Math.random()*.3});else if(I<.5)e.createBody({id:O++,...B,r:Math.random()*Math.PI}).createFixture({shape:n.shapes.BOX,width:.2+Math.random()*.6,height:.2+Math.random()*.6});else if(I<.75){const C=.1+Math.random()*.1;e.createBody({id:O++,...B,r:Math.random()*Math.PI}).createFixture({shape:n.shapes.CAPSULE,radius:C,height:C*2+.2+Math.random()*.4})}else{const C=Math.random();let k;if(C<.4){const R=3+Math.floor(Math.random()*5);k=n.polygon.makeRegularPolygon(R,.2+Math.random()*.2)}else if(C<.8){const R=5+Math.floor(Math.random()*3),X=.3+Math.random()*.2;k=n.polygon.makeStar(R,X,X*.5)}else k=[{x:0,y:-.4},{x:.35,y:-.15},{x:.2,y:.3},{x:-.2,y:.3},{x:-.35,y:-.15}];e.createBody({id:O++,...B,r:Math.random()*Math.PI}).createFixture({shape:n.shapes.POLYGON,vertices:k})}}for(let p=0;p<6;p++){const u=1.5+Math.random()*7,g=5.5+Math.random()*1.5,b=r[Math.floor(Math.random()*r.length)],y=e.createBody({id:O++,x:u,y:g,mass:1+Math.random()*3,color:b,linearDamping:.5,angularDamping:1}),B=2+Math.floor(Math.random()*4);for(let I=0;I<B;I++){const C=Math.random(),k=(Math.random()-.5)*1.2,R=(Math.random()-.5)*1.2;C<.4?y.createFixture({shape:n.shapes.CIRCLE,radius:.1+Math.random()*.25,localX:k,localY:R}):y.createFixture({shape:n.shapes.BOX,width:.2+Math.random()*.5,height:.2+Math.random()*.5,localX:k,localY:R,localR:Math.random()*Math.PI})}}const d=["hinge","distance","spring"];for(let p=0;p<8;p++){const u=1.5+Math.random()*6,g=7.5+Math.random()*1,b=d[Math.floor(Math.random()*d.length)],y=r[Math.floor(Math.random()*r.length)],B=e.createBody({id:O++,x:u,y:g,mass:.5+Math.random(),color:y,linearDamping:.5,angularDamping:.5});Math.random()<.5?B.createFixture({shape:n.shapes.CIRCLE,radius:.15+Math.random()*.2}):B.createFixture({shape:n.shapes.BOX,width:.3+Math.random()*.4,height:.3+Math.random()*.4});const C=e.createBody({id:O++,x:u+.5+Math.random()*.5,y:g+(Math.random()-.5)*.5,mass:.5+Math.random(),color:y,linearDamping:.5,angularDamping:.5});Math.random()<.5?C.createFixture({shape:n.shapes.CIRCLE,radius:.15+Math.random()*.2}):C.createFixture({shape:n.shapes.BOX,width:.3+Math.random()*.4,height:.3+Math.random()*.4}),b==="hinge"?e.createHingeJoint(B,C,{id:O++,worldAnchor:{x:(B.x+C.x)/2,y:(B.y+C.y)/2}}):b==="distance"?e.createDistanceJoint(B,C,{id:O++,anchorA:{x:0,y:0},anchorB:{x:0,y:0}}):e.createSpringJoint(B,C,{id:O++,anchorA:{x:0,y:0},anchorB:{x:0,y:0},frequencyHz:2+Math.random()*4,dampingRatio:.5+Math.random()*.5})}fe=document.getElementById("debug-canvas"),e._mouseDownHandler&&fe.removeEventListener("mousedown",e._mouseDownHandler),e._mouseMoveHandler&&window.removeEventListener("mousemove",e._mouseMoveHandler),e._mouseUpHandler&&window.removeEventListener("mouseup",e._mouseUpHandler),e._mouseDownHandler=p=>It(p,e),e._mouseMoveHandler=p=>Bt(p),e._mouseUpHandler=p=>wt(p,e),fe.addEventListener("mousedown",e._mouseDownHandler),window.addEventListener("mousemove",e._mouseMoveHandler),window.addEventListener("mouseup",e._mouseUpHandler)},onCleanup:e=>{fe&&(fe.removeEventListener("mousedown",e._mouseDownHandler),window.removeEventListener("mousemove",e._mouseMoveHandler),window.removeEventListener("mouseup",e._mouseUpHandler),delete e._mouseDownHandler,delete e._mouseMoveHandler,delete e._mouseUpHandler)},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{let o=e.bodiesById[1],i=e.bodiesById[2],a=i.x-o.x,s=i.y-o.y,r=Math.sqrt(a*a+s*s);a/=r,s/=r;const l=2;o.applyForce(a*l,s*l)}}),new w({name:"Impulse",key:"impulse",description:["**Impulses** are used to apply a sudden change in momentum to an object. It's similar to a force, but modifies the object's velocity **instantaneously**, rather than acting as a persistent push.","In this example we demonstrate both **Linear** and **Angular** impulses.","- The two circles receive vertical linear impulses.","- The box receives periodic angular impulses (torque) causing it to spin without moving its center."].join(`

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
		}`,onTick:(e,t)=>{let o=e.bodiesById[1],i=e.bodiesById[2],a=e.bodiesById[3],s=fn;fn+=t*5;let r=Math.floor(s),l=Math.floor(fn);if(r!=l){if(l%2==0){let c=(5-o.y)*.2;c<.05&&c>-.05&&(c=2),o.applyImpulse(0,c),i.applyImpulse(0,c)}l%3==0&&a.applyAngularImpulse(2)}}}),new w({name:"Bounce",key:"bounce",description:["This example demonstrates **Restitution** (bounciness).","The central ball is configured with `restitution: 1.0`, meaning it loses no energy during collisions with the fixed walls, creating a perfectly elastic bounce.","Gearbox2D handles restitution differently than many other engines to prevent numerical energy gain. Check out the documentation to learn more about **Kinematic Restitution Balancing**."].join(`

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
		}`,onTick:(e,t)=>{if(Math.random()<.08){let o=.1+Math.random()*.4,i=1;Math.random()<.5&&(i=-1);let a=.2+o*o*.8,s=.1+Math.random()*(a-.1),r=a*a/s,l=Math.random(),c,m=o;if(l<.1)c=n.shapes.POINT,m=.01;else if(l<.2)c=n.shapes.AABB;else if(l<.45)c=n.shapes.BOX;else if(l<.7){c=n.shapes.CAPSULE;let d=s*.5;a=d,s=Math.max(d*2+.1,r)}else l<.85?c=n.shapes.POLYGON:c=n.shapes.CIRCLE;const x=O++,f=e.createBody({id:x,x:5-i*5,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*i,vy:-8-Math.random()*2,type:n.bodyTypes.DYNAMIC_OBJECT,mass:m,linearDamping:0});if(c===n.shapes.POLYGON){const d=Math.random();let p;const u=.2+Math.random()*.3;if(d<.6){const g=3+Math.floor(Math.random()*5);p=n.polygon.makeRegularPolygon(g,u)}else{const g=5+Math.floor(Math.random()*3);p=n.polygon.makeStar(g,u,u*.5)}f.createFixture({shape:c,vertices:p})}else f.createFixture({shape:c,radius:c===n.shapes.BOX||c===n.shapes.AABB?r:a,height:c===n.shapes.BOX||c===n.shapes.AABB||c===n.shapes.CAPSULE?s:0});e.getBodyCount();let h=[];e.iterateBodies(d=>{d.y>10.5&&h.push(d)});for(let d of h)e.removeObject(d.id)}}}),new w({name:"Friction",key:"friction",description:["**Friction** is applied as the last step of collision resolution. It handles both **static** and **dynamic** friction, applied as impulses at the point of contact.","Take note of the blue impulse vectors on the platforms which are present when dynamic friction is being applied.","### Scenarios","1. **Reverse Roll**: A circle spinning counter-clockwise transfers its angular momentum to linear momentum upon contact.","2. **Forward Roll**: A spinning circle with no linear momentum begins rolling forward due to friction.","3. **Slide**: A box slides across the platform and grinds to a halt.","4. **Static vs Kinetic**: Two boxes slide down a ramp. The left box has high static friction and stops; the right has no static friction and keeps sliding."].join(`

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
		}`,onInit:e=>{e.setGravity(0,10);let t=1;const o=["Linear to angular momentum transfer.","Angular to linear momentum transfer.","Slide to halt."];for(;t<=3;t++)e.createBody({id:t,x:4.5,y:2.5*t-.5,type:n.bodyTypes.FIXED_OBJECT,mass:1}).createFixture({shape:n.shapes.AABB,width:9,height:1}),n.debug.addLabel({text:o[t-1],x:4.5,y:2.5*t-1.2,fontSize:"20px Arial",color:"#00f2ff",position:"above"});const i=t++;e.createBody({id:i,x:4.5,y:9.7,r:.1,type:n.bodyTypes.FIXED_OBJECT,mass:1}).createFixture({shape:n.shapes.BOX,width:9,height:1}),n.debug.addLabel({text:"High static vs no static friction.",x:4.5,y:9,fontSize:"20px Arial",color:"#00f2ff",position:"above"});const a=t++;e.createBody({id:a,x:0,y:1,vx:5,rs:-8,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5}).createFixture({shape:n.shapes.CIRCLE,radius:.5,kFriction:.8,sFriction:.5}),n.debug.addLabel({text:"Reverse",objectId:a,position:"above",fontSize:"10px Arial"});const s=t++;e.createBody({id:s,x:.5,y:3.5,rs:15,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5}).createFixture({shape:n.shapes.CIRCLE,radius:.5,kFriction:.2,sFriction:.5}),n.debug.addLabel({text:"Forward",objectId:s,position:"above",fontSize:"10px Arial"});const r=t++;e.createBody({id:r,x:.5,y:6,vx:7,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5}).createFixture({shape:n.shapes.BOX,width:1,height:1,kFriction:.27,sFriction:.5}),n.debug.addLabel({text:"Slide",objectId:r,position:"above",fontSize:"10px Arial"});const l=t++;e.createBody({id:l,x:.5,y:8,vx:.5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5}).createFixture({shape:n.shapes.BOX,width:1,height:.5,kFriction:.7,sFriction:.7}),n.debug.addLabel({text:"Static",objectId:l,position:"above",fontSize:"10px Arial"});const c=t++;e.createBody({id:c,x:1.6,y:8,vx:.5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5}).createFixture({shape:n.shapes.BOX,width:1,height:.5,kFriction:.01,sFriction:0}),n.debug.addLabel({text:"Kinetic",objectId:c,position:"above",fontSize:"10px Arial"})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"Collision Masks",key:"collision-masks",description:["**Collision masks** allow you to selectively enable or disable collisions between different groups of objects using bitwise logic.","In this example:","- **Blue objects**: Only collide with blue platforms and other blue objects.","- **Red objects**: Only collide with red platforms and other red objects.","- **Green objects**: Collide with **everything**.","This is implemented using `categoryBits` and `maskBits` properties."].join(`

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
		}`,onInit:e=>{e.setGravity(0,10),n.debug.showForceVectors=!1;const t=O++;e.createBody({id:t,x:2.5,y:8,type:n.bodyTypes.FIXED_OBJECT,color:"#00f2ff"}).createFixture({width:4,height:.5,shape:n.shapes.AABB,categoryBits:1,maskBits:5}),n.debug.addLabel({text:"Collides with Blue & Green",objectId:t,color:"#00f2ff",position:"below"});const o=O++;e.createBody({id:o,x:7.5,y:8,type:n.bodyTypes.FIXED_OBJECT,color:"#ff4444"}).createFixture({width:4,height:.5,shape:n.shapes.AABB,categoryBits:2,maskBits:6}),n.debug.addLabel({text:"Collides with Red & Green",objectId:o,color:"#ff4444",position:"below"});const i=O++;e.createBody({id:i,x:5,y:4,type:n.bodyTypes.FIXED_OBJECT,color:"#44ff44"}).createFixture({width:2,height:.5,shape:n.shapes.AABB,categoryBits:4,maskBits:7}),n.debug.addLabel({text:"Collides with All",objectId:i,color:"#44ff44",position:"below"})},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{if(Math.random()<.05){const i=O++,a=Math.floor(Math.random()*3);let s,r,l;a===0?(s="#00f2ff",r=1,l=5):a===1?(s="#ff4444",r=2,l=6):(s="#44ff44",r=4,l=7),e.createBody({id:i,x:2+Math.random()*6,y:0,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1,color:s}).createFixture({radius:.3,shape:n.shapes.CIRCLE,categoryBits:r,maskBits:l}),n.debug.addLabel({text:`Cat:0x${r.toString(16)} Mask:0x${l.toString(16)}`,objectId:i,color:s,position:"above",fontSize:"10px Arial"})}let o=[];e.iterateBodies(i=>{i.y>11&&o.push(i)});for(let i of o)e.removeObject(i.id)}}),new w({name:"Object Types",key:"object-types",description:["This example showcases the four fundamental object types in **Gearbox2D** and how they interact:","1. **Fixed Objects** (Gray): Immovable platforms with infinite mass. They form the static environment.","2. **Kinematic Objects** (Purple): Move via velocity but are unaffected by forces. They can 'push' other objects but are never pushed back.","3. **Rigid Bodies** (Colorful): Fully dynamic objects affected by gravity, forces, and collisions.","4. **Sensors** (Green Zone): Detect overlaps without causing a physical response. Here, a sensor acts as a **Recycling Zone** to remove objects."].join(`

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
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),n.debug.showForceVectors=!1,n.debug.showAabbs=!1,O=1,e.createBody({id:O++,x:5,y:9.7,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.BOX,width:8,height:.6}),e.createBody({id:O++,x:1,y:7,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({width:.2,height:6,shape:n.shapes.BOX}),e.createBody({id:O++,x:9,y:7,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({width:.2,height:6,shape:n.shapes.BOX});const t=e.createBody({id:O++,x:5,y:4,type:n.bodyTypes.KINEMATIC_OBJECT,color:"#a0f",rs:1.5});t.createFixture({width:3.5,height:.3,shape:n.shapes.BOX}),n.debug.addLabel({text:"Kinematic Rotor",objectId:t.id,position:"above",color:"#a0f"});const o=e.createBody({id:O++,x:2.5,y:7,type:n.bodyTypes.KINEMATIC_OBJECT,color:"#a0f",vx:1});o.createFixture({width:1.5,height:.3,shape:n.shapes.BOX}),e.elevator=o,n.debug.addLabel({text:"Kinematic Elevator",objectId:o.id,position:"above",color:"#a0f"});const i=O++,a=e.createBody({id:i,x:5,y:8.8,type:n.bodyTypes.FIXED_OBJECT,color:"rgba(0, 255, 100, 0.15)",wantsEvents:!0});a.createFixture({width:4,height:1.2,shape:n.shapes.BOX,isSensor:!0}),n.debug.addLabel({text:"Sensor Recycler",objectId:a.id,position:"on-top",color:"#4f4"}),e.recyclerId=a.id,e.toRemove=new Set,e.onCollisionStart=(s,r)=>{const l=e.recyclerId,c=s===l?r:r===l?s:null;if(c!==null){const m=e.getBodyById(c);m&&m.type===n.bodyTypes.DYNAMIC_OBJECT&&(e.toRemove.add(c),m.color="#4f4")}}},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{const o=e.elevator;if(o&&(o.x>7.5&&(o.vx=-1.5),o.x<2.5&&(o.vx=1.5)),e.stepCount%20===0){const s=["#ff4444","#4444ff","#ffff44","#ff44ff","#44ffff"],r=Math.random(),l=3+Math.random()*4,c=O++,m=e.createBody({id:c,x:l,y:.5,mass:.5+Math.random()*1,type:n.bodyTypes.DYNAMIC_OBJECT,color:s[Math.floor(Math.random()*s.length)]});r<.33?m.createFixture({shape:n.shapes.CIRCLE,radius:.25,restitution:.3}):r<.66?m.createFixture({shape:n.shapes.BOX,width:.5,height:.5,restitution:.3}):m.createFixture({shape:n.shapes.CAPSULE,radius:.15,height:.6,restitution:.3})}const i=e.toRemove;if(i&&i.size>0){for(const s of i)e.getBodyById(s)&&e.removeObject(s);i.clear()}let a=[];e.iterateBodies(s=>{(s.y>11||s.y<-5||s.x>11||s.x<-1)&&s.type===n.bodyTypes.DYNAMIC_OBJECT&&a.push(s.id)});for(const s of a)e.removeObject(s)},onCleanup:e=>{e.onCollisionStart=void 0,delete e.elevator,delete e.recyclerId,delete e.toRemove}})];let T=1,ue=[],Ce=null,$=null,Re=null,Q=null,U=null,Le=0,De=0;const Tt=[new w({name:"Simple Hinge",key:"simple-hinge",description:["A single `BOX` object attached to a `FIXED_OBJECT` by a **Hinge Joint** constraint.","The hinge allows rotation around a single point while preventing all linear relative motion. In this case, it creates a simple gravity-driven pendulum."].join(`

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
		}`,onInit:e=>{T=1;const t=T++,o=e.createBody({id:t,x:5,y:3,type:n.bodyTypes.FIXED_OBJECT,color:"#ff4444"});o.createFixture({shape:n.shapes.BOX,width:1,height:1});const i=T++,a=e.createBody({id:i,x:8,y:3,mass:.1,color:"#44ff44"});a.createFixture({shape:n.shapes.BOX,width:4,height:.5}),e.createHingeJoint(o,a,{id:T++,worldAnchor:{x:5,y:3}}),e.setGravity(0,9.81)}}),new w({name:"Breakable Joint",key:"breakable-joint",description:["This demo showcases **Joint Reaction Forces** and dynamic joint removal.","1. A ball is suspended by a **Hinge Joint**. Its mass increases until the reaction force exceeds a threshold, snapping the joint.","2. The ball falls onto a bridge made of `DistanceJoint` segments, which also have breaking thresholds.","You can visualize the stress on the joints by enabling **Force Vectors** in the debug settings."].join(`

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
		}`,onInit:e=>{T=1,n.debug.showAabbs=!1,n.debug.showForceVectors=!0,e.setGravity(0,10),ue=[],Ce=null,$=null;const t=T++,o=e.createBody({id:t,x:5,y:1,type:n.bodyTypes.FIXED_OBJECT,color:"#ff4444"});o.createFixture({shape:n.shapes.CIRCLE,radius:.2});const i=T++;$=e.createBody({id:i,x:5,y:2.3,mass:.05,color:"#888888"}),$.createFixture({id:i,shape:n.shapes.CIRCLE,radius:.6}),Ce=e.createHingeJoint(o,$,{id:T++,worldAnchor:{x:5,y:1}});const a=2,s=8,r=6,l=12,c=(s-a)/l,m=.2,x=T++,f=e.createBody({id:x,x:a-c/2,y:r,type:n.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"});f.createFixture({shape:n.shapes.BOX,width:c,height:.5});const h=T++,d=e.createBody({id:h,x:s+c/2,y:r,type:n.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"});d.createFixture({shape:n.shapes.BOX,width:c,height:.5});let p=f;for(let g=0;g<l;g++){const b=T++,y=e.createBody({id:b,x:a+g*c+c/2,y:r,mass:.2,color:"#cd853f"});y.createFixture({shape:n.shapes.BOX,width:c*.9,height:m,categoryBits:4,maskBits:-5});const B=e.createDistanceJoint(p,y,{id:T++,worldAnchor:{x:a+g*c,y:r}});ue.push(B),p=y}const u=e.createDistanceJoint(p,d,{id:T++,worldAnchor:{x:s,y:r}});ue.push(u),$.applyImpulse(.2,0)},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{if($&&($.mass+=t*3,n.debug.removeObjectLabels($.id),n.debug.addLabel({text:`Mass: ${$.mass.toFixed(2)}kg`,objectId:$.id,position:"above",color:"#fff"})),Ce){const o=Ce.reactionForce;Math.sqrt(o.x*o.x+o.y*o.y)>150&&(e.removeJoint(Ce.id),Ce=null)}if(ue.length>0)for(let o=ue.length-1;o>=0;o--){const i=ue[o],a=i.reactionForce;Math.sqrt(a.x*a.x+a.y*a.y)>600&&(e.removeJoint(i.id),ue.splice(o,1))}}}),new w({name:"Gear Train",key:"gear-train",description:["A sequence of gears connected using the `GearJoint` constraint.","Each gear's motion is constrained by the previous one based on a **gear ratio** (calculated here by the relative radii).","A drive gear at the start receives a constant low torque, which is then propagated through the entire train with mechanical advantage."].join(`

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
		}`,onInit:e=>{T=1;const t=2,o=5,i=5,a=1.5,s=T++,r=e.createBody({id:s,x:5,y:5,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});r.createFixture({shape:n.shapes.AABB,width:6.2,height:.2,maskBits:0});let l=null;Re=null;for(let c=0;c<i;c++){const m=c%2===0?1:.5,x=T++,f=e.createBody({id:x,x:t+c*a,y:o,mass:m,color:`hsl(${c*60}, 70%, 60%)`});f.createFixture({shape:n.shapes.CIRCLE,radius:m});const h=e.createHingeJoint(r,f,{id:T++,worldAnchor:{x:t+c*a,y:o}});if(c===0)Re=f;else{const p=((c-1)%2===0?1:.5)/m;e.createGearJoint(l,h,{id:T++,ratio:p})}l=h}},onTickRaw:`(world, dt) => {
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
		}`,onInit:e=>{n.debug.showAabbs=!1,n.debug.showForceVectors=!1,T=1;const t=5,o=5,i=4,a=T++,s=e.createBody({id:a,x:t,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#ff4444"});s.createFixture({shape:n.shapes.CIRCLE,radius:.5});const r=T++;Q=e.createBody({id:r,x:t,y:o,mass:100,color:"rgba(255, 255, 255, 0.05)",angularDamping:.5}),Q.createFixture({id:r,shape:n.shapes.CIRCLE,radius:i,maskBits:0}),e.createHingeJoint(s,Q,{id:T++,worldAnchor:{x:t,y:o}});const l=8,c=3.8,m=.8,x=()=>({x:(Math.random()-.5)*.3,y:(Math.random()-.5)*.3});for(let f=0;f<l;f++){const h=f/l*Math.PI*2,d=t+Math.cos(h)*c,p=o+Math.sin(h)*c,u=d-Math.cos(h)*.5,g=p-Math.sin(h)*.5,b=T++,y=e.createBody({id:b,x:u,y:g,mass:.5,color:`hsl(${f*360/l}, 70%, 60%)`});y.createFixture({shape:f%2===0?n.shapes.BOX:n.shapes.CIRCLE,width:.5,height:.5,radius:.25});const B=Q.worldToLocal({x:d,y:p});e.createDistanceJoint(Q,y,{id:T++,anchorA:B,anchorB:x(),length:m});const I=u-Math.cos(h)*m,C=g-Math.sin(h)*m,k=T++,R=e.createBody({id:k,x:I,y:C,mass:.5,color:`hsl(${f*360/l}, 70%, 50%)`});R.createFixture({shape:(f+1)%2===0?n.shapes.BOX:n.shapes.CIRCLE,width:.5,height:.5,radius:.25}),e.createDistanceJoint(y,R,{id:T++,anchorA:x(),anchorB:x(),length:m});const X=I-Math.cos(h)*m,ae=C-Math.sin(h)*m,_=T++,Y=e.createBody({id:_,x:X,y:ae,mass:.5,color:`hsl(${f*360/l}, 70%, 40%)`});Y.createFixture({shape:(f+2)%2===0?n.shapes.BOX:n.shapes.CIRCLE,width:.5,height:.5,radius:.25}),e.createDistanceJoint(R,Y,{id:T++,anchorA:x(),anchorB:x(),length:m})}e.setGravity(0,9.81),Q.rs=.2},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{if(Q){const o=Date.now()/1e3,i=o%12;let a=0,s=2;i<4?(a=1.2,s=4):i<6?(a=0,s=1):i<10?(a=Math.sin(o*4)*2,s=8):a=0;const r=a-Q.rs;Math.abs(r)>.05&&Q.applyAngularImpulse(r*s)}}}),new w({name:"Spring Belt",key:"spring-belt",description:["A chain of shapes connected by `SpringJoint` constraints, forming a belt around a rotating high-friction pulley.","The `SpringJoint` acts like a dampened harmonic oscillator, pulling objects together with a force proportional to their distance and frequency. The belt stretches and contracts as it interacts with the central rotor."].join(`

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
		}`,onInit:e=>{n.debug.showAabbs=!1,n.debug.showForceVectors=!1,T=1;const t=5,o=3,i=2.5,a=3.5,s=T++,r=e.createBody({id:s,x:t,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#666666"});r.createFixture({shape:n.shapes.CIRCLE,radius:.1,maskBits:0});const l=T++;U=e.createBody({id:l,x:t,y:o,rs:2.5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:10,color:"#888888",angularDamping:.1}),U.createFixture({id:l,shape:n.shapes.CIRCLE,radius:i,sFriction:1,kFriction:1}),e.createHingeJoint(r,U,{id:T++,worldAnchor:{x:t,y:o}});const c=16,m=[];for(let x=0;x<c;x++){const f=x/c*Math.PI*2,h=t+Math.cos(f)*a,d=o+Math.sin(f)*a,p=T++,u=e.createBody({id:p,x:h,y:d,mass:.1,color:`hsl(${x*360/c}, 70%, 60%)`});let g;x%3===0?g=n.shapes.BOX:x%3===1?g=n.shapes.CIRCLE:g=n.shapes.CAPSULE,u.createFixture({shape:g,width:.6,height:g===n.shapes.CAPSULE?1:.6,radius:.3,sFriction:.999,kFriction:.99}),m.push(u)}for(let x=0;x<c;x++){const f=m[x],h=m[(x+1)%c],d=h.x-f.x,p=h.y-f.y,u=Math.sqrt(d*d+p*p);e.createSpringJoint(f,h,{id:T++,length:u*1.1,frequencyHz:5,dampingRatio:.2})}e.setGravity(0,9.81)},onTickRaw:`(world, dt) => {
			if (rotator) {
				// Apply a persistent angular impulse until we reach target speed
				if (Math.abs(rotator.rs) < 2.5) {
					rotator.applyAngularImpulse(1.0);
				}
			}
		}`,onTick:(e,t)=>{U&&Math.abs(U.rs)<2.5&&U.applyAngularImpulse(1)}}),new w({name:"Soft Body Ball",key:"soft-body",description:["A collection of `CIRCLE` objects connected by a network of `SpringJoint` constraints to form a squishy, deformable ball.","The ball features a central core (axel) connected to an outer ring of nodes. This setup simulates **Soft Body Dynamics** using a mass-spring system.","Persistent random impulses are applied to the core to keep the ball moving and demonstrate its elasticity."].join(`

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
		}`,onInit:e=>{n.debug.showAabbs=!1,n.debug.showForceVectors=!1,T=1;const t=5,o=3,i=2,a=12,s=[],r=.2,l=T++,c=e.createBody({id:l,x:t,y:o,mass:2,color:"#ff8888"});c.createFixture({shape:n.shapes.CIRCLE,radius:r,sFriction:.9,kFriction:.9}),U=c,Le=0,De=-30;for(let h=0;h<a;h++){const d=h/a*Math.PI*2,p=t+Math.cos(d)*i,u=o+Math.sin(d)*i,g=T++,b=e.createBody({id:g,x:p,y:u,mass:.5,color:"#8888ff"});b.createFixture({shape:n.shapes.CIRCLE,radius:.2,sFriction:.9,kFriction:.9}),s.push(b),e.createSpringJoint(c,b,{id:T++,anchorA:{x:Math.cos(d)*r,y:Math.sin(d)*r},length:i-r,frequencyHz:4,dampingRatio:.5}),h>0&&e.createSpringJoint(s[h-1],b,{id:T++,length:2*i*Math.sin(Math.PI/a),frequencyHz:4,dampingRatio:.5})}e.createSpringJoint(s[a-1],s[0],{id:T++,length:2*i*Math.sin(Math.PI/a),frequencyHz:4,dampingRatio:.5});const m=T++;e.createBody({id:m,x:5,y:10,type:n.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}).createFixture({shape:n.shapes.BOX,width:15,height:2,sFriction:.9,kFriction:.9});const x=T++;e.createBody({id:x,x:-3.5,y:4.25,type:n.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}).createFixture({shape:n.shapes.BOX,width:2,height:10});const f=T++;e.createBody({id:f,x:13.5,y:4.25,type:n.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}).createFixture({shape:n.shapes.BOX,width:2,height:10}),e.setGravity(0,9.81)},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{U&&(De<=0&&(Math.random()<.02?(Le=(Math.random()-.5)*3,De=40+Math.random()*80):Le=0),De>0&&(U.applyAngularImpulse(Le),U.applyImpulse(Le*.1,0),De--))}})];let In=0,Se=1;const At=[new w({name:"Sleep and Islands",key:"sleep-and-islands",description:["**Sleep** optimization in **Gearbox2D** uses a movement-based heuristic computed during the kinematics step.","Instead of rebuilding a complex global island data structure each tick, each object tracks its own local contacts. When an object wakes up (due to a force or collision), it automatically wakes its neighbors.","This provides the performance benefits of **Islands** with significantly lower overhead."].join(`

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
		}`,onInit:e=>{e.createBody({id:1,x:10,y:10,vx:-5,vy:-5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:n.shapes.CIRCLE,radius:1,restitution:0}),e.createBody({id:2,x:0,y:0,vx:5,vy:5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:n.shapes.CIRCLE,radius:1,restitution:0})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}})];let F=1,oe=null,tn=null,Fe=null,Bn=2,wn=40;const rt=(e,t)=>({x:(e-n.debug.offsetX)/(n.debug.zoom*100),y:(t-n.debug.offsetY)/(n.debug.zoom*100)}),Et=(e,t)=>{if(e.button!==0)return;const o=Fe.getBoundingClientRect(),i=rt(e.clientX-o.left,e.clientY-o.top),a=t.queryBodiesAtPoint(i.x,i.y);if(a.length>0){const s=a[0],r=t.getBodyById(s);r&&r.type!==n.bodyTypes.FIXED_OBJECT&&(oe=t.createBody({id:999999,x:i.x,y:i.y,type:n.bodyTypes.FIXED_OBJECT,color:"transparent"}),oe.createFixture({id:999999,shape:n.shapes.CIRCLE,radius:.05,maskBits:0}),tn=t.createSpringJoint(oe,r,{id:999998,worldAnchor:i,frequencyHz:3,dampingRatio:1,length:0}))}},vt=e=>{if(oe){const t=Fe.getBoundingClientRect(),o=rt(e.clientX-t.left,e.clientY-t.top);oe.x=o.x,oe.y=o.y}},Ft=(e,t)=>{tn&&(t.removeJoint(tn.id),tn=null),oe&&(t.removeObject(oe.id),oe=null)},Kn=e=>{Fe=document.getElementById("debug-canvas"),e._mouseDownHandler=t=>Et(t,e),e._mouseMoveHandler=t=>vt(t),e._mouseUpHandler=t=>Ft(t,e),Fe.addEventListener("mousedown",e._mouseDownHandler),window.addEventListener("mousemove",e._mouseMoveHandler),window.addEventListener("mouseup",e._mouseUpHandler)},Zn=e=>{Fe&&(Fe.removeEventListener("mousedown",e._mouseDownHandler),window.removeEventListener("mousemove",e._mouseMoveHandler),window.removeEventListener("mouseup",e._mouseUpHandler),delete e._mouseDownHandler,delete e._mouseMoveHandler,delete e._mouseUpHandler)},Mt=[new w({name:"2000 Colliding Circles",key:"particles",description:["A **Stress Test** featuring 2,000 `CIRCLE` objects with full collision resolution.","This demo helps visualize the performance of the **BVH (Bounding Volume Hierarchy)** and the narrow-phase collision solver.","**Note**: In many environments, the primary bottleneck will be the Canvas 2D rendering rather than the physics simulation."].join(`

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
		}`,onInit:e=>{e._frameCounter=0,e.clear();let t=1,o=2,i=11;e.createBody({id:t++,x:5,y:0,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:i,height:o,restitution:.99}),e.createBody({id:t++,x:5,y:10,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:i,height:o,restitution:.99}),e.createBody({id:t++,x:0,y:5,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:o,height:i,restitution:.99}),e.createBody({id:t++,x:10,y:5,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:o,height:i,restitution:.99});for(let a=0;a<2e3;a++){const s=t++;e.createBody({id:s,x:Math.random()*8+1,y:Math.random()*8+1,vx:Math.random()*1-.5,vy:Math.random()*1-.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*20,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5,linearDamping:0,angularDamping:.5}).createFixture({shape:n.shapes.CIRCLE,radius:.05,restitution:.5})}},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"2000 Bouncy Points",key:"fleas",description:["A stress test with 2,000 bouncy `POINT` objects.","Point objects have zero radius and don't collide with each other, but they do collide with other shapes (like the `AABB` walls in this demo). This allows for extremely high-density simulations."].join(`

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
		}`,onInit:e=>{e.clear();const t=2e3;e.setGravity(0,10);let o=1,i=2,a=11;e.createBody({id:o++,x:5,y:0,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:a,height:i,restitution:1,sFriction:0,kFriction:0}),e.createBody({id:o++,x:5,y:10,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:a,height:i,restitution:1,sFriction:0,kFriction:0}),e.createBody({id:o++,x:0,y:5,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:i,height:a,restitution:1,sFriction:0,kFriction:0}),e.createBody({id:o++,x:10,y:5,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.AABB,width:i,height:a,restitution:1,sFriction:0,kFriction:0});for(let s=0;s<t;s++){const r=o++;e.createBody({id:r,x:Math.random()*8+1,y:Math.random()*8+1,vx:Math.random()*10-5,r:Math.PI/2*Math.random(),type:n.bodyTypes.DYNAMIC_OBJECT,mass:2,linearDamping:0,angularDamping:0}).createFixture({shape:n.shapes.POINT,radius:.05,restitution:1,sFriction:0,kFriction:0})}},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"10 Stacked Boxes",key:"stacked-boxes",description:"A vertical stack of 10 dynamic boxes testing the stability of the impulse solver under persistent contact.",onInitRaw:`(world) => {
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
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),F=1,e.createBody({id:F++,x:5,y:9.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.BOX,width:10,height:1});for(let t=0;t<10;t++)e.createBody({id:F++,x:5,y:8.5-t*.6,mass:1,color:`hsl(${t*36}, 70%, 60%)`}).createFixture({shape:n.shapes.BOX,width:1,height:.5,restitution:.1,sFriction:.5,kFriction:.3})}}),new w({name:"5-Level Pyramid",key:"pyramid",description:"A 5-level pyramid made of boxes. Tests multiple simultaneous contact points and stack stability.",onInitRaw:`(world) => {
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
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),F=1,e.createBody({id:F++,x:5,y:9.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.BOX,width:10,height:1});const t=.8,o=.8,i=5;for(let a=0;a<i;a++){const s=i-a,r=5-(s-1)*t/2,l=8.6-a*o;for(let c=0;c<s;c++)e.createBody({id:F++,x:r+c*t,y:l,mass:1,color:`hsl(${a*40}, 60%, 50%)`}).createFixture({shape:n.shapes.BOX,width:t*.95,height:o*.95,restitution:.1,sFriction:.5,kFriction:.3})}}}),new w({name:"Mass Ratio",key:"mass-ratio",description:"A classic physics engine test: a very heavy object (mass 100) resting on a very light one (mass 0.1).",onInitRaw:`(world) => {
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
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),F=1,e.createBody({id:F++,x:5,y:9.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.BOX,width:10,height:1}),e.createBody({id:F++,x:5,y:8.5,mass:.1,color:"#4ade80"}).createFixture({shape:n.shapes.BOX,width:1,height:1}),e.createBody({id:F++,x:5,y:7,mass:100,color:"#f87171"}).createFixture({shape:n.shapes.BOX,width:2,height:2})}}),new w({name:"Ragdoll",key:"ragdoll",description:"A draggable ragdoll made of boxes and circles connected by HingeJoints. Click and drag to interact.",onInitRaw:`(world) => {
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
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),n.debug.showAabbs=!1,F=1,e.createBody({id:F++,x:5,y:9.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:n.shapes.BOX,width:10,height:1});const t=5,o=4,i=e.createBody({id:F++,x:t,y:o-1.5,mass:1,color:"#fed7aa"});i.createFixture({shape:n.shapes.CIRCLE,radius:.3});const a=e.createBody({id:F++,x:t,y:o,mass:2,color:"#93c5fd"});a.createFixture({shape:n.shapes.BOX,width:.6,height:1});const s=(p,u,g,b,y)=>{const B=e.createBody({id:F++,x:p,y:u,mass:.5,color:y});return B.createFixture({shape:n.shapes.BOX,width:g,height:b}),B},r=s(t-.6,o-.3,.5,.2,"#fed7aa"),l=s(t-1.1,o-.3,.5,.2,"#fed7aa"),c=s(t+.6,o-.3,.5,.2,"#fed7aa"),m=s(t+1.1,o-.3,.5,.2,"#fed7aa"),x=s(t-.2,o+.8,.2,.6,"#1e3a8a"),f=s(t-.2,o+1.5,.2,.6,"#fed7aa"),h=s(t+.2,o+.8,.2,.6,"#1e3a8a"),d=s(t+.2,o+1.5,.2,.6,"#fed7aa");e.createHingeJoint(i,a,{id:F++,worldAnchor:{x:t,y:o-1}}),e.createHingeJoint(a,r,{id:F++,worldAnchor:{x:t-.3,y:o-.3}}),e.createHingeJoint(r,l,{id:F++,worldAnchor:{x:t-.85,y:o-.3}}),e.createHingeJoint(a,c,{id:F++,worldAnchor:{x:t+.3,y:o-.3}}),e.createHingeJoint(c,m,{id:F++,worldAnchor:{x:t+.85,y:o-.3}}),e.createHingeJoint(a,x,{id:F++,worldAnchor:{x:t-.2,y:o+.5}}),e.createHingeJoint(x,f,{id:F++,worldAnchor:{x:t-.2,y:o+1.15}}),e.createHingeJoint(a,h,{id:F++,worldAnchor:{x:t+.2,y:o+.5}}),e.createHingeJoint(h,d,{id:F++,worldAnchor:{x:t+.2,y:o+1.15}}),Kn(e)},onCleanup:e=>{Zn(e)}}),new w({name:"Bullet Through Paper",key:"bullet",description:["Tests anti-tunneling by firing a fast-moving 'bullet' (small circle) through a thin 'paper' (static AABB).","This version uses `speculativeMargin` to ensure the collision is caught even at high speeds."].join(`

`),onInitRaw:`(world) => {
			world.clear();
			world.setGravity(0, 0);
			world.setSpeculativeMargin(0.5);
			nextId = 1;

			// Thin Paper
			world
				.createBody({ id: nextId++, x: 8, y: 5, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#ccc" })
				.createFixture({
					shape: gearbox.shapes.BOX,
					width: 0.1,
					height: 4,
				});

			// The Bullet
			const bullet = world.createBody({
				id: nextId++,
				x: startX,
				y: 5,
				vx: bulletSpeed, // High velocity
				mass: 0.1,
				color: "#ffff44",
			});
			bullet.createFixture({
				shape: gearbox.shapes.CIRCLE,
				radius: 0.05,
			});

			(world as any).bulletId = bullet.id;
		}`,onInit:e=>{e.clear(),e.setGravity(0,0),e.setSpeculativeMargin(.5),F=1,e.createBody({id:F++,x:8,y:5,type:n.bodyTypes.FIXED_OBJECT,color:"#ccc"}).createFixture({shape:n.shapes.BOX,width:.1,height:4});const t=e.createBody({id:F++,x:Bn,y:5,vx:wn,mass:.1,color:"#ffff44"});t.createFixture({shape:n.shapes.CIRCLE,radius:.05}),e.bulletId=t.id},onTickRaw:`(world, dt) => {
			const bullet = world.getBodyById((world as any).bulletId);
			if (bullet && bullet.x > 25) {
				bullet.x = startX;
				bullet.vx = bulletSpeed;
				bullet.color = "#ff4444";
			}
			if (bullet && bullet.x < 0) {
				bullet.x = startX;
				bullet.vx = bulletSpeed;
				bullet.color = "#44ff44";
			}
		}`,onTick:(e,t)=>{const o=e.getBodyById(e.bulletId);o&&o.x>25&&(o.x=Bn,o.vx=wn,o.color="#ff4444"),o&&o.x<0&&(o.x=Bn,o.vx=wn,o.color="#44ff44")}}),new w({name:"20-Segment Chain",key:"chain",description:"A 20-segment chain suspended from a fixed point using DistanceJoints.",onInitRaw:`(world) => {
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
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),n.debug.showAabbs=!1,F=1;const t=5,o=1,i=20,a=.4,s=.15,r=e.createBody({id:F++,x:t,y:o+(Math.random()-.5)*.1,type:n.bodyTypes.FIXED_OBJECT,color:"#444"});r.createFixture({shape:n.shapes.CIRCLE,radius:.1});let l=0;l=+(Math.random()-.5)*1e-5;let c=r;for(let m=0;m<i;m++){const x=e.createBody({id:F++,x:t+l,y:o+(m+1)*a,mass:.2,color:m%2===0?"#60a5fa":"#3b82f6"});x.createFixture({shape:n.shapes.BOX,width:a,height:s}),e.createDistanceJoint(c,x,{id:F++,worldAnchor:{x:t,y:o+m*a+a/2}}),c=x}Kn(e)},onCleanup:e=>{Zn(e)}})];let Cn=0,Qn=1;const kt=[new w({name:"TC-1 (SOLVED)",key:"tc-1",description:["**Test Case 1**: Verifies stability during box-on-box collisions.","Previously, boxes would exhibit 'jitter' or 'explosive' behavior when colliding at certain angles."].join(`

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
		}`,onInit:e=>{e.setGravity(0,10),Cn=0},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{if(Cn++,Cn%60==0){let o=.1+Math.random()*.4,i=.2+o*o*.8,a=Qn++;e.createBody({id:a,x:0,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*1,vy:-6-Math.random()*1,type:n.bodyTypes.DYNAMIC_OBJECT,mass:o}).createFixture({shape:n.shapes.CIRCLE,radius:i}),o=.1+Math.random()*.4,i=.2+o*o*.8;let s=Qn++;e.createBody({id:s,x:10,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*-1,vy:-6-Math.random()*1,type:n.bodyTypes.DYNAMIC_OBJECT,mass:o}).createFixture({shape:n.shapes.CIRCLE,radius:i}),e.getBodyCount();let r=[];e.iterateBodies(l=>{l.y>10.5&&r.push(l)});for(let l of r)e.removeObject(l.id)}}}),new w({name:"TC-9 (SOLVED)",key:"tc-9",description:["**Test Case 9**: Resting stability.","A small box resting on a larger fixed box to verify that gravity and normal impulses reach equilibrium without constant jitter."].join(`

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
		}`,onInit:e=>{e.setGravity(0,20);let t=1;e.createBody({id:t++,x:5,y:9,type:n.bodyTypes.FIXED_OBJECT}).createFixture({shape:n.shapes.BOX,width:10,height:1,sFriction:10,kFriction:10});for(let o=0;o<4;o++)e.createBody({id:t++,x:5,y:8-o*1.1,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1}).createFixture({shape:n.shapes.BOX,width:2,height:1,sFriction:10,kFriction:10})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new w({name:"TC-15: Anti-tunneling (REGRESSION)",key:"tc-15",description:["**Test Case 15**: Regression test for anti-tunneling.","A fast bullet (radius 0.1) is fired at a thin wall (width 0.05) at high speed (vx: 50).","This test intentionally lacks `speculativeMargin`, leading to tunneling behavior."].join(`

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
		}`,onTick:(e,t)=>{const o=e.getBodyById(e.bulletId);o&&o.x>25&&(o.x=1,o.vx=50,o.color="#ff4444"),o&&o.x<0&&(o.x=1,o.vx=50,o.color="#44ff44")}})];let A=1,Tn=null,An=null,En=null,N=null;const Ot=new w({name:"Mechanical Clockwork",key:"clockwork",description:["A physically regulated mechanical clock. This version uses a **Grashof-compliant Crank-Rocker** mechanism to ensure continuous rotation.","### Features","- **Regulated Motion**: A 2.0m pendulum defines a 9-second period in low gravity (1.0 m/s²).","- **Grashof Linkage**: Precision geometry allows the drive gear to complete full 360° rotations.","- **Kinematic Drive**: The escapement gear is driven at a fixed rotation speed to ensure perfect timekeeping.","- **Multi-stage Reduction**: 7 `GearJoint` stages step down the escapement's motion to hours and minutes.","- **Real-time Sync**: The hands and gear train initialize to your local system time."].join(`

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
	}`,onInit:e=>{e.clear(),n.debug.showAabbs=!1,A=1;const t=5,o=2.5,i=1;e.setGravity(0,i),e.setHasRestitution(!0),e.setHasFriction(!0);const a=1,s=2,r=4,l=8,c=new Date,m=c.getSeconds(),x=c.getMinutes(),f=c.getHours()%12,h={crankRadius:.251412,groundDist:.962005,rockerLength:.788035,escXOffset:0,conRodFreq:15,conRodDamping:1,springFreq:.5,springX:t-1.5},d=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1",p=document.getElementById("clock-tuner-gui");p&&p.remove();const u=document.createElement("div");u.id="clock-tuner-gui",u.style="position:fixed;top:20px;right:20px;width:280px;background:rgba(0,0,0,0.85);color:#0f0;padding:15px;border-radius:8px;font-family:monospace;z-index:1000;box-shadow:0 4px 15px rgba(0,0,0,0.5);font-size:12px;border:1px solid #333;",d&&document.body.appendChild(u);const g=document.createElement("div");g.style="margin:15px 0;padding:10px;border:1px solid #0f0;text-align:center;font-size:16px;font-weight:bold;",g.textContent="Score: 0",u.appendChild(g);const b=document.createElement("button");b.textContent="Export to Console",b.style="width:100%;padding:8px;background:#0f0;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;margin-bottom:5px;",b.onclick=()=>console.log("Final Parameters:",JSON.stringify(h,null,4)),u.appendChild(b);const y=document.createElement("button");y.textContent="Start Auto-Optimize",y.style="width:100%;padding:8px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;",y.onclick=()=>{const M=e.scoreState;M.isOptimizing=!M.isOptimizing,y.textContent=M.isOptimizing?"Stop Auto-Optimize":"Start Auto-Optimize",y.style.background=M.isOptimizing?"#f00":"#444",M.isOptimizing&&(M.bestScore=-1/0,M.optimizationStage="PREPARE",M.optParamIndex=0,M.optDirection=1,M.epsilon=.05,M.lastImprovementIteration=0,console.log("Starting Auto-Optimization..."))},u.appendChild(y);const B=document.createElement("div");B.style="margin-top:10px;font-size:10px;color:#aaa;",B.textContent="Optimizer: Idle",u.appendChild(B);const I={},C=(M,L,pe,ye,Ve)=>{const Ke=document.createElement("div");Ke.style.marginBottom="10px";const Ze=document.createElement("div");Ze.textContent=`${M}: ${h[L].toFixed(2)}`;const W=document.createElement("input");W.type="range",W.min=pe,W.max=ye,W.step=Ve,W.value=h[L],W.style.width="100%",W.oninput=()=>{h[L]=parseFloat(W.value),Ze.textContent=`${M}: ${h[L].toFixed(2)}`,Ye()},Ke.appendChild(Ze),Ke.appendChild(W),u.appendChild(Ke),I[L]={slider:W,labelEl:Ze,label:M}},k=M=>{const L=I[M];L&&(L.slider.value=h[M],L.labelEl.textContent=`${L.label}: ${h[M].toFixed(2)}`)};C("Crank Radius","crankRadius",.05,.5,.01),C("Ground Distance","groundDist",.5,2,.05),C("Rocker Length","rockerLength",.3,1.5,.05),C("Esc X Offset","escXOffset",-.5,.5,.01),C("Rod Frequency","conRodFreq",5,50,1),C("Spring Frequency","springFreq",.1,2,.05),C("Spring X Pos","springX",t-3,t-.5,.1);const R=o+2,X=R-h.groundDist,_=i*Math.pow(8/(2*Math.PI),2);_-h.rockerLength;const Y=A++,Be=e.createBody({id:Y,x:t,y:R,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});Be.createFixture({id:Y,shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const Me=A++,se=e.createBody({id:Me,x:t,y:X,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});se.createFixture({id:Me,shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const Pe=A++,Z=e.createBody({id:Pe,x:t,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});Z.createFixture({id:Pe,shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const ke=.5,Oe=A++;N=e.createBody({id:Oe,x:t+Math.sin(ke)*_,y:R+Math.cos(ke)*_,r:-ke,mass:5,color:"#cd853f"}),N.createFixture({id:Oe,shape:n.shapes.CIRCLE,radius:.4,categoryBits:s,maskBits:0}),N.angularDamping=.01,e.createHingeJoint(Be,N,{id:A++,worldAnchor:{x:t,y:R},anchorB:{x:0,y:-_}});const we=A++,z=e.createBody({id:we,x:t+h.escXOffset,y:X,r:0,type:n.bodyTypes.KINEMATIC_OBJECT,color:"#aaa"});z.createFixture({id:we,shape:n.shapes.CIRCLE,radius:.5,categoryBits:r,maskBits:0}),z.rs=Math.PI*2/8;const je=e.createHingeJoint(se,z,{id:A++,worldAnchor:{x:t+h.escXOffset,y:X}}),on={x:h.crankRadius,y:0},Ge={x:0,y:-h.rockerLength},ie=()=>{const M=t+h.escXOffset,L=R-h.groundDist,pe={x:M+h.crankRadius,y:L},ye={x:t,y:R+(_-h.rockerLength)};return Math.sqrt(Math.pow(pe.x-ye.x,2)+Math.pow(pe.y-ye.y,2))},he=e.createSpringJoint(z,N,{id:A++,anchorA:on,anchorB:Ge,length:ie(),frequencyHz:h.conRodFreq,dampingRatio:h.conRodDamping}),Ye=()=>{const M=R-h.groundDist,L=t+h.escXOffset;se.x=L,se.y=M,z.x=L,z.y=M,je.localAnchorA=se.worldToLocal({x:L,y:M}),he.localAnchorA={x:h.crankRadius,y:0},he.localAnchorB={x:0,y:-h.rockerLength},he.length=ie(),he.frequencyHz=h.conRodFreq,he.dampingRatio=h.conRodDamping};e.scoreState={fastGear:z,pendulum:N,params:h,updateSimulation:Ye,updateSliderUI:k,optStatus:B,lastFastR:z.r,lastPendRs:N.rs,lastRsSign:Math.sign(N.rs),rsSignChanges:0,maxAngle:-1/0,minAngle:1/0,hasCrossedZero:!1,history:[],periodTimes:[],lastPendSide:Math.sign(N.r),lastPendCrossing:0,scoreDisplay:g,isOptimizing:!1};const gt=8/60,an=t+1.5,sn=X+.5,Rn=A++,Ln=e.createBody({id:Rn,x:an,y:sn,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});Ln.createFixture({id:Rn,shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const Dn=A++,rn=e.createBody({id:Dn,x:an,y:sn,mass:.2,r:0,color:"#44ff44"});rn.createFixture({id:Dn,shape:n.shapes.CIRCLE,radius:1,categoryBits:r,maskBits:0}),rn.angularDamping=.02;const Sn=e.createHingeJoint(Ln,rn,{id:A++,worldAnchor:{x:an,y:sn}});e.createGearJoint(je,Sn,{id:A++,ratio:.25});const ze=m/60*Math.PI*2,Xn=A++,dn=e.createBody({id:Xn,x:t,y:o,mass:.2,r:ze,color:"#ff4444"});dn.createFixture({id:Xn,shape:n.shapes.CIRCLE,radius:.6,categoryBits:r,maskBits:0}),dn.angularDamping=.02;const cn=e.createHingeJoint(Z,dn,{id:A++,worldAnchor:{x:t,y:o}});e.createGearJoint(Sn,cn,{id:A++,ratio:gt/.25});const Ne=x/60*Math.PI*2,We=f/12*Math.PI*2,$e=3.5,Ue=3,qe=2;for(let M=0;M<12;M++){const L=M/12*Math.PI*2-Math.PI/2,pe=3.8,ye=4,Ve=A++;e.createBody({id:Ve,x:t+Math.cos(L)*(pe+ye)/2,y:o+Math.sin(L)*(pe+ye)/2,r:L+Math.PI/2,type:n.bodyTypes.FIXED_OBJECT,color:"#999"}).createFixture({id:Ve,shape:n.shapes.BOX,width:M%3===0?.2:.1,height:.4,categoryBits:a,maskBits:0})}const Jn=A++;Tn=e.createBody({id:Jn,x:t+Math.sin(ze)*($e/2-.2),y:o-Math.cos(ze)*($e/2-.2),r:ze,mass:.1,color:"#ff4444"}),Tn.createFixture({id:Jn,shape:n.shapes.BOX,width:.05,height:$e,categoryBits:l,maskBits:0,restitution:0});const mt=e.createHingeJoint(Z,Tn,{id:A++,worldAnchor:{x:t,y:o},anchorB:{x:0,y:$e/2-.2}});e.createGearJoint(cn,mt,{id:A++,ratio:-1});const ln=t-1.5,hn=o-1.5,Hn=A++,_n=e.createBody({id:Hn,x:ln,y:hn,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});_n.createFixture({id:Hn,shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const Pn=A++,pn=e.createBody({id:Pn,x:ln,y:hn,mass:.2,r:0,color:"#4444ff"});pn.createFixture({id:Pn,shape:n.shapes.CIRCLE,radius:1,categoryBits:r,maskBits:0}),pn.angularDamping=.01;const jn=e.createHingeJoint(_n,pn,{id:A++,worldAnchor:{x:ln,y:hn}});e.createGearJoint(cn,jn,{id:A++,ratio:1/10});const Gn=A++,yn=e.createBody({id:Gn,x:t,y:o,mass:.2,r:Ne,color:"#4444ff"});yn.createFixture({id:Gn,shape:n.shapes.CIRCLE,radius:.8,categoryBits:r,maskBits:0}),yn.angularDamping=.01;const un=e.createHingeJoint(Z,yn,{id:A++,worldAnchor:{x:t,y:o}});e.createGearJoint(jn,un,{id:A++,ratio:1/6});const Yn=A++;An=e.createBody({id:Yn,x:t+Math.sin(Ne)*(Ue/2-.3),y:o-Math.cos(Ne)*(Ue/2-.3),r:Ne,mass:.2,color:"#4444ff"}),An.createFixture({id:Yn,shape:n.shapes.BOX,width:.12,height:Ue,categoryBits:l,maskBits:0});const xt=e.createHingeJoint(Z,An,{id:A++,worldAnchor:{x:t,y:o},anchorB:{x:0,y:Ue/2-.3}});e.createGearJoint(un,xt,{id:A++,ratio:-1});const gn=t+2,mn=o-1,zn=A++,Nn=e.createBody({id:zn,x:gn,y:mn,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});Nn.createFixture({id:zn,shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const Wn=A++,xn=e.createBody({id:Wn,x:gn,y:mn,mass:.2,r:0,color:"#cccc44"});xn.createFixture({id:Wn,shape:n.shapes.CIRCLE,radius:1,categoryBits:r,maskBits:0}),xn.angularDamping=.01;const $n=e.createHingeJoint(Nn,xn,{id:A++,worldAnchor:{x:gn,y:mn}});e.createGearJoint(un,$n,{id:A++,ratio:1/3});const Un=A++,bn=e.createBody({id:Un,x:t,y:o,mass:.2,r:We,color:"#cc8844"});bn.createFixture({id:Un,shape:n.shapes.CIRCLE,radius:1.1,categoryBits:r,maskBits:0}),bn.angularDamping=.01;const qn=e.createHingeJoint(Z,bn,{id:A++,worldAnchor:{x:t,y:o}});e.createGearJoint($n,qn,{id:A++,ratio:1/4});const Vn=A++;En=e.createBody({id:Vn,x:t+Math.sin(We)*(qe/2-.4),y:o-Math.cos(We)*(qe/2-.4),r:We,mass:.3,color:"#cc8844"}),En.createFixture({id:Vn,shape:n.shapes.BOX,width:.18,height:qe,categoryBits:l,maskBits:0});const bt=e.createHingeJoint(Z,En,{id:A++,worldAnchor:{x:t,y:o},anchorB:{x:0,y:qe/2-.4}});e.createGearJoint(qn,bt,{id:A++,ratio:-1})},onTickRaw:`(world, dt) => {
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
	}`,onTick:(e,t)=>{const o=e.scoreState;if(o){const s=performance.now(),r=8e3;let l=0,c=!1;if(o.fastGear){const I=o.fastGear.r-o.lastFastR;I<-.01&&(c=!0),l=Math.max(0,I)/(Math.PI*2),o.lastFastR=o.fastGear.r}const m=o.pendulum.r,x=o.pendulum.rs,f=(x-o.lastPendRs)/t;o.lastPendRs=x;const h=Math.sign(x);if(h!==o.lastRsSign&&h!==0&&(o.rsSignChanges++,o.lastRsSign=h),o.maxAngle=Math.max(o.maxAngle,m),o.minAngle=Math.min(o.minAngle,m),o.history.push({time:s,rotDelta:l,isReversal:c,pendR:m,pendRs:x,pendRa:f}),o.pendulum){const I=Math.sign(o.pendulum.r);if(I!==o.lastPendSide&&I!==0){if(o.hasCrossedZero=!0,o.lastPendCrossing>0){const C=(s-o.lastPendCrossing)/500;C>.5&&C<10&&o.periodTimes.push({time:s,period:C})}o.lastPendCrossing=s,o.lastPendSide=I}}const d=s-r;for(;o.history.length>0&&o.history[0].time<d;)o.history.shift();for(;o.periodTimes.length>0&&o.periodTimes[0].time<d;)o.periodTimes.shift();let p=0,u=0,g=0;if(o.history.length>0){let I=0,C=0;for(const k of o.history)I+=Math.abs(k.pendRa),C+=Math.abs(k.pendRs),g=Math.max(g,Math.abs(k.pendRa));p=I/o.history.length,u=C/o.history.length}const b=(o.maxAngle-o.minAngle)/2;let y=Math.min(b,.6)*2e3;const B=Math.abs(o.maxAngle+o.minAngle);if(y-=B*1e3,y-=p*10,y-=g*2,o.rsSignChanges>2&&(y-=(o.rsSignChanges-2)*500),y+=u*100,o.hasCrossedZero||(y-=1e4),b<.1&&(y-=5e3),!o.isOptimizing&&o.history.length===0&&(o.maxAngle=-1/0,o.minAngle=1/0,o.hasCrossedZero=!1,o.rsSignChanges=0),o.scoreDisplay.textContent=`Score: ${Math.floor(y)} | Amp: ${b.toFixed(2)} | Jit: ${Math.max(0,o.rsSignChanges-2)}${o.hasCrossedZero?"":" [STUCK]"}`,o.isOptimizing){const I=["crankRadius","groundDist","rockerLength","escXOffset","conRodFreq"];o.optimizationStage==="PREPARE"?(o.bestScore=-1/0,o.optimizationStage="TWEAK",o.evalTimer=s+r,o.improvedThisCycle=!1,o.maxAngle=-1/0,o.minAngle=1/0,o.hasCrossedZero=!1,o.rsSignChanges=0):s>o.evalTimer&&o.optimizationStage==="TWEAK"&&(y>o.bestScore?(o.bestScore=y,o.improvedThisCycle=!0,o.optStatus.textContent=`Improved ${I[o.optParamIndex]} (Best: ${Math.floor(y)})`):(o.params[I[o.optParamIndex]]-=o.epsilon*o.optDirection,o.updateSimulation(),o.updateSliderUI(I[o.optParamIndex])),o.optDirection*=-1,o.optDirection===1&&(o.optParamIndex++,o.optParamIndex>=I.length&&(o.optParamIndex=0,o.improvedThisCycle||(o.epsilon*=.7),o.improvedThisCycle=!1)),o.params[I[o.optParamIndex]]+=o.epsilon*o.optDirection,o.updateSimulation(),o.updateSliderUI(I[o.optParamIndex]),o.maxAngle=-1/0,o.minAngle=1/0,o.hasCrossedZero=!1,o.rsSignChanges=0,o.evalTimer=s+r,o.optStatus.textContent=`Testing ${I[o.optParamIndex]} (${o.optDirection>0?"+":"-"}) Best: ${Math.floor(o.bestScore)}`)}else o.optStatus.textContent="Optimizer: Idle"}const a=new Date().toLocaleTimeString();if(n.debug.clearLabels(),n.debug.addLabel({text:"Mechanical Clockwork",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"}),n.debug.addLabel({text:a,x:5,y:9.5,fontSize:"36px Arial",color:"#fff",position:"on-top"}),N){const s=(N.r*180/Math.PI).toFixed(1);n.debug.addLabel({text:`Pendulum: ${s}°`,x:8,y:8,fontSize:"16px Arial",color:"#cd853f",position:"on-top"})}},onCleanup:e=>{const t=document.getElementById("clock-tuner-gui");t&&t.remove()}});let P=1,q=null;const Rt=new w({name:"Gnome Omega Engine",key:"gnome-omega",description:["A detailed simulation of a **Gnome Omega** rotary engine. In this classic radial design, the crankshaft remains stationary while the entire cylinder block rotates around it.","### Features","- **Stationary Crankshaft**: A fixed pivot point (red) offset from the center.","- **Rotating Crankcase**: The main grey hub that carries the cylinders.","- **Weld Constraints**: Cylinders are 'welded' to the hub using a combination of `HingeJoint` and `DistanceJoint` for maximum stability.","- **Reciprocating Motion**: Pistons and connecting rods are synchronized via `HingeJoint` constraints.","- **Collision Masks**: Bitwise filtering ensures pistons only interact with their respective cylinder walls.","Click **Reset** if the simulation becomes unstable due to extreme angular velocities."].join(`

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
	}`,onInit:e=>{e.clear(),n.debug.showAabbs=!1,P=1,q=null;const t=5,o=4.5,i=.8,a=7,s=2.5,r=256,l=512,c=1024,m=2048,x=4096,f=P++,h=e.createBody({id:f,x:t,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});h.createFixture({id:f,shape:n.shapes.CIRCLE,radius:.15,categoryBits:r,maskBits:0});const d=P++,p=e.createBody({id:d,x:t,y:o+i,type:n.bodyTypes.FIXED_OBJECT,color:"#ff4444"});p.createFixture({id:d,shape:n.shapes.CIRCLE,radius:.1,categoryBits:r,maskBits:0});const u=P++;q=e.createBody({id:u,x:t,y:o,mass:50,color:"#aaa"}),q.createFixture({id:u,shape:n.shapes.CIRCLE,radius:.8,categoryBits:l,maskBits:0,restitution:0}),e.createHingeJoint(h,q,{id:P++,worldAnchor:{x:t,y:o}});for(let g=0;g<a;g++){const b=g/a*Math.PI*2,y=Math.cos(b),B=Math.sin(b),I=b-Math.PI/2,C=2.6,k=.28,R=2.5,X=1,ae=z=>{const je=t+y*C+-B*(z*X/2),on=o+B*C+y*(z*X/2),Ge=P++,ie=e.createBody({id:Ge,x:je,y:on,r:I,mass:1,color:"#bbb"});ie.createFixture({id:Ge,shape:n.shapes.BOX,width:k,height:R,categoryBits:c,maskBits:m,restitution:0,sFriction:0,kFriction:0});const he=ie.localToWorld({x:0,y:-R/2}),Ye=ie.localToWorld({x:0,y:R/2});e.createHingeJoint(q,ie,{id:P++,worldAnchor:he}),e.createDistanceJoint(q,ie,{id:P++,worldAnchor:Ye})};ae(-1),ae(1);const _=i*Math.sin(b)+Math.sqrt(s*s-Math.pow(i*Math.cos(b),2)),Y=t+y*_,Be=o+B*_,Me=P++,se=e.createBody({id:Me,x:Y,y:Be,r:I,mass:.5,color:"#ddd"});se.createFixture({id:Me,shape:n.shapes.BOX,width:.7,height:1,categoryBits:m,maskBits:c,restitution:0,sFriction:0,kFriction:0});const Pe=(t+Y)/2,Z=(o+i+Be)/2,ke=Math.atan2(Be-(o+i),Y-t)-Math.PI/2,Oe=P++,we=e.createBody({id:Oe,x:Pe,y:Z,r:ke,mass:.2,color:"#fff"});we.createFixture({id:Oe,shape:n.shapes.BOX,width:.15,height:s,categoryBits:x,maskBits:0,restitution:0}),e.createHingeJoint(we,p,{id:P++,anchorA:{x:0,y:-s/2},anchorB:{x:0,y:0}}),e.createHingeJoint(we,se,{id:P++,anchorA:{x:0,y:s/2},anchorB:{x:0,y:0}})}e.setGravity(0,0),q.rs=2},onTickRaw:`(world, dt) => {
		if (engineHub) {
			// Apply a gentle impulse to maintain rotation
			if (Math.abs(engineHub.rs) < 0.9) {
				engineHub.applyAngularImpulse(5);
			}
		}
	}`,onTick:(e,t)=>{q&&Math.abs(q.rs)<.9&&q.applyAngularImpulse(5)}});let He=1,ee=null;const Te=[{name:"Cherry",radius:.15,mass:.1,color:"#ff4444",score:1},{name:"Strawberry",radius:.22,mass:.2,color:"#ff6666",score:3},{name:"Grape",radius:.28,mass:.3,color:"#9933ff",score:6},{name:"Dekopon",radius:.35,mass:.4,color:"#ff9933",score:10},{name:"Persimmon",radius:.42,mass:.5,color:"#ff6600",score:15},{name:"Apple",radius:.5,mass:.7,color:"#cc0000",score:21},{name:"Pear",radius:.58,mass:.9,color:"#ffff66",score:28},{name:"Peach",radius:.68,mass:1.2,color:"#ff99cc",score:36},{name:"Pineapple",radius:.8,mass:1.6,color:"#ffff00",score:45},{name:"Melon",radius:.95,mass:2.2,color:"#99ff33",score:55},{name:"Watermelon",radius:1.15,mass:3,color:"#006600",score:66}];let E={score:0,nextFruitLevel:0,isGameOver:!1,lastDropTime:0,dropCooldown:500,mouseX:5,fruitIds:new Map,mergingIds:new Set,previewFruit:null};const et=()=>{E.score=0,E.nextFruitLevel=Math.floor(Math.random()*5),E.isGameOver=!1,E.lastDropTime=0,E.mouseX=5,E.fruitIds.clear(),E.mergingIds.clear(),E.previewFruit=null,He=1},Lt=e=>(e-n.debug.offsetX)/(n.debug.zoom*100),dt=new w({name:"Fruit Merge",key:"fruit-merge",description:["A physics-based arcade game demonstrating dynamic object spawning and collision events.","Drop fruits into the bucket. Identical fruits will **merge** into the next larger fruit tier on contact.","### Controls","- **Mouse Move**: Position the preview fruit","- **Click**: Drop fruit","**Game Over** occurs if any fruit falls out of the world boundaries."].join(`

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
	}`,onInit:e=>{e.clear(),et(),n.debug.showAabbs=!1,e.setGravity(0,9.8),e.setHasRestitution(!0),e.setHasFriction(!0);const t=5,o=6,i=4,a=5,s=.2,r=He++;e.createBody({id:r,x:t,y:o+a/2+s/2,type:n.bodyTypes.FIXED_OBJECT,color:"#664422"}).createFixture({shape:n.shapes.BOX,width:i+s*2,height:s});const l=He++;e.createBody({id:l,x:t-i/2-s/2,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#664422"}).createFixture({shape:n.shapes.BOX,width:s,height:a});const c=He++;e.createBody({id:c,x:t+i/2+s/2,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#664422"}).createFixture({shape:n.shapes.BOX,width:s,height:a});const m=(h,d,p,u=!1)=>{if(p>=Te.length)return null;const g=Te[p],b=He++,y=e.createBody({id:b,x:h,y:d,mass:g.mass,color:g.color});return y.createFixture({shape:n.shapes.CIRCLE,radius:g.radius,restitution:.2,sFriction:.5,kFriction:.3}),y&&(y.wantsEvents=!0,E.fruitIds.set(b,p),u&&(y.vx=(Math.random()-.5)*.1)),y};e.onCollisionStart=(h,d)=>{if(E.isGameOver)return;const p=E.fruitIds.get(h),u=E.fruitIds.get(d);if(p!==void 0&&u!==void 0&&p===u){if(E.mergingIds.has(h)||E.mergingIds.has(d))return;const g=p;if(g>=Te.length-1)return;E.mergingIds.add(h),E.mergingIds.add(d);const b=e.getBodyById(h),y=e.getBodyById(d);if(b&&y){const B=(b.x+y.x)/2,I=(b.y+y.y)/2;setTimeout(()=>{e.removeObject(h),e.removeObject(d),E.fruitIds.delete(h),E.fruitIds.delete(d),E.mergingIds.delete(h),E.mergingIds.delete(d),m(B,I,g+1)&&(E.score+=Te[g+1].score)},0)}}},ee=document.getElementById("debug-canvas"),e._onMouseMove&&ee.removeEventListener("mousemove",e._onMouseMove),e._onClick&&ee.removeEventListener("click",e._onClick);const x=h=>{if(E.isGameOver)return;const d=ee.getBoundingClientRect();E.mouseX=Lt(h.clientX-d.left);const p=Te[E.nextFruitLevel].radius;E.mouseX=Math.max(t-i/2+p,Math.min(t+i/2-p,E.mouseX))},f=h=>{if(E.isGameOver){e.clear(),et(),dt.onInit(e);return}const d=Date.now();d-E.lastDropTime>E.dropCooldown&&(m(E.mouseX,o-a/2-1,E.nextFruitLevel,!0),E.nextFruitLevel=Math.floor(Math.random()*5),E.lastDropTime=d)};e._onMouseMove=x,e._onClick=f,ee.addEventListener("mousemove",x),ee.addEventListener("click",f)},onTickRaw:`(world, dt) => {
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
	}`,onTick:(e,t)=>{if(n.debug.clearLabels(),E.isGameOver){n.debug.addLabel({text:"GAME OVER",x:5,y:4,fontSize:"48px Arial",color:"#ff4444",position:"on-top"}),n.debug.addLabel({text:`Final Score: ${E.score}`,x:5,y:5,fontSize:"24px Arial",color:"#fff",position:"on-top"}),n.debug.addLabel({text:"Click to Restart",x:5,y:6,fontSize:"20px Arial",color:"#888",position:"on-top"});return}n.debug.addLabel({text:`Score: ${E.score}`,x:.5,y:.5,fontSize:"24px Arial",color:"#fff",position:"on-top"});const o=Te[E.nextFruitLevel];n.debug.addLabel({text:`Next: ${o.name}`,x:8,y:.5,fontSize:"18px Arial",color:o.color,position:"on-top"}),n.debug.addLabel({text:"●",x:E.mouseX,y:1.5,fontSize:`${o.radius*200}px Arial`,color:o.color,position:"on-top"}),e.iterateBodies(a=>{E.fruitIds.has(a.id)&&a.y>12&&(E.isGameOver=!0)}),n.debug.addLabel({text:"Fruit Merge",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"})},onCleanup:e=>{ee&&(ee.removeEventListener("mousemove",e._onMouseMove),ee.removeEventListener("click",e._onClick),delete e._onMouseMove,delete e._onClick)}});let D=1,v=null,ge=null,Ae=null,Ee=null,J=null,H=null,me=[],re={},G=null,Ie=null,ce=null;const ve=1,Xe=2,de=4,ct=(e,t)=>({x:(e-n.debug.offsetX)/(n.debug.zoom*100),y:(t-n.debug.offsetY)/(n.debug.zoom*100)}),Dt=(e,t)=>{if(e.button!==0)return;const o=ce.getBoundingClientRect(),i=ct(e.clientX-o.left,e.clientY-o.top),a=t.queryBodiesAtPoint(i.x,i.y);if(a.length>0){const s=a[0],r=t.getBodyById(s);r&&r.type!==n.bodyTypes.FIXED_OBJECT&&(G=t.createBody({id:999999,x:i.x,y:i.y,type:n.bodyTypes.FIXED_OBJECT,color:"transparent"}),G.createFixture({id:999999,shape:n.shapes.CIRCLE,radius:.05,maskBits:0}),Ie=t.createSpringJoint(G,r,{id:999998,worldAnchor:i,frequencyHz:5,dampingRatio:1,length:0}))}},St=e=>{if(G){const t=ce.getBoundingClientRect(),o=ct(e.clientX-t.left,e.clientY-t.top);G.x=o.x,G.y=o.y}},Xt=(e,t)=>{Ie&&(t.removeJoint(Ie.id),Ie=null),G&&(t.removeObject(G.id),G=null)},lt=new w({name:"Motorcycle Trials",key:"motorcycle",description:["A physically-driven motorcycle featuring multi-joint suspension and a gear-driven powertrain.","### Controls","- **D / A**: Throttle / Reverse","- **W / S**: Lean / Balance","- **R**: Reset Simulation","### Technical Features","- **Power Transfer**: Engine-to-wheel torque transfer using `GearJoint` constraints.","- **Suspension**: A network of `SpringJoint` constraints for authentic front/rear suspension travel.","- **Procedural Terrain**: Dynamic generation with optimized **Collision Masks** (terrain-terrain collisions are disabled for performance)."].join(`

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
	}`,onInit:e=>{e.clear(),n.debug.showAabbs=!1,n.debug.showForceVectors=!1,D=1,me=[],re={};const t=5,o=5;e.setGravity(0,9.81),e.setHasRestitution(!0),e.setHasFriction(!0);const i=D++;v=e.createBody({id:i,x:t,y:o,mass:10,color:"#ff4444"}),v.createFixture({id:i,shape:n.shapes.BOX,width:1.2,height:.4,categoryBits:ve,maskBits:de}),v.angularDamping=1;const a=D++;ge=e.createBody({id:a,x:t,y:o-.15,mass:5,color:"#444"}),ge.createFixture({id:a,shape:n.shapes.CIRCLE,radius:.25,categoryBits:0,maskBits:0});const s=e.createHingeJoint(v,ge,{id:D++,worldAnchor:{x:t,y:o-.15}}),r=D++;H=e.createBody({id:r,x:t-.6,y:o+.2,mass:1,color:"#666"}),H.createFixture({shape:n.shapes.BOX,width:.6,height:.1,categoryBits:ve,maskBits:de}),H.angularDamping=1,e.createHingeJoint(v,H,{id:D++,anchorA:{x:-.4,y:.1},anchorB:{x:.3,y:0}}),e.createSpringJoint(v,H,{id:D++,anchorA:{x:-.7,y:-.2},anchorB:{x:-.3,y:0},frequencyHz:25,dampingRatio:.8});const l=D++;Ee=e.createBody({id:l,x:t-.9,y:o+.2,mass:2,color:"#333"}),Ee.createFixture({id:l,shape:n.shapes.CIRCLE,radius:.4,categoryBits:Xe,maskBits:de}),Ee.fixtures[0].kineticFriction=2.5,Ee.fixtures[0].staticFriction=3,Ee.angularDamping=.5;const c=e.createHingeJoint(H,Ee,{id:D++,anchorA:{x:-.3,y:0},anchorB:{x:0,y:0}});e.createGearJoint(s,c,{id:D++,ratio:2});const m=D++;J=e.createBody({id:m,x:t+.7,y:o+.2,r:.3,mass:1,color:"#666"}),J.createFixture({shape:n.shapes.BOX,width:.1,height:.8,categoryBits:ve,maskBits:de}),J.angularDamping=1,e.createHingeJoint(v,J,{id:D++,anchorA:{x:.5,y:0},anchorB:{x:0,y:-.3}}),e.createSpringJoint(v,J,{id:D++,anchorA:{x:.2,y:.2},anchorB:{x:0,y:.3},frequencyHz:20,dampingRatio:.9});const x=D++;Ae=e.createBody({id:x,x:t+.8,y:o+.5,mass:2,color:"#333"}),Ae.createFixture({id:x,shape:n.shapes.CIRCLE,radius:.4,categoryBits:Xe,maskBits:de}),Ae.fixtures[0].kineticFriction=2,Ae.fixtures[0].staticFriction=2.5,Ae.angularDamping=.5,e.createHingeJoint(J,Ae,{id:D++,anchorA:{x:0,y:.4},anchorB:{x:0,y:0}});const f=D++,h=e.createBody({id:f,x:t,y:o+2,type:n.bodyTypes.FIXED_OBJECT,color:"#444"});h.createFixture({shape:n.shapes.BOX,width:20,height:1,categoryBits:de,maskBits:ve|Xe}),me.push(h);const d=D++;e.createBody({id:d,x:-7.72,y:.01,r:1.2,type:n.bodyTypes.FIXED_OBJECT,color:"#333"}).createFixture({shape:n.shapes.BOX,width:15,height:1,categoryBits:de,maskBits:ve|Xe});const p=I=>re[I.code]=!0,u=I=>re[I.code]=!1;ce=document.getElementById("debug-canvas");const g=I=>Dt(I,e),b=I=>St(I),y=I=>Xt(I,e),B=e._motorcycleListeners;B&&(window.removeEventListener("keydown",B.onKeyDown),window.removeEventListener("keyup",B.onKeyUp),ce&&ce.removeEventListener("mousedown",B.mouseDownHandler),window.removeEventListener("mousemove",B.mouseMoveHandler),window.removeEventListener("mouseup",B.mouseUpHandler)),window.addEventListener("keydown",p),window.addEventListener("keyup",u),ce.addEventListener("mousedown",g),window.addEventListener("mousemove",b),window.addEventListener("mouseup",y),e._motorcycleListeners={onKeyDown:p,onKeyUp:u,mouseDownHandler:g,mouseMoveHandler:b,mouseUpHandler:y}},onTickRaw:`(world, dt) => {
		if (!chassis) return;

		// --- 3. Controls & Engine ---
		const throttlePower = 75.0;
		const leanPower = 100.0;
		const maxEngineSpeed = 100.0; // Higher top speed

		// Stability Enhancement: Hard limits for suspension travel to prevent "flipping into chassis"
		if (rearArm) {
			let relAngle = rearArm.r - chassis.r;
			while (relAngle > Math.PI) relAngle -= Math.PI * 2;
			while (relAngle < -Math.PI) relAngle += Math.PI * 2;

			const min = -0.6;
			const max = 0.6;
			if (relAngle < min) {
				rearArm.r = chassis.r + min;
				if (rearArm.rs < chassis.rs) rearArm.rs = chassis.rs;
			} else if (relAngle > max) {
				rearArm.r = chassis.r + max;
				if (rearArm.rs > chassis.rs) rearArm.rs = chassis.rs;
			}
		}

		if (frontArm) {
			let relAngle = frontArm.r - chassis.r;
			while (relAngle > Math.PI) relAngle -= Math.PI * 2;
			while (relAngle < -Math.PI) relAngle += Math.PI * 2;

			const min = -0.1;
			const max = 0.8;
			if (relAngle < min) {
				frontArm.r = chassis.r + min;
				if (frontArm.rs < chassis.rs) frontArm.rs = chassis.rs;
			} else if (relAngle > max) {
				frontArm.r = chassis.r + max;
				if (frontArm.rs > chassis.rs) frontArm.rs = chassis.rs;
			}
		}

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
	}`,onTick:(e,t)=>{if(!v)return;const o=75,i=100,a=100;if(H){let r=H.r-v.r;for(;r>Math.PI;)r-=Math.PI*2;for(;r<-Math.PI;)r+=Math.PI*2;const l=-.6,c=.6;r<l?(H.r=v.r+l,H.rs<v.rs&&(H.rs=v.rs)):r>c&&(H.r=v.r+c,H.rs>v.rs&&(H.rs=v.rs))}if(J){let r=J.r-v.r;for(;r>Math.PI;)r-=Math.PI*2;for(;r<-Math.PI;)r+=Math.PI*2;const l=-.1,c=.8;r<l?(J.r=v.r+l,J.rs<v.rs&&(J.rs=v.rs)):r>c&&(J.r=v.r+c,J.rs>v.rs&&(J.rs=v.rs))}if(re.KeyD&&ge.rs<a&&ge.applyAngularImpulse(-o*t),re.KeyA&&ge.rs>-a&&ge.applyAngularImpulse(o*t),re.KeyW&&v.applyAngularImpulse(-i*t),re.KeyS&&v.applyAngularImpulse(i*t),re.KeyR){lt.init(e);return}const s=me[me.length-1];if(s.x<v.x+25){const r=6+Math.random()*8,l=1.2,c=(Math.random()-.5)*.5,m=Math.random()<.2?1.5:0,x=s.localToWorld({x:s.fixtures[0].width/2,y:-s.fixtures[0].height/2}),f=x.x+m;let h=x.y+(m>0?(Math.random()-.5)*3:0);h=Math.max(2,Math.min(8,h));const d=Math.cos(c),p=Math.sin(c),u=f+r/2*d-l/2*p,g=h+r/2*p+l/2*d,b=D++,y=e.createBody({id:b,x:u,y:g,r:c,type:n.bodyTypes.FIXED_OBJECT,color:`hsl(${20+Math.random()*40}, 30%, ${30+Math.random()*20}%)`});if(y.createFixture({shape:n.shapes.BOX,width:r,height:l,categoryBits:de,maskBits:ve|Xe}),me.push(y),me.length>50){const B=me.shift();e.removeObject(B.id)}}n.debug.clearLabels(),v.x<15&&(n.debug.addLabel({text:"Motorcycle Trials",x:5,y:3,fontSize:"28px Arial",color:"#fff",position:"on-top"}),n.debug.addLabel({text:"Use D/A to drive and W/S to balance!",x:5,y:3.5,fontSize:"16px Arial",color:"#aaa",position:"on-top"}))},onRender:e=>{if(!v)return;const t=e.interpolationAlpha,o=v.x*t+v.prevX*(1-t),i=v.y*t+v.prevY*(1-t),a=n.debug.canvas?.width||800,s=n.debug.canvas?.height||600,r=n.debug.zoom,l=a/2-o*100*r,c=s/2-i*100*r;n.debug.offsetX+=(l-n.debug.offsetX)*.1,n.debug.offsetY+=(c-n.debug.offsetY)*.1},onCleanup:e=>{const t=e._motorcycleListeners;t&&(window.removeEventListener("keydown",t.onKeyDown),window.removeEventListener("keyup",t.onKeyUp),ce&&ce.removeEventListener("mousedown",t.mouseDownHandler),window.removeEventListener("mousemove",t.mouseMoveHandler),window.removeEventListener("mouseup",t.mouseUpHandler),delete e._motorcycleListeners),Ie&&(e.removeJoint(Ie.id),Ie=null),G&&(e.removeObject(G.id),G=null),n.debug.offsetX=0,n.debug.offsetY=0}}),Jt=new w({name:"Newton's Cradle",key:"newtons-cradle",description:["A classic demonstration of conservation of momentum and energy. This simulation shows how kinetic energy and momentum are transferred through a series of suspended spheres.","### Features","- **Elastic Collisions**: Restitution is set to `1.0` to ensure near-perfect energy conservation during impacts.","- **Distance Constraints**: Each sphere is suspended by a `DistanceJoint` connected to a fixed anchor point.","- **Low Friction**: Friction is set to zero to allow the pendulum motion to persist for a long duration.","The first ball is released from an offset to initiate the chain reaction. Click **Reset** to restart the sequence."].join(`

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
	}`,onInit:e=>{e.clear(),e.setGravity(0,9.8),n.debug.showAabbs=!1;const t=5,o=.4,i=2,a=4,s=5;for(let r=0;r<t;r++){const l=s+(r-(t-1)/2)*o*2.01,c=1e3+r,m=2e3+r,x=e.createBody({id:c,x:l,y:i,type:n.bodyTypes.FIXED_OBJECT,color:"#555"});x.createFixture({id:c,shape:n.shapes.BOX,width:.2,height:.2,maskBits:0});const f=r===0?l-3:l,h=r===0?i+Math.sqrt(a*a-9):i+a,d=e.createBody({id:m,x:f,y:h,mass:1,color:r===0||r===t-1?"#a855f7":"#00f2ff",linearDamping:0,angularDamping:0});d.createFixture({id:m,shape:n.shapes.CIRCLE,radius:o,restitution:1,sFriction:0,kFriction:0}),e.createDistanceJoint(x,d,{id:3e3+r,length:a,anchorA:{x:0,y:0},anchorB:{x:0,y:0}})}}}),Ht=[dt,Ot,Rt,lt,Jt],_t=!["localhost","127.0.0.1"].includes(window.location.hostname),be=[{name:"Showcase",examples:Ht},{name:"General",examples:Ct},{name:"Constraints",examples:Tt},{name:"Optimizations",examples:At},{name:"Stress Tests",examples:Mt},{name:"Known Issues",examples:kt}].filter(e=>!_t||e.name!=="Known Issues");let Pt=`
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
`.trim();const _e=()=>window.innerWidth<=768;let K={},j=null;function jt(){const e=document.getElementById("examples-list");e.innerHTML="",be.forEach((t,o)=>{const i=document.createElement("li");i.className="section",i.textContent=t.name,e.appendChild(i),t.examples&&Array.isArray(t.examples)&&t.examples.forEach((a,s)=>{const r=a.key||`${o}-${s}`;K[r]={category:o,index:s,example:a};const l=document.createElement("li");l.className="example",l.textContent=a.name,l.setAttribute("data-example",r),e.appendChild(l)})}),document.querySelectorAll("#sidebar li.example").forEach(t=>{t.addEventListener("click",()=>{document.querySelectorAll("#sidebar li.example.selected").forEach(i=>{i.classList.remove("selected")}),t.classList.add("selected");const o=t.getAttribute("data-example");On(o,"push"),_e()&&le.classList.add("collapsed")})})}let S,ht=document.getElementById("example-name"),ne=document.getElementById("debug-canvas"),vn=document.getElementById("code-section"),Gt=document.getElementById("general-code"),Yt=document.getElementById("init-code"),zt=document.getElementById("tick-code"),Nt=document.getElementById("render-code"),xe=document.getElementById("toggle-code"),Wt=document.getElementById("fps"),nt=document.getElementById("memory"),$t=document.getElementById("step-time"),tt=document.querySelectorAll(".code-tab"),Ut=document.querySelectorAll(".code-panel"),pt=document.getElementById("sidebar-toggle"),le=document.getElementById("sidebar"),qt=document.getElementById("reset-button"),Vt=document.getElementById("reset-button-mobile"),ot=document.getElementById("info-toggle"),at=document.getElementById("info-toggle-mobile");ht.innerHTML="Loading example...";let V=0,Fn=[],Mn=[],kn=[],Qe=1e3/60,en=0,st=0;n.init().then(()=>{S=n.createWorld(),n.debug.enableDebugGraphics(ne,S);let e=performance.now(),t=0;const o=1/60;function i(d){let p=(d-e)/1e3;e=d,p>.25&&(p=.25),t+=p;const u=performance.now();for(;t>=o;){if(S.step(),j&&K[j]){const k=K[j].example;k&&typeof k.onTick=="function"&&k.onTick(S,o)}t-=o}if(S.interpolationAlpha=t/o,j&&K[j]){const k=K[j].example;k&&typeof k.onRender=="function"&&k.onRender(S)}const b=(performance.now()-u)*1e3;let y=Fn[V%100]??Qe,B=Mn[V%100]??0,I=kn[V%100]??0;Fn[V%100]=p*1e3||16.67,Mn[V%100]=S?S.getMemoryUsage():0,kn[V%100]=b,Qe+=(Fn[V%100]-y)/100,en+=(Mn[V%100]-B)/100,st+=(kn[V%100]-I)/100,V++;const C=Qe>0?Math.round(1e3/Qe):0;Wt.innerHTML=`<i class="fas fa-tachometer-alt"></i>Render FPS: ${C}`,en<1048576?nt.innerHTML=`<i class="fas fa-memory"></i>Memory: ${(en/1024).toFixed(2)} KB`:nt.innerHTML=`<i class="fas fa-memory"></i>Memory: ${(en/1048576).toFixed(2)} MB`,$t.innerHTML=`<i class="fas fa-stopwatch"></i>Step Time: ${st.toFixed(0)} μs`,requestAnimationFrame(i)}jt(),yt(!0);const a=()=>{j&&On(j,"none")};qt.addEventListener("click",a),Vt.addEventListener("click",a);const s=()=>{document.body.classList.toggle("info-mode");const d=document.body.classList.contains("info-mode"),p=d?"fa-th-large":"fa-info-circle",u=d?"Show Canvas":"Info";[ot,at].forEach(g=>{const b=g.querySelector("i"),y=g.querySelector(".button-text");b&&(b.className=`fas ${p}`),y&&(y.textContent=u),g.title=d?"Show Canvas":"Show Information"}),d||n.debug.centerCamera(5,5)};ot.addEventListener("click",s),at.addEventListener("click",s),requestAnimationFrame(i),_e()&&le.classList.add("collapsed"),ne.addEventListener("wheel",d=>{d.preventDefault();const p=.05,u=d.offsetX,g=d.offsetY,b=(u-n.debug.offsetX)/n.debug.zoom,y=(g-n.debug.offsetY)/n.debug.zoom,B=-Math.sign(d.deltaY),I=Math.pow(1+p,B),C=Math.min(Math.max(n.debug.zoom*I,.1),10);n.debug.zoom=C,n.debug.offsetX=u-b*n.debug.zoom,n.debug.offsetY=g-y*n.debug.zoom},{passive:!1});let r=!1,l=0,c=0;ne.addEventListener("mousedown",d=>{d.button===2&&(r=!0,l=d.clientX,c=d.clientY)}),window.addEventListener("mousemove",d=>{if(r){const p=d.clientX-l,u=d.clientY-c;n.debug.offsetX+=p,n.debug.offsetY+=u,l=d.clientX,c=d.clientY}}),window.addEventListener("mouseup",d=>{d.button===2&&(r=!1)}),ne.addEventListener("contextmenu",d=>{d.preventDefault()});let m=0,x=!1,f=0,h=0;ne.addEventListener("touchstart",d=>{if(d.touches.length===1)f=d.touches[0].clientX,h=d.touches[0].clientY,x=!1;else if(d.touches.length===2){x=!0;const p=d.touches[0].clientX-d.touches[1].clientX,u=d.touches[0].clientY-d.touches[1].clientY;m=Math.sqrt(p*p+u*u)}},{passive:!1}),ne.addEventListener("touchmove",d=>{if(d.touches.length!==0){if(d.preventDefault(),d.touches.length===1&&!x){const p=d.touches[0].clientX,u=d.touches[0].clientY,g=p-f,b=u-h;n.debug.offsetX+=g,n.debug.offsetY+=b,f=p,h=u}else if(d.touches.length===2){const p=d.touches[0],u=d.touches[1],g=p.clientX-u.clientX,b=p.clientY-u.clientY,y=Math.sqrt(g*g+b*b);if(m>0){const B=y/m,I=Math.min(Math.max(n.debug.zoom*B,.1),10),C=(p.clientX+u.clientX)/2,k=(p.clientY+u.clientY)/2,R=ne.getBoundingClientRect(),X=C-R.left,ae=k-R.top,_=(X-n.debug.offsetX)/n.debug.zoom,Y=(ae-n.debug.offsetY)/n.debug.zoom;n.debug.zoom=I,n.debug.offsetX=X-_*n.debug.zoom,n.debug.offsetY=ae-Y*n.debug.zoom}m=y}}},{passive:!1}),ne.addEventListener("touchend",d=>{d.touches.length<2&&(x=!1,m=0),d.touches.length===1&&(f=d.touches[0].clientX,h=d.touches[0].clientY)},{passive:!1}),ne.addEventListener("touchcancel",d=>{x=!1,m=0},{passive:!1})});function On(e,t="push"){if(!S||!K[e])return;if(j&&K[j]){const x=K[j].example;x&&typeof x.cleanup=="function"&&x.cleanup(S)}const o="#"+e;window.location.hash!==o&&(t==="push"?history.pushState(null,"",o):t==="replace"&&history.replaceState(null,"",o)),S.clear(),n.debug.clearLabels(),n.debug.showForceVectors=!0,n.debug.showImpulseVectors=!0,S.setHasPenetrationResolution(!0),S.setHasRestitution(!0),S.setHasFriction(!0),S.setGravity(0,0),n.debug.zoom=1,n.debug.centerCamera(5,5),n.debug.showAabbs=!0,j=e;const a=K[e].example;a&&typeof a.onInit=="function"?a.onInit(S):console.error("Example onInit method not found:",a);function s(x,f){if(!x)return`function ${f}${f==="tick"?"(dt)":"()"} {}`;let h=x.split("	").join("    ");const d=[/^\(world\)\s*=>\s*\{/,/^\(world,\s*dt\)\s*=>\s*\{/,/^function\s*\(world\)\s*\{/,/^function\s*\(world,\s*dt\)\s*\{/,/^function\s+init\s*\(world\)\s*\{/,/^function\s+tick\s*\(world,\s*dt\)\s*\{/,/^function\s+render\s*\(world\)\s*\{/];let p=!1,u=h.trim();for(const y of d)if(y.test(u)){h=u.replace(y,`function ${f}${f==="tick"?"(dt)":"()"} {`),p=!0;break}p||(h=u.replace(/^.*?=>\s*\{/,`function ${f}${f==="tick"?"(dt)":"()"} {`));let g=h.split(`
`);if(g.length<=1)return h;let b=1/0;for(let y=1;y<g.length;y++){const B=g[y];if(B.trim().length===0)continue;const I=B.search(/\S/);I!==-1&&I<b&&(b=I)}return b===1/0&&(b=0),g.map((y,B)=>B===0?y:y.substring(Math.min(y.length,b))).join(`
`)}let r=a.globalLines?.join(`
`)??"",l=a.onInitRaw||a.onInit?.toString()||"",c=a.onTickRaw||a.onTick?.toString()||"",m=a.onRenderRaw||a.onRender?.toString()||"";Gt.textContent=Pt.split("{{GLOBAL}}").join(r),Yt.textContent=s(l,"init"),zt.textContent=s(c,"tick"),Nt.textContent=s(m,"render"),ut(),ht.textContent=a.name||"Unknown Example",document.getElementById("description").innerHTML=ft.parse(a.description||"")}function yt(e=!1){let t=window.location.hash.substring(1);const o=!t;if(t||(t="sandbox"),!K[t]){console.log("Example not found directly, searching...");let a=!1;for(let s=0;s<be.length;s++){const r=be[s];if(r.examples&&Array.isArray(r.examples)){for(let l=0;l<r.examples.length;l++)if(r.examples[l].key===t){console.log(`Found example ${t} in category ${s}, index ${l}`),a=!0;break}}if(a)break}if(!a)if(console.warn(`Example with key '${t}' not found, defaulting to first available example`),be.length>0&&be[0].examples&&be[0].examples.length>0)t=be[0].examples[0].key||"0-0";else{console.error("No examples found");return}}const i=document.querySelector(`#sidebar li.example[data-example="${t}"]`);i&&(document.querySelectorAll("#sidebar li.example.selected").forEach(a=>{a.classList.remove("selected")}),i.classList.add("selected")),On(t,o&&e?"replace":"none")}tt.forEach(e=>{e.addEventListener("click",()=>{tt.forEach(o=>o.classList.remove("active")),Ut.forEach(o=>o.classList.remove("active")),e.classList.add("active"),document.getElementById(`${e.dataset.panel}-panel`).classList.add("active")})});function ut(){document.querySelectorAll("pre").forEach(t=>{const o=t.textContent;t.innerHTML=hljs?.highlight(o,{language:"javascript"}).value})}xe.addEventListener("click",()=>{vn.style.display==="none"?(vn.style.display="block",xe.querySelector("span").textContent="Hide Code",xe.querySelector("i").classList.remove("fa-chevron-down"),xe.querySelector("i").classList.add("fa-chevron-up"),ut()):(vn.style.display="none",xe.querySelector("span").textContent="Show Code",xe.querySelector("i").classList.remove("fa-chevron-up"),xe.querySelector("i").classList.add("fa-chevron-down"))});pt.addEventListener("click",()=>{le.classList.toggle("collapsed")});window.addEventListener("resize",()=>{_e()||document.body.classList.remove("info-mode"),_e()&&!le.classList.contains("collapsed")&&le.classList.add("collapsed")});window.addEventListener("click",e=>{_e()&&!le.classList.contains("collapsed")&&!le.contains(e.target)&&e.target!==pt&&le.classList.add("collapsed")});const Je=document.getElementById("copy-code");Je.addEventListener("click",()=>{const t=document.querySelector(".code-panel.active").querySelector("pre").textContent;navigator.clipboard.writeText(t).then(()=>{const o=Je.querySelector("span"),i=Je.querySelector("i"),a=o.textContent;Je.classList.add("success"),o.textContent="Copied!",i.classList.remove("fa-copy"),i.classList.add("fa-check"),setTimeout(()=>{Je.classList.remove("success"),o.textContent=a,i.classList.remove("fa-check"),i.classList.add("fa-copy")},2e3)})});window.addEventListener("popstate",function(e){yt(!1)});
