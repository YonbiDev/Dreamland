
export class ModelLoader {
    constructor(scene: BABYLON.Scene,nameOfObject: String) {
        BABYLON.SceneLoader.ImportMeshAsync("", "", `${nameOfObject}.glb`, scene).then((result) => {
            result.meshes.forEach(mesh => {
                console.log(mesh.name); // Afficher les noms des objets
                mesh.checkCollisions = true; // Activer les collisions
            });
        });
        
    }
}