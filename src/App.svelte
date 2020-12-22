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
import {onMount} from 'svelte';
//--------------     Pieces     ----------------//
	let i =
		[
			[0, 0, 0, 0],
			[1, 1, 1, 1],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
		];
	let o = [
		[2, 2],
		[2, 2],
	];
	let t =
		[
			[0, 3, 0],
			[3, 3, 3],
			[0, 0, 0]
		];

	let s =
		[
			[0, 4, 4],
			[4, 4, 0],
			[0, 0, 0]
		];

	let z =
		[
			[5, 5, 0],
			[0, 5, 5],
			[0, 0, 0]
		];

	let j =
		[
			[6, 0, 0],
			[6, 6, 6],
			[0, 0, 0]
		];

	let l =
		[
			[0, 0, 7],
			[7, 7, 7],
			[0, 0, 0]
		];


//-------------- Initialisation ----------------//
	let gameOver = false;
	let board = [[]];
	let staticBoard = [[]];
	let score = 0;
	let tickSpeed = 250;
	let currentPos = [0,4];
	let round = 1;
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
		return pieces[Math.floor(Math.random() * pieces.length)];
	}

	let currentPiece = generatePiece();

	board = generateBoard(board , 10 , 20 );
	staticBoard = generateBoard(staticBoard , 10 ,20);


	function drawBoard() {
		for (let i = 0; i < staticBoard.length; i++) {
			for (let j = 0; j < staticBoard[i].length; j++) {
				if (staticBoard[i][j] !== 0 ) {
					board[i][j] = staticBoard[i][j];
				}
			}
		}
		return board;
	}
	function drawPiece(currentPos) {
		let [x , y] = currentPos;
		for (let i = 0; i < currentPiece.length; i++) {
			for (let j = 0; j < currentPiece[i].length; j++) {
				if (currentPiece[i][j] !== 0 ) {
					board[x+i][y+j] = currentPiece[i][j];
				}
			}
		}
		return board;
	}
	function unDrawPiece(currentPos) {
		let [x , y] = currentPos;
		for (let i = 0; i < currentPiece.length; i++) {
			for (let j = 0; j < currentPiece[i].length; j++) {
				if (currentPiece[i][j] === 0 ) {continue}
				board[x+i][y+j] = 0;
			}
		}
		return board;
	}

	function collisionCheck(dx , dy , piece) {
		for (let i = 0; i < piece.length; i++) {
			for (let j = 0; j < piece[i].length; j++) {
				if (piece[i][j] === 0) {
					continue;
				}

				let newX = currentPos[0] + i + dx;
				let newY = currentPos[1] + j + dy;
				if (newX >= 20 || newY < 0 || newY > 9) {
					return true;
				}
				else if (staticBoard[newX][newY] !== 0) {
					return true;
				}

			}
		}
		return false;
	}
	function addToStatic() {
		for (let i = 0; i < currentPiece.length; i++) {
			for (let j = 0; j < currentPiece[i].length; j++) {
				if (currentPiece[i][j] !== 0) {
					staticBoard[i+currentPos[0]][j+currentPos[1]] = currentPiece[i][j];
				}
			}
		}
		round += 1;
		removeRows();
		drawBoard();
		return staticBoard;
	}

	function removeRows() {
		for (let i = 0 ; i < staticBoard.length ; i++) {
			let removeLine = true;
			for (let j = 0; j < staticBoard[i].length ; j++) {
				if (staticBoard[i][j] === 0) {removeLine = false}
			}
			if (removeLine) {
				staticBoard.splice(i , 1);
				staticBoard.unshift([0,0,0,0,0,0,0,0,0,0])
				board.splice(i , 1);
				board.unshift([0,0,0,0,0,0,0,0,0,0])
				score += 10;

			}
		}
	}
	function gameIsOver() {
		for (let i = 0; i < staticBoard.length; i++) {
			for (let j = 0; j < staticBoard[i].length; j++) {
				if (staticBoard[0][4] !== 0) {
					gameOver = true;
				}
			}
		}
	}

	function moveDown() {
		if (collisionCheck(1 , 0, currentPiece)) {
			addToStatic();
			if (!gameOver) {
				currentPos = [0, 4];
				currentPiece = generatePiece();
			}
		}
		else {
			unDrawPiece(currentPos, currentPiece);
			currentPos[0] += 1;
			drawPiece(currentPos, currentPiece);
		}
	}
	function moveRight() {
		if (!collisionCheck(0 , 1, currentPiece)) {
			unDrawPiece(currentPos, currentPiece);
			currentPos[1] += 1;
			drawPiece(currentPos, currentPiece);
		}
	}
	function moveLeft() {
		if (!collisionCheck(0 , -1, currentPiece)) {
			unDrawPiece(currentPos, currentPiece);
			currentPos[1] -= 1;
			drawPiece(currentPos, currentPiece);
		}
	}

	function rotate() {
		let rotatedPiece = currentPiece[0].map((val, index) => currentPiece.map(row => row[index]).reverse())
		let kickBack = 0;
		if (collisionCheck(0,0, rotatedPiece)) {
			kickBack = currentPos[1] > 5 ? 1 : -1;

		}
		if (!collisionCheck(0 , kickBack , rotatedPiece )) {
			unDrawPiece(currentPos, currentPiece);
			currentPiece = rotatedPiece;
			drawPiece(currentPos , currentPiece);

		}
	}

	function play() {
		setTimeout(() => {
			gameIsOver();
			if (gameOver) {
				return;
			}
			moveDown();
			play();

		} , tickSpeed - Math.log2(round)*20)
	}

	onMount(() => {
		play(tickSpeed);
	});

	function newGame() {
		gameOver = false;
		score = 0;
		currentPos = [0, 4];
		board = generateBoard(board , 10 , 20);
		staticBoard = generateBoard(staticBoard , 10 , 20);
		currentPiece = generatePiece();
		play(tickSpeed);
	}


</script>

<svelte:window
		on:keydown={(press) => {
    switch (press.key) {
      case 'ArrowLeft':
        moveLeft();
        break;
      case 'ArrowRight':
        moveRight();
        break;
      case 'ArrowDown':
        moveDown();
        break;
      case 'Enter':
        newGame();
        break;
      case 'r':
      	rotate();
      	break;
    }
  }}/>



<main>
	<h1 class="game-container">Shitty Tetris</h1>
	<h3 class="game-container">Score: {score}</h3>
	<div class="game-container">
		<div>
			{#each board as row, i}
				<div class="row">
					{#each row as cell , j}
							{#if board[i][j] === 0}
								<div class="cell empty "></div>
							{:else}
								{#if board[i][j] === 1}
									<div class="cell full cyan"></div>
								{:else if board[i][j] === 2}
									<div class="cell full yellow"></div>
								{:else if board[i][j] === 3}
									<div class="cell full purple"></div>
								{:else if board[i][j] === 4}
									<div class="cell full green"></div>
								{:else if board[i][j] === 5}
									<div class="cell full red"></div>
								{:else if board[i][j] === 6}
									<div class="cell full blue"></div>
								{:else if board[i][j] === 7}
									<div class="cell full orange"></div>
								{/if}
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


	.cyan {
		background-color: #66CCFF;
	}

	.yellow {
		background-color: #eaff78;
	}

	.orange {
		background-color: #ffae47;
	}

	.blue {
		background-color: #374eff;
	}

	.red {
		background-color: red;
	}

	.green {
		background-color: greenyellow;
	}

	.purple {
		background-color: #f94eff;
	}






	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

</style>