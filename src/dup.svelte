function play(speed) {
    setTimeout(() => {
        //let [x, y] = currentPos;
        drawBoard();
        unDrawPiece(currentPos, currentPiece);
        currentPos[0] += 1;
        potentialPos[0] = currentPos[0]+1;
        potentialPos[1] = currentPos[1];

        for (let i = 0; i < currentPiece.length; i++) {
            for (let j = 0; j < currentPiece[i].length; j++) {
                if (currentPiece[i][j] !== 0 ) {
                    if ( i+potentialPos[0] > 19) {
                        drawPiece(currentPos , currentPiece)
                        staticBoard = board;
                        currentPos[0] = 0;
                        potentialPos[0] = 1;
                        currentPiece = generatePiece();
                    }
                    else if (staticBoard[i+potentialPos[0] ][j+potentialPos[1]] !== 0) {
                        drawPiece(currentPos, currentPiece);
                        staticBoard = board;
                        currentPos[0] = 0;
                        potentialPos[0] = 1;
                        currentPiece = generatePiece();
                    }
                }
            }
        }
        drawPiece(currentPos, currentPiece);

        play(speed);
    }, speed)
};