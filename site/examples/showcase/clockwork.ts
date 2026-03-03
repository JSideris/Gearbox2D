import Example from '../engine-wrapper.js';
import gearbox from 'gearbox2d';

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
        "- **Kinematic Drive**: The escapement gear is driven at a fixed rotation speed to ensure perfect timekeeping.",
        "- **Multi-stage Reduction**: 7 `GearJoint` stages step down the escapement's motion to hours and minutes.",
        "- **Real-time Sync**: The hands and gear train initialize to your local system time."
    ].join("\n\n"),
    onInit: (world) => {
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
    },
    onTick: (world, dt) => {
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

            s.scoreDisplay.textContent = `Score: ${Math.floor(score)} | Amp: ${amplitude.toFixed(2)} | Jit: ${Math.max(0, s.rsSignChanges - 2)}${!s.hasCrossedZero ? ' [STUCK]' : ''}`;

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
                            s.optStatus.textContent = `Improved ${keys[s.optParamIndex]} (Best: ${Math.floor(score)})`;
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
                        s.optStatus.textContent = `Testing ${keys[s.optParamIndex]} (${s.optDirection > 0 ? '+' : '-'}) Best: ${Math.floor(s.bestScore)}`;
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
            gearbox.debug.addLabel({ text: `Pendulum: ${angle}°`, x: 8, y: 8, fontSize: "16px Arial", color: "#cd853f", position: "on-top" });
        }
    },
    onCleanup: (world) => {
        const gui = document.getElementById('clock-tuner-gui');
        if (gui) gui.remove();
    }
});

