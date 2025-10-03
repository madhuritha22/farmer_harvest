import { Farmer } from './Farmer.js';
import { Crop } from './Crop.js';
import { PowerUp } from './PowerUp.js';
import { Scarecrow, Crow } from './Obstacle.js';
import { Input } from './input.js';
import { WIDTH as GAME_WIDTH, HEIGHT as GAME_HEIGHT, TILE as GAME_TILE, clamp as gameClamp, aabb as gameAabb } from './Utils.js'; // G3: Import utils; alias to avoid conflicts with statics.

/**
 * Game class manages the overall game state and loop.
 */
export class Game {
    /**
     * Game configuration constants.
     */
    // G3: Removed static GAME_LEN and GOAL; now loaded from config.json.
    static WIDTH = GAME_WIDTH;
    static HEIGHT = GAME_HEIGHT;
    static TILE = GAME_TILE;    // for a subtle grid
    static clamp = gameClamp;
    static aabb = gameAabb;

    /**
     * Game state enumeration.
     */
    static State = Object.freeze({
        MENU: "MENU",
        PLAYING: "PLAYING",
        PAUSED: "PAUSED",
        GAME_OVER: "GAME_OVER",
        WIN: "WIN"
    });

    /**
     * Utility function to clamp values.
     * @param {number} v - Value to clamp.
     * @param {number} lo - Lower bound.
     * @param {number} hi - Upper bound.
     * @returns {number} Clamped value.
     */
    static clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

    /**
     * Utility function for axis-aligned bounding box collision.
     * @param {{x: number, y: number, w: number, h: number}} a - First rect.
     * @param {{x: number, y: number, w: number, h: number}} b - Second rect.
     * @returns {boolean} True if colliding.
     */
    static aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

