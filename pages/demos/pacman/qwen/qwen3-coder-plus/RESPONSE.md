# OpenRouter API Response

## Metadata
- **Model**: qwen/qwen3-coder-plus
- **Timestamp**: 2025-10-02T12:47:21.162Z
- **Duration**: 27.681 seconds

## Token Usage
- **Prompt Tokens**: 35
- **Completion Tokens**: 2000
- **Total Tokens**: 2035

## Prompt
```
In a single HTML file named index.html, create exact copy of the PAC-MAN game in one html file using css and js.

```

## Response
# Pac-Man Game Implementation

I'll create a complete Pac-Man game in a single HTML file with all the classic elements: maze, dots, power pellets, ghosts, and scoring.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pac-Man Game</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            font-family: 'Courier New', monospace;
            overflow: hidden;
        }
        
        .game-container {
            position: relative;
            width: 560px;
            text-align: center;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            padding: 10px 20px;
            background: #0d0d1a;
            color: #ffcc00;
            border: 4px solid #333366;
            border-radius: 10px;
            margin-bottom: 15px;
            box-shadow: 0 0 15px rgba(0, 0, 255, 0.5);
        }
        
        .score-panel {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 2px;
        }
        
        .lives-panel {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .life {
            width: 20px;
            height: 20px;
            background: #ffcc00;
            border-radius: 50%;
            clip-path: polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%);
        }
        
        #game-board {
            position: relative;
            width: 560px;
            height: 620px;
            background: #000;
            border: 4px solid #333366;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 255, 0.7);
            overflow: hidden;
        }
        
        .wall {
            position: absolute;
            background: #2233aa;
            border: 1px solid #4455cc;
            border-radius: 4px;
        }
        
        .dot {
            position: absolute;
            width: 6px;
            height: 6px;
            background: #ffcc00;
            border-radius: 50%;
            transform: translate(-50%, -50%);
        }
        
        .power-pellet {
            position: absolute;
            width: 12px;
            height: 12px;
            background: #ffcc00;
            border-radius: 50%;
            animation: pulse 0.5s infinite alternate;
            transform: translate(-50%, -50%);
        }
        
        @keyframes pulse {
            from { transform: scale(1) translate(-50%, -50%); }
            to { transform: scale(1.3) translate(-50%, -50%); }
        }
        
        #pacman {
            position: absolute;
            width: 24px;
            height: 24px;
            background: #ffcc00;
            border-radius: 50%;
            clip-path: polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%);
            transition: transform 0.1s;
            z-index: 10;
        }
        
        .ghost {
            position: absolute;
            width: 24px;
            height: 24px;
            border-radius: 12px 12px 0 0;
            z-index: 5;
        }
        
        .ghost::before {
            content: '';
            position: absolute;
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            top: 6px;
        }
        
        .ghost::after {
            content: '';
            position: absolute;
            width: 4px;
            height: 4px;
            background: black;
            border-radius: 50%;
            top: 9px;
        }
        
        .ghost.blinky { background: #ff0000; }
        .ghost.pinky { background: #ffb8ff; }
        .ghost.inky { background: #00ffff; }
        .ghost.clyde { background: #ffb852; }
        
        .ghost.blinky::before { left: 4px; }
        .ghost.pinky::before { left: 4px; }
        .ghost.inky::before { left: 4px; }
        .ghost.clyde::before { left: 4px; }
        
        .ghost.blinky::after { left: 6px; }
        .ghost.pinky::after { left: 6px; }
        .ghost.inky::after { left: 6px; }
        .ghost.clyde::after { left: 6px; }
        
        .frightened {
            background: #2233aa !important;
            animation: flash 0.3s infinite;
        }
        
        @keyframes flash {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
        
        .controls {
            margin-top: 20px;
            color: #fff;
            background: rgba(0, 0, 50, 0.7);
            padding: 15px;
            border-radius: 10px;
            border: 2px solid #4455cc;
        }
        
        .controls h3 {
            color: #ffcc00;
            margin-bottom: 10px;
        }
        
        .keys {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 10px;
        }
        
        .key {
            width: 50px;
            height: 50px;
            background: #333366;
            border-radius: 8px;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #ffcc00;
            font-weight: bold;
            font-size: 20px;
            box-shadow: 0 4px 0 #222244;
        }
        
        .screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: rgba(0, 0, 30, 0.9);
            z-index: 20;
            color: white;
        }
        
        .hidden {
            display: none;
        }
        
        h1 {
            color: #ffcc00;
            font-size: 48px;
            margin-bottom: 20px;
            text-shadow: 0 0 10px rgba(255, 204, 0, 0.7);
        }
        
        h2 {
            color: #ffcc00;
            margin-bottom: 30px;
            font-size: 32px;
        }
        
        .btn {
            background: #ffcc00;
            color: #000;
            border: none;
            padding: 15px 40px;
            font-size: 20px;
            font-weight: bold;
            border-radius: 30px;
            cursor: pointer;
            margin: 10px;
            transition: all 0.3s;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .btn:hover {
            background: #ffdd55;
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
        }
        
        .instructions {
            max-width: 80%;
            line-height: 1.6;
            margin: 20px 0;
            color: #ccc;
        }
        
        .game-over-text {
            font-size: 60px;
            color: #ff3333;
            text

---
*Generated by OpenRouter CLI*