# OpenRouter API Response

## Metadata
- **Model**: anthropic/claude-sonnet-4.5
- **Timestamp**: 2025-10-02T23:05:47.004Z
- **Duration**: 6.584 seconds

## Token Usage
- **Prompt Tokens**: 65
- **Completion Tokens**: 2425
- **Total Tokens**: 2490

## Prompt
```
In a single HTML file named index.html, create a simulation of 20 balls (they follow the rules of gravity and physics) which start in the center of a spinning 2D hexagon. Gravity should change from the bottom to the top every 5 seconds.

```

## Response
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spinning Hexagon with Balls</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            overflow: hidden;
        }
        canvas {
            border: 2px solid #fff;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 800;
        canvas.height = 800;
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const hexRadius = 250;
        let hexRotation = 0;
        let gravityDirection = 1; // 1 for down, -1 for up
        
        // Ball class
        class Ball {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = (Math.random() - 0.5) * 2;
                this.radius = 8;
                this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
                this.mass = 1;
            }
            
            update() {
                // Apply gravity
                this.vy += 0.3 * gravityDirection;
                
                // Apply velocity
                this.x += this.vx;
                this.y += this.vy;
                
                // Damping
                this.vx *= 0.999;
                this.vy *= 0.999;
            }
            
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        
        // Create balls
        const balls = [];
        for (let i = 0; i < 20; i++) {
            balls.push(new Ball(centerX, centerY));
        }
        
        // Get hexagon vertices
        function getHexagonVertices(rotation) {
            const vertices = [];
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i + rotation;
                vertices.push({
                    x: centerX + hexRadius * Math.cos(angle),
                    y: centerY + hexRadius * Math.sin(angle)
                });
            }
            return vertices;
        }
        
        // Draw hexagon
        function drawHexagon(rotation) {
            const vertices = getHexagonVertices(rotation);
            
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < vertices.length; i++) {
                ctx.lineTo(vertices[i].x, vertices[i].y);
            }
            ctx.closePath();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fill();
            
            return vertices;
        }
        
        // Check collision with hexagon edges
        function checkHexagonCollision(ball, vertices) {
            for (let i = 0; i < vertices.length; i++) {
                const v1 = vertices[i];
                const v2 = vertices[(i + 1) % vertices.length];
                
                // Calculate distance from ball to line segment
                const dx = v2.x - v1.x;
                const dy = v2.y - v1.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const nx = -dy / len; // Normal vector
                const ny = dx / len;
                
                // Vector from v1 to ball
                const vx = ball.x - v1.x;
                const vy = ball.y - v1.y;
                
                // Project ball onto line
                const t = Math.max(0, Math.min(1, (vx * dx + vy * dy) / (len * len)));
                const closestX = v1.x + t * dx;
                const closestY = v1.y + t * dy;
                
                // Distance to closest point
                const distX = ball.x - closestX;
                const distY = ball.y - closestY;
                const distance = Math.sqrt(distX * distX + distY * distY);
                
                // Check if ball is outside hexagon
                const dotProduct = vx * nx + vy * ny;
                
                if (distance < ball.radius && dotProduct > 0) {
                    // Move ball outside
                    const overlap = ball.radius - distance;
                    ball.x += nx * overlap;
                    ball.y += ny * overlap;
                    
                    // Reflect velocity
                    const dotVel = ball.vx * nx + ball.vy * ny;
                    ball.vx -= 2 * dotVel * nx * 0.8; // 0.8 for energy loss
                    ball.vy -= 2 * dotVel * ny * 0.8;
                }
            }
        }
        
        // Check ball-to-ball collision
        function checkBallCollision(ball1, ball2) {
            const dx = ball2.x - ball1.x;
            const dy = ball2.y - ball1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = ball1.radius + ball2.radius;
            
            if (distance < minDist) {
                // Normalize
                const nx = dx / distance;
                const ny = dy / distance;
                
                // Separate balls
                const overlap = minDist - distance;
                ball1.x -= nx * overlap / 2;
                ball1.y -= ny * overlap / 2;
                ball2.x += nx * overlap / 2;
                ball2.y += ny * overlap / 2;
                
                // Calculate relative velocity
                const dvx = ball2.vx - ball1.vx;
                const dvy = ball2.vy - ball1.vy;
                const dotProduct = dvx * nx + dvy * ny;
                
                // Update velocities (elastic collision)
                if (dotProduct < 0) {
                    ball1.vx += dotProduct * nx * 0.9;
                    ball1.vy += dotProduct * ny * 0.9;
                    ball2.vx -= dotProduct * nx * 0.9;
                    ball2.vy -= dotProduct * ny * 0.9;
                }
            }
        }
        
        // Animation loop
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Update hexagon rotation
            hexRotation += 0.01;
            
            // Draw hexagon
            const vertices = drawHexagon(hexRotation);
            
            // Update and draw balls
            balls.forEach(ball => {
                ball.update();
            });
            
            // Check collisions
            balls.forEach(ball => {
                checkHexagonCollision(ball, vertices);
            });
            
            // Check ball-to-ball collisions
            for (let i = 0; i < balls.length; i++) {
                for (let j = i + 1; j < balls.length; j++) {
                    checkBallCollision(balls[i], balls[j]);
                }
            }
            
            // Draw balls
            balls.forEach(ball => {
                ball.draw();
            });
            
            // Draw gravity indicator
            ctx.fillStyle = '#fff';
            ctx.font = '20px Arial';
            ctx.fillText(`Gravity: ${gravityDirection === 1 ? 'DOWN ↓' : 'UP ↑'}`, 20, 30);
            
            requestAnimationFrame(animate);
        }
        
        // Change gravity direction every 5 seconds
        setInterval(() => {
            gravityDirection *= -1;
        }, 5000);
        
        animate();
    </script>
</body>
</html>
```

This HTML file creates a complete simulation with:

1. **20 colorful balls** that start at the center of the canvas
2. **A rotating hexagon** that spins continuously
3. **Physics simulation** including:
   - Gravity (changes direction every 5 seconds)
   - Ball-to-ball collisions
   - Ball-to-hexagon wall collisions
   - Velocity damping for realistic movement
4. **Visual feedback** showing the current gravity direction

The balls will bounce off the hexagon walls and each other, creating a dynamic and entertaining simulation. The hexagon continuously rotates, and gravity alternates between pulling down and pulling up every 5 seconds.

---
*Generated by OpenRouter CLI*