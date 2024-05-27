import * as THREE from "three";

import { GLTFLoader, ImprovedNoise } from "three/examples/jsm/Addons.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import generateTrees from "./src/world";
import Player from "./src/player";
import Orc from "./src/orc";
import setupLoadingManager from "./src/loader";

let scene, renderer, stats, delta;
let floor;
let player;
const axeSwing = new Audio("/weapons/axeSwing.wav");

const objects = [];
let vertices = [];

let mraycaster;
let animations = {};
let playerSpeed = 400;
let axe;
let characterMixer;
let attackAnimationPlaying = false;

let prevTime = performance.now();
const color = new THREE.Color();

const worldWidth = 64,
	worldDepth = 64;
let aspectRatio;
let orc;

let frameCount = 0;

setupLoadingManager();
init();
animate();

function init() {
	axeSwing.volume = 0.5;
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
	// fps and ms

	stats = new Stats();
	document.body.appendChild(stats.dom);

	const fov = 60;
	const aspect = window.innerWidth / window.innerHeight;
	const near = 1.0;
	const far = 3000;

	scene = new THREE.Scene();

	const startingPosition = new THREE.Vector3(0, 920, 0);
	player = new Player(scene, startingPosition);

	const orcStartingPosition = new THREE.Vector3(0, 940, -180);
	orc = new Orc(scene, orcStartingPosition, player);

	const uniforms = {
		topColor: { value: new THREE.Color(0x94bae0) },
		bottomColor: { value: new THREE.Color(0xe7edef) },
		offset: { value: 0 },
		exponent: { value: 2.0 },
	};

	scene.fog = new THREE.Fog(0xadc2d5, 0, 600);

	const vertexShader = document.getElementById("vertexShader").textContent;
	const fragmentShader =
		document.getElementById("fragmentShader").textContent;
	const skyGeo = new THREE.SphereGeometry(1800, 32, 16);
	const skyMat = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,
		side: THREE.BackSide,
	});

	const sky = new THREE.Mesh(skyGeo, skyMat);
	sky.position.y = 1000;

	scene.add(sky);
	scene.background = new THREE.Color(0xcfe2f3);

	const pointLight = new THREE.PointLight(0xffad57, 20, 100, 1);
	pointLight.position.set(0, 930, 0);
	scene.add(pointLight);

	let light = new THREE.DirectionalLight(0xe6e6e6, 0.3);
	light.position.set(500, 1500, 10);
	light.target.position.set(0, 900, 0);
	light.castShadow = true;
	light.shadow.bias = -0.001;
	light.shadow.mapSize.width = 1024;
	light.shadow.mapSize.height = 1024;
	light.shadow.camera.near = 100;
	light.shadow.camera.far = 3500.0;
	light.shadow.camera.left = 3000;
	light.shadow.camera.right = -3000;
	light.shadow.camera.top = 3000;
	light.shadow.camera.bottom = -3000;
	scene.add(light);
	// let lightHelper = new THREE.DirectionalLightHelper(light, 50);
	// scene.add(lightHelper);

	const ambLight = new THREE.AmbientLight(0xdbdbdb, 0.1);
	scene.add(ambLight);

	//skybox
	// const sky1 = new THREE.CubeTextureLoader()
	// 	.setPath("/")
	// 	.load([
	// 		"posx.jpg",
	// 		"negx.jpg",
	// 		"posy.jpg",
	// 		"negy.jpg",
	// 		"posz.jpg",
	// 		"negz.jpg",
	// 	]);
	// scene.background = sky1;
	// scene.environment = sky1;

	mraycaster = new THREE.Raycaster(
		new THREE.Vector3(),
		new THREE.Vector3(0, -1, 0),
		0,
		100
	);

	generateGround();

	// Weapon

	const weaponLoader = new GLTFLoader();
	weaponLoader.load("/weapons/Axe.glb", (weapon) => {
		weapon.scene.scale.setScalar(40);
		axe = weapon.scene;
		weapon.scene.position.y = player.camera.position.y;

		characterMixer = new THREE.AnimationMixer(weapon.scene);
		const clip = weapon.animations[0];
		const action = characterMixer.clipAction(clip);

		action.setLoop(THREE.LoopOnce);

		animations["axeSwing"] = {
			clip: clip,
			action: action,
		};
		scene.add(axe);
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

	document.addEventListener("wheel", (event) => {
		if (event.deltaY < 0) {
			playerSpeed += 50;
		}
		if (event.deltaY > 0) {
			playerSpeed -= 50;
		}
	});

	generateTrees(
		vertices.length / 3,
		800,
		"tree-op4.glb",
		scene,
		vertices,
		renderer
	);
	window.addEventListener("resize", onWindowResize);
}

function animate() {
	frameCount++;
	requestAnimationFrame(animate);

	const time = performance.now();
	delta = (time - prevTime) / 1000;
	stats.update();

	if (player.controls.isLocked === true) {
		let camdirection = new THREE.Vector3();
		player.camera.getWorldDirection(camdirection);

		axe.position.x = player.position.x + camdirection.x * 15;
		axe.position.y = player.position.y + camdirection.y * 15;
		axe.position.z = player.position.z + camdirection.z * 15;

		axe.setRotationFromEuler(player.rotation);
		axe.rotateY(-Math.PI / 2);
		axe.translateZ(-10);
		axe.translateY(-10);

		// if (frameCount % 60 == 0) {
		// 	console.clear();
		// 	console.log("axe: ", axe.rotation);
		// 	console.log("camera: ", camera.rotation);
		// }

		player._update(delta);
		orc._Update(delta);

		characterMixer.update(delta);
	}

	prevTime = time;

	renderer.render(scene, player.camera);
}

function onWindowResize() {
	player.camera.aspect = window.innerWidth / window.innerHeight;
	player.camera.updateProjectionMatrix();

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
		if (!attackAnimationPlaying) {
			attackAnimationPlaying = true;
			animations["axeSwing"].action.play();
			animations["axeSwing"].action.time = 0;
			animations["axeSwing"].action.paused = false;
			animations["axeSwing"].action.enabled = true;

			animations["axeSwing"].action
				.getMixer()
				.addEventListener("finished", function () {
					attackAnimationPlaying = false;
				});
			setTimeout(() => {
				axeSwing.play();
			}, 500);
		}

		pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
		pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

		mraycaster.setFromCamera(pointer, player.camera);
		var intersects = mraycaster.intersectObjects(scene.children);
		// if (intersects.length > 0) {
		// 	var marrow = new THREE.ArrowHelper(
		// 		mraycaster.ray.direction,
		// 		mraycaster.ray.origin,
		// 		20,
		// 		0xff0000
		// 	);
		// 	scene.add(marrow);
		// }
	},
	false
);

function generateGround() {
	let floorGeometry = new THREE.PlaneGeometry(
		3500,
		3500,
		worldWidth - 1,
		worldDepth - 1
	);
	floorGeometry.rotateX(-Math.PI / 2);

	// terrain generation

	let position = floorGeometry.attributes.position;

	const data = generateHeight(worldWidth, worldDepth);

	vertices = floorGeometry.attributes.position.array;

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
				perlin.noise(x / quality, y / quality, z) * quality * 2.25
			);
		}

		quality *= 5;
	}

	return data;
}
