import { DumpData } from "babylonjs/Misc/dumpTools";
import { deleteEnemey, getEnemies } from "../game";

export class Enemy {
    mesh: BABYLON.Mesh;
    scene: BABYLON.Scene;
    health: number;
    waypoints: BABYLON.Vector3[];
    currentWaypointIndex: number = 0;
    speed: number = 0.1; // Movement speed

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, health: number = 10, level: string, spawnLabel: string) {
        this.scene = scene;
        this.health = health;

        // Load waypoints for the given level and spawn label
        this.waypoints = this.loadRandomWaypoints(level, spawnLabel);

        // Créer un cube ennemi avec un nom unique
        this.mesh = BABYLON.MeshBuilder.CreateBox(`enemy_${Date.now()}`, { size: 3 }, scene); // Unique name
        this.mesh.position = position;

        // Set the material to white
        this.mesh.material = new BABYLON.StandardMaterial(`enemyMat_${Date.now()}`, this.scene); // Unique material name
        (this.mesh.material as BABYLON.StandardMaterial).diffuseColor = BABYLON.Color3.White(); // Ensure white color

        // Start moving if waypoints are provided
        if (this.waypoints.length > 0) {
            this.moveToNextWaypoint();
        }

        this.mesh.metadata = this.mesh.metadata || {};
        this.mesh.metadata.enemyInstance = this;
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

        return new Enemy(scene, spawnPoint, 10, level.toString(), spawnPositionNumber.toString());
    }

    loadRandomWaypoints(level: string, spawnLabel: string): BABYLON.Vector3[] {
        const key = `level${level}_spawnpoint${spawnLabel}`; // Correct key format
        console.log(`Loading waypoints for ${key}`);
        const waypointLists: BABYLON.Vector3[][] = [];
        let index = 1;

        while (true) {
            const filename = `${key}_waypoint${index}.json`;
            const waypointData = localStorage.getItem(filename);
            if (!waypointData  ) break;

            const waypoints = JSON.parse(waypointData).map((wp: { x: number; y: number; z: number }) =>
                new BABYLON.Vector3(wp.x, wp.y, wp.z)
            );
            if(waypoints.length === 0) {
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
        return waypointLists[randomListIndex];
    }

    private moveToNextWaypoint(): void {
        if (this.currentWaypointIndex >= this.waypoints.length) return;

        const target = this.waypoints[this.currentWaypointIndex];
        const speed = 0.1; // Movement speed
        const moveInterval = setInterval(() => {
            const direction = target.subtract(this.mesh.position).normalize();
            const distance = BABYLON.Vector3.Distance(this.mesh.position, target);

            // Attempt to move while respecting collisions
            const moveVector = direction.scale(speed);
            this.mesh.moveWithCollisions(moveVector);

            if (distance < 0.5) {
                // Reached the waypoint
                clearInterval(moveInterval);
                this.currentWaypointIndex++;
                this.moveToNextWaypoint();
            }
        }, 16); // Update every 16ms (~60 FPS)
    }

    private handleCollision(collidedMesh: BABYLON.AbstractMesh): void {
        // Logic to handle collision (e.g., stop movement, take damage, etc.)
        console.log(`Enemy collided with ${collidedMesh.name}`);
        this.destroy(); // Destroy the enemy on collision
    }

    update(deltaTime: number) {
        if (this.waypoints && this.waypoints.length > 0) {
            const target = this.waypoints[0];
            console.log(`Current target waypoint: ${target.toString()}`);

            const direction = target.subtract(this.mesh.position).normalize();
            const distance = BABYLON.Vector3.Distance(this.mesh.position, target);

            if (distance > 0.1) {
                this.mesh.position.addInPlace(direction.scale(this.speed * deltaTime));
            } else {
                console.log(`Reached waypoint: ${target.toString()}`);
                this.waypoints.shift();
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
        deleteEnemey(this);
        this.mesh.dispose();
        console.log("enemy supprimer de la liste");
    }
}
