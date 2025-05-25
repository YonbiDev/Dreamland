import { Enemy } from "./Enemy";
import { ModelLoader } from "./ModelLoader";

// Base Projectile class
export abstract class Projectile {
    mesh: BABYLON.Mesh;
    scene: BABYLON.Scene;
    targetMesh: BABYLON.Mesh | null;
    damageValue: number = 5;
    speed: number;

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, targetMesh: BABYLON.Mesh, speed: number) {
        this.scene = scene;
        this.targetMesh = targetMesh;
        this.speed = speed;

        if (!scene.isPhysicsEnabled()) {
            console.warn("⚠️ La physique n'est pas activée dans la scène. Activation en cours...");
            scene.enablePhysics(new BABYLON.Vector3(0, 0, 0), new BABYLON.CannonJSPlugin());
        }

        ModelLoader.loadModel(scene, this.getModelName(), (result) => {
            this.mesh = result.meshes[0] as BABYLON.Mesh;
            this.mesh.position = position;
            this.mesh.scaling = this.getScaling();

            this.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                this.mesh,
                BABYLON.PhysicsImpostor.SphereImpostor,
                { mass: 1, restitution: 0.1 },
                scene
            );

            this.addParticleEffect();
            this.moveToTarget();
        });
    }

    // Abstracts for subclasses to override
    protected abstract getModelName(): string;
    protected abstract getScaling(): BABYLON.Vector3;
    protected abstract addParticleEffect(): void;
    protected abstract createHitEffect(): void;
    protected abstract createDeathEffect(position: BABYLON.Vector3): void;

    moveToTarget() {
        if (!this.targetMesh) return;

        let randomPhase = true;
        const randomDuration = 1000;
        const startTime = Date.now();
        let zigzagDirection = 1;

        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.mesh || !this.mesh.physicsImpostor) return;

            this.mesh.rotation.x += 0.05;
            this.mesh.rotation.y += 0.05;

            if (randomPhase) {
                const timeElapsed = Date.now() - startTime;
                const zigzagFrequency = 0.1;
                const zigzagAmplitude = 0.5;

                const zigzagOffset = Math.sin(timeElapsed * zigzagFrequency) * zigzagAmplitude * zigzagDirection;

                const randomDirection = new BABYLON.Vector3(
                    zigzagOffset,
                    1,
                    Math.random() * 0.5 - 0.25
                ).normalize();
                const randomVelocity = randomDirection.scale(this.speed * 0.7);
                this.mesh.physicsImpostor.setLinearVelocity(randomVelocity);

                if (timeElapsed > randomDuration) {
                    randomPhase = false;
                }
            } else if (this.targetMesh) {
                const direction = this.targetMesh.position.subtract(this.mesh.position).normalize();
                const velocity = direction.scale(this.speed);
                this.mesh.physicsImpostor.setLinearVelocity(velocity);

                const distance = BABYLON.Vector3.Distance(this.mesh.position, this.targetMesh.position);
                if (distance <= 0.5) {
                    this.hitTarget();
                }
            }
        });
    }

    hitTarget() {
        console.log("🎯 Projectile a touché la cible !");
        this.createHitEffect();

        if (this.targetMesh?.metadata?.enemyInstance) {
            let enemy: Enemy = this.targetMesh.metadata.enemyInstance;
            enemy.damage(this.damageValue);

            if (enemy.health <= 0) {
                this.createDeathEffect(enemy.mesh.position);
            }
        }

        this.dispose();
    }

    protected dispose() {
        const particleSystem = this.mesh.metadata?.particleSystem;
        if (particleSystem) {
            particleSystem.stop();
            particleSystem.dispose();
        }

        this.mesh.physicsImpostor?.dispose();
        this.mesh.dispose();
    }
}

// StarProjectile subclass
export class StarProjectile extends Projectile {
    protected getModelName(): string {
        return "star_yellow";
    }
    protected getScaling(): BABYLON.Vector3 {
        return new BABYLON.Vector3(3, 3, 3);
    }
    protected addParticleEffect() {
        const particleSystem = new BABYLON.ParticleSystem("projectileTrail", 200, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("assets/particles/flare.png", this.scene);
        particleSystem.emitter = this.mesh;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);

        particleSystem.color1 = new BABYLON.Color4(1, 1, 0, 1);
        particleSystem.color2 = new BABYLON.Color4(1, 0.5, 0, 1);
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;
        particleSystem.minLifeTime = 0.2;
        particleSystem.maxLifeTime = 0.5;
        particleSystem.emitRate = 100;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-0.5, -0.5, -0.5);
        particleSystem.direction2 = new BABYLON.Vector3(0.5, 0.5, 0.5);
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 2;
        particleSystem.updateSpeed = 0.01;

        particleSystem.start();
        this.mesh.metadata = { ...this.mesh.metadata, particleSystem };
    }
    protected createHitEffect() {
        const particleSystem = new BABYLON.ParticleSystem("hitEffect", 100, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("assets/particles/flare.png", this.scene);
        particleSystem.emitter = this.mesh.position.clone();
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);

        particleSystem.color1 = new BABYLON.Color4(1, 1, 0, 1);
        particleSystem.color2 = new BABYLON.Color4(1, 0.5, 0, 1);
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
        setTimeout(() => particleSystem.dispose(), 500);
    }
    protected createDeathEffect(position: BABYLON.Vector3) {
        const particleSystem = new BABYLON.ParticleSystem("deathEffect", 200, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("assets/particles/28.png", this.scene);
        particleSystem.emitter = position;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);

        particleSystem.color1 = new BABYLON.Color4(1, 0, 0, 1);
        particleSystem.color2 = new BABYLON.Color4(1, 0.5, 0, 1);
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
        setTimeout(() => particleSystem.dispose(), 1000);
    }
}

