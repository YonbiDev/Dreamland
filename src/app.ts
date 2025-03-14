import * as BABYLON from 'babylonjs';

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// Camera (Age of Empires style)
function createAgeOfEmpiresCamera(scene, canvas) {
    const camera = new BABYLON.FreeCamera("AgeOfEmpiresCamera", new BABYLON.Vector3(0, 100, 0), scene);
    camera.setTarget(new BABYLON.Vector3(0, 0, 0));

    let moveSpeed = 2;
    let zoomSpeed = 1;

    scene.onBeforeRenderObservable.add(() => {
        let effectiveMoveSpeed = moveSpeed * camera.position.y / 50;


        if (camera.position.y < 10) { camera.position.y = 10; }
        if (camera.position.y > 100) { camera.position.y = 100; }
        camera.setTarget(new BABYLON.Vector3(camera.position.x, 0, camera.position.z));
    });

    const edgeScrollSpeed = 0.1;
    scene.onBeforeRenderObservable.add(() => {
        if (scene.pointerX < canvas.width * 0.1) { camera.position.x -= edgeScrollSpeed * camera.position.y / 50; }
        else if (scene.pointerX > canvas.width * 0.9) { camera.position.x += edgeScrollSpeed * camera.position.y / 50; }
        if (scene.pointerY < canvas.height * 0.1) { camera.position.z += edgeScrollSpeed * camera.position.y / 50; }
        else if (scene.pointerY > canvas.height * 0.9) { camera.position.z -= edgeScrollSpeed * camera.position.y / 50; }
    });

    return camera;
}


// Grid
const cellSize = 5;
const numCellsX = 20;
const numCellsZ = 20;

function createGrid(scene, cellSize, numCellsX, numCellsZ) {
    const gridSizeX = cellSize * numCellsX;
    const gridSizeZ = cellSize * numCellsZ;

    // Calculate the correct offset to center the grid
    const offsetX = gridSizeX / 2 - cellSize / 2;
    const offsetZ = gridSizeZ / 2 - cellSize / 2;


    // Create the ground mesh for the grid (adjust size as needed)
    const grid = BABYLON.MeshBuilder.CreateGround("grid", { width: gridSizeX, height: gridSizeZ, subdivisions: 1 }, scene);
    grid.position.x = cellSize * numCellsX / 2 - cellSize/2 // center the grid.
    grid.position.z = cellSize * numCellsZ / 2 - cellSize/2 // center the grid.



        const gridTexture = new BABYLON.DynamicTexture("gridTexture", { width: 1024, height: 1024 }, scene, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);  //Set sampling mode
        const gridContext = gridTexture.getContext();

        gridContext.strokeStyle = "#1d1d1d";  // Dark grey
        gridContext.lineWidth = 2;

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



    const gridMaterial = new BABYLON.StandardMaterial("gridMaterial", scene);
    gridMaterial.diffuseTexture = gridTexture;
    gridMaterial.diffuseTexture.hasAlpha = true;

    grid.material = gridMaterial;
    return grid;
}


// Box creation and placement
let selectedObject = null;

function createBoxAtPosition(position) {
  const box = BABYLON.MeshBuilder.CreateBox("box", { size: cellSize * 0.8 }, scene);
  const boxMaterial = new BABYLON.StandardMaterial("boxMaterial", scene);
  boxMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
  box.material = boxMaterial;
  box.position = position;
  return box;
}


// Scene setup
const camera = createAgeOfEmpiresCamera(scene, canvas);
scene.activeCamera = camera;

const grid = createGrid(scene, cellSize, numCellsX, numCellsZ);
grid.isPickable = true;


function snapToGrid(position, cellSize) {
    const x = Math.round(position.x / cellSize) * cellSize;
    const z = Math.round(position.z / cellSize) * cellSize;
    return new BABYLON.Vector3(x, 0.5 * cellSize, z); // Place box slightly above grid
}



scene.onPointerDown = function(evt, pickResult) {
    // Correct condition to check if the click is on the grid
    console.log(`clicking`);
    console.log(evt.button );
    console.log(pickResult.hit );
    console.log(pickResult.pickedMesh );
    if (
        evt.button !== 0 ||
        !pickResult.hit ||
        !(pickResult.pickedMesh === grid || pickResult.pickedMesh.parent === grid) //Check if the grid or a child of the grid was picked
      ) {
        return;
      }
    console.log(`passed`);
    const snappedPosition = snapToGrid(pickResult.pickedPoint, cellSize);

    // Find existing box (using the corrected predicate as before)
    const existingBox = scene.meshes.find(mesh => {
        return mesh.name.startsWith("box") &&
               mesh.position.x === snappedPosition.x &&
               mesh.position.z === snappedPosition.z; 
    });


    if (!existingBox) {
        createBoxAtPosition(snappedPosition);
    } else {
        // Handle selection/deselection as before...
        if (selectedObject) {
            selectedObject.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
        }
        selectedObject = existingBox;
        selectedObject.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
    }

};




//Light
const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

// Rendering loop
engine.runRenderLoop(() => {
    scene.render();
});
