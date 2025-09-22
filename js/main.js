// Main Application Entry Point
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the chess game UI
    const chessUI = new ChessUI();
    
    // Global game instance for debugging
    window.chessGame = chessUI.game;
    window.chessAI = chessUI.ai;
    window.chessUI = chessUI;
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        switch(event.key) {
            case 'n':
            case 'N':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    chessUI.newGame();
                }
                break;
            case 'h':
            case 'H':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    chessUI.showHint();
                }
                break;
            case 'Escape':
                chessUI.deselectSquare();
                break;
        }
    });
    
    // Enhanced touch support for mobile devices
    let touchStartPos = null;
    let touchMoveThreshold = 10; // pixels

    document.addEventListener('touchstart', function(event) {
        if (event.target.classList.contains('piece')) {
            event.preventDefault(); // Prevent scrolling
            touchStartPos = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
                element: event.target.closest('.square'),
                piece: event.target
            };

            // Add visual feedback
            event.target.style.transform = 'scale(1.1)';
        }
    });

    document.addEventListener('touchmove', function(event) {
        if (touchStartPos) {
            event.preventDefault(); // Prevent scrolling

            const touch = event.touches[0];
            const deltaX = Math.abs(touch.clientX - touchStartPos.x);
            const deltaY = Math.abs(touch.clientY - touchStartPos.y);

            // If moved beyond threshold, show dragging state
            if (deltaX > touchMoveThreshold || deltaY > touchMoveThreshold) {
                touchStartPos.piece.classList.add('dragging');
            }
        }
    });

    document.addEventListener('touchend', function(event) {
        if (touchStartPos) {
            event.preventDefault();

            // Reset visual feedback
            touchStartPos.piece.style.transform = '';
            touchStartPos.piece.classList.remove('dragging');

            const touchEndPos = {
                x: event.changedTouches[0].clientX,
                y: event.changedTouches[0].clientY
            };

            const deltaX = Math.abs(touchEndPos.x - touchStartPos.x);
            const deltaY = Math.abs(touchEndPos.y - touchStartPos.y);

            // If it's a small movement, treat as a tap
            if (deltaX <= touchMoveThreshold && deltaY <= touchMoveThreshold) {
                // Simple tap - select the piece
                const startRow = parseInt(touchStartPos.element.dataset.row);
                const startCol = parseInt(touchStartPos.element.dataset.col);
                chessUI.selectSquare(startRow, startCol);
            } else {
                // Drag and drop
                const elementAtEnd = document.elementFromPoint(touchEndPos.x, touchEndPos.y);
                const endSquare = elementAtEnd ? elementAtEnd.closest('.square') : null;

                if (endSquare && endSquare !== touchStartPos.element) {
                    const startRow = parseInt(touchStartPos.element.dataset.row);
                    const startCol = parseInt(touchStartPos.element.dataset.col);
                    const endRow = parseInt(endSquare.dataset.row);
                    const endCol = parseInt(endSquare.dataset.col);

                    chessUI.selectSquare(startRow, startCol);
                    if (chessUI.isValidMove(endRow, endCol)) {
                        chessUI.makePlayerMove(startRow, startCol, endRow, endCol);
                    } else {
                        chessUI.deselectSquare();
                    }
                } else {
                    chessUI.deselectSquare();
                }
            }

            touchStartPos = null;
        }
    });

    // Prevent context menu on long press for mobile
    document.addEventListener('contextmenu', function(event) {
        if (event.target.classList.contains('piece') || event.target.classList.contains('square')) {
            event.preventDefault();
        }
    });
    
    // Add window resize handler for responsive design
    window.addEventListener('resize', function() {
        // Adjust board size if needed
        adjustBoardSize();
    });
    
    function adjustBoardSize() {
        const container = document.querySelector('.chessboard-container');
        const board = document.getElementById('chessboard');
        const containerWidth = container.clientWidth;
        const maxBoardSize = Math.min(containerWidth - 100, 600);
        
        if (window.innerWidth <= 768) {
            const squareSize = Math.floor(maxBoardSize / 8);
            board.style.gridTemplateColumns = `repeat(8, ${squareSize}px)`;
            board.style.gridTemplateRows = `repeat(8, ${squareSize}px)`;
            
            // Update square sizes
            document.querySelectorAll('.square').forEach(square => {
                square.style.width = `${squareSize}px`;
                square.style.height = `${squareSize}px`;
            });
            
            // Update coordinate sizes
            document.querySelectorAll('.coord').forEach(coord => {
                coord.style.width = `${squareSize}px`;
                coord.style.height = `${squareSize}px`;
            });
        }
    }
    
    // Initial board size adjustment
    adjustBoardSize();
    
    // Add performance monitoring
    let moveCount = 0;
    const originalMakeMove = chessUI.game.makeMove.bind(chessUI.game);
    chessUI.game.makeMove = function(...args) {
        const startTime = performance.now();
        const result = originalMakeMove(...args);
        const endTime = performance.now();
        
        if (result) {
            moveCount++;
            console.log(`Move ${moveCount} took ${(endTime - startTime).toFixed(2)}ms`);
        }
        
        return result;
    };
    
    // Add AI performance monitoring
    const originalGetBestMove = chessUI.ai.getBestMove.bind(chessUI.ai);
    chessUI.ai.getBestMove = function(game) {
        const startTime = performance.now();
        const result = originalGetBestMove(game);
        const endTime = performance.now();
        
        console.log(`AI calculation took ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`Transposition table size: ${chessUI.ai.transpositionTable.size}`);
        
        return result;
    };
    
    // Add game statistics tracking
    const gameStats = {
        gamesPlayed: 0,
        playerWins: 0,
        aiWins: 0,
        draws: 0,
        totalMoves: 0,
        averageGameLength: 0
    };
    
    const originalHandleGameEnd = chessUI.handleGameEnd.bind(chessUI);
    chessUI.handleGameEnd = function() {
        gameStats.gamesPlayed++;
        gameStats.totalMoves += chessUI.game.moveHistory.length;
        gameStats.averageGameLength = gameStats.totalMoves / gameStats.gamesPlayed;
        
        switch(chessUI.game.gameState) {
            case 'checkmate':
                if (chessUI.game.currentPlayer === 'BLACK') {
                    gameStats.playerWins++;
                } else {
                    gameStats.aiWins++;
                }
                break;
            case 'stalemate':
            case 'draw':
                gameStats.draws++;
                break;
        }
        
        console.log('Game Statistics:', gameStats);
        originalHandleGameEnd();
    };
    
    // Expose game statistics globally
    window.gameStats = gameStats;
    
    // Add welcome message
    console.log('🤖 Chess Bot initialized successfully!');
    console.log('Available commands:');
    console.log('- Ctrl/Cmd + N: New Game');
    console.log('- Ctrl/Cmd + H: Get Hint');
    console.log('- Escape: Deselect piece');
    console.log('- window.gameStats: View game statistics');
    console.log('- window.chessGame: Access game instance');
    console.log('- window.chessAI: Access AI instance');
    
    // Show initial game status
    setTimeout(() => {
        const statusElement = document.getElementById('status-message');
        statusElement.textContent = 'Welcome! Click on a white piece to start playing.';
        statusElement.className = 'status-message';
    }, 100);
});
