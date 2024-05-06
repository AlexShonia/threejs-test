import * as THREE from "three";

import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import {
	GLTFLoader,
	FBXLoader,
	ImprovedNoise,
} from "three/examples/jsm/Addons.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

let camera, scene, renderer, controls, stats;
let floor;

const objects = [];
let trees = [];

let raycaster;
let mraycaster;
let charRaycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let character;
let forward = false;
let backward = false;
let left = false;
let right = false;
const characterVelocity = new THREE.Vector3();
const characterDirection = new THREE.Vector3();

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const color = new THREE.Color();

const worldWidth = 156,
	worldDepth = 156;
let aspectRatio;

let arrowEnabled = false;

let mixer;

init();
animate();

function init() {
	// fps and ms

	stats = new Stats();
	document.body.appendChild(stats.dom);

	const fov = 90;
	const aspect = window.innerWidth / window.innerHeight;
	const near = 1.0;
	const far = 1000;

	camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.y = 1000;

	scene = new THREE.Scene();

	// const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
	// hemiLight.color.setHSL(0.6, 1, 0.6);

	// const uniforms = {
	// 	topColor: { value: new THREE.Color(0x0077ff) },
	// 	bottomColor: { value: new THREE.Color(0xffffff) },
	// 	offset: { value: 33 },
	// 	exponent: { value: 0.6 },
	// };
	// uniforms["topColor"].value.copy(hemiLight.color);

	// // scene.fog.color.copy(uniforms["bottomColor"].value);
	// const vertexShader = document.getElementById("vertexShader").textContent;
	// const fragmentShader =
	// 	document.getElementById("fragmentShader").textContent;
	// const skyGeo = new THREE.SphereGeometry(4000, 32, 15);
	// const skyMat = new THREE.ShaderMaterial({
	// 	uniforms: uniforms,
	// 	vertexShader: vertexShader,
	// 	fragmentShader: fragmentShader,
	// 	side: THREE.BackSide,
	// });

	// const sky = new THREE.Mesh(skyGeo, skyMat);
	// scene.add(sky);
	scene.background = new THREE.Color(0xcfe2f3);
	scene.fog = new THREE.Fog(0xcfe2f3, 0, 600);

	const pointLight = new THREE.PointLight(0xffad57, 20, 100, 1);
	pointLight.position.set(0, 990, 0);
	scene.add(pointLight);

	let light = new THREE.DirectionalLight(0xe6e6e6, 0.3);
	light.position.set(500, 3200, 10);
	light.target.position.set(0, 0, 0);
	light.castShadow = true;
	light.shadow.bias = -0.001;
	light.shadow.mapSize.width = 1024;
	light.shadow.mapSize.height = 1024;
	light.shadow.camera.near = 0.1;
	light.shadow.camera.far = 2000.0;
	light.shadow.camera.near = 2000;
	light.shadow.camera.far = 3500.0;
	light.shadow.camera.left = 3000;
	light.shadow.camera.right = -3000;
	light.shadow.camera.top = 3000;
	light.shadow.camera.bottom = -3000;
	scene.add(light);
	// let lightHelper = new THREE.DirectionalLightHelper(light, 5);
	// scene.add(lightHelper);

	const ambLight = new THREE.AmbientLight(0xdbdbdb, 0.1);
	scene.add(ambLight);

	//skybox
	// const sky = new THREE.CubeTextureLoader()
	// 	.setPath("/")
	// 	.load([
	// 		"posx.jpg",
	// 		"negx.jpg",
	// 		"posy.jpg",
	// 		"negy.jpg",
	// 		"posz.jpg",
	// 		"negz.jpg",
	// 	]);
	// scene.background = sky;
	// scene.environment = sky;

	playerControls();

	function toggleArrow() {
		arrowEnabled = !arrowEnabled;
	}

	let toggleButton = document.getElementById("toggle");

	toggleButton.addEventListener("click", toggleArrow);

	raycaster = new THREE.Raycaster(
		new THREE.Vector3(),
		new THREE.Vector3(0, -1, 0),
		0,
		10
	);

	charRaycaster = new THREE.Raycaster(
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
	generateGround();

	// trees
	generateTrees(300, 25);

	document.addEventListener("keydown", (event) => {
		switch (event.code) {
			case "Numpad8":
				forward = true;
				break;
			case "Numpad5":
				backward = true;
				break;
			case "Numpad4":
				left = true;
				break;
			case "Numpad6":
				right = true;
				break;
			case "Numpad0":
				characterVelocity.y += 250;
				break;
		}
	});
	document.addEventListener("keyup", (event) => {
		switch (event.code) {
			case "Numpad8":
				forward = false;
				break;
			case "Numpad5":
				backward = false;
				break;
			case "Numpad4":
				left = false;
				break;
			case "Numpad6":
				right = false;
				break;
		}
	});

	//character
	const characterLoader = new FBXLoader();
	characterLoader.setPath("./character/");
	characterLoader.load("character.fbx", (fbx) => {
		fbx.scale.setScalar(0.1);
		fbx.traverse((c) => {
			c.castShadow = true;
		});
		fbx.position.y = 995;
		fbx.position.z = -10;
		character = fbx;

		// const anim = new FBXLoader();
		// anim.setPath("./character/");
		// anim.load("sword and shield walk (2).fbx", (anim) => {
		// 	mixer = new THREE.AnimationMixer(fbx);
		// 	const sheath = mixer.clipAction(anim.animations[0]);
		// 	sheath.play();
		// });

		scene.add(fbx);
	});

	// objects

	const boxGeometry = new THREE.BoxGeometry(20, 20, 20).toNonIndexed();

	let position = boxGeometry.attributes.position;
	const colorsBox = [];

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
		box.position.y = Math.floor(Math.random() * 20) * 20 + 1000;
		box.position.z = Math.floor(Math.random() * 20 - 10) * 20;
		box.receiveShadow = true;
		box.castShadow = true;

		scene.add(box);
		objects.push(box);
	}

	aspectRatio = 1;
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.shadowMap.autoUpdate = false;
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(
		window.innerWidth * aspectRatio,
		window.innerHeight * aspectRatio,
		false
	);
	document.body.appendChild(renderer.domElement);

	window.addEventListener("resize", onWindowResize);
}

