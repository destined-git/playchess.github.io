// Chess AI using Minimax Algorithm with Alpha-Beta Pruning
class ChessAI {
    constructor(difficulty = 2) {
        this.difficulty = difficulty;
        this.maxDepth = this.getDepthFromDifficulty(difficulty);
        this.transpositionTable = new Map();
        this.killerMoves = Array(10).fill(null).map(() => []);
        this.historyTable = {};
    }

    // Get search depth based on difficulty level
    getDepthFromDifficulty(difficulty) {
        switch (difficulty) {
            case 1: return 2; // Easy
            case 2: return 3; // Medium
            case 3: return 4; // Hard
            case 4: return 5; // Expert
            default: return 3;
        }
    }

    // Set difficulty level
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.maxDepth = this.getDepthFromDifficulty(difficulty);
    }

    // Get the best move for the AI
    getBestMove(game) {
        this.transpositionTable.clear();
        this.killerMoves = Array(10).fill(null).map(() => []);
        
        const startTime = Date.now();
        
        // First, check if we're in check and find all moves that get us out of check
        const aiColor = game.currentPlayer;
        if (game.isInCheck(aiColor)) {
            const allMoves = [];
            const pieces = game.getPieces(aiColor);
            
            // Try all possible moves to see which ones get us out of check
            for (const piece of pieces) {
                const moves = game.getLegalMoves(piece);
                for (const [toRow, toCol] of moves) {
                    const gameClone = game.cloneGame();
                    if (gameClone.makeMove(piece.row, piece.col, toRow, toCol)) {
                        if (!gameClone.isInCheck(aiColor)) {
                            allMoves.push({
                                from: [piece.row, piece.col],
                                to: [toRow, toCol],
                                piece: piece.type,
                                captured: game.getPieceAt(toRow, toCol)?.type || null
                            });
                        }
                    }
                }
            }
            
            // If we found moves that get us out of check, pick one at random
            if (allMoves.length > 0) {
                console.log('AI is in check, found', allMoves.length, 'moves to get out of check');
                return allMoves[Math.floor(Math.random() * allMoves.length)];
            }
        }
        
        // If not in check or no moves found, use the normal minimax
        const result = this.minimax(game, this.maxDepth, -Infinity, Infinity, true);
        const endTime = Date.now();
        
        console.log(`AI thinking time: ${endTime - startTime}ms`);
        console.log(`Evaluated position score: ${result.score}`);
        
        return result.move;
    }

    // Minimax algorithm with alpha-beta pruning
    minimax(game, depth, alpha, beta, isMaximizing) {
        // Check transposition table
        const boardHash = this.getBoardHash(game);
        const ttEntry = this.transpositionTable.get(boardHash);
        if (ttEntry && ttEntry.depth >= depth) {
            return ttEntry;
        }

        // Base case: reached maximum depth or game over
        if (depth === 0 || game.gameState !== 'playing') {
            const score = this.evaluatePosition(game);
            return { score, move: null };
        }

        const moves = this.getAllPossibleMoves(game);
        
        // No moves available
        if (moves.length === 0) {
            const score = game.isInCheck(game.currentPlayer) ? -20000 : 0;
            return { score, move: null };
        }

        // Order moves for better pruning
        this.orderMoves(moves, game, depth);

        let bestMove = null;
        let bestScore = isMaximizing ? -Infinity : Infinity;

        for (const move of moves) {
            // Make the move
            const gameClone = this.cloneGame(game);
            const moveSuccess = gameClone.makeMove(move.from[0], move.from[1], move.to[0], move.to[1]);
            
            if (!moveSuccess) continue;

            // Recursive call
            const result = this.minimax(gameClone, depth - 1, alpha, beta, !isMaximizing);
            const score = result.score;

            if (isMaximizing) {
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                alpha = Math.max(alpha, score);
            } else {
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
                beta = Math.min(beta, score);
            }

            // Alpha-beta pruning
            if (beta <= alpha) {
                // Store killer move
                if (!move.captured && depth < this.killerMoves.length) {
                    this.killerMoves[depth].unshift(move);
                    this.killerMoves[depth] = this.killerMoves[depth].slice(0, 2);
                }
                break;
            }
        }

        // Store in transposition table
        const result = { score: bestScore, move: bestMove, depth };
        this.transpositionTable.set(boardHash, result);

        return result;
    }

    // Get all possible moves for the current player
    getAllPossibleMoves(game) {
        const moves = [];
        const pieces = game.getPieces(game.currentPlayer);

        for (const piece of pieces) {
            const legalMoves = game.getLegalMoves(piece);
            for (const [toRow, toCol] of legalMoves) {
                const capturedPiece = game.getPieceAt(toRow, toCol);
                moves.push({
                    from: [piece.row, piece.col],
                    to: [toRow, toCol],
                    piece: piece.type,
                    captured: capturedPiece ? capturedPiece.type : null
                });
            }
        }

        return moves;
    }

    // Order moves for better alpha-beta pruning
    orderMoves(moves, game, depth) {
        moves.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;

            // Prioritize captures
            if (a.captured) scoreA += 1000 + PIECE_VALUES[a.captured];
            if (b.captured) scoreB += 1000 + PIECE_VALUES[b.captured];

            // Prioritize checks
            const gameCloneA = this.cloneGame(game);
            if (gameCloneA.makeMove(a.from[0], a.from[1], a.to[0], a.to[1])) {
                if (gameCloneA.isInCheck(gameCloneA.currentPlayer === 'WHITE' ? 'BLACK' : 'WHITE')) {
                    scoreA += 500;
                }
            }

            const gameCloneB = this.cloneGame(game);
            if (gameCloneB.makeMove(b.from[0], b.from[1], b.to[0], b.to[1])) {
                if (gameCloneB.isInCheck(gameCloneB.currentPlayer === 'WHITE' ? 'BLACK' : 'WHITE')) {
                    scoreB += 500;
                }
            }

            // Prioritize killer moves
            if (depth < this.killerMoves.length) {
                const killers = this.killerMoves[depth];
                if (killers.some(killer => this.movesEqual(killer, a))) scoreA += 100;
                if (killers.some(killer => this.movesEqual(killer, b))) scoreB += 100;
            }

            // Prioritize central squares
            const centerBonus = (row, col) => {
                const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
                return 10 - centerDistance;
            };
            scoreA += centerBonus(a.to[0], a.to[1]);
            scoreB += centerBonus(b.to[0], b.to[1]);

            return scoreB - scoreA;
        });
    }

    // Check if two moves are equal
    movesEqual(move1, move2) {
        if (!move1 || !move2) return false;
        return move1.from[0] === move2.from[0] && 
               move1.from[1] === move2.from[1] && 
               move1.to[0] === move2.to[0] && 
               move1.to[1] === move2.to[1];
    }

    // Evaluate the current position
    evaluatePosition(game) {
        if (game.gameState === 'checkmate') {
            return game.currentPlayer === 'BLACK' ? 20000 : -20000;
        }
        if (game.gameState === 'stalemate' || game.gameState === 'draw') {
            return 0;
        }

        let score = 0;
        const isEndgame = game.isEndgame();

        // Material and positional evaluation
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.getPieceAt(row, col);
                if (piece) {
                    let pieceScore = piece.getValue() + piece.getPositionalValue(isEndgame);
                    
                    // Bonus for piece mobility
                    const mobility = piece.getPossibleMoves(game.board).length;
                    pieceScore += mobility * 2;
                    
                    // Bonus for piece safety
                    const oppositeColor = piece.color === 'WHITE' ? 'BLACK' : 'WHITE';
                    if (!game.isSquareUnderAttack(row, col, oppositeColor)) {
                        pieceScore += 10;
                    }
                    
                    score += piece.color === 'WHITE' ? pieceScore : -pieceScore;
                }
            }
        }

        // King safety evaluation
        score += this.evaluateKingSafety(game, 'WHITE') - this.evaluateKingSafety(game, 'BLACK');

        // Pawn structure evaluation
        score += this.evaluatePawnStructure(game, 'WHITE') - this.evaluatePawnStructure(game, 'BLACK');

        // Control of center
        score += this.evaluateCenterControl(game, 'WHITE') - this.evaluateCenterControl(game, 'BLACK');

        // Add some randomness for easier difficulties
        if (this.difficulty < 3) {
            score += (Math.random() - 0.5) * 50 * (4 - this.difficulty);
        }

        return score;
    }

    // Evaluate king safety
    evaluateKingSafety(game, color) {
        const kingPos = game.kingPositions[color];
        const oppositeColor = color === 'WHITE' ? 'BLACK' : 'WHITE';
        let safety = 0;

        // Penalty for king in center during opening/middlegame
        if (!game.isEndgame()) {
            const centerDistance = Math.abs(3.5 - kingPos[0]) + Math.abs(3.5 - kingPos[1]);
            safety += centerDistance * 10;
        }

        // Penalty for exposed king
        const attackers = this.getAttackersCount(game, kingPos[0], kingPos[1], oppositeColor);
        safety -= attackers * 20;

        // Bonus for pawn shield
        const pawnShield = this.getPawnShieldValue(game, kingPos, color);
        safety += pawnShield;

        return safety;
    }

    // Count attackers on a square
    getAttackersCount(game, row, col, color) {
        let count = 0;
        const pieces = game.getPieces(color);
        
        for (const piece of pieces) {
            const moves = piece.getPossibleMoves(game.board);
            if (moves.some(([r, c]) => r === row && c === col)) {
                count++;
            }
        }
        
        return count;
    }

    // Evaluate pawn shield around king
    getPawnShieldValue(game, kingPos, color) {
        let shield = 0;
        const [kingRow, kingCol] = kingPos;
        const direction = color === 'WHITE' ? -1 : 1;

        for (let colOffset = -1; colOffset <= 1; colOffset++) {
            const col = kingCol + colOffset;
            if (col >= 0 && col < 8) {
                const pawn = game.getPieceAt(kingRow + direction, col);
                if (pawn && pawn.type === 'PAWN' && pawn.color === color) {
                    shield += 15;
                }
            }
        }

        return shield;
    }

    // Evaluate pawn structure
    evaluatePawnStructure(game, color) {
        let score = 0;
        const pawns = game.getPieces(color).filter(p => p.type === 'PAWN');

        // Doubled pawns penalty
        const pawnFiles = {};
        for (const pawn of pawns) {
            pawnFiles[pawn.col] = (pawnFiles[pawn.col] || 0) + 1;
        }
        for (const file in pawnFiles) {
            if (pawnFiles[file] > 1) {
                score -= 10 * (pawnFiles[file] - 1);
            }
        }

        // Isolated pawns penalty
        for (const pawn of pawns) {
            const hasNeighbor = pawns.some(p => Math.abs(p.col - pawn.col) === 1);
            if (!hasNeighbor) {
                score -= 15;
            }
        }

        // Passed pawns bonus
        for (const pawn of pawns) {
            if (this.isPassedPawn(game, pawn)) {
                const rank = color === 'WHITE' ? 7 - pawn.row : pawn.row;
                score += 20 + rank * 10;
            }
        }

        return score;
    }

    // Check if pawn is passed
    isPassedPawn(game, pawn) {
        const oppositeColor = pawn.color === 'WHITE' ? 'BLACK' : 'WHITE';
        const direction = pawn.color === 'WHITE' ? -1 : 1;
        const enemyPawns = game.getPieces(oppositeColor).filter(p => p.type === 'PAWN');

        for (const enemyPawn of enemyPawns) {
            if (Math.abs(enemyPawn.col - pawn.col) <= 1) {
                if (pawn.color === 'WHITE' && enemyPawn.row < pawn.row) return false;
                if (pawn.color === 'BLACK' && enemyPawn.row > pawn.row) return false;
            }
        }

        return true;
    }

    // Evaluate center control
    evaluateCenterControl(game, color) {
        let control = 0;
        const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
        const pieces = game.getPieces(color);

        for (const [row, col] of centerSquares) {
            for (const piece of pieces) {
                const moves = piece.getPossibleMoves(game.board);
                if (moves.some(([r, c]) => r === row && c === col)) {
                    control += 5;
                }
            }
        }

        return control;
    }

    // Generate a simple hash for the board position
    getBoardHash(game) {
        let hash = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.getPieceAt(row, col);
                if (piece) {
                    hash += piece.color.charAt(0) + piece.type.charAt(0);
                } else {
                    hash += '--';
                }
            }
        }
        hash += game.currentPlayer.charAt(0);
        return hash;
    }

    // Clone the game state
    cloneGame(game) {
        const cloned = new ChessGame();
        
        // Clone board
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.getPieceAt(row, col);
                if (piece) {
                    cloned.board[row][col] = piece.clone();
                }
            }
        }
        
        // Copy game state
        cloned.currentPlayer = game.currentPlayer;
        cloned.gameState = game.gameState;
        cloned.kingPositions = { ...game.kingPositions };
        cloned.enPassantTarget = game.enPassantTarget;
        cloned.halfMoveClock = game.halfMoveClock;
        cloned.fullMoveNumber = game.fullMoveNumber;
        
        return cloned;
    }

    // Get a hint for the human player
    getHint(game) {
        const originalPlayer = game.currentPlayer;
        game.currentPlayer = 'WHITE'; // Assume human is white
        
        const bestMove = this.getBestMove(game);
        game.currentPlayer = originalPlayer;
        
        return bestMove;
    }
}