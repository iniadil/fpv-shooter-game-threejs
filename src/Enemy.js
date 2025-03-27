import * as THREE from "three";

export class Enemy {
  constructor(scene, position) {
    this.scene = scene;
    this.health = 100;
    this.isAlive = true;

    // Create enemy container and model
    this.group = new THREE.Group();
    this.group.position.copy(position);

    this.model = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 2, 8),
      new THREE.MeshStandardMaterial({
        color: 0xff0000,
        flatShading: true,
      })
    );
    this.model.castShadow = true;
    this.group.add(this.model);
    this.scene.add(this.group);

    // Mark both group and model as enemies and add damage method
    this.group.userData.isEnemy = true;
    this.group.takeDamage = this.takeDamage.bind(this);
    this.model.userData.isEnemy = true;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.isAlive = false;
    this.scene.remove(this.group);
  }

  update(delta) {
    if (this.isAlive) {
      // Simple idle animation
      this.model.rotation.y += delta;
    }
  }
}
