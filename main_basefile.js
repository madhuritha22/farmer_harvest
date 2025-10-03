// =========================
// Farmer Harvest — no libs
// =========================

// ---- Config & helpers ----
const WIDTH = 900, HEIGHT = 540;
const TILE = 30;           // for a subtle grid
const GAME_LEN = 60;       // seconds
const GOAL = 15;           // crops to win

const State = Object.freeze({ MENU: "MENU", PLAYING: "PLAYING", PAUSED: "PAUSED", GAME_OVER: "GAME_OVER", WIN: "WIN" });

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// ---- Base Entity ----
class Entity {
    constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; this.dead = false; }
    update(dt, game) { }
    draw(ctx) { }
}

// ---- Farmer (player) ----
class Farmer extends Entity {
    constructor(x, y) {
        super(x, y, 34, 34);
        this.speed = 260;
        this.vx = 0; this.vy = 0;
        this.color = "#8b5a2b";
        // Q2.c: Added baseSpeed to track original speed for power-up resets.
        this.baseSpeed = this.speed;
        // Q2.c: Power-up timer for speed boost duration.
        this.speedBoostEnd = 0;
    }
    handleInput(input) {
        const L = input.keys.has("ArrowLeft"), R = input.keys.has("ArrowRight");
        const U = input.keys.has("ArrowUp"), D = input.keys.has("ArrowDown");
        this.vx = (R - L) * this.speed;
        this.vy = (D - U) * this.speed;
        // Q1.c: In this method call (handleInput), 'this' is dynamically bound to the receiver object (Farmer instance) due to how the method is invoked on the instance.
    }
    // Q2.c: Added method to apply speed boost for a duration.
    applySpeedBoost(duration) {
        this.speed = this.baseSpeed * 1.5; // 50% boost
        this.speedBoostEnd = performance.now() / 1000 + duration;
    }
    update(dt, game) {
        // Q2.c: Check if speed boost is active and reset if expired.
        const now = performance.now() / 1000;
        if (now > this.speedBoostEnd) {
            this.speed = this.baseSpeed;
        }
        // try movement
        const oldX = this.x, oldY = this.y;
        this.x = clamp(this.x + this.vx * dt, 0, WIDTH - this.w);
        this.y = clamp(this.y + this.vy * dt, 0, HEIGHT - this.h);
        // block through obstacles
        const hitObs = game.obstacles.some(o => aabb(this, o));
        if (hitObs) { this.x = oldX; this.y = oldY; }
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = "#c28e0e";
        ctx.fillRect(this.x + 4, this.y - 6, this.w - 8, 8);        // hat brim
        ctx.fillRect(this.x + 10, this.y - 18, this.w - 20, 12);    // hat top
        // Q2.c: Visual indicator for active speed boost (glowing outline).
        if (performance.now() / 1000 < this.speedBoostEnd) {
            ctx.strokeStyle = "#ffff00";
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x, this.y, this.w, this.h);
        }
    }
}

