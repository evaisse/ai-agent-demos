# OpenRouter API Response

## Metadata
- **Model**: aion-labs/aion-1.0
- **Timestamp**: 2025-10-02T23:07:29.023Z
- **Duration**: 6.582 seconds

## Token Usage
- **Prompt Tokens**: 55
- **Completion Tokens**: 8083
- **Total Tokens**: 8138

## Prompt
```
In a single HTML file named index.html, create a simulation of 20 balls (they follow the rules of gravity and physics) which start in the center of a spinning 2D hexagon. Gravity should change from the bottom to the top every 5 seconds.

```

## Response
<think> For now, I must focus on thinking about the problem.

I need to create a single HTML file with a simulation of 20 balls inside a spinning hexagon. The balls should obey gravity and physics, and gravity should flip from bottom to top every 5 seconds.

I'll use JavaScript for the simulation and Canvas for drawing. The plan is:

1. Set up an HTML5 canvas element.
2. In JavaScript, define a Hexagon class for the container and a Ball class for each ball.
3. The hexagon will rotate continuously.
4. Gravity will be a vector that changes direction every 5 seconds (from pointing down to pointing up and vice versa).
5. The balls will start at the center and then move under the influence of gravity and collisions with the hexagon walls and each other.

I'll use basic physics for the balls: velocity, acceleration (gravity), and bouncing off walls with energy loss to simulate damping. For collisions between balls, I'll use a simple elastic collision model.

However, simulating 20 balls with collision detection might be heavy, but for a small number it should be okay.

Steps:

HTML Structure:
- Create a canvas element with an id and set its dimensions.

CSS:
- Set the canvas to fill the viewport or a fixed size.

JavaScript:
- Get the canvas and context.
- Define constants: number of balls (20), gravity magnitude, flip interval (5000 ms), hexagon rotation speed, etc.
- Define a Vector class for 2D math (optional, but helpful).
- Ball class:
  - Properties: position, velocity, radius, color (random).
  - Methods: update (apply gravity and move), draw, and handle collisions with walls (hexagon) and other balls.
- Hexagon class:
  - Properties: center, radius, rotation angle, angular velocity.
  - Methods: draw, and a method to get the vertices (for collision detection?).
- For collisions with the hexagon, I'll use line segment collisions. Since the hexagon is spinning, we need to transform the ball's position to the hexagon's rotating frame? Alternatively, we can check collisions by rotating the hexagon's walls to the ball's frame.

But that might be complex. Another idea: treat the hexagon as a set of six line segments that are rotating. Then, for each ball, check collision with each segment.

Since the hexagon is spinning, the collision normal will change. I can compute the closest point on each edge and check the distance.

But for simplicity, I can model the hexagon as a circle with inward-facing walls? Or use a distance function to the hexagon.

Actually, for a regular hexagon, the distance from center to a vertex is the radius, and the distance to a side (apothem) is (sqrt(3)/2)*radius. We can create a function that returns the distance from a point to the hexagon's boundary in the current orientation.

Alternatively, we can use point-in-polygon to keep the balls inside, but with collision response.

I think the easiest approach is to treat the hexagon as a set of lines and do line-circle collisions.

Plan for collision with hexagon:

1. Each frame, compute the current vertices of the hexagon (based on center, radius, rotation angle).
2. For each ball, check against each edge (from vertex i to vertex i+1) for collision.
   - The collision condition: distance from ball center to the line segment is less than the ball radius.
   - If collision, reflect the ball's velocity across the normal of the edge, and apply damping (lose some energy).

But with 20 balls and 6 edges, that's 120 checks per frame, which is acceptable.

Also, ball-to-ball collisions: check every pair? 20*19/2 = 190 per frame. Might be acceptable if optimized, but we can use a spatial grid for better performance? For 20 balls, it's okay without.

Simulation steps:

- Initialize:
  - Create hexagon in the center of the canvas.
  - Create 20 balls at the center (with random small initial velocity so they spread out).
