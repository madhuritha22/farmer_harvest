import { Entity } from './BaseEntity.js';
import { WIDTH, HEIGHT, clamp } from './Utils.js'; // G3/G2: Import shared utils to fix ReferenceErrors in Crow.

/**
 * Scarecrow class represents static obstacles.
 * @extends Entity
 */
export class Scarecrow extends Entity {
    /**
     * Creates a new Scarecrow.
     * @param {number} x - Initial x position.
     * @param {number} y - Initial y position.
     */
    constructor(x, y) { super(x, y, 26, 46); }

    /**
     * Draws the scarecrow (pole, head, arms).
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
     */
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

/**
 * Crow class represents moving obstacles that penalize on collision.
 * @extends Entity
 */
export class Crow extends Entity {
    /**
     * Creates a new Crow.
     * @param {number} x - Initial x position.
     * @param {number} y - Initial y position.
     */
    // Q2.d: New Crow class for moving obstacles that penalize on collision.
    constructor(x, y) {
        super(x, y, 20, 20);
        this.vx = (Math.random() - 0.5) * 100; // random direction
        this.vy = (Math.random() - 0.5) * 100;
        this.color = "#000";
        this.maxSpeed = 120;
        this.angle = Math.random() * Math.PI * 2;
    }

    /**
     * Updates crow position with wall bouncing.
     * @param {number} dt - Delta time in seconds.
     * @param {Game} game - The game instance (unused).
     */
    update(dt, game) {
        this.vx = Math.cos(this.angle) * this.maxSpeed;
        this.vy = Math.sin(this.angle) * this.maxSpeed;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Change direction randomly 
        if (Math.random() < 0.01) {
            this.angle += (Math.random() - 0.5) * Math.PI; // Randomly change flight direction
        }

        // Bounce off walls
        if (this.x <= 0 || this.x >= WIDTH - this.w) this.angle = Math.PI - this.angle;
        if (this.y <= 0 || this.y >= HEIGHT - this.h) this.angle = -this.angle;
        // Q2.d: Remove if out of bounds (though bounce prevents this).
        if (this.dead) return;
    }

    /**
     * Draws the crow (body, wings, and head).
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
     */
    draw(ctx) {
        const { x, y, w, h } = this;

        ctx.fillStyle = this.color;

        // Draw the body (ellipse)
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw the wings (slightly angled for more realism)
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h / 2); // Middle of the body
        ctx.lineTo(x + w / 2 - 10, y + h / 2 - 15); // Left wing top
        ctx.lineTo(x + w / 2 - 5, y + h / 2 + 10); // Left wing bottom
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h / 2); // Middle of the body
        ctx.lineTo(x + w / 2 + 10, y + h / 2 - 15); // Right wing top
        ctx.lineTo(x + w / 2 + 5, y + h / 2 + 10); // Right wing bottom
        ctx.closePath();
        ctx.fill();

        // Draw the head (circle)
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 4, 8, 0, Math.PI * 2); // Head
        ctx.fill();

        // Draw the eyes (small circles)
        ctx.fillStyle = "#fff"; // White for the eyes
        ctx.beginPath();
        ctx.arc(x + w / 2 - 3, y + h / 4 - 3, 2, 0, Math.PI * 2); // Left eye
        ctx.arc(x + w / 2 + 3, y + h / 4 - 3, 2, 0, Math.PI * 2); // Right eye
        ctx.fill();

        // Draw the beak (small triangle)
        ctx.fillStyle = "#f9c21b"; // Yellow-orange for beak
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + h / 4 + 5); // Start at the center of the head
        ctx.lineTo(x + w / 2 - 3, y + h / 4 + 8); // Left point of the beak
        ctx.lineTo(x + w / 2 + 3, y + h / 4 + 8); // Right point of the beak
        ctx.fill();
    }
}