# 🤖 Chess Bot - AI Chess Game

A beautiful and intelligent chess game built with HTML, CSS, and JavaScript featuring an AI opponent that plays at a decent level using the minimax algorithm with alpha-beta pruning.

## 🎮 Features

### Game Features
- **Full Chess Implementation**: Complete chess rules including castling, en passant, and pawn promotion
- **AI Opponent**: Intelligent bot with 4 difficulty levels (Easy, Medium, Hard, Expert)
- **Beautiful UI**: Modern, responsive design with smooth animations
- **Move Validation**: Legal move checking and game state detection
- **Game Controls**: New game, undo move, and hint system
- **Move History**: Complete notation and move tracking
- **Captured Pieces**: Visual display of captured pieces
- **Game Timer**: Track game duration
- **Touch Support**: Mobile-friendly drag and drop

### AI Features
- **Minimax Algorithm**: Advanced game tree search with alpha-beta pruning
- **Position Evaluation**: Sophisticated board evaluation considering:
  - Material value
  - Piece positioning
  - King safety
  - Pawn structure
  - Center control
  - Piece mobility
- **Transposition Table**: Caching for improved performance
- **Move Ordering**: Optimized search with killer moves and history heuristics
- **Difficulty Scaling**: Adjustable search depth and evaluation randomness

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional dependencies required!

### Installation
1. Clone or download the chess-bot folder
2. Open `index.html` in your web browser
3. Start playing immediately!

### File Structure
```
chess-bot/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Beautiful styling and animations
├── js/
│   ├── chess-pieces.js     # Chess piece definitions and movement
│   ├── chess-logic.js      # Core game logic and rules
│   ├── chess-ai.js         # AI implementation with minimax
│   ├── chess-ui.js         # User interface and interactions
│   └── main.js             # Application entry point
└── README.md               # This file
```

## 🎯 How to Play

1. **Start a Game**: Click "New Game" or refresh the page
2. **Make Moves**: 
   - Click on a piece to select it (valid moves will be highlighted)
   - Click on a destination square to move
   - Or drag and drop pieces
3. **Special Moves**:
   - **Castling**: Move the king two squares toward a rook
   - **En Passant**: Automatic when conditions are met
   - **Promotion**: Choose piece when pawn reaches end
4. **Game Controls**:
   - **New Game**: Start fresh
   - **Undo Move**: Take back last move (simplified)
   - **Get Hint**: AI suggests best move for you
   - **Difficulty**: Adjust AI strength

## 🎮 Keyboard Shortcuts

- `Ctrl/Cmd + N`: New Game
- `Ctrl/Cmd + Z`: Undo Move
- `Ctrl/Cmd + H`: Get Hint
- `Escape`: Deselect piece

## 🤖 AI Difficulty Levels

1. **Easy (Depth 2)**: Good for beginners, makes some random moves
2. **Medium (Depth 3)**: Balanced play, good for intermediate players
3. **Hard (Depth 4)**: Strong tactical play, challenging for most players
4. **Expert (Depth 5)**: Very strong play, will challenge experienced players

## 🎨 Design Features

- **Modern UI**: Clean, professional design with beautiful gradients
- **Responsive**: Works on desktop, tablet, and mobile devices
- **Smooth Animations**: Piece movements and UI transitions
- **Visual Feedback**: Move highlights, check indicators, game status
- **Accessibility**: High contrast, clear typography, keyboard support

## 🔧 Technical Details

### Chess Engine
- Complete implementation of chess rules
- Legal move generation and validation
- Game state detection (check, checkmate, stalemate, draw)
- Move notation in algebraic format

### AI Implementation
- **Algorithm**: Minimax with alpha-beta pruning
- **Evaluation**: Multi-factor position assessment
- **Optimization**: Transposition tables, move ordering, killer moves
- **Performance**: Efficient search with configurable depth

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🎯 Game Statistics

The game tracks various statistics accessible via the browser console:
- Games played
- Win/loss/draw ratios
- Average game length
- Move timing performance

Access with: `window.gameStats`

## 🛠️ Development

### Debugging
Access game internals via browser console:
- `window.chessGame`: Game state and logic
- `window.chessAI`: AI instance and settings
- `window.chessUI`: UI controller
- `window.gameStats`: Performance statistics

### Customization
- Modify `PIECE_VALUES` in `chess-pieces.js` for different piece valuations
- Adjust `POSITION_VALUES` for different positional preferences
- Change AI evaluation in `chess-ai.js` for different playing styles
- Customize colors and styling in `styles.css`

## 🎉 Enjoy Playing!

This chess bot provides a challenging and enjoyable chess experience right in your browser. Whether you're a beginner learning the game or an experienced player looking for a quick match, the adjustable difficulty ensures a good game for everyone.

Have fun playing chess! 🎯♟️