// ---- Crop (collectible) ----
class Crop extends Entity {
    constructor(x, y, type = "wheat") {
        super(x, y, 20, 26);
        this.type = type;
        // Q2.a: Added point values for different crop types.
        this.points = { wheat: 1, pumpkin: 3, golden_apple: 5 }[type] || 1;
        this.sway = Math.random() * Math.PI * 2;
    }
    update(dt, game) { this.sway += dt * 2; }
    draw(ctx) {
        const { x, y, w, h } = this;
        // Q2.a: Different visuals and colors based on crop type.
        if (this.type === "pumpkin") {
            ctx.fillStyle = "#ff7518";
            ctx.beginPath();
            ctx.ellipse(x + w / 2, y + h / 2, 8, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#e65100";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y);
            ctx.lineTo(x + w / 2 - 4, y + 4);
            ctx.stroke();
        } else if (this.type === "golden_apple") {
            ctx.fillStyle = "#ffd700";
            ctx.beginPath();
            ctx.ellipse(x + w / 2, y + h / 2, 10, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#ff8c00";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y);
            ctx.lineTo(x + w / 2, y - 8);
            ctx.stroke();
        } else { // wheat
            ctx.strokeStyle = "#2f7d32";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y + h);
            ctx.quadraticCurveTo(x + w / 2 + Math.sin(this.sway) * 3, y + h / 2, x + w / 2, y);
            ctx.stroke();
            ctx.fillStyle = "#d9a441";
            ctx.beginPath();
            ctx.ellipse(x + w / 2, y, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ---- PowerUp (speed boost) ----
class PowerUp extends Entity {
    // Q2.c: New PowerUp class for speed boost collectible.
    constructor(x, y) {
        super(x, y, 16, 16);
        this.angle = Math.random() * Math.PI * 2;
    }
    update(dt, game) {
        this.angle += dt * 3;
    }
    draw(ctx) {
        const { x, y, w, h } = this;
        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
        ctx.fill();
        // Simple star-like points
        ctx.strokeStyle = "#ffed4e";
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const rad = (i * Math.PI * 2 / 5) + this.angle;
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y);
            ctx.lineTo(x + w / 2 + Math.cos(rad) * (w / 2 + 4), y + h / 2 + Math.sin(rad) * (w / 2 + 4));
            ctx.stroke();
        }
    }
}

// ---- Scarecrow (obstacle) ----
class Scarecrow extends Entity {
    constructor(x, y) { super(x, y, 26, 46); }
    draw(ctx) {
        const { x, y, w, h } = this;
        ctx.fillStyle = "#9b7653";
        ctx.fillRect(x + w / 2 - 3, y, 6, h); // pole
        ctx.fillStyle = "#c28e0e";
        ctx.beginPath(); ctx.arc(x + w / 2, y + 10, 10, 0, Math.PI * 2); ctx.fill(); // head
        ctx.strokeStyle = "#6b4f2a"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(x + w, y + 18); ctx.stroke(); // arms
    }
}

// ---- Crow (moving obstacle) ----
class Crow extends Entity {
    // Q2.d: New Crow class for moving obstacles that penalize on collision.
    constructor(x, y) {
        super(x, y, 20, 20);
        this.vx = (Math.random() - 0.5) * 100; // random direction
        this.vy = (Math.random() - 0.5) * 100;
        this.color = "#000";
    }
    update(dt, game) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        // Bounce off walls
        if (this.x <= 0 || this.x >= WIDTH - this.w) this.vx *= -1;
        if (this.y <= 0 || this.y >= HEIGHT - this.h) this.vy *= -1;
        // Q2.d: Remove if out of bounds (though bounce prevents this).
        if (this.dead) return;
    }
    draw(ctx) {
        const { x, y, w, h } = this;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 3, 0, 0, Math.PI * 2); // body
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h / 2);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w / 2, y + h / 4);
        ctx.fill(); // wing
    }
}

// ---- Input (uses .bind to control `this`) ----
class Input {
    constructor(game) {
        this.game = game;
        this.keys = new Set();
        // Q1.b: .bind(this) is required here for the keydown event listener because onKeyDown is a regular instance method; when passed as a callback to addEventListener, 'this' would otherwise dynamically bind to the event target (e.g., window/global), losing the Input instance context. An arrow function could lexically bind 'this' to Input, but .bind is used to explicitly preserve the dynamic binding to the instance while allowing the method to be reused.
        this._onKeyDown = this.onKeyDown.bind(this); // bind #1
        // Q1.b: .bind(this) is required here for the keyup event listener for the same reason as above: to ensure 'this' in onKeyUp refers to the Input instance, not the global object.
        this._onKeyUp = this.onKeyUp.bind(this);   // bind #2
        // Q1.c: In event listeners like keydown/keyup, the bound method ensures 'this' is explicitly bound to the class instance (Input), overriding the default dynamic binding which would set it to the event dispatcher.
        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);
    }
    onKeyDown(e) {
        if (e.key === "p" || e.key === "P") this.game.togglePause();
        this.keys.add(e.key);
    }
    onKeyUp(e) { this.keys.delete(e.key); }
    dispose() {
        window.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("keyup", this._onKeyUp);
    }
}

