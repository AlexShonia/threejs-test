import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

export default function playerControls(camera, controls, scene) {
	controls = new PointerLockControls(camera, document.body);

	const blocker = document.getElementById("blocker");
	const instructions = document.getElementById("instructions");

	instructions.addEventListener("click", function () {
		controls.lock();
	});

	controls.addEventListener("lock", function () {
		instructions.style.display = "none";
		blocker.style.display = "none";
	});

	controls.addEventListener("unlock", function () {
		blocker.style.display = "block";
		instructions.style.display = "";
	});

	scene.add(controls.getObject());

	const onKeyDown = function (event) {
		switch (event.code) {
			case "ArrowUp":
			case "KeyW":
				moveForward = true;
				break;

			case "ArrowLeft":
			case "KeyA":
				moveLeft = true;
				break;

			case "ArrowDown":
			case "KeyS":
				moveBackward = true;
				break;

			case "ArrowRight":
			case "KeyD":
				moveRight = true;
				break;

			case "Space":
				velocity.y += 550;
				canJump = false;
				break;
		}
	};

	const onKeyUp = function (event) {
		switch (event.code) {
			case "ArrowUp":
			case "KeyW":
				moveForward = false;
				break;

			case "ArrowLeft":
			case "KeyA":
				moveLeft = false;
				break;

			case "ArrowDown":
			case "KeyS":
				moveBackward = false;
				break;

			case "ArrowRight":
			case "KeyD":
				moveRight = false;
				break;
		}
	};
	document.addEventListener("keydown", onKeyDown);
	document.addEventListener("keyup", onKeyUp);
}