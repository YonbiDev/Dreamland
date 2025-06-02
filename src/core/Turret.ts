import { enemies } from "./GlobalState";
import { MushroomBombProjectile, Projectile, SnowBallProjectile, StarProjectile } from "./Projectile";
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
    private targetingObserver: BABYLON.Observer<BABYLON.Scene>;

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, range: number , projectileSpeed: number = 30, fireRate: number = 1000) {
        this.scene = scene;
        this.range = range;
        this.projectileSpeed = projectileSpeed;
        this.fireRate = fireRate;

        this.loadModel(position);

        // Use onBeforeRenderObservable for reliable targeting
        this.targetingObserver = this.scene.onBeforeRenderObservable.add(() => {
            if (this.mesh && this.mesh.isDisposed && this.mesh.isDisposed()) return;
            this.findTarget();
        });
    }

    // Méthode abstraite à implémenter dans les sous-classes pour charger le modèle
    abstract loadModel(position: BABYLON.Vector3): void;

    findTarget() {
        if (!this.mesh) return;
        this.target = null;
        let closestDist = this.range;

        for (const enemy of enemies) {
            if (
                enemy.mesh &&
                (!enemy.mesh.isDisposed || !enemy.mesh.isDisposed()) &&
                enemy.health > 0
            ) {
                const distance = BABYLON.Vector3.Distance(this.mesh.position, enemy.mesh.position);
                if (distance < closestDist) {
                    closestDist = distance;
                    this.target = enemy.mesh;
                }
            }
        }

        if (this.target) {
            // Optionally: this.mesh.lookAt(this.target.position);
            this.shoot();
        }
    }

    abstract shoot(): void;

    // Clean up observer if needed (call this when turret is destroyed)
    dispose() {
        if (this.targetingObserver) {
            this.scene.onBeforeRenderObservable.remove(this.targetingObserver);
        }
        if (this.mesh && !this.mesh.isDisposed()) {
            this.mesh.dispose();
        }
    }
}

// Tourelle de type garden_Etoile
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

// Tourelle de type mushroom_tree
export class MushroomTreeTurret extends Turret {
    shoot(): void {
        const now = Date.now();
        if (now - this.lastShotTime > this.fireRate) {
            new MushroomBombProjectile(this.scene, this.mesh.position.clone(), this.target!, this.projectileSpeed);
            this.lastShotTime = now;
        }
    }
    loadModel(position: BABYLON.Vector3): void {
        ModelLoader.loadModel(this.scene, "mushroom_tree", (result) => {
            this.mesh = result.meshes[0] as BABYLON.Mesh;
            this.mesh.position = position;
            this.mesh.scaling = new BABYLON.Vector3(2, 2, 2);
        });
    }
}
