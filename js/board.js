function PCEINDEX(pce, pceNum) {
	return (pce * 10 + pceNum);
}

var GameBoard = {};

GameBoard.pieces = new Array(BRD_SQ_NUM);
GameBoard.side = COLORS.WHITE;
GameBoard.fiftyMove = 0;
GameBoard.hisPly = 0;				// used for undo-ing
GameBoard.history = [];
GameBoard.ply = 0;					// number of half moves
GameBoard.enPas = 0;
GameBoard.castlePerm = 0;			// used to determine which castling is avaliable
GameBoard.material = new Array(2);	// holds the total value of the material (the total piece values) in each side (WHITE, BLACK)

// Generate piece list. Holds list of pieces (That way you don't have to unnecessarily loop through the entire board
// to check for movable pieces as there will be a lot of blank tiles)
GameBoard.pceNum = new Array(13);		// keeps track of how many of each piece we have on the board, indexed by piece
GameBoard.pList = new Array(13 * 10);	// 0 based index of number of pieces (GameBoard.pceNum)
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

GameBoard.PvTable = [];						// will have up to 10,000 entries and stores all PV info
GameBoard.PvArray = new Array(MAXDEPTH);	// an array showing best lines that the engine has found

GameBoard.searchHistory = new Array(13 * BRD_SQ_NUM);
GameBoard.searchKillers = new Array(3 * MAXDEPTH);

function CheckBoard() {
	var t_pceNum = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
	var t_material = [ 0, 0 ];
	var sq64, t_piece, t_pce_num, sq120, color, pcount;

	// Check piece lists
	for(t_piece = PIECES.wP; t_piece <= PIECES.bK; ++t_piece) {						// loop through each piece type
		for(t_pce_num = 0; t_pce_num < GameBoard.pceNum[t_piece]; ++t_pce_num) {	// loop through each piece within that type
			sq120 = GameBoard.pList[PCEINDEX(t_piece, t_pce_num)];					// get the square from that particular piece
			if(GameBoard.pieces[sq120] != t_piece) {								// if the piece type is not the same as the one indexed then we have an error
				console.error("Error Piece List");
				return false;
			}
		}
	}

	// Check material counter
	for(sq64 = 0; sq64 < 64; ++sq64) {						// using sq64 to shorten loop
		sq120 = SQ120(sq64);
		t_piece = GameBoard.pieces[sq120];					// for each square take the piece
		t_pceNum[t_piece]++;								// increment the number for count
		t_material[PieceCol[t_piece]] += PieceVal[t_piece];	// increment material value by that piece value
	}

	// Check piece coutner
	for(t_piece = PIECES.wP; t_piece <= PIECES.bK; ++t_piece) {
		if(t_pceNum[t_piece] != GameBoard.pceNum[t_piece]) {
			console.error("Error Piece Num");
			return false;
		}
	}

	// Check material scores
	if((t_material[COLORS.WHITE] != GameBoard.material[COLORS.WHITE]) || t_material[COLORS.BLACK] != GameBoard.material[COLORS.BLACK]) {
		console.error("Error Material Score");
		return false;
	}

	// Check side
	if((GameBoard.side != COLORS.WHITE) && (GameBoard.side != COLORS.BLACK)) {
		console.error("Error GameBoard Side");
		return false;
	}

	// Check hash key
	if(GeneratePosKey() != GameBoard.posKey) {	// freshly generate new hash key
		console.error("Error Position Hash Key");
		return false;
	}


	return true;
}

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
		if((piece != PIECES.EMPTY) && (piece != SQUARES.OFFBOARD)) {
			finalKey ^= PieceKeys[(piece * 120) + sq];	// hashes only the valid tiles in the board that have a piece
														// using bitwise XOR to hash
		}
	}

	if(GameBoard.side == COLORS.WHITE) {
		finalKey ^= SideKey;	// performs XOR only if it is white's turn
								// pointless having to create a new hash for black's turn if this can work as a switch
	}

	if(GameBoard.enPas != SQUARES.NO_SQ) {
		finalKey ^= PieceKeys[GameBoard.enPas];
	}

	finalKey ^= CastleKeys[GameBoard.castlePerm];	// include castling permisions into hash key

	return finalKey;
}

function PrintPieceLists() {
	var piece, pceNum;

	for(piece = PIECES.wP; piece <= PIECES.bK; ++piece) {
		for(pceNum = 0; pceNum < GameBoard.pceNum[piece]; ++pceNum) {
			console.log('Piece ' + PceChar[piece] + ' on ' + PrSq(GameBoard.pList[PCEINDEX(piece, pceNum)]));
		}
	}
}

