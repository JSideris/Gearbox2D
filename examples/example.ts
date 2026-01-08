

export default class Example{
	/**
	 * @param {object} options - Constructor options.
	 * @param {OnInitCallback} [options.onInit] - Optional. Called when the example is initialized.
	 * @param {OnTickCallback} [options.onTick] - Optional. Called on each simulation tick.
	 * @param {string} options.description - A description of the example.
	 * @param {string} options.name - The display name of the example.
	 * @param {string} options.key - A unique key for the example (e.g., for URLs).
	 * @param {string[]} [options.globalLines] - Optional. Lines of code to be executed in the global scope for this example.
	 */
	constructor({
		onInit, 
		onTick, 
		description, 
		name, 
		key, 
		globalLines
	}){
		/** @type {OnInitCallback|undefined} */
		this.onInit = onInit;
		/** @type {OnTickCallback|undefined} */
		this.onTick = onTick;
		/** @type {string} */
		this.description = description;
		/** @type {string} */
		this.name = name;
		/** @type {string} */
		this.key = key;
		/** @type {string[]} */
		this.globalLines = globalLines || [];
	}

	/**
	 * @function
	 * @param {gb2d.World} world
	 */
	init(world){
		if(this.onInit) this.onInit(world);
	}

	/**
	 * @function
	 * @param {gb2d.World} world
	 * @param {number} dt
	 */
	tick(world, dt){
		if(this.onTick) this.onTick(world, dt);
	}
}