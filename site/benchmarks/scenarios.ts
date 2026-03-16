import { PhysicsEngineAdapter } from '../utils/physics-protocol';

export interface Scenario {
    name: string;
    setup(adapter: PhysicsEngineAdapter): void;
    getMetric(adapter: PhysicsEngineAdapter, state: any): number;
    metricLabel: string;
}

export const LargeStackScenario: Scenario = {
    name: "Large Stack",
    metricLabel: "Avg Step Time (ms)",
    setup(adapter: PhysicsEngineAdapter) {
        adapter.clear();
        // Ground
        adapter.createBox('ground', 0, 5, 20, 1, true, { color: '#333' });
        
        // Stacks
        for (let x = -4; x <= 4; x += 1.2) {
            for (let y = 0; y < 15; y++) {
                adapter.createBox(`box-${x}-${y}`, x, 4 - y * 0.6, 1, 0.5, false, { color: `hsl(${y * 20}, 70%, 50%)` });
            }
        }
    },
    getMetric(adapter, state) {
        return state.avgStepTime || 0;
    }
};

export const HighDensityScenario: Scenario = {
    name: "High Density",
    metricLabel: "Avg Step Time (ms)",
    setup(adapter: PhysicsEngineAdapter) {
        adapter.clear();
        // Ground & Walls
        adapter.createBox('ground', 0, 5, 12, 1, true, { color: '#333' });
        adapter.createBox('left', -6, 0, 1, 10, true, { color: '#333' });
        adapter.createBox('right', 6, 0, 1, 10, true, { color: '#333' });
        
        for (let i = 0; i < 500; i++) {
            adapter.createCircle(`c-${i}`, (Math.random() - 0.5) * 10, -Math.random() * 10, 0.2, false, { color: '#00f2ff' });
        }
    },
    getMetric(adapter, state) {
        return state.avgStepTime || 0;
    }
};

export const NewtonsCradleScenario: Scenario = {
    name: "Newton's Cradle",
    metricLabel: "Peak Height (2s)",
    setup(adapter: PhysicsEngineAdapter) {
        adapter.clear();
        
        const count = 5;
        const radius = 0.4;
        const startY = -2;
        const length = 4;
        
        for (let i = 0; i < count; i++) {
            const x = (i - (count - 1) / 2) * radius * 2.01;
            const anchorId = `anchor-${i}`;
            const ballId = `ball-${i}`;
            
            // Create anchor (static body)
            adapter.createBox(anchorId, x, startY, 0.2, 0.2, true, { color: '#555' });
            
            // Create ball
            // Offset the first ball to start the motion
            const ballX = (i === 0) ? x - 3 : x;
            const ballY = (i === 0) ? startY + Math.sqrt(length*length - 3*3) : startY + length;
            
            adapter.createCircle(ballId, ballX, ballY, radius, false, { 
                color: (i === 0 || i === count - 1) ? '#a855f7' : '#00f2ff',
                restitution: 1.0,
                mass: 1.0,
                sFriction: 0,
                kFriction: 0,
                linearDamping: 0,
                angularDamping: 0
            });
            
            // Connect with distance joint
            adapter.createDistanceJoint(`joint-${i}`, anchorId, ballId, {
                length: length,
                anchorA: { x: 0, y: 0 },
                anchorB: { x: 0, y: 0 }
            });
        }
    },
    getMetric(adapter, state) {
        if (!state.heightHistory) state.heightHistory = [];
        const now = performance.now();
        
        const restingY = 2; // startY + length = -2 + 4 = 2
        let frameMaxHeight = -Infinity;
        
        // Track the outer balls
        const ids = ["ball-0", "ball-4"];
        for (const id of ids) {
            const pos = adapter.getPosition(id);
            // Height relative to resting position (higher is smaller y)
            const height = restingY - pos.y;
            if (height > frameMaxHeight) frameMaxHeight = height;
        }
        
        state.heightHistory.push({ time: now, height: frameMaxHeight });
        
        // Prune older than 2s (2000ms)
        while (state.heightHistory.length > 0 && now - state.heightHistory[0].time > 2000) {
            state.heightHistory.shift();
        }
        
        // Return max in history
        let maxInWindow = -Infinity;
        for (const entry of state.heightHistory) {
            if (entry.height > maxInWindow) maxInWindow = entry.height;
        }
        
        return maxInWindow === -Infinity ? 0 : Math.max(0, maxInWindow);
    }
};

