export class ModelLoader {
    static loadModel(
        scene: BABYLON.Scene,
        modelName: string,
        callback: (result: {
            meshes: BABYLON.AbstractMesh[];
            particleSystems: BABYLON.IParticleSystem[];
            skeletons: BABYLON.Skeleton[];
            animationGroups: BABYLON.AnimationGroup[];
        }) => void
    ): void {
        BABYLON.SceneLoader.ImportMesh(
            "",
            "/",
            `${modelName}.glb`,
            scene,
            (meshes, particleSystems, skeletons, animationGroups) => {
                callback({ meshes, particleSystems, skeletons, animationGroups });
            }
        );
    }
}