    /**
     * Creates a new Game instance.
     * @param {HTMLCanvasElement} canvas - The game canvas element.
     */
    constructor(canvas) {
        if (!canvas) {
            console.error("Canvas #game not found. Check index.html IDs.");
            return;
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.state = Game.State.MENU;

        // G1: Added level tracking, starts at 1, max 3 levels.
        this.level = 1;

        // G3: Config from external JSON.
        this.config = null;
        // G3: Total required score for win (cumulative across levels).
        this.requiredScore = 0;
        // G3: Current max time for clamp.
        this.maxTime = 0;

        // world
        this.player = new Farmer(Game.WIDTH / 2 - 17, Game.HEIGHT - 80);
        this.crops = [];
        this.obstacles = [];
        // Q2.c: Added powerUps array for power-up entities.
        this.powerUps = [];
        // Q2.d: Separate crows from static obstacles for movement logic.
        this.crows = [];

        // timing
        this.lastTime = 0;
        this.timeLeft = 0; // G3: Initialized to 0; set from config.
        this.spawnEvery = 0; // G3: Set from config.
        this._accumSpawn = 0;
        // Q2.c: Spawn rate for power-ups (less frequent).
        this.powerUpSpawnEvery = 0; // G3: Set from config.
        this._accumPowerUpSpawn = 0;
        // Q2.d: Spawn rate for crows (moderate frequency).
        this.crowSpawnEvery = 0; // G3: Set from config.
        this._accumCrowSpawn = 0;

        // score & goal
        this.score = 0;
        this.goal = 0; // G3: Total required for UI; set from config.

        // input & resize
        this.input = new Input(this);
        // Q1.b: .bind(this) is required here for the resize event listener because onResize is a regular instance method; without it, 'this' in onResize would bind dynamically to window, not the Game instance. An arrow function would provide lexical binding, but .bind allows the method to retain its original dynamic nature while fixing the context for the callback.
        this._onResize = this.onResize.bind(this);
        // Q1.c: Similar to key events, the bound resize listener ensures 'this' in the callback method is the Game instance, preventing loss of context in event handling.
        window.addEventListener("resize", this._onResize);

        // UI
        const get = id => document.getElementById(id) || console.error(`#${id} not found`);
        this.ui = {
            score: get("score"),
            time: get("time"),
            goal: get("goal"),
            status: get("status"),
            start: get("btnStart"),
            reset: get("btnReset"),
            // G1: Added level UI element (assume <strong id="level">1</strong> added to HTML next to goal).
            level: get("level"),
        };
        if (this.ui.goal) this.ui.goal.textContent = String(this.goal);
        if (this.ui.start) this.ui.start.addEventListener("click", () => this.start()); // arrow keeps `this`
        if (this.ui.reset) this.ui.reset.addEventListener("click", () => this.reset());

        // RAF loop as arrow function → lexical `this`
        // Q1.c: In the requestAnimationFrame (RAF) loop, the arrow function for tick ensures 'this' is lexically bound to the Game instance from the constructor scope, avoiding the default dynamic binding which would set 'this' to window/undefined in non-strict mode.
        this.tick = (ts) => {
            const dt = Math.min((ts - this.lastTime) / 1000, 0.033); // ~30ms cap
            this.lastTime = ts;
            this.update(dt);
            this.render();
            requestAnimationFrame(this.tick);
        };
    }

    /**
     * Handles window resize events.
     */
    onResize() {
        // fixed canvas size for simplicity; handle DPR here if desired
    }

    /**
     * Starts or resumes the game (loads config on first start).
     */
    start() {
        if (this.state === Game.State.PAUSED) {
            this.state = Game.State.PLAYING;
            if (this.ui.status) this.ui.status.textContent = "Playing…";
            return;
        }
        // G3: Load config asynchronously at game start.
        fetch('config.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(config => {
                this.config = config;
                this.resetWithConfig(config);
                this.state = Game.State.PLAYING;
                if (this.ui.status) this.ui.status.textContent = "Playing…";
                requestAnimationFrame(this.tick);
            })
            .catch(error => {
                console.error('Failed to load config.json:', error);
                // G3: Fallback to hardcoded defaults.
                this.config = {
                    levels: [
                        { goal: 15, timeLimit: 60, spawnEvery: 0.8, crowSpawnEvery: 5, powerUpSpawnEvery: 10, numScarecrows: 2 },
                        { goal: 20, timeLimit: 55, spawnEvery: 0.6, crowSpawnEvery: 4, powerUpSpawnEvery: 8, numScarecrows: 3 },
                        { goal: 25, timeLimit: 50, spawnEvery: 0.4, crowSpawnEvery: 3, powerUpSpawnEvery: 6, numScarecrows: 4 }
                    ]
                };
                this.resetWithConfig(this.config);
                this.state = Game.State.PLAYING;
                if (this.ui.status) this.ui.status.textContent = "Playing… (using defaults)";
                requestAnimationFrame(this.tick);
            });
    }

    /**
     * G3: Resets the game using the loaded config.
     * @param {Object} config - The parsed JSON config.
     */
    resetWithConfig(config) {
        this.state = Game.State.MENU;
        // G1: Reset to level 1.
        this.level = 1;
        this.player = new Farmer(Game.WIDTH / 2 - 17, Game.HEIGHT - 80);
        this.crops.length = 0;
        this.obstacles.length = 0;
        // Q2.c: Reset power-ups on game reset.
        this.powerUps.length = 0;
        // Q2.d: Reset crows on game reset.
        this.crows.length = 0;
        this.score = 0;
        // G3: Set initial required score and goal from config level 0.
        this.requiredScore = config.levels[0].goal;
        this.goal = this.requiredScore;
        // G3: Set initial timing from config.
        this.timeLeft = config.levels[0].timeLimit;
        this.maxTime = config.levels[0].timeLimit;
        this.spawnEvery = config.levels[0].spawnEvery;
        this.crowSpawnEvery = config.levels[0].crowSpawnEvery;
        this.powerUpSpawnEvery = config.levels[0].powerUpSpawnEvery;
        this._accumSpawn = 0;
        this._accumPowerUpSpawn = 0;
        this._accumCrowSpawn = 0;
        this.lastTime = performance.now();
        // G3: Place initial scarecrows from config.
        const initialConfig = config.levels[0];
        for (let i = 0; i < initialConfig.numScarecrows; i++) {
            const gx = Math.floor(Math.random() * ((Game.WIDTH - 2 * Game.TILE) / Game.TILE)) * Game.TILE + Game.TILE;
            const gy = Math.floor(Math.random() * ((Game.HEIGHT - 2 * Game.TILE) / Game.TILE)) * Game.TILE + Game.TILE;
            this.obstacles.push(new Scarecrow(gx, gy));
        }
        this.syncUI();
        if (this.ui.status) this.ui.status.textContent = "Menu";
    }

