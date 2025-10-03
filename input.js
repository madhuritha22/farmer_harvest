/**
 * Input class handles keyboard events.
 */
export class Input {
    /**
     * Creates a new Input handler.
     * @param {Game} game - The game instance for pause toggling.
     */
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

    /**
     * Handles key down events.
     * @param {KeyboardEvent} e - The keydown event.
     */
    onKeyDown(e) {
        if (e.key === "p" || e.key === "P") this.game.togglePause();
        this.keys.add(e.key);
    }

    /**
     * Handles key up events.
     * @param {KeyboardEvent} e - The keyup event.
     */
    onKeyUp(e) { this.keys.delete(e.key); }

    /**
     * Cleans up event listeners.
     */
    dispose() {
        window.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("keyup", this._onKeyUp);
    }
}