export const ConservationOfEnergyScenario: Scenario = {
    name: "Conservation of Energy",
    metricLabel: "Max Height (2s)",
    setup(adapter: PhysicsEngineAdapter) {
        adapter.clear();
        adapter.setGravity(0, 1000);
        
        const thickness = 10;
        const width = 12;
        const height = 10;
        const color = '#333';
        
        // Container (4 fixed boxes)
        adapter.createBox('ground', 0, height/2 + thickness/2, width, thickness, true, { color, restitution: 1.0, sFriction: 0, kFriction: 0, linearDamping: 0, angularDamping: 0 });
        adapter.createBox('ceiling', 0, -height/2 - thickness/2, width, thickness, true, { color, restitution: 1.0, sFriction: 0, kFriction: 0, linearDamping: 0, angularDamping: 0 });
        adapter.createBox('left', -width/2 - thickness/2, 0, thickness, height, true, { color, restitution: 1.0, sFriction: 0, kFriction: 0, linearDamping: 0, angularDamping: 0 });
        adapter.createBox('right', width/2 + thickness/2, 0, thickness, height, true, { color, restitution: 1.0, sFriction: 0, kFriction: 0, linearDamping: 0, angularDamping: 0 });
        
        // Points dropped from max height (near ceiling)
        const nPoints = 40;
        const innerWidth = width;
        const startY = -height/2 + 0.5;
        const spacing = innerWidth / (nPoints + 1);
        
        for (let i = 0; i < nPoints; i++) {
            const x = -innerWidth/2 + spacing * (i + 1);
            adapter.createPoint(`p-${i}`, x, startY, false, {
                restitution: 1.0,
                sFriction: 0,
                kFriction: 0,
                linearDamping: 0,
                angularDamping: 0,
                color: '#00f2ff'
            });
        }
    },
    getMetric(adapter, state) {
        if (!state.heightHistory) state.heightHistory = [];
        const now = performance.now();
        
        let frameMaxHeight = -Infinity;
        for (let i = 0; i < 40; i++) {
            const pos = adapter.getPosition(`p-${i}`);
            // Height is -y (higher is smaller y)
            const height = -pos.y;
            if (height > frameMaxHeight) frameMaxHeight = height;
        }
        
        state.heightHistory.push({ time: now, height: frameMaxHeight });
        
        // Prune older than 2s (2000ms)
        while (state.heightHistory.length > 0 && now - state.heightHistory[0].time > 2000) {
            state.heightHistory.shift();
        }
        
        // Return max in history
        let maxInWindow = -Infinity;
        for (const entry of state.heightHistory) {
            if (entry.height > maxInWindow) maxInWindow = entry.height;
        }
        
        return maxInWindow === -Infinity ? 0 : Math.max(0,maxInWindow);
    }
};

