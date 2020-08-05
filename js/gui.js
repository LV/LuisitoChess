$("#SetFen").click(function () {
	var fenStr = $("#fenIn").val(); // .val() will get value of whatever is inside the textbox
	ParseFen(fenStr);
	PrintBoard();
	SearchPosition();
});
