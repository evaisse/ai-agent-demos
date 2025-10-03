# OpenRouter API Response

## Metadata
- **Model**: anthropic/claude-3.5-haiku
- **Timestamp**: 2025-10-02T21:31:07.624Z
- **Duration**: 6.819 seconds

## Token Usage
- **Prompt Tokens**: 42
- **Completion Tokens**: 1567
- **Total Tokens**: 1609

## Prompt
```
In a single HTML file named index.html, create a simple tic tac toe game, when the game is finished, please make some original twist as finish animation ! 

```

## Response
Here's a complete HTML file with a Tic Tac Toe game and a unique finish animation:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Tic Tac Toe</title>
    <style>
        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
        }
        #board {
            display: grid;
            grid-template-columns: repeat(3, 100px);
            grid-gap: 5px;
            margin: 20px 0;
        }
        .cell {
            width: 100px;
            height: 100px;
            background-color: white;
            border: 2px solid #333;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 60px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .cell:hover {
            background-color: #e0e0e0;
        }
        #status {
            font-size: 24px;
            margin-bottom: 20px;
        }
        #confetti-canvas {
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div id="status">Tic Tac Toe</div>
    <div id="board"></div>
    <button onclick="resetGame()">Reset Game</button>
    <canvas id="confetti-canvas"></canvas>

    <script>
        const board = document.getElementById('board');
        const status = document.getElementById('status');
        const confettiCanvas = document.getElementById('confetti-canvas');
        let currentPlayer = 'X';
        let gameBoard = ['', '', '', '', '', '', '', '', ''];
        let gameActive = true;

        function createBoard() {
            board.innerHTML = '';
            for (let i = 0; i < 9; i++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.setAttribute('data-index', i);
                cell.addEventListener('click', cellClicked);
                board.appendChild(cell);
            }
        }

        function cellClicked(e) {
            const index = e.target.getAttribute('data-index');
            if (gameBoard[index] || !gameActive) return;

            gameBoard[index] = currentPlayer;
            e.target.textContent = currentPlayer;
            
            if (checkWinner()) {
                status.textContent = `${currentPlayer} Wins!`;
                gameActive = false;
                startConfetti();
            } else if (gameBoard.every(cell => cell)) {
                status.textContent = "It's a Draw!";
                gameActive = false;
            } else {
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
                status.textContent = `${currentPlayer}'s Turn`;
            }
        }

        function checkWinner() {
            const winConditions = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],  // Rows
                [0, 3, 6], [1, 4, 7], [2, 5, 8],  // Columns
                [0, 4, 8], [2, 4, 6]  // Diagonals
            ];

            return winConditions.some(condition => {
                const [a, b, c] = condition;
                return gameBoard[a] && 
                       gameBoard[a] === gameBoard[b] && 
                       gameBoard[a] === gameBoard[c];
            });
        }

        function resetGame() {
            gameBoard = ['', '', '', '', '', '', '', '', ''];
            gameActive = true;
            currentPlayer = 'X';
            status.textContent = `${currentPlayer}'s Turn`;
            createBoard();
            stopConfetti();
        }

        function startConfetti() {
            confettiCanvas.width = window.innerWidth;
            confettiCanvas.height = window.innerHeight;
            const ctx = confettiCanvas.getContext('2d');
            const confettiColors = ['#ff0a54', '#ff477e', '#ff7096', '#ff85a2', '#fbb1bd', '#f9bec7'];

            function createConfetti() {
                ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
                for (let i = 0; i < 200; i++) {
                    const x = Math.random() * confettiCanvas.width;
                    const y = Math.random() * confettiCanvas.height;
                    const size = Math.random() * 10 + 5;
                    const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
                    
                    ctx.beginPath();
                    ctx.fillStyle = color;
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
                requestAnimationFrame(createConfetti);
            }
            createConfetti();
        }

        function stopConfetti() {
            const ctx = confettiCanvas.getContext('2d');
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }

        createBoard();
    </script>
</body>
</html>
```

This Tic Tac Toe game includes several unique features:

1. A responsive and interactive game board
2. Turn-based gameplay for X and O
3. Win and draw detection
4. A reset game button
5. A colorful confetti animation when a player wins
6. Hover effects on cells
7. Dynamic status display

The finish animation is a fun, colorful confetti explosion that covers the entire screen when a player wins. The confetti uses random colors and sizes to create a celebratory effect.

You can simply save this as `index.html` and open it in a web browser to play the game. Enjoy!

---
*Generated by OpenRouter CLI*