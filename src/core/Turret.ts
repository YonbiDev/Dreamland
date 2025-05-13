import { enemies } from "./GlobalState";
import { Projectile } from "./Projectile";
import { ModelLoader } from "./ModelLoader";

export class Turret {
    mesh: BABYLON.Mesh;
    range: number; 
    scene: BABYLON.Scene;
    target: BABYLON.Mesh | null = null;
    fireRate: number;// Time in milliseconds between shots
    lastShotTime: number = 0;
    projectileSpeed: number; // Speed of the projectiles fired by this turret

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, range: number = 10, projectileSpeed: number = 30,fireRate: number = 1000) {
        this.scene = scene;
        this.range = range;
        this.projectileSpeed = projectileSpeed; // Initialize projectile speed
        this.fireRate = fireRate; // Initialize fire rate

        ModelLoader.loadModel(scene, "garden_tree_2", (result) => {
            this.mesh = result.meshes[0] as BABYLON.Mesh;
            this.mesh.position = position;
            this.mesh.scaling = new BABYLON.Vector3(2, 2, 2); // Adjust scale as needed

            // Add sprite sheet animation
           // const spriteManager = new BABYLON.SpriteManager("spriteManager", "pipo-mapeffect013a.png", 1, { width: 400, height: 400 }, this.scene);
         /*   const sprite = new BABYLON.Sprite("effect", spriteManager);
            sprite.position = new BABYLON.Vector3(position.x, position.y+3, position.z); // Position below the turret
            sprite.playAnimation(0, 9, true, 100); // Play frames 0 to 15 in a loop with 100ms per frame
            sprite.size = 20; // Adjust size as needed 
        */
        });

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
