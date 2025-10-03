# OpenRouter API Response

## Metadata
- **Model**: anthropic/claude-opus-4.1
- **Timestamp**: 2025-10-02T23:14:33.438Z
- **Duration**: 6.985 seconds

## Token Usage
- **Prompt Tokens**: 59
- **Completion Tokens**: 2505
- **Total Tokens**: 2564

## Prompt
```
In a single HTML file named index.html, create a 3d simulation of 200 dominoes arranged in a spiral. The outermost domino falls, triggering a satisfying, cascading chain reaction towards the center. No interactions. 

```

## Response
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Domino Spiral</title>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            background: linear-gradient(to bottom, #2a2a3e, #16161d);
        }
        canvas {
            display: block;
        }
    </style>
</head>
<body>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script>
        // Scene setup
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x16161d, 50, 200);
        
        const camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);
        
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a2e,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
        
        // Domino class
        class Domino {
            constructor(x, z, angle, index) {
                this.index = index;
                this.fallen = false;
                this.fallStartTime = null;
                this.fallDuration = 0.3;
                
                // Create domino geometry
                const geometry = new THREE.BoxGeometry(0.5, 3, 1.5);
                const material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color().setHSL((index / 200) * 0.8, 0.7, 0.5),
                    metalness: 0.2,
                    roughness: 0.3
                });
                
                this.mesh = new THREE.Mesh(geometry, material);
                this.mesh.position.set(x, 1.5, z);
                this.mesh.rotation.y = angle;
                this.mesh.castShadow = true;
                this.mesh.receiveShadow = true;
                
                // Store initial rotation for falling animation
                this.initialRotation = {
                    x: 0,
                    y: angle,
                    z: 0
                };
                
                // Calculate fall direction (towards next domino)
                this.fallDirection = angle + Math.PI / 2;
                
                scene.add(this.mesh);
            }
            
            startFalling(currentTime) {
                if (!this.fallen) {
                    this.fallen = true;
                    this.fallStartTime = currentTime;
                }
            }
            
            update(currentTime) {
                if (this.fallen && this.fallStartTime !== null) {
                    const elapsed = currentTime - this.fallStartTime;
                    const progress = Math.min(elapsed / this.fallDuration, 1);
                    
                    // Easing function for realistic fall
                    const easeProgress = 1 - Math.cos(progress * Math.PI / 2);
                    
                    // Rotate domino to fall
                    const fallAngle = easeProgress * (Math.PI / 2 - 0.1);
                    this.mesh.rotation.x = this.initialRotation.x + 
                        Math.cos(this.fallDirection) * fallAngle;
                    this.mesh.rotation.z = this.initialRotation.z + 
                        Math.sin(this.fallDirection) * fallAngle;
                    
                    // Adjust Y position as domino falls
                    this.mesh.position.y = 1.5 * Math.cos(fallAngle);
                    
                    return progress >= 0.3; // Return true when ready to trigger next
                }
                return false;
            }
        }
        
        // Create spiral of dominoes
        const dominoes = [];
        const numDominoes = 200;
        const spiralTurns = 4;
        const maxRadius = 40;
        const minRadius = 3;
        
        for (let i = 0; i < numDominoes; i++) {
            const t = i / (numDominoes - 1);
            const angle = t * spiralTurns * Math.PI * 2;
            const radius = maxRadius - (maxRadius - minRadius) * t;
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Calculate tangent angle for domino orientation
            const nextT = Math.min(1, (i + 1) / (numDominoes - 1));
            const nextAngle = nextT * spiralTurns * Math.PI * 2;
            const nextRadius = maxRadius - (maxRadius - minRadius) * nextT;
            const nextX = Math.cos(nextAngle) * nextRadius;
            const nextZ = Math.sin(nextAngle) * nextRadius;
            
            const dominoAngle = Math.atan2(nextZ - z, nextX - x);
            
            dominoes.push(new Domino(x, z, dominoAngle, i));
        }
        
        // Camera positioning
        camera.position.set(60, 60, 60);
        camera.lookAt(0, 0, 0);
        
        // Animation variables
        let startTime = Date.now();
        let chainReactionStarted = false;
        let lastTriggeredIndex = -1;
        const triggerDelay = 30; // ms between domino triggers
        let lastTriggerTime = 0;
        
        // Start the chain reaction after 1 second
        setTimeout(() => {
            chainReactionStarted = true;
            dominoes[0].startFalling(Date.now());
            lastTriggeredIndex = 0;
            lastTriggerTime = Date.now();
        }, 1000);
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            const currentTime = Date.now();
            
            // Update camera position for dynamic view
            const elapsed = (currentTime - startTime) * 0.001;
            const cameraRadius = 70;
            camera.position.x = Math.cos(elapsed * 0.2) * cameraRadius;
            camera.position.z = Math.sin(elapsed * 0.2) * cameraRadius;
            camera.position.y = 40 + Math.sin(elapsed * 0.3) * 20;
            camera.lookAt(0, 0, 0);
            
            // Update dominoes
            dominoes.forEach((domino, index) => {
                const shouldTriggerNext = domino.update(currentTime);
                
                // Trigger next domino in chain
                if (chainReactionStarted && 
                    shouldTriggerNext && 
                    index === lastTriggeredIndex && 
                    index < dominoes.length - 1 &&
                    currentTime - lastTriggerTime > triggerDelay) {
                    
                    dominoes[index + 1].startFalling(currentTime);
                    lastTriggeredIndex = index + 1;
                    lastTriggerTime = currentTime;
                }
            });
            
            renderer.render(scene, camera);
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        animate();
    </script>
</body>
</html>
```

This creates a mesmerizing 3D domino spiral simulation with:

1. **200 dominoes** arranged in a spiral pattern from outside to center
2. **Automatic chain reaction** that starts after 1 second
3. **Realistic physics-like falling animation** with proper rotation and easing
4. **Dynamic camera** that slowly orbits around the scene
5. **Beautiful gradient coloring** that shifts through the spectrum along the spiral
6. **Shadows and lighting** for depth and realism
7. **No user interaction required** - just watch the satisfying cascade

The dominoes fall sequentially from the outermost one, creating a hypnotic wave that spirals inward. Each domino is colored based on its position in the spiral, creating a rainbow effect. The camera automatically rotates around the scene to provide the best viewing angles of the chain reaction.

---
*Generated by OpenRouter CLI*