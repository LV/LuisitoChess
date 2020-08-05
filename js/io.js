function PrSq(sq) {
	return (FileChar[FilesBrd[sq]] + RankChar[RanksBrd[sq]]);
}

function PrMove(move) {
	var MvStr;	// Move string

	var ff = FilesBrd[FROMSQ(move)];	// File from
	var rf = RanksBrd[FROMSQ(move)];	// Rank from
	var ft = FilesBrd[TOSQ(move)];		// File to
	var rt = RanksBrd[TOSQ(move)];		// Rank to

	MvStr = FileChar[ff] + RankChar[rf] + FileChar[ft] + RankChar[rt];

	var promoted = PROMOTED(move);

	if(promoted != PIECES.EMPTY) {
		var pchar = 'q';
		if(PieceKnight[promoted]) {
			pchar = 'n';
		} else if(PieceRookQueen[promoted] && !PieceBishopQueen[promoted]) {
			pchar = 'r';
		} else if(!PieceRookQueen[promoted] && PieceBishopQueen[promoted]) {
			pchar = 'b';
		}
		MvStr += pchar;
	}
	return MvStr;
}

function PrintMoveList() {
	var index, move;

	console.log('MoveList:');

	for(index = GameBoard.moveListStart[GameBoard.ply]; index < GameBoard.moveListStart[GameBoard.ply+1]; ++index) {
		move = GameBoard.moveList[index];
		console.log(PrMove(move));
	}
}
