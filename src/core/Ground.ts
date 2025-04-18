import * as BABYLON from "babylonjs";
export class Ground {

    constructor(scene: BABYLON.Scene) {
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);
        const gridMaterial = new BABYLON.StandardMaterial("gridMaterial", scene);

        const gridTexture = new BABYLON.DynamicTexture("gridTexture", { width: 1024, height: 1024 }, scene, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);  //Set sampling mode
        const gridContext = gridTexture.getContext();

        gridContext.strokeStyle = "#1d1d1d";  // Dark grey
        gridContext.lineWidth = 2;

        gridMaterial.diffuseTexture = gridTexture;
        gridMaterial.diffuseTexture.hasAlpha = true;

        const largeGroundMat = new BABYLON.StandardMaterial("largeGroundMat");
        largeGroundMat.diffuseTexture = new BABYLON.Texture("https://assets.babylonjs.com/environments/valleygrass.png");
        const largeGround = BABYLON.MeshBuilder.CreateGround("longGround", { width: 500, height: 500 });
        largeGround.material = largeGroundMat;
        largeGround.position.y = -0.01;
    }
}