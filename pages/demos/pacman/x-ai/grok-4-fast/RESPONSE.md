# OpenRouter API Response

## Metadata
- **Model**: x-ai/grok-4-fast
- **Timestamp**: 2025-10-02T13:14:54.270Z
- **Duration**: 44.480 seconds

## Token Usage
- **Prompt Tokens**: 144
- **Completion Tokens**: 4294
- **Total Tokens**: 4438

## Prompt
```
In a single HTML file named index.html, create exact copy of the PAC-MAN game in one html file using css and js.

```

## Response
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PAC-MAN Clone</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: black;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: Arial, sans-serif;
        }
        canvas {
            border: 2px solid #000080;
            background: black;
        }
        #score {
            position: absolute;
            top: 10px;
            left: 10px;
            color: yellow;
            font-size: 20px;
            font-weight: bold;
        }
        #lives {
            position: absolute;
            top: 10px;
            right: 10px;
            color: yellow;
            font-size: 20px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div id="score">Score: 0</div>
    <div id="lives">Lives: 3</div>
    <canvas id="gameCanvas" width="380" height="420"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const tileSize = 20;
        const rows = 21;
        const cols = 19;

        // Maze layout (1 = wall, 0 = empty/dot, 2 = power pellet, 3 = empty no dot)
        const maze = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1],
            [1,2,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,2,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,0,1,1,0,0,1,1,0,1,1,1,0,1],
            [1,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,0,1],
            [1,1,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1,1],
            [3,3,3,3,1,0,0,0,0,3,3,0,0,0,0,1,3,3,3],
            [1,1,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,1],
            [3,3,3,3,3,0,1,1,0,1,1,0,1,1,0,3,3,3,3],
            [1,1,1,1,1,0,1,1,0,0,0,0,1,1,0,1,1,1,1],
            [3,3,3,3,1,0,0,0,0,3,3,0,0,0,0,1,3,3,3],
            [1,1,1,1,1,0,1,1,1,1,1,1,1,0,0,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,1,0,1,1,0,0,1,1,0,1,1,1,0,1],
            [1,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,1],
            [1,2,1,0,0,0,0,1,1,1,1,1,1,0,0,0,0,2,1],
            [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];

        let pacman = { x: 9, y: 15, dir: 'right', mouthOpen: true };
        let ghosts = [
            { x: 9, y: 9, dir: 'up', color: '#FF0000', mode: 'scatter' }, // Blinky
            { x: 8, y: 9, dir: 'left', color: '#FFB8FF', mode: 'scatter' }, // Pinky
            { x: 10, y: 9, dir: 'right', color: '#00FFFF', mode: 'scatter' }, // Inky
            { x: 11, y: 9, dir: 'down', color: '#FFB852', mode: 'scatter' }  // Clyde
        ];
        let score = 0;
        let lives = 3;
        let dotsEaten = 0;
        let totalDots = 0;
        let gameRunning = true;
        let frightenedMode = false;
        let frightenedTimer = 0;
        let keys = {};

        // Count total dots
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (maze[y][x] === 0 || maze[y][x] === 2) totalDots++;
            }
        }

        // Event listeners
        document.addEventListener('keydown', (e) => {
            keys[e.key] = true;
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
            }
        });
        document.addEventListener('keyup', (e) => {
            keys[e.key] = false;
        });

        function drawMaze() {
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const posX = x * tileSize;
                    const posY = y * tileSize;
                    if (maze[y][x] === 1) {
                        ctx.fillStyle = '#000080';
                        ctx.fillRect(posX, posY, tileSize, tileSize);
                        ctx.strokeStyle = '#0000FF';
                        ctx.strokeRect(posX, posY, tileSize, tileSize);
                    } else if (maze[y][x] === 0) {
                        ctx.fillStyle = 'black';
                        ctx.fillRect(posX + 8, posY + 8, 4, 4);
                    } else if (maze[y][x] === 2) {
                        ctx.fillStyle = 'black';
                        ctx.fillRect(posX + 6, posY + 6, 8, 8);
                    }
                }
            }
        }

        function drawPacman() {
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            const centerX = pacman.x * tileSize + tileSize / 2;
            const centerY = pacman.y * tileSize + tileSize / 2;
            if (pacman.dir === 'right') {
                ctx.arc(centerX, centerY, tileSize / 2, pacman.mouthOpen ? 0.2 * Math.PI : 0, pacman.mouthOpen ? 1.8 * Math.PI : 2 * Math.PI);
            } else if (pacman.dir === 'left') {
                ctx.arc(centerX, centerY, tileSize / 2, pacman.mouthOpen ? 1.2 * Math.PI : Math.PI, pacman.mouthOpen ? 0.8 * Math.PI : Math.PI);
            } else if (pacman.dir === 'up') {
                ctx.arc(centerX, centerY, tileSize / 2, pacman.mouthOpen ? 1.7 * Math.PI : 1.5 * Math.PI, pacman.mouthOpen ? 1.3 * Math.PI : 0.5 * Math.PI);
            } else if (pacman.dir === 'down') {
                ctx.arc(centerX, centerY, tileSize / 2, pacman.mouthOpen ? 0.7 * Math.PI : 0.5 * Math.PI, pacman.mouthOpen ? 0.3 * Math.PI : 1.5 * Math.PI);
            }
            ctx.lineTo(centerX, centerY);
            ctx.fill();
        }

        function drawGhost(ghost) {
            const centerX = ghost.x * tileSize + tileSize / 2;
            const centerY = ghost.y * tileSize + tileSize / 2;
            ctx.fillStyle = frightenedMode ? '#0000FF' : ghost.color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, tileSize / 2, Math.PI, 0);
            ctx.lineTo(centerX + tileSize / 2, centerY + tileSize / 2);
            ctx.lineTo(centerX + tileSize / 6, centerY + tileSize / 3);
            ctx.lineTo(centerX, centerY + tileSize / 2);
            ctx.lineTo(centerX - tileSize / 6, centerY + tileSize / 3);
            ctx.lineTo(centerX - tileSize / 2, centerY + tileSize / 2);
            ctx.lineTo(centerX - tileSize / 2, centerY);
            ctx.fill();
            // Eyes
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(centerX - tileSize / 4, centerY - tileSize / 6, tileSize / 6, 0, 2 * Math.PI);
            ctx.arc(centerX + tileSize / 4, centerY - tileSize / 6, tileSize / 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(centerX - tileSize / 4, centerY - tileSize / 6, tileSize / 12, 0, 2 * Math.PI);
            ctx.arc(centerX + tileSize / 4, centerY - tileSize / 6, tileSize / 12, 0, 2 * Math.PI);
            ctx.fill();
        }

        function movePacman() {
            let newX = pacman.x;
            let newY = pacman.y;
            let newDir = pacman.dir;

            if (keys['ArrowUp']) newDir = 'up';
            if (keys['ArrowDown']) newDir = 'down';
            if (keys['ArrowLeft']) newDir = 'left';
            if (keys['ArrowRight']) newDir = 'right';

            if (newDir === 'up') newY--;
            if (newDir === 'down') newY++;
            if (newDir === 'left') newX--;
            if (newDir === 'right') newX++;

            // Wrap around for tunnels
            if (newX < 0) newX = cols - 1;
            if (newX >= cols) newX = 0;

            // Check collision with wall
            if (maze[newY][newX] !== 1) {
                pacman.x = newX;
                pacman.y = newY;
                pacman.dir = newDir;

                // Eat dot or power pellet
                if (maze[pacman.y][pacman.x] === 0) {
                    maze[pacman.y][pacman.x] = 3;
                    score += 10;
                    dotsEaten++;
                } else if (maze[pacman.y][pacman.x] === 2) {
                    maze[pacman.y][pacman.x] = 3;
                    score += 50;
                    dotsEaten++;
                    frightenedMode = true;
                    frightenedTimer = 300; // ~10 seconds at 30fps
                }
            }

            pacman.mouthOpen = !pacman.mouthOpen;
        }

        function moveGhost(ghost) {
            // Simplified ghost AI: random movement, avoid walls
            const directions = ['up', 'down', 'left', 'right'];
            let newX = ghost.x;
            let newY = ghost.y;
            let validMoves = [];

            directions.forEach(dir => {
                let testX = ghost.x;
                let testY = ghost.y;
                if (dir === 'up') testY--;
                if (dir === 'down') testY++;
                if (dir === 'left') testX--;
                if (dir === 'right') testX++;
                if (testX < 0) testX = cols - 1;
                if (testX >= cols) testX = 0;
                if (maze[testY][testX] !== 1 && !(testX === pacman.x && testY === pacman.y)) {
                    validMoves.push(dir);
                }
            });

            if (validMoves.length > 0) {
                // Bias towards Pac-Man direction (simplified)
                let targetDir = validMoves[Math.floor(Math.random() * validMoves.length)];
                if (Math.random() < 0.3) { // 30% chance to chase
                    const dx = pacman.x - ghost.x;
                    const dy = pacman.y - ghost.y;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        targetDir = dx > 0 ? 'right' : 'left';
                    } else {
                        targetDir = dy > 0 ? 'down' : 'up';
                    }
                    if (!validMoves.includes(targetDir)) {
                        targetDir = validMoves[Math.floor(Math.random() * validMoves.length)];
                    }
                }
                if (targetDir === 'up') newY--;
                if (targetDir === 'down') newY++;
                if (targetDir === 'left') newX--;
                if (targetDir === 'right') newX++;
                ghost.dir = targetDir;
            }

            if (newX < 0) newX = cols - 1;
            if (newX >= cols) newX = 0;

            ghost.x = newX;
            ghost.y = newY;

            // Collision with Pac-Man
            if (ghost.x === pacman.x && ghost.y === pacman.y) {
                if (frightenedMode) {
                    score += 200;
                    ghost.x = 9; ghost.y = 9; // Return to home
                } else {
                    lives--;
                    if (lives <= 0) {
                        gameRunning = false;
                        alert('Game Over! Score: ' + score);
                    } else {
                        resetPositions();
                    }
                }
            }
        }

        function updateFrightened() {
            if (frightenedMode) {
                frightenedTimer--;
                if (frightenedTimer <= 0) {
                    frightenedMode = false;
                }
            }
        }

        function resetPositions() {
            pacman = { x: 9, y: 15, dir: 'right', mouthOpen: true };
            ghosts[0] = { x: 9, y: 9, dir: 'up', color: '#FF0000', mode: 'scatter' };
            ghosts[1] = { x: 8, y: 9, dir: 'left', color: '#FFB8FF', mode: 'scatter' };
            ghosts[2] = { x: 10, y: 9, dir: 'right', color: '#00FFFF', mode: 'scatter' };
            ghosts[3] = { x: 11, y: 9, dir: 'down', color: '#FFB852', mode: 'scatter' };
        }

        function checkWin() {
            if (dotsEaten >= totalDots) {
                gameRunning = false;
                alert('You Win! Score: ' + score);
            }
        }

        function updateUI() {
            document.getElementById('score').textContent = 'Score: ' + score;
            document.getElementById('lives').textContent = 'Lives: ' + lives;
        }

        function gameLoop() {
            if (!gameRunning) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawMaze();
            drawPacman();
            ghosts.forEach(drawGhost);
            movePacman();
            ghosts.forEach(moveGhost);
            updateFrightened();
            checkWin();
            updateUI();

            requestAnimationFrame(gameLoop);
        }

        // Start game
        resetPositions();
        gameLoop();
    </script>
</body>
</html>
```

---
*Generated by OpenRouter CLI*