    /**
     * Resets to menu (assumes config already loaded).
     */
    // G3: Simplified reset; now uses resetWithConfig via button listener.
    reset() {
        if (this.config) {
            this.resetWithConfig(this.config);
        } else {
            // Fallback if config not loaded (rare).
            this.start(); // Triggers load.
        }
    }

    /**
     * Toggles pause state.
     */
    togglePause() {
        if (this.state === Game.State.PLAYING) {
            this.state = Game.State.PAUSED;
            if (this.ui.status) this.ui.status.textContent = "Paused";
        } else if (this.state === Game.State.PAUSED) {
            this.state = Game.State.PLAYING;
            if (this.ui.status) this.ui.status.textContent = "Playing…";
        }
    }

    /**
     * Synchronizes UI elements with game state.
     */
    syncUI() {
        if (this.ui.score) this.ui.score.textContent = String(this.score);
        if (this.ui.time) this.ui.time.textContent = Math.ceil(this.timeLeft);
        if (this.ui.goal) this.ui.goal.textContent = String(this.goal);
        // G1: Update level display.
        if (this.ui.level) this.ui.level.textContent = String(this.level);
    }

    /**
     * G1: Advances to the next level with increased difficulty.
     */
    advanceLevel() {
        // Increment level (max 3).
        if (this.level >= 3) return;
        this.level++;
        // Reset time and dynamic entities for new round.
        this.timeLeft = this.config.levels[this.level - 1].timeLimit;
        this.maxTime = this.timeLeft;
        this.crops.length = 0;
        this.powerUps.length = 0;
        this.crows.length = 0;
        this._accumSpawn = 0;
        this._accumPowerUpSpawn = 0;
        this._accumCrowSpawn = 0;
        // G3: Update difficulty from config.
        const levelConfig = this.config.levels[this.level - 1];
        this.spawnEvery = levelConfig.spawnEvery;
        this.crowSpawnEvery = levelConfig.crowSpawnEvery;
        this.powerUpSpawnEvery = levelConfig.powerUpSpawnEvery;
        // G3: Add to required score for this level.
        this.requiredScore += levelConfig.goal;
        this.goal = this.requiredScore;
        // Add more static obstacles (scarecrows).
        this.obstacles = [];
        for (let i = 0; i < levelConfig.numScarecrows; i++) {
            const gx = Math.floor(Math.random() * ((Game.WIDTH - 2 * Game.TILE) / Game.TILE)) * Game.TILE + Game.TILE;
            const gy = Math.floor(Math.random() * ((Game.HEIGHT - 2 * Game.TILE) / Game.TILE)) * Game.TILE + Game.TILE;
            this.obstacles.push(new Scarecrow(gx, gy));
        }
        this.syncUI();
        // G1: Update status to reflect new level.
        if (this.ui.status) this.ui.status.textContent = `Level ${this.level} - Playing…`;
    }

