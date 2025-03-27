import * as THREE from "three";
import { PlayerController } from "./PlayerController.js";
import { Weapon } from "./Weapon.js";
import { Enemy } from "./Enemy.js";

export class Game {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.clock = new THREE.Clock();
    this.mixers = [];
  }

  init() {
    // Set up renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    // Basic scene setup
    this.setupLights();
    this.setupCamera();
    this.setupControls();
    this.setupEventListeners();

    // Start game loop
    this.gameLoop();
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Add debug helpers
    this.scene.add(new THREE.AxesHelper(5));
    this.scene.add(new THREE.GridHelper(10, 10));

    // Add test cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0.5, 0);
    this.scene.add(cube);
  }

  setupCamera() {
    this.camera.position.set(0, 1.6, 3);
    this.camera.lookAt(0, 1.6, 0);
  }

  setupControls() {
    this.playerController = new PlayerController(
      this.camera,
      this.renderer.domElement
    );

    // Initialize weapon
    this.weapon = new Weapon(this.camera, this.scene);
    this.playerController.weapon = this.weapon;
    this.camera.add(this.weapon.model);

    // Create some enemies
    this.enemies = [];
    this.spawnEnemies();
  }

  spawnEnemies() {
    const positions = [
      new THREE.Vector3(-5, 0, -10),
      new THREE.Vector3(5, 0, -10),
      new THREE.Vector3(0, 0, -15),
    ];

    positions.forEach((pos) => {
      const enemy = new Enemy(this.scene, pos);
      enemy.model.userData.isEnemy = true;
      this.enemies.push(enemy);
    });
  }

  setupEventListeners() {
    window.addEventListener("resize", () => this.onWindowResize());
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  gameLoop() {
    requestAnimationFrame(() => this.gameLoop());

    const delta = this.clock.getDelta();

    // Update player controller
    if (this.playerController) {
      this.playerController.update(delta);
    }

    // Update weapon
    if (this.weapon) {
      this.weapon.update(delta);
    }

    // Update animation mixers
    this.mixers.forEach((mixer) => mixer.update(delta));

    this.renderer.render(this.scene, this.camera);
  }
}
