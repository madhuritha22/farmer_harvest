import { Entity } from './BaseEntity.js';

/**
 * PowerUp class represents speed boost collectibles.
 * @extends Entity
 */
export class PowerUp extends Entity {
    /**
     * Creates a new PowerUp.
     * @param {number} x - Initial x position.
     * @param {number} y - Initial y position.
     */
    // Q2.c: New PowerUp class for speed boost collectible.
    constructor(x, y) {
        super(x, y, 16, 16);
        this.angle = Math.random() * Math.PI * 2;
    }

    /**
     * Updates the power-up's rotation animation.
     * @param {number} dt - Delta time in seconds.
     * @param {Game} game - The game instance (unused).
     */
    update(dt, game) {
        this.angle += dt * 3;
    }

    /**
     * Draws the power-up as a spinning star.
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
     */
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