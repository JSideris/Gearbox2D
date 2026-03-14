import { PhysicsEngineAdapter } from '../utils/physics-protocol';

export interface Scenario {
    name: string;
    setup(adapter: PhysicsEngineAdapter): void;
}

export const LargeStackScenario: Scenario = {
    name: "Large Stack (Hybrid)",
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
    }
};

export const HighDensityScenario: Scenario = {
    name: "High Density (Stress)",
    setup(adapter: PhysicsEngineAdapter) {
        adapter.clear();
        // Ground & Walls
        adapter.createBox('ground', 0, 5, 12, 1, true, { color: '#333' });
        adapter.createBox('left', -6, 0, 1, 10, true, { color: '#333' });
        adapter.createBox('right', 6, 0, 1, 10, true, { color: '#333' });
        
        for (let i = 0; i < 500; i++) {
            adapter.createCircle(`c-${i}`, (Math.random() - 0.5) * 10, -Math.random() * 10, 0.2, false, { color: '#00f2ff' });
        }
    }
};

export const NewtonsCradleScenario: Scenario = {
    name: "Newton's Cradle (Joints)",
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
    }
};

export const ConservationOfEnergyScenario: Scenario = {
    name: "Conservation of Energy",
    setup(adapter: PhysicsEngineAdapter) {
        adapter.clear();
        
        const thickness = 1;
        const width = 12;
        const height = 10;
        const color = '#333';
        
        // Container (4 fixed boxes)
        adapter.createBox('ground', 0, height/2, width, thickness, true, { color, restitution: 1.0, sFriction: 0, kFriction: 0, linearDamping: 0, angularDamping: 0 });
        adapter.createBox('ceiling', 0, -height/2, width, thickness, true, { color, restitution: 1.0, sFriction: 0, kFriction: 0, linearDamping: 0, angularDamping: 0 });
        adapter.createBox('left', -width/2, 0, thickness, height, true, { color, restitution: 1.0, sFriction: 0, kFriction: 0, linearDamping: 0, angularDamping: 0 });
        adapter.createBox('right', width/2, 0, thickness, height, true, { color, restitution: 1.0, sFriction: 0, kFriction: 0, linearDamping: 0, angularDamping: 0 });
        
        // Points dropped from max height (near ceiling)
        const nPoints = 40;
        const innerWidth = width - thickness * 2;
        const startY = -height/2 + thickness + 0.5;
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
    }
};

export const scenarios: Record<string, Scenario> = {
    'large-stack': LargeStackScenario,
    'high-density': HighDensityScenario,
    'newtons-cradle': NewtonsCradleScenario,
    'energy-conservation': ConservationOfEnergyScenario
};
