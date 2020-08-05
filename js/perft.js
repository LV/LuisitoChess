var perft_leafNodes;

function Perft(depth) {
	if(depth == 0) {		// if depth = 0 then we are finished, return the number of leaf nodes
		perft_leafNodes++;	// return number of leaf nodes + 1 (since current position is a leaf node)
		return;
	}

	GenerateMoves();

	var index, move;

	for(index = GameBoard.moveListStart[GameBoard.ply]; index < GameBoard.moveListStart[GameBoard.ply + 1]; ++index) {
		move = GameBoard.moveList[index];
		if(!MakeMove(move)) {
			continue;		// continue and don't do anything if the move is illegal
		}
		Perft(depth - 1);
		TakeMove();			// Take the move back to its original position
	}
	return;
}

// Perf divide to locate possible leaf node bugs
// Perf dividing is seeing how many moves lie within a possible move
/*
Example:
Total moves: 9847153

Moves:
e4e5		30481
	a3a4	2342
	a4a5	9308
	...
e5e6		93104
	a3a4	3925
	a4a5	7667
	...
...
*/

function PerftTest(depth) {
	PrintBoard();
	console.log("Starting to test to depth: " + depth);
	perft_leafNodes = 0;

	var index, move;
	var moveNum = 0;
	GenerateMoves();
	for(index = GameBoard.moveListStart[GameBoard.ply]; index < GameBoard.moveListStart[GameBoard.ply + 1]; ++index) {
		move = GameBoard.moveList[index];
		if(!MakeMove(move)) {
			continue;		// same as original function
		}
		moveNum++;
		var cummulativeNodes = perft_leafNodes;
		Perft(depth - 1);
		TakeMove();
		var oldnodes = perft_leafNodes - cummulativeNodes;
		console.log("move: " + moveNum + " " + PrMove(move) + " " + oldnodes);	// printing perf divide moves
	}
	console.log("Test complete: " + perft_leafNodes + " leaf nodes visited");
	return;
}
