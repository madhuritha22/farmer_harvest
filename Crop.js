import { Entity } from './BaseEntity.js';

/**
 * Crop class represents collectible items.
 * @extends Entity
 */
export class Crop extends Entity {
    /**
     * Creates a new Crop.
     * @param {number} x
     * @param {number} y
     * @param {string} [type="wheat"] - Type of crop (wheat, pumpkin, golden_apple).
     */
    constructor(x, y, type = "wheat") {
        super(x, y, 20, 26);
        this.type = type;
        // Q2.a: Added point values for different crop types.
        this.points = { wheat: 1, pumpkin: 3, golden_apple: 5 }[type] || 1;
        this.sway = Math.random() * Math.PI * 2;
    }

    /**
     * Updates the crop's animation .
     * @param {number} dt - Delta time in seconds.
     * @param {Game} game - The game instance (unused).
     */
    update(dt, game) { this.sway += dt * 2; }

    /**
     * Draws the crop based on its type.
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context.
     */
    draw(ctx) {
    const { x, y, w, h } = this;
    
    // Pumpkin: Change to spherical with shading and rotating vine
    if (this.type === "pumpkin") {
        ctx.fillStyle = "#ff7f32"; // Lighter orange for a more realistic pumpkin look
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Adding shading for depth
        ctx.fillStyle = "#cc5e00";
        ctx.beginPath();
        ctx.arc(x + w / 2 + 2, y + h / 2 + 2, 10, 0, Math.PI * 2);
        ctx.fill();

        // Rotating vine animation
        ctx.strokeStyle = "#4e7b33"; // Green vine color
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y - 6); // Vine base
        ctx.quadraticCurveTo(x + w / 2 + Math.sin(this.sway) * 10, y - 15 + Math.cos(this.sway) * 6, x + w / 2, y - 30); // Curvy vine
        ctx.stroke();
        
    } else if (this.type === "golden_apple") {
        ctx.fillStyle = "#ffd700"; // Golden apple color
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, 12, 0, Math.PI * 2); // Slightly bigger apple
        ctx.fill();
        
        // Adding shine effect for the golden apple
        ctx.fillStyle = "#fff"; // White highlight
        ctx.beginPath();
        ctx.arc(x + w / 2 - 4, y + h / 2 - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Glowing effect around the apple
        ctx.shadowColor = "#ffd700";
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ff8c00";
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w / 2, y - 10);
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow
        
    } else { // wheat (default)
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