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
GameBoard.pList = new Array(13*10); // 0 based index of number of pieces (GameBoard.pceNum)
                                    // Will indicate which piece type it is followed by which piece number of that type it is
                                    // Maximum of 12 different piece types, hence limit must be 130 (since you can have 129 as a value)

                                    // EXAMPLE #1: White Pawn (wP * 10 + wPnum) where wP = 1 and wPnum is the pawn number
                                    // 1st white pawn will be 10 (1 * 10 + 0) -> 0 based index!
                                    // 4th white pawn will be 13 (1 * 10 + 3)

                                    // EXAMPLE #2: White Knights (wN * 10 + wNnum) where wN = 2 and pceNum is the knight number
                                    // 1st white knight will be 20 (2 * 10 + 0)
                                    // 10th white knight will be 29 (2 * 10 + 9) -> 10 of one piece is maximum possible, assuming 8 wP promoted into wN

GameBoard.posKey = 0;