    /**
     * Spawns a new random crop.
     */
    spawnCrop() {
        const gx = Math.floor(Math.random() * ((Game.WIDTH - 2 * Game.TILE) / Game.TILE)) * Game.TILE + Game.TILE;
        const gy = Math.floor(Math.random() * ((Game.HEIGHT - 2 * Game.TILE) / Game.TILE)) * Game.TILE + Game.TILE;
        // Q2.a: Randomly select crop type for varied points.
        const types = ["wheat", "pumpkin", "golden_apple"];
        const type = types[Math.floor(Math.random() * types.length)];
        this.crops.push(new Crop(gx, gy, type));
    }

    /**
     * Spawns a new power-up.
     */
    // Q2.c: Added method to spawn power-up.
    spawnPowerUp() {
        const gx = Math.floor(Math.random() * ((Game.WIDTH - 2 * Game.TILE) / Game.TILE)) * Game.TILE + Game.TILE;
        const gy = Math.floor(Math.random() * ((Game.HEIGHT - 2 * Game.TILE) / Game.TILE)) * Game.TILE + Game.TILE;
        this.powerUps.push(new PowerUp(gx, gy));
    }

    /**
     * Spawns a new crow.
     */
    // Q2.d: Added method to spawn crow.
    spawnCrow() {
        const gx = Math.floor(Math.random() * ((Game.WIDTH - 2 * Game.TILE) / Game.TILE)) * Game.TILE + Game.TILE;
        const gy = Math.floor(Math.random() * ((Game.HEIGHT - 2 * Game.TILE) / Game.TILE)) * Game.TILE + Game.TILE;
        this.crows.push(new Crow(gx, gy));
    }

    /**
     * Updates game logic (timing, spawning, collisions).
     * @param {number} dt - Delta time in seconds.
     */
    update(dt) {
        if (this.state !== Game.State.PLAYING) return;

        // countdown
        // G3: Clamp using current maxTime from config.
        this.timeLeft = Game.clamp(this.timeLeft - dt, 0, this.maxTime);
        if (this.timeLeft <= 0) {
            // G1: Time up always ends game, regardless of level.
            this.state = Game.State.GAME_OVER;
            if (this.ui.status) this.ui.status.textContent = "Game Over";
            this.syncUI();
            return;
        }

        // player
        this.player.handleInput(this.input);
        this.player.update(dt, this);

        // spawn crops
        this._accumSpawn += dt;
        while (this._accumSpawn >= this.spawnEvery) {
            this._accumSpawn -= this.spawnEvery;
            this.spawnCrop();
        }

        // Q2.c: Spawn power-ups periodically.
        this._accumPowerUpSpawn += dt;
        while (this._accumPowerUpSpawn >= this.powerUpSpawnEvery) {
            this._accumPowerUpSpawn -= this.powerUpSpawnEvery;
            this.spawnPowerUp();
        }

        // Q2.d: Spawn crows periodically.
        this._accumCrowSpawn += dt;
        while (this._accumCrowSpawn >= this.crowSpawnEvery) {
            this._accumCrowSpawn -= this.crowSpawnEvery;
            this.spawnCrow();
        }

        // collect crops
        // Q1.a: Arrow function in filter; 'this' is lexically bound to the surrounding Game scope, so this.player refers to the Game's player instance without needing bind (unlike regular functions, where 'this' would be undefined or global).
        const collected = this.crops.filter(c => Game.aabb(this.player, c));     // arrow #1
        if (collected.length) {
            // Q1.a: Arrow function in forEach; lexical 'this' ensures access to Game's properties (e.g., score) remains instance-bound.
            collected.forEach(c => c.dead = true);                             // arrow #2
            // Q2.a: Sum points from collected crops instead of fixed +1.
            const addedPoints = collected.reduce((sum, c) => sum + c.points, 0);
            this.score += addedPoints;
            if (this.ui.score) this.ui.score.textContent = String(this.score);
            // G1: Check for level advance or win after adding points.
            if (this.score >= this.goal) {
                if (this.level < 3) {
                    this.advanceLevel();
                } else {
                    this.state = Game.State.WIN;
                    if (this.ui.status) this.ui.status.textContent = "You Win!";
                }
            }
        }
        // Q1.a: Arrow function in filter; changes 'this' binding to lexical (Game), preventing loss of context in array methods.
        this.crops = this.crops.filter(c => !c.dead);                        // arrow #3
        // Q1.a: Arrow function in forEach; 'this' (passed as game arg) is lexical, but the callback itself uses lexical binding for any internal references.
        this.crops.forEach(c => c.update(dt, this));                         // arrow #4

        // Q2.c: Collect power-ups.
        const collectedPowerUps = this.powerUps.filter(p => Game.aabb(this.player, p));
        collectedPowerUps.forEach(p => {
            p.dead = true;
            this.player.applySpeedBoost(5); // 5-second boost
        });
        this.powerUps = this.powerUps.filter(p => !p.dead);
        this.powerUps.forEach(p => p.update(dt, this));

        // Q2.d: Update crows and check collisions (penalize score).
        this.crows.forEach(crow => crow.update(dt, this));
        const hitCrows = this.crows.filter(crow => Game.aabb(this.player, crow));
        if (hitCrows.length > 0) {
            this.score = Math.max(0, this.score - 2 * hitCrows.length); // Lose 2 points per crow
            hitCrows.forEach(crow => crow.dead = true);
            if (this.ui.score) this.ui.score.textContent = String(this.score);
        }
        this.crows = this.crows.filter(crow => !crow.dead);

        // timer UI
        if (this.ui.time) this.ui.time.textContent = Math.ceil(this.timeLeft);
    }

