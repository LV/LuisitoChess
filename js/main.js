$(function() {
	init();
	console.log("Main Init Called");
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
	console.log("FilesBrd[0]:" + FilesBrd[0] + " RanksBrd[0]:" + RanksBrd[0]);
	console.log("FilesBrd[SQUARES.A1]:" + FilesBrd[SQUARES.A1] + " RanksBrd[SQUARES.A1]:" + RanksBrd[SQUARES.A1]);
	console.log("FilesBrd[SQUARES.E3]:" + FilesBrd[SQUARES.E3] + " RanksBrd[SQUARES.E3]:" + RanksBrd[SQUARES.E3]);
	console.log("FilesBrd[SQUARES.E8]:" + FilesBrd[SQUARES.E8] + " RanksBrd[SQUARES.E8]:" + RanksBrd[SQUARES.E8]);
	console.log("FilesBrd[SQUARES.H8]:" + FilesBrd[SQUARES.H8] + " RanksBrd[SQUARES.H8]:" + RanksBrd[SQUARES.H8]);
}

function init() {
	console.log("init() called");
	InitFilesRanksBrd();
}
