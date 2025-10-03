# OpenRouter API Response

## Metadata
- **Model**: amazon/nova-pro-v1
- **Timestamp**: 2025-10-02T23:05:35.148Z
- **Duration**: 6.593 seconds

## Token Usage
- **Prompt Tokens**: 56
- **Completion Tokens**: 1172
- **Total Tokens**: 1228

## Prompt
```
In a single HTML file named index.html, create a simulation of 20 balls (they follow the rules of gravity and physics) which start in the center of a spinning 2D hexagon. Gravity should change from the bottom to the top every 5 seconds.

```

## Response
Certainly! Below is a complete HTML file named `index.html` that simulates 20 balls following the rules of gravity and physics within a spinning 2D hexagon. The gravity direction changes from bottom to top every 5 seconds.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hexagon Ball Simulation</title>
    <style>
        canvas {
            display: block;
            margin: auto;
            background-color: #f0f0f0;
        }
    </style>
</head>
<body>
    <canvas id="simulationCanvas"></canvas>
    <script>
        const canvas = document.getElementById('simulationCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const balls = [];
        const gravity = { x: 0, y: 1 };
        let angle = 0;
        let hexagonCenter = { x: canvas.width / 2, y: canvas.height / 2 };
        const hexagonRadius = 200;
        const ballRadius = 10;
        const ballCount = 20;

        function Ball(x, y, radius) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.velocity = { x: 0, y: 0 };
        }

        Ball.prototype.draw = function() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'blue';
            ctx.fill();
            ctx.closePath();
        };

        Ball.prototype.update = function() {
            this.velocity.y += gravity.y;
            this.velocity.x += gravity.x;

            this.x += this.velocity.x;
            this.y += this.velocity.y;

            if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
                this.velocity.y = -this.velocity.y * 0.9;
            }

            if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
                this.velocity.x = -this.velocity.x * 0.9;
            }
        };

        function createBalls() {
            for (let i = 0; i < ballCount; i++) {
                const angle = (i / ballCount) * Math.PI * 2;
                const x = hexagonCenter.x + Math.cos(angle) * hexagonRadius;
                const y = hexagonCenter.y + Math.sin(angle) * hexagonRadius;
                balls.push(new Ball(x, y, ballRadius));
            }
        }

        function drawHexagon() {
            ctx.beginPath();
            ctx.moveTo(
                hexagonCenter.x + Math.cos(0) * hexagonRadius,
                hexagonCenter.y + Math.sin(0) * hexagonRadius
            );

            for (let i = 1; i <= 6; i++) {
                ctx.lineTo(
                    hexagonCenter.x + Math.cos(i * Math.PI / 3) * hexagonRadius,
                    hexagonCenter.y + Math.sin(i * Math.PI / 3) * hexagonRadius
                );
            }

            ctx.closePath();
            ctx.strokeStyle = 'black';
            ctx.stroke();
        }

        function animate() {
            requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(hexagonCenter.x, hexagonCenter.y);
            ctx.rotate(angle);
            ctx.translate(-hexagonCenter.x, -hexagonCenter.y);

            drawHexagon();
            balls.forEach(ball => {
                ball.update();
                ball.draw();
            });

            ctx.restore();
            angle += 0.01;
        }

        function toggleGravity() {
            gravity.y = -gravity.y;
        }

        createBalls();
        animate();
        setInterval(toggleGravity, 5000);
    </script>
</body>
</html>
```

### Explanation:
1. **HTML Structure**:
   - A single `<canvas>` element is used to render the simulation.
   
2. **CSS**:
   - Basic styles to center and size the canvas.

3. **JavaScript**:
   - **Ball Class**: Represents each ball with properties for position, radius, and velocity. Methods for drawing and updating the ball's position.
   - **createBalls**: Initializes 20 balls in a circular formation at the center of the hexagon.
   - **drawHexagon**: Draws a spinning hexagon.
   - **animate**: The main animation loop that clears the canvas, rotates the hexagon, updates and draws each ball.
   - **toggleGravity**: Changes the direction of gravity every 5 seconds.
   
This code will create a visually engaging simulation where 20 balls move under the influence of gravity within a spinning hexagon.

---
*Generated by OpenRouter CLI*