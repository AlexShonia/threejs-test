import * as THREE from "three";
import Entity from "./entity";
import { FBXLoader } from "three/examples/jsm/Addons.js";

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
	}

	loadModel() {}

	Update() {}
}