    /**
     * Renders the game scene.
     */
    render() {
        const ctx = this.ctx;
        if (!ctx) return;

        ctx.clearRect(0, 0, Game.WIDTH, Game.HEIGHT);

        // field background (grid)
        ctx.fillStyle = "#dff0d5";
        ctx.fillRect(0, 0, Game.WIDTH, Game.HEIGHT);
        ctx.strokeStyle = "#c7e0bd";
        ctx.lineWidth = 1;
        for (let y = Game.TILE; y < Game.HEIGHT; y += Game.TILE) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(Game.WIDTH, y); ctx.stroke();
        }
        for (let x = Game.TILE; x < Game.WIDTH; x += Game.TILE) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, Game.HEIGHT); ctx.stroke();
        }

        // crops, obstacles, farmer
        // Q1.a: Arrow function in forEach; lexical binding keeps 'this' as Game, allowing ctx access without rebinding.
        this.crops.forEach(c => c.draw(ctx));                                 // arrow #5
        this.obstacles.forEach(o => o.draw(ctx));                             // arrow #6
        // Q2.c: Render power-ups.
        this.powerUps.forEach(p => p.draw(ctx));
        // Q2.d: Render crows.
        this.crows.forEach(crow => crow.draw(ctx));
        this.player.draw(ctx);

        // state labels
        ctx.fillStyle = "#333";
        ctx.font = "16px system-ui, sans-serif";
        if (this.state === Game.State.MENU) {
            ctx.fillText("Press Start to play", 20, 28);
        } else if (this.state === Game.State.PAUSED) {
            ctx.fillText("Paused (press P to resume)", 20, 28);
        } else if (this.state === Game.State.GAME_OVER) {
            ctx.fillText("Time up! Press Reset to return to Menu", 20, 28);
        } else if (this.state === Game.State.WIN) {
            ctx.fillText("Harvest complete! Press Reset for another round", 20, 28);
        }
        // G1: Draw current level on screen.
        ctx.fillText(`Level ${this.level}`, 20, 50);
    }

    /**
     * Cleans up resources.
     */
    dispose() {
        this.input.dispose();
        window.removeEventListener("resize", this._onResize);
    }
}