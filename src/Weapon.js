import * as THREE from "three";

export class Weapon {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.cooldown = 0;
    this.fireRate = 0.2; // seconds between shots
    this.range = 100;
    this.damage = 25;

    // Bullet properties
    this.bulletSpeed = 50;
    this.bulletSize = 0.05;
    this.bulletLifetime = 2.0; // seconds
    this.bulletPool = [];
    this.maxBullets = 30;

    // Audio setup
    this.audioLoader = new THREE.AudioLoader();
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);

    // Sound pool for shots
    this.shotSoundPool = [];
    this.hitSound = new THREE.Audio(this.listener);
    this.soundsLoaded = false;
    this.maxSimultaneousShots = 5; // Max concurrent shot sounds

    // Load sounds (add files to public/sounds/)
    this.audioLoader.load(
      "sounds/shot.wav",
      (buffer) => {
        // Initialize sound pool
        for (let i = 0; i < this.maxSimultaneousShots; i++) {
          const sound = new THREE.Audio(this.listener);
          sound.setBuffer(buffer);
          this.shotSoundPool.push(sound);
        }
        this.checkSoundsLoaded();
      },
      undefined,
      (error) => {
        console.error("Error loading shot sound:", error);
      }
    );
    this.audioLoader.load(
      "sounds/hit.wav",
      (buffer) => {
        this.hitSound.setBuffer(buffer);
        this.checkSoundsLoaded();
      },
      undefined,
      (error) => {
        console.error("Error loading hit sound:", error);
      }
    );

    // Create weapon model
    this.model = new THREE.Group();
    this.createModel();
  }

  createModel() {
    // Simple weapon geometry
    const geometry = new THREE.BoxGeometry(0.3, 0.1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0.5, -0.5, -1.5);
    this.model.add(mesh);
  }

  update(delta) {
    if (this.cooldown > 0) {
      this.cooldown -= delta;
      console.log(`Cooldown remaining: ${this.cooldown.toFixed(3)}`);
    }

    // Update active bullets
    this.bulletPool.forEach((bullet) => {
      if (bullet.visible) {
        // Move bullet
        bullet.position.add(
          bullet.userData.velocity.clone().multiplyScalar(delta)
        );

        // Update lifetime
        bullet.userData.lifetime -= delta;
        if (bullet.userData.lifetime <= 0) {
          bullet.visible = false;
          if (bullet.parent) bullet.parent.remove(bullet);
        }

        // Check for collisions with enemies
        const raycaster = new THREE.Raycaster();
        raycaster.set(
          bullet.position,
          bullet.userData.velocity.clone().normalize()
        );
        raycaster.far = this.bulletSpeed * delta * 1.1; // Slightly more than movement distance

        const intersects = raycaster.intersectObjects(
          this.scene.children,
          true
        );
        if (intersects.length > 0) {
          const hit = intersects[0];
          let obj = hit.object;
          while (obj.parent) {
            if (obj.userData.isEnemy) {
              if (obj.parent && typeof obj.parent.takeDamage === "function") {
                obj.parent.takeDamage(this.damage);
                if (this.hitSound.isPlaying) this.hitSound.stop();
                this.hitSound.play();
              }
              break;
            }
            obj = obj.parent;
          }

          bullet.visible = false;
          if (bullet.parent) bullet.parent.remove(bullet);
        }
        // Range check
        else if (
          bullet.position.distanceTo(this.camera.position) > this.range
        ) {
          bullet.visible = false;
          if (bullet.parent) bullet.parent.remove(bullet);
        }
      }
    });
  }

  checkSoundsLoaded() {
    if (this.shotSoundPool.length > 0 && this.hitSound.buffer) {
      this.soundsLoaded = true;
      // Warm up the audio context using first sound in pool
      if (this.shotSoundPool[0].context.state === "suspended") {
        this.shotSoundPool[0].context.resume();
      }
    }
  }

  fire() {
    console.log("Fire method called"); // Debug
    if (this.cooldown <= 0) {
      console.log("Weapon fired"); // Debug
      this.cooldown = this.fireRate;
      this.createMuzzleFlash();
      this.spawnBullet();

      if (this.soundsLoaded && this.shotSoundPool.length > 0) {
        if (this.shotSoundPool[0].context.state === "suspended") {
          this.shotSoundPool[0].context.resume().then(() => {
            this.playShotSound();
          });
        } else {
          this.playShotSound();
        }
      } else {
        console.warn("Sounds not loaded yet");
      }

      this.raycast();
      return true;
    }
    console.log("Weapon on cooldown"); // Debug
    return false;
  }

  spawnBullet() {
    const bullet = this.getAvailableBullet();
    bullet.visible = true;
    bullet.position.copy(this.camera.position);
    bullet.quaternion.copy(this.camera.quaternion);
    bullet.userData.velocity = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(this.camera.quaternion)
      .multiplyScalar(this.bulletSpeed);
    bullet.userData.lifetime = this.bulletLifetime;
    this.scene.add(bullet);
  }

  getAvailableBullet() {
    // Find first unused bullet
    let bullet = this.bulletPool.find((b) => !b.visible);

    // If none available, create new one
    if (!bullet) {
      bullet = this.createBullet();
      this.bulletPool.push(bullet);
      if (this.bulletPool.length > this.maxBullets) {
        // Remove oldest bullet if pool is full
        const oldest = this.bulletPool.shift();
        if (oldest.parent) oldest.parent.remove(oldest);
      }
    }

    return bullet;
  }

  createBullet() {
    const geometry = new THREE.SphereGeometry(this.bulletSize, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(geometry, material);
    bullet.visible = false;
    return bullet;
  }

  getAvailableSound() {
    // Find first non-playing sound in pool
    const availableSound = this.shotSoundPool.find((sound) => !sound.isPlaying);
    return availableSound || this.shotSoundPool[0]; // Fallback to first sound if all are playing
  }

  playShotSound() {
    const sound = this.getAvailableSound();
    try {
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.play();
    } catch (error) {
      console.error("Error playing shot sound:", error);
    }
  }

  createMuzzleFlash() {
    // Simple flash effect
    const light = new THREE.PointLight(0xff6600, 5, 2);
    light.position.set(0.5, -0.4, -1.6);
    this.model.add(light);

    // Remove after short duration
    setTimeout(() => {
      this.model.remove(light);
    }, 50);
  }

  raycast() {
    // Create precise ray from camera center
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    raycaster.params.Line.threshold = 0.1;
    raycaster.params.Points.threshold = 0.1;

    // Check for hits
    const intersects = raycaster.intersectObjects(this.scene.children, true);
    if (intersects.length > 0) {
      const hit = intersects[0];
      this.createHitMarker(hit);

      // Check if hit an enemy
      let obj = hit.object;
      while (obj.parent) {
        if (obj.userData.isEnemy) {
          console.log("Hit enemy object:", obj);
          console.log("Parent object:", obj.parent);
          if (obj.parent && typeof obj.parent.takeDamage === "function") {
            obj.parent.takeDamage(this.damage);
          } else {
            console.error(
              "Parent object missing takeDamage method:",
              obj.parent
            );
          }
          break;
        }
        obj = obj.parent;
      }
    }
  }

  createHitMarker(hit) {
    // Robust hit indicator
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.8,
      })
    );

    // Precise 3D positioning
    const distance = hit.distance;
    const size = Math.min(0.1, 0.02 * distance); // Scale marker with distance

    marker.geometry.dispose();
    marker.geometry = new THREE.SphereGeometry(size, 8, 8);

    if (hit.face && hit.face.normal) {
      const offset = hit.face.normal.clone().multiplyScalar(size / 2);
      marker.position.copy(hit.point).add(offset);
    } else {
      marker.position.copy(hit.point);
    }

    marker.lookAt(this.camera.position);
    this.scene.add(marker);

    // Remove after short duration
    setTimeout(() => {
      this.scene.remove(marker);
    }, 200);
  }
}
