/**
 * BufferView provides a way to access a typed array with a fixed stride.
 * It encapsulates the (index * stride) + offset calculation.
 */
export class BufferView<T extends Float32Array | Int32Array> {
	constructor(
		public data: T,
		public readonly stride: number,
	) {}

	protected getIndexOffset(index: number, offset: number): number {
		return offset * this.stride + index;
	}

	get(index: number, offset: number): number {
		return this.data[this.getIndexOffset(index, offset)];
	}

	set(index: number, offset: number, value: number): void {
		this.data[this.getIndexOffset(index, offset)] = value;
	}

	add(index: number, offset: number, value: number): void {
		this.data[this.getIndexOffset(index, offset)] += value;
	}
}

/**
 * RowView provides a view into a single "row" (object) within a BufferView.
 * It uses a getter for index and data to ensure it stays in sync if they change.
 */
export class RowView<T extends Float32Array | Int32Array> {
	constructor(
		private getBuffer: () => T,
		private readonly stride: number,
		private getIndex: () => number,
	) {}

	private getIndexOffset(offset: number): number {
		return offset * this.stride + this.getIndex();
	}

	get(offset: number): number {
		return this.getBuffer()[this.getIndexOffset(offset)];
	}

	set(offset: number, value: number): void {
		this.getBuffer()[this.getIndexOffset(offset)] = value;
	}

	add(offset: number, value: number): void {
		this.getBuffer()[this.getIndexOffset(offset)] += value;
	}
}
