import { Enemy, Slime, Viking } from "./Enemy";
import { WaypointManager } from "./WaypointManager";
import { enemies } from "./GlobalState";
import { UIManager } from "./UIManager";

export class WaveManager {
    private scene: BABYLON.Scene;
    private waypointManager: typeof WaypointManager;
    private enemiesToSpawn: number;
    private spawnKey: string;
    private totalWaves: number = 2; // Example total number of waves
    private currentWave: number = 1; // Track the current wave
    private currentWaveEnemies: Enemy[] = []; // Track enemies of the current wave.
    private waveStarted: boolean = false;
    private waveConfigurations: { [waveNumber: number]: string[] } = {
        1: ["slime","knight"],
        2: ["knight",]
    };

    private static instance: WaveManager | null = null;

    public static getInstance(scene?: BABYLON.Scene, waypointManager?: typeof WaypointManager): WaveManager {
        if (!WaveManager.instance) {
            if (!scene || !waypointManager) {
                throw new Error("WaveManager has not been initialized. Please provide scene and waypointManager arguments.");
            }
            WaveManager.instance = new WaveManager(scene, waypointManager);
        }
        return WaveManager.instance;
    }

    constructor(scene: BABYLON.Scene, waypointManager: typeof WaypointManager) {
        this.scene = scene;
        this.waypointManager = waypointManager;
        this.enemiesToSpawn = 0;
        this.spawnKey = "";
    }

    public initWave(spawnKey: string): void {
        const enemyTypes = this.waveConfigurations[this.currentWave];
        if (!enemyTypes) {
            console.warn(`No configuration found for wave ${this.currentWave}.`);
            return;
        }

        this.enemiesToSpawn = enemyTypes.length;
        this.spawnKey = spawnKey;
        // this.currentWave is already set, no need to reassign
        this.currentWaveEnemies = []; // Reset the current wave enemies

        const spawnPositions = this.waypointManager.loadSpawnPositions(1, this.currentWave, spawnKey);
        if (spawnPositions.length === 0) {
            console.warn(`No spawn positions found for ${spawnKey}.`);
            return;
        }

        console.log(`Wave ${this.currentWave} initialized with ${enemyTypes.length} enemies.`);
    }

    public startWave(): void {
        const enemyTypes = this.waveConfigurations[this.currentWave];
        if (!enemyTypes) {
            console.warn(`No configuration found for wave ${this.currentWave}.`);
            return;
        }

        const spawnPositions = this.waypointManager.loadSpawnPositions(1, this.currentWave, this.spawnKey);
        if (spawnPositions.length === 0) {
            console.warn(`No spawn positions found for ${this.spawnKey}.`);
            return;
        }

        for (let i = 0; i < enemyTypes.length; i++) {
            setTimeout(() => {
                const spawnPosition = spawnPositions[0].clone();

                // Add spawn effect using sprite sheet
                const spriteManager = new BABYLON.SpriteManager("spawnEffectManager", "spawnEffectEnemy.png", 14, { width: 0, height: 0 }, this.scene);
                const sprite = new BABYLON.Sprite("spawnEffect", spriteManager);
                sprite.position = spawnPosition.clone();
                sprite.playAnimation(0, 14, false, 50);
                sprite.size = 5;
                sprite.disposeWhenFinishedAnimating = true;
                spriteManager.cellWidth = 896 / 14;
                spriteManager.cellHeight = 69 / 1;

                // Spawn the enemy based on type
                let enemy: Enemy;
                switch (enemyTypes[i].toLowerCase()) {
                    case "slime":
                        enemy = new Slime(this.scene, spawnPosition, "1", "1");
                        break;
                    case "knight":
                        enemy = new Viking(this.scene, spawnPosition, "1", "1");
                        break;
                    default:
                        console.warn(`Unknown enemy type: ${enemyTypes[i]}`);
                        return;
                }

                enemies.push(enemy);
                this.currentWaveEnemies.push(enemy);
                console.log(`Enemy ${i + 1} (${enemyTypes[i]}) spawned at ${spawnPosition}`);

                if (i === enemyTypes.length - 1) {
                    this.waveStarted = true;
                 
                }
            }, i * 3000);
        }

        console.log(`Wave ${this.currentWave} started with ${enemyTypes.length} enemies.`);
    }

    public isWaveComplete(): boolean {
        if (this.waveStarted && this.currentWaveEnemies.every(enemy => !enemy.mesh || enemy.mesh.isDisposed())) {
            this.waveStarted = false;
            this.currentWave++;
            UIManager.getInstance().showCinematicBars();
            UIManager.getInstance().showStartWaveButton();
                console.log(`Wave ${this.currentWave} completed. Starting next wave...`);

             if (this.areAllWavesComplete()) {
               UIManager.getInstance().showVictoryMenu();// Show victory scene if all waves are complete
            }
            return true;
        } else {
            return false;
        }
    }

    public areAllWavesComplete(): boolean {
        return this.currentWave > this.totalWaves;
    }
}
