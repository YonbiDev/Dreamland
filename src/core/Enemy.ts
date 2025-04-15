import { DumpData } from "babylonjs/Misc/dumpTools";
import { deleteEnemey, getEnemies } from "../game";

export class Enemy {
    mesh: BABYLON.Mesh;
    scene: BABYLON.Scene;
    health: number;
    waypoints: BABYLON.Vector3[];
    currentWaypointIndex: number = 0;

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, health: number = 10, waypoints: BABYLON.Vector3[] = []) {
        this.scene = scene;
        this.health = health;
        this.waypoints = waypoints;

        // Créer un cube ennemi
        this.mesh = BABYLON.MeshBuilder.CreateBox("enemy", { size: 3 }, scene);
        this.mesh.position = position;

      

        // Enable physics for the enemy mesh
        this.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
            this.mesh,
            BABYLON.PhysicsImpostor.BoxImpostor,
            { mass: 1, restitution: 0.1, friction: 0.5 },
            this.scene
        );

        // Ensure the scene has gravity enabled
        this.scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
        this.scene.collisionsEnabled = true;

        this.mesh.checkCollisions = true; // Enable collision detection for the enemy

        // Start moving if waypoints are provided
        if (this.waypoints.length > 0) {
            this.moveToNextWaypoint();
        }
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
