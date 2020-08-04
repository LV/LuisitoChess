$("#SetFen").click(function () {
	var fenStr = $("#fenIn").val(); // .val() will get value of whatever is inside the textbox
	ParseFen(START_FEN);
	PrintBoard();
	SearchPosition();
});
