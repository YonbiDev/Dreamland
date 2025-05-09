import { Enemy, Slime, Viking } from "./Enemy";
import { WaypointManager } from "./WaypointManager";
import { enemies } from "./GlobalState";

export class WaveManager {
    private scene: BABYLON.Scene;
    private waypointManager: typeof WaypointManager;
    private enemiesToSpawn: number;
    private spawnKey: string;
    private totalWaves: number = 2; // Example total number of waves
    private currentWave: number = 0; // Track the current wave
    private currentWaveEnemies: Enemy[] = []; // Track enemies of the current wave

    constructor(scene: BABYLON.Scene, waypointManager: typeof WaypointManager) {
        this.scene = scene;
        this.waypointManager = waypointManager;
        this.enemiesToSpawn = 0;
        this.spawnKey = "";
    }

    public startWave(waveNumber: number, spawnKey: string, enemyCount: number): void {
        this.enemiesToSpawn = enemyCount;
        this.spawnKey = spawnKey;
        this.currentWave = waveNumber; // Update the current wave
        this.currentWaveEnemies = []; // Reset the current wave enemies

        const spawnPositions = this.waypointManager.loadSpawnPositions(1, waveNumber, spawnKey);

        // pour check si on les spawns
        if (spawnPositions.length === 0) {
            console.warn(`No spawn positions found for ${spawnKey}.`);
            return;
        }
        
        for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => {
                const spawnPosition = spawnPositions[0].clone(); // Clone the position to ensure independence

                // Add spawn effect using sprite sheet
                const spriteManager = new BABYLON.SpriteManager("spawnEffectManager", "spawnEffectEnemy.png", 14, { width: 0, height: 0 }, this.scene);
                const sprite = new BABYLON.Sprite("spawnEffect", spriteManager);
                sprite.position = spawnPosition.clone();
                sprite.playAnimation(0, 14, false, 50); // Play frames 0 to 15, non-looping, 100ms per frame
                sprite.size = 5; // Adjust size as needed
                sprite.disposeWhenFinishedAnimating = true; // Dispose after animation finishes
                spriteManager.cellWidth = 896 / 14;
                spriteManager.cellHeight = 69 / 1;
                // Spawn the enemy
                const enemy = new Slime(this.scene, spawnPosition, "1", "1");
                enemies.push(enemy);
                this.currentWaveEnemies.push(enemy); // Track the enemy for the current wave
                console.log(`Enemy ${i + 1} spawned at ${spawnPosition}`);
            }, i * 3000); // Delay of 3000ms between each spawn
        }

        console.log(`Wave ${waveNumber} started with ${enemyCount} enemies.`);
    }

    public isWaveComplete(): boolean {
        // Check if all enemies of the current wave are dead
        return this.currentWaveEnemies.every(enemy => !enemy.mesh || enemy.mesh.isDisposed());
    }

    public areAllWavesComplete(): boolean {
        return this.currentWave >= this.totalWaves && this.isWaveComplete();
    }
}
