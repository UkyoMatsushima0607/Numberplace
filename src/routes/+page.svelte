<script lang="ts">
	import Numberplace from '../component/Numberplace';

	// 選択されたセルのインデックスを管理するストア
	let selectedRow: number | null = null;
	let selectedCol: number | null = null;

	// 盤の大きさ（初期値は3x3のブロックで、9x9）
	let blockSize: number = 3;
	let boardSize: number = blockSize * blockSize;

	// 盤の大きさとブロックサイズを管理
	let selectedBlockSize: number = blockSize;
	let selectedBoardSize: number = boardSize;

	// 初期化
	let numberplace: Numberplace | null = null;
	let grid: number[][] = Array(selectedBoardSize)
		.fill(null)
		.map(() => Array(selectedBoardSize).fill(null));
	let difficulty = '普通';

	// セルをクリックしたときの処理
	function handleCellClick(row: number | null, col: number | null): void {
		selectedRow = row;
		selectedCol = col;
	}

	// カーソルがホバーしたら十字の影をつける
	let hoverCell: boolean[][] = Array(selectedBoardSize)
		.fill(false)
		.map(() => Array(selectedBoardSize).fill(false));
	function hoverGrid(rowIndex: number | null = null, colIndex: number | null = null) {
		hoverCell = hoverCell.map((row) => row.fill(false));

		if (rowIndex !== null && colIndex !== null) {
			hoverCell[rowIndex] = Array(selectedBoardSize).fill(true);
			hoverCell.forEach((e) => {
				e[colIndex] = true;
			});
		}
	}

	let violationGrid: boolean[][] = Array.from({ length: selectedBoardSize }, () =>
		Array(selectedBoardSize).fill(false)
	);

	// 盤面に入力したらルールを満たしているか確認する
	function checkViolation(row: number, col: number): void {
		const integerRegex = /^-?\d+$/;
		if (typeof grid[row][col] === 'string' && integerRegex.test(grid[row][col])) {
			grid[row][col] = Number(grid[row][col]);
		}

		violationGrid.map((row) => row.fill(false));
		const value = grid[row][col];

		// 入力がない（空白または0）場合はチェックをスキップ
		if (!value) {
			violationGrid[row][col] = false;
			return;
		}

		// 重複チェックのための変数
		let hasViolation = false;

		// 違反がある場合、背景色を赤にするためにフラグを立てる
		// 同じ行内で重複していないかを確認
		for (let c = 0; c < selectedBoardSize; c++) {
			if (c !== col && grid[row][c] === value) {
				violationGrid[row][c] = true;
				hasViolation = true;
			}
		}

		// 同じ列内で重複していないかを確認
		for (let r = 0; r < selectedBoardSize; r++) {
			if (r !== row && grid[r][col] === value) {
				violationGrid[r][col] = true;
				hasViolation = true;
			}
		}

		// 同じブロック内で重複していないかを確認
		const blockStartRow = Math.floor(row / selectedBlockSize) * selectedBlockSize;
		const blockStartCol = Math.floor(col / selectedBlockSize) * selectedBlockSize;
		for (let r = blockStartRow; r < blockStartRow + selectedBlockSize; r++) {
			for (let c = blockStartCol; c < blockStartCol + selectedBlockSize; c++) {
				if ((r !== row || c !== col) && grid[r][c] === value) {
					violationGrid[r][c] = true;
					hasViolation = true;
				}
			}
		}

		if (hasViolation) {
			violationGrid[row][col] = true;
		}
	}

	// ナンプレを生成する関数
	function generateNumberplace(): void {
		selectedBlockSize = Number(blockSize);
		selectedBoardSize = selectedBlockSize * selectedBlockSize;
		numberplace = new Numberplace(selectedBoardSize, selectedBlockSize); // ユーザーが選んだ大きさのナンプレ

		hoverCell = Array(selectedBoardSize)
			.fill(false)
			.map(() => Array(selectedBoardSize).fill(false));
		violationGrid = Array(selectedBoardSize)
			.fill(false)
			.map(() => Array(selectedBoardSize).fill(false));

		handleCellClick(null, null);

		let success = numberplace.generate();
		let attempts = 0; // 生成試行回数をカウント
		const maxAttempts = 3; // 最大試行回数
		while (!success && attempts < maxAttempts) {
			success = numberplace.generate();
			attempts++;
		}

		if (success) {
			numberplace.generatePuzzle(difficulty);
			grid = numberplace.grid;
		} else {
			alert('盤面の作成に失敗しました。');
		}
	}