export const HighPressureBouncyCircleScenario: Scenario = {
    name: "High-Pressure Bouncy Circle",
    metricLabel: "Max Velocity (2s)",
    setup(adapter: PhysicsEngineAdapter) {
        adapter.clear();
        adapter.setGravity(0, 100);
        
        const thickness = 100;
        const width = 12;
        const height = 10;
        const color = '#333';
        
        // Container (4 fixed boxes)
        adapter.createBox('ground', 0, height/2 + thickness/2, width, thickness, true, { color, restitution: 1.0, sFriction: 0, kFriction: 0, linearDamping: 0, angularDamping: 0 });
        adapter.createBox('ceiling', 0, -height/2 - thickness/2, width, thickness, true, { color, restitution: 1.0, sFriction: 0, kFriction: 0, linearDamping: 0, angularDamping: 0 });
        adapter.createBox('left', -width/2 - thickness/2, 0, thickness, height, true, { color, restitution: 1.0, sFriction: 0, kFriction: 0, linearDamping: 0, angularDamping: 0 });
        adapter.createBox('right', width/2 + thickness/2, 0, thickness, height, true, { color, restitution: 1.0, sFriction: 0, kFriction: 0, linearDamping: 0, angularDamping: 0 });
        
        // Bouncy circle with initial downward push
        adapter.createCircle('bouncy-circle', 0, 0, 0.5, false, {
            restitution: 1.0,
            sFriction: 0,
            kFriction: 0,
            linearDamping: 0,
            angularDamping: 0,
            vx: 500,
            vy: 2000, // Strong downward push
            color: '#00f2ff'
        });
    },
    getMetric(adapter, state) {
        if (!state.velocityHistory) state.velocityHistory = [];
        const now = performance.now();
        
        const pos = adapter.getPosition('bouncy-circle');
        const width = 12;
        const height = 10;
        const margin = 2;
        
        // If the circle escapes the enclosure, interpret max velocity as 0
        if (Math.abs(pos.x) > width / 2 + margin || Math.abs(pos.y) > height / 2 + margin) {
            state.velocityHistory = []; // Clear history if escaped
            return 0;
        }

        const vel = adapter.getVelocity('bouncy-circle');
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        
        state.velocityHistory.push({ time: now, speed });
        
        // Prune older than 2s (2000ms)
        while (state.velocityHistory.length > 0 && now - state.velocityHistory[0].time > 2000) {
            state.velocityHistory.shift();
        }
        
        // Return max in history
        let maxInWindow = -Infinity;
        for (const entry of state.velocityHistory) {
            if (entry.speed > maxInWindow) maxInWindow = entry.speed;
        }
        
        return maxInWindow === -Infinity ? 0 : Math.max(0, maxInWindow);
    }
};

export const HeavyOnLightStackScenario: Scenario = {
    name: "Heavy-on-Light Stack",
    metricLabel: "Total Jitter (px)",
    setup(adapter: PhysicsEngineAdapter) {
        adapter.clear();
        adapter.setGravity(0, 9.81);
        
        // Ground
        adapter.createBox('ground', 0, 5, 100, 1, true, { color: '#333' });
        
        const count = 10;
        const boxWidth = 1.0;
        const boxHeight = 0.6;
        
        // Stack of light boxes
        for (let y = 0; y < count - 1; y++) {
            adapter.createBox(`box-${y}`, 0, 4 - y * boxHeight, boxWidth, boxHeight, false, { 
                mass: 1.0,
                color: `hsl(${y * 36}, 70%, 50%)` 
            });
        }
        
        // Heavy box on top
        adapter.createBox(`box-${count - 1}`, 0, 4 - (count - 1) * boxHeight, boxWidth, boxHeight, false, { 
            mass: 100.0, // 100x heavier
            color: '#ff0000' 
        });
    },
    getMetric(adapter, state) {
        if (state.totalDisplacement === undefined) state.totalDisplacement = 0;
        if (!state.lastPositions) state.lastPositions = {};

        const count = 10;
        for (let i = 0; i < count; i++) {
            const id = `box-${i}`;
            const pos = adapter.getPosition(id);
            if (state.lastPositions[id]) {
                const dx = pos.x - state.lastPositions[id].x;
                const dy = pos.y - state.lastPositions[id].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                // Accumulate movement as a measure of jitter/instability
                state.totalDisplacement += dist;
            }
            state.lastPositions[id] = pos;
        }
        return state.totalDisplacement;
    }
};