function animate() {
	requestAnimationFrame(animate);

	const time = performance.now();
	stats.update();
	if (controls.isLocked === true) {
		raycaster.ray.origin.copy(controls.getObject().position);
		raycaster.ray.origin.y -= 10;

		charRaycaster.ray.origin.copy(character.position);
		charRaycaster.ray.origin.y -= 10;

		const charIntersections = charRaycaster.intersectObjects(
			scene.children,
			false
		);
		const intersections = raycaster.intersectObjects(scene.children, false);
		// console.log("camera: ", controls.getObject().position.y);
		// console.log("intersection: ", intersections[0]?.point.y);

		if (intersections[0]) {
			controls.getObject().position.y = intersections[0]?.point.y + 16.85;
		}
		// console.log(controls.getObject().position.y);

		if (arrowEnabled) {
			let arrow = new THREE.ArrowHelper(
				raycaster.ray.direction,
				raycaster.ray.origin,
				8,
				0xff0000
			);
			scene.add(arrow);
		}
		const charOnObject = charIntersections.length > 0;
		const onObject = intersections.length > 0;

		const delta = (time - prevTime) / 1000;
		// mixer.update(delta);

		velocity.x -= velocity.x * 5.0 * delta;
		velocity.z -= velocity.z * 5.0 * delta;

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

		// controls.getObject().position.y = character.position.y + 22;
		// controls.getObject().position.x = character.position.x;
		// controls.getObject().position.z = character.position.z - 10;
		characterVelocity.x -= characterVelocity.x * 5.0 * delta;
		characterVelocity.z -= characterVelocity.z * 5.0 * delta;

		characterVelocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

		characterDirection.z = Number(forward) - Number(backward);
		characterDirection.x = Number(left) - Number(right);
		characterDirection.normalize();

		if (forward || backward) {
			characterVelocity.z -= characterDirection.z * 400 * delta;
		}
		if (left || right) {
			characterVelocity.x -= characterDirection.x * 400 * delta;
		}

		if (charOnObject === true) {
			characterVelocity.y = Math.max(0, characterVelocity.y);
		}

		character.position.z += -characterVelocity.z * delta;
		character.position.x += -characterVelocity.x * delta;

		if (charIntersections[0]) {
			character.position.y = charIntersections[0]?.point.y + 16.85;
		}

		character.position.y += characterVelocity.y * delta;
		// if(left){
		// 	character.position.x += 20 * delta;
		// }
		// if(right){
		// 	character.position.x -= 20 * delta;
		// }
		controls.moveRight(-velocity.x * delta);
		controls.moveForward(-velocity.z * delta);

		controls.getObject().position.y += velocity.y * delta; // new behavior

		if (controls.getObject().position.y < intersections[0]?.point.y) {
			velocity.y = 0;
			controls.getObject().position.y = 10;

			canJump = true;
		}
	}

	prevTime = time;

	renderer.render(scene, camera);
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

function playerControls() {
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

function generateGround() {
	let floorGeometry = new THREE.PlaneGeometry(
		7500,
		7500,
		worldWidth - 1,
		worldDepth - 1
	);
	floorGeometry.rotateX(-Math.PI / 2);

	// terrain generation

	let position = floorGeometry.attributes.position;

	const data = generateHeight(worldWidth, worldDepth);

	const vertices = floorGeometry.attributes.position.array;

	for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
		vertices[j + 1] = data[i] * 10;
	}

	const textureLoader = new THREE.TextureLoader();
	textureLoader.load("textures/grass.jpg", function (texture) {
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(150, 150);
		const floorMaterial = new THREE.MeshStandardMaterial({
			map: texture,
		});

		let wireframeBtn = document.getElementById("wireframe");

		wireframeBtn.addEventListener("click", () => {
			floorMaterial.wireframe = !floorMaterial.wireframe;
		});

		floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.castShadow = false;
		floor.receiveShadow = true;
		scene.add(floor);
	});
}

function generateTrees(numberOfTrees, treeSpawnArea) {
	const modelLoader = new GLTFLoader();
	modelLoader.load("/models/tree/tree.glb", function (treeModel) {
		treeModel.scene.traverse((child) => {
			if (child.isMesh) {
				child.castShadow = true;
			}
		});
		for (let i = 0; i < numberOfTrees; i++) {
			const tree = treeModel.scene.clone();
			tree.position.x = (Math.random() * 30 - 12) * treeSpawnArea;
			tree.position.z = (Math.random() * 30 - 12) * treeSpawnArea;
			tree.position.y = 1300;
			tree.rotateY(Math.random() * 360);
			tree.scale.copy(
				new THREE.Vector3(1, 1, 1).multiplyScalar(
					Math.random() * 3 + 10
				)
			);
			scene.add(tree);
			trees.push(tree);
		}

		const treeRaycaster = new THREE.Raycaster();
		let toGround = new THREE.Vector3(0, -1, 0);

		for (let i = 0; i < numberOfTrees; i++) {
			const treePos = trees[i].position;

			treeRaycaster.set(treePos, toGround);
			const grIntersect = treeRaycaster.intersectObject(floor);
			if (grIntersect.length > 0) {
				trees[i].position.y -= grIntersect[0].distance;
			}
		}
		// 	// const arr = new THREE.ArrowHelper(
		// 	// 	treeRaycaster.ray.direction,
		// 	// 	treeRaycaster.ray.origin,
		// 	// 	8,
		// 	// 	0xff0000
		// 	// );
		// 	// scene.add(arr);
		// }

		renderer.shadowMap.needsUpdate = true;
		trees = null;
	});
}
