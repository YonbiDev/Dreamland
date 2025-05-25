import { enemies } from "./GlobalState";
import { Projectile, SnowBallProjectile, StarProjectile } from "./Projectile";
import { ModelLoader } from "./ModelLoader";

// Classe de base abstraite pour les tourelles
export abstract class Turret {
    mesh: BABYLON.Mesh;
    range: number;
    scene: BABYLON.Scene;
    target: BABYLON.Mesh | null = null;
    fireRate: number;
    lastShotTime: number = 0;
    projectileSpeed: number;

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, range: number = 10, projectileSpeed: number = 30, fireRate: number = 1000) {
        this.scene = scene;
        this.range = range;
        this.projectileSpeed = projectileSpeed;
        this.fireRate = fireRate;

        this.loadModel(position);

        setInterval(() => {
            this.findTarget();
        }, 500);
    }

    // Méthode abstraite à implémenter dans les sous-classes pour charger le modèle
    abstract loadModel(position: BABYLON.Vector3): void;

    findTarget() {
        this.target = null;
        let closestDist = this.range;

        enemies.forEach(enemy => {
            if (enemy.mesh) {
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

abstract shoot(): void;
}

// Tourelle de type garden_tree_2
export class GardenTreeTurret extends Turret {
    shoot(): void {
          const now = Date.now();
        if (now - this.lastShotTime > this.fireRate) {
            new StarProjectile(this.scene, this.mesh.position.clone(), this.target!, this.projectileSpeed);
            this.lastShotTime = now;
        }
    }
    loadModel(position: BABYLON.Vector3): void {
        ModelLoader.loadModel(this.scene, "garden_tree_2", (result) => {
            this.mesh = result.meshes[0] as BABYLON.Mesh;
            this.mesh.position = position;
            this.mesh.scaling = new BABYLON.Vector3(2, 2, 2);
        });
    }
}

// Tourelle de type snow_tree
export class SnowTreeTurret extends Turret {
    shoot(): void {
          const now = Date.now();
        if (now - this.lastShotTime > this.fireRate) {
            new SnowBallProjectile(this.scene, this.mesh.position.clone(), this.target!, this.projectileSpeed);
            this.lastShotTime = now;
        }
    }
    loadModel(position: BABYLON.Vector3): void {
        ModelLoader.loadModel(this.scene, "snow_tree", (result) => {
            this.mesh = result.meshes[0] as BABYLON.Mesh;
            this.mesh.position = position;
            this.mesh.scaling = new BABYLON.Vector3(2, 2, 2);
        });
    }
}
