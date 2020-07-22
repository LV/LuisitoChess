function PCEINDEX(pce, pceNum) {
	return (pce * 10 + pceNum);
} 

var GameBoard = {};

GameBoard.pieces = new Array(BRD_SQ_NUM);
GameBoard.side = COLORS.WHITE;
GameBoard.fiftyMove = 0;
GameBoard.hisPly = 0;				// used for undo-ing
GameBoard.ply = 0;					// number of half moves
GameBoard.enPas = 0;
GameBoard.castlePerm = 0;			// used to determine which castling is avaliable
GameBoard.material = new Array(2);	// holds the total value of the material (the total piece values) in each side (WHITE, BLACK)

// Generate piece list. Holds list of pieces (That way you don't have to unnecessarily loop through the entire board
// to check for movable pieces as there will be a lot of blank tiles)
GameBoard.pceNum = new Array(13);	// keeps track of how many of each piece we have on the board, indexed by piece
GameBoard.pList = new Array(13 * 10); // 0 based index of number of pieces (GameBoard.pceNum)
									// Will indicate which piece type it is followed by which piece number of that type it is
									// Maximum of 12 different piece types, hence limit must be 130 (since you can have 129 as a value)

									// EXAMPLE #1: White Pawn (wP * 10 + wPnum) where wP = 1 and wPnum is the pawn number
									// 1st white pawn will be 10 (1 * 10 + 0) -> 0 based index!
									// 4th white pawn will be 13 (1 * 10 + 3)

									// EXAMPLE #2: White Knights (wN * 10 + wNnum) where wN = 2 and pceNum is the knight number
									// 1st white knight will be 20 (2 * 10 + 0)
									// 10th white knight will be 29 (2 * 10 + 9) -> 10 of one piece is maximum possible, assuming 8 wP promoted into wN

GameBoard.posKey = 0;

// Creating arrays of maximum sizes
GameBoard.moveList = new Array(MAXDEPTH * MAXPOSITIONMOVES);
GameBoard.moveScores = new Array(MAXDEPTH * MAXPOSITIONMOVES);
GameBoard.moveListStart = new Array(MAXDEPTH);

function PrintBoard() {
	var sq, file, rank, piece;
	console.log("Game Board:\n");

	// must parse loop since board will look like this:
	// a8 b8 c8 d8 e8 f8 g8 h8
	// a7 b7 c7 d7 e7 f7...
	// .
	// .
	// .
	// a1 b1 c1 d1...

	for(rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
		var line =(RankChar[rank] + "  ");
		for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
			sq = FR2SQ(file,rank);
			piece = GameBoard.pieces[sq];
			line += (" " + PceChar[piece] + " ");
		}
		console.log(line);
	}

	console.log("");
	var line = "   ";
	for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
		line += (' ' + FileChar[file] + ' ');
	}

	console.log(line);
	console.log("side: " + SideChar[GameBoard.side]);
	console.log("enPas: " + GameBoard.enPas);
	line = "";

	if(GameBoard.castlePerm & CASTLEBIT.WKCA) line += 'K';	// use andmap to see if position is available using correct bit in CASTLEBIT
	if(GameBoard.castlePerm & CASTLEBIT.WQCA) line += 'Q';	// 0011 -> kq, 1010 -> Kk, 1111 -> KQkq, etc.
	if(GameBoard.castlePerm & CASTLEBIT.BKCA) line += 'k';
	if(GameBoard.castlePerm & CASTLEBIT.BQCA) line += 'q';

	console.log("castle: " + line);
	console.log("key: " + GameBoard.posKey.toString(16));
}

function GeneratePosKey() {
	// variable definitions
	var sq = 0;
	var finalKey = 0;
	var piece = PIECES.EMPTY;

	for(sq = 0; sq < BRD_SQ_NUM; ++sq) { // loop through entire board
		piece = GameBoard.pieces[sq];
		if(piece != PIECES.EMPTY && piece != SQUARES.OFFBOARD) {
			finalKey ^= PieceKeys[(piece*120) + sq];	// hashes only the valid tiles in the board that have a piece
														// using bitwise XOR to hash
		}
	}

			if(GameBoard.side == COLORS.WHITE) {
				finalKey ^= SideKey;	// performs XOR only if it is white's turn
										// pointless having to create a new hash for black's turn if this can work as a switch
			}

			if(GameBoard.enPas != SQUARES.NO_SQ) {
				finalKey ^= PieceKeys[GameBoard.enPas];		// en Passant creates 
			}

			finalKey ^= CastleKeys[GameBoard.castlePerm];	// include castling permisions into hash key

			return finalKey;
}

