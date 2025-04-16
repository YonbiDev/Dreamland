import "babylonjs-loaders"
import { CameraController } from "./core/CameraController";
import { ModelLoader } from "./core/ModelLoader";
import { Turret } from "./core/Turret";
import { Enemy } from "./core/Enemy";
import { UIManager } from "./core/UIManager";
import { WaypointEditor } from "./core/WaypointEditor";

let enemies: Enemy[] = [];

export class Game {
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private canvas: HTMLCanvasElement;
    private uiManager: UIManager;

    constructor() {
        this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = new BABYLON.Scene(this.engine);

        this.init();
        
    }

    private init(): void {
        // Ajout de la caméra
        new CameraController(this.scene, this.canvas);

        // Ajout de la grille
       // const grid = new Grid(this.scene, 10, 30, 30);

      //  const ground = new Ground(this.scene);

        // Gestion des boîtes
       // new BoxManager(this.scene, grid.getMesh());

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
            new WaypointEditor(this.scene);
        }

        // Define the current level
        const currentLevel = "level1";

        // Load spawn positions for the current level
        const waypointEditor = new WaypointEditor(this.scene);
        const spawnPositions = waypointEditor.loadSpawnPositions(`${currentLevel}_spawn1`);

        // Add enemies at the loaded spawn positions
        spawnPositions.forEach(spawnPosition => {
            enemies.push(new Enemy(this.scene, spawnPosition, 10, currentLevel, `${currentLevel}_spawn1`));
        });

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
    
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
