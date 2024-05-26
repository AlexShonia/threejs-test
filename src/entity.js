import * as THREE from "three";

export default class Entity {
	constructor() {
		this.health = 0;
		this.speed = 0;
		this.position = new THREE.Vector3();
		this.rotation = new THREE.Euler();
	}

	Update() {}
}
