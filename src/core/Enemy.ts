import { deleteEnemey, Game, getEnemies } from "../game";
import { UIManager } from "./UIManager"; // Ajouté pour accéder à l'UI
import { ModelLoader } from "./ModelLoader";
import { WaveManager } from "./WaveManager";
import { WaypointManager } from "./WaypointManager";

export class Enemy {
    mesh: BABYLON.Mesh;
    scene: BABYLON.Scene;
    health: number;
    waypoints: BABYLON.Vector3[];
    currentWaypointIndex: number = 0;
    speed: number = 20 // Movement speed
    _originalSpeed?: number; // Ajout pour le slow effect
    private movementVariation: number = 0.02; // Variation factor for natural movement
    private randomSpeedOffset: number;
    private updateInterval: number;
    private healthBar: BABYLON.Mesh; // Ajout de la barre de vie
    private healthBarBg: BABYLON.Mesh; // Fond de la barre de vie
    private healthBarBack: BABYLON.Mesh; // Barre de vie arrière
    private maxHealth: number; // Pourcentage max de vie

    constructor(scene: BABYLON.Scene, modelName: string, position: BABYLON.Vector3, health: number = 10, level: string, spawnLabel: string) {
        this.scene = scene;
        this.health = health;
        this.maxHealth = health;

        // Load waypoints for the given level and spawn label from JSON
        const key = `level${level}_spawnpoint${spawnLabel}`;
        WaypointManager.loadFromFile(key).then(({ waypoints }) => {
            if (waypoints && waypoints.length > 0) {
                const randomListIndex = Math.floor(Math.random() * waypoints.length);
                this.waypoints = waypoints[randomListIndex].map(wp => wp.clone());
                // Start moving only after waypoints are loaded
                if (this.mesh) {
                    this.moveToNextWaypoint();
                }
            } else {
                this.waypoints = [];
                console.error(`No waypoints found for ${key}`);
            }
        });

        // Load the "Slime_01_MeltalHelmet.glb" model
        ModelLoader.loadModel(scene, modelName, result => {
            this.mesh = result.meshes[0] as BABYLON.Mesh; // Use the first mesh from the loaded model
            this.mesh.position = position;
            this.mesh.scaling.scaleInPlace(4); // Scale down the model
            this.mesh.metadata = this.mesh.metadata || {};
            this.mesh.metadata.enemyInstance = this;

            // Ajout de la barre de vie
            this.createHealthBar();

            // Add particle system for walking effect
            this.addWalkingParticleEffect();

            // If waypoints are already loaded, start moving
            if (this.waypoints && this.waypoints.length > 0) {
                this.moveToNextWaypoint();
            }
        });

        // Start the update loop for this enemy
        this.updateInterval = window.setInterval(() => this.update(16), 16); // ~60 FPS
    }

    private addWalkingParticleEffect(): void {
        const particleSystem = new BABYLON.ParticleSystem("walkingParticles", 2000, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("assets/particles/17.png", this.scene); // Use 17.png texture
        particleSystem.emitter = this.mesh; // Attach to the enemy mesh
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.2, 0, -0.2); // Emit from a slightly larger area
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.2, 0, 0.2);

        // Set white colors for cloudy effect
        particleSystem.color1 = new BABYLON.Color4(1, 1, 1, 0.8); // White
        particleSystem.color2 = new BABYLON.Color4(1, 1, 1, 0.8); // White
        particleSystem.colorDead = new BABYLON.Color4(1, 1, 1, 0.3); // Fading white

        particleSystem.minSize = 0.5; // Larger particles for a cloudy effect
        particleSystem.maxSize = 1.0;
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 1.0;
        particleSystem.emitRate = 150;

        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD; // Use additive blending to remove black edges
        particleSystem.gravity = new BABYLON.Vector3(0, -0.5, 0); // Slight downward motion
        particleSystem.direction1 = new BABYLON.Vector3(-0.2, 0.5, -0.2);
        particleSystem.direction2 = new BABYLON.Vector3(0.2, 0.5, 0.2);

