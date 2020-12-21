<script>
`
	1.Board of N*M size.
	2.Array for each piece -> 1's and O's and a color.
	3.Tick timer to simulate "gravity", with a random generation function
	3.5 "Indispensable Rules?" -> no S or Z 4 times in a row.
	4.Implement fast drop, rotation, and controls.
	5.Points system -> single line clear: 100
	                   four line (Tetris): 800
	                   b2b Tetris's : 1200


	Functions needed:
	Random piece,
	Remove full row, -> if its full, all the rows above it drop 1
	"Gravity, Rotation and mechanics"
`
	//--------------     Pieces     ----------------//
	let i = [
		[0, 0, 0, 0],
		[1, 1, 1, 1],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
	];
	let o = [
		[1, 1],
		[1, 1],
	];
	let t = [
		[0, 1, 0],
		[1, 1, 1],
		[0, 0, 0],
	];
	let s =  [
		[0, 1, 1],
		[1, 1, 0],
		[0, 0, 0],
	];
	let z =  [
		[1, 1, 0],
		[0, 1, 1],
		[0, 0, 0],
	]
	let j =  [
		[1, 0, 0],
		[1, 1, 1],
		[0, 0, 0],
	]
	let l =  [
		[0, 0, 1],
		[1, 1, 1],
		[0, 0, 0],
	]
	//-------------- Initialisation ----------------//
	let gameOver = false;
	let board = [[]]

	const pieces = [i , o , t , s , z , j , l]

	function generateBoard(board , m , n) {
		for (let i = 0; i < n ; ++i) {
			board[i] = []
			for (let j = 0; j < m ; ++j) {
				board[i][j] = 0;
			}
		}
		return board;
	}

	function generatePiece() {
		let r = pieces[Math.floor(Math.random() * pieces.length)];
		return r;
	}

	let currentPiece = generatePiece();
	let currentPos = [5,4];
	board = generateBoard(board , 10 , 20 );

	function drawPiece(currentPos, currentPiece) {
		[x , y] = currentPos;
		for (let i = 0; i < currentPiece.length; i++) {
			board[x][y] = currentPiece[i][i];
		}
		return board;
	}
	drawPiece(currentPos , currentPiece);


</script>

<main>
	<h1 class="game-container">Shitty Tetris</h1>
	<div class="game-container">
		<div>
			{#each board as row, i}
				<div class="row">
					{#each row as cell , j}
							{#if board[i][j] === 0}
								<div class="cell empty "></div>
							{:else}
								<div class="cell full"></div>
							{/if}
					{/each}
				</div>
			{/each}
		</div>
	</div>
</main>

<style>

	h1 {
		color: #ffffff;
		font-size: 4em;
		font-weight: 600;
	}


	.game-container {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.row {
		display: flex;
		box-shadow: 2px 0px 25px 0px rgba(0,0,0,0.55);
		-webkit-box-shadow: 2px 0px 25px 0px rgba(0,0,0,0.55);
		-moz-box-shadow: 2px 0px 25px 0px rgba(0, 0, 0, 0.55);
	}
	.cell {
		width: 20px;
		height: 20px;
		border: solid 1px #131313;;
		border-radius: 15%;
	}
	.empty {
		background-color: #373737;
	}
	.full {
		background-color: white;
	}







	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

</style>