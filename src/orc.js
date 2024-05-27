import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/Addons.js";
import Enemy from "./enemy";

export default class Orc extends Enemy {
	constructor(scene, startingPosition, player) {
		super();
		this.health = 100;
		this.speed = 400;
		this.damage = 0.5;
		this.scene = scene;
		this.loadModel();
		this.position = startingPosition;
		this.player = player;
		this.enemyCenterPoint = new THREE.Vector3();
		this.attackTime;

		this.punchSound = new Audio("/character/slapSound.ogg");
		this.punchSound.volume = 0.1;

		this.charRaycaster = new THREE.Raycaster(
			new THREE.Vector3(),
			new THREE.Vector3(0, -1, 0),
			0,
			15
		);
	}

	loadModel() {
		const orcLoader = new FBXLoader();
		orcLoader.load("Orc.fbx", (fbx) => {
			fbx.scale.setScalar(0.2);
			fbx.traverse((c) => {
				c.castShadow = true;
			});

			this.model = fbx;
			this.model.position.copy(this.position);
			this.model.rotation.copy(this.rotation);

			this.mixer = new THREE.AnimationMixer(fbx);
			const animLoader = new FBXLoader();
			animLoader.setPath("./character/");
			this.loadAnimation(animLoader, "monster_running.fbx", "running");
			this.loadAnimation(animLoader, "monster_attack.fbx", "attack");
			this.loadAnimation(animLoader, "orc_death.fbx", "death");

			this.scene.add(this.model);
		});
	}

	loadAnimation(animLoader, animation, name) {
		animLoader.load(animation, (a) => {
			const clip = a.animations[0];
			const action = this.mixer.clipAction(clip);
			this.animations[name] = {
				clip: clip,
				action: action,
			};
		});
	}

	findDirectionToPlayer(delta) {
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

	_Update(delta) {
		this.model.position.copy(this.position);
		this.model.rotation.copy(this.rotation);

		if (this.health <= 0) {
			this.animations["death"].action.play();
			this.animations["attack"].action.stop();
			this.animations["running"].action.stop();
            setTimeout(()=> {
                this.position.y = -900
            }, 2800)
		}

		this.charRaycaster.ray.origin.copy(this.position);

		if (this.model) {
			this.findDirectionToPlayer(delta);
		}
		const charIntersections = this.charRaycaster.intersectObjects(
			this.scene.children,
			false
		);

		const charOnObject = charIntersections.length > 0;
		this.mixer.update(delta);

		this.characterVelocity.x -= this.characterVelocity.x * 5.0 * delta;
		this.characterVelocity.z -= this.characterVelocity.z * 5.0 * delta;

		this.characterVelocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

		this.characterDirection.z =
			Number(this.forward) - Number(this.backward);
		this.characterDirection.x = Number(this.left) - Number(this.right);
		this.characterDirection.normalize();

		if (this.forward || this.backward) {
			this.characterVelocity.z -= this.characterDirection.z * 400 * delta;
		}
		if (this.left || this.right) {
			this.characterVelocity.x -= this.characterDirection.x * 400 * delta;
		}

		if (charOnObject === true) {
			this.characterVelocity.y = Math.max(0, this.characterVelocity.y);
		}

		this.position.z += -this.characterVelocity.z * delta;
		this.position.x += -this.characterVelocity.x * delta;

		if (charIntersections[0]) {
			this.position.y = charIntersections[0]?.point.y + 8.85;
		}

		this.position.y += this.characterVelocity.y * delta;
		if (this.player.health <= 0) {
			this.position.set(0, 940, -180);
		}
	}
}