export const RagdollScenario: Scenario = {
    name: "Ragdoll Stress Test",
    metricLabel: "Avg Step Time (ms)",
    setup(adapter: PhysicsEngineAdapter) {
        adapter.clear();
        adapter.setGravity(0, 10);
        
        // Ground
        adapter.createBox('ground', 0, 4, 20, 1, true, { color: '#444' });

        let nextId = 1;
        const createRagdoll = (cx: number, cy: number) => {
            const headId = `head-${nextId}`;
            const torsoId = `torso-${nextId}`;
            const currentId = nextId;
            nextId++;

            // Head
            adapter.createCircle(headId, cx, cy - 1.5, 0.3, false, { mass: 1.0, color: "#fed7aa" });
            // Torso
            adapter.createBox(torsoId, cx, cy, 0.6, 1.0, false, { mass: 2.0, color: "#93c5fd" });

            // Arms and Legs segments
            const createLimb = (x: number, y: number, w: number, h: number, color: string, name: string) => {
                const id = `${name}-${currentId}-${nextId++}`;
                adapter.createBox(id, x, y, w, h, false, { mass: 0.5, color });
                return id;
            };

            const lUpperArm = createLimb(cx - 0.6, cy - 0.3, 0.5, 0.2, "#fed7aa", "lua");
            const lLowerArm = createLimb(cx - 1.1, cy - 0.3, 0.5, 0.2, "#fed7aa", "lla");
            const rUpperArm = createLimb(cx + 0.6, cy - 0.3, 0.5, 0.2, "#fed7aa", "rua");
            const rLowerArm = createLimb(cx + 1.1, cy - 0.3, 0.5, 0.2, "#fed7aa", "rla");

            const lUpperLeg = createLimb(cx - 0.2, cy + 0.8, 0.2, 0.6, "#1e3a8a", "lul");
            const lLowerLeg = createLimb(cx - 0.2, cy + 1.5, 0.2, 0.6, "#fed7aa", "lll");
            const rUpperLeg = createLimb(cx + 0.2, cy + 0.8, 0.2, 0.6, "#1e3a8a", "rul");
            const rLowerLeg = createLimb(cx + 0.2, cy + 1.5, 0.2, 0.6, "#fed7aa", "rll");

            // Joint them up
            adapter.createHingeJoint(`h-head-${currentId}`, headId, torsoId, { worldAnchor: { x: cx, y: cy - 1.0 } });
            
            adapter.createHingeJoint(`h-lua-${currentId}`, torsoId, lUpperArm, { worldAnchor: { x: cx - 0.3, y: cy - 0.3 } });
            adapter.createHingeJoint(`h-lla-${currentId}`, lUpperArm, lLowerArm, { worldAnchor: { x: cx - 0.85, y: cy - 0.3 } });
            
            adapter.createHingeJoint(`h-rua-${currentId}`, torsoId, rUpperArm, { worldAnchor: { x: cx + 0.3, y: cy - 0.3 } });
            adapter.createHingeJoint(`h-rla-${currentId}`, rUpperArm, rLowerArm, { worldAnchor: { x: cx + 0.85, y: cy - 0.3 } });

            adapter.createHingeJoint(`h-lul-${currentId}`, torsoId, lUpperLeg, { worldAnchor: { x: cx - 0.2, y: cy + 0.5 } });
            adapter.createHingeJoint(`h-lll-${currentId}`, lUpperLeg, lLowerLeg, { worldAnchor: { x: cx - 0.2, y: cy + 1.15 } });

            adapter.createHingeJoint(`h-rul-${currentId}`, torsoId, rUpperLeg, { worldAnchor: { x: cx + 0.2, y: cy + 0.5 } });
            adapter.createHingeJoint(`h-rll-${currentId}`, rUpperLeg, rLowerLeg, { worldAnchor: { x: cx + 0.2, y: cy + 1.15 } });
        };

        // Spawn a grid of ragdolls
        for (let x = -5; x <= 5; x += 2.5) {
            for (let y = -9; y <= -2; y += 3) {
                createRagdoll(x, y);
            }
        }
    },
    getMetric(adapter, state) {
        return state.avgStepTime || 0;
    }
};

export const scenarios: Record<string, Scenario> = {
    'large-stack': LargeStackScenario,
    'high-density': HighDensityScenario,
    'newtons-cradle': NewtonsCradleScenario,
    'energy-conservation': ConservationOfEnergyScenario,
    'bouncy-circle': HighPressureBouncyCircleScenario,
    'heavy-on-light': HeavyOnLightStackScenario,
    'ragdoll': RagdollScenario
};
