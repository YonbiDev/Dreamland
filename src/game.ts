import "babylonjs-loaders"
import { CameraController } from "./core/CameraController";
import { ModelLoader } from "./core/ModelLoader";
import { Turret } from "./core/Turret";
import { Enemy, Slime, Viking } from "./core/Enemy";
import { UIManager, UITutorial } from "./core/UIManager";
import { WaypointEditor } from "./core/WaypointEditor";
import { WaypointManager } from "./core/WaypointManager";
import { WaveManager } from "./core/WaveManager";
import { enemies } from "./core/GlobalState";

let waveManager: WaveManager;

const ASSET_BASE_URL = "assets/";

export class Game {

    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private canvas: HTMLCanvasElement;
    private uiManager: UIManager;
    private coins: number = 5; // Initialize with 5 coins

    static health: number = 10;
    private static instance: Game | null = null;
    uITutorial: UITutorial;

    public static getInstance(scene?: BABYLON.Scene, canvas?: HTMLCanvasElement, game?: Game): Game {
        if (!Game.instance) {
            if (!scene || !canvas || !game) {
                throw new Error("UIManager has not been initialized. Please provide scene, canvas, and game arguments.");
            }
            Game.instance = new Game();
        }
        return Game.instance;
    }

    constructor() {
        showLoadingScreen(); // <-- Affiche le loading dès le début
        this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = initializeScene(this.engine);

        this.init();
        Game.instance = this;
    }

    private async init(): Promise<void> {
        new CameraController(this.scene, this.canvas);
       
       
        this.uiManager = UIManager.getInstance(this.scene, this.canvas, this);
      //  this.uITutorial = UITutorial.getInstance(this.uiManager);
       // this.uITutorial.start();

        // Display initial coins
        this.uiManager.showTemporaryText(`Vous avez ${this.coins} éclats de rêves!`, 3000);

        // Show cinematic bars and add start wave button
        this.uiManager.showCinematicBars();
        this.uiManager.addStartWaveButton(() => {
            if (waveManager)
                waveManager.startWave(); // Example wave start
            
        });
        // Load the "LandMass" model
        ModelLoader.loadModel(this.scene, "LandMass", result => {
            //console.log("LandMass model loaded:", result.meshes);
        });

        const audioEngine = await BABYLON.CreateAudioEngineAsync();

        const backgroundMusic = await BABYLON.CreateSoundAsync("backgroundMusic",
           ASSET_BASE_URL + "music.mp3"
        );
        backgroundMusic.loop = true;

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
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/textures/skybox", this.scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;

        skybox.material = skyboxMaterial;
      //const waypointEditor = new WaypointEditor(this.scene);
        // Enable the waypoint editor in development mode
        if (process.env.NODE_ENV === "development") {
            // const waypointEditor = new WaypointEditor(this.scene);
        }

        // Initialize the WaveManager
        waveManager = WaveManager.getInstance(this.scene,WaypointManager)
        waveManager.initWave("level1_spawnpoint1"); // Example wave start
       // UIManager.getInstance().showPreparationPhaseAnimation();

        // À la toute fin, quand tout est prêt :
        hideLoadingScreen(); // <-- Cache le loading quand le jeu est prêt

        this.engine.runRenderLoop(() => {
            const deltaTime = this.engine.getDeltaTime() / 1000; // Convertir en secondes

            // Update enemies
            enemies.forEach(enemy => enemy.update(deltaTime));

           
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

    static getHealth(): number {
        return this.health;
    }

    static setHealth(newHealth: number) {
        this.health = newHealth;
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

// --- Loading screen helpers ---
function showLoadingScreen() {
    if (document.getElementById("game-loading-overlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "game-loading-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(10,20,40,0.88)";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "999999";
    overlay.innerHTML = `
        <div style="font-size:2.2rem;color:#FFD700;font-weight:bold;margin-bottom:24px;letter-spacing:1.5px;text-shadow:0 0 24px #232526;">
            Chargement du rêve...
        </div>
        <div style="width:64px;height:64px;border:7px solid #00ffd0;border-top:7px solid #232526;border-radius:50%;animation:spin 1s linear infinite;"></div>
        <style>
        @keyframes spin { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }
        </style>
    `;
    document.body.appendChild(overlay);
}
function hideLoadingScreen() {
    const overlay = document.getElementById("game-loading-overlay");
    if (overlay) overlay.remove();
}