function UpdateListsMaterial() {

	var piece, sq, index, color;

	for(index = 0; index < (13 * 10); ++index) {
		GameBoard.pList[index] = PIECES.EMPTY;
	}

	for(index = 0; index < 2; ++index) {
		GameBoard.material[index] = 0;
	}

	for(index = 0; index < 13; ++index) {
		GameBoard.pceNum[index] = 0;
	}

	for(index = 0; index < 64; ++index) {
		sq = SQ120(index);
		piece = GameBoard.pieces[sq];
		if(piece != PIECES.EMPTY) {
			color = PieceCol[piece];	// get the color of the piece

			GameBoard.material[color] += PieceVal[piece];

			GameBoard.pList[PCEINDEX(piece, GameBoard.pceNum[piece])] = sq;
			GameBoard.pceNum[piece]++;	// update the pieceNum by 1
										// remember that the last digit refers to piece number
										// first digits is piece type
										// 11 means 1st white pawn
		}
	}
	PrintPieceLists();
}

function ResetBoard() {
	var index = 0;
	for(index = 0; index < BRD_SQ_NUM; ++index) {
		GameBoard.pieces[index] = SQUARES.OFFBOARD;
	}

	for(index = 0; index < 64; ++index) {
		GameBoard.pieces[SQ120(index)] = PIECES.EMPTY;
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

	while((rank >= RANKS.RANK_1) && (fenCount < fen.length)) {
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
	UpdateListsMaterial();
	PrintSqAttacked();
}

function PrintSqAttacked() {
	var sq, file, rank, piece;

	console.log("\nAttacked:\n");
	for(rank = RANKS.RANK_8; rank >= RANKS.RANK_1; rank--) {
		var line = ((rank + 1) + "  ");
		for(file = FILES.FILE_A; file <= FILES.FILE_H; file++) {
			sq = FR2SQ(file,rank);
			if(SqAttacked(sq, GameBoard.side)) piece = "X";
			else piece = "-";
			line += (" " + piece + " ");
		}
		console.log(line);
	}
	console.log("");
}

function SqAttacked(sq, side) {
	var pce, t_sq, index;

	// Check if square is attacked by a pawn
	if(side == COLORS.WHITE) {
		if(GameBoard.pieces[sq - 11] == PIECES.wP || GameBoard.pieces[sq - 9] == PIECES.wP) {	// -11 and -9 are at the upper left and upper right respective corners of a given square
			return true;
		}
	} else {
		if(GameBoard.pieces[sq + 11] == PIECES.bP || GameBoard.pieces[sq + 9] == PIECES.bP) {	// +11 and +9 are at the lower left and lower right respective corners of a given square
			return true;
		}
	}

	// Check if square is attacked by a knight
	for(index = 0; index < 8; index++) {
		pce = GameBoard.pieces[sq + NDir[index]];
		if((pce != SQUARES.OFFBOARD) && (PieceCol[pce] == side) && PieceKnight[pce]) {
			return true;
		}
	}

	// Check if square is attacked by a rook (or queen's vertical and horizontals)
	for(index = 0; index < 4; ++index) {
		dir = RDir[index];
		t_sq = sq + dir;
		pce = GameBoard.pieces[t_sq];
		while(pce != SQUARES.OFFBOARD) {	// keep checking as long as you're on the board
											// keeps checking and heading into the direction as long as there isn't a piece
											// once it finds a piece it'll check if it's an appropriate piece (i.e. the correct color)
											// to ensure that that square is actually being attacked
			if(pce != PIECES.EMPTY) {
				if(PieceRookQueen[pce] && (PieceCol[pce] == side)) {
					return true;
				}
				break;
			}
			t_sq += dir;
			pce = GameBoard.pieces[t_sq];
		}
	}

	// Check if square is attacked by a bishop (or queen's diagonals)
	for(index = 0; index < 4; ++index) {
		dir = BDir[index];
		t_sq = sq + dir;
		pce = GameBoard.pieces[t_sq];
		while(pce != SQUARES.OFFBOARD) {	// same thing as rook but this time for the bishop
			if(pce != PIECES.EMPTY) {
				if(PieceBishopQueen[pce] && (PieceCol[pce] == side)) {
					return true;
				}
				break;
			}
			t_sq += dir;
			pce = GameBoard.pieces[t_sq];
		}
	}

	// Check if square is attacked by the king
	for(index = 0; index < 8; index++) {
		pce = GameBoard.pieces[sq + KDir[index]];
		if((pce != SQUARES.OFFBOARD) && (PieceCol[pce] == side) && PieceKing[pce]) {
			return true;
		}
	}

	return false;
}
