// apply biases in piece positions across the board
const PawnTable = [
	  0,   0,   0,   0,   0,   0,   0,   0,	// a1 -> a8
	 10,  10,   0, -10, -10,   0,  10,  10,	// middle pawns are at -10, where as 2 spaces in front are 20. This encourages the program to move these two pawns to the center
	  5,   0,   0,   5,   5,   0,   0,   5,	// discourages moving A, B, G, H, pawns from their start as it creates weaknesses
	  0,   0,  10,  20,  20,  10,   0,   0,
	  5,   5,   5,  10,  10,   5,   5,   5,
	 10,  10,  10,  20,  20,  10,  10,  10,	// value gets much higher as pawn is pushed further up (with bias on center pawns) as it approaches promotion
	 20,  20,  20,  30,  30,  20,  20,  20,
	  0,   0,   0,   0,   0,   0,   0,   0	// h1 -> h8

  // score is in terms of hundredths of a pawn (1 pawn = 100)
  // pawn is assumed to begin in second rank (white)
  // mirror version is provided in `defs.js`
];

const KnightTable = [
	  0, -10,   0,   0,   0,   0, -10,   0,	// a1 -> a8, encourages knights to leave their starting squares
	  0,   0,   0,   5,   5,   0,   0,   0,
	  0,   0,  10,  10,  10,  10,   0,   0,
	  0,   0,  10,  20,  20,  10,   5,   0,
	  5,  10,  15,  20,  20,  15,  10,   5,
	  5,  10,  10,  20,  20,  10,  10,   5,
	  0,   0,   5,  10,  10,   5,   0,   0,
	  0,   0,   0,   0,   0,   0,   0,   0	// h1 -> h8
];

const BishopTable = [
	  0,   0, -10,   0,   0, -10,   0,   0,	// a1 -> a8, encourages bishops to leave their starting squares
	  0,   0,   0,  10,  10,   0,   0,   0,
	  0,   0,  10,  15,  15,  10,   0,   0,
	  0,  10,  15,  20,  20,  15,  10,   0,
	  0,  10,  15,  20,  20,  15,  10,   0,
	  0,   0,  10,  15,  15,  10,   0,   0,
	  0,   0,   0,  10,  10,   0,   0,   0,
	  0,   0,   0,   0,   0,   0,   0,   0	// h1 -> h8
];

const RookTable = [
	  0,   0,   5,  10,  10,   5,   0,   0,	// a1 -> a8
	  0,   0,   5,  10,  10,   5,   0,   0,
	  0,   0,   5,  10,  10,   5,   0,   0,
	  0,   0,   5,  10,  10,   5,   0,   0,
	  0,   0,   5,  10,  10,   5,   0,   0,
	  0,   0,   5,  10,  10,   5,   0,   0,
	 25,  25,  25,  25,  25,  25,  25,  25,	// encourages rooks to infiltrate on 7th rank
	  0,   0,   5,  10,  10,   5,   0,   0	// h1 -> h8
];

const BishopPairBonus = 40;	// bonus for retaining the bishop pair

function EvalPosition() {
	var score = GameBoard.material[COLORS.WHITE] - GameBoard.material[COLORS.BLACK];    // material evaluation
	var pce, sq, pceNum;

	// Pawns
	pce = PIECES.wP;
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
		score += PawnTable[SQ64(sq)];		// add bonus value for white pawn according to table
	}

	pce = PIECES.bP;
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
		score -= PawnTable[MIRROR64(SQ64(sq))];	// -= since it is black
	}

	// Knights
	pce = PIECES.wN;
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
		score += KnightTable[SQ64(sq)];
	}

	pce = PIECES.bN;
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
		score -= KnightTable[MIRROR64(SQ64(sq))];
	}

	// Bishops
	pce = PIECES.wB;
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
		score += BishopTable[SQ64(sq)];
	}

	pce = PIECES.bB;
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
		score -= BishopTable[MIRROR64(SQ64(sq))];
	}

	// Rooks
	pce = PIECES.wR;
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
		score += RookTable[SQ64(sq)];
	}

	pce = PIECES.bR;
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
		score -= RookTable[MIRROR64(SQ64(sq))];
	}

	// Queens
	pce = PIECES.wQ;
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
		score += RookTable[SQ64(sq)];
	}

	pce = PIECES.bQ;
	for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
		sq = GameBoard.pList[PCEINDEX(pce, pceNum)];
		score -= RookTable[MIRROR64(SQ64(sq))];
	}

	if(GameBoard.pceNum[PIECES.wB] >= 2) {	// in case of promotions, ensure minimum of 2 bishops
		score += BishopPairBonus;
	}

	if(GameBoard.pceNum[PIECES.bB] >= 2) {
		score -= BishopPairBonus;
	}


	if(GameBoard.side == COLORS.WHITE) {
		return score;
	} else {
		return -score;
	}
}
