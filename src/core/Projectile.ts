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

            this.addParticleEffect(); // Ajouter les particules au projectile
            this.moveToTarget();
        });
    }

    private addParticleEffect() {
        const particleSystem = new BABYLON.ParticleSystem("projectileTrail", 200, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("textures/flare.png", this.scene);
        particleSystem.emitter = this.mesh; // Émettre depuis le projectile
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1); // Zone d'émission minimale
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1); // Zone d'émission maximale

        particleSystem.color1 = new BABYLON.Color4(1, 1, 0, 1); // Jaune
        particleSystem.color2 = new BABYLON.Color4(1, 0.5, 0, 1); // Orange
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;
        particleSystem.minLifeTime = 0.2;
        particleSystem.maxLifeTime = 0.5;
        particleSystem.emitRate = 100;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, 0, 0); // Pas de gravité pour les particules
        particleSystem.direction1 = new BABYLON.Vector3(-0.5, -0.5, -0.5);
        particleSystem.direction2 = new BABYLON.Vector3(0.5, 0.5, 0.5);
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 2;
        particleSystem.updateSpeed = 0.01;

        particleSystem.start();

        // Stocker le système de particules pour le supprimer plus tard
        this.mesh.metadata = { ...this.mesh.metadata, particleSystem };
    }

    moveToTarget() {
        if (!this.targetMesh) return;

        let randomPhase = true; // Phase initiale d'étoile filante
        const randomDuration = 1000; // Durée en ms pour le mouvement initial
        const startTime = Date.now();
        let zigzagDirection = 1; // Direction du zigzag (1 ou -1)

        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.mesh || !this.mesh.physicsImpostor) return;

            // Ajouter une rotation continue au projectile
            this.mesh.rotation.x += 0.05; // Rotation sur l'axe X
            this.mesh.rotation.y += 0.05; // Rotation sur l'axe Y

            if (randomPhase) {
                // Mouvement en étoile filante avec zigzag
                const timeElapsed = Date.now() - startTime;
                const zigzagFrequency = 0.1; // Fréquence du zigzag
                const zigzagAmplitude = 0.5; // Amplitude du zigzag

                const zigzagOffset = Math.sin(timeElapsed * zigzagFrequency) * zigzagAmplitude * zigzagDirection;

                const randomDirection = new BABYLON.Vector3(
                    zigzagOffset, // Oscillation sur l'axe X
                    1, // Vers le haut
                    Math.random() * 0.5 - 0.25 // Légère variation sur l'axe Z
                ).normalize();
                const randomVelocity = randomDirection.scale(this.speed * 0.7); // Vitesse ajustée pour l'effet
                this.mesh.physicsImpostor.setLinearVelocity(randomVelocity);

                // Vérifier si la durée de l'effet étoile filante est écoulée
                if (timeElapsed > randomDuration) {
                    randomPhase = false; // Passer à la phase de ciblage
                }
            } else if (this.targetMesh) {
                // Mouvement vers la cible
                const direction = this.targetMesh.position.subtract(this.mesh.position).normalize();
                const velocity = direction.scale(this.speed);
                this.mesh.physicsImpostor.setLinearVelocity(velocity);

                const distance = BABYLON.Vector3.Distance(this.mesh.position, this.targetMesh.position);
                if (distance <= 0.5) { // Threshold for hitting the target
                    this.hitTarget();
                }
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
        // Supprimer les particules associées
        const particleSystem = this.mesh.metadata?.particleSystem;
        if (particleSystem) {
            particleSystem.stop();
            particleSystem.dispose();
        }

        this.mesh.physicsImpostor?.dispose(); // Supprime la physique
        this.mesh.dispose(); // Supprime le projectile
    }
}
