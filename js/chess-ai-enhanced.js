// Enhanced Chess AI with Advanced Algorithms
import { PIECE_VALUES } from './chess-pieces.js';
import { ChessGame } from './chess-logic.js';
import { ChessEvaluation } from './chess-evaluation.js';

class EnhancedChessAI {
  constructor(difficulty = 2) {
    this.difficulty = difficulty;
    this.maxDepth = this.getDepthFromDifficulty(difficulty);
    this.transpositionTable = new Map();
    this.killerMoves = Array(20).fill(null).map(() => []);
    this.historyTable = {};
    this.openingBook = this.initializeOpeningBook();
    this.moveCount = 0;
    this.nodesSearched = 0;
    this.zobristTable = this.initializeZobrist();
    this.pvTable = {}; // Principal variation table
    this.setDifficultyParameters(difficulty);
  }

  // Initialize Zobrist hashing for better transposition table
  initializeZobrist() {
    const table = {
      pieces: {},
      blackToMove: Math.random() * Number.MAX_SAFE_INTEGER | 0,
      castling: {},
      enPassant: {}
    };

    const pieceTypes = ['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING'];
    const colors = ['WHITE', 'BLACK'];

    // Generate random numbers for each piece at each square
    for (const color of colors) {
      table.pieces[color] = {};
      for (const piece of pieceTypes) {
        table.pieces[color][piece] = [];
        for (let i = 0; i < 64; i++) {
          table.pieces[color][piece].push(Math.random() * Number.MAX_SAFE_INTEGER | 0);
        }
      }
    }

    // Castling rights
    table.castling.whiteKingside = Math.random() * Number.MAX_SAFE_INTEGER | 0;
    table.castling.whiteQueenside = Math.random() * Number.MAX_SAFE_INTEGER | 0;
    table.castling.blackKingside = Math.random() * Number.MAX_SAFE_INTEGER | 0;
    table.castling.blackQueenside = Math.random() * Number.MAX_SAFE_INTEGER | 0;

    // En passant files
    for (let file = 0; file < 8; file++) {
      table.enPassant[file] = Math.random() * Number.MAX_SAFE_INTEGER | 0;
    }

    return table;
  }

