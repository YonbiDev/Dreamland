import "babylonjs-loaders"
import { CameraController } from "./core/CameraController";
import { ModelLoader } from "./core/ModelLoader";
import { Turret } from "./core/Turret";
import { Enemy } from "./core/Enemy";
import { UIManager } from "./core/UIManager";
import { WaypointEditor } from "./core/WaypointEditor";
import { WaypointManager } from "./core/WaypointManager";

let enemies: Enemy[] = [];

export class Game {
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private canvas: HTMLCanvasElement;
    private uiManager: UIManager;

    constructor() {
        this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = initializeScene(this.engine);

        this.init();
        
    }

    private init(): void {

        //bugs 
        // quand je fais clear ca supprime pas les waypoints dans la map 




        // Ajout de la caméra
        new CameraController(this.scene, this.canvas);

        // Ajout de la grille
       // const grid = new Grid(this.scene, 10, 30, 30);

      //  const ground = new Ground(this.scene);

        // Gestion des boîtes
       // new BoxManager(this.scene, grid.getMesh());

        new UIManager(this.scene, this.canvas);
        // Chargement des modèles
        new ModelLoader(this.scene,"LandMass");

        // Ajout d'une lumière
        new BABYLON.HemisphericLight("light", new BABYLON.Vector3(2, 10, 10), this.scene);


        // ajout d'un sky
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, this.scene);
        skybox.infiniteDistance = true;
        
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.disableLighting = true;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox", this.scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        
        skybox.material = skyboxMaterial;
       

        // Enable the waypoint editor in development mode
        if (process.env.NODE_ENV === "development") {
          //   const waypointEditor = new WaypointEditor(this.scene);
           
               // Add enemies at the loaded spawn positions
      


        }
        const spawnPositions = WaypointManager.loadSpawnPositions(1, 1, "level1_spawnpoint1"); // Assuming level 1 and spawn position 1
        spawnPositions.forEach(spawnPosition => {
            enemies.push(new Enemy(this.scene, spawnPosition, 10, '1', '1'));
        });
        // Define the current level
        const currentLevel = "1";

        // Load spawn positions for the current level
       

      
        this.engine.runRenderLoop(() => {
            const deltaTime = this.engine.getDeltaTime() / 1000; // Convertir en secondes
            enemies.forEach(enemy => enemy.update(deltaTime));
            this.scene.render();
        });
    }
    
}

export function initializeScene(engine: BABYLON.Engine): BABYLON.Scene {
    const scene = new BABYLON.Scene(engine);
    return scene;
}

export function getEnemies(): Enemy[] {
    console.log("📌 Ennemis restants :", enemies.length);
    return enemies;
}

export function deleteEnemey(enemy: Enemy): void {
    // Supprimer de la liste des ennemis
    const index = enemies.indexOf(enemy);
    if (index !== -1) {
        enemies.splice(index, 1);
        console.log("📌 Enemy removed. Remaining enemies:", enemies.length);
    }
}

export function createEnemiesForLevel1(scene: BABYLON.Scene): void {
    const level = 1;
    const spawnPositionNumber = 1; // Assuming spawn position 1 for level 1

    for (let i = 0; i < 5; i++) { // Create 5 enemies
        const enemy = Enemy.createRandomEnemy(scene, level, spawnPositionNumber);
        if (enemy) {
            console.log("Enemy created at:", enemy.mesh.position);
        }
    }
}
