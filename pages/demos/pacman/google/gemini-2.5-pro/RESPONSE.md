# OpenRouter API Response

## Metadata
- **Model**: google/gemini-2.5-pro
- **Timestamp**: 2025-10-02T13:09:11.551Z
- **Duration**: 81.446 seconds

## Token Usage
- **Prompt Tokens**: 28
- **Completion Tokens**: 7923
- **Total Tokens**: 7951

## Prompt
```
In a single HTML file named index.html, create exact copy of the PAC-MAN game in one html file using css and js.

```

## Response
Of course. Creating a complete, pixel-perfect, and behaviorally-exact replica of the original PAC-MAN is a massive undertaking, especially concerning the complex and distinct AI for each ghost.

However, I can create a very faithful and fully playable version that captures the look, feel, and core mechanics of the game, all within a single HTML file as requested. This version will include:

*   A recognizable maze layout.
*   Pac-Man movement and chomping animation.
*   Dots and Power Pellets.
*   Four ghosts with a simplified but effective chase AI.
*   A "frightened" mode for ghosts after eating a Power Pellet.
*   Score, lives, and game over/win conditions.

Here is the complete code for `index.html`. Simply copy and paste this entire block of code into a file named `index.html` and open it in your web browser to play.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PAC-MAN</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        body {
            background-color: #000;
            color: #fff;
            font-family: 'Press Start 2P', cursive;
            text-align: center;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
        }

        h1 {
            color: #FFFF00;
            text-shadow: 2px 2px 0 #FF0000;
        }

        #game-container {
            position: relative;
            border: 2px solid #1E90FF;
            box-shadow: 0 0 20px #1E90FF;
        }
        
        canvas {
            background-color: #000;
            display: block;
        }

        #game-info {
            display: flex;
            justify-content: space-between;
            width: 560px; /* Same as canvas width */
            padding: 10px 0;
            font-size: 16px;
        }

        #score-label, #lives-label {
            color: #fff;
        }
        
        #score-value {
            color: #FFFF00;
        }

        #lives-container {
            display: flex;
            align-items: center;
        }

        .life-pacman {
            width: 20px;
            height: 20px;
            background: #FFFF00;
            border-radius: 50%;
            margin-left: 10px;
            clip-path: polygon(0% 0%, 100% 0%, 100% 40%, 50% 50%, 100% 60%, 100% 100%, 0% 100%, 0% 60%, 50% 50%, 0% 40%);
        }
        
        #message-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            color: #FFFF00;
            font-size: 24px;
            display: none; /* Initially hidden */
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }

        #message-overlay p {
            margin: 10px;
        }

        #message-overlay .subtext {
            font-size: 16px;
            color: #fff;
        }

    </style>
