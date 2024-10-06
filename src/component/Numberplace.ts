// ナンプレ生成ロジックのクラス
export default class Numberplace {
	grid: any[][];
	originalGrid: any[][];
	SIZE: number;
	SUBGRID: number;
	randomNumbers: number[];
	rowUsed: boolean[][];
	colUsed: boolean[][];
	blockUsed: boolean[][];
	candidates: number[][][];

	constructor(size: number, subgridSize: number) {
		this.SIZE = size;
		this.SUBGRID = subgridSize;
		this.grid = this.createEmptyGrid();
		this.originalGrid = this.createEmptyGrid();
		this.randomNumbers = [...Array(this.SIZE)]
			.map((_, i) => i)
			.sort(() => Math.random() - Math.random());
		this.rowUsed = Array.from({ length: this.SIZE }, () => Array(this.SIZE + 1).fill(false));
		this.colUsed = Array.from({ length: this.SIZE }, () => Array(this.SIZE + 1).fill(false));
		this.blockUsed = Array.from({ length: this.SIZE }, () => Array(this.SIZE + 1).fill(false));
		this.candidates = Array.from({ length: this.SIZE }, () =>
			Array.from({ length: this.SIZE }, () => [])
		);
		this.initializeCandidates(); // 候補リストを初期化
	}

	// 空のグリッドを作成
	createEmptyGrid(): number[][] {
		return Array.from({ length: this.SIZE }, () => Array(this.SIZE).fill(0));
	}

	// グリッドを生成する
	generate(): boolean {
		return this.fillGrid();
	}

	// 完成盤の一部を消して問題を作る
	generatePuzzle(difficulty: string): void {
		let revealCount;
		switch (difficulty) {
			case '簡単':
				revealCount = Math.floor(this.SIZE * this.SIZE * 0.6); // 60%のマスを表示
				break;
			case '普通':
				revealCount = Math.floor(this.SIZE * this.SIZE * 0.4); // 40%のマスを表示
				break;
			case '難しい':
				revealCount = Math.floor(this.SIZE * this.SIZE * 0.2); // 20%のマスを表示
				break;
			case '白紙':
				revealCount = 0; // 全て非表示
				break;
			case '全て表示':
			default:
				revealCount = this.SIZE * this.SIZE; // 全て表示
				break;
		}

		// 完成盤をコピーし、選ばれた数だけマスを表示
		this.originalGrid = this.grid.map((row) => [...row]);
		this.grid = this.grid.map((row) => [...row]); // 元の完成盤を保存

		const allCells = [];
		for (let row of this.randomNumbers) {
			for (let col of this.randomNumbers) {
				allCells.push([row, col]);
			}
		}

		// シャッフルして一部のマスを残す
		for (let i = 0; i < this.SIZE * this.SIZE - revealCount; i++) {
			const [row, col] = allCells.splice(Math.floor(Math.random() * allCells.length), 1)[0];
			this.grid[row][col] = '';
		}
	}

	// 各マスの候補を初期化
	initializeCandidates(): void {
		for (let row of this.randomNumbers) {
			for (let col of this.randomNumbers) {
				this.updateCandidates(row, col); // 候補を初期化
			}
		}
	}

	// 候補リストを更新
	updateCandidates(row: number, col: number): void {
		if (this.grid[row][col] !== 0) return; // 既に数字がある場合はスキップ

		const candidates: number[] = [];
		for (let num = 1; num <= this.SIZE; num++) {
			if (
				!this.rowUsed[row][num] &&
				!this.colUsed[col][num] &&
				!this.blockUsed[this.getBlockIndex(row, col)][num]
			) {
				candidates.push(num);
			}
		}
		this.candidates[row][col] = candidates;
	}

	// グリッドを埋める
	fillGrid(): boolean {
		const emptyPos = this.findBestEmpty();
		if (!emptyPos) return true; // 全て埋まったら終了

		const [row, col] = emptyPos;
		const candidates = this.candidates[row][col];

		for (let num of candidates) {
			if (this.isValid(num, row, col)) {
				this.setNumber(row, col, num);
				this.propagateConstraint(row, col); // 制約伝播
				if (this.fillGrid()) return true;
				this.unsetNumber(row, col, num); // バックトラック
			}
		}

		return false;
	}

	// 候補が最も少ないマスを探す
	findBestEmpty(): [number, number] | null {
		let bestPos: [number, number] | null = null;
		let minCandidates = this.SIZE + 1;

		for (let row of this.randomNumbers) {
			for (let col of this.randomNumbers) {
				if (this.grid[row][col] === 0) {
					const candidateCount = this.candidates[row][col].length;
					if (candidateCount < minCandidates) {
						minCandidates = candidateCount;
						bestPos = [row, col];
					}
					if (minCandidates === 1) return bestPos; // 最小候補が1なら即決定
				}
			}
		}

		return bestPos;
	}

	// 数字をセット
	setNumber(row: number, col: number, num: number): void {
		this.grid[row][col] = num;
		this.rowUsed[row][num] = true;
		this.colUsed[col][num] = true;
		this.blockUsed[this.getBlockIndex(row, col)][num] = true;
	}

	// 数字を削除（バックトラック用）
	unsetNumber(row: number, col: number, num: number): void {
		this.grid[row][col] = 0;
		this.rowUsed[row][num] = false;
		this.colUsed[col][num] = false;
		this.blockUsed[this.getBlockIndex(row, col)][num] = false;
	}

	// 制約を伝播し、候補リストを更新
	propagateConstraint(row: number, col: number): void {
		for (let r of this.randomNumbers) {
			this.updateCandidates(r, col);
		}
		for (let c of this.randomNumbers) {
			this.updateCandidates(row, c);
		}
		const blockStartRow = Math.floor(row / this.SUBGRID) * this.SUBGRID;
		const blockStartCol = Math.floor(col / this.SUBGRID) * this.SUBGRID;
		for (let r = 0; r < this.SUBGRID; r++) {
			for (let c = 0; c < this.SUBGRID; c++) {
				this.updateCandidates(blockStartRow + r, blockStartCol + c);
			}
		}
	}

	// 指定された位置に数字を置けるか確認
	isValid(num: number, row: number, col: number): boolean {
		return (
			!this.rowUsed[row][num] &&
			!this.colUsed[col][num] &&
			!this.blockUsed[this.getBlockIndex(row, col)][num]
		);
	}

	// ブロックのインデックスを取得
	getBlockIndex(row: number, col: number): number {
		return Math.floor(row / this.SUBGRID) * this.SUBGRID + Math.floor(col / this.SUBGRID);
	}
}

