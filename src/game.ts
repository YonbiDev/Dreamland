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
    private coins: number = 5; // Initialize with 5 coins

    constructor() {
        this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = initializeScene(this.engine);

        this.init();
    }

    private async init(): Promise<void> {
        new CameraController(this.scene, this.canvas);
        this.uiManager = new UIManager(this.scene, this.canvas, this);

        // Display initial coins
        this.uiManager.showTemporaryText(`Vous avez ${this.coins} éclats de rêves!`, 3000);

        // Load the "LandMass" model
        ModelLoader.loadModel(this.scene, "LandMass", result => {
            //console.log("LandMass model loaded:", result.meshes);
        });

        const audioEngine = await BABYLON.CreateAudioEngineAsync();

        const backgroundMusic = await BABYLON.CreateSoundAsync("backgroundMusic", 
            "music.mp3"
        );

        // Wait until audio engine is ready to play sounds.
        await audioEngine.unlock();

        backgroundMusic.play();

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

    public getCoins(): number {
        return this.coins;
    }

    public decreaseCoins(amount: number): void {
        this.coins -= amount;
        this.uiManager.updateCoinDisplay(); // Update the UI
    }

    public increaseCoins(amount: number): void {
        this.coins += amount;
        this.uiManager.updateCoinDisplay(); // Update the UI
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



