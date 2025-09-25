// Advanced Chess Position Evaluation Functions
class ChessEvaluation {
  // Enhanced position evaluation
  static evaluatePositionAdvanced(game) {
    if (game.gameState === 'checkmate') {
      return game.currentPlayer === 'BLACK' ? 30000 : -30000;
    }
    if (game.gameState === 'stalemate' || game.gameState === 'draw') {
      return 0;
    }

    let score = 0;
    const isEndgame = this.isEndgame(game);

    // Material evaluation
    score += this.evaluateMaterial(game);

    // Piece activity and mobility
    score += this.evaluatePieceActivity(game);

    // Pawn structure
    score += this.evaluatePawnStructureAdvanced(game);

    // King safety
    if (!isEndgame) {
      score += this.evaluateKingSafetyAdvanced(game);
    } else {
      score += this.evaluateKingEndgame(game);
    }

    // Control of key squares
    score += this.evaluateSquareControl(game);

    // Piece coordination
    score += this.evaluatePieceCoordination(game);

    return game.currentPlayer === 'WHITE' ? score : -score;
  }

  // Evaluate material balance
  static evaluateMaterial(game) {
    let score = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = game.getPieceAt(row, col);
        if (piece) {
          const value = piece.getValue() + piece.getPositionalValue(this.isEndgame(game));
          score += piece.color === 'WHITE' ? value : -value;
        }
      }
    }
    
    return score;
  }

  // Evaluate piece activity and mobility
  static evaluatePieceActivity(game) {
    let whiteActivity = 0;
    let blackActivity = 0;

    const pieces = {
      WHITE: game.getPieces('WHITE'),
      BLACK: game.getPieces('BLACK')
    };

    for (const color of ['WHITE', 'BLACK']) {
      for (const piece of pieces[color]) {
        const moves = piece.getPossibleMoves(game.board);
        const mobility = moves.length;
        
        // Weight mobility by piece type
        let weight = 1;
        switch (piece.type) {
          case 'KNIGHT': weight = 4; break;
          case 'BISHOP': weight = 3; break;
          case 'ROOK': weight = 2; break;
          case 'QUEEN': weight = 1; break;
        }
        
        const activity = mobility * weight;
        if (color === 'WHITE') {
          whiteActivity += activity;
        } else {
          blackActivity += activity;
        }
      }
    }

    return whiteActivity - blackActivity;
  }

  // Advanced pawn structure evaluation
  static evaluatePawnStructureAdvanced(game) {
    let whiteScore = 0;
    let blackScore = 0;

    const pawns = {
      WHITE: game.getPieces('WHITE').filter(p => p.type === 'PAWN'),
      BLACK: game.getPieces('BLACK').filter(p => p.type === 'PAWN')
    };

    for (const color of ['WHITE', 'BLACK']) {
      let score = 0;
      const colorPawns = pawns[color];
      
      // Pawn chains bonus
      for (const pawn of colorPawns) {
        const hasSupport = colorPawns.some(p => 
          Math.abs(p.col - pawn.col) === 1 && 
          Math.abs(p.row - pawn.row) === 1
        );
        if (hasSupport) score += 15;
      }

      // Passed pawns
      for (const pawn of colorPawns) {
        if (this.isPassedPawn(game, pawn)) {
          const rank = color === 'WHITE' ? 7 - pawn.row : pawn.row;
          score += 20 + rank * rank * 5;
        }
      }

      // Doubled pawns penalty
      const files = {};
      for (const pawn of colorPawns) {
        files[pawn.col] = (files[pawn.col] || 0) + 1;
      }
      for (const count of Object.values(files)) {
        if (count > 1) score -= 15 * (count - 1);
      }

      // Isolated pawns penalty
      for (const pawn of colorPawns) {
        const hasNeighborFile = colorPawns.some(p => 
          Math.abs(p.col - pawn.col) === 1
        );
        if (!hasNeighborFile) score -= 20;
      }

      // Backward pawns penalty
      for (const pawn of colorPawns) {
        if (this.isBackwardPawn(game, pawn, colorPawns)) {
          score -= 15;
        }
      }

      if (color === 'WHITE') {
        whiteScore = score;
      } else {
        blackScore = score;
      }
    }

    return whiteScore - blackScore;
  }

  // Check if pawn is backward
  static isBackwardPawn(game, pawn, friendlyPawns) {
    const direction = pawn.color === 'WHITE' ? -1 : 1;
    
    // Check if pawn is behind friendly pawns on adjacent files
    for (let colOffset = -1; colOffset <= 1; colOffset += 2) {
      const adjacentCol = pawn.col + colOffset;
      if (adjacentCol >= 0 && adjacentCol < 8) {
        const adjacentPawns = friendlyPawns.filter(p => p.col === adjacentCol);
        for (const adjPawn of adjacentPawns) {
          if (pawn.color === 'WHITE') {
            if (adjPawn.row < pawn.row) return true;
          } else {
            if (adjPawn.row > pawn.row) return true;
          }
        }
      }
    }
    
    return false;
  }

  // Advanced king safety evaluation
  static evaluateKingSafetyAdvanced(game) {
    let whiteKingSafety = 0;
    let blackKingSafety = 0;

    for (const color of ['WHITE', 'BLACK']) {
      const kingPos = game.kingPositions[color];
      const oppositeColor = color === 'WHITE' ? 'BLACK' : 'WHITE';
      let safety = 0;

      // Pawn shield
      const direction = color === 'WHITE' ? -1 : 1;
      for (let colOffset = -1; colOffset <= 1; colOffset++) {
        const col = kingPos[1] + colOffset;
        if (col >= 0 && col < 8) {
          const pawn = game.getPieceAt(kingPos[0] + direction, col);
          if (pawn && pawn.type === 'PAWN' && pawn.color === color) {
            safety += 20;
          }
          // Second rank pawn shield
          const pawn2 = game.getPieceAt(kingPos[0] + direction * 2, col);
          if (pawn2 && pawn2.type === 'PAWN' && pawn2.color === color) {
            safety += 10;
          }
        }
      }

      // King exposure penalty
      const attackers = this.countAttackers(game, kingPos[0], kingPos[1], oppositeColor);
      safety -= attackers * 30;

      // Open files near king penalty
      for (let colOffset = -1; colOffset <= 1; colOffset++) {
        const col = kingPos[1] + colOffset;
        if (col >= 0 && col < 8) {
          if (this.isOpenFile(game, col)) {
            safety -= 20;
          } else if (this.isSemiOpenFile(game, col, color)) {
            safety -= 10;
          }
        }
      }

      // Castling rights bonus
      const king = game.getPieceAt(kingPos[0], kingPos[1]);
      if (king && !king.hasMoved) {
        safety += 25;
      }

      // King tropism (enemy pieces close to king)
      const enemyPieces = game.getPieces(oppositeColor);
      for (const piece of enemyPieces) {
        if (piece.type !== 'KING' && piece.type !== 'PAWN') {
          const distance = Math.abs(piece.row - kingPos[0]) + Math.abs(piece.col - kingPos[1]);
          if (distance <= 3) {
            safety -= (4 - distance) * 5;
          }
        }
      }

      if (color === 'WHITE') {
        whiteKingSafety = safety;
      } else {
        blackKingSafety = safety;
      }
    }

    return whiteKingSafety - blackKingSafety;
  }

  // Check if file is open (no pawns)
  static isOpenFile(game, col) {
    for (let row = 0; row < 8; row++) {
      const piece = game.getPieceAt(row, col);
      if (piece && piece.type === 'PAWN') {
        return false;
      }
    }
    return true;
  }

  // Check if file is semi-open for a color (no friendly pawns)
  static isSemiOpenFile(game, col, color) {
    for (let row = 0; row < 8; row++) {
      const piece = game.getPieceAt(row, col);
      if (piece && piece.type === 'PAWN' && piece.color === color) {
        return false;
      }
    }
    return true;
  }

  // King endgame evaluation
  static evaluateKingEndgame(game) {
    let score = 0;
    
    // In endgame, king should be active and centralized
    for (const color of ['WHITE', 'BLACK']) {
      const kingPos = game.kingPositions[color];
      const centerDistance = Math.abs(3.5 - kingPos[0]) + Math.abs(3.5 - kingPos[1]);
      const centralityBonus = (7 - centerDistance) * 15;
      
      // King activity - proximity to passed pawns
      const pawns = game.getPieces(color).filter(p => p.type === 'PAWN');
      let pawnProximityBonus = 0;
      for (const pawn of pawns) {
        if (this.isPassedPawn(game, pawn)) {
          const distance = Math.abs(pawn.row - kingPos[0]) + Math.abs(pawn.col - kingPos[1]);
          pawnProximityBonus += (8 - distance) * 5;
        }
      }
      
      if (color === 'WHITE') {
        score += centralityBonus + pawnProximityBonus;
      } else {
        score -= centralityBonus + pawnProximityBonus;
      }
    }
    
    return score;
  }

  // Evaluate control of important squares
  static evaluateSquareControl(game) {
    let whiteControl = 0;
    let blackControl = 0;

    // Central squares
    const importantSquares = [
      [3, 3], [3, 4], [4, 3], [4, 4], // Center
      [2, 2], [2, 3], [2, 4], [2, 5], // Extended center
      [5, 2], [5, 3], [5, 4], [5, 5]
    ];

    for (const [row, col] of importantSquares) {
      const whiteAttackers = this.countAttackers(game, row, col, 'WHITE');
      const blackAttackers = this.countAttackers(game, row, col, 'BLACK');
      
      const weight = (row === 3 || row === 4) && (col === 3 || col === 4) ? 10 : 5;
      whiteControl += whiteAttackers * weight;
      blackControl += blackAttackers * weight;
    }

    // Outpost squares (protected by pawns, can't be attacked by enemy pawns)
    whiteControl += this.evaluateOutposts(game, 'WHITE');
    blackControl += this.evaluateOutposts(game, 'BLACK');

    return whiteControl - blackControl;
  }

  // Evaluate outpost squares
  static evaluateOutposts(game, color) {
    let score = 0;
    const pieces = game.getPieces(color).filter(p => ['KNIGHT', 'BISHOP'].includes(p.type));
    const friendlyPawns = game.getPieces(color).filter(p => p.type === 'PAWN');
    const enemyPawns = game.getPieces(color === 'WHITE' ? 'BLACK' : 'WHITE').filter(p => p.type === 'PAWN');
    
    for (const piece of pieces) {
      // Check if piece is protected by pawn
      const protectedByPawn = friendlyPawns.some(pawn => {
        const pawnMoves = pawn.getPossibleMoves(game.board);
        return pawnMoves.some(([r, c]) => r === piece.row && c === piece.col);
      });
      
      if (protectedByPawn) {
        // Check if enemy pawns can attack this square
        const canBeAttackedByPawn = enemyPawns.some(pawn => {
          const direction = pawn.color === 'WHITE' ? -1 : 1;
          const attackRow = pawn.row + direction;
          const attackCols = [pawn.col - 1, pawn.col + 1];
          return attackCols.some(col => 
            col >= 0 && col < 8 && attackRow === piece.row && col === piece.col
          );
        });
        
        if (!canBeAttackedByPawn) {
          score += piece.type === 'KNIGHT' ? 30 : 20;
        }
      }
    }
    
    return score;
  }

  // Evaluate piece coordination
  static evaluatePieceCoordination(game) {
    let score = 0;

    // Rook on open file bonus
    for (let col = 0; col < 8; col++) {
      const isOpen = this.isOpenFile(game, col);
      
      if (isOpen) {
        for (let row = 0; row < 8; row++) {
          const piece = game.getPieceAt(row, col);
          if (piece && piece.type === 'ROOK') {
            score += piece.color === 'WHITE' ? 25 : -25;
          }
        }
      } else {
        // Semi-open file bonus
        for (const color of ['WHITE', 'BLACK']) {
          if (this.isSemiOpenFile(game, col, color)) {
            for (let row = 0; row < 8; row++) {
              const piece = game.getPieceAt(row, col);
              if (piece && piece.type === 'ROOK' && piece.color === color) {
                score += color === 'WHITE' ? 15 : -15;
              }
            }
          }
        }
      }
    }

    // Connected rooks bonus
    const rooks = {
      WHITE: game.getPieces('WHITE').filter(p => p.type === 'ROOK'),
      BLACK: game.getPieces('BLACK').filter(p => p.type === 'ROOK')
    };

    for (const color of ['WHITE', 'BLACK']) {
      if (rooks[color].length === 2) {
        const [r1, r2] = rooks[color];
        if (this.areRooksConnected(game, r1, r2)) {
          score += color === 'WHITE' ? 20 : -20;
        }
      }
    }

    // Bishop pair bonus
    const bishops = {
      WHITE: game.getPieces('WHITE').filter(p => p.type === 'BISHOP'),
      BLACK: game.getPieces('BLACK').filter(p => p.type === 'BISHOP')
    };

    for (const color of ['WHITE', 'BLACK']) {
      if (bishops[color].length === 2) {
        score += color === 'WHITE' ? 30 : -30;
      }
    }

    // Knight and bishop coordination
    score += this.evaluateMinorPieceCoordination(game);

    return score;
  }

  // Check if rooks are connected
  static areRooksConnected(game, r1, r2) {
    if (r1.row === r2.row) {
      const minCol = Math.min(r1.col, r2.col);
      const maxCol = Math.max(r1.col, r2.col);
      for (let col = minCol + 1; col < maxCol; col++) {
        if (game.getPieceAt(r1.row, col)) {
          return false;
        }
      }
      return true;
    } else if (r1.col === r2.col) {
      const minRow = Math.min(r1.row, r2.row);
      const maxRow = Math.max(r1.row, r2.row);
      for (let row = minRow + 1; row < maxRow; row++) {
        if (game.getPieceAt(row, r1.col)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  // Evaluate minor piece coordination
  static evaluateMinorPieceCoordination(game) {
    let score = 0;
    
    for (const color of ['WHITE', 'BLACK']) {
      const knights = game.getPieces(color).filter(p => p.type === 'KNIGHT');
      const bishops = game.getPieces(color).filter(p => p.type === 'BISHOP');
      
      // Knights protecting each other
      for (let i = 0; i < knights.length; i++) {
        for (let j = i + 1; j < knights.length; j++) {
          const moves1 = knights[i].getPossibleMoves(game.board);
          const moves2 = knights[j].getPossibleMoves(game.board);
          
          if (moves1.some(([r, c]) => r === knights[j].row && c === knights[j].col) ||
              moves2.some(([r, c]) => r === knights[i].row && c === knights[i].col)) {
            score += color === 'WHITE' ? 10 : -10;
          }
        }
      }
      
      // Bishop and knight coordination
      for (const knight of knights) {
        for (const bishop of bishops) {
          const distance = Math.abs(knight.row - bishop.row) + Math.abs(knight.col - bishop.col);
          if (distance <= 3) {
            score += color === 'WHITE' ? 5 : -5;
          }
        }
      }
    }
    
    return score;
  }

  // Count attackers on a square
  static countAttackers(game, row, col, color) {
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

  // Check if pawn is passed
  static isPassedPawn(game, pawn) {
    const oppositeColor = pawn.color === 'WHITE' ? 'BLACK' : 'WHITE';
    const enemyPawns = game.getPieces(oppositeColor).filter(p => p.type === 'PAWN');

    for (const enemyPawn of enemyPawns) {
      // Check if enemy pawn can block or capture
      if (Math.abs(enemyPawn.col - pawn.col) <= 1) {
        if (pawn.color === 'WHITE') {
          if (enemyPawn.row < pawn.row) return false;
        } else {
          if (enemyPawn.row > pawn.row) return false;
        }
      }
    }

    return true;
  }

  // Check if game is in endgame
  static isEndgame(game) {
    const pieces = game.getPieces('WHITE').concat(game.getPieces('BLACK'));
    const queens = pieces.filter(p => p.type === 'QUEEN').length;
    const rooks = pieces.filter(p => p.type === 'ROOK').length;
    const minorPieces = pieces.filter(p => ['BISHOP', 'KNIGHT'].includes(p.type)).length;
    
    // Endgame if no queens, or if very few major pieces
    return queens === 0 || (queens <= 2 && rooks <= 2 && minorPieces <= 4);
  }
}

// ChessEvaluation methods are called directly via static methods

// Export for module compatibility
export { ChessEvaluation };
