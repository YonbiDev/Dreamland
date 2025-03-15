import * as BABYLON from 'babylonjs';

export class ModelLoader {
    constructor(scene: BABYLON.Scene) {
        BABYLON.SceneLoader.ImportMeshAsync("", "", "Axe_01.glb", scene)
            .then(result => console.log("Model loaded", result.meshes))
            .catch(error => console.error("Error loading model:", error));
    }
}