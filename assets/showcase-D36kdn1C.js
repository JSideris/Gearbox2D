import"./modulepreload-polyfill-B5Qt9EMX.js";import{M as xt}from"./markdown-tUR2hliS.js";import{g as n}from"./engine-DyQBrImb.js";class k{constructor(t){this.onInit=t.onInit,this.onInitRaw=t.onInitRaw,this.onTick=t.onTick,this.onTickRaw=t.onTickRaw,this.onRender=t.onRender,this.onRenderRaw=t.onRenderRaw,this.onCleanup=t.onCleanup,this.description=t.description,this.name=t.name,this.key=t.key,this.globalLines=t.globalLines||[]}init(t){this.onInit?.(t)}tick(t,o){this.onTick?.(t,o)}render(t){this.onRender?.(t)}cleanup(t){this.onCleanup?.(t)}}let O=1,fn=0,te=null,nn=null,fe=null;const at=(e,t)=>({x:(e-n.debug.offsetX)/(n.debug.zoom*100),y:(t-n.debug.offsetY)/(n.debug.zoom*100)}),bt=(e,t)=>{if(e.button!==0)return;const o=fe.getBoundingClientRect(),i=at(e.clientX-o.left,e.clientY-o.top),a=t.queryPoint(i.x,i.y);if(a.length>0){const s=a[0],r=t.getBodyById(s);r&&r.type!==n.bodyTypes.FIXED_OBJECT&&(te=t.makeBody(999999,{x:i.x,y:i.y,type:n.bodyTypes.FIXED_OBJECT,color:"transparent"}),te.addFixture(999999,{shape:n.shapes.CIRCLE,radius:.05,maskBits:0}),nn=t.createSpringJoint(999998,te,r,{worldAnchor:i,frequencyHz:3,dampingRatio:1,length:0}))}},ft=e=>{if(te){const t=fe.getBoundingClientRect(),o=at(e.clientX-t.left,e.clientY-t.top);te.x=o.x,te.y=o.y}},It=(e,t)=>{nn&&(t.removeJoint(nn.id),nn=null),te&&(t.removeObject(te.id),te=null)},Bt=[new k({name:"Interactive Sandbox",key:"sandbox",description:["Welcome to **Gearbox2D**! This is an interactive playground featuring various shapes and physics properties. Click and drag objects to interact with them.","### Features","- **Point Query**: The engine detects which object is under the mouse using **BVH** and precise shape tests.","- **Mouse Joint**: Uses a `SpringJoint` to pull objects toward the mouse cursor.","- **Multi-Fixture Bodies**: Some objects are composed of multiple shapes (circles and boxes) attached to a single body.","- **Jointed Compounds**: Some objects are connected by **Hinge**, **Distance**, and **Spring** joints to create complex assemblies.","- **Collision Filtering**: The mouse 'anchor' object is a sensor that doesn't collide with other objects."].join(`

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
            world.makeBody(nextId++, {
                x: 5, y: 9.0 + thickness / 2,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#444"
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: boundaryWidth, height: thickness,
            });

            // Roof
            world.makeBody(nextId++, {
                x: 5, y: 0.0 - thickness / 2,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#444"
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: boundaryWidth, height: thickness,
            });

            // Walls
            world.makeBody(nextId++, { 
                x: 5 - innerWidth / 2 - thickness / 2, 
                y: 4.5, 
                type: gearbox.bodyTypes.FIXED_OBJECT, 
                color: "#444" 
            }).addFixture({
                shape: gearbox.shapes.BOX, 
                width: thickness, height: wallHeight, 
            });
            world.makeBody(nextId++, { 
                x: 5 + innerWidth / 2 + thickness / 2, 
                y: 4.5, 
                type: gearbox.bodyTypes.FIXED_OBJECT, 
                color: "#444" 
            }).addFixture({
                shape: gearbox.shapes.BOX, 
                width: thickness, height: wallHeight, 
            });

            // Grid of shapes to prevent initial overlap
            const colors = ["#ff4444", "#44ff44", "#4444ff", "#ffff44", "#ff44ff", "#44ffff", "#ff8844", "#88ff44", "#4488ff"];
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
                        x, y,
                        mass: 0.5 + Math.random() * 1.5,
                        color,
                        linearDamping: 0.5,
                        angularDamping: 1.5
                    };

                    const rand = Math.random();
                    if (rand < 0.5) {
                        // Circle
                        world.makeBody(nextId++, {
                            ...commonProps,
                            r: Math.random() * Math.PI,
                        }).addFixture({
                            shape: gearbox.shapes.CIRCLE,
                            radius: 0.1 + Math.random() * 0.3,
                        });
                    } else{
                        // Box
                        world.makeBody(nextId++, {
                            ...commonProps,
                            r: Math.random() * Math.PI,
                        }).addFixture({
                            shape: gearbox.shapes.BOX,
                            width: 0.2 + Math.random() * 0.6,
                            height: 0.2 + Math.random() * 0.6,
                        });
                    } 
                }
            }

            // --- Multi-Fixture Composite Bodies ---
            for (let i = 0; i < 6; i++) {
                const x = 1.5 + Math.random() * 7;
                const y = 5.5 + Math.random() * 1.5;
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                const body = world.makeBody(nextId++, {
                    x, y,
                    mass: 1.0 + Math.random() * 3.0,
                    color,
                    linearDamping: 0.5,
                    angularDamping: 1.0
                });
                
                const numFixtures = 2 + Math.floor(Math.random() * 4); // 2-6 fixtures
                for (let j = 0; j < numFixtures; j++) {
                    const shapeType = Math.random();
                    const offsetX = (Math.random() - 0.5) * 1.2;
                    const offsetY = (Math.random() - 0.5) * 1.2;
                    
                    if (shapeType < 0.4) {
                        body.addFixture({
                            shape: gearbox.shapes.CIRCLE,
                            radius: 0.1 + Math.random() * 0.25,
                            localX: offsetX,
                            localY: offsetY
                        });
                    } else {
                        body.addFixture({
                            shape: gearbox.shapes.BOX,
                            width: 0.2 + Math.random() * 0.5,
                            height: 0.2 + Math.random() * 0.5,
                            localX: offsetX,
                            localY: offsetY,
                            localR: Math.random() * Math.PI
                        });
                    }
                }
            }

            // --- Compound Objects (Bodies + Joints) ---
            const jointTypes = ['hinge', 'distance', 'spring'];
            for (let i = 0; i < 8; i++) {
                const x = 1.5 + Math.random() * 6;
                const y = 7.5 + Math.random() * 1.0;
                const jType = jointTypes[Math.floor(Math.random() * jointTypes.length)];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                const b1 = world.makeBody(nextId++, {
                    x, y, mass: 0.5 + Math.random(), color, linearDamping: 0.5, angularDamping: 0.5
                });
                
                const s1 = Math.random();
                if (s1 < 0.5) b1.addFixture({ shape: gearbox.shapes.CIRCLE, radius: 0.15 + Math.random() * 0.2 });
                else b1.addFixture({ shape: gearbox.shapes.BOX, width: 0.3 + Math.random() * 0.4, height: 0.3 + Math.random() * 0.4 });
                
                const b2 = world.makeBody(nextId++, {
                    x: x + 0.5 + Math.random() * 0.5, 
                    y: y + (Math.random() - 0.5) * 0.5, 
                    mass: 0.5 + Math.random(), 
                    color, 
                    linearDamping: 0.5, 
                    angularDamping: 0.5
                });

                const s2 = Math.random();
                if (s2 < 0.5) b2.addFixture({ shape: gearbox.shapes.CIRCLE, radius: 0.15 + Math.random() * 0.2 });
                else b2.addFixture({ shape: gearbox.shapes.BOX, width: 0.3 + Math.random() * 0.4, height: 0.3 + Math.random() * 0.4 });
                
                if (jType === 'hinge') {
                    world.createHingeJoint(nextId++, b1, b2, {
                        worldAnchor: { x: (b1.x + b2.x) / 2, y: (b1.y + b2.y) / 2 }
                    });
                } else if (jType === 'distance') {
                    world.createDistanceJoint(nextId++, b1, b2, {
                        anchorA: { x: 0, y: 0 },
                        anchorB: { x: 0, y: 0 }
                    });
                } else {
                    world.createSpringJoint(nextId++, b1, b2, {
                        anchorA: { x: 0, y: 0 },
                        anchorB: { x: 0, y: 0 },
                        frequencyHz: 2.0 + Math.random() * 4.0,
                        dampingRatio: 0.5 + Math.random() * 0.5
                    });
                }
            }

            // Event listeners
            canvas = document.getElementById("debug-canvas") as HTMLCanvasElement;
            
            // Remove existing listeners if they exist (prevents leakage on restart/re-init)
            if ((world as any)._mouseDownHandler) canvas.removeEventListener('mousedown', (world as any)._mouseDownHandler);
            if ((world as any)._mouseMoveHandler) window.removeEventListener('mousemove', (world as any)._mouseMoveHandler);
            if ((world as any)._mouseUpHandler) window.removeEventListener('mouseup', (world as any)._mouseUpHandler);

            // We need to store bound versions to remove them later
            (world as any)._mouseDownHandler = (e: MouseEvent) => onMouseDown(e, world);
            (world as any)._mouseMoveHandler = (e: MouseEvent) => onMouseMove(e);
            (world as any)._mouseUpHandler = (e: MouseEvent) => onMouseUp(e, world);

            canvas.addEventListener('mousedown', (world as any)._mouseDownHandler);
            window.addEventListener('mousemove', (world as any)._mouseMoveHandler);
            window.addEventListener('mouseup', (world as any)._mouseUpHandler);
        }`,onInit:e=>{e.clear(),n.debug.showAabbs=!1,n.debug.showForceVectors=!1,O=1,e.setGravity(0,9.8),e.setHasRestitution(!0),e.setHasFriction(!0);const t=1,o=9.2,a=9+t*2,s=o+t*2;e.makeBody(O++,{x:5,y:9+t/2,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({shape:n.shapes.BOX,width:s,height:t}),e.makeBody(O++,{x:5,y:0-t/2,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({shape:n.shapes.BOX,width:s,height:t}),e.makeBody(O++,{x:5-o/2-t/2,y:4.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({shape:n.shapes.BOX,width:t,height:a}),e.makeBody(O++,{x:5+o/2+t/2,y:4.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({shape:n.shapes.BOX,width:t,height:a});const r=["#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff","#ff8844","#88ff44","#4488ff"],l=8,h=4,g=1,u=1,f=5-(l-1)*g/2,c=1.8;for(let p=0;p<h;p++)for(let y=0;y<l;y++){const x=f+y*g+(Math.random()-.5)*.2,b=c+p*u+(Math.random()-.5)*.2,m=r[(p*l+y)%r.length],B={x,y:b,mass:.5+Math.random()*1.5,color:m,linearDamping:.5,angularDamping:1.5};Math.random()<.5?e.makeBody(O++,{...B,r:Math.random()*Math.PI}).addFixture({shape:n.shapes.CIRCLE,radius:.1+Math.random()*.3}):e.makeBody(O++,{...B,r:Math.random()*Math.PI}).addFixture({shape:n.shapes.BOX,width:.2+Math.random()*.6,height:.2+Math.random()*.6})}for(let p=0;p<6;p++){const y=1.5+Math.random()*7,x=5.5+Math.random()*1.5,b=r[Math.floor(Math.random()*r.length)],m=e.makeBody(O++,{x:y,y:x,mass:1+Math.random()*3,color:b,linearDamping:.5,angularDamping:1}),B=2+Math.floor(Math.random()*4);for(let I=0;I<B;I++){const w=Math.random(),M=(Math.random()-.5)*1.2,R=(Math.random()-.5)*1.2;w<.4?m.addFixture({shape:n.shapes.CIRCLE,radius:.1+Math.random()*.25,localX:M,localY:R}):m.addFixture({shape:n.shapes.BOX,width:.2+Math.random()*.5,height:.2+Math.random()*.5,localX:M,localY:R,localR:Math.random()*Math.PI})}}const d=["hinge","distance","spring"];for(let p=0;p<8;p++){const y=1.5+Math.random()*6,x=7.5+Math.random()*1,b=d[Math.floor(Math.random()*d.length)],m=r[Math.floor(Math.random()*r.length)],B=e.makeBody(O++,{x:y,y:x,mass:.5+Math.random(),color:m,linearDamping:.5,angularDamping:.5});Math.random()<.5?B.addFixture({shape:n.shapes.CIRCLE,radius:.15+Math.random()*.2}):B.addFixture({shape:n.shapes.BOX,width:.3+Math.random()*.4,height:.3+Math.random()*.4});const w=e.makeBody(O++,{x:y+.5+Math.random()*.5,y:x+(Math.random()-.5)*.5,mass:.5+Math.random(),color:m,linearDamping:.5,angularDamping:.5});Math.random()<.5?w.addFixture({shape:n.shapes.CIRCLE,radius:.15+Math.random()*.2}):w.addFixture({shape:n.shapes.BOX,width:.3+Math.random()*.4,height:.3+Math.random()*.4}),b==="hinge"?e.createHingeJoint(O++,B,w,{worldAnchor:{x:(B.x+w.x)/2,y:(B.y+w.y)/2}}):b==="distance"?e.createDistanceJoint(O++,B,w,{anchorA:{x:0,y:0},anchorB:{x:0,y:0}}):e.createSpringJoint(O++,B,w,{anchorA:{x:0,y:0},anchorB:{x:0,y:0},frequencyHz:2+Math.random()*4,dampingRatio:.5+Math.random()*.5})}fe=document.getElementById("debug-canvas"),e._mouseDownHandler&&fe.removeEventListener("mousedown",e._mouseDownHandler),e._mouseMoveHandler&&window.removeEventListener("mousemove",e._mouseMoveHandler),e._mouseUpHandler&&window.removeEventListener("mouseup",e._mouseUpHandler),e._mouseDownHandler=p=>bt(p,e),e._mouseMoveHandler=p=>ft(p),e._mouseUpHandler=p=>It(p,e),fe.addEventListener("mousedown",e._mouseDownHandler),window.addEventListener("mousemove",e._mouseMoveHandler),window.addEventListener("mouseup",e._mouseUpHandler)},onCleanup:e=>{fe&&(fe.removeEventListener("mousedown",e._mouseDownHandler),window.removeEventListener("mousemove",e._mouseMoveHandler),window.removeEventListener("mouseup",e._mouseUpHandler),delete e._mouseDownHandler,delete e._mouseMoveHandler,delete e._mouseUpHandler)},onTickRaw:`(world, dt) => {
            gearbox.debug.clearLabels();
            gearbox.debug.addLabel({ text: "Interactive Sandbox", x: 5, y: 0.5, fontSize: "28px Arial", color: "#bbb", position: "on-top" });
            gearbox.debug.addLabel({ text: "Click and drag objects!", x: 5, y: 1.2, fontSize: "16px Arial", color: "#888", position: "on-top" });
        }`,onTick:(e,t)=>{n.debug.clearLabels(),n.debug.addLabel({text:"Interactive Sandbox",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"}),n.debug.addLabel({text:"Click and drag objects!",x:5,y:1.2,fontSize:"16px Arial",color:"#888",position:"on-top"})}}),new k({name:"Force",key:"force",description:["**Forces** are used to apply acceleration to objects which scale inversely with the object's mass. All forces applied to an object are accumulated and applied in the next world step where they are reset.","Persistent forces must be reapplied on each fixed update (every `tick`).","It's important to note that the change in velocity will be a function of the **force vector**, the object's **mass**, and the **time step**. If you need a specific instantaneous change in velocity, use an **Impulse** instead."].join(`

`),onInitRaw:`(world)=>{

            // This small circle will orbit the bigger one.
            world.makeBody(1, {
                x: 5.00,
                y: 2.50,
                vx: 5.00,
                r: Math.PI / 2 * Math.random(),
                rs: 5,
                mass: 0.1, // 100g
                angularDamping: 0.0, 
                linearDamping: 0.0 // Set to 0 to prevent the orbit from slowing down.
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: .30,
            });

            // For decoration, let's add a shape in the middle.
            world.makeBody(2, {
                x: 5.00,
                y: 5.00,
                r: Math.PI / 2 * Math.random(),
                rs: .1,
                type: gearbox.bodyTypes.KINEMATIC_OBJECT, // Use Kinematic for moving sensor decoration
                angularDamping: 0.0, 
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 1.00,
                isSensor: true
            });
        }`,onInit:e=>{e.makeBody(1,{x:5,y:2.5,vx:5,r:Math.PI/2*Math.random(),rs:5,mass:.1,angularDamping:0,linearDamping:0}).addFixture({shape:n.shapes.CIRCLE,radius:.3}),e.makeBody(2,{x:5,y:5,r:Math.PI/2*Math.random(),rs:.1,type:n.bodyTypes.KINEMATIC_OBJECT,angularDamping:0}).addFixture({shape:n.shapes.CIRCLE,radius:1,isSensor:!0})},onTickRaw:`(world, dt)=>{
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
            const forceMagnitude = 2.00;

            // Apply a force to the object.
            obj.applyForce(dx * forceMagnitude, dy * forceMagnitude);
        }`,onTick:(e,t)=>{let o=e.bodiesById[1],i=e.bodiesById[2],a=i.x-o.x,s=i.y-o.y,r=Math.sqrt(a*a+s*s);a/=r,s/=r;const l=2;o.applyForce(a*l,s*l)}}),new k({name:"Impulse",key:"impulse",description:["**Impulses** are used to apply a sudden change in momentum to an object. It's similar to a force, but modifies the object's velocity **instantaneously**, rather than acting as a persistent push.","In this example we demonstrate both **Linear** and **Angular** impulses.","- The two circles receive vertical linear impulses.","- The box receives periodic angular impulses (torque) causing it to spin without moving its center."].join(`

`),globalLines:["let impulseTimer = 0;"],onInitRaw:`(world)=>{

            // Linear impulse targets
            world.makeBody(1, {
                x: 2.50,
                y: 5.00,
                r: Math.PI / 2 * Math.random(),
                mass: 1,
                linearDamping: 0.1
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: .30,
            });

            world.makeBody(2, {
                x: 5.00,
                y: 5.00,
                r: Math.PI / 2 * Math.random(),
                mass: 2,
                linearDamping: 0.02
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: .60,
            });

            // Angular impulse target
            world.makeBody(3, {
                x: 7.50,
                y: 5.00,
                mass: 100,
                linearDamping: 0.05,
                angularDamping: 0.05
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1.0,
                height: 0.3,
            });
        }`,onInit:e=>{e.makeBody(1,{x:2.5,y:5,r:Math.PI/2*Math.random(),mass:1,linearDamping:.1}).addFixture({shape:n.shapes.CIRCLE,radius:.3}),e.makeBody(2,{x:5,y:5,r:Math.PI/2*Math.random(),mass:2,linearDamping:.02}).addFixture({shape:n.shapes.CIRCLE,radius:.6}),e.makeBody(3,{x:7.5,y:5,mass:100,linearDamping:.05,angularDamping:.05}).addFixture({shape:n.shapes.BOX,width:1,height:.3})},onTickRaw:`(world, dt)=>{

            let obj1 = world.bodiesById[1];
            let obj2 = world.bodiesById[2];
            let obj3 = world.bodiesById[3];

            let oldTimer = impulseTimer;
            impulseTimer += dt * 5;

            let t1 = Math.floor(oldTimer) ;
            let t2 = Math.floor(impulseTimer);
            
            if(t1 != t2){
                if(t2 % 2 == 0){
                    let impulse = (5.00 - obj1.y) * .20;
                    if(impulse < .050 && impulse > -.050) impulse = 2.000;

                    obj1.applyImpulse(0, impulse);
                    obj2.applyImpulse(0, impulse);
                }

                // Apply angular impulse to the box
                if(t2 % 3 == 0){
                    obj3.applyAngularImpulse(2.0);
                }
            }
            
        }`,onTick:(e,t)=>{let o=e.bodiesById[1],i=e.bodiesById[2],a=e.bodiesById[3],s=fn;fn+=t*5;let r=Math.floor(s),l=Math.floor(fn);if(r!=l){if(l%2==0){let h=(5-o.y)*.2;h<.05&&h>-.05&&(h=2),o.applyImpulse(0,h),i.applyImpulse(0,h)}l%3==0&&a.applyAngularImpulse(2)}}}),new k({name:"Bounce",key:"bounce",description:["This example demonstrates **Restitution** (bounciness).","The central ball is configured with `restitution: 1.0`, meaning it loses no energy during collisions with the fixed walls, creating a perfectly elastic bounce.","Gearbox2D handles restitution differently than many other engines to prevent numerical energy gain. Check out the documentation to learn more about **Kinematic Restitution Balancing**."].join(`

`),onInitRaw:`(world)=>{
            // Gravity
            world.setGravity(0, 10);

            // Walls
            world.makeBody(1, {
                x: 5,
                y: 0,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: 11,
                height: 2,
                restitution: 1.0,
            });
            world.makeBody(2, {
                x: 5,
                y: 10,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: 11,
                height: 2,
                restitution: 1.0,
            });
            world.makeBody(3, {
                x: 0,
                y: 5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: 2,
                height: 11,
                restitution: 1.0,
            });
            world.makeBody(4, {
                x: 10,
                y: 5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: 2,
                height: 11,
                restitution: 1.0,
            });

            // Bouncy Ball
            world.makeBody(5, {
                x: 5,
                y: 2,
                vx: (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 1.5), 
                r: Math.PI / 2 * Math.random(),
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.5,
                linearDamping: 0.0,
                rs: -2 + Math.random() * 4,
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: .75,
                // The most important part. 100% bouncy.
                restitution: 1,
            });
        }`,onInit:e=>{e.setGravity(0,10),e.makeBody(1,{x:5,y:0,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.AABB,width:11,height:2,restitution:1}),e.makeBody(2,{x:5,y:10,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.AABB,width:11,height:2,restitution:1}),e.makeBody(3,{x:0,y:5,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.AABB,width:2,height:11,restitution:1}),e.makeBody(4,{x:10,y:5,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.AABB,width:2,height:11,restitution:1}),e.makeBody(5,{x:5,y:2,vx:(Math.random()<.5?-1:1)*(1.5+Math.random()*1.5),r:Math.PI/2*Math.random(),type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5,linearDamping:0,rs:-2+Math.random()*4}).addFixture({shape:n.shapes.CIRCLE,radius:.75,restitution:1})},onTickRaw:`(world, dt)=>{
            // The engine does all the work. Nothing to do here!
        }`,onTick:(e,t)=>{}}),new k({name:"Collisions",key:"collisions",description:["Collisions are enabled for objects whose type is set to `DYNAMIC_OBJECT`.","In this example we can see collisions between all of the different supported shape types:","- **CIRCLE**: Optimized circular collisions.","- **BOX**: Oriented bounding boxes with full rotation support.","- **AABB**: Axis-aligned bounding boxes.","- **POINT**: Zero-radius points that collide with larger shapes."].join(`

`),globalLines:["let nextId = 1;"],onInitRaw:`(world)=>{
            world.setGravity(0, 10);

            // Objects will be created in the tick function.
        }`,onInit:e=>{e.setGravity(0,10)},onTickRaw:`(world, dt)=>{
            if(Math.random() < 0.08){
                let m = .1 + Math.random() * .4;
                let dir = 1;
                if(Math.random() < 0.5) dir = -1;

                let r = .2 + m*m * .8;
                let h = 0.1 + Math.random() * (r - 0.1);
                let w = r * r / h;
                
                let shapeType = Math.random();
                let shape;
                let mass = m;

                if (shapeType < 0.1) {
                    shape = gearbox.shapes.POINT;
                    mass = 0.01; // Points have very small mass
                } else if (shapeType < 0.2) {
                    shape = gearbox.shapes.AABB;
                } else if (shapeType < 0.6) {
                    shape = gearbox.shapes.BOX;
                } else {
                    shape = gearbox.shapes.CIRCLE;
                }

                const bodyId = nextId++;
                world.makeBody(bodyId, {
                    x: 5.00 - dir * 5.00,
                    y: 7.50,
                    r: Math.PI / 2 * Math.random(),
                    rs: (Math.random() - 0.5) * 5.00,
                    vx: (2.00 + Math.random() * 5.00) * dir,
                    vy: -8.00 - Math.random() * 2.00,
                    type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                    mass: mass, 
                    linearDamping: 0,
                }).addFixture({
                    shape: shape,
                    radius: (shape === gearbox.shapes.BOX || shape === gearbox.shapes.AABB) ? w : r,
                    // width: isBox ? r * 2 : 0,
                    height: (shape === gearbox.shapes.BOX || shape === gearbox.shapes.AABB) ? h : 0,
                });

                // Scan for objects that are out of bounds and remove them.
                // Another way to do this would be to use collision events.
                let objectCount = world.getBodyCount();
                let toRemove = [];

                world.iterateBodies(obj=>{
                    
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
        }`,onTick:(e,t)=>{if(Math.random()<.08){let o=.1+Math.random()*.4,i=1;Math.random()<.5&&(i=-1);let a=.2+o*o*.8,s=.1+Math.random()*(a-.1),r=a*a/s,l=Math.random(),h,g=o;l<.1?(h=n.shapes.POINT,g=.01):l<.2?h=n.shapes.AABB:l<.6?h=n.shapes.BOX:h=n.shapes.CIRCLE;const u=O++;e.makeBody(u,{x:5-i*5,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*i,vy:-8-Math.random()*2,type:n.bodyTypes.DYNAMIC_OBJECT,mass:g,linearDamping:0}).addFixture({shape:h,radius:h===n.shapes.BOX||h===n.shapes.AABB?r:a,height:h===n.shapes.BOX||h===n.shapes.AABB?s:0}),e.getBodyCount();let f=[];e.iterateBodies(c=>{c.y>10.5&&f.push(c)});for(let c of f)e.removeObject(c.id)}}}),new k({name:"Friction",key:"friction",description:["**Friction** is applied as the last step of collision resolution. It handles both **static** and **dynamic** friction, applied as impulses at the point of contact.","Take note of the blue impulse vectors on the platforms which are present when dynamic friction is being applied.","### Scenarios","1. **Reverse Roll**: A circle spinning counter-clockwise transfers its angular momentum to linear momentum upon contact.","2. **Forward Roll**: A spinning circle with no linear momentum begins rolling forward due to friction.","3. **Slide**: A box slides across the platform and grinds to a halt.","4. **Static vs Kinetic**: Two boxes slide down a ramp. The left box has high static friction and stops; the right has no static friction and keeps sliding."].join(`

`),onInitRaw:`(world)=>{

            world.setGravity(0, 10);

            let id = 1;
            const platformSummaries = [
                "Linear to angular momentum transfer.",
                "Angular to linear momentum transfer.",
                "Slide to halt."
            ];
            // Platforms.
            for(; id <= 3; id++){
                world.makeBody(id, {
                    x: 4.5,
                    y: 2.5 * id - 0.5,
                    type: gearbox.bodyTypes.FIXED_OBJECT,
                    mass: 1,
                }).addFixture({
                    shape: gearbox.shapes.AABB,
                    width: 9.0,
                    height: 1,
                });

                gearbox.debug.addLabel({
                    text: platformSummaries[id - 1],
                    x: 4.5,
                    y: 2.5 * id - 1.2,
                    fontSize: '20px Arial',
                    color: '#00f2ff',
                    position: 'above'
                });
            }

            // One more (tilted) platform for static friction.
            const tiltedPlatformId = id++;
            world.makeBody(tiltedPlatformId, {
                x: 4.5,
                y: 9.7,
                r: 0.1,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                mass: 1,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 9.0,
                height: 1,
            });

            gearbox.debug.addLabel({
                text: "High static vs no static friction.",
                x: 4.5,
                y: 9.0,
                fontSize: '20px Arial',
                color: '#00f2ff',
                position: 'above'
            });

            // Linear to angular rolling object.
            const rollingObj1Id = id++;
            world.makeBody(rollingObj1Id, {
                x: 0,
                y: 1.0,
                vx: 5,
                rs: -8,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.5
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 0.5,
                kFriction: 0.8,
                sFriction: 0.5,
            });

            gearbox.debug.addLabel({
                text: "Reverse",
                objectId: rollingObj1Id,
                position: 'above',
                fontSize: '10px Arial'
            });

            // Angular to linear rolling object.
            const rollingObj2Id = id++;
            world.makeBody(rollingObj2Id, {
                x: 0.5,
                y: 3.5,
                rs: 15,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.5
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 0.5,
                kFriction: 0.2,
                sFriction: 0.5,
            });

            gearbox.debug.addLabel({
                text: "Forward",
                objectId: rollingObj2Id,
                position: 'above',
                fontSize: '10px Arial'
            });

            // Sliding box slows down.
            const slidingBoxId = id++;
            world.makeBody(slidingBoxId, {
                x: 0.5,
                y: 6,
                vx: 7,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.5
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1,
                height: 1,
                kFriction: 0.27,
                sFriction: 0.5,
            });

            gearbox.debug.addLabel({
                text: "Slide",
                objectId: slidingBoxId,
                position: 'above',
                fontSize: '10px Arial'
            });

            // Sliding box stops due to static friction.
            const staticBoxId = id++;
            world.makeBody(staticBoxId, {
                x: 0.5,
                y: 8.0,
                vx: 0.5,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.5
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1,
                height: .5,
                kFriction: 0.7,
                sFriction: 0.7,
            });

            gearbox.debug.addLabel({
                text: "Static",
                objectId: staticBoxId,
                position: 'above',
                fontSize: '10px Arial'
            });

            // Another sliding box but with no static friction.
            const kineticBoxId = id++;
            world.makeBody(kineticBoxId, {
                x: 1.6,
                y: 8.0,
                vx: 0.5,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.5
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1,
                height: .5,
                kFriction: 0.01,
                sFriction: 0.0,
            });

            gearbox.debug.addLabel({
                text: "Kinetic",
                objectId: kineticBoxId,
                position: 'above',
                fontSize: '10px Arial'
            });
        }`,onInit:e=>{e.setGravity(0,10);let t=1;const o=["Linear to angular momentum transfer.","Angular to linear momentum transfer.","Slide to halt."];for(;t<=3;t++)e.makeBody(t,{x:4.5,y:2.5*t-.5,type:n.bodyTypes.FIXED_OBJECT,mass:1}).addFixture({shape:n.shapes.AABB,width:9,height:1}),n.debug.addLabel({text:o[t-1],x:4.5,y:2.5*t-1.2,fontSize:"20px Arial",color:"#00f2ff",position:"above"});const i=t++;e.makeBody(i,{x:4.5,y:9.7,r:.1,type:n.bodyTypes.FIXED_OBJECT,mass:1}).addFixture({shape:n.shapes.BOX,width:9,height:1}),n.debug.addLabel({text:"High static vs no static friction.",x:4.5,y:9,fontSize:"20px Arial",color:"#00f2ff",position:"above"});const a=t++;e.makeBody(a,{x:0,y:1,vx:5,rs:-8,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5}).addFixture({shape:n.shapes.CIRCLE,radius:.5,kFriction:.8,sFriction:.5}),n.debug.addLabel({text:"Reverse",objectId:a,position:"above",fontSize:"10px Arial"});const s=t++;e.makeBody(s,{x:.5,y:3.5,rs:15,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5}).addFixture({shape:n.shapes.CIRCLE,radius:.5,kFriction:.2,sFriction:.5}),n.debug.addLabel({text:"Forward",objectId:s,position:"above",fontSize:"10px Arial"});const r=t++;e.makeBody(r,{x:.5,y:6,vx:7,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5}).addFixture({shape:n.shapes.BOX,width:1,height:1,kFriction:.27,sFriction:.5}),n.debug.addLabel({text:"Slide",objectId:r,position:"above",fontSize:"10px Arial"});const l=t++;e.makeBody(l,{x:.5,y:8,vx:.5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5}).addFixture({shape:n.shapes.BOX,width:1,height:.5,kFriction:.7,sFriction:.7}),n.debug.addLabel({text:"Static",objectId:l,position:"above",fontSize:"10px Arial"});const h=t++;e.makeBody(h,{x:1.6,y:8,vx:.5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5}).addFixture({shape:n.shapes.BOX,width:1,height:.5,kFriction:.01,sFriction:0}),n.debug.addLabel({text:"Kinetic",objectId:h,position:"above",fontSize:"10px Arial"})},onTickRaw:`(world, dt)=>{

        }`,onTick:(e,t)=>{}}),new k({name:"Collision Masks",key:"collision-masks",description:["**Collision masks** allow you to selectively enable or disable collisions between different groups of objects using bitwise logic.","In this example:","- **Blue objects**: Only collide with blue platforms and other blue objects.","- **Red objects**: Only collide with red platforms and other red objects.","- **Green objects**: Collide with **everything**.","This is implemented using `categoryBits` and `maskBits` properties."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 10);
            gearbox.debug.showForceVectors = false;
            
            // Platform Categories: 0x1 (Blue), 0x2 (Red), 0x4 (Green)
            
            // Blue Platform (Collides with category 1 and 4)
            const bluePlatId = nextId++;
            world.makeBody(bluePlatId, {
                x: 2.5, y: 8,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: '#00f2ff'
            }).addFixture({
                width: 4, height: 0.5,
                shape: gearbox.shapes.AABB,
                categoryBits: 0x1,
                maskBits: 0x1 | 0x4,
            });
            gearbox.debug.addLabel({ text: "Collides with Blue & Green", objectId: bluePlatId, color: '#00f2ff', position: 'below' });

            // Red Platform (Collides with category 2 and 4)
            const redPlatId = nextId++;
            world.makeBody(redPlatId, {
                x: 7.5, y: 8,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: '#ff4444'
            }).addFixture({
                width: 4, height: 0.5,
                shape: gearbox.shapes.AABB,
                categoryBits: 0x2,
                maskBits: 0x2 | 0x4,
            });
            gearbox.debug.addLabel({ text: "Collides with Red & Green", objectId: redPlatId, color: '#ff4444', position: 'below' });

            // Universal Platform (Collides with everything: 0x1 | 0x2 | 0x4)
            const universalPlatId = nextId++;
            world.makeBody(universalPlatId, {
                x: 5, y: 4,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: '#44ff44'
            }).addFixture({
                width: 2, height: 0.5,
                shape: gearbox.shapes.AABB,
                categoryBits: 0x4,
                maskBits: 0x7, // 1 | 2 | 4
            });
            gearbox.debug.addLabel({ text: "Collides with All", objectId: universalPlatId, color: '#44ff44', position: 'below' });
        }`,onInit:e=>{e.setGravity(0,10),n.debug.showForceVectors=!1;const t=O++;e.makeBody(t,{x:2.5,y:8,type:n.bodyTypes.FIXED_OBJECT,color:"#00f2ff"}).addFixture({width:4,height:.5,shape:n.shapes.AABB,categoryBits:1,maskBits:5}),n.debug.addLabel({text:"Collides with Blue & Green",objectId:t,color:"#00f2ff",position:"below"});const o=O++;e.makeBody(o,{x:7.5,y:8,type:n.bodyTypes.FIXED_OBJECT,color:"#ff4444"}).addFixture({width:4,height:.5,shape:n.shapes.AABB,categoryBits:2,maskBits:6}),n.debug.addLabel({text:"Collides with Red & Green",objectId:o,color:"#ff4444",position:"below"});const i=O++;e.makeBody(i,{x:5,y:4,type:n.bodyTypes.FIXED_OBJECT,color:"#44ff44"}).addFixture({width:2,height:.5,shape:n.shapes.AABB,categoryBits:4,maskBits:7}),n.debug.addLabel({text:"Collides with All",objectId:i,color:"#44ff44",position:"below"})},onTickRaw:`(world, dt)=>{
            if(Math.random() < 0.05){
                const id = nextId++;
                const type = Math.floor(Math.random() * 3);
                let color, cat, mask;
                
                if(type === 0) { // Blue
                    color = '#00f2ff'; cat = 0x1; mask = 0x1 | 0x4;
                } else if(type === 1) { // Red
                    color = '#ff4444'; cat = 0x2; mask = 0x2 | 0x4;
                } else { // Green
                    color = '#44ff44'; cat = 0x4; mask = 0x7;
                }

                world.makeBody(id, {
                    x: 2 + Math.random() * 6,
                    y: 0,
                    type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                    mass: 1,
                    color: color
                }).addFixture({
                    radius: 0.3,
                    shape: gearbox.shapes.CIRCLE,
                    categoryBits: cat,
                    maskBits: mask,
                });
                
                gearbox.debug.addLabel({
                    text: \`Cat:0x\${cat.toString(16)} Mask:0x\${mask.toString(16)}\`,
                    objectId: id,
                    color: color,
                    position: 'above',
                    fontSize: '10px Arial'
                });
            }

            // Cleanup
            let toRemove = [];
            world.iterateBodies(o=>{
                if(o.y > 11) toRemove.push(o);
            });
            for(let o of toRemove) world.removeObject(o.id);
        }`,onTick:(e,t)=>{if(Math.random()<.05){const i=O++,a=Math.floor(Math.random()*3);let s,r,l;a===0?(s="#00f2ff",r=1,l=5):a===1?(s="#ff4444",r=2,l=6):(s="#44ff44",r=4,l=7),e.makeBody(i,{x:2+Math.random()*6,y:0,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1,color:s}).addFixture({radius:.3,shape:n.shapes.CIRCLE,categoryBits:r,maskBits:l}),n.debug.addLabel({text:`Cat:0x${r.toString(16)} Mask:0x${l.toString(16)}`,objectId:i,color:s,position:"above",fontSize:"10px Arial"})}let o=[];e.iterateBodies(i=>{i.y>11&&o.push(i)});for(let i of o)e.removeObject(i.id)}}),new k({name:"Object Types",key:"object-types",description:["This example showcases the four fundamental object types in **Gearbox2D** and how they interact:","1. **Fixed Objects** (Gray): Immovable platforms with infinite mass. They form the static environment.","2. **Kinematic Objects** (Purple): Move via velocity but are unaffected by forces. They can 'push' other objects but are never pushed back.","3. **Rigid Bodies** (Colorful): Fully dynamic objects affected by gravity, forces, and collisions.","4. **Sensors** (Green Zone): Detect overlaps without causing a physical response. Here, a sensor acts as a **Recycling Zone** to remove objects."].join(`

`),onInitRaw:`(world) => {
            world.clear();
            world.setGravity(0, 10);
            gearbox.debug.showForceVectors = false;
            nextId = 1;

            // 1. Fixed Objects: The Foundation
            // Ground
            world.makeBody(nextId++, {
                x: 5, y: 9.7,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#444"
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 8, height: 0.6,
            });
            
            // Side barriers
            world.makeBody(nextId++, { x: 1, y: 7, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#444" }).addFixture({ width: 0.2, height: 6, shape: gearbox.shapes.BOX });
            world.makeBody(nextId++, { x: 9, y: 7, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#444" }).addFixture({ width: 0.2, height: 6, shape: gearbox.shapes.BOX });

            // 2. Kinematic Objects: The Machinery
            // A rotating center piece
            const rotor = world.makeBody(nextId++, {
                x: 5, y: 4,
                type: gearbox.bodyTypes.KINEMATIC_OBJECT,
                color: "#a0f",
                rs: 1.5 // Radians per second
            });
            rotor.addFixture({
                width: 3.5, height: 0.3,
                shape: gearbox.shapes.BOX,
            });
            gearbox.debug.addLabel({ text: "Kinematic Rotor", objectId: rotor.id, position: "above", color: "#a0f" });

            // A moving side platform
            const elevator = world.makeBody(nextId++, {
                x: 2.5, y: 7,
                type: gearbox.bodyTypes.KINEMATIC_OBJECT,
                color: "#a0f",
                vx: 1.0
            });
            elevator.addFixture({
                width: 1.5, height: 0.3,
                shape: gearbox.shapes.BOX,
            });
            (world as any).elevator = elevator;
            gearbox.debug.addLabel({ text: "Kinematic Elevator", objectId: elevator.id, position: "above", color: "#a0f" });

            // 4. Sensor: The Recycling Zone
            const recyclerId = nextId++;
            const recycler = world.makeBody(recyclerId, {
                x: 5, y: 8.8,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "rgba(0, 255, 100, 0.15)",
                wantsEvents: true,
            });
            recycler.addFixture({
                width: 4, height: 1.2,
                shape: gearbox.shapes.BOX,
                isSensor: true
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
            gearbox.debug.addLabel({ text: "Sensor Recycler", objectId: recycler.id, position: "on-top", color: "#4f4" });

            // Store the recycler ID to identify it in collisions
            (world as any).recyclerId = recycler.id;
            (world as any).toRemove = new Set();

            world.onCollisionStart = (idA, idB) => {
                const rid = (world as any).recyclerId;
                const otherId = idA === rid ? idB : (idB === rid ? idA : null);
                
                if (otherId !== null) {
                    const other = world.getBodyById(otherId);
                    if (other && other.type === gearbox.bodyTypes.DYNAMIC_OBJECT) {
                        (world as any).toRemove.add(otherId);
                        // Visual cue: change color before removal
                        other.color = "#4f4";
                    }
                }
            };
        }`,onInit:e=>{e.clear(),e.setGravity(0,10),n.debug.showForceVectors=!1,O=1,e.makeBody(O++,{x:5,y:9.7,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({shape:n.shapes.BOX,width:8,height:.6}),e.makeBody(O++,{x:1,y:7,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({width:.2,height:6,shape:n.shapes.BOX}),e.makeBody(O++,{x:9,y:7,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({width:.2,height:6,shape:n.shapes.BOX});const t=e.makeBody(O++,{x:5,y:4,type:n.bodyTypes.KINEMATIC_OBJECT,color:"#a0f",rs:1.5});t.addFixture({width:3.5,height:.3,shape:n.shapes.BOX}),n.debug.addLabel({text:"Kinematic Rotor",objectId:t.id,position:"above",color:"#a0f"});const o=e.makeBody(O++,{x:2.5,y:7,type:n.bodyTypes.KINEMATIC_OBJECT,color:"#a0f",vx:1});o.addFixture({width:1.5,height:.3,shape:n.shapes.BOX}),e.elevator=o,n.debug.addLabel({text:"Kinematic Elevator",objectId:o.id,position:"above",color:"#a0f"});const i=O++,a=e.makeBody(i,{x:5,y:8.8,type:n.bodyTypes.FIXED_OBJECT,color:"rgba(0, 255, 100, 0.15)",wantsEvents:!0});a.addFixture({width:4,height:1.2,shape:n.shapes.BOX,isSensor:!0}),n.debug.addLabel({text:"Sensor Recycler",objectId:a.id,position:"on-top",color:"#4f4"}),e.recyclerId=a.id,e.toRemove=new Set,e.onCollisionStart=(s,r)=>{const l=e.recyclerId,h=s===l?r:r===l?s:null;if(h!==null){const g=e.getBodyById(h);g&&g.type===n.bodyTypes.DYNAMIC_OBJECT&&(e.toRemove.add(h),g.color="#4f4")}}},onTickRaw:`(world, dt) => {
            // Update Kinematic behavior
            const elevator = (world as any).elevator;
            if (elevator) {
                if (elevator.x > 7.5) elevator.vx = -1.5;
                if (elevator.x < 2.5) elevator.vx = 1.5;
            }

            // 3. Spawn Rigid Bodies (Dynamic)
            if (world.stepCount % 20 === 0) {
                const colors = ["#ff4444", "#4444ff", "#ffff44", "#ff44ff", "#44ffff"];
                const isCircle = Math.random() > 0.5;
                const x = 3 + Math.random() * 4;
                
                const bodyId = nextId++;
                world.makeBody(bodyId, {
                    x, y: 0.5,
                    mass: 0.5 + Math.random() * 1.0,
                    type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                    color: colors[Math.floor(Math.random() * colors.length)],
                }).addFixture({
                    shape: isCircle ? gearbox.shapes.CIRCLE : gearbox.shapes.BOX,
                    radius: 0.25,
                    width: 0.5, height: 0.5,
                    restitution: 0.3
                });
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
            world.iterateBodies(obj => {
                if (obj.y > 11 || obj.y < -5 || obj.x > 11 || obj.x < -1) {
                    if (obj.type === gearbox.bodyTypes.DYNAMIC_OBJECT) {
                        outOfBounds.push(obj.id);
                    }
                }
            });
            for (const id of outOfBounds) world.removeObject(id);
        }`,onTick:(e,t)=>{const o=e.elevator;if(o&&(o.x>7.5&&(o.vx=-1.5),o.x<2.5&&(o.vx=1.5)),e.stepCount%20===0){const s=["#ff4444","#4444ff","#ffff44","#ff44ff","#44ffff"],r=Math.random()>.5,l=3+Math.random()*4,h=O++;e.makeBody(h,{x:l,y:.5,mass:.5+Math.random()*1,type:n.bodyTypes.DYNAMIC_OBJECT,color:s[Math.floor(Math.random()*s.length)]}).addFixture({shape:r?n.shapes.CIRCLE:n.shapes.BOX,radius:.25,width:.5,height:.5,restitution:.3})}const i=e.toRemove;if(i&&i.size>0){for(const s of i)e.getBodyById(s)&&e.removeObject(s);i.clear()}let a=[];e.iterateBodies(s=>{(s.y>11||s.y<-5||s.x>11||s.x<-1)&&s.type===n.bodyTypes.DYNAMIC_OBJECT&&a.push(s.id)});for(const s of a)e.removeObject(s)},onCleanup:e=>{e.onCollisionStart=void 0,delete e.elevator,delete e.recyclerId,delete e.toRemove}})];let C=1,ye=[],Ce=null,$=null,Re=null,Q=null,q=null,Le=0,De=0;const wt=[new k({name:"Simple Hinge",key:"simple-hinge",description:["A single `BOX` object attached to a `FIXED_OBJECT` by a **Hinge Joint** constraint.","The hinge allows rotation around a single point while preventing all linear relative motion. In this case, it creates a simple gravity-driven pendulum."].join(`

`),onInitRaw:`(world) => {
            nextId = 1;
            const anchorId = nextId++;
            const anchor = world.makeBody(anchorId, {
                x: 5,
                y: 3,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#ff4444"
            });
            anchor.addFixture({
                shape: gearbox.shapes.BOX,
                width: 1,
                height: 1,
            });

            const pendulumId = nextId++;
            const pendulum = world.makeBody(pendulumId, {
                x: 8,
                y: 3,
                mass: 0.1,
                color: "#44ff44"
            });
            pendulum.addFixture({
                shape: gearbox.shapes.BOX,
                width: 4,
                height: 0.5,
            });

            world.createHingeJoint(nextId++, anchor, pendulum, {
                worldAnchor: { x: 5, y: 3 }
            });

            world.setGravity(0, 9.81);
        }`,onInit:e=>{C=1;const t=C++,o=e.makeBody(t,{x:5,y:3,type:n.bodyTypes.FIXED_OBJECT,color:"#ff4444"});o.addFixture({shape:n.shapes.BOX,width:1,height:1});const i=C++,a=e.makeBody(i,{x:8,y:3,mass:.1,color:"#44ff44"});a.addFixture({shape:n.shapes.BOX,width:4,height:.5}),e.createHingeJoint(C++,o,a,{worldAnchor:{x:5,y:3}}),e.setGravity(0,9.81)}}),new k({name:"Breakable Joint",key:"breakable-joint",description:["This demo showcases **Joint Reaction Forces** and dynamic joint removal.","1. A ball is suspended by a **Hinge Joint**. Its mass increases until the reaction force exceeds a threshold, snapping the joint.","2. The ball falls onto a bridge made of `SpringJoint` segments, which also have breaking thresholds.","You can visualize the stress on the joints by enabling **Force Vectors** in the debug settings."].join(`

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
            const anchor = world.makeBody(anchorId, {
                x: 5,
                y: 1,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#ff4444"
            });
            anchor.addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 0.2,
            });

            const massObjectId = nextId++;
            massObject = world.makeBody(massObjectId, {
                x: 5,
                y: 2.5,
                mass: 0.05,
                color: "#888888"
            });
            massObject.addFixture(massObjectId, {
                shape: gearbox.shapes.CIRCLE,
                radius: 0.4,
            });

            breakableJoint = world.createHingeJoint(nextId++, anchor, massObject, {
                worldAnchor: { x: 5, y: 1 }
            });

            // 2. Spring Bridge
            const startX = 2;
            const endX = 8;
            const bridgeY = 6;
            const segments = 12;
            const segmentWidth = (endX - startX) / segments;
            const segmentHeight = 0.2;

            const bridgeAnchorLeftId = nextId++;
            const bridgeAnchorLeft = world.makeBody(bridgeAnchorLeftId, {
                x: startX - segmentWidth / 2,
                y: bridgeY,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            });
            bridgeAnchorLeft.addFixture({
                shape: gearbox.shapes.BOX,
                width: segmentWidth,
                height: 0.5,
            });

            const bridgeAnchorRightId = nextId++;
            const bridgeAnchorRight = world.makeBody(bridgeAnchorRightId, {
                x: endX + segmentWidth / 2,
                y: bridgeY,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            });
            bridgeAnchorRight.addFixture({
                shape: gearbox.shapes.BOX,
                width: segmentWidth,
                height: 0.5,
            });

            let prevBody = bridgeAnchorLeft;
            for (let i = 0; i < segments; i++) {
                const segmentBodyId = nextId++;
                const segmentBody = world.makeBody(segmentBodyId, {
                    x: startX + i * segmentWidth + segmentWidth / 2,
                    y: bridgeY,
                    mass: 0.2, // Slightly heavier for stability
                    color: "#cd853f",
                });
                segmentBody.addFixture({
                    shape: gearbox.shapes.BOX,
                    width: segmentWidth * 0.9,
                    height: segmentHeight,
                    categoryBits: 0x0004,
                    maskBits: ~0x0004 // Don't collide with other bridge segments
                });

                const sj = world.createSpringJoint(nextId++, prevBody, segmentBody, {
                    worldAnchor: { x: startX + i * segmentWidth, y: bridgeY },
                    frequencyHz: 4.0,   // More lax/stretchy
                    dampingRatio: 1.0   // High damping to eliminate jitter
                });
                bridgeJoints.push(sj);
                prevBody = segmentBody;
            }

            const lastSj = world.createSpringJoint(nextId++, prevBody, bridgeAnchorRight, {
                worldAnchor: { x: endX, y: bridgeY },
                frequencyHz: 4.0,
                dampingRatio: 1.0
            });
            bridgeJoints.push(lastSj);
            
            // Apply a side force to make it swing
            massObject.applyImpulse(0.2, 0);
        }`,onInit:e=>{C=1,n.debug.showAabbs=!1,n.debug.showForceVectors=!0,e.setGravity(0,10),ye=[],Ce=null,$=null;const t=C++,o=e.makeBody(t,{x:5,y:1,type:n.bodyTypes.FIXED_OBJECT,color:"#ff4444"});o.addFixture({shape:n.shapes.CIRCLE,radius:.2});const i=C++;$=e.makeBody(i,{x:5,y:2.5,mass:.05,color:"#888888"}),$.addFixture(i,{shape:n.shapes.CIRCLE,radius:.4}),Ce=e.createHingeJoint(C++,o,$,{worldAnchor:{x:5,y:1}});const a=2,s=8,r=6,l=12,h=(s-a)/l,g=.2,u=C++,f=e.makeBody(u,{x:a-h/2,y:r,type:n.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"});f.addFixture({shape:n.shapes.BOX,width:h,height:.5});const c=C++,d=e.makeBody(c,{x:s+h/2,y:r,type:n.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"});d.addFixture({shape:n.shapes.BOX,width:h,height:.5});let p=f;for(let x=0;x<l;x++){const b=C++,m=e.makeBody(b,{x:a+x*h+h/2,y:r,mass:.2,color:"#cd853f"});m.addFixture({shape:n.shapes.BOX,width:h*.9,height:g,categoryBits:4,maskBits:-5});const B=e.createSpringJoint(C++,p,m,{worldAnchor:{x:a+x*h,y:r},frequencyHz:4,dampingRatio:1});ye.push(B),p=m}const y=e.createSpringJoint(C++,p,d,{worldAnchor:{x:s,y:r},frequencyHz:4,dampingRatio:1});ye.push(y),$.applyImpulse(.2,0)},onTickRaw:`(world, dt) => {
            // 1. Increase mass
            if (massObject) {
                massObject.mass += dt * 3.0; // Increase mass over time
                
                gearbox.debug.removeObjectLabels(massObject.id);
                gearbox.debug.addLabel({
                    text: \`Mass: \${massObject.mass.toFixed(2)}kg\`,
                    objectId: massObject.id,
                    position: 'above',
                    color: '#fff'
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
                    const sj = bridgeJoints[i];
                    const f = sj.reactionForce;
                    const forceMag = Math.sqrt(f.x * f.x + f.y * f.y);
                    
                    if (forceMag > 600) { 
                        world.removeJoint(sj.id);
                        bridgeJoints.splice(i, 1);
                    }
                }
            }
        }`,onTick:(e,t)=>{if($&&($.mass+=t*3,n.debug.removeObjectLabels($.id),n.debug.addLabel({text:`Mass: ${$.mass.toFixed(2)}kg`,objectId:$.id,position:"above",color:"#fff"})),Ce){const o=Ce.reactionForce;Math.sqrt(o.x*o.x+o.y*o.y)>150&&(e.removeJoint(Ce.id),Ce=null)}if(ye.length>0)for(let o=ye.length-1;o>=0;o--){const i=ye[o],a=i.reactionForce;Math.sqrt(a.x*a.x+a.y*a.y)>600&&(e.removeJoint(i.id),ye.splice(o,1))}}}),new k({name:"Gear Train",key:"gear-train",description:["A sequence of gears connected using the `GearJoint` constraint.","Each gear's motion is constrained by the previous one based on a **gear ratio** (calculated here by the relative radii).","A drive gear at the start receives a constant low torque, which is then propagated through the entire train with mechanical advantage."].join(`

`),onInitRaw:`(world) => {
            nextId = 1;
            const startX = 2;
            const y = 5;
            const numGears = 5;
            const spacing = 1.5;
            
            const staticBodyId = nextId++;
            const staticBody = world.makeBody(staticBodyId, {
                x: 5, y: 5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#888",
            });
            staticBody.addFixture({
                shape: gearbox.shapes.AABB,
                width: 6.2,
                height: 0.2,
                maskBits: 0 // Don't collide with gears
            });

            let prevHinge = null;
            engineHub = null; // Reuse engineHub variable for the drive gear

            for (let i = 0; i < numGears; i++) {
                const size = (i % 2 === 0) ? 1.0 : 0.5;
                const gearId = nextId++;
                const gear = world.makeBody(gearId, {
                    x: startX + i * spacing,
                    y: y,
                    mass: size,
                    color: \`hsl(\${i * 60}, 70%, 60%)\`
                });
                gear.addFixture({
                    shape: gearbox.shapes.CIRCLE,
                    radius: size,
                });

                const hinge = world.createHingeJoint(nextId++, staticBody, gear, {
                    worldAnchor: { x: startX + i * spacing, y: y }
                });

                if (i === 0) {
                    engineHub = gear; // Mark the first gear as the driver
                } else {
                    // Ratio is based on the sizes: size_prev / size_curr
                    const prevSize = ((i - 1) % 2 === 0) ? 1.0 : 0.5;
                    const ratio = prevSize / size;
                    world.createGearJoint(nextId++, prevHinge, hinge, ratio);
                }
                prevHinge = hinge;
            }
        }`,onInit:e=>{C=1;const t=2,o=5,i=5,a=1.5,s=C++,r=e.makeBody(s,{x:5,y:5,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});r.addFixture({shape:n.shapes.AABB,width:6.2,height:.2,maskBits:0});let l=null;Re=null;for(let h=0;h<i;h++){const g=h%2===0?1:.5,u=C++,f=e.makeBody(u,{x:t+h*a,y:o,mass:g,color:`hsl(${h*60}, 70%, 60%)`});f.addFixture({shape:n.shapes.CIRCLE,radius:g});const c=e.createHingeJoint(C++,r,f,{worldAnchor:{x:t+h*a,y:o}});if(h===0)Re=f;else{const p=((h-1)%2===0?1:.5)/g;e.createGearJoint(C++,l,c,p)}l=c}},onTickRaw:`(world, dt) => {
            if (engineHub) {
                // Apply a persistent but relatively low angular impulse to the drive gear
                if(Math.abs(engineHub.rs) < 0.9) {
                    engineHub.applyAngularImpulse(0.01);
                }
            }
        }`,onTick:(e,t)=>{Re&&Math.abs(Re.rs)<.9&&Re.applyAngularImpulse(.01)}}),new k({name:"Distance Ropes",key:"distance-ropes",description:["Demonstrates the `DistanceJoint`, which maintains a fixed distance between two points on two different bodies.","A rotating drum has multiple triple-link chains hanging from it. Each link is connected by a `DistanceJoint` with a specified length, simulating a non-stretchy rope or chain."].join(`

`),onInitRaw:`(world) => {
            gearbox.debug.showAabbs = false;
            gearbox.debug.showForceVectors = false;
            nextId = 1;
            const cx = 5;
            const cy = 5;
            const drumRadius = 4;

            // The Drum Hub (fixed rotation center)
            const hubId = nextId++;
            const hub = world.makeBody(hubId, {
                x: cx,
                y: cy,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#ff4444"
            });
            hub.addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 0.5,
            });

            // The rotating drum (structure only)
            const drumId = nextId++;
            drum = world.makeBody(drumId, {
                x: cx,
                y: cy,
                mass: 100,
                color: "rgba(255, 255, 255, 0.05)",
                angularDamping: 0.5 // Add some damping to stabilize
            });
            drum.addFixture(drumId, {
                shape: gearbox.shapes.CIRCLE,
                radius: drumRadius,
                maskBits: 0,
            });

            world.createHingeJoint(nextId++, hub, drum, {
                worldAnchor: { x: cx, y: cy }
            });

            // Add hanging chain triplets
            const numChains = 8;
            const pinRadius = 3.8;
            const linkDist = 0.8; // Slightly shorter links for 3 shapes

            const getRandomAnchor = () => ({
                x: (Math.random() - 0.5) * 0.3,
                y: (Math.random() - 0.5) * 0.3
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
                const shape1 = world.makeBody(shape1Id, {
                    x: shape1X,
                    y: shape1Y,
                    mass: 0.5,
                    color: \`hsl(\${(i * 360) / numChains}, 70%, 60%)\`
                });
                shape1.addFixture({
                    shape: i % 2 === 0 ? gearbox.shapes.BOX : gearbox.shapes.CIRCLE,
                    width: 0.5,
                    height: 0.5,
                    radius: 0.25,
                });

                // Joint 1: Drum to Shape 1
                const localAnchorOnDrum = drum.worldToLocal({ x: pinX, y: pinY });
                world.createDistanceJoint(nextId++, drum, shape1, {
                    anchorA: localAnchorOnDrum,
                    anchorB: getRandomAnchor(),
                    length: linkDist
                });

                // Second link (pointing further towards center)
                const shape2X = shape1X - Math.cos(angle) * linkDist;
                const shape2Y = shape1Y - Math.sin(angle) * linkDist;
                const shape2Id = nextId++;
                const shape2 = world.makeBody(shape2Id, {
                    x: shape2X,
                    y: shape2Y,
                    mass: 0.5,
                    color: \`hsl(\${(i * 360) / numChains}, 70%, 50%)\`
                });
                shape2.addFixture({
                    shape: (i + 1) % 2 === 0 ? gearbox.shapes.BOX : gearbox.shapes.CIRCLE,
                    width: 0.5,
                    height: 0.5,
                    radius: 0.25,
                });

                // Joint 2: Shape 1 to Shape 2
                world.createDistanceJoint(nextId++, shape1, shape2, {
                    anchorA: getRandomAnchor(),
                    anchorB: getRandomAnchor(),
                    length: linkDist
                });

                // Third link (pointing even further towards center)
                const shape3X = shape2X - Math.cos(angle) * linkDist;
                const shape3Y = shape2Y - Math.sin(angle) * linkDist;
                const shape3Id = nextId++;
                const shape3 = world.makeBody(shape3Id, {
                    x: shape3X,
                    y: shape3Y,
                    mass: 0.5,
                    color: \`hsl(\${(i * 360) / numChains}, 70%, 40%)\`
                });
                shape3.addFixture({
                    shape: (i + 2) % 2 === 0 ? gearbox.shapes.BOX : gearbox.shapes.CIRCLE,
                    width: 0.5,
                    height: 0.5,
                    radius: 0.25,
                });

                // Joint 3: Shape 2 to Shape 3
                world.createDistanceJoint(nextId++, shape2, shape3, {
                    anchorA: getRandomAnchor(),
                    anchorB: getRandomAnchor(),
                    length: linkDist
                });
            }

            world.setGravity(0, 9.81);
            drum.rs = 0.2; // Slower initial start
        }`,onInit:e=>{n.debug.showAabbs=!1,n.debug.showForceVectors=!1,C=1;const t=5,o=5,i=4,a=C++,s=e.makeBody(a,{x:t,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#ff4444"});s.addFixture({shape:n.shapes.CIRCLE,radius:.5});const r=C++;Q=e.makeBody(r,{x:t,y:o,mass:100,color:"rgba(255, 255, 255, 0.05)",angularDamping:.5}),Q.addFixture(r,{shape:n.shapes.CIRCLE,radius:i,maskBits:0}),e.createHingeJoint(C++,s,Q,{worldAnchor:{x:t,y:o}});const l=8,h=3.8,g=.8,u=()=>({x:(Math.random()-.5)*.3,y:(Math.random()-.5)*.3});for(let f=0;f<l;f++){const c=f/l*Math.PI*2,d=t+Math.cos(c)*h,p=o+Math.sin(c)*h,y=d-Math.cos(c)*.5,x=p-Math.sin(c)*.5,b=C++,m=e.makeBody(b,{x:y,y:x,mass:.5,color:`hsl(${f*360/l}, 70%, 60%)`});m.addFixture({shape:f%2===0?n.shapes.BOX:n.shapes.CIRCLE,width:.5,height:.5,radius:.25});const B=Q.worldToLocal({x:d,y:p});e.createDistanceJoint(C++,Q,m,{anchorA:B,anchorB:u(),length:g});const I=y-Math.cos(c)*g,w=x-Math.sin(c)*g,M=C++,R=e.makeBody(M,{x:I,y:w,mass:.5,color:`hsl(${f*360/l}, 70%, 50%)`});R.addFixture({shape:(f+1)%2===0?n.shapes.BOX:n.shapes.CIRCLE,width:.5,height:.5,radius:.25}),e.createDistanceJoint(C++,m,R,{anchorA:u(),anchorB:u(),length:g});const H=I-Math.cos(c)*g,ae=w-Math.sin(c)*g,_=C++,Y=e.makeBody(_,{x:H,y:ae,mass:.5,color:`hsl(${f*360/l}, 70%, 40%)`});Y.addFixture({shape:(f+2)%2===0?n.shapes.BOX:n.shapes.CIRCLE,width:.5,height:.5,radius:.25}),e.createDistanceJoint(C++,R,Y,{anchorA:u(),anchorB:u(),length:g})}e.setGravity(0,9.81),Q.rs=.2},onTickRaw:`(world, dt) => {
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
        }`,onTick:(e,t)=>{if(Q){const o=Date.now()/1e3,i=o%12;let a=0,s=2;i<4?(a=1.2,s=4):i<6?(a=0,s=1):i<10?(a=Math.sin(o*4)*2,s=8):a=0;const r=a-Q.rs;Math.abs(r)>.05&&Q.applyAngularImpulse(r*s)}}}),new k({name:"Spring Belt",key:"spring-belt",description:["A chain of shapes connected by `SpringJoint` constraints, forming a belt around a rotating high-friction pulley.","The `SpringJoint` acts like a dampened harmonic oscillator, pulling objects together with a force proportional to their distance and frequency. The belt stretches and contracts as it interacts with the central rotor."].join(`

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
            const hub = world.makeBody(hubId, {
                x: cx,
                y: cy,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#666666",
            });
            hub.addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 0.1,
                maskBits: 0,
            });

            // Central rotating body (Pulley)
            const rotatorId = nextId++;
            rotator = world.makeBody(rotatorId, {
                x: cx,
                y: cy,
                rs: 2.5,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 10,
                color: "#888888",
                angularDamping: 0.1
            });
            rotator.addFixture(rotatorId, {
                shape: gearbox.shapes.CIRCLE,
                radius: innerRadius,
                sFriction: 1.0,
                kFriction: 1.0,
            });

            world.createHingeJoint(nextId++, hub, rotator, {
                worldAnchor: { x: cx, y: cy }
            });

            const numShapes = 16;
            const shapes = [];
            for (let i = 0; i < numShapes; i++) {
                const angle = (i / numShapes) * Math.PI * 2;
                const sx = cx + Math.cos(angle) * outerRadius;
                const sy = cy + Math.sin(angle) * outerRadius;

                const shapeId = nextId++;
                const shape = world.makeBody(shapeId, {
                    x: sx,
                    y: sy,
                    mass: 1.5, // Heavier for more stretch
                    color: \`hsl(\${(i * 360) / numShapes}, 70%, 60%)\`,
                });
                shape.addFixture({
                    shape: i % 2 === 0 ? gearbox.shapes.BOX : gearbox.shapes.CIRCLE,
                    width: 0.6,
                    height: 0.6,
                    radius: 0.3,
                    sFriction: 0.999,
                    kFriction: 0.99
                });
                shapes.push(shape);
            }

            // Connect shapes to each other to form a belt
            for (let i = 0; i < numShapes; i++) {
                const shapeA = shapes[i];
                const shapeB = shapes[(i + 1) % numShapes];
                
                // Calculate distance between centers for slack
                const dx = shapeB.x - shapeA.x;
                const dy = shapeB.y - shapeA.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                world.createSpringJoint(nextId++, shapeA, shapeB, {
                    length: dist * 1.1, // 10% slack
                    frequencyHz: 5.0,   // Very stretchy
                    dampingRatio: 0.2   // Bouncy
                });
            }

            world.setGravity(0, 9.81);
        }`,onInit:e=>{n.debug.showAabbs=!1,n.debug.showForceVectors=!1,C=1;const t=5,o=3,i=2.5,a=3.5,s=C++,r=e.makeBody(s,{x:t,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#666666"});r.addFixture({shape:n.shapes.CIRCLE,radius:.1,maskBits:0});const l=C++;q=e.makeBody(l,{x:t,y:o,rs:2.5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:10,color:"#888888",angularDamping:.1}),q.addFixture(l,{shape:n.shapes.CIRCLE,radius:i,sFriction:1,kFriction:1}),e.createHingeJoint(C++,r,q,{worldAnchor:{x:t,y:o}});const h=16,g=[];for(let u=0;u<h;u++){const f=u/h*Math.PI*2,c=t+Math.cos(f)*a,d=o+Math.sin(f)*a,p=C++,y=e.makeBody(p,{x:c,y:d,mass:1.5,color:`hsl(${u*360/h}, 70%, 60%)`});y.addFixture({shape:u%2===0?n.shapes.BOX:n.shapes.CIRCLE,width:.6,height:.6,radius:.3,sFriction:.999,kFriction:.99}),g.push(y)}for(let u=0;u<h;u++){const f=g[u],c=g[(u+1)%h],d=c.x-f.x,p=c.y-f.y,y=Math.sqrt(d*d+p*p);e.createSpringJoint(C++,f,c,{length:y*1.1,frequencyHz:5,dampingRatio:.2})}e.setGravity(0,9.81)},onTickRaw:`(world, dt) => {
            if (rotator) {
                // Apply a persistent angular impulse until we reach target speed
                if(Math.abs(rotator.rs) < 2.5) {
                    rotator.applyAngularImpulse(1.0);
                }
            }
        }`,onTick:(e,t)=>{q&&Math.abs(q.rs)<2.5&&q.applyAngularImpulse(1)}}),new k({name:"Soft Body Ball",key:"soft-body",description:["A collection of `CIRCLE` objects connected by a network of `SpringJoint` constraints to form a squishy, deformable ball.","The ball features a central core (axel) connected to an outer ring of nodes. This setup simulates **Soft Body Dynamics** using a mass-spring system.","Persistent random impulses are applied to the core to keep the ball moving and demonstrate its elasticity."].join(`

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
            const center = world.makeBody(centerId, {
                x: cx,
                y: cy,
                mass: 2.0, // Heavier axel for more stability
                color: "#ff8888",
            });
            center.addFixture({
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
                const p = world.makeBody(pId, {
                    x: px,
                    y: py,
                    mass: 0.5,
                    color: "#8888ff",
                });
                p.addFixture({
                    shape: gearbox.shapes.CIRCLE,
                    radius: 0.2,
                    sFriction: 0.9,
                    kFriction: 0.9,
                });
                points.push(p);

                // Connect to center - Offset to the edge of the axel
                world.createSpringJoint(nextId++, center, p, {
                    anchorA: { x: Math.cos(angle) * axelRadius, y: Math.sin(angle) * axelRadius },
                    length: radius - axelRadius,
                    frequencyHz: 4.0,
                    dampingRatio: 0.5
                });

                // Connect to neighbors
                if (i > 0) {
                    world.createSpringJoint(nextId++, points[i-1], p, {
                        length: (2 * radius * Math.sin(Math.PI / segments)),
                        frequencyHz: 4.0,
                        dampingRatio: 0.5
                    });
                }
            }
            
            // Close the ring
            world.createSpringJoint(nextId++, points[segments-1], points[0], {
                length: (2 * radius * Math.sin(Math.PI / segments)),
                frequencyHz: 4.0,
                dampingRatio: 0.5
            });

            // Ground - made wider to accommodate movement
            const groundId = nextId++;
            world.makeBody(groundId, {
                x: 5,
                y: 10,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa",
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 15,
                height: 2,
                sFriction: 0.9,
                kFriction: 0.9,
            });

            // Barriers to keep the ball from rolling off - taller and thicker
            const barrier1Id = nextId++;
            world.makeBody(barrier1Id, {
                x: -3.5,
                y: 4.25,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 2.0,
                height: 10,
            });
            const barrier2Id = nextId++;
            world.makeBody(barrier2Id, {
                x: 13.5,
                y: 4.25,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 2.0,
                height: 10,
            });

            world.setGravity(0, 9.81);
        }`,onInit:e=>{n.debug.showAabbs=!1,n.debug.showForceVectors=!1,C=1;const t=5,o=3,i=2,a=12,s=[],r=.2,l=C++,h=e.makeBody(l,{x:t,y:o,mass:2,color:"#ff8888"});h.addFixture({shape:n.shapes.CIRCLE,radius:r,sFriction:.9,kFriction:.9}),q=h,Le=0,De=-30;for(let c=0;c<a;c++){const d=c/a*Math.PI*2,p=t+Math.cos(d)*i,y=o+Math.sin(d)*i,x=C++,b=e.makeBody(x,{x:p,y,mass:.5,color:"#8888ff"});b.addFixture({shape:n.shapes.CIRCLE,radius:.2,sFriction:.9,kFriction:.9}),s.push(b),e.createSpringJoint(C++,h,b,{anchorA:{x:Math.cos(d)*r,y:Math.sin(d)*r},length:i-r,frequencyHz:4,dampingRatio:.5}),c>0&&e.createSpringJoint(C++,s[c-1],b,{length:2*i*Math.sin(Math.PI/a),frequencyHz:4,dampingRatio:.5})}e.createSpringJoint(C++,s[a-1],s[0],{length:2*i*Math.sin(Math.PI/a),frequencyHz:4,dampingRatio:.5});const g=C++;e.makeBody(g,{x:5,y:10,type:n.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}).addFixture({shape:n.shapes.BOX,width:15,height:2,sFriction:.9,kFriction:.9});const u=C++;e.makeBody(u,{x:-3.5,y:4.25,type:n.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}).addFixture({shape:n.shapes.BOX,width:2,height:10});const f=C++;e.makeBody(f,{x:13.5,y:4.25,type:n.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}).addFixture({shape:n.shapes.BOX,width:2,height:10}),e.setGravity(0,9.81)},onTickRaw:`(world, dt) => {
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
        }`,onTick:(e,t)=>{q&&(De<=0&&(Math.random()<.02?(Le=(Math.random()-.5)*3,De=40+Math.random()*80):Le=0),De>0&&(q.applyAngularImpulse(Le),q.applyImpulse(Le*.1,0),De--))}})];let In=0,Xe=1;const Ct=[new k({name:"Sleep and Islands",key:"sleep-and-islands",description:["**Sleep** optimization in **Gearbox2D** uses a movement-based heuristic computed during the kinematics step.","Instead of rebuilding a complex global island data structure each tick, each object tracks its own local contacts. When an object wakes up (due to a force or collision), it automatically wakes its neighbors.","This provides the performance benefits of **Islands** with significantly lower overhead."].join(`

`),globalLines:["let simulationTime = 0;","let nextId = 1;"],onInitRaw:`(world)=>{
            world.setGravity(0, 10);
            simulationTime = 3;
            nextId = 0;

            world.makeBody(nextId++, {
                x: 5,
                y: 8.50,
                vx: 0.0,
                vy: 0.0,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                mass: 2, 
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: 20,
                height: 1,
            });
        }`,onInit:e=>{e.setGravity(0,10),In=3,Xe=0,e.makeBody(Xe++,{x:5,y:8.5,vx:0,vy:0,type:n.bodyTypes.FIXED_OBJECT,mass:2}).addFixture({shape:n.shapes.AABB,width:20,height:1})},onTickRaw:`(world, dt)=>{
            const nObjects = 10;
            simulationTime += dt*2;
            let numbSeconds = Math.floor(simulationTime / 3);
            if(numbSeconds > nextId){
                if(nextId < nObjects){
                    const bodyId = nextId++;
                    world.makeBody(bodyId, {
                        x: 5,
                        y: 0,
                        r: (Math.random() - 0.5) * 0.1, // Add small random rotation
                        vx: 0,
                        vy: 0,
                        type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                        mass: 0.2, 
                    }).addFixture({
                        shape: gearbox.shapes.BOX,
                        width: 6,
                        height: 0.5,
                        sFriction: 10,
                        kFriction: 10,
                    });
                }
            }
        }`,onTick:(e,t)=>{if(In+=t*2,Math.floor(In/3)>Xe&&Xe<10){const a=Xe++;e.makeBody(a,{x:5,y:0,r:(Math.random()-.5)*.1,vx:0,vy:0,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:n.shapes.BOX,width:6,height:.5,sFriction:10,kFriction:10})}}}),new k({name:"Shrink Wrap",key:"shrink-wrap",description:["Objects that are put to **Sleep** have their **AABBs** 'shrink-wrapped' to their exact shape bounds.","This provides a slight performance boost during broad-phase collision detection by reducing false positives in the BVH tree for stationary objects."].join(`

`),globalLines:[],onInitRaw:`(world)=>{

            world.makeBody(1, {
                x: 10,
                y: 10,
                vx: -5.0,
                vy: -5.0,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.2, 
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 1,
                restitution: 0,
            });
            world.makeBody(2, {
                x: 0,
                y: 0,
                vx: 5.0,
                vy: 5.0,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.2, 
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 1,
                restitution: 0,
            });
        }`,onInit:e=>{e.makeBody(1,{x:10,y:10,vx:-5,vy:-5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:n.shapes.CIRCLE,radius:1,restitution:0}),e.makeBody(2,{x:0,y:0,vx:5,vy:5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:n.shapes.CIRCLE,radius:1,restitution:0})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,t)=>{}})];let v=1,oe=null,tn=null,ve=null;const st=(e,t)=>({x:(e-n.debug.offsetX)/(n.debug.zoom*100),y:(t-n.debug.offsetY)/(n.debug.zoom*100)}),kt=(e,t)=>{if(e.button!==0)return;const o=ve.getBoundingClientRect(),i=st(e.clientX-o.left,e.clientY-o.top),a=t.queryPoint(i.x,i.y);if(a.length>0){const s=a[0],r=t.getBodyById(s);r&&r.type!==n.bodyTypes.FIXED_OBJECT&&(oe=t.makeBody(999999,{x:i.x,y:i.y,type:n.bodyTypes.FIXED_OBJECT,color:"transparent"}),oe.addFixture(999999,{shape:n.shapes.CIRCLE,radius:.05,maskBits:0}),tn=t.createSpringJoint(999998,oe,r,{worldAnchor:i,frequencyHz:3,dampingRatio:1,length:0}))}},Tt=e=>{if(oe){const t=ve.getBoundingClientRect(),o=st(e.clientX-t.left,e.clientY-t.top);oe.x=o.x,oe.y=o.y}},At=(e,t)=>{tn&&(t.removeJoint(tn.id),tn=null),oe&&(t.removeObject(oe.id),oe=null)},Un=e=>{ve=document.getElementById("debug-canvas"),e._mouseDownHandler=t=>kt(t,e),e._mouseMoveHandler=t=>Tt(t),e._mouseUpHandler=t=>At(t,e),ve.addEventListener("mousedown",e._mouseDownHandler),window.addEventListener("mousemove",e._mouseMoveHandler),window.addEventListener("mouseup",e._mouseUpHandler)},Vn=e=>{ve&&(ve.removeEventListener("mousedown",e._mouseDownHandler),window.removeEventListener("mousemove",e._mouseMoveHandler),window.removeEventListener("mouseup",e._mouseUpHandler),delete e._mouseDownHandler,delete e._mouseMoveHandler,delete e._mouseUpHandler)},Et=[new k({name:"2000 Colliding Circles",key:"particles",description:["A **Stress Test** featuring 2,000 `CIRCLE` objects with full collision resolution.","This demo helps visualize the performance of the **BVH (Bounding Volume Hierarchy)** and the narrow-phase collision solver.","**Note**: In many environments, the primary bottleneck will be the Canvas 2D rendering rather than the physics simulation."].join(`

`),onInitRaw:`(world)=>{
            (world as any)._frameCounter = 0;
            world.clear();
            let id = 1;
            let thickness = 2;
            let length = 11;

            // Walls
            world.makeBody(id++, {
                x: 5, y: 0,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: length, height: thickness,
                restitution: 0.99,
            });
            world.makeBody(id++, {
                x: 5, y: 10,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: length, height: thickness,
                restitution: 0.99,
            });
            world.makeBody(id++, {
                x: 0, y: 5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: thickness, height: length,
                restitution: 0.99,
            });
            world.makeBody(id++, {
                x: 10, y: 5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: thickness, height: length,
                restitution: 0.99,
            });

            for(let i = 0; i < 2000; i++){
                const bodyId = id++;
                world.makeBody(bodyId, {
                    x: Math.random() * 8 + 1,
                    y: Math.random() * 8 + 1,
                    vx: Math.random() * 1.00 - .50,
                    vy: Math.random() * 1.00 - .50,
                    r: Math.PI / 2 * Math.random(),
                    rs: (Math.random() - 0.5) * 20.00,
                    type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                    mass: 0.5,
                    linearDamping: 0.0,
                    angularDamping: 0.5,
                }).addFixture({
                    shape: gearbox.shapes.CIRCLE,
                    radius: .05,
                    restitution: 0.5,
                });
            }
        }`,onInit:e=>{e._frameCounter=0,e.clear();let t=1,o=2,i=11;e.makeBody(t++,{x:5,y:0,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.AABB,width:i,height:o,restitution:.99}),e.makeBody(t++,{x:5,y:10,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.AABB,width:i,height:o,restitution:.99}),e.makeBody(t++,{x:0,y:5,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.AABB,width:o,height:i,restitution:.99}),e.makeBody(t++,{x:10,y:5,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.AABB,width:o,height:i,restitution:.99});for(let a=0;a<2e3;a++){const s=t++;e.makeBody(s,{x:Math.random()*8+1,y:Math.random()*8+1,vx:Math.random()*1-.5,vy:Math.random()*1-.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*20,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.5,linearDamping:0,angularDamping:.5}).addFixture({shape:n.shapes.CIRCLE,radius:.05,restitution:.5})}},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,t)=>{}}),new k({name:"2000 Bouncy Points",key:"fleas",description:["A stress test with 2,000 bouncy `POINT` objects.","Point objects have zero radius and don't collide with each other, but they do collide with other shapes (like the `AABB` walls in this demo). This allows for extremely high-density simulations."].join(`

`),onInitRaw:`(world)=>{
            world.clear();
            const nFleas = 2000;
            world.setGravity(0, 10);
            let id = 1;
            let thickness = 2;
            let length = 11;

            // Walls
            world.makeBody(id++, {
                x: 5, y: 0,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: length, height: thickness,
                restitution: 1.0,
                sFriction: 0, kFriction: 0,
            });
            world.makeBody(id++, {
                x: 5, y: 10,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: length, height: thickness,
                restitution: 1.0,
                sFriction: 0, kFriction: 0,
            });
            world.makeBody(id++, {
                x: 0, y: 5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: thickness, height: length,
                restitution: 1.0,
                sFriction: 0, kFriction: 0,
            });
            world.makeBody(id++, {
                x: 10, y: 5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: thickness, height: length,
                restitution: 1.0,
                sFriction: 0, kFriction: 0,
            });

            for(let i = 0; i < nFleas; i++){
                const bodyId = id++;
                world.makeBody(bodyId, {
                    x: Math.random() * 8 + 1,
                    y: Math.random() * 8 + 1,
                    vx: Math.random() * 10.00 - 5.0,
                    r: Math.PI / 2 * Math.random(),
                    type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                    mass: 2,
                    linearDamping: 0.0,
                    angularDamping: 0.5,
                }).addFixture({
                    shape: gearbox.shapes.POINT,
                    radius: .05,
                    restitution: 1.0,
                    sFriction: 0, kFriction: 0,
                });
            }
        }`,onInit:e=>{e.clear();const t=2e3;e.setGravity(0,10);let o=1,i=2,a=11;e.makeBody(o++,{x:5,y:0,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.AABB,width:a,height:i,restitution:1,sFriction:0,kFriction:0}),e.makeBody(o++,{x:5,y:10,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.AABB,width:a,height:i,restitution:1,sFriction:0,kFriction:0}),e.makeBody(o++,{x:0,y:5,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.AABB,width:i,height:a,restitution:1,sFriction:0,kFriction:0}),e.makeBody(o++,{x:10,y:5,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.AABB,width:i,height:a,restitution:1,sFriction:0,kFriction:0});for(let s=0;s<t;s++){const r=o++;e.makeBody(r,{x:Math.random()*8+1,y:Math.random()*8+1,vx:Math.random()*10-5,r:Math.PI/2*Math.random(),type:n.bodyTypes.DYNAMIC_OBJECT,mass:2,linearDamping:0,angularDamping:.5}).addFixture({shape:n.shapes.POINT,radius:.05,restitution:1,sFriction:0,kFriction:0})}},onTickRaw:"(world, dt)=>{}",onTick:(e,t)=>{}}),new k({name:"10 Stacked Boxes",key:"stacked-boxes",description:"A vertical stack of 10 dynamic boxes testing the stability of the impulse solver under persistent contact.",onInitRaw:`(world) => {
            world.clear();
            world.setGravity(0, 10);
            nextId = 1;

            // Ground
            world.makeBody(nextId++, {
                x: 5, y: 9.5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#444"
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 10, height: 1,
            });

            for (let i = 0; i < 10; i++) {
                world.makeBody(nextId++, {
                    x: 5, y: 8.5 - i * 0.6,
                    mass: 1.0,
                    color: \`hsl(\${i * 36}, 70%, 60%)\`
                }).addFixture({
                    shape: gearbox.shapes.BOX,
                    width: 1, height: 0.5,
                    restitution: 0.1,
                    sFriction: 0.5, kFriction: 0.3
                });
            }
        }`,onInit:e=>{e.clear(),e.setGravity(0,10),v=1,e.makeBody(v++,{x:5,y:9.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({shape:n.shapes.BOX,width:10,height:1});for(let t=0;t<10;t++)e.makeBody(v++,{x:5,y:8.5-t*.6,mass:1,color:`hsl(${t*36}, 70%, 60%)`}).addFixture({shape:n.shapes.BOX,width:1,height:.5,restitution:.1,sFriction:.5,kFriction:.3})}}),new k({name:"5-Level Pyramid",key:"pyramid",description:"A 5-level pyramid made of boxes. Tests multiple simultaneous contact points and stack stability.",onInitRaw:`(world) => {
            world.clear();
            world.setGravity(0, 10);
            nextId = 1;

            // Ground
            world.makeBody(nextId++, {
                x: 5, y: 9.5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#444"
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 10, height: 1,
            });

            const boxWidth = 0.8;
            const boxHeight = 0.8;
            const levels = 5;

            for (let i = 0; i < levels; i++) {
                const numBoxes = levels - i;
                const startX = 5 - (numBoxes - 1) * boxWidth / 2;
                const y = 8.6 - i * boxHeight;

                for (let j = 0; j < numBoxes; j++) {
                    world.makeBody(nextId++, {
                        x: startX + j * boxWidth, y: y,
                        mass: 1.0,
                        color: \`hsl(\${i * 40}, 60%, 50%)\`
                    }).addFixture({
                        shape: gearbox.shapes.BOX,
                        width: boxWidth * 0.95, height: boxHeight * 0.95,
                        restitution: 0.1,
                        sFriction: 0.5, kFriction: 0.3
                    });
                }
            }
        }`,onInit:e=>{e.clear(),e.setGravity(0,10),v=1,e.makeBody(v++,{x:5,y:9.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({shape:n.shapes.BOX,width:10,height:1});const t=.8,o=.8,i=5;for(let a=0;a<i;a++){const s=i-a,r=5-(s-1)*t/2,l=8.6-a*o;for(let h=0;h<s;h++)e.makeBody(v++,{x:r+h*t,y:l,mass:1,color:`hsl(${a*40}, 60%, 50%)`}).addFixture({shape:n.shapes.BOX,width:t*.95,height:o*.95,restitution:.1,sFriction:.5,kFriction:.3})}}}),new k({name:"Mass Ratio",key:"mass-ratio",description:"A classic physics engine test: a very heavy object (mass 100) resting on a very light one (mass 0.1).",onInitRaw:`(world) => {
            world.clear();
            world.setGravity(0, 10);
            nextId = 1;

            // Ground
            world.makeBody(nextId++, {
                x: 5, y: 9.5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#444"
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 10, height: 1,
            });

            // Light box
            world.makeBody(nextId++, {
                x: 5, y: 8.5,
                mass: 0.1,
                color: "#4ade80"
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1, height: 1,
            });

            // Heavy box
            world.makeBody(nextId++, {
                x: 5, y: 7.0,
                mass: 100,
                color: "#f87171"
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 2, height: 2,
            });
        }`,onInit:e=>{e.clear(),e.setGravity(0,10),v=1,e.makeBody(v++,{x:5,y:9.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({shape:n.shapes.BOX,width:10,height:1}),e.makeBody(v++,{x:5,y:8.5,mass:.1,color:"#4ade80"}).addFixture({shape:n.shapes.BOX,width:1,height:1}),e.makeBody(v++,{x:5,y:7,mass:100,color:"#f87171"}).addFixture({shape:n.shapes.BOX,width:2,height:2})}}),new k({name:"Ragdoll",key:"ragdoll",description:"A draggable ragdoll made of boxes and circles connected by HingeJoints. Click and drag to interact.",onInitRaw:`(world) => {
            world.clear();
            world.setGravity(0, 10);
            gearbox.debug.showAabbs = false;
            nextId = 1;

            // Ground
            world.makeBody(nextId++, {
                x: 5, y: 9.5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#444"
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 10, height: 1,
            });

            const cx = 5, cy = 4;
            
            // Head
            const head = world.makeBody(nextId++, { x: cx, y: cy - 1.5, mass: 1.0, color: "#fed7aa" });
            head.addFixture({ shape: gearbox.shapes.CIRCLE, radius: 0.3 });

            // Torso
            const torso = world.makeBody(nextId++, { x: cx, y: cy, mass: 2.0, color: "#93c5fd" });
            torso.addFixture({ shape: gearbox.shapes.BOX, width: 0.6, height: 1.0 });

            // Arms and Legs segments
            const createLimb = (x: number, y: number, w: number, h: number, color: string) => {
                const limb = world.makeBody(nextId++, { x, y, mass: 0.5, color });
                limb.addFixture({ shape: gearbox.shapes.BOX, width: w, height: h });
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
            world.createHingeJoint(nextId++, head, torso, { worldAnchor: { x: cx, y: cy - 1.0 } });
            
            world.createHingeJoint(nextId++, torso, lUpperArm, { worldAnchor: { x: cx - 0.3, y: cy - 0.3 } });
            world.createHingeJoint(nextId++, lUpperArm, lLowerArm, { worldAnchor: { x: cx - 0.85, y: cy - 0.3 } });
            
            world.createHingeJoint(nextId++, torso, rUpperArm, { worldAnchor: { x: cx + 0.3, y: cy - 0.3 } });
            world.createHingeJoint(nextId++, rUpperArm, rLowerArm, { worldAnchor: { x: cx + 0.85, y: cy - 0.3 } });

            world.createHingeJoint(nextId++, torso, lUpperLeg, { worldAnchor: { x: cx - 0.2, y: cy + 0.5 } });
            world.createHingeJoint(nextId++, lUpperLeg, lLowerLeg, { worldAnchor: { x: cx - 0.2, y: cy + 1.15 } });

            world.createHingeJoint(nextId++, torso, rUpperLeg, { worldAnchor: { x: cx + 0.2, y: cy + 0.5 } });
            world.createHingeJoint(nextId++, rUpperLeg, rLowerLeg, { worldAnchor: { x: cx + 0.2, y: cy + 1.15 } });

            setupMouseListeners(world);
        }`,onInit:e=>{e.clear(),e.setGravity(0,10),n.debug.showAabbs=!1,v=1,e.makeBody(v++,{x:5,y:9.5,type:n.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({shape:n.shapes.BOX,width:10,height:1});const t=5,o=4,i=e.makeBody(v++,{x:t,y:o-1.5,mass:1,color:"#fed7aa"});i.addFixture({shape:n.shapes.CIRCLE,radius:.3});const a=e.makeBody(v++,{x:t,y:o,mass:2,color:"#93c5fd"});a.addFixture({shape:n.shapes.BOX,width:.6,height:1});const s=(p,y,x,b,m)=>{const B=e.makeBody(v++,{x:p,y,mass:.5,color:m});return B.addFixture({shape:n.shapes.BOX,width:x,height:b}),B},r=s(t-.6,o-.3,.5,.2,"#fed7aa"),l=s(t-1.1,o-.3,.5,.2,"#fed7aa"),h=s(t+.6,o-.3,.5,.2,"#fed7aa"),g=s(t+1.1,o-.3,.5,.2,"#fed7aa"),u=s(t-.2,o+.8,.2,.6,"#1e3a8a"),f=s(t-.2,o+1.5,.2,.6,"#fed7aa"),c=s(t+.2,o+.8,.2,.6,"#1e3a8a"),d=s(t+.2,o+1.5,.2,.6,"#fed7aa");e.createHingeJoint(v++,i,a,{worldAnchor:{x:t,y:o-1}}),e.createHingeJoint(v++,a,r,{worldAnchor:{x:t-.3,y:o-.3}}),e.createHingeJoint(v++,r,l,{worldAnchor:{x:t-.85,y:o-.3}}),e.createHingeJoint(v++,a,h,{worldAnchor:{x:t+.3,y:o-.3}}),e.createHingeJoint(v++,h,g,{worldAnchor:{x:t+.85,y:o-.3}}),e.createHingeJoint(v++,a,u,{worldAnchor:{x:t-.2,y:o+.5}}),e.createHingeJoint(v++,u,f,{worldAnchor:{x:t-.2,y:o+1.15}}),e.createHingeJoint(v++,a,c,{worldAnchor:{x:t+.2,y:o+.5}}),e.createHingeJoint(v++,c,d,{worldAnchor:{x:t+.2,y:o+1.15}}),Un(e)},onCleanup:e=>{Vn(e)}}),new k({name:"⚠ Bullet Through Paper",key:"bullet",description:"Tests anti-tunneling by firing a fast-moving 'bullet' (small circle) through a thin 'paper' (static AABB).",onInitRaw:`(world) => {
            world.clear();
            world.setGravity(0, 0);
            nextId = 1;

            // Thin Paper
            world.makeBody(nextId++, {
                x: 7, y: 5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#ccc"
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 0.05, height: 4,
            });

            // The Bullet
            const bullet = world.makeBody(nextId++, {
                x: 1, y: 5,
                vx: 200, // Extremely high velocity
                mass: 1.0,
                color: "#ff4444"
            });
            bullet.addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 0.1,
            });
            
            (world as any).bulletId = bullet.id;
        }`,onInit:e=>{e.clear(),e.setGravity(0,0),v=1,e.makeBody(v++,{x:7,y:5,type:n.bodyTypes.FIXED_OBJECT,color:"#ccc"}).addFixture({shape:n.shapes.BOX,width:.05,height:4});const t=e.makeBody(v++,{x:1,y:5,vx:200,mass:1,color:"#ff4444"});t.addFixture({shape:n.shapes.CIRCLE,radius:.1}),e.bulletId=t.id},onTickRaw:`(world, dt) => {
            const bullet = world.getBodyById((world as any).bulletId);
            if (bullet && bullet.x > 10) {
                bullet.x = 1;
                bullet.vx = 200;
            }
        }`,onTick:(e,t)=>{const o=e.getBodyById(e.bulletId);o&&o.x>10&&(o.x=1,o.vx=200)}}),new k({name:"20-Segment Chain",key:"chain",description:"A 20-segment chain suspended from a fixed point using DistanceJoints.",onInitRaw:`(world) => {
            world.clear();
            world.setGravity(0, 10);
            gearbox.debug.showAabbs = false;
            nextId = 1;

            const cx = 5, cy = 1;
            const segments = 20;
            const segW = 0.4, segH = 0.15;

            const anchor = world.makeBody(nextId++, {
                x: cx, y: cy+ (Math.random() - 0.5) * 0.1,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#444"
            });
            anchor.addFixture({ shape: gearbox.shapes.CIRCLE, radius: 0.1 });

            let randomness = 0;
            randomness = + (Math.random() - 0.5) * 0.00001;

            let lastBody = anchor;
            for (let i = 0; i < segments; i++) {
                const body = world.makeBody(nextId++, {
                    x: cx + randomness, y: cy + (i + 1) * segW,
                    mass: 0.2,
                    color: i % 2 === 0 ? "#60a5fa" : "#3b82f6"
                });
                body.addFixture({ shape: gearbox.shapes.BOX, width: segW, height: segH });
                
                world.createDistanceJoint(nextId++, lastBody, body, {
                    worldAnchor: { x: cx, y: cy + i * segW + segW/2 }
                });
                lastBody = body;
            }
            
            setupMouseListeners(world);
        }`,onInit:e=>{e.clear(),e.setGravity(0,10),n.debug.showAabbs=!1,v=1;const t=5,o=1,i=20,a=.4,s=.15,r=e.makeBody(v++,{x:t,y:o+(Math.random()-.5)*.1,type:n.bodyTypes.FIXED_OBJECT,color:"#444"});r.addFixture({shape:n.shapes.CIRCLE,radius:.1});let l=0;l=+(Math.random()-.5)*1e-5;let h=r;for(let g=0;g<i;g++){const u=e.makeBody(v++,{x:t+l,y:o+(g+1)*a,mass:.2,color:g%2===0?"#60a5fa":"#3b82f6"});u.addFixture({shape:n.shapes.BOX,width:a,height:s}),e.createDistanceJoint(v++,h,u,{worldAnchor:{x:t,y:o+g*a+a/2}}),h=u}Un(e)},onCleanup:e=>{Vn(e)}})];let Bn=0,Kn=1;const vt=[new k({name:"TC-1 (SOLVED)",key:"tc-1",description:["**Test Case 1**: Verifies stability during box-on-box collisions.","Previously, boxes would exhibit 'jitter' or 'explosive' behavior when colliding at certain angles."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 10);

            let id = 1;
            world.makeBody(id++, {
                x: 5,
                y: 8,
                // r: Math.PI,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                mass: 1,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1,
                height: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeBody(id++, {
                x: 7,
                y: 2,
                // r: Math.PI,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 1,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                // radius: 1,
                width: 5,
                height: 1,
            });

            world.makeBody(id++, {
                x: 3,
                y: 5,
                // r: Math.PI,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 1,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                // radius: 1,
                width: 5,
                height: 1,
            });
        }`,onInit:e=>{e.setGravity(0,10);let t=1;e.makeBody(t++,{x:5,y:8,type:n.bodyTypes.FIXED_OBJECT,mass:1}).addFixture({shape:n.shapes.BOX,width:1,height:1}),e.makeBody(t++,{x:7,y:2,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1}).addFixture({shape:n.shapes.BOX,width:5,height:1}),e.makeBody(t++,{x:3,y:5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1}).addFixture({shape:n.shapes.BOX,width:5,height:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,t)=>{}}),new k({name:"TC-2 (SOLVED)",key:"tc-2",description:["**Test Case 2**: Ensures `BOX` shapes do not tunnel through `AABB` shapes.","This test case was used to refine the overlap detection and penetration resolution logic for different boundary types."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 10);

            let id = 1;
            world.makeBody(id++, {
                x: 5,
                y: 8,
                r: Math.PI / 2,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                mass: 1,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: 1,
                height: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeBody(id++, {
                x: 7,
                y: 2,
                // r: Math.PI / 2,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 1,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 5,
                height: 1,
            });
            world.makeBody(id++, {
                x: 3,
                y: 5,
                // r: Math.PI / 2,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 1,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 5,
                height: 1,
            });
        }`,onInit:e=>{e.setGravity(0,10);let t=1;e.makeBody(t++,{x:5,y:8,r:Math.PI/2,type:n.bodyTypes.FIXED_OBJECT,mass:1}).addFixture({shape:n.shapes.AABB,width:1,height:1}),e.makeBody(t++,{x:7,y:2,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1}).addFixture({shape:n.shapes.BOX,width:5,height:1}),e.makeBody(t++,{x:3,y:5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1}).addFixture({shape:n.shapes.BOX,width:5,height:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,t)=>{}}),new k({name:"TC-3 (SOLVED)",key:"tc-3",description:["**Test Case 3**: Momentum preservation and angular transfer.","Previously, objects would lose too much linear momentum during eccentric collisions. The solver now correctly calculates the balance between linear and angular velocity transfer."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 0);

            let id = 1;
            world.makeBody(id++, {
                x: 8,
                y: 5,
                // r: Math.PI,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                mass: 1,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1,
                height: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeBody(id++, {
                x: 2,
                y: 3,
                vx: 3,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 1,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                // radius: 1,
                width: 1,
                height: 5,
            });
        }`,onInit:e=>{e.setGravity(0,0);let t=1;e.makeBody(t++,{x:8,y:5,type:n.bodyTypes.FIXED_OBJECT,mass:1}).addFixture({shape:n.shapes.BOX,width:1,height:1}),e.makeBody(t++,{x:2,y:3,vx:3,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1}).addFixture({shape:n.shapes.BOX,width:1,height:5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,t)=>{}}),new k({name:"TC-4 (SOLVED)",key:"tc-4",description:["**Test Case 4**: Correctness of angular velocity direction.","Ensures that objects receive torque in the physically correct direction based on the contact point and normal."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 0);

            let id = 1;
            world.makeBody(id++, {
                x: 8,
                y: 5,
                // r: Math.PI,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                mass: 1,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1,
                height: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeBody(id++, {
                x: 2,
                y: 6,
                vx: 3,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 1,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                // radius: 1,
                width: 1,
                height: 5,
            });
        }`,onInit:e=>{e.setGravity(0,0);let t=1;e.makeBody(t++,{x:8,y:5,type:n.bodyTypes.FIXED_OBJECT,mass:1}).addFixture({shape:n.shapes.BOX,width:1,height:1}),e.makeBody(t++,{x:2,y:6,vx:3,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1}).addFixture({shape:n.shapes.BOX,width:1,height:5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,t)=>{}}),new k({name:"TC-5 (SOLVED)",key:"tc-5",description:["**Test Case 5**: Sensitivity to initial rotation.","Fixes an issue where even tiny angular velocities (`rs`) caused disproportionate collision responses. Also verifies that rotating objects transfer angular momentum in opposing directions."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 0);

            let id = 1;
            world.makeBody(id++, {
                x: 5,
                y: 5,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 4,
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 1,
            });

            world.makeBody(id++, {
                x: 2.8,
                y: 2.0,
                vx: 3,
                vy: 3,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 1,
                // rs: 10,
                rs: 0.01,
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 0.5,
            });
        }`,onInit:e=>{e.setGravity(0,0);let t=1;e.makeBody(t++,{x:5,y:5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:4}).addFixture({shape:n.shapes.CIRCLE,radius:1}),e.makeBody(t++,{x:2.8,y:2,vx:3,vy:3,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1,rs:.01}).addFixture({shape:n.shapes.CIRCLE,radius:.5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,t)=>{}}),new k({name:"TC-6 (SOLVED)",key:"tc-6",description:["**Test Case 6**: Contact point calculation accuracy.","Uses edge-clipping techniques to ensure stable and accurate impulse application during complex box-box collisions."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 10);
            world.setHasFriction(false);

            let id = 1;
            world.makeBody(id++, {
                x: 5,
                y: 6,
                r: Math.PI / 8,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 8,
                height: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeBody(id++, {
                x: 2,
                y: 2,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.2,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1,
                height: 1,
            });
        }`,onInit:e=>{e.setGravity(0,10),e.setHasFriction(!1);let t=1;e.makeBody(t++,{x:5,y:6,r:Math.PI/8,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.BOX,width:8,height:1}),e.makeBody(t++,{x:2,y:2,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:n.shapes.BOX,width:1,height:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,t)=>{}}),new k({name:"TC-7 (SOLVED)",key:"tc-7",description:["**Test Case 7**: Friction normal vector correctness.","Ensures that friction impulses are applied exactly tangent to the contact normal, even when restitution is high."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 10);
            // world.setHasRestitution(false);

            let id = 1;
            world.makeBody(id++, {
                x: 5,
                y: 6,
                // r: Math.PI / 8,
                r: 0.1,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 8,
                height: 1,
                restitution: 0.0,
            });

            // Anohter box but this time a rigid body.
            world.makeBody(id++, {
                x: 2,
                y: 2,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.2,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1,
                height: 1,
                restitution: 0.0,
            });
        }`,onInit:e=>{e.setGravity(0,10);let t=1;e.makeBody(t++,{x:5,y:6,r:.1,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.BOX,width:8,height:1,restitution:0}),e.makeBody(t++,{x:2,y:2,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:n.shapes.BOX,width:1,height:1,restitution:0})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,t)=>{}}),new k({name:"TC-8 (SOLVED)",key:"tc-8",description:["**Test Case 8**: Stability of high-frequency circle collisions.","Verifies that multiple circles colliding in quick succession do not cause simulation instability or tunneling."].join(`

`),globalLines:["let nextId = 1;"],onInitRaw:`(world)=>{
            world.setGravity(0, 10);
            impulseTimer = 0;

            // Objects will be created in the tick function.
        }`,onInit:e=>{e.setGravity(0,10),Bn=0},onTickRaw:`(world, dt)=>{
            impulseTimer++;
            if(impulseTimer % 60 == 0){
                let m = .1 + Math.random() * .4;
                let r = .2 + m*m * .8;
                let id1 = nextId++;
                world.makeBody(id1, {
                    x: 0,
                    y: 7.50,
                    r: Math.PI / 2 * Math.random(),
                    rs: (Math.random() - 0.5) * 5.00,
                    vx: (2.00 + Math.random() * 5.00) * 1,
                    vy: -6.00 - Math.random() * 1.00,
                    type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                    mass: m, 
                }).addFixture({
                    shape: gearbox.shapes.CIRCLE,
                    radius: r,
                });

                m = .1 + Math.random() * .4;
                r = .2 + m*m * .8;
                let id2 = nextId++;
                world.makeBody(id2, {
                    x: 10,
                    y: 7.50,
                    r: Math.PI / 2 * Math.random(),
                    rs: (Math.random() - 0.5) * 5.00,
                    vx: (2.00 + Math.random() * 5.00) * -1,
                    vy: -6.00 - Math.random() * 1.00,
                    type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                    mass: m, 
                }).addFixture({
                    shape: gearbox.shapes.CIRCLE,
                    radius: r,
                });

                // Scan for objects that are out of bounds and remove them.
                // Another way to do this would be to use collision events.
                let objectCount = world.getBodyCount();
                let toRemove = [];

                world.iterateBodies(obj=>{
                    
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
        }`,onTick:(e,t)=>{if(Bn++,Bn%60==0){let o=.1+Math.random()*.4,i=.2+o*o*.8,a=Kn++;e.makeBody(a,{x:0,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*1,vy:-6-Math.random()*1,type:n.bodyTypes.DYNAMIC_OBJECT,mass:o}).addFixture({shape:n.shapes.CIRCLE,radius:i}),o=.1+Math.random()*.4,i=.2+o*o*.8;let s=Kn++;e.makeBody(s,{x:10,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*-1,vy:-6-Math.random()*1,type:n.bodyTypes.DYNAMIC_OBJECT,mass:o}).addFixture({shape:n.shapes.CIRCLE,radius:i}),e.getBodyCount();let r=[];e.iterateBodies(l=>{l.y>10.5&&r.push(l)});for(let l of r)e.removeObject(l.id)}}}),new k({name:"TC-9 (SOLVED)",key:"tc-9",description:["**Test Case 9**: Resting stability.","A small box resting on a larger fixed box to verify that gravity and normal impulses reach equilibrium without constant jitter."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 1);
            // world.setHasRestitution(false);

            let id = 1;
            world.makeBody(id++, {
                x: 5,
                y: 6,
                r: Math.PI / 2,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1,
                height: 8,
            });

            // Anohter box but this time a rigid body.
            world.makeBody(id++, {
                x: 7,
                y: 5,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.2,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1,
                height: 1,
            });
        }`,onInit:e=>{e.setGravity(0,1);let t=1;e.makeBody(t++,{x:5,y:6,r:Math.PI/2,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.BOX,width:1,height:8}),e.makeBody(t++,{x:7,y:5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:n.shapes.BOX,width:1,height:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,t)=>{}}),new k({name:"TC-10 (SOLVED)",key:"tc-10",description:["**Test Case 10**: Circle-AABB penetration resolution.","Fixes extreme responses when a circle falls directly onto a large axis-aligned platform."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 3);
            // world.setHasRestitution(false);

            let id = 1;
            world.makeBody(id++, {
                x: 5,
                y: 8,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: 8,
                height: 1,
                // restitution: 1
            });

            // Anohter box but this time a rigid body.
            world.makeBody(id++, {
                x: 7,
                y: 2,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.2,
                rs: -0.1,
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 1,
                restitution: 1,
            });
        }`,onInit:e=>{e.setGravity(0,3);let t=1;e.makeBody(t++,{x:5,y:8,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.AABB,width:8,height:1}),e.makeBody(t++,{x:7,y:2,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2,rs:-.1}).addFixture({shape:n.shapes.CIRCLE,radius:1,restitution:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,t)=>{}}),new k({name:"TC-11 (SOLVED)",key:"tc-11",description:["**Test Case 11**: Stuck objects and overlap logic.","Ensures that small circles do not get 'embedded' within other shapes when subjected to high-velocity collisions or deep initial overlaps."].join(`

`),onInitRaw:`(world)=>{

            let id = 1;
            world.makeBody(id++, {
                x: 5,
                y: 5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: 1,
                height: 5,
            });

            // Anohter box but this time a rigid body.
            world.makeBody(id++, {
                x: 5.2,
                y: 5,
                // vx: -50,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.2,
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 0.1,
                restitution: 0.5,
            });
        }`,onInit:e=>{let t=1;e.makeBody(t++,{x:5,y:5,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.AABB,width:1,height:5}),e.makeBody(t++,{x:5.2,y:5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:n.shapes.CIRCLE,radius:.1,restitution:.5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,t)=>{}}),new k({name:"TC-12 (SOLVED)",key:"tc-12",description:["**Test Case 12**: Sinking prevention under high gravity.","Verifies that boxes maintain their position on top of other objects even when high downward forces are applied, ensuring the penetration resolution is sufficient."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 10);
            // world.setHasRestitution(false);

            let id = 1;
            world.makeBody(id++, {
                x: 5,
                y: 6,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: 8,
                height: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeBody(id++, {
                x: 7,
                y: 4,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.2,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1,
                height: 1,
            });
        }`,onInit:e=>{e.setGravity(0,10);let t=1;e.makeBody(t++,{x:5,y:6,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.AABB,width:8,height:1}),e.makeBody(t++,{x:7,y:4,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:n.shapes.BOX,width:1,height:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,t)=>{}}),new k({name:"TC-13 (SOLVED)",key:"tc-13",description:["**Test Case 13**: Stuck objects and overlap logic.","Ensures that small circles do not get 'embedded' within other shapes when subjected to high-velocity collisions or deep initial overlaps."].join(`

`),onInitRaw:`(world)=>{

            let id = 1;
            world.makeBody(id++, {
                x: 5,
                y: 5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 1,
                height: 5,
            });

            // Anohter box but this time a rigid body.
            world.makeBody(id++, {
                x: 5.2,
                y: 5,
                // vx: -50,
                type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                mass: 0.2,
            }).addFixture({
                shape: gearbox.shapes.CIRCLE,
                radius: 0.1,
                restitution: 0.5,
            });
        }`,onInit:e=>{let t=1;e.makeBody(t++,{x:5,y:5,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.BOX,width:1,height:5}),e.makeBody(t++,{x:5.2,y:5,type:n.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:n.shapes.CIRCLE,radius:.1,restitution:.5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,t)=>{}}),new k({name:"TC-14 (SOLVED)",key:"tc-14",description:["**Test Case 14**: Sliding pile regression.","A stack of boxes should remain stationary when high friction is present. This test verifies if piles of objects exhibit 'random slow sliding' and fail to enter the sleep state."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 20); // Higher gravity to emphasize pressure
            
            let id = 1;
            // Ground
            world.makeBody(id++, {
                x: 5,
                y: 9,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.BOX,
                width: 10,
                height: 1,
                sFriction: 10,
                kFriction: 10,
            });

            // Stack of boxes
            for (let i = 0; i < 4; i++) {
                world.makeBody(id++, {
                    x: 5,
                    y: 8 - i * 1.1,
                    type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                    mass: 1,
                }).addFixture({
                    shape: gearbox.shapes.BOX,
                    width: 2,
                    height: 1,
                    sFriction: 10,
                    kFriction: 10,
                });
            }
        }`,onInit:e=>{e.setGravity(0,20);let t=1;e.makeBody(t++,{x:5,y:9,type:n.bodyTypes.FIXED_OBJECT}).addFixture({shape:n.shapes.BOX,width:10,height:1,sFriction:10,kFriction:10});for(let o=0;o<4;o++)e.makeBody(t++,{x:5,y:8-o*1.1,type:n.bodyTypes.DYNAMIC_OBJECT,mass:1}).addFixture({shape:n.shapes.BOX,width:2,height:1,sFriction:10,kFriction:10})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,t)=>{}})];let T=1,wn=null,Cn=null,kn=null,W=null;const Ft=new k({name:"Mechanical Clockwork",key:"clockwork",description:["A physically regulated mechanical clock. This version uses a **Grashof-compliant Crank-Rocker** mechanism to ensure continuous rotation.","### Features","- **Regulated Motion**: A 2.0m pendulum defines a 9-second period in low gravity (1.0 m/s²).","- **Grashof Linkage**: Precision geometry allows the drive gear to complete full 360° rotations.","- **Kinematic Drive**: The escapement gear is driven at a fixed rotation speed to ensure perfect timekeeping.","- **Multi-stage Reduction**: 7 `GearJoint` stages step down the escapement's motion to hours and minutes.","- **Real-time Sync**: The hands and gear train initialize to your local system time."].join(`

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
            springX: cx - 1.5 
        };

        // --- GUI & TUNER ---
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const existingGui = document.getElementById('clock-tuner-gui');
        if (existingGui) existingGui.remove();

        const gui = document.createElement('div');
        gui.id = 'clock-tuner-gui';
        gui.style = \`position:fixed;top:20px;right:20px;width:280px;background:rgba(0,0,0,0.85);color:#0f0;padding:15px;border-radius:8px;font-family:monospace;z-index:1000;box-shadow:0 4px 15px rgba(0,0,0,0.5);font-size:12px;border:1px solid #333;\`;
        
        if (isLocal) {
            document.body.appendChild(gui);
        }

        const scoreDisplay = document.createElement('div');
        scoreDisplay.style = \`margin:15px 0;padding:10px;border:1px solid #0f0;text-align:center;font-size:16px;font-weight:bold;\`;
        scoreDisplay.textContent = 'Score: 0';
        gui.appendChild(scoreDisplay);

        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Export to Console';
        exportBtn.style = \`width:100%;padding:8px;background:#0f0;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;margin-bottom:5px;\`;
        exportBtn.onclick = () => console.log("Final Parameters:", JSON.stringify(p, null, 4));
        gui.appendChild(exportBtn);

        const optimizeBtn = document.createElement('button');
        optimizeBtn.textContent = 'Start Auto-Optimize';
        optimizeBtn.style = \`width:100%;padding:8px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;\`;
        optimizeBtn.onclick = () => {
            const s = (world as any).scoreState;
            s.isOptimizing = !s.isOptimizing;
            optimizeBtn.textContent = s.isOptimizing ? 'Stop Auto-Optimize' : 'Start Auto-Optimize';
            optimizeBtn.style.background = s.isOptimizing ? '#f00' : '#444';
            if (s.isOptimizing) {
                s.bestScore = -Infinity;
                s.optimizationStage = 'PREPARE';
                s.optParamIndex = 0;
                s.optDirection = 1;
                s.epsilon = 0.05;
                s.lastImprovementIteration = 0;
                console.log("Starting Auto-Optimization...");
            }
        };
        gui.appendChild(optimizeBtn);

        const optStatus = document.createElement('div');
        optStatus.style = \`margin-top:10px;font-size:10px;color:#aaa;\`;
        optStatus.textContent = 'Optimizer: Idle';
        gui.appendChild(optStatus);

        const sliders = {};
        const createSlider = (label, key, min, max, step) => {
            const container = document.createElement('div');
            container.style.marginBottom = '10px';
            const labelEl = document.createElement('div');
            labelEl.textContent = \`\${label}: \${p[key].toFixed(2)}\`;
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = min;
            slider.max = max;
            slider.step = step;
            slider.value = p[key];
            slider.style.width = '100%';
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

        createSlider('Crank Radius', 'crankRadius', 0.05, 0.5, 0.01);
        createSlider('Ground Distance', 'groundDist', 0.5, 2.0, 0.05);
        createSlider('Rocker Length', 'rockerLength', 0.3, 1.5, 0.05);
        createSlider('Esc X Offset', 'escXOffset', -0.5, 0.5, 0.01);
        createSlider('Rod Frequency', 'conRodFreq', 5.0, 50.0, 1.0);
        createSlider('Spring Frequency', 'springFreq', 0.1, 2.0, 0.05);
        createSlider('Spring X Pos', 'springX', cx - 3.0, cx - 0.5, 0.1);
        
        const pendPivotY = cy + 2.0;
        const escapementY = pendPivotY - p.groundDist;
        const targetPeriod = 8.0; // Sync with gear rotation (8s)
        const pendulumLength = g * Math.pow(targetPeriod / (2 * Math.PI), 2);
        const rockerPinDist = pendulumLength - p.rockerLength;

        const pendCenterId = nextId++;
        const pendCenter = world.makeBody(pendCenterId, { x: cx, y: pendPivotY, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#888" });
        pendCenter.addFixture(pendCenterId, { shape: gearbox.shapes.CIRCLE, radius: 0.1, categoryBits: CAT_STATIC, maskBits: 0 });

        const escCenterId = nextId++;
        const escCenter = world.makeBody(escCenterId, { x: cx, y: escapementY, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#888" });
        escCenter.addFixture(escCenterId, { shape: gearbox.shapes.CIRCLE, radius: 0.1, categoryBits: CAT_STATIC, maskBits: 0 });

        const centerId = nextId++;
        const center = world.makeBody(centerId, { x: cx, y: cy, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#888" });
        center.addFixture(centerId, { shape: gearbox.shapes.CIRCLE, radius: 0.1, categoryBits: CAT_STATIC, maskBits: 0 });

        const initialPendAngle = 0.5;
        const pendulumId = nextId++;
        pendulum = world.makeBody(pendulumId, {
            x: cx + Math.sin(initialPendAngle) * pendulumLength,
            y: pendPivotY + Math.cos(initialPendAngle) * pendulumLength,
            r: -initialPendAngle,
            mass: 5.0, color: "#cd853f"
        });
        pendulum.addFixture(pendulumId, {
            shape: gearbox.shapes.CIRCLE, radius: 0.4, categoryBits: CAT_MECH, maskBits: 0
        });
        pendulum.angularDamping = 0.01;
        world.createHingeJoint(nextId++, pendCenter, pendulum, { worldAnchor: { x: cx, y: pendPivotY }, anchorB: { x: 0, y: -pendulumLength } });

        const fastGearId = nextId++;
        const fastGear = world.makeBody(fastGearId, { 
            x: cx + p.escXOffset, y: escapementY, r: 0, 
            type: gearbox.bodyTypes.KINEMATIC_OBJECT,
            color: "#aaa"
        });
        fastGear.addFixture(fastGearId, {
            shape: gearbox.shapes.CIRCLE, radius: 0.5, 
            categoryBits: CAT_GEAR, maskBits: 0 
        });
        fastGear.rs = (Math.PI * 2) / 8.0; 
        const fastHinge = world.createHingeJoint(nextId++, escCenter, fastGear, { worldAnchor: { x: cx + p.escXOffset, y: escapementY } });

        const crankPinLocal = { x: p.crankRadius, y: 0 }; 
        const pendPinLocal = { x: 0, y: -p.rockerLength }; 
        
        // Calculate IDEAL rod length (Reference pose: both at 0 rad)
        const getIdealLen = () => {
            const refGearX = cx + p.escXOffset;
            const refGearY = pendPivotY - p.groundDist;
            const refCrankPinW = { x: refGearX + p.crankRadius, y: refGearY };
            const refRockerPinW = { x: cx, y: pendPivotY + (pendulumLength - p.rockerLength) };
            return Math.sqrt(Math.pow(refCrankPinW.x - refRockerPinW.x, 2) + Math.pow(refCrankPinW.y - refRockerPinW.y, 2));
        };

        const conRodJoint = world.createSpringJoint(nextId++, fastGear, pendulum, { 
            anchorA: crankPinLocal, anchorB: pendPinLocal, 
            length: getIdealLen(),
            frequencyHz: p.conRodFreq, dampingRatio: p.conRodDamping
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
            isOptimizing: false
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
        const inter1Center = world.makeBody(inter1CenterId, {
            x: inter1X, y: inter1Y,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#888",
        });
        inter1Center.addFixture(inter1CenterId, {
            shape: gearbox.shapes.CIRCLE,
            radius: 0.1,
            categoryBits: CAT_STATIC,
            maskBits: 0
        });

        const inter1GearId = nextId++;
        const inter1Gear = world.makeBody(inter1GearId, {
            x: inter1X, y: inter1Y,
            mass: 0.2,
            r: 0, 
            color: "#44ff44",
        });
        inter1Gear.addFixture(inter1GearId, {
            shape: gearbox.shapes.CIRCLE,
            radius: 1.0,
            categoryBits: CAT_GEAR,
            maskBits: 0
        });
        inter1Gear.angularDamping = 0.02;
        const inter1Hinge = world.createHingeJoint(nextId++, inter1Center, inter1Gear, {
            worldAnchor: { x: inter1X, y: inter1Y }
        });
        // First stage: Escapement to Inter1 (1:4 ratio)
        world.createGearJoint(nextId++, fastHinge, inter1Hinge, 0.25);

        const secHandAngle = (seconds / 60) * Math.PI * 2;
        const secondGearObjId = nextId++;
        const secondGearObj = world.makeBody(secondGearObjId, {
            x: cx, y: cy,
            mass: 0.2,
            r: secHandAngle,
            color: "#ff4444",
        });
        secondGearObj.addFixture(secondGearObjId, {
            shape: gearbox.shapes.CIRCLE,
            radius: 0.6,
            categoryBits: CAT_GEAR,
            maskBits: 0
        });
        secondGearObj.angularDamping = 0.02;
        const secondHinge = world.createHingeJoint(nextId++, center, secondGearObj, {
            worldAnchor: { x: cx, y: cy }
        });
        // Second stage: Inter1 to Second (total ratio 0.15)
        // 0.25 * ratio2 = 0.15 => ratio2 = 0.15 / 0.25 = 0.6
        world.createGearJoint(nextId++, inter1Hinge, secondHinge, totalRatio / 0.25);

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
            world.makeBody(tickId, {
                x: cx + Math.cos(angle) * (r1 + r2) / 2,
                y: cy + Math.sin(angle) * (r1 + r2) / 2,
                r: angle + Math.PI / 2,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#999",
            }).addFixture(tickId, {
                shape: gearbox.shapes.BOX,
                width: i % 3 === 0 ? 0.2 : 0.1,
                height: 0.4,
                categoryBits: CAT_STATIC,
                maskBits: 0
            });
        }

        const secondHandId = nextId++;
        secondHand = world.makeBody(secondHandId, {
            x: cx + Math.sin(secHandAngle) * (secLen / 2 - 0.2),
            y: cy - Math.cos(secHandAngle) * (secLen / 2 - 0.2),
            r: secHandAngle,
            mass: 0.1,
            color: "#ff4444",
        });
        secondHand.addFixture(secondHandId, {
            shape: gearbox.shapes.BOX,
            width: 0.05, height: secLen,
            categoryBits: CAT_HAND,
            maskBits: 0
        });
        const secondHandHinge = world.createHingeJoint(nextId++, center, secondHand, {
            worldAnchor: { x: cx, y: cy },
            anchorB: { x: 0, y: secLen / 2 - 0.2 }
        });
        world.createGearJoint(nextId++, secondHinge, secondHandHinge, -1.0);

        const inter2X = cx - 1.5;
        const inter2Y = cy - 1.5;
        const inter2CenterId = nextId++;
        const inter2Center = world.makeBody(inter2CenterId, {
            x: inter2X, y: inter2Y,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#888",
        });
        inter2Center.addFixture(inter2CenterId, {
            shape: gearbox.shapes.CIRCLE,
            radius: 0.1,
            categoryBits: CAT_STATIC,
            maskBits: 0
        });
        const inter2GearId = nextId++;
        const inter2Gear = world.makeBody(inter2GearId, {
            x: inter2X, y: inter2Y,
            mass: 0.2,
            r: 0,
            color: "#4444ff",
        });
        inter2Gear.addFixture(inter2GearId, {
            shape: gearbox.shapes.CIRCLE,
            radius: 1.0,
            categoryBits: CAT_GEAR,
            maskBits: 0
        });
        inter2Gear.angularDamping = 0.01;
        const inter2Hinge = world.createHingeJoint(nextId++, inter2Center, inter2Gear, {
            worldAnchor: { x: inter2X, y: inter2Y }
        });
        world.createGearJoint(nextId++, secondHinge, inter2Hinge, 1/10);

        const minuteGearId = nextId++;
        const minuteGear = world.makeBody(minuteGearId, {
            x: cx, y: cy,
            mass: 0.2,
            r: minHandAngle,
            color: "#4444ff",
        });
        minuteGear.addFixture(minuteGearId, {
            shape: gearbox.shapes.CIRCLE,
            radius: 0.8,
            categoryBits: CAT_GEAR,
            maskBits: 0
        });
        minuteGear.angularDamping = 0.01;
        const minuteHinge = world.createHingeJoint(nextId++, center, minuteGear, {
            worldAnchor: { x: cx, y: cy }
        });
        world.createGearJoint(nextId++, inter2Hinge, minuteHinge, 1/6);

        const minuteHandId = nextId++;
        minuteHand = world.makeBody(minuteHandId, {
            x: cx + Math.sin(minHandAngle) * (minLen / 2 - 0.3),
            y: cy - Math.cos(minHandAngle) * (minLen / 2 - 0.3),
            r: minHandAngle,
            mass: 0.2,
            color: "#4444ff",
        });
        minuteHand.addFixture(minuteHandId, {
            shape: gearbox.shapes.BOX,
            width: 0.12, height: minLen,
            categoryBits: CAT_HAND,
            maskBits: 0
        });
        const minuteHandHinge = world.createHingeJoint(nextId++, center, minuteHand, {
            worldAnchor: { x: cx, y: cy },
            anchorB: { x: 0, y: minLen / 2 - 0.3 }
        });
        world.createGearJoint(nextId++, minuteHinge, minuteHandHinge, -1.0);

        const inter3X = cx + 2.0;
        const inter3Y = cy - 1.0;
        const inter3CenterId = nextId++;
        const inter3Center = world.makeBody(inter3CenterId, {
            x: inter3X, y: inter3Y,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#888",
        });
        inter3Center.addFixture(inter3CenterId, {
            shape: gearbox.shapes.CIRCLE,
            radius: 0.1,
            categoryBits: CAT_STATIC,
            maskBits: 0
        });
        const inter3GearId = nextId++;
        const inter3Gear = world.makeBody(inter3GearId, {
            x: inter3X, y: inter3Y,
            mass: 0.2,
            r: 0,
            color: "#cccc44",
        });
        inter3Gear.addFixture(inter3GearId, {
            shape: gearbox.shapes.CIRCLE,
            radius: 1.0,
            categoryBits: CAT_GEAR,
            maskBits: 0
        });
        inter3Gear.angularDamping = 0.01;
        const inter3Hinge = world.createHingeJoint(nextId++, inter3Center, inter3Gear, {
            worldAnchor: { x: inter3X, y: inter3Y }
        });
        world.createGearJoint(nextId++, minuteHinge, inter3Hinge, 1/3);

        const hourGearId = nextId++;
        const hourGear = world.makeBody(hourGearId, {
            x: cx, y: cy,
            mass: 0.2,
            r: hourHandAngle,
            color: "#cc8844",
        });
        hourGear.addFixture(hourGearId, {
            shape: gearbox.shapes.CIRCLE,
            radius: 1.1,
            categoryBits: CAT_GEAR,
            maskBits: 0
        });
        hourGear.angularDamping = 0.01;
        const hourHinge = world.createHingeJoint(nextId++, center, hourGear, {
            worldAnchor: { x: cx, y: cy }
        });
        world.createGearJoint(nextId++, inter3Hinge, hourHinge, 1/4);

        const hourHandId = nextId++;
        hourHand = world.makeBody(hourHandId, {
            x: cx + Math.sin(hourHandAngle) * (hourLen / 2 - 0.4),
            y: cy - Math.cos(hourHandAngle) * (hourLen / 2 - 0.4),
            r: hourHandAngle,
            mass: 0.3,
            color: "#cc8844",
        });
        hourHand.addFixture(hourHandId, {
            shape: gearbox.shapes.BOX,
            width: 0.18, height: hourLen,
            categoryBits: CAT_HAND,
            maskBits: 0
        });
        const hourHandHinge = world.createHingeJoint(nextId++, center, hourHand, {
            worldAnchor: { x: cx, y: cy },
            anchorB: { x: 0, y: hourLen / 2 - 0.4 }
        });
        world.createGearJoint(nextId++, hourHinge, hourHandHinge, -1.0);
    }`,onInit:e=>{e.clear(),n.debug.showAabbs=!1,T=1;const t=5,o=2.5,i=1;e.setGravity(0,i),e.setHasRestitution(!0),e.setHasFriction(!0);const a=1,s=2,r=4,l=8,h=new Date,g=h.getSeconds(),u=h.getMinutes(),f=h.getHours()%12,c={crankRadius:.251412,groundDist:.962005,rockerLength:.788035,escXOffset:0,conRodFreq:15,conRodDamping:1,springFreq:.5,springX:t-1.5},d=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1",p=document.getElementById("clock-tuner-gui");p&&p.remove();const y=document.createElement("div");y.id="clock-tuner-gui",y.style="position:fixed;top:20px;right:20px;width:280px;background:rgba(0,0,0,0.85);color:#0f0;padding:15px;border-radius:8px;font-family:monospace;z-index:1000;box-shadow:0 4px 15px rgba(0,0,0,0.5);font-size:12px;border:1px solid #333;",d&&document.body.appendChild(y);const x=document.createElement("div");x.style="margin:15px 0;padding:10px;border:1px solid #0f0;text-align:center;font-size:16px;font-weight:bold;",x.textContent="Score: 0",y.appendChild(x);const b=document.createElement("button");b.textContent="Export to Console",b.style="width:100%;padding:8px;background:#0f0;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;margin-bottom:5px;",b.onclick=()=>console.log("Final Parameters:",JSON.stringify(c,null,4)),y.appendChild(b);const m=document.createElement("button");m.textContent="Start Auto-Optimize",m.style="width:100%;padding:8px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;",m.onclick=()=>{const F=e.scoreState;F.isOptimizing=!F.isOptimizing,m.textContent=F.isOptimizing?"Stop Auto-Optimize":"Start Auto-Optimize",m.style.background=F.isOptimizing?"#f00":"#444",F.isOptimizing&&(F.bestScore=-1/0,F.optimizationStage="PREPARE",F.optParamIndex=0,F.optDirection=1,F.epsilon=.05,F.lastImprovementIteration=0,console.log("Starting Auto-Optimization..."))},y.appendChild(m);const B=document.createElement("div");B.style="margin-top:10px;font-size:10px;color:#aaa;",B.textContent="Optimizer: Idle",y.appendChild(B);const I={},w=(F,L,pe,me,Ve)=>{const Ke=document.createElement("div");Ke.style.marginBottom="10px";const Ze=document.createElement("div");Ze.textContent=`${F}: ${c[L].toFixed(2)}`;const N=document.createElement("input");N.type="range",N.min=pe,N.max=me,N.step=Ve,N.value=c[L],N.style.width="100%",N.oninput=()=>{c[L]=parseFloat(N.value),Ze.textContent=`${F}: ${c[L].toFixed(2)}`,Ye()},Ke.appendChild(Ze),Ke.appendChild(N),y.appendChild(Ke),I[L]={slider:N,labelEl:Ze,label:F}},M=F=>{const L=I[F];L&&(L.slider.value=c[F],L.labelEl.textContent=`${L.label}: ${c[F].toFixed(2)}`)};w("Crank Radius","crankRadius",.05,.5,.01),w("Ground Distance","groundDist",.5,2,.05),w("Rocker Length","rockerLength",.3,1.5,.05),w("Esc X Offset","escXOffset",-.5,.5,.01),w("Rod Frequency","conRodFreq",5,50,1),w("Spring Frequency","springFreq",.1,2,.05),w("Spring X Pos","springX",t-3,t-.5,.1);const R=o+2,H=R-c.groundDist,_=i*Math.pow(8/(2*Math.PI),2);_-c.rockerLength;const Y=T++,Be=e.makeBody(Y,{x:t,y:R,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});Be.addFixture(Y,{shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const Fe=T++,se=e.makeBody(Fe,{x:t,y:H,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});se.addFixture(Fe,{shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const Pe=T++,Z=e.makeBody(Pe,{x:t,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});Z.addFixture(Pe,{shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const Me=.5,Oe=T++;W=e.makeBody(Oe,{x:t+Math.sin(Me)*_,y:R+Math.cos(Me)*_,r:-Me,mass:5,color:"#cd853f"}),W.addFixture(Oe,{shape:n.shapes.CIRCLE,radius:.4,categoryBits:s,maskBits:0}),W.angularDamping=.01,e.createHingeJoint(T++,Be,W,{worldAnchor:{x:t,y:R},anchorB:{x:0,y:-_}});const we=T++,z=e.makeBody(we,{x:t+c.escXOffset,y:H,r:0,type:n.bodyTypes.KINEMATIC_OBJECT,color:"#aaa"});z.addFixture(we,{shape:n.shapes.CIRCLE,radius:.5,categoryBits:r,maskBits:0}),z.rs=Math.PI*2/8;const je=e.createHingeJoint(T++,se,z,{worldAnchor:{x:t+c.escXOffset,y:H}}),on={x:c.crankRadius,y:0},Ge={x:0,y:-c.rockerLength},ie=()=>{const F=t+c.escXOffset,L=R-c.groundDist,pe={x:F+c.crankRadius,y:L},me={x:t,y:R+(_-c.rockerLength)};return Math.sqrt(Math.pow(pe.x-me.x,2)+Math.pow(pe.y-me.y,2))},he=e.createSpringJoint(T++,z,W,{anchorA:on,anchorB:Ge,length:ie(),frequencyHz:c.conRodFreq,dampingRatio:c.conRodDamping}),Ye=()=>{const F=R-c.groundDist,L=t+c.escXOffset;se.x=L,se.y=F,z.x=L,z.y=F,je.localAnchorA=se.worldToLocal({x:L,y:F}),he.localAnchorA={x:c.crankRadius,y:0},he.localAnchorB={x:0,y:-c.rockerLength},he.length=ie(),he.frequencyHz=c.conRodFreq,he.dampingRatio=c.conRodDamping};e.scoreState={fastGear:z,pendulum:W,params:c,updateSimulation:Ye,updateSliderUI:M,optStatus:B,lastFastR:z.r,lastPendRs:W.rs,lastRsSign:Math.sign(W.rs),rsSignChanges:0,maxAngle:-1/0,minAngle:1/0,hasCrossedZero:!1,history:[],periodTimes:[],lastPendSide:Math.sign(W.r),lastPendCrossing:0,scoreDisplay:x,isOptimizing:!1};const mt=8/60,an=t+1.5,sn=H+.5,Mn=T++,On=e.makeBody(Mn,{x:an,y:sn,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});On.addFixture(Mn,{shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const Rn=T++,rn=e.makeBody(Rn,{x:an,y:sn,mass:.2,r:0,color:"#44ff44"});rn.addFixture(Rn,{shape:n.shapes.CIRCLE,radius:1,categoryBits:r,maskBits:0}),rn.angularDamping=.02;const Ln=e.createHingeJoint(T++,On,rn,{worldAnchor:{x:an,y:sn}});e.createGearJoint(T++,je,Ln,.25);const ze=g/60*Math.PI*2,Dn=T++,dn=e.makeBody(Dn,{x:t,y:o,mass:.2,r:ze,color:"#ff4444"});dn.addFixture(Dn,{shape:n.shapes.CIRCLE,radius:.6,categoryBits:r,maskBits:0}),dn.angularDamping=.02;const cn=e.createHingeJoint(T++,Z,dn,{worldAnchor:{x:t,y:o}});e.createGearJoint(T++,Ln,cn,mt/.25);const We=u/60*Math.PI*2,Ne=f/12*Math.PI*2,$e=3.5,qe=3,Ue=2;for(let F=0;F<12;F++){const L=F/12*Math.PI*2-Math.PI/2,pe=3.8,me=4,Ve=T++;e.makeBody(Ve,{x:t+Math.cos(L)*(pe+me)/2,y:o+Math.sin(L)*(pe+me)/2,r:L+Math.PI/2,type:n.bodyTypes.FIXED_OBJECT,color:"#999"}).addFixture(Ve,{shape:n.shapes.BOX,width:F%3===0?.2:.1,height:.4,categoryBits:a,maskBits:0})}const Xn=T++;wn=e.makeBody(Xn,{x:t+Math.sin(ze)*($e/2-.2),y:o-Math.cos(ze)*($e/2-.2),r:ze,mass:.1,color:"#ff4444"}),wn.addFixture(Xn,{shape:n.shapes.BOX,width:.05,height:$e,categoryBits:l,maskBits:0});const yt=e.createHingeJoint(T++,Z,wn,{worldAnchor:{x:t,y:o},anchorB:{x:0,y:$e/2-.2}});e.createGearJoint(T++,cn,yt,-1);const ln=t-1.5,hn=o-1.5,Sn=T++,Jn=e.makeBody(Sn,{x:ln,y:hn,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});Jn.addFixture(Sn,{shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const Hn=T++,pn=e.makeBody(Hn,{x:ln,y:hn,mass:.2,r:0,color:"#4444ff"});pn.addFixture(Hn,{shape:n.shapes.CIRCLE,radius:1,categoryBits:r,maskBits:0}),pn.angularDamping=.01;const _n=e.createHingeJoint(T++,Jn,pn,{worldAnchor:{x:ln,y:hn}});e.createGearJoint(T++,cn,_n,1/10);const Pn=T++,mn=e.makeBody(Pn,{x:t,y:o,mass:.2,r:We,color:"#4444ff"});mn.addFixture(Pn,{shape:n.shapes.CIRCLE,radius:.8,categoryBits:r,maskBits:0}),mn.angularDamping=.01;const yn=e.createHingeJoint(T++,Z,mn,{worldAnchor:{x:t,y:o}});e.createGearJoint(T++,_n,yn,1/6);const jn=T++;Cn=e.makeBody(jn,{x:t+Math.sin(We)*(qe/2-.3),y:o-Math.cos(We)*(qe/2-.3),r:We,mass:.2,color:"#4444ff"}),Cn.addFixture(jn,{shape:n.shapes.BOX,width:.12,height:qe,categoryBits:l,maskBits:0});const ut=e.createHingeJoint(T++,Z,Cn,{worldAnchor:{x:t,y:o},anchorB:{x:0,y:qe/2-.3}});e.createGearJoint(T++,yn,ut,-1);const un=t+2,gn=o-1,Gn=T++,Yn=e.makeBody(Gn,{x:un,y:gn,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});Yn.addFixture(Gn,{shape:n.shapes.CIRCLE,radius:.1,categoryBits:a,maskBits:0});const zn=T++,xn=e.makeBody(zn,{x:un,y:gn,mass:.2,r:0,color:"#cccc44"});xn.addFixture(zn,{shape:n.shapes.CIRCLE,radius:1,categoryBits:r,maskBits:0}),xn.angularDamping=.01;const Wn=e.createHingeJoint(T++,Yn,xn,{worldAnchor:{x:un,y:gn}});e.createGearJoint(T++,yn,Wn,1/3);const Nn=T++,bn=e.makeBody(Nn,{x:t,y:o,mass:.2,r:Ne,color:"#cc8844"});bn.addFixture(Nn,{shape:n.shapes.CIRCLE,radius:1.1,categoryBits:r,maskBits:0}),bn.angularDamping=.01;const $n=e.createHingeJoint(T++,Z,bn,{worldAnchor:{x:t,y:o}});e.createGearJoint(T++,Wn,$n,1/4);const qn=T++;kn=e.makeBody(qn,{x:t+Math.sin(Ne)*(Ue/2-.4),y:o-Math.cos(Ne)*(Ue/2-.4),r:Ne,mass:.3,color:"#cc8844"}),kn.addFixture(qn,{shape:n.shapes.BOX,width:.18,height:Ue,categoryBits:l,maskBits:0});const gt=e.createHingeJoint(T++,Z,kn,{worldAnchor:{x:t,y:o},anchorB:{x:0,y:Ue/2-.4}});e.createGearJoint(T++,$n,gt,-1)},onTickRaw:`(world, dt) => {
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

            s.scoreDisplay.textContent = \`Score: \${Math.floor(score)} | Amp: \${amplitude.toFixed(2)} | Jit: \${Math.max(0, s.rsSignChanges - 2)}\${!s.hasCrossedZero ? ' [STUCK]' : ''}\`;

            // --- AUTO-OPTIMIZER LOGIC ---
            if (s.isOptimizing) {
                const keys = ['crankRadius', 'groundDist', 'rockerLength', 'escXOffset', 'conRodFreq'];
                
                if (s.optimizationStage === 'PREPARE') {
                    s.bestScore = -Infinity;
                    s.optimizationStage = 'TWEAK';
                    s.evalTimer = now + windowSize;
                    s.improvedThisCycle = false;
                    s.maxAngle = -Infinity;
                    s.minAngle = Infinity;
                    s.hasCrossedZero = false;
                    s.rsSignChanges = 0;
                } 
                else if (now > s.evalTimer) {
                    if (s.optimizationStage === 'TWEAK') {
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
                        s.optStatus.textContent = \`Testing \${keys[s.optParamIndex]} (\${s.optDirection > 0 ? '+' : '-'}) Best: \${Math.floor(s.bestScore)}\`;
                    }
                }
            } else {
                s.optStatus.textContent = 'Optimizer: Idle';
            }
        }

        const now = new Date();
        const timeString = now.toLocaleTimeString();
        gearbox.debug.clearLabels();
        gearbox.debug.addLabel({ text: "Mechanical Clockwork", x: 5, y: 0.5, fontSize: "28px Arial", color: "#bbb", position: "on-top" });
        gearbox.debug.addLabel({ text: timeString, x: 5, y: 9.5, fontSize: "36px Arial", color: "#fff", position: "on-top" });
        if (pendulum) {
            const angle = (pendulum.r * 180 / Math.PI).toFixed(1);
            gearbox.debug.addLabel({ text: \`Pendulum: \${angle}°\`, x: 8, y: 8, fontSize: "16px Arial", color: "#cd853f", position: "on-top" });
        }
    }`,onTick:(e,t)=>{const o=e.scoreState;if(o){const s=performance.now(),r=8e3;let l=0,h=!1;if(o.fastGear){const I=o.fastGear.r-o.lastFastR;I<-.01&&(h=!0),l=Math.max(0,I)/(Math.PI*2),o.lastFastR=o.fastGear.r}const g=o.pendulum.r,u=o.pendulum.rs,f=(u-o.lastPendRs)/t;o.lastPendRs=u;const c=Math.sign(u);if(c!==o.lastRsSign&&c!==0&&(o.rsSignChanges++,o.lastRsSign=c),o.maxAngle=Math.max(o.maxAngle,g),o.minAngle=Math.min(o.minAngle,g),o.history.push({time:s,rotDelta:l,isReversal:h,pendR:g,pendRs:u,pendRa:f}),o.pendulum){const I=Math.sign(o.pendulum.r);if(I!==o.lastPendSide&&I!==0){if(o.hasCrossedZero=!0,o.lastPendCrossing>0){const w=(s-o.lastPendCrossing)/500;w>.5&&w<10&&o.periodTimes.push({time:s,period:w})}o.lastPendCrossing=s,o.lastPendSide=I}}const d=s-r;for(;o.history.length>0&&o.history[0].time<d;)o.history.shift();for(;o.periodTimes.length>0&&o.periodTimes[0].time<d;)o.periodTimes.shift();let p=0,y=0,x=0;if(o.history.length>0){let I=0,w=0;for(const M of o.history)I+=Math.abs(M.pendRa),w+=Math.abs(M.pendRs),x=Math.max(x,Math.abs(M.pendRa));p=I/o.history.length,y=w/o.history.length}const b=(o.maxAngle-o.minAngle)/2;let m=Math.min(b,.6)*2e3;const B=Math.abs(o.maxAngle+o.minAngle);if(m-=B*1e3,m-=p*10,m-=x*2,o.rsSignChanges>2&&(m-=(o.rsSignChanges-2)*500),m+=y*100,o.hasCrossedZero||(m-=1e4),b<.1&&(m-=5e3),!o.isOptimizing&&o.history.length===0&&(o.maxAngle=-1/0,o.minAngle=1/0,o.hasCrossedZero=!1,o.rsSignChanges=0),o.scoreDisplay.textContent=`Score: ${Math.floor(m)} | Amp: ${b.toFixed(2)} | Jit: ${Math.max(0,o.rsSignChanges-2)}${o.hasCrossedZero?"":" [STUCK]"}`,o.isOptimizing){const I=["crankRadius","groundDist","rockerLength","escXOffset","conRodFreq"];o.optimizationStage==="PREPARE"?(o.bestScore=-1/0,o.optimizationStage="TWEAK",o.evalTimer=s+r,o.improvedThisCycle=!1,o.maxAngle=-1/0,o.minAngle=1/0,o.hasCrossedZero=!1,o.rsSignChanges=0):s>o.evalTimer&&o.optimizationStage==="TWEAK"&&(m>o.bestScore?(o.bestScore=m,o.improvedThisCycle=!0,o.optStatus.textContent=`Improved ${I[o.optParamIndex]} (Best: ${Math.floor(m)})`):(o.params[I[o.optParamIndex]]-=o.epsilon*o.optDirection,o.updateSimulation(),o.updateSliderUI(I[o.optParamIndex])),o.optDirection*=-1,o.optDirection===1&&(o.optParamIndex++,o.optParamIndex>=I.length&&(o.optParamIndex=0,o.improvedThisCycle||(o.epsilon*=.7),o.improvedThisCycle=!1)),o.params[I[o.optParamIndex]]+=o.epsilon*o.optDirection,o.updateSimulation(),o.updateSliderUI(I[o.optParamIndex]),o.maxAngle=-1/0,o.minAngle=1/0,o.hasCrossedZero=!1,o.rsSignChanges=0,o.evalTimer=s+r,o.optStatus.textContent=`Testing ${I[o.optParamIndex]} (${o.optDirection>0?"+":"-"}) Best: ${Math.floor(o.bestScore)}`)}else o.optStatus.textContent="Optimizer: Idle"}const a=new Date().toLocaleTimeString();if(n.debug.clearLabels(),n.debug.addLabel({text:"Mechanical Clockwork",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"}),n.debug.addLabel({text:a,x:5,y:9.5,fontSize:"36px Arial",color:"#fff",position:"on-top"}),W){const s=(W.r*180/Math.PI).toFixed(1);n.debug.addLabel({text:`Pendulum: ${s}°`,x:8,y:8,fontSize:"16px Arial",color:"#cd853f",position:"on-top"})}},onCleanup:e=>{const t=document.getElementById("clock-tuner-gui");t&&t.remove()}});let P=1,U=null;const Mt=new k({name:"Gnome Omega Engine",key:"gnome-omega",description:["A detailed simulation of a **Gnome Omega** rotary engine. In this classic radial design, the crankshaft remains stationary while the entire cylinder block rotates around it.","### Features","- **Stationary Crankshaft**: A fixed pivot point (red) offset from the center.","- **Rotating Crankcase**: The main grey hub that carries the cylinders.","- **Weld Constraints**: Cylinders are 'welded' to the hub using a combination of `HingeJoint` and `DistanceJoint` for maximum stability.","- **Reciprocating Motion**: Pistons and connecting rods are synchronized via `HingeJoint` constraints.","- **Collision Masks**: Bitwise filtering ensures pistons only interact with their respective cylinder walls.","Click **Reset** if the simulation becomes unstable due to extreme angular velocities."].join(`

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
        const hubAnchor = world.makeBody(hubAnchorId, {
            x: cx, y: cy,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#888",
        });
        hubAnchor.addFixture(hubAnchorId, {
            shape: gearbox.shapes.CIRCLE,
            radius: 0.15,
            categoryBits: CAT_FIXED,
            maskBits: 0 // Collide with nothing
        });

        // The fixed crank pin (stationary throw)
        const crankPinId = nextId++;
        const crankPin = world.makeBody(crankPinId, {
            x: cx, y: cy + crankOffset,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#ff4444",
        });
        crankPin.addFixture(crankPinId, {
            shape: gearbox.shapes.CIRCLE,
            radius: 0.1,
            categoryBits: CAT_FIXED,
            maskBits: 0 // Collide with nothing
        });

        // The rotating hub (crankcase)
        const engineHubId = nextId++;
        engineHub = world.makeBody(engineHubId, {
            x: cx, y: cy,
            mass: 50.0, // Increased mass for stability
            color: "#aaa",
        });
        engineHub.addFixture(engineHubId, {
            shape: gearbox.shapes.CIRCLE,
            radius: 0.8,
            categoryBits: CAT_HUB,
            maskBits: 0, // Collide with nothing
            restitution: 0
        });

        world.createHingeJoint(nextId++, hubAnchor, engineHub, {
            worldAnchor: { x: cx, y: cy }
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
                const wallX = cx + cos * wallDist + (-sin) * (side * wallGap / 2);
                const wallY = cy + sin * wallDist + (cos) * (side * wallGap / 2);
                
                const wallId = nextId++;
                const wall = world.makeBody(wallId, {
                    x: wallX, y: wallY,
                    r: orientation,
                    mass: 1.0,
                    color: "#bbb",
                });
                wall.addFixture(wallId, {
                    shape: gearbox.shapes.BOX,
                    width: wallWidth, height: wallHeight,
                    categoryBits: CAT_CYLINDER,
                    maskBits: CAT_PISTON, // Only collide with pistons
                    restitution: 0,
                    sFriction: 0,
                    kFriction: 0
                });
                
                // Weld wall to hub using one hinge and one distance joint.
                // Using a distance joint instead of a second hinge avoids over-constraining the system,
                // which significantly improves stability.
                const wAnchor1 = wall.localToWorld({ x: 0, y: -wallHeight/2 });
                const wAnchor2 = wall.localToWorld({ x: 0, y: wallHeight/2 });
                world.createHingeJoint(nextId++, engineHub, wall, { worldAnchor: wAnchor1 });
                world.createDistanceJoint(nextId++, engineHub, wall, { worldAnchor: wAnchor2 });
            };

            createWall(-1);
            createWall(1);
            
            // Precise piston distance calculation for stable start
            const pistonDist = crankOffset * Math.sin(angle) + Math.sqrt(rodLength * rodLength - Math.pow(crankOffset * Math.cos(angle), 2));

            const pistonX = cx + cos * pistonDist;
            const pistonY = cy + sin * pistonDist;
            const pistonId = nextId++;
            const piston = world.makeBody(pistonId, {
                x: pistonX, y: pistonY,
                r: orientation,
                mass: 0.5,
                color: "#ddd",
            });
            piston.addFixture(pistonId, {
                shape: gearbox.shapes.BOX,
                width: 0.7, height: 1.0, // Piston width (0.7) is now less than inner gap (0.8)
                categoryBits: CAT_PISTON,
                maskBits: CAT_CYLINDER, // Only collide with cylinder walls
                restitution: 0,
                sFriction: 0,
                kFriction: 0
            });

            const rodX = (cx + pistonX) / 2;
            const rodY = (cy + crankOffset + pistonY) / 2;
            // Rotate rod to point from crank pin to piston
            const rodAngle = Math.atan2(pistonY - (cy + crankOffset), pistonX - cx) - Math.PI / 2;
            
            const rodId = nextId++;
            const rod = world.makeBody(rodId, {
                x: rodX, y: rodY,
                r: rodAngle,
                mass: 0.2,
                color: "#fff",
            });
            rod.addFixture(rodId, {
                shape: gearbox.shapes.BOX,
                width: 0.15, height: rodLength,
                categoryBits: CAT_ROD,
                maskBits: 0, // Rods are non-colliding
                restitution: 0
            });

            // Hinge: Rod to Crank Pin
            world.createHingeJoint(nextId++, rod, crankPin, {
                anchorA: { x: 0, y: -rodLength/2 },
                anchorB: { x: 0, y: 0 }
            });

            // Hinge: Rod to Piston
            world.createHingeJoint(nextId++, rod, piston, {
                anchorA: { x: 0, y: rodLength/2 },
                anchorB: { x: 0, y: 0 }
            });
        }

        world.setGravity(0, 0);
        engineHub.rs = 2.0; // Start with a gentle initial rotation
    }`,onInit:e=>{e.clear(),n.debug.showAabbs=!1,P=1,U=null;const t=5,o=4.5,i=.8,a=7,s=2.5,r=256,l=512,h=1024,g=2048,u=4096,f=P++,c=e.makeBody(f,{x:t,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#888"});c.addFixture(f,{shape:n.shapes.CIRCLE,radius:.15,categoryBits:r,maskBits:0});const d=P++,p=e.makeBody(d,{x:t,y:o+i,type:n.bodyTypes.FIXED_OBJECT,color:"#ff4444"});p.addFixture(d,{shape:n.shapes.CIRCLE,radius:.1,categoryBits:r,maskBits:0});const y=P++;U=e.makeBody(y,{x:t,y:o,mass:50,color:"#aaa"}),U.addFixture(y,{shape:n.shapes.CIRCLE,radius:.8,categoryBits:l,maskBits:0,restitution:0}),e.createHingeJoint(P++,c,U,{worldAnchor:{x:t,y:o}});for(let x=0;x<a;x++){const b=x/a*Math.PI*2,m=Math.cos(b),B=Math.sin(b),I=b-Math.PI/2,w=2.6,M=.28,R=2.5,H=1,ae=z=>{const je=t+m*w+-B*(z*H/2),on=o+B*w+m*(z*H/2),Ge=P++,ie=e.makeBody(Ge,{x:je,y:on,r:I,mass:1,color:"#bbb"});ie.addFixture(Ge,{shape:n.shapes.BOX,width:M,height:R,categoryBits:h,maskBits:g,restitution:0,sFriction:0,kFriction:0});const he=ie.localToWorld({x:0,y:-R/2}),Ye=ie.localToWorld({x:0,y:R/2});e.createHingeJoint(P++,U,ie,{worldAnchor:he}),e.createDistanceJoint(P++,U,ie,{worldAnchor:Ye})};ae(-1),ae(1);const _=i*Math.sin(b)+Math.sqrt(s*s-Math.pow(i*Math.cos(b),2)),Y=t+m*_,Be=o+B*_,Fe=P++,se=e.makeBody(Fe,{x:Y,y:Be,r:I,mass:.5,color:"#ddd"});se.addFixture(Fe,{shape:n.shapes.BOX,width:.7,height:1,categoryBits:g,maskBits:h,restitution:0,sFriction:0,kFriction:0});const Pe=(t+Y)/2,Z=(o+i+Be)/2,Me=Math.atan2(Be-(o+i),Y-t)-Math.PI/2,Oe=P++,we=e.makeBody(Oe,{x:Pe,y:Z,r:Me,mass:.2,color:"#fff"});we.addFixture(Oe,{shape:n.shapes.BOX,width:.15,height:s,categoryBits:u,maskBits:0,restitution:0}),e.createHingeJoint(P++,we,p,{anchorA:{x:0,y:-s/2},anchorB:{x:0,y:0}}),e.createHingeJoint(P++,we,se,{anchorA:{x:0,y:s/2},anchorB:{x:0,y:0}})}e.setGravity(0,0),U.rs=2},onTickRaw:`(world, dt) => {
        if (engineHub) {
            // Apply a gentle impulse to maintain rotation
            if (Math.abs(engineHub.rs) < 0.9) {
                engineHub.applyAngularImpulse(5);
            }
        }
    }`,onTick:(e,t)=>{U&&Math.abs(U.rs)<.9&&U.applyAngularImpulse(5)}});let He=1,ee=null;const ke=[{name:"Cherry",radius:.15,mass:.1,color:"#ff4444",score:1},{name:"Strawberry",radius:.22,mass:.2,color:"#ff6666",score:3},{name:"Grape",radius:.28,mass:.3,color:"#9933ff",score:6},{name:"Dekopon",radius:.35,mass:.4,color:"#ff9933",score:10},{name:"Persimmon",radius:.42,mass:.5,color:"#ff6600",score:15},{name:"Apple",radius:.5,mass:.7,color:"#cc0000",score:21},{name:"Pear",radius:.58,mass:.9,color:"#ffff66",score:28},{name:"Peach",radius:.68,mass:1.2,color:"#ff99cc",score:36},{name:"Pineapple",radius:.8,mass:1.6,color:"#ffff00",score:45},{name:"Melon",radius:.95,mass:2.2,color:"#99ff33",score:55},{name:"Watermelon",radius:1.15,mass:3,color:"#006600",score:66}];let A={score:0,nextFruitLevel:0,isGameOver:!1,lastDropTime:0,dropCooldown:500,mouseX:5,fruitIds:new Map,mergingIds:new Set,previewFruit:null};const Zn=()=>{A.score=0,A.nextFruitLevel=Math.floor(Math.random()*5),A.isGameOver=!1,A.lastDropTime=0,A.mouseX=5,A.fruitIds.clear(),A.mergingIds.clear(),A.previewFruit=null,He=1},Ot=e=>(e-n.debug.offsetX)/(n.debug.zoom*100),it=new k({name:"Fruit Merge",key:"fruit-merge",description:["A physics-based arcade game demonstrating dynamic object spawning and collision events.","Drop fruits into the bucket. Identical fruits will **merge** into the next larger fruit tier on contact.","### Controls","- **Mouse Move**: Position the preview fruit","- **Click**: Drop fruit","**Game Over** occurs if any fruit falls out of the world boundaries."].join(`

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
        world.makeBody(bucketBottomId, {
            x: bx, y: by + bh / 2 + thickness / 2,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#664422"
        }).addFixture({
            shape: gearbox.shapes.BOX,
            width: bw + thickness * 2, height: thickness,
        });

        // Left Wall
        const leftWallId = nextId++;
        world.makeBody(leftWallId, {
            x: bx - bw / 2 - thickness / 2, y: by,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#664422"
        }).addFixture({
            shape: gearbox.shapes.BOX,
            width: thickness, height: bh,
        });

        // Right Wall
        const rightWallId = nextId++;
        world.makeBody(rightWallId, {
            x: bx + bw / 2 + thickness / 2, y: by,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#664422"
        }).addFixture({
            shape: gearbox.shapes.BOX,
            width: thickness, height: bh,
        });

        const spawnFruit = (x: number, y: number, level: number, isInitial: boolean = false) => {
            if (level >= FRUIT_LEVELS.length) return null;
            
            const fruitDef = FRUIT_LEVELS[level];
            const id = nextId++;
            const fruit = world.makeBody(id, {
                x, y,
                mass: fruitDef.mass,
                color: fruitDef.color,
            });
            fruit.addFixture({
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
        if ((world as any)._onMouseMove) canvas.removeEventListener('mousemove', (world as any)._onMouseMove);
        if ((world as any)._onClick) canvas.removeEventListener('click', (world as any)._onClick);

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

        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('click', onClick);
    }`,onInit:e=>{e.clear(),Zn(),n.debug.showAabbs=!1,e.setGravity(0,9.8),e.setHasRestitution(!0),e.setHasFriction(!0);const t=5,o=6,i=4,a=5,s=.2,r=He++;e.makeBody(r,{x:t,y:o+a/2+s/2,type:n.bodyTypes.FIXED_OBJECT,color:"#664422"}).addFixture({shape:n.shapes.BOX,width:i+s*2,height:s});const l=He++;e.makeBody(l,{x:t-i/2-s/2,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#664422"}).addFixture({shape:n.shapes.BOX,width:s,height:a});const h=He++;e.makeBody(h,{x:t+i/2+s/2,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#664422"}).addFixture({shape:n.shapes.BOX,width:s,height:a});const g=(c,d,p,y=!1)=>{if(p>=ke.length)return null;const x=ke[p],b=He++,m=e.makeBody(b,{x:c,y:d,mass:x.mass,color:x.color});return m.addFixture({shape:n.shapes.CIRCLE,radius:x.radius,restitution:.2,sFriction:.5,kFriction:.3}),m&&(m.wantsEvents=!0,A.fruitIds.set(b,p),y&&(m.vx=(Math.random()-.5)*.1)),m};e.onCollisionStart=(c,d)=>{if(A.isGameOver)return;const p=A.fruitIds.get(c),y=A.fruitIds.get(d);if(p!==void 0&&y!==void 0&&p===y){if(A.mergingIds.has(c)||A.mergingIds.has(d))return;const x=p;if(x>=ke.length-1)return;A.mergingIds.add(c),A.mergingIds.add(d);const b=e.getBodyById(c),m=e.getBodyById(d);if(b&&m){const B=(b.x+m.x)/2,I=(b.y+m.y)/2;setTimeout(()=>{e.removeObject(c),e.removeObject(d),A.fruitIds.delete(c),A.fruitIds.delete(d),A.mergingIds.delete(c),A.mergingIds.delete(d),g(B,I,x+1)&&(A.score+=ke[x+1].score)},0)}}},ee=document.getElementById("debug-canvas"),e._onMouseMove&&ee.removeEventListener("mousemove",e._onMouseMove),e._onClick&&ee.removeEventListener("click",e._onClick);const u=c=>{if(A.isGameOver)return;const d=ee.getBoundingClientRect();A.mouseX=Ot(c.clientX-d.left);const p=ke[A.nextFruitLevel].radius;A.mouseX=Math.max(t-i/2+p,Math.min(t+i/2-p,A.mouseX))},f=c=>{if(A.isGameOver){e.clear(),Zn(),it.onInit(e);return}const d=Date.now();d-A.lastDropTime>A.dropCooldown&&(g(A.mouseX,o-a/2-1,A.nextFruitLevel,!0),A.nextFruitLevel=Math.floor(Math.random()*5),A.lastDropTime=d)};e._onMouseMove=u,e._onClick=f,ee.addEventListener("mousemove",u),ee.addEventListener("click",f)},onTickRaw:`(world, dt) => {
        gearbox.debug.clearLabels();

        if (gameState.isGameOver) {
            gearbox.debug.addLabel({ text: "GAME OVER", x: 5, y: 4, fontSize: "48px Arial", color: "#ff4444", position: "on-top" });
            gearbox.debug.addLabel({ text: \`Final Score: \${gameState.score}\`, x: 5, y: 5, fontSize: "24px Arial", color: "#fff", position: "on-top" });
            gearbox.debug.addLabel({ text: "Click to Restart", x: 5, y: 6, fontSize: "20px Arial", color: "#888", position: "on-top" });
            return;
        }

        // Draw Score
        gearbox.debug.addLabel({ text: \`Score: \${gameState.score}\`, x: 0.5, y: 0.5, fontSize: "24px Arial", color: "#fff", position: "on-top" });

        // Draw Next Fruit Preview
        const nextFruit = FRUIT_LEVELS[gameState.nextFruitLevel];
        gearbox.debug.addLabel({ text: \`Next: \${nextFruit.name}\`, x: 8.0, y: 0.5, fontSize: "18px Arial", color: nextFruit.color, position: "on-top" });

        // Draw Drop Guide / Preview
        const previewY = 1.5;
        gearbox.debug.addLabel({ 
            text: "●", 
            x: gameState.mouseX, 
            y: previewY, 
            fontSize: \`\${nextFruit.radius * 200}px Arial\`, 
            color: nextFruit.color, 
            position: "on-top" 
        });

        // Check for Fall Out (Game Over)
        world.iterateBodies((obj) => {
            if (gameState.fruitIds.has(obj.id)) {
                if (obj.y > 12) { // Fell below the bucket
                    gameState.isGameOver = true;
                }
            }
        });

        gearbox.debug.addLabel({ text: "Fruit Merge", x: 5, y: 0.5, fontSize: "28px Arial", color: "#bbb", position: "on-top" });
    }`,onTick:(e,t)=>{if(n.debug.clearLabels(),A.isGameOver){n.debug.addLabel({text:"GAME OVER",x:5,y:4,fontSize:"48px Arial",color:"#ff4444",position:"on-top"}),n.debug.addLabel({text:`Final Score: ${A.score}`,x:5,y:5,fontSize:"24px Arial",color:"#fff",position:"on-top"}),n.debug.addLabel({text:"Click to Restart",x:5,y:6,fontSize:"20px Arial",color:"#888",position:"on-top"});return}n.debug.addLabel({text:`Score: ${A.score}`,x:.5,y:.5,fontSize:"24px Arial",color:"#fff",position:"on-top"});const o=ke[A.nextFruitLevel];n.debug.addLabel({text:`Next: ${o.name}`,x:8,y:.5,fontSize:"18px Arial",color:o.color,position:"on-top"}),n.debug.addLabel({text:"●",x:A.mouseX,y:1.5,fontSize:`${o.radius*200}px Arial`,color:o.color,position:"on-top"}),e.iterateBodies(a=>{A.fruitIds.has(a.id)&&a.y>12&&(A.isGameOver=!0)}),n.debug.addLabel({text:"Fruit Merge",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"})},onCleanup:e=>{ee&&(ee.removeEventListener("mousemove",e._onMouseMove),ee.removeEventListener("click",e._onClick),delete e._onMouseMove,delete e._onClick)}});let D=1,E=null,ue=null,Te=null,Ae=null,S=null,J=null,ge=[],re={},G=null,Ie=null,ce=null;const Ee=1,Se=2,de=4,rt=(e,t)=>({x:(e-n.debug.offsetX)/(n.debug.zoom*100),y:(t-n.debug.offsetY)/(n.debug.zoom*100)}),Rt=(e,t)=>{if(e.button!==0)return;const o=ce.getBoundingClientRect(),i=rt(e.clientX-o.left,e.clientY-o.top),a=t.queryPoint(i.x,i.y);if(a.length>0){const s=a[0],r=t.getBodyById(s);r&&r.type!==n.bodyTypes.FIXED_OBJECT&&(G=t.makeBody(999999,{x:i.x,y:i.y,type:n.bodyTypes.FIXED_OBJECT,color:"transparent"}),G.addFixture(999999,{shape:n.shapes.CIRCLE,radius:.05,maskBits:0}),Ie=t.createSpringJoint(999998,G,r,{worldAnchor:i,frequencyHz:5,dampingRatio:1,length:0}))}},Lt=e=>{if(G){const t=ce.getBoundingClientRect(),o=rt(e.clientX-t.left,e.clientY-t.top);G.x=o.x,G.y=o.y}},Dt=(e,t)=>{Ie&&(t.removeJoint(Ie.id),Ie=null),G&&(t.removeObject(G.id),G=null)},dt=new k({name:"Motorcycle Trials",key:"motorcycle",description:["A physically-driven motorcycle featuring multi-joint suspension and a gear-driven powertrain.","### Controls","- **D / A**: Throttle / Reverse","- **W / S**: Lean / Balance","- **R**: Reset Simulation","### Technical Features","- **Power Transfer**: Engine-to-wheel torque transfer using `GearJoint` constraints.","- **Suspension**: A network of `SpringJoint` constraints for authentic front/rear suspension travel.","- **Procedural Terrain**: Dynamic generation with optimized **Collision Masks** (terrain-terrain collisions are disabled for performance)."].join(`

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
        chassis = world.makeBody(chassisId, {
            x: cx, y: cy,
            mass: 10.0,
            color: "#ff4444",
        });
        chassis.addFixture(chassisId, {
            shape: gearbox.shapes.BOX,
            width: 1.2, height: 0.4,
            categoryBits: CAT_CHASSIS,
            maskBits: CAT_TERRAIN
        });
        chassis.angularDamping = 1.0;

        // Engine (internal spinning mass to drive wheels)
        const engineId = nextId++;
        engine = world.makeBody(engineId, {
            x: cx, y: cy - 0.15,
            mass: 5.0,
            color: "#444",
        });
        engine.addFixture(engineId, {
            shape: gearbox.shapes.CIRCLE,
            radius: 0.25,
            categoryBits: 0, // No collision
            maskBits: 0
        });
        const engineHinge = world.createHingeJoint(nextId++, chassis, engine, { worldAnchor: { x: cx, y: cy - 0.15 } });

        // Rear Suspension Arm (Swingarm)
        const rearArmId = nextId++;
        rearArm = world.makeBody(rearArmId, {
            x: cx - 0.6, y: cy + 0.2,
            mass: 1.0,
            color: "#666",
        });
        rearArm.addFixture({
            shape: gearbox.shapes.BOX,
            width: 0.6, height: 0.1,
            categoryBits: CAT_CHASSIS,
            maskBits: CAT_TERRAIN
        });
        rearArm.angularDamping = 1.0;
        const rearArmHinge = world.createHingeJoint(nextId++, chassis, rearArm, {
            anchorA: { x: -0.4, y: 0.1 },
            anchorB: { x: 0.3, y: 0 }
        });
        world.createSpringJoint(nextId++, chassis, rearArm, {
            anchorA: { x: -0.7, y: -0.2 },
            anchorB: { x: -0.3, y: 0 },
            frequencyHz: 25.0,
            dampingRatio: 0.8
        });

        // Rear Wheel
        const rearWheelId = nextId++;
        rearWheel = world.makeBody(rearWheelId, {
            x: cx - 0.9, y: cy + 0.2, // Aligned with arm anchor
            mass: 2.0,
            color: "#333",
        });
        rearWheel.addFixture(rearWheelId, {
            shape: gearbox.shapes.CIRCLE,
            radius: 0.4,
            categoryBits: CAT_WHEEL,
            maskBits: CAT_TERRAIN
        });
        rearWheel.fixtures[0].kineticFriction = 2.5;
        rearWheel.fixtures[0].staticFriction = 3.0;
        rearWheel.angularDamping = 0.5;
        const rearWheelHinge = world.createHingeJoint(nextId++, rearArm, rearWheel, {
            anchorA: { x: -0.3, y: 0 },
            anchorB: { x: 0, y: 0 }
        });

        // Drive Chain (Engine to Rear Wheel)
        world.createGearJoint(nextId++, engineHinge, rearWheelHinge, 2.0);

        // Front Suspension Arm (Forks)
        const frontArmId = nextId++;
        frontArm = world.makeBody(frontArmId, {
            x: cx + 0.7, y: cy + 0.2,
            r: 0.3,
            mass: 1.0,
            color: "#666",
        });
        frontArm.addFixture({
            shape: gearbox.shapes.BOX,
            width: 0.1, height: 0.8,
            categoryBits: CAT_CHASSIS,
            maskBits: CAT_TERRAIN
        });
        frontArm.angularDamping = 1.0;
        const frontArmHinge = world.createHingeJoint(nextId++, chassis, frontArm, {
            anchorA: { x: 0.5, y: 0 },
            anchorB: { x: 0, y: -0.3 }
        });
        world.createSpringJoint(nextId++, chassis, frontArm, {
            anchorA: { x: 0.2, y: 0.2 },
            anchorB: { x: 0, y: 0.3 },
            frequencyHz: 20.0,
            dampingRatio: 0.9
        });

        // Front Wheel
        const frontWheelId = nextId++;
        frontWheel = world.makeBody(frontWheelId, {
            x: cx + 0.8, y: cy + 0.5, // Aligned with fork anchor
            mass: 2.0,
            color: "#333",
        });
        frontWheel.addFixture(frontWheelId, {
            shape: gearbox.shapes.CIRCLE,
            radius: 0.4,
            categoryBits: CAT_WHEEL,
            maskBits: CAT_TERRAIN
        });
        frontWheel.fixtures[0].kineticFriction = 2.0;
        frontWheel.fixtures[0].staticFriction = 2.5;
        frontWheel.angularDamping = 0.5;
        const frontWheelHinge = world.createHingeJoint(nextId++, frontArm, frontWheel, {
            anchorA: { x: 0, y: 0.4 },
            anchorB: { x: 0, y: 0 }
        });

        // --- 2. Initial Terrain ---
        const startPlatformId = nextId++;
        const startPlatform = world.makeBody(startPlatformId, {
            x: cx, y: cy + 2.0,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#444",
        });
        startPlatform.addFixture({
            shape: gearbox.shapes.BOX,
            width: 20, height: 1.0,
            categoryBits: CAT_TERRAIN,
            maskBits: CAT_CHASSIS | CAT_WHEEL
        });
        terrainBoxes.push(startPlatform);

        // Back Hill (Steep incline to prevent backing up)
        const backHillId = nextId++;
        world.makeBody(backHillId, {
            x: -7.72, y: 0.01,
            r: 1.2, // Very steep (now tilted correctly as \\_)
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#333",
        }).addFixture({
            shape: gearbox.shapes.BOX,
            width: 15, height: 1.0,
            categoryBits: CAT_TERRAIN,
            maskBits: CAT_CHASSIS | CAT_WHEEL
        });

        // Input listeners
        const onKeyDown = (e) => keys[e.code] = true;
        const onKeyUp = (e) => keys[e.code] = false;

        // Mouse interaction
        canvas = document.getElementById("debug-canvas");
        const mouseDownHandler = (e) => onMouseDown(e, world);
        const mouseMoveHandler = (e) => onMouseMove(e);
        const mouseUpHandler = (e) => onMouseUp(e, world);

        // Remove existing listeners if they exist (prevents leakage on restart)
        const oldListeners = (world as any)._motorcycleListeners;
        if (oldListeners) {
            window.removeEventListener('keydown', oldListeners.onKeyDown);
            window.removeEventListener('keyup', oldListeners.onKeyUp);
            if (canvas) {
                canvas.removeEventListener('mousedown', oldListeners.mouseDownHandler);
            }
            window.removeEventListener('mousemove', oldListeners.mouseMoveHandler);
            window.removeEventListener('mouseup', oldListeners.mouseUpHandler);
        }

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        canvas.addEventListener('mousedown', mouseDownHandler);
        window.addEventListener('mousemove', mouseMoveHandler);
        window.addEventListener('mouseup', mouseUpHandler);

        // Store listeners for cleanup
        (world as any)._motorcycleListeners = { 
            onKeyDown, onKeyUp, 
            mouseDownHandler, mouseMoveHandler, mouseUpHandler 
        };
    }`,onInit:e=>{e.clear(),n.debug.showAabbs=!1,n.debug.showForceVectors=!1,D=1,ge=[],re={};const t=5,o=5;e.setGravity(0,9.81),e.setHasRestitution(!0),e.setHasFriction(!0);const i=D++;E=e.makeBody(i,{x:t,y:o,mass:10,color:"#ff4444"}),E.addFixture(i,{shape:n.shapes.BOX,width:1.2,height:.4,categoryBits:Ee,maskBits:de}),E.angularDamping=1;const a=D++;ue=e.makeBody(a,{x:t,y:o-.15,mass:5,color:"#444"}),ue.addFixture(a,{shape:n.shapes.CIRCLE,radius:.25,categoryBits:0,maskBits:0});const s=e.createHingeJoint(D++,E,ue,{worldAnchor:{x:t,y:o-.15}}),r=D++;J=e.makeBody(r,{x:t-.6,y:o+.2,mass:1,color:"#666"}),J.addFixture({shape:n.shapes.BOX,width:.6,height:.1,categoryBits:Ee,maskBits:de}),J.angularDamping=1,e.createHingeJoint(D++,E,J,{anchorA:{x:-.4,y:.1},anchorB:{x:.3,y:0}}),e.createSpringJoint(D++,E,J,{anchorA:{x:-.7,y:-.2},anchorB:{x:-.3,y:0},frequencyHz:25,dampingRatio:.8});const l=D++;Ae=e.makeBody(l,{x:t-.9,y:o+.2,mass:2,color:"#333"}),Ae.addFixture(l,{shape:n.shapes.CIRCLE,radius:.4,categoryBits:Se,maskBits:de}),Ae.fixtures[0].kineticFriction=2.5,Ae.fixtures[0].staticFriction=3,Ae.angularDamping=.5;const h=e.createHingeJoint(D++,J,Ae,{anchorA:{x:-.3,y:0},anchorB:{x:0,y:0}});e.createGearJoint(D++,s,h,2);const g=D++;S=e.makeBody(g,{x:t+.7,y:o+.2,r:.3,mass:1,color:"#666"}),S.addFixture({shape:n.shapes.BOX,width:.1,height:.8,categoryBits:Ee,maskBits:de}),S.angularDamping=1,e.createHingeJoint(D++,E,S,{anchorA:{x:.5,y:0},anchorB:{x:0,y:-.3}}),e.createSpringJoint(D++,E,S,{anchorA:{x:.2,y:.2},anchorB:{x:0,y:.3},frequencyHz:20,dampingRatio:.9});const u=D++;Te=e.makeBody(u,{x:t+.8,y:o+.5,mass:2,color:"#333"}),Te.addFixture(u,{shape:n.shapes.CIRCLE,radius:.4,categoryBits:Se,maskBits:de}),Te.fixtures[0].kineticFriction=2,Te.fixtures[0].staticFriction=2.5,Te.angularDamping=.5,e.createHingeJoint(D++,S,Te,{anchorA:{x:0,y:.4},anchorB:{x:0,y:0}});const f=D++,c=e.makeBody(f,{x:t,y:o+2,type:n.bodyTypes.FIXED_OBJECT,color:"#444"});c.addFixture({shape:n.shapes.BOX,width:20,height:1,categoryBits:de,maskBits:Ee|Se}),ge.push(c);const d=D++;e.makeBody(d,{x:-7.72,y:.01,r:1.2,type:n.bodyTypes.FIXED_OBJECT,color:"#333"}).addFixture({shape:n.shapes.BOX,width:15,height:1,categoryBits:de,maskBits:Ee|Se});const p=I=>re[I.code]=!0,y=I=>re[I.code]=!1;ce=document.getElementById("debug-canvas");const x=I=>Rt(I,e),b=I=>Lt(I),m=I=>Dt(I,e),B=e._motorcycleListeners;B&&(window.removeEventListener("keydown",B.onKeyDown),window.removeEventListener("keyup",B.onKeyUp),ce&&ce.removeEventListener("mousedown",B.mouseDownHandler),window.removeEventListener("mousemove",B.mouseMoveHandler),window.removeEventListener("mouseup",B.mouseUpHandler)),window.addEventListener("keydown",p),window.addEventListener("keyup",y),ce.addEventListener("mousedown",x),window.addEventListener("mousemove",b),window.addEventListener("mouseup",m),e._motorcycleListeners={onKeyDown:p,onKeyUp:y,mouseDownHandler:x,mouseMoveHandler:b,mouseUpHandler:m}},onTickRaw:`(world, dt) => {
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

        if (keys['KeyD']) {
            if (engine.rs < maxEngineSpeed) {
                engine.applyAngularImpulse(-throttlePower * dt);
            }
        }
        if (keys['KeyA']) {
            if (engine.rs > -maxEngineSpeed) {
                engine.applyAngularImpulse(throttlePower * dt); 
            }
        }
        if (keys['KeyW']) {
            chassis.applyAngularImpulse(-leanPower * dt);
        }
        if (keys['KeyS']) {
            chassis.applyAngularImpulse(leanPower * dt);
        }
        if (keys['KeyR']) {
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
            const lastTR = lastBox.localToWorld({ x: lastBox.fixtures[0].width / 2, y: -lastBox.fixtures[0].height / 2 });
            
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
            const box = world.makeBody(boxId, {
                x: nextX, y: nextY,
                r: angle,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: \`hsl(\${20 + Math.random() * 40}, 30%, \${30 + Math.random() * 20}%)\`, // Earthy tones
            });
            box.addFixture({
                shape: gearbox.shapes.BOX,
                width: width, height: height,
                categoryBits: CAT_TERRAIN,
                maskBits: CAT_CHASSIS | CAT_WHEEL
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
            gearbox.debug.addLabel({ text: "Motorcycle Trials", x: 5, y: 3, fontSize: "28px Arial", color: "#fff", position: "on-top" });
            gearbox.debug.addLabel({ text: "Use D/A to drive and W/S to balance!", x: 5, y: 3.5, fontSize: "16px Arial", color: "#aaa", position: "on-top" });
        }
    }`,onTick:(e,t)=>{if(!E)return;const o=75,i=100,a=100;if(J){let r=J.r-E.r;for(;r>Math.PI;)r-=Math.PI*2;for(;r<-Math.PI;)r+=Math.PI*2;const l=-.6,h=.6;r<l?(J.r=E.r+l,J.rs<E.rs&&(J.rs=E.rs)):r>h&&(J.r=E.r+h,J.rs>E.rs&&(J.rs=E.rs))}if(S){let r=S.r-E.r;for(;r>Math.PI;)r-=Math.PI*2;for(;r<-Math.PI;)r+=Math.PI*2;const l=-.1,h=.8;r<l?(S.r=E.r+l,S.rs<E.rs&&(S.rs=E.rs)):r>h&&(S.r=E.r+h,S.rs>E.rs&&(S.rs=E.rs))}if(re.KeyD&&ue.rs<a&&ue.applyAngularImpulse(-o*t),re.KeyA&&ue.rs>-a&&ue.applyAngularImpulse(o*t),re.KeyW&&E.applyAngularImpulse(-i*t),re.KeyS&&E.applyAngularImpulse(i*t),re.KeyR){dt.init(e);return}const s=ge[ge.length-1];if(s.x<E.x+25){const r=6+Math.random()*8,l=1.2,h=(Math.random()-.5)*.5,g=Math.random()<.2?1.5:0,u=s.localToWorld({x:s.fixtures[0].width/2,y:-s.fixtures[0].height/2}),f=u.x+g;let c=u.y+(g>0?(Math.random()-.5)*3:0);c=Math.max(2,Math.min(8,c));const d=Math.cos(h),p=Math.sin(h),y=f+r/2*d-l/2*p,x=c+r/2*p+l/2*d,b=D++,m=e.makeBody(b,{x:y,y:x,r:h,type:n.bodyTypes.FIXED_OBJECT,color:`hsl(${20+Math.random()*40}, 30%, ${30+Math.random()*20}%)`});if(m.addFixture({shape:n.shapes.BOX,width:r,height:l,categoryBits:de,maskBits:Ee|Se}),ge.push(m),ge.length>50){const B=ge.shift();e.removeObject(B.id)}}n.debug.clearLabels(),E.x<15&&(n.debug.addLabel({text:"Motorcycle Trials",x:5,y:3,fontSize:"28px Arial",color:"#fff",position:"on-top"}),n.debug.addLabel({text:"Use D/A to drive and W/S to balance!",x:5,y:3.5,fontSize:"16px Arial",color:"#aaa",position:"on-top"}))},onRender:e=>{if(!E)return;const t=e.interpolationAlpha,o=E.x*t+E.prevX*(1-t),i=E.y*t+E.prevY*(1-t),a=n.debug.canvas?.width||800,s=n.debug.canvas?.height||600,r=n.debug.zoom,l=a/2-o*100*r,h=s/2-i*100*r;n.debug.offsetX+=(l-n.debug.offsetX)*.1,n.debug.offsetY+=(h-n.debug.offsetY)*.1},onCleanup:e=>{const t=e._motorcycleListeners;t&&(window.removeEventListener("keydown",t.onKeyDown),window.removeEventListener("keyup",t.onKeyUp),ce&&ce.removeEventListener("mousedown",t.mouseDownHandler),window.removeEventListener("mousemove",t.mouseMoveHandler),window.removeEventListener("mouseup",t.mouseUpHandler),delete e._motorcycleListeners),Ie&&(e.removeJoint(Ie.id),Ie=null),G&&(e.removeObject(G.id),G=null),n.debug.offsetX=0,n.debug.offsetY=0}}),Xt=new k({name:"Newton's Cradle",key:"newtons-cradle",description:["A classic demonstration of conservation of momentum and energy. This simulation shows how kinetic energy and momentum are transferred through a series of suspended spheres.","### Features","- **Elastic Collisions**: Restitution is set to `1.0` to ensure near-perfect energy conservation during impacts.","- **Bifilar Suspension**: Each sphere is suspended by two `DistanceJoint` constraints in a 'V' shape, providing maximum stability and preventing unintended rotation.","- **Low Friction**: Friction is minimized to allow the pendulum motion to persist for a long duration.","The first ball is released from a 45-degree angle to initiate the chain reaction. Click **Reset** to restart the sequence."].join(`

`),onInitRaw:`(world) => {
        world.clear();
        world.setGravity(0, 9.81);
        
        // Hide AABBs for a cleaner look
        gearbox.debug.showAabbs = false;

        const cx = 5;
        const cy = 2;
        const numBalls = 5;
        const ballRadius = 0.45;
        const stringLength = 4.0;
        const beamWidth = (numBalls + 1) * ballRadius * 2;
        
        let nextId = 1;

        // Collision categories
        const CAT_BEAM = 0x0001;
        const CAT_BALL = 0x0002;

        // The stationary overhead beam
        const beamId = nextId++;
        const beam = world.makeBody(beamId, {
            x: cx, y: cy,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#444",
        });
        beam.addFixture(beamId, {
            shape: gearbox.shapes.BOX,
            width: beamWidth,
            height: 0.3,
            categoryBits: CAT_BEAM,
            maskBits: 0, // Collide with nothing
        });

        for (let i = 0; i < numBalls; i++) {
            // Horizontal offset from center of beam
            const xOffset = (i - (numBalls - 1) / 2) * (ballRadius * 2);
            const ballX = cx + xOffset;
            const targetBallY = cy + stringLength;
            
            const isFirst = i === 0;
            let initialX = ballX;
            let initialY = targetBallY;

            if (isFirst) {
                // Lift the first ball (45 degree angle)
                const angle = -Math.PI / 4;
                initialX = cx + xOffset + Math.sin(angle) * stringLength;
                initialY = cy + Math.cos(angle) * stringLength;
            }

            const ballId = nextId++;
            const ball = world.makeBody(ballId, {
                x: initialX, y: initialY,
                mass: 1.0,
                color: isFirst ? "#ff4444" : "#cccccc",
                linearDamping: 0.005,
                angularDamping: 0.01,
            });

            ball.addFixture(ballId, {
                shape: gearbox.shapes.CIRCLE,
                radius: ballRadius,
                restitution: 1.0,
                sFriction: 0,
                kFriction: 0,
                categoryBits: CAT_BALL,
                maskBits: CAT_BALL, // Only collide with other balls
            });

            // Bifilar suspension (two strings for stability)
            const anchorSpacing = 0.1;
            
            // Left string
            world.createDistanceJoint(nextId++, beam, ball, {
                anchorA: { x: xOffset - anchorSpacing, y: 0 },
                anchorB: { x: 0, y: 0 },
                length: Math.sqrt(stringLength * stringLength + anchorSpacing * anchorSpacing),
            });
            
            // Right string
            world.createDistanceJoint(nextId++, beam, ball, {
                anchorA: { x: xOffset + anchorSpacing, y: 0 },
                anchorB: { x: 0, y: 0 },
                length: Math.sqrt(stringLength * stringLength + anchorSpacing * anchorSpacing),
            });
        }
    }`,onInit:e=>{e.clear(),e.setGravity(0,9.81),n.debug.showAabbs=!1;const t=5,o=2,i=5,a=.45,s=4,r=(i+1)*a*2;let l=1;const h=1,g=2,u=l++,f=e.makeBody(u,{x:t,y:o,type:n.bodyTypes.FIXED_OBJECT,color:"#444"});f.addFixture(u,{shape:n.shapes.BOX,width:r,height:.3,categoryBits:h,maskBits:0});for(let c=0;c<i;c++){const d=(c-(i-1)/2)*(a*2),p=t+d,y=o+s,x=c===0;let b=p,m=y;if(x){const M=-Math.PI/4;b=t+d+Math.sin(M)*s,m=o+Math.cos(M)*s}const B=l++,I=e.makeBody(B,{x:b,y:m,mass:1,color:x?"#ff4444":"#cccccc",linearDamping:.005,angularDamping:.01});I.addFixture(B,{shape:n.shapes.CIRCLE,radius:a,restitution:1,sFriction:0,kFriction:0,categoryBits:g,maskBits:g});const w=.1;e.createDistanceJoint(l++,f,I,{anchorA:{x:d-w,y:0},anchorB:{x:0,y:0},length:Math.sqrt(s*s+w*w)}),e.createDistanceJoint(l++,f,I,{anchorA:{x:d+w,y:0},anchorB:{x:0,y:0},length:Math.sqrt(s*s+w*w)})}}}),St=[it,Ft,Mt,dt,Xt],Jt=!["localhost","127.0.0.1"].includes(window.location.hostname),be=[{name:"Showcase",examples:St},{name:"General",examples:Bt},{name:"Constraints",examples:wt},{name:"Optimizations",examples:Ct},{name:"Stress Tests",examples:Et},{name:"Known Issues",examples:vt}].filter(e=>!Jt||e.name!=="Known Issues");let Ht=`
import gearbox from "gearbox2d";

let world;
{{GLOBAL}}
gearbox.init().then(()=>{
    world = gearbox.makeWorld();
    
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
`.trim();const _e=()=>window.innerWidth<=768;let K={},j=null;function _t(){const e=document.getElementById("examples-list");e.innerHTML="",be.forEach((t,o)=>{const i=document.createElement("li");i.className="section",i.textContent=t.name,e.appendChild(i),t.examples&&Array.isArray(t.examples)&&t.examples.forEach((a,s)=>{const r=a.key||`${o}-${s}`;K[r]={category:o,index:s,example:a};const l=document.createElement("li");l.className="example",l.textContent=a.name,l.setAttribute("data-example",r),e.appendChild(l)})}),document.querySelectorAll("#sidebar li.example").forEach(t=>{t.addEventListener("click",()=>{document.querySelectorAll("#sidebar li.example.selected").forEach(i=>{i.classList.remove("selected")}),t.classList.add("selected");const o=t.getAttribute("data-example");Fn(o,"push"),_e()&&le.classList.add("collapsed")})})}let X,ct=document.getElementById("example-name"),ne=document.getElementById("debug-canvas"),Tn=document.getElementById("code-section"),Pt=document.getElementById("general-code"),jt=document.getElementById("init-code"),Gt=document.getElementById("tick-code"),Yt=document.getElementById("render-code"),xe=document.getElementById("toggle-code"),zt=document.getElementById("fps"),Qn=document.getElementById("memory"),Wt=document.getElementById("step-time"),et=document.querySelectorAll(".code-tab"),Nt=document.querySelectorAll(".code-panel"),lt=document.getElementById("sidebar-toggle"),le=document.getElementById("sidebar"),$t=document.getElementById("reset-button"),qt=document.getElementById("reset-button-mobile"),nt=document.getElementById("info-toggle"),tt=document.getElementById("info-toggle-mobile");ct.innerHTML="Loading example...";let V=0,An=[],En=[],vn=[],Qe=1e3/60,en=0,ot=0;n.init().then(()=>{X=n.makeWorld(),n.debug.enableDebugGraphics(ne,X);let e=performance.now(),t=0;const o=1/60;function i(d){let p=(d-e)/1e3;e=d,p>.25&&(p=.25),t+=p;const y=performance.now();for(;t>=o;){if(X.step(),j&&K[j]){const M=K[j].example;M&&typeof M.onTick=="function"&&M.onTick(X,o)}t-=o}if(X.interpolationAlpha=t/o,j&&K[j]){const M=K[j].example;M&&typeof M.onRender=="function"&&M.onRender(X)}const b=(performance.now()-y)*1e3;let m=An[V%100]??Qe,B=En[V%100]??0,I=vn[V%100]??0;An[V%100]=p*1e3||16.67,En[V%100]=X?X.getMemoryUsage():0,vn[V%100]=b,Qe+=(An[V%100]-m)/100,en+=(En[V%100]-B)/100,ot+=(vn[V%100]-I)/100,V++;const w=Qe>0?Math.round(1e3/Qe):0;zt.innerHTML=`<i class="fas fa-tachometer-alt"></i>Render FPS: ${w}`,en<1048576?Qn.innerHTML=`<i class="fas fa-memory"></i>Memory: ${(en/1024).toFixed(2)} KB`:Qn.innerHTML=`<i class="fas fa-memory"></i>Memory: ${(en/1048576).toFixed(2)} MB`,Wt.innerHTML=`<i class="fas fa-stopwatch"></i>Step Time: ${ot.toFixed(0)} μs`,requestAnimationFrame(i)}_t(),ht(!0);const a=()=>{j&&Fn(j,"none")};$t.addEventListener("click",a),qt.addEventListener("click",a);const s=()=>{document.body.classList.toggle("info-mode");const d=document.body.classList.contains("info-mode"),p=d?"fa-th-large":"fa-info-circle",y=d?"Show Canvas":"Info";[nt,tt].forEach(x=>{const b=x.querySelector("i"),m=x.querySelector(".button-text");b&&(b.className=`fas ${p}`),m&&(m.textContent=y),x.title=d?"Show Canvas":"Show Information"}),d||n.debug.centerCamera(5,5)};nt.addEventListener("click",s),tt.addEventListener("click",s),requestAnimationFrame(i),_e()&&le.classList.add("collapsed"),ne.addEventListener("wheel",d=>{d.preventDefault();const p=.05,y=d.offsetX,x=d.offsetY,b=(y-n.debug.offsetX)/n.debug.zoom,m=(x-n.debug.offsetY)/n.debug.zoom,B=-Math.sign(d.deltaY),I=Math.pow(1+p,B),w=Math.min(Math.max(n.debug.zoom*I,.1),10);n.debug.zoom=w,n.debug.offsetX=y-b*n.debug.zoom,n.debug.offsetY=x-m*n.debug.zoom},{passive:!1});let r=!1,l=0,h=0;ne.addEventListener("mousedown",d=>{d.button===2&&(r=!0,l=d.clientX,h=d.clientY)}),window.addEventListener("mousemove",d=>{if(r){const p=d.clientX-l,y=d.clientY-h;n.debug.offsetX+=p,n.debug.offsetY+=y,l=d.clientX,h=d.clientY}}),window.addEventListener("mouseup",d=>{d.button===2&&(r=!1)}),ne.addEventListener("contextmenu",d=>{d.preventDefault()});let g=0,u=!1,f=0,c=0;ne.addEventListener("touchstart",d=>{if(d.touches.length===1)f=d.touches[0].clientX,c=d.touches[0].clientY,u=!1;else if(d.touches.length===2){u=!0;const p=d.touches[0].clientX-d.touches[1].clientX,y=d.touches[0].clientY-d.touches[1].clientY;g=Math.sqrt(p*p+y*y)}},{passive:!1}),ne.addEventListener("touchmove",d=>{if(d.touches.length!==0){if(d.preventDefault(),d.touches.length===1&&!u){const p=d.touches[0].clientX,y=d.touches[0].clientY,x=p-f,b=y-c;n.debug.offsetX+=x,n.debug.offsetY+=b,f=p,c=y}else if(d.touches.length===2){const p=d.touches[0],y=d.touches[1],x=p.clientX-y.clientX,b=p.clientY-y.clientY,m=Math.sqrt(x*x+b*b);if(g>0){const B=m/g,I=Math.min(Math.max(n.debug.zoom*B,.1),10),w=(p.clientX+y.clientX)/2,M=(p.clientY+y.clientY)/2,R=ne.getBoundingClientRect(),H=w-R.left,ae=M-R.top,_=(H-n.debug.offsetX)/n.debug.zoom,Y=(ae-n.debug.offsetY)/n.debug.zoom;n.debug.zoom=I,n.debug.offsetX=H-_*n.debug.zoom,n.debug.offsetY=ae-Y*n.debug.zoom}g=m}}},{passive:!1}),ne.addEventListener("touchend",d=>{d.touches.length<2&&(u=!1,g=0),d.touches.length===1&&(f=d.touches[0].clientX,c=d.touches[0].clientY)},{passive:!1}),ne.addEventListener("touchcancel",d=>{u=!1,g=0},{passive:!1})});function Fn(e,t="push"){if(!X||!K[e])return;if(j&&K[j]){const u=K[j].example;u&&typeof u.cleanup=="function"&&u.cleanup(X)}const o="#"+e;window.location.hash!==o&&(t==="push"?history.pushState(null,"",o):t==="replace"&&history.replaceState(null,"",o)),X.clear(),n.debug.clearLabels(),n.debug.showForceVectors=!0,n.debug.showImpulseVectors=!0,X.setHasPenetrationResolution(!0),X.setHasRestitution(!0),X.setHasFriction(!0),X.setGravity(0,0),n.debug.zoom=1,n.debug.centerCamera(5,5),n.debug.showAabbs=!0,j=e;const a=K[e].example;a&&typeof a.onInit=="function"?a.onInit(X):console.error("Example onInit method not found:",a);function s(u,f){if(!u)return`function ${f}${f==="tick"?"(dt)":"()"} {}`;let c=u.split("	").join("    ");const d=[/^\(world\)\s*=>\s*\{/,/^\(world,\s*dt\)\s*=>\s*\{/,/^function\s*\(world\)\s*\{/,/^function\s*\(world,\s*dt\)\s*\{/,/^function\s+init\s*\(world\)\s*\{/,/^function\s+tick\s*\(world,\s*dt\)\s*\{/,/^function\s+render\s*\(world\)\s*\{/];let p=!1,y=c.trim();for(const m of d)if(m.test(y)){c=y.replace(m,`function ${f}${f==="tick"?"(dt)":"()"} {`),p=!0;break}p||(c=y.replace(/^.*?=>\s*\{/,`function ${f}${f==="tick"?"(dt)":"()"} {`));let x=c.split(`
`);if(x.length<=1)return c;let b=1/0;for(let m=1;m<x.length;m++){const B=x[m];if(B.trim().length===0)continue;const I=B.search(/\S/);I!==-1&&I<b&&(b=I)}return b===1/0&&(b=0),x.map((m,B)=>B===0?m:m.substring(Math.min(m.length,b))).join(`
`)}let r=a.globalLines?.join(`
`)??"",l=a.onInitRaw||a.onInit?.toString()||"",h=a.onTickRaw||a.onTick?.toString()||"",g=a.onRenderRaw||a.onRender?.toString()||"";Pt.textContent=Ht.split("{{GLOBAL}}").join(r),jt.textContent=s(l,"init"),Gt.textContent=s(h,"tick"),Yt.textContent=s(g,"render"),pt(),ct.textContent=a.name||"Unknown Example",document.getElementById("description").innerHTML=xt.parse(a.description||"")}function ht(e=!1){let t=window.location.hash.substring(1);const o=!t;if(t||(t="sandbox"),!K[t]){console.log("Example not found directly, searching...");let a=!1;for(let s=0;s<be.length;s++){const r=be[s];if(r.examples&&Array.isArray(r.examples)){for(let l=0;l<r.examples.length;l++)if(r.examples[l].key===t){console.log(`Found example ${t} in category ${s}, index ${l}`),a=!0;break}}if(a)break}if(!a)if(console.warn(`Example with key '${t}' not found, defaulting to first available example`),be.length>0&&be[0].examples&&be[0].examples.length>0)t=be[0].examples[0].key||"0-0";else{console.error("No examples found");return}}const i=document.querySelector(`#sidebar li.example[data-example="${t}"]`);i&&(document.querySelectorAll("#sidebar li.example.selected").forEach(a=>{a.classList.remove("selected")}),i.classList.add("selected")),Fn(t,o&&e?"replace":"none")}et.forEach(e=>{e.addEventListener("click",()=>{et.forEach(o=>o.classList.remove("active")),Nt.forEach(o=>o.classList.remove("active")),e.classList.add("active"),document.getElementById(`${e.dataset.panel}-panel`).classList.add("active")})});function pt(){document.querySelectorAll("pre").forEach(t=>{const o=t.textContent;t.innerHTML=hljs?.highlight(o,{language:"javascript"}).value})}xe.addEventListener("click",()=>{Tn.style.display==="none"?(Tn.style.display="block",xe.querySelector("span").textContent="Hide Code",xe.querySelector("i").classList.remove("fa-chevron-down"),xe.querySelector("i").classList.add("fa-chevron-up"),pt()):(Tn.style.display="none",xe.querySelector("span").textContent="Show Code",xe.querySelector("i").classList.remove("fa-chevron-up"),xe.querySelector("i").classList.add("fa-chevron-down"))});lt.addEventListener("click",()=>{le.classList.toggle("collapsed")});window.addEventListener("resize",()=>{_e()||document.body.classList.remove("info-mode"),_e()&&!le.classList.contains("collapsed")&&le.classList.add("collapsed")});window.addEventListener("click",e=>{_e()&&!le.classList.contains("collapsed")&&!le.contains(e.target)&&e.target!==lt&&le.classList.add("collapsed")});const Je=document.getElementById("copy-code");Je.addEventListener("click",()=>{const t=document.querySelector(".code-panel.active").querySelector("pre").textContent;navigator.clipboard.writeText(t).then(()=>{const o=Je.querySelector("span"),i=Je.querySelector("i"),a=o.textContent;Je.classList.add("success"),o.textContent="Copied!",i.classList.remove("fa-copy"),i.classList.add("fa-check"),setTimeout(()=>{Je.classList.remove("success"),o.textContent=a,i.classList.remove("fa-check"),i.classList.add("fa-copy")},2e3)})});window.addEventListener("popstate",function(e){ht(!1)});
