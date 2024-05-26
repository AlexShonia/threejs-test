import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

export default function generateTrees(
	numberOfTrees,
	treeSpawnArea,
	treeName,
	scene,
	vertices,
	renderer
) {
	const modelLoader = new GLTFLoader();
	modelLoader.load(`/models/tree/${treeName}`, function (treeModel) {
		// treeModel.scene.traverse((child) => {
		// 	if (child.isMesh) {
		// 		child.castShadow = true;
		// 	}
		// });

		const treeBodyModel = treeModel.scene.children[0];
		const treeLeavesModel = treeModel.scene.children[1];

		const instancedTreeBody = new THREE.InstancedMesh(
			treeBodyModel.geometry,
			treeBodyModel.material,
			numberOfTrees
		);
		instancedTreeBody.castShadow = true;

		const instancedTreeLeaves = new THREE.InstancedMesh(
			treeLeavesModel.geometry,
			treeLeavesModel.material,
			numberOfTrees
		);
		instancedTreeLeaves.castShadow = true;

		// const treeRaycaster = new THREE.Raycaster();
		// let toGround = new THREE.Vector3(0, -1, 0);

		for (
			let i = 0, j = 0, k = 1, l = 2;
			i < numberOfTrees;
			i++, j += 3, k += 3, l += 3
		) {
			// random values
			let x = vertices[j];
			let y = vertices[k];
			let z = vertices[l];
			const random = {
				x: (Math.random() - 0.5) * treeSpawnArea,
				y: (Math.random() - 0.5) * treeSpawnArea,
				z: (Math.random() - 0.5) * treeSpawnArea,
			};

			// body
			const bodyTransformation = new THREE.Vector3(0, 0, 0);
			const bodyOrientation = new THREE.Quaternion();
			const bodyScale = new THREE.Vector3(10, 10, 10);

			bodyTransformation.x += x + (Math.random() - 0.5) * 40;
			bodyTransformation.z += z + (Math.random() - 0.5) * 40;
			bodyTransformation.y = y;

			const randomRotation = new THREE.Euler(
				treeBodyModel.rotation.x,
				treeBodyModel.rotation.y - random.y,
				treeBodyModel.rotation.z
			);
			bodyOrientation.setFromEuler(randomRotation);

			const bodyMatrix = new THREE.Matrix4();
			bodyMatrix.compose(bodyTransformation, bodyOrientation, bodyScale);

			instancedTreeBody.setMatrixAt(i, bodyMatrix);

			// leaves
			const leavesTransformation = new THREE.Vector3(0, 0, 0);
			const leavesOrientation = new THREE.Quaternion();
			const leavesScale = new THREE.Vector3(10, 10, 10);

			// setting them back to orginal matrix
			const randomLeavesRotation = new THREE.Euler(
				treeLeavesModel.rotation.x,
				treeLeavesModel.rotation.y - random.y,
				treeLeavesModel.rotation.z
			);

			leavesOrientation.setFromEuler(randomLeavesRotation);

			// console.log(randomLeavesRotation.y);
			// console.log("--");
			// console.log(randomRotation.y);

			leavesTransformation.x += bodyTransformation.x;
			leavesTransformation.z += bodyTransformation.z;
			leavesTransformation.y = bodyTransformation.y;

			const leavesMatrix = new THREE.Matrix4();
			leavesMatrix.compose(
				leavesTransformation,
				leavesOrientation,
				leavesScale
			);

			instancedTreeLeaves.setMatrixAt(i, leavesMatrix);
		}
		scene.add(instancedTreeBody);
		scene.add(instancedTreeLeaves);

		renderer.shadowMap.needsUpdate = true;
	});
}
