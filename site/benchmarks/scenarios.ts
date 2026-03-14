import { PhysicsEngineAdapter } from '../utils/physics-protocol.ts';

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

export const scenarios: Record<string, Scenario> = {
    'large-stack': LargeStackScenario,
    'high-density': HighDensityScenario
};
