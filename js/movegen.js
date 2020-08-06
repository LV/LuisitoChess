const MvvLvaValue = [0, 100, 200, 300, 400, 500, 600, 100, 200, 300, 400, 500, 600];	// MVV -> Most valuable victim
																						// LVA -> Least valuable attacker
																						// searches capture moves in score maximizing fashion
																						// PxQ, NxQ, ..., KxQ, PxR, NxR, ..., QxP, KxP
var MvvLvaScores = new Array(14 * 14);

function InitMvvLva() {
	var Attacker, Victim;

	for(Attacker = PIECES.wP; Attacker <= PIECES.bK; ++Attacker) {
		for(Victim = PIECES.wP; Victim <= PIECES.bK; ++Victim) {
			MvvLvaScores[Victim * 14 + Attacker] = ((MvvLvaValue[Victim] + 6) - (MvvLvaValue[Attacker] / 100));
			// P x Q -> 506 - 1 = 505
			// N x Q -> 506 - 2 = 504
			// B x Q -> 506 - 3 = 503
			// ...
			// Q x P -> 106 - 5 = 101
			// K x P -> 106 - 6 = 100
			// capture order is preserved this way
		} 
	}
}

function MoveExists(move) {
	GenerateMoves();	// generate all moves in current position

	var index;
	var moveFound = NOMOVE;

	for(index = GameBoard.moveListStart[GameBoard.ply]; index < GameBoard.moveListStart[GameBoard.ply + 1]; ++index) {
		moveFound = GameBoard.moveList[index];
		if(!MakeMove(moveFound)) {
			continue;
		}
		TakeMove();
		// for each move in the move list, check if it is the same as the argument move, if found then it is legal
		if(move == moveFound) {
			return true;
		}
	}
	
	return false;
}

function MOVE(from, to, captured, promoted, flag) {
	// constructs our entire move into a single digit as described above
	// combine all bits by shifting them leftware and the performing bitwise OR
	return (from | (to << 7) | (captured << 14) | (promoted << 20) | flag);
}

function AddCaptureMove(move) {
	GameBoard.moveList[GameBoard.moveListStart[GameBoard.ply+1]] = move;
	GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply+1]++] = MvvLvaScores[CAPTURED(move) * 14 + GameBoard.pieces[FROMSQ(move)]] + 1000000;	// incrementing the value within the array
}

function AddQuietMove(move) {
	GameBoard.moveList[GameBoard.moveListStart[GameBoard.ply + 1]] = move;
	GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply+1]] = 0;	// incrementing the value within the array

	if(move == GameBoard.searchKillers[GameBoard.ply]) {	// check if we have Killer Move 1
		GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] = 900000;
	} else if (move == GameBoard.searchKillers[GameBoard.ply + MAXDEPTH]) {	// otherwise check if we have Killer Move 2
		GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] = 800000;
	} else {
		GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply + 1]] = GameBoard.searchHistory[GameBoard.pieces[FROMSQ(move)] * BRD_SQ_NUM + TOSQ(move)];
	}

	GameBoard.moveListStart[GameBoard.ply + 1]++;
}

function AddEnPassantMove(move) {
	GameBoard.moveList[GameBoard.moveListStart[GameBoard.ply+1]] = move;
	GameBoard.moveScores[GameBoard.moveListStart[GameBoard.ply+1]++] = (105 + 1000000);	// incrementing the value within the array
																						// PxP is a value of 105 in MvvLva
}

function AddWhitePawnCaptureMove(from, to, cap) {
	if(RanksBrd[from]==RANKS.RANK_7) {
		AddCaptureMove(MOVE(from, to, cap, PIECES.wQ, 0));		// pawn capture promoting to a queen
		AddCaptureMove(MOVE(from, to, cap, PIECES.wN, 0));		// pawn capture promoting to a knight
		AddCaptureMove(MOVE(from, to, cap, PIECES.wR, 0));		// pawn capture promoting to a rook
		AddCaptureMove(MOVE(from, to, cap, PIECES.wB, 0));		// pawn capture promoting to a bishop
	} else {
		AddCaptureMove(MOVE(from, to, cap, PIECES.EMPTY, 0));	// pawn capture without promotion
	}
}

