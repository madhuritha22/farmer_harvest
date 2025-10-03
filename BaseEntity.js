/**
 * Base Entity class for all game objects.
 */
export class Entity {
    /**
     * Creates a new Entity.
     * @param {number} x 
     * @param {number} y 
     * @param {number} w - Width 
     * @param {number} h - Height 
     */
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.dead = false;
    }

    /**
     * entity state.
     * @param {number} dt - Delta time in seconds.
     * @param {Game} game - game instance.
     */
    update(dt, game) { }

    /**
     * Draws the entity on the canvas.
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) { }
}