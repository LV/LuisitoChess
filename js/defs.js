const BRD_SQ_NUM = 120; // total number of tiles in our board (note that some of the tiles are OFFBOARD)

const PIECES = { EMPTY:0, wP:1, wN:2, wB:3, wR:4, wQ:5, wK:6, bP:7, bN:8, bB:9, bR:10, bQ:11, bK:12 }; 			// piece type
const FILES = { FILE_A:0, FILE_B:1, FILE_C:2, FILE_D:3, FILE_E:4, FILE_F:5, FILE_G:6, FILE_H:7, FILE_NONE:8 };	// column (vertical)
const RANKS = { RANK_1:0, RANK_2:1, RANK_3:2, RANK_4:3, RANK_5:4, RANK_6:5, RANK_7:6, RANK_8:7, RANK_NONE:8 };	// row (horizontal)
const COLORS = { WHITE:0, BLACK:1, BOTH:2 }; // colors, used to keep track of total pieces on board

const SQUARES = {
	A1:21, B1:22, C1:23, D1:24, E1:25, F1:26, G1:27, H1:28,
	A8:91, B8:92, C8:93, D8:94, E8:95, F8:96, G8:97, H8:98,
	NO_SQ:99, OFFBOARD:100
};	// NO_SQ has a value of 99, meaning that it is an empty tile
	// OFFBOARD signifies that the tile is outside of the board's limits.

const CASTLEBIT = { WKCA:1, WQCA:2, BKCA:4, BQCA:8 };	// castling, where each bit represents which castling is available
														// 0 0 0 0 -> no castling moves are available
														// 1 0 0 1 -> white only has king-side castling available, black only has queen-side castling available
														// 0 0 1 0 -> white has no castling moves available, black has only king-side castling available

const BOOL = { FALSE:0, TRUE:1 }; // JavaScript doesn't define booleans

const MAXGAMEMOVES = 2048;		// Most moves in a chess game ever was 269 moves and was played more than 30 years ago, more than enough
const MAXPOSITIONMOVES = 256;	// No more than 256 moves to be generated within one position
const MAXDEPTH = 64;			// Maximum depth the AI will search to

var FilesBrd = new Array(BRD_SQ_NUM);
var RanksBrd = new Array(BRD_SQ_NUM);

var START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

var PceChar = ".PNBRQKpnbrqk";
var SideChar = "wb-";
var RankChar = "12345678";
var FileChar = "abcdefgh";


function FR2SQ(f,r) { // File Rank to Square
	return ((21+(f)) + ((r)*10));
}

// Game board definitions
const PieceBig = [ BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE ];		// big pieces - all non-pawn pieces
const PieceMaj = [ BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE ];	// major pieces - queens and rooks
const PieceMin = [ BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE ];	// minor pieces - knights and bishops

const PieceVal = [ 0, 100, 325, 325, 550, 1000, 50000, 100, 325, 325, 550, 1000, 50000  ]; // giving each piece a specific value for the AI

const PieceCol = [ COLORS.BOTH, COLORS.WHITE, COLORS.WHITE, COLORS.WHITE, COLORS.WHITE, COLORS.WHITE, COLORS.WHITE, COLORS.BLACK, COLORS.BLACK, COLORS.BLACK, COLORS.BLACK, COLORS.BLACK, COLORS.BLACK ]; // Assigning each piece type to its appropriate color

const PiecePawn = [ BOOL.FALSE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE ];
const PieceKnight = [ BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE ];
const PieceKing = [ BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE ];
const PieceRookQueen = [ BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.FALSE ];
const PieceBishopQueen = [ BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.FALSE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.FALSE, BOOL.TRUE, BOOL.FALSE ];
const PieceSlides = [ BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE, BOOL.FALSE, BOOL.FALSE, BOOL.FALSE, BOOL.TRUE, BOOL.TRUE, BOOL.TRUE, BOOL.FALSE ]; // pieces that slide: bishops, rooks, and queens

const NDir = [ -8, -19, -21, -12, 8, 19, 21, 12 ];
const BDir = [ -9, -11, 11, 9 ];
const RDir = [ -1, -10, 10, 1 ];
const KDir = [ -9, -10, -11, -1, 1, 9, 10, 11 ];

