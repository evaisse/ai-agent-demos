# OpenRouter API Response

## Metadata
- **Model**: anthropic/claude-sonnet-4.5
- **Timestamp**: 2025-10-02T08:28:25.081Z
- **Duration**: 24.548 seconds

## Token Usage
- **Prompt Tokens**: 65
- **Completion Tokens**: 2000
- **Total Tokens**: 2065

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
            min-height: 100vh;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            overflow: hidden;
        }
        canvas {
            border: 2px solid #fff;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
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
        const gravityStrength = 0.3;
        
        // Ball class
        class Ball {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = (Math.random() - 0.5) * 2;
                this.radius = 8;
                this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
                this.restitution = 0.8; // Bounciness
            }
            
            update() {
                // Apply gravity
                this.vy += gravityStrength * gravityDirection;
                
                // Update position
                this.x += this.vx;
                this.y += this.vy;
                
                // Check collision with hexagon walls
                this.checkHexagonCollision();
                
                // Apply some damping
                this.vx *= 0.999;
                this.vy *= 0.999;
            }
            
            checkHexagonCollision() {
                const hexPoints = getHexagonPoints(hexRotation);
                
                // Check each edge of the hexagon
                for (let i = 0; i < hexPoints.length; i++) {
                    const p1 = hexPoints[i];
                    const p2 = hexPoints[(i + 1) % hexPoints.length];
                    
                    // Calculate distance from ball to line segment
                    const result = this.distanceToLineSegment(p1, p2);
                    
                    if (result.distance < this.radius) {
                        // Collision detected
                        // Move ball outside the wall
                        const overlap = this.radius - result.distance;
                        this.x += result.normal.x * overlap;
                        this.y += result.normal.y * overlap;
                        
                        // Reflect velocity
                        const dotProduct = this.vx * result.normal.x + this.vy * result.normal.y;
                        this.vx -= 2 * dotProduct * result.normal.x * this.restitution;
                        this.vy -= 2 * dotProduct * result.normal.y * this.restitution;
                    }
                }
            }
            
            distanceToLineSegment(p1, p2) {
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const nx = -dy / length;
                const ny = dx / length;
                
                // Vector from p1 to ball
                const vx = this.x - p1.x;
                const vy = this.y - p1.y;
                
                // Project onto line
                const t = Math.max(0, Math.min(1, (vx * dx + vy * dy) / (length * length)));
                
                // Closest point on line segment
                const closestX = p1.x + t * dx;
                const closestY = p1.y + t * dy;
                
                // Distance to closest point
                const distX = this.x - closestX;
                const distY = this.y - closestY;
                const distance = Math.sqrt(distX * distX + distY * distY);
                
                // Normal pointing inward
                const ballToCenterX = centerX - this.x;
                const ballToCenterY = centerY - this.y;
                const dotNormal = nx * ballToCenterX + ny * ballToCenterY;
                
                return {
                    distance: distance,
                    normal: {
                        x: dotNormal > 0 ? nx : -nx,
                        y: dotNormal > 0 ? ny : -ny
                    }
                };
            }
            
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        
        // Create balls
        const balls = [];
        for (let i = 0; i < 20; i++) {
            balls.push(new Ball(
                centerX + (Math.random() - 0.5) * 20,
                centerY + (Math.random() - 0.5) * 20
            ));
        }
        
        // Get hexagon points
        function getHexagonPoints(rotation) {
            const points = [];
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i + rotation;
                points.push({
                    x: centerX + hexRadius * Math.cos(angle),
                    y: centerY + hexRadius * Math.sin(angle)
                });
            }
            return points;
        }
        
        // Draw hexagon
        function drawHexagon() {
            const points = getHexagonPoints(hexRotation);
            
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fill();
        }
        
        // Animation loop
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Rotate hexagon
            hexRotation += 0.01;
            
            // Draw hexagon
            drawHexagon();
            
            // Update and draw balls
            balls.forEach(ball => {
                ball.update();
                ball.draw();
            });
            
            // Draw gravity indicator
            ctx.fillStyle = '#fff';
            ctx.font = '20px Arial';
            ctx.fillText(`Gravity: ${gravityDirection === 1 ? 'DOWN ↓' : 'UP ↑'}`, 20, 30);
            
            requestAnimationFrame(animate);
        }
        
        // Change gravity direction every 5 

---
*Generated by OpenRouter CLI*