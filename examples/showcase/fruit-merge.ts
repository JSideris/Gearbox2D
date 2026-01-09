import Example from '../example.js';
import gb2d from 'gb2d';

let nextId = 1;
let canvas: HTMLCanvasElement | null = null;

// Fruit Definitions
const FRUIT_LEVELS = [
    { name: "Cherry", radius: 0.15, mass: 0.1, color: "#ff4444", score: 1 },
    { name: "Strawberry", radius: 0.22, mass: 0.2, color: "#ff6666", score: 3 },
    { name: "Grape", radius: 0.28, mass: 0.3, color: "#9933ff", score: 6 },
    { name: "Dekopon", radius: 0.35, mass: 0.4, color: "#ff9933", score: 10 },
    { name: "Persimmon", radius: 0.42, mass: 0.5, color: "#ff6600", score: 15 },
    { name: "Apple", radius: 0.50, mass: 0.7, color: "#cc0000", score: 21 },
    { name: "Pear", radius: 0.58, mass: 0.9, color: "#ffff66", score: 28 },
    { name: "Peach", radius: 0.68, mass: 1.2, color: "#ff99cc", score: 36 },
    { name: "Pineapple", radius: 0.80, mass: 1.6, color: "#ffff00", score: 45 },
    { name: "Melon", radius: 0.95, mass: 2.2, color: "#99ff33", score: 55 },
    { name: "Watermelon", radius: 1.15, mass: 3.0, color: "#006600", score: 66 },
];

// Game State
let gameState = {
    score: 0,
    nextFruitLevel: 0,
    isGameOver: false,
    lastDropTime: 0,
    dropCooldown: 500, // ms
    mouseX: 5,
    fruitIds: new Map<number, number>(), // id -> level
    mergingIds: new Set<number>(), // Prevents multiple merges in one frame
    previewFruit: null as any,
};

const resetGameState = () => {
    gameState.score = 0;
    gameState.nextFruitLevel = Math.floor(Math.random() * 5); // Only small fruits at start
    gameState.isGameOver = false;
    gameState.lastDropTime = 0;
    gameState.mouseX = 5;
    gameState.fruitIds.clear();
    gameState.mergingIds.clear();
    gameState.previewFruit = null;
    nextId = 1;
};

const screenToWorldX = (x: number) => {
    return (x - gb2d.debug.offsetX) / (gb2d.debug.zoom * 100);
};

export const fruitMergeExample = new Example({
    name: "Fruit Merge",
    key: "fruit-merge",
    description: [
        "A physics-based arcade game demonstrating dynamic object spawning and collision events.",
        "Drop fruits into the bucket. Identical fruits will **merge** into the next larger fruit tier on contact.",
        "### Controls",
        "- **Mouse Move**: Position the preview fruit",
        "- **Click**: Drop fruit",
        "**Game Over** occurs if any fruit falls out of the world boundaries."
    ].join("\n\n"),
    onInit: (world) => {
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
    },

    onTick: (world, dt) => {
        gb2d.debug.clearLabels();

        if (gameState.isGameOver) {
            gb2d.debug.addLabel({ text: "GAME OVER", x: 5, y: 4, fontSize: "48px Arial", color: "#ff4444", position: "on-top" });
            gb2d.debug.addLabel({ text: `Final Score: ${gameState.score}`, x: 5, y: 5, fontSize: "24px Arial", color: "#fff", position: "on-top" });
            gb2d.debug.addLabel({ text: "Click to Restart", x: 5, y: 6, fontSize: "20px Arial", color: "#888", position: "on-top" });
            return;
        }

        // Draw Score
        gb2d.debug.addLabel({ text: `Score: ${gameState.score}`, x: 0.5, y: 0.5, fontSize: "24px Arial", color: "#fff", textAlign: "left" });

        // Draw Next Fruit Preview
        const nextFruit = FRUIT_LEVELS[gameState.nextFruitLevel];
        gb2d.debug.addLabel({ text: `Next: ${nextFruit.name}`, x: 8.0, y: 0.5, fontSize: "18px Arial", color: nextFruit.color, textAlign: "right" });

        // Draw Drop Guide / Preview
        const previewY = 1.5;
        gb2d.debug.addLabel({ 
            text: "●", 
            x: gameState.mouseX, 
            y: previewY, 
            fontSize: `${nextFruit.radius * 200}px Arial`, 
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
    },

    onCleanup: (world) => {
        if (canvas) {
            canvas.removeEventListener('mousemove', (world as any)._onMouseMove);
            canvas.removeEventListener('click', (world as any)._onClick);
            delete (world as any)._onMouseMove;
            delete (world as any)._onClick;
        }
    }
});

