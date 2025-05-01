import { Enemy } from "./Enemy";

export class Projectile {
    mesh: BABYLON.Mesh;
    scene: BABYLON.Scene;
    targetMesh: BABYLON.Mesh | null;
    damageValue: number = 5; // Dégâts du projectile
    speed: number; // Speed of the projectile

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, targetMesh: BABYLON.Mesh, speed: number) {
        this.scene = scene;
        this.targetMesh = targetMesh;
        this.speed = speed; // Initialize speed

        // Vérifier si la physique est activée dans la scène
        if (!scene.isPhysicsEnabled()) {
            console.warn("⚠️ La physique n'est pas activée dans la scène. Activation en cours...");
            scene.enablePhysics(new BABYLON.Vector3(0, 0, 0), new BABYLON.CannonJSPlugin());
        }

        // Créer une sphère comme projectile
        this.mesh = BABYLON.MeshBuilder.CreateSphere("projectile", { diameter: 1 }, scene);
        this.mesh.position = position;

        // Activer la physique pour le projectile
        this.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
            this.mesh,
            BABYLON.PhysicsImpostor.SphereImpostor,
            { mass: 1, restitution: 0.1 },
            scene
        );

        this.moveToTarget();
    }

    moveToTarget() {
        if (!this.targetMesh) return;

        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.targetMesh || !this.mesh || !this.mesh.physicsImpostor) return;

            const direction = this.targetMesh.position.subtract(this.mesh.position).normalize();
            const velocity = direction.scale(this.speed);

            // Mettre à jour la vitesse pour suivre la cible
            this.mesh.physicsImpostor.setLinearVelocity(velocity);

            const distance = BABYLON.Vector3.Distance(this.mesh.position, this.targetMesh.position);
            if (distance <= 0.5) { // Threshold for hitting the target
                this.hitTarget();
            }
        });
    }

    hitTarget() {
        console.log("🎯 Projectile a touché la cible !");

        // Vérifier si le mesh a un `enemyInstance`
        if (this.targetMesh?.metadata?.enemyInstance) {
            let enemy: Enemy = this.targetMesh.metadata.enemyInstance;
            enemy.damage(this.damageValue); // ✅ Appelle `damage()` sur l'ennemi
        }

        this.dispose();
    }

    private dispose() {
        this.mesh.physicsImpostor?.dispose(); // Supprime la physique
        this.mesh.dispose(); // Supprime le projectile
    }
}