        particleSystem.minEmitPower = 0.5;
        particleSystem.maxEmitPower = 1.0;
        particleSystem.updateSpeed = 0.02;

        particleSystem.start(); // Start the particle system
    }

    private createHealthBar() {
        // Fond noir (plus petit et plus proche)
        this.healthBarBg = BABYLON.MeshBuilder.CreatePlane("healthBarBg", {width: .8, height: 0.08}, this.scene);
        this.healthBarBg.parent = this.mesh;
        this.healthBarBg.position = new BABYLON.Vector3(0, 1, 0); // Plus proche du modèle
        this.healthBarBg.rotation = new BABYLON.Vector3(0, 0, 0);
        this.healthBarBg.isPickable = false;
        const bgMat = new BABYLON.StandardMaterial("healthBarBgMat", this.scene);
        bgMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
        bgMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
        bgMat.specularColor = new BABYLON.Color3(0, 0, 0);
        bgMat.backFaceCulling = false; // Important pour voir la barre des deux côtés
        this.healthBarBg.material = bgMat;

        // Barre rouge devant
        this.healthBar = BABYLON.MeshBuilder.CreatePlane("healthBar", {width: 0.7, height: 0.05}, this.scene);
        this.healthBar.parent = this.mesh;
        this.healthBar.position = new BABYLON.Vector3(0, 1, 0.015); // Devant le fond
        this.healthBar.rotation = new BABYLON.Vector3(0, 0, 0);
        this.healthBar.isPickable = false;
        const barMat = new BABYLON.StandardMaterial("healthBarMat", this.scene);
        barMat.diffuseColor = new BABYLON.Color3(1, 0, 0);
        barMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
        barMat.specularColor = new BABYLON.Color3(0, 0, 0);
        barMat.backFaceCulling = false; // Important pour voir la barre des deux côtés
        barMat.twoSidedLighting = true; // Ajouté pour améliorer la visibilité des deux côtés
        this.healthBar.material = barMat;

        // Barre rouge derrière
        this.healthBarBack = BABYLON.MeshBuilder.CreatePlane("healthBarBack", {width: 0.7, height: 0.05}, this.scene);
        this.healthBarBack.parent = this.mesh;
        this.healthBarBack.position = new BABYLON.Vector3(0, 1, -0.015); // Derrière le fond
        this.healthBarBack.rotation = new BABYLON.Vector3(0, 0, 0);
        this.healthBarBack.isPickable = false;
        const barMatBack = new BABYLON.StandardMaterial("healthBarMatBack", this.scene);
        barMatBack.diffuseColor = new BABYLON.Color3(1, 0, 0);
        barMatBack.emissiveColor = new BABYLON.Color3(1, 0, 0);
        barMatBack.specularColor = new BABYLON.Color3(0, 0, 0);
        barMatBack.backFaceCulling = false;
        barMatBack.twoSidedLighting = true;
        this.healthBarBack.material = barMatBack;
    }

    private updateHealthBar() {
        if (!this.healthBar) return;
        const percent = Math.max(0, this.health / this.maxHealth);
        this.healthBar.scaling.x = percent;
        this.healthBar.position.x = 0; // Toujours centrée
        if (this.healthBarBack) {
            this.healthBarBack.scaling.x = percent;
            this.healthBarBack.position.x = 0; // Toujours centrée
        }
    }

    private static getRandomSpawnPoint(level: number, spawnPositionNumber: number): BABYLON.Vector3 | null {
        const filename = `level${level}_spawnpoint${spawnPositionNumber}_spawns.json`;
        const spawnData = localStorage.getItem(filename);
        if (!spawnData) {
            console.warn(`No spawn points found for ${filename}.`);
            return null;
        }

        const spawnPositions = JSON.parse(spawnData).map((sp: { x: number; y: number; z: number }) =>
            new BABYLON.Vector3(sp.x, sp.y, sp.z)
        );

        if (spawnPositions.length === 0) {
            console.warn(`No spawn positions available for ${filename}.`);
            return null;
        }

        const randomIndex = Math.floor(Math.random() * spawnPositions.length);
        return spawnPositions[randomIndex];
    }

    private static getRandomWaypoints(level: string, spawnLabel: string): BABYLON.Vector3[] {
        const key = `level${level}_spawn_${spawnLabel}`;
        const waypointLists: BABYLON.Vector3[][] = [];

        let index = 1;
        while (true) {
            const filename = `${key}_waypoint${index}.json`;
            const waypointData = localStorage.getItem(filename);
            if (!waypointData) break;

            const waypoints = JSON.parse(waypointData).map((wp: { x: number; y: number; z: number }) =>
                new BABYLON.Vector3(wp.x, wp.y, wp.z)
            );
            waypointLists.push(waypoints);
            index++;
        }

        if (waypointLists.length === 0) {
            console.warn(`No waypoint lists available for ${key}.`);
            return [];
        }

        const randomListIndex = Math.floor(Math.random() * waypointLists.length);
        return waypointLists[randomListIndex];
    }

    static createRandomEnemy(scene: BABYLON.Scene, level: number, spawnPositionNumber: number): Enemy | null {
        const spawnPoint = this.getRandomSpawnPoint(level, spawnPositionNumber);
        if (!spawnPoint) {
            console.warn("Failed to create enemy: No spawn point available.");
            return null;
        }

        const waypoints = this.getRandomWaypoints(level.toString(), spawnPositionNumber.toString());
        if (waypoints.length === 0) {
            console.warn("Failed to create enemy: No waypoints available.");
            return null;
        }

        return new Enemy(scene, "", spawnPoint, 10, level.toString(), spawnPositionNumber.toString());
    }

    static async loadMapFromJsonFile(file: File): Promise<{ waypoints: BABYLON.Vector3[][], spawns: BABYLON.Vector3[] }> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const data = JSON.parse(evt.target!.result as string);
                    const waypoints: BABYLON.Vector3[][] = Object.keys(data)
                        .filter(k => k.startsWith("waypoint"))
                        .map(k => data[k].map((wp: any) => new BABYLON.Vector3(wp.x, wp.y, wp.z)));
                    const spawns: BABYLON.Vector3[] = data.spawns
                        ? data.spawns.map((sp: any) => new BABYLON.Vector3(sp.x, sp.y, sp.z))
                        : [];
                    resolve({ waypoints, spawns });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // Méthode utilitaire pour charger une map depuis un chemin (fetch)
    static async loadMapFromServer(key: string): Promise<{ waypoints: BABYLON.Vector3[][], spawns: BABYLON.Vector3[] }> {
        return WaypointManager.loadFromFile(key);
    }

    // Utilisez cette méthode pour obtenir un spawn aléatoire depuis une map JSON
    static getRandomSpawnFromMap(spawns: BABYLON.Vector3[]): BABYLON.Vector3 | null {
        if (!spawns || spawns.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * spawns.length);
        return spawns[randomIndex];
    }

    // Utilisez cette méthode pour obtenir une liste de waypoints aléatoire depuis une map JSON
    static getRandomWaypointsFromMap(waypoints: BABYLON.Vector3[][]): BABYLON.Vector3[] {
        if (!waypoints || waypoints.length === 0) return [];
        const randomListIndex = Math.floor(Math.random() * waypoints.length);
        return waypoints[randomListIndex];
    }

    loadRandomWaypoints(level: string, spawnLabel: string): BABYLON.Vector3[] {
        const key = `level${level}_spawnpoint${spawnLabel}`; // Correct key format
        console.log(`Loading waypoints for ${key}`);
        const waypointLists: BABYLON.Vector3[][] = [];
        let index = 1;

        while (true) {
            const filename = `${key}_waypoint${index}.json`;
            const waypointData = localStorage.getItem(filename);
            if (!waypointData) break;

            const waypoints = JSON.parse(waypointData).map((wp: { x: number; y: number; z: number }) =>
                new BABYLON.Vector3(wp.x, wp.y, wp.z)
            );
            if (waypoints.length === 0) {
                break;
            }
            waypointLists.push(waypoints);
            index++;
        }

        if (waypointLists.length === 0) {
            console.error(`No waypoints found for ${key}`);
            return [];
        }

        const randomListIndex = Math.floor(Math.random() * waypointLists.length);
        console.log(`Loaded waypoints for ${key}:`, waypointLists[randomListIndex]);

        // Return a copy of the selected waypoint list
        return waypointLists[randomListIndex].map(wp => wp.clone());
    }

    protected moveToNextWaypoint(): void {
        if (this.currentWaypointIndex >= this.waypoints.length) {
            console.log("Enemy reached the last waypoint. Decreasing health.");
            this.scene.getEngine().getRenderingCanvas()?.dispatchEvent(new CustomEvent("enemyReachedEnd"));
            this.destroy(false); // Ne pas donner de récompense
            return; // Stop moving if no more waypoints
        }

        const target = this.waypoints[this.currentWaypointIndex];
        console.log(`Moving towards waypoint: ${target.toString()}`);
        // this.mesh.lookAt(target);

        console.log(`Enemy moving towards waypoint: ${target.toString()}`);
        const moveInterval = setInterval(() => {
            if (!target || !this.mesh || !this.mesh.position) {
                console.error("Target or mesh position is undefined:", { target, mesh: this.mesh });
                clearInterval(moveInterval);
                return;
            }

            if(!target)
                return;
            const direction = target.subtract(this.mesh.position).normalize();
            const distance = BABYLON.Vector3.Distance(this.mesh.position, target);

            // Add slight random variation to direction
            const variation = new BABYLON.Vector3(
                (Math.random() - 0.5) * this.movementVariation,
                (Math.random() - 0.5) * this.movementVariation,
                (Math.random() - 0.5) * this.movementVariation
            );
            const adjustedDirection = direction.add(variation).normalize();

            // Adjust speed with random offset
            const adjustedSpeed = this.speed + this.randomSpeedOffset;

            // Attempt to move while respecting collisions
            const moveVector = adjustedDirection.scale(adjustedSpeed);
            this.mesh.moveWithCollisions(moveVector);

            // Smoothly rotate the enemy to face the correct waypoint
            const targetDirection = target.subtract(this.mesh.position).normalize();
            const targetYaw = Math.atan2(targetDirection.x, targetDirection.z); // Correct yaw calculation
            const currentRotation = this.mesh.rotationQuaternion || BABYLON.Quaternion.Identity();
            const targetRotation = BABYLON.Quaternion.RotationYawPitchRoll(targetYaw, 0, 0);
            this.mesh.rotationQuaternion = BABYLON.Quaternion.Slerp(currentRotation, targetRotation, 0.1); // Adjust 0.1 for smoother or faster rotation

            if (distance < 0.5) { // Adjust threshold for reaching the waypoint
                // Reached the waypoint
                clearInterval(moveInterval);
                this.currentWaypointIndex++;
                this.moveToNextWaypoint(); // Move to the next waypoint
            }
        }, 16); // Update every 16ms (~60 FPS)
    }

    private handleCollision(collidedMesh: BABYLON.AbstractMesh): void {
        // Logic to handle collision (e.g., stop movement, take damage, etc.)
        console.log(`Enemy collided with ${collidedMesh.name}`);
        this.destroy(); // Destroy the enemy on collision
    }

    update(deltaTime: number) {
        if (!this.mesh) {
            return;
        }

        // Ne pas faire de lookAt, la barre reste dans l'espace local de l'ennemi

        if (this.waypoints && this.waypoints.length > 0) {
            const target = this.waypoints[this.currentWaypointIndex];
            if (target == null) return;
            const direction = target.subtract(this.mesh.position).normalize();
            const distance = BABYLON.Vector3.Distance(this.mesh.position, target);

            if (distance > 0.1) {
                this.mesh.moveWithCollisions(direction.scale(this.speed * deltaTime / 1000));
            } else {
                console.log(`Reached waypoint: ${target.toString()}`);
                this.currentWaypointIndex++;
                if (this.currentWaypointIndex >= this.waypoints.length) {
                  
                }
            }
        } else {
            console.warn("No more waypoints to follow.");
        }
    }

    damage(amount: number) {
        this.health -= amount;
        console.log(`⚠️ Ennemi touché ! HP restant : ${this.health}`);

        this.updateHealthBar(); // Met à jour la barre de vie

        if (this.health <= 0) {
            this.destroy(true); // Donne la récompense
        }
    }

    // Ajout : méthode pour obtenir la récompense en pièces
    getReward(): number {
        return 1; // Par défaut, 1 pièce
    }

    destroy(giveReward: boolean = true) {
        // Clear the update interval when the enemy is destroyed
        clearInterval(this.updateInterval);
        deleteEnemey(this);
        if (this.healthBar) this.healthBar.dispose();
        if (this.healthBarBack) this.healthBarBack.dispose();
        if (this.healthBarBg) this.healthBarBg.dispose();
        this.mesh.dispose();
        // Ajout : donner la récompense au joueur
        if (giveReward) {
            const reward = this.getReward();
            if (reward > 0) {
                const ui = UIManager.getInstance();
                Game.getInstance().increaseCoins(reward);
                ui.showCoinGainAnimation(reward); // Animation de gain
            }
        }
        WaveManager.getInstance().isWaveComplete();
        console.log("enemy supprimer de la liste");
    }
}

