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

export const scenarios: Record<string, Scenario> = {
    'large-stack': LargeStackScenario,
    'high-density': HighDensityScenario,
    'newtons-cradle': NewtonsCradleScenario,
    'energy-conservation': ConservationOfEnergyScenario,
    'bouncy-circle': HighPressureBouncyCircleScenario,
    'heavy-on-light': HeavyOnLightStackScenario
};
