import"./modulepreload-polyfill-B5Qt9EMX.js";import{M as Yt}from"./markdown-tUR2hliS.js";import{g as t}from"./world-DF5MwRXX.js";class B{constructor(o){this.onInit=o.onInit,this.onInitRaw=o.onInitRaw,this.onTick=o.onTick,this.onTickRaw=o.onTickRaw,this.onCleanup=o.onCleanup,this.description=o.description,this.name=o.name,this.key=o.key,this.globalLines=o.globalLines||[]}init(o){this.onInit?.(o)}tick(o,n){this.onTick?.(o,n)}cleanup(o){this.onCleanup?.(o)}}let E=1,Ze=0,ne=null,Pe=null,he=null;const Tt=(e,o)=>({x:(e-t.debug.offsetX)/(t.debug.zoom*100),y:(o-t.debug.offsetY)/(t.debug.zoom*100)}),zt=(e,o)=>{if(e.button!==0)return;const n=he.getBoundingClientRect(),a=Tt(e.clientX-n.left,e.clientY-n.top),s=o.queryPoint(a.x,a.y);if(s.length>0){const i=s[0],c=o.getObjectById(i);c&&c.type!==t.bodyTypes.FIXED_OBJECT&&(ne=o.makeObject(999999,{x:a.x,y:a.y,type:t.bodyTypes.FIXED_OBJECT,shape:t.shapes.CIRCLE,radius:.05,color:"transparent",maskBits:0}),Pe=o.createSpringJoint(999998,ne,c,{worldAnchor:a,frequencyHz:3,dampingRatio:1,length:0}))}},Wt=e=>{if(ne){const o=he.getBoundingClientRect(),n=Tt(e.clientX-o.left,e.clientY-o.top);ne.x=n.x,ne.y=n.y}},$t=(e,o)=>{Pe&&(o.removeJoint(Pe.id),Pe=null),ne&&(o.removeObject(ne.id),ne=null)},qt=[new B({name:"Interactive Sandbox",key:"sandbox",description:["Welcome to **Gearbox2D**! This is an interactive playground featuring various shapes and physics properties. Click and drag objects to interact with them.","### Features","- **Point Query**: The engine detects which object is under the mouse using **BVH** and precise shape tests.","- **Mouse Joint**: Uses a `SpringJoint` to pull objects toward the mouse cursor.","- **Collision Filtering**: The mouse 'anchor' object is a sensor that doesn't collide with other objects."].join(`

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
        }`,onInit:e=>{e.clear(),t.debug.showAabbs=!1,E=1,e.setGravity(0,9.8),e.setHasRestitution(!0),e.setHasFriction(!0);const o=1,n=9.2,s=9+o*2,i=n+o*2;e.makeObject(E++,{x:5,y:9+o/2,shape:t.shapes.BOX,width:i,height:o,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}),e.makeObject(E++,{x:5,y:0-o/2,shape:t.shapes.BOX,width:i,height:o,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}),e.makeObject(E++,{x:5-n/2-o/2,y:4.5,shape:t.shapes.BOX,width:o,height:s,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}),e.makeObject(E++,{x:5+n/2+o/2,y:4.5,shape:t.shapes.BOX,width:o,height:s,type:t.bodyTypes.FIXED_OBJECT,color:"#444"});const c=["#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff"],d=8,l=5,h=1,p=1.2,u=5-(d-1)*h/2,g=2;for(let r=0;r<l;r++)for(let m=0;m<d;m++){const y=u+m*h,f=g+r*p,x=c[(r*d+m)%c.length],b={x:y,y:f,mass:1,color:x,linearDamping:.5,angularDamping:1.5};Math.random()<.5?e.makeObject(E++,{...b,shape:t.shapes.CIRCLE,radius:.2+Math.random()*.2,r:Math.random()*Math.PI}):e.makeObject(E++,{...b,shape:t.shapes.BOX,width:.4+Math.random()*.4,height:.4+Math.random()*.4,r:Math.random()*Math.PI})}he=document.getElementById("debug-canvas"),e._mouseDownHandler&&he.removeEventListener("mousedown",e._mouseDownHandler),e._mouseMoveHandler&&window.removeEventListener("mousemove",e._mouseMoveHandler),e._mouseUpHandler&&window.removeEventListener("mouseup",e._mouseUpHandler),e._mouseDownHandler=r=>zt(r,e),e._mouseMoveHandler=r=>Wt(r),e._mouseUpHandler=r=>$t(r,e),he.addEventListener("mousedown",e._mouseDownHandler),window.addEventListener("mousemove",e._mouseMoveHandler),window.addEventListener("mouseup",e._mouseUpHandler)},onCleanup:e=>{he&&(he.removeEventListener("mousedown",e._mouseDownHandler),window.removeEventListener("mousemove",e._mouseMoveHandler),window.removeEventListener("mouseup",e._mouseUpHandler),delete e._mouseDownHandler,delete e._mouseMoveHandler,delete e._mouseUpHandler)},onTickRaw:`(world, dt) => {
            gearbox.debug.clearLabels();
            gearbox.debug.addLabel({ text: "Interactive Sandbox", x: 5, y: 0.5, fontSize: "28px Arial", color: "#bbb", position: "on-top" });
            gearbox.debug.addLabel({ text: "Click and drag objects!", x: 5, y: 1.2, fontSize: "16px Arial", color: "#888", position: "on-top" });
        }`,onTick:(e,o)=>{t.debug.clearLabels(),t.debug.addLabel({text:"Interactive Sandbox",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"}),t.debug.addLabel({text:"Click and drag objects!",x:5,y:1.2,fontSize:"16px Arial",color:"#888",position:"on-top"})}}),new B({name:"Force",key:"force",description:["**Forces** are used to apply acceleration to objects which scale inversely with the object's mass. All forces applied to an object are accumulated and applied in the next world step where they are reset.","Persistent forces must be reapplied on each fixed update (every `tick`).","It's important to note that the change in velocity will be a function of the **force vector**, the object's **mass**, and the **time step**. If you need a specific instantaneous change in velocity, use an **Impulse** instead."].join(`

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
        }`,onTick:(e,o)=>{let n=e.objectsById[1],a=e.objectsById[2],s=a.x-n.x,i=a.y-n.y,c=Math.sqrt(s*s+i*i);s/=c,i/=c;const d=2;n.applyForce(s*d,i*d)}}),new B({name:"Impulse",key:"impulse",description:["**Impulses** are used to apply a sudden change in momentum to an object. It's similar to a force, but modifies the object's velocity **instantaneously**, rather than acting as a persistent push.","In this example we demonstrate both **Linear** and **Angular** impulses.","- The two circles receive vertical linear impulses.","- The box receives periodic angular impulses (torque) causing it to spin without moving its center."].join(`

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
            
        }`,onTick:(e,o)=>{let n=e.objectsById[1],a=e.objectsById[2],s=e.objectsById[3],i=Ze;Ze+=o*5;let c=Math.floor(i),d=Math.floor(Ze);if(c!=d){if(d%2==0){let l=(5-n.y)*.2;l<.05&&l>-.05&&(l=2),n.applyImpulse(0,l),a.applyImpulse(0,l)}d%3==0&&s.applyAngularImpulse(2)}}}),new B({name:"Gravity",key:"gravity",description:["**Gravity** is a 2D acceleration vector that can be set on `World` objects. Gravity is automatically applied as a force to all objects in the world.","In this example, you can see the influence of **damping** on the net force vectors as objects fall through the sensor zone."].join(`

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
        }`,onTick:(e,o)=>{if(Math.random()<.05){let n=.1+Math.random()*.4;e.makeObject(E++,{x:0,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:1+Math.random()*5,vy:-8-Math.random()*8,shape:t.shapes.CIRCLE,type:t.bodyTypes.SENSOR,radius:.2+n*.2,mass:n}),e.objectCount;let a=[];e.iterateObjects(s=>{s.y>10.5&&a.push(s)});for(let s of a)e.removeObject(s.id)}}}),new B({name:"Bounce",key:"bounce",description:["This example demonstrates **Restitution** (bounciness).","The central ball is configured with `restitution: 1.0`, meaning it loses no energy during collisions with the fixed walls, creating a perfectly elastic bounce."].join(`

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
        }`,onTick:(e,o)=>{}}),new B({name:"Collisions",key:"collisions",description:["Collisions are enabled for objects whose type is set to `RIGID_BODY`.","In this example we can see collisions between all of the different supported shape types:","- **CIRCLE**: Optimized circular collisions.","- **BOX**: Oriented bounding boxes with full rotation support.","- **AABB**: Axis-aligned bounding boxes.","- **POINT**: Zero-radius points that collide with larger shapes."].join(`

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
        }`,onTick:(e,o)=>{if(Math.random()<.08){let n=.1+Math.random()*.4,a=1;Math.random()<.5&&(a=-1);let s=.2+n*n*.8,i=.1+Math.random()*(s-.1),c=s*s/i,d=Math.random(),l,h=n;d<.1?(l=t.shapes.POINT,h=.01):d<.2?l=t.shapes.AABB:d<.6?l=t.shapes.BOX:l=t.shapes.CIRCLE,e.makeObject(E++,{x:5-a*5,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*a,vy:-8-Math.random()*2,shape:l,type:t.bodyTypes.RIGID_BODY,radius:l===t.shapes.BOX||l===t.shapes.AABB?c:s,height:l===t.shapes.BOX||l===t.shapes.AABB?i:0,mass:h,linearDamping:0}),e.objectCount;let p=[];e.iterateObjects(u=>{u.y>10.5&&p.push(u)});for(let u of p)e.removeObject(u.id)}}}),new B({name:"Friction",key:"friction",description:["**Friction** is applied as the last step of collision resolution. It handles both **static** and **dynamic** friction, applied as impulses at the point of contact.","Take note of the blue impulse vectors on the platforms which are present when dynamic friction is being applied.","### Scenarios","1. **Reverse Roll**: A circle spinning counter-clockwise transfers its angular momentum to linear momentum upon contact.","2. **Forward Roll**: A spinning circle with no linear momentum begins rolling forward due to friction.","3. **Slide**: A box slides across the platform and grinds to a halt.","4. **Static vs Kinetic**: Two boxes slide down a ramp. The left box has high static friction and stops; the right has no static friction and keeps sliding."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10);let o=1;const n=["Linear to angular momentum transfer.","Angular to linear momentum transfer.","Slide to halt."];for(;o<=3;o++)e.makeObject(o,{x:4.5,y:2.5*o-.5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:9,height:1,mass:1}),t.debug.addLabel({text:n[o-1],x:4.5,y:2.5*o-1.2,fontSize:"20px Arial",color:"#00f2ff",position:"above"});const a=o++;e.makeObject(a,{x:4.5,y:9.7,r:.1,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:9,height:1,mass:1}),t.debug.addLabel({text:"High static vs no static friction.",x:4.5,y:9,fontSize:"20px Arial",color:"#00f2ff",position:"above"});const s=o++;e.makeObject(s,{x:0,y:1,vx:5,rs:-8,kFriction:.8,sFriction:.5,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:.5,mass:.5}),t.debug.addLabel({text:"Reverse",objectId:s,position:"above",fontSize:"10px Arial"});const i=o++;e.makeObject(i,{x:.5,y:3.5,rs:15,kFriction:.2,sFriction:.5,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:.5,mass:.5}),t.debug.addLabel({text:"Forward",objectId:i,position:"above",fontSize:"10px Arial"});const c=o++;e.makeObject(c,{x:.5,y:6,vx:7,kFriction:1.2,sFriction:.5,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:1,mass:.5}),t.debug.addLabel({text:"Slide",objectId:c,position:"above",fontSize:"10px Arial"});const d=o++;e.makeObject(d,{x:.5,y:8,vx:.5,kFriction:.7,sFriction:.7,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:.5,mass:.5}),t.debug.addLabel({text:"Static",objectId:d,position:"above",fontSize:"10px Arial"});const l=o++;e.makeObject(l,{x:1.6,y:8,vx:.5,kFriction:.01,sFriction:0,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:.5,mass:.5}),t.debug.addLabel({text:"Kinetic",objectId:l,position:"above",fontSize:"10px Arial"})},onTickRaw:`(world, dt)=>{

        }`,onTick:(e,o)=>{}}),new B({name:"Collision Masks",key:"collision-masks",description:["**Collision masks** allow you to selectively enable or disable collisions between different groups of objects using bitwise logic.","In this example:","- **Blue objects**: Only collide with blue platforms and other blue objects.","- **Red objects**: Only collide with red platforms and other red objects.","- **Green objects**: Collide with **everything**.","This is implemented using `categoryBits` and `maskBits` properties."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10),t.debug.showForceVectors=!1;const o=E++;e.makeObject(o,{x:2.5,y:8,width:4,height:.5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,categoryBits:1,maskBits:5,color:"#00f2ff"}),t.debug.addLabel({text:"Collides with Blue & Green",objectId:o,color:"#00f2ff",position:"below"});const n=E++;e.makeObject(n,{x:7.5,y:8,width:4,height:.5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,categoryBits:2,maskBits:6,color:"#ff4444"}),t.debug.addLabel({text:"Collides with Red & Green",objectId:n,color:"#ff4444",position:"below"});const a=E++;e.makeObject(a,{x:5,y:4,width:2,height:.5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,categoryBits:4,maskBits:7,color:"#44ff44"}),t.debug.addLabel({text:"Collides with All",objectId:a,color:"#44ff44",position:"below"})},onTickRaw:`(world, dt)=>{
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
        }`,onTick:(e,o)=>{if(Math.random()<.05){const a=E++,s=Math.floor(Math.random()*3);let i,c,d;s===0?(i="#00f2ff",c=1,d=5):s===1?(i="#ff4444",c=2,d=6):(i="#44ff44",c=4,d=7),e.makeObject(a,{x:2+Math.random()*6,y:0,radius:.3,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,mass:1,categoryBits:c,maskBits:d,color:i}),t.debug.addLabel({text:`Cat:0x${c.toString(16)} Mask:0x${d.toString(16)}`,objectId:a,color:i,position:"above",fontSize:"10px Arial"})}let n=[];e.iterateObjects(a=>{a.y>11&&n.push(a)});for(let a of n)e.removeObject(a.id)}}),new B({name:"Object Types",key:"object-types",description:["This example showcases the four fundamental object types in **Gearbox2D** and how they interact:","1. **Fixed Objects** (Gray): Immovable platforms with infinite mass. They form the static environment.","2. **Kinematic Objects** (Purple): Move via velocity but are unaffected by forces. They can 'push' other objects but are never pushed back.","3. **Rigid Bodies** (Colorful): Fully dynamic objects affected by gravity, forces, and collisions.","4. **Sensors** (Green Zone): Detect overlaps without causing a physical response. Here, a sensor acts as a **Recycling Zone** to remove objects."].join(`

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
        }`,onInit:e=>{e.clear(),e.setGravity(0,10),E=1,e.makeObject(E++,{x:5,y:9.7,width:8,height:.6,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}),e.makeObject(E++,{x:1,y:7,width:.2,height:6,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}),e.makeObject(E++,{x:9,y:7,width:.2,height:6,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,color:"#444"});const o=e.makeObject(E++,{x:5,y:4,width:3.5,height:.3,shape:t.shapes.BOX,type:t.bodyTypes.KINEMATIC_OBJECT,color:"#a0f",rs:1.5});t.debug.addLabel({text:"Kinematic Rotor",objectId:o.id,position:"above",color:"#a0f"});const n=e.makeObject(E++,{x:2.5,y:7,width:1.5,height:.3,shape:t.shapes.BOX,type:t.bodyTypes.KINEMATIC_OBJECT,color:"#a0f",vx:1});e.elevator=n,t.debug.addLabel({text:"Kinematic Elevator",objectId:n.id,position:"above",color:"#a0f"});const a=e.makeObject(E++,{x:5,y:8.8,width:4,height:1.2,shape:t.shapes.BOX,type:t.bodyTypes.SENSOR,color:"rgba(0, 255, 100, 0.15)",wantsEvents:!0});t.debug.addLabel({text:"Sensor Recycler",objectId:a.id,position:"on-top",color:"#4f4"}),e.recyclerId=a.id,e.toRemove=new Set,e.onCollisionStart=(s,i)=>{const c=e.recyclerId,d=s===c?i:i===c?s:null;if(d!==null){const l=e.getObjectById(d);l&&l.type===t.bodyTypes.RIGID_BODY&&(e.toRemove.add(d),l.color="#4f4")}}},onTickRaw:`(world, dt) => {
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
        }`,onTick:(e,o)=>{const n=e.elevator;if(n&&(n.x>7.5&&(n.vx=-1.5),n.x<2.5&&(n.vx=1.5)),e.stepCount%20===0){const i=["#ff4444","#4444ff","#ffff44","#ff44ff","#44ffff"],c=Math.random()>.5,d=3+Math.random()*4;e.makeObject(E++,{x:d,y:.5,shape:c?t.shapes.CIRCLE:t.shapes.BOX,radius:.25,width:.5,height:.5,mass:.5+Math.random()*1,type:t.bodyTypes.RIGID_BODY,color:i[Math.floor(Math.random()*i.length)],restitution:.3})}const a=e.toRemove;if(a&&a.size>0){for(const i of a)e.getObjectById(i)&&e.removeObject(i);a.clear()}let s=[];e.iterateObjects(i=>{(i.y>11||i.y<-5||i.x>11||i.x<-1)&&i.type===t.bodyTypes.RIGID_BODY&&s.push(i.id)});for(const i of s)e.removeObject(i)},onCleanup:e=>{e.onCollisionStart=void 0,delete e.elevator,delete e.recyclerId,delete e.toRemove}})];let I=1,re=[],ue=null,z=null,we=null,V=null,W=null,Oe=0,ke=0;const Nt=[new B({name:"Simple Hinge",key:"simple-hinge",description:["A single `BOX` object attached to a `FIXED_OBJECT` by a **Hinge Joint** constraint.","The hinge allows rotation around a single point while preventing all linear relative motion. In this case, it creates a simple gravity-driven pendulum."].join(`

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
        }`,onInit:e=>{I=1;const o=e.makeObject(I++,{x:5,y:3,shape:t.shapes.BOX,width:1,height:1,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444"}),n=e.makeObject(I++,{x:8,y:3,shape:t.shapes.BOX,width:4,height:.5,mass:.1,color:"#44ff44"});e.createHingeJoint(I++,o,n,{worldAnchor:{x:5,y:3}}),e.setGravity(0,9.81)}}),new B({name:"Breakable Joint",key:"breakable-joint",description:["This demo showcases **Joint Reaction Forces** and dynamic joint removal.","1. A ball is suspended by a **Hinge Joint**. Its mass increases until the reaction force exceeds a threshold, snapping the joint.","2. The ball falls onto a bridge made of `SpringJoint` segments, which also have breaking thresholds.","You can visualize the stress on the joints by enabling **Force Vectors** in the debug settings."].join(`

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
        }`,onInit:e=>{I=1,t.debug.showAabbs=!1,re=[],ue=null,z=null;const o=e.makeObject(I++,{x:5,y:1,shape:t.shapes.CIRCLE,radius:.2,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444"});z=e.makeObject(I++,{x:5,y:2.5,shape:t.shapes.CIRCLE,radius:.4,mass:.05,color:"#888888"}),ue=e.createHingeJoint(I++,o,z,{worldAnchor:{x:5,y:1}});const n=2,a=8,s=6,i=12,c=(a-n)/i,d=.2,l=e.makeObject(I++,{x:n-c/2,y:s,shape:t.shapes.BOX,width:c,height:.5,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}),h=e.makeObject(I++,{x:a+c/2,y:s,shape:t.shapes.BOX,width:c,height:.5,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"});let p=l;for(let g=0;g<i;g++){const r=e.makeObject(I++,{x:n+g*c+c/2,y:s,shape:t.shapes.BOX,width:c*.9,height:d,mass:.2,color:"#cd853f",categoryBits:4,maskBits:-5}),m=e.createSpringJoint(I++,p,r,{worldAnchor:{x:n+g*c,y:s},frequencyHz:4,dampingRatio:1});re.push(m),p=r}const u=e.createSpringJoint(I++,p,h,{worldAnchor:{x:a,y:s},frequencyHz:4,dampingRatio:1});re.push(u),e.setGravity(0,10),t.debug.showForceVectors=!0,z.applyImpulse(.2,0)},onTickRaw:`(world, dt) => {
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
        }`,onTick:(e,o)=>{if(z&&(z.mass+=o*3,t.debug.removeObjectLabels(z.id),t.debug.addLabel({text:`Mass: ${z.mass.toFixed(2)}kg`,objectId:z.id,position:"above",color:"#fff"})),ue){const n=ue.reactionForce;Math.sqrt(n.x*n.x+n.y*n.y)>150&&(e.removeJoint(ue.id),ue=null)}if(re.length>0)for(let n=re.length-1;n>=0;n--){const a=re[n],s=a.reactionForce;Math.sqrt(s.x*s.x+s.y*s.y)>600&&(e.removeJoint(a.id),re.splice(n,1))}}}),new B({name:"Gear Train",key:"gear-train",description:["A sequence of gears connected using the `GearJoint` constraint.","Each gear's motion is constrained by the previous one based on a **gear ratio** (calculated here by the relative radii).","A drive gear at the start receives a constant low torque, which is then propagated through the entire train with mechanical advantage."].join(`

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
        }`,onInit:e=>{I=1;const o=2,n=5,a=5,s=1.5,i=e.makeObject(I++,{x:5,y:5,shape:t.shapes.AABB,width:6.2,height:.2,type:t.bodyTypes.FIXED_OBJECT,color:"#888",maskBits:0});let c=null;we=null;for(let d=0;d<a;d++){const l=d%2===0?1:.5,h=e.makeObject(I++,{x:o+d*s,y:n,shape:t.shapes.CIRCLE,radius:l,mass:l,color:`hsl(${d*60}, 70%, 60%)`}),p=e.createHingeJoint(I++,i,h,{worldAnchor:{x:o+d*s,y:n}});if(d===0)we=h;else{const g=((d-1)%2===0?1:.5)/l;e.createGearJoint(I++,c,p,g)}c=p}},onTickRaw:`(world, dt) => {
            if (engineHub) {
                // Apply a persistent but relatively low angular impulse to the drive gear
                if(Math.abs(engineHub.rs) < 0.9) {
                    engineHub.applyAngularImpulse(0.01);
                }
            }
        }`,onTick:(e,o)=>{we&&Math.abs(we.rs)<.9&&we.applyAngularImpulse(.01)}}),new B({name:"Distance Ropes",key:"distance-ropes",description:["Demonstrates the `DistanceJoint`, which maintains a fixed distance between two points on two different bodies.","A rotating drum has multiple triple-link chains hanging from it. Each link is connected by a `DistanceJoint` with a specified length, simulating a non-stretchy rope or chain."].join(`

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
        }`,onInit:e=>{t.debug.showAabbs=!1,I=1;const o=5,n=5,a=4,s=e.makeObject(I++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:.5,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444"});V=e.makeObject(I++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:a,mass:100,color:"rgba(255, 255, 255, 0.05)",maskBits:0,angularDamping:.5}),e.createHingeJoint(I++,s,V,{worldAnchor:{x:o,y:n}});const i=8,c=3.8,d=.8,l=()=>({x:(Math.random()-.5)*.3,y:(Math.random()-.5)*.3});for(let h=0;h<i;h++){const p=h/i*Math.PI*2,u=o+Math.cos(p)*c,g=n+Math.sin(p)*c,r=u-Math.cos(p)*.5,m=g-Math.sin(p)*.5,y=e.makeObject(I++,{x:r,y:m,shape:h%2===0?t.shapes.BOX:t.shapes.CIRCLE,width:.5,height:.5,radius:.25,mass:.5,color:`hsl(${h*360/i}, 70%, 60%)`}),f=V.worldToLocal({x:u,y:g});e.createDistanceJoint(I++,V,y,{anchorA:f,anchorB:l(),length:d});const x=r-Math.cos(p)*d,b=m-Math.sin(p)*d,T=e.makeObject(I++,{x,y:b,shape:(h+1)%2===0?t.shapes.BOX:t.shapes.CIRCLE,width:.5,height:.5,radius:.25,mass:.5,color:`hsl(${h*360/i}, 70%, 50%)`});e.createDistanceJoint(I++,y,T,{anchorA:l(),anchorB:l(),length:d});const k=x-Math.cos(p)*d,C=b-Math.sin(p)*d,R=e.makeObject(I++,{x:k,y:C,shape:(h+2)%2===0?t.shapes.BOX:t.shapes.CIRCLE,width:.5,height:.5,radius:.25,mass:.5,color:`hsl(${h*360/i}, 70%, 40%)`});e.createDistanceJoint(I++,T,R,{anchorA:l(),anchorB:l(),length:d})}e.setGravity(0,9.81),V.rs=.2},onTickRaw:`(world, dt) => {
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
        }`,onTick:(e,o)=>{if(V){const n=Date.now()/1e3,a=n%12;let s=0,i=2;a<4?(s=1.2,i=4):a<6?(s=0,i=1):a<10?(s=Math.sin(n*4)*2,i=8):s=0;const c=s-V.rs;Math.abs(c)>.05&&V.applyAngularImpulse(c*i)}}}),new B({name:"Spring Belt",key:"spring-belt",description:["A chain of shapes connected by `SpringJoint` constraints, forming a belt around a rotating high-friction pulley.","The `SpringJoint` acts like a dampened harmonic oscillator, pulling objects together with a force proportional to their distance and frequency. The belt stretches and contracts as it interacts with the central rotor."].join(`

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
        }`,onInit:e=>{t.debug.showAabbs=!1,I=1;const o=5,n=3,a=2.5,s=3.5,i=e.makeObject(I++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#666666",maskBits:0});W=e.makeObject(I++,{x:o,y:n,rs:2.5,shape:t.shapes.CIRCLE,radius:a,type:t.bodyTypes.RIGID_BODY,mass:10,color:"#888888",sFriction:1,kFriction:1,angularDamping:.1}),e.createHingeJoint(I++,i,W,{worldAnchor:{x:o,y:n}});const c=16,d=[];for(let l=0;l<c;l++){const h=l/c*Math.PI*2,p=o+Math.cos(h)*s,u=n+Math.sin(h)*s,g=e.makeObject(I++,{x:p,y:u,shape:l%2===0?t.shapes.BOX:t.shapes.CIRCLE,width:.6,height:.6,radius:.3,mass:1.5,color:`hsl(${l*360/c}, 70%, 60%)`,sFriction:.999,kFriction:.99});d.push(g)}for(let l=0;l<c;l++){const h=d[l],p=d[(l+1)%c],u=p.x-h.x,g=p.y-h.y,r=Math.sqrt(u*u+g*g);e.createSpringJoint(I++,h,p,{length:r*1.1,frequencyHz:5,dampingRatio:.2})}e.setGravity(0,9.81)},onTickRaw:`(world, dt) => {
            if (rotator) {
                // Apply a persistent angular impulse until we reach target speed
                if(Math.abs(rotator.rs) < 2.5) {
                    rotator.applyAngularImpulse(1.0);
                }
            }
        }`,onTick:(e,o)=>{W&&Math.abs(W.rs)<2.5&&W.applyAngularImpulse(1)}}),new B({name:"Soft Body Ball",key:"soft-body",description:["A collection of `CIRCLE` objects connected by a network of `SpringJoint` constraints to form a squishy, deformable ball.","The ball features a central core (axel) connected to an outer ring of nodes. This setup simulates **Soft Body Dynamics** using a mass-spring system.","Persistent random impulses are applied to the core to keep the ball moving and demonstrate its elasticity."].join(`

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
        }`,onInit:e=>{t.debug.showAabbs=!1,I=1;const o=5,n=3,a=2,s=12,i=[],c=.2,d=e.makeObject(I++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:c,mass:2,color:"#ff8888",sFriction:.9,kFriction:.9});W=d,Oe=0,ke=-30;for(let l=0;l<s;l++){const h=l/s*Math.PI*2,p=o+Math.cos(h)*a,u=n+Math.sin(h)*a,g=e.makeObject(I++,{x:p,y:u,shape:t.shapes.CIRCLE,radius:.2,mass:.5,color:"#8888ff",sFriction:.9,kFriction:.9});i.push(g),e.createSpringJoint(I++,d,g,{anchorA:{x:Math.cos(h)*c,y:Math.sin(h)*c},length:a-c,frequencyHz:4,dampingRatio:.5}),l>0&&e.createSpringJoint(I++,i[l-1],g,{length:2*a*Math.sin(Math.PI/s),frequencyHz:4,dampingRatio:.5})}e.createSpringJoint(I++,i[s-1],i[0],{length:2*a*Math.sin(Math.PI/s),frequencyHz:4,dampingRatio:.5}),e.makeObject(I++,{x:5,y:10,shape:t.shapes.BOX,width:15,height:2,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa",sFriction:.9,kFriction:.9}),e.makeObject(I++,{x:-3.5,y:4.25,shape:t.shapes.BOX,width:2,height:10,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}),e.makeObject(I++,{x:13.5,y:4.25,shape:t.shapes.BOX,width:2,height:10,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}),e.setGravity(0,9.81)},onTickRaw:`(world, dt) => {
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
        }`,onTick:(e,o)=>{W&&(ke<=0&&(Math.random()<.02?(Oe=(Math.random()-.5)*3,ke=40+Math.random()*80):Oe=0),ke>0&&(W.applyAngularImpulse(Oe),W.applyImpulse(Oe*.1,0),ke--))}})];let Qe=0,Be=1;const Ut=[new B({name:"Sleep and Islands",key:"sleep-and-islands",description:["**Sleep** optimization in **Gearbox2D** uses a movement-based heuristic computed during the kinematics step.","Instead of rebuilding a complex global island data structure each tick, each object tracks its own local contacts. When an object wakes up (due to a force or collision), it automatically wakes its neighbors.","This provides the performance benefits of **Islands** with significantly lower overhead."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10),Qe=3,Be=0,e.makeObject(Be++,{x:5,y:8.5,width:20,height:1,vx:0,vy:0,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,mass:2})},onTickRaw:`(world, dt)=>{
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
        }`,onTick:(e,o)=>{Qe+=o*2,Math.floor(Qe/3)>Be&&Be<10&&e.makeObject(Be++,{x:5,y:0,r:(Math.random()-.5)*.1,width:6,height:.5,vx:0,vy:0,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,mass:.2,sFriction:10,kFriction:10})}}),new B({name:"Shrink Wrap",key:"shrink-wrap",description:["Objects that are put to **Sleep** have their **AABBs** 'shrink-wrapped' to their exact shape bounds.","This provides a slight performance boost during broad-phase collision detection by reducing false positives in the BVH tree for stationary objects."].join(`

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
        }`,onTick:(e,o)=>{}})],Kt=[new B({name:"Circles",key:"particles",description:["A **Load Test** featuring 2,000 `CIRCLE` objects with full collision resolution.","This demo helps visualize the performance of the **BVH (Bounding Volume Hierarchy)** and the narrow-phase collision solver.","**Note**: In many environments, the primary bottleneck will be the Canvas 2D rendering rather than the physics simulation."].join(`

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
        }`,onInit:e=>{let o=1,n=2,a=11;e.makeObject(o++,{x:5,y:0,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:a,height:n,restitution:.99}),e.makeObject(o++,{x:5,y:10,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:a,height:n,restitution:.99}),e.makeObject(o++,{x:0,y:5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:n,height:a,restitution:.99}),e.makeObject(o++,{x:10,y:5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:n,height:a,restitution:.99});for(let s=0;s<2e3;s++)e.makeObject(o++,{x:Math.random()*8+1,y:Math.random()*8+1,vx:Math.random()*1-.5,vy:Math.random()*1-.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*20,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:.05,mass:.5,linearDamping:0,angularDamping:.5,restitution:.5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new B({name:"Fleas",key:"fleas",description:["A stress test with 2,000 bouncy `POINT` objects.","Point objects have zero radius and don't collide with each other, but they do collide with other shapes (like the `AABB` walls in this demo). This allows for extremely high-density simulations."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10);let n=1,a=2,s=11;e.makeObject(n++,{x:5,y:0,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:s,height:a,restitution:.99}),e.makeObject(n++,{x:5,y:10,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:s,height:a,restitution:.99}),e.makeObject(n++,{x:0,y:5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:a,height:s,restitution:.99}),e.makeObject(n++,{x:10,y:5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:a,height:s,restitution:.99});for(let i=0;i<2e3;i++)e.makeObject(n++,{x:Math.random()*8+1,y:Math.random()*8+1,vx:Math.random()*10-5,r:Math.PI/2*Math.random(),shape:t.shapes.POINT,type:t.bodyTypes.RIGID_BODY,radius:.05,mass:2,linearDamping:0,angularDamping:.5,restitution:.99})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}})];let et=0,bt=1;const Vt=[new B({name:"TC-1 (SOLVED)",key:"tc-1",hidden:!0,description:["**Test Case 1**: Verifies stability during box-on-box collisions.","Previously, boxes would exhibit 'jitter' or 'explosive' behavior when colliding at certain angles."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10);let o=1;e.makeObject(o++,{x:5,y:8,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:1,height:1,mass:1}),e.makeObject(o++,{x:7,y:2,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:5,height:1,mass:1}),e.makeObject(o++,{x:3,y:5,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:5,height:1,mass:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new B({name:"TC-2 (SOLVED)",key:"tc-2",hidden:!0,description:["**Test Case 2**: Ensures `BOX` shapes do not tunnel through `AABB` shapes.","This test case was used to refine the overlap detection and penetration resolution logic for different boundary types."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10);let o=1;e.makeObject(o++,{x:5,y:8,r:Math.PI/2,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:1,height:1,mass:1}),e.makeObject(o++,{x:7,y:2,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:5,height:1,mass:1}),e.makeObject(o++,{x:3,y:5,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:5,height:1,mass:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new B({name:"TC-3 (SOLVED)",key:"tc-3",description:["**Test Case 3**: Momentum preservation and angular transfer.","Previously, objects would lose too much linear momentum during eccentric collisions. The solver now correctly calculates the balance between linear and angular velocity transfer."].join(`

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
        }`,onInit:e=>{e.setGravity(0,0);let o=1;e.makeObject(o++,{x:8,y:5,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:1,height:1,mass:1}),e.makeObject(o++,{x:2,y:3,vx:3,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:5,mass:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new B({name:"TC-4 (SOLVED)",key:"tc-4",hidden:!0,description:["**Test Case 4**: Correctness of angular velocity direction.","Ensures that objects receive torque in the physically correct direction based on the contact point and normal."].join(`

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
        }`,onInit:e=>{e.setGravity(0,0);let o=1;e.makeObject(o++,{x:8,y:5,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:1,height:1,mass:1}),e.makeObject(o++,{x:2,y:6,vx:3,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:5,mass:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new B({name:"TC-5 (SOLVED)",key:"tc-5",hidden:!0,description:["**Test Case 5**: Sensitivity to initial rotation.","Fixes an issue where even tiny angular velocities (`rs`) caused disproportionate collision responses. Also verifies that rotating objects transfer angular momentum in opposing directions."].join(`

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
        }`,onInit:e=>{e.setGravity(0,0);let o=1;e.makeObject(o++,{x:5,y:5,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:1,mass:4}),e.makeObject(o++,{x:2.8,y:2,vx:3,vy:3,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:.5,mass:1,rs:.01})},onTickRaw:`(gearbox, world, dt)=>{
        }`,onTick:(e,o,n)=>{}}),new B({name:"TC-6 (SOLVED)",key:"tc-6",description:["**Test Case 6**: Contact point calculation accuracy.","Uses edge-clipping techniques to ensure stable and accurate impulse application during complex box-box collisions."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10),e.setHasFriction(!1);let o=1;e.makeObject(o++,{x:5,y:6,r:Math.PI/8,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:8,height:1}),e.makeObject(o++,{x:2,y:2,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:1,mass:.2})},onTickRaw:`(gearbox, world, dt)=>{
        }`,onTick:(e,o,n)=>{}}),new B({name:"TC-7 (SOLVED)",key:"tc-7",description:["**Test Case 7**: Friction normal vector correctness.","Ensures that friction impulses are applied exactly tangent to the contact normal, even when restitution is high."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10);let o=1;e.makeObject(o++,{x:5,y:6,r:.1,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:8,height:1,restitution:0}),e.makeObject(o++,{x:2,y:2,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:1,mass:.2,restitution:0})},onTickRaw:`(gearbox, world, dt)=>{
        }`,onTick:(e,o,n)=>{}}),new B({name:"TC-8 (SOLVED)",key:"tc-8",description:["**Test Case 8**: Stability of high-frequency circle collisions.","Verifies that multiple circles colliding in quick succession do not cause simulation instability or tunneling."].join(`