</script>

<!-- UI部分 -->
<div class="main">
	<table class="settings">
		<tbody>
			<tr>
				<td>
					<div>
						<label for="difficulty">難易度を選択</label>
					</div>
					<div>
						<select id="difficulty" bind:value={difficulty}>
							<option value="全て表示">全て表示</option>
							<option value="簡単">簡単</option>
							<option value="普通" selected>普通</option>
							<option value="難しい">難しい</option>
							<option value="白紙">白紙</option>
						</select>
					</div>
				</td>
			</tr>
			<tr>
				<td>
					<div>
						<label for="blockSize">盤の大きさを選択</label>
					</div>
					<div>
						<select id="blockSize" bind:value={blockSize}>
							<option value="3" selected>3x3のブロック (9x9盤面)</option>
							<option value="4">4x4のブロック (16x16盤面)</option>
							<option value="5">5x5のブロック (25x25盤面)</option>
						</select>
					</div>
				</td>
			</tr>
			<tr>
				<td>
					<button on:click={generateNumberplace}>盤面を作成する</button>
				</td>
			</tr>
			<tr
				class:d-none={!grid.every((row) => row.every((value) => Number.isInteger(value))) ||
					!violationGrid.every((row) => row.every((value) => value === false))}
			>
				<td>
					<div class="gaming">Game Clear!</div>
				</td>
			</tr>
		</tbody>
	</table>

	<table
		class="grid"
		style="--boardSize: {selectedBoardSize}"
		on:mouseleave={() => {
			hoverCell = hoverCell.map((row) => row.fill(false));
		}}
	>
		<tbody>
			{#each grid as row, rowIndex}
				<tr>
					{#each row as cell, colIndex}
						<td
							class="cell"
							class:row-boundary={rowIndex < selectedBoardSize - selectedBlockSize + 1 &&
								rowIndex % selectedBlockSize === selectedBlockSize - 1}
							class:col-boundary={colIndex < selectedBoardSize - selectedBlockSize + 1 &&
								colIndex % selectedBlockSize === selectedBlockSize - 1}
						>
							<input
								type="text"
								class="handle"
								class:cross={hoverCell[rowIndex][colIndex]}
								class:selected={selectedRow === rowIndex && selectedCol === colIndex}
								class:error={violationGrid[rowIndex][colIndex]}
								on:click={() => handleCellClick(rowIndex, colIndex)}
								on:mouseenter={() => {
									hoverGrid(rowIndex, colIndex);
								}}
								bind:value={grid[rowIndex][colIndex]}
								on:change={() => checkViolation(rowIndex, colIndex)}
							/>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.main {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-top: 1rem;
	}

	table.settings {
		height: fit-content;
	}
	table.settings tbody tr td {
		padding: 0.5rem 0 0.5rem 0;
		border-top: 1px solid whitesmoke;
	}

	table.grid {
		border-collapse: collapse;
		border-spacing: 0;
	}
	table.grid tbody tr:nth-child(odd) td:nth-child(odd),
	table.grid tbody tr:nth-child(even) td:nth-child(even) {
		background-color: white;
	}
	table.grid tbody tr:nth-child(odd) td:nth-child(even),
	table.grid tbody tr:nth-child(even) td:nth-child(odd) {
		background-color: whitesmoke;
	}
	table.grid tbody tr td.row-boundary {
		border-bottom: 2px solid darkgray !important;
	}
	table.grid tbody tr td.col-boundary {
		border-right: 2px solid darkgray !important;
	}

	.cell {
		width: 34px;
		height: 34px;
		text-align: center;
		vertical-align: middle;
		border: 1px solid #ddd;
		padding: 0;
	}
	.error {
		background-color: #ffcccc !important;
	}
	.handle {
		width: 100%;
		height: 100%;
		font-size: 1rem;
		background-color: inherit;
		padding: 0;
		border: 0;
		cursor: pointer;
		text-align: center;
	}
	.cross {
		background-color: beige;
	}
	.selected {
		background-color: lightblue;
	}

	.d-none {
		display: none;
	}
	.gaming {
		color: transparent;
		font-weight: bold;
		background-clip: text;
		background-image: linear-gradient(45deg, red, orange, yellow, green, aqua, blue, purple);
		background-size: 1200%;
		animation: 3s linear 0s infinite alternate slide;
	}

	@keyframes slide {
		from {
			background-position: 0% 0%;
		}
		to {
			background-position: 100% 0%;
		} /* 右から左へ移動するアニメーション */
	}
</style>
