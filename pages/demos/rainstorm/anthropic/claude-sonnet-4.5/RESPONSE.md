# OpenRouter API Response

## Metadata
- **Model**: anthropic/claude-sonnet-4.5
- **Timestamp**: 2025-10-02T14:14:38.386Z
- **Duration**: 21.568 seconds

## Token Usage
- **Prompt Tokens**: 33
- **Completion Tokens**: 1638
- **Total Tokens**: 1671

## Prompt
```
In a single HTML file named index.html, create a cool raining and thunder animation. No controls no interactiveness.

```

## Response
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rain and Thunder Animation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            overflow: hidden;
        }

        body {
            background: linear-gradient(to bottom, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            width: 100vw;
            height: 100vh;
            position: relative;
        }

        .rain-container {
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 1;
        }

        .rain {
            position: absolute;
            width: 2px;
            height: 60px;
            background: linear-gradient(to bottom, transparent, rgba(174, 194, 224, 0.6), rgba(174, 194, 224, 0.3));
            animation: fall linear infinite;
            opacity: 0.7;
        }

        @keyframes fall {
            to {
                transform: translateY(100vh);
            }
        }

        .lightning {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            z-index: 2;
            opacity: 0;
            pointer-events: none;
        }

        .lightning.flash {
            animation: flash 0.3s ease-in-out;
        }

        @keyframes flash {
            0% { opacity: 0; }
            10% { opacity: 0.8; }
            20% { opacity: 0; }
            30% { opacity: 0.9; }
            40% { opacity: 0; }
            100% { opacity: 0; }
        }

        .cloud {
            position: absolute;
            background: rgba(50, 50, 70, 0.7);
            border-radius: 100px;
            z-index: 0;
            animation: drift linear infinite;
        }

        .cloud::before,
        .cloud::after {
            content: '';
            position: absolute;
            background: rgba(50, 50, 70, 0.7);
            border-radius: 100px;
        }

        .cloud1 {
            width: 200px;
            height: 60px;
            top: 10%;
            left: -200px;
            animation-duration: 45s;
        }

        .cloud1::before {
            width: 100px;
            height: 60px;
            top: -30px;
            left: 40px;
        }

        .cloud1::after {
            width: 120px;
            height: 60px;
            top: -20px;
            left: 100px;
        }

        .cloud2 {
            width: 250px;
            height: 70px;
            top: 20%;
            left: -250px;
            animation-duration: 60s;
            animation-delay: 5s;
        }

        .cloud2::before {
            width: 120px;
            height: 70px;
            top: -35px;
            left: 50px;
        }

        .cloud2::after {
            width: 140px;
            height: 70px;
            top: -25px;
            left: 120px;
        }

        .cloud3 {
            width: 180px;
            height: 50px;
            top: 5%;
            left: -180px;
            animation-duration: 50s;
            animation-delay: 15s;
        }

        .cloud3::before {
            width: 90px;
            height: 50px;
            top: -25px;
            left: 35px;
        }

        .cloud3::after {
            width: 100px;
            height: 50px;
            top: -18px;
            left: 90px;
        }

        @keyframes drift {
            from {
                left: -300px;
            }
            to {
                left: 110%;
            }
        }
    </style>
</head>
<body>
    <div class="cloud cloud1"></div>
    <div class="cloud cloud2"></div>
    <div class="cloud cloud3"></div>
    
    <div class="rain-container" id="rainContainer"></div>
    <div class="lightning" id="lightning"></div>

    <script>
        // Create rain drops
        const rainContainer = document.getElementById('rainContainer');
        const numberOfDrops = 150;

        for (let i = 0; i < numberOfDrops; i++) {
            const drop = document.createElement('div');
            drop.classList.add('rain');
            drop.style.left = Math.random() * 100 + '%';
            drop.style.animationDuration = (Math.random() * 0.5 + 0.5) + 's';
            drop.style.animationDelay = Math.random() * 2 + 's';
            drop.style.height = (Math.random() * 40 + 40) + 'px';
            rainContainer.appendChild(drop);
        }

        // Lightning effect
        const lightning = document.getElementById('lightning');
        
        function triggerLightning() {
            lightning.classList.add('flash');
            setTimeout(() => {
                lightning.classList.remove('flash');
            }, 300);
            
            // Random interval between 2-8 seconds
            const nextFlash = Math.random() * 6000 + 2000;
            setTimeout(triggerLightning, nextFlash);
        }

        // Start lightning after 2 seconds
        setTimeout(triggerLightning, 2000);
    </script>
</body>
</html>
```

This HTML file creates a cool rain and thunder animation with:

- **Rain**: 150 animated raindrops falling at varying speeds and positions
- **Lightning**: Random flashing effects that occur every 2-8 seconds with a realistic double-flash pattern
- **Clouds**: Three animated clouds drifting across the sky at different speeds
- **Dark stormy sky**: A gradient background creating a nighttime storm atmosphere

The animation runs automatically with no controls or interactivity needed. Just open the file in a browser and enjoy the storm!

---
*Generated by OpenRouter CLI*