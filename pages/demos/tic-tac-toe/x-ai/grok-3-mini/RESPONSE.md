# OpenRouter API Response

## Metadata
- **Model**: x-ai/grok-3-mini
- **Timestamp**: 2025-10-02T21:42:08.859Z
- **Duration**: 5.901 seconds

## Token Usage
- **Prompt Tokens**: 40
- **Completion Tokens**: 3324
- **Total Tokens**: 3364

## Prompt
```
In a single HTML file named index.html, create a simple tic tac toe game, when the game is finished, please make some original twist as finish animation ! 

```

## Response
Below is the complete code for a single HTML file named `index.html`. This file includes a simple Tic Tac Toe game implemented using HTML, CSS, and JavaScript. The game allows two players (X and O) to take turns clicking on a 3x3 grid. After the game ends (either a win or a draw), an original twist is added: a confetti animation where colorful particles rain down from the top of the screen to celebrate the end of the game. This animation is triggered dynamically using JavaScript and styled with CSS.

Here's a quick overview:
- **Game Logic**: Players click on empty cells to place their symbol (X or O). The game checks for a winner after each move or declares a draw if the board is full.
- **Original Twist**: When the game ends, confetti particles (small colored dots) fall from the top of the screen. This is a fun, original animation that adds a celebratory feel.
- **Reset**: A button appears at the end of the game to restart.

Save this code in a file named `index.html` and open it in a web browser to play.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tic Tac Toe</title>
    <style>
        /* Basic styling for the game */
        body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #f0f0f0;
        }

        h1 {
            margin-bottom: 20px;
        }

        #status {
            font-size: 1.2em;
            margin-bottom: 20px;
            font-weight: bold;
        }

        #board {
            display: grid;
            grid-template-columns: repeat(3, 100px);
            grid-gap: 5px;
            margin-bottom: 20px;
        }

        .cell {
            width: 100px;
            height: 100px;
            background-color: #fff;
            border: 1px solid #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2em;
            cursor: pointer;
            transition: background-color 0.3s;
        }

        .cell:hover {
            background-color: #e0e0e0;
        }

        .cell.x {
            color: #3498db; /* Blue for X */
        }

        .cell.o {
            color: #e74c3c; /* Red for O */
        }

        #reset-button {
            margin-top: 20px;
            padding: 10px 20px;
            font-size: 1em;
            background-color: #2ecc71;
            color: #fff;
            border: none;
            cursor: pointer;
            border-radius: 5px;
            display: none; /* Hidden until game ends */
        }

        #reset-button:hover {
            background-color: #27ae60;
        }

        /* Confetti animation styles */
        #confetti {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none; /* So it doesn't interfere with clicks */
            overflow: hidden;
            z-index: 1000;
        }

        .confetti-particle {
            position: absolute;
            width: 10px;
            height: 10px;
            background-color: hsl(0, 100%, 50%); /* Default red, will be randomized */
            border-radius: 50%;
            animation: fall 2s linear forwards;
        }

        @keyframes fall {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
            }
        }
    </style>
</head>
<body>
    <h1>Tic Tac Toe</h1>
    <div id="status">Player X's turn</div>
    <div id="board">
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
    <button id="reset-button">Play Again</button>
    <div id="confetti"></div>

    <script>
        const statusDisplay = document.getElementById('status');
        const board = document.getElementById('board');
        const cells = document.querySelectorAll('.cell');
        const resetButton = document.getElementById('reset-button');
        const confettiContainer = document.getElementById('confetti');
        let gameBoard = Array(9).fill(null); // Tracks the board state
        let currentPlayer = 'X'; // Start with X
        let gameActive = true; // Flag to check if game is ongoing

        // Function to handle cell clicks
        function handleCellClick(event) {
            const cell = event.target;
            const index = cell.getAttribute('data-index');

            if (gameBoard[index] || !gameActive) {
                return; // Cell already taken or game over
            }

            gameBoard[index] = currentPlayer;
            cell.textContent = currentPlayer;
            cell.classList.add(currentPlayer.toLowerCase()); // Add class for styling

            if (checkWinner()) {
                statusDisplay.textContent = `Player ${currentPlayer} wins!`;
                gameActive = false;
                triggerConfetti(); // Original twist: Trigger animation
                resetButton.style.display = 'block'; // Show reset button
            } else if (gameBoard.every(cell => cell)) {
                statusDisplay.textContent = "It's a draw!";
                gameActive = false;
                triggerConfetti(); // Trigger animation for draw too
                resetButton.style.display = 'block'; // Show reset button
            } else {
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X'; // Switch player
                statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
            }
        }

        // Function to check for a winner
        function checkWinner() {
            const winConditions = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
                [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
                [0, 4, 8], [2, 4, 6] // Diagonals
            ];

            for (let condition of winConditions) {
                const [a, b, c] = condition;
                if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
                    return true; // Winner found
                }
            }
            return false; // No winner
        }

        // Function to trigger the original confetti animation
        function triggerConfetti() {
            for (let i = 0; i < 100; i++) { // Create 100 particles for a festive effect
                const particle = document.createElement('div');
                particle.className = 'confetti-particle';
                particle.style.left = `${Math.random() * 100}vw`; // Random horizontal position
                particle.style.top = `${Math.random() * 20}px`; // Start near the top
                particle.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`; // Random color
                particle.style.animationDelay = `${Math.random() * 0.5}s`; // Stagger the start
                confettiContainer.appendChild(particle);

                // Remove particle after animation to clean up
                setTimeout(() => {
                    particle.remove();
                }, 2000); // Matches the animation duration
            }
        }

        // Add event listeners to cells
        cells.forEach(cell => cell.addEventListener('click', handleCellClick));

        // Reset game function
        resetButton.addEventListener('click', () => {
            gameBoard = Array(9).fill(null);
            gameActive = true;
            currentPlayer = 'X';
            statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
            cells.forEach(cell => {
                cell.textContent = '';
                cell.classList.remove('x', 'o');
            });
            resetButton.style.display = 'none'; // Hide reset button
            confettiContainer.innerHTML = ''; // Clear any remaining confetti
        });
    </script>
</body>
</html>
```

### How to Play:
1. Open the `index.html` file in a web browser.
2. Players take turns clicking on empty cells to place X or O.
3. The game announces the winner or a draw and triggers the confetti animation.
4. Click the "Play Again" button to reset the game.

### Original Twist Details:
- The confetti animation is a creative way to end the game, using randomly colored and positioned particles that fall down the screen.
- It's implemented with CSS animations for smoothness and JavaScript for dynamic creation, making it feel lively and fun.
- This adds a celebratory element without overcomplicating the game, keeping the file size and complexity low.

This code is self-contained in a single file, as requested. If you have any modifications or additions, let me know!

---
*Generated by OpenRouter CLI*