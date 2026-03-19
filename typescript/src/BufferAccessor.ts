/**
 * BufferView provides a way to access a typed array with a fixed stride.
 * It encapsulates the (index * stride) + offset calculation.
 */
export class BufferView<T extends Float32Array | Int32Array> {
	constructor(
		public data: T,
		public stride: number,
	) {}

	get(index: number, offset: number): number {
		return this.data[index * this.stride + offset];
	}

	set(index: number, offset: number, value: number): void {
		this.data[index * this.stride + offset] = value;
	}

	add(index: number, offset: number, value: number): void {
		this.data[index * this.stride + offset] += value;
	}
}

/**
 * RowView provides a view into a single "row" (object) within a BufferView.
 * It uses a getter for index and data to ensure it stays in sync if they change.
 */
export class RowView<T extends Float32Array | Int32Array> {
	constructor(
		private getBuffer: () => T,
		private stride: number,
		private getIndex: () => number,
	) {}

	get(offset: number): number {
		return this.getBuffer()[this.getIndex() * this.stride + offset];
	}

	set(offset: number, value: number): void {
		this.getBuffer()[this.getIndex() * this.stride + offset] = value;
	}

	add(offset: number, value: number): void {
		this.getBuffer()[this.getIndex() * this.stride + offset] += value;
	}
}
