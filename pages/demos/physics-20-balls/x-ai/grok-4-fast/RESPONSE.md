# OpenRouter API Response

## Metadata
- **Model**: x-ai/grok-4-fast
- **Timestamp**: 2025-10-02T23:10:33.471Z
- **Duration**: 6.584 seconds

## Token Usage
- **Prompt Tokens**: 170
- **Completion Tokens**: 11206
- **Total Tokens**: 11376

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
    <title>Spinning Hexagon Ball Simulation</title>
    <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f0f0; }
        canvas { border: 1px solid #000; background: white; }
    </style>
</head>
<body>
    <canvas id="canvas" width="600" height="600"></canvas>
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const cx = width / 2;
        const cy = height / 2;
        const hexRadius = 250;
        let theta = 0;
        const dtheta = 0.02; // Rotation speed (radians per frame)
        const ballRadius = 8;
        const numBalls = 20;
        const balls = [];
        let gy = 0.2; // Initial gravity downward (+y)

        // Initialize balls in the center with small random offsets and velocities
        for (let i = 0; i < numBalls; i++) {
            balls.push({
                x: cx + (Math.random() - 0.5) * 20,
                y: cy + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                r: ballRadius
            });
        }

        // Switch gravity direction every 5 seconds
        setInterval(() => {
            gy = -gy;
        }, 5000);

        // Get current hexagon vertices (CCW order)
        function getHexVertices() {
            const verts = [];
            for (let i = 0; i < 6; i++) {
                const ang = theta + (2 * Math.PI * i) / 6;
                verts.push({
                    x: cx + hexRadius * Math.cos(ang),
                    y: cy + hexRadius * Math.sin(ang)
                });
            }
            return verts;
        }

        // Collide ball with line segment (assuming CCW hexagon, inward is left of direction)
        function collideBallLine(ball, p1, p2) {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len2 = dx * dx + dy * dy;
            if (len2 === 0) return;

            // Raw signed distance components (unnormalized inward perp: (-dy, dx))
            const px_in = -dy;
            const py_in = dx;
            const signed_raw = (ball.x - p1.x) * px_in + (ball.y - p1.y) * py_in;
            const len = Math.sqrt(len2);
            const signed = signed_raw / len;

            if (signed >= 0) return; // On inside half-plane, no collision

            // Project to segment
            const ex = ball.x - p1.x;
            const ey = ball.y - p1.y;
            let t = (ex * dx + ey * dy) / len2;
            t = Math.max(0, Math.min(1, t));
            const cx = p1.x + t * dx;
            const cy = p1.y + t * dy;
            const px = ball.x - cx;
            const py = ball.y - cy;
            const dist = Math.sqrt(px * px + py * py);

            if (dist >= ball.r || dist === 0) return;

            // Collision detected (outside and intersecting segment)
            const nx = px / dist; // Unit vector from c to ball (outward)
            const ny = py / dist;

            // Move ball to inside surface
            ball.x = cx - nx * ball.r;
            ball.y = cy - ny * ball.r;

            // Reflect velocity: v -= 2 (v · n_out) n_out
            const vdot = ball.vx * nx + ball.vy * ny;
            ball.vx -= 2 * vdot * nx;
            ball.vy -= 2 * vdot * ny;
        }

        // Collide two balls (elastic, equal mass)
        function collideBalls(b1, b2) {
            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = b1.r + b2.r;
            if (dist >= minDist || dist === 0) return;

            // Normalize
            const nx = dx / dist;
            const ny = dy / dist;

            // Separate balls
            const overlap = minDist - dist;
            b1.x -= nx * overlap / 2;
            b1.y -= ny * overlap / 2;
            b2.x += nx * overlap / 2;
            b2.y += ny * overlap / 2;

            // Exchange normal velocity components
            const v1n = b1.vx * nx + b1.vy * ny;
            const v2n = b2.vx * nx + b2.vy * ny;
            const dvx = nx * (v2n - v1n);
            const dvy = ny * (v2n - v1n);
            b1.vx += dvx;
            b1.vy += dvy;
            b2.vx -= dvx;
            b2.vy -= dvy;
        }

        // Update simulation
        function update() {
            // Apply gravity
            for (let b of balls) {
                b.vy += gy;
            }

            // Move balls
            for (let b of balls) {
                b.x += b.vx;
                b.y += b.vy;
            }

            // Wall collisions
            const verts = getHexVertices();
            for (let s = 0; s < 6; s++) {
                const p1 = verts[s];
                const p2 = verts[(s + 1) % 6];
                for (let b of balls) {
                    collideBallLine(b, p1, p2);
                }
            }

            // Ball-ball collisions
            for (let i = 0; i < balls.length; i++) {
                for (let j = i + 1; j < balls.length; j++) {
                    collideBalls(balls[i], balls[j]);
                }
            }

            // Rotate hexagon
            theta += dtheta;
        }

        // Draw
        function draw() {
            ctx.clearRect(0, 0, width, height);

            // Draw hexagon
            const verts = getHexVertices();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(verts[0].x, verts[0].y);
            for (let i = 1; i < 6; i++) {
                ctx.lineTo(verts[i].x, verts[i].y);
            }
            ctx.closePath();
            ctx.stroke();

            // Draw balls
            ctx.fillStyle = '#4a90e2';
            for (let b of balls) {
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.r, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        // Main loop
        function loop() {
            update();
            draw();
            requestAnimationFrame(loop);
        }

        loop();
    </script>
</body>
</html>
```

---
*Generated by OpenRouter CLI*