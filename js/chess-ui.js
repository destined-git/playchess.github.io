// Chess UI and Interaction Handler
class ChessUI {
    constructor() {
        this.game = new ChessGame();
        this.ai = new ChessAI(2);
        this.selectedSquare = null;
        this.validMoves = [];
        this.gameStartTime = null;
        this.gameTimer = null;
        this.playerColor = 'WHITE'; // Player's color
        this.isPlayerTurn = true;
        this.isThinking = false;
        
        this.initializeBoard();
        this.setupEventListeners();
        this.updateDisplay();
    }

    // Initialize the visual chessboard
    initializeBoard() {
        const chessboard = document.getElementById('chessboard');
        chessboard.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                square.addEventListener('click', (e) => this.handleSquareClick(e));
                square.addEventListener('dragover', (e) => this.handleDragOver(e));
                square.addEventListener('drop', (e) => this.handleDrop(e));
                
                // Prevent context menu on squares
                square.addEventListener('contextmenu', (e) => e.preventDefault());
                
                chessboard.appendChild(square);
            }
        }

        this.updateBoardDisplay();
    }

    // Setup event listeners for game controls
    setupEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('difficulty').addEventListener('change', (e) => this.changeDifficulty(e.target.value));
        document.getElementById('player-color').addEventListener('change', (e) => this.changePlayerColor(e.target.value));
    }

    // Handle square click events
    handleSquareClick(event) {
        if (!this.isPlayerTurn || this.isThinking) return;

        let target = event.target;
        // If clicked on piece, get the square
        if (target.classList.contains('piece')) {
            target = target.closest('.square');
        }
        
        const row = parseInt(target.dataset.row);
        const col = parseInt(target.dataset.col);
        const piece = this.game.getPieceAt(row, col);

        if (this.selectedSquare) {
            // Try to make a move
            if (this.isValidMove(row, col)) {
                this.makePlayerMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
            } else if (piece && piece.color === this.playerColor) {
                // Select a different piece
                this.selectSquare(row, col);
            } else {
                // Deselect
                this.deselectSquare();
            }
        } else if (piece && piece.color === this.playerColor) {
            // Select a piece
            this.selectSquare(row, col);
        }
    }

    // Setup drag events for pieces
    setupPieceDragEvents(pieceElement, row, col, piece) {
        let isDragging = false;
        let dragStartPos = { x: 0, y: 0 };
        
        // Mouse drag events
        pieceElement.addEventListener('mousedown', (e) => {
            if (piece.color !== this.playerColor || !this.isPlayerTurn || this.isThinking) return;
            
            isDragging = true;
            dragStartPos = { x: e.clientX, y: e.clientY };
            
            this.selectSquare(row, col);
            pieceElement.classList.add('dragging');
            
            const onMouseMove = (e) => {
                if (!isDragging) return;
                
                pieceElement.style.left = (e.clientX - 35) + 'px';
                pieceElement.style.top = (e.clientY - 35) + 'px';
            };
            
            const onMouseUp = (e) => {
                if (!isDragging) return;
                
                isDragging = false;
                pieceElement.classList.remove('dragging');
                pieceElement.style.left = '';
                pieceElement.style.top = '';
                
                // Find the square under the mouse
                const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
                const targetSquare = elementBelow ? elementBelow.closest('.square') : null;
                
                if (targetSquare) {
                    const targetRow = parseInt(targetSquare.dataset.row);
                    const targetCol = parseInt(targetSquare.dataset.col);
                    
                    if (this.isValidMove(targetRow, targetCol)) {
                        this.makePlayerMove(row, col, targetRow, targetCol);
                    } else {
                        this.deselectSquare();
                    }
                } else {
                    this.deselectSquare();
                }
                
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            
            e.preventDefault();
        });
        
        // HTML5 drag events as fallback
        pieceElement.addEventListener('dragstart', (e) => {
            if (piece.color === this.playerColor && this.isPlayerTurn && !this.isThinking) {
                this.selectSquare(row, col);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', `${row},${col}`);
            } else {
                e.preventDefault();
            }
        });
        
        pieceElement.addEventListener('dragend', (e) => {
            pieceElement.classList.remove('dragging');
        });
    }

    // Handle drag over events
    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }

    // Handle drop events for drag and drop
    handleDrop(event) {
        event.preventDefault();
        if (!this.isPlayerTurn || this.isThinking) return;

        let target = event.target;
        if (target.classList.contains('piece')) {
            target = target.closest('.square');
        }
        
        const row = parseInt(target.dataset.row);
        const col = parseInt(target.dataset.col);
        
        const dragData = event.dataTransfer.getData('text/plain');
        if (dragData && this.selectedSquare) {
            const [fromRow, fromCol] = dragData.split(',').map(Number);
            
            if (this.isValidMove(row, col)) {
                this.makePlayerMove(fromRow, fromCol, row, col);
            }
        }
        
        this.deselectSquare();
    }

    // Select a square and show valid moves
    selectSquare(row, col) {
        this.deselectSquare();
        
        const piece = this.game.getPieceAt(row, col);
        if (!piece || piece.color !== this.playerColor) return;

        this.selectedSquare = { row, col };
        this.validMoves = this.game.getLegalMoves(piece);

        // Highlight selected square
        const square = this.getSquareElement(row, col);
        square.classList.add('selected');

        // Highlight valid moves
        this.validMoves.forEach(([moveRow, moveCol]) => {
            const moveSquare = this.getSquareElement(moveRow, moveCol);
            const targetPiece = this.game.getPieceAt(moveRow, moveCol);
            
            if (targetPiece) {
                moveSquare.classList.add('capture-move');
            } else {
                moveSquare.classList.add('valid-move');
            }
        });
    }

    // Deselect current square
    deselectSquare() {
        if (this.selectedSquare) {
            const square = this.getSquareElement(this.selectedSquare.row, this.selectedSquare.col);
            square.classList.remove('selected');
        }

        // Remove move highlights
        document.querySelectorAll('.valid-move, .capture-move').forEach(square => {
            square.classList.remove('valid-move', 'capture-move');
        });

        this.selectedSquare = null;
        this.validMoves = [];
    }

    // Check if a move is valid
    isValidMove(row, col) {
        return this.validMoves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col);
    }

    // Make a player move
    async makePlayerMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.game.getPieceAt(fromRow, fromCol);
        
        // Handle pawn promotion
        let promotionPiece = 'QUEEN';
        if (piece.type === 'PAWN' && (toRow === 0 || toRow === 7)) {
            promotionPiece = await this.showPromotionDialog();
        }

        const moveSuccess = this.game.makeMove(fromRow, fromCol, toRow, toCol, promotionPiece);
        
        if (moveSuccess) {
            this.deselectSquare();
            this.updateDisplay();
            this.playMoveSound();
            
            // Check for game end
            if (this.game.gameState === 'checkmate' || this.game.gameState === 'stalemate' || this.game.gameState === 'draw') {
                this.handleGameEnd();
                return;
            }

            // AI's turn
            this.isPlayerTurn = false;
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    // Make AI move
    async makeAIMove() {
        const aiColor = this.playerColor === 'WHITE' ? 'BLACK' : 'WHITE';
        if (this.game.currentPlayer !== aiColor || (this.game.gameState !== 'playing' && this.game.gameState !== 'check')) return;

        this.isThinking = true;
        this.showThinkingIndicator();

        try {
            // Get AI move in a timeout to prevent UI blocking
            const aiMove = await new Promise((resolve) => {
                setTimeout(() => {
                    const move = this.ai.getBestMove(this.game);
                    resolve(move);
                }, 100);
            });

            if (aiMove) {
                const moveSuccess = this.game.makeMove(
                    aiMove.from[0], aiMove.from[1], 
                    aiMove.to[0], aiMove.to[1]
                );

                if (moveSuccess) {
                    this.highlightLastMove(aiMove.from, aiMove.to);
                    this.updateDisplay();
                    this.playMoveSound();
                }
            }
        } catch (error) {
            console.error('AI move error:', error);
        }

        this.hideThinkingIndicator();
        this.isThinking = false;
        this.isPlayerTurn = true;

        // Check for game end
        if (this.game.gameState === 'checkmate' || this.game.gameState === 'stalemate' || this.game.gameState === 'draw') {
            this.handleGameEnd();
        }
    }

    // Show promotion dialog
    showPromotionDialog() {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'promotion-dialog show';
            dialog.innerHTML = `
                <h3>Choose Promotion Piece</h3>
                <div class="promotion-pieces">
                    <div class="promotion-piece" data-piece="QUEEN">♕</div>
                    <div class="promotion-piece" data-piece="ROOK">♖</div>
                    <div class="promotion-piece" data-piece="BISHOP">♗</div>
                    <div class="promotion-piece" data-piece="KNIGHT">♘</div>
                </div>
            `;

            const overlay = document.createElement('div');
            overlay.className = 'overlay show';

            document.body.appendChild(overlay);
            document.body.appendChild(dialog);

            dialog.addEventListener('click', (e) => {
                if (e.target.classList.contains('promotion-piece')) {
                    const piece = e.target.dataset.piece;
                    document.body.removeChild(dialog);
                    document.body.removeChild(overlay);
                    resolve(piece);
                }
            });
        });
    }

    // Update the visual board display
    updateBoardDisplay() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.getSquareElement(row, col);
                const piece = this.game.getPieceAt(row, col);
                
                // Remove has-piece class
                square.classList.remove('has-piece');
                
                if (piece) {
                    const colorClass = piece.color.toLowerCase();
                    square.innerHTML = `<span class="piece ${colorClass}" draggable="true">${piece.symbol}</span>`;
                    square.classList.add('has-piece');
                    
                    // Add drag event listeners
                    const pieceElement = square.querySelector('.piece');
                    this.setupPieceDragEvents(pieceElement, row, col, piece);
                } else {
                    square.innerHTML = '';
                }
            }
        }
    }

    // Update all UI elements
    updateDisplay() {
        this.updateBoardDisplay();
        this.updateGameInfo();
        this.updateMoveHistory();
        this.updateCapturedPieces();
        this.updateGameStatus();
    }

    // Update game information panel
    updateGameInfo() {
        const turnElement = document.getElementById('current-turn');
        const isPlayerTurn = this.game.currentPlayer === this.playerColor;
        turnElement.textContent = `${isPlayerTurn ? 'Your' : "Bot's"} Turn`;
        
        // Update player indicators
        document.querySelectorAll('.player').forEach(player => player.classList.remove('active'));
        if (this.game.currentPlayer === 'WHITE') {
            document.querySelector('.white-player').classList.add('active');
        } else {
            document.querySelector('.black-player').classList.add('active');
        }

        // Update timer
        if (this.gameStartTime) {
            const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            document.getElementById('game-time').textContent = `${minutes}:${seconds}`;
        }
    }

    // Update move history
    updateMoveHistory() {
        const movesList = document.getElementById('moves-list');
        movesList.innerHTML = '';

        this.game.moveHistory.forEach((move, index) => {
            const moveElement = document.createElement('div');
            moveElement.className = 'move-item';
            const moveNumber = Math.floor(index / 2) + 1;
            const isWhiteMove = index % 2 === 0;
            moveElement.textContent = `${isWhiteMove ? moveNumber + '.' : ''} ${move.notation}`;
            movesList.appendChild(moveElement);
        });

        movesList.scrollTop = movesList.scrollHeight;
    }

    // Update captured pieces display
    updateCapturedPieces() {
        const whiteCaptured = document.getElementById('captured-white-pieces');
        const blackCaptured = document.getElementById('captured-black-pieces');

        whiteCaptured.innerHTML = this.game.capturedPieces.WHITE
            .map(piece => `<span class="captured-piece">${piece.symbol}</span>`)
            .join('');

        blackCaptured.innerHTML = this.game.capturedPieces.BLACK
            .map(piece => `<span class="captured-piece">${piece.symbol}</span>`)
            .join('');
    }

    // Update game status message
    updateGameStatus() {
        const statusElement = document.getElementById('status-message');
        
        switch (this.game.gameState) {
            case 'check':
                statusElement.textContent = `${this.game.currentPlayer} is in check!`;
                statusElement.className = 'status-message check';
                break;
            case 'checkmate':
                const winner = this.game.currentPlayer === 'WHITE' ? 'Black' : 'White';
                statusElement.textContent = `Checkmate! ${winner} wins!`;
                statusElement.className = 'status-message checkmate';
                break;
            case 'stalemate':
                statusElement.textContent = 'Stalemate! The game is a draw.';
                statusElement.className = 'status-message stalemate';
                break;
            case 'draw':
                statusElement.textContent = 'Draw! The game ends in a tie.';
                statusElement.className = 'status-message stalemate';
                break;
            default:
                if (this.game.currentPlayer === 'WHITE') {
                    statusElement.textContent = 'Your turn. Make your move!';
                } else {
                    statusElement.textContent = 'AI is thinking...';
                }
                statusElement.className = 'status-message';
        }
    }

    // Highlight the last move
    highlightLastMove(from, to) {
        // Remove previous highlights
        document.querySelectorAll('.last-move').forEach(square => {
            square.classList.remove('last-move');
        });

        // Add new highlights
        const fromSquare = this.getSquareElement(from[0], from[1]);
        const toSquare = this.getSquareElement(to[0], to[1]);
        
        fromSquare.classList.add('last-move');
        toSquare.classList.add('last-move');
        
        // Add a subtle animation
        toSquare.style.animation = 'moveHighlight 0.5s ease-out';
        setTimeout(() => {
            toSquare.style.animation = '';
        }, 500);
    }

    // Show thinking indicator
    showThinkingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'thinking-indicator';
        indicator.className = 'thinking-indicator show';
        indicator.innerHTML = `
            <div class="spinner"></div>
            <div>AI is thinking...</div>
        `;
        document.body.appendChild(indicator);
    }

    // Hide thinking indicator
    hideThinkingIndicator() {
        const indicator = document.getElementById('thinking-indicator');
        if (indicator) {
            document.body.removeChild(indicator);
        }
    }

    // Get square element by coordinates
    getSquareElement(row, col) {
        return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    // Start a new game
    newGame() {
        this.game.reset();
        this.deselectSquare();
        this.gameStartTime = Date.now();
        this.isThinking = false;
        
        // Set initial turn based on player color
        this.isPlayerTurn = (this.playerColor === 'WHITE');
        
        // Clear last move highlights
        document.querySelectorAll('.last-move').forEach(square => {
            square.classList.remove('last-move');
        });
        
        this.updateDisplay();
        this.startGameTimer();
        
        // If player is black, AI should make the first move
        if (this.playerColor === 'BLACK') {
            setTimeout(() => this.makeAIMove(), 1000);
        }
    }


    // Show hint for the player
    async showHint() {
        if (this.game.currentPlayer !== this.playerColor || this.isThinking) return;

        this.isThinking = true;
        const hint = await new Promise((resolve) => {
            setTimeout(() => {
                const move = this.ai.getHint(this.game);
                resolve(move);
            }, 100);
        });
        this.isThinking = false;

        if (hint) {
            // Highlight the suggested move
            this.highlightLastMove(hint.from, hint.to);
            setTimeout(() => {
                document.querySelectorAll('.last-move').forEach(square => {
                    square.classList.remove('last-move');
                });
            }, 3000);
        }
    }

    // Change AI difficulty
    changeDifficulty(difficulty) {
        this.ai.setDifficulty(parseInt(difficulty));
    }

    // Change player color
    changePlayerColor(color) {
        this.playerColor = color.toUpperCase();
        this.newGame(); // Start a new game with the new color
    }

    // Handle game end
    handleGameEnd() {
        this.isPlayerTurn = false;
        clearInterval(this.gameTimer);
        
        // Play game end sound
        this.playGameEndSound();
        
        // Show game over dialog
        setTimeout(() => {
            this.showGameOverDialog();
        }, 1000);
    }

    // Show game over dialog with result and rematch option
    showGameOverDialog() {
        let title = '';
        let message = '';
        let resultClass = '';
        
        switch (this.game.gameState) {
            case 'checkmate':
                const winner = this.game.currentPlayer === 'WHITE' ? 'BLACK' : 'WHITE';
                if (winner === this.playerColor) {
                    title = '🎉 You Won!';
                    message = 'Congratulations! You checkmated the AI!';
                    resultClass = 'victory';
                } else {
                    title = '😔 You Lost!';
                    message = 'The AI checkmated you. Better luck next time!';
                    resultClass = 'defeat';
                }
                break;
            case 'stalemate':
                title = '🤝 Draw!';
                message = 'The game ended in a stalemate. No one wins!';
                resultClass = 'draw';
                break;
            case 'draw':
                title = '🤝 Draw!';
                message = 'The game ended in a draw due to insufficient material or 50-move rule.';
                resultClass = 'draw';
                break;
        }

        const dialog = document.createElement('div');
        dialog.className = `game-over-dialog show ${resultClass}`;
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>${title}</h2>
                <p>${message}</p>
                <div class="dialog-buttons">
                    <button id="rematch-btn" class="btn primary">Play Again</button>
                    <button id="close-dialog-btn" class="btn secondary">Close</button>
                </div>
            </div>
        `;

        const overlay = document.createElement('div');
        overlay.className = 'overlay show';

        document.body.appendChild(overlay);
        document.body.appendChild(dialog);

        // Add event listeners
        document.getElementById('rematch-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
            document.body.removeChild(overlay);
            this.newGame();
        });

        document.getElementById('close-dialog-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
            document.body.removeChild(overlay);
        });

        // Close on overlay click
        overlay.addEventListener('click', () => {
            document.body.removeChild(dialog);
            document.body.removeChild(overlay);
        });
    }

    // Start game timer
    startGameTimer() {
        clearInterval(this.gameTimer);
        this.gameTimer = setInterval(() => {
            this.updateGameInfo();
        }, 1000);
    }

    // Play move sound
    playMoveSound() {
        // In a full implementation, you'd play an actual sound file
        console.log('Move sound played');
    }

    // Play game end sound
    playGameEndSound() {
        // In a full implementation, you'd play an actual sound file
        console.log('Game end sound played');
    }
}

