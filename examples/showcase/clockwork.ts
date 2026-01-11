import Example from '../example.js';
import gb2d from 'gb2d';

let nextId = 1;
let secondHand = null;
let minuteHand = null;
let hourHand = null;
let pendulum = null;

export const clockworkExample = new Example({
    name: "Mechanical Clockwork",
    key: "clockwork",
    description: [
        "A physically regulated mechanical clock. This version uses a **Grashof-compliant Crank-Rocker** mechanism to ensure continuous rotation.",
        "### Features",
        "- **Regulated Motion**: A 2.0m pendulum defines a 9-second period in low gravity (1.0 m/s²).",
        "- **Grashof Linkage**: Precision geometry allows the drive gear to complete full 360° rotations.",
        "- **Mainspring Power**: A tensioned `SpringJoint` drives the escapement, physically limited by the pendulum.",
        "- **Multi-stage Reduction**: 7 `GearJoint` stages step down the escapement's motion to hours and minutes.",
        "- **Real-time Sync**: The hands and gear train initialize to your local system time."
    ].join("\n\n"),
    onInit: (world) => {
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
        gui.style = `position:fixed;top:20px;right:20px;width:280px;background:rgba(0,0,0,0.85);color:#0f0;padding:15px;border-radius:8px;font-family:monospace;z-index:1000;box-shadow:0 4px 15px rgba(0,0,0,0.5);font-size:12px;border:1px solid #333;`;
        
        if (isLocal) {
            document.body.appendChild(gui);
        }

        const scoreDisplay = document.createElement('div');
        scoreDisplay.style = `margin:15px 0;padding:10px;border:1px solid #0f0;text-align:center;font-size:16px;font-weight:bold;`;
        scoreDisplay.textContent = 'Score: 0';
        gui.appendChild(scoreDisplay);

        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Export to Console';
        exportBtn.style = `width:100%;padding:8px;background:#0f0;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;margin-bottom:5px;`;
        exportBtn.onclick = () => console.log("Final Parameters:", JSON.stringify(p, null, 4));
        gui.appendChild(exportBtn);

        const optimizeBtn = document.createElement('button');
        optimizeBtn.textContent = 'Start Auto-Optimize';
        optimizeBtn.style = `width:100%;padding:8px;background:#444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;`;
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
        optStatus.style = `margin-top:10px;font-size:10px;color:#aaa;`;
        optStatus.textContent = 'Optimizer: Idle';
        gui.appendChild(optStatus);

        const sliders = {};
        const createSlider = (label, key, min, max, step) => {
            const container = document.createElement('div');
            container.style.marginBottom = '10px';
            const labelEl = document.createElement('div');
            labelEl.textContent = `${label}: ${p[key].toFixed(2)}`;
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = min;
            slider.max = max;
            slider.step = step;
            slider.value = p[key];
            slider.style.width = '100%';
            slider.oninput = () => {
                p[key] = parseFloat(slider.value);
                labelEl.textContent = `${label}: ${p[key].toFixed(2)}`;
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
                s.labelEl.textContent = `${s.label}: ${p[key].toFixed(2)}`;
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
    },
    onTick: (world, dt) => {
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

            s.scoreDisplay.textContent = `Recent Score (5s): ${Math.floor(score)}`;

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
                            s.optStatus.textContent = `Optimizer: Improved ${keys[s.optParamIndex]} (Score: ${Math.floor(score)})`;
                            console.log(`Optimizer: Found improvement! New best score: ${Math.floor(score)}`);
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
                                    console.log(`Optimizer: No improvements this cycle. Shrinking epsilon to ${s.epsilon.toFixed(4)}`);
                                }
                                s.improvedThisCycle = false;
                            }
                        }

                        // Apply next tweak
                        s.params[keys[s.optParamIndex]] += s.epsilon * s.optDirection;
                        s.updateSimulation();
                        s.updateSliderUI(keys[s.optParamIndex]);
                        
                        s.evalTimer = now + windowSize;
                        s.optStatus.textContent = `Opt: Testing ${keys[s.optParamIndex]} (${s.optDirection > 0 ? '+' : '-'}) eps=${s.epsilon.toFixed(4)}`;
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
            gb2d.debug.addLabel({ text: `Pendulum: ${angle}°`, x: 8, y: 8, fontSize: "16px Arial", color: "#cd853f", position: "on-top" });
        }
    },
    onCleanup: (world) => {
        const gui = document.getElementById('clock-tuner-gui');
        if (gui) gui.remove();
    }
});

