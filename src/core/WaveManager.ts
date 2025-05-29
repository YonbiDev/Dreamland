import { Attacker, Enemy, Knight, Slime, Viking } from "./Enemy";
import { WaypointManager } from "./WaypointManager";
import { enemies } from "./GlobalState";
import { UIManager } from "./UIManager";
import { Game } from "../game"; // Ajout de l'import Game

export class WaveManager {
    private scene: BABYLON.Scene;
    private waypointManager: typeof WaypointManager;
    private enemiesToSpawn: number;
    private spawnKey: string;
    private totalWaves: number = 15; // Example total number of waves
    public currentWave: number = 1; // Track the current wave
    private currentWaveEnemies: Enemy[] = []; // Track enemies of the current wave.
    private waveStarted: boolean = false;
    private spawnPositions: BABYLON.Vector3[] = []; // Store spawn positions for the current wav
public waveConfigurations: { [waveNumber: number]: string[] } = {
  1: ["slime"],
  2: ["slime", "slime"],
  3: ["slime", "knight"],
  4: ["slime", "knight", "knight"],
  5: ["slime", "knight", "viking", "viking"],
  6: ["knight", "viking", "viking", "attacker"],
  7: ["slime", "knight", "viking", "attacker", "attacker"],
  8: ["knight", "knight", "viking", "viking", "attacker", "attacker"],
  9: ["slime", "slime", "knight", "viking", "attacker", "attacker", "attacker"],
  10: ["knight", "viking", "viking", "attacker", "attacker", "attacker", "attacker"],
  11: ["slime", "knight", "viking", "viking", "attacker", "attacker", "attacker", "attacker"],
  12: ["knight", "knight", "viking", "viking", "attacker", "attacker", "attacker", "attacker"],
  13: ["slime", "knight", "viking", "viking", "attacker", "attacker", "attacker", "attacker", "attacker"],
  14: ["knight", "knight", "viking", "viking", "viking", "attacker", "attacker", "attacker", "attacker"],
  15: ["slime", "knight", "knight", "viking", "viking", "attacker", "attacker", "attacker", "attacker", "attacker"]
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

   public async initWave(spawnKey: string): Promise<void> {
    const enemyTypes = this.waveConfigurations[this.currentWave];
    UIManager.getInstance().setEnemyCount(this.waveConfigurations[this.currentWave].length);
    if (!enemyTypes) {
        console.warn(`No configuration found for wave ${this.currentWave}.`);
        return;
    }

    this.enemiesToSpawn = enemyTypes.length;
    this.spawnKey = spawnKey;
    this.currentWaveEnemies = []; // Reset the current wave enemies

    try {
        const { spawns } = await WaypointManager.loadFromFile(spawnKey);
        if (!spawns || spawns.length === 0) {
            console.warn(`No spawn positions found for ${spawnKey}.`);
            return;
        }

        this.spawnPositions = spawns;

        console.log(`Wave ${this.currentWave} initialized with ${enemyTypes.length} enemies.`);
    } catch (error) {
        console.error(`Failed to initialize wave:`, error);
    }
}
public async startWave(): Promise<void> {
    const enemyTypes = this.waveConfigurations[this.currentWave];
    if (!enemyTypes) {
        console.warn(`No configuration found for wave ${this.currentWave}.`);
        return;
    }

    if (!this.spawnPositions || this.spawnPositions.length === 0) {
        try {
            const { spawns } = await WaypointManager.loadFromFile(this.spawnKey);
            if (!spawns || spawns.length === 0) {
                console.warn(`No spawn positions found for ${this.spawnKey}.`);
                return;
            }
            this.spawnPositions = spawns;
        } catch (error) {
            console.error("Error loading spawn positions:", error);
            return;
        }
    }

    // Affiche l'animation de début de vague
    UIManager.getInstance().showWavePhase(this.currentWave);

    setTimeout(() => {
        for (let i = 0; i < enemyTypes.length; i++) {
            setTimeout(() => {
                const spawnPosition = this.spawnPositions[0].clone();

                // Add spawn effect using sprite sheet
                const spriteManager = new BABYLON.SpriteManager("spawnEffectManager", "assets/spawnEffectEnemy.PNG", 14, { width: 0, height: 0 }, this.scene);
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
                        enemy = new Knight(this.scene, spawnPosition, "1", "1");
                        break;
                        case "viking":
                        enemy = new Viking(this.scene, spawnPosition, "1", "1");
                        break;
                        case "attacker":
                        enemy = new Attacker(this.scene, spawnPosition, "1", "1");
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
    }, 1500); // Laisse le temps à l'animation wave de s'afficher
}

    public isWaveComplete(): boolean {
        if (this.waveStarted && this.currentWaveEnemies.every(enemy => !enemy.mesh || enemy.mesh.isDisposed())) {
            this.waveStarted = false;
            this.currentWave++;
            // Déblocage des tourelles selon la vague atteinte
            if (this.currentWave === 3) {
                UIManager.getInstance().unlockTurret("snow_turret");
            }
            if (this.currentWave === 5) {
                UIManager.getInstance().unlockTurret("mushroom_tree");
            }
            // Animation "Wave Cleared"
            UIManager.getInstance().showWaveClearedAnimation();
            UIManager.getInstance().showCinematicBars();
            UIManager.getInstance().showStartWaveButton();
            UIManager.getInstance().setEnemyCount(this.waveConfigurations[this.currentWave]?.length ?? 0);
            // Ajout : le joueur gagne 5 coins à la fin de chaque vague
            Game.getInstance().increaseCoins(3);
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

    // À appeler au début du jeu (ex: après l'initialisation du jeu ou de la scène)
    public showPreparationAtGameStart(): void {
        UIManager.getInstance().showCinematicBars();
        UIManager.getInstance().showPreparationPhaseAnimation();
        UIManager.getInstance().showStartWaveButton();
    }
}