const DirNum = [ 0, 0, 8, 4, 4, 8, 8, 0, 8, 4, 4, 8, 8 ];	// indexed by piece type, says how many directions each piece can move in
															// pawns are 0 since they are built in a different manner
const PceDir = [ 0, 0, NDir, BDir, RDir, KDir, KDir, 0, NDir, BDir, RDir, KDir, KDir ];
															// Queen has same direction as king, only difference is that it can slide
const LoopNonSlidePiece = [ PIECES.wN, PIECES.wK, 0, PIECES.bN, PIECES.bK, 0 ];
															// 0s work as a stopper since we'll be looping through this array
const LoopNonSlideIndex = [ 0, 3 ];	// white will start at index 0, black will start at index 3 (for the previous array)
const LoopSlidePiece = [ PIECES.wB, PIECES.wR, PIECES.wQ, 0, PIECES.bB, PIECES.bR, PIECES.bQ, 0 ];
const LoopSlideIndex = [ 0, 4 ];


var PieceKeys = new Array(13 * 120);
var SideKey;
var CastleKeys = new Array(16);

var Sq120ToSq64 = new Array(BRD_SQ_NUM);
var Sq64ToSq120 = new Array(64);

function RAND_32() { // create a random 32-bit (actually its 31 bit) number and perform bitwise shifts to ensure proper coverage in the number
	return (Math.floor((Math.random()*255)+1) << 23) | (Math.floor((Math.random()*255)+1) << 16) | (Math.floor((Math.random()*255)+1) << 8) | Math.floor((Math.random()*255)+1);
}

function SQ64(sq120) {
	return Sq120ToSq64[(sq120)];
}

function SQ120(sq64) {
	return Sq64ToSq120[(sq64)];
}

function PCEINDEX(pce, pceNum) {
	return (pce * 10 + pceNum);
}

var Kings = [PIECES.wK, PIECES.bK];

var CastlePerm = [
	15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
	15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
	15, 13, 15, 15, 15, 12, 15, 15, 14, 15,
	15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
	15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
	15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
	15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
	15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
	15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
	15,  7, 15, 15, 15,  3, 15, 15, 11, 15,
	15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
	15, 15, 15, 15, 15, 15, 15, 15, 15, 15
];	// the CASTLEBIT will be bitwise ANDed with the value of certain elements in the array

/*
The movement key will be stored in an unsigned 32 bit integer, despite only needing 25 bits
0000 0000 0000 0000 0000 0111 1111 -> From			// &      0x7F
0000 0000 0000 0011 1111 1000 0000 -> To			// >> 7,  0x7F
0000 0000 0011 1100 0000 0000 0000 -> Captured		// >> 14, 0xF
0000 0000 0100 0000 0000 0000 0000 -> enPas			//        0x40000
0000 0000 1000 0000 0000 0000 0000 -> Pawn Start	//        0x80000
0000 1111 0000 0000 0000 0000 0000 -> Promoted		// >> 20, 0xF
0001 0000 0000 0000 0000 0000 0000 -> Castle		//        0x1000000
*/

function FROMSQ(m) {
	return (m & 0x7F);
}

function TOSQ(m) {
	return ((m >> 7) & 0x7F);
}

function CAPTURED(m) {
	return ((m >> 14) & 0xF);
}

function PROMOTED(m) {
	return ((m >> 20) & 0xF);
}

// NOTE: The remaining 0s refer to empty bits trailing after the digits
// necessary to perform bitwise ANDs
const MFLAGEP = 0x40000;
const MFLAGPS = 0x80000;
const MFLAGCA = 0x1000000;

const MFLAGCAP = 0x7C000;
const MLAGPROM = 0xF00000;

const NOMOVE = 0;

function SQOFFBOARD(sq) {
	if(FilesBrd[sq] == SQUARES.OFFBOARD) return BOOL.TRUE;
	else return BOOL.FALSE;
}


// Hash functions utilizing bitwise XOR
function HASH_PCE(pce, sq) {
	GameBoard.posKey ^= PieceKeys[(pce * 120) + sq];
}

function HASH_CA() {
	GameBoard.posKey ^= CastleKeys[GameBoard.castlePerm];
}

function HASH_SIDE() {
	GameBoard.posKey ^= SideKey;
}

function HASH_EP() {
	GameBoard.posKey ^= PieceKeys[GameBoard.enPas];
}