  // Calculate Zobrist hash for a position
  getZobristHash(game) {
    let hash = 0;

    // Hash pieces
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = game.getPieceAt(row, col);
        if (piece) {
          const squareIndex = row * 8 + col;
          hash ^= this.zobristTable.pieces[piece.color][piece.type][squareIndex];
        }
      }
    }

    // Hash side to move
    if (game.currentPlayer === 'BLACK') {
      hash ^= this.zobristTable.blackToMove;
    }

    // Hash en passant
    if (game.enPassantTarget) {
      hash ^= this.zobristTable.enPassant[game.enPassantTarget[1]];
    }

    return hash;
  }

  // Initialize opening book with common openings
  initializeOpeningBook() {
    return {
      // Italian Game
      'e2e4,e7e5,g1f3,b8c6,f1c4': ['b7b5', 'd7d6', 'f7f5', 'g8f6'],
      // Sicilian Defense
      'e2e4,c7c5': ['g1f3', 'd2d4', 'b1c3'],
      // French Defense
      'e2e4,e7e6': ['d2d4', 'g1f3'],
      // Queen's Gambit
      'd2d4,d7d5,c2c4': ['e7e6', 'c7c6', 'd5c4'],
      // King's Indian Defense
      'd2d4,g8f6,c2c4,g7g6': ['b1c3', 'g1f3'],
      // Ruy Lopez
      'e2e4,e7e5,g1f3,b8c6,f1b5': ['a7a6', 'g8f6', 'f7f5'],
      // English Opening
      'c2c4': ['e7e5', 'g8f6', 'c7c5', 'e7e6'],
      // Caro-Kann Defense
      'e2e4,c7c6': ['d2d4', 'b1c3', 'g1f3']
    };
  }

  // Get search depth based on difficulty
  getDepthFromDifficulty(difficulty) {
    switch (difficulty) {
      case 1: return 3;  // Easy
      case 2: return 4;  // Medium
      case 3: return 5;  // Hard
      case 4: return 6;  // Expert
      case 5: return 8;  // Master
      default: return 4;
    }
  }

  // Get the best move using iterative deepening
  getBestMove(game) {
    this.startTime = Date.now();
    this.nodesSearched = 0;
    this.moveCount++;

    // Check opening book first (if enabled for this difficulty)
    if (this.useOpeningBook && this.moveCount <= 10) {
      const bookMove = this.getOpeningBookMove(game);
      if (bookMove) {
        console.log('Using opening book move');
        return bookMove;
      }
    }

    // For easy difficulties, sometimes pick a random move
    if (this.moveRandomness > 0 && Math.random() < this.moveRandomness) {
      const moves = this.getAllPossibleMoves(game);
      if (moves.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(moves.length, 3)); // Pick from top 3 moves
        console.log(`Enhanced AI chose random move (difficulty ${this.difficulty})`);
        return moves[randomIndex];
      }
    }

    // Clear old transposition table entries periodically
    if (this.transpositionTable.size > 100000) {
      this.transpositionTable.clear();
    }

    let bestMove = null;
    let bestScore = -Infinity;

    // Iterative deepening
    for (let depth = 1; depth <= this.maxDepth; depth++) {
      const result = this.alphaBetaRoot(game, depth);
      
      if (Date.now() - this.startTime > this.timeLimit) {
        console.log(`Time limit reached at depth ${depth}`);
        break;
      }

      if (result.move) {
        bestMove = result.move;
        bestScore = result.score;
        console.log(`Depth ${depth}: Score ${bestScore}, Nodes ${this.nodesSearched}`);
      }
    }

    const timeElapsed = Date.now() - this.startTime;
    console.log(`AI thinking time: ${timeElapsed}ms, Nodes searched: ${this.nodesSearched}`);
    console.log(`Transposition table hits: ${this.transpositionTable.size}`);

    return bestMove;
  }

  // Alpha-beta search at root with move ordering
  alphaBetaRoot(game, depth) {
    const moves = this.getAllPossibleMoves(game);
    
    if (moves.length === 0) {
      return { score: game.isInCheck(game.currentPlayer) ? -30000 : 0, move: null };
    }

    // Order moves for better pruning
    this.orderMovesAdvanced(moves, game, depth);

    let bestMove = moves[0];
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;

    for (const move of moves) {
      const gameClone = this.cloneGame(game);
      if (!gameClone.makeMove(move.from[0], move.from[1], move.to[0], move.to[1])) {
        continue;
      }

      const score = -this.alphaBeta(gameClone, depth - 1, -beta, -alpha, false);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }

      alpha = Math.max(alpha, score);

      // Time check
      if (Date.now() - this.startTime > this.timeLimit) {
        break;
      }
    }

    return { score: bestScore, move: bestMove };
  }

  // Enhanced alpha-beta with quiescence search
  alphaBeta(game, depth, alpha, beta, isMaximizing) {
    this.nodesSearched++;

    // Check transposition table
    const hash = this.getZobristHash(game);
    const ttEntry = this.transpositionTable.get(hash);
    if (ttEntry && ttEntry.depth >= depth) {
      if (ttEntry.flag === 'EXACT') return ttEntry.score;
      if (ttEntry.flag === 'LOWERBOUND') alpha = Math.max(alpha, ttEntry.score);
      if (ttEntry.flag === 'UPPERBOUND') beta = Math.min(beta, ttEntry.score);
      if (alpha >= beta) return ttEntry.score;
    }

    // Terminal node or depth limit
    if (depth === 0 || game.gameState !== 'playing') {
      return this.quiescenceSearch(game, alpha, beta);
    }

    const moves = this.getAllPossibleMoves(game);
    
    if (moves.length === 0) {
      const score = game.isInCheck(game.currentPlayer) ? -30000 + (this.maxDepth - depth) : 0;
      return score;
    }

    // Null move pruning
    if (depth >= 3 && !game.isInCheck(game.currentPlayer)) {
      const nullGame = this.cloneGame(game);
      nullGame.currentPlayer = nullGame.currentPlayer === 'WHITE' ? 'BLACK' : 'WHITE';
      const nullScore = -this.alphaBeta(nullGame, depth - 3, -beta, -beta + 1, !isMaximizing);
      if (nullScore >= beta) {
        return beta;
      }
    }

    this.orderMovesAdvanced(moves, game, depth);

    let bestScore = -Infinity;
    let flag = 'UPPERBOUND';

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const gameClone = this.cloneGame(game);
      
      if (!gameClone.makeMove(move.from[0], move.from[1], move.to[0], move.to[1])) {
        continue;
      }

      let score;
      
      // Principal Variation Search (PVS)
      if (i === 0) {
        score = -this.alphaBeta(gameClone, depth - 1, -beta, -alpha, !isMaximizing);
      } else {
        // Search with null window
        score = -this.alphaBeta(gameClone, depth - 1, -alpha - 1, -alpha, !isMaximizing);
        
        // Re-search if failed high
        if (score > alpha && score < beta) {
          score = -this.alphaBeta(gameClone, depth - 1, -beta, -alpha, !isMaximizing);
        }
      }

      if (score > bestScore) {
        bestScore = score;
        if (score > alpha) {
          alpha = score;
          flag = 'EXACT';
          
          // Update killer moves
          if (!move.captured && depth < this.killerMoves.length) {
            this.killerMoves[depth].unshift(move);
            this.killerMoves[depth] = this.killerMoves[depth].slice(0, 2);
          }
          
          // Update history heuristic
          const moveKey = `${move.from[0]},${move.from[1]},${move.to[0]},${move.to[1]}`;
          this.historyTable[moveKey] = (this.historyTable[moveKey] || 0) + depth * depth;
        }
      }

      if (alpha >= beta) {
        flag = 'LOWERBOUND';
        break; // Beta cutoff
      }
    }

    // Store in transposition table
    this.transpositionTable.set(hash, {
      score: bestScore,
      depth: depth,
      flag: flag
    });

    return bestScore;
  }

  // Quiescence search to avoid horizon effect
  quiescenceSearch(game, alpha, beta, depth = 0) {
    this.nodesSearched++;

    const standPat = ChessEvaluation.evaluatePositionAdvanced(game);
    
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;
    if (depth > 4) return standPat; // Limit quiescence depth

    // Only search captures
    const moves = this.getCaptureMoves(game);
    this.orderCapturesByMVVLVA(moves);

    for (const move of moves) {
      const gameClone = this.cloneGame(game);
      if (!gameClone.makeMove(move.from[0], move.from[1], move.to[0], move.to[1])) {
        continue;
      }

      const score = -this.quiescenceSearch(gameClone, -beta, -alpha, depth + 1);

      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }

    return alpha;
  }

  // Get only capture moves
  getCaptureMoves(game) {
    const moves = [];
    const pieces = game.getPieces(game.currentPlayer);

    for (const piece of pieces) {
      const legalMoves = game.getLegalMoves(piece);
      for (const [toRow, toCol] of legalMoves) {
        const capturedPiece = game.getPieceAt(toRow, toCol);
        if (capturedPiece) {
          moves.push({
            from: [piece.row, piece.col],
            to: [toRow, toCol],
            piece: piece.type,
            captured: capturedPiece.type,
            capturedValue: PIECE_VALUES[capturedPiece.type],
            attackerValue: PIECE_VALUES[piece.type]
          });
        }
      }
    }

    return moves;
  }

  // Order captures by Most Valuable Victim - Least Valuable Attacker
  orderCapturesByMVVLVA(moves) {
    moves.sort((a, b) => {
      const scoreA = a.capturedValue - a.attackerValue / 10;
      const scoreB = b.capturedValue - b.attackerValue / 10;
      return scoreB - scoreA;
    });
  }

  // Advanced move ordering
  orderMovesAdvanced(moves, game, depth) {
    // Score each move
    for (const move of moves) {
      move.score = 0;

      // PV move from previous iteration
      const moveKey = `${move.from[0]},${move.from[1]},${move.to[0]},${move.to[1]}`;
      if (this.pvTable[moveKey]) {
        move.score += 10000;
      }

      // Captures - MVV-LVA
      if (move.captured) {
        const capturedValue = PIECE_VALUES[move.captured];
        const attackerValue = PIECE_VALUES[move.piece];
        move.score += 1000 + capturedValue - attackerValue / 10;
      }

      // Killer moves
      if (depth < this.killerMoves.length) {
        const killers = this.killerMoves[depth];
        if (killers.some(k => this.movesEqual(k, move))) {
          move.score += 900;
        }
      }

      // History heuristic
      if (this.historyTable[moveKey]) {
        move.score += Math.min(this.historyTable[moveKey], 800);
      }

      // Piece-square tables
      const toRow = move.to[0];
      const toCol = move.to[1];
      const fromRow = move.from[0];
      const fromCol = move.from[1];
      
      // Favor central squares
      const centerBonus = (row, col) => {
        const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
        return (7 - centerDistance) * 10;
      };
      
      move.score += centerBonus(toRow, toCol) - centerBonus(fromRow, fromCol);

      // Pawn advancement
      if (move.piece === 'PAWN') {
        const advancement = game.currentPlayer === 'WHITE' ? 
          (fromRow - toRow) * 20 : (toRow - fromRow) * 20;
        move.score += advancement;
      }

      // Castling bonus
      if (move.piece === 'KING' && Math.abs(toCol - fromCol) === 2) {
        move.score += 300;
      }
    }

    // Sort by score
    moves.sort((a, b) => b.score - a.score);
  }

  // Check if two moves are equal
  movesEqual(move1, move2) {
    if (!move1 || !move2) return false;
    return move1.from[0] === move2.from[0] && 
           move1.from[1] === move2.from[1] && 
           move1.to[0] === move2.to[0] && 
           move1.to[1] === move2.to[1];
  }

  // Get all possible moves
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

  // Get opening book move
  getOpeningBookMove(game) {
    const moveHistory = game.moveHistory.map(m => {
      const from = String.fromCharCode(97 + m.from[1]) + (8 - m.from[0]);
      const to = String.fromCharCode(97 + m.to[1]) + (8 - m.to[0]);
      return from + to;
    }).join(',');

    const bookMoves = this.openingBook[moveHistory];
    if (bookMoves && bookMoves.length > 0) {
      const moveNotation = bookMoves[Math.floor(Math.random() * bookMoves.length)];
      
      // Convert notation to move
      const from = [8 - parseInt(moveNotation[1]), moveNotation.charCodeAt(0) - 97];
      const to = [8 - parseInt(moveNotation[3]), moveNotation.charCodeAt(2) - 97];
      
      return {
        from: from,
        to: to,
        piece: game.getPieceAt(from[0], from[1])?.type
      };
    }
    
    return null;
  }

  // Get a hint for the human player
  getHint(game) {
    const originalPlayer = game.currentPlayer;
    game.currentPlayer = 'WHITE'; // Assume human is white
    
    const bestMove = this.getBestMove(game);
    game.currentPlayer = originalPlayer;
    
    return bestMove;
  }

  // Set difficulty level
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    this.maxDepth = this.getDepthFromDifficulty(difficulty);
    this.setDifficultyParameters(difficulty);
    console.log(`Enhanced AI difficulty set to ${difficulty} (depth: ${this.maxDepth}, time: ${this.timeLimit}ms, randomness: ${this.randomnessFactor})`);
  }

  // Set difficulty-specific parameters
  setDifficultyParameters(difficulty) {
    switch (difficulty) {
      case 1: // Easy
        this.timeLimit = 1000;  // 1 second
        this.randomnessFactor = 0.25; // 25% randomness in evaluation
        this.moveRandomness = 0.3; // 30% chance to pick suboptimal move
        this.useOpeningBook = false; // Don't use opening book
        break;
      case 2: // Medium
        this.timeLimit = 2000; // 2 seconds
        this.randomnessFactor = 0.1; // 10% randomness
        this.moveRandomness = 0.15; // 15% chance for suboptimal move
        this.useOpeningBook = true; // Use opening book
        break;
      case 3: // Hard
        this.timeLimit = 3000; // 3 seconds
        this.randomnessFactor = 0.05; // 5% randomness
        this.moveRandomness = 0.08; // 8% chance for suboptimal move
        this.useOpeningBook = true;
        break;
      case 4: // Expert
        this.timeLimit = 5000; // 5 seconds
        this.randomnessFactor = 0.02; // 2% randomness
        this.moveRandomness = 0.03; // 3% chance for suboptimal move
        this.useOpeningBook = true;
        break;
      case 5: // Master
        this.timeLimit = 8000; // 8 seconds
        this.randomnessFactor = 0; // No randomness
        this.moveRandomness = 0; // Always best move
        this.useOpeningBook = true;
        break;
      default:
        this.timeLimit = 3000;
        this.randomnessFactor = 0.1;
        this.moveRandomness = 0.15;
        this.useOpeningBook = true;
    }
  }
}

// Export for module compatibility
export { EnhancedChessAI };