// Spécialisation des récompenses pour chaque type d'ennemi
export class Slime extends Enemy {
    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, level: string, spawnLabel: string) {
        super(scene, "Slime_03", position, 10, level, spawnLabel);
        this.speed = 10;
    }
    getReward(): number {
        return 2; // Slime donne 2 pièces
    }
}

export class Bunny extends Enemy {
    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, level: string, spawnLabel: string) {
        super(scene, "slime_bunny", position, 20, level, spawnLabel);
        this.speed = 10;
    }
    getReward(): number {
        return 2; // Knight donne 5 pièces
    }
}
export class Knight extends Enemy {
    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, level: string, spawnLabel: string) {
        super(scene, "Slime_01_MeltalHelmet", position, 20, level, spawnLabel);
        this.speed = 12;
    }
    getReward(): number {
        return 2; // Knight donne 5 pièces
    }
}

export class Viking extends Enemy {
    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, level: string, spawnLabel: string) {
        super(scene, "Slime_01_Viking", position, 30, level, spawnLabel);
        this.speed = 12;
    }
    getReward(): number {
        return 2; // Viking donne 7 pièces
    }
    protected moveToNextWaypoint(): void {
        super.moveToNextWaypoint();
    }
}

export class SmallLeaf extends Enemy {
    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, level: string, spawnLabel: string) {
        super(scene, "Slime_03 Leaf", position, 30, level, spawnLabel);
        this.speed = 12;
    }
    getReward(): number {
        return 2; // Viking donne 7 pièces
    }
    protected moveToNextWaypoint(): void {
        super.moveToNextWaypoint();
    }
}
export class Bigleaf extends Enemy {
    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, level: string, spawnLabel: string) {
        super(scene, "Slime_super_leaf", position, 40, level, spawnLabel);
        this.speed = 15;
    }
    getReward(): number {
        return 2; // Attacker donne 10 pièces
    }
      protected moveToNextWaypoint(): void {
        super.moveToNextWaypoint();
    }
}
export class King extends Enemy {
    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, level: string, spawnLabel: string) {
        super(scene, "Slime_King", position, 40, level, spawnLabel);
        this.speed = 18;
    }
    getReward(): number {
        return 2; // Attacker donne 10 pièces
    }
      protected moveToNextWaypoint(): void {
        super.moveToNextWaypoint();
    }
}
export class BigKing extends Enemy {
    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, level: string, spawnLabel: string) {
        super(scene, "Slime_big_King", position, 1000, level, spawnLabel);
        this.speed = 6;
    }
    getReward(): number {
        return 2; // Attacker donne 10 pièces
    }
      protected moveToNextWaypoint(): void {
        super.moveToNextWaypoint();
    }
}


