# OpenRouter API Response

## Metadata
- **Model**: google/gemini-2.5-pro
- **Timestamp**: 2025-10-02T21:34:20.264Z
- **Duration**: 8.103 seconds

## Token Usage
- **Prompt Tokens**: 33
- **Completion Tokens**: 5916
- **Total Tokens**: 5949

## Prompt
```
In a single HTML file named index.html, create a simple tic tac toe game, when the game is finished, please make some original twist as finish animation ! 

```

## Response
Of course! Here is a complete, single-file Tic-Tac-Toe game with a unique "gravity" animation when the game is over. The winning pieces will glow, and then all the pieces will fall off the board.

Just copy the code below, paste it into a new file, and name it `index.html`. Then, open it in any web browser to play.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tic Tac Toe - Gravity Twist</title>
    <style>
        /* --- Basic Setup & Typography --- */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

        :root {
            --board-bg: #1a2a33;
            --cell-bg: #1f3641;
            --text-color: #a8bec9;
            --x-color: #31c3bd;
            --o-color: #f2b137;
            --shadow-color: #10212a;
            --winning-glow: #ffffff;
        }

        body {
            background-color: var(--board-bg);
            color: var(--text-color);
            font-family: 'Poppins', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }

        /* --- Game Container & Header --- */
        .game-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }

        h1 {
            color: var(--text-color);
            font-weight: 700;
            letter-spacing: 1px;
            margin: 0;
        }

        .status {
            font-size: 1.2em;
            font-weight: 600;
            min-height: 30px; /* Prevents layout shift */
        }

        /* --- Game Board & Cells --- */
        .board {
            display: grid;
            grid-template-columns: repeat(3, 100px);
            grid-template-rows: repeat(3, 100px);
            gap: 15px;
            background-color: var(--board-bg);
            padding: 15px;
            border-radius: 10px;
            transition: box-shadow 0.5s ease-in-out;
        }
        
        /* The Twist: When game is over, the board's grid lines disappear */
        .board.game-over {
            box-shadow: none;
        }

        .cell {
            background-color: var(--cell-bg);
            border-radius: 10px;
            box-shadow: 0 6px var(--shadow-color);
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 4em;
            font-weight: 700;
            cursor: pointer;
            transition: background-color 0.2s ease;
            position: relative; /* Needed for the falling animation */
        }

        .cell:hover:not(:empty) {
            cursor: not-allowed;
        }
        
        .cell:hover:empty {
             background-color: #2c4858;
        }

        .cell.x {
            color: var(--x-color);
        }

        .cell.o {
            color: var(--o-color);
        }
        
        /* --- The Finish Animation Twist --- */

        /* 1. Highlight the winning cells */
        .cell.winning-cell {
            animation: winning-glow 0.5s ease-in-out infinite alternate;
        }

        @keyframes winning-glow {
            from {
                background-color: var(--cell-bg);
            }
            to {
                background-color: var(--winning-glow);
            }
        }
        
        /* 2. Make the pieces fall with gravity */
        .cell.falling {
            animation: fall 1.5s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
            cursor: default;
        }

        @keyframes fall {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(60vh) rotate(360deg);
                opacity: 0;
            }
        }
        
        /* --- End Game Overlay & Restart Button --- */
        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.5s ease, visibility 0.5s ease;
            z-index: 1000;
        }
        
        .overlay.show {
            opacity: 1;
            visibility: visible;
        }

        .end-game-message {
            background-color: var(--cell-bg);
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            text-align: center;
        }

        .end-game-message h2 {
            margin-top: 0;
            font-size: 2.5em;
        }

        .restart-button {
            background-color: var(--x-color);
            color: var(--board-bg);
            border: none;
            padding: 15px 30px;
            font-size: 1em;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s ease, background-color 0.2s ease;
            box-shadow: 0 4px var(--shadow-color);
        }

        .restart-button:hover {
            transform: translateY(-2px);
            background-color: #65e9e4;
        }
    </style>
