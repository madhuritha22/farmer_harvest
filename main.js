import { Game } from './Game.js';

/**
 * Bootstraps the game application.
 */
// ---- Boot ----
const canvas = document.getElementById("game");
const game = new Game(canvas);
// Click "Start" in the UI to begin.