function AddBlackPawnCaptureMove(from, to, cap) {
	if(RanksBrd[from] == RANKS.RANK_2) {
		AddCaptureMove(MOVE(from, to, cap, PIECES.bQ, 0));		// pawn capture promoting to a queen
		AddCaptureMove(MOVE(from, to, cap, PIECES.bN, 0));		// pawn capture promoting to a knight
		AddCaptureMove(MOVE(from, to, cap, PIECES.bR, 0));		// pawn capture promoting to a rook
		AddCaptureMove(MOVE(from, to, cap, PIECES.bB, 0));		// pawn capture promoting to a bishop
	} else {
		AddCaptureMove(MOVE(from, to, cap, PIECES.EMPTY, 0));	// pawn capture without promotion
	}
}

function AddWhitePawnQuietMove(from, to) {
	if(RanksBrd[from] == RANKS.RANK_7) {
		AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wQ, 0));		// pawn promoting to a queen
		AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wN, 0));		// pawn promoting to a knight
		AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wR, 0));		// pawn promoting to a rook
		AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.wB, 0));		// pawn promoting to a bishop
	} else {
		AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.EMPTY, 0));	// regular pawn move
	}
}

function AddBlackPawnQuietMove(from, to) {
	if(RanksBrd[from] == RANKS.RANK_2) {
		AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bQ, 0));		// pawn promoting to a queen
		AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bN, 0));		// pawn promoting to a knight
		AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bR, 0));		// pawn promoting to a rook
		AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.bB, 0));		// pawn promoting to a bishop
	} else {
		AddQuietMove(MOVE(from, to, PIECES.EMPTY, PIECES.EMPTY, 0));	// regular pawn move
	}
}