// SnowBallProjectile subclass
export class SnowBallProjectile extends Projectile {
    protected getModelName(): string {
        return "snow_ball";
    }
    protected getScaling(): BABYLON.Vector3 {
        return new BABYLON.Vector3(2, 2, 2);
    }
    protected addParticleEffect() {
        const particleSystem = new BABYLON.ParticleSystem("snowTrail", 200, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("assets/particles/snow.png", this.scene);
        particleSystem.emitter = this.mesh;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);

        particleSystem.color1 = new BABYLON.Color4(1, 1, 1, 1);
        particleSystem.color2 = new BABYLON.Color4(0.8, 0.9, 1, 1);
        particleSystem.minSize = 0.15;
        particleSystem.maxSize = 0.35;
        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 0.6;
        particleSystem.emitRate = 120;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-0.3, -0.3, -0.3);
        particleSystem.direction2 = new BABYLON.Vector3(0.3, 0.3, 0.3);
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 2;
        particleSystem.updateSpeed = 0.01;

        particleSystem.start();
        this.mesh.metadata = { ...this.mesh.metadata, particleSystem };
    }
    protected createHitEffect() {
        // Effet "glass blue" lors de l'impact
        const particleSystem = new BABYLON.ParticleSystem("snowGlassHit", 100, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("assets/particles/glass.png", this.scene); // Utilise une texture de verre bleuté
        particleSystem.emitter = this.mesh.position.clone();
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.15, -0.15, -0.15);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.15, 0.15, 0.15);

        // Couleurs bleu-glass
        particleSystem.color1 = new BABYLON.Color4(0.4, 0.7, 1, 0.8); // Bleu clair, semi-transparent
        particleSystem.color2 = new BABYLON.Color4(0.7, 0.9, 1, 0.5); // Bleu très clair, plus transparent
        particleSystem.colorDead = new BABYLON.Color4(0.8, 0.95, 1, 0.1);

        particleSystem.minSize = 0.18;
        particleSystem.maxSize = 0.35;
        particleSystem.minLifeTime = 0.25;
        particleSystem.maxLifeTime = 0.6;
        particleSystem.emitRate = 80;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, -2, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-1, -1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
        particleSystem.minEmitPower = 1.2;
        particleSystem.maxEmitPower = 2.5;
        particleSystem.updateSpeed = 0.01;

        particleSystem.start();
        setTimeout(() => particleSystem.dispose(), 600);
    }
    protected createDeathEffect(position: BABYLON.Vector3) {
        // Effet "glass blue" lors de la mort
        const particleSystem = new BABYLON.ParticleSystem("snowGlassDeath", 200, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("assets/particles/glass.png", this.scene); // Utilise une texture de verre bleuté
        particleSystem.emitter = position;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);

        // Couleurs bleu-glass
        particleSystem.color1 = new BABYLON.Color4(0.4, 0.7, 1, 0.8);
        particleSystem.color2 = new BABYLON.Color4(0.7, 0.9, 1, 0.5);
        particleSystem.colorDead = new BABYLON.Color4(0.8, 0.95, 1, 0.1);

        particleSystem.minSize = 0.25;
        particleSystem.maxSize = 0.6;
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 1.1;
        particleSystem.emitRate = 120;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, -2, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-1, -1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
        particleSystem.minEmitPower = 2;
        particleSystem.maxEmitPower = 4;
        particleSystem.updateSpeed = 0.01;

        particleSystem.start();
        setTimeout(() => particleSystem.dispose(), 1000);
    }

    // Override pour trajectoire directe
    moveToTarget() {
        if (!this.targetMesh) return;

        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.mesh || !this.mesh.physicsImpostor || !this.targetMesh) return;

            // Optionnel : légère rotation pour l'effet visuel
            this.mesh.rotation.x += 0.05;
            this.mesh.rotation.y += 0.05;

            // Calcul direction directe
            const direction = this.targetMesh.position.subtract(this.mesh.position).normalize();
            const velocity = direction.scale(this.speed);
            this.mesh.physicsImpostor.setLinearVelocity(velocity);

            const distance = BABYLON.Vector3.Distance(this.mesh.position, this.targetMesh.position);
            if (distance <= 0.5) {
                this.hitTarget();
            }
        });
    }

    // Override hitTarget to apply slow effect instead of damage
    hitTarget() {
        console.log("❄️ SnowBallProjectile a touché la cible !");
        this.createHitEffect();

        if (this.targetMesh?.metadata?.enemyInstance) {
            let enemy: Enemy = this.targetMesh.metadata.enemyInstance;
            // Store original speed if not already stored
            if (enemy && typeof enemy.speed === "number") {
                if (enemy._originalSpeed === undefined) {
                    enemy._originalSpeed = enemy.speed;
                }
                // Reduce speed by 50%
                enemy.speed = enemy._originalSpeed * 0.5;

                // Restore speed after 2 seconds
                setTimeout(() => {
                    if (enemy && typeof enemy._originalSpeed === "number") {
                        enemy.speed = enemy._originalSpeed;
                    }
                }, 2000);
            }
        }

        this.dispose();
    }
}