</head>
<body>

    <div class="game-container">
        <h1>Tic Tac Toe</h1>
        <p class="status">Player X's turn</p>
        <div class="board" id="board">
            <div class="cell" data-index="0"></div>
            <div class="cell" data-index="1"></div>
            <div class="cell" data-index="2"></div>
            <div class="cell" data-index="3"></div>
            <div class="cell" data-index="4"></div>
            <div class="cell" data-index="5"></div>
            <div class="cell" data-index="6"></div>
            <div class="cell" data-index="7"></div>
            <div class="cell" data-index="8"></div>
        </div>
    </div>

    <div class="overlay" id="overlay">
        <div class="end-game-message">
            <h2 id="end-game-text"></h2>
            <button class="restart-button" id="restart-button">Play Again</button>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const cells = document.querySelectorAll('.cell');
            const statusText = document.querySelector('.status');
            const boardElement = document.getElementById('board');
            const overlay = document.getElementById('overlay');
            const endGameText = document.getElementById('end-game-text');
            const restartButton = document.getElementById('restart-button');

            let isGameActive = true;
            let currentPlayer = 'X';
            let board = ['', '', '', '', '', '', '', '', ''];

            const winningConditions = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
                [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
                [0, 4, 8], [2, 4, 6]             // Diagonals
            ];

            const updateStatus = () => {
                statusText.textContent = isGameActive ? `Player ${currentPlayer}'s turn` : '';
            };

            const handleResultValidation = () => {
                let roundWon = false;
                let winningCombination = [];
                for (let i = 0; i < winningConditions.length; i++) {
                    const winCondition = winningConditions[i];
                    const a = board[winCondition[0]];
                    const b = board[winCondition[1]];
                    const c = board[winCondition[2]];
                    if (a === '' || b === '' || c === '') {
                        continue;
                    }
                    if (a === b && b === c) {
                        roundWon = true;
                        winningCombination = winCondition;
                        break;
                    }
                }

                if (roundWon) {
                    handleGameEnd(false, winningCombination);
                    return;
                }

                if (!board.includes('')) {
                    handleGameEnd(true);
                }
            };
            
            const handleGameEnd = (isDraw, winningCombination = []) => {
                isGameActive = false;
                statusText.textContent = ''; // Clear the turn status

                // --- THE ANIMATION TWIST ---
                
                // 1. Highlight winning cells if it's a win
                if (!isDraw) {
                    winningCombination.forEach(index => {
                        cells[index].classList.add('winning-cell');
                    });
                }
                
                // 2. After a brief pause, make all pieces fall
                setTimeout(() => {
                    boardElement.classList.add('game-over'); // Fades board lines
                    cells.forEach((cell, index) => {
                        // Remove winning glow to not interfere with fall
                        cell.classList.remove('winning-cell'); 
                        if(cell.textContent !== '') {
                            cell.classList.add('falling');
                            // Add a random delay for a more chaotic, natural fall
                            cell.style.animationDelay = `${Math.random() * 0.5}s`;
                        }
                    });
                }, isDraw ? 500 : 1500); // Shorter delay for a draw, longer for a win to see the glowing line

                // 3. Show the final message after the fall animation starts
                setTimeout(() => {
                    const winner = currentPlayer === 'X' ? 'O' : 'X';
                    endGameText.innerHTML = isDraw ? "It's a Draw!" : `Player <span class="${winner.toLowerCase()}">${winner}</span> Wins!`;
                    overlay.classList.add('show');
                }, isDraw ? 1500 : 2500);
            };

            const switchPlayer = () => {
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
                updateStatus();
            };

            const handleCellClick = (e) => {
                const clickedCell = e.target;
                const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

                if (board[clickedCellIndex] !== '' || !isGameActive) {
                    return;
                }

                board[clickedCellIndex] = currentPlayer;
                clickedCell.textContent = currentPlayer;
                clickedCell.classList.add(currentPlayer.toLowerCase());

                handleResultValidation();
                if(isGameActive) {
                   switchPlayer();
                }
            };

            const restartGame = () => {
                isGameActive = true;
                currentPlayer = 'X';
                board = ['', '', '', '', '', '', '', '', ''];
                
                overlay.classList.remove('show');
                boardElement.classList.remove('game-over');

                cells.forEach(cell => {
                    cell.textContent = '';
                    cell.classList.remove('x', 'o', 'falling', 'winning-cell');
                    cell.style.animationDelay = '0s';
                });

                updateStatus();
            };

            cells.forEach(cell => cell.addEventListener('click', handleCellClick));
            restartButton.addEventListener('click', restartGame);

            updateStatus(); // Initial status
        });
    </script>
</body>
</html>
```

### How the "Original Twist" Animation Works:

1.  **Winning Glow:** When a player wins, the three winning cells get a `winning-cell` class. This class triggers a CSS keyframe animation called `winning-glow` that makes the cells pulse with a white background, clearly highlighting the winning line.

2.  **Gravity Fall:**
    *   After a short delay (to allow the player to see the winning line), a JavaScript function is called.
    *   This function adds a `game-over` class to the main board, which is styled in CSS to remove its `box-shadow`, making the grid lines effectively disappear.
    *   It then iterates through all the cells. If a cell has an 'X' or an 'O' in it, it's given a `falling` class.
    *   The `falling` class applies a CSS keyframe animation called `fall`. This animation uses `transform: translateY()` to move the piece downwards off the screen and `rotate()` to make it tumble as it falls.
    *   **The best part:** A random `animation-delay` is applied to each falling piece using JavaScript. This makes them all start falling at slightly different times, creating a much more natural and chaotic "gravity" effect instead of them all falling in perfect sync.

3.  **Final Message:** After another delay (timed to coincide with the pieces falling), a full-screen overlay appears with the final result ("Player X Wins!", "It's a Draw!", etc.) and a "Play Again" button.

4.  **Restart:** Clicking "Play Again" resets everything, removes all the animation classes, and brings the board back to its initial state for a new game.

---
*Generated by OpenRouter CLI*