import { test, describe } from 'node:test';
import assert from 'node:assert';
import { ChessGame } from '../js/chess-logic.js';
import { ChessPiece } from '../js/chess-pieces.js';

describe('Chess Bot Tests', () => {
  describe('Basic Functionality', () => {
    test('Game initializes correctly', () => {
      const game = new ChessGame();
      assert.strictEqual(game.currentPlayer, 'WHITE');
      assert.strictEqual(game.gameState, 'playing');
    });

    test('Pieces are placed correctly', () => {
      const game = new ChessGame();
      const whiteKing = game.getPieceAt(7, 4);
      const blackKing = game.getPieceAt(0, 4);
      
      assert.ok(whiteKing);
      assert.strictEqual(whiteKing.type, 'KING');
      assert.strictEqual(whiteKing.color, 'WHITE');
      
      assert.ok(blackKing);
      assert.strictEqual(blackKing.type, 'KING');
      assert.strictEqual(blackKing.color, 'BLACK');
    });

    test('Pawn can move forward one square', () => {
      const game = new ChessGame();
      const result = game.makeMove(6, 4, 5, 4); // e2-e3
      assert.strictEqual(result, true);
      
      const pawn = game.getPieceAt(5, 4);
      assert.ok(pawn);
      assert.strictEqual(pawn.type, 'PAWN');
      assert.strictEqual(pawn.color, 'WHITE');
    });

    test('Pawn can move two squares from starting position', () => {
      const game = new ChessGame();
      const result = game.makeMove(6, 4, 4, 4); // e2-e4
      assert.strictEqual(result, true);
      
      const pawn = game.getPieceAt(4, 4);
      assert.ok(pawn);
      assert.strictEqual(pawn.type, 'PAWN');
    });

    test('Knight can move in L-shape', () => {
      const game = new ChessGame();
      const result = game.makeMove(7, 1, 5, 2); // Nb1-c3
      assert.strictEqual(result, true);
      
      const knight = game.getPieceAt(5, 2);
      assert.ok(knight);
      assert.strictEqual(knight.type, 'KNIGHT');
    });

    test('Cannot move opponent pieces', () => {
      const game = new ChessGame();
      // Try to move black pawn when it's white's turn
      const result = game.makeMove(1, 4, 2, 4);
      assert.strictEqual(result, false);
    });

    test('Cannot capture own pieces', () => {
      const game = new ChessGame();
      // Try to move pawn to square occupied by own piece
      const result = game.makeMove(6, 4, 7, 4);
      assert.strictEqual(result, false);
    });
  });

  describe('Castling', () => {
    test('King-side castling works when conditions are met', () => {
      const game = new ChessGame();
      // Clear pieces between king and rook
      game.board[7][5] = null; // f1 (bishop)
      game.board[7][6] = null; // g1 (knight)
      
      const result = game.makeMove(7, 4, 7, 6); // King e1-g1
      assert.strictEqual(result, true);
      
      // Check king position
      const king = game.getPieceAt(7, 6);
      assert.ok(king);
      assert.strictEqual(king.type, 'KING');
      
      // Check rook moved to f1
      const rook = game.getPieceAt(7, 5);
      assert.ok(rook);
      assert.strictEqual(rook.type, 'ROOK');
    });

    test('Queen-side castling works when conditions are met', () => {
      const game = new ChessGame();
      // Clear pieces between king and rook
      game.board[7][1] = null; // b1 (knight)
      game.board[7][2] = null; // c1 (bishop)
      game.board[7][3] = null; // d1 (queen)
      
      const result = game.makeMove(7, 4, 7, 2); // King e1-c1
      assert.strictEqual(result, true);
      
      // Check king position
      const king = game.getPieceAt(7, 2);
      assert.ok(king);
      assert.strictEqual(king.type, 'KING');
      
      // Check rook moved to d1
      const rook = game.getPieceAt(7, 3);
      assert.ok(rook);
      assert.strictEqual(rook.type, 'ROOK');
    });

    test('Castling fails when king has moved', () => {
      const game = new ChessGame();
      // Clear pieces between king and rook
      game.board[7][5] = null; // f1
      game.board[7][6] = null; // g1
      
      const king = game.getPieceAt(7, 4);
      king.hasMoved = true; // Mark king as moved
      
      const result = game.makeMove(7, 4, 7, 6);
      assert.strictEqual(result, false);
    });

    test('Castling fails when rook has moved', () => {
      const game = new ChessGame();
      // Clear pieces between king and rook
      game.board[7][5] = null; // f1
      game.board[7][6] = null; // g1
      
      const rook = game.getPieceAt(7, 7);
      rook.hasMoved = true; // Mark rook as moved
      
      const result = game.makeMove(7, 4, 7, 6);
      assert.strictEqual(result, false);
    });
  });

  describe('En Passant', () => {
    test('En passant target is set after pawn double move', () => {
      const game = new ChessGame();
      game.makeMove(6, 4, 4, 4); // e2-e4 (white pawn double move)
      
      assert.ok(game.enPassantTarget);
      assert.deepStrictEqual(game.enPassantTarget, [5, 4]); // e3 square
    });

    test('En passant target is cleared after non-double pawn move', () => {
      const game = new ChessGame();
      game.makeMove(6, 4, 4, 4); // e2-e4 (sets en passant target)
      game.makeMove(1, 4, 2, 4); // e7-e6 (single pawn move, should clear en passant target)
      
      assert.strictEqual(game.enPassantTarget, null);
    });

    test('En passant capture works correctly', () => {
      const game = new ChessGame();
      
      // Set up en passant scenario manually
      // White pawn on e5, black pawn moves d7-d5
      const whitePawn = new ChessPiece('PAWN', 'WHITE', 3, 4); // e5
      game.board[3][4] = whitePawn;
      game.board[6][4] = null; // Remove original white pawn
      
      // Switch to black's turn
      game.currentPlayer = 'BLACK';
      
      // Black pawn double move d7-d5
      const result = game.makeMove(1, 3, 3, 3);
      assert.strictEqual(result, true);
      assert.ok(game.enPassantTarget);
      
      // Switch back to white's turn
      game.currentPlayer = 'WHITE';
      
      // White pawn captures en passant
      const captureResult = game.makeMove(3, 4, 2, 3); // exd6
      assert.strictEqual(captureResult, true);
      
      // Check that black pawn was captured
      const capturedSquare = game.getPieceAt(3, 3);
      assert.strictEqual(capturedSquare, null);
      
      // Check that white pawn is on d6
      const capturingPawn = game.getPieceAt(2, 3);
      assert.ok(capturingPawn);
      assert.strictEqual(capturingPawn.type, 'PAWN');
      assert.strictEqual(capturingPawn.color, 'WHITE');
    });
  });

  describe('Check Detection', () => {
    test('King in check is detected', () => {
      const game = new ChessGame();
      // Clear the path between queen and king
      game.board[6][4] = null; // Remove white pawn on e2
      game.board[5][4] = null; // Clear e3
      game.board[4][4] = null; // Clear e4
      
      // Place black queen on same file as white king to create check
      game.board[3][4] = new ChessPiece('QUEEN', 'BLACK', 3, 4); // e5, attacking e1 king
      
      const inCheck = game.isInCheck('WHITE');
      assert.strictEqual(inCheck, true);
    });

    test('King not in check when safe', () => {
      const game = new ChessGame();
      const inCheck = game.isInCheck('WHITE');
      assert.strictEqual(inCheck, false);
    });
  });

  describe('Game States', () => {
    test('Initial game state is playing', () => {
      const game = new ChessGame();
      assert.strictEqual(game.gameState, 'playing');
    });

    test('Player alternates after moves', () => {
      const game = new ChessGame();
      assert.strictEqual(game.currentPlayer, 'WHITE');
      
      game.makeMove(6, 4, 4, 4); // e2-e4
      assert.strictEqual(game.currentPlayer, 'BLACK');
      
      game.makeMove(1, 4, 3, 4); // e7-e5
      assert.strictEqual(game.currentPlayer, 'WHITE');
    });
  });

  describe('Pawn Promotion', () => {
    test('Pawn promotes when reaching end rank', () => {
      const game = new ChessGame();
      
      // Place white pawn on 7th rank (2nd row, about to promote)
      const pawn = new ChessPiece('PAWN', 'WHITE', 1, 4);
      game.board[1][4] = pawn;
      game.board[6][4] = null; // Remove original pawn
      game.board[0][4] = null; // Remove black king to allow promotion
      
      // Move pawn to promotion square
      const result = game.makeMove(1, 4, 0, 4);
      assert.strictEqual(result, true);
      
      const promotedPiece = game.getPieceAt(0, 4);
      assert.ok(promotedPiece);
      assert.strictEqual(promotedPiece.type, 'QUEEN'); // Default promotion
    });
  });
});
