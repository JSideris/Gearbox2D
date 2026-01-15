import"./modulepreload-polyfill-B5Qt9EMX.js";import{M as ln}from"./markdown-tUR2hliS.js";import{g as t}from"./engine-CRZEadYw.js";class T{constructor(n){this.onInit=n.onInit,this.onInitRaw=n.onInitRaw,this.onTick=n.onTick,this.onTickRaw=n.onTickRaw,this.onRender=n.onRender,this.onRenderRaw=n.onRenderRaw,this.onCleanup=n.onCleanup,this.description=n.description,this.name=n.name,this.key=n.key,this.globalLines=n.globalLines||[]}init(n){this.onInit?.(n)}tick(n,o){this.onTick?.(n,o)}render(n){this.onRender?.(n)}cleanup(n){this.onCleanup?.(n)}}let M=1,ut=0,te=null,Ze=null,xe=null;const Vt=(e,n)=>({x:(e-t.debug.offsetX)/(t.debug.zoom*100),y:(n-t.debug.offsetY)/(t.debug.zoom*100)}),hn=(e,n)=>{if(e.button!==0)return;const o=xe.getBoundingClientRect(),a=Vt(e.clientX-o.left,e.clientY-o.top),s=n.queryPoint(a.x,a.y);if(s.length>0){const i=s[0],r=n.getBodyById(i);r&&r.type!==t.bodyTypes.FIXED_OBJECT&&(te=n.makeBody(999999,{x:a.x,y:a.y,type:t.bodyTypes.FIXED_OBJECT,color:"transparent"}),te.addFixture(999999,{shape:t.shapes.CIRCLE,radius:.05,maskBits:0}),Ze=n.createSpringJoint(999998,te,r,{worldAnchor:a,frequencyHz:3,dampingRatio:1,length:0}))}},pn=e=>{if(te){const n=xe.getBoundingClientRect(),o=Vt(e.clientX-n.left,e.clientY-n.top);te.x=o.x,te.y=o.y}},mn=(e,n)=>{Ze&&(n.removeJoint(Ze.id),Ze=null),te&&(n.removeObject(te.id),te=null)},un=[new T({name:"Interactive Sandbox",key:"sandbox",description:["Welcome to **Gearbox2D**! This is an interactive playground featuring various shapes and physics properties. Click and drag objects to interact with them.","### Features","- **Point Query**: The engine detects which object is under the mouse using **BVH** and precise shape tests.","- **Mouse Joint**: Uses a `SpringJoint` to pull objects toward the mouse cursor.","- **Collision Filtering**: The mouse 'anchor' object is a sensor that doesn't collide with other objects."].join(`

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
                        world.makeBody(nextId++, {
                            ...commonProps,
                            r: Math.random() * Math.PI,
                        }).addFixture({
                            shape: gearbox.shapes.CIRCLE,
                            radius: 0.2 + Math.random() * 0.2,
                        });
                    } else {
                        // Box
                        world.makeBody(nextId++, {
                            ...commonProps,
                            r: Math.random() * Math.PI,
                        }).addFixture({
                            shape: gearbox.shapes.BOX,
                            width: 0.4 + Math.random() * 0.4,
                            height: 0.4 + Math.random() * 0.4,
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
        }`,onInit:e=>{e.clear(),t.debug.showAabbs=!1,t.debug.showForceVectors=!1,M=1,e.setGravity(0,9.8),e.setHasRestitution(!0),e.setHasFriction(!0);const n=1,o=9.2,s=9+n*2,i=o+n*2;e.makeBody(M++,{x:5,y:9+n/2,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({shape:t.shapes.BOX,width:i,height:n}),e.makeBody(M++,{x:5,y:0-n/2,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({shape:t.shapes.BOX,width:i,height:n}),e.makeBody(M++,{x:5-o/2-n/2,y:4.5,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({shape:t.shapes.BOX,width:n,height:s}),e.makeBody(M++,{x:5+o/2+n/2,y:4.5,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({shape:t.shapes.BOX,width:n,height:s});const r=["#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff"],l=8,h=5,b=1,y=1.2,g=5-(l-1)*b/2,c=2;for(let d=0;d<h;d++)for(let p=0;p<l;p++){const u=g+p*b,f=c+d*y,x=r[(d*l+p)%r.length],m={x:u,y:f,mass:1,color:x,linearDamping:.5,angularDamping:1.5};Math.random()<.5?e.makeBody(M++,{...m,r:Math.random()*Math.PI}).addFixture({shape:t.shapes.CIRCLE,radius:.2+Math.random()*.2}):e.makeBody(M++,{...m,r:Math.random()*Math.PI}).addFixture({shape:t.shapes.BOX,width:.4+Math.random()*.4,height:.4+Math.random()*.4})}xe=document.getElementById("debug-canvas"),e._mouseDownHandler&&xe.removeEventListener("mousedown",e._mouseDownHandler),e._mouseMoveHandler&&window.removeEventListener("mousemove",e._mouseMoveHandler),e._mouseUpHandler&&window.removeEventListener("mouseup",e._mouseUpHandler),e._mouseDownHandler=d=>hn(d,e),e._mouseMoveHandler=d=>pn(d),e._mouseUpHandler=d=>mn(d,e),xe.addEventListener("mousedown",e._mouseDownHandler),window.addEventListener("mousemove",e._mouseMoveHandler),window.addEventListener("mouseup",e._mouseUpHandler)},onCleanup:e=>{xe&&(xe.removeEventListener("mousedown",e._mouseDownHandler),window.removeEventListener("mousemove",e._mouseMoveHandler),window.removeEventListener("mouseup",e._mouseUpHandler),delete e._mouseDownHandler,delete e._mouseMoveHandler,delete e._mouseUpHandler)},onTickRaw:`(world, dt) => {
            gearbox.debug.clearLabels();
            gearbox.debug.addLabel({ text: "Interactive Sandbox", x: 5, y: 0.5, fontSize: "28px Arial", color: "#bbb", position: "on-top" });
            gearbox.debug.addLabel({ text: "Click and drag objects!", x: 5, y: 1.2, fontSize: "16px Arial", color: "#888", position: "on-top" });
        }`,onTick:(e,n)=>{t.debug.clearLabels(),t.debug.addLabel({text:"Interactive Sandbox",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"}),t.debug.addLabel({text:"Click and drag objects!",x:5,y:1.2,fontSize:"16px Arial",color:"#888",position:"on-top"})}}),new T({name:"Force",key:"force",description:["**Forces** are used to apply acceleration to objects which scale inversely with the object's mass. All forces applied to an object are accumulated and applied in the next world step where they are reset.","Persistent forces must be reapplied on each fixed update (every `tick`).","It's important to note that the change in velocity will be a function of the **force vector**, the object's **mass**, and the **time step**. If you need a specific instantaneous change in velocity, use an **Impulse** instead."].join(`

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
        }`,onInit:e=>{e.makeBody(1,{x:5,y:2.5,vx:5,r:Math.PI/2*Math.random(),rs:5,mass:.1,angularDamping:0,linearDamping:0}).addFixture({shape:t.shapes.CIRCLE,radius:.3}),e.makeBody(2,{x:5,y:5,r:Math.PI/2*Math.random(),rs:.1,type:t.bodyTypes.KINEMATIC_OBJECT,angularDamping:0}).addFixture({shape:t.shapes.CIRCLE,radius:1,isSensor:!0})},onTickRaw:`(world, dt)=>{
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
        }`,onTick:(e,n)=>{let o=e.bodiesById[1],a=e.bodiesById[2],s=a.x-o.x,i=a.y-o.y,r=Math.sqrt(s*s+i*i);s/=r,i/=r;const l=2;o.applyForce(s*l,i*l)}}),new T({name:"Impulse",key:"impulse",description:["**Impulses** are used to apply a sudden change in momentum to an object. It's similar to a force, but modifies the object's velocity **instantaneously**, rather than acting as a persistent push.","In this example we demonstrate both **Linear** and **Angular** impulses.","- The two circles receive vertical linear impulses.","- The box receives periodic angular impulses (torque) causing it to spin without moving its center."].join(`

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
        }`,onInit:e=>{e.makeBody(1,{x:2.5,y:5,r:Math.PI/2*Math.random(),mass:1,linearDamping:.1}).addFixture({shape:t.shapes.CIRCLE,radius:.3}),e.makeBody(2,{x:5,y:5,r:Math.PI/2*Math.random(),mass:2,linearDamping:.02}).addFixture({shape:t.shapes.CIRCLE,radius:.6}),e.makeBody(3,{x:7.5,y:5,mass:100,linearDamping:.05,angularDamping:.05}).addFixture({shape:t.shapes.BOX,width:1,height:.3})},onTickRaw:`(world, dt)=>{

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
            
        }`,onTick:(e,n)=>{let o=e.bodiesById[1],a=e.bodiesById[2],s=e.bodiesById[3],i=ut;ut+=n*5;let r=Math.floor(i),l=Math.floor(ut);if(r!=l){if(l%2==0){let h=(5-o.y)*.2;h<.05&&h>-.05&&(h=2),o.applyImpulse(0,h),a.applyImpulse(0,h)}l%3==0&&s.applyAngularImpulse(2)}}}),new T({name:"Bounce",key:"bounce",description:["This example demonstrates **Restitution** (bounciness).","The central ball is configured with `restitution: 1.0`, meaning it loses no energy during collisions with the fixed walls, creating a perfectly elastic bounce."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10),e.makeBody(1,{x:5,y:0,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.AABB,width:11,height:2,restitution:1}),e.makeBody(2,{x:5,y:10,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.AABB,width:11,height:2,restitution:1}),e.makeBody(3,{x:0,y:5,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.AABB,width:2,height:11,restitution:1}),e.makeBody(4,{x:10,y:5,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.AABB,width:2,height:11,restitution:1}),e.makeBody(5,{x:5,y:2,vx:(Math.random()<.5?-1:1)*(1.5+Math.random()*1.5),r:Math.PI/2*Math.random(),type:t.bodyTypes.DYNAMIC_OBJECT,mass:.5,linearDamping:0,rs:-2+Math.random()*4}).addFixture({shape:t.shapes.CIRCLE,radius:.75,restitution:1})},onTickRaw:`(world, dt)=>{
            // The engine does all the work. Nothing to do here!
        }`,onTick:(e,n)=>{}}),new T({name:"Collisions",key:"collisions",description:["Collisions are enabled for objects whose type is set to `DYNAMIC_OBJECT`.","In this example we can see collisions between all of the different supported shape types:","- **CIRCLE**: Optimized circular collisions.","- **BOX**: Oriented bounding boxes with full rotation support.","- **AABB**: Axis-aligned bounding boxes.","- **POINT**: Zero-radius points that collide with larger shapes."].join(`

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
        }`,onTick:(e,n)=>{if(Math.random()<.08){let o=.1+Math.random()*.4,a=1;Math.random()<.5&&(a=-1);let s=.2+o*o*.8,i=.1+Math.random()*(s-.1),r=s*s/i,l=Math.random(),h,b=o;l<.1?(h=t.shapes.POINT,b=.01):l<.2?h=t.shapes.AABB:l<.6?h=t.shapes.BOX:h=t.shapes.CIRCLE;const y=M++;e.makeBody(y,{x:5-a*5,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*a,vy:-8-Math.random()*2,type:t.bodyTypes.DYNAMIC_OBJECT,mass:b,linearDamping:0}).addFixture({shape:h,radius:h===t.shapes.BOX||h===t.shapes.AABB?r:s,height:h===t.shapes.BOX||h===t.shapes.AABB?i:0}),e.getBodyCount();let g=[];e.iterateBodies(c=>{c.y>10.5&&g.push(c)});for(let c of g)e.removeObject(c.id)}}}),new T({name:"⚠ Friction",key:"friction",description:["**Friction** is applied as the last step of collision resolution. It handles both **static** and **dynamic** friction, applied as impulses at the point of contact.","Take note of the blue impulse vectors on the platforms which are present when dynamic friction is being applied.","### Scenarios","1. **Reverse Roll**: A circle spinning counter-clockwise transfers its angular momentum to linear momentum upon contact.","2. **Forward Roll**: A spinning circle with no linear momentum begins rolling forward due to friction.","3. **Slide**: A box slides across the platform and grinds to a halt.","4. **Static vs Kinetic**: Two boxes slide down a ramp. The left box has high static friction and stops; the right has no static friction and keeps sliding."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10);let n=1;const o=["Linear to angular momentum transfer.","Angular to linear momentum transfer.","Slide to halt."];for(;n<=3;n++)e.makeBody(n,{x:4.5,y:2.5*n-.5,type:t.bodyTypes.FIXED_OBJECT,mass:1}).addFixture({shape:t.shapes.AABB,width:9,height:1}),t.debug.addLabel({text:o[n-1],x:4.5,y:2.5*n-1.2,fontSize:"20px Arial",color:"#00f2ff",position:"above"});const a=n++;e.makeBody(a,{x:4.5,y:9.7,r:.1,type:t.bodyTypes.FIXED_OBJECT,mass:1}).addFixture({shape:t.shapes.BOX,width:9,height:1}),t.debug.addLabel({text:"High static vs no static friction.",x:4.5,y:9,fontSize:"20px Arial",color:"#00f2ff",position:"above"});const s=n++;e.makeBody(s,{x:0,y:1,vx:5,rs:-8,type:t.bodyTypes.DYNAMIC_OBJECT,mass:.5}).addFixture({shape:t.shapes.CIRCLE,radius:.5,kFriction:.8,sFriction:.5}),t.debug.addLabel({text:"Reverse",objectId:s,position:"above",fontSize:"10px Arial"});const i=n++;e.makeBody(i,{x:.5,y:3.5,rs:15,type:t.bodyTypes.DYNAMIC_OBJECT,mass:.5}).addFixture({shape:t.shapes.CIRCLE,radius:.5,kFriction:.2,sFriction:.5}),t.debug.addLabel({text:"Forward",objectId:i,position:"above",fontSize:"10px Arial"});const r=n++;e.makeBody(r,{x:.5,y:6,vx:7,type:t.bodyTypes.DYNAMIC_OBJECT,mass:.5}).addFixture({shape:t.shapes.BOX,width:1,height:1,kFriction:.27,sFriction:.5}),t.debug.addLabel({text:"Slide",objectId:r,position:"above",fontSize:"10px Arial"});const l=n++;e.makeBody(l,{x:.5,y:8,vx:.5,type:t.bodyTypes.DYNAMIC_OBJECT,mass:.5}).addFixture({shape:t.shapes.BOX,width:1,height:.5,kFriction:.7,sFriction:.7}),t.debug.addLabel({text:"Static",objectId:l,position:"above",fontSize:"10px Arial"});const h=n++;e.makeBody(h,{x:1.6,y:8,vx:.5,type:t.bodyTypes.DYNAMIC_OBJECT,mass:.5}).addFixture({shape:t.shapes.BOX,width:1,height:.5,kFriction:.01,sFriction:0}),t.debug.addLabel({text:"Kinetic",objectId:h,position:"above",fontSize:"10px Arial"})},onTickRaw:`(world, dt)=>{

        }`,onTick:(e,n)=>{}}),new T({name:"Collision Masks",key:"collision-masks",description:["**Collision masks** allow you to selectively enable or disable collisions between different groups of objects using bitwise logic.","In this example:","- **Blue objects**: Only collide with blue platforms and other blue objects.","- **Red objects**: Only collide with red platforms and other red objects.","- **Green objects**: Collide with **everything**.","This is implemented using `categoryBits` and `maskBits` properties."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10),t.debug.showForceVectors=!1;const n=M++;e.makeBody(n,{x:2.5,y:8,type:t.bodyTypes.FIXED_OBJECT,color:"#00f2ff"}).addFixture({width:4,height:.5,shape:t.shapes.AABB,categoryBits:1,maskBits:5}),t.debug.addLabel({text:"Collides with Blue & Green",objectId:n,color:"#00f2ff",position:"below"});const o=M++;e.makeBody(o,{x:7.5,y:8,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444"}).addFixture({width:4,height:.5,shape:t.shapes.AABB,categoryBits:2,maskBits:6}),t.debug.addLabel({text:"Collides with Red & Green",objectId:o,color:"#ff4444",position:"below"});const a=M++;e.makeBody(a,{x:5,y:4,type:t.bodyTypes.FIXED_OBJECT,color:"#44ff44"}).addFixture({width:2,height:.5,shape:t.shapes.AABB,categoryBits:4,maskBits:7}),t.debug.addLabel({text:"Collides with All",objectId:a,color:"#44ff44",position:"below"})},onTickRaw:`(world, dt)=>{
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
        }`,onTick:(e,n)=>{if(Math.random()<.05){const a=M++,s=Math.floor(Math.random()*3);let i,r,l;s===0?(i="#00f2ff",r=1,l=5):s===1?(i="#ff4444",r=2,l=6):(i="#44ff44",r=4,l=7),e.makeBody(a,{x:2+Math.random()*6,y:0,type:t.bodyTypes.DYNAMIC_OBJECT,mass:1,color:i}).addFixture({radius:.3,shape:t.shapes.CIRCLE,categoryBits:r,maskBits:l}),t.debug.addLabel({text:`Cat:0x${r.toString(16)} Mask:0x${l.toString(16)}`,objectId:a,color:i,position:"above",fontSize:"10px Arial"})}let o=[];e.iterateBodies(a=>{a.y>11&&o.push(a)});for(let a of o)e.removeObject(a.id)}}),new T({name:"Object Types",key:"object-types",description:["This example showcases the four fundamental object types in **Gearbox2D** and how they interact:","1. **Fixed Objects** (Gray): Immovable platforms with infinite mass. They form the static environment.","2. **Kinematic Objects** (Purple): Move via velocity but are unaffected by forces. They can 'push' other objects but are never pushed back.","3. **Rigid Bodies** (Colorful): Fully dynamic objects affected by gravity, forces, and collisions.","4. **Sensors** (Green Zone): Detect overlaps without causing a physical response. Here, a sensor acts as a **Recycling Zone** to remove objects."].join(`

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
        }`,onInit:e=>{e.clear(),e.setGravity(0,10),t.debug.showForceVectors=!1,M=1,e.makeBody(M++,{x:5,y:9.7,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({shape:t.shapes.BOX,width:8,height:.6}),e.makeBody(M++,{x:1,y:7,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({width:.2,height:6,shape:t.shapes.BOX}),e.makeBody(M++,{x:9,y:7,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}).addFixture({width:.2,height:6,shape:t.shapes.BOX});const n=e.makeBody(M++,{x:5,y:4,type:t.bodyTypes.KINEMATIC_OBJECT,color:"#a0f",rs:1.5});n.addFixture({width:3.5,height:.3,shape:t.shapes.BOX}),t.debug.addLabel({text:"Kinematic Rotor",objectId:n.id,position:"above",color:"#a0f"});const o=e.makeBody(M++,{x:2.5,y:7,type:t.bodyTypes.KINEMATIC_OBJECT,color:"#a0f",vx:1});o.addFixture({width:1.5,height:.3,shape:t.shapes.BOX}),e.elevator=o,t.debug.addLabel({text:"Kinematic Elevator",objectId:o.id,position:"above",color:"#a0f"});const a=M++,s=e.makeBody(a,{x:5,y:8.8,type:t.bodyTypes.FIXED_OBJECT,color:"rgba(0, 255, 100, 0.15)"});s.addFixture({width:4,height:1.2,shape:t.shapes.BOX,isSensor:!0}),t.debug.addLabel({text:"Sensor Recycler",objectId:s.id,position:"on-top",color:"#4f4"}),e.recyclerId=s.id,e.toRemove=new Set,e.onCollisionStart=(i,r)=>{const l=e.recyclerId,h=i===l?r:r===l?i:null;if(h!==null){const b=e.getBodyById(h);b&&b.type===t.bodyTypes.DYNAMIC_OBJECT&&(e.toRemove.add(h),b.color="#4f4")}}},onTickRaw:`(world, dt) => {
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
        }`,onTick:(e,n)=>{const o=e.elevator;if(o&&(o.x>7.5&&(o.vx=-1.5),o.x<2.5&&(o.vx=1.5)),e.stepCount%20===0){const i=["#ff4444","#4444ff","#ffff44","#ff44ff","#44ffff"],r=Math.random()>.5,l=3+Math.random()*4,h=M++;e.makeBody(h,{x:l,y:.5,mass:.5+Math.random()*1,type:t.bodyTypes.DYNAMIC_OBJECT,color:i[Math.floor(Math.random()*i.length)]}).addFixture({shape:r?t.shapes.CIRCLE:t.shapes.BOX,radius:.25,width:.5,height:.5,restitution:.3})}const a=e.toRemove;if(a&&a.size>0){for(const i of a)e.getBodyById(i)&&e.removeObject(i);a.clear()}let s=[];e.iterateBodies(i=>{(i.y>11||i.y<-5||i.x>11||i.x<-1)&&i.type===t.bodyTypes.DYNAMIC_OBJECT&&s.push(i.id)});for(const i of s)e.removeObject(i)},onCleanup:e=>{e.onCollisionStart=void 0,delete e.elevator,delete e.recyclerId,delete e.toRemove}})];let B=1,pe=[],Be=null,W=null,Fe=null,Z=null,$=null,Me=0,Re=0;const yn=[new T({name:"Simple Hinge",key:"simple-hinge",description:["A single `BOX` object attached to a `FIXED_OBJECT` by a **Hinge Joint** constraint.","The hinge allows rotation around a single point while preventing all linear relative motion. In this case, it creates a simple gravity-driven pendulum."].join(`

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
        }`,onInit:e=>{B=1;const n=B++,o=e.makeBody(n,{x:5,y:3,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444"});o.addFixture({shape:t.shapes.BOX,width:1,height:1});const a=B++,s=e.makeBody(a,{x:8,y:3,mass:.1,color:"#44ff44"});s.addFixture({shape:t.shapes.BOX,width:4,height:.5}),e.createHingeJoint(B++,o,s,{worldAnchor:{x:5,y:3}}),e.setGravity(0,9.81)}}),new T({name:"Breakable Joint",key:"breakable-joint",description:["This demo showcases **Joint Reaction Forces** and dynamic joint removal.","1. A ball is suspended by a **Hinge Joint**. Its mass increases until the reaction force exceeds a threshold, snapping the joint.","2. The ball falls onto a bridge made of `SpringJoint` segments, which also have breaking thresholds.","You can visualize the stress on the joints by enabling **Force Vectors** in the debug settings."].join(`

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
        }`,onInit:e=>{B=1,t.debug.showAabbs=!1,t.debug.showForceVectors=!0,e.setGravity(0,10),pe=[],Be=null,W=null;const n=B++,o=e.makeBody(n,{x:5,y:1,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444"});o.addFixture({shape:t.shapes.CIRCLE,radius:.2});const a=B++;W=e.makeBody(a,{x:5,y:2.5,mass:.05,color:"#888888"}),W.addFixture(a,{shape:t.shapes.CIRCLE,radius:.4}),Be=e.createHingeJoint(B++,o,W,{worldAnchor:{x:5,y:1}});const s=2,i=8,r=6,l=12,h=(i-s)/l,b=.2,y=B++,g=e.makeBody(y,{x:s-h/2,y:r,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"});g.addFixture({shape:t.shapes.BOX,width:h,height:.5});const c=B++,d=e.makeBody(c,{x:i+h/2,y:r,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"});d.addFixture({shape:t.shapes.BOX,width:h,height:.5});let p=g;for(let f=0;f<l;f++){const x=B++,m=e.makeBody(x,{x:s+f*h+h/2,y:r,mass:.2,color:"#cd853f"});m.addFixture({shape:t.shapes.BOX,width:h*.9,height:b,categoryBits:4,maskBits:-5});const k=e.createSpringJoint(B++,p,m,{worldAnchor:{x:s+f*h,y:r},frequencyHz:4,dampingRatio:1});pe.push(k),p=m}const u=e.createSpringJoint(B++,p,d,{worldAnchor:{x:i,y:r},frequencyHz:4,dampingRatio:1});pe.push(u),W.applyImpulse(.2,0)},onTickRaw:`(world, dt) => {
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
        }`,onTick:(e,n)=>{if(W&&(W.mass+=n*3,t.debug.removeObjectLabels(W.id),t.debug.addLabel({text:`Mass: ${W.mass.toFixed(2)}kg`,objectId:W.id,position:"above",color:"#fff"})),Be){const o=Be.reactionForce;Math.sqrt(o.x*o.x+o.y*o.y)>150&&(e.removeJoint(Be.id),Be=null)}if(pe.length>0)for(let o=pe.length-1;o>=0;o--){const a=pe[o],s=a.reactionForce;Math.sqrt(s.x*s.x+s.y*s.y)>600&&(e.removeJoint(a.id),pe.splice(o,1))}}}),new T({name:"Gear Train",key:"gear-train",description:["A sequence of gears connected using the `GearJoint` constraint.","Each gear's motion is constrained by the previous one based on a **gear ratio** (calculated here by the relative radii).","A drive gear at the start receives a constant low torque, which is then propagated through the entire train with mechanical advantage."].join(`

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
        }`,onInit:e=>{B=1;const n=2,o=5,a=5,s=1.5,i=B++,r=e.makeBody(i,{x:5,y:5,type:t.bodyTypes.FIXED_OBJECT,color:"#888"});r.addFixture({shape:t.shapes.AABB,width:6.2,height:.2,maskBits:0});let l=null;Fe=null;for(let h=0;h<a;h++){const b=h%2===0?1:.5,y=B++,g=e.makeBody(y,{x:n+h*s,y:o,mass:b,color:`hsl(${h*60}, 70%, 60%)`});g.addFixture({shape:t.shapes.CIRCLE,radius:b});const c=e.createHingeJoint(B++,r,g,{worldAnchor:{x:n+h*s,y:o}});if(h===0)Fe=g;else{const p=((h-1)%2===0?1:.5)/b;e.createGearJoint(B++,l,c,p)}l=c}},onTickRaw:`(world, dt) => {
            if (engineHub) {
                // Apply a persistent but relatively low angular impulse to the drive gear
                if(Math.abs(engineHub.rs) < 0.9) {
                    engineHub.applyAngularImpulse(0.01);
                }
            }
        }`,onTick:(e,n)=>{Fe&&Math.abs(Fe.rs)<.9&&Fe.applyAngularImpulse(.01)}}),new T({name:"Distance Ropes",key:"distance-ropes",description:["Demonstrates the `DistanceJoint`, which maintains a fixed distance between two points on two different bodies.","A rotating drum has multiple triple-link chains hanging from it. Each link is connected by a `DistanceJoint` with a specified length, simulating a non-stretchy rope or chain."].join(`

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
        }`,onInit:e=>{t.debug.showAabbs=!1,t.debug.showForceVectors=!1,B=1;const n=5,o=5,a=4,s=B++,i=e.makeBody(s,{x:n,y:o,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444"});i.addFixture({shape:t.shapes.CIRCLE,radius:.5});const r=B++;Z=e.makeBody(r,{x:n,y:o,mass:100,color:"rgba(255, 255, 255, 0.05)",angularDamping:.5}),Z.addFixture(r,{shape:t.shapes.CIRCLE,radius:a,maskBits:0}),e.createHingeJoint(B++,i,Z,{worldAnchor:{x:n,y:o}});const l=8,h=3.8,b=.8,y=()=>({x:(Math.random()-.5)*.3,y:(Math.random()-.5)*.3});for(let g=0;g<l;g++){const c=g/l*Math.PI*2,d=n+Math.cos(c)*h,p=o+Math.sin(c)*h,u=d-Math.cos(c)*.5,f=p-Math.sin(c)*.5,x=B++,m=e.makeBody(x,{x:u,y:f,mass:.5,color:`hsl(${g*360/l}, 70%, 60%)`});m.addFixture({shape:g%2===0?t.shapes.BOX:t.shapes.CIRCLE,width:.5,height:.5,radius:.25});const k=Z.worldToLocal({x:d,y:p});e.createDistanceJoint(B++,Z,m,{anchorA:k,anchorB:y(),length:b});const I=u-Math.cos(c)*b,v=f-Math.sin(c)*b,R=B++,O=e.makeBody(R,{x:I,y:v,mass:.5,color:`hsl(${g*360/l}, 70%, 50%)`});O.addFixture({shape:(g+1)%2===0?t.shapes.BOX:t.shapes.CIRCLE,width:.5,height:.5,radius:.25}),e.createDistanceJoint(B++,m,O,{anchorA:y(),anchorB:y(),length:b});const J=I-Math.cos(c)*b,ne=v-Math.sin(c)*b,H=B++,G=e.makeBody(H,{x:J,y:ne,mass:.5,color:`hsl(${g*360/l}, 70%, 40%)`});G.addFixture({shape:(g+2)%2===0?t.shapes.BOX:t.shapes.CIRCLE,width:.5,height:.5,radius:.25}),e.createDistanceJoint(B++,O,G,{anchorA:y(),anchorB:y(),length:b})}e.setGravity(0,9.81),Z.rs=.2},onTickRaw:`(world, dt) => {
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
        }`,onTick:(e,n)=>{if(Z){const o=Date.now()/1e3,a=o%12;let s=0,i=2;a<4?(s=1.2,i=4):a<6?(s=0,i=1):a<10?(s=Math.sin(o*4)*2,i=8):s=0;const r=s-Z.rs;Math.abs(r)>.05&&Z.applyAngularImpulse(r*i)}}}),new T({name:"Spring Belt",key:"spring-belt",description:["A chain of shapes connected by `SpringJoint` constraints, forming a belt around a rotating high-friction pulley.","The `SpringJoint` acts like a dampened harmonic oscillator, pulling objects together with a force proportional to their distance and frequency. The belt stretches and contracts as it interacts with the central rotor."].join(`

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
        }`,onInit:e=>{t.debug.showAabbs=!1,t.debug.showForceVectors=!1,B=1;const n=5,o=3,a=2.5,s=3.5,i=B++,r=e.makeBody(i,{x:n,y:o,type:t.bodyTypes.FIXED_OBJECT,color:"#666666"});r.addFixture({shape:t.shapes.CIRCLE,radius:.1,maskBits:0});const l=B++;$=e.makeBody(l,{x:n,y:o,rs:2.5,type:t.bodyTypes.DYNAMIC_OBJECT,mass:10,color:"#888888",angularDamping:.1}),$.addFixture(l,{shape:t.shapes.CIRCLE,radius:a,sFriction:1,kFriction:1}),e.createHingeJoint(B++,r,$,{worldAnchor:{x:n,y:o}});const h=16,b=[];for(let y=0;y<h;y++){const g=y/h*Math.PI*2,c=n+Math.cos(g)*s,d=o+Math.sin(g)*s,p=B++,u=e.makeBody(p,{x:c,y:d,mass:1.5,color:`hsl(${y*360/h}, 70%, 60%)`});u.addFixture({shape:y%2===0?t.shapes.BOX:t.shapes.CIRCLE,width:.6,height:.6,radius:.3,sFriction:.999,kFriction:.99}),b.push(u)}for(let y=0;y<h;y++){const g=b[y],c=b[(y+1)%h],d=c.x-g.x,p=c.y-g.y,u=Math.sqrt(d*d+p*p);e.createSpringJoint(B++,g,c,{length:u*1.1,frequencyHz:5,dampingRatio:.2})}e.setGravity(0,9.81)},onTickRaw:`(world, dt) => {
            if (rotator) {
                // Apply a persistent angular impulse until we reach target speed
                if(Math.abs(rotator.rs) < 2.5) {
                    rotator.applyAngularImpulse(1.0);
                }
            }
        }`,onTick:(e,n)=>{$&&Math.abs($.rs)<2.5&&$.applyAngularImpulse(1)}}),new T({name:"Soft Body Ball",key:"soft-body",description:["A collection of `CIRCLE` objects connected by a network of `SpringJoint` constraints to form a squishy, deformable ball.","The ball features a central core (axel) connected to an outer ring of nodes. This setup simulates **Soft Body Dynamics** using a mass-spring system.","Persistent random impulses are applied to the core to keep the ball moving and demonstrate its elasticity."].join(`

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
        }`,onInit:e=>{t.debug.showAabbs=!1,t.debug.showForceVectors=!1,B=1;const n=5,o=3,a=2,s=12,i=[],r=.2,l=B++,h=e.makeBody(l,{x:n,y:o,mass:2,color:"#ff8888"});h.addFixture({shape:t.shapes.CIRCLE,radius:r,sFriction:.9,kFriction:.9}),$=h,Me=0,Re=-30;for(let c=0;c<s;c++){const d=c/s*Math.PI*2,p=n+Math.cos(d)*a,u=o+Math.sin(d)*a,f=B++,x=e.makeBody(f,{x:p,y:u,mass:.5,color:"#8888ff"});x.addFixture({shape:t.shapes.CIRCLE,radius:.2,sFriction:.9,kFriction:.9}),i.push(x),e.createSpringJoint(B++,h,x,{anchorA:{x:Math.cos(d)*r,y:Math.sin(d)*r},length:a-r,frequencyHz:4,dampingRatio:.5}),c>0&&e.createSpringJoint(B++,i[c-1],x,{length:2*a*Math.sin(Math.PI/s),frequencyHz:4,dampingRatio:.5})}e.createSpringJoint(B++,i[s-1],i[0],{length:2*a*Math.sin(Math.PI/s),frequencyHz:4,dampingRatio:.5});const b=B++;e.makeBody(b,{x:5,y:10,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}).addFixture({shape:t.shapes.BOX,width:15,height:2,sFriction:.9,kFriction:.9});const y=B++;e.makeBody(y,{x:-3.5,y:4.25,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}).addFixture({shape:t.shapes.BOX,width:2,height:10});const g=B++;e.makeBody(g,{x:13.5,y:4.25,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}).addFixture({shape:t.shapes.BOX,width:2,height:10}),e.setGravity(0,9.81)},onTickRaw:`(world, dt) => {
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
        }`,onTick:(e,n)=>{$&&(Re<=0&&(Math.random()<.02?(Me=(Math.random()-.5)*3,Re=40+Math.random()*80):Me=0),Re>0&&($.applyAngularImpulse(Me),$.applyImpulse(Me*.1,0),Re--))}})];let yt=0,Oe=1;const gn=[new T({name:"⚠ Sleep and Islands",key:"sleep-and-islands",description:["**Sleep** optimization in **Gearbox2D** uses a movement-based heuristic computed during the kinematics step.","Instead of rebuilding a complex global island data structure each tick, each object tracks its own local contacts. When an object wakes up (due to a force or collision), it automatically wakes its neighbors.","This provides the performance benefits of **Islands** with significantly lower overhead."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10),yt=3,Oe=0,e.makeBody(Oe++,{x:5,y:8.5,vx:0,vy:0,type:t.bodyTypes.FIXED_OBJECT,mass:2}).addFixture({shape:t.shapes.AABB,width:20,height:1})},onTickRaw:`(world, dt)=>{
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
        }`,onTick:(e,n)=>{if(yt+=n*2,Math.floor(yt/3)>Oe&&Oe<10){const s=Oe++;e.makeBody(s,{x:5,y:0,r:(Math.random()-.5)*.1,vx:0,vy:0,type:t.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:t.shapes.BOX,width:6,height:.5,sFriction:10,kFriction:10})}}}),new T({name:"Shrink Wrap",key:"shrink-wrap",description:["Objects that are put to **Sleep** have their **AABBs** 'shrink-wrapped' to their exact shape bounds.","This provides a slight performance boost during broad-phase collision detection by reducing false positives in the BVH tree for stationary objects."].join(`

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
        }`,onInit:e=>{e.makeBody(1,{x:10,y:10,vx:-5,vy:-5,type:t.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:t.shapes.CIRCLE,radius:1,restitution:0}),e.makeBody(2,{x:0,y:0,vx:5,vy:5,type:t.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:t.shapes.CIRCLE,radius:1,restitution:0})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}})],xn=[new T({name:"Circles",key:"particles",description:["A **Load Test** featuring 2,000 `CIRCLE` objects with full collision resolution.","This demo helps visualize the performance of the **BVH (Bounding Volume Hierarchy)** and the narrow-phase collision solver.","**Note**: In many environments, the primary bottleneck will be the Canvas 2D rendering rather than the physics simulation."].join(`

`),onInitRaw:`(world)=>{

            let id = 1;
            let thickness = 2;
            let length = 11;

            // Walls
            world.makeBody(id++, {
                x: 5,
                y: 0,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: length,
                height: thickness,
                restitution: 0.99,
            });
            world.makeBody(id++, {
                x: 5,
                y: 10,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: length,
                height: thickness,
                restitution: 0.99,
            });
            world.makeBody(id++, {
                x: 0,
                y: 5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: thickness,
                height: length,
                restitution: 0.99,
            });
            world.makeBody(id++, {
                x: 10,
                y: 5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: thickness,
                height: length,
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
        }`,onInit:e=>{let n=1,o=2,a=11;e.makeBody(n++,{x:5,y:0,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.AABB,width:a,height:o,restitution:.99}),e.makeBody(n++,{x:5,y:10,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.AABB,width:a,height:o,restitution:.99}),e.makeBody(n++,{x:0,y:5,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.AABB,width:o,height:a,restitution:.99}),e.makeBody(n++,{x:10,y:5,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.AABB,width:o,height:a,restitution:.99});for(let s=0;s<2e3;s++){const i=n++;e.makeBody(i,{x:Math.random()*8+1,y:Math.random()*8+1,vx:Math.random()*1-.5,vy:Math.random()*1-.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*20,type:t.bodyTypes.DYNAMIC_OBJECT,mass:.5,linearDamping:0,angularDamping:.5}).addFixture({shape:t.shapes.CIRCLE,radius:.05,restitution:.5})}},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new T({name:"Fleas",key:"fleas",description:["A stress test with 2,000 bouncy `POINT` objects.","Point objects have zero radius and don't collide with each other, but they do collide with other shapes (like the `AABB` walls in this demo). This allows for extremely high-density simulations."].join(`

`),onInitRaw:`(world)=>{
            const nFleas = 2000;

            world.setGravity(0, 10);

            let id = 1;
            let thickness = 2;
            let length = 11;

            // Walls
            world.makeBody(id++, {
                x: 5,
                y: 0,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: length,
                height: thickness,
                restitution: 1.0,
                sFriction: 0,
                kFriction: 0,
            });
            world.makeBody(id++, {
                x: 5,
                y: 10,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: length,
                height: thickness,
                restitution: 1.0,
                sFriction: 0,
                kFriction: 0,
            });
            world.makeBody(id++, {
                x: 0,
                y: 5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: thickness,
                height: length,
                restitution: 1.0,
                sFriction: 0,
                kFriction: 0,
            });
            world.makeBody(id++, {
                x: 10,
                y: 5,
                type: gearbox.bodyTypes.FIXED_OBJECT,
            }).addFixture({
                shape: gearbox.shapes.AABB,
                width: thickness,
                height: length,
                restitution: 1.0,
                sFriction: 0,
                kFriction: 0,
            });

            for(let i = 0; i < nFleas; i++){
                const bodyId = id++;
                world.makeBody(bodyId, {
                    x: Math.random() * 8 + 1,
                    y: Math.random() * 8 + 1,
                    vx: Math.random() * 10.00 - 5.0,
                    // vy: Math.random() * 1.00 - .50,
                    r: Math.PI / 2 * Math.random(),
                    type: gearbox.bodyTypes.DYNAMIC_OBJECT,
                    mass: 2,
                    linearDamping: 0.0,
                    angularDamping: 0.5,
                }).addFixture({
                    shape: gearbox.shapes.POINT,
                    radius: .05,
                    restitution: 1.0,
                    sFriction: 0,
                    kFriction: 0,
                });
            }
        }`,onInit:e=>{e.setGravity(0,10);let o=1,a=2,s=11;e.makeBody(o++,{x:5,y:0,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.AABB,width:s,height:a,restitution:1,sFriction:0,kFriction:0}),e.makeBody(o++,{x:5,y:10,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.AABB,width:s,height:a,restitution:1,sFriction:0,kFriction:0}),e.makeBody(o++,{x:0,y:5,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.AABB,width:a,height:s,restitution:1,sFriction:0,kFriction:0}),e.makeBody(o++,{x:10,y:5,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.AABB,width:a,height:s,restitution:1,sFriction:0,kFriction:0});for(let i=0;i<2e3;i++){const r=o++;e.makeBody(r,{x:Math.random()*8+1,y:Math.random()*8+1,vx:Math.random()*10-5,r:Math.PI/2*Math.random(),type:t.bodyTypes.DYNAMIC_OBJECT,mass:2,linearDamping:0,angularDamping:.5}).addFixture({shape:t.shapes.POINT,radius:.05,restitution:1,sFriction:0,kFriction:0})}},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}})];let gt=0,zt=1;const bn=[new T({name:"TC-1 (SOLVED)",key:"tc-1",description:["**Test Case 1**: Verifies stability during box-on-box collisions.","Previously, boxes would exhibit 'jitter' or 'explosive' behavior when colliding at certain angles."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10);let n=1;e.makeBody(n++,{x:5,y:8,type:t.bodyTypes.FIXED_OBJECT,mass:1}).addFixture({shape:t.shapes.BOX,width:1,height:1}),e.makeBody(n++,{x:7,y:2,type:t.bodyTypes.DYNAMIC_OBJECT,mass:1}).addFixture({shape:t.shapes.BOX,width:5,height:1}),e.makeBody(n++,{x:3,y:5,type:t.bodyTypes.DYNAMIC_OBJECT,mass:1}).addFixture({shape:t.shapes.BOX,width:5,height:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new T({name:"TC-2 (SOLVED)",key:"tc-2",description:["**Test Case 2**: Ensures `BOX` shapes do not tunnel through `AABB` shapes.","This test case was used to refine the overlap detection and penetration resolution logic for different boundary types."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10);let n=1;e.makeBody(n++,{x:5,y:8,r:Math.PI/2,type:t.bodyTypes.FIXED_OBJECT,mass:1}).addFixture({shape:t.shapes.AABB,width:1,height:1}),e.makeBody(n++,{x:7,y:2,type:t.bodyTypes.DYNAMIC_OBJECT,mass:1}).addFixture({shape:t.shapes.BOX,width:5,height:1}),e.makeBody(n++,{x:3,y:5,type:t.bodyTypes.DYNAMIC_OBJECT,mass:1}).addFixture({shape:t.shapes.BOX,width:5,height:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new T({name:"TC-3 (SOLVED)",key:"tc-3",description:["**Test Case 3**: Momentum preservation and angular transfer.","Previously, objects would lose too much linear momentum during eccentric collisions. The solver now correctly calculates the balance between linear and angular velocity transfer."].join(`

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
        }`,onInit:e=>{e.setGravity(0,0);let n=1;e.makeBody(n++,{x:8,y:5,type:t.bodyTypes.FIXED_OBJECT,mass:1}).addFixture({shape:t.shapes.BOX,width:1,height:1}),e.makeBody(n++,{x:2,y:3,vx:3,type:t.bodyTypes.DYNAMIC_OBJECT,mass:1}).addFixture({shape:t.shapes.BOX,width:1,height:5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new T({name:"TC-4 (SOLVED)",key:"tc-4",description:["**Test Case 4**: Correctness of angular velocity direction.","Ensures that objects receive torque in the physically correct direction based on the contact point and normal."].join(`

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
        }`,onInit:e=>{e.setGravity(0,0);let n=1;e.makeBody(n++,{x:8,y:5,type:t.bodyTypes.FIXED_OBJECT,mass:1}).addFixture({shape:t.shapes.BOX,width:1,height:1}),e.makeBody(n++,{x:2,y:6,vx:3,type:t.bodyTypes.DYNAMIC_OBJECT,mass:1}).addFixture({shape:t.shapes.BOX,width:1,height:5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new T({name:"TC-5 (SOLVED)",key:"tc-5",description:["**Test Case 5**: Sensitivity to initial rotation.","Fixes an issue where even tiny angular velocities (`rs`) caused disproportionate collision responses. Also verifies that rotating objects transfer angular momentum in opposing directions."].join(`

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
        }`,onInit:e=>{e.setGravity(0,0);let n=1;e.makeBody(n++,{x:5,y:5,type:t.bodyTypes.DYNAMIC_OBJECT,mass:4}).addFixture({shape:t.shapes.CIRCLE,radius:1}),e.makeBody(n++,{x:2.8,y:2,vx:3,vy:3,type:t.bodyTypes.DYNAMIC_OBJECT,mass:1,rs:.01}).addFixture({shape:t.shapes.CIRCLE,radius:.5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new T({name:"TC-6 (SOLVED)",key:"tc-6",description:["**Test Case 6**: Contact point calculation accuracy.","Uses edge-clipping techniques to ensure stable and accurate impulse application during complex box-box collisions."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10),e.setHasFriction(!1);let n=1;e.makeBody(n++,{x:5,y:6,r:Math.PI/8,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.BOX,width:8,height:1}),e.makeBody(n++,{x:2,y:2,type:t.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:t.shapes.BOX,width:1,height:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new T({name:"TC-7 (SOLVED)",key:"tc-7",description:["**Test Case 7**: Friction normal vector correctness.","Ensures that friction impulses are applied exactly tangent to the contact normal, even when restitution is high."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10);let n=1;e.makeBody(n++,{x:5,y:6,r:.1,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.BOX,width:8,height:1,restitution:0}),e.makeBody(n++,{x:2,y:2,type:t.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:t.shapes.BOX,width:1,height:1,restitution:0})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new T({name:"TC-8 (SOLVED)",key:"tc-8",description:["**Test Case 8**: Stability of high-frequency circle collisions.","Verifies that multiple circles colliding in quick succession do not cause simulation instability or tunneling."].join(`

`),globalLines:["let nextId = 1;"],onInitRaw:`(world)=>{
            world.setGravity(0, 10);
            impulseTimer = 0;

            // Objects will be created in the tick function.
        }`,onInit:e=>{e.setGravity(0,10),gt=0},onTickRaw:`(world, dt)=>{
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
        }`,onTick:(e,n)=>{if(gt++,gt%60==0){let o=.1+Math.random()*.4,a=.2+o*o*.8,s=zt++;e.makeBody(s,{x:0,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*1,vy:-6-Math.random()*1,type:t.bodyTypes.DYNAMIC_OBJECT,mass:o}).addFixture({shape:t.shapes.CIRCLE,radius:a}),o=.1+Math.random()*.4,a=.2+o*o*.8;let i=zt++;e.makeBody(i,{x:10,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*-1,vy:-6-Math.random()*1,type:t.bodyTypes.DYNAMIC_OBJECT,mass:o}).addFixture({shape:t.shapes.CIRCLE,radius:a}),e.getBodyCount();let r=[];e.iterateBodies(l=>{l.y>10.5&&r.push(l)});for(let l of r)e.removeObject(l.id)}}}),new T({name:"TC-9 (SOLVED)",key:"tc-9",description:["**Test Case 9**: Resting stability.","A small box resting on a larger fixed box to verify that gravity and normal impulses reach equilibrium without constant jitter."].join(`

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
        }`,onInit:e=>{e.setGravity(0,1);let n=1;e.makeBody(n++,{x:5,y:6,r:Math.PI/2,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.BOX,width:1,height:8}),e.makeBody(n++,{x:7,y:5,type:t.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:t.shapes.BOX,width:1,height:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new T({name:"TC-10 (SOLVED)",key:"tc-10",description:["**Test Case 10**: Circle-AABB penetration resolution.","Fixes extreme responses when a circle falls directly onto a large axis-aligned platform."].join(`

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
        }`,onInit:e=>{e.setGravity(0,3);let n=1;e.makeBody(n++,{x:5,y:8,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.AABB,width:8,height:1}),e.makeBody(n++,{x:7,y:2,type:t.bodyTypes.DYNAMIC_OBJECT,mass:.2,rs:-.1}).addFixture({shape:t.shapes.CIRCLE,radius:1,restitution:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new T({name:"TC-11 (SOLVED)",key:"tc-11",description:["**Test Case 11**: Stuck objects and overlap logic.","Ensures that small circles do not get 'embedded' within other shapes when subjected to high-velocity collisions or deep initial overlaps."].join(`

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
        }`,onInit:e=>{let n=1;e.makeBody(n++,{x:5,y:5,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.AABB,width:1,height:5}),e.makeBody(n++,{x:5.2,y:5,type:t.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:t.shapes.CIRCLE,radius:.1,restitution:.5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new T({name:"TC-12 (SOLVED)",key:"tc-12",description:["**Test Case 12**: Sinking prevention under high gravity.","Verifies that boxes maintain their position on top of other objects even when high downward forces are applied, ensuring the penetration resolution is sufficient."].join(`

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
        }`,onInit:e=>{e.setGravity(0,10);let n=1;e.makeBody(n++,{x:5,y:6,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.AABB,width:8,height:1}),e.makeBody(n++,{x:7,y:4,type:t.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:t.shapes.BOX,width:1,height:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}}),new T({name:"TC-13 (SOLVED)",key:"tc-13",description:["**Test Case 13**: Stuck objects and overlap logic.","Ensures that small circles do not get 'embedded' within other shapes when subjected to high-velocity collisions or deep initial overlaps."].join(`

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
        }`,onInit:e=>{let n=1;e.makeBody(n++,{x:5,y:5,type:t.bodyTypes.FIXED_OBJECT}).addFixture({shape:t.shapes.BOX,width:1,height:5}),e.makeBody(n++,{x:5.2,y:5,type:t.bodyTypes.DYNAMIC_OBJECT,mass:.2}).addFixture({shape:t.shapes.CIRCLE,radius:.1,restitution:.5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,n)=>{}})];let w=1,xt=null,bt=null,ft=null,z=null;const fn=new T({name:"Mechanical Clockwork",key:"clockwork",description:["A physically regulated mechanical clock. This version uses a **Grashof-compliant Crank-Rocker** mechanism to ensure continuous rotation.","### Features","- **Regulated Motion**: A 2.0m pendulum defines a 9-second period in low gravity (1.0 m/s²).","- **Grashof Linkage**: Precision geometry allows the drive gear to complete full 360° rotations.","- **Kinematic Drive**: The escapement gear is driven at a fixed rotation speed to ensure perfect timekeeping.","- **Multi-stage Reduction**: 7 `GearJoint` stages step down the escapement's motion to hours and minutes.","- **Real-time Sync**: The hands and gear train initialize to your local system time."].join(`

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
    }`,onInit:e=>{e.clear(),t.debug.showAabbs=!1,w=1;const n=5,o=2.5,a=1;e.setGravity(0,a),e.setHasRestitution(!0),e.setHasFriction(!0);const s=1,i=2,r=4,l=8,h=new Date,b=h.getSeconds(),y=h.getMinutes(),g=h.getHours()%12,c={crankRadius:.251412,groundDist:.962005,rockerLength:.788035,escXOffset:0,conRodFreq:15,conRodDamping:1,springFreq:.5,springX:n-1.5},d=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1",p=document.getElementById("clock-tuner-gui");p&&p.remove();const u=document.createElement("div");u.id="clock-tuner-gui",u.style="position:fixed;top:20px;right:20px;width:280px;background:rgba(0,0,0,0.85);color:#0f0;padding:15px;border-radius:8px;font-family:monospace;z-index:1000;box-shadow:0 4px 15px rgba(0,0,0,0.5);font-size:12px;border:1px solid #333;",d&&document.body.appendChild(u);const f=document.createElement("div");f.style="margin:15px 0;padding:10px;border:1px solid #0f0;text-align:center;font-size:16px;font-weight:bold;",f.textContent="Score: 0",u.appendChild(f);const x=document.createElement("button");x.textContent="Export to Console",x.style="width:100%;padding:8px;background:#0f0;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;margin-bottom:5px;",x.onclick=()=>console.log("Final Parameters:",JSON.stringify(c,null,4)),u.appendChild(x);const m=document.createElement("button");m.textContent="Start Auto-Optimize",m.style="width:100%;padding:8px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;",m.onclick=()=>{const A=e.scoreState;A.isOptimizing=!A.isOptimizing,m.textContent=A.isOptimizing?"Stop Auto-Optimize":"Start Auto-Optimize",m.style.background=A.isOptimizing?"#f00":"#444",A.isOptimizing&&(A.bestScore=-1/0,A.optimizationStage="PREPARE",A.optParamIndex=0,A.optDirection=1,A.epsilon=.05,A.lastImprovementIteration=0,console.log("Starting Auto-Optimization..."))},u.appendChild(m);const k=document.createElement("div");k.style="margin-top:10px;font-size:10px;color:#aaa;",k.textContent="Optimizer: Idle",u.appendChild(k);const I={},v=(A,F,le,he,$e)=>{const qe=document.createElement("div");qe.style.marginBottom="10px";const Ue=document.createElement("div");Ue.textContent=`${A}: ${c[F].toFixed(2)}`;const N=document.createElement("input");N.type="range",N.min=le,N.max=he,N.step=$e,N.value=c[F],N.style.width="100%",N.oninput=()=>{c[F]=parseFloat(N.value),Ue.textContent=`${A}: ${c[F].toFixed(2)}`,Pe()},qe.appendChild(Ue),qe.appendChild(N),u.appendChild(qe),I[F]={slider:N,labelEl:Ue,label:A}},R=A=>{const F=I[A];F&&(F.slider.value=c[A],F.labelEl.textContent=`${F.label}: ${c[A].toFixed(2)}`)};v("Crank Radius","crankRadius",.05,.5,.01),v("Ground Distance","groundDist",.5,2,.05),v("Rocker Length","rockerLength",.3,1.5,.05),v("Esc X Offset","escXOffset",-.5,.5,.01),v("Rod Frequency","conRodFreq",5,50,1),v("Spring Frequency","springFreq",.1,2,.05),v("Spring X Pos","springX",n-3,n-.5,.1);const O=o+2,J=O-c.groundDist,H=a*Math.pow(8/(2*Math.PI),2);H-c.rockerLength;const G=w++,fe=e.makeBody(G,{x:n,y:O,type:t.bodyTypes.FIXED_OBJECT,color:"#888"});fe.addFixture(G,{shape:t.shapes.CIRCLE,radius:.1,categoryBits:s,maskBits:0});const Ee=w++,oe=e.makeBody(Ee,{x:n,y:J,type:t.bodyTypes.FIXED_OBJECT,color:"#888"});oe.addFixture(Ee,{shape:t.shapes.CIRCLE,radius:.1,categoryBits:s,maskBits:0});const Je=w++,V=e.makeBody(Je,{x:n,y:o,type:t.bodyTypes.FIXED_OBJECT,color:"#888"});V.addFixture(Je,{shape:t.shapes.CIRCLE,radius:.1,categoryBits:s,maskBits:0});const Ae=.5,ve=w++;z=e.makeBody(ve,{x:n+Math.sin(Ae)*H,y:O+Math.cos(Ae)*H,r:-Ae,mass:5,color:"#cd853f"}),z.addFixture(ve,{shape:t.shapes.CIRCLE,radius:.4,categoryBits:i,maskBits:0}),z.angularDamping=.01,e.createHingeJoint(w++,fe,z,{worldAnchor:{x:n,y:O},anchorB:{x:0,y:-H}});const Ie=w++,Y=e.makeBody(Ie,{x:n+c.escXOffset,y:J,r:0,type:t.bodyTypes.KINEMATIC_OBJECT,color:"#aaa"});Y.addFixture(Ie,{shape:t.shapes.CIRCLE,radius:.5,categoryBits:r,maskBits:0}),Y.rs=Math.PI*2/8;const He=e.createHingeJoint(w++,oe,Y,{worldAnchor:{x:n+c.escXOffset,y:J}}),Qe={x:c.crankRadius,y:0},_e={x:0,y:-c.rockerLength},se=()=>{const A=n+c.escXOffset,F=O-c.groundDist,le={x:A+c.crankRadius,y:F},he={x:n,y:O+(H-c.rockerLength)};return Math.sqrt(Math.pow(le.x-he.x,2)+Math.pow(le.y-he.y,2))},ce=e.createSpringJoint(w++,Y,z,{anchorA:Qe,anchorB:_e,length:se(),frequencyHz:c.conRodFreq,dampingRatio:c.conRodDamping}),Pe=()=>{const A=O-c.groundDist,F=n+c.escXOffset;oe.x=F,oe.y=A,Y.x=F,Y.y=A,He.localAnchorA=oe.worldToLocal({x:F,y:A}),ce.localAnchorA={x:c.crankRadius,y:0},ce.localAnchorB={x:0,y:-c.rockerLength},ce.length=se(),ce.frequencyHz=c.conRodFreq,ce.dampingRatio=c.conRodDamping};e.scoreState={fastGear:Y,pendulum:z,params:c,updateSimulation:Pe,updateSliderUI:R,optStatus:k,lastFastR:Y.r,lastPendRs:z.rs,lastRsSign:Math.sign(z.rs),rsSignChanges:0,maxAngle:-1/0,minAngle:1/0,hasCrossedZero:!1,history:[],periodTimes:[],lastPendSide:Math.sign(z.r),lastPendCrossing:0,scoreDisplay:f,isOptimizing:!1};const an=8/60,et=n+1.5,tt=J+.5,Tt=w++,Et=e.makeBody(Tt,{x:et,y:tt,type:t.bodyTypes.FIXED_OBJECT,color:"#888"});Et.addFixture(Tt,{shape:t.shapes.CIRCLE,radius:.1,categoryBits:s,maskBits:0});const At=w++,nt=e.makeBody(At,{x:et,y:tt,mass:.2,r:0,color:"#44ff44"});nt.addFixture(At,{shape:t.shapes.CIRCLE,radius:1,categoryBits:r,maskBits:0}),nt.angularDamping=.02;const vt=e.createHingeJoint(w++,Et,nt,{worldAnchor:{x:et,y:tt}});e.createGearJoint(w++,He,vt,.25);const je=b/60*Math.PI*2,Ft=w++,ot=e.makeBody(Ft,{x:n,y:o,mass:.2,r:je,color:"#ff4444"});ot.addFixture(Ft,{shape:t.shapes.CIRCLE,radius:.6,categoryBits:r,maskBits:0}),ot.angularDamping=.02;const st=e.createHingeJoint(w++,V,ot,{worldAnchor:{x:n,y:o}});e.createGearJoint(w++,vt,st,an/.25);const Ge=y/60*Math.PI*2,Ye=g/12*Math.PI*2,ze=3.5,Ne=3,We=2;for(let A=0;A<12;A++){const F=A/12*Math.PI*2-Math.PI/2,le=3.8,he=4,$e=w++;e.makeBody($e,{x:n+Math.cos(F)*(le+he)/2,y:o+Math.sin(F)*(le+he)/2,r:F+Math.PI/2,type:t.bodyTypes.FIXED_OBJECT,color:"#999"}).addFixture($e,{shape:t.shapes.BOX,width:A%3===0?.2:.1,height:.4,categoryBits:s,maskBits:0})}const Mt=w++;xt=e.makeBody(Mt,{x:n+Math.sin(je)*(ze/2-.2),y:o-Math.cos(je)*(ze/2-.2),r:je,mass:.1,color:"#ff4444"}),xt.addFixture(Mt,{shape:t.shapes.BOX,width:.05,height:ze,categoryBits:l,maskBits:0});const rn=e.createHingeJoint(w++,V,xt,{worldAnchor:{x:n,y:o},anchorB:{x:0,y:ze/2-.2}});e.createGearJoint(w++,st,rn,-1);const at=n-1.5,it=o-1.5,Rt=w++,Ot=e.makeBody(Rt,{x:at,y:it,type:t.bodyTypes.FIXED_OBJECT,color:"#888"});Ot.addFixture(Rt,{shape:t.shapes.CIRCLE,radius:.1,categoryBits:s,maskBits:0});const St=w++,rt=e.makeBody(St,{x:at,y:it,mass:.2,r:0,color:"#4444ff"});rt.addFixture(St,{shape:t.shapes.CIRCLE,radius:1,categoryBits:r,maskBits:0}),rt.angularDamping=.01;const Lt=e.createHingeJoint(w++,Ot,rt,{worldAnchor:{x:at,y:it}});e.createGearJoint(w++,st,Lt,1/10);const Dt=w++,dt=e.makeBody(Dt,{x:n,y:o,mass:.2,r:Ge,color:"#4444ff"});dt.addFixture(Dt,{shape:t.shapes.CIRCLE,radius:.8,categoryBits:r,maskBits:0}),dt.angularDamping=.01;const ct=e.createHingeJoint(w++,V,dt,{worldAnchor:{x:n,y:o}});e.createGearJoint(w++,Lt,ct,1/6);const Xt=w++;bt=e.makeBody(Xt,{x:n+Math.sin(Ge)*(Ne/2-.3),y:o-Math.cos(Ge)*(Ne/2-.3),r:Ge,mass:.2,color:"#4444ff"}),bt.addFixture(Xt,{shape:t.shapes.BOX,width:.12,height:Ne,categoryBits:l,maskBits:0});const dn=e.createHingeJoint(w++,V,bt,{worldAnchor:{x:n,y:o},anchorB:{x:0,y:Ne/2-.3}});e.createGearJoint(w++,ct,dn,-1);const lt=n+2,ht=o-1,Jt=w++,Ht=e.makeBody(Jt,{x:lt,y:ht,type:t.bodyTypes.FIXED_OBJECT,color:"#888"});Ht.addFixture(Jt,{shape:t.shapes.CIRCLE,radius:.1,categoryBits:s,maskBits:0});const _t=w++,pt=e.makeBody(_t,{x:lt,y:ht,mass:.2,r:0,color:"#cccc44"});pt.addFixture(_t,{shape:t.shapes.CIRCLE,radius:1,categoryBits:r,maskBits:0}),pt.angularDamping=.01;const Pt=e.createHingeJoint(w++,Ht,pt,{worldAnchor:{x:lt,y:ht}});e.createGearJoint(w++,ct,Pt,1/3);const jt=w++,mt=e.makeBody(jt,{x:n,y:o,mass:.2,r:Ye,color:"#cc8844"});mt.addFixture(jt,{shape:t.shapes.CIRCLE,radius:1.1,categoryBits:r,maskBits:0}),mt.angularDamping=.01;const Gt=e.createHingeJoint(w++,V,mt,{worldAnchor:{x:n,y:o}});e.createGearJoint(w++,Pt,Gt,1/4);const Yt=w++;ft=e.makeBody(Yt,{x:n+Math.sin(Ye)*(We/2-.4),y:o-Math.cos(Ye)*(We/2-.4),r:Ye,mass:.3,color:"#cc8844"}),ft.addFixture(Yt,{shape:t.shapes.BOX,width:.18,height:We,categoryBits:l,maskBits:0});const cn=e.createHingeJoint(w++,V,ft,{worldAnchor:{x:n,y:o},anchorB:{x:0,y:We/2-.4}});e.createGearJoint(w++,Gt,cn,-1)},onTickRaw:`(world, dt) => {
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
    }`,onTick:(e,n)=>{const o=e.scoreState;if(o){const i=performance.now(),r=8e3;let l=0,h=!1;if(o.fastGear){const I=o.fastGear.r-o.lastFastR;I<-.01&&(h=!0),l=Math.max(0,I)/(Math.PI*2),o.lastFastR=o.fastGear.r}const b=o.pendulum.r,y=o.pendulum.rs,g=(y-o.lastPendRs)/n;o.lastPendRs=y;const c=Math.sign(y);if(c!==o.lastRsSign&&c!==0&&(o.rsSignChanges++,o.lastRsSign=c),o.maxAngle=Math.max(o.maxAngle,b),o.minAngle=Math.min(o.minAngle,b),o.history.push({time:i,rotDelta:l,isReversal:h,pendR:b,pendRs:y,pendRa:g}),o.pendulum){const I=Math.sign(o.pendulum.r);if(I!==o.lastPendSide&&I!==0){if(o.hasCrossedZero=!0,o.lastPendCrossing>0){const v=(i-o.lastPendCrossing)/500;v>.5&&v<10&&o.periodTimes.push({time:i,period:v})}o.lastPendCrossing=i,o.lastPendSide=I}}const d=i-r;for(;o.history.length>0&&o.history[0].time<d;)o.history.shift();for(;o.periodTimes.length>0&&o.periodTimes[0].time<d;)o.periodTimes.shift();let p=0,u=0,f=0;if(o.history.length>0){let I=0,v=0;for(const R of o.history)I+=Math.abs(R.pendRa),v+=Math.abs(R.pendRs),f=Math.max(f,Math.abs(R.pendRa));p=I/o.history.length,u=v/o.history.length}const x=(o.maxAngle-o.minAngle)/2;let m=Math.min(x,.6)*2e3;const k=Math.abs(o.maxAngle+o.minAngle);if(m-=k*1e3,m-=p*10,m-=f*2,o.rsSignChanges>2&&(m-=(o.rsSignChanges-2)*500),m+=u*100,o.hasCrossedZero||(m-=1e4),x<.1&&(m-=5e3),!o.isOptimizing&&o.history.length===0&&(o.maxAngle=-1/0,o.minAngle=1/0,o.hasCrossedZero=!1,o.rsSignChanges=0),o.scoreDisplay.textContent=`Score: ${Math.floor(m)} | Amp: ${x.toFixed(2)} | Jit: ${Math.max(0,o.rsSignChanges-2)}${o.hasCrossedZero?"":" [STUCK]"}`,o.isOptimizing){const I=["crankRadius","groundDist","rockerLength","escXOffset","conRodFreq"];o.optimizationStage==="PREPARE"?(o.bestScore=-1/0,o.optimizationStage="TWEAK",o.evalTimer=i+r,o.improvedThisCycle=!1,o.maxAngle=-1/0,o.minAngle=1/0,o.hasCrossedZero=!1,o.rsSignChanges=0):i>o.evalTimer&&o.optimizationStage==="TWEAK"&&(m>o.bestScore?(o.bestScore=m,o.improvedThisCycle=!0,o.optStatus.textContent=`Improved ${I[o.optParamIndex]} (Best: ${Math.floor(m)})`):(o.params[I[o.optParamIndex]]-=o.epsilon*o.optDirection,o.updateSimulation(),o.updateSliderUI(I[o.optParamIndex])),o.optDirection*=-1,o.optDirection===1&&(o.optParamIndex++,o.optParamIndex>=I.length&&(o.optParamIndex=0,o.improvedThisCycle||(o.epsilon*=.7),o.improvedThisCycle=!1)),o.params[I[o.optParamIndex]]+=o.epsilon*o.optDirection,o.updateSimulation(),o.updateSliderUI(I[o.optParamIndex]),o.maxAngle=-1/0,o.minAngle=1/0,o.hasCrossedZero=!1,o.rsSignChanges=0,o.evalTimer=i+r,o.optStatus.textContent=`Testing ${I[o.optParamIndex]} (${o.optDirection>0?"+":"-"}) Best: ${Math.floor(o.bestScore)}`)}else o.optStatus.textContent="Optimizer: Idle"}const s=new Date().toLocaleTimeString();if(t.debug.clearLabels(),t.debug.addLabel({text:"Mechanical Clockwork",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"}),t.debug.addLabel({text:s,x:5,y:9.5,fontSize:"36px Arial",color:"#fff",position:"on-top"}),z){const i=(z.r*180/Math.PI).toFixed(1);t.debug.addLabel({text:`Pendulum: ${i}°`,x:8,y:8,fontSize:"16px Arial",color:"#cd853f",position:"on-top"})}},onCleanup:e=>{const n=document.getElementById("clock-tuner-gui");n&&n.remove()}});let _=1,q=null;const In=new T({name:"Gnome Omega Engine",key:"gnome-omega",description:["A detailed simulation of a **Gnome Omega** rotary engine. In this classic radial design, the crankshaft remains stationary while the entire cylinder block rotates around it.","### Features","- **Stationary Crankshaft**: A fixed pivot point (red) offset from the center.","- **Rotating Crankcase**: The main grey hub that carries the cylinders.","- **Weld Constraints**: Cylinders are 'welded' to the hub using a combination of `HingeJoint` and `DistanceJoint` for maximum stability.","- **Reciprocating Motion**: Pistons and connecting rods are synchronized via `HingeJoint` constraints.","- **Collision Masks**: Bitwise filtering ensures pistons only interact with their respective cylinder walls.","Click **Reset** if the simulation becomes unstable due to extreme angular velocities."].join(`

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
    }`,onInit:e=>{e.clear(),t.debug.showAabbs=!1,_=1,q=null;const n=5,o=4.5,a=.8,s=7,i=2.5,r=256,l=512,h=1024,b=2048,y=4096,g=_++,c=e.makeBody(g,{x:n,y:o,type:t.bodyTypes.FIXED_OBJECT,color:"#888"});c.addFixture(g,{shape:t.shapes.CIRCLE,radius:.15,categoryBits:r,maskBits:0});const d=_++,p=e.makeBody(d,{x:n,y:o+a,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444"});p.addFixture(d,{shape:t.shapes.CIRCLE,radius:.1,categoryBits:r,maskBits:0});const u=_++;q=e.makeBody(u,{x:n,y:o,mass:50,color:"#aaa"}),q.addFixture(u,{shape:t.shapes.CIRCLE,radius:.8,categoryBits:l,maskBits:0,restitution:0}),e.createHingeJoint(_++,c,q,{worldAnchor:{x:n,y:o}});for(let f=0;f<s;f++){const x=f/s*Math.PI*2,m=Math.cos(x),k=Math.sin(x),I=x-Math.PI/2,v=2.6,R=.28,O=2.5,J=1,ne=Y=>{const He=n+m*v+-k*(Y*J/2),Qe=o+k*v+m*(Y*J/2),_e=_++,se=e.makeBody(_e,{x:He,y:Qe,r:I,mass:1,color:"#bbb"});se.addFixture(_e,{shape:t.shapes.BOX,width:R,height:O,categoryBits:h,maskBits:b,restitution:0,sFriction:0,kFriction:0});const ce=se.localToWorld({x:0,y:-O/2}),Pe=se.localToWorld({x:0,y:O/2});e.createHingeJoint(_++,q,se,{worldAnchor:ce}),e.createDistanceJoint(_++,q,se,{worldAnchor:Pe})};ne(-1),ne(1);const H=a*Math.sin(x)+Math.sqrt(i*i-Math.pow(a*Math.cos(x),2)),G=n+m*H,fe=o+k*H,Ee=_++,oe=e.makeBody(Ee,{x:G,y:fe,r:I,mass:.5,color:"#ddd"});oe.addFixture(Ee,{shape:t.shapes.BOX,width:.7,height:1,categoryBits:b,maskBits:h,restitution:0,sFriction:0,kFriction:0});const Je=(n+G)/2,V=(o+a+fe)/2,Ae=Math.atan2(fe-(o+a),G-n)-Math.PI/2,ve=_++,Ie=e.makeBody(ve,{x:Je,y:V,r:Ae,mass:.2,color:"#fff"});Ie.addFixture(ve,{shape:t.shapes.BOX,width:.15,height:i,categoryBits:y,maskBits:0,restitution:0}),e.createHingeJoint(_++,Ie,p,{anchorA:{x:0,y:-i/2},anchorB:{x:0,y:0}}),e.createHingeJoint(_++,Ie,oe,{anchorA:{x:0,y:i/2},anchorB:{x:0,y:0}})}e.setGravity(0,0),q.rs=2},onTickRaw:`(world, dt) => {
        if (engineHub) {
            // Apply a gentle impulse to maintain rotation
            if (Math.abs(engineHub.rs) < 0.9) {
                engineHub.applyAngularImpulse(5);
            }
        }
    }`,onTick:(e,n)=>{q&&Math.abs(q.rs)<.9&&q.applyAngularImpulse(5)}});let De=1,Q=null;const we=[{name:"Cherry",radius:.15,mass:.1,color:"#ff4444",score:1},{name:"Strawberry",radius:.22,mass:.2,color:"#ff6666",score:3},{name:"Grape",radius:.28,mass:.3,color:"#9933ff",score:6},{name:"Dekopon",radius:.35,mass:.4,color:"#ff9933",score:10},{name:"Persimmon",radius:.42,mass:.5,color:"#ff6600",score:15},{name:"Apple",radius:.5,mass:.7,color:"#cc0000",score:21},{name:"Pear",radius:.58,mass:.9,color:"#ffff66",score:28},{name:"Peach",radius:.68,mass:1.2,color:"#ff99cc",score:36},{name:"Pineapple",radius:.8,mass:1.6,color:"#ffff00",score:45},{name:"Melon",radius:.95,mass:2.2,color:"#99ff33",score:55},{name:"Watermelon",radius:1.15,mass:3,color:"#006600",score:66}];let C={score:0,nextFruitLevel:0,isGameOver:!1,lastDropTime:0,dropCooldown:500,mouseX:5,fruitIds:new Map,mergingIds:new Set,previewFruit:null};const Nt=()=>{C.score=0,C.nextFruitLevel=Math.floor(Math.random()*5),C.isGameOver=!1,C.lastDropTime=0,C.mouseX=5,C.fruitIds.clear(),C.mergingIds.clear(),C.previewFruit=null,De=1},Bn=e=>(e-t.debug.offsetX)/(t.debug.zoom*100),Zt=new T({name:"Fruit Merge",key:"fruit-merge",description:["A physics-based arcade game demonstrating dynamic object spawning and collision events.","Drop fruits into the bucket. Identical fruits will **merge** into the next larger fruit tier on contact.","### Controls","- **Mouse Move**: Position the preview fruit","- **Click**: Drop fruit","**Game Over** occurs if any fruit falls out of the world boundaries."].join(`

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
        }).addFixture(bucketBottomId, {
            shape: gearbox.shapes.BOX,
            width: bw + thickness * 2, height: thickness,
        });

        // Left Wall
        const leftWallId = nextId++;
        world.makeBody(leftWallId, {
            x: bx - bw / 2 - thickness / 2, y: by,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#664422"
        }).addFixture(leftWallId, {
            shape: gearbox.shapes.BOX,
            width: thickness, height: bh,
        });

        // Right Wall
        const rightWallId = nextId++;
        world.makeBody(rightWallId, {
            x: bx + bw / 2 + thickness / 2, y: by,
            type: gearbox.bodyTypes.FIXED_OBJECT,
            color: "#664422"
        }).addFixture(rightWallId, {
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
            fruit.addFixture(id, {
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
    }`,onInit:e=>{e.clear(),Nt(),t.debug.showAabbs=!1,e.setGravity(0,9.8),e.setHasRestitution(!0),e.setHasFriction(!0);const n=5,o=6,a=4,s=5,i=.2,r=De++;e.makeBody(r,{x:n,y:o+s/2+i/2,type:t.bodyTypes.FIXED_OBJECT,color:"#664422"}).addFixture(r,{shape:t.shapes.BOX,width:a+i*2,height:i});const l=De++;e.makeBody(l,{x:n-a/2-i/2,y:o,type:t.bodyTypes.FIXED_OBJECT,color:"#664422"}).addFixture(l,{shape:t.shapes.BOX,width:i,height:s});const h=De++;e.makeBody(h,{x:n+a/2+i/2,y:o,type:t.bodyTypes.FIXED_OBJECT,color:"#664422"}).addFixture(h,{shape:t.shapes.BOX,width:i,height:s});const b=(c,d,p,u=!1)=>{if(p>=we.length)return null;const f=we[p],x=De++,m=e.makeBody(x,{x:c,y:d,mass:f.mass,color:f.color});return m.addFixture(x,{shape:t.shapes.CIRCLE,radius:f.radius,restitution:.2,sFriction:.5,kFriction:.3}),m&&(m.wantsEvents=!0,C.fruitIds.set(x,p),u&&(m.vx=(Math.random()-.5)*.1)),m};e.onCollisionStart=(c,d)=>{if(C.isGameOver)return;const p=C.fruitIds.get(c),u=C.fruitIds.get(d);if(p!==void 0&&u!==void 0&&p===u){if(C.mergingIds.has(c)||C.mergingIds.has(d))return;const f=p;if(f>=we.length-1)return;C.mergingIds.add(c),C.mergingIds.add(d);const x=e.getBodyById(c),m=e.getBodyById(d);if(x&&m){const k=(x.x+m.x)/2,I=(x.y+m.y)/2;setTimeout(()=>{e.removeObject(c),e.removeObject(d),C.fruitIds.delete(c),C.fruitIds.delete(d),C.mergingIds.delete(c),C.mergingIds.delete(d),b(k,I,f+1)&&(C.score+=we[f+1].score)},0)}}},Q=document.getElementById("debug-canvas"),e._onMouseMove&&Q.removeEventListener("mousemove",e._onMouseMove),e._onClick&&Q.removeEventListener("click",e._onClick);const y=c=>{if(C.isGameOver)return;const d=Q.getBoundingClientRect();C.mouseX=Bn(c.clientX-d.left);const p=we[C.nextFruitLevel].radius;C.mouseX=Math.max(n-a/2+p,Math.min(n+a/2-p,C.mouseX))},g=c=>{if(C.isGameOver){e.clear(),Nt(),Zt.onInit(e);return}const d=Date.now();d-C.lastDropTime>C.dropCooldown&&(b(C.mouseX,o-s/2-1,C.nextFruitLevel,!0),C.nextFruitLevel=Math.floor(Math.random()*5),C.lastDropTime=d)};e._onMouseMove=y,e._onClick=g,Q.addEventListener("mousemove",y),Q.addEventListener("click",g)},onTickRaw:`(world, dt) => {
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
        world.iterateBodies((obj) => {
            if (gameState.fruitIds.has(obj.id)) {
                if (obj.y > 12) { // Fell below the bucket
                    gameState.isGameOver = true;
                }
            }
        });

        gearbox.debug.addLabel({ text: "Fruit Merge", x: 5, y: 0.5, fontSize: "28px Arial", color: "#bbb", position: "on-top" });
    }`,onTick:(e,n)=>{if(t.debug.clearLabels(),C.isGameOver){t.debug.addLabel({text:"GAME OVER",x:5,y:4,fontSize:"48px Arial",color:"#ff4444",position:"on-top"}),t.debug.addLabel({text:`Final Score: ${C.score}`,x:5,y:5,fontSize:"24px Arial",color:"#fff",position:"on-top"}),t.debug.addLabel({text:"Click to Restart",x:5,y:6,fontSize:"20px Arial",color:"#888",position:"on-top"});return}t.debug.addLabel({text:`Score: ${C.score}`,x:.5,y:.5,fontSize:"24px Arial",color:"#fff",textAlign:"left"});const o=we[C.nextFruitLevel];t.debug.addLabel({text:`Next: ${o.name}`,x:8,y:.5,fontSize:"18px Arial",color:o.color,textAlign:"right"}),t.debug.addLabel({text:"●",x:C.mouseX,y:1.5,fontSize:`${o.radius*200}px Arial`,color:o.color,position:"on-top"}),e.iterateBodies(s=>{C.fruitIds.has(s.id)&&s.y>12&&(C.isGameOver=!0)}),t.debug.addLabel({text:"Fruit Merge",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"})},onCleanup:e=>{Q&&(Q.removeEventListener("mousemove",e._onMouseMove),Q.removeEventListener("click",e._onClick),delete e._onMouseMove,delete e._onClick)}});let S=1,E=null,me=null,Ce=null,ke=null,D=null,X=null,ue=[],ae={},j=null,be=null,re=null;const Te=1,Se=2,ie=4,Qt=(e,n)=>({x:(e-t.debug.offsetX)/(t.debug.zoom*100),y:(n-t.debug.offsetY)/(t.debug.zoom*100)}),wn=(e,n)=>{if(e.button!==0)return;const o=re.getBoundingClientRect(),a=Qt(e.clientX-o.left,e.clientY-o.top),s=n.queryPoint(a.x,a.y);if(s.length>0){const i=s[0],r=n.getBodyById(i);r&&r.type!==t.bodyTypes.FIXED_OBJECT&&(j=n.makeBody(999999,{x:a.x,y:a.y,type:t.bodyTypes.FIXED_OBJECT,color:"transparent"}),j.addFixture(999999,{shape:t.shapes.CIRCLE,radius:.05,maskBits:0}),be=n.createSpringJoint(999998,j,r,{worldAnchor:a,frequencyHz:5,dampingRatio:1,length:0}))}},Cn=e=>{if(j){const n=re.getBoundingClientRect(),o=Qt(e.clientX-n.left,e.clientY-n.top);j.x=o.x,j.y=o.y}},kn=(e,n)=>{be&&(n.removeJoint(be.id),be=null),j&&(n.removeObject(j.id),j=null)},en=new T({name:"Motorcycle Trials",key:"motorcycle",description:["A physically-driven motorcycle featuring multi-joint suspension and a gear-driven powertrain.","### Controls","- **D / A**: Throttle / Reverse","- **W / S**: Lean / Balance","- **R**: Reset Simulation","### Technical Features","- **Power Transfer**: Engine-to-wheel torque transfer using `GearJoint` constraints.","- **Suspension**: A network of `SpringJoint` constraints for authentic front/rear suspension travel.","- **Procedural Terrain**: Dynamic generation with optimized **Collision Masks** (terrain-terrain collisions are disabled for performance)."].join(`

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
            anchorA: { x: -0.6, y: -0.2 },
            anchorB: { x: -0.2, y: 0 },
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
        world.createGearJoint(nextId++, engineHinge, rearWheelHinge, -2.0);

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
            anchorB: { x: 0, y: 0.1 },
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
    }`,onInit:e=>{e.clear(),t.debug.showAabbs=!1,t.debug.showForceVectors=!1,S=1,ue=[],ae={};const n=5,o=5;e.setGravity(0,9.81),e.setHasRestitution(!0),e.setHasFriction(!0);const a=S++;E=e.makeBody(a,{x:n,y:o,mass:10,color:"#ff4444"}),E.addFixture(a,{shape:t.shapes.BOX,width:1.2,height:.4,categoryBits:Te,maskBits:ie}),E.angularDamping=1;const s=S++;me=e.makeBody(s,{x:n,y:o-.15,mass:5,color:"#444"}),me.addFixture(s,{shape:t.shapes.CIRCLE,radius:.25,categoryBits:0,maskBits:0});const i=e.createHingeJoint(S++,E,me,{worldAnchor:{x:n,y:o-.15}}),r=S++;X=e.makeBody(r,{x:n-.6,y:o+.2,mass:1,color:"#666"}),X.addFixture({shape:t.shapes.BOX,width:.6,height:.1,categoryBits:Te,maskBits:ie}),X.angularDamping=1,e.createHingeJoint(S++,E,X,{anchorA:{x:-.4,y:.1},anchorB:{x:.3,y:0}}),e.createSpringJoint(S++,E,X,{anchorA:{x:-.6,y:-.2},anchorB:{x:-.2,y:0},frequencyHz:25,dampingRatio:.8});const l=S++;ke=e.makeBody(l,{x:n-.9,y:o+.2,mass:2,color:"#333"}),ke.addFixture(l,{shape:t.shapes.CIRCLE,radius:.4,categoryBits:Se,maskBits:ie}),ke.fixtures[0].kineticFriction=2.5,ke.fixtures[0].staticFriction=3,ke.angularDamping=.5;const h=e.createHingeJoint(S++,X,ke,{anchorA:{x:-.3,y:0},anchorB:{x:0,y:0}});e.createGearJoint(S++,i,h,-2);const b=S++;D=e.makeBody(b,{x:n+.7,y:o+.2,r:.3,mass:1,color:"#666"}),D.addFixture({shape:t.shapes.BOX,width:.1,height:.8,categoryBits:Te,maskBits:ie}),D.angularDamping=1,e.createHingeJoint(S++,E,D,{anchorA:{x:.5,y:0},anchorB:{x:0,y:-.3}}),e.createSpringJoint(S++,E,D,{anchorA:{x:.2,y:.2},anchorB:{x:0,y:.1},frequencyHz:20,dampingRatio:.9});const y=S++;Ce=e.makeBody(y,{x:n+.8,y:o+.5,mass:2,color:"#333"}),Ce.addFixture(y,{shape:t.shapes.CIRCLE,radius:.4,categoryBits:Se,maskBits:ie}),Ce.fixtures[0].kineticFriction=2,Ce.fixtures[0].staticFriction=2.5,Ce.angularDamping=.5,e.createHingeJoint(S++,D,Ce,{anchorA:{x:0,y:.4},anchorB:{x:0,y:0}});const g=S++,c=e.makeBody(g,{x:n,y:o+2,type:t.bodyTypes.FIXED_OBJECT,color:"#444"});c.addFixture({shape:t.shapes.BOX,width:20,height:1,categoryBits:ie,maskBits:Te|Se}),ue.push(c);const d=S++;e.makeBody(d,{x:-7.72,y:.01,r:1.2,type:t.bodyTypes.FIXED_OBJECT,color:"#333"}).addFixture({shape:t.shapes.BOX,width:15,height:1,categoryBits:ie,maskBits:Te|Se});const p=I=>ae[I.code]=!0,u=I=>ae[I.code]=!1;re=document.getElementById("debug-canvas");const f=I=>wn(I,e),x=I=>Cn(I),m=I=>kn(I,e),k=e._motorcycleListeners;k&&(window.removeEventListener("keydown",k.onKeyDown),window.removeEventListener("keyup",k.onKeyUp),re&&re.removeEventListener("mousedown",k.mouseDownHandler),window.removeEventListener("mousemove",k.mouseMoveHandler),window.removeEventListener("mouseup",k.mouseUpHandler)),window.addEventListener("keydown",p),window.addEventListener("keyup",u),re.addEventListener("mousedown",f),window.addEventListener("mousemove",x),window.addEventListener("mouseup",m),e._motorcycleListeners={onKeyDown:p,onKeyUp:u,mouseDownHandler:f,mouseMoveHandler:x,mouseUpHandler:m}},onTickRaw:`(world, dt) => {
        if (!chassis) return;

        // --- 3. Controls & Engine ---
        const throttlePower = 150.0;
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

        // --- 4. Procedural Terrain ---
        const lastBox = terrainBoxes[terrainBoxes.length - 1];
        if (lastBox.x < chassis.x + 25) {
            const width = 6 + Math.random() * 8;
            const height = 1.2;
            const angle = (Math.random() - 0.5) * 0.5;
            
            // Connect middle-right of last box to middle-left of new box
            const gap = Math.random() < 0.2 ? 1.5 : 0; 
            
            // Get middle-right point of previous box in world space
            const lastMR = lastBox.localToWorld({ x: lastBox.fixtures[0].width / 2, y: 0 });
            
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
    }`,onTick:(e,n)=>{if(!E)return;const o=150,a=100,s=100;if(X){let r=X.r-E.r;for(;r>Math.PI;)r-=Math.PI*2;for(;r<-Math.PI;)r+=Math.PI*2;const l=-.6,h=.6;r<l?(X.r=E.r+l,X.rs<E.rs&&(X.rs=E.rs)):r>h&&(X.r=E.r+h,X.rs>E.rs&&(X.rs=E.rs))}if(D){let r=D.r-E.r;for(;r>Math.PI;)r-=Math.PI*2;for(;r<-Math.PI;)r+=Math.PI*2;const l=-.1,h=.8;r<l?(D.r=E.r+l,D.rs<E.rs&&(D.rs=E.rs)):r>h&&(D.r=E.r+h,D.rs>E.rs&&(D.rs=E.rs))}if(ae.KeyD&&me.rs<s&&me.applyAngularImpulse(o*n),ae.KeyA&&me.rs>-s&&me.applyAngularImpulse(-o*n),ae.KeyW&&E.applyAngularImpulse(-a*n),ae.KeyS&&E.applyAngularImpulse(a*n),ae.KeyR){en.init(e);return}const i=ue[ue.length-1];if(i.x<E.x+25){const r=6+Math.random()*8,l=1.2,h=(Math.random()-.5)*.5,b=Math.random()<.2?1.5:0,y=i.localToWorld({x:i.fixtures[0].width/2,y:0}),g=y.x+b;let c=y.y+(b>0?(Math.random()-.5)*3:0);c=Math.max(2,Math.min(8,c));const d=Math.cos(h),p=Math.sin(h),u=g+r/2*d,f=c+r/2*p,x=S++,m=e.makeBody(x,{x:u,y:f,r:h,type:t.bodyTypes.FIXED_OBJECT,color:`hsl(${20+Math.random()*40}, 30%, ${30+Math.random()*20}%)`});if(m.addFixture({shape:t.shapes.BOX,width:r,height:l,categoryBits:ie,maskBits:Te|Se}),ue.push(m),ue.length>50){const k=ue.shift();e.removeObject(k.id)}}t.debug.clearLabels(),E.x<15&&(t.debug.addLabel({text:"Motorcycle Trials",x:5,y:3,fontSize:"28px Arial",color:"#fff",position:"on-top"}),t.debug.addLabel({text:"Use D/A to drive and W/S to balance!",x:5,y:3.5,fontSize:"16px Arial",color:"#aaa",position:"on-top"}))},onRender:e=>{if(!E)return;const n=e.interpolationAlpha,o=E.x*n+E.prevX*(1-n),a=E.y*n+E.prevY*(1-n),s=t.debug.canvas?.width||800,i=t.debug.canvas?.height||600,r=t.debug.zoom,l=s/2-o*100*r,h=i/2-a*100*r;t.debug.offsetX+=(l-t.debug.offsetX)*.1,t.debug.offsetY+=(h-t.debug.offsetY)*.1},onCleanup:e=>{const n=e._motorcycleListeners;n&&(window.removeEventListener("keydown",n.onKeyDown),window.removeEventListener("keyup",n.onKeyUp),re&&re.removeEventListener("mousedown",n.mouseDownHandler),window.removeEventListener("mousemove",n.mouseMoveHandler),window.removeEventListener("mouseup",n.mouseUpHandler),delete e._motorcycleListeners),be&&(e.removeJoint(be.id),be=null),j&&(e.removeObject(j.id),j=null),t.debug.offsetX=0,t.debug.offsetY=0}}),Tn=[Zt,fn,In,en],En=!["localhost","127.0.0.1"].includes(window.location.hostname),ge=[{name:"Showcase",examples:Tn},{name:"General",examples:un},{name:"Constraints",examples:yn},{name:"Optimizations",examples:gn},{name:"Load Tests",examples:xn},{name:"Known Issues",examples:bn}].filter(e=>!En||e.name!=="Known Issues");let An=`
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
`.trim();const Xe=()=>window.innerWidth<=768;let K={},P=null;function vn(){const e=document.getElementById("examples-list");e.innerHTML="",ge.forEach((n,o)=>{const a=document.createElement("li");a.className="section",a.textContent=n.name,e.appendChild(a),n.examples&&Array.isArray(n.examples)&&n.examples.forEach((s,i)=>{const r=s.key||`${o}-${i}`;K[r]={category:o,index:i,example:s};const l=document.createElement("li");l.className="example",l.textContent=s.name,l.setAttribute("data-example",r),e.appendChild(l)})}),document.querySelectorAll("#sidebar li.example").forEach(n=>{n.addEventListener("click",()=>{document.querySelectorAll("#sidebar li.example.selected").forEach(a=>{a.classList.remove("selected")}),n.classList.add("selected");const o=n.getAttribute("data-example");kt(o,"push"),Xe()&&de.classList.add("collapsed")})})}let L,tn=document.getElementById("example-name"),ee=document.getElementById("debug-canvas"),It=document.getElementById("code-section"),Fn=document.getElementById("general-code"),Mn=document.getElementById("init-code"),Rn=document.getElementById("tick-code"),On=document.getElementById("render-code"),ye=document.getElementById("toggle-code"),Sn=document.getElementById("fps"),Wt=document.getElementById("memory"),Ln=document.getElementById("step-time"),$t=document.querySelectorAll(".code-tab"),Dn=document.querySelectorAll(".code-panel"),nn=document.getElementById("sidebar-toggle"),de=document.getElementById("sidebar"),Xn=document.getElementById("reset-button"),Jn=document.getElementById("reset-button-mobile"),qt=document.getElementById("info-toggle"),Ut=document.getElementById("info-toggle-mobile");tn.innerHTML="Loading example...";let U=0,Bt=[],wt=[],Ct=[],Ke=1e3/60,Ve=0,Kt=0;t.init().then(()=>{L=t.makeWorld(),t.debug.enableDebugGraphics(ee,L);let e=performance.now(),n=0;const o=1/60;function a(d){let p=(d-e)/1e3;e=d,p>.25&&(p=.25),n+=p;const u=performance.now();for(;n>=o;){if(L.step(),P&&K[P]){const R=K[P].example;R&&typeof R.onTick=="function"&&R.onTick(L,o)}n-=o}if(L.interpolationAlpha=n/o,P&&K[P]){const R=K[P].example;R&&typeof R.onRender=="function"&&R.onRender(L)}const x=(performance.now()-u)*1e3;let m=Bt[U%100]??Ke,k=wt[U%100]??0,I=Ct[U%100]??0;Bt[U%100]=p*1e3||16.67,wt[U%100]=L?L.getMemoryUsage():0,Ct[U%100]=x,Ke+=(Bt[U%100]-m)/100,Ve+=(wt[U%100]-k)/100,Kt+=(Ct[U%100]-I)/100,U++;const v=Ke>0?Math.round(1e3/Ke):0;Sn.innerHTML=`<i class="fas fa-tachometer-alt"></i>Render FPS: ${v}`,Ve<1048576?Wt.innerHTML=`<i class="fas fa-memory"></i>Memory: ${(Ve/1024).toFixed(2)} KB`:Wt.innerHTML=`<i class="fas fa-memory"></i>Memory: ${(Ve/1048576).toFixed(2)} MB`,Ln.innerHTML=`<i class="fas fa-stopwatch"></i>Step Time: ${Kt.toFixed(0)} μs`,requestAnimationFrame(a)}vn(),on(!0);const s=()=>{P&&kt(P,"none")};Xn.addEventListener("click",s),Jn.addEventListener("click",s);const i=()=>{document.body.classList.toggle("info-mode");const d=document.body.classList.contains("info-mode"),p=d?"fa-th-large":"fa-info-circle",u=d?"Show Canvas":"Info";[qt,Ut].forEach(f=>{const x=f.querySelector("i"),m=f.querySelector(".button-text");x&&(x.className=`fas ${p}`),m&&(m.textContent=u),f.title=d?"Show Canvas":"Show Information"}),d||t.debug.centerCamera(5,5)};qt.addEventListener("click",i),Ut.addEventListener("click",i),requestAnimationFrame(a),Xe()&&de.classList.add("collapsed"),ee.addEventListener("wheel",d=>{d.preventDefault();const p=.05,u=d.offsetX,f=d.offsetY,x=(u-t.debug.offsetX)/t.debug.zoom,m=(f-t.debug.offsetY)/t.debug.zoom,k=-Math.sign(d.deltaY),I=Math.pow(1+p,k),v=Math.min(Math.max(t.debug.zoom*I,.1),10);t.debug.zoom=v,t.debug.offsetX=u-x*t.debug.zoom,t.debug.offsetY=f-m*t.debug.zoom},{passive:!1});let r=!1,l=0,h=0;ee.addEventListener("mousedown",d=>{d.button===2&&(r=!0,l=d.clientX,h=d.clientY)}),window.addEventListener("mousemove",d=>{if(r){const p=d.clientX-l,u=d.clientY-h;t.debug.offsetX+=p,t.debug.offsetY+=u,l=d.clientX,h=d.clientY}}),window.addEventListener("mouseup",d=>{d.button===2&&(r=!1)}),ee.addEventListener("contextmenu",d=>{d.preventDefault()});let b=0,y=!1,g=0,c=0;ee.addEventListener("touchstart",d=>{if(d.touches.length===1)g=d.touches[0].clientX,c=d.touches[0].clientY,y=!1;else if(d.touches.length===2){y=!0;const p=d.touches[0].clientX-d.touches[1].clientX,u=d.touches[0].clientY-d.touches[1].clientY;b=Math.sqrt(p*p+u*u)}},{passive:!1}),ee.addEventListener("touchmove",d=>{if(d.touches.length!==0){if(d.preventDefault(),d.touches.length===1&&!y){const p=d.touches[0].clientX,u=d.touches[0].clientY,f=p-g,x=u-c;t.debug.offsetX+=f,t.debug.offsetY+=x,g=p,c=u}else if(d.touches.length===2){const p=d.touches[0],u=d.touches[1],f=p.clientX-u.clientX,x=p.clientY-u.clientY,m=Math.sqrt(f*f+x*x);if(b>0){const k=m/b,I=Math.min(Math.max(t.debug.zoom*k,.1),10),v=(p.clientX+u.clientX)/2,R=(p.clientY+u.clientY)/2,O=ee.getBoundingClientRect(),J=v-O.left,ne=R-O.top,H=(J-t.debug.offsetX)/t.debug.zoom,G=(ne-t.debug.offsetY)/t.debug.zoom;t.debug.zoom=I,t.debug.offsetX=J-H*t.debug.zoom,t.debug.offsetY=ne-G*t.debug.zoom}b=m}}},{passive:!1}),ee.addEventListener("touchend",d=>{d.touches.length<2&&(y=!1,b=0),d.touches.length===1&&(g=d.touches[0].clientX,c=d.touches[0].clientY)},{passive:!1}),ee.addEventListener("touchcancel",d=>{y=!1,b=0},{passive:!1})});function kt(e,n="push"){if(!L||!K[e])return;if(P&&K[P]){const y=K[P].example;y&&typeof y.cleanup=="function"&&y.cleanup(L)}const o="#"+e;window.location.hash!==o&&(n==="push"?history.pushState(null,"",o):n==="replace"&&history.replaceState(null,"",o)),L.clear(),t.debug.clearLabels(),t.debug.showForceVectors=!0,t.debug.showImpulseVectors=!0,L.setHasPenetrationResolution(!0),L.setHasRestitution(!0),L.setHasFriction(!0),L.setGravity(0,0),t.debug.zoom=1,t.debug.centerCamera(5,5),t.debug.showAabbs=!0,P=e;const s=K[e].example;s&&typeof s.onInit=="function"?s.onInit(L):console.error("Example onInit method not found:",s);function i(y,g){if(!y)return`function ${g}${g==="tick"?"(dt)":"()"} {}`;let c=y.split("	").join("    ");const d=[/^\(world\)\s*=>\s*\{/,/^\(world,\s*dt\)\s*=>\s*\{/,/^function\s*\(world\)\s*\{/,/^function\s*\(world,\s*dt\)\s*\{/,/^function\s+init\s*\(world\)\s*\{/,/^function\s+tick\s*\(world,\s*dt\)\s*\{/,/^function\s+render\s*\(world\)\s*\{/];let p=!1,u=c.trim();for(const m of d)if(m.test(u)){c=u.replace(m,`function ${g}${g==="tick"?"(dt)":"()"} {`),p=!0;break}p||(c=u.replace(/^.*?=>\s*\{/,`function ${g}${g==="tick"?"(dt)":"()"} {`));let f=c.split(`
`);if(f.length<=1)return c;let x=1/0;for(let m=1;m<f.length;m++){const k=f[m];if(k.trim().length===0)continue;const I=k.search(/\S/);I!==-1&&I<x&&(x=I)}return x===1/0&&(x=0),f.map((m,k)=>k===0?m:m.substring(Math.min(m.length,x))).join(`
`)}let r=s.globalLines?.join(`
`)??"",l=s.onInitRaw||s.onInit?.toString()||"",h=s.onTickRaw||s.onTick?.toString()||"",b=s.onRenderRaw||s.onRender?.toString()||"";Fn.textContent=An.split("{{GLOBAL}}").join(r),Mn.textContent=i(l,"init"),Rn.textContent=i(h,"tick"),On.textContent=i(b,"render"),sn(),tn.textContent=s.name||"Unknown Example",document.getElementById("description").innerHTML=ln.parse(s.description||"")}function on(e=!1){let n=window.location.hash.substring(1);const o=!n;if(n||(n="sandbox"),!K[n]){console.log("Example not found directly, searching...");let s=!1;for(let i=0;i<ge.length;i++){const r=ge[i];if(r.examples&&Array.isArray(r.examples)){for(let l=0;l<r.examples.length;l++)if(r.examples[l].key===n){console.log(`Found example ${n} in category ${i}, index ${l}`),s=!0;break}}if(s)break}if(!s)if(console.warn(`Example with key '${n}' not found, defaulting to first available example`),ge.length>0&&ge[0].examples&&ge[0].examples.length>0)n=ge[0].examples[0].key||"0-0";else{console.error("No examples found");return}}const a=document.querySelector(`#sidebar li.example[data-example="${n}"]`);a&&(document.querySelectorAll("#sidebar li.example.selected").forEach(s=>{s.classList.remove("selected")}),a.classList.add("selected")),kt(n,o&&e?"replace":"none")}$t.forEach(e=>{e.addEventListener("click",()=>{$t.forEach(o=>o.classList.remove("active")),Dn.forEach(o=>o.classList.remove("active")),e.classList.add("active"),document.getElementById(`${e.dataset.panel}-panel`).classList.add("active")})});function sn(){document.querySelectorAll("pre").forEach(n=>{const o=n.textContent;n.innerHTML=hljs?.highlight(o,{language:"javascript"}).value})}ye.addEventListener("click",()=>{It.style.display==="none"?(It.style.display="block",ye.querySelector("span").textContent="Hide Code",ye.querySelector("i").classList.remove("fa-chevron-down"),ye.querySelector("i").classList.add("fa-chevron-up"),sn()):(It.style.display="none",ye.querySelector("span").textContent="Show Code",ye.querySelector("i").classList.remove("fa-chevron-up"),ye.querySelector("i").classList.add("fa-chevron-down"))});nn.addEventListener("click",()=>{de.classList.toggle("collapsed")});window.addEventListener("resize",()=>{Xe()||document.body.classList.remove("info-mode"),Xe()&&!de.classList.contains("collapsed")&&de.classList.add("collapsed")});window.addEventListener("click",e=>{Xe()&&!de.classList.contains("collapsed")&&!de.contains(e.target)&&e.target!==nn&&de.classList.add("collapsed")});const Le=document.getElementById("copy-code");Le.addEventListener("click",()=>{const n=document.querySelector(".code-panel.active").querySelector("pre").textContent;navigator.clipboard.writeText(n).then(()=>{const o=Le.querySelector("span"),a=Le.querySelector("i"),s=o.textContent;Le.classList.add("success"),o.textContent="Copied!",a.classList.remove("fa-copy"),a.classList.add("fa-check"),setTimeout(()=>{Le.classList.remove("success"),o.textContent=s,a.classList.remove("fa-check"),a.classList.add("fa-copy")},2e3)})});window.addEventListener("popstate",function(e){on(!1)});
