# Farmer Harvest Game

## Introduction

This is a fun, simple farming game where you harvest crops, avoid obstacles, and earn points.  
The game has been enhanced with new features such as **multiple crop types**, **power-ups**, and **increased difficulty**.

---

## How to Open and Play the Game

To start playing:

1. Download the game files (in a zip format) and extract them to your local computer.
2. Open the `index.html` file in your browser to start the game.
3. Alternatively, you can serve the game locally using Python:
   - Open the folder containing the game in Command Prompt (cmd) or VSCode.
   - Run the following command in the terminal:
     ```bash
     py -m http.server 8000
     ```

---

## Features in the Game

Here’s a breakdown of the new features:

### 1. Different Crop Types with Points System

- The game now includes **wheat, pumpkin, and golden apple** as crops.
- Each crop has a distinct point value:
  - 🌾 Wheat = **1 point**
  - 🎃 Pumpkin = **3 points**
  - 🍏 Golden Apple = **5 points**

### 2. Power-Up Mechanic

- Added power-ups (e.g., **speed boost**) to make gameplay more dynamic and exciting.

### 3. Increased Crow Spawning Rate

- In `config.js`, the crow spawning rate increases as you level up.
- More crows appear at higher levels, making the game more challenging.

---

## Project Structure

The game has been refactored into **ES6 modules** for better organization and maintainability:

- **Game.js** → Handles game logic and control flow.
- **Farmer.js** → Defines the player character and interactions.
- **Crop.js** → Manages crop types and behaviors.
- **Obstacle.js** (optional) → Enables obstacles such as crows.
- **config.js** → Stores game settings (spawn rates, movement speed, etc.).

---

## How Arrow Functions, `this`, and `bind` Are Used

### Arrow Functions

In `Game.js`, arrow functions are used for callbacks to maintain the correct `this` context.  
Example:

```javascript
this.tick = (ts) => {
  // update and render logic
  this.update(dt);
  this.render();
};
```

The arrow function ensures that this inside tick is bound to the Game class instance, allowing access to properties like the player and the crops. Without using an arrow function, this would default to the global object (or undefined in strict mode), breaking access to game data.

## Why Bind preferred Over Arrows Sometimes

In the Input class, I use bind for event handling because it provides flexibility. Specifically, when setting up the keydown event listener, I use .bind(this):
this.\_onKeyDown = this.onKeyDown.bind(this);
window.addEventListener("keydown", this.\_onKeyDown);
This is preferable to using an arrow function because bind ensures that the original method (onKeyDown) can be reused elsewhere while preserving its this context. Using an arrow function here would tie the method to the closure, making it harder to pass around as a reference and adding unnecessary closure overhead.

## Conclusion

This refactoring makes the game more modular and maintainable, with separate files for different components. The use of arrow functions and bind ensures that event handlers and callbacks work smoothly, while the addition of new crops, power-ups, and difficulty settings enhances the gameplay experience.
Enjoy the game, and feel free to explore and modify the code!
