import * as THREE from "three";
import Entity from "./entity";
import { FBXLoader, GLTFLoader } from "three/examples/jsm/Addons.js";

export default class Enemy extends Entity {
	constructor() {
		super();
		this.damage = 0;
		this.model = null;
		this.mixer = null;
		this.animations = {};

		this.forward = false;
		this.backward = false;
		this.left = false;
		this.right = false;
		this.characterVelocity = new THREE.Vector3();
		this.characterDirection = new THREE.Vector3();
		this.animLoader = new FBXLoader();
	}

	loadModel(name, scalar) {
		const orcLoader = new GLTFLoader();
		orcLoader.load(name, (glb) => {
			glb.scene.scale.setScalar(scalar);
			glb.scene.traverse((c) => {
				c.castShadow = true;
			});
			console.log(glb);
			this.box = new THREE.Box3();
			// glb.scene.children[0].geometry.computeBoundingBox();

			this.model = glb.scene;
			this.model.position.copy(this.position);
			this.model.rotation.copy(this.rotation);

			this.mixer = new THREE.AnimationMixer(glb.scene);
			const attackClip = glb.animations[0];
			const attackAction = this.mixer.clipAction(attackClip)	
			
			const runClip = glb.animations[1];
			const runAction = this.mixer.clipAction(runClip)	
			this.animations["attack"] = {
				clip: attackClip,
				action: attackAction
			}
			this.animations["running"] = {
				clip: runClip,
				action: runAction
			}

			// this.loadAnimations();
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

	genericUpdate(delta) {
		this.model.position.copy(this.position);
		this.model.rotation.copy(this.rotation);

		this.charRaycaster.ray.origin.copy(this.position);

		if (this.model) {
			// this.box.setFromObject(this.model.children[0], true)
			this.box.setFromCenterAndSize(
				this.position,
				new THREE.Vector3(10, 40, 10)
			);
			const helper = new THREE.Box3Helper(this.box, 0xffff00);
			this.scene.add(helper);
			this.enemyAI(delta);
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
			this.characterVelocity.z -=
				this.characterDirection.z * this.speed * delta;
		}
		if (this.left || this.right) {
			this.characterVelocity.x -=
				this.characterDirection.x * this.speed * delta;
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
