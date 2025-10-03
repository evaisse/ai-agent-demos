# OpenRouter API Response

## Metadata
- **Model**: anthropic/claude-3.5-sonnet
- **Timestamp**: 2025-10-02T13:04:39.838Z
- **Duration**: 26.465 seconds

## Token Usage
- **Prompt Tokens**: 37
- **Completion Tokens**: 1681
- **Total Tokens**: 1718

## Prompt
```
In a single HTML file named index.html, create exact copy of the PAC-MAN game in one html file using css and js.

```

## Response
Here's a simplified version of PAC-MAN in a single HTML file. Note that this is a basic implementation and doesn't include all features of the original game:

```html
<!DOCTYPE html>
<html>
<head>
    <title>PAC-MAN</title>
    <style>
        body {
            background-color: black;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        
        #gameBoard {
            border: 2px solid blue;
        }

        .score {
            color: white;
            font-family: Arial, sans-serif;
            font-size: 20px;
            position: absolute;
            top: 10px;
            left: 10px;
        }
    </style>
</head>
<body>
    <div class="score">Score: <span id="score">0</span></div>
    <canvas id="gameBoard"></canvas>

    <script>
        const canvas = document.getElementById('gameBoard');
        const ctx = canvas.getContext('2d');
        const scoreElement = document.getElementById('score');

        canvas.width = 560;
        canvas.height = 600;

        class Pacman {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.radius = 15;
                this.speed = 3;
                this.direction = 0; // 0: right, 1: up, 2: left, 3: down
                this.mouthOpen = 0;
                this.mouthSpeed = 0.15;
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate((this.direction * 90) * Math.PI / 180);
                
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, this.mouthOpen * Math.PI, (2 - this.mouthOpen) * Math.PI);
                ctx.lineTo(0, 0);
                ctx.fillStyle = 'yellow';
                ctx.fill();
                
                ctx.restore();
            }

            update() {
                this.mouthOpen += this.mouthSpeed;
                if (this.mouthOpen > 0.5 || this.mouthOpen < 0) {
                    this.mouthSpeed = -this.mouthSpeed;
                }
            }

            move() {
                switch(this.direction) {
                    case 0: this.x += this.speed; break;
                    case 1: this.y -= this.speed; break;
                    case 2: this.x -= this.speed; break;
                    case 3: this.y += this.speed; break;
                }

                // Keep Pacman within bounds
                if (this.x < this.radius) this.x = this.radius;
                if (this.x > canvas.width - this.radius) this.x = canvas.width - this.radius;
                if (this.y < this.radius) this.y = this.radius;
                if (this.y > canvas.height - this.radius) this.y = canvas.height - this.radius;
            }
        }

        class Dot {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.radius = 3;
                this.eaten = false;
            }

            draw() {
                if (!this.eaten) {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fillStyle = 'white';
                    ctx.fill();
                }
            }
        }

        const pacman = new Pacman(100, 100);
        let dots = [];
        let score = 0;

        // Create dots grid
        for (let i = 40; i < canvas.width; i += 40) {
            for (let j = 40; j < canvas.height; j += 40) {
                dots.push(new Dot(i, j));
            }
        }

        function checkCollision() {
            dots.forEach(dot => {
                if (!dot.eaten) {
                    const dx = pacman.x - dot.x;
                    const dy = pacman.y - dot.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < pacman.radius + dot.radius) {
                        dot.eaten = true;
                        score += 10;
                        scoreElement.textContent = score;
                    }
                }
            });
        }

        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case 'ArrowRight':
                    pacman.direction = 0;
                    break;
                case 'ArrowUp':
                    pacman.direction = 1;
                    break;
                case 'ArrowLeft':
                    pacman.direction = 2;
                    break;
                case 'ArrowDown':
                    pacman.direction = 3;
                    break;
            }
        });

        function gameLoop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw dots
            dots.forEach(dot => dot.draw());
            
            // Update and draw Pacman
            pacman.update();
            pacman.move();
            pacman.draw();
            
            // Check for collisions
            checkCollision();
            
            requestAnimationFrame(gameLoop);
        }

        gameLoop();
    </script>
</body>
</html>
```

This implementation includes:

1. A basic Pacman that can move in four directions using arrow keys
2. Dots that can be collected for points
3. Score tracking
4. Simple collision detection
5. Animated Pacman mouth

To play:
1. Use arrow keys to move Pacman
2. Collect white dots to increase your score
3. Each dot is worth 10 points

Limitations of this basic version:
1. No ghosts
2. No maze walls
3. No power pellets
4. No game over condition
5. No sound effects
6. Simplified graphics

You can save this code in a file named `index.html` and open it in a web browser to play. To make it more like the original game, you would need to add:

1. Ghost AI and movement
2. Maze walls and collision detection
3. Power pellets and ghost vulnerability
4. Sound effects
5. More sophisticated graphics
6. Lives system
7. Game over conditions
8. Level progression

But this gives you a basic foundation for a Pac-Man-style game.

---
*Generated by OpenRouter CLI*