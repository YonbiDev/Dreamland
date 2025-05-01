import "babylonjs-loaders"
import { CameraController } from "./core/CameraController";
import { ModelLoader } from "./core/ModelLoader";
import { Turret } from "./core/Turret";
import { Enemy, Slime, Viking } from "./core/Enemy";
import { UIManager } from "./core/UIManager";
import { WaypointEditor } from "./core/WaypointEditor";
import { WaypointManager } from "./core/WaypointManager";
import { WaveManager } from "./core/WaveManager";
import { enemies } from "./core/GlobalState";

let waveManager: WaveManager;

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
        // Ajout de la caméra
        new CameraController(this.scene, this.canvas);

        // Ajout de la grille
        // const grid = new Grid(this.scene, 10, 30, 30);

        // const ground = new Ground(this.scene);

        // Gestion des boîtes
        // new BoxManager(this.scene, grid.getMesh());

        new UIManager(this.scene, this.canvas);

        // Load the "LandMass" model
        ModelLoader.loadModel(this.scene, "LandMass", result => {
            console.log("LandMass model loaded:", result.meshes);
        });

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
            // const waypointEditor = new WaypointEditor(this.scene);
        }

        // Initialize the WaveManager
        waveManager = new WaveManager(this.scene, WaypointManager);

        // Example: Add different types of enemies

        // Start the first wave
        waveManager.startWave(1, "level1_spawnpoint1", 5); // 5 enemies for wave 1

        this.engine.runRenderLoop(() => {
            const deltaTime = this.engine.getDeltaTime() / 1000; // Convertir en secondes

            // Update enemies
            enemies.forEach(enemy => enemy.update(deltaTime));

            // Check if the wave is complete and start the next wave
            if (waveManager.isWaveComplete()) {
                console.log("Wave complete!");
            }

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



