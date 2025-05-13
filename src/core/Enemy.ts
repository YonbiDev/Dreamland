import { deleteEnemey, Game, getEnemies } from "../game";
import { ModelLoader } from "./ModelLoader";
import { WaveManager } from "./WaveManager";

export class Enemy {
    mesh: BABYLON.Mesh;
    scene: BABYLON.Scene;
    health: number;
    waypoints: BABYLON.Vector3[];
    currentWaypointIndex: number = 0;
    speed: number = 20 // Movement speed
    private movementVariation: number = 0.02; // Variation factor for natural movement
    private randomSpeedOffset: number;
    private updateInterval: number;

    constructor(scene: BABYLON.Scene, modelName: string, position: BABYLON.Vector3, health: number = 10, level: string, spawnLabel: string) {
        this.scene = scene;
        this.health = health;

        // Load waypoints for the given level and spawn label
        this.waypoints = this.loadRandomWaypoints(level, spawnLabel);

        // Load the "Slime_01_MeltalHelmet.glb" model
        ModelLoader.loadModel(scene, modelName, result => {
            this.mesh = result.meshes[0] as BABYLON.Mesh; // Use the first mesh from the loaded model
            this.mesh.position = position;
            this.mesh.scaling.scaleInPlace(4); // Scale down the model
            this.mesh.metadata = this.mesh.metadata || {};
            this.mesh.metadata.enemyInstance = this;

            // Add particle system for walking effect
            this.addWalkingParticleEffect();

            this.moveToNextWaypoint();
        });

        // Start the update loop for this enemy
        this.updateInterval = window.setInterval(() => this.update(16), 16); // ~60 FPS
    }

    private addWalkingParticleEffect(): void {
        const particleSystem = new BABYLON.ParticleSystem("walkingParticles", 2000, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("particles/17.png", this.scene); // Use 17.png texture
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
                    this.destroy();
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

        if (this.health <= 0) {
            this.destroy();
        }
    }

    destroy() {
        // Clear the update interval when the enemy is destroyed
        clearInterval(this.updateInterval);
        deleteEnemey(this);
        this.mesh.dispose();
        WaveManager.getInstance().isWaveComplete();
        console.log("enemy supprimer de la liste");
    }
}

export class Slime extends Enemy {
    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, level: string, spawnLabel: string) {
        super(scene, "Slime_03", position, 10, level, spawnLabel); // Slime has 10 HP by default
        this.speed = 10; // Slime-specific speed

    }
}


export class Knight extends Enemy {
    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, level: string, spawnLabel: string) {
        super(scene, "Slime_01_MeltalHelmet", position, 20, level, spawnLabel); // Viking has 20 HP by default
        this.speed = 5; // Viking-specific speed


    }
}

export class Viking extends Enemy {
    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, level: string, spawnLabel: string) {
        super(scene, "Slime_01_Viking", position, 20, level, spawnLabel); // Viking has 20 HP by default
        this.speed = 10; // Viking-specific speed

    }
    

    // Override moveToNextWaypoint to add Viking-specific behavior
    protected moveToNextWaypoint(): void {
        //console.log("Viking is charging towards the next waypoint!");
        super.moveToNextWaypoint();
    }
}
export class Attacker extends Enemy {
    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, level: string, spawnLabel: string) {
        super(scene, "Slime_03 Leaf", position, 20, level, spawnLabel); // Viking has 20 HP by default
        this.speed = 10; // Viking-specific speed

    }
}
