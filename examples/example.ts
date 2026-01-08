import { World } from 'gb2d';

export type OnInitCallback = (world: World) => void;
export type OnTickCallback = (world: World, dt: number) => void;

export interface ExampleOptions {
    onInit?: OnInitCallback;
    onTick?: OnTickCallback;
    description: string;
    name: string;
    key: string;
    globalLines?: string[];
}

export default class Example {
    public onInit?: OnInitCallback;
    public onTick?: OnTickCallback;
    public description: string;
    public name: string;
    public key: string;
    public globalLines: string[];

    constructor(options: ExampleOptions) {
        this.onInit = options.onInit;
        this.onTick = options.onTick;
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
}