function GenerateMoves() {
	GameBoard.moveListStart[GameBoard.ply+1] = GameBoard.moveListStart[GameBoard.ply];	// set the next move initially equal to the previous board
																						// able to make the move with the previous board from that point
	var pceType, pceNum, sq, pceIndex, pce, t_sq, dir;

	// Generate pawn moves
	if(GameBoard.side == COLORS.WHITE) {
		pceType = PIECES.wP;
		
		for(pceNum = 0; pceNum < GameBoard.pceNum[pceType]; ++pceNum) {
			sq = GameBoard.pList[PCEINDEX(pceType, pceNum)];	// gets the tile coordinates which the pawn is sitting ong

			if(GameBoard.pieces[sq + 10] == PIECES.EMPTY) {
				AddWhitePawnQuietMove(sq, sq + 10);
				if((RanksBrd[sq] == RANKS.RANK_2) && (GameBoard.pieces[sq + 20] == PIECES.EMPTY)) {
					AddQuietMove(MOVE(sq, sq + 20, PIECES.EMPTY, PIECES.EMPTY, MFLAGPS));
				}
			}

			if(!SQOFFBOARD(sq + 9) && (PieceCol[GameBoard.pieces[sq + 9]] == COLORS.BLACK)) {
				AddWhitePawnCaptureMove(sq, sq + 9, GameBoard.pieces[sq + 9]);
			}
			if(!SQOFFBOARD(sq + 11) && (PieceCol[GameBoard.pieces[sq + 11]] == COLORS.BLACK)) {
				AddWhitePawnCaptureMove(sq, sq + 11, GameBoard.pieces[sq + 11]);
			}

			if(GameBoard.enPas != SQUARES.NO_SQ) {
				if(sq + 9 == GameBoard.enPas) {
					AddEnPassantMove(MOVE(sq, sq + 9, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));	// MFLAGEP will handle the captured pawn, hence no need to add it to the Move
				}
				if(sq + 11 == GameBoard.enPas) {
					AddEnPassantMove(MOVE(sq, sq + 11, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));	// MFLAGEP will handle the captured pawn, hence no need to add it to the Move
				}
			}
		}
		// Generate castling moves
		if(GameBoard.castlePerm & CASTLEBIT.WKCA) {
			if((GameBoard.pieces[SQUARES.F1] == PIECES.EMPTY) && (GameBoard.pieces[SQUARES.G1] == PIECES.EMPTY)) {
				if(!SqAttacked(SQUARES.E1, COLORS.BLACK) && !SqAttacked(SQUARES.F1, COLORS.BLACK) && !SqAttacked(SQUARES.G1, COLORS.BLACK)) {
					AddQuietMove(MOVE(SQUARES.E1, SQUARES.G1, PIECES.EMPTY, PIECES.EMPTY, MFLAGCA));
				}
			}
		}
		if(GameBoard.castlePerm & CASTLEBIT.WQCA) {
			if((GameBoard.pieces[SQUARES.B1] == PIECES.EMPTY) && (GameBoard.pieces[SQUARES.C1] == PIECES.EMPTY) && (GameBoard.pieces[SQUARES.D1] == PIECES.EMPTY)) {
				if(!SqAttacked(SQUARES.C1, COLORS.BLACK) && !SqAttacked(SQUARES.D1, COLORS.BLACK) && !SqAttacked(SQUARES.E1, COLORS.BLACK)) {
					AddQuietMove(MOVE(SQUARES.E1, SQUARES.C1, PIECES.EMPTY, PIECES.EMPTY, MFLAGCA));
				}
			}
		}
	} else {
		pceType = PIECES.bP;

		for(pceNum = 0; pceNum < GameBoard.pceNum[pceType]; ++pceNum) {
			sq = GameBoard.pList[PCEINDEX(pceType, pceNum)];	// gets the tile coordinates which the pawn is sitting ong

			if(GameBoard.pieces[sq - 10] == PIECES.EMPTY) {
				AddBlackPawnQuietMove(sq, sq - 10);
				if((RanksBrd[sq] == RANKS.RANK_7) && (GameBoard.pieces[sq - 20] == PIECES.EMPTY)) {
					AddQuietMove(MOVE(sq, sq - 20, PIECES.EMPTY, PIECES.EMPTY, MFLAGPS));
				}
			}

			if(!SQOFFBOARD(sq - 9) && (PieceCol[GameBoard.pieces[sq - 9]] == COLORS.WHITE)) {
				AddBlackPawnCaptureMove(sq, sq - 9, GameBoard.pieces[sq - 9]);
			}
			if(!SQOFFBOARD(sq - 11) && (PieceCol[GameBoard.pieces[sq - 11]] == COLORS.WHITE)) {
				AddBlackPawnCaptureMove(sq, sq - 11, GameBoard.pieces[sq - 11]);
			}

			if(GameBoard.enPas != SQUARES.NO_SQ) {
				if(sq - 9 == GameBoard.enPas) {
					AddEnPassantMove(MOVE(sq, sq - 9, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));	// MFLAGEP will handle the captured pawn, hence no need to add it to the Move
				}
				if(sq - 11 == GameBoard.enPas) {
					AddEnPassantMove(MOVE(sq, sq - 11, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));	// MFLAGEP will handle the captured pawn, hence no need to add it to the Move
				}
			}
		}
		// Generate castling moves
		if(GameBoard.castlePerm & CASTLEBIT.BKCA) {
			if((GameBoard.pieces[SQUARES.F8] == PIECES.EMPTY) && (GameBoard.pieces[SQUARES.G8] == PIECES.EMPTY)) {
				if(!SqAttacked(SQUARES.E8, COLORS.WHITE) && !SqAttacked(SQUARES.F8, COLORS.WHITE) && !SqAttacked(SQUARES.G8, COLORS.WHITE)) {
					AddQuietMove(MOVE(SQUARES.E8, SQUARES.G8, PIECES.EMPTY, PIECES.EMPTY, MFLAGCA));
				}
			}
		}
		if(GameBoard.castlePerm & CASTLEBIT.BQCA) {
			if((GameBoard.pieces[SQUARES.B8] == PIECES.EMPTY) && (GameBoard.pieces[SQUARES.C8] == PIECES.EMPTY) && (GameBoard.pieces[SQUARES.D8] == PIECES.EMPTY)) {
				if(!SqAttacked(SQUARES.C8, COLORS.WHITE) && !SqAttacked(SQUARES.D8, COLORS.WHITE) && !SqAttacked(SQUARES.E8, COLORS.WHITE)) {
					AddQuietMove(MOVE(SQUARES.E8, SQUARES.C8, PIECES.EMPTY, PIECES.EMPTY, MFLAGCA));
				}
			}
		}
	}
	// Non sliding pieces -> have only one move per direction
	pceIndex = LoopNonSlideIndex[GameBoard.side];
	pce = LoopNonSlidePiece[pceIndex++];
	while(pce != 0) {
		for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
			sq = GameBoard.pList[PCEINDEX(pce, pceNum)];

			for(index = 0; index < DirNum[pce]; index++) {
				dir = PceDir[pce][index];
				t_sq = sq + dir;

				if(SQOFFBOARD(t_sq)) {
					continue;
				}

				if(GameBoard.pieces[t_sq] != PIECES.EMPTY) {
					if(PieceCol[GameBoard.pieces[t_sq]] != GameBoard.side) {
						AddCaptureMove(MOVE(sq, t_sq, GameBoard.pieces[t_sq], PIECES.EMPTY, 0));	// captured piece is GameBoard.pieces[t_sq]
																									// No piece is promoted, hence PIECES.EMPTY
																									// No flag, hence 0
					}
				} else {
					AddQuietMove(MOVE(sq, t_sq, PIECES.EMPTY, PIECES.EMPTY, 0));					// No captures, hence PIECES.EMPTY
				}
			}
		}
		pce = LoopNonSlidePiece[pceIndex++];
	}

	// Sliding pieces -> have multiple moves per direction
	pceIndex = LoopSlideIndex[GameBoard.side];
	pce = LoopSlidePiece[pceIndex++];
	while(pce != 0) {
		for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
			sq = GameBoard.pList[PCEINDEX(pce, pceNum)];

			for(index = 0; index < DirNum[pce]; index++) {
				dir = PceDir[pce][index];
				t_sq = sq + dir;			// next square is equal to the current square plus given direction
				while(!SQOFFBOARD(t_sq)) {
					if(GameBoard.pieces[t_sq] != PIECES.EMPTY) {
						if(PieceCol[GameBoard.pieces[t_sq]] != GameBoard.side) {
							AddCaptureMove(MOVE(sq, t_sq, GameBoard.pieces[t_sq], PIECES.EMPTY, 0));	// same capture move as NonSlidingPieces
						}
						break;
					}
					AddQuietMove(MOVE(sq, t_sq, PIECES.EMPTY, PIECES.EMPTY, 0));	// same as NonSlidingPiece function
					t_sq += dir;
				}
			}
		}
		pce = LoopSlidePiece[pceIndex++];
	}
}

