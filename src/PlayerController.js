import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

export class PlayerController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.moveSpeed = 15; // Increased from 5 to 15
    this.dampingFactor = 5.0; // Added damping control
    this.controls = new PointerLockControls(camera, domElement);

    // Jump properties
    this.velocity = new THREE.Vector3();
    this.gravity = -30;
    this.jumpForce = 10;
    this.isGrounded = false;
    this.canJump = false;

    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.setupEventListeners();
    this.weapon = null;
  }

  setupEventListeners() {
    // Pointer lock controls
    this.domElement.addEventListener("click", (e) => {
      console.log("Canvas clicked, lock state:", this.controls.isLocked);
      if (this.controls.isLocked && this.weapon) {
        console.log("Attempting to fire weapon");
        const fired = this.weapon.fire();
        console.log("Weapon fire result:", fired);
      } else {
        console.log("Attempting to lock pointer");
        this.controls.lock();
      }
    });

    // Movement keys
    document.addEventListener("keydown", (e) => this.onKeyDown(e), false);
    document.addEventListener("keyup", (e) => this.onKeyUp(e), false);
  }

  onKeyDown(event) {
    switch (event.code) {
      case "KeyW":
        this.moveForward = true;
        break;
      case "KeyA":
        this.moveLeft = true;
        break;
      case "KeyS":
        this.moveBackward = true;
        break;
      case "KeyD":
        this.moveRight = true;
        break;
      case "Space":
        if (this.canJump && this.isGrounded) {
          this.velocity.y = this.jumpForce;
          this.isGrounded = false;
          this.canJump = false;
        }
        break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case "KeyW":
        this.moveForward = false;
        break;
      case "KeyA":
        this.moveLeft = false;
        break;
      case "KeyS":
        this.moveBackward = false;
        break;
      case "KeyD":
        this.moveRight = false;
        break;
    }
  }

  update(delta) {
    // Calculate movement direction
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    // Update velocity and position
    if (this.controls.isLocked) {
      // Use dampingFactor for smoother deceleration
      this.velocity.x -= this.velocity.x * this.dampingFactor * delta;
      this.velocity.z -= this.velocity.z * this.dampingFactor * delta;

      // Apply movement with acceleration factor
      this.velocity.z -= this.direction.z * this.moveSpeed * delta * 2;
      this.velocity.x -= this.direction.x * this.moveSpeed * delta * 2;

      this.controls.moveRight(-this.velocity.x * delta);
      this.controls.moveForward(-this.velocity.z * delta);
    }
  }
}