// ---- Game ----
class Game {
    constructor(canvas) {
        if (!canvas) {
            console.error("Canvas #game not found. Check index.html IDs.");
            return;
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.state = State.MENU;

        // world
        this.player = new Farmer(WIDTH / 2 - 17, HEIGHT - 80);
        this.crops = [];
        this.obstacles = [];
        // Q2.c: Added powerUps array for power-up entities.
        this.powerUps = [];
        // Q2.d: Separate crows from static obstacles for movement logic.
        this.crows = [];

        // timing
        this.lastTime = 0;
        this.timeLeft = GAME_LEN;
        this.spawnEvery = 0.8;
        this._accumSpawn = 0;
        // Q2.c: Spawn rate for power-ups (less frequent).
        this.powerUpSpawnEvery = 10;
        this._accumPowerUpSpawn = 0;
        // Q2.d: Spawn rate for crows (moderate frequency).
        this.crowSpawnEvery = 5;
        this._accumCrowSpawn = 0;

        // score & goal
        this.score = 0;
        this.goal = GOAL;

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

    onResize() {
        // fixed canvas size for simplicity; handle DPR here if desired
    }

    start() {
        if (this.state === State.MENU || this.state === State.GAME_OVER || this.state === State.WIN) {
            this.reset();
            this.state = State.PLAYING;
            if (this.ui.status) this.ui.status.textContent = "Playing…";
            requestAnimationFrame(this.tick);
        } else if (this.state === State.PAUSED) {
            this.state = State.PLAYING;
            if (this.ui.status) this.ui.status.textContent = "Playing…";
        }
    }

    reset() {
        this.state = State.MENU;
        this.player = new Farmer(WIDTH / 2 - 17, HEIGHT - 80);
        this.crops.length = 0;
        this.obstacles.length = 0;
        // Q2.c: Reset power-ups on game reset.
        this.powerUps.length = 0;
        // Q2.d: Reset crows on game reset.
        this.crows.length = 0;
        this.score = 0;
        this.timeLeft = GAME_LEN;
        this._accumSpawn = 0;
        this._accumPowerUpSpawn = 0;
        this._accumCrowSpawn = 0;
        this.lastTime = performance.now();
        // place a couple of scarecrows
        this.obstacles.push(new Scarecrow(200, 220), new Scarecrow(650, 160));
        this.syncUI();
        if (this.ui.status) this.ui.status.textContent = "Menu";
    }

    togglePause() {
        if (this.state === State.PLAYING) {
            this.state = State.PAUSED;
            if (this.ui.status) this.ui.status.textContent = "Paused";
        } else if (this.state === State.PAUSED) {
            this.state = State.PLAYING;
            if (this.ui.status) this.ui.status.textContent = "Playing…";
        }
    }

    syncUI() {
        if (this.ui.score) this.ui.score.textContent = String(this.score);
        if (this.ui.time) this.ui.time.textContent = Math.ceil(this.timeLeft);
        if (this.ui.goal) this.ui.goal.textContent = String(this.goal);
    }

    spawnCrop() {
        const gx = Math.floor(Math.random() * ((WIDTH - 2 * TILE) / TILE)) * TILE + TILE;
        const gy = Math.floor(Math.random() * ((HEIGHT - 2 * TILE) / TILE)) * TILE + TILE;
        // Q2.a: Randomly select crop type for varied points.
        const types = ["wheat", "pumpkin", "golden_apple"];
        const type = types[Math.floor(Math.random() * types.length)];
        this.crops.push(new Crop(gx, gy, type));
    }

    // Q2.c: Added method to spawn power-up.
    spawnPowerUp() {
        const gx = Math.floor(Math.random() * ((WIDTH - 2 * TILE) / TILE)) * TILE + TILE;
        const gy = Math.floor(Math.random() * ((HEIGHT - 2 * TILE) / TILE)) * TILE + TILE;
        this.powerUps.push(new PowerUp(gx, gy));
    }

    // Q2.d: Added method to spawn crow.
    spawnCrow() {
        const gx = Math.floor(Math.random() * ((WIDTH - 2 * TILE) / TILE)) * TILE + TILE;
        const gy = Math.floor(Math.random() * ((HEIGHT - 2 * TILE) / TILE)) * TILE + TILE;
        this.crows.push(new Crow(gx, gy));
    }

    update(dt) {
        if (this.state !== State.PLAYING) return;

        // countdown
        this.timeLeft = clamp(this.timeLeft - dt, 0, GAME_LEN);
        if (this.timeLeft <= 0) {
            this.state = (this.score >= this.goal) ? State.WIN : State.GAME_OVER;
            if (this.ui.status) this.ui.status.textContent = (this.state === State.WIN) ? "You Win!" : "Game Over";
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
        const collected = this.crops.filter(c => aabb(this.player, c));     // arrow #1
        if (collected.length) {
            // Q1.a: Arrow function in forEach; lexical 'this' ensures access to Game's properties (e.g., score) remains instance-bound.
            collected.forEach(c => c.dead = true);                             // arrow #2
            // Q2.a: Sum points from collected crops instead of fixed +1.
            this.score += collected.reduce((sum, c) => sum + c.points, 0);
            if (this.ui.score) this.ui.score.textContent = String(this.score);
            if (this.score >= this.goal) {
                this.state = State.WIN;
                if (this.ui.status) this.ui.status.textContent = "You Win!";
            }
        }
        // Q1.a: Arrow function in filter; changes 'this' binding to lexical (Game), preventing loss of context in array methods.
        this.crops = this.crops.filter(c => !c.dead);                        // arrow #3
        // Q1.a: Arrow function in forEach; 'this' (passed as game arg) is lexical, but the callback itself uses lexical binding for any internal references.
        this.crops.forEach(c => c.update(dt, this));                         // arrow #4

        // Q2.c: Collect power-ups.
        const collectedPowerUps = this.powerUps.filter(p => aabb(this.player, p));
        collectedPowerUps.forEach(p => {
            p.dead = true;
            this.player.applySpeedBoost(5); // 5-second boost
        });
        this.powerUps = this.powerUps.filter(p => !p.dead);
        this.powerUps.forEach(p => p.update(dt, this));

        // Q2.d: Update crows and check collisions (penalize score).
        this.crows.forEach(crow => crow.update(dt, this));
        const hitCrows = this.crows.filter(crow => aabb(this.player, crow));
        if (hitCrows.length > 0) {
            this.score = Math.max(0, this.score - 2 * hitCrows.length); // Lose 2 points per crow
            hitCrows.forEach(crow => crow.dead = true);
            if (this.ui.score) this.ui.score.textContent = String(this.score);
        }
        this.crows = this.crows.filter(crow => !crow.dead);

        // timer UI
        if (this.ui.time) this.ui.time.textContent = Math.ceil(this.timeLeft);
    }

    render() {
        const ctx = this.ctx;
        if (!ctx) return;

        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // field background (grid)
        ctx.fillStyle = "#dff0d5";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.strokeStyle = "#c7e0bd";
        ctx.lineWidth = 1;
        for (let y = TILE; y < HEIGHT; y += TILE) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
        }
        for (let x = TILE; x < WIDTH; x += TILE) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
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
        if (this.state === State.MENU) {
            ctx.fillText("Press Start to play", 20, 28);
        } else if (this.state === State.PAUSED) {
            ctx.fillText("Paused (press P to resume)", 20, 28);
        } else if (this.state === State.GAME_OVER) {
            ctx.fillText("Time up! Press Reset to return to Menu", 20, 28);
        } else if (this.state === State.WIN) {
            ctx.fillText("Harvest complete! Press Reset for another round", 20, 28);
        }
    }

    dispose() {
        this.input.dispose();
        window.removeEventListener("resize", this._onResize);
    }
}

// ---- Boot ----
const canvas = document.getElementById("game");
const game = new Game(canvas);
// Click "Start" in the UI to begin.