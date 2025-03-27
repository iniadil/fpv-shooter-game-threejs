import { Game } from "./game.js";

// Import Three.js examples
import "three/examples/jsm/controls/OrbitControls.js";

// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const game = new Game();
  game.init();
});
