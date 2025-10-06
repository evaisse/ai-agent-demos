# OpenRouter API Response

## Metadata
- **Model**: google/gemini-2.5-pro
- **Timestamp**: 2025-10-06T11:43:22.323Z
- **Duration**: 16.629 seconds

## Token Usage
- **Prompt Tokens**: 5404
- **Completion Tokens**: 15548
- **Total Tokens**: 20952

## Prompt
```
In a single HTML file named index.html, create exact copy of the PAC-MAN game in one html file using css and js.

```

## Response
Of course. Here is a complete, self-contained `index.html` file that creates a functional and visually recognizable clone of the classic PAC-MAN game. All the HTML, CSS, and JavaScript are embedded within this single file.

To use it, simply copy all the code below, paste it into a new text file, and save it as `index.html`. Then, open that file in any modern web browser.

### Features Included:
*   **Complete Maze:** A faithful representation of the classic Pac-Man maze layout.
*   **Pac-Man:** Fully animated (mouth chomping) and controllable with arrow keys.
*   **Ghosts:** Four ghosts (Blinky, Pinky, Inky, Clyde) with distinct (though simplified) AI behaviors.
    *   **Blinky (Red):** Directly chases Pac-Man.
    *   **Pinky (Pink):** Tries to ambush Pac-Man by targeting a few steps ahead of him.
    *   **Inky (Cyan):** Has a more complex targeting, using both Pac-Man and Blinky's positions.
    *   **Clyde (Orange):** Chases Pac-Man when far away but gets scared and retreats to his corner when too close.
*   **Pellets & Power Pellets:** Collect all pellets to win the level. Power pellets make ghosts vulnerable.
*   **Ghost States:** Ghosts can be in `chase`, `scatter`, or `frightened` modes.
*   **Scoring & Lives:** A functional scoring and life system.
*   **Game States:** Includes a "Ready!" screen, gameplay, life loss sequence, and "Game Over" screen.

---

### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PAC-MAN</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #000;
            color: #fff;
            font-family: 'Press Start 2P', monospace, sans-serif; /* A common retro game font */
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            flex-direction: column;
            text-align: center;
        }

        @font-face {
            font-family: 'Press Start 2P';
            src: url('https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nVivM.woff2') format('woff2');
            font-weight: normal;
            font-style: normal;
        }

        h1 {
            color: #FFFF00;
            text-shadow: 2px 2px #FF0000;
        }

        #game-container {
            position: relative;
            border: 2px solid #1E90FF;
            box-shadow: 0 0 20px #1E90FF;
        }

        #game-canvas {
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

        #score, #lives {
            color: #fff;
        }
        
        #start-screen, #game-over-screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #FFFF00;
            font-size: 24px;
            text-align: center;
            z-index: 10;
        }
        
        #game-over-screen p {
            margin: 10px 0;
        }

        #game-over-screen button {
            padding: 10px 20px;
            font-family: 'Press Start 2P', monospace, sans-serif;
            background-color: #FFFF00;
            color: #000;
            border: none;
            cursor: pointer;
            margin-top: 20px;
        }

        #game-over-screen button:hover {
            background-color: #fff;
        }

    </style>
