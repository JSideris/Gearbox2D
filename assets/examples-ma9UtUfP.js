import"./modulepreload-polyfill-B5Qt9EMX.js";import{M as on}from"./markdown-tUR2hliS.js";import{g as t}from"./world-BAe1p98x.js";class w{constructor(o){this.onInit=o.onInit,this.onInitRaw=o.onInitRaw,this.onTick=o.onTick,this.onTickRaw=o.onTickRaw,this.onCleanup=o.onCleanup,this.description=o.description,this.name=o.name,this.key=o.key,this.globalLines=o.globalLines||[]}init(o){this.onInit?.(o)}tick(o,n){this.onTick?.(o,n)}cleanup(o){this.onCleanup?.(o)}}let B=1,_e=0,oe=null,Pe=null,A=null;const $e=(e,o)=>({x:(e-t.debug.offsetX)/(t.debug.zoom*100),y:(o-t.debug.offsetY)/(t.debug.zoom*100)});let St=0,lt=null,ze=!1;const sn=(e,o)=>{if(e.button!==0)return;const n=A.getBoundingClientRect(),a=$e(e.clientX-n.left,e.clientY-n.top);St=performance.now(),lt=a,ze=!1,Xt(a,o)&&(ze=!0)},an=e=>{const o=A.getBoundingClientRect(),n=$e(e.clientX-o.left,e.clientY-o.top);Ht(n)},rn=(e,o)=>{if(e.button!==0)return;const n=performance.now()-St;!ze&&n<250&&lt&&Ft(lt,o),_t(o),ze=!1},Xt=(e,o)=>{const n=o.queryPoint(e.x,e.y);if(n.length>0){const a=n[0],s=o.getObjectById(a);if(s&&s.type!==t.bodyTypes.FIXED_OBJECT)return oe=o.makeObject(999999,{x:e.x,y:e.y,type:t.bodyTypes.FIXED_OBJECT,shape:t.shapes.CIRCLE,radius:.05,color:"transparent",maskBits:0}),Pe=o.createSpringJoint(999998,oe,s,{worldAnchor:e,frequencyHz:3,dampingRatio:1,length:0}),!0}return!1},Ht=e=>{oe&&(oe.x=e.x,oe.y=e.y)},_t=e=>{Pe&&(e.removeJoint(Pe.id),Pe=null),oe&&(e.removeObject(oe.id),oe=null)},Ft=(e,o)=>{const n=["#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff"];for(let a=0;a<3;a++)o.makeObject(B++,{x:e.x+(Math.random()-.5)*.2,y:e.y+(Math.random()-.5)*.2,shape:Math.random()>.5?t.shapes.CIRCLE:t.shapes.BOX,radius:.15,width:.3,height:.3,mass:.5,color:n[Math.floor(Math.random()*n.length)],restitution:.6})};let Jt=0,ht=null,Ye=!1;const cn=(e,o)=>{e.preventDefault();const n=A.getBoundingClientRect(),a=e.touches[0],s=$e(a.clientX-n.left,a.clientY-n.top);Jt=performance.now(),ht=s,Ye=!1,Xt(s,o)&&(Ye=!0)},dn=e=>{e.preventDefault();const o=A.getBoundingClientRect(),n=e.touches[0],a=$e(n.clientX-o.left,n.clientY-o.top);Ht(a)},ln=(e,o)=>{e.preventDefault();const n=performance.now()-Jt;!Ye&&n<250&&ht&&Ft(ht,o),_t(o),Ye=!1},hn=[new w({name:"Interactive Sandbox",key:"sandbox",description:["Welcome to **Gearbox2D**! This is an interactive playground featuring various shapes and physics properties. Click and drag objects to interact with them.","### Features","- **Point Query**: The engine detects which object is under the mouse using **BVH** and precise shape tests.","- **Mouse Joint**: Uses a `SpringJoint` to pull objects toward the mouse cursor.","- **Collision Filtering**: The mouse 'anchor' object is a sensor that doesn't collide with other objects."].join(`

`),onInitRaw:`(world) => {
            world.clear();
            gb2d.debug.showAabbs = false;
            nextId = 1;

            world.setGravity(0, 9.8);
            world.setHasRestitution(true);
            world.setHasFriction(true);

            // Ground
            world.makeObject(nextId++, {
                x: 5, y: 9.5,
                shape: gb2d.shapes.BOX,
                width: 10, height: 1.0,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#444"
            });

            // Walls
            world.makeObject(nextId++, { x: 0.2, y: 5, shape: gb2d.shapes.BOX, width: 0.4, height: 10, type: gb2d.bodyTypes.FIXED_OBJECT, color: "#444" });
            world.makeObject(nextId++, { x: 9.8, y: 5, shape: gb2d.shapes.BOX, width: 0.4, height: 10, type: gb2d.bodyTypes.FIXED_OBJECT, color: "#444" });

            // Pile of shapes
            const colors = ["#ff4444", "#44ff44", "#4444ff", "#ffff44", "#ff44ff", "#44ffff"];
            
            for (let i = 0; i < 15; i++) {
                const x = 2 + Math.random() * 6;
                const y = 2 + Math.random() * 5;
                const color = colors[i % colors.length];
                
                const commonProps = {
                    x, y,
                    mass: 1.0,
                    color,
                    linearDamping: 0.5,
                    angularDamping: 1.5
                };

                const rand = Math.random();
                if (rand < 0.45) {
                    // Circle
                    world.makeObject(nextId++, {
                        ...commonProps,
                        shape: gb2d.shapes.CIRCLE,
                        radius: 0.3 + Math.random() * 0.4,
                    });
                } else if (rand < 0.9) {
                    // Box
                    world.makeObject(nextId++, {
                        ...commonProps,
                        shape: gb2d.shapes.BOX,
                        width: 0.5 + Math.random() * 0.8,
                        height: 0.5 + Math.random() * 0.8,
                        r: Math.random() * Math.PI,
                    });
                } else {
                    // AABB (less common)
                    world.makeObject(nextId++, {
                        ...commonProps,
                        shape: gb2d.shapes.AABB,
                        width: 0.5 + Math.random() * 0.8,
                        height: 0.5 + Math.random() * 0.8,
                    });
                }
            }

            // Event listeners
            canvas = document.getElementById("debug-canvas") as HTMLCanvasElement;
            
            // Remove existing listeners if they exist (prevents leakage on restart/re-init)
            if ((world as any)._mouseDownHandler) canvas.removeEventListener('mousedown', (world as any)._mouseDownHandler);
            if ((world as any)._mouseMoveHandler) window.removeEventListener('mousemove', (world as any)._mouseMoveHandler);
            if ((world as any)._mouseUpHandler) window.removeEventListener('mouseup', (world as any)._mouseUpHandler);
            if ((world as any)._touchStartHandler) canvas.removeEventListener('touchstart', (world as any)._touchStartHandler);
            if ((world as any)._touchMoveHandler) canvas.removeEventListener('touchmove', (world as any)._touchMoveHandler);
            if ((world as any)._touchEndHandler) canvas.removeEventListener('touchend', (world as any)._touchEndHandler);

            // We need to store bound versions to remove them later
            (world as any)._mouseDownHandler = (e: MouseEvent) => onMouseDown(e, world);
            (world as any)._mouseMoveHandler = (e: MouseEvent) => onMouseMove(e);
            (world as any)._mouseUpHandler = (e: MouseEvent) => onMouseUp(e, world);
            (world as any)._touchStartHandler = (e: TouchEvent) => onTouchStart(e, world);
            (world as any)._touchMoveHandler = (e: TouchEvent) => onTouchMove(e);
            (world as any)._touchEndHandler = (e: TouchEvent) => onTouchEnd(e, world);

            canvas.addEventListener('mousedown', (world as any)._mouseDownHandler);
            window.addEventListener('mousemove', (world as any)._mouseMoveHandler);
            window.addEventListener('mouseup', (world as any)._mouseUpHandler);
            canvas.addEventListener('touchstart', (world as any)._touchStartHandler, { passive: false });
            canvas.addEventListener('touchmove', (world as any)._touchMoveHandler, { passive: false });
            canvas.addEventListener('touchend', (world as any)._touchEndHandler, { passive: false });
        }`,onInit:e=>{e.clear(),t.debug.showAabbs=!1,B=1,e.setGravity(0,9.8),e.setHasRestitution(!0),e.setHasFriction(!0),e.makeObject(B++,{x:5,y:9.5,shape:t.shapes.BOX,width:10,height:1,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}),e.makeObject(B++,{x:.2,y:5,shape:t.shapes.BOX,width:.4,height:10,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}),e.makeObject(B++,{x:9.8,y:5,shape:t.shapes.BOX,width:.4,height:10,type:t.bodyTypes.FIXED_OBJECT,color:"#444"});const o=["#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff"];for(let n=0;n<15;n++){const a=2+Math.random()*6,s=2+Math.random()*5,r=o[n%o.length],c={x:a,y:s,mass:1,color:r,linearDamping:.5,angularDamping:1.5},l=Math.random();l<.45?e.makeObject(B++,{...c,shape:t.shapes.CIRCLE,radius:.3+Math.random()*.4}):l<.9?e.makeObject(B++,{...c,shape:t.shapes.BOX,width:.5+Math.random()*.8,height:.5+Math.random()*.8,r:Math.random()*Math.PI}):e.makeObject(B++,{...c,shape:t.shapes.AABB,width:.5+Math.random()*.8,height:.5+Math.random()*.8})}A=document.getElementById("debug-canvas"),e._mouseDownHandler&&A.removeEventListener("mousedown",e._mouseDownHandler),e._mouseMoveHandler&&window.removeEventListener("mousemove",e._mouseMoveHandler),e._mouseUpHandler&&window.removeEventListener("mouseup",e._mouseUpHandler),e._touchStartHandler&&A.removeEventListener("touchstart",e._touchStartHandler),e._touchMoveHandler&&A.removeEventListener("touchmove",e._touchMoveHandler),e._touchEndHandler&&A.removeEventListener("touchend",e._touchEndHandler),e._mouseDownHandler=n=>sn(n,e),e._mouseMoveHandler=n=>an(n),e._mouseUpHandler=n=>rn(n,e),e._touchStartHandler=n=>cn(n,e),e._touchMoveHandler=n=>dn(n),e._touchEndHandler=n=>ln(n,e),A.addEventListener("mousedown",e._mouseDownHandler),window.addEventListener("mousemove",e._mouseMoveHandler),window.addEventListener("mouseup",e._mouseUpHandler),A.addEventListener("touchstart",e._touchStartHandler,{passive:!1}),A.addEventListener("touchmove",e._touchMoveHandler,{passive:!1}),A.addEventListener("touchend",e._touchEndHandler,{passive:!1})},onCleanup:e=>{A&&(A.removeEventListener("mousedown",e._mouseDownHandler),window.removeEventListener("mousemove",e._mouseMoveHandler),window.removeEventListener("mouseup",e._mouseUpHandler),A.removeEventListener("touchstart",e._touchStartHandler),A.removeEventListener("touchmove",e._touchMoveHandler),A.removeEventListener("touchend",e._touchEndHandler),delete e._mouseDownHandler,delete e._mouseMoveHandler,delete e._mouseUpHandler,delete e._touchStartHandler,delete e._touchMoveHandler,delete e._touchEndHandler)},onTickRaw:`(world, dt) => {
            gb2d.debug.clearLabels();
            gb2d.debug.addLabel({ text: "Interactive Sandbox", x: 5, y: 0.5, fontSize: "28px Arial", color: "#bbb", position: "on-top" });
            gb2d.debug.addLabel({ text: "Click or tap to add shapes, drag to move!", x: 5, y: 1.2, fontSize: "16px Arial", color: "#888", position: "on-top" });
        }`,onTick:(e,o)=>{t.debug.clearLabels(),t.debug.addLabel({text:"Interactive Sandbox",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"}),t.debug.addLabel({text:"Click or tap to add shapes, drag to move!",x:5,y:1.2,fontSize:"16px Arial",color:"#888",position:"on-top"})}}),new w({name:"Force",key:"force",description:["**Forces** are used to apply acceleration to objects which scale inversely with the object's mass. All forces applied to an object are accumulated and applied in the next world step where they are reset.","Persistent forces must be reapplied on each fixed update (every `tick`).","It's important to note that the change in velocity will be a function of the **force vector**, the object's **mass**, and the **time step**. If you need a specific instantaneous change in velocity, use an **Impulse** instead."].join(`

`),onInitRaw:`(world)=>{

            // This small circle will orbit the bigger one.
            world.makeObject(1, {
                x: 5.00,
                y: 2.50,
                vx: 5.00,
                r: Math.PI / 2 * Math.random(),
                rs: 5,
                shape: gb2d.shapes.CIRCLE,
                radius: 0.25,
                mass: 1.0,
                color: "#00f2ff",
            });

            world.makeObject(2, {
                x: 5.00,
                y: 5.00,
                shape: gb2d.shapes.CIRCLE,
                radius: 0.5,
                mass: 10.0,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#a855f7",
            });

            world.setGravity(0, 0);
        }`,onInit:e=>{e.makeObject(1,{x:5,y:2.5,vx:5,r:Math.PI/2*Math.random(),rs:5,shape:t.shapes.CIRCLE,radius:.25,mass:1,color:"#00f2ff"}),e.makeObject(2,{x:5,y:5,shape:t.shapes.CIRCLE,radius:.5,mass:10,type:t.bodyTypes.FIXED_OBJECT,color:"#a855f7"}),e.setGravity(0,0)},onTickRaw:`(world, dt)=>{
            const obj1 = world.getObjectById(1);
            const obj2 = world.getObjectById(2);

            if (obj1 && obj2) {
                // Apply a gravitational force
                const dx = obj2.x - obj1.x;
                const dy = obj2.y - obj1.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);
                
                const forceMag = 100.0 / distSq;
                obj1.applyForce(forceMag * dx / dist, forceMag * dy / dist);

                gb2d.debug.clearLabels();
                gb2d.debug.addLabel({ text: "Orbiting with Forces", x: 5, y: 1, fontSize: "24px Arial", color: "#bbb", position: "on-top" });
                gb2d.debug.addLabel({ text: \`Force Magnitude: \${forceMag.toFixed(2)}\`, x: 5, y: 1.5, fontSize: "16px Arial", color: "#888", position: "on-top" });
            }
        }`,onTick:(e,o)=>{const n=e.getObjectById(1),a=e.getObjectById(2);if(n&&a){const s=a.x-n.x,r=a.y-n.y,c=s*s+r*r,l=Math.sqrt(c),u=100/c;n.applyForce(u*s/l,u*r/l),t.debug.clearLabels(),t.debug.addLabel({text:"Orbiting with Forces",x:5,y:1,fontSize:"24px Arial",color:"#bbb",position:"on-top"}),t.debug.addLabel({text:`Force Magnitude: ${u.toFixed(2)}`,x:5,y:1.5,fontSize:"16px Arial",color:"#888",position:"on-top"})}}}),new w({name:"Impulse",key:"impulse",description:["**Impulses** are used to apply an instantaneous change in velocity. Unlike forces, impulses do not depend on the time step.","Impulses are perfect for events like jumping, explosions, or collisions where a sudden change in motion is required."].join(`

`),onInitRaw:`(world)=>{
            world.makeObject(1, {
                x: 5.00,
                y: 8.00,
                shape: gb2d.shapes.BOX,
                width: 1, height: 1,
                mass: 1.0,
                color: "#00f2ff",
            });

            world.makeObject(2, {
                x: 5.00,
                y: 9.50,
                shape: gb2d.shapes.BOX,
                width: 10, height: 1,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#444",
            });

            world.setGravity(0, 9.8);
            impulseTimer = 0;
        }`,onInit:e=>{e.makeObject(1,{x:5,y:8,shape:t.shapes.BOX,width:1,height:1,mass:1,color:"#00f2ff"}),e.makeObject(2,{x:5,y:9.5,shape:t.shapes.BOX,width:10,height:1,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}),e.setGravity(0,9.8),_e=0},onTickRaw:`(world, dt)=>{
            const obj = world.getObjectById(1);
            if (obj) {
                impulseTimer += dt;
                if (impulseTimer > 2.0) {
                    obj.applyImpulse(0, -10);
                    impulseTimer = 0;
                }

                gb2d.debug.clearLabels();
                gb2d.debug.addLabel({ text: "Instantaneous Impulses", x: 5, y: 2, fontSize: "24px Arial", color: "#bbb", position: "on-top" });
                gb2d.debug.addLabel({ text: "Jumping every 2 seconds!", x: 5, y: 2.5, fontSize: "16px Arial", color: "#888", position: "on-top" });
            }
        }`,onTick:(e,o)=>{const n=e.getObjectById(1);n&&(_e+=o,_e>2&&(n.applyImpulse(0,-10),_e=0),t.debug.clearLabels(),t.debug.addLabel({text:"Instantaneous Impulses",x:5,y:2,fontSize:"24px Arial",color:"#bbb",position:"on-top"}),t.debug.addLabel({text:"Jumping every 2 seconds!",x:5,y:2.5,fontSize:"16px Arial",color:"#888",position:"on-top"}))}}),new w({name:"Restitution (Bounciness)",key:"restitution",description:["**Restitution** determines how 'bouncy' an object is. A restitution of `0` means no bounce (inelastic), while `1` means a perfectly elastic collision.","The final bounciness of a collision is the maximum restitution of the two colliding objects."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 9.8);
            world.setHasRestitution(true);

            for (let i = 0; i < 5; i++) {
                world.makeObject(nextId++, {
                    x: 2 + i * 1.5,
                    y: 2,
                    shape: gb2d.shapes.CIRCLE,
                    radius: 0.4,
                    mass: 1.0,
                    restitution: i * 0.25,
                    color: \`hsl(\${i * 60}, 70%, 60%)\`,
                });
            }

            world.makeObject(nextId++, {
                x: 5, y: 9.5,
                shape: gb2d.shapes.BOX,
                width: 10, height: 1,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#444",
            });
        }`,onInit:e=>{e.setGravity(0,9.8),e.setHasRestitution(!0);for(let o=0;o<5;o++)e.makeObject(B++,{x:2+o*1.5,y:2,shape:t.shapes.CIRCLE,radius:.4,mass:1,restitution:o*.25,color:`hsl(${o*60}, 70%, 60%)`});e.makeObject(B++,{x:5,y:9.5,shape:t.shapes.BOX,width:10,height:1,type:t.bodyTypes.FIXED_OBJECT,color:"#444"})},onTickRaw:`(world, dt)=>{
            gb2d.debug.clearLabels();
            gb2d.debug.addLabel({ text: "Varying Restitution", x: 5, y: 1, fontSize: "24px Arial", color: "#bbb", position: "on-top" });
            for (let i = 0; i < 5; i++) {
                gb2d.debug.addLabel({ text: (i * 0.25).toFixed(2), x: 2 + i * 1.5, y: 8.5, fontSize: "14px Arial", color: "#888", position: "on-top" });
            }
        }`,onTick:(e,o)=>{t.debug.clearLabels(),t.debug.addLabel({text:"Varying Restitution",x:5,y:1,fontSize:"24px Arial",color:"#bbb",position:"on-top"});for(let n=0;n<5;n++)t.debug.addLabel({text:(n*.25).toFixed(2),x:2+n*1.5,y:8.5,fontSize:"14px Arial",color:"#888",position:"on-top"})}}),new w({name:"Friction",key:"friction",description:["**Friction** resists relative lateral motion between two surfaces in contact. A friction of `0` is perfectly slippery, while higher values provide more grip.","In Gearbox2D, friction is applied as an impulse based on the normal force and the friction coefficient."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 9.8);
            world.setHasFriction(true);

            // Inclined plane
            world.makeObject(nextId++, {
                x: 5, y: 6,
                width: 8, height: 0.4,
                r: 0.3,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#444",
                friction: 0.5
            });

            // Boxes with different friction
            for (let i = 0; i < 3; i++) {
                world.makeObject(nextId++, {
                    x: 2 + i * 1.0,
                    y: 3 - i * 0.5,
                    width: 0.6, height: 0.6,
                    shape: gb2d.shapes.BOX,
                    mass: 1.0,
                    friction: i * 0.4,
                    color: \`hsl(\${i * 120}, 70%, 60%)\`,
                    r: 0.3
                });
            }
        }`,onInit:e=>{e.setGravity(0,9.8),e.setHasFriction(!0),e.makeObject(B++,{x:5,y:6,width:8,height:.4,r:.3,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,color:"#444",friction:.5});for(let o=0;o<3;o++)e.makeObject(B++,{x:2+o*1,y:3-o*.5,width:.6,height:.6,shape:t.shapes.BOX,mass:1,friction:o*.4,color:`hsl(${o*120}, 70%, 60%)`,r:.3})},onTickRaw:`(world, dt)=>{
            gb2d.debug.clearLabels();
            gb2d.debug.addLabel({ text: "Friction on Inclined Plane", x: 5, y: 1, fontSize: "24px Arial", color: "#bbb", position: "on-top" });
        }`,onTick:(e,o)=>{t.debug.clearLabels(),t.debug.addLabel({text:"Friction on Inclined Plane",x:5,y:1,fontSize:"24px Arial",color:"#bbb",position:"on-top"})}}),new w({name:"Damping (Air Resistance)",key:"damping",description:["**Damping** simulates air resistance or fluid drag by gradually reducing an object's velocity over time.","- **Linear Damping**: Reduces linear velocity.","- **Angular Damping**: Reduces rotational velocity."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 0);

            for (let i = 0; i < 5; i++) {
                world.makeObject(nextId++, {
                    x: 2 + i * 1.5,
                    y: 5,
                    vx: 10,
                    shape: gb2d.shapes.CIRCLE,
                    radius: 0.4,
                    mass: 1.0,
                    linearDamping: i * 0.5,
                    color: \`hsl(\${i * 60}, 70%, 60%)\`,
                });
            }
        }`,onInit:e=>{e.setGravity(0,0);for(let o=0;o<5;o++)e.makeObject(B++,{x:2+o*1.5,y:5,vx:10,shape:t.shapes.CIRCLE,radius:.4,mass:1,linearDamping:o*.5,color:`hsl(${o*60}, 70%, 60%)`})},onTickRaw:`(world, dt)=>{
            gb2d.debug.clearLabels();
            gb2d.debug.addLabel({ text: "Linear Damping", x: 5, y: 2, fontSize: "24px Arial", color: "#bbb", position: "on-top" });
            for (let i = 0; i < 5; i++) {
                gb2d.debug.addLabel({ text: (i * 0.5).toFixed(1), x: 2 + i * 1.5, y: 6, fontSize: "14px Arial", color: "#888", position: "on-top" });
            }

            // Reset positions if they go off screen
            world.iterateObjects(obj => {
                if (obj.x > 10) obj.x = 0;
            });
        }`,onTick:(e,o)=>{t.debug.clearLabels(),t.debug.addLabel({text:"Linear Damping",x:5,y:2,fontSize:"24px Arial",color:"#bbb",position:"on-top"});for(let n=0;n<5;n++)t.debug.addLabel({text:(n*.5).toFixed(1),x:2+n*1.5,y:6,fontSize:"14px Arial",color:"#888",position:"on-top"});e.iterateObjects(n=>{n.x>10&&(n.x=0)})}}),new w({name:"Collision Filtering",key:"filtering",description:["Collision filtering allows you to control which objects collide with each other using **Category Bits** and **Mask Bits**.","An object will collide with another if `(objA.categoryBits & objB.maskBits) !== 0` AND `(objB.categoryBits & objA.maskBits) !== 0`."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 9.8);
            
            const CAT_RED = 0x0001;
            const CAT_BLUE = 0x0002;
            const CAT_GROUND = 0x0004;

            // Red objects only collide with red and ground
            for (let i = 0; i < 5; i++) {
                world.makeObject(nextId++, {
                    x: 3 + Math.random() * 2,
                    y: 2 + Math.random() * 2,
                    shape: gb2d.shapes.CIRCLE,
                    radius: 0.3,
                    categoryBits: CAT_RED,
                    maskBits: CAT_RED | CAT_GROUND,
                    color: "#ff4444"
                });
            }

            // Blue objects only collide with blue and ground
            for (let i = 0; i < 5; i++) {
                world.makeObject(nextId++, {
                    x: 5 + Math.random() * 2,
                    y: 2 + Math.random() * 2,
                    shape: gb2d.shapes.BOX,
                    width: 0.6, height: 0.6,
                    categoryBits: CAT_BLUE,
                    maskBits: CAT_BLUE | CAT_GROUND,
                    color: "#4444ff"
                });
            }

            // Ground collides with everything
            world.makeObject(nextId++, {
                x: 5, y: 9.5,
                shape: gb2d.shapes.BOX,
                width: 10, height: 1,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                categoryBits: CAT_GROUND,
                maskBits: 0xFFFF,
                color: "#444"
            });
        }`,onInit:e=>{e.setGravity(0,9.8);const o=1,n=2,a=4;for(let s=0;s<5;s++)e.makeObject(B++,{x:3+Math.random()*2,y:2+Math.random()*2,shape:t.shapes.CIRCLE,radius:.3,categoryBits:o,maskBits:o|a,color:"#ff4444"});for(let s=0;s<5;s++)e.makeObject(B++,{x:5+Math.random()*2,y:2+Math.random()*2,shape:t.shapes.BOX,width:.6,height:.6,categoryBits:n,maskBits:n|a,color:"#4444ff"});e.makeObject(B++,{x:5,y:9.5,shape:t.shapes.BOX,width:10,height:1,type:t.bodyTypes.FIXED_OBJECT,categoryBits:a,maskBits:65535,color:"#444"})},onTickRaw:`(world, dt)=>{
            gb2d.debug.clearLabels();
            gb2d.debug.addLabel({ text: "Red and Blue never touch!", x: 5, y: 1, fontSize: "24px Arial", color: "#bbb", position: "on-top" });
        }`,onTick:(e,o)=>{t.debug.clearLabels(),t.debug.addLabel({text:"Red and Blue never touch!",x:5,y:1,fontSize:"24px Arial",color:"#bbb",position:"on-top"})}}),new w({name:"Kinematic vs Fixed vs Dynamic",key:"body-types",description:["Gearbox2D supports three body types:","- **Fixed**: Zero mass, infinite inertia. Does not move. (e.g., Ground)","- **Kinematic**: Moves according to velocity but is not affected by forces or collisions. (e.g., Moving platforms)","- **Dynamic**: Fully simulated physics object."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 9.8);

            // Kinematic platform
            world.makeObject(1, {
                x: 5, y: 7,
                width: 4, height: 0.5,
                shape: gb2d.shapes.BOX,
                type: gb2d.bodyTypes.KINEMATIC_OBJECT,
                color: "#ffff44",
                vx: 2
            });

            // Dynamic objects
            for (let i = 0; i < 10; i++) {
                world.makeObject(nextId++, {
                    x: 3 + Math.random() * 4,
                    y: 2,
                    shape: gb2d.shapes.CIRCLE,
                    radius: 0.3,
                    mass: 1.0,
                    color: "#00f2ff"
                });
            }

            // Ground
            world.makeObject(nextId++, {
                x: 5, y: 9.5,
                shape: gb2d.shapes.BOX,
                width: 10, height: 1,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#444"
            });
        }`,onInit:e=>{e.setGravity(0,9.8),e.makeObject(1,{x:5,y:7,width:4,height:.5,shape:t.shapes.BOX,type:t.bodyTypes.KINEMATIC_OBJECT,color:"#ffff44",vx:2});for(let o=0;o<10;o++)e.makeObject(B++,{x:3+Math.random()*4,y:2,shape:t.shapes.CIRCLE,radius:.3,mass:1,color:"#00f2ff"});e.makeObject(B++,{x:5,y:9.5,shape:t.shapes.BOX,width:10,height:1,type:t.bodyTypes.FIXED_OBJECT,color:"#444"})},onTickRaw:`(world, dt)=>{
            const platform = world.getObjectById(1);
            if (platform) {
                if (platform.x > 8) platform.vx = -2;
                if (platform.x < 2) platform.vx = 2;
            }

            gb2d.debug.clearLabels();
            gb2d.debug.addLabel({ text: "Kinematic Platform", x: 5, y: 1, fontSize: "24px Arial", color: "#bbb", position: "on-top" });
        }`,onTick:(e,o)=>{const n=e.getObjectById(1);n&&(n.x>8&&(n.vx=-2),n.x<2&&(n.vx=2)),t.debug.clearLabels(),t.debug.addLabel({text:"Kinematic Platform",x:5,y:1,fontSize:"24px Arial",color:"#bbb",position:"on-top"})}}),new w({name:"Performance: 500+ Objects",key:"perf-many",description:["Gearbox2D is optimized for high object counts using a **Dynamic BVH** (Bounding Volume Hierarchy) for broad-phase collisions.","This allows the engine to skip checks between objects that are far apart, maintaining 60 FPS even with hundreds of active bodies."].join(`

`),onInitRaw:`(world)=>{
            world.setGravity(0, 9.8);
            world.setHasRestitution(true);

            // Funnel
            world.makeObject(nextId++, { x: 2, y: 5, width: 5, height: 0.2, r: 0.8, shape: gb2d.shapes.BOX, type: gb2d.bodyTypes.FIXED_OBJECT, color: "#444" });
            world.makeObject(nextId++, { x: 8, y: 5, width: 5, height: 0.2, r: -0.8, shape: gb2d.shapes.BOX, type: gb2d.bodyTypes.FIXED_OBJECT, color: "#444" });

            // Ground
            world.makeObject(nextId++, { x: 5, y: 9.5, width: 10, height: 1, shape: gb2d.shapes.BOX, type: gb2d.bodyTypes.FIXED_OBJECT, color: "#444" });
        }`,onInit:e=>{e.setGravity(0,9.8),e.setHasRestitution(!0),e.makeObject(B++,{x:2,y:5,width:5,height:.2,r:.8,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}),e.makeObject(B++,{x:8,y:5,width:5,height:.2,r:-.8,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,color:"#444"}),e.makeObject(B++,{x:5,y:9.5,width:10,height:1,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,color:"#444"})},onTickRaw:`(world, dt)=>{
            if (world.objectCount < 500 && Math.random() > 0.5) {
                world.makeObject(nextId++, {
                    x: 4.5 + Math.random(),
                    y: 0,
                    shape: gb2d.shapes.CIRCLE,
                    radius: 0.1,
                    mass: 1.0,
                    restitution: 0.5,
                    color: \`hsl(\${Math.random() * 360}, 70%, 60%)\`
                });
            }

            gb2d.debug.clearLabels();
            gb2d.debug.addLabel({ text: \`Objects: \${world.objectCount}\`, x: 5, y: 1, fontSize: "24px Arial", color: "#bbb", position: "on-top" });

            // Remove objects that fall off
            let toRemove = [];
            world.iterateObjects(obj => {
                if (obj.y > 10 && obj.type !== gb2d.bodyTypes.FIXED_OBJECT) toRemove.push(obj.id);
            });
            toRemove.forEach(id => world.removeObject(id));
        }`,onTick:(e,o)=>{e.objectCount<500&&Math.random()>.5&&e.makeObject(B++,{x:4.5+Math.random(),y:0,shape:t.shapes.CIRCLE,radius:.1,mass:1,restitution:.5,color:`hsl(${Math.random()*360}, 70%, 60%)`}),t.debug.clearLabels(),t.debug.addLabel({text:`Objects: ${e.objectCount}`,x:5,y:1,fontSize:"24px Arial",color:"#bbb",position:"on-top"});let n=[];e.iterateObjects(a=>{a.y>10&&a.type!==t.bodyTypes.FIXED_OBJECT&&n.push(a.id)}),n.forEach(a=>e.removeObject(a))}}),new w({name:"Advanced: Object Recycling",key:"recycling",description:["In high-performance simulations, creating and destroying objects frequently can cause GC (Garbage Collection) pressure.","This example demonstrates a pattern for **object recycling**, where off-screen objects are repositioned and reused instead of being deleted."].join(`

`),onInitRaw:`(world) => {
            world.setGravity(0, 9.8);
            (world as any).toRemove = new Set();
            
            // Elevator platform
            (world as any).elevator = world.makeObject(nextId++, {
                x: 5, y: 8, width: 3, height: 0.4,
                shape: gb2d.shapes.BOX, type: gb2d.bodyTypes.KINEMATIC_OBJECT,
                color: "#ffff44", vy: -1
            });

            // Pre-spawn some objects
            const colors = ["#ff4444", "#44ff44", "#4444ff", "#ffff44", "#ff44ff", "#44ffff"];
            for (let i = 0; i < 30; i++) {
                world.makeObject(nextId++, {
                    x: 3 + Math.random() * 4, y: Math.random() * 5,
                    shape: gb2d.shapes.CIRCLE, radius: 0.2, mass: 1.0,
                    color: colors[i % colors.length]
                });
            }
        }`,onInit:e=>{e.setGravity(0,9.8),e.toRemove=new Set,e.elevator=e.makeObject(B++,{x:5,y:8,width:3,height:.4,shape:t.shapes.BOX,type:t.bodyTypes.KINEMATIC_OBJECT,color:"#ffff44",vy:-1});const o=["#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff"];for(let n=0;n<30;n++)e.makeObject(B++,{x:3+Math.random()*4,y:Math.random()*5,shape:t.shapes.CIRCLE,radius:.2,mass:1,color:o[n%o.length]})},onTickRaw:`(world, dt) => {
            const elevator = (world as any).elevator;
            if (elevator) {
                if (elevator.y < 3) elevator.vy = 1;
                if (elevator.y > 8) elevator.vy = -1;
            }

            // Spawn one every now and then
            if (world.objectCount < 60 && Math.random() > 0.9) {
                const colors = ["#ff4444", "#44ff44", "#4444ff", "#ffff44", "#ff44ff", "#44ffff"];
                const isCircle = Math.random() > 0.5;
                const x = 3 + Math.random() * 4;
                
                world.makeObject(nextId++, {
                    x, y: 0.5,
                    shape: isCircle ? gb2d.shapes.CIRCLE : gb2d.shapes.BOX,
                    radius: 0.25,
                    width: 0.5, height: 0.5,
                    mass: 0.5 + Math.random() * 1.0,
                    type: gb2d.bodyTypes.RIGID_BODY,
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
                    if (obj.type === gb2d.bodyTypes.RIGID_BODY) {
                        outOfBounds.push(obj.id);
                    }
                }
            });
            for (const id of outOfBounds) world.removeObject(id);
        }`,onTick:(e,o)=>{const n=e.elevator;if(n&&(n.y<3&&(n.vy=1),n.y>8&&(n.vy=-1)),e.objectCount<60&&Math.random()>.9){const r=["#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff"],c=Math.random()>.5,l=3+Math.random()*4;e.makeObject(B++,{x:l,y:.5,shape:c?t.shapes.CIRCLE:t.shapes.BOX,radius:.25,width:.5,height:.5,mass:.5+Math.random()*1,type:t.bodyTypes.RIGID_BODY,color:r[Math.floor(Math.random()*r.length)],restitution:.3})}const a=e.toRemove;if(a&&a.size>0){for(const r of a)e.getObjectById(r)&&e.removeObject(r);a.clear()}let s=[];e.iterateObjects(r=>{(r.y>11||r.y<-5||r.x>11||r.x<-1)&&r.type===t.bodyTypes.RIGID_BODY&&s.push(r.id)});for(const r of s)e.removeObject(r)},onCleanup:e=>{e.onCollisionStart=void 0,delete e.elevator,delete e.recyclerId,delete e.toRemove}})];let b=1,re=[],ge=null,$=null,Ie=null,Z=null,W=null,ve=0,ke=0;const pn=[new w({name:"Simple Hinge",key:"simple-hinge",description:["A single `BOX` object attached to a `FIXED_OBJECT` by a **Hinge Joint** constraint.","The hinge allows rotation around a single point while preventing all linear relative motion. In this case, it creates a simple gravity-driven pendulum."].join(`

`),onInitRaw:`(world) => {
            nextId = 1;
            const anchor = world.makeObject(nextId++, {
                x: 5,
                y: 3,
                shape: gb2d.shapes.BOX,
                width: 1,
                height: 1,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#ff4444"
            });

            const pendulum = world.makeObject(nextId++, {
                x: 8,
                y: 3,
                shape: gb2d.shapes.BOX,
                width: 4,
                height: 0.5,
                mass: 0.1,
                color: "#44ff44"
            });

            world.createHingeJoint(nextId++, anchor, pendulum, {
                worldAnchor: { x: 5, y: 3 }
            });

            world.setGravity(0, 9.81);
        }`,onInit:e=>{b=1;const o=e.makeObject(b++,{x:5,y:3,shape:t.shapes.BOX,width:1,height:1,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444"}),n=e.makeObject(b++,{x:8,y:3,shape:t.shapes.BOX,width:4,height:.5,mass:.1,color:"#44ff44"});e.createHingeJoint(b++,o,n,{worldAnchor:{x:5,y:3}}),e.setGravity(0,9.81)}}),new w({name:"Breakable Joint",key:"breakable-joint",description:["This demo showcases **Joint Reaction Forces** and dynamic joint removal.","1. A ball is suspended by a **Hinge Joint**. Its mass increases until the reaction force exceeds a threshold, snapping the joint.","2. The ball falls onto a bridge made of `SpringJoint` segments, which also have breaking thresholds.","You can visualize the stress on the joints by enabling **Force Vectors** in the debug settings."].join(`

`),onInitRaw:`(world) => {
            nextId = 1;
            gb2d.debug.showAabbs = false;
            bridgeJoints = [];
            breakableJoint = null;
            massObject = null;

            // 1. Suspension System (higher up and smaller)
            const anchor = world.makeObject(nextId++, {
                x: 5,
                y: 1,
                shape: gb2d.shapes.CIRCLE,
                radius: 0.2,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#ff4444"
            });

            massObject = world.makeObject(nextId++, {
                x: 5,
                y: 2.5,
                shape: gb2d.shapes.CIRCLE,
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
                shape: gb2d.shapes.BOX,
                width: segmentWidth,
                height: 0.5,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            });

            const bridgeAnchorRight = world.makeObject(nextId++, {
                x: endX + segmentWidth / 2,
                y: bridgeY,
                shape: gb2d.shapes.BOX,
                width: segmentWidth,
                height: 0.5,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            });

            let prevBody = bridgeAnchorLeft;
            for (let i = 0; i < segments; i++) {
                const segmentBody = world.makeObject(nextId++, {
                    x: startX + i * segmentWidth + segmentWidth / 2,
                    y: bridgeY,
                    shape: gb2d.shapes.BOX,
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
            gb2d.debug.showForceVectors = true;
            
            // Apply a side force to make it swing
            massObject.applyImpulse(0.2, 0);
        }`,onInit:e=>{b=1,t.debug.showAabbs=!1,re=[],ge=null,$=null;const o=e.makeObject(b++,{x:5,y:1,shape:t.shapes.CIRCLE,radius:.2,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444"});$=e.makeObject(b++,{x:5,y:2.5,shape:t.shapes.CIRCLE,radius:.4,mass:.05,color:"#888888"}),ge=e.createHingeJoint(b++,o,$,{worldAnchor:{x:5,y:1}});const n=2,a=8,s=6,r=12,c=(a-n)/r,l=.2,u=e.makeObject(b++,{x:n-c/2,y:s,shape:t.shapes.BOX,width:c,height:.5,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}),h=e.makeObject(b++,{x:a+c/2,y:s,shape:t.shapes.BOX,width:c,height:.5,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"});let i=u;for(let d=0;d<r;d++){const y=e.makeObject(b++,{x:n+d*c+c/2,y:s,shape:t.shapes.BOX,width:c*.9,height:l,mass:.2,color:"#cd853f",categoryBits:4,maskBits:-5}),p=e.createSpringJoint(b++,i,y,{worldAnchor:{x:n+d*c,y:s},frequencyHz:4,dampingRatio:1});re.push(p),i=y}const g=e.createSpringJoint(b++,i,h,{worldAnchor:{x:a,y:s},frequencyHz:4,dampingRatio:1});re.push(g),e.setGravity(0,10),t.debug.showForceVectors=!0,$.applyImpulse(.2,0)},onTickRaw:`(world, dt) => {
            // 1. Increase mass
            if (massObject) {
                massObject.mass += dt * 3.0; // Increase mass over time
                
                gb2d.debug.removeObjectLabels(massObject.id);
                gb2d.debug.addLabel({
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
        }`,onTick:(e,o)=>{if($&&($.mass+=o*3,t.debug.removeObjectLabels($.id),t.debug.addLabel({text:`Mass: ${$.mass.toFixed(2)}kg`,objectId:$.id,position:"above",color:"#fff"})),ge){const n=ge.reactionForce;Math.sqrt(n.x*n.x+n.y*n.y)>150&&(e.removeJoint(ge.id),ge=null)}if(re.length>0)for(let n=re.length-1;n>=0;n--){const a=re[n],s=a.reactionForce;Math.sqrt(s.x*s.x+s.y*s.y)>600&&(e.removeJoint(a.id),re.splice(n,1))}}}),new w({name:"Gear Train",key:"gear-train",description:["A sequence of gears connected using the `GearJoint` constraint.","Each gear's motion is constrained by the previous one based on a **gear ratio** (calculated here by the relative radii).","A drive gear at the start receives a constant low torque, which is then propagated through the entire train with mechanical advantage."].join(`

`),onInitRaw:`(world) => {
            nextId = 1;
            const startX = 2;
            const y = 5;
            const numGears = 5;
            const spacing = 1.5;
            
            const staticBody = world.makeObject(nextId++, {
                x: 5, y: 5,
                shape: gb2d.shapes.AABB,
                width: 6.2,
                height: 0.2,
                type: gb2d.bodyTypes.FIXED_OBJECT,
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
                    shape: gb2d.shapes.CIRCLE,
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
        }`,onInit:e=>{b=1;const o=2,n=5,a=5,s=1.5,r=e.makeObject(b++,{x:5,y:5,shape:t.shapes.AABB,width:6.2,height:.2,type:t.bodyTypes.FIXED_OBJECT,color:"#888",maskBits:0});let c=null;Ie=null;for(let l=0;l<a;l++){const u=l%2===0?1:.5,h=e.makeObject(b++,{x:o+l*s,y:n,shape:t.shapes.CIRCLE,radius:u,mass:u,color:`hsl(${l*60}, 70%, 60%)`}),i=e.createHingeJoint(b++,r,h,{worldAnchor:{x:o+l*s,y:n}});if(l===0)Ie=h;else{const d=((l-1)%2===0?1:.5)/u;e.createGearJoint(b++,c,i,d)}c=i}},onTickRaw:`(world, dt) => {
            if (engineHub) {
                // Apply a persistent but relatively low angular impulse to the drive gear
                if(Math.abs(engineHub.rs) < 0.9) {
                    engineHub.applyAngularImpulse(0.01);
                }
            }
        }`,onTick:(e,o)=>{Ie&&Math.abs(Ie.rs)<.9&&Ie.applyAngularImpulse(.01)}}),new w({name:"Distance Ropes",key:"distance-ropes",description:["Demonstrates the `DistanceJoint`, which maintains a fixed distance between two points on two different bodies.","A rotating drum has multiple triple-link chains hanging from it. Each link is connected by a `DistanceJoint` with a specified length, simulating a non-stretchy rope or chain."].join(`

`),onInitRaw:`(world) => {
            gb2d.debug.showAabbs = false;
            nextId = 1;
            const cx = 5;
            const cy = 5;
            const drumRadius = 4;

            // The Drum Hub (fixed rotation center)
            const hub = world.makeObject(nextId++, {
                x: cx,
                y: cy,
                shape: gb2d.shapes.CIRCLE,
                radius: 0.5,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#ff4444"
            });

            // The rotating drum (structure only)
            drum = world.makeObject(nextId++, {
                x: cx,
                y: cy,
                shape: gb2d.shapes.CIRCLE,
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
                    shape: i % 2 === 0 ? gb2d.shapes.BOX : gb2d.shapes.CIRCLE,
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
                    shape: (i + 1) % 2 === 0 ? gb2d.shapes.BOX : gb2d.shapes.CIRCLE,
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
                    shape: (i + 2) % 2 === 0 ? gb2d.shapes.BOX : gb2d.shapes.CIRCLE,
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
        }`,onInit:e=>{t.debug.showAabbs=!1,b=1;const o=5,n=5,a=4,s=e.makeObject(b++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:.5,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444"});Z=e.makeObject(b++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:a,mass:100,color:"rgba(255, 255, 255, 0.05)",maskBits:0,angularDamping:.5}),e.createHingeJoint(b++,s,Z,{worldAnchor:{x:o,y:n}});const r=8,c=3.8,l=.8,u=()=>({x:(Math.random()-.5)*.3,y:(Math.random()-.5)*.3});for(let h=0;h<r;h++){const i=h/r*Math.PI*2,g=o+Math.cos(i)*c,d=n+Math.sin(i)*c,y=g-Math.cos(i)*.5,p=d-Math.sin(i)*.5,m=e.makeObject(b++,{x:y,y:p,shape:h%2===0?t.shapes.BOX:t.shapes.CIRCLE,width:.5,height:.5,radius:.25,mass:.5,color:`hsl(${h*360/r}, 70%, 60%)`}),I=Z.worldToLocal({x:g,y:d});e.createDistanceJoint(b++,Z,m,{anchorA:I,anchorB:u(),length:l});const v=y-Math.cos(i)*l,k=p-Math.sin(i)*l,T=e.makeObject(b++,{x:v,y:k,shape:(h+1)%2===0?t.shapes.BOX:t.shapes.CIRCLE,width:.5,height:.5,radius:.25,mass:.5,color:`hsl(${h*360/r}, 70%, 50%)`});e.createDistanceJoint(b++,m,T,{anchorA:u(),anchorB:u(),length:l});const C=v-Math.cos(i)*l,j=k-Math.sin(i)*l,F=e.makeObject(b++,{x:C,y:j,shape:(h+2)%2===0?t.shapes.BOX:t.shapes.CIRCLE,width:.5,height:.5,radius:.25,mass:.5,color:`hsl(${h*360/r}, 70%, 40%)`});e.createDistanceJoint(b++,T,F,{anchorA:u(),anchorB:u(),length:l})}e.setGravity(0,9.81),Z.rs=.2},onTickRaw:`(world, dt) => {
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
        }`,onTick:(e,o)=>{if(Z){const n=Date.now()/1e3,a=n%12;let s=0,r=2;a<4?(s=1.2,r=4):a<6?(s=0,r=1):a<10?(s=Math.sin(n*4)*2,r=8):s=0;const c=s-Z.rs;Math.abs(c)>.05&&Z.applyAngularImpulse(c*r)}}}),new w({name:"Spring Belt",key:"spring-belt",description:["A chain of shapes connected by `SpringJoint` constraints, forming a belt around a rotating high-friction pulley.","The `SpringJoint` acts like a dampened harmonic oscillator, pulling objects together with a force proportional to their distance and frequency. The belt stretches and contracts as it interacts with the central rotor."].join(`

`),onInitRaw:`(world) => {
            gb2d.debug.showAabbs = false;
            nextId = 1;
            const cx = 5;
            const cy = 3;
            const innerRadius = 2.5;
            const outerRadius = 3.5;

            // Hub (fixed center)
            const hub = world.makeObject(nextId++, {
                x: cx,
                y: cy,
                shape: gb2d.shapes.CIRCLE,
                radius: 0.1,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#666666",
                maskBits: 0
            });

            // Central rotating body (Pulley)
            rotator = world.makeObject(nextId++, {
                x: cx,
                y: cy,
                rs: 2.5,
                shape: gb2d.shapes.CIRCLE,
                radius: innerRadius,
                type: gb2d.bodyTypes.RIGID_BODY,
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
                    shape: i % 2 === 0 ? gb2d.shapes.BOX : gb2d.shapes.CIRCLE,
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
        }`,onInit:e=>{t.debug.showAabbs=!1,b=1;const o=5,n=3,a=2.5,s=3.5,r=e.makeObject(b++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#666666",maskBits:0});W=e.makeObject(b++,{x:o,y:n,rs:2.5,shape:t.shapes.CIRCLE,radius:a,type:t.bodyTypes.RIGID_BODY,mass:10,color:"#888888",sFriction:1,kFriction:1,angularDamping:.1}),e.createHingeJoint(b++,r,W,{worldAnchor:{x:o,y:n}});const c=16,l=[];for(let u=0;u<c;u++){const h=u/c*Math.PI*2,i=o+Math.cos(h)*s,g=n+Math.sin(h)*s,d=e.makeObject(b++,{x:i,y:g,shape:u%2===0?t.shapes.BOX:t.shapes.CIRCLE,width:.6,height:.6,radius:.3,mass:1.5,color:`hsl(${u*360/c}, 70%, 60%)`,sFriction:.999,kFriction:.99});l.push(d)}for(let u=0;u<c;u++){const h=l[u],i=l[(u+1)%c],g=i.x-h.x,d=i.y-h.y,y=Math.sqrt(g*g+d*d);e.createSpringJoint(b++,h,i,{length:y*1.1,frequencyHz:5,dampingRatio:.2})}e.setGravity(0,9.81)},onTickRaw:`(world, dt) => {
            if (rotator) {
                // Apply a persistent angular impulse until we reach target speed
                if(Math.abs(rotator.rs) < 2.5) {
                    rotator.applyAngularImpulse(1.0);
                }
            }
        }`,onTick:(e,o)=>{W&&Math.abs(W.rs)<2.5&&W.applyAngularImpulse(1)}}),new w({name:"Soft Body Ball",key:"soft-body",description:["A collection of `CIRCLE` objects connected by a network of `SpringJoint` constraints to form a squishy, deformable ball.","The ball features a central core (axel) connected to an outer ring of nodes. This setup simulates **Soft Body Dynamics** using a mass-spring system.","Persistent random impulses are applied to the core to keep the ball moving and demonstrate its elasticity."].join(`

`),onInitRaw:`(world) => {
            gb2d.debug.showAabbs = false;
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
                shape: gb2d.shapes.CIRCLE,
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
                    shape: gb2d.shapes.CIRCLE,
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
                shape: gb2d.shapes.BOX,
                width: 15,
                height: 2,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa",
                sFriction: 0.9,
                kFriction: 0.9
            });

            // Barriers to keep the ball from rolling off - taller and thicker
            world.makeObject(nextId++, {
                x: -3.5,
                y: 4.25,
                shape: gb2d.shapes.BOX,
                width: 2.0,
                height: 10,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            });
            world.makeObject(nextId++, {
                x: 13.5,
                y: 4.25,
                shape: gb2d.shapes.BOX,
                width: 2.0,
                height: 10,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#aaaaaa"
            });

            world.setGravity(0, 9.81);
        }`,onInit:e=>{t.debug.showAabbs=!1,b=1;const o=5,n=3,a=2,s=12,r=[],c=.2,l=e.makeObject(b++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:c,mass:2,color:"#ff8888",sFriction:.9,kFriction:.9});W=l,ve=0,ke=-30;for(let u=0;u<s;u++){const h=u/s*Math.PI*2,i=o+Math.cos(h)*a,g=n+Math.sin(h)*a,d=e.makeObject(b++,{x:i,y:g,shape:t.shapes.CIRCLE,radius:.2,mass:.5,color:"#8888ff",sFriction:.9,kFriction:.9});r.push(d),e.createSpringJoint(b++,l,d,{anchorA:{x:Math.cos(h)*c,y:Math.sin(h)*c},length:a-c,frequencyHz:4,dampingRatio:.5}),u>0&&e.createSpringJoint(b++,r[u-1],d,{length:2*a*Math.sin(Math.PI/s),frequencyHz:4,dampingRatio:.5})}e.createSpringJoint(b++,r[s-1],r[0],{length:2*a*Math.sin(Math.PI/s),frequencyHz:4,dampingRatio:.5}),e.makeObject(b++,{x:5,y:10,shape:t.shapes.BOX,width:15,height:2,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa",sFriction:.9,kFriction:.9}),e.makeObject(b++,{x:-3.5,y:4.25,shape:t.shapes.BOX,width:2,height:10,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}),e.makeObject(b++,{x:13.5,y:4.25,shape:t.shapes.BOX,width:2,height:10,type:t.bodyTypes.FIXED_OBJECT,color:"#aaaaaa"}),e.setGravity(0,9.81)},onTickRaw:`(world, dt) => {
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
        }`,onTick:(e,o)=>{W&&(ke<=0&&(Math.random()<.02?(ve=(Math.random()-.5)*3,ke=40+Math.random()*80):ve=0),ke>0&&(W.applyAngularImpulse(ve),W.applyImpulse(ve*.1,0),ke--))}})];let st=0,Oe=1;const mn=[new w({name:"Sleep and Islands",key:"sleep-and-islands",description:["**Sleep** optimization in **Gearbox2D** uses a movement-based heuristic computed during the kinematics step.","Instead of rebuilding a complex global island data structure each tick, each object tracks its own local contacts. When an object wakes up (due to a force or collision), it automatically wakes its neighbors.","This provides the performance benefits of **Islands** with significantly lower overhead."].join(`

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
                shape: gb2d.shapes.AABB,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                mass: 2, 
            });
        }`,onInit:e=>{e.setGravity(0,10),st=3,Oe=0,e.makeObject(Oe++,{x:5,y:8.5,width:20,height:1,vx:0,vy:0,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,mass:2})},onTickRaw:`(world, dt)=>{
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
                        shape: gb2d.shapes.BOX,
                        type: gb2d.bodyTypes.RIGID_BODY,
                        mass: 0.2, 
                        sFriction: 10,
                        kFriction: 10,
                    });
                }
            }
        }`,onTick:(e,o)=>{st+=o*2,Math.floor(st/3)>Oe&&Oe<10&&e.makeObject(Oe++,{x:5,y:0,r:(Math.random()-.5)*.1,width:6,height:.5,vx:0,vy:0,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,mass:.2,sFriction:10,kFriction:10})}}),new w({name:"Shrink Wrap",key:"shrink-wrap",description:["Objects that are put to **Sleep** have their **AABBs** 'shrink-wrapped' to their exact shape bounds.","This provides a slight performance boost during broad-phase collision detection by reducing false positives in the BVH tree for stationary objects."].join(`

`),globalLines:[],onInitRaw:`(world)=>{

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
        }`,onInit:e=>{e.makeObject(1,{x:10,y:10,radius:1,vx:-5,vy:-5,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,mass:.2,restitution:0}),e.makeObject(2,{x:0,y:0,radius:1,vx:5,vy:5,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,mass:.2,restitution:0})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}})],gn=[new w({name:"Circles",key:"particles",description:["A **Load Test** featuring 2,000 `CIRCLE` objects with full collision resolution.","This demo helps visualize the performance of the **BVH (Bounding Volume Hierarchy)** and the narrow-phase collision solver.","**Note**: In many environments, the primary bottleneck will be the Canvas 2D rendering rather than the physics simulation."].join(`

`),onInitRaw:`(world)=>{

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
                    rs: (Math.random() - 0.5) * 20.00,
                    shape: gb2d.shapes.CIRCLE,
                    type: gb2d.bodyTypes.RIGID_BODY,
                    radius: .05,
                    mass: 0.5,
                    linearDamping: 0.0,
                    angularDamping: 0.5,
                    restitution: 0.5,
                });
            }
        }`,onInit:e=>{let o=1,n=2,a=11;e.makeObject(o++,{x:5,y:0,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:a,height:n,restitution:.99}),e.makeObject(o++,{x:5,y:10,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:a,height:n,restitution:.99}),e.makeObject(o++,{x:0,y:5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:n,height:a,restitution:.99}),e.makeObject(o++,{x:10,y:5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:n,height:a,restitution:.99});for(let s=0;s<2e3;s++)e.makeObject(o++,{x:Math.random()*8+1,y:Math.random()*8+1,vx:Math.random()*1-.5,vy:Math.random()*1-.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*20,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:.05,mass:.5,linearDamping:0,angularDamping:.5,restitution:.5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new w({name:"Fleas",key:"fleas",description:["A stress test with 2,000 bouncy `POINT` objects.","Point objects have zero radius and don't collide with each other, but they do collide with other shapes (like the `AABB` walls in this demo). This allows for extremely high-density simulations."].join(`

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

            for(let i = 0; i < nFleas; i++){

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
        }`,onInit:e=>{e.setGravity(0,10);let n=1,a=2,s=11;e.makeObject(n++,{x:5,y:0,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:s,height:a,restitution:.99}),e.makeObject(n++,{x:5,y:10,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:s,height:a,restitution:.99}),e.makeObject(n++,{x:0,y:5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:a,height:s,restitution:.99}),e.makeObject(n++,{x:10,y:5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:a,height:s,restitution:.99});for(let r=0;r<2e3;r++)e.makeObject(n++,{x:Math.random()*8+1,y:Math.random()*8+1,vx:Math.random()*10-5,r:Math.PI/2*Math.random(),shape:t.shapes.POINT,type:t.bodyTypes.RIGID_BODY,radius:.05,mass:2,linearDamping:0,angularDamping:.5,restitution:.99})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}})];let at=0,Ot=1;const un=[new w({name:"TC-1 (SOLVED)",key:"tc-1",hidden:!0,description:["**Test Case 1**: Verifies stability during box-on-box collisions.","Previously, boxes would exhibit 'jitter' or 'explosive' behavior when colliding at certain angles."].join(`

`),onInitRaw:`(world)=>{
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
        }`,onInit:e=>{e.setGravity(0,10);let o=1;e.makeObject(o++,{x:5,y:8,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:1,height:1,mass:1}),e.makeObject(o++,{x:7,y:2,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:5,height:1,mass:1}),e.makeObject(o++,{x:3,y:5,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:5,height:1,mass:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new w({name:"TC-2 (SOLVED)",key:"tc-2",hidden:!0,description:["**Test Case 2**: Ensures `BOX` shapes do not tunnel through `AABB` shapes.","This test case was used to refine the overlap detection and penetration resolution logic for different boundary types."].join(`

`),onInitRaw:`(world)=>{
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
        }`,onInit:e=>{e.setGravity(0,10);let o=1;e.makeObject(o++,{x:5,y:8,r:Math.PI/2,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:1,height:1,mass:1}),e.makeObject(o++,{x:7,y:2,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:5,height:1,mass:1}),e.makeObject(o++,{x:3,y:5,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:5,height:1,mass:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new w({name:"TC-3 (SOLVED)",key:"tc-3",description:["**Test Case 3**: Momentum preservation and angular transfer.","Previously, objects would lose too much linear momentum during eccentric collisions. The solver now correctly calculates the balance between linear and angular velocity transfer."].join(`

`),onInitRaw:`(world)=>{
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
        }`,onInit:e=>{e.setGravity(0,0);let o=1;e.makeObject(o++,{x:8,y:5,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:1,height:1,mass:1}),e.makeObject(o++,{x:2,y:3,vx:3,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:5,mass:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new w({name:"TC-4 (SOLVED)",key:"tc-4",hidden:!0,description:["**Test Case 4**: Correctness of angular velocity direction.","Ensures that objects receive torque in the physically correct direction based on the contact point and normal."].join(`

`),onInitRaw:`(world)=>{
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
        }`,onInit:e=>{e.setGravity(0,0);let o=1;e.makeObject(o++,{x:8,y:5,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:1,height:1,mass:1}),e.makeObject(o++,{x:2,y:6,vx:3,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:5,mass:1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new w({name:"TC-5 (SOLVED)",key:"tc-5",hidden:!0,description:["**Test Case 5**: Sensitivity to initial rotation.","Fixes an issue where even tiny angular velocities (`rs`) caused disproportionate collision responses. Also verifies that rotating objects transfer angular momentum in opposing directions."].join(`

`),onInitRaw:`(world)=>{
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
        }`,onInit:e=>{e.setGravity(0,0);let o=1;e.makeObject(o++,{x:5,y:5,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:1,mass:4}),e.makeObject(o++,{x:2.8,y:2,vx:3,vy:3,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:.5,mass:1,rs:.01})},onTickRaw:`(gb2d, world, dt)=>{
        }`,onTick:(e,o,n)=>{}}),new w({name:"TC-6 (SOLVED)",key:"tc-6",description:["**Test Case 6**: Contact point calculation accuracy.","Uses edge-clipping techniques to ensure stable and accurate impulse application during complex box-box collisions."].join(`

`),onInitRaw:`(world)=>{
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
        }`,onInit:e=>{e.setGravity(0,10),e.setHasFriction(!1);let o=1;e.makeObject(o++,{x:5,y:6,r:Math.PI/8,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:8,height:1}),e.makeObject(o++,{x:2,y:2,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:1,mass:.2})},onTickRaw:`(gb2d, world, dt)=>{
        }`,onTick:(e,o,n)=>{}}),new w({name:"TC-7 (SOLVED)",key:"tc-7",description:["**Test Case 7**: Friction normal vector correctness.","Ensures that friction impulses are applied exactly tangent to the contact normal, even when restitution is high."].join(`

`),onInitRaw:`(world)=>{
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
                restitution: 0.0,
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
                restitution: 0.0,
            });
        }`,onInit:e=>{e.setGravity(0,10);let o=1;e.makeObject(o++,{x:5,y:6,r:.1,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:8,height:1,restitution:0}),e.makeObject(o++,{x:2,y:2,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:1,mass:.2,restitution:0})},onTickRaw:`(gb2d, world, dt)=>{
        }`,onTick:(e,o,n)=>{}}),new w({name:"TC-8 (SOLVED)",key:"tc-8",description:["**Test Case 8**: Stability of high-frequency circle collisions.","Verifies that multiple circles colliding in quick succession do not cause simulation instability or tunneling."].join(`

`),globalLines:["let nextId = 1;"],onInitRaw:`(world)=>{
            world.setGravity(0, 10);
            impulseTimer = 0;

            // Objects will be created in the tick function.
        }`,onInit:e=>{e.setGravity(0,10),at=0},onTickRaw:`(world, dt)=>{
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
        }`,onTick:(e,o)=>{if(at++,at%60==0){let n=.1+Math.random()*.4,a=.2+n*n*.8;e.makeObject(Ot++,{x:0,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*1,vy:-6-Math.random()*1,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:a,mass:n}),n=.1+Math.random()*.4,a=.2+n*n*.8,e.makeObject(Ot++,{x:10,y:7.5,r:Math.PI/2*Math.random(),rs:(Math.random()-.5)*5,vx:(2+Math.random()*5)*-1,vy:-6-Math.random()*1,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:a,mass:n}),e.objectCount;let s=[];e.iterateObjects(r=>{r.y>10.5&&s.push(r)});for(let r of s)e.removeObject(r.id)}}}),new w({name:"TC-9 (SOLVED)",key:"tc-9",description:["**Test Case 9**: Resting stability.","A small box resting on a larger fixed box to verify that gravity and normal impulses reach equilibrium without constant jitter."].join(`

`),onInitRaw:`(world)=>{
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
        }`,onInit:e=>{e.setGravity(0,1);let o=1;e.makeObject(o++,{x:5,y:6,r:Math.PI/2,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:1,height:8}),e.makeObject(o++,{x:7,y:5,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:1,mass:.2})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new w({name:"TC-10 (SOLVED)",key:"tc-10",description:["**Test Case 10**: Circle-AABB penetration resolution.","Fixes extreme responses when a circle falls directly onto a large axis-aligned platform."].join(`

`),onInitRaw:`(world)=>{
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
        }`,onInit:e=>{e.setGravity(0,3);let o=1;e.makeObject(o++,{x:5,y:8,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:8,height:1}),e.makeObject(o++,{x:7,y:2,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:1,mass:.2,restitution:1,rs:-.1})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new w({name:"TC-11 (SOLVED)",key:"tc-11",description:["**Test Case 11**: Stuck objects and overlap logic.","Ensures that small circles do not get 'embedded' within other shapes when subjected to high-velocity collisions or deep initial overlaps."].join(`

`),onInitRaw:`(world)=>{

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
        }`,onInit:e=>{let o=1;e.makeObject(o++,{x:5,y:5,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:1,height:5}),e.makeObject(o++,{x:5.2,y:5,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:.1,mass:.2,restitution:.5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new w({name:"TC-12 (SOLVED)",key:"tc-12",description:["**Test Case 12**: Sinking prevention under high gravity.","Verifies that boxes maintain their position on top of other objects even when high downward forces are applied, ensuring the penetration resolution is sufficient."].join(`

`),onInitRaw:`(world)=>{
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
        }`,onInit:e=>{e.setGravity(0,10);let o=1;e.makeObject(o++,{x:5,y:6,shape:t.shapes.AABB,type:t.bodyTypes.FIXED_OBJECT,width:8,height:1}),e.makeObject(o++,{x:7,y:4,shape:t.shapes.BOX,type:t.bodyTypes.RIGID_BODY,width:1,height:1,mass:.2})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}}),new w({name:"TC-13 (SOLVED)",key:"tc-13",description:["**Test Case 13**: Stuck objects and overlap logic.","Ensures that small circles do not get 'embedded' within other shapes when subjected to high-velocity collisions or deep initial overlaps."].join(`

`),onInitRaw:`(world)=>{

            let id = 1;
            world.makeObject(id++, {
                x: 5,
                y: 5,
                shape: gb2d.shapes.BOX,
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
        }`,onInit:e=>{let o=1;e.makeObject(o++,{x:5,y:5,shape:t.shapes.BOX,type:t.bodyTypes.FIXED_OBJECT,width:1,height:5}),e.makeObject(o++,{x:5.2,y:5,shape:t.shapes.CIRCLE,type:t.bodyTypes.RIGID_BODY,radius:.1,mass:.2,restitution:.5})},onTickRaw:`(world, dt)=>{
        }`,onTick:(e,o)=>{}})];let f=1,Bt=null,Tt=null,Ct=null,R=null;const yn=new w({name:"Mechanical Clockwork",key:"clockwork",description:["A physically regulated mechanical clock. This version uses a **Grashof-compliant Crank-Rocker** mechanism to ensure continuous rotation.","### Features","- **Regulated Motion**: A 2.0m pendulum defines a 9-second period in low gravity (1.0 m/s²).","- **Grashof Linkage**: Precision geometry allows the drive gear to complete full 360° rotations.","- **Mainspring Power**: A tensioned `SpringJoint` drives the escapement, physically limited by the pendulum.","- **Multi-stage Reduction**: 7 `GearJoint` stages step down the escapement's motion to hours and minutes.","- **Real-time Sync**: The hands and gear train initialize to your local system time."].join(`

`),onInitRaw:`(world) => {
        world.clear();
        gb2d.debug.showAabbs = false;
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

        const pendCenter = world.makeObject(nextId++, { x: cx, y: pendPivotY, shape: gb2d.shapes.CIRCLE, radius: 0.1, type: gb2d.bodyTypes.FIXED_OBJECT, color: "#888", categoryBits: CAT_STATIC, maskBits: 0 });
        const escCenter = world.makeObject(nextId++, { x: cx, y: escapementY, shape: gb2d.shapes.CIRCLE, radius: 0.1, type: gb2d.bodyTypes.FIXED_OBJECT, color: "#888", categoryBits: CAT_STATIC, maskBits: 0 });
        const center = world.makeObject(nextId++, { x: cx, y: cy, shape: gb2d.shapes.CIRCLE, radius: 0.1, type: gb2d.bodyTypes.FIXED_OBJECT, color: "#888", categoryBits: CAT_STATIC, maskBits: 0 });

        const initialPendAngle = 0.5;
        pendulum = world.makeObject(nextId++, {
            x: cx + Math.sin(initialPendAngle) * pendulumLength,
            y: pendPivotY + Math.cos(initialPendAngle) * pendulumLength,
            r: -initialPendAngle,
            shape: gb2d.shapes.CIRCLE, radius: 0.4, mass: 50.0, color: "#cd853f", categoryBits: CAT_MECH, maskBits: 0
        });
        pendulum.angularDamping = 0.01;
        world.createHingeJoint(nextId++, pendCenter, pendulum, { worldAnchor: { x: cx, y: pendPivotY }, anchorB: { x: 0, y: -pendulumLength } });

        const fastGear = world.makeObject(nextId++, { x: cx, y: escapementY, r: 0, shape: gb2d.shapes.CIRCLE, radius: 0.5, mass: 0.5, color: "#aaa", categoryBits: CAT_GEAR, maskBits: 0 });
        fastGear.angularDamping = 0.05; 
        const fastHinge = world.createHingeJoint(nextId++, escCenter, fastGear, { worldAnchor: { x: cx, y: escapementY } });

        const crankPinLocal = { x: p.crankRadius, y: 0 }; 
        const pendPinLocal = { x: 0, y: -pendulumLength + rockerPinDist }; 
        const conRodLen = Math.sqrt(Math.pow(fastGear.localToWorld(crankPinLocal).x - pendulum.localToWorld(pendPinLocal).x, 2) + 
                                 Math.pow(fastGear.localToWorld(crankPinLocal).y - pendulum.localToWorld(pendPinLocal).y, 2));

        const conRodJoint = world.createDistanceJoint(nextId++, fastGear, pendulum, { anchorA: crankPinLocal, anchorB: pendPinLocal, length: conRodLen });

        const springAnchor = world.makeObject(nextId++, { x: p.springX, y: escapementY - 1.0, shape: gb2d.shapes.CIRCLE, radius: 0.05, type: gb2d.bodyTypes.FIXED_OBJECT, color: "#ff4444", categoryBits: CAT_STATIC, maskBits: 0 });
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
            shape: gb2d.shapes.CIRCLE,
            radius: 0.1,
            type: gb2d.bodyTypes.FIXED_OBJECT,
            color: "#888",
            categoryBits: CAT_STATIC,
            maskBits: 0
        });

        const inter1Gear = world.makeObject(nextId++, {
            x: inter1X, y: inter1Y,
            shape: gb2d.shapes.CIRCLE,
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
            shape: gb2d.shapes.CIRCLE,
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
                shape: gb2d.shapes.BOX,
                width: i % 3 === 0 ? 0.2 : 0.1,
                height: 0.4,
                type: gb2d.bodyTypes.FIXED_OBJECT,
                color: "#999",
                categoryBits: CAT_STATIC,
                maskBits: 0
            });
        }

        secondHand = world.makeObject(nextId++, {
            x: cx + Math.sin(secHandAngle) * (secLen / 2 - 0.2),
            y: cy - Math.cos(secHandAngle) * (secLen / 2 - 0.2),
            r: secHandAngle,
            shape: gb2d.shapes.BOX,
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
            shape: gb2d.shapes.CIRCLE,
            radius: 0.1,
            type: gb2d.bodyTypes.FIXED_OBJECT,
            color: "#888",
            categoryBits: CAT_STATIC,
            maskBits: 0
        });
        const inter2Gear = world.makeObject(nextId++, {
            x: inter2X, y: inter2Y,
            shape: gb2d.shapes.CIRCLE,
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
            shape: gb2d.shapes.CIRCLE,
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
            shape: gb2d.shapes.BOX,
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
            shape: gb2d.shapes.CIRCLE,
            radius: 0.1,
            type: gb2d.bodyTypes.FIXED_OBJECT,
            color: "#888",
            categoryBits: CAT_STATIC,
            maskBits: 0
        });
        const inter3Gear = world.makeObject(nextId++, {
            x: inter3X, y: inter3Y,
            shape: gb2d.shapes.CIRCLE,
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
            shape: gb2d.shapes.CIRCLE,
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
            shape: gb2d.shapes.BOX,
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
    }`,onInit:e=>{e.clear(),t.debug.showAabbs=!1,f=1;const o=5,n=2.5,a=1;e.setGravity(0,a),e.setHasRestitution(!0),e.setHasFriction(!0);const s=1,r=2,c=4,l=8,u=new Date,h=u.getSeconds(),i=u.getMinutes(),g=u.getHours()%12,d={crankRadius:.25,groundDist:1,rockerLength:.8,springFreq:.5,springX:o-1.5},y=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1",p=document.getElementById("clock-tuner-gui");p&&p.remove();const m=document.createElement("div");m.id="clock-tuner-gui",m.style="position:fixed;top:20px;right:20px;width:280px;background:rgba(0,0,0,0.85);color:#0f0;padding:15px;border-radius:8px;font-family:monospace;z-index:1000;box-shadow:0 4px 15px rgba(0,0,0,0.5);font-size:12px;border:1px solid #333;",y&&document.body.appendChild(m);const I=document.createElement("div");I.style="margin:15px 0;padding:10px;border:1px solid #0f0;text-align:center;font-size:16px;font-weight:bold;",I.textContent="Score: 0",m.appendChild(I);const v=document.createElement("button");v.textContent="Export to Console",v.style="width:100%;padding:8px;background:#0f0;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;margin-bottom:5px;",v.onclick=()=>console.log("Final Parameters:",JSON.stringify(d,null,4)),m.appendChild(v);const k=document.createElement("button");k.textContent="Start Auto-Optimize",k.style="width:100%;padding:8px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;",k.onclick=()=>{const O=e.scoreState;O.isOptimizing=!O.isOptimizing,k.textContent=O.isOptimizing?"Stop Auto-Optimize":"Start Auto-Optimize",k.style.background=O.isOptimizing?"#f00":"#444",O.isOptimizing&&(O.bestScore=-1/0,O.optimizationStage="PREPARE",O.optParamIndex=0,O.optDirection=1,O.epsilon=.05,O.lastImprovementIteration=0,console.log("Starting Auto-Optimization..."))},m.appendChild(k);const T=document.createElement("div");T.style="margin-top:10px;font-size:10px;color:#aaa;",T.textContent="Optimizer: Idle",m.appendChild(T);const C={},j=(O,M,ae,ie,nn)=>{const Xe=document.createElement("div");Xe.style.marginBottom="10px";const He=document.createElement("div");He.textContent=`${O}: ${d[M].toFixed(2)}`;const P=document.createElement("input");P.type="range",P.min=ae,P.max=ie,P.step=nn,P.value=d[M],P.style.width="100%",P.oninput=()=>{d[M]=parseFloat(P.value),He.textContent=`${O}: ${d[M].toFixed(2)}`,mt()},Xe.appendChild(He),Xe.appendChild(P),m.appendChild(Xe),C[M]={slider:P,labelEl:He,label:O}},F=O=>{const M=C[O];M&&(M.slider.value=d[O],M.labelEl.textContent=`${M.label}: ${d[O].toFixed(2)}`)};j("Crank Radius","crankRadius",.05,.5,.01),j("Ground Distance","groundDist",.5,2,.05),j("Rocker Length","rockerLength",.3,1.5,.05),j("Spring Frequency","springFreq",.1,2,.05),j("Spring X Pos","springX",o-3,o-.5,.1);const S=n+2,L=S-d.groundDist,J=a*Math.pow(9/(2*Math.PI),2),We=J-d.rockerLength,qe=e.makeObject(f++,{x:o,y:S,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),fe=e.makeObject(f++,{x:o,y:L,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),Y=e.makeObject(f++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),me=.5;R=e.makeObject(f++,{x:o+Math.sin(me)*J,y:S+Math.cos(me)*J,r:-me,shape:t.shapes.CIRCLE,radius:.4,mass:50,color:"#cd853f",categoryBits:r,maskBits:0}),R.angularDamping=.01,e.createHingeJoint(f++,qe,R,{worldAnchor:{x:o,y:S},anchorB:{x:0,y:-J}});const X=e.makeObject(f++,{x:o,y:L,r:0,shape:t.shapes.CIRCLE,radius:.5,mass:.5,color:"#aaa",categoryBits:c,maskBits:0});X.angularDamping=.05;const Ae=e.createHingeJoint(f++,fe,X,{worldAnchor:{x:o,y:L}}),K={x:d.crankRadius,y:0},xe={x:0,y:-J+We},Ue=Math.sqrt(Math.pow(X.localToWorld(K).x-R.localToWorld(xe).x,2)+Math.pow(X.localToWorld(K).y-R.localToWorld(xe).y,2)),we=e.createDistanceJoint(f++,X,R,{anchorA:K,anchorB:xe,length:Ue}),Ne=e.makeObject(f++,{x:d.springX,y:L-1,shape:t.shapes.CIRCLE,radius:.05,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444",categoryBits:s,maskBits:0}),Ut=e.createSpringJoint(f++,Ne,X,{anchorB:{x:.5,y:0},frequencyHz:d.springFreq,dampingRatio:.2,length:1.2}),mt=()=>{const O=S-d.groundDist;fe.y=O,X.y=O,Ae.localAnchorA=fe.worldToLocal({x:o,y:O}),we.localAnchorA={x:d.crankRadius,y:0};const M=J-d.rockerLength;we.localAnchorB={x:0,y:-J+M};const ae=X.localToWorld(we.localAnchorA),ie=R.localToWorld(we.localAnchorB);we.length=Math.sqrt(Math.pow(ie.x-ae.x,2)+Math.pow(ie.y-ae.y,2)),Ne.x=d.springX,Ne.y=O-1,Ut.frequencyHz=d.springFreq};e.scoreState={fastGear:X,pendulum:R,params:d,updateSimulation:mt,updateSliderUI:F,optStatus:T,lastFastR:X.r,history:[],periodTimes:[],lastPendSide:Math.sign(R.r),lastPendCrossing:0,scoreDisplay:I,isOptimizing:!1};const Nt=8/60,Ve=o+1.5,Ke=L+.5,Vt=e.makeObject(f++,{x:Ve,y:Ke,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),gt=e.makeObject(f++,{x:Ve,y:Ke,shape:t.shapes.CIRCLE,radius:1,mass:.2,r:0,color:"#44ff44",categoryBits:c,maskBits:0});gt.angularDamping=.02;const ut=e.createHingeJoint(f++,Vt,gt,{worldAnchor:{x:Ve,y:Ke}});e.createGearJoint(f++,Ae,ut,.25);const Re=h/60*Math.PI*2,yt=e.makeObject(f++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:.6,mass:.2,r:Re,color:"#ff4444",categoryBits:c,maskBits:0});yt.angularDamping=.02;const Ze=e.createHingeJoint(f++,Y,yt,{worldAnchor:{x:o,y:n}});e.createGearJoint(f++,ut,Ze,Nt/.25);const Me=i/60*Math.PI*2,je=g/12*Math.PI*2,De=3.5,Le=3,Se=2;for(let O=0;O<12;O++){const M=O/12*Math.PI*2-Math.PI/2,ae=3.8,ie=4;e.makeObject(f++,{x:o+Math.cos(M)*(ae+ie)/2,y:n+Math.sin(M)*(ae+ie)/2,r:M+Math.PI/2,shape:t.shapes.BOX,width:O%3===0?.2:.1,height:.4,type:t.bodyTypes.FIXED_OBJECT,color:"#999",categoryBits:s,maskBits:0})}Bt=e.makeObject(f++,{x:o+Math.sin(Re)*(De/2-.2),y:n-Math.cos(Re)*(De/2-.2),r:Re,shape:t.shapes.BOX,width:.05,height:De,mass:.1,color:"#ff4444",categoryBits:l,maskBits:0});const Kt=e.createHingeJoint(f++,Y,Bt,{worldAnchor:{x:o,y:n},anchorB:{x:0,y:De/2-.2}});e.createGearJoint(f++,Ze,Kt,-1);const Qe=o-1.5,et=n-1.5,Zt=e.makeObject(f++,{x:Qe,y:et,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),bt=e.makeObject(f++,{x:Qe,y:et,shape:t.shapes.CIRCLE,radius:1,mass:.2,r:0,color:"#4444ff",categoryBits:c,maskBits:0});bt.angularDamping=.01;const ft=e.createHingeJoint(f++,Zt,bt,{worldAnchor:{x:Qe,y:et}});e.createGearJoint(f++,Ze,ft,1/10);const xt=e.makeObject(f++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:.8,mass:.2,r:Me,color:"#4444ff",categoryBits:c,maskBits:0});xt.angularDamping=.01;const tt=e.createHingeJoint(f++,Y,xt,{worldAnchor:{x:o,y:n}});e.createGearJoint(f++,ft,tt,1/6),Tt=e.makeObject(f++,{x:o+Math.sin(Me)*(Le/2-.3),y:n-Math.cos(Me)*(Le/2-.3),r:Me,shape:t.shapes.BOX,width:.12,height:Le,mass:.2,color:"#4444ff",categoryBits:l,maskBits:0});const Qt=e.createHingeJoint(f++,Y,Tt,{worldAnchor:{x:o,y:n},anchorB:{x:0,y:Le/2-.3}});e.createGearJoint(f++,tt,Qt,-1);const nt=o+2,ot=n-1,en=e.makeObject(f++,{x:nt,y:ot,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:s,maskBits:0}),wt=e.makeObject(f++,{x:nt,y:ot,shape:t.shapes.CIRCLE,radius:1,mass:.2,r:0,color:"#cccc44",categoryBits:c,maskBits:0});wt.angularDamping=.01;const It=e.createHingeJoint(f++,en,wt,{worldAnchor:{x:nt,y:ot}});e.createGearJoint(f++,tt,It,1/3);const vt=e.makeObject(f++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:1.1,mass:.2,r:je,color:"#cc8844",categoryBits:c,maskBits:0});vt.angularDamping=.01;const kt=e.createHingeJoint(f++,Y,vt,{worldAnchor:{x:o,y:n}});e.createGearJoint(f++,It,kt,1/4),Ct=e.makeObject(f++,{x:o+Math.sin(je)*(Se/2-.4),y:n-Math.cos(je)*(Se/2-.4),r:je,shape:t.shapes.BOX,width:.18,height:Se,mass:.3,color:"#cc8844",categoryBits:l,maskBits:0});const tn=e.createHingeJoint(f++,Y,Ct,{worldAnchor:{x:o,y:n},anchorB:{x:0,y:Se/2-.4}});e.createGearJoint(f++,kt,tn,-1)},onTickRaw:`(world, dt) => {
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
        gb2d.debug.clearLabels();
        gb2d.debug.addLabel({ text: "Mechanical Clockwork", x: 5, y: 0.5, fontSize: "28px Arial", color: "#bbb", position: "on-top" });
        gb2d.debug.addLabel({ text: timeString, x: 5, y: 9.5, fontSize: "36px Arial", color: "#fff", position: "on-top" });
        if (pendulum) {
            const angle = (pendulum.r * 180 / Math.PI).toFixed(1);
            gb2d.debug.addLabel({ text: \`Pendulum: \${angle}°\`, x: 8, y: 8, fontSize: "16px Arial", color: "#cd853f", position: "on-top" });
        }
    }`,onTick:(e,o)=>{const n=e.scoreState;if(n){const r=performance.now(),c=5e3;let l=0,u=!1;if(n.fastGear){const m=n.fastGear.r-n.lastFastR;m<-.01&&(u=!0),l=Math.max(0,m)/(Math.PI*2),n.lastFastR=n.fastGear.r}if(n.history.push({time:r,rotDelta:l,isReversal:u}),n.pendulum){const m=Math.sign(n.pendulum.r);if(m!==n.lastPendSide&&m!==0){if(n.lastPendCrossing>0){const I=(r-n.lastPendCrossing)/500;I>.2&&I<5&&n.periodTimes.push({time:r,period:I})}n.lastPendCrossing=r,n.lastPendSide=m}}const h=r-c;for(;n.history.length>0&&n.history[0].time<h;)n.history.shift();for(;n.periodTimes.length>0&&n.periodTimes[0].time<h;)n.periodTimes.shift();let i=0,g=0;for(const m of n.history)i+=m.rotDelta,m.isReversal&&g++;const d=Math.abs(n.pendulum.r)+Math.abs(n.pendulum.rs)*.5,y=Math.abs(n.fastGear.rs);let p=i*5e3;if(p-=g*20,p+=d*200,p+=y*50,n.periodTimes.length>0){const m=n.periodTimes.reduce((v,k)=>v+k.period,0)/n.periodTimes.length,I=Math.abs(m-1);p+=Math.max(0,1e3*(1-I*2))}if(i<.005&&(p-=2e3),n.scoreDisplay.textContent=`Recent Score (5s): ${Math.floor(p)}`,n.isOptimizing){const m=["crankRadius","groundDist","rockerLength","springFreq","springX"];n.optimizationStage==="PREPARE"?(n.bestScore=p,n.optimizationStage="TWEAK",n.evalTimer=r+c,n.improvedThisCycle=!1):r>n.evalTimer&&n.optimizationStage==="TWEAK"&&(p>n.bestScore+.1?(n.bestScore=p,n.improvedThisCycle=!0,n.optStatus.textContent=`Optimizer: Improved ${m[n.optParamIndex]} (Score: ${Math.floor(p)})`,console.log(`Optimizer: Found improvement! New best score: ${Math.floor(p)}`)):(n.params[m[n.optParamIndex]]-=n.epsilon*n.optDirection,n.updateSimulation(),n.updateSliderUI(m[n.optParamIndex])),n.optDirection*=-1,n.optDirection===1&&(n.optParamIndex++,n.optParamIndex>=m.length&&(n.optParamIndex=0,n.improvedThisCycle||(n.epsilon*=.8,n.epsilon=Math.max(n.epsilon,.002),console.log(`Optimizer: No improvements this cycle. Shrinking epsilon to ${n.epsilon.toFixed(4)}`)),n.improvedThisCycle=!1)),n.params[m[n.optParamIndex]]+=n.epsilon*n.optDirection,n.updateSimulation(),n.updateSliderUI(m[n.optParamIndex]),n.evalTimer=r+c,n.optStatus.textContent=`Opt: Testing ${m[n.optParamIndex]} (${n.optDirection>0?"+":"-"}) eps=${n.epsilon.toFixed(4)}`)}else n.optStatus.textContent="Optimizer: Idle"}R&&Math.abs(R.r)<.1&&Math.abs(R.rs)>.02&&Math.abs(R.rs)<1.2&&R.applyAngularImpulse(Math.sign(R.rs)*.4);const s=new Date().toLocaleTimeString();if(t.debug.clearLabels(),t.debug.addLabel({text:"Mechanical Clockwork",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"}),t.debug.addLabel({text:s,x:5,y:9.5,fontSize:"36px Arial",color:"#fff",position:"on-top"}),R){const r=(R.r*180/Math.PI).toFixed(1);t.debug.addLabel({text:`Pendulum: ${r}°`,x:8,y:8,fontSize:"16px Arial",color:"#cd853f",position:"on-top"})}},onCleanup:e=>{const o=document.getElementById("clock-tuner-gui");o&&o.remove()}});let H=1,q=null;const bn=new w({name:"Gnome Omega Engine",key:"gnome-omega",description:["A detailed simulation of a **Gnome Omega** rotary engine. In this classic radial design, the crankshaft remains stationary while the entire cylinder block rotates around it.","### Features","- **Stationary Crankshaft**: A fixed pivot point (red) offset from the center.","- **Rotating Crankcase**: The main grey hub that carries the cylinders.","- **Weld Constraints**: Cylinders are 'welded' to the hub using a combination of `HingeJoint` and `DistanceJoint` for maximum stability.","- **Reciprocating Motion**: Pistons and connecting rods are synchronized via `HingeJoint` constraints.","- **Collision Masks**: Bitwise filtering ensures pistons only interact with their respective cylinder walls.","Click **Reset** if the simulation becomes unstable due to extreme angular velocities."].join(`

`),onInitRaw:`(world) => {
        world.clear();
        gb2d.debug.showAabbs = false;
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
            shape: gb2d.shapes.CIRCLE,
            radius: 0.15,
            type: gb2d.bodyTypes.FIXED_OBJECT,
            color: "#888",
            categoryBits: CAT_FIXED,
            maskBits: 0 // Collide with nothing
        });

        // The fixed crank pin (stationary throw)
        const crankPin = world.makeObject(nextId++, {
            x: cx, y: cy + crankOffset,
            shape: gb2d.shapes.CIRCLE,
            radius: 0.1,
            type: gb2d.bodyTypes.FIXED_OBJECT,
            color: "#ff4444",
            categoryBits: CAT_FIXED,
            maskBits: 0 // Collide with nothing
        });

        // The rotating hub (crankcase)
        engineHub = world.makeObject(nextId++, {
            x: cx, y: cy,
            shape: gb2d.shapes.CIRCLE,
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
                    shape: gb2d.shapes.BOX,
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
                shape: gb2d.shapes.BOX,
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
                shape: gb2d.shapes.BOX,
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
    }`,onInit:e=>{e.clear(),t.debug.showAabbs=!1,H=1,q=null;const o=5,n=4.5,a=.8,s=7,r=2.5,c=256,l=512,u=1024,h=2048,i=4096,g=e.makeObject(H++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:.15,type:t.bodyTypes.FIXED_OBJECT,color:"#888",categoryBits:c,maskBits:0}),d=e.makeObject(H++,{x:o,y:n+a,shape:t.shapes.CIRCLE,radius:.1,type:t.bodyTypes.FIXED_OBJECT,color:"#ff4444",categoryBits:c,maskBits:0});q=e.makeObject(H++,{x:o,y:n,shape:t.shapes.CIRCLE,radius:.8,mass:50,color:"#aaa",categoryBits:l,maskBits:0,restitution:0}),e.createHingeJoint(H++,g,q,{worldAnchor:{x:o,y:n}});for(let y=0;y<s;y++){const p=y/s*Math.PI*2,m=Math.cos(p),I=Math.sin(p),v=p-Math.PI/2,k=2.6,T=.28,C=2.5,j=1,F=me=>{const X=o+m*k+-I*(me*j/2),Ae=n+I*k+m*(me*j/2),K=e.makeObject(H++,{x:X,y:Ae,r:v,shape:t.shapes.BOX,width:T,height:C,mass:1,color:"#bbb",categoryBits:u,maskBits:h,restitution:0,sFriction:0,kFriction:0}),xe=K.localToWorld({x:0,y:-C/2}),Ue=K.localToWorld({x:0,y:C/2});e.createHingeJoint(H++,q,K,{worldAnchor:xe}),e.createDistanceJoint(H++,q,K,{worldAnchor:Ue})};F(-1),F(1);const S=a*Math.sin(p)+Math.sqrt(r*r-Math.pow(a*Math.cos(p),2)),L=o+m*S,pe=n+I*S,J=e.makeObject(H++,{x:L,y:pe,r:v,shape:t.shapes.BOX,width:.7,height:1,mass:.5,color:"#ddd",categoryBits:h,maskBits:u,restitution:0,sFriction:0,kFriction:0}),We=(o+L)/2,qe=(n+a+pe)/2,fe=Math.atan2(pe-(n+a),L-o)-Math.PI/2,Y=e.makeObject(H++,{x:We,y:qe,r:fe,shape:t.shapes.BOX,width:.15,height:r,mass:.2,color:"#fff",categoryBits:i,maskBits:0,restitution:0});e.createHingeJoint(H++,Y,d,{anchorA:{x:0,y:-r/2},anchorB:{x:0,y:0}}),e.createHingeJoint(H++,Y,J,{anchorA:{x:0,y:r/2},anchorB:{x:0,y:0}})}e.setGravity(0,0),q.rs=2},onTickRaw:`(world, dt) => {
        if (engineHub) {
            // Apply a gentle impulse to maintain rotation
            if (Math.abs(engineHub.rs) < 0.9) {
                engineHub.applyAngularImpulse(5);
            }
        }
    }`,onTick:(e,o)=>{q&&Math.abs(q.rs)<.9&&q.applyAngularImpulse(5)}});let Ce=1,U=null;const ue=[{name:"Cherry",radius:.15,mass:.1,color:"#ff4444",score:1},{name:"Strawberry",radius:.22,mass:.2,color:"#ff6666",score:3},{name:"Grape",radius:.28,mass:.3,color:"#9933ff",score:6},{name:"Dekopon",radius:.35,mass:.4,color:"#ff9933",score:10},{name:"Persimmon",radius:.42,mass:.5,color:"#ff6600",score:15},{name:"Apple",radius:.5,mass:.7,color:"#cc0000",score:21},{name:"Pear",radius:.58,mass:.9,color:"#ffff66",score:28},{name:"Peach",radius:.68,mass:1.2,color:"#ff99cc",score:36},{name:"Pineapple",radius:.8,mass:1.6,color:"#ffff00",score:45},{name:"Melon",radius:.95,mass:2.2,color:"#99ff33",score:55},{name:"Watermelon",radius:1.15,mass:3,color:"#006600",score:66}];let x={score:0,nextFruitLevel:0,isGameOver:!1,lastDropTime:0,dropCooldown:500,mouseX:5,fruitIds:new Map,mergingIds:new Set,previewFruit:null};const Et=()=>{x.score=0,x.nextFruitLevel=Math.floor(Math.random()*5),x.isGameOver=!1,x.lastDropTime=0,x.mouseX=5,x.fruitIds.clear(),x.mergingIds.clear(),x.previewFruit=null,Ce=1},fn=e=>(e-t.debug.offsetX)/(t.debug.zoom*100),Gt=new w({name:"Fruit Merge",key:"fruit-merge",description:["A physics-based arcade game demonstrating dynamic object spawning and collision events.","Drop fruits into the bucket. Identical fruits will **merge** into the next larger fruit tier on contact.","### Controls","- **Mouse Move**: Position the preview fruit","- **Click**: Drop fruit","**Game Over** occurs if any fruit falls out of the world boundaries."].join(`

`),onInitRaw:`(world) => {
        world.clear();
        resetGameState();
        gb2d.debug.showAabbs = false;

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
            shape: gb2d.shapes.BOX,
            width: bw + thickness * 2, height: thickness,
            type: gb2d.bodyTypes.FIXED_OBJECT,
            color: "#664422"
        });

        // Left Wall
        world.makeObject(nextId++, {
            x: bx - bw / 2 - thickness / 2, y: by,
            shape: gb2d.shapes.BOX,
            width: thickness, height: bh,
            type: gb2d.bodyTypes.FIXED_OBJECT,
            color: "#664422"
        });

        // Right Wall
        world.makeObject(nextId++, {
            x: bx + bw / 2 + thickness / 2, y: by,
            shape: gb2d.shapes.BOX,
            width: thickness, height: bh,
            type: gb2d.bodyTypes.FIXED_OBJECT,
            color: "#664422"
        });

        const spawnFruit = (x: number, y: number, level: number, isInitial: boolean = false) => {
            if (level >= FRUIT_LEVELS.length) return null;
            
            const fruitDef = FRUIT_LEVELS[level];
            const id = nextId++;
            const fruit = world.makeObject(id, {
                x, y,
                shape: gb2d.shapes.CIRCLE,
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
    }`,onInit:e=>{e.clear(),Et(),t.debug.showAabbs=!1,e.setGravity(0,9.8),e.setHasRestitution(!0),e.setHasFriction(!0);const o=5,n=6,a=4,s=5,r=.2;e.makeObject(Ce++,{x:o,y:n+s/2+r/2,shape:t.shapes.BOX,width:a+r*2,height:r,type:t.bodyTypes.FIXED_OBJECT,color:"#664422"}),e.makeObject(Ce++,{x:o-a/2-r/2,y:n,shape:t.shapes.BOX,width:r,height:s,type:t.bodyTypes.FIXED_OBJECT,color:"#664422"}),e.makeObject(Ce++,{x:o+a/2+r/2,y:n,shape:t.shapes.BOX,width:r,height:s,type:t.bodyTypes.FIXED_OBJECT,color:"#664422"});const c=(h,i,g,d=!1)=>{if(g>=ue.length)return null;const y=ue[g],p=Ce++,m=e.makeObject(p,{x:h,y:i,shape:t.shapes.CIRCLE,radius:y.radius,mass:y.mass,color:y.color,restitution:.2,staticFriction:.5,kineticFriction:.3});return m&&(m.wantsEvents=!0,x.fruitIds.set(p,g),d&&(m.vx=(Math.random()-.5)*.1)),m};e.onCollisionStart=(h,i)=>{if(x.isGameOver)return;const g=x.fruitIds.get(h),d=x.fruitIds.get(i);if(g!==void 0&&d!==void 0&&g===d){if(x.mergingIds.has(h)||x.mergingIds.has(i))return;const y=g;if(y>=ue.length-1)return;x.mergingIds.add(h),x.mergingIds.add(i);const p=e.getObjectById(h),m=e.getObjectById(i);if(p&&m){const I=(p.x+m.x)/2,v=(p.y+m.y)/2;setTimeout(()=>{e.removeObject(h),e.removeObject(i),x.fruitIds.delete(h),x.fruitIds.delete(i),x.mergingIds.delete(h),x.mergingIds.delete(i),c(I,v,y+1)&&(x.score+=ue[y+1].score)},0)}}},U=document.getElementById("debug-canvas"),e._onMouseMove&&U.removeEventListener("mousemove",e._onMouseMove),e._onClick&&U.removeEventListener("click",e._onClick);const l=h=>{if(x.isGameOver)return;const i=U.getBoundingClientRect();x.mouseX=fn(h.clientX-i.left);const g=ue[x.nextFruitLevel].radius;x.mouseX=Math.max(o-a/2+g,Math.min(o+a/2-g,x.mouseX))},u=h=>{if(x.isGameOver){e.clear(),Et(),Gt.onInit(e);return}const i=Date.now();i-x.lastDropTime>x.dropCooldown&&(c(x.mouseX,n-s/2-1,x.nextFruitLevel,!0),x.nextFruitLevel=Math.floor(Math.random()*5),x.lastDropTime=i)};e._onMouseMove=l,e._onClick=u,U.addEventListener("mousemove",l),U.addEventListener("click",u)},onTickRaw:`(world, dt) => {
        gb2d.debug.clearLabels();

        if (gameState.isGameOver) {
            gb2d.debug.addLabel({ text: "GAME OVER", x: 5, y: 4, fontSize: "48px Arial", color: "#ff4444", position: "on-top" });
            gb2d.debug.addLabel({ text: \`Final Score: \${gameState.score}\`, x: 5, y: 5, fontSize: "24px Arial", color: "#fff", position: "on-top" });
            gb2d.debug.addLabel({ text: "Click to Restart", x: 5, y: 6, fontSize: "20px Arial", color: "#888", position: "on-top" });
            return;
        }

        // Draw Score
        gb2d.debug.addLabel({ text: \`Score: \${gameState.score}\`, x: 0.5, y: 0.5, fontSize: "24px Arial", color: "#fff", textAlign: "left" });

        // Draw Next Fruit Preview
        const nextFruit = FRUIT_LEVELS[gameState.nextFruitLevel];
        gb2d.debug.addLabel({ text: \`Next: \${nextFruit.name}\`, x: 8.0, y: 0.5, fontSize: "18px Arial", color: nextFruit.color, textAlign: "right" });

        // Draw Drop Guide / Preview
        const previewY = 1.5;
        gb2d.debug.addLabel({ 
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

        gb2d.debug.addLabel({ text: "Fruit Merge", x: 5, y: 0.5, fontSize: "28px Arial", color: "#bbb", position: "on-top" });
    }`,onTick:(e,o)=>{if(t.debug.clearLabels(),x.isGameOver){t.debug.addLabel({text:"GAME OVER",x:5,y:4,fontSize:"48px Arial",color:"#ff4444",position:"on-top"}),t.debug.addLabel({text:`Final Score: ${x.score}`,x:5,y:5,fontSize:"24px Arial",color:"#fff",position:"on-top"}),t.debug.addLabel({text:"Click to Restart",x:5,y:6,fontSize:"20px Arial",color:"#888",position:"on-top"});return}t.debug.addLabel({text:`Score: ${x.score}`,x:.5,y:.5,fontSize:"24px Arial",color:"#fff",textAlign:"left"});const n=ue[x.nextFruitLevel];t.debug.addLabel({text:`Next: ${n.name}`,x:8,y:.5,fontSize:"18px Arial",color:n.color,textAlign:"right"}),t.debug.addLabel({text:"●",x:x.mouseX,y:1.5,fontSize:`${n.radius*200}px Arial`,color:n.color,position:"on-top"}),e.iterateObjects(s=>{x.fruitIds.has(s.id)&&s.y>12&&(x.isGameOver=!0)}),t.debug.addLabel({text:"Fruit Merge",x:5,y:.5,fontSize:"28px Arial",color:"#bbb",position:"on-top"})},onCleanup:e=>{U&&(U.removeEventListener("mousemove",e._onMouseMove),U.removeEventListener("click",e._onClick),delete e._onMouseMove,delete e._onClick)}});let E=1,D=null,ye=null,Fe=null,Je=null,ce=[],Q={},G=null,he=null,te=null;const be=1,Be=2,ee=4,Pt=(e,o)=>({x:(e-t.debug.offsetX)/(t.debug.zoom*100),y:(o-t.debug.offsetY)/(t.debug.zoom*100)}),xn=(e,o)=>{if(e.button!==0)return;const n=te.getBoundingClientRect(),a=Pt(e.clientX-n.left,e.clientY-n.top),s=o.queryPoint(a.x,a.y);if(s.length>0){const r=s[0],c=o.getObjectById(r);c&&c.type!==t.bodyTypes.FIXED_OBJECT&&(G=o.makeObject(999999,{x:a.x,y:a.y,type:t.bodyTypes.FIXED_OBJECT,shape:t.shapes.CIRCLE,radius:.05,color:"transparent",maskBits:0}),he=o.createSpringJoint(999998,G,c,{worldAnchor:a,frequencyHz:5,dampingRatio:1,length:0}))}},wn=e=>{if(G){const o=te.getBoundingClientRect(),n=Pt(e.clientX-o.left,e.clientY-o.top);G.x=n.x,G.y=n.y}},In=(e,o)=>{he&&(o.removeJoint(he.id),he=null),G&&(o.removeObject(G.id),G=null)},zt=new w({name:"Motorcycle Trials",key:"motorcycle",description:["A physically-driven motorcycle featuring multi-joint suspension and a gear-driven powertrain.","### Controls","- **D / A**: Throttle / Reverse","- **W / S**: Lean / Balance","- **R**: Reset Simulation","### Technical Features","- **Power Transfer**: Engine-to-wheel torque transfer using `GearJoint` constraints.","- **Suspension**: A network of `SpringJoint` constraints for authentic front/rear suspension travel.","- **Procedural Terrain**: Dynamic generation with optimized **Collision Masks** (terrain-terrain collisions are disabled for performance)."].join(`

`),onInitRaw:`(world) => {
        world.clear();
        gb2d.debug.showAabbs = false;
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
            shape: gb2d.shapes.BOX,
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
            shape: gb2d.shapes.CIRCLE,
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
            shape: gb2d.shapes.BOX,
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
            shape: gb2d.shapes.CIRCLE,
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
            shape: gb2d.shapes.BOX,
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
            shape: gb2d.shapes.CIRCLE,
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
            shape: gb2d.shapes.BOX,
            width: 20, height: 1.0,
            type: gb2d.bodyTypes.FIXED_OBJECT,
            color: "#444",
            categoryBits: CAT_TERRAIN,
            maskBits: CAT_CHASSIS | CAT_WHEEL
        });
        terrainBoxes.push(startPlatform);

        // Back Hill (Steep incline to prevent backing up)
        world.makeObject(nextId++, {
            x: -7.72, y: 0.01,
            r: 1.2, // Very steep (now tilted correctly as \\_)
            shape: gb2d.shapes.BOX,
            width: 15, height: 1.0,
            type: gb2d.bodyTypes.FIXED_OBJECT,
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
    }`,onInit:e=>{e.clear(),t.debug.showAabbs=!1,E=1,ce=[],Q={};const o=5,n=5;e.setGravity(0,9.81),e.setHasRestitution(!0),e.setHasFriction(!0),D=e.makeObject(E++,{x:o,y:n,shape:t.shapes.BOX,width:1.2,height:.4,mass:10,color:"#ff4444",categoryBits:be,maskBits:ee}),D.angularDamping=.5,ye=e.makeObject(E++,{x:o,y:n-.15,shape:t.shapes.CIRCLE,radius:.25,mass:5,color:"#444",categoryBits:0,maskBits:0});const a=e.createHingeJoint(E++,D,ye,{worldAnchor:{x:o,y:n-.15}}),s=e.makeObject(E++,{x:o-.6,y:n+.2,shape:t.shapes.BOX,width:.6,height:.1,mass:1,color:"#666",categoryBits:be,maskBits:ee});e.createHingeJoint(E++,D,s,{anchorA:{x:-.4,y:.1},anchorB:{x:.3,y:0}}),e.createSpringJoint(E++,D,s,{anchorA:{x:-.6,y:-.2},anchorB:{x:-.2,y:0},frequencyHz:20,dampingRatio:.5}),Je=e.makeObject(E++,{x:o-.9,y:n+.2,shape:t.shapes.CIRCLE,radius:.4,mass:2,color:"#333",categoryBits:Be,maskBits:ee}),Je.kineticFriction=2.5,Je.staticFriction=3;const r=e.createHingeJoint(E++,s,Je,{anchorA:{x:-.3,y:0},anchorB:{x:0,y:0}});e.createGearJoint(E++,a,r,-2);const c=e.makeObject(E++,{x:o+.7,y:n+.2,shape:t.shapes.BOX,width:.1,height:.8,r:.3,mass:1,color:"#666",categoryBits:be,maskBits:ee});e.createHingeJoint(E++,D,c,{anchorA:{x:.5,y:0},anchorB:{x:0,y:-.3}}),e.createSpringJoint(E++,D,c,{anchorA:{x:.2,y:.2},anchorB:{x:0,y:.1},frequencyHz:15,dampingRatio:.7}),Fe=e.makeObject(E++,{x:o+.8,y:n+.5,shape:t.shapes.CIRCLE,radius:.4,mass:2,color:"#333",categoryBits:Be,maskBits:ee}),Fe.kineticFriction=2,Fe.staticFriction=2.5,e.createHingeJoint(E++,c,Fe,{anchorA:{x:0,y:.4},anchorB:{x:0,y:0}});const l=e.makeObject(E++,{x:o,y:n+2,shape:t.shapes.BOX,width:20,height:1,type:t.bodyTypes.FIXED_OBJECT,color:"#444",categoryBits:ee,maskBits:be|Be});ce.push(l),e.makeObject(E++,{x:-7.72,y:.01,r:1.2,shape:t.shapes.BOX,width:15,height:1,type:t.bodyTypes.FIXED_OBJECT,color:"#333",categoryBits:ee,maskBits:be|Be});const u=p=>Q[p.code]=!0,h=p=>Q[p.code]=!1;te=document.getElementById("debug-canvas");const i=p=>xn(p,e),g=p=>wn(p),d=p=>In(p,e),y=e._motorcycleListeners;y&&(window.removeEventListener("keydown",y.onKeyDown),window.removeEventListener("keyup",y.onKeyUp),te&&te.removeEventListener("mousedown",y.mouseDownHandler),window.removeEventListener("mousemove",y.mouseMoveHandler),window.removeEventListener("mouseup",y.mouseUpHandler)),window.addEventListener("keydown",u),window.addEventListener("keyup",h),te.addEventListener("mousedown",i),window.addEventListener("mousemove",g),window.addEventListener("mouseup",d),e._motorcycleListeners={onKeyDown:u,onKeyUp:h,mouseDownHandler:i,mouseMoveHandler:g,mouseUpHandler:d}},onTickRaw:`(world, dt) => {
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
        const canvasWidth = gb2d.debug.canvas?.width || 800;
        const canvasHeight = gb2d.debug.canvas?.height || 600;
        
        // Smoothed camera follow (accounts for zoom)
        const lerp = (a, b, t) => a + (b - a) * t;
        const zoom = gb2d.debug.zoom;
        const idealOffsetX = canvasWidth / 2 - targetX * 100 * zoom;
        const idealOffsetY = canvasHeight / 2 - targetY * 100 * zoom;
        
        gb2d.debug.offsetX = lerp(gb2d.debug.offsetX, idealOffsetX, 0.1);
        gb2d.debug.offsetY = lerp(gb2d.debug.offsetY, idealOffsetY, 0.1);

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
                shape: gb2d.shapes.BOX,
                width: width, height: height,
                type: gb2d.bodyTypes.FIXED_OBJECT,
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

        gb2d.debug.clearLabels();
        // Instructions pinned to world at the start
        if (chassis.x < 15) {
            gb2d.debug.addLabel({ text: "Motorcycle Trials", x: 5, y: 3, fontSize: "28px Arial", color: "#fff", position: "on-top" });
            gb2d.debug.addLabel({ text: "Use D/A to drive and W/S to balance!", x: 5, y: 3.5, fontSize: "16px Arial", color: "#aaa", position: "on-top" });
        }
    }`,onTick:(e,o)=>{if(!D)return;const n=150,a=100,s=100;if(Q.KeyD&&ye.rs<s&&ye.applyAngularImpulse(n*o),Q.KeyA&&ye.rs>-s&&ye.applyAngularImpulse(-n*o),Q.KeyW&&D.applyAngularImpulse(-a*o),Q.KeyS&&D.applyAngularImpulse(a*o),Q.KeyR){zt.init(e);return}const r=D.x,c=D.y,l=t.debug.canvas?.width||800,u=t.debug.canvas?.height||600,h=(p,m,I)=>p+(m-p)*I,i=t.debug.zoom,g=l/2-r*100*i,d=u/2-c*100*i;t.debug.offsetX=h(t.debug.offsetX,g,.1),t.debug.offsetY=h(t.debug.offsetY,d,.1);const y=ce[ce.length-1];if(y.x<D.x+25){const p=6+Math.random()*8,m=1.2,I=(Math.random()-.5)*.5,v=Math.random()<.2?1.5:0,k=y.localToWorld({x:y.width/2,y:0}),T=k.x+v;let C=k.y+(v>0?(Math.random()-.5)*3:0);C=Math.max(2,Math.min(8,C));const j=Math.cos(I),F=Math.sin(I),S=T+p/2*j,L=C+p/2*F,pe=e.makeObject(E++,{x:S,y:L,r:I,shape:t.shapes.BOX,width:p,height:m,type:t.bodyTypes.FIXED_OBJECT,color:`hsl(${20+Math.random()*40}, 30%, ${30+Math.random()*20}%)`,categoryBits:ee,maskBits:be|Be});if(ce.push(pe),ce.length>50){const J=ce.shift();e.removeObject(J.id)}}t.debug.clearLabels(),D.x<15&&(t.debug.addLabel({text:"Motorcycle Trials",x:5,y:3,fontSize:"28px Arial",color:"#fff",position:"on-top"}),t.debug.addLabel({text:"Use D/A to drive and W/S to balance!",x:5,y:3.5,fontSize:"16px Arial",color:"#aaa",position:"on-top"}))},onCleanup:e=>{const o=e._motorcycleListeners;o&&(window.removeEventListener("keydown",o.onKeyDown),window.removeEventListener("keyup",o.onKeyUp),te&&te.removeEventListener("mousedown",o.mouseDownHandler),window.removeEventListener("mousemove",o.mouseMoveHandler),window.removeEventListener("mouseup",o.mouseUpHandler),delete e._motorcycleListeners),he&&(e.removeJoint(he.id),he=null),G&&(e.removeObject(G.id),G=null),t.debug.offsetX=0,t.debug.offsetY=0}}),vn=[Gt,yn,bn,zt],le=[{name:"Showcase",examples:vn},{name:"General",examples:hn},{name:"Constraints",examples:pn},{name:"Optimizations",examples:mn},{name:"Load Tests",examples:gn},{name:"Known Issues",examples:un}];let kn=`
import gb2d from "gb2d";

let world;
{{GLOBAL}}
gb2d.init().then(()=>{
    world = gb2d.makeWorld();
    
    // Optional:
    gb2d.debug.enableDebugGraphics(document.getElementById("debug-canvas"), world);

    init();
    setInterval(()=>{
        tick(1/60);
        world.step();
    }, 1000/60);
})
`.trim();const Ee=()=>window.innerWidth<=768;let ne={},V=null;function On(){const e=document.getElementById("examples-list");e.innerHTML="",le.forEach((o,n)=>{const a=document.createElement("li");a.className="section",a.textContent=o.name,e.appendChild(a),o.examples&&Array.isArray(o.examples)&&o.examples.forEach((s,r)=>{const c=s.key||`${n}-${r}`;ne[c]={category:n,index:r,example:s};const l=document.createElement("li");l.className="example",l.textContent=s.name,l.setAttribute("data-example",c),e.appendChild(l)})}),document.querySelectorAll("#sidebar li.example").forEach(o=>{o.addEventListener("click",()=>{document.querySelectorAll("#sidebar li.example.selected").forEach(a=>{a.classList.remove("selected")}),o.classList.add("selected");const n=o.getAttribute("data-example");pt(n,"push"),Ee()&&se.classList.add("collapsed")})})}let _,At=0,Yt=document.getElementById("example-name"),N=document.getElementById("debug-canvas"),it=document.getElementById("code-section"),Bn=document.getElementById("general-code"),Tn=document.getElementById("init-code"),Cn=document.getElementById("tick-code"),de=document.getElementById("toggle-code"),En=document.getElementById("fps"),An=document.getElementById("memory"),Rn=document.getElementById("step-time"),Rt=document.querySelectorAll(".code-tab"),Mn=document.querySelectorAll(".code-panel"),$t=document.getElementById("sidebar-toggle"),se=document.getElementById("sidebar"),jn=document.getElementById("reset-button"),Dn=document.getElementById("reset-button-mobile"),Mt=document.getElementById("info-toggle"),jt=document.getElementById("info-toggle-mobile");Yt.innerHTML="Loading example...";let z=0,rt=[],ct=[],dt=[],Ge=1e3/60,Dt=0,Lt=0;t.init().then(()=>{_=t.makeWorld(),t.debug.enableDebugGraphics(N,_);function e(){const i=performance.now(),g=i-At,d=Math.max(0,17-g);setTimeout(()=>{const y=performance.now();if(_.step(),V&&ne[V]){const C=ne[V].example;C&&typeof C.onTick=="function"&&C.onTick(_,g/1e3)}const m=(performance.now()-y)*1e3;let I=rt[z%100]??Ge,v=ct[z%100]??0,k=dt[z%100]??0;rt[z%100]=g||16.67,ct[z%100]=performance.memory.usedJSHeapSize/1048576,dt[z%100]=m,Ge+=(rt[z%100]-I)/100,Dt+=(ct[z%100]-v)/100,Lt+=(dt[z%100]-k)/100,z++;const T=Ge>0?Math.round(1e3/Ge):0;En.innerHTML=`<i class="fas fa-tachometer-alt"></i>FPS: ${T}`,An.innerHTML=`<i class="fas fa-memory"></i>Memory: ${Dt.toFixed(2)} MB`,Rn.innerHTML=`<i class="fas fa-stopwatch"></i>Step Time: ${Lt.toFixed(0)} μs`,At=i,requestAnimationFrame(e)},d)}On(),Wt(!0);const o=()=>{V&&pt(V,"none")};jn.addEventListener("click",o),Dn.addEventListener("click",o);const n=()=>{document.body.classList.toggle("info-mode");const i=document.body.classList.contains("info-mode"),g=i?"fa-th-large":"fa-info-circle",d=i?"Show Canvas":"Info";[Mt,jt].forEach(y=>{const p=y.querySelector("i"),m=y.querySelector(".button-text");p&&(p.className=`fas ${g}`),m&&(m.textContent=d),y.title=i?"Show Canvas":"Show Information"}),i||t.debug.centerCamera(5,5)};Mt.addEventListener("click",n),jt.addEventListener("click",n),e(),Ee()&&se.classList.add("collapsed"),N.addEventListener("wheel",i=>{i.preventDefault();const g=.05,d=i.offsetX,y=i.offsetY,p=(d-t.debug.offsetX)/t.debug.zoom,m=(y-t.debug.offsetY)/t.debug.zoom,I=-Math.sign(i.deltaY),v=Math.pow(1+g,I),k=Math.min(Math.max(t.debug.zoom*v,.1),10);t.debug.zoom=k,t.debug.offsetX=d-p*t.debug.zoom,t.debug.offsetY=y-m*t.debug.zoom},{passive:!1});let a=!1,s=0,r=0;N.addEventListener("mousedown",i=>{i.button===2&&(a=!0,s=i.clientX,r=i.clientY)}),window.addEventListener("mousemove",i=>{if(a){const g=i.clientX-s,d=i.clientY-r;t.debug.offsetX+=g,t.debug.offsetY+=d,s=i.clientX,r=i.clientY}}),window.addEventListener("mouseup",i=>{i.button===2&&(a=!1)}),N.addEventListener("contextmenu",i=>{i.preventDefault()});let c=0,l=!1,u=0,h=0;N.addEventListener("touchstart",i=>{if(i.touches.length===1)u=i.touches[0].clientX,h=i.touches[0].clientY,l=!1;else if(i.touches.length===2){l=!0;const g=i.touches[0].clientX-i.touches[1].clientX,d=i.touches[0].clientY-i.touches[1].clientY;c=Math.sqrt(g*g+d*d)}},{passive:!1}),N.addEventListener("touchmove",i=>{if(i.touches.length!==0){if(i.preventDefault(),i.touches.length===1&&!l){const g=i.touches[0].clientX,d=i.touches[0].clientY,y=g-u,p=d-h;t.debug.offsetX+=y,t.debug.offsetY+=p,u=g,h=d}else if(i.touches.length===2){const g=i.touches[0],d=i.touches[1],y=g.clientX-d.clientX,p=g.clientY-d.clientY,m=Math.sqrt(y*y+p*p);if(c>0){const I=m/c,v=Math.min(Math.max(t.debug.zoom*I,.1),10),k=(g.clientX+d.clientX)/2,T=(g.clientY+d.clientY)/2,C=N.getBoundingClientRect(),j=k-C.left,F=T-C.top,S=(j-t.debug.offsetX)/t.debug.zoom,L=(F-t.debug.offsetY)/t.debug.zoom;t.debug.zoom=v,t.debug.offsetX=j-S*t.debug.zoom,t.debug.offsetY=F-L*t.debug.zoom}c=m}}},{passive:!1}),N.addEventListener("touchend",i=>{i.touches.length<2&&(l=!1,c=0),i.touches.length===1&&(u=i.touches[0].clientX,h=i.touches[0].clientY)},{passive:!1}),N.addEventListener("touchcancel",i=>{l=!1,c=0},{passive:!1})});function pt(e,o="push"){if(!_||!ne[e])return;if(V&&ne[V]){const h=ne[V].example;h&&typeof h.cleanup=="function"&&h.cleanup(_)}const n="#"+e;window.location.hash!==n&&(o==="push"?history.pushState(null,"",n):o==="replace"&&history.replaceState(null,"",n)),_.clear(),t.debug.clearLabels(),t.debug.showForceVectors=!1,t.debug.showImpulseVectors=!1,_.setHasPenetrationResolution(!0),_.setHasRestitution(!0),_.setHasFriction(!0),_.setGravity(0,0),t.debug.zoom=1,t.debug.centerCamera(5,5),t.debug.showAabbs=!0,V=e;const s=ne[e].example;s&&typeof s.onInit=="function"?s.onInit(_):console.error("Example onInit method not found:",s);function r(h,i){if(!h)return`function ${i}${i==="tick"?"(dt)":"()"} {}`;let g=h.split("	").join("    ");const d=[/^\(world\)\s*=>\s*\{/,/^\(world,\s*dt\)\s*=>\s*\{/,/^function\s*\(world\)\s*\{/,/^function\s*\(world,\s*dt\)\s*\{/,/^function\s+init\s*\(world\)\s*\{/,/^function\s+tick\s*\(world,\s*dt\)\s*\{/];let y=!1,p=g.trim();for(const v of d)if(v.test(p)){g=p.replace(v,`function ${i}${i==="tick"?"(dt)":"()"} {`),y=!0;break}y||(g=p.replace(/^.*?=>\s*\{/,`function ${i}${i==="tick"?"(dt)":"()"} {`));let m=g.split(`
`);if(m.length<=1)return g;let I=1/0;for(let v=1;v<m.length;v++){const k=m[v];if(k.trim().length===0)continue;const T=k.search(/\S/);T!==-1&&T<I&&(I=T)}return I===1/0&&(I=0),m.map((v,k)=>k===0?v:v.substring(Math.min(v.length,I))).join(`
`)}let c=s.globalLines?.join(`
`)??"",l=s.onInitRaw||s.onInit?.toString()||"",u=s.onTickRaw||s.onTick?.toString()||"";Bn.textContent=kn.split("{{GLOBAL}}").join(c),Tn.textContent=r(l,"init"),Cn.textContent=r(u,"tick"),qt(),Yt.textContent=s.name||"Unknown Example",document.getElementById("description").innerHTML=on.parse(s.description||"")}function Wt(e=!1){let o=window.location.hash.substring(1);const n=!o;if(o||(o="sandbox"),!ne[o]){console.log("Example not found directly, searching...");let s=!1;for(let r=0;r<le.length;r++){const c=le[r];if(c.examples&&Array.isArray(c.examples)){for(let l=0;l<c.examples.length;l++)if(c.examples[l].key===o){console.log(`Found example ${o} in category ${r}, index ${l}`),s=!0;break}}if(s)break}if(!s)if(console.warn(`Example with key '${o}' not found, defaulting to first available example`),le.length>0&&le[0].examples&&le[0].examples.length>0)o=le[0].examples[0].key||"0-0";else{console.error("No examples found");return}}const a=document.querySelector(`#sidebar li.example[data-example="${o}"]`);a&&(document.querySelectorAll("#sidebar li.example.selected").forEach(s=>{s.classList.remove("selected")}),a.classList.add("selected")),pt(o,n&&e?"replace":"none")}Rt.forEach(e=>{e.addEventListener("click",()=>{Rt.forEach(n=>n.classList.remove("active")),Mn.forEach(n=>n.classList.remove("active")),e.classList.add("active"),document.getElementById(`${e.dataset.panel}-panel`).classList.add("active")})});function qt(){document.querySelectorAll("pre").forEach(o=>{const n=o.textContent;o.innerHTML=hljs?.highlight(n,{language:"javascript"}).value})}de.addEventListener("click",()=>{it.style.display==="none"?(it.style.display="block",de.querySelector("span").textContent="Hide Code",de.querySelector("i").classList.remove("fa-chevron-down"),de.querySelector("i").classList.add("fa-chevron-up"),qt()):(it.style.display="none",de.querySelector("span").textContent="Show Code",de.querySelector("i").classList.remove("fa-chevron-up"),de.querySelector("i").classList.add("fa-chevron-down"))});$t.addEventListener("click",()=>{se.classList.toggle("collapsed")});window.addEventListener("resize",()=>{Ee()||document.body.classList.remove("info-mode"),Ee()&&!se.classList.contains("collapsed")&&se.classList.add("collapsed")});window.addEventListener("click",e=>{Ee()&&!se.classList.contains("collapsed")&&!se.contains(e.target)&&e.target!==$t&&se.classList.add("collapsed")});const Te=document.getElementById("copy-code");Te.addEventListener("click",()=>{const o=document.querySelector(".code-panel.active").querySelector("pre").textContent;navigator.clipboard.writeText(o).then(()=>{const n=Te.querySelector("span"),a=Te.querySelector("i"),s=n.textContent;Te.classList.add("success"),n.textContent="Copied!",a.classList.remove("fa-copy"),a.classList.add("fa-check"),setTimeout(()=>{Te.classList.remove("success"),n.textContent=s,a.classList.remove("fa-check"),a.classList.add("fa-copy")},2e3)})});window.addEventListener("popstate",function(e){Wt(!1)});
