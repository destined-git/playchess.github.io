// Chess Game Logic and Rules
import { PIECES, ChessPiece } from './chess-pieces.js';

class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'WHITE';
        this.gameState = 'playing'; // playing, check, checkmate, stalemate
        this.moveHistory = [];
        this.capturedPieces = { WHITE: [], BLACK: [] };
        this.lastMove = null;
        this.kingPositions = { WHITE: [7, 4], BLACK: [0, 4] };
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
    }

    // Initialize the chess board with starting positions
    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Place pawns
        for (let col = 0; col < 8; col++) {
            board[1][col] = new ChessPiece('PAWN', 'BLACK', 1, col);
            board[6][col] = new ChessPiece('PAWN', 'WHITE', 6, col);
        }
        
        // Place other pieces
        const pieceOrder = ['ROOK', 'KNIGHT', 'BISHOP', 'QUEEN', 'KING', 'BISHOP', 'KNIGHT', 'ROOK'];
        
        for (let col = 0; col < 8; col++) {
            board[0][col] = new ChessPiece(pieceOrder[col], 'BLACK', 0, col);
            board[7][col] = new ChessPiece(pieceOrder[col], 'WHITE', 7, col);
        }
        
        return board;
    }

    // Get piece at specific position
    getPieceAt(row, col) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
        return this.board[row][col];
    }

    // Check if a position is under attack by the specified color
    isSquareUnderAttack(row, col, attackingColor) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === attackingColor) {
                    // For attack checking, we don't need special moves like castling
                    const gameContext = {
                        enPassantTarget: this.enPassantTarget,
                        canCastleKingSide: false,
                        canCastleQueenSide: false
                    };
                    const moves = piece.getPossibleMoves(this.board, gameContext);
                    if (moves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Check if the king is in check
    isInCheck(color) {
        const kingPos = this.kingPositions[color];
        const oppositeColor = color === 'WHITE' ? 'BLACK' : 'WHITE';
        return this.isSquareUnderAttack(kingPos[0], kingPos[1], oppositeColor);
    }

    // Get all legal moves for a piece
    getLegalMoves(piece) {
        if (!piece) return [];
        
        const gameContext = {
            enPassantTarget: this.enPassantTarget,
            canCastleKingSide: piece.type === 'KING' ? this.canCastle(piece.color, true) : false,
            canCastleQueenSide: piece.type === 'KING' ? this.canCastle(piece.color, false) : false
        };
        
        const possibleMoves = piece.getPossibleMoves(this.board, gameContext);
        const legalMoves = [];
        
        for (const [toRow, toCol] of possibleMoves) {
            if (this.isLegalMove(piece.row, piece.col, toRow, toCol)) {
                legalMoves.push([toRow, toCol]);
            }
        }
        
        return legalMoves;
    }

    // Check if a move is legal (doesn't leave king in check)
    isLegalMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPieceAt(fromRow, fromCol);
        if (!piece || piece.color !== this.currentPlayer) return false;
        
        // First check if the move is possible according to piece rules
        const gameContext = {
            enPassantTarget: this.enPassantTarget,
            canCastleKingSide: piece.type === 'KING' ? this.canCastle(piece.color, true) : false,
            canCastleQueenSide: piece.type === 'KING' ? this.canCastle(piece.color, false) : false
        };
        
        const possibleMoves = piece.getPossibleMoves(this.board, gameContext);
        const isPossible = possibleMoves.some(([moveRow, moveCol]) => moveRow === toRow && moveCol === toCol);
        if (!isPossible) return false;
        
        // Special handling for castling - already checked in canCastle
        if (piece.type === 'KING' && Math.abs(toCol - fromCol) === 2) {
            return true; // Castling legality is already verified in canCastle
        }
        
        // Save original state
        const originalKingPositions = { ...this.kingPositions };
        const capturedPiece = this.board[toRow][toCol];
        const originalRow = piece.row;
        const originalCol = piece.col;
        
        // Handle en passant capture
        let enPassantCapturedPawn = null;
        if (piece.type === 'PAWN' && this.enPassantTarget && 
            toRow === this.enPassantTarget[0] && toCol === this.enPassantTarget[1]) {
            const captureRow = piece.color === 'WHITE' ? toRow + 1 : toRow - 1;
            enPassantCapturedPawn = this.board[captureRow][toCol];
            this.board[captureRow][toCol] = null;
        }
        
        // Make the move temporarily
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        piece.row = toRow;
        piece.col = toCol;
        
        // Update king position if king moved
        if (piece.type === 'KING') {
            this.kingPositions[piece.color] = [toRow, toCol];
        }
        
        // Check if this move leaves the king in check
        const isLegal = !this.isInCheck(piece.color);
        
        // Restore the original state
        this.board[fromRow][fromCol] = piece;
        this.board[toRow][toCol] = capturedPiece;
        piece.row = originalRow;
        piece.col = originalCol;
        this.kingPositions = originalKingPositions;
        
        // Restore en passant captured pawn if necessary
        if (enPassantCapturedPawn) {
            const captureRow = piece.color === 'WHITE' ? toRow + 1 : toRow - 1;
            this.board[captureRow][toCol] = enPassantCapturedPawn;
        }
        
        return isLegal;
    }

    // Make a move on the board
    makeMove(fromRow, fromCol, toRow, toCol, promotionPiece = 'QUEEN') {
        const piece = this.getPieceAt(fromRow, fromCol);
        if (!piece || !this.isLegalMove(fromRow, fromCol, toRow, toCol)) {
            return false;
        }
        
        let capturedPiece = this.getPieceAt(toRow, toCol);
        
        // Handle en passant capture
        if (piece.type === 'PAWN' && !capturedPiece && this.enPassantTarget &&
            toRow === this.enPassantTarget[0] && toCol === this.enPassantTarget[1]) {
            const captureRow = piece.color === 'WHITE' ? toRow + 1 : toRow - 1;
            capturedPiece = this.board[captureRow][toCol];
            this.board[captureRow][toCol] = null;
        }
        
        const moveNotation = this.getMoveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece);
        
        // Handle captures
        if (capturedPiece) {
            this.capturedPieces[capturedPiece.color].push(capturedPiece);
            this.halfMoveClock = 0;
        } else if (piece.type === 'PAWN') {
            this.halfMoveClock = 0;
        } else {
            this.halfMoveClock++;
        }
        
        // Move the piece
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        piece.moveTo(toRow, toCol);
        
        // Update king position
        if (piece.type === 'KING') {
            this.kingPositions[piece.color] = [toRow, toCol];
        }
        
        // Handle pawn promotion
        if (piece.type === 'PAWN' && (toRow === 0 || toRow === 7)) {
            piece.type = promotionPiece;
            piece.symbol = PIECES[piece.color][promotionPiece];
        }
        
        // Handle castling
        if (piece.type === 'KING' && Math.abs(toCol - fromCol) === 2) {
            this.handleCastling(fromRow, fromCol, toRow, toCol);
        }
        
        // Update en passant target
        if (piece.type === 'PAWN' && Math.abs(toRow - fromRow) === 2) {
            this.enPassantTarget = [fromRow + (toRow - fromRow) / 2, fromCol];
        } else {
            this.enPassantTarget = null;
        }
        
        // Record the move
        this.lastMove = { from: [fromRow, fromCol], to: [toRow, toCol], piece: piece.type };
        this.moveHistory.push({
            notation: moveNotation,
            from: [fromRow, fromCol],
            to: [toRow, toCol],
            piece: piece.type,
            captured: capturedPiece ? capturedPiece.type : null
        });
        
        // Switch players
        this.currentPlayer = this.currentPlayer === 'WHITE' ? 'BLACK' : 'WHITE';
        if (this.currentPlayer === 'WHITE') {
            this.fullMoveNumber++;
        }
        
        // Update game state
        this.updateGameState();
        
        return true;
    }

    // Handle castling move
    handleCastling(fromRow, fromCol, toRow, toCol) {
        const isKingSide = toCol > fromCol;
        const rookFromCol = isKingSide ? 7 : 0;
        const rookToCol = isKingSide ? 5 : 3;
        
        const rook = this.getPieceAt(fromRow, rookFromCol);
        if (rook) {
            this.board[fromRow][rookToCol] = rook;
            this.board[fromRow][rookFromCol] = null;
            rook.moveTo(fromRow, rookToCol);
        }
    }

    // Check if castling is possible
    canCastle(color, kingSide) {
        const row = color === 'WHITE' ? 7 : 0;
        const king = this.getPieceAt(row, 4);
        const rook = this.getPieceAt(row, kingSide ? 7 : 0);
        
        // Check basic requirements
        if (!king || king.type !== 'KING' || king.hasMoved) return false;
        if (!rook || rook.type !== 'ROOK' || rook.hasMoved) return false;
        if (this.isInCheck(color)) return false;
        
        // Check if squares between king and rook are empty
        if (kingSide) {
            // King-side: check f and g files
            if (this.getPieceAt(row, 5) || this.getPieceAt(row, 6)) return false;
        } else {
            // Queen-side: check b, c, and d files
            if (this.getPieceAt(row, 1) || this.getPieceAt(row, 2) || this.getPieceAt(row, 3)) return false;
        }
        
        // Check if king passes through or ends up in check
        const oppositeColor = color === 'WHITE' ? 'BLACK' : 'WHITE';
        if (kingSide) {
            // King-side: king moves from e to g, passing through f
            if (this.isSquareUnderAttack(row, 5, oppositeColor) || 
                this.isSquareUnderAttack(row, 6, oppositeColor)) return false;
        } else {
            // Queen-side: king moves from e to c, passing through d
            if (this.isSquareUnderAttack(row, 3, oppositeColor) || 
                this.isSquareUnderAttack(row, 2, oppositeColor)) return false;
        }
        
        return true;
    }

    // Update game state (check, checkmate, stalemate)
    updateGameState() {
        const inCheck = this.isInCheck(this.currentPlayer);
        const hasLegalMoves = this.hasLegalMoves(this.currentPlayer);
        
        if (inCheck && !hasLegalMoves) {
            this.gameState = 'checkmate';
        } else if (!inCheck && !hasLegalMoves) {
            this.gameState = 'stalemate';
        } else if (inCheck) {
            this.gameState = 'check';
        } else {
            this.gameState = 'playing';
        }
        
        // Check for draw by insufficient material or 50-move rule
        if (this.halfMoveClock >= 100 || this.isInsufficientMaterial()) {
            this.gameState = 'draw';
        }
    }

    // Check if current player has any legal moves
    hasLegalMoves(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPieceAt(row, col);
                if (piece && piece.color === color) {
                    const legalMoves = this.getLegalMoves(piece);
                    if (legalMoves.length > 0) return true;
                }
            }
        }
        return false;
    }

    // Check for insufficient material to checkmate
    isInsufficientMaterial() {
        const pieces = { WHITE: [], BLACK: [] };
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPieceAt(row, col);
                if (piece) {
                    pieces[piece.color].push(piece.type);
                }
            }
        }
        
        // King vs King
        if (pieces.WHITE.length === 1 && pieces.BLACK.length === 1) return true;
        
        // King and Bishop vs King or King and Knight vs King
        for (const color of ['WHITE', 'BLACK']) {
            const otherColor = color === 'WHITE' ? 'BLACK' : 'WHITE';
            if (pieces[color].length === 2 && pieces[otherColor].length === 1) {
                const nonKingPiece = pieces[color].find(p => p !== 'KING');
                if (nonKingPiece === 'BISHOP' || nonKingPiece === 'KNIGHT') return true;
            }
        }
        
        return false;
    }

    // Get move notation (simplified algebraic notation)
    getMoveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece) {
        const fromSquare = String.fromCharCode(97 + fromCol) + (8 - fromRow);
        const toSquare = String.fromCharCode(97 + toCol) + (8 - toRow);
        
        let notation = '';
        
        if (piece.type === 'KING' && Math.abs(toCol - fromCol) === 2) {
            notation = toCol > fromCol ? 'O-O' : 'O-O-O';
        } else {
            if (piece.type !== 'PAWN') {
                notation += piece.type.charAt(0);
            }
            
            if (capturedPiece) {
                if (piece.type === 'PAWN') {
                    notation += fromSquare.charAt(0);
                }
                notation += 'x';
            }
            
            notation += toSquare;
        }
        
        return notation;
    }

    // Clone the entire game state
    cloneGame() {
        const clone = new ChessGame();
        
        // Clone the board
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    clone.board[row][col] = piece.clone();
                }
            }
        }
        
        // Clone other game state
        clone.currentPlayer = this.currentPlayer;
        clone.gameState = this.gameState;
        clone.lastMove = this.lastMove ? {...this.lastMove} : null;
        clone.kingPositions = {...this.kingPositions};
        clone.enPassantTarget = this.enPassantTarget ? [...this.enPassantTarget] : null;
        clone.halfMoveClock = this.halfMoveClock;
        clone.fullMoveNumber = this.fullMoveNumber;
        
        // Clone captured pieces
        clone.capturedPieces = {
            WHITE: [...this.capturedPieces.WHITE],
            BLACK: [...this.capturedPieces.BLACK]
        };
        
        // Clone move history
        clone.moveHistory = this.moveHistory.map(move => ({
            ...move,
            from: [...move.from],
            to: [...move.to]
        }));
        
        return clone;
    }
    
    // Clone just the board for move validation
    cloneBoard() {
        const clonedBoard = Array(8).fill(null).map(() => Array(8).fill(null));
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    clonedBoard[row][col] = piece.clone();
                }
            }
        }
        
        return clonedBoard;
    }

    // Get all pieces of a specific color
    getPieces(color) {
        const pieces = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPieceAt(row, col);
                if (piece && piece.color === color) {
                    pieces.push(piece);
                }
            }
        }
        return pieces;
    }

    // Evaluate board position for AI
    evaluatePosition() {
        let score = 0;
        const isEndgame = this.isEndgame();
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPieceAt(row, col);
                if (piece) {
                    const pieceValue = piece.getValue() + piece.getPositionalValue(isEndgame);
                    score += piece.color === 'WHITE' ? pieceValue : -pieceValue;
                }
            }
        }
        
        return score;
    }

    // Check if game is in endgame
    isEndgame() {
        const pieces = this.getPieces('WHITE').concat(this.getPieces('BLACK'));
        const majorPieces = pieces.filter(p => ['QUEEN', 'ROOK'].includes(p.type));
        return majorPieces.length <= 4;
    }

    // Reset the game
    reset() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'WHITE';
        this.gameState = 'playing';
        this.moveHistory = [];
        this.capturedPieces = { WHITE: [], BLACK: [] };
        this.lastMove = null;
        this.kingPositions = { WHITE: [7, 4], BLACK: [0, 4] };
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
    }
}

// ChessGame class is available globally
// Export for ES6 module compatibility (for unit tests)
export { ChessGame };