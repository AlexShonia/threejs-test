import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

import Entity from "./entity";

export default class Player extends Entity {
	constructor(scene, startingPosition) {
		super();
		this.health = 100;
		this.speed = 400;
		this.damage = 50;
		const fov = 60;
		const aspect = window.innerWidth / window.innerHeight;
		const near = 1.0;
		const far = 3000;
		this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		this.position = startingPosition; // Set position first
		this.camera.position.copy(this.position);
		this.camera.setRotationFromEuler(this.rotation);
		this.healthBar = document.getElementById("healthBar");

		this.arrowEnabled = false;

		this.raycaster = new THREE.Raycaster(
			new THREE.Vector3(),
			new THREE.Vector3(0, -1, 0),
			0,
			10
		);

		this.moveForward = false;
		this.moveBackward = false;
		this.moveLeft = false;
		this.moveRight = false;
		this.canJump = false;

		this.velocity = new THREE.Vector3();
		this.direction = new THREE.Vector3();
		// this.weapon = new Weapon();

		this.scene = scene;

		this.initializeControls();
		const toggleArrow = () => {
			this.arrowEnabled = !this.arrowEnabled;
		};

		let toggleButton = document.getElementById("toggle");

		toggleButton.addEventListener("click", toggleArrow);
	}

	initializeControls() {
		this.controls = new PointerLockControls(this.camera, document.body);

		this.blocker = document.getElementById("blocker");
		this.instructions = document.getElementById("instructions");

		this.instructions.addEventListener(
			"click",
			() => {
				this.controls.lock();
			},
			false
		);

		this.controls.addEventListener("lock", () => {
			this.instructions.style.display = "none";
			this.blocker.style.display = "none";
		});

		this.controls.addEventListener("unlock", () => {
			this.blocker.style.display = "block";
			this.instructions.style.display = "";
		});

		this.scene.add(this.controls.getObject());

		const onKeyDown = (event) => {
			switch (event.code) {
				case "ArrowUp":
				case "KeyW":
					this.moveForward = true;
					break;

				case "ArrowLeft":
				case "KeyA":
					this.moveLeft = true;
					break;

				case "ArrowDown":
				case "KeyS":
					this.moveBackward = true;
					break;

				case "ArrowRight":
				case "KeyD":
					this.moveRight = true;
					break;

				case "Space":
					this.velocity.y += 350;
					this.canJump = false;
					break;
			}
		};

		const onKeyUp = (event) => {
			switch (event.code) {
				case "ArrowUp":
				case "KeyW":
					this.moveForward = false;
					break;

				case "ArrowLeft":
				case "KeyA":
					this.moveLeft = false;
					break;

				case "ArrowDown":
				case "KeyS":
					this.moveBackward = false;
					break;

				case "ArrowRight":
				case "KeyD":
					this.moveRight = false;
					break;
			}
		};
		document.addEventListener("keydown", onKeyDown);
		document.addEventListener("keyup", onKeyUp);
	}

	update(delta) {
		// TODO: may be innficient checking healthbar every fame?
		this.healthBar.style.width = `${this.health * 2}px`;
		this.position.copy(this.camera.position);
		this.rotation.copy(this.camera.rotation);
		this.raycaster.ray.origin.copy(this.controls.getObject().position);
		this.raycaster.ray.origin.y -= 10;

		this.velocity.x -= this.velocity.x * 5.0 * delta;
		this.velocity.z -= this.velocity.z * 5.0 * delta;

		this.velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

		this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
		this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
		this.direction.normalize(); // this ensures consistent movements in all directions

		const intersections = this.raycaster.intersectObjects(
			this.scene.children,
			false
		);
		const onObject = intersections.length > 0;

		if (intersections[0]) {
			this.controls.getObject().position.y =
				intersections[0]?.point.y + 16.85;
		}

		if (this.moveForward || this.moveBackward)
			this.velocity.z -= this.direction.z * this.speed * delta;
		if (this.moveLeft || this.moveRight)
			this.velocity.x -= this.direction.x * this.speed * delta;

		if (onObject === true) {
			this.velocity.y = Math.max(0, this.velocity.y);
			this.canJump = true;
		}
		this.controls.moveRight(-this.velocity.x * delta);
		this.controls.moveForward(-this.velocity.z * delta);

		this.controls.getObject().position.y += this.velocity.y * delta; // new behavior

		if (this.controls.getObject().position.y < intersections[0]?.point.y) {
			this.velocity.y = 0;
			this.controls.getObject().position.y = 10;

			this.canJump = true;
		}

		if (this.health <= 0) {
			this.camera.position.set(0, 920, 0);
			// character.position.set(0, 940, -180);

			this.blocker.style.display = "block";
			this.instructions.style.display = "";
			this.controls.unlock();
			this.health = 100;
		}

		if (this.arrowEnabled) {
			let arrow = new THREE.ArrowHelper(
				this.raycaster.ray.direction,
				this.raycaster.ray.origin,
				8,
				0xff0000
			);
			this.scene.add(arrow);
		}
	}
}