- Animation loop:
  - Clear canvas.
  - Update hexagon rotation angle.
  - Update gravity direction every 5 seconds (using setInterval or by checking elapsed time).
  - For each ball:
     - Apply gravity (as acceleration).
     - Update position (using Euler integration: v += a * dt; pos += v * dt).
     - Check collisions with hexagon edges and adjust position and velocity.
     - Check collisions with other balls and adjust accordingly.
  - Draw hexagon.
  - Draw balls.

Details:

Gravity flip: every 5 seconds, switch gravity vector. Let gravity be a vector (0, g) or (0, -g). We can have a variable `gravityY` that flips sign every 5 seconds.

Set an interval to flip gravity:

```javascript
let gravityY = 1; // positive is down (since in canvas, y increases downward)
setInterval(() => {
  gravityY *= -1;
}, 5000);
```

But in the physics, acceleration for gravity will be (0, gravityY * gravityConstant).

Hexagon:

- Center at canvas center.
- Radius: let's say 200 pixels.
- Rotation: increment angle each frame by a small amount (angularVelocity * dt).

Drawing the hexagon: 6 vertices at 60-degree intervals.

Collision with hexagon:

We need to detect when a ball hits an edge. For each edge:

- Find the closest point on the edge to the ball's center.
- If distance < ball radius, then collision.
- Then, adjust the ball's position to be outside the edge (by the overlap) and reflect the velocity.

But note: because the hexagon is rotating, the edges are moving. So the collision response should account for the moving edge? That complicates. For simplicity, we ignore the movement of the hexagon in the collision? The problem doesn't specify, so we can assume the walls are stationary for collision? But the hexagon is spinning. Alternatively, we can consider the wall movement? 

To keep it simple, I'll ignore the movement of the walls in the collision response. So the balls just bounce off the walls as if they were stationary at the moment of collision.

Ball to ball collision:

- For two balls i and j, if distance between centers < radius_i + radius_j, then collision.
- Compute the normal vector (from i to j).
- Adjust positions to remove overlap.
- Exchange momentum (elastic collision) in the normal direction.

We'll use a standard method:

- Compute the normal and relative velocity.
- Compute impulse along the normal.

Implementation:

I'll create a Vector class to make math easier, but to keep it in one file and simple, I might just use objects with x and y.

Now, let's code it step by step in one HTML file.

File structure:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Spinning Hexagon with Balls</title>
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script>
    // JavaScript code here
  </script>
</body>
</html>
```

Inside the script:

- Set up canvas and context.
- Define constants and variables.
- Classes: Vector (maybe), Ball, Hexagon.
- Helper functions for collision detection and response.
- Animation loop using requestAnimationFrame.

Let's start without Vector class and just use x and y properties.

Constants:

```javascript
const NUM_BALLS = 20;
const GRAVITY_CONSTANT = 0.2;
const BALL_RADIUS = 15;
const HEXAGON_RADIUS = 200;
const HEXAGON_ROTATION_SPEED = 0.01; // radians per frame? we'll adjust by dt
const DAMPING = 0.95; // energy loss on wall bounce
```

Variables:

```javascript
let gravityDirection = 1; // 1 for down, -1 for up
let lastGravityFlip = Date.now();
let balls = [];
let hexagon;
```

Ball class:

```javascript
class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = BALL_RADIUS;
    // Random velocity
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    // Random color
    this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
  }

  // Apply acceleration (gravity)
  applyForce(ax, ay) {
    this.vx += ax;
    this.vy += ay;
  }

  update(dt) {
    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}
