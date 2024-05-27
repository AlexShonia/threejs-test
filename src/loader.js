import * as THREE from "three";
let loadingComponent = document.getElementById("loading");
let blocker = document.getElementById("blocker");
let health = document.getElementById("health");
let toggle = document.getElementById("toggle");
let wireframe = document.getElementById("wireframe");

export default function setupLoadingManager() {
	THREE.DefaultLoadingManager.onStart = function (
		url,
		itemsLoaded,
		itemsTotal
	) {
		console.log(
			"Started loading file: " +
				url +
				".\nLoaded " +
				itemsLoaded +
				" of " +
				itemsTotal +
				" files."
		);
	};

	THREE.DefaultLoadingManager.onLoad = function () {
		console.log("Loading complete!");
		loadingComponent.style.display = "none";

		blocker.style.display = "block";
		health.style.display = "block";
		toggle.style.display = "block";
		wireframe.style.display = "block";
	};

	THREE.DefaultLoadingManager.onProgress = function (
		url,
		itemsLoaded,
		itemsTotal
	) {
		console.log(
			"Loading file: " +
				url +
				".\nLoaded " +
				itemsLoaded +
				" of " +
				itemsTotal +
				" files."
		);
	};

	THREE.DefaultLoadingManager.onError = function (url) {
		console.log("There was an error loading " + url);
	};
}
