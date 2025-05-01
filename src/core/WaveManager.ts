import { Enemy, Slime, Viking } from "./Enemy";
import { WaypointManager } from "./WaypointManager";
import { enemies } from "./GlobalState";

export class WaveManager {
    private scene: BABYLON.Scene;
    private waypointManager: typeof WaypointManager;
    private enemiesToSpawn: number;
    private spawnKey: string;

    constructor(scene: BABYLON.Scene, waypointManager: typeof WaypointManager) {
        this.scene = scene;
        this.waypointManager = waypointManager;
        this.enemiesToSpawn = 0;
        this.spawnKey = "";
    }

    public startWave(waveNumber: number, spawnKey: string, enemyCount: number): void {
        this.enemiesToSpawn = enemyCount;
        this.spawnKey = spawnKey;

        const spawnPositions = this.waypointManager.loadSpawnPositions(1, waveNumber, spawnKey);

        // pour check si on les spawns
        if (spawnPositions.length === 0) {
            console.warn(`No spawn positions found for ${spawnKey}.`);
            return;
        }
       // let spawnPosition = spawnPositions[0].clone(); 
       // enemies.push(new Viking(this.scene, spawnPosition, "1", "1"));
       // spawnPosition = spawnPositions[0].clone(); 

       // enemies.push(new Enemy(this.scene, "Slime_01_King", spawnPosition, 20, "1", "1"));
       // spawnPosition = spawnPositions[0].clone(); 
 
        
        for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => {
                const spawnPosition = spawnPositions[0].clone(); // Clone the position to ensure independence
              
                enemies.push(new Enemy(this.scene,"Slime_01_King", spawnPosition,10, "1", "1"));
               // enemies.push(new Slime(this.scene, spawnPosition, "1", "1"));
                console.log(`Enemy ${i + 1} spawned at ${spawnPosition}`);
            }, i * 3000); // Delay of 500ms between each spawn
        }

        console.log(`Wave ${waveNumber} started with ${enemyCount} enemies.`);
    }

    public isWaveComplete(): boolean {
        return enemies.length === 0;
    }
}
