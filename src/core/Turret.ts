import { enemies } from "./GlobalState";
import { Projectile } from "./Projectile";

export class Turret {
    mesh: BABYLON.Mesh;
    range: number;
    scene: BABYLON.Scene;
    target: BABYLON.Mesh | null = null;
    fireRate: number = 1000;
    lastShotTime: number = 0;
    projectileSpeed: number; // Speed of the projectiles fired by this turret

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, range: number = 10, projectileSpeed: number = 20) {
        this.scene = scene;
        this.range = range;
        this.projectileSpeed = projectileSpeed; // Initialize projectile speed

        this.mesh = BABYLON.MeshBuilder.CreateBox("turret", { size: 3 }, scene);
        this.mesh.position = position;
        this.mesh.material = new BABYLON.StandardMaterial("turretMat", scene);
        (this.mesh.material as BABYLON.StandardMaterial).diffuseColor = BABYLON.Color3.Blue();

        // Vérifier les ennemis toutes les 500ms
        setInterval(() => {
            this.findTarget();
        }, 500);
    }

    findTarget() {
        this.target = null;
        let closestDist = this.range;

        enemies.forEach(enemy => {
            if (enemy.mesh) { // Ensure the enemy is valid
                const distance = BABYLON.Vector3.Distance(this.mesh.position, enemy.mesh.position);
                if (distance < closestDist) {
                    closestDist = distance;
                    this.target = enemy.mesh;
                }
            }
        });

        if (this.target) {
            console.log(`Turret targeting enemy at ${this.target.position}`);
            this.shoot();
        }
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShotTime > this.fireRate) {
            new Projectile(this.scene, this.mesh.position.clone(), this.target!, this.projectileSpeed); // Pass projectile speed
            this.lastShotTime = now;
        }
    }
}