// Generate capture moves only, used for quiescence search
function GenerateCaptures() {
	GameBoard.moveListStart[GameBoard.ply + 1] = GameBoard.moveListStart[GameBoard.ply];

	var pceType, pceNum, sq, pceIndex, pce, t_sq, dir;
	if(GameBoard.side == COLORS.WHITE) {
		pceType = PIECES.wP;

		for(pceNum = 0; pceNum < GameBoard.pceNum[pceType]; ++pceNum) {
			sq = GameBoard.pList[PCEINDEX(pceType, pceNum)];

			if(!SQOFFBOARD(sq + 9) && (PieceCol[GameBoard.pieces[sq + 9]] == COLORS.BLACK)) {
				AddWhitePawnCaptureMove(sq, sq + 9, GameBoard.pieces[sq + 9]);
			}
			if(!SQOFFBOARD(sq + 11) && (PieceCol[GameBoard.pieces[sq + 11]] == COLORS.BLACK)) {
				AddWhitePawnCaptureMove(sq, sq + 11, GameBoard.pieces[sq + 11]);
			}

			if(GameBoard.enPas != SQUARES.NO_SQ) {
				if(sq + 9 == GameBoard.enPas) {
					AddEnPassantMove(MOVE(sq, sq + 9, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
				}
				if(sq + 11 == GameBoard.enPas) {
					AddEnPassantMove(MOVE(sq, sq + 11, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
				}
			}
		}
	} else {
		pceType = PIECES.bP;

		for(pceNum = 0; pceNum < GameBoard.pceNum[pceType]; ++pceNum) {
			sq = GameBoard.pList[PCEINDEX(pceType, pceNum)];

			if(!SQOFFBOARD(sq - 9) && (PieceCol[GameBoard.pieces[sq - 9]] == COLORS.WHITE)) {
				AddBlackPawnCaptureMove(sq, sq - 9, GameBoard.pieces[sq - 9]);
			}
			if(!SQOFFBOARD(sq - 11) && (PieceCol[GameBoard.pieces[sq - 11]] == COLORS.WHITE)) {
				AddBlackPawnCaptureMove(sq, sq - 11, GameBoard.pieces[sq - 11]);
			}

			if(GameBoard.enPas != SQUARES.NO_SQ) {
				if(sq - 9 == GameBoard.enPas) {
					AddEnPassantMove(MOVE(sq, sq - 9, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
				}
				if(sq - 11 == GameBoard.enPas) {
					AddEnPassantMove(MOVE(sq, sq - 11, PIECES.EMPTY, PIECES.EMPTY, MFLAGEP));
				}
			}
		}
	}

	pceIndex = LoopNonSlideIndex[GameBoard.side];
	pce = LoopNonSlidePiece[pceIndex++];

	while(pce != 0) {
		for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
			sq = GameBoard.pList[PCEINDEX(pce, pceNum)];

			for(index = 0; index < DirNum[pce]; index++) {
				dir = PceDir[pce][index];
				t_sq = sq + dir;
				
				if(SQOFFBOARD(t_sq)) {
					continue;
				}

				if(GameBoard.pieces[t_sq] != PIECES.EMPTY) {
					if(PieceCol[GameBoard.pieces[t_sq]] != GameBoard.side) {
						AddCaptureMove(MOVE(sq, t_sq, GameBoard.pieces[t_sq], PIECES.EMPTY, 0));
					}
				}
			}
		}

		pce = LoopNonSlidePiece[pceIndex++];
	}

	pceIndex = LoopSlideIndex[GameBoard.side];
	pce = LoopSlidePiece[pceIndex++];

	while(pce != 0) {
		for(pceNum = 0; pceNum < GameBoard.pceNum[pce]; ++pceNum) {
			sq = GameBoard.pList[PCEINDEX(pce, pceNum)];

			for(index = 0; index < DirNum[pce]; index++) {
				dir = PceDir[pce][index];
				t_sq = sq + dir;

				while(!SQOFFBOARD(t_sq)) {
					if(GameBoard.pieces[t_sq] != PIECES.EMPTY) {
						if(PieceCol[GameBoard.pieces[t_sq]] != GameBoard.side) {
							AddCaptureMove(MOVE(sq, t_sq, GameBoard.pieces[t_sq], PIECES.EMPTY, 0));
						}
						break;
					}
					t_sq += dir;
				}
			}
		}
	
		pce = LoopSlidePiece[pceIndex++];
	}
}
