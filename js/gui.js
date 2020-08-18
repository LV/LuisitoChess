$("#SetFen").click(function () {
	var fenStr = $("#fenIn").val(); // .val() will get value of whatever is inside the textbox
	ParseFen(fenStr);
	NewGame(fenStr);
});

function NewGame(fenStr) {
	ParseFen(fenStr);
	PrintBoard();
	SetInitialBoardPieces();
}

function ClearAllPieces() {
	$(".Piece").remove();
}

function SetInitialBoardPieces() {
	var sq, sq120, file, rank, rankName, fileName, imgString, pieceImgName, piece;

	ClearAllPieces();

	for(sq = 0; sq < 64; sq++) {
		sq120 = SQ120(sq);
		piece = GameBoard.pieces[sq120];
		file = FilesBrd[sq120];
		rank = RanksBrd[sq120];

		if(piece >= PIECES.wP && piece <= PIECES.bK) {
			rankName = "rank" + (rank + 1);	// must add 1 since it is 0-indexed
			fileName = "file" + (file + 1);
			pieceImgName = "img/" + SideChar[PieceCol[piece]] + PceChar[piece].toUpperCase() + ".png";
			imgString = "<image src=\"" + pieceImgName + "\" class=\"Piece " + rankName + " " + fileName + "\"/>";
			$("#Board").append(imgString);
		}
	}
}
