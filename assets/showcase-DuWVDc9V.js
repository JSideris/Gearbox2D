import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css                        */import{g as o,N as zt,a as yt}from"./engine-C8WFJcP3.js";import{M as Nt}from"./markdown-oLTTx95D.js";class v{constructor(t){this.onInit=t.onInit,this.onInitRaw=t.onInitRaw,this.onTick=t.onTick,this.onTickRaw=t.onTickRaw,this.onRender=t.onRender,this.onRenderRaw=t.onRenderRaw,this.onCleanup=t.onCleanup,this.description=t.description,this.name=t.name,this.key=t.key,this.globalLines=t.globalLines||[]}init(t){this.onInit?.(t)}tick(t,n){this.onTick?.(t,n)}render(t){this.onRender?.(t)}cleanup(t){this.onCleanup?.(t)}}let O=1,Ln=0,ge=null,gn=null,ke=null;const Ft=(e,t)=>({x:(e-o.debug.offsetX)/(o.debug.zoom*100),y:(t-o.debug.offsetY)/(o.debug.zoom*100)}),Wt=(e,t)=>{if(e.button!==0)return;const n=ke.getBoundingClientRect(),s=Ft(e.clientX-n.left,e.clientY-n.top),a=t.queryBodiesAtPoint(s.x,s.y);if(a.length>0){const i=a[0],d=t.getBodyById(i);d&&d.type!==o.bodyTypes.FIXED_OBJECT&&(ge=t.createBody({id:999999,x:s.x,y:s.y,type:o.bodyTypes.FIXED_OBJECT,color:"transparent"}),ge.createFixture({id:999999,shape:o.shapes.CIRCLE,radius:.05,maskBits:0}),gn=t.createSpringJoint(ge,d,{id:999998,worldAnchor:s,frequencyHz:3,dampingRatio:1,length:0}))}},qt=e=>{if(ge){const t=ke.getBoundingClientRect(),n=Ft(e.clientX-t.left,e.clientY-t.top);ge.x=n.x,ge.y=n.y}},$t=(e,t)=>{gn&&(t.removeJoint(gn.id),gn=null),ge&&(t.removeObject(ge.id),ge=null)},Ut=[new v({name:"Interactive Sandbox",key:"sandbox",description:["Welcome to **Gearbox2D**! This is an interactive playground featuring various shapes and physics properties. Click and drag objects to interact with them.","### Features","- **Point Query**: The engine detects which object is under the mouse using **BVH** and precise shape tests.","- **Mouse Joint**: Uses a `SpringJoint` to pull objects toward the mouse cursor.","- **Capsules**: New capsule shapes are supported with proper collision and mass properties.","- **Multi-Fixture Bodies**: Some objects are composed of multiple shapes (circles and boxes) attached to a single body.","- **Jointed Compounds**: Some objects are connected by **Hinge**, **Distance**, and **Spring** joints to create complex assemblies.","- **Collision Filtering**: The mouse 'anchor' object is a sensor that doesn't collide with other objects."].join(`

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
		}`,onInit:e=>{e.clear(),o.debug.showAabbs=!1,o.debug.showForceVectors=!1,O=1,e.setGravity(0,9.8),e.setHasRestitution(!0),e.setHasFriction(!0);const t=1,n=9.2,a=9+t*2,i=n+t*2;e.createBody({id:O++,x:5,y:9+t/2,type:o.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:o.shapes.AABB,width:i,height:t}),e.createBody({id:O++,x:5,y:0-t/2,type:o.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:o.shapes.AABB,width:i,height:t}),e.createBody({id:O++,x:5-n/2-t/2,y:4.5,type:o.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:o.shapes.AABB,width:t,height:a}),e.createBody({id:O++,x:5+n/2+t/2,y:4.5,type:o.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:o.shapes.AABB,width:t,height:a});const d=["#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff","#ff8844","#88ff44","#4488ff"],r=8,c=4,l=1,h=1,p=5-(r-1)*l/2,u=1.8;for(let g=0;g<c;g++)for(let x=0;x<r;x++){const f=p+x*l+(Math.random()-.5)*.2,I=u+g*h+(Math.random()-.5)*.2,b=d[(g*r+x)%d.length],w={x:f,y:I,mass:.5+Math.random()*1.5,color:b,linearDamping:.5,angularDamping:1.5},B=Math.random();if(B<.25)e.createBody({id:O++,...w,r:Math.random()*Math.PI}).createFixture({shape:o.shapes.CIRCLE,radius:.1+Math.random()*.3});else if(B<.5)e.createBody({id:O++,...w,r:Math.random()*Math.PI}).createFixture({shape:o.shapes.BOX,width:.2+Math.random()*.6,height:.2+Math.random()*.6});else if(B<.75){const C=.1+Math.random()*.1;e.createBody({id:O++,...w,r:Math.random()*Math.PI}).createFixture({shape:o.shapes.CAPSULE,radius:C,height:C*2+.2+Math.random()*.4})}else{const C=Math.random();let M;if(C<.4){const F=3+Math.floor(Math.random()*5);M=o.polygon.makeRegularPolygon(F,.2+Math.random()*.2)}else if(C<.8){const F=5+Math.floor(Math.random()*3),S=.3+Math.random()*.2;M=o.polygon.makeStar(F,S,S*.5)}else M=[{x:0,y:-.4},{x:.35,y:-.15},{x:.2,y:.3},{x:-.2,y:.3},{x:-.35,y:-.15}];e.createBody({id:O++,...w,r:Math.random()*Math.PI}).createFixture({shape:o.shapes.POLYGON,vertices:M})}}for(let g=0;g<6;g++){const x=1.5+Math.random()*7,f=5.5+Math.random()*1.5,I=d[Math.floor(Math.random()*d.length)],b=e.createBody({id:O++,x,y:f,mass:1+Math.random()*3,color:I,linearDamping:.5,angularDamping:1}),w=2+Math.floor(Math.random()*4);for(let B=0;B<w;B++){const C=Math.random(),M=(Math.random()-.5)*1.2,F=(Math.random()-.5)*1.2;C<.4?b.createFixture({shape:o.shapes.CIRCLE,radius:.1+Math.random()*.25,localX:M,localY:F}):b.createFixture({shape:o.shapes.BOX,width:.2+Math.random()*.5,height:.2+Math.random()*.5,localX:M,localY:F,localR:Math.random()*Math.PI})}}const y=["hinge","distance","spring"];for(let g=0;g<8;g++){const x=1.5+Math.random()*6,f=7.5+Math.random()*1,I=y[Math.floor(Math.random()*y.length)],b=d[Math.floor(Math.random()*d.length)],w=e.createBody({id:O++,x,y:f,mass:.5+Math.random(),color:b,linearDamping:.5,angularDamping:.5});Math.random()<.5?w.createFixture({shape:o.shapes.CIRCLE,radius:.15+Math.random()*.2}):w.createFixture({shape:o.shapes.BOX,width:.3+Math.random()*.4,height:.3+Math.random()*.4});const C=e.createBody({id:O++,x:x+.5+Math.random()*.5,y:f+(Math.random()-.5)*.5,mass:.5+Math.random(),color:b,linearDamping:.5,angularDamping:.5});Math.random()<.5?C.createFixture({shape:o.shapes.CIRCLE,radius:.15+Math.random()*.2}):C.createFixture({shape:o.shapes.BOX,width:.3+Math.random()*.4,height:.3+Math.random()*.4}),I==="hinge"?e.createHingeJoint(w,C,{id:O++,worldAnchor:{x:(w.x+C.x)/2,y:(w.y+C.y)/2}}):I==="distance"?e.createDistanceJoint(w,C,{id:O++,anchorA:{x:0,y:0},anchorB:{x:0,y:0}}):e.createSpringJoint(w,C,{id:O++,anchorA:{x:0,y:0},anchorB:{x:0,y:0},frequencyHz:2+Math.random()*4,dampingRatio:.5+Math.random()*.5})}ke=document.getElementById("debug-canvas"),e._mouseDownHandler&&ke.removeEventListener("mousedown",e._mouseDownHandler),e._mouseMoveHandler&&window.removeEventListener("mousemove",e._mouseMoveHandler),e._mouseUpHandler&&window.removeEventListener("mouseup",e._mouseUpHandler),e._mouseDownHandler=g=>Wt(g,e),e._mouseMoveHandler=g=>qt(g),e._mouseUpHandler=g=>$t(g,e),ke.addEventListener("mousedown",e._mouseDownHandler),window.addEventListener("mousemove",e._mouseMoveHandler),window.addEventListener("mouseup",e._mouseUpHandler)},onCleanup:e=>{ke&&(ke.removeEventListener("mousedown",e._mouseDownHandler),window.removeEventListener("mousemove",e._mouseMoveHandler),window.removeEventListener("mouseup",e._mouseUpHandler),delete e._mouseDownHandler,delete e._mouseMoveHandler,delete e._mouseUpHandler)},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{o.debug.clearLabels(),o.debug.addLabel({text:"Interactive Sandbox",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"}),o.debug.addLabel({text:"Click and drag objects!",x:5,y:1.2,fontSize:"16px Arial",color:"#888",position:"on-top"})}}),new v({name:"Force",key:"force",description:["**Forces** are used to apply acceleration to objects which scale inversely with the object's mass. All forces applied to an object are accumulated and applied in the next world step where they are reset.","Persistent forces must be reapplied on each fixed update (every `tick`).","It's important to note that the change in velocity will be a function of the **force vector**, the object's **mass**, and the **time step**. If you need a specific instantaneous change in velocity, use an **Impulse** instead."].join(`

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
		}`,onInit:e=>{e.createBody({id:1,x:5,y:2.5,vx:5,r:Math.PI/2*Math.random(),rs:5,mass:.1,angularDamping:0,linearDamping:0}).createFixture({shape:o.shapes.CIRCLE,radius:.3}),e.createBody({id:2,x:5,y:5,r:Math.PI/2*Math.random(),rs:.1,type:o.bodyTypes.KINEMATIC_OBJECT,angularDamping:0}).createFixture({shape:o.shapes.CIRCLE,radius:1,isSensor:!0})},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{let n=e.bodiesById[1],s=e.bodiesById[2],a=s.x-n.x,i=s.y-n.y,d=Math.sqrt(a*a+i*i);a/=d,i/=d;const r=2;n.applyForce(a*r,i*r)}}),new v({name:"Impulse",key:"impulse",description:["**Impulses** are used to apply a sudden change in momentum to an object. It's similar to a force, but modifies the object's velocity **instantaneously**, rather than acting as a persistent push.","In this example we demonstrate both **Linear** and **Angular** impulses.","- The two circles receive vertical linear impulses.","- The box receives periodic angular impulses (torque) causing it to spin without moving its center."].join(`

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
		}`,onInit:e=>{e.createBody({id:1,x:2.5,y:5,r:Math.PI/2*Math.random(),mass:1,linearDamping:.1}).createFixture({shape:o.shapes.CIRCLE,radius:.3}),e.createBody({id:2,x:5,y:5,r:Math.PI/2*Math.random(),mass:2,linearDamping:.02}).createFixture({shape:o.shapes.CIRCLE,radius:.6}),e.createBody({id:3,x:7.5,y:5,mass:100,linearDamping:.05,angularDamping:.05}).createFixture({shape:o.shapes.BOX,width:1,height:.3})},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{let n=e.bodiesById[1],s=e.bodiesById[2],a=e.bodiesById[3],i=Ln;Ln+=t*5;let d=Math.floor(i),r=Math.floor(Ln);if(d!=r){if(r%2==0){let c=(5-n.y)*.2;c<.05&&c>-.05&&(c=2),n.applyImpulse(0,c),s.applyImpulse(0,c)}r%3==0&&a.applyAngularImpulse(2)}}}),new v({name:"Bounce",key:"bounce",description:["This example demonstrates **Restitution** (bounciness).","The central ball is configured with `restitution: 1.0`, meaning it loses no energy during collisions with the fixed walls, creating a perfectly elastic bounce.","Gearbox2D handles restitution differently than many other engines to prevent numerical energy gain. Check out the documentation to learn more about **Kinematic Restitution Balancing**."].join(`

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
		}`,onInit:e=>{e.setGravity(0,10),e.createBody({id:1,x:5,y:0,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.AABB,width:11,height:2,restitution:1}),e.createBody({id:2,x:5,y:10,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.AABB,width:11,height:2,restitution:1}),e.createBody({id:3,x:0,y:5,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.AABB,width:2,height:11,restitution:1}),e.createBody({id:4,x:10,y:5,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.AABB,width:2,height:11,restitution:1}),e.createBody({id:5,x:5,y:2,vx:(Math.random()<.5?-1:1)*(1.5+Math.random()*1.5),r:Math.PI/2*Math.random(),type:o.bodyTypes.DYNAMIC_OBJECT,mass:.5,linearDamping:0,rs:-2+Math.random()*4}).createFixture({shape:o.shapes.CIRCLE,radius:.75,restitution:1})},onTickRaw:`(world, dt) => {
			// The engine does all the work. Nothing to do here!
		}`,onTick:(e,t)=>{}}),new v({name:"Collisions",key:"collisions",description:["Collisions are enabled for objects whose type is set to `DYNAMIC_OBJECT`.","In this example we can see collisions between all of the different supported shape types:","- **CIRCLE**: Optimized circular collisions.","- **BOX**: Oriented bounding boxes with full rotation support.","- **AABB**: Axis-aligned bounding boxes.","- **CAPSULE**: 2D capsules with robust collision detection.","- **POINT**: Zero-radius points that collide with larger shapes."].join(`

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
		}`,onTick:(e,t)=>{if(Math.random()<.08){let n=.1+Math.random()*.4,s=1;Math.random()<.5&&(s=-1);let a=.2+n*n*.8,i=.1+Math.random()*(a-.1),d=a*a/i,r=Math.random(),c,l=n;if(r<.1)c=o.shapes.POINT,l=.01;else if(r<.2)c=o.shapes.AABB;else if(r<.45)c=o.shapes.BOX;else if(r<.7){c=o.shapes.CAPSULE;let y=i*.5;a=y,i=Math.max(y*2+.1,d)}else r<.85?c=o.shapes.POLYGON:c=o.shapes.CIRCLE;const h=O++,p=e.createBody({id:h,x:5-s*5,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*s,vy:-8-Math.random()*2,type:o.bodyTypes.DYNAMIC_OBJECT,mass:l,linearDamping:0});if(c===o.shapes.POLYGON){const y=Math.random();let g;const x=.2+Math.random()*.3;if(y<.6){const f=3+Math.floor(Math.random()*5);g=o.polygon.makeRegularPolygon(f,x)}else{const f=5+Math.floor(Math.random()*3);g=o.polygon.makeStar(f,x,x*.5)}p.createFixture({shape:c,vertices:g})}else p.createFixture({shape:c,radius:c===o.shapes.BOX||c===o.shapes.AABB?d:a,height:c===o.shapes.BOX||c===o.shapes.AABB||c===o.shapes.CAPSULE?i:0});e.getBodyCount();let u=[];e.iterateBodies(y=>{y.y>10.5&&u.push(y)});for(let y of u)e.removeObject(y.id)}}}),new v({name:"Friction",key:"friction",description:["**Friction** is applied as the last step of collision resolution. It handles both **static** and **dynamic** friction, applied as impulses at the point of contact.","Take note of the blue impulse vectors on the platforms which are present when dynamic friction is being applied.","### Scenarios","1. **Reverse Roll**: A circle spinning counter-clockwise transfers its angular momentum to linear momentum upon contact.","2. **Forward Roll**: A spinning circle with no linear momentum begins rolling forward due to friction.","3. **Slide**: A box slides across the platform and grinds to a halt.","4. **Static vs Kinetic**: Two boxes slide down a ramp. The left box has high static friction and stops; the right has no static friction and keeps sliding."].join(`

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
		}`,onInit:e=>{e.setGravity(0,10);let t=1;const n=["Linear to angular momentum transfer.","Angular to linear momentum transfer.","Slide to halt."];for(;t<=3;t++)e.createBody({id:t,x:4.5,y:2.5*t-.5,type:o.bodyTypes.FIXED_OBJECT,mass:1}).createFixture({shape:o.shapes.AABB,width:9,height:1}),o.debug.addLabel({text:n[t-1],x:4.5,y:2.5*t-1.2,fontSize:"20px Arial",color:"#00f2ff",position:"above"});const s=t++;e.createBody({id:s,x:4.5,y:9.7,r:.1,type:o.bodyTypes.FIXED_OBJECT,mass:1}).createFixture({shape:o.shapes.BOX,width:9,height:1}),o.debug.addLabel({text:"High static vs no static friction.",x:4.5,y:9,fontSize:"20px Arial",color:"#00f2ff",position:"above"});const a=t++;e.createBody({id:a,x:0,y:1,vx:5,rs:-8,type:o.bodyTypes.DYNAMIC_OBJECT,mass:.5}).createFixture({shape:o.shapes.CIRCLE,radius:.5,kFriction:.8,sFriction:.5}),o.debug.addLabel({text:"Reverse",objectId:a,position:"above",fontSize:"10px Arial"});const i=t++;e.createBody({id:i,x:.5,y:3.5,rs:15,type:o.bodyTypes.DYNAMIC_OBJECT,mass:.5}).createFixture({shape:o.shapes.CIRCLE,radius:.5,kFriction:.2,sFriction:.5}),o.debug.addLabel({text:"Forward",objectId:i,position:"above",fontSize:"10px Arial"});const d=t++;e.createBody({id:d,x:.5,y:6,vx:7,type:o.bodyTypes.DYNAMIC_OBJECT,mass:.5}).createFixture({shape:o.shapes.BOX,width:1,height:1,kFriction:.27,sFriction:.5}),o.debug.addLabel({text:"Slide",objectId:d,position:"above",fontSize:"10px Arial"});const r=t++;e.createBody({id:r,x:.5,y:8,vx:.5,type:o.bodyTypes.DYNAMIC_OBJECT,mass:.5}).createFixture({shape:o.shapes.BOX,width:1,height:.5,kFriction:.7,sFriction:.7}),o.debug.addLabel({text:"Static",objectId:r,position:"above",fontSize:"10px Arial"});const c=t++;e.createBody({id:c,x:1.6,y:8,vx:.5,type:o.bodyTypes.DYNAMIC_OBJECT,mass:.5}).createFixture({shape:o.shapes.BOX,width:1,height:.5,kFriction:.01,sFriction:0}),o.debug.addLabel({text:"Kinetic",objectId:c,position:"above",fontSize:"10px Arial"})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new v({name:"Collision Masks",key:"collision-masks",description:["**Collision masks** allow you to selectively enable or disable collisions between different groups of objects using bitwise logic.","In this example:","- **Blue objects**: Only collide with blue platforms and other blue objects.","- **Red objects**: Only collide with red platforms and other red objects.","- **Green objects**: Collide with **everything**.","This is implemented using `categoryBits` and `maskBits` properties."].join(`

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
		}`,onInit:e=>{e.setGravity(0,10),o.debug.showForceVectors=!1;const t=O++;e.createBody({id:t,x:2.5,y:8,type:o.bodyTypes.FIXED_OBJECT,color:"#00f2ff"}).createFixture({width:4,height:.5,shape:o.shapes.AABB,categoryBits:1,maskBits:5}),o.debug.addLabel({text:"Collides with Blue & Green",objectId:t,color:"#00f2ff",position:"below"});const n=O++;e.createBody({id:n,x:7.5,y:8,type:o.bodyTypes.FIXED_OBJECT,color:"#ff4444"}).createFixture({width:4,height:.5,shape:o.shapes.AABB,categoryBits:2,maskBits:6}),o.debug.addLabel({text:"Collides with Red & Green",objectId:n,color:"#ff4444",position:"below"});const s=O++;e.createBody({id:s,x:5,y:4,type:o.bodyTypes.FIXED_OBJECT,color:"#44ff44"}).createFixture({width:2,height:.5,shape:o.shapes.AABB,categoryBits:4,maskBits:7}),o.debug.addLabel({text:"Collides with All",objectId:s,color:"#44ff44",position:"below"})},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{if(Math.random()<.05){const s=O++,a=Math.floor(Math.random()*3);let i,d,r;a===0?(i="#00f2ff",d=1,r=5):a===1?(i="#ff4444",d=2,r=6):(i="#44ff44",d=4,r=7),e.createBody({id:s,x:2+Math.random()*6,y:0,type:o.bodyTypes.DYNAMIC_OBJECT,mass:1,color:i}).createFixture({radius:.3,shape:o.shapes.CIRCLE,categoryBits:d,maskBits:r}),o.debug.addLabel({text:`Cat:0x${d.toString(16)} Mask:0x${r.toString(16)}`,objectId:s,color:i,position:"above",fontSize:"10px Arial"})}let n=[];e.iterateBodies(s=>{s.y>11&&n.push(s)});for(let s of n)e.removeObject(s.id)}}),new v({name:"Object Types",key:"object-types",description:["This example showcases the four fundamental object types in **Gearbox2D** and how they interact:","1. **Fixed Objects** (Gray): Immovable platforms with infinite mass. They form the static environment.","2. **Kinematic Objects** (Purple): Move via velocity but are unaffected by forces. They can 'push' other objects but are never pushed back.","3. **Rigid Bodies** (Colorful): Fully dynamic objects affected by gravity, forces, and collisions.","4. **Sensors** (Green Zone): Detect overlaps without causing a physical response. Here, a sensor acts as a **Recycling Zone** to remove objects."].join(`

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
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),o.debug.showForceVectors=!1,o.debug.showAabbs=!1,O=1,e.createBody({id:O++,x:5,y:9.7,type:o.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:o.shapes.BOX,width:8,height:.6}),e.createBody({id:O++,x:1,y:7,type:o.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({width:.2,height:6,shape:o.shapes.BOX}),e.createBody({id:O++,x:9,y:7,type:o.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({width:.2,height:6,shape:o.shapes.BOX});const t=e.createBody({id:O++,x:5,y:4,type:o.bodyTypes.KINEMATIC_OBJECT,color:"#a0f",rs:1.5});t.createFixture({width:3.5,height:.3,shape:o.shapes.BOX}),o.debug.addLabel({text:"Kinematic Rotor",objectId:t.id,position:"above",color:"#a0f"});const n=e.createBody({id:O++,x:2.5,y:7,type:o.bodyTypes.KINEMATIC_OBJECT,color:"#a0f",vx:1});n.createFixture({width:1.5,height:.3,shape:o.shapes.BOX}),e.elevator=n,o.debug.addLabel({text:"Kinematic Elevator",objectId:n.id,position:"above",color:"#a0f"});const s=O++,a=e.createBody({id:s,x:5,y:8.8,type:o.bodyTypes.FIXED_OBJECT,color:"rgba(0, 255, 100, 0.15)",wantsEvents:!0});a.createFixture({width:4,height:1.2,shape:o.shapes.BOX,isSensor:!0}),o.debug.addLabel({text:"Sensor Recycler",objectId:a.id,position:"on-top",color:"#4f4"}),e.recyclerId=a.id,e.toRemove=new Set,e.onCollisionStart=(i,d)=>{const r=e.recyclerId,c=i===r?d:d===r?i:null;if(c!==null){const l=e.getBodyById(c);l&&l.type===o.bodyTypes.DYNAMIC_OBJECT&&(e.toRemove.add(c),l.color="#4f4")}}},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{const n=e.elevator;if(n&&(n.x>7.5&&(n.vx=-1.5),n.x<2.5&&(n.vx=1.5)),e.stepCount%20===0){const i=["#ff4444","#4444ff","#ffff44","#ff44ff","#44ffff"],d=Math.random(),r=3+Math.random()*4,c=O++,l=e.createBody({id:c,x:r,y:.5,mass:.5+Math.random()*1,type:o.bodyTypes.DYNAMIC_OBJECT,color:i[Math.floor(Math.random()*i.length)]});d<.33?l.createFixture({shape:o.shapes.CIRCLE,radius:.25,restitution:.3}):d<.66?l.createFixture({shape:o.shapes.BOX,width:.5,height:.5,restitution:.3}):l.createFixture({shape:o.shapes.CAPSULE,radius:.15,height:.6,restitution:.3})}const s=e.toRemove;if(s&&s.size>0){for(const i of s)e.getBodyById(i)&&e.removeObject(i);s.clear()}let a=[];e.iterateBodies(i=>{(i.y>11||i.y<-5||i.x>11||i.x<-1)&&i.type===o.bodyTypes.DYNAMIC_OBJECT&&a.push(i.id)});for(const i of a)e.removeObject(i)},onCleanup:e=>{e.onCollisionStart=void 0,delete e.elevator,delete e.recyclerId,delete e.toRemove}})];let T=1,Te=[],Se=null,te=null,je=null,ce=null,oe=null,Ye=0,ze=0;const Vt=[new v({name:"Simple Hinge",key:"simple-hinge",description:["A single `BOX` object attached to a `FIXED_OBJECT` by a **Hinge Joint** constraint.","The hinge allows rotation around a single point while preventing all linear relative motion. In this case, it creates a simple gravity-driven pendulum."].join(`

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
		}`,onInit:e=>{T=1;const t=T++,n=e.createBody({id:t,x:5,y:3,type:o.bodyTypes.FIXED_OBJECT,color:"#ff4444"});n.createFixture({shape:o.shapes.BOX,width:1,height:1});const s=T++,a=e.createBody({id:s,x:8,y:3,mass:.1,color:"#44ff44"});a.createFixture({shape:o.shapes.BOX,width:4,height:.5}),e.createHingeJoint(n,a,{id:T++,worldAnchor:{x:5,y:3}}),e.setGravity(0,9.81)}}),new v({name:"Breakable Joint",key:"breakable-joint",description:["This demo showcases **Joint Reaction Forces** and dynamic joint removal.","1. A ball is suspended by a **Hinge Joint**. Its mass increases until the reaction force exceeds a threshold, snapping the joint.","2. The ball falls onto a bridge made of `DistanceJoint` segments, which also have breaking thresholds.","You can visualize the stress on the joints by enabling **Force Vectors** in the debug settings."].join(`

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
		}`,onInit:e=>{T=1,o.debug.showAabbs=!1,o.debug.showForceVectors=!0,e.setGravity(0,10),Te=[],Se=null,te=null;const t=T++,n=e.createBody({id:t,x:5,y:1,type:o.bodyTypes.FIXED_OBJECT,color:"#ff4444"});n.createFixture({shape:o.shapes.CIRCLE,radius:.2});const s=T++;te=e.createBody({id:s,x:5,y:2.3,mass:.05,color:"#888888"}),te.createFixture({id:s,shape:o.shapes.CIRCLE,radius:.6}),Se=e.createHingeJoint(n,te,{id:T++,worldAnchor:{x:5,y:1}});const a=2,i=8,d=6,r=12,c=(i-a)/r,l=.2,h=T++,p=e.createBody({id:h,x:a-c/2,y:d,type:o.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"});p.createFixture({shape:o.shapes.BOX,width:c,height:.5});const u=T++,y=e.createBody({id:u,x:i+c/2,y:d,type:o.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"});y.createFixture({shape:o.shapes.BOX,width:c,height:.5});let g=p;for(let f=0;f<r;f++){const I=T++,b=e.createBody({id:I,x:a+f*c+c/2,y:d,mass:.2,color:"#cd853f"});b.createFixture({shape:o.shapes.BOX,width:c*.9,height:l,categoryBits:4,maskBits:-5});const w=e.createDistanceJoint(g,b,{id:T++,worldAnchor:{x:a+f*c,y:d}});Te.push(w),g=b}const x=e.createDistanceJoint(g,y,{id:T++,worldAnchor:{x:i,y:d}});Te.push(x),te.applyImpulse(.2,0)},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{if(te&&(te.mass+=t*3,o.debug.removeObjectLabels(te.id),o.debug.addLabel({text:`Mass: ${te.mass.toFixed(2)}kg`,objectId:te.id,position:"above",color:"#fff"})),Se){const n=Se.reactionForce;Math.sqrt(n.x*n.x+n.y*n.y)>150&&(e.removeJoint(Se.id),Se=null)}if(Te.length>0)for(let n=Te.length-1;n>=0;n--){const s=Te[n],a=s.reactionForce;Math.sqrt(a.x*a.x+a.y*a.y)>600&&(e.removeJoint(s.id),Te.splice(n,1))}}}),new v({name:"Gear Train",key:"gear-train",description:["A sequence of gears connected using the `GearJoint` constraint.","Each gear's motion is constrained by the previous one based on a **gear ratio** (calculated here by the relative radii).","A drive gear at the start receives a constant low torque, which is then propagated through the entire train with mechanical advantage."].join(`

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
		}`,onInit:e=>{T=1;const t=2,n=5,s=5,a=1.5,i=T++,d=e.createBody({id:i,x:5,y:5,type:o.bodyTypes.FIXED_OBJECT,color:"#888"});d.createFixture({shape:o.shapes.AABB,width:6.2,height:.2,maskBits:0});let r=null;je=null;for(let c=0;c<s;c++){const l=c%2===0?1:.5,h=T++,p=e.createBody({id:h,x:t+c*a,y:n,mass:l,color:`hsl(${c*60}, 70%, 60%)`});p.createFixture({shape:o.shapes.CIRCLE,radius:l});const u=e.createHingeJoint(d,p,{id:T++,worldAnchor:{x:t+c*a,y:n}});if(c===0)je=p;else{const g=((c-1)%2===0?1:.5)/l;e.createGearJoint(r,u,{id:T++,ratio:g})}r=u}},onTickRaw:`(world, dt) => {
			if (engineHub) {
				// Apply a persistent but relatively low angular impulse to the drive gear
				if (Math.abs(engineHub.rs) < 0.9) {
					engineHub.applyAngularImpulse(0.03);
				}
			}
		}`,onTick:(e,t)=>{je&&Math.abs(je.rs)<.9&&je.applyAngularImpulse(.03)}}),new v({name:"Distance Ropes",key:"distance-ropes",description:["Demonstrates the `DistanceJoint`, which maintains a fixed distance between two points on two different bodies.","A rotating drum has multiple triple-link chains hanging from it. Each link is connected by a `DistanceJoint` with a specified length, simulating a non-stretchy rope or chain."].join(`

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
		}`,onInit:e=>{o.debug.showAabbs=!1,o.debug.showForceVectors=!1,T=1;const t=5,n=5,s=4,a=T++,i=e.createBody({id:a,x:t,y:n,type:o.bodyTypes.FIXED_OBJECT,color:"#ff4444"});i.createFixture({shape:o.shapes.CIRCLE,radius:.5});const d=T++;ce=e.createBody({id:d,x:t,y:n,mass:100,color:"rgba(255, 255, 255, 0.05)",angularDamping:.5}),ce.createFixture({id:d,shape:o.shapes.CIRCLE,radius:s,maskBits:0}),e.createHingeJoint(i,ce,{id:T++,worldAnchor:{x:t,y:n}});const r=8,c=3.8,l=.8,h=()=>({x:(Math.random()-.5)*.3,y:(Math.random()-.5)*.3});for(let p=0;p<r;p++){const u=p/r*Math.PI*2,y=t+Math.cos(u)*c,g=n+Math.sin(u)*c,x=y-Math.cos(u)*.5,f=g-Math.sin(u)*.5,I=T++,b=e.createBody({id:I,x,y:f,mass:.5,color:`hsl(${p*360/r}, 70%, 60%)`});b.createFixture({shape:p%2===0?o.shapes.BOX:o.shapes.CIRCLE,width:.5,height:.5,radius:.25});const w=ce.worldToLocal({x:y,y:g});e.createDistanceJoint(ce,b,{id:T++,anchorA:w,anchorB:h(),length:l});const B=x-Math.cos(u)*l,C=f-Math.sin(u)*l,M=T++,F=e.createBody({id:M,x:B,y:C,mass:.5,color:`hsl(${p*360/r}, 70%, 50%)`});F.createFixture({shape:(p+1)%2===0?o.shapes.BOX:o.shapes.CIRCLE,width:.5,height:.5,radius:.25}),e.createDistanceJoint(b,F,{id:T++,anchorA:h(),anchorB:h(),length:l});const S=B-Math.cos(u)*l,j=C-Math.sin(u)*l,L=T++,H=e.createBody({id:L,x:S,y:j,mass:.5,color:`hsl(${p*360/r}, 70%, 40%)`});H.createFixture({shape:(p+2)%2===0?o.shapes.BOX:o.shapes.CIRCLE,width:.5,height:.5,radius:.25}),e.createDistanceJoint(F,H,{id:T++,anchorA:h(),anchorB:h(),length:l})}e.setGravity(0,9.81),ce.rs=.2},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{if(ce){const n=Date.now()/1e3,s=n%12;let a=0,i=2;s<4?(a=1.2,i=4):s<6?(a=0,i=1):s<10?(a=Math.sin(n*4)*2,i=8):a=0;const d=a-ce.rs;Math.abs(d)>.05&&ce.applyAngularImpulse(d*i)}}}),new v({name:"Spring Belt",key:"spring-belt",description:["A chain of shapes connected by `SpringJoint` constraints, forming a belt around a rotating high-friction pulley.","The `SpringJoint` acts like a dampened harmonic oscillator, pulling objects together with a force proportional to their distance and frequency. The belt stretches and contracts as it interacts with the central rotor."].join(`

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
		}`,onInit:e=>{o.debug.showAabbs=!1,o.debug.showForceVectors=!1,T=1;const t=5,n=3,s=2.5,a=3.5,i=T++,d=e.createBody({id:i,x:t,y:n,type:o.bodyTypes.FIXED_OBJECT,color:"#666666"});d.createFixture({shape:o.shapes.CIRCLE,radius:.1,maskBits:0});const r=T++;oe=e.createBody({id:r,x:t,y:n,rs:2.5,type:o.bodyTypes.DYNAMIC_OBJECT,mass:10,color:"#888888",angularDamping:.1}),oe.createFixture({id:r,shape:o.shapes.CIRCLE,radius:s,sFriction:1,kFriction:1}),e.createHingeJoint(d,oe,{id:T++,worldAnchor:{x:t,y:n}});const c=16,l=[];for(let h=0;h<c;h++){const p=h/c*Math.PI*2,u=t+Math.cos(p)*a,y=n+Math.sin(p)*a,g=T++,x=e.createBody({id:g,x:u,y,mass:.1,color:`hsl(${h*360/c}, 70%, 60%)`});let f;h%3===0?f=o.shapes.BOX:h%3===1?f=o.shapes.CIRCLE:f=o.shapes.CAPSULE,x.createFixture({shape:f,width:.6,height:f===o.shapes.CAPSULE?1:.6,radius:.3,sFriction:.999,kFriction:.99}),l.push(x)}for(let h=0;h<c;h++){const p=l[h],u=l[(h+1)%c],y=u.x-p.x,g=u.y-p.y,x=Math.sqrt(y*y+g*g);e.createSpringJoint(p,u,{id:T++,length:x*1.1,frequencyHz:5,dampingRatio:.2})}e.setGravity(0,9.81)},onTickRaw:`(world, dt) => {
			if (rotator) {
				// Apply a persistent angular impulse until we reach target speed
				if (Math.abs(rotator.rs) < 2.5) {
					rotator.applyAngularImpulse(1.0);
				}
			}
		}`,onTick:(e,t)=>{oe&&Math.abs(oe.rs)<2.5&&oe.applyAngularImpulse(1)}}),new v({name:"Soft Body Ball",key:"soft-body",description:["A collection of `CIRCLE` objects connected by a network of `SpringJoint` constraints to form a squishy, deformable ball.","The ball features a central core (axel) connected to an outer ring of nodes. This setup simulates **Soft Body Dynamics** using a mass-spring system.","Persistent random impulses are applied to the core to keep the ball moving and demonstrate its elasticity."].join(`

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
		}`,onInit:e=>{o.debug.showAabbs=!1,o.debug.showForceVectors=!1,T=1;const t=5,n=3,s=2,a=12,i=[],d=.2,r=T++,c=e.createBody({id:r,x:t,y:n,mass:2,color:"#ff8888"});c.createFixture({shape:o.shapes.CIRCLE,radius:d,sFriction:.9,kFriction:.9}),oe=c,Ye=0,ze=-30;for(let u=0;u<a;u++){const y=u/a*Math.PI*2,g=t+Math.cos(y)*s,x=n+Math.sin(y)*s,f=T++,I=e.createBody({id:f,x:g,y:x,mass:.5,color:"#8888ff"});I.createFixture({shape:o.shapes.CIRCLE,radius:.2,sFriction:.9,kFriction:.9}),i.push(I),e.createSpringJoint(c,I,{id:T++,anchorA:{x:Math.cos(y)*d,y:Math.sin(y)*d},length:s-d,frequencyHz:4,dampingRatio:.5}),u>0&&e.createSpringJoint(i[u-1],I,{id:T++,length:2*s*Math.sin(Math.PI/a),frequencyHz:4,dampingRatio:.5})}e.createSpringJoint(i[a-1],i[0],{id:T++,length:2*s*Math.sin(Math.PI/a),frequencyHz:4,dampingRatio:.5});const l=T++;e.createBody({id:l,x:5,y:10,type:o.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}).createFixture({shape:o.shapes.BOX,width:15,height:2,sFriction:.9,kFriction:.9});const h=T++;e.createBody({id:h,x:-3.5,y:4.25,type:o.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}).createFixture({shape:o.shapes.BOX,width:2,height:10});const p=T++;e.createBody({id:p,x:13.5,y:4.25,type:o.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}).createFixture({shape:o.shapes.BOX,width:2,height:10}),e.setGravity(0,9.81)},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{oe&&(ze<=0&&(Math.random()<.02?(Ye=(Math.random()-.5)*3,ze=40+Math.random()*80):Ye=0),ze>0&&(oe.applyAngularImpulse(Ye),oe.applyImpulse(Ye*.1,0),ze--))}})];let Dn=0,Ne=1;const Kt=[new v({name:"Sleep and Islands",key:"sleep-and-islands",description:["**Sleep** optimization in **Gearbox2D** uses a movement-based heuristic computed during the kinematics step.","Instead of rebuilding a complex global island data structure each tick, each object tracks its own local contacts. When an object wakes up (due to a force or collision), it automatically wakes its neighbors.","This provides the performance benefits of **Islands** with significantly lower overhead."].join(`

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
		}`,onInit:e=>{e.setGravity(0,10),Dn=3,Ne=0,e.createBody({id:Ne++,x:5,y:8.5,vx:0,vy:0,type:o.bodyTypes.FIXED_OBJECT,mass:2}).createFixture({shape:o.shapes.AABB,width:20,height:1})},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{if(Dn+=t*2,Math.floor(Dn/3)>=Ne&&Ne<10){const a=Ne++;e.createBody({id:a,x:5,y:0,r:(Math.random()-.5)*.1,vx:0,vy:0,type:o.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:o.shapes.BOX,width:6,height:.5,sFriction:10,kFriction:10})}}}),new v({name:"Shrink Wrap",key:"shrink-wrap",description:["Objects that are put to **Sleep** have their **AABBs** 'shrink-wrapped' to their exact shape bounds.","This provides a slight performance boost during broad-phase collision detection by reducing false positives in the BVH tree for stationary objects."].join(`

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
		}`,onInit:e=>{e.createBody({id:1,x:10,y:10,vx:-5,vy:-5,type:o.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:o.shapes.CIRCLE,radius:1,restitution:0}),e.createBody({id:2,x:0,y:0,vx:5,vy:5,type:o.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:o.shapes.CIRCLE,radius:1,restitution:0})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}})];let k=1,me=null,mn=null,Pe=null;const ut=1,gt=2,kt=(e,t)=>({x:(e-o.debug.offsetX)/(o.debug.zoom*100),y:(t-o.debug.offsetY)/(o.debug.zoom*100)}),Zt=(e,t)=>{if(e.button!==0)return;const n=Pe.getBoundingClientRect(),s=kt(e.clientX-n.left,e.clientY-n.top),a=t.queryBodiesAtPoint(s.x,s.y);if(a.length>0){const i=a[0],d=t.getBodyById(i);d&&d.type!==o.bodyTypes.FIXED_OBJECT&&(me=t.createBody({id:999999,x:s.x,y:s.y,type:o.bodyTypes.FIXED_OBJECT,color:"transparent"}),me.createFixture({id:999999,shape:o.shapes.CIRCLE,radius:.05,maskBits:0}),mn=t.createSpringJoint(me,d,{id:999998,worldAnchor:s,frequencyHz:3,dampingRatio:1,length:0}))}},Qt=e=>{if(me){const t=Pe.getBoundingClientRect(),n=kt(e.clientX-t.left,e.clientY-t.top);me.x=n.x,me.y=n.y}},eo=(e,t)=>{mn&&(t.removeJoint(mn.id),mn=null),me&&(t.removeObject(me.id),me=null)},mt=e=>{Pe=document.getElementById("debug-canvas"),e._mouseDownHandler=t=>Zt(t,e),e._mouseMoveHandler=t=>Qt(t),e._mouseUpHandler=t=>eo(t,e),Pe.addEventListener("mousedown",e._mouseDownHandler),window.addEventListener("mousemove",e._mouseMoveHandler),window.addEventListener("mouseup",e._mouseUpHandler)},xt=e=>{Pe&&(Pe.removeEventListener("mousedown",e._mouseDownHandler),window.removeEventListener("mousemove",e._mouseMoveHandler),window.removeEventListener("mouseup",e._mouseUpHandler),delete e._mouseDownHandler,delete e._mouseMoveHandler,delete e._mouseUpHandler)},no=[new v({name:"2000 Colliding Circles",key:"particles",description:["A **Stress Test** featuring 2,000 `CIRCLE` objects with full collision resolution.","This demo helps visualize the performance of the **BVH (Bounding Volume Hierarchy)** and the narrow-phase collision solver.","**Note**: In many environments, the primary bottleneck will be the Canvas 2D rendering rather than the physics simulation."].join(`

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
		}`,onInit:e=>{e._frameCounter=0,e.clear();let t=1,n=2,s=11;e.createBody({id:t++,x:5,y:0,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.AABB,width:s,height:n,restitution:.99}),e.createBody({id:t++,x:5,y:10,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.AABB,width:s,height:n,restitution:.99}),e.createBody({id:t++,x:0,y:5,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.AABB,width:n,height:s,restitution:.99}),e.createBody({id:t++,x:10,y:5,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.AABB,width:n,height:s,restitution:.99});for(let a=0;a<2e3;a++){const i=t++;e.createBody({id:i,x:Math.random()*8+1,y:Math.random()*8+1,vx:Math.random()*1-.5,vy:Math.random()*1-.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*20,type:o.bodyTypes.DYNAMIC_OBJECT,mass:.5,linearDamping:0,angularDamping:.5}).createFixture({shape:o.shapes.CIRCLE,radius:.05,restitution:.5})}},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new v({name:"2000 Bouncy Points",key:"fleas",description:["A stress test with 2,000 bouncy `POINT` objects.","Point objects have zero radius and don't collide with each other, but they do collide with other shapes (like the `AABB` walls in this demo). This allows for extremely high-density simulations."].join(`

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
		}`,onInit:e=>{e.clear();const t=2e3;e.setGravity(0,10);let n=1,s=2,a=11;e.createBody({id:n++,x:5,y:0,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.AABB,width:a,height:s,restitution:1,sFriction:0,kFriction:0}),e.createBody({id:n++,x:5,y:10,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.AABB,width:a,height:s,restitution:1,sFriction:0,kFriction:0}),e.createBody({id:n++,x:0,y:5,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.AABB,width:s,height:a,restitution:1,sFriction:0,kFriction:0}),e.createBody({id:n++,x:10,y:5,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.AABB,width:s,height:a,restitution:1,sFriction:0,kFriction:0});for(let i=0;i<t;i++){const d=n++;e.createBody({id:d,x:Math.random()*8+1,y:Math.random()*8+1,vx:Math.random()*10-5,r:Math.PI/2*Math.random(),type:o.bodyTypes.DYNAMIC_OBJECT,mass:2,linearDamping:0,angularDamping:0}).createFixture({shape:o.shapes.POINT,radius:.05,restitution:1,sFriction:0,kFriction:0})}},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new v({name:"10 Stacked Boxes",key:"stacked-boxes",description:"A vertical stack of 10 dynamic boxes testing the stability of the impulse solver under persistent contact.",onInitRaw:`(world) => {
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
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),k=1,e.createBody({id:k++,x:5,y:9.5,type:o.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:o.shapes.BOX,width:10,height:1});for(let t=0;t<10;t++)e.createBody({id:k++,x:5,y:8.5-t*.6,mass:1,color:`hsl(${t*36}, 70%, 60%)`}).createFixture({shape:o.shapes.BOX,width:1,height:.5,restitution:.1,sFriction:.5,kFriction:.3})}}),new v({name:"5-Level Pyramid",key:"pyramid",description:"A 5-level pyramid made of boxes. Tests multiple simultaneous contact points and stack stability.",onInitRaw:`(world) => {
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
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),k=1,e.createBody({id:k++,x:5,y:9.5,type:o.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:o.shapes.BOX,width:10,height:1});const t=.8,n=.8,s=5;for(let a=0;a<s;a++){const i=s-a,d=5-(i-1)*t/2,r=8.6-a*n;for(let c=0;c<i;c++)e.createBody({id:k++,x:d+c*t,y:r,mass:1,color:`hsl(${a*40}, 60%, 50%)`}).createFixture({shape:o.shapes.BOX,width:t*.95,height:n*.95,restitution:.1,sFriction:.5,kFriction:.3})}}}),new v({name:"Mass Ratio",key:"mass-ratio",description:"A classic physics engine test: a very heavy object (mass 100) resting on a very light one (mass 0.1).",onInitRaw:`(world) => {
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
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),k=1,e.createBody({id:k++,x:5,y:9.5,type:o.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:o.shapes.BOX,width:10,height:1}),e.createBody({id:k++,x:5,y:8.5,mass:.1,color:"#4ade80"}).createFixture({shape:o.shapes.BOX,width:1,height:1}),e.createBody({id:k++,x:5,y:7,mass:100,color:"#f87171"}).createFixture({shape:o.shapes.BOX,width:2,height:2})}}),new v({name:"Ragdoll",key:"ragdoll",description:"A draggable ragdoll made of boxes and circles connected by HingeJoints. Click and drag to interact.",onInitRaw:`(world) => {
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
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),o.debug.showAabbs=!1,k=1,e.createBody({id:k++,x:5,y:9.5,type:o.bodyTypes.FIXED_OBJECT,color:"#444"}).createFixture({shape:o.shapes.BOX,width:10,height:1});const t=5,n=4,s=e.createBody({id:k++,x:t,y:n-1.5,mass:1,color:"#fed7aa"});s.createFixture({shape:o.shapes.CIRCLE,radius:.3});const a=e.createBody({id:k++,x:t,y:n,mass:2,color:"#93c5fd"});a.createFixture({shape:o.shapes.BOX,width:.6,height:1});const i=(g,x,f,I,b)=>{const w=e.createBody({id:k++,x:g,y:x,mass:.5,color:b});return w.createFixture({shape:o.shapes.BOX,width:f,height:I}),w},d=i(t-.6,n-.3,.5,.2,"#fed7aa"),r=i(t-1.1,n-.3,.5,.2,"#fed7aa"),c=i(t+.6,n-.3,.5,.2,"#fed7aa"),l=i(t+1.1,n-.3,.5,.2,"#fed7aa"),h=i(t-.2,n+.8,.2,.6,"#1e3a8a"),p=i(t-.2,n+1.5,.2,.6,"#fed7aa"),u=i(t+.2,n+.8,.2,.6,"#1e3a8a"),y=i(t+.2,n+1.5,.2,.6,"#fed7aa");e.createHingeJoint(s,a,{id:k++,worldAnchor:{x:t,y:n-1}}),e.createHingeJoint(a,d,{id:k++,worldAnchor:{x:t-.3,y:n-.3}}),e.createHingeJoint(d,r,{id:k++,worldAnchor:{x:t-.85,y:n-.3}}),e.createHingeJoint(a,c,{id:k++,worldAnchor:{x:t+.3,y:n-.3}}),e.createHingeJoint(c,l,{id:k++,worldAnchor:{x:t+.85,y:n-.3}}),e.createHingeJoint(a,h,{id:k++,worldAnchor:{x:t-.2,y:n+.5}}),e.createHingeJoint(h,p,{id:k++,worldAnchor:{x:t-.2,y:n+1.15}}),e.createHingeJoint(a,u,{id:k++,worldAnchor:{x:t+.2,y:n+.5}}),e.createHingeJoint(u,y,{id:k++,worldAnchor:{x:t+.2,y:n+1.15}}),mt(e)},onCleanup:e=>{xt(e)}}),new v({name:"Bullet Through Paper",key:"bullet",description:["Tests anti-tunneling by firing many fast-moving balls at a tall, thin wall.","Balls vary in **size**, **speed**, and **angle**. `speculativeMargin` helps catch collisions even at high speeds.","Collision masks (`categoryBits` / `maskBits`) keep balls from colliding with each other — they only hit the wall. Each ball is removed after **5 seconds** or once it bounces out of bounds."].join(`

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
		}`,onInit:e=>{e.clear(),e.setGravity(0,0),e.setSpeculativeMargin(.5),o.debug.showAabbs=!1,k=1;const t=8,n=5,s=9.5;e.createBody({id:k++,x:t,y:n,type:o.bodyTypes.FIXED_OBJECT,color:"#ccc"}).createFixture({shape:o.shapes.BOX,width:.06,height:s,restitution:.85,categoryBits:ut,maskBits:gt}),e._bulletAges=new Map,e._bulletSpawnAcc=0,e._bulletWall={x:t,y:n,halfH:s/2}},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{const n=e._bulletAges,s=e._bulletWall;if(!n||!s)return;e._bulletSpawnAcc+=t;const a=.035;let i=0;for(;e._bulletSpawnAcc>=a&&i<8;){e._bulletSpawnAcc-=a,i++;const r=.04+Math.random()*.18,c=18+Math.random()*55,l=.4+Math.random()*1.2,h=.4+Math.random()*9.2,p=r+.05,u=s.y-s.halfH+p+Math.random()*Math.max(.01,s.halfH*2-p*2),y=s.x-l,g=u-h,x=1/Math.hypot(y,g),f=["#ffff44","#ff8844","#44ffff","#ff44ff","#88ff44","#ff5555"],I=e.createBody({id:k++,x:l,y:h,vx:y*x*c,vy:g*x*c,mass:Math.max(.02,r*r*8),color:f[Math.floor(Math.random()*f.length)],canSleep:!1,linearDamping:0,angularDamping:0});I.createFixture({shape:o.shapes.CIRCLE,radius:r,restitution:.7+Math.random()*.25,categoryBits:gt,maskBits:ut}),n.set(I.id,0)}const d=[];e.iterateBodies(r=>{if(r.type!==o.bodyTypes.DYNAMIC_OBJECT)return;const c=(n.get(r.id)??0)+t;n.set(r.id,c),(r.x<-2||r.x>14||r.y<-2||r.y>12||c>5)&&d.push(r.id)});for(const r of d)n.delete(r),e.removeObject(r)},onCleanup:e=>{delete e._bulletAges,delete e._bulletSpawnAcc,delete e._bulletWall}}),new v({name:"20-Segment Chain",key:"chain",description:"A 20-segment chain suspended from a fixed point using DistanceJoints.",onInitRaw:`(world) => {
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
		}`,onInit:e=>{e.clear(),e.setGravity(0,10),o.debug.showAabbs=!1,k=1;const t=5,n=1,s=20,a=.4,i=.15,d=e.createBody({id:k++,x:t,y:n+(Math.random()-.5)*.1,type:o.bodyTypes.FIXED_OBJECT,color:"#444"});d.createFixture({shape:o.shapes.CIRCLE,radius:.1});let r=0;r=+(Math.random()-.5)*1e-5;let c=d;for(let l=0;l<s;l++){const h=e.createBody({id:k++,x:t+r,y:n+(l+1)*a,mass:.2,color:l%2===0?"#60a5fa":"#3b82f6"});h.createFixture({shape:o.shapes.BOX,width:a,height:i}),e.createDistanceJoint(c,h,{id:k++,worldAnchor:{x:t,y:n+l*a+a/2}}),c=h}mt(e)},onCleanup:e=>{xt(e)}})];let Xn=0,bt=1;const to=[new v({name:"TC-1 (SOLVED)",key:"tc-1",description:["**Test Case 1**: Verifies stability during box-on-box collisions.","Previously, boxes would exhibit 'jitter' or 'explosive' behavior when colliding at certain angles."].join(`

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
		}`,onInit:e=>{e.setGravity(0,10);let t=1;e.createBody({id:t++,x:5,y:8,type:o.bodyTypes.FIXED_OBJECT,mass:1}).createFixture({shape:o.shapes.BOX,width:1,height:1}),e.createBody({id:t++,x:7,y:2,type:o.bodyTypes.DYNAMIC_OBJECT,mass:1}).createFixture({shape:o.shapes.BOX,width:5,height:1}),e.createBody({id:t++,x:3,y:5,type:o.bodyTypes.DYNAMIC_OBJECT,mass:1}).createFixture({shape:o.shapes.BOX,width:5,height:1})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new v({name:"TC-2 (SOLVED)",key:"tc-2",description:["**Test Case 2**: Ensures `BOX` shapes do not tunnel through `AABB` shapes.","This test case was used to refine the overlap detection and penetration resolution logic for different boundary types."].join(`

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
		}`,onInit:e=>{e.setGravity(0,10);let t=1;e.createBody({id:t++,x:5,y:8,r:Math.PI/2,type:o.bodyTypes.FIXED_OBJECT,mass:1}).createFixture({shape:o.shapes.AABB,width:1,height:1}),e.createBody({id:t++,x:7,y:2,type:o.bodyTypes.DYNAMIC_OBJECT,mass:1}).createFixture({shape:o.shapes.BOX,width:5,height:1}),e.createBody({id:t++,x:3,y:5,type:o.bodyTypes.DYNAMIC_OBJECT,mass:1}).createFixture({shape:o.shapes.BOX,width:5,height:1})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new v({name:"TC-3 (SOLVED)",key:"tc-3",description:["**Test Case 3**: Momentum preservation and angular transfer.","Previously, objects would lose too much linear momentum during eccentric collisions. The solver now correctly calculates the balance between linear and angular velocity transfer."].join(`

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
		}`,onInit:e=>{e.setGravity(0,0);let t=1;e.createBody({id:t++,x:8,y:5,type:o.bodyTypes.FIXED_OBJECT,mass:1}).createFixture({shape:o.shapes.BOX,width:1,height:1}),e.createBody({id:t++,x:2,y:3,vx:3,type:o.bodyTypes.DYNAMIC_OBJECT,mass:1}).createFixture({shape:o.shapes.BOX,width:1,height:5})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new v({name:"TC-4 (SOLVED)",key:"tc-4",description:["**Test Case 4**: Correctness of angular velocity direction.","Ensures that objects receive torque in the physically correct direction based on the contact point and normal."].join(`

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
		}`,onInit:e=>{e.setGravity(0,0);let t=1;e.createBody({id:t++,x:8,y:5,type:o.bodyTypes.FIXED_OBJECT,mass:1}).createFixture({shape:o.shapes.BOX,width:1,height:1}),e.createBody({id:t++,x:2,y:6,vx:3,type:o.bodyTypes.DYNAMIC_OBJECT,mass:1}).createFixture({shape:o.shapes.BOX,width:1,height:5})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new v({name:"TC-5 (SOLVED)",key:"tc-5",description:["**Test Case 5**: Sensitivity to initial rotation.","Fixes an issue where even tiny angular velocities (`rs`) caused disproportionate collision responses. Also verifies that rotating objects transfer angular momentum in opposing directions."].join(`

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
		}`,onInit:e=>{e.setGravity(0,0);let t=1;e.createBody({id:t++,x:5,y:5,type:o.bodyTypes.DYNAMIC_OBJECT,mass:4}).createFixture({shape:o.shapes.CIRCLE,radius:1}),e.createBody({id:t++,x:2.8,y:2,vx:3,vy:3,type:o.bodyTypes.DYNAMIC_OBJECT,mass:1,rs:.01}).createFixture({shape:o.shapes.CIRCLE,radius:.5})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new v({name:"TC-6 (SOLVED)",key:"tc-6",description:["**Test Case 6**: Contact point calculation accuracy.","Uses edge-clipping techniques to ensure stable and accurate impulse application during complex box-box collisions."].join(`

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
		}`,onInit:e=>{e.setGravity(0,10),e.setHasFriction(!1);let t=1;e.createBody({id:t++,x:5,y:6,r:Math.PI/8,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.BOX,width:8,height:1}),e.createBody({id:t++,x:2,y:2,type:o.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:o.shapes.BOX,width:1,height:1})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new v({name:"TC-7 (SOLVED)",key:"tc-7",description:["**Test Case 7**: Friction normal vector correctness.","Ensures that friction impulses are applied exactly tangent to the contact normal, even when restitution is high."].join(`

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
		}`,onInit:e=>{e.setGravity(0,10);let t=1;e.createBody({id:t++,x:5,y:6,r:.1,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.BOX,width:8,height:1,restitution:0}),e.createBody({id:t++,x:2,y:2,type:o.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:o.shapes.BOX,width:1,height:1,restitution:0})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new v({name:"TC-8 (SOLVED)",key:"tc-8",description:["**Test Case 8**: Stability of high-frequency circle collisions.","Verifies that multiple circles colliding in quick succession do not cause simulation instability or tunneling."].join(`

`),globalLines:["let nextId = 1;"],onInitRaw:`(world) => {
			world.setGravity(0, 10);
			impulseTimer = 0;

			// Objects will be created in the tick function.
		}`,onInit:e=>{e.setGravity(0,10),Xn=0},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{if(Xn++,Xn%60==0){let n=.1+Math.random()*.4,s=.2+n*n*.8,a=bt++;e.createBody({id:a,x:0,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*1,vy:-6-Math.random()*1,type:o.bodyTypes.DYNAMIC_OBJECT,mass:n}).createFixture({shape:o.shapes.CIRCLE,radius:s}),n=.1+Math.random()*.4,s=.2+n*n*.8;let i=bt++;e.createBody({id:i,x:10,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*-1,vy:-6-Math.random()*1,type:o.bodyTypes.DYNAMIC_OBJECT,mass:n}).createFixture({shape:o.shapes.CIRCLE,radius:s}),e.getBodyCount();let d=[];e.iterateBodies(r=>{r.y>10.5&&d.push(r)});for(let r of d)e.removeObject(r.id)}}}),new v({name:"TC-9 (SOLVED)",key:"tc-9",description:["**Test Case 9**: Resting stability.","A small box resting on a larger fixed box to verify that gravity and normal impulses reach equilibrium without constant jitter."].join(`

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
		}`,onInit:e=>{e.setGravity(0,1);let t=1;e.createBody({id:t++,x:5,y:6,r:Math.PI/2,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.BOX,width:1,height:8}),e.createBody({id:t++,x:7,y:5,type:o.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:o.shapes.BOX,width:1,height:1})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new v({name:"TC-10 (SOLVED)",key:"tc-10",description:["**Test Case 10**: Circle-AABB penetration resolution.","Fixes extreme responses when a circle falls directly onto a large axis-aligned platform."].join(`

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
		}`,onInit:e=>{e.setGravity(0,3);let t=1;e.createBody({id:t++,x:5,y:8,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.AABB,width:8,height:1}),e.createBody({id:t++,x:7,y:2,type:o.bodyTypes.DYNAMIC_OBJECT,mass:.2,rs:-.1}).createFixture({shape:o.shapes.CIRCLE,radius:1,restitution:1})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new v({name:"TC-11 (SOLVED)",key:"tc-11",description:["**Test Case 11**: Stuck objects and overlap logic.","Ensures that small circles do not get 'embedded' within other shapes when subjected to high-velocity collisions or deep initial overlaps."].join(`

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
		}`,onInit:e=>{let t=1;e.createBody({id:t++,x:5,y:5,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.AABB,width:1,height:5}),e.createBody({id:t++,x:5.2,y:5,type:o.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:o.shapes.CIRCLE,radius:.1,restitution:.5})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new v({name:"TC-12 (SOLVED)",key:"tc-12",description:["**Test Case 12**: Sinking prevention under high gravity.","Verifies that boxes maintain their position on top of other objects even when high downward forces are applied, ensuring the penetration resolution is sufficient."].join(`

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
		}`,onInit:e=>{e.setGravity(0,10);let t=1;e.createBody({id:t++,x:5,y:6,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.AABB,width:8,height:1}),e.createBody({id:t++,x:7,y:4,type:o.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:o.shapes.BOX,width:1,height:1})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new v({name:"TC-13 (SOLVED)",key:"tc-13",description:["**Test Case 13**: Stuck objects and overlap logic.","Ensures that small circles do not get 'embedded' within other shapes when subjected to high-velocity collisions or deep initial overlaps."].join(`

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
		}`,onInit:e=>{let t=1;e.createBody({id:t++,x:5,y:5,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.BOX,width:1,height:5}),e.createBody({id:t++,x:5.2,y:5,type:o.bodyTypes.DYNAMIC_OBJECT,mass:.2}).createFixture({shape:o.shapes.CIRCLE,radius:.1,restitution:.5})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new v({name:"TC-14 (SOLVED)",key:"tc-14",description:["**Test Case 14**: Sliding pile regression.","A stack of boxes should remain stationary when high friction is present. This test verifies if piles of objects exhibit 'random slow sliding' and fail to enter the sleep state."].join(`

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
		}`,onInit:e=>{e.setGravity(0,20);let t=1;e.createBody({id:t++,x:5,y:9,type:o.bodyTypes.FIXED_OBJECT}).createFixture({shape:o.shapes.BOX,width:10,height:1,sFriction:10,kFriction:10});for(let n=0;n<4;n++)e.createBody({id:t++,x:5,y:8-n*1.1,type:o.bodyTypes.DYNAMIC_OBJECT,mass:1}).createFixture({shape:o.shapes.BOX,width:2,height:1,sFriction:10,kFriction:10})},onTickRaw:"(world, dt) => {}",onTick:(e,t)=>{}}),new v({name:"TC-15: Anti-tunneling (REGRESSION)",key:"tc-15",description:["**Test Case 15**: Regression test for anti-tunneling.","A fast bullet (radius 0.1) is fired at a thin wall (width 0.05) at high speed (vx: 50).","Fat AABBs rebuild when leftover velocity padding is less than one step of travel, so speculative contacts still see the wall."].join(`

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
		}`,onInit:e=>{e.setGravity(0,0);let t=1;e.createBody({id:t++,x:7,y:5,type:o.bodyTypes.FIXED_OBJECT,color:"#ccc"}).createFixture({shape:o.shapes.BOX,width:.05,height:4});const n=e.createBody({id:t++,x:1,y:5,vx:50,type:o.bodyTypes.DYNAMIC_OBJECT,mass:1,color:"#ffff44"});n.createFixture({shape:o.shapes.CIRCLE,radius:.1}),e.bulletId=n.id},onTickRaw:`(world, dt) => {
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
		}`,onTick:(e,t)=>{const n=e.getBodyById(e.bulletId);n&&n.x>25&&(n.x=1,n.vx=50,n.color="#ff4444"),n&&n.x<0&&(n.x=1,n.vx=50,n.color="#44ff44")}})];let A=1,_n=null,Hn=null,Jn=null,Z=null;const oo=new v({name:"Mechanical Clockwork",key:"clockwork",description:["A physically regulated mechanical clock. This version uses a **Grashof-compliant Crank-Rocker** mechanism to ensure continuous rotation.","### Features","- **Regulated Motion**: A 2.0m pendulum defines a 9-second period in low gravity (1.0 m/s²).","- **Grashof Linkage**: Precision geometry allows the drive gear to complete full 360° rotations.","- **Kinematic Drive**: The escapement gear is driven at a fixed rotation speed to ensure perfect timekeeping.","- **Multi-stage Reduction**: 7 `GearJoint` stages step down the escapement's motion to hours and minutes.","- **Real-time Sync**: The hands and gear train initialize to your local system time."].join(`

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
	}`,onInit:e=>{e.clear(),o.debug.showAabbs=!1,A=1;const t=5,n=2.5,s=1;e.setGravity(0,s),e.setHasRestitution(!0),e.setHasFriction(!0);const a=1,i=2,d=4,r=8,c=new Date,l=c.getSeconds(),h=c.getMinutes(),p=c.getHours()%12,u={crankRadius:.251412,groundDist:.962005,rockerLength:.788035,escXOffset:0,conRodFreq:15,conRodDamping:1,springFreq:.5,springX:t-1.5},y=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1",g=document.getElementById("clock-tuner-gui");g&&g.remove();const x=document.createElement("div");x.id="clock-tuner-gui",x.style="position:fixed;top:20px;right:20px;width:280px;background:rgba(0,0,0,0.85);color:#0f0;padding:15px;border-radius:8px;font-family:monospace;z-index:1000;box-shadow:0 4px 15px rgba(0,0,0,0.5);font-size:12px;border:1px solid #333;",y&&document.body.appendChild(x);const f=document.createElement("div");f.style="margin:15px 0;padding:10px;border:1px solid #0f0;text-align:center;font-size:16px;font-weight:bold;",f.textContent="Score: 0",x.appendChild(f);const I=document.createElement("button");I.textContent="Export to Console",I.style="width:100%;padding:8px;background:#0f0;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;margin-bottom:5px;",I.onclick=()=>console.log("Final Parameters:",JSON.stringify(u,null,4)),x.appendChild(I);const b=document.createElement("button");b.textContent="Start Auto-Optimize",b.style="width:100%;padding:8px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;",b.onclick=()=>{const R=e.scoreState;R.isOptimizing=!R.isOptimizing,b.textContent=R.isOptimizing?"Stop Auto-Optimize":"Start Auto-Optimize",b.style.background=R.isOptimizing?"#f00":"#444",R.isOptimizing&&(R.bestScore=-1/0,R.optimizationStage="PREPARE",R.optParamIndex=0,R.optDirection=1,R.epsilon=.05,R.lastImprovementIteration=0,console.log("Starting Auto-Optimization..."))},x.appendChild(b);const w=document.createElement("div");w.style="margin-top:10px;font-size:10px;color:#aaa;",w.textContent="Optimizer: Idle",x.appendChild(w);const B={},C=(R,D,Ce,ve,cn)=>{const ln=document.createElement("div");ln.style.marginBottom="10px";const hn=document.createElement("div");hn.textContent=`${R}: ${u[D].toFixed(2)}`;const ne=document.createElement("input");ne.type="range",ne.min=Ce,ne.max=ve,ne.step=cn,ne.value=u[D],ne.style.width="100%",ne.oninput=()=>{u[D]=parseFloat(ne.value),hn.textContent=`${R}: ${u[D].toFixed(2)}`,nn()},ln.appendChild(hn),ln.appendChild(ne),x.appendChild(ln),B[D]={slider:ne,labelEl:hn,label:R}},M=R=>{const D=B[R];D&&(D.slider.value=u[R],D.labelEl.textContent=`${D.label}: ${u[R].toFixed(2)}`)};C("Crank Radius","crankRadius",.05,.5,.01),C("Ground Distance","groundDist",.5,2,.05),C("Rocker Length","rockerLength",.3,1.5,.05),C("Esc X Offset","escXOffset",-.5,.5,.01),C("Rod Frequency","conRodFreq",5,50,1),C("Spring Frequency","springFreq",.1,2,.05),C("Spring X Pos","springX",t-3,t-.5,.1);const F=n+2,S=F-u.groundDist,L=s*Math.pow(8/(2*Math.PI),2);L-u.rockerLength;const H=A++,re=e.createBody({id:H,x:t,y:F,type:o.bodyTypes.FIXED_OBJECT,color:"#888"});re.createFixture({id:H,shape:o.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const V=A++,z=e.createBody({id:V,x:t,y:S,type:o.bodyTypes.FIXED_OBJECT,color:"#888"});z.createFixture({id:V,shape:o.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const de=A++,J=e.createBody({id:de,x:t,y:n,type:o.bodyTypes.FIXED_OBJECT,color:"#888"});J.createFixture({id:de,shape:o.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const ee=.5,Ge=A++;Z=e.createBody({id:Ge,x:t+Math.sin(ee)*L,y:F+Math.cos(ee)*L,r:-ee,mass:5,color:"#cd853f"}),Z.createFixture({id:Ge,shape:o.shapes.CIRCLE,radius:.4,categoryBits:i,maskBits:0}),Z.angularDamping=.01,e.createHingeJoint(re,Z,{id:A++,worldAnchor:{x:t,y:F},anchorB:{x:0,y:-L}});const Oe=A++,K=e.createBody({id:Oe,x:t+u.escXOffset,y:S,r:0,type:o.bodyTypes.KINEMATIC_OBJECT,color:"#aaa"});K.createFixture({id:Oe,shape:o.shapes.CIRCLE,radius:.5,categoryBits:d,maskBits:0}),K.rs=Math.PI*2/8;const Qe=e.createHingeJoint(z,K,{id:A++,worldAnchor:{x:t+u.escXOffset,y:S}}),fn={x:u.crankRadius,y:0},en={x:0,y:-u.rockerLength},xe=()=>{const R=t+u.escXOffset,D=F-u.groundDist,Ce={x:R+u.crankRadius,y:D},ve={x:t,y:F+(L-u.rockerLength)};return Math.sqrt(Math.pow(Ce.x-ve.x,2)+Math.pow(Ce.y-ve.y,2))},we=e.createSpringJoint(K,Z,{id:A++,anchorA:fn,anchorB:en,length:xe(),frequencyHz:u.conRodFreq,dampingRatio:u.conRodDamping}),nn=()=>{const R=F-u.groundDist,D=t+u.escXOffset;z.x=D,z.y=R,K.x=D,K.y=R,Qe.localAnchorA=z.worldToLocal({x:D,y:R}),we.localAnchorA={x:u.crankRadius,y:0},we.localAnchorB={x:0,y:-u.rockerLength},we.length=xe(),we.frequencyHz=u.conRodFreq,we.dampingRatio=u.conRodDamping};e.scoreState={fastGear:K,pendulum:Z,params:u,updateSimulation:nn,updateSliderUI:M,optStatus:w,lastFastR:K.r,lastPendRs:Z.rs,lastRsSign:Math.sign(Z.rs),rsSignChanges:0,maxAngle:-1/0,minAngle:1/0,hasCrossedZero:!1,history:[],periodTimes:[],lastPendSide:Math.sign(Z.r),lastPendCrossing:0,scoreDisplay:f,isOptimizing:!1};const Pt=8/60,In=t+1.5,Bn=S+.5,$n=A++,Un=e.createBody({id:$n,x:In,y:Bn,type:o.bodyTypes.FIXED_OBJECT,color:"#888"});Un.createFixture({id:$n,shape:o.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const Vn=A++,wn=e.createBody({id:Vn,x:In,y:Bn,mass:.2,r:0,color:"#44ff44"});wn.createFixture({id:Vn,shape:o.shapes.CIRCLE,radius:1,categoryBits:d,maskBits:0}),wn.angularDamping=.02;const Kn=e.createHingeJoint(Un,wn,{id:A++,worldAnchor:{x:In,y:Bn}});e.createGearJoint(Qe,Kn,{id:A++,ratio:.25});const tn=l/60*Math.PI*2,Zn=A++,Cn=e.createBody({id:Zn,x:t,y:n,mass:.2,r:tn,color:"#ff4444"});Cn.createFixture({id:Zn,shape:o.shapes.CIRCLE,radius:.6,categoryBits:d,maskBits:0}),Cn.angularDamping=.02;const vn=e.createHingeJoint(J,Cn,{id:A++,worldAnchor:{x:t,y:n}});e.createGearJoint(Kn,vn,{id:A++,ratio:Pt/.25});const on=h/60*Math.PI*2,an=p/12*Math.PI*2,sn=3.5,rn=3,dn=2;for(let R=0;R<12;R++){const D=R/12*Math.PI*2-Math.PI/2,Ce=3.8,ve=4,cn=A++;e.createBody({id:cn,x:t+Math.cos(D)*(Ce+ve)/2,y:n+Math.sin(D)*(Ce+ve)/2,r:D+Math.PI/2,type:o.bodyTypes.FIXED_OBJECT,color:"#999"}).createFixture({id:cn,shape:o.shapes.BOX,width:R%3===0?.2:.1,height:.4,categoryBits:a,maskBits:0})}const Qn=A++;_n=e.createBody({id:Qn,x:t+Math.sin(tn)*(sn/2-.2),y:n-Math.cos(tn)*(sn/2-.2),r:tn,mass:.1,color:"#ff4444"}),_n.createFixture({id:Qn,shape:o.shapes.BOX,width:.05,height:sn,categoryBits:r,maskBits:0,restitution:0});const Gt=e.createHingeJoint(J,_n,{id:A++,worldAnchor:{x:t,y:n},anchorB:{x:0,y:sn/2-.2}});e.createGearJoint(vn,Gt,{id:A++,ratio:-1});const Tn=t-1.5,An=n-1.5,et=A++,nt=e.createBody({id:et,x:Tn,y:An,type:o.bodyTypes.FIXED_OBJECT,color:"#888"});nt.createFixture({id:et,shape:o.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const tt=A++,En=e.createBody({id:tt,x:Tn,y:An,mass:.2,r:0,color:"#4444ff"});En.createFixture({id:tt,shape:o.shapes.CIRCLE,radius:1,categoryBits:d,maskBits:0}),En.angularDamping=.01;const ot=e.createHingeJoint(nt,En,{id:A++,worldAnchor:{x:Tn,y:An}});e.createGearJoint(vn,ot,{id:A++,ratio:1/10});const at=A++,Mn=e.createBody({id:at,x:t,y:n,mass:.2,r:on,color:"#4444ff"});Mn.createFixture({id:at,shape:o.shapes.CIRCLE,radius:.8,categoryBits:d,maskBits:0}),Mn.angularDamping=.01;const Fn=e.createHingeJoint(J,Mn,{id:A++,worldAnchor:{x:t,y:n}});e.createGearJoint(ot,Fn,{id:A++,ratio:1/6});const st=A++;Hn=e.createBody({id:st,x:t+Math.sin(on)*(rn/2-.3),y:n-Math.cos(on)*(rn/2-.3),r:on,mass:.2,color:"#4444ff"}),Hn.createFixture({id:st,shape:o.shapes.BOX,width:.12,height:rn,categoryBits:r,maskBits:0});const jt=e.createHingeJoint(J,Hn,{id:A++,worldAnchor:{x:t,y:n},anchorB:{x:0,y:rn/2-.3}});e.createGearJoint(Fn,jt,{id:A++,ratio:-1});const kn=t+2,Rn=n-1,it=A++,rt=e.createBody({id:it,x:kn,y:Rn,type:o.bodyTypes.FIXED_OBJECT,color:"#888"});rt.createFixture({id:it,shape:o.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const dt=A++,On=e.createBody({id:dt,x:kn,y:Rn,mass:.2,r:0,color:"#cccc44"});On.createFixture({id:dt,shape:o.shapes.CIRCLE,radius:1,categoryBits:d,maskBits:0}),On.angularDamping=.01;const ct=e.createHingeJoint(rt,On,{id:A++,worldAnchor:{x:kn,y:Rn}});e.createGearJoint(Fn,ct,{id:A++,ratio:1/3});const lt=A++,Sn=e.createBody({id:lt,x:t,y:n,mass:.2,r:an,color:"#cc8844"});Sn.createFixture({id:lt,shape:o.shapes.CIRCLE,radius:1.1,categoryBits:d,maskBits:0}),Sn.angularDamping=.01;const ht=e.createHingeJoint(J,Sn,{id:A++,worldAnchor:{x:t,y:n}});e.createGearJoint(ct,ht,{id:A++,ratio:1/4});const pt=A++;Jn=e.createBody({id:pt,x:t+Math.sin(an)*(dn/2-.4),y:n-Math.cos(an)*(dn/2-.4),r:an,mass:.3,color:"#cc8844"}),Jn.createFixture({id:pt,shape:o.shapes.BOX,width:.18,height:dn,categoryBits:r,maskBits:0});const Yt=e.createHingeJoint(J,Jn,{id:A++,worldAnchor:{x:t,y:n},anchorB:{x:0,y:dn/2-.4}});e.createGearJoint(ht,Yt,{id:A++,ratio:-1})},onTickRaw:`(world, dt) => {
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
	}`,onTick:(e,t)=>{const n=e.scoreState;if(n){const i=performance.now(),d=8e3;let r=0,c=!1;if(n.fastGear){const B=n.fastGear.r-n.lastFastR;B<-.01&&(c=!0),r=Math.max(0,B)/(Math.PI*2),n.lastFastR=n.fastGear.r}const l=n.pendulum.r,h=n.pendulum.rs,p=(h-n.lastPendRs)/t;n.lastPendRs=h;const u=Math.sign(h);if(u!==n.lastRsSign&&u!==0&&(n.rsSignChanges++,n.lastRsSign=u),n.maxAngle=Math.max(n.maxAngle,l),n.minAngle=Math.min(n.minAngle,l),n.history.push({time:i,rotDelta:r,isReversal:c,pendR:l,pendRs:h,pendRa:p}),n.pendulum){const B=Math.sign(n.pendulum.r);if(B!==n.lastPendSide&&B!==0){if(n.hasCrossedZero=!0,n.lastPendCrossing>0){const C=(i-n.lastPendCrossing)/500;C>.5&&C<10&&n.periodTimes.push({time:i,period:C})}n.lastPendCrossing=i,n.lastPendSide=B}}const y=i-d;for(;n.history.length>0&&n.history[0].time<y;)n.history.shift();for(;n.periodTimes.length>0&&n.periodTimes[0].time<y;)n.periodTimes.shift();let g=0,x=0,f=0;if(n.history.length>0){let B=0,C=0;for(const M of n.history)B+=Math.abs(M.pendRa),C+=Math.abs(M.pendRs),f=Math.max(f,Math.abs(M.pendRa));g=B/n.history.length,x=C/n.history.length}const I=(n.maxAngle-n.minAngle)/2;let b=Math.min(I,.6)*2e3;const w=Math.abs(n.maxAngle+n.minAngle);if(b-=w*1e3,b-=g*10,b-=f*2,n.rsSignChanges>2&&(b-=(n.rsSignChanges-2)*500),b+=x*100,n.hasCrossedZero||(b-=1e4),I<.1&&(b-=5e3),!n.isOptimizing&&n.history.length===0&&(n.maxAngle=-1/0,n.minAngle=1/0,n.hasCrossedZero=!1,n.rsSignChanges=0),n.scoreDisplay.textContent=`Score: ${Math.floor(b)} | Amp: ${I.toFixed(2)} | Jit: ${Math.max(0,n.rsSignChanges-2)}${n.hasCrossedZero?"":" [STUCK]"}`,n.isOptimizing){const B=["crankRadius","groundDist","rockerLength","escXOffset","conRodFreq"];n.optimizationStage==="PREPARE"?(n.bestScore=-1/0,n.optimizationStage="TWEAK",n.evalTimer=i+d,n.improvedThisCycle=!1,n.maxAngle=-1/0,n.minAngle=1/0,n.hasCrossedZero=!1,n.rsSignChanges=0):i>n.evalTimer&&n.optimizationStage==="TWEAK"&&(b>n.bestScore?(n.bestScore=b,n.improvedThisCycle=!0,n.optStatus.textContent=`Improved ${B[n.optParamIndex]} (Best: ${Math.floor(b)})`):(n.params[B[n.optParamIndex]]-=n.epsilon*n.optDirection,n.updateSimulation(),n.updateSliderUI(B[n.optParamIndex])),n.optDirection*=-1,n.optDirection===1&&(n.optParamIndex++,n.optParamIndex>=B.length&&(n.optParamIndex=0,n.improvedThisCycle||(n.epsilon*=.7),n.improvedThisCycle=!1)),n.params[B[n.optParamIndex]]+=n.epsilon*n.optDirection,n.updateSimulation(),n.updateSliderUI(B[n.optParamIndex]),n.maxAngle=-1/0,n.minAngle=1/0,n.hasCrossedZero=!1,n.rsSignChanges=0,n.evalTimer=i+d,n.optStatus.textContent=`Testing ${B[n.optParamIndex]} (${n.optDirection>0?"+":"-"}) Best: ${Math.floor(n.bestScore)}`)}else n.optStatus.textContent="Optimizer: Idle"}const a=new Date().toLocaleTimeString();if(o.debug.clearLabels(),o.debug.addLabel({text:"Mechanical Clockwork",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"}),o.debug.addLabel({text:a,x:5,y:9.5,fontSize:"36px Arial",color:"#fff",position:"on-top"}),Z){const i=(Z.r*180/Math.PI).toFixed(1);o.debug.addLabel({text:`Pendulum: ${i}°`,x:8,y:8,fontSize:"16px Arial",color:"#cd853f",position:"on-top"})}},onCleanup:e=>{const t=document.getElementById("clock-tuner-gui");t&&t.remove()}});let q=1,ae=null;const ao=new v({name:"Gnome Omega Engine",key:"gnome-omega",description:["A detailed simulation of a **Gnome Omega** rotary engine. In this classic radial design, the crankshaft remains stationary while the entire cylinder block rotates around it.","### Features","- **Stationary Crankshaft**: A fixed pivot point (red) offset from the center.","- **Rotating Crankcase**: The main grey hub that carries the cylinders.","- **Weld Constraints**: Cylinders are 'welded' to the hub using a combination of `HingeJoint` and `DistanceJoint` for maximum stability.","- **Reciprocating Motion**: Pistons and connecting rods are synchronized via `HingeJoint` constraints.","- **Collision Masks**: Bitwise filtering ensures pistons only interact with their respective cylinder walls.","Click **Reset** if the simulation becomes unstable due to extreme angular velocities."].join(`

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
	}`,onInit:e=>{e.clear(),o.debug.showAabbs=!1,q=1,ae=null;const t=5,n=4.5,s=.8,a=7,i=2.5,d=256,r=512,c=1024,l=2048,h=4096,p=q++,u=e.createBody({id:p,x:t,y:n,type:o.bodyTypes.FIXED_OBJECT,color:"#888"});u.createFixture({id:p,shape:o.shapes.CIRCLE,radius:.15,categoryBits:d,maskBits:0});const y=q++,g=e.createBody({id:y,x:t,y:n+s,type:o.bodyTypes.FIXED_OBJECT,color:"#ff4444"});g.createFixture({id:y,shape:o.shapes.CIRCLE,radius:.1,categoryBits:d,maskBits:0});const x=q++;ae=e.createBody({id:x,x:t,y:n,mass:50,color:"#aaa"}),ae.createFixture({id:x,shape:o.shapes.CIRCLE,radius:.8,categoryBits:r,maskBits:0,restitution:0}),e.createHingeJoint(u,ae,{id:q++,worldAnchor:{x:t,y:n}});for(let f=0;f<a;f++){const I=f/a*Math.PI*2,b=Math.cos(I),w=Math.sin(I),B=I-Math.PI/2,C=2.6,M=.28,F=2.5,S=1,j=K=>{const Qe=t+b*C+-w*(K*S/2),fn=n+w*C+b*(K*S/2),en=q++,xe=e.createBody({id:en,x:Qe,y:fn,r:B,mass:1,color:"#bbb"});xe.createFixture({id:en,shape:o.shapes.BOX,width:M,height:F,categoryBits:c,maskBits:l,restitution:0,sFriction:0,kFriction:0});const we=xe.localToWorld({x:0,y:-F/2}),nn=xe.localToWorld({x:0,y:F/2});e.createHingeJoint(ae,xe,{id:q++,worldAnchor:we}),e.createDistanceJoint(ae,xe,{id:q++,worldAnchor:nn})};j(-1),j(1);const L=s*Math.sin(I)+Math.sqrt(i*i-Math.pow(s*Math.cos(I),2)),H=t+b*L,re=n+w*L,V=q++,z=e.createBody({id:V,x:H,y:re,r:B,mass:.5,color:"#ddd"});z.createFixture({id:V,shape:o.shapes.BOX,width:.7,height:1,categoryBits:l,maskBits:c,restitution:0,sFriction:0,kFriction:0});const de=(t+H)/2,J=(n+s+re)/2,ee=Math.atan2(re-(n+s),H-t)-Math.PI/2,Ge=q++,Oe=e.createBody({id:Ge,x:de,y:J,r:ee,mass:.2,color:"#fff"});Oe.createFixture({id:Ge,shape:o.shapes.BOX,width:.15,height:i,categoryBits:h,maskBits:0,restitution:0}),e.createHingeJoint(Oe,g,{id:q++,anchorA:{x:0,y:-i/2},anchorB:{x:0,y:0}}),e.createHingeJoint(Oe,z,{id:q++,anchorA:{x:0,y:i/2},anchorB:{x:0,y:0}})}e.setGravity(0,0),ae.rs=2},onTickRaw:`(world, dt) => {
		if (engineHub) {
			// Apply a gentle impulse to maintain rotation
			if (Math.abs(engineHub.rs) < 0.9) {
				engineHub.applyAngularImpulse(5);
			}
		}
	}`,onTick:(e,t)=>{ae&&Math.abs(ae.rs)<.9&&ae.applyAngularImpulse(5)}});let Ue=1,le=null;const Le=[{name:"Cherry",radius:.15,mass:.1,color:"#ff4444",score:1},{name:"Strawberry",radius:.22,mass:.2,color:"#ff6666",score:3},{name:"Grape",radius:.28,mass:.3,color:"#9933ff",score:6},{name:"Dekopon",radius:.35,mass:.4,color:"#ff9933",score:10},{name:"Persimmon",radius:.42,mass:.5,color:"#ff6600",score:15},{name:"Apple",radius:.5,mass:.7,color:"#cc0000",score:21},{name:"Pear",radius:.58,mass:.9,color:"#ffff66",score:28},{name:"Peach",radius:.68,mass:1.2,color:"#ff99cc",score:36},{name:"Pineapple",radius:.8,mass:1.6,color:"#ffff00",score:45},{name:"Melon",radius:.95,mass:2.2,color:"#99ff33",score:55},{name:"Watermelon",radius:1.15,mass:3,color:"#006600",score:66}];let E={score:0,nextFruitLevel:0,isGameOver:!1,lastDropTime:0,dropCooldown:500,mouseX:5,fruitIds:new Map,mergingIds:new Set,previewFruit:null};const ft=()=>{E.score=0,E.nextFruitLevel=Math.floor(Math.random()*5),E.isGameOver=!1,E.lastDropTime=0,E.mouseX=5,E.fruitIds.clear(),E.mergingIds.clear(),E.previewFruit=null,Ue=1},so=e=>(e-o.debug.offsetX)/(o.debug.zoom*100),Rt=new v({name:"Fruit Merge",key:"fruit-merge",description:["A physics-based arcade game demonstrating dynamic object spawning and collision events.","Drop fruits into the bucket. Identical fruits will **merge** into the next larger fruit tier on contact.","### Controls","- **Mouse Move**: Position the preview fruit","- **Click**: Drop fruit","**Game Over** occurs if any fruit falls out of the world boundaries."].join(`

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
	}`,onInit:e=>{e.clear(),ft(),o.debug.showAabbs=!1,e.setGravity(0,9.8),e.setHasRestitution(!0),e.setHasFriction(!0);const t=5,n=6,s=4,a=5,i=.2,d=Ue++;e.createBody({id:d,x:t,y:n+a/2+i/2,type:o.bodyTypes.FIXED_OBJECT,color:"#664422"}).createFixture({shape:o.shapes.BOX,width:s+i*2,height:i});const r=Ue++;e.createBody({id:r,x:t-s/2-i/2,y:n,type:o.bodyTypes.FIXED_OBJECT,color:"#664422"}).createFixture({shape:o.shapes.BOX,width:i,height:a});const c=Ue++;e.createBody({id:c,x:t+s/2+i/2,y:n,type:o.bodyTypes.FIXED_OBJECT,color:"#664422"}).createFixture({shape:o.shapes.BOX,width:i,height:a});const l=(u,y,g,x=!1)=>{if(g>=Le.length)return null;const f=Le[g],I=Ue++,b=e.createBody({id:I,x:u,y,mass:f.mass,color:f.color});return b.createFixture({shape:o.shapes.CIRCLE,radius:f.radius,restitution:.2,sFriction:.5,kFriction:.3}),b&&(b.wantsEvents=!0,E.fruitIds.set(I,g),x&&(b.vx=(Math.random()-.5)*.1)),b};e.onCollisionStart=(u,y)=>{if(E.isGameOver)return;const g=E.fruitIds.get(u),x=E.fruitIds.get(y);if(g!==void 0&&x!==void 0&&g===x){if(E.mergingIds.has(u)||E.mergingIds.has(y))return;const f=g;if(f>=Le.length-1)return;E.mergingIds.add(u),E.mergingIds.add(y);const I=e.getBodyById(u),b=e.getBodyById(y);if(I&&b){const w=(I.x+b.x)/2,B=(I.y+b.y)/2;setTimeout(()=>{e.removeObject(u),e.removeObject(y),E.fruitIds.delete(u),E.fruitIds.delete(y),E.mergingIds.delete(u),E.mergingIds.delete(y),l(w,B,f+1)&&(E.score+=Le[f+1].score)},0)}}},le=document.getElementById("debug-canvas"),e._onMouseMove&&le.removeEventListener("mousemove",e._onMouseMove),e._onClick&&le.removeEventListener("click",e._onClick);const h=u=>{if(E.isGameOver)return;const y=le.getBoundingClientRect();E.mouseX=so(u.clientX-y.left);const g=Le[E.nextFruitLevel].radius;E.mouseX=Math.max(t-s/2+g,Math.min(t+s/2-g,E.mouseX))},p=u=>{if(E.isGameOver){e.clear(),ft(),Rt.onInit(e);return}const y=Date.now();y-E.lastDropTime>E.dropCooldown&&(l(E.mouseX,n-a/2-1,E.nextFruitLevel,!0),E.nextFruitLevel=Math.floor(Math.random()*5),E.lastDropTime=y)};e._onMouseMove=h,e._onClick=p,le.addEventListener("mousemove",h),le.addEventListener("click",p)},onTickRaw:`(world, dt) => {
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
	}`,onTick:(e,t)=>{if(o.debug.clearLabels(),E.isGameOver){o.debug.addLabel({text:"GAME OVER",x:5,y:4,fontSize:"48px Arial",color:"#ff4444",position:"on-top"}),o.debug.addLabel({text:`Final Score: ${E.score}`,x:5,y:5,fontSize:"24px Arial",color:"#fff",position:"on-top"}),o.debug.addLabel({text:"Click to Restart",x:5,y:6,fontSize:"20px Arial",color:"#888",position:"on-top"});return}o.debug.addLabel({text:`Score: ${E.score}`,x:.5,y:.5,fontSize:"24px Arial",color:"#fff",position:"on-top"});const n=Le[E.nextFruitLevel];o.debug.addLabel({text:`Next: ${n.name}`,x:8,y:.5,fontSize:"18px Arial",color:n.color,position:"on-top"}),o.debug.addLabel({text:"●",x:E.mouseX,y:1.5,fontSize:`${n.radius*200}px Arial`,color:n.color,position:"on-top"}),e.iterateBodies(a=>{E.fruitIds.has(a.id)&&a.y>12&&(E.isGameOver=!0)}),o.debug.addLabel({text:"Fruit Merge",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"})},onCleanup:e=>{le&&(le.removeEventListener("mousemove",e._onMouseMove),le.removeEventListener("click",e._onClick),delete e._onMouseMove,delete e._onClick)}});let X=1,_=null,Ae=null,De=null,Xe=null,_e=null,He=null,Ee=[],be={},U=null,Re=null,Ie=null;const Je=1,We=2,fe=4,Ot=(e,t)=>({x:(e-o.debug.offsetX)/(o.debug.zoom*100),y:(t-o.debug.offsetY)/(o.debug.zoom*100)}),io=(e,t)=>{if(e.button!==0)return;const n=Ie.getBoundingClientRect(),s=Ot(e.clientX-n.left,e.clientY-n.top),a=t.queryBodiesAtPoint(s.x,s.y);if(a.length>0){const i=a[0],d=t.getBodyById(i);d&&d.type!==o.bodyTypes.FIXED_OBJECT&&(U=t.createBody({id:999999,x:s.x,y:s.y,type:o.bodyTypes.FIXED_OBJECT,color:"transparent"}),U.createFixture({id:999999,shape:o.shapes.CIRCLE,radius:.05,maskBits:0}),Re=t.createSpringJoint(U,d,{id:999998,worldAnchor:s,frequencyHz:5,dampingRatio:1,length:0}))}},ro=e=>{if(U){const t=Ie.getBoundingClientRect(),n=Ot(e.clientX-t.left,e.clientY-t.top);U.x=n.x,U.y=n.y}},co=(e,t)=>{Re&&(t.removeJoint(Re.id),Re=null),U&&(t.removeObject(U.id),U=null)},St=new v({name:"Motorcycle Trials",key:"motorcycle",description:["A physically-driven motorcycle featuring multi-joint suspension and a gear-driven powertrain.","### Controls","- **D / A**: Throttle / Reverse","- **W / S**: Lean / Balance","- **R**: Reset Simulation","### Technical Features","- **Power Transfer**: Engine-to-wheel torque transfer using `GearJoint` constraints.","- **Suspension**: A network of `SpringJoint` constraints for authentic front/rear suspension travel.","- **Procedural Terrain**: Dynamic generation with optimized **Collision Masks** (terrain-terrain collisions are disabled for performance)."].join(`

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
	}`,onInit:e=>{e.clear(),o.debug.showAabbs=!1,o.debug.showForceVectors=!1,X=1,Ee=[],be={};const t=5,n=5;e.setGravity(0,9.81),e.setHasRestitution(!0),e.setHasFriction(!0);const s=X++;_=e.createBody({id:s,x:t,y:n,mass:10,color:"#ff4444"}),_.createFixture({id:s,shape:o.shapes.BOX,width:1.2,height:.4,categoryBits:Je,maskBits:fe}),_.angularDamping=1;const a=X++;Ae=e.createBody({id:a,x:t,y:n-.15,mass:5,color:"#444"}),Ae.createFixture({id:a,shape:o.shapes.CIRCLE,radius:.25,categoryBits:0,maskBits:0});const i=e.createHingeJoint(_,Ae,{id:X++,worldAnchor:{x:t,y:n-.15}}),d=X++;He=e.createBody({id:d,x:t-.6,y:n+.2,mass:1,color:"#666"}),He.createFixture({shape:o.shapes.BOX,width:.6,height:.1,categoryBits:Je,maskBits:fe}),He.angularDamping=1,e.createHingeJoint(_,He,{id:X++,anchorA:{x:-.4,y:.1},anchorB:{x:.3,y:0}}),e.createSpringJoint(_,He,{id:X++,anchorA:{x:-.7,y:-.2},anchorB:{x:-.3,y:0},frequencyHz:25,dampingRatio:.8});const r=X++;Xe=e.createBody({id:r,x:t-.9,y:n+.2,mass:2,color:"#333"}),Xe.createFixture({id:r,shape:o.shapes.CIRCLE,radius:.4,categoryBits:We,maskBits:fe}),Xe.fixtures[0].kineticFriction=2.5,Xe.fixtures[0].staticFriction=3,Xe.angularDamping=.5;const c=e.createHingeJoint(He,Xe,{id:X++,anchorA:{x:-.3,y:0},anchorB:{x:0,y:0}});e.createGearJoint(i,c,{id:X++,ratio:2});const l=X++;_e=e.createBody({id:l,x:t+.7,y:n+.2,r:.3,mass:1,color:"#666"}),_e.createFixture({shape:o.shapes.BOX,width:.1,height:.8,categoryBits:Je,maskBits:fe}),_e.angularDamping=1,e.createHingeJoint(_,_e,{id:X++,anchorA:{x:.5,y:0},anchorB:{x:0,y:-.3}}),e.createSpringJoint(_,_e,{id:X++,anchorA:{x:.2,y:.2},anchorB:{x:0,y:.3},frequencyHz:20,dampingRatio:.9});const h=X++;De=e.createBody({id:h,x:t+.8,y:n+.5,mass:2,color:"#333"}),De.createFixture({id:h,shape:o.shapes.CIRCLE,radius:.4,categoryBits:We,maskBits:fe}),De.fixtures[0].kineticFriction=2,De.fixtures[0].staticFriction=2.5,De.angularDamping=.5,e.createHingeJoint(_e,De,{id:X++,anchorA:{x:0,y:.4},anchorB:{x:0,y:0}});const p=X++,u=e.createBody({id:p,x:t,y:n+2,type:o.bodyTypes.FIXED_OBJECT,color:"#444"});u.createFixture({shape:o.shapes.BOX,width:20,height:1,categoryBits:fe,maskBits:Je|We}),Ee.push(u);const y=X++;e.createBody({id:y,x:-7.72,y:.01,r:1.2,type:o.bodyTypes.FIXED_OBJECT,color:"#333"}).createFixture({shape:o.shapes.BOX,width:15,height:1,categoryBits:fe,maskBits:Je|We});const g=B=>be[B.code]=!0,x=B=>be[B.code]=!1;Ie=document.getElementById("debug-canvas");const f=B=>io(B,e),I=B=>ro(B),b=B=>co(B,e),w=e._motorcycleListeners;w&&(window.removeEventListener("keydown",w.onKeyDown),window.removeEventListener("keyup",w.onKeyUp),Ie&&Ie.removeEventListener("mousedown",w.mouseDownHandler),window.removeEventListener("mousemove",w.mouseMoveHandler),window.removeEventListener("mouseup",w.mouseUpHandler)),window.addEventListener("keydown",g),window.addEventListener("keyup",x),Ie.addEventListener("mousedown",f),window.addEventListener("mousemove",I),window.addEventListener("mouseup",b),e._motorcycleListeners={onKeyDown:g,onKeyUp:x,mouseDownHandler:f,mouseMoveHandler:I,mouseUpHandler:b}},onTickRaw:`(world, dt) => {
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
	}`,onTick:(e,t)=>{if(!_)return;const n=75,s=100,a=100;if(be.KeyD&&Ae.rs<a&&Ae.applyAngularImpulse(-n*t),be.KeyA&&Ae.rs>-a&&Ae.applyAngularImpulse(n*t),be.KeyW&&_.applyAngularImpulse(-s*t),be.KeyS&&_.applyAngularImpulse(s*t),be.KeyR){St.init(e);return}const i=Ee[Ee.length-1];if(i.x<_.x+25){const d=6+Math.random()*8,r=1.2,c=(Math.random()-.5)*.5,l=Math.random()<.2?1.5:0,h=i.localToWorld({x:i.fixtures[0].width/2,y:-i.fixtures[0].height/2}),p=h.x+l;let u=h.y+(l>0?(Math.random()-.5)*3:0);u=Math.max(2,Math.min(8,u));const y=Math.cos(c),g=Math.sin(c),x=p+d/2*y-r/2*g,f=u+d/2*g+r/2*y,I=X++,b=e.createBody({id:I,x,y:f,r:c,type:o.bodyTypes.FIXED_OBJECT,color:`hsl(${20+Math.random()*40}, 30%, ${30+Math.random()*20}%)`});if(b.createFixture({shape:o.shapes.BOX,width:d,height:r,categoryBits:fe,maskBits:Je|We}),Ee.push(b),Ee.length>50){const w=Ee.shift();e.removeObject(w.id)}}o.debug.clearLabels(),_.x<15&&(o.debug.addLabel({text:"Motorcycle Trials",x:5,y:3,fontSize:"28px Arial",color:"#fff",position:"on-top"}),o.debug.addLabel({text:"Use D/A to drive and W/S to balance!",x:5,y:3.5,fontSize:"16px Arial",color:"#aaa",position:"on-top"}))},onRender:e=>{if(!_)return;const t=e.interpolationAlpha,n=_.x*t+_.prevX*(1-t),s=_.y*t+_.prevY*(1-t),a=o.debug.canvas?.width||800,i=o.debug.canvas?.height||600,d=o.debug.zoom,r=a/2-n*100*d,c=i/2-s*100*d;o.debug.offsetX+=(r-o.debug.offsetX)*.1,o.debug.offsetY+=(c-o.debug.offsetY)*.1},onCleanup:e=>{const t=e._motorcycleListeners;t&&(window.removeEventListener("keydown",t.onKeyDown),window.removeEventListener("keyup",t.onKeyUp),Ie&&Ie.removeEventListener("mousedown",t.mouseDownHandler),window.removeEventListener("mousemove",t.mouseMoveHandler),window.removeEventListener("mouseup",t.mouseUpHandler),delete e._motorcycleListeners),Re&&(e.removeJoint(Re.id),Re=null),U&&(e.removeObject(U.id),U=null),o.debug.offsetX=0,o.debug.offsetY=0}}),lo=new v({name:"Newton's Cradle",key:"newtons-cradle",description:["A classic demonstration of conservation of momentum and energy. This simulation shows how kinetic energy and momentum are transferred through a series of suspended spheres.","### Features","- **Elastic Collisions**: Restitution is set to `1.0` to ensure near-perfect energy conservation during impacts.","- **Distance Constraints**: Each sphere is suspended by a `DistanceJoint` connected to a fixed anchor point.","- **Low Friction**: Friction is set to zero to allow the pendulum motion to persist for a long duration.","The first ball is released from an offset to initiate the chain reaction. Click **Reset** to restart the sequence."].join(`

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
	}`,onInit:e=>{e.clear(),e.setGravity(0,9.8),o.debug.showAabbs=!1;const t=5,n=.4,s=2,a=4,i=5;for(let d=0;d<t;d++){const r=i+(d-(t-1)/2)*n*2.01,c=1e3+d,l=2e3+d,h=e.createBody({id:c,x:r,y:s,type:o.bodyTypes.FIXED_OBJECT,color:"#555"});h.createFixture({id:c,shape:o.shapes.BOX,width:.2,height:.2,maskBits:0});const p=d===0?r-3:r,u=d===0?s+Math.sqrt(a*a-9):s+a,y=e.createBody({id:l,x:p,y:u,mass:1,color:d===0||d===t-1?"#a855f7":"#00f2ff",linearDamping:0,angularDamping:0});y.createFixture({id:l,shape:o.shapes.CIRCLE,radius:n,restitution:1,sFriction:0,kFriction:0}),e.createDistanceJoint(h,y,{id:3e3+d,length:a,anchorA:{x:0,y:0},anchorB:{x:0,y:0}})}}}),ye=32,W=20,ho=.25,Lt=16,ue=.3,Nn=.4,he=2.4,po=6e3,yo=150,Y=.8,Ke=Y/2*Math.SQRT2,uo=2.2,Wn=1,Dt=2,pn=4,Pn=8,It=["#22d3ee","#f472b6","#a3e635","#facc15","#fb923c","#c084fc","#34d399","#f87171","#60a5fa","#e879f9","#fde047","#4ade80","#38bdf8","#fda4af"],go={seed:0,nav:null,bots:[],crates:[],gates:[],walls:[],pillars:[],free:[],reqToBot:new Map,nextReq:1,tick:0,totalArrivals:0,totalReplans:0,totalNoPath:0,batchMs:0,batchMaxMs:0,lastSecond:{replans:0,maxMs:0,nodes:0,ticks:0,corridor:0,grid:0},shown:{replans:0,maxMs:0,nodes:0,corridor:0,grid:0},view:{grid:!1,clusters:!1,paths:!0},dom:null,cellImage:null},m=go;let xn=1;const Q=()=>(xn=xn*1664525+1013904223>>>0,xn/4294967296),P=(e,t)=>e+(t-e)*Q(),Bt=(e,t)=>({x:e.bounds.minX+(t%e.cols+.5)*e.cell,y:e.bounds.minY+(Math.floor(t/e.cols)+.5)*e.cell});function N(e,t,n,s,a,i=0){m.walls.push({x:t,y:n,w:s,h:a,angle:i}),e.createBody({type:o.bodyTypes.FIXED_OBJECT,x:t,y:n,r:i,color:"#475569",shape:o.shapes.BOX,width:s,height:a,categoryBits:Wn})}function mo(e,t,n,s){m.pillars.push({x:t,y:n,r:s}),e.createBody({type:o.bodyTypes.FIXED_OBJECT,x:t,y:n,color:"#64748b",shape:o.shapes.CIRCLE,radius:s,categoryBits:Wn})}function xo(e,t,n,s,a,i){const r=new Array(s*a).fill(!0),c=new Array(s*a).fill(!0),l=new Array(s*a).fill(!1),h=[0];for(l[0]=!0;h.length;){const p=h[h.length-1],u=p%s,y=Math.floor(p/s),g=[];if(u>0&&!l[p-1]&&g.push(p-1),u<s-1&&!l[p+1]&&g.push(p+1),y>0&&!l[p-s]&&g.push(p-s),y<a-1&&!l[p+s]&&g.push(p+s),!g.length){h.pop();continue}const x=g[Math.floor(Q()*g.length)];x===p+1?r[p]=!1:x===p-1?r[x]=!1:x===p+s?c[p]=!1:c[x]=!1,l[x]=!0,h.push(x)}for(let p=0;p<4;p++){const u=Math.floor(Q()*s*a);u%s<s-1?r[u]=!1:Math.floor(u/s)<a-1&&(c[u]=!1)}for(let p=0;p<a;p++)for(let u=0;u<s;u++){const y=p*s+u,g=t+u*i,x=n+p*i,f=u===s-1;r[y]&&!(f&&(p===1||p===a-1))&&N(e,g+i,x+i/2,.2,i+.2);const I=p===a-1;c[y]&&!(I&&(u===1||u===s-2))&&N(e,g+i/2,x+i,i+.2,.2)}}function bo(e){N(e,ye/2,.15,ye,.3),N(e,ye/2,W-.15,ye,.3),N(e,.15,W/2,.3,W),N(e,ye-.15,W/2,.3,W),xo(e,.3,.3,5,4,2.2);const t=21,n=.3,s=[[2.6,4.8],[9,11],[15.2,17.4]];let a=.3;for(const[r,c]of s)N(e,t,(a+r)/2,n,r-a),a=c;N(e,t,(a+W-.3)/2,n,W-.3-a);for(const r of[0,2]){const[c,l]=s[r],h=l-c+.1,p=(c+l)/2,u=e.createBody({type:o.bodyTypes.KINEMATIC_OBJECT,x:t,y:p,color:"#f43f5e",shape:o.shapes.BOX,width:n*.8,height:h,categoryBits:Dt});m.gates.push({body:u,x:t,closedY:p,openY:p-h,y:p,w:n*.8,h,open:r===2,timer:3+r*2.5}),r===2&&(u.y=p-h)}const i=[];for(let r=0;i.length<9&&r<400;r++){const c=P(.9,2.4),l=P(22.8,ye-1.8),h=P(1.8,W-1.8);i.some(p=>Math.hypot(p.x-l,p.y-h)<(p.s+c)/2+1.6)||(i.push({x:l,y:h,s:c}),N(e,l,h,c,P(.5,1)*c,P(0,Math.PI)))}const d=[];for(let r=0;d.length<6&&r<400;r++){const c=P(2.5,18.5),l=P(11.5,W-2);if(d.some(p=>Math.hypot(p.x-c,p.y-l)<3.6))continue;d.push({x:c,y:l});const h=P(2,3.8);Q()<.5?(N(e,c,l,h,.25),Q()<.6&&N(e,c+h/2,l+(Q()<.5?1:-1)*.75,.25,1.75)):(N(e,c,l,.25,h),Q()<.6&&N(e,c+(Q()<.5?1:-1)*.75,l+h/2,1.75,.25))}for(let r=0,c=0;r<5&&c<200;c++){const l=P(2,19),h=P(11,W-1.5);d.some(p=>Math.hypot(p.x-l,p.y-h)<2.4)||(d.push({x:l,y:h}),mo(e,l,h,P(.3,.55)),r++)}}function fo(e){const t=e.blocked,n=t.length,s=e.cols,a=new Int32Array(n).fill(-1);let i=[];const d=new Int32Array(n);for(let r=0;r<n;r++){if(t[r]||a[r]>=0)continue;let c=0,l=0;d[l++]=r,a[r]=r;const h=[];for(;c<l;){const p=d[c++];h.push(p);const u=p%s,y=[u>0?p-1:-1,u<s-1?p+1:-1,p-s,p+s];for(const g of y)g<0||g>=n||t[g]||a[g]>=0||(a[g]=r,d[l++]=g)}h.length>i.length&&(i=h)}return i}function bn(e,t,n=0){for(let s=0;s<60;s++){const a=Bt(e,m.free[Math.floor(Q()*m.free.length)]);if(!m.crates.some(i=>Math.hypot(i.body.x-a.x,i.body.y-a.y)<Ke+Nn+.3)&&!m.bots.some(i=>Math.hypot(i.goal.x-a.x,i.goal.y-a.y)<1.5)&&(!t||Math.hypot(a.x-t.x,a.y-t.y)>=n))return a}return Bt(e,m.free[Math.floor(Q()*m.free.length)])}function Ve(e,t){t.reqId&&(e.cancel(t.reqId),m.reqToBot.delete(t.reqId));const n=m.nextReq++;t.reqId=n,t.waiting=!0,t.sinceReplan=0,m.reqToBot.set(n,t);const s={x:t.body.x,y:t.body.y},a=Math.hypot(t.goal.x-s.x,t.goal.y-s.y)>6;e.request(n,s,t.goal,{mode:a?yt.HPA_CORRIDOR:yt.GRID}),a?m.lastSecond.corridor++:m.lastSecond.grid++}function qe(e,t){t.goal=bn(e,{x:t.body.x,y:t.body.y},9),t.path=[],t.stuckCount=0,t.sinceArrival=0,Ve(e,t)}const wt=(e,t,n)=>{const s=n.x-t.x,a=n.y-t.y,i=s*s+a*a,d=i>0?Math.max(0,Math.min(1,((e.x-t.x)*s+(e.y-t.y)*a)/i)):0;return Math.hypot(t.x+s*d-e.x,t.y+a*d-e.y)};function Io(e){let t={x:e.body.x,y:e.body.y},n=0;for(let s=e.idx;s<e.path.length&&n<5;s++){const a=e.path[s];for(const i of m.crates)if(wt({x:i.body.x,y:i.body.y},t,a)<Ke+ue*.6)return!0;for(const i of m.gates){const d={x:i.x,y:i.body.y-i.h/2},r={x:i.x,y:i.body.y+i.h/2},c=Math.hypot(a.x-t.x,a.y-t.y),l=Math.max(1,Math.ceil(c/.1));for(let h=0;h<=l;h++){const p={x:t.x+(a.x-t.x)*h/l,y:t.y+(a.y-t.y)*h/l};if(wt(p,d,r)<i.w/2+ue+.05)return!0}}n+=Math.hypot(a.x-t.x,a.y-t.y),t=a}return!1}function Bo(){if(typeof document>"u")return;const e=document.getElementById("canvas-container");if(!e)return;document.getElementById("nav-arena-overlay")?.remove(),document.getElementById("nav-arena-hud")?.remove();const t=document.createElement("canvas");t.id="nav-arena-overlay",t.style.cssText="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;",e.appendChild(t);const n=document.createElement("div");n.id="nav-arena-hud",n.style.cssText="position:absolute;bottom:10px;left:10px;z-index:3;padding:8px 10px;border-radius:6px;background:rgba(2,6,23,0.78);border:1px solid rgba(148,163,184,0.35);color:#e2e8f0;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;min-width:230px;";const s=document.createElement("div");n.appendChild(s);const a=document.createElement("div");a.style.cssText="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;";const i=[["paths","Paths"],["grid","Grid"],["clusters","Clusters"]];for(const[d,r]of i){const c=document.createElement("button"),l=()=>{c.style.cssText=`cursor:pointer;font:11px ui-monospace,monospace;padding:2px 8px;border-radius:4px;border:1px solid #64748b;color:#e2e8f0;background:${m.view[d]?"#0e7490":"transparent"};`};c.textContent=r,c.dataset.navArenaToggle=d,l(),c.addEventListener("click",()=>{m.view[d]=!m.view[d],l()}),a.appendChild(c)}n.appendChild(a),e.appendChild(n),m.dom={overlay:t,hud:n,stats:s}}function Ct(){if(!m.dom)return;const e=m.nav,t=e?e.hierarchyStats:{nodes:0,edges:0},n=m.gates.map(s=>s.open?"open":"shut").join(" / ");m.dom.stats.innerHTML=[`<b style="color:#22d3ee">Native nav</b> · ${m.bots.length} bots · ${e?.cols}×${e?.rows} cells`,`findPaths: <b>${m.batchMs.toFixed(3)} ms</b> avg · ${m.shown.maxMs.toFixed(2)} ms max`,`replans/s: <b>${m.shown.replans}</b> (${m.shown.corridor} corridor, ${m.shown.grid} grid)`,`nodes/s: ${m.shown.nodes} · queued: ${e?.queued??0}`,`moving obstacles: ${m.crates.length} crates · gates: ${n}`,`HPA: ${t.nodes} nodes / ${t.edges} edges · arrivals: ${m.totalArrivals}`].join("<br>")}function wo(e){if(m.cellImage&&m.tick-m.cellImage.version<15)return m.cellImage.canvas;const t=m.cellImage?.canvas??document.createElement("canvas");t.width=e.cols,t.height=e.rows;const n=t.getContext("2d"),s=n.createImageData(e.cols,e.rows),a=e.blocked;for(let i=0;i<a.length;i++){const d=i*4;a[i]?(s.data[d]=248,s.data[d+1]=113,s.data[d+2]=113,s.data[d+3]=70):(s.data[d]=56,s.data[d+1]=189,s.data[d+2]=248,s.data[d+3]=14)}return n.putImageData(s,0,0),m.cellImage={canvas:t,version:m.tick},t}function Co(){if(!m.dom||!m.nav)return;const{overlay:e}=m.dom,t=o.debug.canvas;if(!t)return;(e.width!==t.width||e.height!==t.height)&&(e.width=t.width,e.height=t.height);const n=e.getContext("2d");n.setTransform(1,0,0,1,0,0),n.clearRect(0,0,e.width,e.height);const s=o.debug.zoom*100;n.setTransform(s,0,0,s,o.debug.offsetX,o.debug.offsetY);const a=1/s,i=m.nav,d=performance.now()/1e3;if(m.view.grid){n.imageSmoothingEnabled=!1,n.drawImage(wo(i),i.bounds.minX,i.bounds.minY,i.cols*i.cell,i.rows*i.cell),n.setLineDash([4*a,4*a]),n.strokeStyle="rgba(251,191,36,0.7)",n.lineWidth=a;for(const r of m.crates)n.beginPath(),n.arc(r.body.x,r.body.y,Ke+Nn,0,Math.PI*2),n.stroke();n.setLineDash([])}if(m.view.clusters){const r=Lt*i.cell;n.strokeStyle="rgba(167,139,250,0.45)",n.lineWidth=1.5*a,n.beginPath();for(let c=i.bounds.minX;c<=i.bounds.maxX+1e-6;c+=r)n.moveTo(c,i.bounds.minY),n.lineTo(c,i.bounds.maxY);for(let c=i.bounds.minY;c<=i.bounds.maxY+1e-6;c+=r)n.moveTo(i.bounds.minX,c),n.lineTo(i.bounds.maxX,c);n.stroke()}n.fillStyle="rgba(71,85,105,0.85)";for(const r of m.walls)n.save(),n.translate(r.x,r.y),n.rotate(r.angle),n.fillRect(-r.w/2,-r.h/2,r.w,r.h),n.restore();for(const r of m.pillars)n.beginPath(),n.arc(r.x,r.y,r.r,0,Math.PI*2),n.fill();for(const r of m.gates)n.fillStyle=r.open?"rgba(74,222,128,0.55)":"rgba(244,63,94,0.75)",n.fillRect(r.body.x-r.w/2,r.body.y-r.h/2,r.w,r.h);for(const r of m.crates)n.save(),n.translate(r.body.x,r.body.y),n.rotate(r.body.r),n.fillStyle="rgba(217,119,6,0.55)",n.fillRect(-Y/2,-Y/2,Y,Y),n.strokeStyle="rgba(253,230,138,0.6)",n.lineWidth=1.5*a,n.beginPath(),n.moveTo(-Y/2,-Y/2),n.lineTo(Y/2,Y/2),n.moveTo(Y/2,-Y/2),n.lineTo(-Y/2,Y/2),n.stroke(),n.restore();for(const r of m.bots){const c=r.body;if(m.view.paths&&r.path.length){n.strokeStyle=r.color,n.globalAlpha=.38,n.lineWidth=2*a,n.setLineDash([6*a,5*a]),n.lineDashOffset=-d*30*a,n.beginPath(),n.moveTo(c.x,c.y);for(let h=r.idx;h<r.path.length;h++)n.lineTo(r.path[h].x,r.path[h].y);n.stroke(),n.setLineDash([]),n.globalAlpha=1}const l=.22+.06*Math.sin(d*4+r.reqId);n.strokeStyle=r.color,n.lineWidth=2*a,n.globalAlpha=.9,n.beginPath(),n.arc(r.goal.x,r.goal.y,l,0,Math.PI*2),n.moveTo(r.goal.x-.12,r.goal.y),n.lineTo(r.goal.x+.12,r.goal.y),n.moveTo(r.goal.x,r.goal.y-.12),n.lineTo(r.goal.x,r.goal.y+.12),n.stroke(),n.globalAlpha=1,n.fillStyle=r.color,n.shadowColor=r.color,n.shadowBlur=12,n.beginPath(),n.arc(c.x,c.y,ue,0,Math.PI*2),n.fill(),n.shadowBlur=0,n.strokeStyle="rgba(2,6,23,0.9)",n.lineWidth=3*a,n.beginPath(),n.moveTo(c.x,c.y),n.lineTo(c.x+Math.cos(r.heading)*ue*.9,c.y+Math.sin(r.heading)*ue*.9),n.stroke(),r.waiting&&(n.strokeStyle="rgba(226,232,240,0.8)",n.lineWidth=1.5*a,n.beginPath(),n.arc(c.x,c.y,ue+.08,d*6,d*6+Math.PI),n.stroke())}}const vo=new v({name:"Nav Arena",key:"nav-arena",description:["Twelve bots race between random goals across a maze, a field of rotated blocks and a room of random walls, all planned by the **native nav grid** (`world.createNav`). Every bot that needs a path queues a request, and one `world.findPaths(budget)` call per tick runs them all inside WASM.","### What it shows","- **Tracked static obstacles**: walls, pillars and the two red sliding **gates** are ordinary physics bodies. `nav.track(mask)` keeps their cells up to date, and when a gate moves only the touched HPA clusters are rebuilt.","- **HPA corridor**: long trips use `NAV_MODE.HPA_CORRIDOR` (hierarchy over the walls, then grid A* around moving obstacles inside the route's clusters). Short hops use plain grid A*.","- **Moving obstacles**: the orange crates drift and get shoved by bots. Their positions go to `nav.setDynamicObstacles()` every tick, and a bot replans when a crate lands on its path.","- **Time-sliced batches**: all requests share a budget of 6000 node expansions per tick. A long search that runs out continues next tick, so frame time stays flat.","- **Bot avoidance**: one `world.queryRadiusBatch()` call per tick finds every bot's neighbours, and each bot steers around the ones it is about to hit.","### HUD","The overlay shows ms per `findPaths` batch, replans per second, and the hierarchy size. **Paths** shows each bot's planned route, **Grid** shows the blocked cells (walls inflated by the bot clearance) and the crate discs as the planner sees them, and **Clusters** shows the HPA cluster borders. Press **Reset** for a new layout."].join(`

`),onInitRaw:`(world) => {
		world.clear();
		world.setGravity(0, 0);
		gearbox.debug.showAabbs = false;
		gearbox.debug.showForceVectors = false;
		gearbox.debug.showImpulseVectors = false;
		const g = globalThis as any;
		S.seed = typeof g.NAV_ARENA_SEED === "number" ? g.NAV_ARENA_SEED : (Math.random() * 1e9) >>> 0;
		rngState = S.seed || 1;
		S.bots = [];
		S.crates = [];
		S.gates = [];
		S.walls = [];
		S.pillars = [];
		S.reqToBot.clear();
		S.nextReq = 1;
		S.tick = 0;
		S.totalArrivals = S.totalReplans = S.totalNoPath = 0;
		S.batchMs = S.batchMaxMs = 0;
		S.lastSecond = { replans: 0, maxMs: 0, nodes: 0, ticks: 0, corridor: 0, grid: 0 };
		S.shown = { replans: 0, maxMs: 0, nodes: 0, corridor: 0, grid: 0 };
		S.cellImage = null;

		// 1. The grid. Walls and gates are tracked straight from the physics world.
		const nav = world.createNav(
			{ minX: 0, minY: 0, maxX: W, maxY: H },
			{ cell: CELL, clearance: CLEARANCE, rasterize: "touching" },
		);
		nav.track(CAT_WALL | CAT_GATE);
		S.nav = nav;
		buildArena(world);
		nav.syncStatic(); // rasterise the tracked bodies now (findPaths would do it on the first call)
		nav.buildHierarchy({ cluster: CLUSTER });
		S.free = freeComponent(nav);

		// 2. Crates: dynamic boxes that drift around; the planner gets them as moving discs.
		for (let k = 0; k < 8; k++) {
			const p = randomFreePoint(nav);
			const body = world.createBody({
				x: p.x,
				y: p.y,
				r: range(0, Math.PI),
				mass: 1.5,
				linearDamping: 1.2,
				angularDamping: 2,
				canSleep: false,
				color: "#f59e0b",
				shape: gearbox.shapes.BOX,
				width: CRATE_SIZE,
				height: CRATE_SIZE,
				categoryBits: CAT_CRATE,
				sFriction: 0.2,
				kFriction: 0.15,
			});
			S.crates.push({ body, wander: range(0, Math.PI * 2) });
		}

		// 3. Bots.
		for (let k = 0; k < 12; k++) {
			let p = randomFreePoint(nav);
			for (
				let tries = 0;
				tries < 40 && S.bots.some((b) => Math.hypot(b.body.x - p.x, b.body.y - p.y) < 1.2);
				tries++
			)
				p = randomFreePoint(nav);
			const color = BOT_COLORS[k % BOT_COLORS.length];
			const body = world.createBody({
				x: p.x,
				y: p.y,
				mass: 1,
				linearDamping: 0,
				canSleep: false,
				color,
				shape: gearbox.shapes.CIRCLE,
				radius: BOT_R,
				categoryBits: CAT_BOT,
				restitution: 0,
				sFriction: 0.1,
				kFriction: 0.05,
			});
			const bot: Bot = {
				body,
				color,
				goal: p,
				path: [],
				idx: 0,
				reqId: 0,
				waiting: false,
				sinceReplan: 0,
				replanEvery: range(3.5, 5),
				bestDist: Infinity,
				sinceProgress: 0,
				stuckCount: 0,
				sinceArrival: 0,
				arrivals: 0,
				heading: 0,
			};
			S.bots.push(bot);
			newGoal(nav, bot);
		}

		// Fit the whole arena in the view.
		const canvas = gearbox.debug.canvas;
		if (canvas) {
			gearbox.debug.zoom = Math.min(canvas.width / (W * 100), canvas.height / (H * 100)) * 0.96;
			gearbox.debug.centerCamera(W / 2, H / 2);
		}
		setupDom();
		updateHud();
	}`,onInit:e=>{e.clear(),e.setGravity(0,0),o.debug.showAabbs=!1,o.debug.showForceVectors=!1,o.debug.showImpulseVectors=!1;const t=globalThis;m.seed=typeof t.NAV_ARENA_SEED=="number"?t.NAV_ARENA_SEED:Math.random()*1e9>>>0,xn=m.seed||1,m.bots=[],m.crates=[],m.gates=[],m.walls=[],m.pillars=[],m.reqToBot.clear(),m.nextReq=1,m.tick=0,m.totalArrivals=m.totalReplans=m.totalNoPath=0,m.batchMs=m.batchMaxMs=0,m.lastSecond={replans:0,maxMs:0,nodes:0,ticks:0,corridor:0,grid:0},m.shown={replans:0,maxMs:0,nodes:0,corridor:0,grid:0},m.cellImage=null;const n=e.createNav({minX:0,minY:0,maxX:ye,maxY:W},{cell:ho,clearance:Nn,rasterize:"touching"});n.track(Wn|Dt),m.nav=n,bo(e),n.syncStatic(),n.buildHierarchy({cluster:Lt}),m.free=fo(n);for(let a=0;a<8;a++){const i=bn(n),d=e.createBody({x:i.x,y:i.y,r:P(0,Math.PI),mass:1.5,linearDamping:1.2,angularDamping:2,canSleep:!1,color:"#f59e0b",shape:o.shapes.BOX,width:Y,height:Y,categoryBits:pn,sFriction:.2,kFriction:.15});m.crates.push({body:d,wander:P(0,Math.PI*2)})}for(let a=0;a<12;a++){let i=bn(n);for(let l=0;l<40&&m.bots.some(h=>Math.hypot(h.body.x-i.x,h.body.y-i.y)<1.2);l++)i=bn(n);const d=It[a%It.length],c={body:e.createBody({x:i.x,y:i.y,mass:1,linearDamping:0,canSleep:!1,color:d,shape:o.shapes.CIRCLE,radius:ue,categoryBits:Pn,restitution:0,sFriction:.1,kFriction:.05}),color:d,goal:i,path:[],idx:0,reqId:0,waiting:!1,sinceReplan:0,replanEvery:P(3.5,5),bestDist:1/0,sinceProgress:0,stuckCount:0,sinceArrival:0,arrivals:0,heading:0};m.bots.push(c),qe(n,c)}const s=o.debug.canvas;s&&(o.debug.zoom=Math.min(s.width/(ye*100),s.height/(W*100))*.96,o.debug.centerCamera(ye/2,W/2)),Bo(),Ct()},onTickRaw:`(world, dt) => {
		const nav = S.nav;
		if (!nav) return;
		S.tick++;

		// Gates: slide open or shut every few seconds. They are kinematic, so the step moves them and the
		// tracked cells (and the HPA clusters they touch) update inside the next findPaths.
		let gateMoved = false;
		for (const g of S.gates) {
			g.timer -= dt;
			if (g.timer <= 0) {
				g.open = !g.open;
				g.timer = range(6, 9);
			}
			const target = g.open ? g.openY : g.closedY;
			const d = target - g.body.y;
			let v = Math.abs(d) < 0.02 ? 0 : Math.sign(d) * Math.min(1.5, Math.abs(d) / dt);
			// a closing gate waits while anything stands in the part of the doorway it is about to sweep
			// (a box query over that strip, no scan of the bodies)
			if (v > 0) {
				const front = g.body.y + g.h / 2;
				const inWay = world.queryAABB(g.x - 0.5, front - 0.1, g.x + 0.5, g.closedY + g.h / 2, {
					mask: CAT_BOT | CAT_CRATE,
				});
				if (inWay.length) v = 0;
			}
			if ((v === 0) !== (g.body.vy === 0)) gateMoved = true; // started or stopped moving: everyone replans
			g.body.vy = v;
			g.body.vx = 0;
		}

		// Crates drift on a slow random walk.
		for (const c of S.crates) {
			c.wander += range(-0.5, 0.5) * dt * 4;
			// pinned against a wall: turn around instead of piling up in the corners
			if (c.body.vx * c.body.vx + c.body.vy * c.body.vy < 0.01 && rand() < 0.02) c.wander += Math.PI;
			c.body.applyForce(Math.cos(c.wander) * 1.4, Math.sin(c.wander) * 1.4);
		}
		nav.setDynamicObstacles(S.crates.map((c) => ({ x: c.body.x, y: c.body.y, r: CRATE_R })));

		// Neighbours of every bot in one WASM call.
		const centers: number[] = [];
		for (const bot of S.bots) centers.push(bot.body.x, bot.body.y, NEIGHBOUR_R);
		const neighbours = world.queryRadiusBatch(
			centers,
			S.bots.map((b) => b.body),
			{ mask: CAT_BOT | CAT_CRATE },
		);

		for (let i = 0; i < S.bots.length; i++) {
			const bot = S.bots[i];
			const b = bot.body;
			bot.sinceReplan += dt;
			bot.sinceArrival += dt;

			// arrived?
			const toGoal = Math.hypot(bot.goal.x - b.x, bot.goal.y - b.y);
			if (toGoal < 0.35) {
				bot.arrivals++;
				S.totalArrivals++;
				newGoal(nav, bot);
			} else if (!bot.waiting) {
				if (bot.sinceReplan > bot.replanEvery) requestPath(nav, bot);
				else if ((S.tick + i) % 4 === 0 && bot.sinceReplan > 0.25 && pathBlocked(bot)) requestPath(nav, bot);
				else if (gateMoved) requestPath(nav, bot);
			}

			// follow the path
			let desX = 0,
				desY = 0;
			if (bot.path.length) {
				while (bot.idx < bot.path.length - 1) {
					const p = bot.path[bot.idx];
					if (Math.hypot(p.x - b.x, p.y - b.y) > 0.3) break;
					bot.idx++;
				}
				const p = bot.path[Math.min(bot.idx, bot.path.length - 1)];
				const dx = p.x - b.x,
					dy = p.y - b.y,
					d = Math.hypot(dx, dy);
				const speed = bot.idx >= bot.path.length - 1 ? Math.min(BOT_SPEED, 1 + toGoal * 2) : BOT_SPEED;
				if (d > 1e-6) {
					desX = (dx / d) * speed;
					desY = (dy / d) * speed;
				}
				// progress / stuck detection on the current waypoint
				if (d < bot.bestDist - 0.15) {
					bot.bestDist = d;
					bot.sinceProgress = 0;
				} else bot.sinceProgress += dt;
				if (bot.sinceProgress > 1.5 && !bot.waiting) {
					bot.sinceProgress = 0;
					bot.bestDist = Infinity;
					if (toGoal < 1.2) {
						// jammed right next to the goal (usually by another bot): close enough
						bot.arrivals++;
						S.totalArrivals++;
						newGoal(nav, bot);
					} else if (++bot.stuckCount >= 3) newGoal(nav, bot);
					else requestPath(nav, bot);
				}
			}

			// avoid other bots and crates: steer away from where each neighbour will be at closest approach
			let avX = 0,
				avY = 0;
			for (const o of neighbours[i]) {
				const crate = (o.fixtures[0]?.categoryBits ?? 0) === CAT_CRATE;
				const rr = BOT_R + (crate ? CRATE_R * 0.85 : BOT_R) + 0.12;
				const px = o.x - b.x,
					py = o.y - b.y;
				const vx = o.vx - desX,
					vy = o.vy - desY;
				const v2 = vx * vx + vy * vy;
				let tc = v2 > 1e-6 ? -(px * vx + py * vy) / v2 : 0;
				tc = Math.max(0, Math.min(1.2, tc));
				let cx = px + vx * tc,
					cy = py + vy * tc;
				let cd = Math.hypot(cx, cy);
				if (cd >= rr) continue;
				if (cd < 1e-3) {
					// head-on: everyone sidesteps to its right
					cx = desY;
					cy = -desX;
					cd = Math.hypot(cx, cy) || 1;
				}
				const w = ((rr - cd) / rr) * (crate ? 1.6 : 2.4) * (1 / (tc + 0.35));
				avX -= (cx / cd) * w;
				avY -= (cy / cd) * w;
				// a gentle right-hand rule so two bots meeting in a corridor pass instead of dancing
				if (!crate && px * desX + py * desY > 0) {
					avX += (desY / BOT_SPEED) * 0.6 * w;
					avY += (-desX / BOT_SPEED) * 0.6 * w;
				}
			}
			let tx = desX + avX * BOT_SPEED * 0.5,
				ty = desY + avY * BOT_SPEED * 0.5;
			const tl = Math.hypot(tx, ty);
			if (tl > BOT_SPEED) {
				tx = (tx / tl) * BOT_SPEED;
				ty = (ty / tl) * BOT_SPEED;
			}
			const blend = Math.min(1, 10 * dt);
			b.vx += (tx - b.vx) * blend;
			b.vy += (ty - b.vy) * blend;
			b.rs = 0;
			if (b.vx * b.vx + b.vy * b.vy > 0.04) bot.heading = Math.atan2(b.vy, b.vx);
		}

		// One batched, time-sliced call for every queued request.
		const t0 = performance.now();
		const results = world.findPaths(BUDGET, MIN_SLICE);
		const ms = performance.now() - t0;
		S.batchMs += (ms - S.batchMs) * 0.05;
		S.lastSecond.maxMs = Math.max(S.lastSecond.maxMs, ms);
		S.lastSecond.nodes += nav.lastExpanded;
		for (const r of results) {
			const bot = S.reqToBot.get(r.id);
			S.reqToBot.delete(r.id);
			if (!bot || bot.reqId !== r.id) continue;
			bot.reqId = 0;
			bot.waiting = false;
			S.totalReplans++;
			S.lastSecond.replans++;
			if (r.status === NAV_STATUS.PATH && r.points.length) {
				bot.path = r.points;
				bot.idx = 0;
				bot.bestDist = Infinity;
				bot.sinceProgress = 0;
			} else {
				S.totalNoPath++;
				newGoal(nav, bot); // goal walled in by a crate or a gate: pick another
			}
		}

		if (++S.lastSecond.ticks >= 60) {
			const l = S.lastSecond;
			S.shown = { replans: l.replans, maxMs: l.maxMs, nodes: l.nodes, corridor: l.corridor, grid: l.grid };
			S.lastSecond = { replans: 0, maxMs: 0, nodes: 0, ticks: 0, corridor: 0, grid: 0 };
			updateHud();
		}
	}`,onTick:(e,t)=>{const n=m.nav;if(!n)return;m.tick++;let s=!1;for(const l of m.gates){l.timer-=t,l.timer<=0&&(l.open=!l.open,l.timer=P(6,9));const p=(l.open?l.openY:l.closedY)-l.body.y;let u=Math.abs(p)<.02?0:Math.sign(p)*Math.min(1.5,Math.abs(p)/t);if(u>0){const y=l.body.y+l.h/2;e.queryAABB(l.x-.5,y-.1,l.x+.5,l.closedY+l.h/2,{mask:Pn|pn}).length&&(u=0)}u===0!=(l.body.vy===0)&&(s=!0),l.body.vy=u,l.body.vx=0}for(const l of m.crates)l.wander+=P(-.5,.5)*t*4,l.body.vx*l.body.vx+l.body.vy*l.body.vy<.01&&Q()<.02&&(l.wander+=Math.PI),l.body.applyForce(Math.cos(l.wander)*1.4,Math.sin(l.wander)*1.4);n.setDynamicObstacles(m.crates.map(l=>({x:l.body.x,y:l.body.y,r:Ke})));const a=[];for(const l of m.bots)a.push(l.body.x,l.body.y,uo);const i=e.queryRadiusBatch(a,m.bots.map(l=>l.body),{mask:Pn|pn});for(let l=0;l<m.bots.length;l++){const h=m.bots[l],p=h.body;h.sinceReplan+=t,h.sinceArrival+=t;const u=Math.hypot(h.goal.x-p.x,h.goal.y-p.y);u<.35?(h.arrivals++,m.totalArrivals++,qe(n,h)):h.waiting||(h.sinceReplan>h.replanEvery||(m.tick+l)%4===0&&h.sinceReplan>.25&&Io(h)||s)&&Ve(n,h);let y=0,g=0;if(h.path.length){for(;h.idx<h.path.length-1;){const L=h.path[h.idx];if(Math.hypot(L.x-p.x,L.y-p.y)>.3)break;h.idx++}const C=h.path[Math.min(h.idx,h.path.length-1)],M=C.x-p.x,F=C.y-p.y,S=Math.hypot(M,F),j=h.idx>=h.path.length-1?Math.min(he,1+u*2):he;S>1e-6&&(y=M/S*j,g=F/S*j),S<h.bestDist-.15?(h.bestDist=S,h.sinceProgress=0):h.sinceProgress+=t,h.sinceProgress>1.5&&!h.waiting&&(h.sinceProgress=0,h.bestDist=1/0,u<1.2?(h.arrivals++,m.totalArrivals++,qe(n,h)):++h.stuckCount>=3?qe(n,h):Ve(n,h))}let x=0,f=0;for(const C of i[l]){const M=(C.fixtures[0]?.categoryBits??0)===pn,F=ue+(M?Ke*.85:ue)+.12,S=C.x-p.x,j=C.y-p.y,L=C.vx-y,H=C.vy-g,re=L*L+H*H;let V=re>1e-6?-(S*L+j*H)/re:0;V=Math.max(0,Math.min(1.2,V));let z=S+L*V,de=j+H*V,J=Math.hypot(z,de);if(J>=F)continue;J<.001&&(z=g,de=-y,J=Math.hypot(z,de)||1);const ee=(F-J)/F*(M?1.6:2.4)*(1/(V+.35));x-=z/J*ee,f-=de/J*ee,!M&&S*y+j*g>0&&(x+=g/he*.6*ee,f+=-y/he*.6*ee)}let I=y+x*he*.5,b=g+f*he*.5;const w=Math.hypot(I,b);w>he&&(I=I/w*he,b=b/w*he);const B=Math.min(1,10*t);p.vx+=(I-p.vx)*B,p.vy+=(b-p.vy)*B,p.rs=0,p.vx*p.vx+p.vy*p.vy>.04&&(h.heading=Math.atan2(p.vy,p.vx))}const d=performance.now(),r=e.findPaths(po,yo),c=performance.now()-d;m.batchMs+=(c-m.batchMs)*.05,m.lastSecond.maxMs=Math.max(m.lastSecond.maxMs,c),m.lastSecond.nodes+=n.lastExpanded;for(const l of r){const h=m.reqToBot.get(l.id);m.reqToBot.delete(l.id),!(!h||h.reqId!==l.id)&&(h.reqId=0,h.waiting=!1,m.totalReplans++,m.lastSecond.replans++,l.status===zt.PATH&&l.points.length?(h.path=l.points,h.idx=0,h.bestDist=1/0,h.sinceProgress=0):(m.totalNoPath++,qe(n,h)))}if(++m.lastSecond.ticks>=60){const l=m.lastSecond;m.shown={replans:l.replans,maxMs:l.maxMs,nodes:l.nodes,corridor:l.corridor,grid:l.grid},m.lastSecond={replans:0,maxMs:0,nodes:0,ticks:0,corridor:0,grid:0},Ct()}},onRender:()=>{Co()},onCleanup:()=>{m.nav?.destroy(),m.nav=null,m.dom?.overlay.remove(),m.dom?.hud.remove(),m.dom=null}}),To=[Rt,vo,oo,ao,St,lo],Ao=!["localhost","127.0.0.1"].includes(window.location.hostname),Fe=[{name:"Showcase",examples:To},{name:"General",examples:Ut},{name:"Constraints",examples:Vt},{name:"Optimizations",examples:Kt},{name:"Stress Tests",examples:no},{name:"Known Issues",examples:to}].filter(e=>!Ao||e.name!=="Known Issues");let Eo=`
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
`.trim();const Ze=()=>window.innerWidth<=768;let ie={},$=null;function Mo(){const e=document.getElementById("examples-list");e.innerHTML="",Fe.forEach((t,n)=>{const s=document.createElement("li");s.className="section",s.textContent=t.name,e.appendChild(s),t.examples&&Array.isArray(t.examples)&&t.examples.forEach((a,i)=>{const d=a.key||`${n}-${i}`;ie[d]={category:n,index:i,example:a};const r=document.createElement("li");r.className="example",r.textContent=a.name,r.setAttribute("data-example",d),e.appendChild(r)})}),document.querySelectorAll("#sidebar li.example").forEach(t=>{t.addEventListener("click",()=>{document.querySelectorAll("#sidebar li.example.selected").forEach(s=>{s.classList.remove("selected")}),t.classList.add("selected");const n=t.getAttribute("data-example");qn(n,"push"),Ze()&&Be.classList.add("collapsed")})})}let G,Xt=document.getElementById("example-name"),pe=document.getElementById("debug-canvas"),Gn=document.getElementById("code-section"),Fo=document.getElementById("general-code"),ko=document.getElementById("init-code"),Ro=document.getElementById("tick-code"),Oo=document.getElementById("render-code"),Me=document.getElementById("toggle-code"),So=document.getElementById("fps"),vt=document.getElementById("memory"),Lo=document.getElementById("step-time"),Tt=document.querySelectorAll(".code-tab"),Do=document.querySelectorAll(".code-panel"),_t=document.getElementById("sidebar-toggle"),Be=document.getElementById("sidebar"),Xo=document.getElementById("reset-button"),_o=document.getElementById("reset-button-mobile"),At=document.getElementById("info-toggle"),Et=document.getElementById("info-toggle-mobile");Xt.innerHTML="Loading example...";let se=0,jn=[],Yn=[],zn=[],yn=1e3/60,un=0,Mt=0;o.init().then(()=>{G=o.createWorld(),o.debug.enableDebugGraphics(pe,G);let e=performance.now(),t=0;const n=1/60;function s(y){let g=(y-e)/1e3;e=y,g>.25&&(g=.25),t+=g;const x=performance.now();for(;t>=n;){if(G.step(),$&&ie[$]){const M=ie[$].example;M&&typeof M.onTick=="function"&&M.onTick(G,n)}t-=n}if(G.interpolationAlpha=t/n,$&&ie[$]){const M=ie[$].example;M&&typeof M.onRender=="function"&&M.onRender(G)}const I=(performance.now()-x)*1e3;let b=jn[se%100]??yn,w=Yn[se%100]??0,B=zn[se%100]??0;jn[se%100]=g*1e3||16.67,Yn[se%100]=G?G.getMemoryUsage():0,zn[se%100]=I,yn+=(jn[se%100]-b)/100,un+=(Yn[se%100]-w)/100,Mt+=(zn[se%100]-B)/100,se++;const C=yn>0?Math.round(1e3/yn):0;So.innerHTML=`<i class="fas fa-tachometer-alt"></i>Render FPS: ${C}`,un<1048576?vt.innerHTML=`<i class="fas fa-memory"></i>Memory: ${(un/1024).toFixed(2)} KB`:vt.innerHTML=`<i class="fas fa-memory"></i>Memory: ${(un/1048576).toFixed(2)} MB`,Lo.innerHTML=`<i class="fas fa-stopwatch"></i>Step Time: ${Mt.toFixed(0)} μs`,requestAnimationFrame(s)}Mo(),Ht(!0);const a=()=>{$&&qn($,"none")};Xo.addEventListener("click",a),_o.addEventListener("click",a);const i=()=>{document.body.classList.toggle("info-mode");const y=document.body.classList.contains("info-mode"),g=y?"fa-th-large":"fa-info-circle",x=y?"Show Canvas":"Info";[At,Et].forEach(f=>{const I=f.querySelector("i"),b=f.querySelector(".button-text");I&&(I.className=`fas ${g}`),b&&(b.textContent=x),f.title=y?"Show Canvas":"Show Information"}),y||o.debug.centerCamera(5,5)};At.addEventListener("click",i),Et.addEventListener("click",i),requestAnimationFrame(s),Ze()&&Be.classList.add("collapsed"),pe.addEventListener("wheel",y=>{y.preventDefault();const g=.05,x=y.offsetX,f=y.offsetY,I=(x-o.debug.offsetX)/o.debug.zoom,b=(f-o.debug.offsetY)/o.debug.zoom,w=-Math.sign(y.deltaY),B=Math.pow(1+g,w),C=Math.min(Math.max(o.debug.zoom*B,.1),10);o.debug.zoom=C,o.debug.offsetX=x-I*o.debug.zoom,o.debug.offsetY=f-b*o.debug.zoom},{passive:!1});let d=!1,r=0,c=0;pe.addEventListener("mousedown",y=>{y.button===2&&(d=!0,r=y.clientX,c=y.clientY)}),window.addEventListener("mousemove",y=>{if(d){const g=y.clientX-r,x=y.clientY-c;o.debug.offsetX+=g,o.debug.offsetY+=x,r=y.clientX,c=y.clientY}}),window.addEventListener("mouseup",y=>{y.button===2&&(d=!1)}),pe.addEventListener("contextmenu",y=>{y.preventDefault()});let l=0,h=!1,p=0,u=0;pe.addEventListener("touchstart",y=>{if(y.touches.length===1)p=y.touches[0].clientX,u=y.touches[0].clientY,h=!1;else if(y.touches.length===2){h=!0;const g=y.touches[0].clientX-y.touches[1].clientX,x=y.touches[0].clientY-y.touches[1].clientY;l=Math.sqrt(g*g+x*x)}},{passive:!1}),pe.addEventListener("touchmove",y=>{if(y.touches.length!==0){if(y.preventDefault(),y.touches.length===1&&!h){const g=y.touches[0].clientX,x=y.touches[0].clientY,f=g-p,I=x-u;o.debug.offsetX+=f,o.debug.offsetY+=I,p=g,u=x}else if(y.touches.length===2){const g=y.touches[0],x=y.touches[1],f=g.clientX-x.clientX,I=g.clientY-x.clientY,b=Math.sqrt(f*f+I*I);if(l>0){const w=b/l,B=Math.min(Math.max(o.debug.zoom*w,.1),10),C=(g.clientX+x.clientX)/2,M=(g.clientY+x.clientY)/2,F=pe.getBoundingClientRect(),S=C-F.left,j=M-F.top,L=(S-o.debug.offsetX)/o.debug.zoom,H=(j-o.debug.offsetY)/o.debug.zoom;o.debug.zoom=B,o.debug.offsetX=S-L*o.debug.zoom,o.debug.offsetY=j-H*o.debug.zoom}l=b}}},{passive:!1}),pe.addEventListener("touchend",y=>{y.touches.length<2&&(h=!1,l=0),y.touches.length===1&&(p=y.touches[0].clientX,u=y.touches[0].clientY)},{passive:!1}),pe.addEventListener("touchcancel",y=>{h=!1,l=0},{passive:!1})});function qn(e,t="push"){if(!G||!ie[e])return;if($&&ie[$]){const h=ie[$].example;h&&typeof h.cleanup=="function"&&h.cleanup(G)}const n="#"+e;window.location.hash!==n&&(t==="push"?history.pushState(null,"",n):t==="replace"&&history.replaceState(null,"",n)),G.clear(),o.debug.clearLabels(),o.debug.showForceVectors=!0,o.debug.showImpulseVectors=!0,G.setHasPenetrationResolution(!0),G.setHasRestitution(!0),G.setHasFriction(!0),G.setGravity(0,0),o.debug.zoom=1,o.debug.centerCamera(5,5),o.debug.showAabbs=!0,$=e;const a=ie[e].example;a&&typeof a.onInit=="function"?a.onInit(G):console.error("Example onInit method not found:",a);function i(h,p){if(!h)return`function ${p}${p==="tick"?"(dt)":"()"} {}`;let u=h.split("	").join("    ");const y=[/^\(world\)\s*=>\s*\{/,/^\(world,\s*dt\)\s*=>\s*\{/,/^function\s*\(world\)\s*\{/,/^function\s*\(world,\s*dt\)\s*\{/,/^function\s+init\s*\(world\)\s*\{/,/^function\s+tick\s*\(world,\s*dt\)\s*\{/,/^function\s+render\s*\(world\)\s*\{/];let g=!1,x=u.trim();for(const b of y)if(b.test(x)){u=x.replace(b,`function ${p}${p==="tick"?"(dt)":"()"} {`),g=!0;break}g||(u=x.replace(/^.*?=>\s*\{/,`function ${p}${p==="tick"?"(dt)":"()"} {`));let f=u.split(`
`);if(f.length<=1)return u;let I=1/0;for(let b=1;b<f.length;b++){const w=f[b];if(w.trim().length===0)continue;const B=w.search(/\S/);B!==-1&&B<I&&(I=B)}return I===1/0&&(I=0),f.map((b,w)=>w===0?b:b.substring(Math.min(b.length,I))).join(`
`)}let d=a.globalLines?.join(`
`)??"",r=a.onInitRaw||a.onInit?.toString()||"",c=a.onTickRaw||a.onTick?.toString()||"",l=a.onRenderRaw||a.onRender?.toString()||"";Fo.textContent=Eo.split("{{GLOBAL}}").join(d),ko.textContent=i(r,"init"),Ro.textContent=i(c,"tick"),Oo.textContent=i(l,"render"),Jt(),Xt.textContent=a.name||"Unknown Example",document.getElementById("description").innerHTML=Nt.parse(a.description||"")}function Ht(e=!1){let t=window.location.hash.substring(1);const n=!t;if(t||(t="sandbox"),!ie[t]){console.log("Example not found directly, searching...");let a=!1;for(let i=0;i<Fe.length;i++){const d=Fe[i];if(d.examples&&Array.isArray(d.examples)){for(let r=0;r<d.examples.length;r++)if(d.examples[r].key===t){console.log(`Found example ${t} in category ${i}, index ${r}`),a=!0;break}}if(a)break}if(!a)if(console.warn(`Example with key '${t}' not found, defaulting to first available example`),Fe.length>0&&Fe[0].examples&&Fe[0].examples.length>0)t=Fe[0].examples[0].key||"0-0";else{console.error("No examples found");return}}const s=document.querySelector(`#sidebar li.example[data-example="${t}"]`);s&&(document.querySelectorAll("#sidebar li.example.selected").forEach(a=>{a.classList.remove("selected")}),s.classList.add("selected")),qn(t,n&&e?"replace":"none")}Tt.forEach(e=>{e.addEventListener("click",()=>{Tt.forEach(n=>n.classList.remove("active")),Do.forEach(n=>n.classList.remove("active")),e.classList.add("active"),document.getElementById(`${e.dataset.panel}-panel`).classList.add("active")})});function Jt(){document.querySelectorAll("pre").forEach(t=>{const n=t.textContent;t.innerHTML=hljs?.highlight(n,{language:"javascript"}).value})}Me.addEventListener("click",()=>{Gn.style.display==="none"?(Gn.style.display="block",Me.querySelector("span").textContent="Hide Code",Me.querySelector("i").classList.remove("fa-chevron-down"),Me.querySelector("i").classList.add("fa-chevron-up"),Jt()):(Gn.style.display="none",Me.querySelector("span").textContent="Show Code",Me.querySelector("i").classList.remove("fa-chevron-up"),Me.querySelector("i").classList.add("fa-chevron-down"))});_t.addEventListener("click",()=>{Be.classList.toggle("collapsed")});window.addEventListener("resize",()=>{Ze()||document.body.classList.remove("info-mode"),Ze()&&!Be.classList.contains("collapsed")&&Be.classList.add("collapsed")});window.addEventListener("click",e=>{Ze()&&!Be.classList.contains("collapsed")&&!Be.contains(e.target)&&e.target!==_t&&Be.classList.add("collapsed")});const $e=document.getElementById("copy-code");$e.addEventListener("click",()=>{const t=document.querySelector(".code-panel.active").querySelector("pre").textContent;navigator.clipboard.writeText(t).then(()=>{const n=$e.querySelector("span"),s=$e.querySelector("i"),a=n.textContent;$e.classList.add("success"),n.textContent="Copied!",s.classList.remove("fa-copy"),s.classList.add("fa-check"),setTimeout(()=>{$e.classList.remove("success"),n.textContent=a,s.classList.remove("fa-check"),s.classList.add("fa-copy")},2e3)})});window.addEventListener("popstate",function(e){Ht(!1)});
