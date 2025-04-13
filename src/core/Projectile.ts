import { Enemy } from "./Enemy";

export class Projectile {
    mesh: BABYLON.Mesh;
    scene: BABYLON.Scene;
    targetMesh: BABYLON.Mesh | null;
    damageValue: number = 5; // Dégâts du projectile

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, targetMesh: BABYLON.Mesh) {
        this.scene = scene;
        this.targetMesh = targetMesh;

        // Créer une sphère comme projectile
        this.mesh = BABYLON.MeshBuilder.CreateSphere("projectile", { diameter: 1 }, scene);
        this.mesh.position = position;

        this.moveToTarget();
    }

    moveToTarget() {
        if (!this.targetMesh) return;

        BABYLON.Animation.CreateAndStartAnimation(
            "moveProjectile",
            this.mesh,
            "position",
            60,
            20,
            this.mesh.position,
            this.targetMesh.position,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            null,
            () => this.hitTarget()
        );
    }

    hitTarget() {
        console.log("🎯 Projectile a touché la cible !");

        // Vérifier si le mesh a un `enemyInstance`
        if (this.targetMesh?.metadata?.enemyInstance) {
            let enemy: Enemy = this.targetMesh.metadata.enemyInstance;
            enemy.damage(this.damageValue); // ✅ Appelle `damage()` sur l'ennemi
        }

        this.mesh.dispose(); // Supprime le projectile
    }
}