</head>
<body>
    <h1>PAC-MAN</h1>
    <div id="game-info">
        <div>
            <span id="score-label">SCORE: </span>
            <span id="score-value">0</span>
        </div>
        <div id="lives-container">
            <span id="lives-label">LIVES:</span>
            <!-- Lives will be dynamically added here -->
        </div>
    </div>
    <div id="game-container">
        <canvas id="gameCanvas"></canvas>
        <div id="message-overlay">
            <p id="main-message">GAME OVER</p>
            <p id="sub-message" class="subtext">Press Enter to Restart</p>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');
            const scoreEl = document.getElementById('score-value');
            const livesContainer = document.getElementById('lives-container');
            const messageOverlay = document.getElementById('message-overlay');
            const mainMessageEl = document.getElementById('main-message');
            const subMessageEl = document.getElementById('sub-message');

            const TILE_SIZE = 20;
            const ROWS = 31;
            const COLS = 28;

            canvas.width = COLS * TILE_SIZE;
            canvas.height = ROWS * TILE_SIZE;

            // Map legend: 0 = Wall, 1 = Dot, 2 = Empty, 3 = Power Pellet, 4 = Ghost Lair
            const map = [
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
                [0,1,0,0,1,1,0,0,0,1,1,0,1,0,0,1,0,1,1,0,0,0,1,1,0,0,1,0],
                [0,3,0,0,1,1,0,0,0,1,1,0,1,0,0,1,0,1,1,0,0,0,1,1,0,0,3,0],
                [0,1,0,0,1,1,0,0,0,1,1,0,1,0,0,1,0,1,1,0,0,0,1,1,0,0,1,0],
                [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
                [0,1,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,1,0],
                [0,1,0,0,1,1,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,1,1,0,0,1,0],
                [0,1,1,1,1,1,0,1,1,0,0,0,1,0,0,1,0,0,0,1,1,0,1,1,1,1,1,0],
                [0,0,0,0,1,1,0,1,1,0,2,2,2,2,2,2,2,0,1,1,0,1,1,0,0,0,0,0],
                [0,0,0,0,1,1,0,1,1,0,2,0,0,4,4,0,0,2,0,1,1,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,1,1,0,2,0,4,4,4,4,0,2,0,1,1,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,1,1,1,0,2,0,4,4,4,4,0,2,0,1,1,1,1,1,0,0,0,0],
                [2,2,2,2,1,1,0,1,1,2,2,0,4,4,4,4,0,2,2,1,1,0,1,1,2,2,2,2],
                [0,0,0,0,1,1,0,1,1,0,2,0,4,4,4,4,0,2,0,1,1,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,1,1,0,2,0,0,0,0,0,0,2,0,1,1,0,1,1,0,0,0,0],
                [0,0,0,0,1,1,0,1,1,0,2,2,2,2,2,2,2,2,0,1,1,0,1,1,0,0,0,0],
                [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
                [0,1,0,0,1,1,0,0,0,1,1,0,1,0,0,1,0,1,1,0,0,0,1,1,0,0,1,0],
                [0,3,1,1,1,1,1,1,1,1,1,0,1,0,0,1,0,1,1,1,1,1,1,1,1,1,3,0],
                [0,0,0,1,1,0,1,1,0,1,1,0,1,0,0,1,0,1,1,0,1,1,0,1,1,0,0,0],
                [0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0],
                [0,1,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,1,0],
                [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
                [0,1,0,0,1,1,0,0,0,1,1,0,1,0,0,1,0,1,1,0,0,0,1,1,0,0,1,0],
                [0,1,1,0,1,1,1,1,1,1,1,0,1,0,0,1,0,1,1,1,1,1,1,1,0,1,1,0],
                [0,0,1,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,1,0,0,0],
                [0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0],
                [0,1,0,0,0,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,0,0,0,1,0],
                [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            ];

            let score = 0;
            let lives = 3;
            let dotCount = 0;
            let gameState = 'start'; // 'start', 'playing', 'paused', 'dying', 'gameover', 'won'
            let gameLoopId;

            const pacman = {
                x: 14 * TILE_SIZE,
                y: 23 * TILE_SIZE,
                dx: 0,
                dy: 0,
                speed: 2,
                nextDirection: null,
                mouthOpen: 0.2,
                mouthOpening: true
            };

            const ghosts = [
                { id: 'blinky', x: 14 * TILE_SIZE, y: 11 * TILE_SIZE, color: '#FF0000', dx: 0, dy: 0, state: 'chase', home: {x: 14 * TILE_SIZE, y: 11 * TILE_SIZE} },
                { id: 'pinky', x: 14 * TILE_SIZE, y: 14 * TILE_SIZE, color: '#FFB8FF', dx: 0, dy: 0, state: 'chase', home: {x: 14 * TILE_SIZE, y: 14 * TILE_SIZE} },
                { id: 'inky', x: 12 * TILE_SIZE, y: 14 * TILE_SIZE, color: '#00FFFF', dx: 0, dy: 0, state: 'chase', home: {x: 12 * TILE_SIZE, y: 14 * TILE_SIZE} },
                { id: 'clyde', x: 16 * TILE_SIZE, y: 14 * TILE_SIZE, color: '#FFB852', dx: 0, dy: 0, state: 'chase', home: {x: 16 * TILE_SIZE, y: 14 * TILE_SIZE} }
            ];
            
            let powerPelletTimer = 0;
            const POWER_PELLET_DURATION = 8000; // 8 seconds

            function isWall(x, y) {
                const gridX = Math.floor(x / TILE_SIZE);
                const gridY = Math.floor(y / TILE_SIZE);
                if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return true;
                return map[gridY][gridX] === 0;
            }

            function isAtGridCenter(entity) {
                return (entity.x % TILE_SIZE === 0) && (entity.y % TILE_SIZE === 0);
            }

            function drawWall(x, y) {
                ctx.fillStyle = '#1E90FF'; // Blue walls
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }

            function drawDot(x, y) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(x * TILE_SIZE + TILE_SIZE / 2 - 1, y * TILE_SIZE + TILE_SIZE / 2 - 1, 2, 2);
            }

            function drawPowerPellet(x, y) {
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
                ctx.fill();
            }

            function drawMap() {
                dotCount = 0;
                for (let y = 0; y < ROWS; y++) {
                    for (let x = 0; x < COLS; x++) {
                        if (map[y][x] === 0) {
                            drawWall(x, y);
                        } else if (map[y][x] === 1) {
                            drawDot(x, y);
                            dotCount++;
                        } else if (map[y][x] === 3) {
                            drawPowerPellet(x, y);
                            dotCount++;
                        }
                    }
                }
            }
            
            function drawPacman() {
                // Animate mouth
                if (pacman.mouthOpening) {
                    pacman.mouthOpen += 0.05;
                    if (pacman.mouthOpen >= 0.4) pacman.mouthOpening = false;
                } else {
                    pacman.mouthOpen -= 0.05;
                    if (pacman.mouthOpen <= 0) pacman.mouthOpening = true;
                }

                let startAngle = pacman.mouthOpen * Math.PI;
                let endAngle = (2 - pacman.mouthOpen) * Math.PI;
                let rotation = 0;

                if (pacman.dx > 0) rotation = 0; // Right
                else if (pacman.dx < 0) rotation = Math.PI; // Left
                else if (pacman.dy > 0) rotation = 0.5 * Math.PI; // Down
                else if (pacman.dy < 0) rotation = 1.5 * Math.PI; // Up

                ctx.save();
                ctx.translate(pacman.x + TILE_SIZE / 2, pacman.y + TILE_SIZE / 2);
                ctx.rotate(rotation);

                ctx.fillStyle = '#FFFF00';
                ctx.beginPath();
                ctx.arc(0, 0, TILE_SIZE / 2 - 1, startAngle, endAngle);
                ctx.lineTo(0, 0);
                ctx.fill();
                ctx.restore();
            }

            function drawGhost(ghost) {
                const isFrightened = ghost.state === 'frightened';
                const isEaten = ghost.state === 'eaten';
                const bodyColor = isFrightened ? '#0000FF' : ghost.color;
                
                if (isEaten) {
                    // Draw eyes only, returning to base
                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(ghost.x + TILE_SIZE / 2 - 3, ghost.y + TILE_SIZE / 2, 2, 0, Math.PI * 2);
                    ctx.arc(ghost.x + TILE_SIZE / 2 + 3, ghost.y + TILE_SIZE / 2, 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Draw body
                    ctx.fillStyle = bodyColor;
                    ctx.beginPath();
                    ctx.arc(ghost.x + TILE_SIZE / 2, ghost.y + TILE_SIZE / 2, TILE_SIZE / 2, Math.PI, 0);
                    ctx.lineTo(ghost.x + TILE_SIZE, ghost.y + TILE_SIZE);
                    ctx.lineTo(ghost.x, ghost.y + TILE_SIZE);
                    ctx.fill();

                    // Draw eyes
                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(ghost.x + TILE_SIZE / 2 - 4, ghost.y + TILE_SIZE / 2 - 2, 3, 0, Math.PI * 2);
                    ctx.arc(ghost.x + TILE_SIZE / 2 + 4, ghost.y + TILE_SIZE / 2 - 2, 3, 0, Math.PI * 2);
                    ctx.fill();

                    // Draw pupils
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(ghost.x + TILE_SIZE / 2 - 4, ghost.y + TILE_SIZE / 2 - 2, 1, 0, Math.PI * 2);
                    ctx.arc(ghost.x + TILE_SIZE / 2 + 4, ghost.y + TILE_SIZE / 2 - 2, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            function updatePacman() {
                // Tunnel logic
                if (pacman.x < -TILE_SIZE) pacman.x = canvas.width - TILE_SIZE;
                else if (pacman.x > canvas.width) pacman.x = 0;

                const currentGridX = Math.floor(pacman.x / TILE_SIZE);
                const currentGridY = Math.floor(pacman.y / TILE_SIZE);

                // Handle direction change at grid intersection
                if (isAtGridCenter(pacman)) {
                    let newDx = 0, newDy = 0;
                    if (pacman.nextDirection === 'up') newDy = -pacman.speed;
                    else if (pacman.nextDirection === 'down') newDy = pacman.speed;
                    else if (pacman.nextDirection === 'left') newDx = -pacman.speed;
                    else if (pacman.nextDirection === 'right') newDx = pacman

---
*Generated by OpenRouter CLI*