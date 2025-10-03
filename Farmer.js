import { Entity } from './BaseEntity.js';
import { WIDTH, HEIGHT, clamp, aabb } from './Utils.js'; // G3/G2: Import shared utils to fix ReferenceErrors.


/**
 * Farmer class represents the player character.
 * @extends Entity
 */
export class Farmer extends Entity {
    /**
     * Creates a new Farmer.
     * @param {number} x - Initial x position.
     * @param {number} y - Initial y position.
     */
    constructor(x, y) {
        super(x, y, 34, 34);
        this.speed = 260;
        this.vx = 0;
        this.vy = 0;
        this.color = "#8b5a2b";
        // Q2.c: Added baseSpeed to track original speed for power-up resets.
        this.baseSpeed = this.speed;
        // Q2.c: Power-up timer for speed boost duration.
        this.speedBoostEnd = 0;
        // G2: Sprite sheet for animated farmer.
        this.sprite = new Image();
        this.sprite.src = 'sprites/farmer.png'; // 4x4 grid: rows=down/left/right/up, cols=4 walk frames, each 32x32
        this.spriteLoaded = false;
        this.sprite.onload = () => { this.spriteLoaded = true; };
        // G2: Animation state.
        this.currentRow = 0; // Default: down (row 0)
        this.currentFrame = 0; // Idle frame
        this.frameTime = 0;
        this.frameDuration = 0.1; // Advance frame every 0.1s for ~10 FPS animation
        this.cellSize = 32; // Assumed sprite cell size
        this.isMoving = false; // Track if animating
    }

    /**
     * Handles player input for movement.
     * @param {Input} input - The input handler providing key states.
     */
    handleInput(input) {
        const L = input.keys.has("ArrowLeft"), R = input.keys.has("ArrowRight");
        const U = input.keys.has("ArrowUp"), D = input.keys.has("ArrowDown");
        this.vx = (R - L) * this.speed;
        this.vy = (D - U) * this.speed;
        // G2: Determine direction row based on movement vector.
        if (this.vx !== 0 || this.vy !== 0) {
            this.isMoving = true;
            // Prioritize vertical if diagonal, else horizontal.
            if (Math.abs(this.vy) > Math.abs(this.vx)) {
                this.currentRow = this.vy > 0 ? 0 : 3; // down=0, up=3
            } else {
                this.currentRow = this.vx > 0 ? 2 : 1; // right=2, left=1
            }
        } else {
            this.isMoving = false;
            // Reset to idle frame when stopped.
            this.currentFrame = 0;
        }
        // Q1.c: In this method call (handleInput), 'this' is dynamically bound to the receiver object (Farmer instance) due to how the method is invoked on the instance.
    }

    /**
     * Applies a temporary speed boost.
     * @param {number} duration - Duration of the boost in seconds.
     */
    // Q2.c: Added method to apply speed boost for a duration.
    applySpeedBoost(duration) {
        this.speed = this.baseSpeed * 1.5; // 50% boost
        this.speedBoostEnd = performance.now() / 1000 + duration;
    }

    /**
     * Updates farmer position and handles collisions.
     * @param {number} dt - Delta time in seconds.
     * @param {Game} game - The game instance for obstacle checks.
     */
    update(dt, game) {
        // Q2.c: Check if speed boost is active and reset if expired.
        const now = performance.now() / 1000;
        if (now > this.speedBoostEnd) {
            this.speed = this.baseSpeed;
        }
        // G2: Advance animation frame if moving.
        if (this.isMoving) {
            this.frameTime += dt;
            if (this.frameTime >= this.frameDuration) {
                this.frameTime = 0;
                this.currentFrame = (this.currentFrame + 1) % 4; // Cycle through 4 frames
            }
        }
        // try movement
        const oldX = this.x, oldY = this.y;
        this.x = clamp(this.x + this.vx * dt, 0, WIDTH - this.w);
        this.y = clamp(this.y + this.vy * dt, 0, HEIGHT - this.h);
        // block through obstacles
        const hitObs = game.obstacles.some(o => aabb(this, o));
        if (hitObs) { this.x = oldX; this.y = oldY; }
    }

    /**
     * Draws the farmer (body and hat) with optional speed boost visual.
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
     */
    draw(ctx) {
        // G2: Draw sprite frame if loaded, else fallback to old square.
        if (this.spriteLoaded) {
            const sx = this.currentFrame * this.cellSize;
            const sy = this.currentRow * this.cellSize;
            ctx.drawImage(this.sprite, sx, sy, this.cellSize, this.cellSize, this.x, this.y, this.w, this.h);
        } else {
            // Fallback: old drawing until sprite loads.
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.fillStyle = "#c28e0e";
            ctx.fillRect(this.x + 4, this.y - 6, this.w - 8, 8);        // hat brim
            ctx.fillRect(this.x + 10, this.y - 18, this.w - 20, 12);    // hat top
        }
        // Q2.c: Visual indicator for active speed boost (glowing outline).
        if (performance.now() / 1000 < this.speedBoostEnd) {
            ctx.strokeStyle = "#ffff00";
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x, this.y, this.w, this.h);
        }
    }
}