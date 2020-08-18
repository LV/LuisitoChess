$(function() {
	init();
	console.log("Main Init Called");
	NewGame(START_FEN);
});

// Initialization functions
function InitFilesRanksBrd() {
	var index = 0;
	var file = FILES.FILE_A;
	var rank = RANKS.RANK_1;
	var sq = SQUARES.A1;
	
	// Sets the every tile on board to OFFBOARD
	for(index = 0; index < BRD_SQ_NUM; ++index) {
		FilesBrd[index] = SQUARES.OFFBOARD;
		RanksBrd[index] = SQUARES.OFFBOARD;
	}

	// Sets the ON-BOARD tiles to its appropriate values
	for(rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
		for(file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
			sq = FR2SQ(file,rank);
			FilesBrd[sq] = file;
			RanksBrd[sq] = rank;
		}
	}

	// For testing purposes
	/*
	console.log("FilesBrd[0]:" + FilesBrd[0] + " RanksBrd[0]:" + RanksBrd[0]);
	console.log("FilesBrd[SQUARES.A1]:" + FilesBrd[SQUARES.A1] + " RanksBrd[SQUARES.A1]:" + RanksBrd[SQUARES.A1]);
	console.log("FilesBrd[SQUARES.E3]:" + FilesBrd[SQUARES.E3] + " RanksBrd[SQUARES.E3]:" + RanksBrd[SQUARES.E3]); // should produce undefined
	console.log("FilesBrd[SQUARES.E8]:" + FilesBrd[SQUARES.E8] + " RanksBrd[SQUARES.E8]:" + RanksBrd[SQUARES.E8]);
	console.log("FilesBrd[SQUARES.H8]:" + FilesBrd[SQUARES.H8] + " RanksBrd[SQUARES.H8]:" + RanksBrd[SQUARES.H8]);
	*/
}

function InitHashKeys() { // Initializing the hash keys
	var index = 0;

	for(index = 0; index < (13 * 120); ++index) {
		PieceKeys[index] = RAND_32();
	}

	SideKey = RAND_32();
	
	for(index = 0; index < 16; ++index) {
		CastleKeys[index] = RAND_32();
	}
}

function InitSq120To64() {
	var index = 0;
	var file = FILES.FILE_A;
	var rank = RANKS.RANK_1;
	var sq = SQUARES.A1;
	var sq64 = 0;

	// reset tiles by setting index to non-valid square
	for(index = 0; index < BRD_SQ_NUM; ++index) {
		Sq120ToSq64[index] = 65;
	}
	for(index = 0; index < 64; ++index) {
		Sq64ToSq120[index] = 120;
	}
	
	for(rank = RANKS.RANK_1; rank <= RANKS.RANK_8; ++rank) {
		for(file = FILES.FILE_A; file <= FILES.FILE_H; ++file) {
			sq = FR2SQ(file,rank);
			Sq64ToSq120[sq64] = sq;	// [0] = 21, [1] = 22, ..., [8] = 31, ...
			Sq120ToSq64[sq] = sq64;	// [21] = 0, [22] = 2, ..., [31] = 8, ...
			sq64++;
			}
		}
}

function InitBoardVars() {
	var index = 0;
	for(index = 0; index < MAXGAMEMOVES; ++index) {
		GameBoard.history.push({
			move : NOMOVE,
			castlePerm : 0,
			enPas : 0,
			fiftyMove : 0,
			posKey : 0
		});
	}

	for(index = 0; index < PVENTRIES; ++index) {
		GameBoard.PvTable.push({
			move : NOMOVE,
			posKey : 0
		});
	}
}

function InitBoardSquares() {
	var light = 1;
	var rankName, fileName, divString, rankIterator, fileIterator, lightString;

	for(rankIterator = RANKS.RANK_8; rankIterator >= RANKS.RANK_1; rankIterator--) {
		light ^= 1;		// XOR each tile as it alternates between dark and light squares every time
		rankName = "rank" + (rankIterator + 1);		// Add 1 because ranks are 0-indexed
		for(fileIterator = FILES.FILE_A; fileIterator <= FILES.FILE_H; fileIterator++) {
			fileName = "file" + (fileIterator + 1);
			if(light == 0) lightString = "Light";	// == 0 because of the beginning XOR function which flips it to a 0 at the start
			else lightString = "Dark";
			light ^= 1;
			divString = "<div class=\"Square " + rankName + " " + fileName + " " + lightString + "\"/>";
			$("#Board").append(divString);
		}
	}
}

function init() {
	console.log("init() called");
	InitFilesRanksBrd();
	InitHashKeys();
	InitSq120To64();
	InitBoardVars();
	InitMvvLva();
	InitBoardSquares();
}
