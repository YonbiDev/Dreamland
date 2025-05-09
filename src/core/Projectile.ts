import { Enemy } from "./Enemy";
import { ModelLoader } from "./ModelLoader";

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

        // Charger le modèle de l'étoile comme projectile
        ModelLoader.loadModel(scene, "star_yellow", (result) => {
            this.mesh = result.meshes[0] as BABYLON.Mesh; // Use the first mesh from the loaded model
            this.mesh.position = position;
            this.mesh.scaling = new BABYLON.Vector3(3, 3, 3); // Adjust scale as needed

            // Activer la physique pour le projectile
            this.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                this.mesh,
                BABYLON.PhysicsImpostor.SphereImpostor,
                { mass: 1, restitution: 0.1 },
                scene
            );

            this.moveToTarget();
        });
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
        this.createHitEffect(); // Add particle effect on hit

        // Vérifier si le mesh a un `enemyInstance`
        if (this.targetMesh?.metadata?.enemyInstance) {
            let enemy: Enemy = this.targetMesh.metadata.enemyInstance;
            enemy.damage(this.damageValue); // ✅ Appelle `damage()` sur l'ennemi

            if (enemy.health <= 0) { // Check if the enemy is dead
                this.createDeathEffect(enemy.mesh.position); // Add particle effect on enemy death
            }
        }

        this.dispose();
    }

    private createHitEffect() {
        const particleSystem = new BABYLON.ParticleSystem("hitEffect", 100, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("textures/flare.png", this.scene);
        particleSystem.emitter = this.mesh.position.clone(); // Emit from the projectile's position
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1); // Emit in a small area
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);

        particleSystem.color1 = new BABYLON.Color4(1, 1, 0, 1); // Yellow
        particleSystem.color2 = new BABYLON.Color4(1, 0.5, 0, 1); // Orange
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;
        particleSystem.minLifeTime = 0.2;
        particleSystem.maxLifeTime = 0.5;
        particleSystem.emitRate = 50;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-1, -1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 3;
        particleSystem.updateSpeed = 0.01;

        particleSystem.start();
        setTimeout(() => particleSystem.dispose(), 500); // Dispose after 500ms
    }

    private createDeathEffect(position: BABYLON.Vector3) {
        const particleSystem = new BABYLON.ParticleSystem("deathEffect", 200, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("particles/28.png", this.scene);
        particleSystem.emitter = position; // Emit from the enemy's position
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);

        particleSystem.color1 = new BABYLON.Color4(1, 0, 0, 1); // Red
        particleSystem.color2 = new BABYLON.Color4(1, 0.5, 0, 1); // Orange
        particleSystem.minSize = 0.2;
        particleSystem.maxSize = 0.5;
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 1;
        particleSystem.emitRate = 100;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-1, -1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
        particleSystem.minEmitPower = 2;
        particleSystem.maxEmitPower = 5;
        particleSystem.updateSpeed = 0.01;

        particleSystem.start();
        setTimeout(() => particleSystem.dispose(), 1000); // Dispose after 1 second
    }

    private dispose() {
        this.mesh.physicsImpostor?.dispose(); // Supprime la physique
        this.mesh.dispose(); // Supprime le projectile
    }
}
