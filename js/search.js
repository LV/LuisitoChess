var SearchController = {};

SearchController.nodes;		// Number of positions visited including non-leaf nodes
SearchController.fh;		// Fail high
SearchController.fhf;		// Fail high first
							// Used for alpha-beta search
							// gives a percentage to indicate how well the move-ordering function operates
SearchController.depth;
SearchController.time;
SearchController.start;		// time that the search started
SearchController.stop;
SearchController.best;		// holds the best move found
SearchController.thinking;	// flag used to indicate whether a search is being operated

function ClearPvTable() {
	for(index = 0; index < PVENTRIES; index++) {
		GameBoard.PvTable[index].move = NOMOVE;
		GameBoard.PvTable[index].posKey = 0;
	}
}

function CheckUp() {
	if(($.now() - SearchController.start) > SearchController.time) {
		SearchController.stop = BOOL.TRUE;
	}
}

function IsRepetition() {
	// any captures result in permanent changes in a position
	var index = 0;

	for(index = (GameBoard.hisPly - GameBoard.fiftyMove); index < GameBoard.hisPly - 1; ++ index) {	// (hisPly - 1) because of opponent move
		if(GameBoard.posKey == GameBoard.history[index].posKey) {
			return BOOL.TRUE;
		}
	}

	return BOOL.FALSE;
}

function Quiescence(alpha, beta) {
	// same first part as AlphaBeta
	if((SearchController.nodes & 2047) == 0) {
		CheckUp();
	}

	SearchController.nodes++;

	if((IsRepetition() || (GameBoard.fiftyMove >= 100)) && GameBoard.ply != 0) {
		return 0;
	}
	

	if(GameBoard.ply > MAXDEPTH - 1) {
		return EvalPosition();
	}

	var Score = EvalPosition();

	// Since only looking at captures, do standing pat (not doing anything):
	// if we decide not to anything, then take static score from our POV
	// if that score is above beta, then return beta since we're going to beat it anyway
	// in other words: there will be better moves regardless of capturing
	if(Score >= beta) {
		return beta;
	}

	if(Score > alpha) {
		alpha = Score;	// make alpha level to our score
	}

	GenerateCaptures();

	var MoveNum = 0;
	var Legal = 0;
	var OldAlpha = alpha;
	var BestMove = NOMOVE;
	var Move = NOMOVE;

	// Get PvMove
	// OrderPvMove

	for(MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; ++MoveNum) {
		// pick next best move

		Move = GameBoard.moveList[MoveNum];

		if(MakeMove(Move) == BOOL.FALSE) {	// check if legal move
			continue;
		}
		Legal++;
		Score = -Quiescence(-beta, -alpha);	// Carry on searching quiescence due to only caring about capture moves

		TakeMove();

		if(SearchController.stop == BOOL.TRUE) {
			return 0;
		}

		if(Score > alpha) {
			if(Score >= beta) {
				if(Legal == 1) {
					SearchController.fhf++;
				}
				SearchController.fh++;
				// TODO: update killer moves

				return beta;
			}
			alpha = Score;
			BestMove = Move;
			// TODO: update history table
		}
	}

	if(alpha != OldAlpha) {
		StorePvMove(BestMove);
	}

	return alpha;
}

function AlphaBeta(alpha, beta, depth) {
	if(depth <= 0) {
		return Quiescence(alpha, beta);	// improves quality of lines found by engine
	}

	if((SearchController.nodes & 2047) == 0) {
		CheckUp();	// perform a checkup every 2048 nodes
	}

	SearchController.nodes++;	// since position has been evaluated, increment node count

	// check if we have run out of time for thinking

	if((IsRepetition() || (GameBoard.fiftyMove >= 100)) && GameBoard.ply != 0) {
		return 0;
	}

	if(GameBoard.ply > MAXDEPTH - 1) {	// extremely rare to reach this condition, but possibles
		return EvalPosition();
	}
	
	var InCheck = SqAttacked(GameBoard.pList[PCEINDEX(Kings[GameBoard.side], 0)], GameBoard.side^1);
	if(InCheck == BOOL.TRUE) {
		depth++;	// Increase the depth because the amount of moves to get out of check is extremely limited, and more often then not they lead to a checkmate
	}

	var Score = -INFINITE;

	GenerateMoves();

	var MoveNum = 0;
	var Legal = 0;
	var OldAlpha = alpha;
	var BestMove = NOMOVE;
	var Move = NOMOVE;

	for(MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; ++MoveNum) {
		Move = GameBoard.moveList[MoveNum];
		if(MakeMove(Move) == BOOL.FALSE) {
			continue;
		}
		Legal++;	// increment legal move counter since current move is legal
		Score = -AlphaBeta(-beta, -alpha, depth-1);

		TakeMove();
		if(SearchController.stop == BOOL.TRUE) {	// if we run out of time
			return 0;	// return 0 since we dont want to make a move while having analyzed only half depth
		}

		if(Score > alpha) {
			if(Score >= beta) {	// No point in continuing if score is higher than beta cutoff
				// following is used for statistical purposes purely
				if(Legal == 1) {
					SearchController.fhf++;
				}
				SearchController.fh++;
				// TODO: Update killer moves
				return beta;
			}
			alpha = Score;
			BestMove = Move;
			// TODO: Update history table
		}
	}

	if(Legal == 0) {
		if(InCheck == BOOL.TRUE) {
			return -MATE + GameBoard.ply;	// tells us how many moves we are away from checkmate
		} else {
			return 0;						// return draw score if it is a stalemate
		}
	}

	if(alpha != OldAlpha) {
		StorePvMove(BestMove);
	}

	return alpha;
}

function ClearForSearch() {
	var index = 0;
	var index2 = 0;

	for(index = 0; index < 13 * BRD_SQ_NUM; ++index) {
		GameBoard.searchHistory[index] = 0;
	}

	for(index = 0; index < 3 * MAXDEPTH; ++index) {
		GameBoard.searchKillers[index] = 0;
	}

	ClearPvTable();
	GameBoard.ply = 0;
	SearchController.nodes = 0;
	SearchController.fh = 0;
	SearchController.fhf = 0;
	SearchController.start = $.now();	// set to current time
	SearchController.stop = BOOL.FALSE;
}


function SearchPosition() {
	var bestMove = NOMOVE;
	var bestScore = -INFINITE;
	var currentDepth = 0;
	var line;
	var PvNum;
	var c;

	ClearForSearch();

	// Using iterative deepening
	for(currentDepth = 1; currentDepth <= /*SearchController.depth*/ 5; ++currentDepth) {
		bestScore = AlphaBeta(-INFINITE, INFINITE, currentDepth);
		// Call alpha-beta algorithm
		if(SearchController.stop == BOOL.TRUE) {
			break;
		}
		bestMove = ProbePvTable();
		line = 'Depth:' + currentDepth + ',  Best:' + PrMove(bestMove) + ',  Score:' + bestScore + ',  Nodes:' + SearchController.nodes;
		PvNum = GetPvLine(currentDepth);
		line += ',  Pv:';
		for(c = 0; c < PvNum; ++c) {
			line += ' ' + PrMove(GameBoard.PvArray[c]);
		}
		console.log(line);
	}

	SearchController.best = bestMove;
	thinking = BOOL.FALSE;
}
