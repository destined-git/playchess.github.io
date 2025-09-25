// Chess Pieces Definitions and Unicode Symbols
const PIECES = {
    WHITE: {
        KING: '♔',
        QUEEN: '♕',
        ROOK: '♖',
        BISHOP: '♗',
        KNIGHT: '♘',
        PAWN: '♙'
    },
    BLACK: {
        KING: '♚',
        QUEEN: '♛',
        ROOK: '♜',
        BISHOP: '♝',
        KNIGHT: '♞',
        PAWN: '♟'
    }
};

// Piece values for AI evaluation
const PIECE_VALUES = {
    'PAWN': 100,
    'KNIGHT': 320,
    'BISHOP': 330,
    'ROOK': 500,
    'QUEEN': 900,
    'KING': 20000
};

// Position evaluation tables for each piece type
const POSITION_VALUES = {
    PAWN: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5,  5, 10, 25, 25, 10,  5,  5],
        [0,  0,  0, 20, 20,  0,  0,  0],
        [5, -5,-10,  0,  0,-10, -5,  5],
        [5, 10, 10,-20,-20, 10, 10,  5],
        [0,  0,  0,  0,  0,  0,  0,  0]
    ],
    
    KNIGHT: [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    
    BISHOP: [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    
    ROOK: [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [5, 10, 10, 10, 10, 10, 10,  5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [0,  0,  0,  5,  5,  0,  0,  0]
    ],
    
    QUEEN: [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [-5,  0,  5,  5,  5,  5,  0, -5],
        [0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
    ],
    
    KING: [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [20, 20,  0,  0,  0,  0, 20, 20],
        [20, 30, 10,  0,  0, 10, 30, 20]
    ],
    
    KING_ENDGAME: [
        [-50,-40,-30,-20,-20,-30,-40,-50],
        [-30,-20,-10,  0,  0,-10,-20,-30],
        [-30,-10, 20, 30, 30, 20,-10,-30],
        [-30,-10, 30, 40, 40, 30,-10,-30],
        [-30,-10, 30, 40, 40, 30,-10,-30],
        [-30,-10, 20, 30, 30, 20,-10,-30],
        [-30,-30,  0,  0,  0,  0,-30,-30],
        [-50,-30,-30,-30,-30,-30,-30,-50]
    ]
};

// Piece class definition
class ChessPiece {
    constructor(type, color, row, col) {
        this.type = type;
        this.color = color;
        this.row = row;
        this.col = col;
        this.hasMoved = false;
        this.symbol = PIECES[color][type];
    }

    // Get the piece's position in algebraic notation
    getPosition() {
        return String.fromCharCode(97 + this.col) + (8 - this.row);
    }

    // Move the piece to a new position
    moveTo(newRow, newCol) {
        this.row = newRow;
        this.col = newCol;
        this.hasMoved = true;
    }

    // Get all possible moves for this piece
    getPossibleMoves(board, gameContext = {}) {
        switch (this.type) {
            case 'PAWN':
                return this.getPawnMoves(board, gameContext.enPassantTarget);
            case 'ROOK':
                return this.getRookMoves(board);
            case 'KNIGHT':
                return this.getKnightMoves(board);
            case 'BISHOP':
                return this.getBishopMoves(board);
            case 'QUEEN':
                return this.getQueenMoves(board);
            case 'KING':
                return this.getKingMoves(board, gameContext.canCastleKingSide, gameContext.canCastleQueenSide);
            default:
                return [];
        }
    }

    // Pawn movement logic (including en passant)
    getPawnMoves(board, enPassantTarget = null) {
        const moves = [];
        const direction = this.color === 'WHITE' ? -1 : 1;
        const startRow = this.color === 'WHITE' ? 6 : 1;
        const enPassantRow = this.color === 'WHITE' ? 3 : 4;
        
        // Forward move
        const newRow = this.row + direction;
        if (newRow >= 0 && newRow < 8 && !board[newRow][this.col]) {
            moves.push([newRow, this.col]);
            
            // Double move from starting position
            if (this.row === startRow && !board[newRow + direction][this.col]) {
                moves.push([newRow + direction, this.col]);
            }
        }
        
        // Diagonal captures
        for (const colOffset of [-1, 1]) {
            const newCol = this.col + colOffset;
            if (newCol >= 0 && newCol < 8 && newRow >= 0 && newRow < 8) {
                const targetPiece = board[newRow][newCol];
                if (targetPiece && targetPiece.color !== this.color) {
                    moves.push([newRow, newCol]);
                }
            }
        }
        
        // En passant capture
        if (enPassantTarget && this.row === enPassantRow) {
            const [targetRow, targetCol] = enPassantTarget;
            if (Math.abs(targetCol - this.col) === 1) {
                // Check if the en passant square is the correct one
                if (targetRow === this.row + direction) {
                    moves.push([targetRow, targetCol]);
                }
            }
        }
        
        return moves;
    }

    // Rook movement logic
    getRookMoves(board) {
        const moves = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        
        for (const [rowDir, colDir] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = this.row + rowDir * i;
                const newCol = this.col + colDir * i;
                
                if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
                
                const targetPiece = board[newRow][newCol];
                if (!targetPiece) {
                    moves.push([newRow, newCol]);
                } else {
                    if (targetPiece.color !== this.color) {
                        moves.push([newRow, newCol]);
                    }
                    break;
                }
            }
        }
        
        return moves;
    }

    // Knight movement logic
    getKnightMoves(board) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        for (const [rowOffset, colOffset] of knightMoves) {
            const newRow = this.row + rowOffset;
            const newCol = this.col + colOffset;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = board[newRow][newCol];
                if (!targetPiece || targetPiece.color !== this.color) {
                    moves.push([newRow, newCol]);
                }
            }
        }
        
        return moves;
    }

    // Bishop movement logic
    getBishopMoves(board) {
        const moves = [];
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        
        for (const [rowDir, colDir] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = this.row + rowDir * i;
                const newCol = this.col + colDir * i;
                
                if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
                
                const targetPiece = board[newRow][newCol];
                if (!targetPiece) {
                    moves.push([newRow, newCol]);
                } else {
                    if (targetPiece.color !== this.color) {
                        moves.push([newRow, newCol]);
                    }
                    break;
                }
            }
        }
        
        return moves;
    }

    // Queen movement logic (combination of rook and bishop)
    getQueenMoves(board) {
        return [...this.getRookMoves(board), ...this.getBishopMoves(board)];
    }

    // King movement logic (including castling)
    getKingMoves(board, canCastleKingSide = false, canCastleQueenSide = false) {
        const moves = [];
        const kingMoves = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [rowOffset, colOffset] of kingMoves) {
            const newRow = this.row + rowOffset;
            const newCol = this.col + colOffset;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = board[newRow][newCol];
                if (!targetPiece || targetPiece.color !== this.color) {
                    moves.push([newRow, newCol]);
                }
            }
        }
        
        // Add castling moves if allowed
        if (!this.hasMoved && this.col === 4) {
            // King-side castling
            if (canCastleKingSide) {
                moves.push([this.row, 6]);
            }
            // Queen-side castling
            if (canCastleQueenSide) {
                moves.push([this.row, 2]);
            }
        }
        
        return moves;
    }

    // Get piece value for AI evaluation
    getValue() {
        return PIECE_VALUES[this.type];
    }

    // Get positional value for AI evaluation
    getPositionalValue(isEndgame = false) {
        const table = this.type === 'KING' && isEndgame ? 
            POSITION_VALUES.KING_ENDGAME : 
            POSITION_VALUES[this.type];
        
        if (!table) return 0;
        
        const row = this.color === 'WHITE' ? this.row : 7 - this.row;
        return table[row][this.col];
    }

    // Clone the piece
    clone() {
        const cloned = new ChessPiece(this.type, this.color, this.row, this.col);
        cloned.hasMoved = this.hasMoved;
        return cloned;
    }
}

// Classes and constants are available globally
// Export for ES6 module compatibility (for unit tests)
export { PIECES, PIECE_VALUES, POSITION_VALUES, ChessPiece };