```

Hexagon class:

```javascript
class Hexagon {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.angle = 0;
  }

  update(dt) {
    this.angle += HEXAGON_ROTATION_SPEED * dt;
  }

  getVertices() {
    let vertices = [];
    for (let i = 0; i < 6; i++) {
      const a = this.angle + i * Math.PI / 3;
      vertices.push({
        x: this.x + this.radius * Math.cos(a),
        y: this.y + this.radius * Math.sin(a)
      });
    }
    return vertices;
  }

  draw(ctx) {
    const vertices = this.getVertices();
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < 6; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
```

Collision functions:

For ball and line segment:

We'll create a function that checks collision between a ball and a line segment (defined by two points). If collision, adjust position and reflect velocity.

Function: `checkBallLineCollision(ball, p1, p2)`

Steps:

1. Compute vector from p1 to p2 (edge vector).
2. Vector from p1 to ball center.
3. Project the ball vector onto the edge vector to find the closest point on the edge.
4. Clamp the projection to [0,1] to get a point on the segment.
5. Compute distance from ball center to that closest point.
6. If distance < ball radius, then collision.
7. Compute normal (from closest point to ball center) and normalize.
8. Move ball to outside by overlap.
9. Reflect velocity: dot product with normal, then subtract twice that component.

But note: if the ball is inside the hexagon, we want the normal to point inward? Actually, the hexagon is a container so the normal should point outward? Wait, for a hexagon, the normal for each edge points outward. So if the ball is inside and colliding, the normal should point from the edge to the ball? Actually, the normal is perpendicular to the edge and pointing outward.

In our collision, we want to push the ball away from the edge, so the normal is from the edge to the ball? Actually, the normal should be from the collision point (on the edge) to the ball. But we need to ensure it's the outward normal? Since the ball is inside, the normal should be pointing away from the center? Actually, the normal of the edge is fixed: it's the perpendicular to the edge pointing outward.

So let's precompute the normal for each edge? For a hexagon, each edge's normal is fixed relative to the edge? Actually, as the hexagon rotates, the normals rotate too.

We can compute the edge vector: (p2.x - p1.x, p2.y - p1.y). Then the normal can be (edge.y, -edge.x) or (-edge.y, edge.x) depending on the direction? We want the outward normal.

In a hexagon, the outward normal for edge (p1, p2) is the vector perpendicular to the edge pointing away from the center. We can compute: vector from center to midpoint of edge, which gives the outward direction? But that might be expensive.

Alternatively, we can compute the normal as (edge.y, -edge.x) and then check if it points away from the center? Actually, we can compute:

vector from center to the closest point: if that vector and the normal are in the same direction, then it's outward.

But a simpler method: the normal should be pointing toward the ball? Actually, we want the normal to point outward. So if the ball is inside, we want the normal pointing outward, so when we reflect, we bounce the ball back inside.

So let's define the normal for an edge (p1, p2) as: 
normal = (edge.y, -edge.x) normalized? But that gives a perpendicular. For a hexagon, we need to choose the direction that points outward.

Actually, we can compute the center of the hexagon. Then, the midpoint of the edge is mid = ( (p1.x+p2.x)/2, (p1.y+p2.y)/2 ). The vector from center to mid is outward. Then, the normal we choose should be in the same direction as that vector? But we have the normal from the edge: the perpendicular. We must choose the one that points outward.

So: edge vector = (dx, dy) = (p2.x - p1.x, p2.y - p1.y). Then normals are (dy, -dx) and (-dy, dx). The outward one is the one that points away from the center.

We can do: take normal = (dy, -dx) and then check the dot product with the vector from center to mid. If positive, it's outward; if negative, flip.

But to avoid per-edge computation, note that for a regular hexagon, the outward normal for each edge is the same as the direction of the center to the vertex? Actually, no.

Alternatively, since the hexagon is convex, we can check the side: the ball should be on the inside side of the edge. So if the ball is on the side that the outward normal points, then we don't collide? Actually, we only care when the ball is on the outside? But the ball is always inside the hexagon? So we only check when the ball is too close to an edge from the inside.

We can assume the normal we use is always pointing inward? Actually, I think I'm getting confused.

Let me clarify: the hexagon is a container. The ball is inside. We want to prevent the ball from going outside. So the collision happens when the ball tries to cross the edge from inside to outside. Therefore, the normal we use in the collision response should point inward? Wait, no: in collision response, the normal points away from the collision surface. Since the surface is the edge of the hexagon and we are inside, the normal should point outward? But then we want to push the ball inward, so the normal should point inward? 

Actually, the collision surface (the edge) has a normal that points outward (away from the hexagon center). When the ball, which is inside, collides with the edge, we want to push the ball in the opposite direction of the normal? That would be outward? That's wrong.

I think I have it backwards. The normal of the edge (from the hexagon's perspective) is outward. So when the ball hits the edge, we want to reflect the ball as if the edge is a wall with the normal pointing inward? Actually, no. The reflection should be as if the wall is on the outside, so the normal points inward? 

Actually, the wall is the inner side of the hexagon edge. So the normal should point inward? Then when the ball hits, we reflect using the inward normal.

So for each edge, we define the normal as pointing toward the center. Then the ball collides with the inner side of the edge.

So: for edge (p1, p2), we can compute the normal as:

Let edge = (p2 - p1). Then a perpendicular is (edge.y, -edge.x) or (-edge.y, edge.x). We want the one that points toward the center.

We can compute the vector from the midpoint to the center, then choose the normal that points in the same direction.

But we can precompute for each edge: the normal pointing inward.

Since the hexagon is regular and centered, the inward normal for edge i is the direction from the midpoint of the edge to the center? Actually, from the edge to the center? So vector from the midpoint to the center is inward.

But we can compute it as:

normal = (center.x - mid.x, center.y - mid.y) normalized.

That's expensive per edge? We can compute during setup for each edge? But the hexagon rotates, so the normals change.

Alternatively, we can compute the normal per edge per frame as:

mid_x = (p1.x + p2.x) / 2
mid_y = (p1.y + p2.y) / 2
normal_x = center.x - mid_x
normal_y = center.y - mid_y
normalize

But that's 6 times per frame, which is acceptable.

Then, for collision detection:

- Find the closest point on the segment to the ball.
- Compute distance d from ball to that point.
- If d < ball radius, then collision.

But then we adjust:

- Move the ball away by (ball radius - d) in the direction of the normal? Wait, no: the normal we computed is from the edge to the center, which is inward. But the collision is with the edge, so we want to push the ball away from the edge, which is inward? Actually, no: if the ball is too close to the edge, we want to push it toward the center? That might cause the ball to be pushed through if multiple collisions. We should push it along the line from the collision point to the ball center? 

Standard approach: the overlap is (ball radius - d). Then we move the ball along the normal from the edge to the ball? But wait, the normal we have is inward, from the edge to the center. But the direction from the collision point to the ball might not be the same as the inward normal.

Actually, the vector from the closest point to the ball is (ball.x - closest.x, ball.y - closest.y). This vector may not be exactly along the normal? Because the closest point might be an endpoint.

But for a convex polygon, the vector from the closest point on the edge to the ball should be in the direction of the inward normal? Not necessarily: if the closest point is an endpoint, then the direction is toward the vertex.

So in practice, it's more robust to use the vector from the closest point to the ball as the normal for collision.

So:

normal_x = ball.x - closest.x
normal_y = ball.y - closest.y
length = sqrt(normal_x*normal_x + normal_y*normal_y)
normal_x /= length
normal_y /= length

Then, the ball is moving toward the edge? We can check the relative velocity to avoid sticking.

But then the collision normal is from the edge to the ball. If the ball is inside, this vector points outward? Then we want to push the ball inward? So we move the ball by (overlap) in the opposite direction of the normal? So inward.

And reflect the velocity: with a normal pointing outward, the reflection would be inward? 

Actually, the normal is pointing from the collision point to the ball (outward). So the ball is coming from the inside and hitting the edge. So we want to reflect the velocity as if hitting a wall with normal pointing outward? That would bounce it back inside.

Reflection formula: 
dot = vx * nx + vy * ny
vx -= 2 * dot * nx
vy -= 2 * dot * ny

And then apply damping.

Also, move the ball back by overlap in the direction of the normal? No, to resolve penetration, we move the ball by (overlap) in the opposite direction of the normal (so inward). So:

ball.x -= overlap * nx
ball.y -= overlap * ny

But note: if we use the normal from the edge to the ball, which is outward, then moving the ball opposite to that normal is inward.

Yes.

So the function:

```javascript
function checkBallLineCollision(ball, p1, p2) {
  // Vector from p1 to p2
  const edgeX = p2.x - p1.x;
  const edgeY = p2.y - p1.y;
  const edgeLength = Math.sqrt(edgeX*edgeX + edgeY*edgeY);
  const edgeUnitX = edgeX / edgeLength;
  const edgeUnitY = edgeY / edgeLength;
  
  // Vector from p1 to ball
  const ballX = ball.x - p1.x;
  const ballY = ball.y - p1.y;
  
  // Project ball vector onto edge
  let scalar = ballX * edgeUnitX + ballY * edgeUnitY;
  scalar = Math.max(0, Math.min(edgeLength, scalar)); // clamp
  
  // Closest point on edge
  const closestX = p1.x + scalar * edgeUnitX;
  const closestY = p1.y + scalar * edgeUnitY;
  
  // Distance to closest point
  const distX = ball.x - closestX;
  const distY = ball.y - closestY;
  const distance = Math.sqrt(distX*distX + distY*distY);
  
  if (distance < ball.radius) {
    // Collision
    const nx = distX / distance; // normal from edge to ball (outward)
    const ny = distY / distance;
    
    // Move ball out by overlap
    const overlap = ball.radius - distance;
    ball.x += overlap * nx; // ? This would move it outward? We want to move it inward? 
    // But wait: nx is from edge to ball, so to resolve, we move the ball along nx by overlap? That would push it further out? 
    // Actually, we want to push the ball away from the edge, which is inward? So we should move the ball in the opposite direction of nx? 
    // Because nx is pointing outward, we want to move the ball inward: so subtract.
    // Correction: move the ball by -overlap * normal (to push it away from the edge toward inside).
    ball.x -= overlap * nx;
    ball.y -= overlap * ny;
    
    // Reflect velocity with damping
    const dot = ball.vx * nx + ball.vy * ny;
    ball.vx = DAMPING * (ball.vx - 2 * dot * nx);
    ball.vy = DAMPING * (ball.vy - 2 * dot * ny);
    
    return true;
  }
  return false;
}
```

But note: moving the ball by `ball.x -= overlap * nx` is moving it in the direction of the inward normal? Let me see: nx is outward (from edge to ball). So to push the ball away from the edge (inward), we move it opposite to nx? So yes, subtracting.

But there's an issue: if the ball is near the corner, the closest point might be the vertex, and then the normal is not exactly perpendicular to the edge. But it should be acceptable.

Now for ball-ball collision:

```javascript
function checkBallBallCollision(ball1, ball2) {
  const dx = ball2.x - ball1.x;
  const dy = ball2.y - ball1.y;
  const distance = Math.sqrt(dx*dx + dy*dy);
  const minDistance = ball1.radius + ball2.radius;
  
  if (distance < minDistance) {
    // Collision
    const nx = dx / distance;
    const ny = dy / distance;
    
    // Move balls apart by half the overlap each? Or proportional to mass? Assume same mass.
    const overlap = minDistance - distance;
    ball1.x -= overlap * nx / 2;
    ball1.y -= overlap * ny / 2;
    ball2.x += overlap * nx / 2;
    ball2.y += overlap * ny / 2;
    
    // Velocities along the normal
    const v1n = ball1.vx * nx + ball1.vy * ny;
    const v2n = ball2.vx * nx + ball2.vy * ny;
    
    // Elastic collision: exchange momentum in normal direction
    // For equal mass, they swap normal velocities?
    const newV1n = v2n;
    const newV2n = v1n;
    
    // Update velocities: subtract the old normal component and add the new
    ball1.vx += (newV1n - v1n) * nx;
    ball1.vy += (newV1n - v1n) * ny;
    ball2.vx += (newV2n - v2n) * nx;
    ball2.vy += (newV2n - v2n) * ny;
    
    return true;
  }
  return false;
}
```

But note: the above collision response is for perfectly elastic and equal mass. And it's in the normal direction only.

Now the main loop:

- Setup canvas, create balls and hexagon.
- Flip gravity every 5 seconds.
- Animation loop:
  - Update time and dt.
  - Check if 5 seconds have passed to flip gravity? Or use setInterval for that.
  - Update hexagon.
  - Apply gravity to each ball (0, gravityDirection * GRAVITY_CONSTANT).
  - Update each ball with dt.
  - For each ball, check collision with each edge of hexagon (using the current vertices).
  - For each pair of balls, check collision (avoid duplicate: for i, for j>i).
  - Draw everything.

Let's code accordingly.

I'll put it all together.

Note: Performance: 20 balls -> 190 ball pairs, and 6 edges per ball -> 20*6=120 edge checks, total 310 per frame. At 60fps, that's 18600 per second, which should be okay.

Let's write the code.

We'll use requestAnimationFrame for the loop.

Gravity flip: we'll use a setInterval to flip the gravityDirection every 5000 ms.

We'll set the canvas to full window.

Now, code in one HTML file.

</think>


```html
<!DOCTYPE html>
<html>
<head>
  <title>Spinning Hexagon with Balls</title>
  <style>
    body {
      margin: 0;
      overflow: hidden;
      background: #f0f0f0;
    }
    canvas {
      display: block;
      background: #ffffff;
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script>
    // Constants
    const NUM_BALLS = 20;
    const GRAVITY_CONSTANT = 0.2;
    const BALL_RADIUS = 15;
    const HEXAGON_RADIUS = 200;
    const HEXAGON_ROTATION_SPEED = 0.01; // radians per millisecond? We'll adjust by dt
    const DAMPING = 0.95; // energy loss on wall bounce
    const GRAVITY_FLIP_INTERVAL = 5000; // 5 seconds

    // Variables
    let canvas, ctx;
    let balls = [];
    let hexagon;
    let gravityDirection = 1; // 1 for down (positive y), -1 for up (negative y)
    let lastTime;

    // Ball class
    class Ball {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = BALL_RADIUS;
        this.vx = (Math.random() - 0.5) * 4; // random initial velocity
        this.vy = (Math.random() - 0.5) * 4;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`; // random color
      }

      applyForce(ax, ay) {
        this.vx += ax;
        this.vy += ay;
      }

      update(dt) {
        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
      }
    }

    // Hexagon class
    class Hexagon {
      constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.angle = 0;
      }

      update(dt) {
        this.angle += HEXAGON_ROTATION_SPEED * dt;
      }

      getVertices() {
        let vertices = [];
        for (let i = 0; i < 6; i++) {
          const a = this.angle + i * Math.PI / 3;
          vertices.push({
            x: this.x + this.radius * Math.cos(a),
            y: this.y + this.radius * Math.sin(a)
          });
        }
        return vertices;
      }

      draw() {
        const vertices = this.getVertices();
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < 6; i++) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Check collision between ball and line segment (p1, p2)
    function checkBallLineCollision(ball, p1, p2) {
      // Edge vector
      const edgeX = p2.x - p1.x;
      const edgeY = p2.y - p1.y;
      const edgeLength = Math.sqrt(edgeX * edgeX + edgeY * edgeY);
      
      // If edge length is zero, skip
      if (edgeLength === 0) return false;
      
      const edgeUnitX = edgeX / edgeLength;
      const edgeUnitY = edgeY / edgeLength;
      
      // Vector from p1 to ball
      const ballX = ball.x - p1.x;
      const ballY = ball.y - p1.y;
      
      // Project ball vector onto edge
      let scalar = ballX * edgeUnitX + ballY * edgeUnitY;
      scalar = Math.max(0, Math.min(edgeLength, scalar)); // clamp to segment
      
      // Closest point on the edge
      const closestX = p1.x + scalar * edgeUnitX;
      const closestY = p1.y + scalar * edgeUnitY;
      
      // Distance from ball to closest point
      const distX = ball.x - closestX;
      const distY = ball.y - closestY;
      const distance = Math.sqrt(distX * distX + distY * distY);
      
      if (distance < ball.radius) {
        // Collision
        const nx = distX / distance; // normal from edge to ball (outward)
        const ny = distY / distance;
        
        // Move ball to resolve overlap (inward: opposite to normal)
        const overlap = ball.radius - distance;
        ball.x -= overlap * nx;
        ball.y -= overlap * ny;
        
        // Reflect velocity with damping
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx = DAMPING * (ball.vx - 2 * dot * nx);
        ball.vy = DAMPING * (ball.vy - 2 * dot * ny);
        
        return true;
      }
      return false;
    }

    // Check collision between two balls
    function checkBallBallCollision(ball1, ball2) {
      const dx = ball2.x - ball1.x;
      const dy = ball2.y - ball1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = ball1.radius + ball2.radius;
      
      if (distance < minDistance) {
        // Collision
        const nx = dx / distance; // normal from ball1 to ball2
        const ny = dy / distance;
        
        // Move balls apart by half the overlap each
        const overlap = minDistance - distance;
        ball1.x -= overlap * nx / 2;
        ball1.y -= overlap * ny / 2;
        ball2.x += overlap * nx / 2;
        ball2.y += overlap * ny / 2;
        
        // Velocities along the normal
        const v1n = ball1.vx * nx + ball1.vy * ny;
        const v2n = ball2.vx * nx + ball2.vy * ny;
        
        // Elastic collision: for equal mass, swap normal velocities
        const newV1n = v2n;
        const newV2n = v1n;
        
        // Update velocities: subtract old normal component and add new
        ball1.vx += (newV1n - v1n) * nx;
        ball1.vy += (newV1n - v1n) * ny;
        ball2.vx += (newV2n - v2n) * nx;
        ball2.vy += (newV2n - v2n) * ny;
        
        return true;
      }
      return false;
    }

    // Initialize
    function init() {
      canvas = document.getElementById('canvas');
      ctx = canvas.getContext('2d');
      
      // Set canvas to window size
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      
      // Create hexagon at center
      hexagon = new Hexagon(canvas.width / 2, canvas.height / 2, HEXAGON_RADIUS);
      
      // Create balls at center
      for (let i = 0; i < NUM_BALLS; i++) {
        balls.push(new Ball(canvas.width / 2, canvas.height / 2));
      }
      
      // Set interval to flip gravity every 5 seconds
      setInterval(() => {
        gravityDirection *= -1;
      }, GRAVITY_FLIP_INTERVAL);
      
      // Start animation loop
      lastTime = performance.now();
      requestAnimationFrame(animate);
    }

    // Resize canvas to window
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Update hexagon center if already created
      if (hexagon) {
        hexagon.x = canvas.width / 2;
        hexagon.y = canvas.height / 2;
      }
    }

    // Animation loop
    function animate(currentTime) {
      // Calculate time delta
      const dt = Math.min(20, currentTime - lastTime); // cap at 20ms to avoid big jumps
      lastTime = currentTime;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update hexagon
      hexagon.update(dt);
      
      // Apply gravity and update each ball
      const gravity = gravityDirection * GRAVITY_CONSTANT;
      balls.forEach(ball => {
        ball.applyForce(0, gravity);
        ball.update(dt);
      });
      
      // Get hexagon vertices
      const vertices = hexagon.getVertices();
      
      // Check collisions for each ball with hexagon edges
      balls.forEach(ball => {
        for (let i = 0; i < 6; i++) {
          const p1 = vertices[i];
          const p2 = vertices[(i + 1) % 6];
          checkBallLineCollision(ball, p1, p2);
        }
      });
      
      // Check ball-ball collisions
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          checkBallBallCollision(balls[i], balls[j]);
        }
      }
      
      // Draw hexagon and balls
      hexagon.draw();
      balls.forEach(ball => ball.draw());
      
      // Continue animation
     

---
*Generated by OpenRouter CLI*