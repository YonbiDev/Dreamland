import * as BABYLON from 'babylonjs';
export class Grid {
    private gridMesh: BABYLON.Mesh;
    private largeGround: BABYLON.Mesh;

    constructor(scene: BABYLON.Scene, cellSize: number, numCellsX: number, numCellsZ: number) {
        const gridSizeX = cellSize * numCellsX;
        const gridSizeZ = cellSize * numCellsZ;
        
        // Création de la grille (1 seul mesh)
      /*  this.gridMesh = BABYLON.MeshBuilder.CreateGround("grid", { width: gridSizeX, height: gridSizeZ }, scene);
        this.gridMesh.position.set(gridSizeX / 2 - cellSize / 2, 0, gridSizeZ / 2 - cellSize / 2);
        this.gridMesh.isPickable = true;
        
        // Création de la texture dynamique pour dessiner la grille
        const gridTexture = new BABYLON.DynamicTexture("gridTexture", { width: 1024, height: 1024 }, scene, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
        const gridContext = gridTexture.getContext();
        
        // Dessin des lignes de la grille
        gridContext.strokeStyle = "#1d1d1d"; // coleur des lignes 
        gridContext.lineWidth = 2;   // width des lignes
        for (let i = 0; i <= numCellsX; i++) {
            gridContext.beginPath();
            gridContext.moveTo(i * (gridTexture.getSize().width / numCellsX), 0);
            gridContext.lineTo(i * (gridTexture.getSize().width / numCellsX), gridTexture.getSize().height);
            gridContext.stroke();
        }
        for (let i = 0; i <= numCellsZ; i++) {
            gridContext.beginPath();
            gridContext.moveTo(0, i * (gridTexture.getSize().height / numCellsZ));
            gridContext.lineTo(gridTexture.getSize().width, i * (gridTexture.getSize().height / numCellsZ));
            gridContext.stroke();
        }
        gridTexture.update();
        
        // Application du matériau
        const gridMaterial = new BABYLON.StandardMaterial("gridMaterial", scene);
        gridMaterial.diffuseTexture = gridTexture;
        gridMaterial.diffuseTexture.hasAlpha = true;
        this.gridMesh.material = gridMaterial;
        */
        // Ajout du sol sous la grille
        const largeGroundMat = new BABYLON.StandardMaterial("largeGroundMat");
        largeGroundMat.diffuseTexture = new BABYLON.Texture("https://assets.babylonjs.com/environments/valleygrass.png");
        
        this.largeGround = BABYLON.MeshBuilder.CreateGround("longGround",  { width: gridSizeX, height: gridSizeZ });
        
        this.largeGround.isPickable = true;
        this.largeGround.material = largeGroundMat;
        this.largeGround.position.y = -0.01;
        
       

    }

    getMesh(): BABYLON.Mesh {
        return this.largeGround;
    }
}
