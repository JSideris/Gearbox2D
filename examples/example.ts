import { World } from 'gearbox2d';

export type OnInitCallback = (world: World) => void;
export type OnTickCallback = (world: World, dt: number) => void;
export type OnCleanupCallback = (world: World) => void;
export type OnRenderCallback = (world: World) => void;

export interface ExampleOptions {
    onInit?: OnInitCallback;
    onInitRaw?: string;
    onTick?: OnTickCallback;
    onTickRaw?: string;
    onRender?: OnRenderCallback;
    onRenderRaw?: string;
    onCleanup?: OnCleanupCallback;
    description: string;
    name: string;
    key: string;
    globalLines?: string[];
}

export default class Example {
    public onInit?: OnInitCallback;
    public onInitRaw?: string;
    public onTick?: OnTickCallback;
    public onTickRaw?: string;
    public onRender?: OnRenderCallback;
    public onRenderRaw?: string;
    public onCleanup?: OnCleanupCallback;
    public description: string;
    public name: string;
    public key: string;
    public globalLines: string[];

    constructor(options: ExampleOptions) {
        this.onInit = options.onInit;
        this.onInitRaw = options.onInitRaw;
        this.onTick = options.onTick;
        this.onTickRaw = options.onTickRaw;
        this.onRender = options.onRender;
        this.onRenderRaw = options.onRenderRaw;
        this.onCleanup = options.onCleanup;
        this.description = options.description;
        this.name = options.name;
        this.key = options.key;
        this.globalLines = options.globalLines || [];
    }

    init(world: World): void {
        this.onInit?.(world);
    }

    tick(world: World, dt: number): void {
        this.onTick?.(world, dt);
    }

    render(world: World): void {
        this.onRender?.(world);
    }

    cleanup(world: World): void {
        this.onCleanup?.(world);
    }
}
