import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/Addons.js";
import Enemy from "./enemy";

export default class Orc extends Enemy {
	constructor(scene, startingPosition, player) {
		super();
		this.health = 100;
		this.speed = 400;
		this.damage = 25;
		this.scene = scene;
		this.loadModel("Goblin.glb", 20.2);
		this.position = startingPosition;
		this.player = player;
		this.enemyCenterPoint = new THREE.Vector3();
		this.attackTime = null;

		this.punchSound = new Audio("/character/slapSound.ogg");
		this.punchSound.volume = 0.1;

		this.charRaycaster = new THREE.Raycaster(
			new THREE.Vector3(),
			new THREE.Vector3(0, -1, 0),
			0,
			15
		);
	}

	loadAnimations() {
		this.animLoader.setPath("./character/");
		this.loadAnimation(this.animLoader, "monster_running.fbx", "running");
		this.loadAnimation(this.animLoader, "monster_attack.fbx", "attack");
		this.loadAnimation(this.animLoader, "orc_death.fbx", "death");
	}

	enemyAI(delta) {
		if (this.health > 0) {
			let enemyPos = this.model.position;
			let playerPos = this.player.camera.position;
			this.enemyCenterPoint.set(enemyPos.x, enemyPos.y + 10, enemyPos.z);

			this.animations["running"].action.play();
			this.model.lookAt(playerPos.x, enemyPos.y, playerPos.z);
			let distance = this.enemyCenterPoint.distanceTo(playerPos);

			if (enemyPos.x != playerPos.x || enemyPos.z != playerPos.z) {
				if (enemyPos.x < playerPos.x) {
					this.left = true;
					this.right = false;
				} else {
					this.left = false;
					this.right = true;
				}
				if (enemyPos.z < playerPos.z) {
					this.forward = true;
					this.backward = false;
				} else {
					this.forward = false;
					this.backward = true;
				}

				if (distance < 30) {
					this.attackTime += 5 * delta;

					if (this.attackTime > 5) {
						this.punchSound.play();
						this.player.health -= this.damage;
						this.attackTime = 0;
					}

					this.left = false;
					this.right = false;
					this.forward = false;
					this.backward = false;
					this.animations["attack"].action.play();
					this.animations["running"].action.stop();
				} else {
					this.animations["attack"].action.stop();
					this.attackTime = 0;
				}
			}
		}
	}

	update(delta) {
		this.genericUpdate(delta);

		if (this.health <= 0) {
			this.animations["death"].action.play();
			this.animations["attack"].action.stop();
			this.animations["running"].action.stop();
			setTimeout(() => {
				this.position.y = -900;
			}, 2800);
		}

	}
}
