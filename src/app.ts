import * as BABYLON from 'babylonjs';


// Tableau pour suivre les cases occupées
const occupiedPositions: BABYLON.Vector3[] = [];
    // Variables pour la grille
    const gridSize = 10;  // Taille de la grille
    const gridSpacing = 5;  // Espacement entre chaque case
// Création de la scène Babylon.js
export function createScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
    const scene = new BABYLON.Scene(engine);

    // Créer chaque élément avec les fonctions
    createGround(scene);
    createCamera(scene, canvas);
    createLight(scene);
    createGrid(scene);
    // pour la musique 
    initAudio();

    createCubeAtMousePosition(scene, canvas);


 

    return scene;
}

// mes fonctions
async function initAudio() {
    const audioEngine = await BABYLON.CreateAudioEngineAsync();
    await audioEngine.unlock();
 //BABYLON.CreateStreamingSoundAsync("name", "https://yonbidev.github.io/DreamlandAssets/Fantasy Choir 1.wav", { loop: true, autoplay: true }, audioEngine);
}


function createGround(scene: BABYLON.Scene): BABYLON.Mesh {
    return BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
}

function createCamera(scene, canvas) {
    // Create a FreeCamera (we'll restrict its rotation later)
    const camera = new BABYLON.FreeCamera("AgeOfEmpiresCamera", new BABYLON.Vector3(0, 50, 0), scene);
    // Target the camera to the groufnd (looking straight down initially)
    camera.setTarget(new BABYLON.Vector3(0, 0, 0));
    let moveSpeed = 2;
    let zoomSpeed = 1 ;
    // Update camera position and zoom on each frame
    scene.onBeforeRenderObservable.add(() => {
        // Limit the zoom (min and max height)
        if (camera.position.y < 10) { camera.position.y = 10; }
        if (camera.position.y > 100) { camera.position.y = 100; }
         // Keep the camera target on the ground
        camera.setTarget(new BABYLON.Vector3(camera.position.x, 10, camera.position.z));
        });

    // Optional: Edge scrolling (move camera when mouse is near the edge of the canvas)
    const edgeScrollSpeed = 0.01;  // Adjust as needed
    scene.onBeforeRenderObservable.add(() => {


        if (scene.pointerX < canvas.width * 0.1) {
            camera.position.x -= edgeScrollSpeed * camera.position.y/50;
        } else if (scene.pointerX > canvas.width * 0.9) {
            camera.position.x += edgeScrollSpeed* camera.position.y/50;
        }

        if (scene.pointerY < canvas.height * 0.1) {
            camera.position.z += edgeScrollSpeed* camera.position.y/50;
        } else if (scene.pointerY > canvas.height * 0.9) {
            camera.position.z -= edgeScrollSpeed* camera.position.y/50;
        }


    });

    return camera;
}

function createLight(scene: BABYLON.Scene): BABYLON.HemisphericLight {
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.8;
    return light;
}

function createGrid(scene: BABYLON.Scene): BABYLON.Mesh {
     // Crée une texture de grille (tu peux aussi en utiliser une personnalisée)
     const gridTexture = new BABYLON.Texture("assets/grid.png", scene);

     // Création du sol avec une texture de grille
     const grid = BABYLON.MeshBuilder.CreateGround("grid", { width: 100, height: 100 }, scene);
     
     // Création d'un matériau standard
     const gridMaterial = new BABYLON.StandardMaterial("gridMaterial", scene);
     
     // Assignation de la texture de la grille au matériau
     gridMaterial.diffuseTexture = gridTexture;
 
     // Appliquer ce matériau au sol
     grid.material = gridMaterial;
 
     return grid;
}

function canPlaceTurret(position: BABYLON.Vector3, scene: BABYLON.Scene): boolean {
    // Vérifie si la position est valide (par exemple, pas sur un autre objet)
    const hit = scene.pick(position.x, position.z);  // On effectue un "raycast" pour vérifier l'emplacement

    // Si on ne touche rien (hit.pickedMesh est nul), c'est une zone valide
    if (!hit.pickedMesh) {
        return true;
    }

    return false;  // Sinon, la position est occupée
}

function isPositionAvailable(position: BABYLON.Vector3): boolean {
    for (const occupiedPosition of occupiedPositions) {
        if (position.equals(occupiedPosition)) {
            return false; // La position est occupée
        }
    }
    return true; // La position est libre
}

// Fonction pour créer un cube à la position de la souris sur la grille
function createCubeAtMousePosition(scene: BABYLON.Scene, canvas: HTMLCanvasElement): void {
    // Obtenir la position du clic de la souris dans la scène
    canvas.addEventListener('click', (event) => {
        const x = (event.clientX / canvas.width) * 2 - 1;  // Convertir en coordonnées [-1, 1]
        const y = -(event.clientY / canvas.height) * 2 + 1; // Convertir en coordonnées [-1, 1]

        // Créer un rayon à partir de la position de la souris
        const ray = scene.createPickingRay(x, y, BABYLON.Matrix.Identity(), scene.activeCamera);
        const pickResult = scene.pickWithRay(ray);

        if (pickResult.hit) {
            // Obtenir la position du clic dans la scène
            const clickedPosition = pickResult.pickedPoint;

            // Calculer les indices de la grille en fonction de la position cliquée
            const gridX = Math.floor(clickedPosition.x / gridSpacing);
            const gridZ = Math.floor(clickedPosition.z / gridSpacing);

            // Calculer la position de la grille pour placer le cube
            const gridPosition = new BABYLON.Vector3(gridX * gridSpacing, 0, gridZ * gridSpacing);

            // Vérifier si la position est disponible
            if (isPositionAvailable(gridPosition)) {
                // Créer le cube à la position calculée
                const cube = BABYLON.MeshBuilder.CreateBox("cube", { size: 2 }, scene);
                cube.position = gridPosition;

                // Ajouter la position à la liste des positions occupées
                occupiedPositions.push(gridPosition);
                console.log(`Cube placé à: ${gridPosition}`);
            } else {
                console.log("Emplacement occupé !");
            }
        }
    });
}
// Initialisation du moteur et lancement de la scène
window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    const engine = new BABYLON.Engine(canvas, true);
    const scene = createScene(engine, canvas);

    engine.runRenderLoop(() => {
        scene.render();
    });

    window.addEventListener("resize", () => {
        engine.resize();
    });
});