</head>
<body>
    <h1>PAC-MAN</h1>
    <div id="game-info">
        <div id="score">SCORE: 0</div>
        <div id="lives">LIVES: ❤️❤️❤️</div>
    </div>
    <div id="game-container">
        <canvas id="game-canvas" width="560" height="620"></canvas>
        <div id="start-screen">
            <p>READY!</p>
        </div>
        <div id="game-over-screen" style="display: none;">
            <p>GAME OVER</p>
            <p id="final-score"></p>
            <button onclick="window.location.reload()">RESTART</button>
        </div>
    </div>

    <script>
    document.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        const scoreEl = document.getElementById('score');
        const livesEl = document.getElementById('lives');
        const startScreen = document.getElementById('start-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        const finalScoreEl = document.getElementById('final-score');

        const TILE_SIZE = 20;
        const PACMAN_SPEED = 2;
        const GHOST_SPEED = 1.8;
        const FRIGHTENED_GHOST_SPEED = 1;
        
        let score = 0;
        let lives = 3;
        let pelletsCount = 0;
        let gameStarted = false;
        let gameOver = false;
        let frightenedMode = false;
        let frightenedTimer = 0;

        // Maze layout: 0 = wall, 1 = pellet, 2 = empty, 3 = power pellet, 4 = ghost home
        const map = [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,1,0,0,1,1,0,0,1,1,0,0,1,0,0,1,0,0,1,1,0,0,1,1,0,0,1,0],
            [0,3,0,0,1,1,0,0,1,1,0,0,1,0,0,1,0,0,1,1,0,0,1,1,0,0,3,0],
            [0,1,0,0,1,1,0,0,1,1,0,0,1,0,0,1,0,0,1,1,0,0,1,1,0,0,1,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,1,0,0,1,1,0,1,1,0,1,1,1,0,0,1,1,1,0,1,1,0,1,1,0,0,1,0],
            [0,1,1,1,1,1,0,1,1,0,1,1,1,0,0,1,1,1,0,1,1,0,1,1,1,1,1,0],
            [0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0],
            [0,0,0,0,1,1,0,1,1,0,0,0,1,0,0,1,0,0,0,1,1,0,1,1,0,0,0,0],
            [0,0,0,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,0,0,0],
            [0,0,0,0,1,1,0,1,1,0,1,0,0,4,4,0,0,1,0,1,1,0,1,1,0,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,1,0,4,4,4,4,0,1,1,1,1,1,1,1,0,0,0,0],
            [2,2,2,2,1,1,1,1,1,1,1,0,4,4,4,4,0,1,1,1,1,1,1,1,2,2,2,2], // Tunnel
            [0,0,0,0,1,1,1,1,1,1,1,0,4,4,4,4,0,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,0,1,1,0,1,1,0,1,0,0,0,0,0,0,1,0,1,1,0,1,1,0,0,0,0],
            [0,0,0,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,0,0,0],
            [0,0,0,0,1,1,0,1,1,0,0,0,1,0,0,1,0,0,0,1,1,0,1,1,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,1,0,0,1,1,0,0,1,1,0,0,1,0,0,1,0,0,1,1,0,0,1,1,0,0,1,0],
            [0,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,0],
            [0,1,0,0,1,1,0,1,1,0,1,1,1,0,0,1,1,1,0,1,1,0,1,1,0,0,1,0],
            [0,1,1,1,1,1,0,1,1,0,1,1,1,0,0,1,1,1,0,1,1,0,1,1,1,1,1,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,1,0,0,1,1,0,0,1,1,0,0,1,0,0,1,0,0,1,1,0,0,1,1,0,0,1,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ];

        class Pacman {
            constructor(x, y, speed) {
                this.x = x;
                this.y = y;
                this.speed = speed;
                this.radius = TILE_SIZE / 2;
                this.mouth = 0;
                this.direction = { x: 0, y: 0 };
                this.nextDirection = { x: 0, y: 0 };
            }

            draw() {
                const angle = 0.2 * Math.PI * Math.abs(Math.sin(this.mouth));
                ctx.save();
                ctx.translate(this.x, this.y);

                let rotation = 0;
                if (this.direction.x === 1) rotation = 0;
                else if (this.direction.x === -1) rotation = Math.PI;
                else if (this.direction.y === 1) rotation = 0.5 * Math.PI;
                else if (this.direction.y === -1) rotation = 1.5 * Math.PI;
                
                ctx.rotate(rotation);

                ctx.fillStyle = 'yellow';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, angle, 2 * Math.PI - angle);
                ctx.lineTo(0, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            update() {
                this.mouth += 0.1;
                this.handleInput();
                this.move();
                this.eatPellet();
            }

            handleInput() {
                if (this.isAtGridCenter()) {
                    const nextGridX = Math.floor((this.x + this.nextDirection.x * TILE_SIZE) / TILE_SIZE);
                    const nextGridY = Math.floor((this.y + this.nextDirection.y * TILE_SIZE) / TILE_SIZE);
                    if (map[nextGridY] && map[nextGridY][nextGridX] !== 0) {
                        this.direction = { ...this.nextDirection };
                    }
                }
            }
            
            isAtGridCenter() {
                return (this.x % TILE_SIZE === TILE_SIZE / 2) && (this.y % TILE_SIZE === TILE_SIZE / 2);
            }

            move() {
                // Check for wall collision
                const currentGridX = Math.floor(this.x / TILE_SIZE);
                const currentGridY = Math.floor(this.y / TILE_SIZE);
                const nextX = this.x + this.direction.x * this.speed;
                const nextY = this.y + this.direction.y * this.speed;
                
                if (this.isAtGridCenter()) {
                    const nextGridX = currentGridX + this.direction.x;
                    const nextGridY = currentGridY + this.direction.y;
                    if (map[nextGridY] && map[nextGridY][nextGridX] === 0) {
                        this.direction.x = 0;
                        this.direction.y = 0;
                    }
                }
                
                this.x += this.direction.x * this.speed;
                this.y += this.direction.y * this.speed;

                // Tunnel logic
                if (this.x < 0) this.x = canvas.width;
                if (this.x > canvas.width) this.x = 0;
            }
            
            eatPellet() {
                const gridX = Math.floor(this.x / TILE_SIZE);
                const gridY = Math.floor(this.y / TILE_SIZE);

                if (map[gridY] && map[gridY][gridX] === 1) {
                    map[gridY][gridX] = 2; // Mark as eaten
                    score += 10;
                    pelletsCount--;
                    updateScore();
                } else if (map[gridY] && map[gridY][gridX] === 3) {
                    map[gridY][gridX] = 2; // Mark as eaten
                    score += 50;
                    pelletsCount--;
                    activateFrightenedMode();
                    updateScore();
                }
            }
        }
        
        class Ghost {
            constructor(x, y, color, speed, scatterTarget) {
                this.x = x;
                this.y = y;
                this.color = color;
                this.speed = speed;
                this.radius = TILE_SIZE / 2;
                this.direction = { x: 0, y: -1 };
                this.state = 'scatter'; // scatter, chase, frightened
                this.scatterTarget = scatterTarget;
                this.target = { x: 0, y: 0 };
                this.frightenedTimer = 0;
                this.isEaten = false;
                this.home = {x: 13.5 * TILE_SIZE, y: 13.5 * TILE_SIZE};
            }

            draw() {
                ctx.fillStyle = this.state === 'frightened' ? '#0000FF' : this.color;
                if (this.isEaten) ctx.fillStyle = '#888';
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, Math.PI, 0);
                ctx.lineTo(this.x + this.radius, this.y + this.radius);
                ctx.lineTo(this.x - this.radius, this.y + this.radius);
                ctx.closePath();
                ctx.fill();

                // Eyes
                ctx.fillStyle = 'white';
                const eyeOffsetX = this.radius * 0.3;
                const eyeOffsetY = -this.radius * 0.2;
                ctx.beginPath();
                ctx.arc(this.x - eyeOffsetX, this.y + eyeOffsetY, this.radius * 0.2, 0, 2*Math.PI);
                ctx.arc(this.x + eyeOffsetX, this.y + eyeOffsetY, this.radius * 0.2, 0, 2*Math.PI);
                ctx.fill();
                
                // Pupils
                ctx.fillStyle = 'black';
                const pupilOffsetX = this.direction.x * this.radius * 0.1;
                const pupilOffsetY = this.direction.y * this.radius * 0.1;
                ctx.beginPath();
                ctx.arc(this.x - eyeOffsetX + pupilOffsetX, this.y + eyeOffsetY + pupilOffsetY, this.radius * 0.1, 0, 2*Math.PI);
                ctx.arc(this.x + eyeOffsetX + pupilOffsetX, this.y + eyeOffsetY + pupilOffsetY, this.radius * 0.1, 0, 2*Math.PI);
                ctx.fill();

                if (this.state === 'frightened') {
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(this.x - 5, this.y + 5);
                    ctx.lineTo(this.x + 5, this.y + 5);
                    ctx.stroke();
                }
            }

            update() {
                if (this.isEaten) {
                    this.target = this.home;
                    const dx = this.target.x - this.x;
                    const dy = this.target.y - this.y;
                    if (Math.abs(dx) < this.speed && Math.abs(dy) < this.speed) {
                        this.isEaten = false;
                        this.state = 'chase'; // Or scatter
                    }
                } else {
                    this.setTarget();
                }
                
                this.move();
            }
            
            setTarget() {
                if (this.state === 'scatter') {
                    this.target = this.scatterTarget;
                } else if (this.state === 'chase') {
                    this.chase();
                } else if (this.state === 'frightened') {
                    // Move randomly
                    if (this.isAtGridCenter()) {
                        const possibleMoves = this.getPossibleMoves();
                        if (possibleMoves.length > 0) {
                            this.direction = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                        }
                    }
                    return; // Skip normal targeting
                }
            }

            move() {
                if (this.isAtGridCenter()) {
                    const bestMove = this.getBestMove();
                    if(bestMove) this.direction = bestMove;
                }
                
                this.x += this.direction.x * (this.state === 'frightened' ? FRIGHTENED_GHOST_SPEED : this.speed);
                this.y += this.direction.y * (this.state === 'frightened' ? FRIGHTENED_GHOST_SPEED : this.speed);
                
                // Tunnel
                if (this.x < 0) this.x = canvas.width;
                if (this.x > canvas.width) this
.x = 0;
            }

            getBestMove() {
                const possibleMoves = this.getPossibleMoves();
                if (possibleMoves.length === 0) return null;

                let bestMove = null;
                let minDistance = Infinity;

                for (const move of possibleMoves) {
                    const newX = this.x + move.x * TILE_SIZE;
                    const newY = this.y + move.y * TILE_SIZE;
                    const distance = Math.hypot(newX - this.target.x, newY - this.target.y);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        bestMove = move;
                    }
                }
                return bestMove;
            }

            getPossibleMoves() {
                const moves = [{x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1}];
                const possibleMoves = [];
                const currentGridX = Math.floor(this.x / TILE_SIZE);
                const currentGridY = Math.floor(this.y / TILE_SIZE);

                for (const move of moves) {
                    // Prevent ghost from reversing direction unless in a dead end
                    if (move.x === -this.direction.x && move.y === -this.direction.y) {
                        continue;
                    }
                    
                    const nextGridX = currentGridX + move.x;
                    const nextGridY = currentGridY + move.y;
                    
                    // Check if next tile is a wall (0) or the ghost house gate (4)
                    if (map[nextGridY] && map[nextGridY][nextGridX] !== 0) {
                         // A special rule for ghosts: they can't go up into certain zones
                         if (move.y === -1 && (nextGridY === 10 || nextGridY === 22) && (nextGridX === 12 || nextGridX === 15)) {
                             continue;
                         }
                         possibleMoves.push(move);
                    }
                }
                
                // If no other moves are possible, allow reversal (must be a dead end)
                if (possibleMoves.length === 0) {
                    possibleMoves.push({x: -this.direction.x, y: -this.direction.y});
                }
                
                return possibleMoves;
            }

            isAtGridCenter() {
                return (this.x % TILE_SIZE === TILE_SIZE / 2) && (this.y % TILE_SIZE === TILE_SIZE / 2);
            }

            // This will be overridden by subclasses for specific chase behaviors
            chase() {
                this.target = { x: pacman.x, y: pacman.y };
            }
        }

        class Blinky extends Ghost { // Red
            constructor(x, y, speed) {
                super(x, y, '#FF0000', speed, { x: 25 * TILE_SIZE, y: 0 * TILE_SIZE });
            }
            // Blinky's chase is the default: target Pac-Man's exact location. No override needed.
        }

        class Pinky extends Ghost { // Pink
            constructor(x, y, speed) {
                super(x, y, '#FFB8FF', speed, { x: 2 * TILE_SIZE, y: 0 * TILE_SIZE });
            }

            chase() {
                // Target 4 tiles ahead of Pac-Man's current direction
                this.target = {
                    x: pacman.x + pacman.direction.x * 4 * TILE_SIZE,
                    y: pacman.y + pacman.direction.y * 4 * TILE_SIZE
                };
            }
        }
        
        class Inky extends Ghost { // Cyan
            constructor(x, y, speed) {
                super(x, y, '#00FFFF', speed, { x: 27 * TILE_SIZE, y: 30 * TILE_SIZE });
            }

            chase() {
                // Target is based on a vector from Blinky to 2 tiles ahead of Pac-Man, doubled
                const pacmanAhead = {
                    x: pacman.x + pacman.direction.x * 2 * TILE_SIZE,
                    y: pacman.y + pacman.direction.y * 2 * TILE_SIZE
                };
                const blinkyPos = { x: blinky.x, y: blinky.y };
                
                this.target = {
                    x: pacmanAhead.x + (pacmanAhead.x - blinkyPos.x),
                    y: pacmanAhead.y + (pacmanAhead.y - blinkyPos.y)
                };
            }
        }

        class Clyde extends Ghost { // Orange
            constructor(x, y, speed) {
                super(x, y, '#FFB851', speed, { x: 0 * TILE_SIZE, y: 30 * TILE_SIZE });
            }

            chase() {
                const distance = Math.hypot(this.x - pacman.x, this.y - pacman.y);
                if (distance > 8 * TILE_SIZE) {
                    // If far away, chase Pac-Man (like Blinky)
                    this.target = { x: pacman.x, y: pacman.y };
                } else {
                    // If too close, retreat to his scatter corner
                    this.target = this.scatterTarget;
                }
            }
        }

        let pacman;
        let ghosts;
        let blinky, pinky, inky, clyde;

        function init() {
            // Recalculate total pellets every time for restarts
            pelletsCount = 0;
            map.forEach(row => {
                row.forEach(tile => {
                    if (tile === 1 || tile === 3) pelletsCount++;
                });
            });

            resetCharacters();
            
            updateScore();
            updateLives();
            
            startScreen.style.display = 'flex';
            gameOverScreen.style.display = 'none';

            // Initial draw
            draw();

            // Start game after "Ready!" message
            setTimeout(() => {
                startScreen.style.display = 'none';
                gameStarted = true;
                gameLoop();
            }, 2000);
        }

        function resetCharacters() {
            pacman = new Pacman(14 * TILE_SIZE - TILE_SIZE / 2, 23 * TILE_SIZE + TILE_SIZE / 2, PACMAN_SPEED);
            
            blinky = new Blinky(14 * TILE_SIZE - TILE_SIZE / 2, 11 * TILE_SIZE + TILE_SIZE / 2, GHOST_SPEED);
            pinky = new Pinky(14 * TILE_SIZE - TILE_SIZE / 2, 14 * TILE_SIZE + TILE_SIZE / 2, GHOST_SPEED);
            inky = new Inky(12 * TILE_SIZE - TILE_SIZE / 2, 14 * TILE_SIZE + TILE_SIZE / 2, GHOST_SPEED);
            clyde = new Clyde(16 * TILE_SIZE - TILE_SIZE / 2, 14 * TILE_SIZE + TILE_SIZE / 2, GHOST_SPEED);

            ghosts = [blinky, pinky, inky, clyde];
        }

        function drawMap() {
            for (let y = 0; y < map.length; y++) {
                for (let x = 0; x < map[y].length; x++) {
                    const tile = map[y][x];
                    if (tile === 0) { // Wall
                        ctx.fillStyle = '#1E90FF';
                        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    } else if (tile === 1) { // Pellet
                        ctx.fillStyle = 'white';
                        ctx.beginPath();
                        ctx.arc(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 2, 0, 2 * Math.PI);
                        ctx.fill();
                    } else if (tile === 3) { // Power Pellet
                        ctx.fillStyle = 'white';
                        ctx.beginPath();
                        ctx.arc(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 6, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                }
            }
        }
        
        function updateScore() {
            scoreEl.textContent = `SCORE: ${score}`;
        }

        function updateLives() {
            livesEl.innerHTML = 'LIVES: ' + '❤️'.repeat(lives);
        }

        function activateFrightenedMode() {
            frightenedMode = true;
            frightenedTimer = 400; // ~6.6 seconds at 60fps
            ghosts.forEach(ghost => {
                if (!ghost.isEaten) {
                    ghost.state = 'frightened';
                    ghost.direction = {x: -ghost.direction.x, y: -ghost.direction.y}; // Reverse direction
                }
            });
        }
        
        function checkCollisions() {
            ghosts.forEach(ghost => {
                const distance = Math.hypot(pacman.x - ghost.x, pacman.y - ghost.y);
                if (distance < pacman.radius + ghost.radius - 4) { // -4 for more forgiving collision
                    if (ghost.state === 'frightened') {
                        if (!ghost.isEaten) {
                            score += 200;
                            updateScore();
                            ghost.isEaten = true;
                            ghost.state = 'chase'; // Will now target home to respawn
                        }
                    } else if (!ghost.isEaten) {
                        handlePacmanDeath();
                    }
                }
            });
        }
        
        function handlePacmanDeath() {
            gameStarted = false; // Pause game logic
            lives--;
            updateLives();

            if (lives <= 0) {
                gameOver = true;
                setTimeout(showGameOver, 1000);
            } else {
                setTimeout(() => {
                    resetCharacters();
                    startScreen.style.display = 'flex'; // Show "Ready!" again
                    setTimeout(() => {
                        startScreen.style.display = 'none';
                        gameStarted = true;
                    }, 2000);
                }, 1000);
            }
        }
        
        function showGameOver() {
            finalScoreEl.textContent = `FINAL SCORE: ${score}`;
            gameOverScreen.style.display = 'flex';
        }

        function checkWinCondition() {
            if (pelletsCount <= 0) {
                gameStarted = false;
                gameOver = true;
                // Use a timeout to let the last pellet-eating animation finish
                setTimeout(() => {
                    alert("YOU WIN! CONGRATULATIONS!");
                    showGameOver();
                }, 500);
            }
        }

        let scatterTimer = 0;
        const SCATTER_DURATION = 7 * 60; // 7 seconds
        const CHASE_DURATION = 20 * 60; // 20 seconds
        let wave = 0;

        function updateGhostStates() {
            if (frightenedMode) {
                frightenedTimer--;
                if (frightenedTimer <= 0) {
                    frightenedMode = false;
                    ghosts.forEach(g => {
                        if (!g.isEaten) g.state = 'chase'; // Return to chase after frightened mode ends
                    });
                }
                return; // Frightened mode overrides scatter/chase logic
            }

            scatterTimer++;
            const currentMode = ghosts[0].state;

            if (currentMode === 'scatter' && scatterTimer > SCATTER_DURATION) {
                scatterTimer = 0;
                ghosts.forEach(g => g.state = 'chase');
            } else if (currentMode === 'chase' && scatterTimer > CHASE_DURATION) {
                scatterTimer = 0;
                // Only scatter for the first few waves
                if (wave < 4) {
                    ghosts.forEach(g => g.state = 'scatter');
                    wave++;
                }
            }
        }
        
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
            drawMap();
            pacman.draw();
            ghosts.forEach(ghost => ghost.draw());
        }

        function update() {
            pacman.update();
            ghosts.forEach(ghost => ghost.update());
            updateGhostStates();
            checkCollisions();
            checkWinCondition();
        }

        function gameLoop() {
            if (gameOver) return;
            
            if (gameStarted) {
                update();
            }
            draw();
            
            requestAnimationFrame(gameLoop);
        }

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault(); // Prevent page scrolling
            }
            if (e.key === 'ArrowUp') pacman.nextDirection = { x: 0, y: -1 };
            else if (e.key === 'ArrowDown') pacman.nextDirection = { x: 0, y: 1 };
            else if (e.key === 'ArrowLeft') pacman.nextDirection = { x: -1, y: 0 };
            else if (e.key === 'ArrowRight') pacman.nextDirection = { x: 1, y: 0 };
        });

        // Initialize and start the game
        init();
    });
    </script>
</body>
</html>
```

---
*Generated by OpenRouter CLI*