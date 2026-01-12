import"./modulepreload-polyfill-B5Qt9EMX.js";import{M as qt}from"./markdown-tUR2hliS.js";import{g as t}from"./world-C2Ab8g_n.js";class k{constructor(n){this.onInit=n.onInit,this.onInitRaw=n.onInitRaw,this.onTick=n.onTick,this.onTickRaw=n.onTickRaw,this.onCleanup=n.onCleanup,this.description=n.description,this.name=n.name,this.key=n.key,this.globalLines=n.globalLines||[]}init(n){this.onInit?.(n)}tick(n,o){this.onTick?.(n,o)}cleanup(n){this.onCleanup?.(n)}}let v=1,et=0,ne=null,Ge=null,de=null;const jt=(e,n)=>({x:(e-t.debug.offsetX)/(t.debug.zoom*100),y:(n-t.debug.offsetY)/(t.debug.zoom*100)}),Nt=(e,n)=>{if(e.button!==0)return;const o=de.getBoundingClientRect(),a=jt(e.clientX-o.left,e.clientY-o.top),s=n.queryPoint(a.x,a.y);if(s.length>0){const i=s[0],c=n.getObjectById(i);c&&c.type!==t.bodyTypes.FIXED_OBJECT&&(ne=n.makeObject(999999,{x:a.x,y:a.y,type:t.bodyTypes.FIXED_OBJECT,shape:t.shapes.CIRCLE,radius:.05,color:"transparent",maskBits:0}),Ge=n.createSpringJoint(999998,ne,c,{worldAnchor:a,frequencyHz:3,dampingRatio:1,length:0}))}},Ut=e=>{if(ne){const n=de.getBoundingClientRect(),o=jt(e.clientX-n.left,e.clientY-n.top);ne.x=o.x,ne.y=o.y}},Kt=(e,n)=>{Ge&&(n.removeJoint(Ge.id),Ge=null),ne&&(n.removeObject(ne.id),ne=null)},Vt=[new k({name:"Interactive Sandbox",key:"sandbox",description:["Welcome to **Gearbox2D**! This is an interactive playground featuring various shapes and physics properties. Click and drag objects to interact with them.","### Features","- **Point Query**: The engine detects which object is under the mouse using **BVH** and precise shape tests.","- **Mouse Joint**: Uses a `SpringJoint` to pull objects toward the mouse cursor.","- **Collision Filtering**: The mouse 'anchor' object is a sensor that doesn't collide with other objects."].join(`

`),onInitRaw:`(world) => {
            world.clear();
            gearbox.debug.showAabbs = false;
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
            world.makeObject(nextId++, {
                x: 5, y: 9.0 + thickness / 2,
                shape: gearbox.shapes.BOX,
                width: boundaryWidth, height: thickness,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#444"
            });

            // Roof
            world.makeObject(nextId++, {
                x: 5, y: 0.0 - thickness / 2,
                shape: gearbox.shapes.BOX,
                width: boundaryWidth, height: thickness,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#444"
            });

            // Walls
            world.makeObject(nextId++, { 
                x: 5 - innerWidth / 2 - thickness / 2, 
                y: 4.5, 
                shape: gearbox.shapes.BOX, 
                width: thickness, height: wallHeight, 
                type: gearbox.bodyTypes.FIXED_OBJECT, 
                color: "#444" 
            });
            world.makeObject(nextId++, { 
                x: 5 + innerWidth / 2 + thickness / 2, 
                y: 4.5, 
                shape: gearbox.shapes.BOX, 
                width: thickness, height: wallHeight, 
                type: gearbox.bodyTypes.FIXED_OBJECT, 
                color: "#444" 
            });

            // Grid of shapes to prevent initial overlap
            const colors = ["#ff4444", "#44ff44", "#4444ff", "#ffff44", "#ff44ff", "#44ffff"];
            const cols = 8;
            const rows = 5;
            const spacingX = 1.0;
            const spacingY = 1.2;
            const startX = 5 - ((cols - 1) * spacingX) / 2;
            const startY = 2.0;
            
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const x = startX + c * spacingX;
                    const y = startY + r * spacingY;
                    const color = colors[(r * cols + c) % colors.length];
                    
                    const commonProps = {
                        x, y,
                        mass: 1.0,
                        color,
                        linearDamping: 0.5,
                        angularDamping: 1.5
                    };

                    const rand = Math.random();
                    if (rand < 0.5) {
                        // Circle
                        world.makeObject(nextId++, {
                            ...commonProps,
                            shape: gearbox.shapes.CIRCLE,
                            radius: 0.2 + Math.random() * 0.2,
                            r: Math.random() * Math.PI,
                        });
                    } else {
                        // Box
                        world.makeObject(nextId++, {
                            ...commonProps,
                            shape: gearbox.shapes.BOX,
                            width: 0.4 + Math.random() * 0.4,
                            height: 0.4 + Math.random() * 0.4,
                            r: Math.random() * Math.PI,
                        });
                    }
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
        }`,onInit:e=>{e.clear(),t.debug.showAabbs=!1,v=1,e.setGravity(0,9.8),e.setHasRestitution(!0),e.setHasFriction(!0);const n=1,o=9.2,s=9+n*2,i=o+n*2;e.makeObject(v++,{x:5,y:9+n/2,shape:t.shapes.BOX,width:i,height:n,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}),e.makeObject(v++,{x:5,y:0-n/2,shape:t.shapes.BOX,width:i,height:n,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}),e.makeObject(v++,{x:5-o/2-n/2,y:4.5,shape:t.shapes.BOX,width:n,height:s,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}),e.makeObject(v++,{x:5+o/2+n/2,y:4.5,shape:t.shapes.BOX,width:n,height:s,type:t.bodyTypes.FIXED_OBJECT,color:"#444"});const c=["#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff"],l=8,d=5,p=1,r=1.2,m=5-(l-1)*p/2,h=2;for(let u=0;u<d;u++)for(let g=0;g<l;g++){const y=m+g*p,w=h+u*r,I=c[(u*l+g)%c.length],B={x:y,y:w,mass:1,color:I,linearDamping:.5,angularDamping:1.5};Math.random()<.5?e.makeObject(v++,{...B,shape:t.shapes.CIRCLE,radius:.2+Math.random()*.2,r:Math.random()*Math.PI}):e.makeObject(v++,{...B,shape:t.shapes.BOX,width:.4+Math.random()*.4,height:.4+Math.random()*.4,r:Math.random()*Math.PI})}de=document.getElementById("debug-canvas"),e._mouseDownHandler&&de.removeEventListener("mousedown",e._mouseDownHandler),e._mouseMoveHandler&&window.removeEventListener("mousemove",e._mouseMoveHandler),e._mouseUpHandler&&window.removeEventListener("mouseup",e._mouseUpHandler),e._mouseDownHandler=u=>Nt(u,e),e._mouseMoveHandler=u=>Ut(u),e._mouseUpHandler=u=>Kt(u,e),de.addEventListener("mousedown",e._mouseDownHandler),window.addEventListener("mousemove",e._mouseMoveHandler),window.addEventListener("mouseup",e._mouseUpHandler)},onCleanup:e=>{de&&(de.removeEventListener("mousedown",e._mouseDownHandler),window.removeEventListener("mousemove",e._mouseMoveHandler),window.removeEventListener("mouseup",e._mouseUpHandler),delete e._mouseDownHandler,delete e._mouseMoveHandler,delete e._mouseUpHandler)},onTickRaw:`(world, dt) => {
            gearbox.debug.clearLabels();
            gearbox.debug.addLabel({ text: "Interactive Sandbox", x: 5, y: 0.5, fontSize: "28px Arial", color: "#bbb", position: "on-top" });
            gearbox.debug.addLabel({ text: "Click and drag objects!", x: 5, y: 1.2, fontSize: "16px Arial", color: "#888", position: "on-top" });
        }`,onTick:(e,n)=>{t.debug.clearLabels(),t.debug.addLabel({text:"Interactive Sandbox",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"}),t.debug.addLabel({text:"Click and drag objects!",x:5,y:1.2,fontSize:"16px Arial",color:"#888",position:"on-top"})}}),new k({name:"Force",key:"force",description:["**Forces** are used to apply acceleration to objects which scale inversely with the object's mass. All forces applied to an object are accumulated and applied in the next world step where they are reset.","Persistent forces must be reapplied on each fixed update (every `tick`).","It's important to note that the change in velocity will be a function of the **force vector**, the object's **mass**, and the **time step**. If you need a specific instantaneous change in velocity, use an **Impulse** instead."].join(`

`),onInitRaw:`(world)=>{

            // This small circle will orbit the bigger one.
            world.makeObject(1, {
                x: 5.00,
                y: 2.50,
                vx: 5.00,
                r: Math.PI / 2 * Math.random(),
                rs: 5,
                mass: 0.1, // 100g
                shape: gearbox.shapes.CIRCLE,
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
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.SENSOR, // Sensors don't collide with other objects.
                radius: 1.00,
                angularDamping: 0.0, 
            });
        }`,onInit:e=>{e.makeObject(1,{x:5,y:2.5,vx:5,r:Math.PI/2*Math.random(),rs:5,mass:.1,shape:t.shapes.CIRCLE,radius:.3,angularDamping:0,linearDamping:0}),e.makeObject(2,{x:5,y:5,r:Math.PI/2*Math.random(),rs:.1,shape:t.shapes.CIRCLE,type:t.bodyTypes.SENSOR,radius:1,angularDamping:0})},onTickRaw:`(world, dt)=>{
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
        }`,onTick:(e,n)=>{let o=e.objectsById[1],a=e.objectsById[2],s=a.x-o.x,i=a.y-o.y,c=Math.sqrt(s*s+i*i);s/=c,i/=c;const l=2;o.applyForce(s*l,i*l)}}),new k({name:"Impulse",key:"impulse",description:["**Impulses** are used to apply a sudden change in momentum to an object. It's similar to a force, but modifies the object's velocity **instantaneously**, rather than acting as a persistent push.","In this example we demonstrate both **Linear** and **Angular** impulses.","- The two circles receive vertical linear impulses.","- The box receives periodic angular impulses (torque) causing it to spin without moving its center."].join(`

`),globalLines:["let impulseTimer = 0;"],onInitRaw:`(world)=>{

            // Linear impulse targets
            world.makeObject(1, {
                x: 2.50,
                y: 5.00,
                r: Math.PI / 2 * Math.random(),
                shape: gearbox.shapes.CIRCLE,
                radius: .30,
                mass: 1,
                damping: 0.1
            });

            world.makeObject(2, {
                x: 5.00,
                y: 5.00,
                r: Math.PI / 2 * Math.random(),
                shape: gearbox.shapes.CIRCLE,
                radius: .60,
                mass: 2,
                damping: 0.02
            });

            // Angular impulse target
            world.makeObject(3, {
                x: 7.50,
                y: 5.00,
                shape: gearbox.shapes.BOX,
                width: 1.0,
                height: 0.3,
                mass: 100,
                damping: 0.05,
                angularDamping: 0.05
            });
        }`,onInit:e=>{e.makeObject(1,{x:2.5,y:5,r:Math.PI/2*Math.random(),shape:t.shapes.CIRCLE,radius:.3,mass:1,damping:.1}),e.makeObject(2,{x:5,y:5,r:Math.PI/2*Math.random(),shape:t.shapes.CIRCLE,radius:.6,mass:2,damping:.02}),e.makeObject(3,{x:7.5,y:5,shape:t.shapes.BOX,width:1,height:.3,mass:100,damping:.05,angularDamping:.05})},onTickRaw:`(world, dt)=>{

            let obj1 = world.objectsById[1];
            let obj2 = world.objectsById[2];
            let obj3 = world.objectsById[3];

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
            
        }`,onTick:(e,n)=>{let o=e.objectsById[1],a=e.objectsById[2],s=e.objectsById[3],i=et;et+=n*5;let c=Math.floor(i),l=Math.floor(et);if(c!=l){if(l%2==0){let d=(5-o.y)*.2;d<.05&&d>-.05&&(d=2),o.applyImpulse(0,d),a.applyImpulse(0,d)}l%3==0&&s.applyAngularImpulse(2)}}}),new k({name:"Gravity",key:"gravity",description:["**Gravity** is a 2D acceleration vector that can be set on `World` objects. Gravity is automatically applied as a force to all objects in the world.","In this example, you can see the influence of **damping** on the net force vectors as objects fall through the sensor zone."].join(`

`),globalLines:["let nextId = 1;"],onInitRaw:`(world)=>{
            // Mind you that while we like to think of things in terms of SI units, the scale is arbitrary.
            // In this case, the canvas is 1000x1000 units. So it won't be very exciting to just apply a 10 m/s^2 gravity.
            world.setGravity(0, 10);

            // Objects will be created in the tick function.
        }`,onInit:e=>{e.setGravity(0,10)},onTickRaw:`(world, dt)=>{
            if(Math.random() < 0.05){
                let m = .1 + Math.random() * .4;
                world.makeObject(nextId++, {
                    x: 0,
                    y: 7.50,
                    r: Math.PI / 2 * Math.random(),
                    rs: (Math.random() - 0.5) * 5.00,
                    vx: 1.00 + Math.random() * 5.00,
                    vy: -8.00 - Math.random() * 8.00,
                    shape: gearbox.shapes.CIRCLE,
                    type: gearbox.bodyTypes.SENSOR,
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
        }`,onTick:(e,n)=>{if(Math.random()<.05){let o=.1+Math.random()*.4;e.makeObject(v++,{x:0,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:1+Math.random()*5,vy:-8-Math.random()*8,shape:t.shapes.CIRCLE,type:t.bodyTypes.SENSOR,radius:.2+o*.2,mass:o}),e.objectCount;let a=[];e.iterateObjects(s=>{s.y>10.5&&a.push(s)});for(let s of a)e.removeObject(s.id)}}}),new k({name:"Bounce",key:"bounce",description:["This example demonstrates **Restitution** (bounciness).","The central ball is configured with `restitution: 1.0`, meaning it loses no energy during collisions with the fixed walls, creating a perfectly elastic bounce."].join(`

`),onInitRaw:`(world)=>{
            // Gravity
            world.setGravity(0, 10);

            // Walls
            world.makeObject(1, {
                x: 5,
                y: 0,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 11,
                height: 2,
                
            });
            world.makeObject(2, {
                x: 5,
                y: 10,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 11,
                height: 2,
            });
            world.makeObject(3, {
                x: 0,
                y: 5,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 2,
                height: 11,
            });
            world.makeObject(4, {
                x: 10,
                y: 5,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 2,
                height: 11,
            });

            // Bouncy Ball
            world.makeObject(5, {
                x: 5,
                y: 2,
                vx: (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 1.5), 
                r: Math.PI / 2 * Math.random(),
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.RIGID_BODY,
                radius: .75,
                mass: 0.5,
                linearDamping: 0.0,
                rs: -2 + Math.random() * 4,

                // The most important part. 100% bouncy.
                restitution: 1,
            });
        }`,onInit:e=>{e.setGravity(0,10),e.makeObject(1,{x:5,y:0,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:11,height:2}),e.makeObject(2,{x:5,y:10,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:11,height:2}),e.makeObject(3,{x:0,y:5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:2,height:11}),e.makeObject(4,{x:10,y:5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:2,height:11}),e.makeObject(5,{x:5,y:2,vx:(Math.random()<.5?-1:1)*(1.5+Math.random()*1.5),r:Math.PI/2*Math.random(),shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:.75,mass:.5,linearDamping:0,rs:-2+Math.random()*4,restitution:1})},onTickRaw:`(world, dt)=>{
            // The engine does all the work. Nothing to do here!
        }`,onTick:(e,n)=>{}}),new k({name:"Collisions",key:"collisions",description:["Collisions are enabled for objects whose type is set to `RIGID_BODY`.","In this example we can see collisions between all of the different supported shape types:","- **CIRCLE**: Optimized circular collisions.","- **BOX**: Oriented bounding boxes with full rotation support.","- **AABB**: Axis-aligned bounding boxes.","- **POINT**: Zero-radius points that collide with larger shapes."].join(`

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

                world.makeObject(nextId++, {
                    x: 5.00 - dir * 5.00,
                    y: 7.50,
                    r: Math.PI / 2 * Math.random(),
                    rs: (Math.random() - 0.5) * 5.00,
                    vx: (2.00 + Math.random() * 5.00) * dir,
                    vy: -8.00 - Math.random() * 2.00,
                    shape: shape,
                    type: gearbox.bodyTypes.RIGID_BODY,
                    radius: (shape === gearbox.shapes.BOX || shape === gearbox.shapes.AABB) ? w : r,
                    // width: isBox ? r * 2 : 0,
                    height: (shape === gearbox.shapes.BOX || shape === gearbox.shapes.AABB) ? h : 0,
                    mass: mass, 
                    linearDamping: 0,
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
        }`,onTick:(e,n)=>{if(Math.random()<.08){let o=.1+Math.random()*.4,a=1;Math.random()<.5&&(a=-1);let s=.2+o*o*.8,i=.1+Math.random()*(s-.1),c=s*s/i,l=Math.random(),d,p=o;l<.1?(d=t.shapes.POINT,p=.01):l<.2?d=t.shapes.AABB:l<.6?d=t.shapes.BOX:d=t.shapes.CIRCLE,e.makeObject(v++,{x:5-a*5,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*a,vy:-8-Math.random()*2,shape:d,type:t.bodyTypes.RIGID_BODY,radius:d===t.shapes.BOX||d===t.shapes.AABB?c:s,height:d===t.shapes.BOX||d===t.shapes.AABB?i:0,mass:p,linearDamping:0}),e.objectCount;let r=[];e.iterateObjects(m=>{m.y>10.5&&r.push(m)});for(let m of r)e.removeObject(m.id)}}}),new k({name:"Friction",key:"friction",description:["**Friction** is applied as the last step of collision resolution. It handles both **static** and **dynamic** friction, applied as impulses at the point of contact.","Take note of the blue impulse vectors on the platforms which are present when dynamic friction is being applied.","### Scenarios","1. **Reverse Roll**: A circle spinning counter-clockwise transfers its angular momentum to linear momentum upon contact.","2. **Forward Roll**: A spinning circle with no linear momentum begins rolling forward due to friction.","3. **Slide**: A box slides across the platform and grinds to a halt.","4. **Static vs Kinetic**: Two boxes slide down a ramp. The left box has high static friction and stops; the right has no static friction and keeps sliding."].join(`

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
                world.makeObject(id, {
                    x: 4.5,
                    y: 2.5 * id - 0.5,
                    shape: gearbox.shapes.AABB,
                    type: gearbox.bodyTypes.FIXED_OBJECT,
                    width: 9.0,
                    height: 1,
                    mass: 1,
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
            world.makeObject(tiltedPlatformId, {
                x: 4.5,
                y: 9.7,
                r: 0.1,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 9.0,
                height: 1,
                    mass: 1,
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
            world.makeObject(rollingObj1Id, {
                x: 0,
                y: 1.0,
                vx: 5,
                rs: -8,
                kFriction: 0.8,
                sFriction: 0.5,
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.RIGID_BODY,
                radius: 0.5,
                mass: 0.5
            });

            gearbox.debug.addLabel({
                text: "Reverse",
                objectId: rollingObj1Id,
                position: 'above',
                fontSize: '10px Arial'
            });

            // Angular to linear rolling object.
            const rollingObj2Id = id++;
            world.makeObject(rollingObj2Id, {
                x: 0.5,
                y: 3.5,
                rs: 15,
                kFriction: 0.2,
                sFriction: 0.5,
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.RIGID_BODY,
                radius: 0.5,
                mass: 0.5
            });

            gearbox.debug.addLabel({
                text: "Forward",
                objectId: rollingObj2Id,
                position: 'above',
                fontSize: '10px Arial'
            });

            // Sliding box slows down.
            const slidingBoxId = id++;
            world.makeObject(slidingBoxId, {
                x: 0.5,
                y: 6,
                vx: 7,
                kFriction: 1.2,
                sFriction: 0.5,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                width: 1,
                height: 1,
                mass: 0.5
            });

            gearbox.debug.addLabel({
                text: "Slide",
                objectId: slidingBoxId,
                position: 'above',
                fontSize: '10px Arial'
            });

            // Sliding box stops due to static friction.
            const staticBoxId = id++;
            world.makeObject(staticBoxId, {
                x: 0.5,
                y: 8.0,
                vx: 0.5,
                kFriction: 0.7,
                sFriction: 0.7,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                width: 1,
                height: .5,
                mass: 0.5
            });

            gearbox.debug.addLabel({
                text: "Static",
                objectId: staticBoxId,
                position: 'above',
                fontSize: '10px Arial'
            });

            // Another sliding box but with no static friction.
            const kineticBoxId = id++;
            world.makeObject(kineticBoxId, {
                x: 1.6,
                y: 8.0,
                vx: 0.5,
                kFriction: 0.01,
                sFriction: 0.0,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                width: 1,
                height: .5,
                mass: 0.5
            });

            gearbox.debug.addLabel({
                text: "Kinetic",
                objectId: kineticBoxId,
                position: 'above',
                fontSize: '10px Arial'
            });
        }`,onInit:e=>{e.setGravity(0,10);let n=1;const o=["Linear to angular momentum transfer.","Angular to linear momentum transfer.","Slide to halt."];for(;n<=3;n++)e.makeObject(n,{x:4.5,y:2.5*n-.5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:9,height:1,mass:1}),t.debug.addLabel({text:o[n-1],x:4.5,y:2.5*n-1.2,fontSize:"20px Arial",color:"#00f2ff",position:"above"});const a=n++;e.makeObject(a,{x:4.5,y:9.7,r:.1,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:9,height:1,mass:1}),t.debug.addLabel({text:"High static vs no static friction.",x:4.5,y:9,fontSize:"20px Arial",color:"#00f2ff",position:"above"});const s=n++;e.makeObject(s,{x:0,y:1,vx:5,rs:-8,kFriction:.8,sFriction:.5,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:.5,mass:.5}),t.debug.addLabel({text:"Reverse",objectId:s,position:"above",fontSize:"10px Arial"});const i=n++;e.makeObject(i,{x:.5,y:3.5,rs:15,kFriction:.2,sFriction:.5,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:.5,mass:.5}),t.debug.addLabel({text:"Forward",objectId:i,position:"above",fontSize:"10px Arial"});const c=n++;e.makeObject(c,{x:.5,y:6,vx:7,kFriction:1.2,sFriction:.5,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:1,mass:.5}),t.debug.addLabel({text:"Slide",objectId:c,position:"above",fontSize:"10px Arial"});const l=n++;e.makeObject(l,{x:.5,y:8,vx:.5,kFriction:.7,sFriction:.7,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:.5,mass:.5}),t.debug.addLabel({text:"Static",objectId:l,position:"above",fontSize:"10px Arial"});const d=n++;e.makeObject(d,{x:1.6,y:8,vx:.5,kFriction:.01,sFriction:0,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:.5,mass:.5}),t.debug.addLabel({text:"Kinetic",objectId:d,position:"above",fontSize:"10px Arial"})},onTickRaw:`(world, dt)=>{

        }`,onTick:(e,n)=>{}}),new k({name:"Collision Masks",key:"collision-masks",description:["**Collision masks** allow you to selectively enable or disable collisions between different groups of objects using bitwise logic.","In this example:","- **Blue objects**: Only collide with blue platforms and other blue objects.","- **Red objects**: Only collide with red platforms and other red objects.","- **Green objects**: Collide with **everything**.","This is implemented using `categoryBits` and `maskBits` properties."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 10);
            gearbox.debug.showForceVectors = false;
            
            // Platform Categories: 0x1 (Blue), 0x2 (Red), 0x4 (Green)
            
            // Blue Platform (Collides with category 1 and 4)
            const bluePlatId = nextId++;
            world.makeObject(bluePlatId, {
                x: 2.5, y: 8,
                width: 4, height: 0.5,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                categoryBits: 0x1,
                maskBits: 0x1 | 0x4,
                color: '#00f2ff'
            });
            gearbox.debug.addLabel({ text: "Collides with Blue & Green", objectId: bluePlatId, color: '#00f2ff', position: 'below' });

            // Red Platform (Collides with category 2 and 4)
            const redPlatId = nextId++;
            world.makeObject(redPlatId, {
                x: 7.5, y: 8,
                width: 4, height: 0.5,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                categoryBits: 0x2,
                maskBits: 0x2 | 0x4,
                color: '#ff4444'
            });
            gearbox.debug.addLabel({ text: "Collides with Red & Green", objectId: redPlatId, color: '#ff4444', position: 'below' });

            // Universal Platform (Collides with everything: 0x1 | 0x2 | 0x4)
            const universalPlatId = nextId++;
            world.makeObject(universalPlatId, {
                x: 5, y: 4,
                width: 2, height: 0.5,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                categoryBits: 0x4,
                maskBits: 0x7, // 1 | 2 | 4
                color: '#44ff44'
            });
            gearbox.debug.addLabel({ text: "Collides with All", objectId: universalPlatId, color: '#44ff44', position: 'below' });
        }`,onInit:e=>{e.setGravity(0,10),t.debug.showForceVectors=!1;const n=v++;e.makeObject(n,{x:2.5,y:8,width:4,height:.5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,categoryBits:1,maskBits:5,color:"#00f2ff"}),t.debug.addLabel({text:"Collides with Blue & Green",objectId:n,color:"#00f2ff",position:"below"});const o=v++;e.makeObject(o,{x:7.5,y:8,width:4,height:.5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,categoryBits:2,maskBits:6,color:"#ff4444"}),t.debug.addLabel({text:"Collides with Red & Green",objectId:o,color:"#ff4444",position:"below"});const a=v++;e.makeObject(a,{x:5,y:4,width:2,height:.5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,categoryBits:4,maskBits:7,color:"#44ff44"}),t.debug.addLabel({text:"Collides with All",objectId:a,color:"#44ff44",position:"below"})},onTickRaw:`(world, dt)=>{
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

                const obj = world.makeObject(id, {
                    x: 2 + Math.random() * 6,
                    y: 0,
                    radius: 0.3,
                    shape: gearbox.shapes.CIRCLE,
                    type: gearbox.bodyTypes.RIGID_BODY,
                    mass: 1,
                    categoryBits: cat,
                    maskBits: mask,
                    color: color
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
            world.iterateObjects(o=>{
                if(o.y > 11) toRemove.push(o);
            });
            for(let o of toRemove) world.removeObject(o.id);
        }`,onTick:(e,n)=>{if(Math.random()<.05){const a=v++,s=Math.floor(Math.random()*3);let i,c,l;s===0?(i="#00f2ff",c=1,l=5):s===1?(i="#ff4444",c=2,l=6):(i="#44ff44",c=4,l=7),e.makeObject(a,{x:2+Math.random()*6,y:0,radius:.3,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,mass:1,categoryBits:c,maskBits:l,color:i}),t.debug.addLabel({text:`Cat:0x${c.toString(16)} Mask:0x${l.toString(16)}`,objectId:a,color:i,position:"above",fontSize:"10px Arial"})}let o=[];e.iterateObjects(a=>{a.y>11&&o.push(a)});for(let a of o)e.removeObject(a.id)}}),new k({name:"Object Types",key:"object-types",description:["This example showcases the four fundamental object types in **Gearbox2D** and how they interact:","1. **Fixed Objects** (Gray): Immovable platforms with infinite mass. They form the static environment.","2. **Kinematic Objects** (Purple): Move via velocity but are unaffected by forces. They can 'push' other objects but are never pushed back.","3. **Rigid Bodies** (Colorful): Fully dynamic objects affected by gravity, forces, and collisions.","4. **Sensors** (Green Zone): Detect overlaps without causing a physical response. Here, a sensor acts as a **Recycling Zone** to remove objects."].join(`

`),onInitRaw:`(world) => {
            world.clear();
            world.setGravity(0, 10);
            nextId = 1;

            // 1. Fixed Objects: The Foundation
            // Ground
            world.makeObject(nextId++, {
                x: 5, y: 9.7,
                width: 8, height: 0.6,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#444"
            });
            
            // Side barriers
            world.makeObject(nextId++, { x: 1, y: 7, width: 0.2, height: 6, shape: gearbox.shapes.BOX, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#444" });
            world.makeObject(nextId++, { x: 9, y: 7, width: 0.2, height: 6, shape: gearbox.shapes.BOX, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#444" });

            // 2. Kinematic Objects: The Machinery
            // A rotating center piece
            const rotor = world.makeObject(nextId++, {
                x: 5, y: 4,
                width: 3.5, height: 0.3,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.KINEMATIC_OBJECT,
                color: "#a0f",
                rs: 1.5 // Radians per second
            });
            gearbox.debug.addLabel({ text: "Kinematic Rotor", objectId: rotor.id, position: "above", color: "#a0f" });

            // A moving side platform
            const elevator = world.makeObject(nextId++, {
                x: 2.5, y: 7,
                width: 1.5, height: 0.3,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.KINEMATIC_OBJECT,
                color: "#a0f",
                vx: 1.0
            });
            (world as any).elevator = elevator;
            gearbox.debug.addLabel({ text: "Kinematic Elevator", objectId: elevator.id, position: "above", color: "#a0f" });

            // 4. Sensor: The Recycling Zone
            const recycler = world.makeObject(nextId++, {
                x: 5, y: 8.8,
                width: 4, height: 1.2,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.SENSOR,
                color: "rgba(0, 255, 100, 0.15)",
                wantsEvents: true
            });
            gearbox.debug.addLabel({ text: "Sensor Recycler", objectId: recycler.id, position: "on-top", color: "#4f4" });

            // Store the recycler ID to identify it in collisions
            (world as any).recyclerId = recycler.id;
            (world as any).toRemove = new Set();

            world.onCollisionStart = (idA, idB) => {
                const rid = (world as any).recyclerId;
                const otherId = idA === rid ? idB : (idB === rid ? idA : null);
                
                if (otherId !== null) {
                    const other = world.getObjectById(otherId);
                    if (other && other.type === gearbox.bodyTypes.RIGID_BODY) {
                        (world as any).toRemove.add(otherId);
                        // Visual cue: change color before removal
                        other.color = "#4f4";
                    }
                }
            };
        }`,onInit:e=>{e.clear(),e.setGravity(0,10),v=1,e.makeObject(v++,{x:5,y:9.7,width:8,height:.6,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}),e.makeObject(v++,{x:1,y:7,width:.2,height:6,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}),e.makeObject(v++,{x:9,y:7,width:.2,height:6,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,color:"#444"});const n=e.makeObject(v++,{x:5,y:4,width:3.5,height:.3,shape:t.shapes.BOX,type:t.bodyTypes.KINEMATIC_OBJECT,color:"#a0f",rs:1.5});t.debug.addLabel({text:"Kinematic Rotor",objectId:n.id,position:"above",color:"#a0f"});const o=e.makeObject(v++,{x:2.5,y:7,width:1.5,height:.3,shape:t.shapes.BOX,type:t.bodyTypes.KINEMATIC_OBJECT,color:"#a0f",vx:1});e.elevator=o,t.debug.addLabel({text:"Kinematic Elevator",objectId:o.id,position:"above",color:"#a0f"});const a=e.makeObject(v++,{x:5,y:8.8,width:4,height:1.2,shape:t.shapes.BOX,type:t.bodyTypes.SENSOR,color:"rgba(0, 255, 100, 0.15)",wantsEvents:!0});t.debug.addLabel({text:"Sensor Recycler",objectId:a.id,position:"on-top",color:"#4f4"}),e.recyclerId=a.id,e.toRemove=new Set,e.onCollisionStart=(s,i)=>{const c=e.recyclerId,l=s===c?i:i===c?s:null;if(l!==null){const d=e.getObjectById(l);d&&d.type===t.bodyTypes.RIGID_BODY&&(e.toRemove.add(l),d.color="#4f4")}}},onTickRaw:`(world, dt) => {
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
                
                world.makeObject(nextId++, {
                    x, y: 0.5,
                    shape: isCircle ? gearbox.shapes.CIRCLE : gearbox.shapes.BOX,
                    radius: 0.25,
                    width: 0.5, height: 0.5,
                    mass: 0.5 + Math.random() * 1.0,
                    type: gearbox.bodyTypes.RIGID_BODY,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    restitution: 0.3
                });
            }

            // Cleanup recycled objects
            const toRemove = (world as any).toRemove;
            if (toRemove && toRemove.size > 0) {
                for (const id of toRemove) {
                    if (world.getObjectById(id)) {
                        world.removeObject(id);
                    }
                }
                toRemove.clear();
            }

            // Global bounds cleanup
            let outOfBounds = [];
            world.iterateObjects(obj => {
                if (obj.y > 11 || obj.y < -5 || obj.x > 11 || obj.x < -1) {
                    if (obj.type === gearbox.bodyTypes.RIGID_BODY) {
                        outOfBounds.push(obj.id);
                    }
                }
            });
            for (const id of outOfBounds) world.removeObject(id);
        }`,onTick:(e,n)=>{const o=e.elevator;if(o&&(o.x>7.5&&(o.vx=-1.5),o.x<2.5&&(o.vx=1.5)),e.stepCount%20===0){const i=["#ff4444","#4444ff","#ffff44","#ff44ff","#44ffff"],c=Math.random()>.5,l=3+Math.random()*4;e.makeObject(v++,{x:l,y:.5,shape:c?t.shapes.CIRCLE:t.shapes.BOX,radius:.25,width:.5,height:.5,mass:.5+Math.random()*1,type:t.bodyTypes.RIGID_BODY,color:i[Math.floor(Math.random()*i.length)],restitution:.3})}const a=e.toRemove;if(a&&a.size>0){for(const i of a)e.getObjectById(i)&&e.removeObject(i);a.clear()}let s=[];e.iterateObjects(i=>{(i.y>11||i.y<-5||i.x>11||i.x<-1)&&i.type===t.bodyTypes.RIGID_BODY&&s.push(i.id)});for(const i of s)e.removeObject(i)},onCleanup:e=>{e.onCollisionStart=void 0,delete e.elevator,delete e.recyclerId,delete e.toRemove}})];let b=1,ie=[],ge=null,z=null,Ie=null,V=null,W=null,ke=0,Be=0;const Zt=[new k({name:"Simple Hinge",key:"simple-hinge",description:["A single `BOX` object attached to a `FIXED_OBJECT` by a **Hinge Joint** constraint.","The hinge allows rotation around a single point while preventing all linear relative motion. In this case, it creates a simple gravity-driven pendulum."].join(`

`),onInitRaw:`(world) => {
            nextId = 1;
            const anchor = world.makeObject(nextId++, {
                x: 5,
                y: 3,
                shape: gearbox.shapes.BOX,
                width: 1,
                height: 1,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#ff4444"
            });

            const pendulum = world.makeObject(nextId++, {
                x: 8,
                y: 3,
                shape: gearbox.shapes.BOX,
                width: 4,
                height: 0.5,
                mass: 0.1,
                color: "#44ff44"
            });

            world.createHingeJoint(nextId++, anchor, pendulum, {
                worldAnchor: { x: 5, y: 3 }
            });

            world.setGravity(0, 9.81);
        }`,onInit:e=>{b=1;const n=e.makeObject(b++,{x:5,y:3,shape:t.shapes.BOX,width:1,height:1,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444"}),o=e.makeObject(b++,{x:8,y:3,shape:t.shapes.BOX,width:4,height:.5,mass:.1,color:"#44ff44"});e.createHingeJoint(b++,n,o,{worldAnchor:{x:5,y:3}}),e.setGravity(0,9.81)}}),new k({name:"Breakable Joint",key:"breakable-joint",description:["This demo showcases **Joint Reaction Forces** and dynamic joint removal.","1. A ball is suspended by a **Hinge Joint**. Its mass increases until the reaction force exceeds a threshold, snapping the joint.","2. The ball falls onto a bridge made of `SpringJoint` segments, which also have breaking thresholds.","You can visualize the stress on the joints by enabling **Force Vectors** in the debug settings."].join(`

`),onInitRaw:`(world) => {
            nextId = 1;
            gearbox.debug.showAabbs = false;
            bridgeJoints = [];
            breakableJoint = null;
            massObject = null;

            // 1. Suspension System (higher up and smaller)
            const anchor = world.makeObject(nextId++, {
                x: 5,
                y: 1,
                shape: gearbox.shapes.CIRCLE,
                radius: 0.2,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#ff4444"
            });

            massObject = world.makeObject(nextId++, {
                x: 5,
                y: 2.5,
                shape: gearbox.shapes.CIRCLE,
                radius: 0.4,
                mass: 0.05,
                color: "#888888"
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

            const bridgeAnchorLeft = world.makeObject(nextId++, {
                x: startX - segmentWidth / 2,
                y: bridgeY,
                shape: gearbox.shapes.BOX,
                width: segmentWidth,
                height: 0.5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            });

            const bridgeAnchorRight = world.makeObject(nextId++, {
                x: endX + segmentWidth / 2,
                y: bridgeY,
                shape: gearbox.shapes.BOX,
                width: segmentWidth,
                height: 0.5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            });

            let prevBody = bridgeAnchorLeft;
            for (let i = 0; i < segments; i++) {
                const segmentBody = world.makeObject(nextId++, {
                    x: startX + i * segmentWidth + segmentWidth / 2,
                    y: bridgeY,
                    shape: gearbox.shapes.BOX,
                    width: segmentWidth * 0.9,
                    height: segmentHeight,
                    mass: 0.2, // Slightly heavier for stability
                    color: "#cd853f",
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

            world.setGravity(0, 10);
            gearbox.debug.showForceVectors = true;
            
            // Apply a side force to make it swing
            massObject.applyImpulse(0.2, 0);
        }`,onInit:e=>{b=1,t.debug.showAabbs=!1,ie=[],ge=null,z=null;const n=e.makeObject(b++,{x:5,y:1,shape:t.shapes.CIRCLE,radius:.2,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444"});z=e.makeObject(b++,{x:5,y:2.5,shape:t.shapes.CIRCLE,radius:.4,mass:.05,color:"#888888"}),ge=e.createHingeJoint(b++,n,z,{worldAnchor:{x:5,y:1}});const o=2,a=8,s=6,i=12,c=(a-o)/i,l=.2,d=e.makeObject(b++,{x:o-c/2,y:s,shape:t.shapes.BOX,width:c,height:.5,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}),p=e.makeObject(b++,{x:a+c/2,y:s,shape:t.shapes.BOX,width:c,height:.5,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"});let r=d;for(let h=0;h<i;h++){const u=e.makeObject(b++,{x:o+h*c+c/2,y:s,shape:t.shapes.BOX,width:c*.9,height:l,mass:.2,color:"#cd853f",categoryBits:4,maskBits:-5}),g=e.createSpringJoint(b++,r,u,{worldAnchor:{x:o+h*c,y:s},frequencyHz:4,dampingRatio:1});ie.push(g),r=u}const m=e.createSpringJoint(b++,r,p,{worldAnchor:{x:a,y:s},frequencyHz:4,dampingRatio:1});ie.push(m),e.setGravity(0,10),t.debug.showForceVectors=!0,z.applyImpulse(.2,0)},onTickRaw:`(world, dt) => {
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
        }`,onTick:(e,n)=>{if(z&&(z.mass+=n*3,t.debug.removeObjectLabels(z.id),t.debug.addLabel({text:`Mass: ${z.mass.toFixed(2)}kg`,objectId:z.id,position:"above",color:"#fff"})),ge){const o=ge.reactionForce;Math.sqrt(o.x*o.x+o.y*o.y)>150&&(e.removeJoint(ge.id),ge=null)}if(ie.length>0)for(let o=ie.length-1;o>=0;o--){const a=ie[o],s=a.reactionForce;Math.sqrt(s.x*s.x+s.y*s.y)>600&&(e.removeJoint(a.id),ie.splice(o,1))}}}),new k({name:"Gear Train",key:"gear-train",description:["A sequence of gears connected using the `GearJoint` constraint.","Each gear's motion is constrained by the previous one based on a **gear ratio** (calculated here by the relative radii).","A drive gear at the start receives a constant low torque, which is then propagated through the entire train with mechanical advantage."].join(`

`),onInitRaw:`(world) => {
            nextId = 1;
            const startX = 2;
            const y = 5;
            const numGears = 5;
            const spacing = 1.5;
            
            const staticBody = world.makeObject(nextId++, {
                x: 5, y: 5,
                shape: gearbox.shapes.AABB,
                width: 6.2,
                height: 0.2,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#888",
                maskBits: 0 // Don't collide with gears
            });

            let prevHinge = null;
            engineHub = null; // Reuse engineHub variable for the drive gear

            for (let i = 0; i < numGears; i++) {
                const size = (i % 2 === 0) ? 1.0 : 0.5;
                const gear = world.makeObject(nextId++, {
                    x: startX + i * spacing,
                    y: y,
                    shape: gearbox.shapes.CIRCLE,
                    radius: size,
                    mass: size,
                    color: \`hsl(\${i * 60}, 70%, 60%)\`
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
        }`,onInit:e=>{b=1;const n=2,o=5,a=5,s=1.5,i=e.makeObject(b++,{x:5,y:5,shape:t.shapes.AABB,width:6.2,height:.2,type:t.bodyTypes.FIXED_OBJECT,color:"#888",maskBits:0});let c=null;Ie=null;for(let l=0;l<a;l++){const d=l%2===0?1:.5,p=e.makeObject(b++,{x:n+l*s,y:o,shape:t.shapes.CIRCLE,radius:d,mass:d,color:`hsl(${l*60}, 70%, 60%)`}),r=e.createHingeJoint(b++,i,p,{worldAnchor:{x:n+l*s,y:o}});if(l===0)Ie=p;else{const h=((l-1)%2===0?1:.5)/d;e.createGearJoint(b++,c,r,h)}c=r}},onTickRaw:`(world, dt) => {
            if (engineHub) {
                // Apply a persistent but relatively low angular impulse to the drive gear
                if(Math.abs(engineHub.rs) < 0.9) {
                    engineHub.applyAngularImpulse(0.01);
                }
            }
        }`,onTick:(e,n)=>{Ie&&Math.abs(Ie.rs)<.9&&Ie.applyAngularImpulse(.01)}}),new k({name:"Distance Ropes",key:"distance-ropes",description:["Demonstrates the `DistanceJoint`, which maintains a fixed distance between two points on two different bodies.","A rotating drum has multiple triple-link chains hanging from it. Each link is connected by a `DistanceJoint` with a specified length, simulating a non-stretchy rope or chain."].join(`

`),onInitRaw:`(world) => {
            gearbox.debug.showAabbs = false;
            nextId = 1;
            const cx = 5;
            const cy = 5;
            const drumRadius = 4;

            // The Drum Hub (fixed rotation center)
            const hub = world.makeObject(nextId++, {
                x: cx,
                y: cy,
                shape: gearbox.shapes.CIRCLE,
                radius: 0.5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#ff4444"
            });

            // The rotating drum (structure only)
            drum = world.makeObject(nextId++, {
                x: cx,
                y: cy,
                shape: gearbox.shapes.CIRCLE,
                radius: drumRadius,
                mass: 100,
                color: "rgba(255, 255, 255, 0.05)",
                maskBits: 0,
                angularDamping: 0.5 // Add some damping to stabilize
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
                const shape1 = world.makeObject(nextId++, {
                    x: shape1X,
                    y: shape1Y,
                    shape: i % 2 === 0 ? gearbox.shapes.BOX : gearbox.shapes.CIRCLE,
                    width: 0.5,
                    height: 0.5,
                    radius: 0.25,
                    mass: 0.5,
                    color: \`hsl(\${(i * 360) / numChains}, 70%, 60%)\`
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
                const shape2 = world.makeObject(nextId++, {
                    x: shape2X,
                    y: shape2Y,
                    shape: (i + 1) % 2 === 0 ? gearbox.shapes.BOX : gearbox.shapes.CIRCLE,
                    width: 0.5,
                    height: 0.5,
                    radius: 0.25,
                    mass: 0.5,
                    color: \`hsl(\${(i * 360) / numChains}, 70%, 50%)\`
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
                const shape3 = world.makeObject(nextId++, {
                    x: shape3X,
                    y: shape3Y,
                    shape: (i + 2) % 2 === 0 ? gearbox.shapes.BOX : gearbox.shapes.CIRCLE,
                    width: 0.5,
                    height: 0.5,
                    radius: 0.25,
                    mass: 0.5,
                    color: \`hsl(\${(i * 360) / numChains}, 70%, 40%)\`
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
        }`,onInit:e=>{t.debug.showAabbs=!1,b=1;const n=5,o=5,a=4,s=e.makeObject(b++,{x:n,y:o,shape:t.shapes.CIRCLE,radius:.5,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444"});V=e.makeObject(b++,{x:n,y:o,shape:t.shapes.CIRCLE,radius:a,mass:100,color:"rgba(255, 255, 255, 0.05)",maskBits:0,angularDamping:.5}),e.createHingeJoint(b++,s,V,{worldAnchor:{x:n,y:o}});const i=8,c=3.8,l=.8,d=()=>({x:(Math.random()-.5)*.3,y:(Math.random()-.5)*.3});for(let p=0;p<i;p++){const r=p/i*Math.PI*2,m=n+Math.cos(r)*c,h=o+Math.sin(r)*c,u=m-Math.cos(r)*.5,g=h-Math.sin(r)*.5,y=e.makeObject(b++,{x:u,y:g,shape:p%2===0?t.shapes.BOX:t.shapes.CIRCLE,width:.5,height:.5,radius:.25,mass:.5,color:`hsl(${p*360/i}, 70%, 60%)`}),w=V.worldToLocal({x:m,y:h});e.createDistanceJoint(b++,V,y,{anchorA:w,anchorB:d(),length:l});const I=u-Math.cos(r)*l,B=g-Math.sin(r)*l,T=e.makeObject(b++,{x:I,y:B,shape:(p+1)%2===0?t.shapes.BOX:t.shapes.CIRCLE,width:.5,height:.5,radius:.25,mass:.5,color:`hsl(${p*360/i}, 70%, 50%)`});e.createDistanceJoint(b++,y,T,{anchorA:d(),anchorB:d(),length:l});const C=I-Math.cos(r)*l,R=B-Math.sin(r)*l,H=e.makeObject(b++,{x:C,y:R,shape:(p+2)%2===0?t.shapes.BOX:t.shapes.CIRCLE,width:.5,height:.5,radius:.25,mass:.5,color:`hsl(${p*360/i}, 70%, 40%)`});e.createDistanceJoint(b++,T,H,{anchorA:d(),anchorB:d(),length:l})}e.setGravity(0,9.81),V.rs=.2},onTickRaw:`(world, dt) => {
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
        }`,onTick:(e,n)=>{if(V){const o=Date.now()/1e3,a=o%12;let s=0,i=2;a<4?(s=1.2,i=4):a<6?(s=0,i=1):a<10?(s=Math.sin(o*4)*2,i=8):s=0;const c=s-V.rs;Math.abs(c)>.05&&V.applyAngularImpulse(c*i)}}}),new k({name:"Spring Belt",key:"spring-belt",description:["A chain of shapes connected by `SpringJoint` constraints, forming a belt around a rotating high-friction pulley.","The `SpringJoint` acts like a dampened harmonic oscillator, pulling objects together with a force proportional to their distance and frequency. The belt stretches and contracts as it interacts with the central rotor."].join(`

`),onInitRaw:`(world) => {
            gearbox.debug.showAabbs = false;
            nextId = 1;
            const cx = 5;
            const cy = 3;
            const innerRadius = 2.5;
            const outerRadius = 3.5;

            // Hub (fixed center)
            const hub = world.makeObject(nextId++, {
                x: cx,
                y: cy,
                shape: gearbox.shapes.CIRCLE,
                radius: 0.1,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#666666",
                maskBits: 0
            });

            // Central rotating body (Pulley)
            rotator = world.makeObject(nextId++, {
                x: cx,
                y: cy,
                rs: 2.5,
                shape: gearbox.shapes.CIRCLE,
                radius: innerRadius,
                type: gearbox.bodyTypes.RIGID_BODY,
                mass: 10,
                color: "#888888",
                sFriction: 1.0,
                kFriction: 1.0,
                angularDamping: 0.1
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

                const shape = world.makeObject(nextId++, {
                    x: sx,
                    y: sy,
                    shape: i % 2 === 0 ? gearbox.shapes.BOX : gearbox.shapes.CIRCLE,
                    width: 0.6,
                    height: 0.6,
                    radius: 0.3,
                    mass: 1.5, // Heavier for more stretch
                    color: \`hsl(\${(i * 360) / numShapes}, 70%, 60%)\`,
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
        }`,onInit:e=>{t.debug.showAabbs=!1,b=1;const n=5,o=3,a=2.5,s=3.5,i=e.makeObject(b++,{x:n,y:o,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#666666",maskBits:0});W=e.makeObject(b++,{x:n,y:o,rs:2.5,shape:t.shapes.CIRCLE,radius:a,type:t.bodyTypes.RIGID_BODY,mass:10,color:"#888888",sFriction:1,kFriction:1,angularDamping:.1}),e.createHingeJoint(b++,i,W,{worldAnchor:{x:n,y:o}});const c=16,l=[];for(let d=0;d<c;d++){const p=d/c*Math.PI*2,r=n+Math.cos(p)*s,m=o+Math.sin(p)*s,h=e.makeObject(b++,{x:r,y:m,shape:d%2===0?t.shapes.BOX:t.shapes.CIRCLE,width:.6,height:.6,radius:.3,mass:1.5,color:`hsl(${d*360/c}, 70%, 60%)`,sFriction:.999,kFriction:.99});l.push(h)}for(let d=0;d<c;d++){const p=l[d],r=l[(d+1)%c],m=r.x-p.x,h=r.y-p.y,u=Math.sqrt(m*m+h*h);e.createSpringJoint(b++,p,r,{length:u*1.1,frequencyHz:5,dampingRatio:.2})}e.setGravity(0,9.81)},onTickRaw:`(world, dt) => {
            if (rotator) {
                // Apply a persistent angular impulse until we reach target speed
                if(Math.abs(rotator.rs) < 2.5) {
                    rotator.applyAngularImpulse(1.0);
                }
            }
        }`,onTick:(e,n)=>{W&&Math.abs(W.rs)<2.5&&W.applyAngularImpulse(1)}}),new k({name:"Soft Body Ball",key:"soft-body",description:["A collection of `CIRCLE` objects connected by a network of `SpringJoint` constraints to form a squishy, deformable ball.","The ball features a central core (axel) connected to an outer ring of nodes. This setup simulates **Soft Body Dynamics** using a mass-spring system.","Persistent random impulses are applied to the core to keep the ball moving and demonstrate its elasticity."].join(`

`),onInitRaw:`(world) => {
            gearbox.debug.showAabbs = false;
            nextId = 1;
            const cx = 5;
            const cy = 3;
            const radius = 2.0;
            const segments = 12;
            const points = [];
            const axelRadius = 0.2;

            // Center point (Axel)
            const center = world.makeObject(nextId++, {
                x: cx,
                y: cy,
                shape: gearbox.shapes.CIRCLE,
                radius: axelRadius,
                mass: 2.0, // Heavier axel for more stability
                color: "#ff8888",
                sFriction: 0.9,
                kFriction: 0.9
            });
            rotator = center;
            currentImpulse = 0;
            impulseTimer = -30; // 0.5s delay at 60fps to let it hit the ground before spinning up

            // Outer ring
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const px = cx + Math.cos(angle) * radius;
                const py = cy + Math.sin(angle) * radius;

                const p = world.makeObject(nextId++, {
                    x: px,
                    y: py,
                    shape: gearbox.shapes.CIRCLE,
                    radius: 0.2,
                    mass: 0.5,
                    color: "#8888ff",
                    sFriction: 0.9,
                    kFriction: 0.9
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
            world.makeObject(nextId++, {
                x: 5,
                y: 10,
                shape: gearbox.shapes.BOX,
                width: 15,
                height: 2,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa",
                sFriction: 0.9,
                kFriction: 0.9
            });

            // Barriers to keep the ball from rolling off - taller and thicker
            world.makeObject(nextId++, {
                x: -3.5,
                y: 4.25,
                shape: gearbox.shapes.BOX,
                width: 2.0,
                height: 10,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            });
            world.makeObject(nextId++, {
                x: 13.5,
                y: 4.25,
                shape: gearbox.shapes.BOX,
                width: 2.0,
                height: 10,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            });

            world.setGravity(0, 9.81);
        }`,onInit:e=>{t.debug.showAabbs=!1,b=1;const n=5,o=3,a=2,s=12,i=[],c=.2,l=e.makeObject(b++,{x:n,y:o,shape:t.shapes.CIRCLE,radius:c,mass:2,color:"#ff8888",sFriction:.9,kFriction:.9});W=l,ke=0,Be=-30;for(let d=0;d<s;d++){const p=d/s*Math.PI*2,r=n+Math.cos(p)*a,m=o+Math.sin(p)*a,h=e.makeObject(b++,{x:r,y:m,shape:t.shapes.CIRCLE,radius:.2,mass:.5,color:"#8888ff",sFriction:.9,kFriction:.9});i.push(h),e.createSpringJoint(b++,l,h,{anchorA:{x:Math.cos(p)*c,y:Math.sin(p)*c},length:a-c,frequencyHz:4,dampingRatio:.5}),d>0&&e.createSpringJoint(b++,i[d-1],h,{length:2*a*Math.sin(Math.PI/s),frequencyHz:4,dampingRatio:.5})}e.createSpringJoint(b++,i[s-1],i[0],{length:2*a*Math.sin(Math.PI/s),frequencyHz:4,dampingRatio:.5}),e.makeObject(b++,{x:5,y:10,shape:t.shapes.BOX,width:15,height:2,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa",sFriction:.9,kFriction:.9}),e.makeObject(b++,{x:-3.5,y:4.25,shape:t.shapes.BOX,width:2,height:10,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}),e.makeObject(b++,{x:13.5,y:4.25,shape:t.shapes.BOX,width:2,height:10,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}),e.setGravity(0,9.81)},onTickRaw:`(world, dt) => {
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
        }`,onTick:(e,n)=>{W&&(Be<=0&&(Math.random()<.02?(ke=(Math.random()-.5)*3,Be=40+Math.random()*80):ke=0),Be>0&&(W.applyAngularImpulse(ke),W.applyImpulse(ke*.1,0),Be--))}})];let tt=0,Oe=1;const Qt=[new k({name:"Sleep and Islands",key:"sleep-and-islands",description:["**Sleep** optimization in **Gearbox2D** uses a movement-based heuristic computed during the kinematics step.","Instead of rebuilding a complex global island data structure each tick, each object tracks its own local contacts. When an object wakes up (due to a force or collision), it automatically wakes its neighbors.","This provides the performance benefits of **Islands** with significantly lower overhead."].join(`

`),globalLines:["let simulationTime = 0;","let nextId = 1;"],onInitRaw:`(world)=>{
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
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                mass: 2, 
            });
        }`,onInit:e=>{e.setGravity(0,10),tt=3,Oe=0,e.makeObject(Oe++,{x:5,y:8.5,width:20,height:1,vx:0,vy:0,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,mass:2})},onTickRaw:`(world, dt)=>{
            const nObjects = 10;
            simulationTime += dt*2;
            let numbSeconds = Math.floor(simulationTime / 3);
            if(numbSeconds > nextId){
                if(nextId < nObjects){
                    world.makeObject(nextId++, {
                        x: 5,
                        y: 0,
                        r: (Math.random() - 0.5) * 0.1, // Add small random rotation
                        width: 6,
                        height: 0.5,
                        vx: 0,
                        vy: 0,
                        shape: gearbox.shapes.BOX,
                        type: gearbox.bodyTypes.RIGID_BODY,
                        mass: 0.2, 
                        sFriction: 10,
                        kFriction: 10,
                    });
                }
            }
        }`,onTick:(e,n)=>{tt+=n*2,Math.floor(tt/3)>Oe&&Oe<10&&e.makeObject(Oe++,{x:5,y:0,r:(Math.random()-.5)*.1,width:6,height:.5,vx:0,vy:0,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,mass:.2,sFriction:10,kFriction:10})}}),new k({name:"Shrink Wrap",key:"shrink-wrap",description:["Objects that are put to **Sleep** have their **AABBs** 'shrink-wrapped' to their exact shape bounds.","This provides a slight performance boost during broad-phase collision detection by reducing false positives in the BVH tree for stationary objects."].join(`

`),globalLines:[],onInitRaw:`(world)=>{

            world.makeObject(1, {
                x: 10,
                y: 10,
                radius: 1,
                vx: -5.0,
                vy: -5.0,
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.RIGID_BODY,
                mass: 0.2, 
                restitution: 0,
            });
            world.makeObject(2, {
                x: 0,
                y: 0,
                radius: 1,
                vx: 5.0,
                vy: 5.0,
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.RIGID_BODY,
                mass: 0.2, 
                restitution: 0,
            });
        }`,onInit:e=>{e.makeObject(1,{x:10,y:10,radius:1,vx:-5,vy:-5,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,mass:.2,restitution:0}),e.makeObject(2,{x:0,y:0,radius:1,vx:5,vy:5,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,mass:.2,restitution:0})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}})],en=[new k({name:"Circles",key:"particles",description:["A **Load Test** featuring 2,000 `CIRCLE` objects with full collision resolution.","This demo helps visualize the performance of the **BVH (Bounding Volume Hierarchy)** and the narrow-phase collision solver.","**Note**: In many environments, the primary bottleneck will be the Canvas 2D rendering rather than the physics simulation."].join(`

`),onInitRaw:`(world)=>{

            let id = 1;
            let thickness = 2;
            let length = 11;

            // Walls
            world.makeObject(id++, {
                x: 5,
                y: 0,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: length,
                height: thickness,
                restitution: 0.99,
                
            });
            world.makeObject(id++, {
                x: 5,
                y: 10,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: length,
                height: thickness,
                restitution: 0.99,
            });
            world.makeObject(id++, {
                x: 0,
                y: 5,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: thickness,
                height: length,
                restitution: 0.99,
            });
            world.makeObject(id++, {
                x: 10,
                y: 5,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
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
                    rs: (Math.random() - 0.5) * 20.00,
                    shape: gearbox.shapes.CIRCLE,
                    type: gearbox.bodyTypes.RIGID_BODY,
                    radius: .05,
                    mass: 0.5,
                    linearDamping: 0.0,
                    angularDamping: 0.5,
                    restitution: 0.5,
                });
            }
        }`,onInit:e=>{let n=1,o=2,a=11;e.makeObject(n++,{x:5,y:0,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:a,height:o,restitution:.99}),e.makeObject(n++,{x:5,y:10,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:a,height:o,restitution:.99}),e.makeObject(n++,{x:0,y:5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:o,height:a,restitution:.99}),e.makeObject(n++,{x:10,y:5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:o,height:a,restitution:.99});for(let s=0;s<2e3;s++)e.makeObject(n++,{x:Math.random()*8+1,y:Math.random()*8+1,vx:Math.random()*1-.5,vy:Math.random()*1-.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*20,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:.05,mass:.5,linearDamping:0,angularDamping:.5,restitution:.5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new k({name:"Fleas",key:"fleas",description:["A stress test with 2,000 bouncy `POINT` objects.","Point objects have zero radius and don't collide with each other, but they do collide with other shapes (like the `AABB` walls in this demo). This allows for extremely high-density simulations."].join(`

`),onInitRaw:`(world)=>{
            const nFleas = 2000;

            world.setGravity(0, 10);

            let id = 1;
            let thickness = 2;
            let length = 11;

            // Walls
            world.makeObject(id++, {
                x: 5,
                y: 0,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: length,
                height: thickness,
                restitution: 0.99,
                
            });
            world.makeObject(id++, {
                x: 5,
                y: 10,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: length,
                height: thickness,
                restitution: 0.99,
            });
            world.makeObject(id++, {
                x: 0,
                y: 5,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: thickness,
                height: length,
                restitution: 0.99,
            });
            world.makeObject(id++, {
                x: 10,
                y: 5,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: thickness,
                height: length,
                restitution: 0.99,
            });

            for(let i = 0; i < nFleas; i++){

                world.makeObject(id++, {
                    x: Math.random() * 8 + 1,
                    y: Math.random() * 8 + 1,
                    vx: Math.random() * 10.00 - 5.0,
                    // vy: Math.random() * 1.00 - .50,
                    r: Math.PI / 2 * Math.random(),
                    shape: gearbox.shapes.POINT,
                    type: gearbox.bodyTypes.RIGID_BODY,
                    radius: .05,
                    mass: 2,
                    linearDamping: 0.0,
                    angularDamping: 0.5,

                    restitution: 0.99,
                });
            }
        }`,onInit:e=>{e.setGravity(0,10);let o=1,a=2,s=11;e.makeObject(o++,{x:5,y:0,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:s,height:a,restitution:.99}),e.makeObject(o++,{x:5,y:10,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:s,height:a,restitution:.99}),e.makeObject(o++,{x:0,y:5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:a,height:s,restitution:.99}),e.makeObject(o++,{x:10,y:5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:a,height:s,restitution:.99});for(let i=0;i<2e3;i++)e.makeObject(o++,{x:Math.random()*8+1,y:Math.random()*8+1,vx:Math.random()*10-5,r:Math.PI/2*Math.random(),shape:t.shapes.POINT,type:t.bodyTypes.RIGID_BODY,radius:.05,mass:2,linearDamping:0,angularDamping:.5,restitution:.99})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}})];let nt=0,ft=1;const tn=[new k({name:"TC-1 (SOLVED)",key:"tc-1",hidden:!0,description:["**Test Case 1**: Verifies stability during box-on-box collisions.","Previously, boxes would exhibit 'jitter' or 'explosive' behavior when colliding at certain angles."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 10);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 8,
                // r: Math.PI,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 1,
                mass: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 7,
                y: 2,
                // r: Math.PI,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                // radius: 1,
                width: 5,
                height: 1,
                mass: 1,
            });

            world.makeObject(id++, {
                x: 3,
                y: 5,
                // r: Math.PI,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                // radius: 1,
                width: 5,
                height: 1,
                mass: 1,
            });
        }`,onInit:e=>{e.setGravity(0,10);let n=1;e.makeObject(n++,{x:5,y:8,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:1,height:1,mass:1}),e.makeObject(n++,{x:7,y:2,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:5,height:1,mass:1}),e.makeObject(n++,{x:3,y:5,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:5,height:1,mass:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new k({name:"TC-2 (SOLVED)",key:"tc-2",hidden:!0,description:["**Test Case 2**: Ensures `BOX` shapes do not tunnel through `AABB` shapes.","This test case was used to refine the overlap detection and penetration resolution logic for different boundary types."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 10);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 8,
                r: Math.PI / 2,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 1,
                mass: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 7,
                y: 2,
                // r: Math.PI / 2,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                width: 5,
                height: 1,
                mass: 1,
            });
            world.makeObject(id++, {
                x: 3,
                y: 5,
                // r: Math.PI / 2,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                width: 5,
                height: 1,
                mass: 1,
            });
        }`,onInit:e=>{e.setGravity(0,10);let n=1;e.makeObject(n++,{x:5,y:8,r:Math.PI/2,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:1,height:1,mass:1}),e.makeObject(n++,{x:7,y:2,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:5,height:1,mass:1}),e.makeObject(n++,{x:3,y:5,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:5,height:1,mass:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new k({name:"TC-3 (SOLVED)",key:"tc-3",description:["**Test Case 3**: Momentum preservation and angular transfer.","Previously, objects would lose too much linear momentum during eccentric collisions. The solver now correctly calculates the balance between linear and angular velocity transfer."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 0);

            let id = 1;
            world.makeObject(id++, {
                x: 8,
                y: 5,
                // r: Math.PI,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 1,
                mass: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 2,
                y: 3,
                vx: 3,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                // radius: 1,
                width: 1,
                height: 5,
                mass: 1,
            });
        }`,onInit:e=>{e.setGravity(0,0);let n=1;e.makeObject(n++,{x:8,y:5,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:1,height:1,mass:1}),e.makeObject(n++,{x:2,y:3,vx:3,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:5,mass:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new k({name:"TC-4 (SOLVED)",key:"tc-4",hidden:!0,description:["**Test Case 4**: Correctness of angular velocity direction.","Ensures that objects receive torque in the physically correct direction based on the contact point and normal."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 0);

            let id = 1;
            world.makeObject(id++, {
                x: 8,
                y: 5,
                // r: Math.PI,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 1,
                mass: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 2,
                y: 6,
                vx: 3,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                // radius: 1,
                width: 1,
                height: 5,
                mass: 1,
            });
        }`,onInit:e=>{e.setGravity(0,0);let n=1;e.makeObject(n++,{x:8,y:5,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:1,height:1,mass:1}),e.makeObject(n++,{x:2,y:6,vx:3,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:5,mass:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new k({name:"TC-5 (SOLVED)",key:"tc-5",hidden:!0,description:["**Test Case 5**: Sensitivity to initial rotation.","Fixes an issue where even tiny angular velocities (`rs`) caused disproportionate collision responses. Also verifies that rotating objects transfer angular momentum in opposing directions."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 0);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 5,
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.RIGID_BODY,
                radius: 1,
                mass: 4,
            });

            world.makeObject(id++, {
                x: 2.8,
                y: 2.0,
                vx: 3,
                vy: 3,
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.RIGID_BODY,
                radius: 0.5,
                mass: 1,

                // rs: 10,
                rs: 0.01,
            });
        }`,onInit:e=>{e.setGravity(0,0);let n=1;e.makeObject(n++,{x:5,y:5,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:1,mass:4}),e.makeObject(n++,{x:2.8,y:2,vx:3,vy:3,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:.5,mass:1,rs:.01})},onTickRaw:`(gearbox, world, dt)=>{
        }`,onTick:(e,n,o)=>{}}),new k({name:"TC-6 (SOLVED)",key:"tc-6",description:["**Test Case 6**: Contact point calculation accuracy.","Uses edge-clipping techniques to ensure stable and accurate impulse application during complex box-box collisions."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 10);
            world.setHasFriction(false);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 6,
                r: Math.PI / 8,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 8,
                height: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 2,
                y: 2,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                width: 1,
                height: 1,
                mass: 0.2,
            });
        }`,onInit:e=>{e.setGravity(0,10),e.setHasFriction(!1);let n=1;e.makeObject(n++,{x:5,y:6,r:Math.PI/8,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:8,height:1}),e.makeObject(n++,{x:2,y:2,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:1,mass:.2})},onTickRaw:`(gearbox, world, dt)=>{
        }`,onTick:(e,n,o)=>{}}),new k({name:"TC-7 (SOLVED)",key:"tc-7",description:["**Test Case 7**: Friction normal vector correctness.","Ensures that friction impulses are applied exactly tangent to the contact normal, even when restitution is high."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 10);
            // world.setHasRestitution(false);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 6,
                // r: Math.PI / 8,
                r: 0.1,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 8,
                height: 1,
                restitution: 0.0,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 2,
                y: 2,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                width: 1,
                height: 1,
                mass: 0.2,
                restitution: 0.0,
            });
        }`,onInit:e=>{e.setGravity(0,10);let n=1;e.makeObject(n++,{x:5,y:6,r:.1,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:8,height:1,restitution:0}),e.makeObject(n++,{x:2,y:2,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:1,mass:.2,restitution:0})},onTickRaw:`(gearbox, world, dt)=>{
        }`,onTick:(e,n,o)=>{}}),new k({name:"TC-8 (SOLVED)",key:"tc-8",description:["**Test Case 8**: Stability of high-frequency circle collisions.","Verifies that multiple circles colliding in quick succession do not cause simulation instability or tunneling."].join(`

`),globalLines:["let nextId = 1;"],onInitRaw:`(world)=>{
            world.setGravity(0, 10);
            impulseTimer = 0;

            // Objects will be created in the tick function.
        }`,onInit:e=>{e.setGravity(0,10),nt=0},onTickRaw:`(world, dt)=>{
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
                    shape: gearbox.shapes.CIRCLE,
                    type: gearbox.bodyTypes.RIGID_BODY,
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
                    shape: gearbox.shapes.CIRCLE,
                    type: gearbox.bodyTypes.RIGID_BODY,
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
        }`,onTick:(e,n)=>{if(nt++,nt%60==0){let o=.1+Math.random()*.4,a=.2+o*o*.8;e.makeObject(ft++,{x:0,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*1,vy:-6-Math.random()*1,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:a,mass:o}),o=.1+Math.random()*.4,a=.2+o*o*.8,e.makeObject(ft++,{x:10,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*-1,vy:-6-Math.random()*1,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:a,mass:o}),e.objectCount;let s=[];e.iterateObjects(i=>{i.y>10.5&&s.push(i)});for(let i of s)e.removeObject(i.id)}}}),new k({name:"TC-9 (SOLVED)",key:"tc-9",description:["**Test Case 9**: Resting stability.","A small box resting on a larger fixed box to verify that gravity and normal impulses reach equilibrium without constant jitter."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 1);
            // world.setHasRestitution(false);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 6,
                r: Math.PI / 2,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 8,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 7,
                y: 5,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                width: 1,
                height: 1,
                mass: 0.2,
            });
        }`,onInit:e=>{e.setGravity(0,1);let n=1;e.makeObject(n++,{x:5,y:6,r:Math.PI/2,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:1,height:8}),e.makeObject(n++,{x:7,y:5,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:1,mass:.2})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new k({name:"TC-10 (SOLVED)",key:"tc-10",description:["**Test Case 10**: Circle-AABB penetration resolution.","Fixes extreme responses when a circle falls directly onto a large axis-aligned platform."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 3);
            // world.setHasRestitution(false);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 8,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 8,
                height: 1,
                // restitution: 1
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 7,
                y: 2,
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.RIGID_BODY,
                radius: 1,
                mass: 0.2,
                restitution: 1,
                rs: -0.1,
            });
        }`,onInit:e=>{e.setGravity(0,3);let n=1;e.makeObject(n++,{x:5,y:8,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:8,height:1}),e.makeObject(n++,{x:7,y:2,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:1,mass:.2,restitution:1,rs:-.1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new k({name:"TC-11 (SOLVED)",key:"tc-11",description:["**Test Case 11**: Stuck objects and overlap logic.","Ensures that small circles do not get 'embedded' within other shapes when subjected to high-velocity collisions or deep initial overlaps."].join(`

`),onInitRaw:`(world)=>{

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 5,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 5,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 5.2,
                y: 5,
                // vx: -50,
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.RIGID_BODY,
                radius: 0.1,
                mass: 0.2,
                restitution: 0.5,
            });
        }`,onInit:e=>{let n=1;e.makeObject(n++,{x:5,y:5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:1,height:5}),e.makeObject(n++,{x:5.2,y:5,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:.1,mass:.2,restitution:.5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new k({name:"TC-12 (SOLVED)",key:"tc-12",description:["**Test Case 12**: Sinking prevention under high gravity.","Verifies that boxes maintain their position on top of other objects even when high downward forces are applied, ensuring the penetration resolution is sufficient."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 10);
            // world.setHasRestitution(false);

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 6,
                shape: gearbox.shapes.AABB,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 8,
                height: 1,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 7,
                y: 4,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.RIGID_BODY,
                width: 1,
                height: 1,
                mass: 0.2,
            });
        }`,onInit:e=>{e.setGravity(0,10);let n=1;e.makeObject(n++,{x:5,y:6,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:8,height:1}),e.makeObject(n++,{x:7,y:4,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:1,mass:.2})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new k({name:"TC-13 (SOLVED)",key:"tc-13",description:["**Test Case 13**: Stuck objects and overlap logic.","Ensures that small circles do not get 'embedded' within other shapes when subjected to high-velocity collisions or deep initial overlaps."].join(`

`),onInitRaw:`(world)=>{

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 5,
                shape: gearbox.shapes.BOX,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                width: 1,
                height: 5,
            });

            // Anohter box but this time a rigid body.
            world.makeObject(id++, {
                x: 5.2,
                y: 5,
                // vx: -50,
                shape: gearbox.shapes.CIRCLE,
                type: gearbox.bodyTypes.RIGID_BODY,
                radius: 0.1,
                mass: 0.2,
                restitution: 0.5,
            });
        }`,onInit:e=>{let n=1;e.makeObject(n++,{x:5,y:5,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:1,height:5}),e.makeObject(n++,{x:5.2,y:5,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:.1,mass:.2,restitution:.5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}})];let x=1,wt=null,It=null,kt=null,A=null;const nn=new k({name:"Mechanical Clockwork",key:"clockwork",description:["A physically regulated mechanical clock. This version uses a **Grashof-compliant Crank-Rocker** mechanism to ensure continuous rotation.","### Features","- **Regulated Motion**: A 2.0m pendulum defines a 9-second period in low gravity (1.0 m/s²).","- **Grashof Linkage**: Precision geometry allows the drive gear to complete full 360° rotations.","- **Mainspring Power**: A tensioned `SpringJoint` drives the escapement, physically limited by the pendulum.","- **Multi-stage Reduction**: 7 `GearJoint` stages step down the escapement's motion to hours and minutes.","- **Real-time Sync**: The hands and gear train initialize to your local system time."].join(`

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
            crankRadius: 0.25, 
            groundDist: 1.0, 
            rockerLength: 0.8, 
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
            const s = world.scoreState;
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
        createSlider('Spring Frequency', 'springFreq', 0.1, 2.0, 0.05);
        createSlider('Spring X Pos', 'springX', cx - 3.0, cx - 0.5, 0.1);
        
        const pendPivotY = cy + 2.0;
        const escapementY = pendPivotY - p.groundDist;
        const targetPeriod = 9.0; 
        const pendulumLength = g * Math.pow(targetPeriod / (2 * Math.PI), 2);
        const rockerPinDist = pendulumLength - p.rockerLength;

        const pendCenter = world.makeObject(nextId++, { x: cx, y: pendPivotY, shape: gearbox.shapes.CIRCLE, radius: 0.1, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#888", categoryBits: CAT_STATIC, maskBits: 0 });
        const escCenter = world.makeObject(nextId++, { x: cx, y: escapementY, shape: gearbox.shapes.CIRCLE, radius: 0.1, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#888", categoryBits: CAT_STATIC, maskBits: 0 });
        const center = world.makeObject(nextId++, { x: cx, y: cy, shape: gearbox.shapes.CIRCLE, radius: 0.1, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#888", categoryBits: CAT_STATIC, maskBits: 0 });

        const initialPendAngle = 0.5;
        pendulum = world.makeObject(nextId++, {
            x: cx + Math.sin(initialPendAngle) * pendulumLength,
            y: pendPivotY + Math.cos(initialPendAngle) * pendulumLength,
            r: -initialPendAngle,
            shape: gearbox.shapes.CIRCLE, radius: 0.4, mass: 50.0, color: "#cd853f", categoryBits: CAT_MECH, maskBits: 0
        });
        pendulum.angularDamping = 0.01;
        world.createHingeJoint(nextId++, pendCenter, pendulum, { worldAnchor: { x: cx, y: pendPivotY }, anchorB: { x: 0, y: -pendulumLength } });

        const fastGear = world.makeObject(nextId++, { x: cx, y: escapementY, r: 0, shape: gearbox.shapes.CIRCLE, radius: 0.5, mass: 0.5, color: "#aaa", categoryBits: CAT_GEAR, maskBits: 0 });
        fastGear.angularDamping = 0.05; 
        const fastHinge = world.createHingeJoint(nextId++, escCenter, fastGear, { worldAnchor: { x: cx, y: escapementY } });

        const crankPinLocal = { x: p.crankRadius, y: 0 }; 
        const pendPinLocal = { x: 0, y: -pendulumLength + rockerPinDist }; 
        const conRodLen = Math.sqrt(Math.pow(fastGear.localToWorld(crankPinLocal).x - pendulum.localToWorld(pendPinLocal).x, 2) + 
                                 Math.pow(fastGear.localToWorld(crankPinLocal).y - pendulum.localToWorld(pendPinLocal).y, 2));

        const conRodJoint = world.createDistanceJoint(nextId++, fastGear, pendulum, { anchorA: crankPinLocal, anchorB: pendPinLocal, length: conRodLen });

        const springAnchor = world.makeObject(nextId++, { x: p.springX, y: escapementY - 1.0, shape: gearbox.shapes.CIRCLE, radius: 0.05, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#ff4444", categoryBits: CAT_STATIC, maskBits: 0 });
        const springJoint = world.createSpringJoint(nextId++, springAnchor, fastGear, { anchorB: { x: 0.5, y: 0 }, frequencyHz: p.springFreq, dampingRatio: 0.2, length: 1.2 });

        const updateSimulation = () => {
            const newEscY = pendPivotY - p.groundDist;
            escCenter.y = newEscY;
            fastGear.y = newEscY;
            fastHinge.localAnchorA = escCenter.worldToLocal({ x: cx, y: newEscY });
            
            conRodJoint.localAnchorA = { x: p.crankRadius, y: 0 };
            const newRockerPinDist = pendulumLength - p.rockerLength;
            conRodJoint.localAnchorB = { x: 0, y: -pendulumLength + newRockerPinDist };
            
            const wA = fastGear.localToWorld(conRodJoint.localAnchorA);
            const wB = pendulum.localToWorld(conRodJoint.localAnchorB);
            conRodJoint.length = Math.sqrt(Math.pow(wB.x - wA.x, 2) + Math.pow(wB.y - wA.y, 2));
            
            springAnchor.x = p.springX;
            springAnchor.y = newEscY - 1.0;
            springJoint.frequencyHz = p.springFreq;
        };

        // Scoring state
        world.scoreState = {
            fastGear,
            pendulum,
            params: p,
            updateSimulation,
            updateSliderUI,
            optStatus,
            lastFastR: fastGear.r,
            history: [], // Buffer for sliding window: { time, rotDelta, reversal }
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
        const inter1Center = world.makeObject(nextId++, {
            x: inter1X, y: inter1Y,
            shape: gearbox.shapes.CIRCLE,
            radius: 0.1,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#888",
            categoryBits: CAT_STATIC,
            maskBits: 0
        });

        const inter1Gear = world.makeObject(nextId++, {
            x: inter1X, y: inter1Y,
            shape: gearbox.shapes.CIRCLE,
            radius: 1.0,
            mass: 0.2,
            r: 0, 
            color: "#44ff44",
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
        const secondGearObj = world.makeObject(nextId++, {
            x: cx, y: cy,
            shape: gearbox.shapes.CIRCLE,
            radius: 0.6,
            mass: 0.2,
            r: secHandAngle,
            color: "#ff4444",
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
            world.makeObject(nextId++, {
                x: cx + Math.cos(angle) * (r1 + r2) / 2,
                y: cy + Math.sin(angle) * (r1 + r2) / 2,
                r: angle + Math.PI / 2,
                shape: gearbox.shapes.BOX,
                width: i % 3 === 0 ? 0.2 : 0.1,
                height: 0.4,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: "#999",
                categoryBits: CAT_STATIC,
                maskBits: 0
            });
        }

        secondHand = world.makeObject(nextId++, {
            x: cx + Math.sin(secHandAngle) * (secLen / 2 - 0.2),
            y: cy - Math.cos(secHandAngle) * (secLen / 2 - 0.2),
            r: secHandAngle,
            shape: gearbox.shapes.BOX,
            width: 0.05, height: secLen,
            mass: 0.1,
            color: "#ff4444",
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
        const inter2Center = world.makeObject(nextId++, {
            x: inter2X, y: inter2Y,
            shape: gearbox.shapes.CIRCLE,
            radius: 0.1,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#888",
            categoryBits: CAT_STATIC,
            maskBits: 0
        });
        const inter2Gear = world.makeObject(nextId++, {
            x: inter2X, y: inter2Y,
            shape: gearbox.shapes.CIRCLE,
            radius: 1.0,
            mass: 0.2,
            r: 0,
            color: "#4444ff",
            categoryBits: CAT_GEAR,
            maskBits: 0
        });
        inter2Gear.angularDamping = 0.01;
        const inter2Hinge = world.createHingeJoint(nextId++, inter2Center, inter2Gear, {
            worldAnchor: { x: inter2X, y: inter2Y }
        });
        world.createGearJoint(nextId++, secondHinge, inter2Hinge, 1/10);

        const minuteGear = world.makeObject(nextId++, {
            x: cx, y: cy,
            shape: gearbox.shapes.CIRCLE,
            radius: 0.8,
            mass: 0.2,
            r: minHandAngle,
            color: "#4444ff",
            categoryBits: CAT_GEAR,
            maskBits: 0
        });
        minuteGear.angularDamping = 0.01;
        const minuteHinge = world.createHingeJoint(nextId++, center, minuteGear, {
            worldAnchor: { x: cx, y: cy }
        });
        world.createGearJoint(nextId++, inter2Hinge, minuteHinge, 1/6);

        minuteHand = world.makeObject(nextId++, {
            x: cx + Math.sin(minHandAngle) * (minLen / 2 - 0.3),
            y: cy - Math.cos(minHandAngle) * (minLen / 2 - 0.3),
            r: minHandAngle,
            shape: gearbox.shapes.BOX,
            width: 0.12, height: minLen,
            mass: 0.2,
            color: "#4444ff",
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
        const inter3Center = world.makeObject(nextId++, {
            x: inter3X, y: inter3Y,
            shape: gearbox.shapes.CIRCLE,
            radius: 0.1,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#888",
            categoryBits: CAT_STATIC,
            maskBits: 0
        });
        const inter3Gear = world.makeObject(nextId++, {
            x: inter3X, y: inter3Y,
            shape: gearbox.shapes.CIRCLE,
            radius: 1.0,
            mass: 0.2,
            r: 0,
            color: "#cccc44",
            categoryBits: CAT_GEAR,
            maskBits: 0
        });
        inter3Gear.angularDamping = 0.01;
        const inter3Hinge = world.createHingeJoint(nextId++, inter3Center, inter3Gear, {
            worldAnchor: { x: inter3X, y: inter3Y }
        });
        world.createGearJoint(nextId++, minuteHinge, inter3Hinge, 1/3);

        const hourGear = world.makeObject(nextId++, {
            x: cx, y: cy,
            shape: gearbox.shapes.CIRCLE,
            radius: 1.1,
            mass: 0.2,
            r: hourHandAngle,
            color: "#cc8844",
            categoryBits: CAT_GEAR,
            maskBits: 0
        });
        hourGear.angularDamping = 0.01;
        const hourHinge = world.createHingeJoint(nextId++, center, hourGear, {
            worldAnchor: { x: cx, y: cy }
        });
        world.createGearJoint(nextId++, inter3Hinge, hourHinge, 1/4);

        hourHand = world.makeObject(nextId++, {
            x: cx + Math.sin(hourHandAngle) * (hourLen / 2 - 0.4),
            y: cy - Math.cos(hourHandAngle) * (hourLen / 2 - 0.4),
            r: hourHandAngle,
            shape: gearbox.shapes.BOX,
            width: 0.18, height: hourLen,
            mass: 0.3,
            color: "#cc8844",
            categoryBits: CAT_HAND,
            maskBits: 0
        });
        const hourHandHinge = world.createHingeJoint(nextId++, center, hourHand, {
            worldAnchor: { x: cx, y: cy },
            anchorB: { x: 0, y: hourLen / 2 - 0.4 }
        });
        world.createGearJoint(nextId++, hourHinge, hourHandHinge, -1.0);
    }`,onInit:e=>{e.clear(),t.debug.showAabbs=!1,x=1;const n=5,o=2.5,a=1;e.setGravity(0,a),e.setHasRestitution(!0),e.setHasFriction(!0);const s=1,i=2,c=4,l=8,d=new Date,p=d.getSeconds(),r=d.getMinutes(),m=d.getHours()%12,h={crankRadius:.25,groundDist:1,rockerLength:.8,springFreq:.5,springX:n-1.5},u=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1",g=document.getElementById("clock-tuner-gui");g&&g.remove();const y=document.createElement("div");y.id="clock-tuner-gui",y.style="position:fixed;top:20px;right:20px;width:280px;background:rgba(0,0,0,0.85);color:#0f0;padding:15px;border-radius:8px;font-family:monospace;z-index:1000;box-shadow:0 4px 15px rgba(0,0,0,0.5);font-size:12px;border:1px solid #333;",u&&document.body.appendChild(y);const w=document.createElement("div");w.style="margin:15px 0;padding:10px;border:1px solid #0f0;text-align:center;font-size:16px;font-weight:bold;",w.textContent="Score: 0",y.appendChild(w);const I=document.createElement("button");I.textContent="Export to Console",I.style="width:100%;padding:8px;background:#0f0;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;margin-bottom:5px;",I.onclick=()=>console.log("Final Parameters:",JSON.stringify(h,null,4)),y.appendChild(I);const B=document.createElement("button");B.textContent="Start Auto-Optimize",B.style="width:100%;padding:8px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;",B.onclick=()=>{const O=e.scoreState;O.isOptimizing=!O.isOptimizing,B.textContent=O.isOptimizing?"Stop Auto-Optimize":"Start Auto-Optimize",B.style.background=O.isOptimizing?"#f00":"#444",O.isOptimizing&&(O.bestScore=-1/0,O.optimizationStage="PREPARE",O.optParamIndex=0,O.optDirection=1,O.epsilon=.05,O.lastImprovementIteration=0,console.log("Starting Auto-Optimization..."))},y.appendChild(B);const T=document.createElement("div");T.style="margin-top:10px;font-size:10px;color:#aaa;",T.textContent="Optimizer: Idle",y.appendChild(T);const C={},R=(O,j,se,ae,$t)=>{const Xe=document.createElement("div");Xe.style.marginBottom="10px";const Fe=document.createElement("div");Fe.textContent=`${O}: ${h[j].toFixed(2)}`;const G=document.createElement("input");G.type="range",G.min=se,G.max=ae,G.step=$t,G.value=h[j],G.style.width="100%",G.oninput=()=>{h[j]=parseFloat(G.value),Fe.textContent=`${O}: ${h[j].toFixed(2)}`,ct()},Xe.appendChild(Fe),Xe.appendChild(G),y.appendChild(Xe),C[j]={slider:G,labelEl:Fe,label:O}},H=O=>{const j=C[O];j&&(j.slider.value=h[O],j.labelEl.textContent=`${j.label}: ${h[O].toFixed(2)}`)};R("Crank Radius","crankRadius",.05,.5,.01),R("Ground Distance","groundDist",.5,2,.05),R("Rocker Length","rockerLength",.3,1.5,.05),R("Spring Frequency","springFreq",.1,2,.05),R("Spring X Pos","springX",n-3,n-.5,.1);const L=o+2,D=L-h.groundDist,_=a*Math.pow(9/(2*Math.PI),2),Pe=_-h.rockerLength,Ye=e.makeObject(x++,{x:n,y:L,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),xe=e.makeObject(x++,{x:n,y:D,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),Y=e.makeObject(x++,{x:n,y:o,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),me=.5;A=e.makeObject(x++,{x:n+Math.sin(me)*_,y:L+Math.cos(me)*_,r:-me,shape:t.shapes.CIRCLE,radius:.4,mass:50,color:"#cd853f",categoryBits:i,maskBits:0}),A.angularDamping=.01,e.createHingeJoint(x++,Ye,A,{worldAnchor:{x:n,y:L},anchorB:{x:0,y:-_}});const S=e.makeObject(x++,{x:n,y:D,r:0,shape:t.shapes.CIRCLE,radius:.5,mass:.5,color:"#aaa",categoryBits:c,maskBits:0});S.angularDamping=.05;const Ae=e.createHingeJoint(x++,xe,S,{worldAnchor:{x:n,y:D}}),K={x:h.crankRadius,y:0},fe={x:0,y:-_+Pe},ze=Math.sqrt(Math.pow(S.localToWorld(K).x-A.localToWorld(fe).x,2)+Math.pow(S.localToWorld(K).y-A.localToWorld(fe).y,2)),we=e.createDistanceJoint(x++,S,A,{anchorA:K,anchorB:fe,length:ze}),We=e.makeObject(x++,{x:h.springX,y:D-1,shape:t.shapes.CIRCLE,radius:.05,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444",categoryBits:s,maskBits:0}),Ht=e.createSpringJoint(x++,We,S,{anchorB:{x:.5,y:0},frequencyHz:h.springFreq,dampingRatio:.2,length:1.2}),ct=()=>{const O=L-h.groundDist;xe.y=O,S.y=O,Ae.localAnchorA=xe.worldToLocal({x:n,y:O}),we.localAnchorA={x:h.crankRadius,y:0};const j=_-h.rockerLength;we.localAnchorB={x:0,y:-_+j};const se=S.localToWorld(we.localAnchorA),ae=A.localToWorld(we.localAnchorB);we.length=Math.sqrt(Math.pow(ae.x-se.x,2)+Math.pow(ae.y-se.y,2)),We.x=h.springX,We.y=O-1,Ht.frequencyHz=h.springFreq};e.scoreState={fastGear:S,pendulum:A,params:h,updateSimulation:ct,updateSliderUI:H,optStatus:T,lastFastR:S.r,history:[],periodTimes:[],lastPendSide:Math.sign(A.r),lastPendCrossing:0,scoreDisplay:w,isOptimizing:!1};const _t=8/60,$e=n+1.5,qe=D+.5,Jt=e.makeObject(x++,{x:$e,y:qe,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),lt=e.makeObject(x++,{x:$e,y:qe,shape:t.shapes.CIRCLE,radius:1,mass:.2,r:0,color:"#44ff44",categoryBits:c,maskBits:0});lt.angularDamping=.02;const dt=e.createHingeJoint(x++,Jt,lt,{worldAnchor:{x:$e,y:qe}});e.createGearJoint(x++,Ae,dt,.25);const je=p/60*Math.PI*2,ht=e.makeObject(x++,{x:n,y:o,shape:t.shapes.CIRCLE,radius:.6,mass:.2,r:je,color:"#ff4444",categoryBits:c,maskBits:0});ht.angularDamping=.02;const Ne=e.createHingeJoint(x++,Y,ht,{worldAnchor:{x:n,y:o}});e.createGearJoint(x++,dt,Ne,_t/.25);const Re=r/60*Math.PI*2,Me=m/12*Math.PI*2,De=3.5,Le=3,Se=2;for(let O=0;O<12;O++){const j=O/12*Math.PI*2-Math.PI/2,se=3.8,ae=4;e.makeObject(x++,{x:n+Math.cos(j)*(se+ae)/2,y:o+Math.sin(j)*(se+ae)/2,r:j+Math.PI/2,shape:t.shapes.BOX,width:O%3===0?.2:.1,height:.4,type:t.bodyTypes.FIXED_OBJECT,color:"#999",categoryBits:s,maskBits:0})}wt=e.makeObject(x++,{x:n+Math.sin(je)*(De/2-.2),y:o-Math.cos(je)*(De/2-.2),r:je,shape:t.shapes.BOX,width:.05,height:De,mass:.1,color:"#ff4444",categoryBits:l,maskBits:0});const Gt=e.createHingeJoint(x++,Y,wt,{worldAnchor:{x:n,y:o},anchorB:{x:0,y:De/2-.2}});e.createGearJoint(x++,Ne,Gt,-1);const Ue=n-1.5,Ke=o-1.5,Pt=e.makeObject(x++,{x:Ue,y:Ke,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),pt=e.makeObject(x++,{x:Ue,y:Ke,shape:t.shapes.CIRCLE,radius:1,mass:.2,r:0,color:"#4444ff",categoryBits:c,maskBits:0});pt.angularDamping=.01;const mt=e.createHingeJoint(x++,Pt,pt,{worldAnchor:{x:Ue,y:Ke}});e.createGearJoint(x++,Ne,mt,1/10);const gt=e.makeObject(x++,{x:n,y:o,shape:t.shapes.CIRCLE,radius:.8,mass:.2,r:Re,color:"#4444ff",categoryBits:c,maskBits:0});gt.angularDamping=.01;const Ve=e.createHingeJoint(x++,Y,gt,{worldAnchor:{x:n,y:o}});e.createGearJoint(x++,mt,Ve,1/6),It=e.makeObject(x++,{x:n+Math.sin(Re)*(Le/2-.3),y:o-Math.cos(Re)*(Le/2-.3),r:Re,shape:t.shapes.BOX,width:.12,height:Le,mass:.2,color:"#4444ff",categoryBits:l,maskBits:0});const Yt=e.createHingeJoint(x++,Y,It,{worldAnchor:{x:n,y:o},anchorB:{x:0,y:Le/2-.3}});e.createGearJoint(x++,Ve,Yt,-1);const Ze=n+2,Qe=o-1,zt=e.makeObject(x++,{x:Ze,y:Qe,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),yt=e.makeObject(x++,{x:Ze,y:Qe,shape:t.shapes.CIRCLE,radius:1,mass:.2,r:0,color:"#cccc44",categoryBits:c,maskBits:0});yt.angularDamping=.01;const ut=e.createHingeJoint(x++,zt,yt,{worldAnchor:{x:Ze,y:Qe}});e.createGearJoint(x++,Ve,ut,1/3);const bt=e.makeObject(x++,{x:n,y:o,shape:t.shapes.CIRCLE,radius:1.1,mass:.2,r:Me,color:"#cc8844",categoryBits:c,maskBits:0});bt.angularDamping=.01;const xt=e.createHingeJoint(x++,Y,bt,{worldAnchor:{x:n,y:o}});e.createGearJoint(x++,ut,xt,1/4),kt=e.makeObject(x++,{x:n+Math.sin(Me)*(Se/2-.4),y:o-Math.cos(Me)*(Se/2-.4),r:Me,shape:t.shapes.BOX,width:.18,height:Se,mass:.3,color:"#cc8844",categoryBits:l,maskBits:0});const Wt=e.createHingeJoint(x++,Y,kt,{worldAnchor:{x:n,y:o},anchorB:{x:0,y:Se/2-.4}});e.createGearJoint(x++,xt,Wt,-1)},onTickRaw:`(world, dt) => {
        const s = world.scoreState;
        if (s) {
            const now = performance.now();
            const windowSize = 5000; // 5 seconds in ms

            // 1. Track Tick Events
            let rotDelta = 0;
            let isReversal = false;
            if (s.fastGear) {
                const diff = s.fastGear.r - s.lastFastR;
                if (diff < -0.01) isReversal = true;
                rotDelta = Math.max(0, diff) / (Math.PI * 2);
                s.lastFastR = s.fastGear.r;
            }

            s.history.push({ time: now, rotDelta, isReversal });

            // 2. Track Pendulum Period
            if (s.pendulum) {
                const currentSide = Math.sign(s.pendulum.r);
                if (currentSide !== s.lastPendSide && currentSide !== 0) {
                    if (s.lastPendCrossing > 0) {
                        const period = (now - s.lastPendCrossing) / 500;
                        if (period > 0.2 && period < 5.0) {
                            s.periodTimes.push({ time: now, period });
                        }
                    }
                    s.lastPendCrossing = now;
                    s.lastPendSide = currentSide;
                }
            }

            // 3. Prune Old Data (Older than 5s)
            const cutoff = now - windowSize;
            while (s.history.length > 0 && s.history[0].time < cutoff) s.history.shift();
            while (s.periodTimes.length > 0 && s.periodTimes[0].time < cutoff) s.periodTimes.shift();

            // 4. Calculate Recent Performance
            let recentRotations = 0;
            let recentReversalCount = 0;
            for (const event of s.history) {
                recentRotations += event.rotDelta;
                if (event.isReversal) recentReversalCount++;
            }

            // CONTINUOUS GRADIENT (Signs of Life)
            // Even if the clock is stalled, these provide a reason to tweak parameters.
            const pendActivity = (Math.abs(s.pendulum.r) + Math.abs(s.pendulum.rs) * 0.5);
            const gearActivity = Math.abs(s.fastGear.rs);

            let score = recentRotations * 5000;      // Primary goal: Rotation
            score -= recentReversalCount * 20;       // Penalty for jitter/reversals (lowered)
            score += pendActivity * 200;             // Reward for swinging (the gradient)
            score += gearActivity * 50;              // Reward for gear movement

            // Period Accuracy Bonus
            if (s.periodTimes.length > 0) {
                const avgPeriod = s.periodTimes.reduce((acc, p) => acc + p.period, 0) / s.periodTimes.length;
                const periodError = Math.abs(avgPeriod - 1.0);
                score += Math.max(0, 1000 * (1 - periodError * 2)); // High bonus for timing
            }

            // STALL PENALTY (The Cliff)
            // If it's not rotating at all, apply a large penalty.
            if (recentRotations < 0.005) {
                score -= 2000;
            }

            s.scoreDisplay.textContent = \`Recent Score (5s): \${Math.floor(score)}\`;

            // --- AUTO-OPTIMIZER LOGIC ---
            if (s.isOptimizing) {
                const keys = ['crankRadius', 'groundDist', 'rockerLength', 'springFreq', 'springX'];
                
                if (s.optimizationStage === 'PREPARE') {
                    s.bestScore = score;
                    s.optimizationStage = 'TWEAK';
                    s.evalTimer = now + windowSize;
                    s.improvedThisCycle = false;
                } 
                else if (now > s.evalTimer) {
                    if (s.optimizationStage === 'TWEAK') {
                        // Compare score after evaluation period
                        if (score > s.bestScore + 0.1) { // Lower threshold for subtle improvements
                            s.bestScore = score;
                            s.improvedThisCycle = true;
                            s.optStatus.textContent = \`Optimizer: Improved \${keys[s.optParamIndex]} (Score: \${Math.floor(score)})\`;
                            console.log(\`Optimizer: Found improvement! New best score: \${Math.floor(score)}\`);
                        } else {
                            // Revert
                            s.params[keys[s.optParamIndex]] -= s.epsilon * s.optDirection;
                            s.updateSimulation();
                            s.updateSliderUI(keys[s.optParamIndex]);
                        }

                        // Move to next step
                        s.optDirection *= -1;
                        if (s.optDirection === 1) {
                            s.optParamIndex++;
                            if (s.optParamIndex >= keys.length) {
                                s.optParamIndex = 0;
                                if (!s.improvedThisCycle) {
                                    s.epsilon *= 0.8; // Decay slower
                                    s.epsilon = Math.max(s.epsilon, 0.002); // Don't shrink to zero
                                    console.log(\`Optimizer: No improvements this cycle. Shrinking epsilon to \${s.epsilon.toFixed(4)}\`);
                                }
                                s.improvedThisCycle = false;
                            }
                        }

                        // Apply next tweak
                        s.params[keys[s.optParamIndex]] += s.epsilon * s.optDirection;
                        s.updateSimulation();
                        s.updateSliderUI(keys[s.optParamIndex]);
                        
                        s.evalTimer = now + windowSize;
                        s.optStatus.textContent = \`Opt: Testing \${keys[s.optParamIndex]} (\${s.optDirection > 0 ? '+' : '-'}) eps=\${s.epsilon.toFixed(4)}\`;
                    }
                }
            } else {
                s.optStatus.textContent = 'Optimizer: Idle';
            }
        }

        // "Escapement" Impulse - A kick to maintain regulation
        if (pendulum) {

            // If pendulum is moving towards center, give it a healthy push
            // Only if it's below a target speed to avoid over-accelerating
            if (Math.abs(pendulum.r) < 0.1 && Math.abs(pendulum.rs) > 0.02 && Math.abs(pendulum.rs) < 1.2) {
                pendulum.applyAngularImpulse(Math.sign(pendulum.rs) * 0.4);
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
    }`,onTick:(e,n)=>{const o=e.scoreState;if(o){const i=performance.now(),c=5e3;let l=0,d=!1;if(o.fastGear){const y=o.fastGear.r-o.lastFastR;y<-.01&&(d=!0),l=Math.max(0,y)/(Math.PI*2),o.lastFastR=o.fastGear.r}if(o.history.push({time:i,rotDelta:l,isReversal:d}),o.pendulum){const y=Math.sign(o.pendulum.r);if(y!==o.lastPendSide&&y!==0){if(o.lastPendCrossing>0){const w=(i-o.lastPendCrossing)/500;w>.2&&w<5&&o.periodTimes.push({time:i,period:w})}o.lastPendCrossing=i,o.lastPendSide=y}}const p=i-c;for(;o.history.length>0&&o.history[0].time<p;)o.history.shift();for(;o.periodTimes.length>0&&o.periodTimes[0].time<p;)o.periodTimes.shift();let r=0,m=0;for(const y of o.history)r+=y.rotDelta,y.isReversal&&m++;const h=Math.abs(o.pendulum.r)+Math.abs(o.pendulum.rs)*.5,u=Math.abs(o.fastGear.rs);let g=r*5e3;if(g-=m*20,g+=h*200,g+=u*50,o.periodTimes.length>0){const y=o.periodTimes.reduce((I,B)=>I+B.period,0)/o.periodTimes.length,w=Math.abs(y-1);g+=Math.max(0,1e3*(1-w*2))}if(r<.005&&(g-=2e3),o.scoreDisplay.textContent=`Recent Score (5s): ${Math.floor(g)}`,o.isOptimizing){const y=["crankRadius","groundDist","rockerLength","springFreq","springX"];o.optimizationStage==="PREPARE"?(o.bestScore=g,o.optimizationStage="TWEAK",o.evalTimer=i+c,o.improvedThisCycle=!1):i>o.evalTimer&&o.optimizationStage==="TWEAK"&&(g>o.bestScore+.1?(o.bestScore=g,o.improvedThisCycle=!0,o.optStatus.textContent=`Optimizer: Improved ${y[o.optParamIndex]} (Score: ${Math.floor(g)})`,console.log(`Optimizer: Found improvement! New best score: ${Math.floor(g)}`)):(o.params[y[o.optParamIndex]]-=o.epsilon*o.optDirection,o.updateSimulation(),o.updateSliderUI(y[o.optParamIndex])),o.optDirection*=-1,o.optDirection===1&&(o.optParamIndex++,o.optParamIndex>=y.length&&(o.optParamIndex=0,o.improvedThisCycle||(o.epsilon*=.8,o.epsilon=Math.max(o.epsilon,.002),console.log(`Optimizer: No improvements this cycle. Shrinking epsilon to ${o.epsilon.toFixed(4)}`)),o.improvedThisCycle=!1)),o.params[y[o.optParamIndex]]+=o.epsilon*o.optDirection,o.updateSimulation(),o.updateSliderUI(y[o.optParamIndex]),o.evalTimer=i+c,o.optStatus.textContent=`Opt: Testing ${y[o.optParamIndex]} (${o.optDirection>0?"+":"-"}) eps=${o.epsilon.toFixed(4)}`)}else o.optStatus.textContent="Optimizer: Idle"}A&&Math.abs(A.r)<.1&&Math.abs(A.rs)>.02&&Math.abs(A.rs)<1.2&&A.applyAngularImpulse(Math.sign(A.rs)*.4);const s=new Date().toLocaleTimeString();if(t.debug.clearLabels(),t.debug.addLabel({text:"Mechanical Clockwork",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"}),t.debug.addLabel({text:s,x:5,y:9.5,fontSize:"36px Arial",color:"#fff",position:"on-top"}),A){const i=(A.r*180/Math.PI).toFixed(1);t.debug.addLabel({text:`Pendulum: ${i}°`,x:8,y:8,fontSize:"16px Arial",color:"#cd853f",position:"on-top"})}},onCleanup:e=>{const n=document.getElementById("clock-tuner-gui");n&&n.remove()}});let X=1,$=null;const on=new k({name:"Gnome Omega Engine",key:"gnome-omega",description:["A detailed simulation of a **Gnome Omega** rotary engine. In this classic radial design, the crankshaft remains stationary while the entire cylinder block rotates around it.","### Features","- **Stationary Crankshaft**: A fixed pivot point (red) offset from the center.","- **Rotating Crankcase**: The main grey hub that carries the cylinders.","- **Weld Constraints**: Cylinders are 'welded' to the hub using a combination of `HingeJoint` and `DistanceJoint` for maximum stability.","- **Reciprocating Motion**: Pistons and connecting rods are synchronized via `HingeJoint` constraints.","- **Collision Masks**: Bitwise filtering ensures pistons only interact with their respective cylinder walls.","Click **Reset** if the simulation becomes unstable due to extreme angular velocities."].join(`

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
        const hubAnchor = world.makeObject(nextId++, {
            x: cx, y: cy,
            shape: gearbox.shapes.CIRCLE,
            radius: 0.15,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#888",
            categoryBits: CAT_FIXED,
            maskBits: 0 // Collide with nothing
        });

        // The fixed crank pin (stationary throw)
        const crankPin = world.makeObject(nextId++, {
            x: cx, y: cy + crankOffset,
            shape: gearbox.shapes.CIRCLE,
            radius: 0.1,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#ff4444",
            categoryBits: CAT_FIXED,
            maskBits: 0 // Collide with nothing
        });

        // The rotating hub (crankcase)
        engineHub = world.makeObject(nextId++, {
            x: cx, y: cy,
            shape: gearbox.shapes.CIRCLE,
            radius: 0.8,
            mass: 50.0, // Increased mass for stability
            color: "#aaa",
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
                
                const wall = world.makeObject(nextId++, {
                    x: wallX, y: wallY,
                    r: orientation,
                    shape: gearbox.shapes.BOX,
                    width: wallWidth, height: wallHeight,
                    mass: 1.0,
                    color: "#bbb",
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
            const piston = world.makeObject(nextId++, {
                x: pistonX, y: pistonY,
                r: orientation,
                shape: gearbox.shapes.BOX,
                width: 0.7, height: 1.0, // Piston width (0.7) is now less than inner gap (0.8)
                mass: 0.5,
                color: "#ddd",
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
            
            const rod = world.makeObject(nextId++, {
                x: rodX, y: rodY,
                r: rodAngle,
                shape: gearbox.shapes.BOX,
                width: 0.15, height: rodLength,
                mass: 0.2,
                color: "#fff",
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
    }`,onInit:e=>{e.clear(),t.debug.showAabbs=!1,X=1,$=null;const n=5,o=4.5,a=.8,s=7,i=2.5,c=256,l=512,d=1024,p=2048,r=4096,m=e.makeObject(X++,{x:n,y:o,shape:t.shapes.CIRCLE,radius:.15,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:c,maskBits:0}),h=e.makeObject(X++,{x:n,y:o+a,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444",categoryBits:c,maskBits:0});$=e.makeObject(X++,{x:n,y:o,shape:t.shapes.CIRCLE,radius:.8,mass:50,color:"#aaa",categoryBits:l,maskBits:0,restitution:0}),e.createHingeJoint(X++,m,$,{worldAnchor:{x:n,y:o}});for(let u=0;u<s;u++){const g=u/s*Math.PI*2,y=Math.cos(g),w=Math.sin(g),I=g-Math.PI/2,B=2.6,T=.28,C=2.5,R=1,H=me=>{const S=n+y*B+-w*(me*R/2),Ae=o+w*B+y*(me*R/2),K=e.makeObject(X++,{x:S,y:Ae,r:I,shape:t.shapes.BOX,width:T,height:C,mass:1,color:"#bbb",categoryBits:d,maskBits:p,restitution:0,sFriction:0,kFriction:0}),fe=K.localToWorld({x:0,y:-C/2}),ze=K.localToWorld({x:0,y:C/2});e.createHingeJoint(X++,$,K,{worldAnchor:fe}),e.createDistanceJoint(X++,$,K,{worldAnchor:ze})};H(-1),H(1);const L=a*Math.sin(g)+Math.sqrt(i*i-Math.pow(a*Math.cos(g),2)),D=n+y*L,pe=o+w*L,_=e.makeObject(X++,{x:D,y:pe,r:I,shape:t.shapes.BOX,width:.7,height:1,mass:.5,color:"#ddd",categoryBits:p,maskBits:d,restitution:0,sFriction:0,kFriction:0}),Pe=(n+D)/2,Ye=(o+a+pe)/2,xe=Math.atan2(pe-(o+a),D-n)-Math.PI/2,Y=e.makeObject(X++,{x:Pe,y:Ye,r:xe,shape:t.shapes.BOX,width:.15,height:i,mass:.2,color:"#fff",categoryBits:r,maskBits:0,restitution:0});e.createHingeJoint(X++,Y,h,{anchorA:{x:0,y:-i/2},anchorB:{x:0,y:0}}),e.createHingeJoint(X++,Y,_,{anchorA:{x:0,y:i/2},anchorB:{x:0,y:0}})}e.setGravity(0,0),$.rs=2},onTickRaw:`(world, dt) => {
        if (engineHub) {
            // Apply a gentle impulse to maintain rotation
            if (Math.abs(engineHub.rs) < 0.9) {
                engineHub.applyAngularImpulse(5);
            }
        }
    }`,onTick:(e,n)=>{$&&Math.abs($.rs)<.9&&$.applyAngularImpulse(5)}});let Ce=1,q=null;const ye=[{name:"Cherry",radius:.15,mass:.1,color:"#ff4444",score:1},{name:"Strawberry",radius:.22,mass:.2,color:"#ff6666",score:3},{name:"Grape",radius:.28,mass:.3,color:"#9933ff",score:6},{name:"Dekopon",radius:.35,mass:.4,color:"#ff9933",score:10},{name:"Persimmon",radius:.42,mass:.5,color:"#ff6600",score:15},{name:"Apple",radius:.5,mass:.7,color:"#cc0000",score:21},{name:"Pear",radius:.58,mass:.9,color:"#ffff66",score:28},{name:"Peach",radius:.68,mass:1.2,color:"#ff99cc",score:36},{name:"Pineapple",radius:.8,mass:1.6,color:"#ffff00",score:45},{name:"Melon",radius:.95,mass:2.2,color:"#99ff33",score:55},{name:"Watermelon",radius:1.15,mass:3,color:"#006600",score:66}];let f={score:0,nextFruitLevel:0,isGameOver:!1,lastDropTime:0,dropCooldown:500,mouseX:5,fruitIds:new Map,mergingIds:new Set,previewFruit:null};const Bt=()=>{f.score=0,f.nextFruitLevel=Math.floor(Math.random()*5),f.isGameOver=!1,f.lastDropTime=0,f.mouseX=5,f.fruitIds.clear(),f.mergingIds.clear(),f.previewFruit=null,Ce=1},sn=e=>(e-t.debug.offsetX)/(t.debug.zoom*100),Rt=new k({name:"Fruit Merge",key:"fruit-merge",description:["A physics-based arcade game demonstrating dynamic object spawning and collision events.","Drop fruits into the bucket. Identical fruits will **merge** into the next larger fruit tier on contact.","### Controls","- **Mouse Move**: Position the preview fruit","- **Click**: Drop fruit","**Game Over** occurs if any fruit falls out of the world boundaries."].join(`

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
        world.makeObject(nextId++, {
            x: bx, y: by + bh / 2 + thickness / 2,
            shape: gearbox.shapes.BOX,
            width: bw + thickness * 2, height: thickness,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#664422"
        });

        // Left Wall
        world.makeObject(nextId++, {
            x: bx - bw / 2 - thickness / 2, y: by,
            shape: gearbox.shapes.BOX,
            width: thickness, height: bh,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#664422"
        });

        // Right Wall
        world.makeObject(nextId++, {
            x: bx + bw / 2 + thickness / 2, y: by,
            shape: gearbox.shapes.BOX,
            width: thickness, height: bh,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#664422"
        });

        const spawnFruit = (x: number, y: number, level: number, isInitial: boolean = false) => {
            if (level >= FRUIT_LEVELS.length) return null;
            
            const fruitDef = FRUIT_LEVELS[level];
            const id = nextId++;
            const fruit = world.makeObject(id, {
                x, y,
                shape: gearbox.shapes.CIRCLE,
                radius: fruitDef.radius,
                mass: fruitDef.mass,
                color: fruitDef.color,
                restitution: 0.2,
                staticFriction: 0.5,
                kineticFriction: 0.3,
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

                const objA = world.getObjectById(idA);
                const objB = world.getObjectById(idB);

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
    }`,onInit:e=>{e.clear(),Bt(),t.debug.showAabbs=!1,e.setGravity(0,9.8),e.setHasRestitution(!0),e.setHasFriction(!0);const n=5,o=6,a=4,s=5,i=.2;e.makeObject(Ce++,{x:n,y:o+s/2+i/2,shape:t.shapes.BOX,width:a+i*2,height:i,type:t.bodyTypes.FIXED_OBJECT,color:"#664422"}),e.makeObject(Ce++,{x:n-a/2-i/2,y:o,shape:t.shapes.BOX,width:i,height:s,type:t.bodyTypes.FIXED_OBJECT,color:"#664422"}),e.makeObject(Ce++,{x:n+a/2+i/2,y:o,shape:t.shapes.BOX,width:i,height:s,type:t.bodyTypes.FIXED_OBJECT,color:"#664422"});const c=(p,r,m,h=!1)=>{if(m>=ye.length)return null;const u=ye[m],g=Ce++,y=e.makeObject(g,{x:p,y:r,shape:t.shapes.CIRCLE,radius:u.radius,mass:u.mass,color:u.color,restitution:.2,staticFriction:.5,kineticFriction:.3});return y&&(y.wantsEvents=!0,f.fruitIds.set(g,m),h&&(y.vx=(Math.random()-.5)*.1)),y};e.onCollisionStart=(p,r)=>{if(f.isGameOver)return;const m=f.fruitIds.get(p),h=f.fruitIds.get(r);if(m!==void 0&&h!==void 0&&m===h){if(f.mergingIds.has(p)||f.mergingIds.has(r))return;const u=m;if(u>=ye.length-1)return;f.mergingIds.add(p),f.mergingIds.add(r);const g=e.getObjectById(p),y=e.getObjectById(r);if(g&&y){const w=(g.x+y.x)/2,I=(g.y+y.y)/2;setTimeout(()=>{e.removeObject(p),e.removeObject(r),f.fruitIds.delete(p),f.fruitIds.delete(r),f.mergingIds.delete(p),f.mergingIds.delete(r),c(w,I,u+1)&&(f.score+=ye[u+1].score)},0)}}},q=document.getElementById("debug-canvas"),e._onMouseMove&&q.removeEventListener("mousemove",e._onMouseMove),e._onClick&&q.removeEventListener("click",e._onClick);const l=p=>{if(f.isGameOver)return;const r=q.getBoundingClientRect();f.mouseX=sn(p.clientX-r.left);const m=ye[f.nextFruitLevel].radius;f.mouseX=Math.max(n-a/2+m,Math.min(n+a/2-m,f.mouseX))},d=p=>{if(f.isGameOver){e.clear(),Bt(),Rt.onInit(e);return}const r=Date.now();r-f.lastDropTime>f.dropCooldown&&(c(f.mouseX,o-s/2-1,f.nextFruitLevel,!0),f.nextFruitLevel=Math.floor(Math.random()*5),f.lastDropTime=r)};e._onMouseMove=l,e._onClick=d,q.addEventListener("mousemove",l),q.addEventListener("click",d)},onTickRaw:`(world, dt) => {
        gearbox.debug.clearLabels();

        if (gameState.isGameOver) {
            gearbox.debug.addLabel({ text: "GAME OVER", x: 5, y: 4, fontSize: "48px Arial", color: "#ff4444", position: "on-top" });
            gearbox.debug.addLabel({ text: \`Final Score: \${gameState.score}\`, x: 5, y: 5, fontSize: "24px Arial", color: "#fff", position: "on-top" });
            gearbox.debug.addLabel({ text: "Click to Restart", x: 5, y: 6, fontSize: "20px Arial", color: "#888", position: "on-top" });
            return;
        }

        // Draw Score
        gearbox.debug.addLabel({ text: \`Score: \${gameState.score}\`, x: 0.5, y: 0.5, fontSize: "24px Arial", color: "#fff", textAlign: "left" });

        // Draw Next Fruit Preview
        const nextFruit = FRUIT_LEVELS[gameState.nextFruitLevel];
        gearbox.debug.addLabel({ text: \`Next: \${nextFruit.name}\`, x: 8.0, y: 0.5, fontSize: "18px Arial", color: nextFruit.color, textAlign: "right" });

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
        world.iterateObjects((obj) => {
            if (gameState.fruitIds.has(obj.id)) {
                if (obj.y > 12) { // Fell below the bucket
                    gameState.isGameOver = true;
                }
            }
        });

        gearbox.debug.addLabel({ text: "Fruit Merge", x: 5, y: 0.5, fontSize: "28px Arial", color: "#bbb", position: "on-top" });
    }`,onTick:(e,n)=>{if(t.debug.clearLabels(),f.isGameOver){t.debug.addLabel({text:"GAME OVER",x:5,y:4,fontSize:"48px Arial",color:"#ff4444",position:"on-top"}),t.debug.addLabel({text:`Final Score: ${f.score}`,x:5,y:5,fontSize:"24px Arial",color:"#fff",position:"on-top"}),t.debug.addLabel({text:"Click to Restart",x:5,y:6,fontSize:"20px Arial",color:"#888",position:"on-top"});return}t.debug.addLabel({text:`Score: ${f.score}`,x:.5,y:.5,fontSize:"24px Arial",color:"#fff",textAlign:"left"});const o=ye[f.nextFruitLevel];t.debug.addLabel({text:`Next: ${o.name}`,x:8,y:.5,fontSize:"18px Arial",color:o.color,textAlign:"right"}),t.debug.addLabel({text:"●",x:f.mouseX,y:1.5,fontSize:`${o.radius*200}px Arial`,color:o.color,position:"on-top"}),e.iterateObjects(s=>{f.fruitIds.has(s.id)&&s.y>12&&(f.isGameOver=!0)}),t.debug.addLabel({text:"Fruit Merge",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"})},onCleanup:e=>{q&&(q.removeEventListener("mousemove",e._onMouseMove),q.removeEventListener("click",e._onClick),delete e._onMouseMove,delete e._onClick)}});let E=1,M=null,ue=null,He=null,_e=null,re=[],Z={},J=null,he=null,ee=null;const be=1,ve=2,Q=4,Mt=(e,n)=>({x:(e-t.debug.offsetX)/(t.debug.zoom*100),y:(n-t.debug.offsetY)/(t.debug.zoom*100)}),an=(e,n)=>{if(e.button!==0)return;const o=ee.getBoundingClientRect(),a=Mt(e.clientX-o.left,e.clientY-o.top),s=n.queryPoint(a.x,a.y);if(s.length>0){const i=s[0],c=n.getObjectById(i);c&&c.type!==t.bodyTypes.FIXED_OBJECT&&(J=n.makeObject(999999,{x:a.x,y:a.y,type:t.bodyTypes.FIXED_OBJECT,shape:t.shapes.CIRCLE,radius:.05,color:"transparent",maskBits:0}),he=n.createSpringJoint(999998,J,c,{worldAnchor:a,frequencyHz:5,dampingRatio:1,length:0}))}},rn=e=>{if(J){const n=ee.getBoundingClientRect(),o=Mt(e.clientX-n.left,e.clientY-n.top);J.x=o.x,J.y=o.y}},cn=(e,n)=>{he&&(n.removeJoint(he.id),he=null),J&&(n.removeObject(J.id),J=null)},Dt=new k({name:"Motorcycle Trials",key:"motorcycle",description:["A physically-driven motorcycle featuring multi-joint suspension and a gear-driven powertrain.","### Controls","- **D / A**: Throttle / Reverse","- **W / S**: Lean / Balance","- **R**: Reset Simulation","### Technical Features","- **Power Transfer**: Engine-to-wheel torque transfer using `GearJoint` constraints.","- **Suspension**: A network of `SpringJoint` constraints for authentic front/rear suspension travel.","- **Procedural Terrain**: Dynamic generation with optimized **Collision Masks** (terrain-terrain collisions are disabled for performance)."].join(`

`),onInitRaw:`(world) => {
        world.clear();
        gearbox.debug.showAabbs = false;
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
        chassis = world.makeObject(nextId++, {
            x: cx, y: cy,
            shape: gearbox.shapes.BOX,
            width: 1.2, height: 0.4,
            mass: 10.0,
            color: "#ff4444",
            categoryBits: CAT_CHASSIS,
            maskBits: CAT_TERRAIN
        });
        chassis.angularDamping = 0.5;

        // Engine (internal spinning mass to drive wheels)
        engine = world.makeObject(nextId++, {
            x: cx, y: cy - 0.15,
            shape: gearbox.shapes.CIRCLE,
            radius: 0.25,
            mass: 5.0,
            color: "#444",
            categoryBits: 0, // No collision
            maskBits: 0
        });
        const engineHinge = world.createHingeJoint(nextId++, chassis, engine, { worldAnchor: { x: cx, y: cy - 0.15 } });

        // Rear Suspension Arm (Swingarm)
        const rearArm = world.makeObject(nextId++, {
            x: cx - 0.6, y: cy + 0.2,
            shape: gearbox.shapes.BOX,
            width: 0.6, height: 0.1,
            mass: 1.0,
            color: "#666",
            categoryBits: CAT_CHASSIS,
            maskBits: CAT_TERRAIN
        });
        const rearArmHinge = world.createHingeJoint(nextId++, chassis, rearArm, {
            anchorA: { x: -0.4, y: 0.1 },
            anchorB: { x: 0.3, y: 0 }
        });
        world.createSpringJoint(nextId++, chassis, rearArm, {
            anchorA: { x: -0.6, y: -0.2 },
            anchorB: { x: -0.2, y: 0 },
            frequencyHz: 20.0,
            dampingRatio: 0.5
        });

        // Rear Wheel
        rearWheel = world.makeObject(nextId++, {
            x: cx - 0.9, y: cy + 0.2, // Aligned with arm anchor
            shape: gearbox.shapes.CIRCLE,
            radius: 0.4,
            mass: 2.0,
            color: "#333",
            categoryBits: CAT_WHEEL,
            maskBits: CAT_TERRAIN
        });
        rearWheel.kineticFriction = 2.5;
        rearWheel.staticFriction = 3.0;
        const rearWheelHinge = world.createHingeJoint(nextId++, rearArm, rearWheel, {
            anchorA: { x: -0.3, y: 0 },
            anchorB: { x: 0, y: 0 }
        });

        // Drive Chain (Engine to Rear Wheel)
        world.createGearJoint(nextId++, engineHinge, rearWheelHinge, -2.0);

        // Front Suspension Arm (Forks)
        const frontArm = world.makeObject(nextId++, {
            x: cx + 0.7, y: cy + 0.2,
            shape: gearbox.shapes.BOX,
            width: 0.1, height: 0.8,
            r: 0.3,
            mass: 1.0,
            color: "#666",
            categoryBits: CAT_CHASSIS,
            maskBits: CAT_TERRAIN
        });
        const frontArmHinge = world.createHingeJoint(nextId++, chassis, frontArm, {
            anchorA: { x: 0.5, y: 0 },
            anchorB: { x: 0, y: -0.3 }
        });
        world.createSpringJoint(nextId++, chassis, frontArm, {
            anchorA: { x: 0.2, y: 0.2 },
            anchorB: { x: 0, y: 0.1 },
            frequencyHz: 15.0,
            dampingRatio: 0.7
        });

        // Front Wheel
        frontWheel = world.makeObject(nextId++, {
            x: cx + 0.8, y: cy + 0.5, // Aligned with fork anchor
            shape: gearbox.shapes.CIRCLE,
            radius: 0.4,
            mass: 2.0,
            color: "#333",
            categoryBits: CAT_WHEEL,
            maskBits: CAT_TERRAIN
        });
        frontWheel.kineticFriction = 2.0;
        frontWheel.staticFriction = 2.5;
        const frontWheelHinge = world.createHingeJoint(nextId++, frontArm, frontWheel, {
            anchorA: { x: 0, y: 0.4 },
            anchorB: { x: 0, y: 0 }
        });

        // --- 2. Initial Terrain ---
        const startPlatform = world.makeObject(nextId++, {
            x: cx, y: cy + 2.0,
            shape: gearbox.shapes.BOX,
            width: 20, height: 1.0,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#444",
            categoryBits: CAT_TERRAIN,
            maskBits: CAT_CHASSIS | CAT_WHEEL
        });
        terrainBoxes.push(startPlatform);

        // Back Hill (Steep incline to prevent backing up)
        world.makeObject(nextId++, {
            x: -7.72, y: 0.01,
            r: 1.2, // Very steep (now tilted correctly as \\_)
            shape: gearbox.shapes.BOX,
            width: 15, height: 1.0,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#333",
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
    }`,onInit:e=>{e.clear(),t.debug.showAabbs=!1,E=1,re=[],Z={};const n=5,o=5;e.setGravity(0,9.81),e.setHasRestitution(!0),e.setHasFriction(!0),M=e.makeObject(E++,{x:n,y:o,shape:t.shapes.BOX,width:1.2,height:.4,mass:10,color:"#ff4444",categoryBits:be,maskBits:Q}),M.angularDamping=.5,ue=e.makeObject(E++,{x:n,y:o-.15,shape:t.shapes.CIRCLE,radius:.25,mass:5,color:"#444",categoryBits:0,maskBits:0});const a=e.createHingeJoint(E++,M,ue,{worldAnchor:{x:n,y:o-.15}}),s=e.makeObject(E++,{x:n-.6,y:o+.2,shape:t.shapes.BOX,width:.6,height:.1,mass:1,color:"#666",categoryBits:be,maskBits:Q});e.createHingeJoint(E++,M,s,{anchorA:{x:-.4,y:.1},anchorB:{x:.3,y:0}}),e.createSpringJoint(E++,M,s,{anchorA:{x:-.6,y:-.2},anchorB:{x:-.2,y:0},frequencyHz:20,dampingRatio:.5}),_e=e.makeObject(E++,{x:n-.9,y:o+.2,shape:t.shapes.CIRCLE,radius:.4,mass:2,color:"#333",categoryBits:ve,maskBits:Q}),_e.kineticFriction=2.5,_e.staticFriction=3;const i=e.createHingeJoint(E++,s,_e,{anchorA:{x:-.3,y:0},anchorB:{x:0,y:0}});e.createGearJoint(E++,a,i,-2);const c=e.makeObject(E++,{x:n+.7,y:o+.2,shape:t.shapes.BOX,width:.1,height:.8,r:.3,mass:1,color:"#666",categoryBits:be,maskBits:Q});e.createHingeJoint(E++,M,c,{anchorA:{x:.5,y:0},anchorB:{x:0,y:-.3}}),e.createSpringJoint(E++,M,c,{anchorA:{x:.2,y:.2},anchorB:{x:0,y:.1},frequencyHz:15,dampingRatio:.7}),He=e.makeObject(E++,{x:n+.8,y:o+.5,shape:t.shapes.CIRCLE,radius:.4,mass:2,color:"#333",categoryBits:ve,maskBits:Q}),He.kineticFriction=2,He.staticFriction=2.5,e.createHingeJoint(E++,c,He,{anchorA:{x:0,y:.4},anchorB:{x:0,y:0}});const l=e.makeObject(E++,{x:n,y:o+2,shape:t.shapes.BOX,width:20,height:1,type:t.bodyTypes.FIXED_OBJECT,color:"#444",categoryBits:Q,maskBits:be|ve});re.push(l),e.makeObject(E++,{x:-7.72,y:.01,r:1.2,shape:t.shapes.BOX,width:15,height:1,type:t.bodyTypes.FIXED_OBJECT,color:"#333",categoryBits:Q,maskBits:be|ve});const d=g=>Z[g.code]=!0,p=g=>Z[g.code]=!1;ee=document.getElementById("debug-canvas");const r=g=>an(g,e),m=g=>rn(g),h=g=>cn(g,e),u=e._motorcycleListeners;u&&(window.removeEventListener("keydown",u.onKeyDown),window.removeEventListener("keyup",u.onKeyUp),ee&&ee.removeEventListener("mousedown",u.mouseDownHandler),window.removeEventListener("mousemove",u.mouseMoveHandler),window.removeEventListener("mouseup",u.mouseUpHandler)),window.addEventListener("keydown",d),window.addEventListener("keyup",p),ee.addEventListener("mousedown",r),window.addEventListener("mousemove",m),window.addEventListener("mouseup",h),e._motorcycleListeners={onKeyDown:d,onKeyUp:p,mouseDownHandler:r,mouseMoveHandler:m,mouseUpHandler:h}},onTickRaw:`(world, dt) => {
        if (!chassis) return;

        // --- 3. Controls & Engine ---
        const throttlePower = 150.0;
        const leanPower = 100.0;
        const maxEngineSpeed = 100.0; // Higher top speed

        if (keys['KeyD']) {
            if (engine.rs < maxEngineSpeed) {
                engine.applyAngularImpulse(throttlePower * dt);
            }
        }
        if (keys['KeyA']) {
            if (engine.rs > -maxEngineSpeed) {
                engine.applyAngularImpulse(-throttlePower * dt); 
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

        // --- 4. Camera Follow ---
        const targetX = chassis.x;
        const targetY = chassis.y;
        const canvasWidth = gearbox.debug.canvas?.width || 800;
        const canvasHeight = gearbox.debug.canvas?.height || 600;
        
        // Smoothed camera follow (accounts for zoom)
        const lerp = (a, b, t) => a + (b - a) * t;
        const zoom = gearbox.debug.zoom;
        const idealOffsetX = canvasWidth / 2 - targetX * 100 * zoom;
        const idealOffsetY = canvasHeight / 2 - targetY * 100 * zoom;
        
        gearbox.debug.offsetX = lerp(gearbox.debug.offsetX, idealOffsetX, 0.1);
        gearbox.debug.offsetY = lerp(gearbox.debug.offsetY, idealOffsetY, 0.1);

        // --- 5. Procedural Terrain ---
        const lastBox = terrainBoxes[terrainBoxes.length - 1];
        if (lastBox.x < chassis.x + 25) {
            const width = 6 + Math.random() * 8;
            const height = 1.2;
            const angle = (Math.random() - 0.5) * 0.5;
            
            // Connect middle-right of last box to middle-left of new box
            const gap = Math.random() < 0.2 ? 1.5 : 0; 
            
            // Get middle-right point of previous box in world space
            const lastMR = lastBox.localToWorld({ x: lastBox.width / 2, y: 0 });
            
            // Target position for the middle-left point of the new box
            const targetX = lastMR.x + gap;
            // Vertical variety only if there is a gap, otherwise they connect exactly
            let targetY = lastMR.y + (gap > 0 ? (Math.random() - 0.5) * 3 : 0);
            
            // Clamp targetY to keep the course playable
            targetY = Math.max(2, Math.min(8, targetY));

            // Calculate center of new box such that its middle-left (-w/2, 0) is at (targetX, targetY)
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const nextX = targetX + (width / 2) * cos;
            const nextY = targetY + (width / 2) * sin;

            const box = world.makeObject(nextId++, {
                x: nextX, y: nextY,
                r: angle,
                shape: gearbox.shapes.BOX,
                width: width, height: height,
                type: gearbox.bodyTypes.FIXED_OBJECT,
                color: \`hsl(\${20 + Math.random() * 40}, 30%, \${30 + Math.random() * 20}%)\`, // Earthy tones
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
    }`,onTick:(e,n)=>{if(!M)return;const o=150,a=100,s=100;if(Z.KeyD&&ue.rs<s&&ue.applyAngularImpulse(o*n),Z.KeyA&&ue.rs>-s&&ue.applyAngularImpulse(-o*n),Z.KeyW&&M.applyAngularImpulse(-a*n),Z.KeyS&&M.applyAngularImpulse(a*n),Z.KeyR){Dt.init(e);return}const i=M.x,c=M.y,l=t.debug.canvas?.width||800,d=t.debug.canvas?.height||600,p=(g,y,w)=>g+(y-g)*w,r=t.debug.zoom,m=l/2-i*100*r,h=d/2-c*100*r;t.debug.offsetX=p(t.debug.offsetX,m,.1),t.debug.offsetY=p(t.debug.offsetY,h,.1);const u=re[re.length-1];if(u.x<M.x+25){const g=6+Math.random()*8,y=1.2,w=(Math.random()-.5)*.5,I=Math.random()<.2?1.5:0,B=u.localToWorld({x:u.width/2,y:0}),T=B.x+I;let C=B.y+(I>0?(Math.random()-.5)*3:0);C=Math.max(2,Math.min(8,C));const R=Math.cos(w),H=Math.sin(w),L=T+g/2*R,D=C+g/2*H,pe=e.makeObject(E++,{x:L,y:D,r:w,shape:t.shapes.BOX,width:g,height:y,type:t.bodyTypes.FIXED_OBJECT,color:`hsl(${20+Math.random()*40}, 30%, ${30+Math.random()*20}%)`,categoryBits:Q,maskBits:be|ve});if(re.push(pe),re.length>50){const _=re.shift();e.removeObject(_.id)}}t.debug.clearLabels(),M.x<15&&(t.debug.addLabel({text:"Motorcycle Trials",x:5,y:3,fontSize:"28px Arial",color:"#fff",position:"on-top"}),t.debug.addLabel({text:"Use D/A to drive and W/S to balance!",x:5,y:3.5,fontSize:"16px Arial",color:"#aaa",position:"on-top"}))},onCleanup:e=>{const n=e._motorcycleListeners;n&&(window.removeEventListener("keydown",n.onKeyDown),window.removeEventListener("keyup",n.onKeyUp),ee&&ee.removeEventListener("mousedown",n.mouseDownHandler),window.removeEventListener("mousemove",n.mouseMoveHandler),window.removeEventListener("mouseup",n.mouseUpHandler),delete e._motorcycleListeners),he&&(e.removeJoint(he.id),he=null),J&&(e.removeObject(J.id),J=null),t.debug.offsetX=0,t.debug.offsetY=0}}),ln=[Rt,nn,on,Dt],le=[{name:"Showcase",examples:ln},{name:"General",examples:Vt},{name:"Constraints",examples:Zt},{name:"Optimizations",examples:Qt},{name:"Load Tests",examples:en},{name:"Known Issues",examples:tn}];let dn=`
import gearbox from "gearbox2d";

let world;
{{GLOBAL}}
gearbox.init().then(()=>{
    world = gearbox.makeWorld();
    
    // Optional:
    gearbox.debug.enableDebugGraphics(document.getElementById("debug-canvas"), world);

    init();
    setInterval(()=>{
        tick(1/60);
        world.step();
    }, 1000/60);
})
`.trim();const Ee=()=>window.innerWidth<=768;let te={},U=null;function hn(){const e=document.getElementById("examples-list");e.innerHTML="",le.forEach((n,o)=>{const a=document.createElement("li");a.className="section",a.textContent=n.name,e.appendChild(a),n.examples&&Array.isArray(n.examples)&&n.examples.forEach((s,i)=>{const c=s.key||`${o}-${i}`;te[c]={category:o,index:i,example:s};const l=document.createElement("li");l.className="example",l.textContent=s.name,l.setAttribute("data-example",c),e.appendChild(l)})}),document.querySelectorAll("#sidebar li.example").forEach(n=>{n.addEventListener("click",()=>{document.querySelectorAll("#sidebar li.example.selected").forEach(a=>{a.classList.remove("selected")}),n.classList.add("selected");const o=n.getAttribute("data-example");rt(o,"push"),Ee()&&oe.classList.add("collapsed")})})}let F,Ot=0,Lt=document.getElementById("example-name"),N=document.getElementById("debug-canvas"),ot=document.getElementById("code-section"),pn=document.getElementById("general-code"),mn=document.getElementById("init-code"),gn=document.getElementById("tick-code"),ce=document.getElementById("toggle-code"),yn=document.getElementById("fps"),un=document.getElementById("memory"),bn=document.getElementById("step-time"),vt=document.querySelectorAll(".code-tab"),xn=document.querySelectorAll(".code-panel"),St=document.getElementById("sidebar-toggle"),oe=document.getElementById("sidebar"),fn=document.getElementById("reset-button"),wn=document.getElementById("reset-button-mobile"),Tt=document.getElementById("info-toggle"),Ct=document.getElementById("info-toggle-mobile");Lt.innerHTML="Loading example...";let P=0,st=[],at=[],it=[],Je=1e3/60,Et=0,At=0;t.init().then(()=>{F=t.makeWorld(),t.debug.enableDebugGraphics(N,F);function e(){const r=performance.now(),m=r-Ot,h=Math.max(0,17-m);setTimeout(()=>{const u=performance.now();if(F.step(),U&&te[U]){const C=te[U].example;C&&typeof C.onTick=="function"&&C.onTick(F,m/1e3)}const y=(performance.now()-u)*1e3;let w=st[P%100]??Je,I=at[P%100]??0,B=it[P%100]??0;st[P%100]=m||16.67,at[P%100]=performance.memory.usedJSHeapSize/1048576,it[P%100]=y,Je+=(st[P%100]-w)/100,Et+=(at[P%100]-I)/100,At+=(it[P%100]-B)/100,P++;const T=Je>0?Math.round(1e3/Je):0;yn.innerHTML=`<i class="fas fa-tachometer-alt"></i>FPS: ${T}`,un.innerHTML=`<i class="fas fa-memory"></i>Memory: ${Et.toFixed(2)} MB`,bn.innerHTML=`<i class="fas fa-stopwatch"></i>Step Time: ${At.toFixed(0)} μs`,Ot=r,requestAnimationFrame(e)},h)}hn(),Xt(!0);const n=()=>{U&&rt(U,"none")};fn.addEventListener("click",n),wn.addEventListener("click",n);const o=()=>{document.body.classList.toggle("info-mode");const r=document.body.classList.contains("info-mode"),m=r?"fa-th-large":"fa-info-circle",h=r?"Show Canvas":"Info";[Tt,Ct].forEach(u=>{const g=u.querySelector("i"),y=u.querySelector(".button-text");g&&(g.className=`fas ${m}`),y&&(y.textContent=h),u.title=r?"Show Canvas":"Show Information"}),r||t.debug.centerCamera(5,5)};Tt.addEventListener("click",o),Ct.addEventListener("click",o),e(),Ee()&&oe.classList.add("collapsed"),N.addEventListener("wheel",r=>{r.preventDefault();const m=.05,h=r.offsetX,u=r.offsetY,g=(h-t.debug.offsetX)/t.debug.zoom,y=(u-t.debug.offsetY)/t.debug.zoom,w=-Math.sign(r.deltaY),I=Math.pow(1+m,w),B=Math.min(Math.max(t.debug.zoom*I,.1),10);t.debug.zoom=B,t.debug.offsetX=h-g*t.debug.zoom,t.debug.offsetY=u-y*t.debug.zoom},{passive:!1});let a=!1,s=0,i=0;N.addEventListener("mousedown",r=>{r.button===2&&(a=!0,s=r.clientX,i=r.clientY)}),window.addEventListener("mousemove",r=>{if(a){const m=r.clientX-s,h=r.clientY-i;t.debug.offsetX+=m,t.debug.offsetY+=h,s=r.clientX,i=r.clientY}}),window.addEventListener("mouseup",r=>{r.button===2&&(a=!1)}),N.addEventListener("contextmenu",r=>{r.preventDefault()});let c=0,l=!1,d=0,p=0;N.addEventListener("touchstart",r=>{if(r.touches.length===1)d=r.touches[0].clientX,p=r.touches[0].clientY,l=!1;else if(r.touches.length===2){l=!0;const m=r.touches[0].clientX-r.touches[1].clientX,h=r.touches[0].clientY-r.touches[1].clientY;c=Math.sqrt(m*m+h*h)}},{passive:!1}),N.addEventListener("touchmove",r=>{if(r.touches.length!==0){if(r.preventDefault(),r.touches.length===1&&!l){const m=r.touches[0].clientX,h=r.touches[0].clientY,u=m-d,g=h-p;t.debug.offsetX+=u,t.debug.offsetY+=g,d=m,p=h}else if(r.touches.length===2){const m=r.touches[0],h=r.touches[1],u=m.clientX-h.clientX,g=m.clientY-h.clientY,y=Math.sqrt(u*u+g*g);if(c>0){const w=y/c,I=Math.min(Math.max(t.debug.zoom*w,.1),10),B=(m.clientX+h.clientX)/2,T=(m.clientY+h.clientY)/2,C=N.getBoundingClientRect(),R=B-C.left,H=T-C.top,L=(R-t.debug.offsetX)/t.debug.zoom,D=(H-t.debug.offsetY)/t.debug.zoom;t.debug.zoom=I,t.debug.offsetX=R-L*t.debug.zoom,t.debug.offsetY=H-D*t.debug.zoom}c=y}}},{passive:!1}),N.addEventListener("touchend",r=>{r.touches.length<2&&(l=!1,c=0),r.touches.length===1&&(d=r.touches[0].clientX,p=r.touches[0].clientY)},{passive:!1}),N.addEventListener("touchcancel",r=>{l=!1,c=0},{passive:!1})});function rt(e,n="push"){if(!F||!te[e])return;if(U&&te[U]){const p=te[U].example;p&&typeof p.cleanup=="function"&&p.cleanup(F)}const o="#"+e;window.location.hash!==o&&(n==="push"?history.pushState(null,"",o):n==="replace"&&history.replaceState(null,"",o)),F.clear(),t.debug.clearLabels(),t.debug.showForceVectors=!1,t.debug.showImpulseVectors=!1,F.setHasPenetrationResolution(!0),F.setHasRestitution(!0),F.setHasFriction(!0),F.setGravity(0,0),t.debug.zoom=1,t.debug.centerCamera(5,5),t.debug.showAabbs=!0,U=e;const s=te[e].example;s&&typeof s.onInit=="function"?s.onInit(F):console.error("Example onInit method not found:",s);function i(p,r){if(!p)return`function ${r}${r==="tick"?"(dt)":"()"} {}`;let m=p.split("	").join("    ");const h=[/^\(world\)\s*=>\s*\{/,/^\(world,\s*dt\)\s*=>\s*\{/,/^function\s*\(world\)\s*\{/,/^function\s*\(world,\s*dt\)\s*\{/,/^function\s+init\s*\(world\)\s*\{/,/^function\s+tick\s*\(world,\s*dt\)\s*\{/];let u=!1,g=m.trim();for(const I of h)if(I.test(g)){m=g.replace(I,`function ${r}${r==="tick"?"(dt)":"()"} {`),u=!0;break}u||(m=g.replace(/^.*?=>\s*\{/,`function ${r}${r==="tick"?"(dt)":"()"} {`));let y=m.split(`
`);if(y.length<=1)return m;let w=1/0;for(let I=1;I<y.length;I++){const B=y[I];if(B.trim().length===0)continue;const T=B.search(/\S/);T!==-1&&T<w&&(w=T)}return w===1/0&&(w=0),y.map((I,B)=>B===0?I:I.substring(Math.min(I.length,w))).join(`
`)}let c=s.globalLines?.join(`
`)??"",l=s.onInitRaw||s.onInit?.toString()||"",d=s.onTickRaw||s.onTick?.toString()||"";pn.textContent=dn.split("{{GLOBAL}}").join(c),mn.textContent=i(l,"init"),gn.textContent=i(d,"tick"),Ft(),Lt.textContent=s.name||"Unknown Example",document.getElementById("description").innerHTML=qt.parse(s.description||"")}function Xt(e=!1){let n=window.location.hash.substring(1);const o=!n;if(n||(n="sandbox"),!te[n]){console.log("Example not found directly, searching...");let s=!1;for(let i=0;i<le.length;i++){const c=le[i];if(c.examples&&Array.isArray(c.examples)){for(let l=0;l<c.examples.length;l++)if(c.examples[l].key===n){console.log(`Found example ${n} in category ${i}, index ${l}`),s=!0;break}}if(s)break}if(!s)if(console.warn(`Example with key '${n}' not found, defaulting to first available example`),le.length>0&&le[0].examples&&le[0].examples.length>0)n=le[0].examples[0].key||"0-0";else{console.error("No examples found");return}}const a=document.querySelector(`#sidebar li.example[data-example="${n}"]`);a&&(document.querySelectorAll("#sidebar li.example.selected").forEach(s=>{s.classList.remove("selected")}),a.classList.add("selected")),rt(n,o&&e?"replace":"none")}vt.forEach(e=>{e.addEventListener("click",()=>{vt.forEach(o=>o.classList.remove("active")),xn.forEach(o=>o.classList.remove("active")),e.classList.add("active"),document.getElementById(`${e.dataset.panel}-panel`).classList.add("active")})});function Ft(){document.querySelectorAll("pre").forEach(n=>{const o=n.textContent;n.innerHTML=hljs?.highlight(o,{language:"javascript"}).value})}ce.addEventListener("click",()=>{ot.style.display==="none"?(ot.style.display="block",ce.querySelector("span").textContent="Hide Code",ce.querySelector("i").classList.remove("fa-chevron-down"),ce.querySelector("i").classList.add("fa-chevron-up"),Ft()):(ot.style.display="none",ce.querySelector("span").textContent="Show Code",ce.querySelector("i").classList.remove("fa-chevron-up"),ce.querySelector("i").classList.add("fa-chevron-down"))});St.addEventListener("click",()=>{oe.classList.toggle("collapsed")});window.addEventListener("resize",()=>{Ee()||document.body.classList.remove("info-mode"),Ee()&&!oe.classList.contains("collapsed")&&oe.classList.add("collapsed")});window.addEventListener("click",e=>{Ee()&&!oe.classList.contains("collapsed")&&!oe.contains(e.target)&&e.target!==St&&oe.classList.add("collapsed")});const Te=document.getElementById("copy-code");Te.addEventListener("click",()=>{const n=document.querySelector(".code-panel.active").querySelector("pre").textContent;navigator.clipboard.writeText(n).then(()=>{const o=Te.querySelector("span"),a=Te.querySelector("i"),s=o.textContent;Te.classList.add("success"),o.textContent="Copied!",a.classList.remove("fa-copy"),a.classList.add("fa-check"),setTimeout(()=>{Te.classList.remove("success"),o.textContent=s,a.classList.remove("fa-check"),a.classList.add("fa-copy")},2e3)})});window.addEventListener("popstate",function(e){Xt(!1)});