`),globalLines:["let nextId = 1;"],onInitRaw:`(world)=>{
            world.setGravity(0, 10);
            impulseTimer = 0;

            // Objects will be created in the tick function.
        }`,onInit:e=>{e.setGravity(0,10),et=0},onTickRaw:`(world, dt)=>{
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
        }`,onTick:(e,o)=>{if(et++,et%60==0){let n=.1+Math.random()*.4,a=.2+n*n*.8;e.makeObject(bt++,{x:0,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*1,vy:-6-Math.random()*1,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:a,mass:n}),n=.1+Math.random()*.4,a=.2+n*n*.8,e.makeObject(bt++,{x:10,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*-1,vy:-6-Math.random()*1,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:a,mass:n}),e.objectCount;let s=[];e.iterateObjects(i=>{i.y>10.5&&s.push(i)});for(let i of s)e.removeObject(i.id)}}}),new B({name:"TC-9 (SOLVED)",key:"tc-9",description:["**Test Case 9**: Resting stability.","A small box resting on a larger fixed box to verify that gravity and normal impulses reach equilibrium without constant jitter."].join(`

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
        }`,onInit:e=>{e.setGravity(0,1);let o=1;e.makeObject(o++,{x:5,y:6,r:Math.PI/2,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:1,height:8}),e.makeObject(o++,{x:7,y:5,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:1,mass:.2})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new B({name:"TC-10 (SOLVED)",key:"tc-10",description:["**Test Case 10**: Circle-AABB penetration resolution.","Fixes extreme responses when a circle falls directly onto a large axis-aligned platform."].join(`

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
        }`,onInit:e=>{e.setGravity(0,3);let o=1;e.makeObject(o++,{x:5,y:8,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:8,height:1}),e.makeObject(o++,{x:7,y:2,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:1,mass:.2,restitution:1,rs:-.1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new B({name:"TC-11 (SOLVED)",key:"tc-11",description:["**Test Case 11**: Stuck objects and overlap logic.","Ensures that small circles do not get 'embedded' within other shapes when subjected to high-velocity collisions or deep initial overlaps."].join(`

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
        }`,onInit:e=>{let o=1;e.makeObject(o++,{x:5,y:5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:1,height:5}),e.makeObject(o++,{x:5.2,y:5,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:.1,mass:.2,restitution:.5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new B({name:"TC-12 (SOLVED)",key:"tc-12",description:["**Test Case 12**: Sinking prevention under high gravity.","Verifies that boxes maintain their position on top of other objects even when high downward forces are applied, ensuring the penetration resolution is sufficient."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10);let o=1;e.makeObject(o++,{x:5,y:6,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:8,height:1}),e.makeObject(o++,{x:7,y:4,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:1,mass:.2})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new B({name:"TC-13 (SOLVED)",key:"tc-13",description:["**Test Case 13**: Stuck objects and overlap logic.","Ensures that small circles do not get 'embedded' within other shapes when subjected to high-velocity collisions or deep initial overlaps."].join(`

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
        }`,onInit:e=>{let o=1;e.makeObject(o++,{x:5,y:5,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:1,height:5}),e.makeObject(o++,{x:5.2,y:5,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:.1,mass:.2,restitution:.5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}})];let w=1,xt=null,ft=null,It=null,G=null;const Zt=new B({name:"Mechanical Clockwork",key:"clockwork",description:["A physically regulated mechanical clock. This version uses a **Grashof-compliant Crank-Rocker** mechanism to ensure continuous rotation.","### Features","- **Regulated Motion**: A 2.0m pendulum defines a 9-second period in low gravity (1.0 m/s²).","- **Grashof Linkage**: Precision geometry allows the drive gear to complete full 360° rotations.","- **Kinematic Drive**: The escapement gear is driven at a fixed rotation speed to ensure perfect timekeeping.","- **Multi-stage Reduction**: 7 `GearJoint` stages step down the escapement's motion to hours and minutes.","- **Real-time Sync**: The hands and gear train initialize to your local system time."].join(`

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

        const pendCenter = world.makeObject(nextId++, { x: cx, y: pendPivotY, shape: gearbox.shapes.CIRCLE, radius: 0.1, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#888", categoryBits: CAT_STATIC, maskBits: 0 });
        const escCenter = world.makeObject(nextId++, { x: cx, y: escapementY, shape: gearbox.shapes.CIRCLE, radius: 0.1, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#888", categoryBits: CAT_STATIC, maskBits: 0 });
        const center = world.makeObject(nextId++, { x: cx, y: cy, shape: gearbox.shapes.CIRCLE, radius: 0.1, type: gearbox.bodyTypes.FIXED_OBJECT, color: "#888", categoryBits: CAT_STATIC, maskBits: 0 });

        const initialPendAngle = 0.5;
        pendulum = world.makeObject(nextId++, {
            x: cx + Math.sin(initialPendAngle) * pendulumLength,
            y: pendPivotY + Math.cos(initialPendAngle) * pendulumLength,
            r: -initialPendAngle,
            shape: gearbox.shapes.CIRCLE, radius: 0.4, mass: 5.0, color: "#cd853f", categoryBits: CAT_MECH, maskBits: 0
        });
        pendulum.angularDamping = 0.01;
        world.createHingeJoint(nextId++, pendCenter, pendulum, { worldAnchor: { x: cx, y: pendPivotY }, anchorB: { x: 0, y: -pendulumLength } });

        const fastGear = world.makeObject(nextId++, { 
            x: cx + p.escXOffset, y: escapementY, r: 0, 
            shape: gearbox.shapes.CIRCLE, radius: 0.5, 
            type: gearbox.bodyTypes.KINEMATIC_OBJECT,
            color: "#aaa", categoryBits: CAT_GEAR, maskBits: 0 
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
    }`,onInit:e=>{e.clear(),t.debug.showAabbs=!1,w=1;const o=5,n=2.5,a=1;e.setGravity(0,a),e.setHasRestitution(!0),e.setHasFriction(!0);const s=1,i=2,c=4,d=8,l=new Date,h=l.getSeconds(),p=l.getMinutes(),u=l.getHours()%12,g={crankRadius:.251412,groundDist:.962005,rockerLength:.788035,escXOffset:0,conRodFreq:15,conRodDamping:1,springFreq:.5,springX:o-1.5},r=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1",m=document.getElementById("clock-tuner-gui");m&&m.remove();const y=document.createElement("div");y.id="clock-tuner-gui",y.style="position:fixed;top:20px;right:20px;width:280px;background:rgba(0,0,0,0.85);color:#0f0;padding:15px;border-radius:8px;font-family:monospace;z-index:1000;box-shadow:0 4px 15px rgba(0,0,0,0.5);font-size:12px;border:1px solid #333;",r&&document.body.appendChild(y);const f=document.createElement("div");f.style="margin:15px 0;padding:10px;border:1px solid #0f0;text-align:center;font-size:16px;font-weight:bold;",f.textContent="Score: 0",y.appendChild(f);const x=document.createElement("button");x.textContent="Export to Console",x.style="width:100%;padding:8px;background:#0f0;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;margin-bottom:5px;",x.onclick=()=>console.log("Final Parameters:",JSON.stringify(g,null,4)),y.appendChild(x);const b=document.createElement("button");b.textContent="Start Auto-Optimize",b.style="width:100%;padding:8px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;",b.onclick=()=>{const v=e.scoreState;v.isOptimizing=!v.isOptimizing,b.textContent=v.isOptimizing?"Stop Auto-Optimize":"Start Auto-Optimize",b.style.background=v.isOptimizing?"#f00":"#444",v.isOptimizing&&(v.bestScore=-1/0,v.optimizationStage="PREPARE",v.optParamIndex=0,v.optDirection=1,v.epsilon=.05,v.lastImprovementIteration=0,console.log("Starting Auto-Optimization..."))},y.appendChild(b);const T=document.createElement("div");T.style="margin-top:10px;font-size:10px;color:#aaa;",T.textContent="Optimizer: Idle",y.appendChild(T);const k={},C=(v,A,ae,ie,Pt)=>{const Fe=document.createElement("div");Fe.style.marginBottom="10px";const He=document.createElement("div");He.textContent=`${v}: ${g[A].toFixed(2)}`;const J=document.createElement("input");J.type="range",J.min=ae,J.max=ie,J.step=Pt,J.value=g[A],J.style.width="100%",J.oninput=()=>{g[A]=parseFloat(J.value),He.textContent=`${v}: ${g[A].toFixed(2)}`,it()},Fe.appendChild(He),Fe.appendChild(J),y.appendChild(Fe),k[A]={slider:J,labelEl:He,label:v}},R=v=>{const A=k[v];A&&(A.slider.value=g[v],A.labelEl.textContent=`${A.label}: ${g[v].toFixed(2)}`)};C("Crank Radius","crankRadius",.05,.5,.01),C("Ground Distance","groundDist",.5,2,.05),C("Rocker Length","rockerLength",.3,1.5,.05),C("Esc X Offset","escXOffset",-.5,.5,.01),C("Rod Frequency","conRodFreq",5,50,1),C("Spring Frequency","springFreq",.1,2,.05),C("Spring X Pos","springX",o-3,o-.5,.1);const M=n+2,S=M-g.groundDist,F=a*Math.pow(8/(2*Math.PI),2);F-g.rockerLength;const Ie=e.makeObject(w++,{x:o,y:M,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),me=e.makeObject(w++,{x:o,y:S,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),K=e.makeObject(w++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),ge=.5;G=e.makeObject(w++,{x:o+Math.sin(ge)*F,y:M+Math.cos(ge)*F,r:-ge,shape:t.shapes.CIRCLE,radius:.4,mass:5,color:"#cd853f",categoryBits:i,maskBits:0}),G.angularDamping=.01,e.createHingeJoint(w++,Ie,G,{worldAnchor:{x:o,y:M},anchorB:{x:0,y:-F}});const _=e.makeObject(w++,{x:o+g.escXOffset,y:S,r:0,shape:t.shapes.CIRCLE,radius:.5,type:t.bodyTypes.KINEMATIC_OBJECT,color:"#aaa",categoryBits:c,maskBits:0});_.rs=Math.PI*2/8;const Ae=e.createHingeJoint(w++,me,_,{worldAnchor:{x:o+g.escXOffset,y:S}}),Ye={x:g.crankRadius,y:0},ye={x:0,y:-g.rockerLength},Re=()=>{const v=o+g.escXOffset,A=M-g.groundDist,ae={x:v+g.crankRadius,y:A},ie={x:o,y:M+(F-g.rockerLength)};return Math.sqrt(Math.pow(ae.x-ie.x,2)+Math.pow(ae.y-ie.y,2))},se=e.createSpringJoint(w++,_,G,{anchorA:Ye,anchorB:ye,length:Re(),frequencyHz:g.conRodFreq,dampingRatio:g.conRodDamping}),it=()=>{const v=M-g.groundDist,A=o+g.escXOffset;me.x=A,me.y=v,_.x=A,_.y=v,Ae.localAnchorA=me.worldToLocal({x:A,y:v}),se.localAnchorA={x:g.crankRadius,y:0},se.localAnchorB={x:0,y:-g.rockerLength},se.length=Re(),se.frequencyHz=g.conRodFreq,se.dampingRatio=g.conRodDamping};e.scoreState={fastGear:_,pendulum:G,params:g,updateSimulation:it,updateSliderUI:R,optStatus:T,lastFastR:_.r,lastPendRs:G.rs,lastRsSign:Math.sign(G.rs),rsSignChanges:0,maxAngle:-1/0,minAngle:1/0,hasCrossedZero:!1,history:[],periodTimes:[],lastPendSide:Math.sign(G.r),lastPendCrossing:0,scoreDisplay:f,isOptimizing:!1};const Lt=8/60,ze=o+1.5,We=S+.5,Xt=e.makeObject(w++,{x:ze,y:We,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),rt=e.makeObject(w++,{x:ze,y:We,shape:t.shapes.CIRCLE,radius:1,mass:.2,r:0,color:"#44ff44",categoryBits:c,maskBits:0});rt.angularDamping=.02;const ct=e.createHingeJoint(w++,Xt,rt,{worldAnchor:{x:ze,y:We}});e.createGearJoint(w++,Ae,ct,.25);const je=h/60*Math.PI*2,dt=e.makeObject(w++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:.6,mass:.2,r:je,color:"#ff4444",categoryBits:c,maskBits:0});dt.angularDamping=.02;const $e=e.createHingeJoint(w++,K,dt,{worldAnchor:{x:o,y:n}});e.createGearJoint(w++,ct,$e,Lt/.25);const Me=p/60*Math.PI*2,De=u/12*Math.PI*2,Se=3.5,Le=3,Xe=2;for(let v=0;v<12;v++){const A=v/12*Math.PI*2-Math.PI/2,ae=3.8,ie=4;e.makeObject(w++,{x:o+Math.cos(A)*(ae+ie)/2,y:n+Math.sin(A)*(ae+ie)/2,r:A+Math.PI/2,shape:t.shapes.BOX,width:v%3===0?.2:.1,height:.4,type:t.bodyTypes.FIXED_OBJECT,color:"#999",categoryBits:s,maskBits:0})}xt=e.makeObject(w++,{x:o+Math.sin(je)*(Se/2-.2),y:n-Math.cos(je)*(Se/2-.2),r:je,shape:t.shapes.BOX,width:.05,height:Se,mass:.1,color:"#ff4444",categoryBits:d,maskBits:0});const Ft=e.createHingeJoint(w++,K,xt,{worldAnchor:{x:o,y:n},anchorB:{x:0,y:Se/2-.2}});e.createGearJoint(w++,$e,Ft,-1);const qe=o-1.5,Ne=n-1.5,Ht=e.makeObject(w++,{x:qe,y:Ne,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),lt=e.makeObject(w++,{x:qe,y:Ne,shape:t.shapes.CIRCLE,radius:1,mass:.2,r:0,color:"#4444ff",categoryBits:c,maskBits:0});lt.angularDamping=.01;const ht=e.createHingeJoint(w++,Ht,lt,{worldAnchor:{x:qe,y:Ne}});e.createGearJoint(w++,$e,ht,1/10);const pt=e.makeObject(w++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:.8,mass:.2,r:Me,color:"#4444ff",categoryBits:c,maskBits:0});pt.angularDamping=.01;const Ue=e.createHingeJoint(w++,K,pt,{worldAnchor:{x:o,y:n}});e.createGearJoint(w++,ht,Ue,1/6),ft=e.makeObject(w++,{x:o+Math.sin(Me)*(Le/2-.3),y:n-Math.cos(Me)*(Le/2-.3),r:Me,shape:t.shapes.BOX,width:.12,height:Le,mass:.2,color:"#4444ff",categoryBits:d,maskBits:0});const _t=e.createHingeJoint(w++,K,ft,{worldAnchor:{x:o,y:n},anchorB:{x:0,y:Le/2-.3}});e.createGearJoint(w++,Ue,_t,-1);const Ke=o+2,Ve=n-1,Jt=e.makeObject(w++,{x:Ke,y:Ve,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),mt=e.makeObject(w++,{x:Ke,y:Ve,shape:t.shapes.CIRCLE,radius:1,mass:.2,r:0,color:"#cccc44",categoryBits:c,maskBits:0});mt.angularDamping=.01;const gt=e.createHingeJoint(w++,Jt,mt,{worldAnchor:{x:Ke,y:Ve}});e.createGearJoint(w++,Ue,gt,1/3);const yt=e.makeObject(w++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:1.1,mass:.2,r:De,color:"#cc8844",categoryBits:c,maskBits:0});yt.angularDamping=.01;const ut=e.createHingeJoint(w++,K,yt,{worldAnchor:{x:o,y:n}});e.createGearJoint(w++,gt,ut,1/4),It=e.makeObject(w++,{x:o+Math.sin(De)*(Xe/2-.4),y:n-Math.cos(De)*(Xe/2-.4),r:De,shape:t.shapes.BOX,width:.18,height:Xe,mass:.3,color:"#cc8844",categoryBits:d,maskBits:0});const Gt=e.createHingeJoint(w++,K,It,{worldAnchor:{x:o,y:n},anchorB:{x:0,y:Xe/2-.4}});e.createGearJoint(w++,ut,Gt,-1)},onTickRaw:`(world, dt) => {
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
    }`,onTick:(e,o)=>{const n=e.scoreState;if(n){const i=performance.now(),c=8e3;let d=0,l=!1;if(n.fastGear){const k=n.fastGear.r-n.lastFastR;k<-.01&&(l=!0),d=Math.max(0,k)/(Math.PI*2),n.lastFastR=n.fastGear.r}const h=n.pendulum.r,p=n.pendulum.rs,u=(p-n.lastPendRs)/o;n.lastPendRs=p;const g=Math.sign(p);if(g!==n.lastRsSign&&g!==0&&(n.rsSignChanges++,n.lastRsSign=g),n.maxAngle=Math.max(n.maxAngle,h),n.minAngle=Math.min(n.minAngle,h),n.history.push({time:i,rotDelta:d,isReversal:l,pendR:h,pendRs:p,pendRa:u}),n.pendulum){const k=Math.sign(n.pendulum.r);if(k!==n.lastPendSide&&k!==0){if(n.hasCrossedZero=!0,n.lastPendCrossing>0){const C=(i-n.lastPendCrossing)/500;C>.5&&C<10&&n.periodTimes.push({time:i,period:C})}n.lastPendCrossing=i,n.lastPendSide=k}}const r=i-c;for(;n.history.length>0&&n.history[0].time<r;)n.history.shift();for(;n.periodTimes.length>0&&n.periodTimes[0].time<r;)n.periodTimes.shift();let m=0,y=0,f=0;if(n.history.length>0){let k=0,C=0;for(const R of n.history)k+=Math.abs(R.pendRa),C+=Math.abs(R.pendRs),f=Math.max(f,Math.abs(R.pendRa));m=k/n.history.length,y=C/n.history.length}const x=(n.maxAngle-n.minAngle)/2;let b=Math.min(x,.6)*2e3;const T=Math.abs(n.maxAngle+n.minAngle);if(b-=T*1e3,b-=m*10,b-=f*2,n.rsSignChanges>2&&(b-=(n.rsSignChanges-2)*500),b+=y*100,n.hasCrossedZero||(b-=1e4),x<.1&&(b-=5e3),!n.isOptimizing&&n.history.length===0&&(n.maxAngle=-1/0,n.minAngle=1/0,n.hasCrossedZero=!1,n.rsSignChanges=0),n.scoreDisplay.textContent=`Score: ${Math.floor(b)} | Amp: ${x.toFixed(2)} | Jit: ${Math.max(0,n.rsSignChanges-2)}${n.hasCrossedZero?"":" [STUCK]"}`,n.isOptimizing){const k=["crankRadius","groundDist","rockerLength","escXOffset","conRodFreq"];n.optimizationStage==="PREPARE"?(n.bestScore=-1/0,n.optimizationStage="TWEAK",n.evalTimer=i+c,n.improvedThisCycle=!1,n.maxAngle=-1/0,n.minAngle=1/0,n.hasCrossedZero=!1,n.rsSignChanges=0):i>n.evalTimer&&n.optimizationStage==="TWEAK"&&(b>n.bestScore?(n.bestScore=b,n.improvedThisCycle=!0,n.optStatus.textContent=`Improved ${k[n.optParamIndex]} (Best: ${Math.floor(b)})`):(n.params[k[n.optParamIndex]]-=n.epsilon*n.optDirection,n.updateSimulation(),n.updateSliderUI(k[n.optParamIndex])),n.optDirection*=-1,n.optDirection===1&&(n.optParamIndex++,n.optParamIndex>=k.length&&(n.optParamIndex=0,n.improvedThisCycle||(n.epsilon*=.7),n.improvedThisCycle=!1)),n.params[k[n.optParamIndex]]+=n.epsilon*n.optDirection,n.updateSimulation(),n.updateSliderUI(k[n.optParamIndex]),n.maxAngle=-1/0,n.minAngle=1/0,n.hasCrossedZero=!1,n.rsSignChanges=0,n.evalTimer=i+c,n.optStatus.textContent=`Testing ${k[n.optParamIndex]} (${n.optDirection>0?"+":"-"}) Best: ${Math.floor(n.bestScore)}`)}else n.optStatus.textContent="Optimizer: Idle"}const s=new Date().toLocaleTimeString();if(t.debug.clearLabels(),t.debug.addLabel({text:"Mechanical Clockwork",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"}),t.debug.addLabel({text:s,x:5,y:9.5,fontSize:"36px Arial",color:"#fff",position:"on-top"}),G){const i=(G.r*180/Math.PI).toFixed(1);t.debug.addLabel({text:`Pendulum: ${i}°`,x:8,y:8,fontSize:"16px Arial",color:"#cd853f",position:"on-top"})}},onCleanup:e=>{const o=document.getElementById("clock-tuner-gui");o&&o.remove()}});let X=1,$=null;const Qt=new B({name:"Gnome Omega Engine",key:"gnome-omega",description:["A detailed simulation of a **Gnome Omega** rotary engine. In this classic radial design, the crankshaft remains stationary while the entire cylinder block rotates around it.","### Features","- **Stationary Crankshaft**: A fixed pivot point (red) offset from the center.","- **Rotating Crankcase**: The main grey hub that carries the cylinders.","- **Weld Constraints**: Cylinders are 'welded' to the hub using a combination of `HingeJoint` and `DistanceJoint` for maximum stability.","- **Reciprocating Motion**: Pistons and connecting rods are synchronized via `HingeJoint` constraints.","- **Collision Masks**: Bitwise filtering ensures pistons only interact with their respective cylinder walls.","Click **Reset** if the simulation becomes unstable due to extreme angular velocities."].join(`

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
    }`,onInit:e=>{e.clear(),t.debug.showAabbs=!1,X=1,$=null;const o=5,n=4.5,a=.8,s=7,i=2.5,c=256,d=512,l=1024,h=2048,p=4096,u=e.makeObject(X++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:.15,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:c,maskBits:0}),g=e.makeObject(X++,{x:o,y:n+a,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444",categoryBits:c,maskBits:0});$=e.makeObject(X++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:.8,mass:50,color:"#aaa",categoryBits:d,maskBits:0,restitution:0}),e.createHingeJoint(X++,u,$,{worldAnchor:{x:o,y:n}});for(let r=0;r<s;r++){const m=r/s*Math.PI*2,y=Math.cos(m),f=Math.sin(m),x=m-Math.PI/2,b=2.6,T=.28,k=2.5,C=1,R=_=>{const Ae=o+y*b+-f*(_*C/2),Ye=n+f*b+y*(_*C/2),ye=e.makeObject(X++,{x:Ae,y:Ye,r:x,shape:t.shapes.BOX,width:T,height:k,mass:1,color:"#bbb",categoryBits:l,maskBits:h,restitution:0,sFriction:0,kFriction:0}),Re=ye.localToWorld({x:0,y:-k/2}),se=ye.localToWorld({x:0,y:k/2});e.createHingeJoint(X++,$,ye,{worldAnchor:Re}),e.createDistanceJoint(X++,$,ye,{worldAnchor:se})};R(-1),R(1);const M=a*Math.sin(m)+Math.sqrt(i*i-Math.pow(a*Math.cos(m),2)),S=o+y*M,Y=n+f*M,F=e.makeObject(X++,{x:S,y:Y,r:x,shape:t.shapes.BOX,width:.7,height:1,mass:.5,color:"#ddd",categoryBits:h,maskBits:l,restitution:0,sFriction:0,kFriction:0}),Ie=(o+S)/2,me=(n+a+Y)/2,K=Math.atan2(Y-(n+a),S-o)-Math.PI/2,ge=e.makeObject(X++,{x:Ie,y:me,r:K,shape:t.shapes.BOX,width:.15,height:i,mass:.2,color:"#fff",categoryBits:p,maskBits:0,restitution:0});e.createHingeJoint(X++,ge,g,{anchorA:{x:0,y:-i/2},anchorB:{x:0,y:0}}),e.createHingeJoint(X++,ge,F,{anchorA:{x:0,y:i/2},anchorB:{x:0,y:0}})}e.setGravity(0,0),$.rs=2},onTickRaw:`(world, dt) => {
        if (engineHub) {
            // Apply a gentle impulse to maintain rotation
            if (Math.abs(engineHub.rs) < 0.9) {
                engineHub.applyAngularImpulse(5);
            }
        }
    }`,onTick:(e,o)=>{$&&Math.abs($.rs)<.9&&$.applyAngularImpulse(5)}});let Te=1,q=null;const be=[{name:"Cherry",radius:.15,mass:.1,color:"#ff4444",score:1},{name:"Strawberry",radius:.22,mass:.2,color:"#ff6666",score:3},{name:"Grape",radius:.28,mass:.3,color:"#9933ff",score:6},{name:"Dekopon",radius:.35,mass:.4,color:"#ff9933",score:10},{name:"Persimmon",radius:.42,mass:.5,color:"#ff6600",score:15},{name:"Apple",radius:.5,mass:.7,color:"#cc0000",score:21},{name:"Pear",radius:.58,mass:.9,color:"#ffff66",score:28},{name:"Peach",radius:.68,mass:1.2,color:"#ff99cc",score:36},{name:"Pineapple",radius:.8,mass:1.6,color:"#ffff00",score:45},{name:"Melon",radius:.95,mass:2.2,color:"#99ff33",score:55},{name:"Watermelon",radius:1.15,mass:3,color:"#006600",score:66}];let O={score:0,nextFruitLevel:0,isGameOver:!1,lastDropTime:0,dropCooldown:500,mouseX:5,fruitIds:new Map,mergingIds:new Set,previewFruit:null};const wt=()=>{O.score=0,O.nextFruitLevel=Math.floor(Math.random()*5),O.isGameOver=!1,O.lastDropTime=0,O.mouseX=5,O.fruitIds.clear(),O.mergingIds.clear(),O.previewFruit=null,Te=1},en=e=>(e-t.debug.offsetX)/(t.debug.zoom*100),Et=new B({name:"Fruit Merge",key:"fruit-merge",description:["A physics-based arcade game demonstrating dynamic object spawning and collision events.","Drop fruits into the bucket. Identical fruits will **merge** into the next larger fruit tier on contact.","### Controls","- **Mouse Move**: Position the preview fruit","- **Click**: Drop fruit","**Game Over** occurs if any fruit falls out of the world boundaries."].join(`

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
    }`,onInit:e=>{e.clear(),wt(),t.debug.showAabbs=!1,e.setGravity(0,9.8),e.setHasRestitution(!0),e.setHasFriction(!0);const o=5,n=6,a=4,s=5,i=.2;e.makeObject(Te++,{x:o,y:n+s/2+i/2,shape:t.shapes.BOX,width:a+i*2,height:i,type:t.bodyTypes.FIXED_OBJECT,color:"#664422"}),e.makeObject(Te++,{x:o-a/2-i/2,y:n,shape:t.shapes.BOX,width:i,height:s,type:t.bodyTypes.FIXED_OBJECT,color:"#664422"}),e.makeObject(Te++,{x:o+a/2+i/2,y:n,shape:t.shapes.BOX,width:i,height:s,type:t.bodyTypes.FIXED_OBJECT,color:"#664422"});const c=(h,p,u,g=!1)=>{if(u>=be.length)return null;const r=be[u],m=Te++,y=e.makeObject(m,{x:h,y:p,shape:t.shapes.CIRCLE,radius:r.radius,mass:r.mass,color:r.color,restitution:.2,staticFriction:.5,kineticFriction:.3});return y&&(y.wantsEvents=!0,O.fruitIds.set(m,u),g&&(y.vx=(Math.random()-.5)*.1)),y};e.onCollisionStart=(h,p)=>{if(O.isGameOver)return;const u=O.fruitIds.get(h),g=O.fruitIds.get(p);if(u!==void 0&&g!==void 0&&u===g){if(O.mergingIds.has(h)||O.mergingIds.has(p))return;const r=u;if(r>=be.length-1)return;O.mergingIds.add(h),O.mergingIds.add(p);const m=e.getObjectById(h),y=e.getObjectById(p);if(m&&y){const f=(m.x+y.x)/2,x=(m.y+y.y)/2;setTimeout(()=>{e.removeObject(h),e.removeObject(p),O.fruitIds.delete(h),O.fruitIds.delete(p),O.mergingIds.delete(h),O.mergingIds.delete(p),c(f,x,r+1)&&(O.score+=be[r+1].score)},0)}}},q=document.getElementById("debug-canvas"),e._onMouseMove&&q.removeEventListener("mousemove",e._onMouseMove),e._onClick&&q.removeEventListener("click",e._onClick);const d=h=>{if(O.isGameOver)return;const p=q.getBoundingClientRect();O.mouseX=en(h.clientX-p.left);const u=be[O.nextFruitLevel].radius;O.mouseX=Math.max(o-a/2+u,Math.min(o+a/2-u,O.mouseX))},l=h=>{if(O.isGameOver){e.clear(),wt(),Et.onInit(e);return}const p=Date.now();p-O.lastDropTime>O.dropCooldown&&(c(O.mouseX,n-s/2-1,O.nextFruitLevel,!0),O.nextFruitLevel=Math.floor(Math.random()*5),O.lastDropTime=p)};e._onMouseMove=d,e._onClick=l,q.addEventListener("mousemove",d),q.addEventListener("click",l)},onTickRaw:`(world, dt) => {
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
    }`,onTick:(e,o)=>{if(t.debug.clearLabels(),O.isGameOver){t.debug.addLabel({text:"GAME OVER",x:5,y:4,fontSize:"48px Arial",color:"#ff4444",position:"on-top"}),t.debug.addLabel({text:`Final Score: ${O.score}`,x:5,y:5,fontSize:"24px Arial",color:"#fff",position:"on-top"}),t.debug.addLabel({text:"Click to Restart",x:5,y:6,fontSize:"20px Arial",color:"#888",position:"on-top"});return}t.debug.addLabel({text:`Score: ${O.score}`,x:.5,y:.5,fontSize:"24px Arial",color:"#fff",textAlign:"left"});const n=be[O.nextFruitLevel];t.debug.addLabel({text:`Next: ${n.name}`,x:8,y:.5,fontSize:"18px Arial",color:n.color,textAlign:"right"}),t.debug.addLabel({text:"●",x:O.mouseX,y:1.5,fontSize:`${n.radius*200}px Arial`,color:n.color,position:"on-top"}),e.iterateObjects(s=>{O.fruitIds.has(s.id)&&s.y>12&&(O.isGameOver=!0)}),t.debug.addLabel({text:"Fruit Merge",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"})},onCleanup:e=>{q&&(q.removeEventListener("mousemove",e._onMouseMove),q.removeEventListener("click",e._onClick),delete e._onMouseMove,delete e._onClick)}});let j=1,D=null,xe=null,_e=null,Je=null,ce=[],Z={},H=null,pe=null,ee=null;const fe=1,ve=2,Q=4,At=(e,o)=>({x:(e-t.debug.offsetX)/(t.debug.zoom*100),y:(o-t.debug.offsetY)/(t.debug.zoom*100)}),tn=(e,o)=>{if(e.button!==0)return;const n=ee.getBoundingClientRect(),a=At(e.clientX-n.left,e.clientY-n.top),s=o.queryPoint(a.x,a.y);if(s.length>0){const i=s[0],c=o.getObjectById(i);c&&c.type!==t.bodyTypes.FIXED_OBJECT&&(H=o.makeObject(999999,{x:a.x,y:a.y,type:t.bodyTypes.FIXED_OBJECT,shape:t.shapes.CIRCLE,radius:.05,color:"transparent",maskBits:0}),pe=o.createSpringJoint(999998,H,c,{worldAnchor:a,frequencyHz:5,dampingRatio:1,length:0}))}},nn=e=>{if(H){const o=ee.getBoundingClientRect(),n=At(e.clientX-o.left,e.clientY-o.top);H.x=n.x,H.y=n.y}},on=(e,o)=>{pe&&(o.removeJoint(pe.id),pe=null),H&&(o.removeObject(H.id),H=null)},Rt=new B({name:"Motorcycle Trials",key:"motorcycle",description:["A physically-driven motorcycle featuring multi-joint suspension and a gear-driven powertrain.","### Controls","- **D / A**: Throttle / Reverse","- **W / S**: Lean / Balance","- **R**: Reset Simulation","### Technical Features","- **Power Transfer**: Engine-to-wheel torque transfer using `GearJoint` constraints.","- **Suspension**: A network of `SpringJoint` constraints for authentic front/rear suspension travel.","- **Procedural Terrain**: Dynamic generation with optimized **Collision Masks** (terrain-terrain collisions are disabled for performance)."].join(`

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
    }`,onInit:e=>{e.clear(),t.debug.showAabbs=!1,j=1,ce=[],Z={};const o=5,n=5;e.setGravity(0,9.81),e.setHasRestitution(!0),e.setHasFriction(!0),D=e.makeObject(j++,{x:o,y:n,shape:t.shapes.BOX,width:1.2,height:.4,mass:10,color:"#ff4444",categoryBits:fe,maskBits:Q}),D.angularDamping=.5,xe=e.makeObject(j++,{x:o,y:n-.15,shape:t.shapes.CIRCLE,radius:.25,mass:5,color:"#444",categoryBits:0,maskBits:0});const a=e.createHingeJoint(j++,D,xe,{worldAnchor:{x:o,y:n-.15}}),s=e.makeObject(j++,{x:o-.6,y:n+.2,shape:t.shapes.BOX,width:.6,height:.1,mass:1,color:"#666",categoryBits:fe,maskBits:Q});e.createHingeJoint(j++,D,s,{anchorA:{x:-.4,y:.1},anchorB:{x:.3,y:0}}),e.createSpringJoint(j++,D,s,{anchorA:{x:-.6,y:-.2},anchorB:{x:-.2,y:0},frequencyHz:20,dampingRatio:.5}),Je=e.makeObject(j++,{x:o-.9,y:n+.2,shape:t.shapes.CIRCLE,radius:.4,mass:2,color:"#333",categoryBits:ve,maskBits:Q}),Je.kineticFriction=2.5,Je.staticFriction=3;const i=e.createHingeJoint(j++,s,Je,{anchorA:{x:-.3,y:0},anchorB:{x:0,y:0}});e.createGearJoint(j++,a,i,-2);const c=e.makeObject(j++,{x:o+.7,y:n+.2,shape:t.shapes.BOX,width:.1,height:.8,r:.3,mass:1,color:"#666",categoryBits:fe,maskBits:Q});e.createHingeJoint(j++,D,c,{anchorA:{x:.5,y:0},anchorB:{x:0,y:-.3}}),e.createSpringJoint(j++,D,c,{anchorA:{x:.2,y:.2},anchorB:{x:0,y:.1},frequencyHz:15,dampingRatio:.7}),_e=e.makeObject(j++,{x:o+.8,y:n+.5,shape:t.shapes.CIRCLE,radius:.4,mass:2,color:"#333",categoryBits:ve,maskBits:Q}),_e.kineticFriction=2,_e.staticFriction=2.5,e.createHingeJoint(j++,c,_e,{anchorA:{x:0,y:.4},anchorB:{x:0,y:0}});const d=e.makeObject(j++,{x:o,y:n+2,shape:t.shapes.BOX,width:20,height:1,type:t.bodyTypes.FIXED_OBJECT,color:"#444",categoryBits:Q,maskBits:fe|ve});ce.push(d),e.makeObject(j++,{x:-7.72,y:.01,r:1.2,shape:t.shapes.BOX,width:15,height:1,type:t.bodyTypes.FIXED_OBJECT,color:"#333",categoryBits:Q,maskBits:fe|ve});const l=m=>Z[m.code]=!0,h=m=>Z[m.code]=!1;ee=document.getElementById("debug-canvas");const p=m=>tn(m,e),u=m=>nn(m),g=m=>on(m,e),r=e._motorcycleListeners;r&&(window.removeEventListener("keydown",r.onKeyDown),window.removeEventListener("keyup",r.onKeyUp),ee&&ee.removeEventListener("mousedown",r.mouseDownHandler),window.removeEventListener("mousemove",r.mouseMoveHandler),window.removeEventListener("mouseup",r.mouseUpHandler)),window.addEventListener("keydown",l),window.addEventListener("keyup",h),ee.addEventListener("mousedown",p),window.addEventListener("mousemove",u),window.addEventListener("mouseup",g),e._motorcycleListeners={onKeyDown:l,onKeyUp:h,mouseDownHandler:p,mouseMoveHandler:u,mouseUpHandler:g}},onTickRaw:`(world, dt) => {
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
    }`,onTick:(e,o)=>{if(!D)return;const n=150,a=100,s=100;if(Z.KeyD&&xe.rs<s&&xe.applyAngularImpulse(n*o),Z.KeyA&&xe.rs>-s&&xe.applyAngularImpulse(-n*o),Z.KeyW&&D.applyAngularImpulse(-a*o),Z.KeyS&&D.applyAngularImpulse(a*o),Z.KeyR){Rt.init(e);return}const i=D.x,c=D.y,d=t.debug.canvas?.width||800,l=t.debug.canvas?.height||600,h=(m,y,f)=>m+(y-m)*f,p=t.debug.zoom,u=d/2-i*100*p,g=l/2-c*100*p;t.debug.offsetX=h(t.debug.offsetX,u,.1),t.debug.offsetY=h(t.debug.offsetY,g,.1);const r=ce[ce.length-1];if(r.x<D.x+25){const m=6+Math.random()*8,y=1.2,f=(Math.random()-.5)*.5,x=Math.random()<.2?1.5:0,b=r.localToWorld({x:r.width/2,y:0}),T=b.x+x;let k=b.y+(x>0?(Math.random()-.5)*3:0);k=Math.max(2,Math.min(8,k));const C=Math.cos(f),R=Math.sin(f),M=T+m/2*C,S=k+m/2*R,Y=e.makeObject(j++,{x:M,y:S,r:f,shape:t.shapes.BOX,width:m,height:y,type:t.bodyTypes.FIXED_OBJECT,color:`hsl(${20+Math.random()*40}, 30%, ${30+Math.random()*20}%)`,categoryBits:Q,maskBits:fe|ve});if(ce.push(Y),ce.length>50){const F=ce.shift();e.removeObject(F.id)}}t.debug.clearLabels(),D.x<15&&(t.debug.addLabel({text:"Motorcycle Trials",x:5,y:3,fontSize:"28px Arial",color:"#fff",position:"on-top"}),t.debug.addLabel({text:"Use D/A to drive and W/S to balance!",x:5,y:3.5,fontSize:"16px Arial",color:"#aaa",position:"on-top"}))},onCleanup:e=>{const o=e._motorcycleListeners;o&&(window.removeEventListener("keydown",o.onKeyDown),window.removeEventListener("keyup",o.onKeyUp),ee&&ee.removeEventListener("mousedown",o.mouseDownHandler),window.removeEventListener("mousemove",o.mouseMoveHandler),window.removeEventListener("mouseup",o.mouseUpHandler),delete e._motorcycleListeners),pe&&(e.removeJoint(pe.id),pe=null),H&&(e.removeObject(H.id),H=null),t.debug.offsetX=0,t.debug.offsetY=0}}),sn=[Et,Zt,Qt,Rt],an=!["localhost","127.0.0.1"].includes(window.location.hostname),le=[{name:"Showcase",examples:sn},{name:"General",examples:qt},{name:"Constraints",examples:Nt},{name:"Optimizations",examples:Ut},{name:"Load Tests",examples:Kt},{name:"Known Issues",examples:Vt}].filter(e=>!an||e.name!=="Known Issues");let rn=`
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
`.trim();const Ee=()=>window.innerWidth<=768;let te={},U=null;function cn(){const e=document.getElementById("examples-list");e.innerHTML="",le.forEach((o,n)=>{const a=document.createElement("li");a.className="section",a.textContent=o.name,e.appendChild(a),o.examples&&Array.isArray(o.examples)&&o.examples.forEach((s,i)=>{const c=s.key||`${n}-${i}`;te[c]={category:n,index:i,example:s};const d=document.createElement("li");d.className="example",d.textContent=s.name,d.setAttribute("data-example",c),e.appendChild(d)})}),document.querySelectorAll("#sidebar li.example").forEach(o=>{o.addEventListener("click",()=>{document.querySelectorAll("#sidebar li.example.selected").forEach(a=>{a.classList.remove("selected")}),o.classList.add("selected");const n=o.getAttribute("data-example");at(n,"push"),Ee()&&oe.classList.add("collapsed")})})}let L,jt=document.getElementById("example-name"),N=document.getElementById("debug-canvas"),tt=document.getElementById("code-section"),dn=document.getElementById("general-code"),ln=document.getElementById("init-code"),hn=document.getElementById("tick-code"),de=document.getElementById("toggle-code"),pn=document.getElementById("fps"),mn=document.getElementById("memory"),gn=document.getElementById("step-time"),Ot=document.querySelectorAll(".code-tab"),yn=document.querySelectorAll(".code-panel"),Mt=document.getElementById("sidebar-toggle"),oe=document.getElementById("sidebar"),un=document.getElementById("reset-button"),bn=document.getElementById("reset-button-mobile"),kt=document.getElementById("info-toggle"),Bt=document.getElementById("info-toggle-mobile");jt.innerHTML="Loading example...";let P=0,nt=[],ot=[],st=[],Ge=1e3/60,vt=0,Ct=0;t.init().then(()=>{L=t.makeWorld(),t.debug.enableDebugGraphics(N,L);let e=performance.now(),o=0;const n=1/60;function a(r){let m=(r-e)/1e3;e=r,m>.25&&(m=.25),o+=m;const y=performance.now();for(;o>=n;){if(L.step(),U&&te[U]){const R=te[U].example;R&&typeof R.onTick=="function"&&R.onTick(L,n)}o-=n}L.interpolationAlpha=o/n;const x=(performance.now()-y)*1e3;let b=nt[P%100]??Ge,T=ot[P%100]??0,k=st[P%100]??0;nt[P%100]=m*1e3||16.67,ot[P%100]=(performance.memory?performance.memory.usedJSHeapSize:0)/1048576,st[P%100]=x,Ge+=(nt[P%100]-b)/100,vt+=(ot[P%100]-T)/100,Ct+=(st[P%100]-k)/100,P++;const C=Ge>0?Math.round(1e3/Ge):0;pn.innerHTML=`<i class="fas fa-tachometer-alt"></i>FPS: ${C}`,mn.innerHTML=`<i class="fas fa-memory"></i>Memory: ${vt.toFixed(2)} MB`,gn.innerHTML=`<i class="fas fa-stopwatch"></i>Step Time: ${Ct.toFixed(0)} μs`,requestAnimationFrame(a)}cn(),Dt(!0);const s=()=>{U&&at(U,"none")};un.addEventListener("click",s),bn.addEventListener("click",s);const i=()=>{document.body.classList.toggle("info-mode");const r=document.body.classList.contains("info-mode"),m=r?"fa-th-large":"fa-info-circle",y=r?"Show Canvas":"Info";[kt,Bt].forEach(f=>{const x=f.querySelector("i"),b=f.querySelector(".button-text");x&&(x.className=`fas ${m}`),b&&(b.textContent=y),f.title=r?"Show Canvas":"Show Information"}),r||t.debug.centerCamera(5,5)};kt.addEventListener("click",i),Bt.addEventListener("click",i),requestAnimationFrame(a),Ee()&&oe.classList.add("collapsed"),N.addEventListener("wheel",r=>{r.preventDefault();const m=.05,y=r.offsetX,f=r.offsetY,x=(y-t.debug.offsetX)/t.debug.zoom,b=(f-t.debug.offsetY)/t.debug.zoom,T=-Math.sign(r.deltaY),k=Math.pow(1+m,T),C=Math.min(Math.max(t.debug.zoom*k,.1),10);t.debug.zoom=C,t.debug.offsetX=y-x*t.debug.zoom,t.debug.offsetY=f-b*t.debug.zoom},{passive:!1});let c=!1,d=0,l=0;N.addEventListener("mousedown",r=>{r.button===2&&(c=!0,d=r.clientX,l=r.clientY)}),window.addEventListener("mousemove",r=>{if(c){const m=r.clientX-d,y=r.clientY-l;t.debug.offsetX+=m,t.debug.offsetY+=y,d=r.clientX,l=r.clientY}}),window.addEventListener("mouseup",r=>{r.button===2&&(c=!1)}),N.addEventListener("contextmenu",r=>{r.preventDefault()});let h=0,p=!1,u=0,g=0;N.addEventListener("touchstart",r=>{if(r.touches.length===1)u=r.touches[0].clientX,g=r.touches[0].clientY,p=!1;else if(r.touches.length===2){p=!0;const m=r.touches[0].clientX-r.touches[1].clientX,y=r.touches[0].clientY-r.touches[1].clientY;h=Math.sqrt(m*m+y*y)}},{passive:!1}),N.addEventListener("touchmove",r=>{if(r.touches.length!==0){if(r.preventDefault(),r.touches.length===1&&!p){const m=r.touches[0].clientX,y=r.touches[0].clientY,f=m-u,x=y-g;t.debug.offsetX+=f,t.debug.offsetY+=x,u=m,g=y}else if(r.touches.length===2){const m=r.touches[0],y=r.touches[1],f=m.clientX-y.clientX,x=m.clientY-y.clientY,b=Math.sqrt(f*f+x*x);if(h>0){const T=b/h,k=Math.min(Math.max(t.debug.zoom*T,.1),10),C=(m.clientX+y.clientX)/2,R=(m.clientY+y.clientY)/2,M=N.getBoundingClientRect(),S=C-M.left,Y=R-M.top,F=(S-t.debug.offsetX)/t.debug.zoom,Ie=(Y-t.debug.offsetY)/t.debug.zoom;t.debug.zoom=k,t.debug.offsetX=S-F*t.debug.zoom,t.debug.offsetY=Y-Ie*t.debug.zoom}h=b}}},{passive:!1}),N.addEventListener("touchend",r=>{r.touches.length<2&&(p=!1,h=0),r.touches.length===1&&(u=r.touches[0].clientX,g=r.touches[0].clientY)},{passive:!1}),N.addEventListener("touchcancel",r=>{p=!1,h=0},{passive:!1})});function at(e,o="push"){if(!L||!te[e])return;if(U&&te[U]){const h=te[U].example;h&&typeof h.cleanup=="function"&&h.cleanup(L)}const n="#"+e;window.location.hash!==n&&(o==="push"?history.pushState(null,"",n):o==="replace"&&history.replaceState(null,"",n)),L.clear(),t.debug.clearLabels(),t.debug.showForceVectors=!1,t.debug.showImpulseVectors=!1,L.setHasPenetrationResolution(!0),L.setHasRestitution(!0),L.setHasFriction(!0),L.setGravity(0,0),t.debug.zoom=1,t.debug.centerCamera(5,5),t.debug.showAabbs=!0,U=e;const s=te[e].example;s&&typeof s.onInit=="function"?s.onInit(L):console.error("Example onInit method not found:",s);function i(h,p){if(!h)return`function ${p}${p==="tick"?"(dt)":"()"} {}`;let u=h.split("	").join("    ");const g=[/^\(world\)\s*=>\s*\{/,/^\(world,\s*dt\)\s*=>\s*\{/,/^function\s*\(world\)\s*\{/,/^function\s*\(world,\s*dt\)\s*\{/,/^function\s+init\s*\(world\)\s*\{/,/^function\s+tick\s*\(world,\s*dt\)\s*\{/];let r=!1,m=u.trim();for(const x of g)if(x.test(m)){u=m.replace(x,`function ${p}${p==="tick"?"(dt)":"()"} {`),r=!0;break}r||(u=m.replace(/^.*?=>\s*\{/,`function ${p}${p==="tick"?"(dt)":"()"} {`));let y=u.split(`
`);if(y.length<=1)return u;let f=1/0;for(let x=1;x<y.length;x++){const b=y[x];if(b.trim().length===0)continue;const T=b.search(/\S/);T!==-1&&T<f&&(f=T)}return f===1/0&&(f=0),y.map((x,b)=>b===0?x:x.substring(Math.min(x.length,f))).join(`
`)}let c=s.globalLines?.join(`
`)??"",d=s.onInitRaw||s.onInit?.toString()||"",l=s.onTickRaw||s.onTick?.toString()||"";dn.textContent=rn.split("{{GLOBAL}}").join(c),ln.textContent=i(d,"init"),hn.textContent=i(l,"tick"),St(),jt.textContent=s.name||"Unknown Example",document.getElementById("description").innerHTML=Yt.parse(s.description||"")}function Dt(e=!1){let o=window.location.hash.substring(1);const n=!o;if(o||(o="sandbox"),!te[o]){console.log("Example not found directly, searching...");let s=!1;for(let i=0;i<le.length;i++){const c=le[i];if(c.examples&&Array.isArray(c.examples)){for(let d=0;d<c.examples.length;d++)if(c.examples[d].key===o){console.log(`Found example ${o} in category ${i}, index ${d}`),s=!0;break}}if(s)break}if(!s)if(console.warn(`Example with key '${o}' not found, defaulting to first available example`),le.length>0&&le[0].examples&&le[0].examples.length>0)o=le[0].examples[0].key||"0-0";else{console.error("No examples found");return}}const a=document.querySelector(`#sidebar li.example[data-example="${o}"]`);a&&(document.querySelectorAll("#sidebar li.example.selected").forEach(s=>{s.classList.remove("selected")}),a.classList.add("selected")),at(o,n&&e?"replace":"none")}Ot.forEach(e=>{e.addEventListener("click",()=>{Ot.forEach(n=>n.classList.remove("active")),yn.forEach(n=>n.classList.remove("active")),e.classList.add("active"),document.getElementById(`${e.dataset.panel}-panel`).classList.add("active")})});function St(){document.querySelectorAll("pre").forEach(o=>{const n=o.textContent;o.innerHTML=hljs?.highlight(n,{language:"javascript"}).value})}de.addEventListener("click",()=>{tt.style.display==="none"?(tt.style.display="block",de.querySelector("span").textContent="Hide Code",de.querySelector("i").classList.remove("fa-chevron-down"),de.querySelector("i").classList.add("fa-chevron-up"),St()):(tt.style.display="none",de.querySelector("span").textContent="Show Code",de.querySelector("i").classList.remove("fa-chevron-up"),de.querySelector("i").classList.add("fa-chevron-down"))});Mt.addEventListener("click",()=>{oe.classList.toggle("collapsed")});window.addEventListener("resize",()=>{Ee()||document.body.classList.remove("info-mode"),Ee()&&!oe.classList.contains("collapsed")&&oe.classList.add("collapsed")});window.addEventListener("click",e=>{Ee()&&!oe.classList.contains("collapsed")&&!oe.contains(e.target)&&e.target!==Mt&&oe.classList.add("collapsed")});const Ce=document.getElementById("copy-code");Ce.addEventListener("click",()=>{const o=document.querySelector(".code-panel.active").querySelector("pre").textContent;navigator.clipboard.writeText(o).then(()=>{const n=Ce.querySelector("span"),a=Ce.querySelector("i"),s=n.textContent;Ce.classList.add("success"),n.textContent="Copied!",a.classList.remove("fa-copy"),a.classList.add("fa-check"),setTimeout(()=>{Ce.classList.remove("success"),n.textContent=s,a.classList.remove("fa-check"),a.classList.add("fa-copy")},2e3)})});window.addEventListener("popstate",function(e){Dt(!1)});