function ResetBoard() {
	var index = 0;
	for(index = 0; index < BRD_SQ_NUM; ++index) {
		GameBoard.pieces[index] = SQUARES.OFFBOARD;
	}

	for(index = 0; index < 64; ++index) {
		GameBoard.pieces[SQ120(index)] = PIECES.EMPTY;
	}

	for(index = 0; index < 13*10; ++index) {
		GameBoard.pList[index] = PIECES.EMPTY;
	}

	for(index = 0; index < 2; ++index) {
		GameBoard.material[index] = 0;
	}

	for(index = 0; index < 13; ++index) {
		GameBoard.pceNum[index] = 0;
	}

	GameBoard.side = COLORS.BOTH;
	GameBoard.enPas = SQUARES.NO_SQ;
	GameBoard.fiftyMove = 0;
	GameBoard.ply = 0;
	GameBoard.hisPly = 0;
	GameBoard.castlePerm = 0;
	GameBoard.posKey = 0;
	GameBoard.moveListStart[GameBoard.ply] = 0;
}

function ParseFen(fen) {
	ResetBoard();

	// Example FEN string to help:
	// r1b1r1k1/1p4pp/pqn1p3/5QN1/3P4/2N5/PP1R1PPP/4R1K1 b - - 0 1

	var rank = RANKS.RANK_8;
	var file = FILES.FILE_A;
	var piece = 0;
	var count = 0;
	var i = 0;
	var sq120 = 0;
	var fenCount = 0;	// FEN Count - used to point to a particular character in a string; used as an index
						// used as -> fen[fenCount]

	while((rank >= RANKS.RANK_1) && fenCount < fen.length) {
		count = 1;
		switch(fen[fenCount]) {
			case 'p': piece = PIECES.bP; break;
			case 'n': piece = PIECES.bN; break;
			case 'b': piece = PIECES.bB; break;
			case 'r': piece = PIECES.bR; break;
			case 'q': piece = PIECES.bQ; break;
			case 'k': piece = PIECES.bK; break;
			case 'P': piece = PIECES.wP; break;
			case 'N': piece = PIECES.wN; break;
			case 'B': piece = PIECES.wB; break;
			case 'R': piece = PIECES.wR; break;
			case 'Q': piece = PIECES.wQ; break;
			case 'K': piece = PIECES.wK; break;

			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
				piece = PIECES.EMPTY;
				count = fen[fenCount].charCodeAt() - '0'.charCodeAt();	// converts the number character into an integer
																		// takes ASCII character value and subtracts it by value of '0'
				break;
			
			case '/':
			case ' ':
				rank--;					// go down a file
				file = FILES.FILE_A;	// go back to starting file
				fenCount++;
				continue;
			
			default:
				console.log("Invalid FEN string");
				return;
		}

		for(i = 0; i < count; i++) {
			sq120 = FR2SQ(file,rank);
			GameBoard.pieces[sq120] = piece;
			file++;
		}
		fenCount++;
	}

	// Choosing player turn
	GameBoard.side = (fen[fenCount] == 'w') ? COLORS.WHITE : COLORS.BLACK;
	fenCount += 2;

	// Placing castling permissions
	for(i = 0; i < 4; i++) { // maximum possible string length of 4
		if(fen[fenCount] == ' ') {
			break;
		}
		switch(fen[fenCount]) {
			case 'K': GameBoard.castlePerm |= CASTLEBIT.WKCA; break;
			case 'Q': GameBoard.castlePerm |= CASTLEBIT.WQCA; break;
			case 'k': GameBoard.castlePerm |= CASTLEBIT.BKCA; break;
			case 'q': GameBoard.castlePerm |= CASTLEBIT.BQCA; break;
			default: break;
		}
		fenCount++;
	}
	fenCount++;

	// Checking if en Passant is possible
	if(fen[fenCount] != '-') {
		file = fen[fenCount].charCodeAt() - 'a'.charCodeAt();		// take letter value and convert to integer for enum
		rank = fen[fenCount + 1].charCodeAt() - '1'.charCodeAt();	// take number value and conver to integer for enum
		console.log("fen[fenCount]: " + fen[fenCount] + " - File: " + file + " - Rank: " + rank);
		GameBoard.enPas = FR2SQ(file,rank);
	}
	GameBoard.posKey = GeneratePosKey();
}
