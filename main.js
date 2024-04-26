import * as THREE from "three";

import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

let camera, scene, renderer, controls;

const objects = [];

let raycaster;
let mraycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();

const worldWidth = 256,
	worldDepth = 256;
let aspectRatio;

init();
animate();

function init() {
	camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		1,
		1000
	);
	camera.position.y = 10;

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xcfe2f3);
	scene.fog = new THREE.Fog(0xcfe2f3, 0, 750);

	const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 2.5);
	light.position.set(0.5, 1, 0.75);
	scene.add(light);

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
				if (canJump === true) velocity.y += 350;
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

	raycaster = new THREE.Raycaster(
		new THREE.Vector3(),
		new THREE.Vector3(0, -1, 0),
		0,
		10
	);
	mraycaster = new THREE.Raycaster(
		new THREE.Vector3(),
		new THREE.Vector3(0, -1, 0),
		0,
		10
	);

	// floor

	let floorGeometry = new THREE.PlaneGeometry(2000, 2000, 10, 10);
	floorGeometry.rotateX(-Math.PI / 2);

	// vertex displacement

	let position = floorGeometry.attributes.position;

	for (let i = 0, l = position.count; i < l; i++) {
		vertex.fromBufferAttribute(position, i);

		vertex.x += Math.random() * 20 - 10;
		vertex.y += Math.random() * 60;
		vertex.z += Math.random() * 20 - 10;

		position.setXYZ(i, vertex.x, vertex.y, vertex.z);
	}
	// floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices

	position = floorGeometry.attributes.position;
	const colorsFloor = [];

	for (let i = 0, l = position.count; i < l; i++) {
		color.setHSL(
			Math.random() * 0.1 + 0.3,
			0.2,
			Math.random() * 0.1 + 0.35,
			THREE.SRGBColorSpace
		);
		colorsFloor.push(color.r, color.g, color.b);
	}

	floorGeometry.setAttribute(
		"color",
		new THREE.Float32BufferAttribute(colorsFloor, 3)
	);
	const loader = new THREE.TextureLoader();
	loader.load("textures/grass.png", function (texture) {
		console.log(texture);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(100, 100);
		const floorMaterial = new THREE.MeshBasicMaterial({
			// vertexColors: true,
			map: texture,
		});

		const floor = new THREE.Mesh(floorGeometry, floorMaterial);
		scene.add(floor);
	});

	// objects

	const boxGeometry = new THREE.BoxGeometry(20, 20, 20).toNonIndexed();

	position = boxGeometry.attributes.position;
	const colorsBox = [];

	floorGeometry = floorGeometry.toNonIndexed();

	for (let i = 0, l = position.count; i < l; i++) {
		color.setHSL(
			Math.random() * 0.3 + 0.5,
			0.75,
			Math.random() * 0.25 + 0.75,
			THREE.SRGBColorSpace
		);
		colorsBox.push(color.r, color.g, color.b);
	}

	boxGeometry.setAttribute(
		"color",
		new THREE.Float32BufferAttribute(colorsBox, 3)
	);

	for (let i = 0; i < 1; i++) {
		const boxMaterial = new THREE.MeshPhongMaterial({
			specular: 0xffffff,
			flatShading: true,
			vertexColors: true,
		});
		boxMaterial.color.setHSL(
			Math.random() * 0.2 + 0.5,
			0.75,
			Math.random() * 0.25 + 0.75,
			THREE.SRGBColorSpace
		);

		const box = new THREE.Mesh(boxGeometry, boxMaterial);
		box.position.x = Math.floor(Math.random() * 20 - 10) * 20;
		box.position.y = Math.floor(Math.random() * 20) * 20 + 10;
		box.position.z = Math.floor(Math.random() * 20 - 10) * 20;

		scene.add(box);
		objects.push(box);
	}

	aspectRatio = 0.666666;
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(
		window.innerWidth / aspectRatio,
		window.innerHeight / aspectRatio,
		false
	);
	document.body.appendChild(renderer.domElement);

	window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(
		window.innerWidth / aspectRatio,
		window.innerHeight / aspectRatio,
		false
	);
}
var pointer = new THREE.Vector2();

document.addEventListener(
	"mousedown",
	function (event) {
		pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
		pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
		console.log(pointer);

		mraycaster.setFromCamera(pointer, camera);
		var intersects = mraycaster.intersectObjects(scene.children);
		if (intersects.length > 0) {
			var marrow = new THREE.ArrowHelper(
				mraycaster.ray.direction,
				mraycaster.ray.origin,
				8,
				0xff0000
			);
			scene.add(marrow);
		}
	},
	false
);

function animate() {
	requestAnimationFrame(animate);

	const time = performance.now();

	if (controls.isLocked === true) {
		raycaster.ray.origin.copy(controls.getObject().position);
		raycaster.ray.origin.y -= 10;

		const intersections = raycaster.intersectObjects(scene.children, false);

		// let arrow = new THREE.ArrowHelper(
		// 	raycaster.ray.direction,
		// 	raycaster.ray.origin,
		// 	8,
		// 	0xff0000
		// );
		// scene.add(arrow);
		const onObject = intersections.length > 0;

		const delta = (time - prevTime) / 1000;

		velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;

		velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

		direction.z = Number(moveForward) - Number(moveBackward);
		direction.x = Number(moveRight) - Number(moveLeft);
		direction.normalize(); // this ensures consistent movements in all directions
		event;

		if (moveForward || moveBackward)
			velocity.z -= direction.z * 400.0 * delta;
		if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

		if (onObject === true) {
			velocity.y = Math.max(0, velocity.y);
			canJump = true;
		}
		controls.moveRight(-velocity.x * delta);
		controls.moveForward(-velocity.z * delta);

		controls.getObject().position.y += velocity.y * delta; // new behavior

		if (controls.getObject().position.y < 10) {
			velocity.y = 0;
			controls.getObject().position.y = 10;

			canJump = true;
		}
	}

	prevTime = time;

	renderer.render(scene, camera);
}

function generateHeight(width, height) {
	let seed = Math.PI / 4;
	window.Math.random = function () {
		const x = Math.sin(seed++) * 10000;
		return x - Math.floor(x);
	};

	const size = width * height,
		data = new Uint8Array(size);
	const perlin = new ImprovedNoise(),
		z = Math.random() * 100;

	let quality = 1;

	for (let j = 0; j < 4; j++) {
		for (let i = 0; i < size; i++) {
			const x = i % width,
				y = ~~(i / width);
			data[i] += Math.abs(
				perlin.noise(x / quality, y / quality, z) * quality * 1.75
			);
		}

		quality *= 5;
	}

	return data;
}
