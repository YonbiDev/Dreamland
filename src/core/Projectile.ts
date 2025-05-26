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
            // Positionne le projectile un peu plus haut à la création
            this.mesh.position = new BABYLON.Vector3(position.x, position.y + 2, position.z);
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
        // Traînée scintillante étoile
        const particleSystem = new BABYLON.ParticleSystem("starTrail", 250, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("assets/particles/star.png", this.scene);
        particleSystem.emitter = this.mesh;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.05, -0.05, -0.05);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.05, 0.05, 0.05);

        particleSystem.color1 = new BABYLON.Color4(1, 1, 0.5, 1);
        particleSystem.color2 = new BABYLON.Color4(1, 1, 1, 0.8);
        particleSystem.colorDead = new BABYLON.Color4(1, 1, 0.5, 0.0);

        particleSystem.minSize = 0.18;
        particleSystem.maxSize = 0.35;
        particleSystem.minLifeTime = 0.25;
        particleSystem.maxLifeTime = 0.5;
        particleSystem.emitRate = 180;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-0.2, -0.2, -0.2);
        particleSystem.direction2 = new BABYLON.Vector3(0.2, 0.2, 0.2);
        particleSystem.minEmitPower = 1.2;
        particleSystem.maxEmitPower = 2.2;
        particleSystem.updateSpeed = 0.01;

        particleSystem.start();
        this.mesh.metadata = { ...this.mesh.metadata, particleSystem };
    }
    protected createHitEffect() {
        // Impact : éclat étoilé
        const particleSystem = new BABYLON.ParticleSystem("starHit", 120, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("assets/particles/star.png", this.scene);
        particleSystem.emitter = this.mesh.position.clone();
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);

        particleSystem.color1 = new BABYLON.Color4(1, 1, 0.5, 1);
        particleSystem.color2 = new BABYLON.Color4(1, 1, 1, 0.8);
        particleSystem.colorDead = new BABYLON.Color4(1, 1, 0.5, 0.0);

        // Augmente la taille pour plus de visibilité
        particleSystem.minSize = 2;
        particleSystem.maxSize = 4.5;
        particleSystem.minLifeTime = 0.15;
        particleSystem.maxLifeTime = 0.3;
        particleSystem.emitRate = 100;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
        particleSystem.minEmitPower = 2;
        particleSystem.maxEmitPower = 4;
        particleSystem.updateSpeed = 0.01;

        particleSystem.start();
        setTimeout(() => particleSystem.dispose(), 500);
    }
    protected createDeathEffect(position: BABYLON.Vector3) {
        // Explosion d'étoiles
        const particleSystem = new BABYLON.ParticleSystem("starDeath", 300, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("assets/particles/star.png", this.scene);
        particleSystem.emitter = position;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.3, -0.3, -0.3);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.3, 0.3, 0.3);

        particleSystem.color1 = new BABYLON.Color4(1, 1, 0.5, 1);
        particleSystem.color2 = new BABYLON.Color4(1, 1, 1, 0.8);
        particleSystem.colorDead = new BABYLON.Color4(1, 1, 0.5, 0.0);

        particleSystem.minSize = 0.25;
        particleSystem.maxSize = 0.55;
        particleSystem.minLifeTime = 0.4;
        particleSystem.maxLifeTime = 0.8;
        particleSystem.emitRate = 200;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
        particleSystem.minEmitPower = 2.5;
        particleSystem.maxEmitPower = 5;
        particleSystem.updateSpeed = 0.01;

        particleSystem.start();
        setTimeout(() => particleSystem.dispose(), 900);
    }

    // Trajectoire directe vers la cible (comme la snowball)
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
        // Traînée de flocons
        const particleSystem = new BABYLON.ParticleSystem("snowTrail", 220, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("assets/particles/snowflake.png", this.scene);
        particleSystem.emitter = this.mesh;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.12, -0.12, -0.12);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.12, 0.12, 0.12);

        particleSystem.color1 = new BABYLON.Color4(0.9, 0.95, 1, 1);
        particleSystem.color2 = new BABYLON.Color4(0.7, 0.85, 1, 0.7);
        particleSystem.colorDead = new BABYLON.Color4(0.8, 0.95, 1, 0.1);

        particleSystem.minSize = 0.18;
        particleSystem.maxSize = 0.32;
        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 0.7;
        particleSystem.emitRate = 160;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, -0.5, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-0.2, -0.2, -0.2);
        particleSystem.direction2 = new BABYLON.Vector3(0.2, 0.2, 0.2);
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 2.2;
        particleSystem.updateSpeed = 0.01;

        particleSystem.start();
        this.mesh.metadata = { ...this.mesh.metadata, particleSystem };
    }
    protected createHitEffect() {
        // Impact : éclat de glace
        const particleSystem = new BABYLON.ParticleSystem("snowHit", 120, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("assets/particles/ice_shard.png", this.scene);
        particleSystem.emitter = this.mesh.position.clone();
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.12, -0.12, -0.12);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.12, 0.12, 0.12);

        particleSystem.color1 = new BABYLON.Color4(0.7, 0.9, 1, 1);
        particleSystem.color2 = new BABYLON.Color4(0.4, 0.7, 1, 0.7);
        particleSystem.colorDead = new BABYLON.Color4(0.8, 0.95, 1, 0.1);

        // Augmente la taille pour plus de visibilité
                particleSystem.minSize = 3;
        particleSystem.maxSize = 6;
        particleSystem.minLifeTime = 0.2;
        particleSystem.maxLifeTime = 0.5;
        particleSystem.emitRate = 90;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, -1, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
        particleSystem.minEmitPower = 1.5;
        particleSystem.maxEmitPower = 3;
        particleSystem.updateSpeed = 0.01;

        particleSystem.start();

        // Petite sphère bleue à l'impact
        const hitSphere = BABYLON.MeshBuilder.CreateSphere("snowHitSphere", { diameter: 3 }, this.scene);
        hitSphere.position = this.mesh.position.clone();
        hitSphere.isPickable = false;
        hitSphere.renderingGroupId = 2;
        const mat = new BABYLON.StandardMaterial("snowHitMat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.4, 0.7, 1);
        mat.emissiveColor = new BABYLON.Color3(0.7, 0.9, 1);
        mat.alpha = 0.5;
        hitSphere.material = mat;
        setTimeout(() => hitSphere.dispose(), 100);

        setTimeout(() => particleSystem.dispose(), 600);
    }
    protected createDeathEffect(position: BABYLON.Vector3) {
        // Nuage de neige
        const particleSystem = new BABYLON.ParticleSystem("snowDeath", 250, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("assets/particles/snowflake.png", this.scene);
        particleSystem.emitter = position;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.4, -0.4, -0.4);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.4, 0.4, 0.4);

        particleSystem.color1 = new BABYLON.Color4(0.9, 0.95, 1, 1);
        particleSystem.color2 = new BABYLON.Color4(0.7, 0.85, 1, 0.7);
        particleSystem.colorDead = new BABYLON.Color4(0.8, 0.95, 1, 0.1);

        particleSystem.minSize = 0.22;
        particleSystem.maxSize = 0.5;
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 1.1;
        particleSystem.emitRate = 180;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, -1, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
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

// MushroomBombProjectile subclass
export class MushroomBombProjectile extends Projectile {
    // Contrôle la taille de la zone d'impact (et d'affichage)
    static AOE_RADIUS: number = 10;

    protected getModelName(): string {
        return "mushroom_bomb";
    }
    protected getScaling(): BABYLON.Vector3 {
        return new BABYLON.Vector3(1, 1, 1);
    }
    protected addParticleEffect() {
        const particleSystem = new BABYLON.ParticleSystem("mushroomTrail", 150, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("assets/particles/green_flare.png", this.scene);
        particleSystem.emitter = this.mesh;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);

        particleSystem.color1 = new BABYLON.Color4(0.5, 1, 0.5, 1);
        particleSystem.color2 = new BABYLON.Color4(0.2, 0.8, 0.2, 1);
        particleSystem.minSize = 0.18;
        particleSystem.maxSize = 0.35;
        particleSystem.minLifeTime = 0.25;
        particleSystem.maxLifeTime = 0.6;
        particleSystem.emitRate = 90;
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
        // Effet de nuage vert à l'impact
        const particleSystem = new BABYLON.ParticleSystem("mushroomHit", 120, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("assets/particles/green_cloud.png", this.scene);
        particleSystem.emitter = this.mesh.position.clone();
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.2, -0.2, -0.2);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2);

        particleSystem.color1 = new BABYLON.Color4(0.5, 1, 0.5, 0.9);
        particleSystem.color2 = new BABYLON.Color4(0.2, 0.8, 0.2, 0.7);
        particleSystem.colorDead = new BABYLON.Color4(0.5, 1, 0.5, 0.1);

        particleSystem.minSize = 0.25;
        particleSystem.maxSize = 0.5;
        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 0.7;
        particleSystem.emitRate = 80;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
        particleSystem.minEmitPower = 1.5;
        particleSystem.maxEmitPower = 3;
        particleSystem.updateSpeed = 0.01;

        particleSystem.start();
        setTimeout(() => particleSystem.dispose(), 700);
    }
    protected createDeathEffect(position: BABYLON.Vector3) {
        // Effet de grande explosion verte
        const particleSystem = new BABYLON.ParticleSystem("mushroomDeath", 250, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("assets/particles/green_cloud.png", this.scene);
        particleSystem.emitter = position;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.7, -0.7, -0.7);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.7, 0.7, 0.7);

        particleSystem.color1 = new BABYLON.Color4(0.5, 1, 0.5, 0.9);
        particleSystem.color2 = new BABYLON.Color4(0.2, 0.8, 0.2, 0.7);
        particleSystem.colorDead = new BABYLON.Color4(0.5, 1, 0.5, 0.1);

        particleSystem.minSize = 0.4;
        particleSystem.maxSize = 0.8;
        particleSystem.minLifeTime = 0.7;
        particleSystem.maxLifeTime = 1.3;
        particleSystem.emitRate = 150;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
        particleSystem.minEmitPower = 2;
        particleSystem.maxEmitPower = 5;
        particleSystem.updateSpeed = 0.01;

        particleSystem.start();
        setTimeout(() => particleSystem.dispose(), 1200);
    }

    // Trajectoire ascendante puis descendante en visant dynamiquement la cible
    moveToTarget() {
        if (!this.targetMesh) return;

        const ascendDuration = 500; // ms
        const ascendStart = Date.now();
        let ascending = true;

        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.mesh || !this.mesh.physicsImpostor) return;

            // Supprimé : effet de rotation visuelle arbitraire
            // this.mesh.rotation.x += 0.05;
            // this.mesh.rotation.y += 0.05;

            const now = Date.now();
            if (ascending) {
                // Monte verticalement
                this.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, this.speed, 0));
                if (now - ascendStart > ascendDuration) {
                    ascending = false;
                }
            } else if (this.targetMesh) {
                // Dirige dynamiquement vers la position actuelle de la cible (rocket)
                const direction = this.targetMesh.position.subtract(this.mesh.position).normalize();
                const velocity = direction.scale(this.speed);
                this.mesh.physicsImpostor.setLinearVelocity(velocity);

                // --- Rotation uniquement sur l'axe X (pitch) ---
                const dy = direction.y;
                // Pitch: angle autour de X (vertical)
                const pitch = -Math.asin(dy) * 3; // Ajuste le facteur pour l'inclinaison voulue

                const targetRotation = BABYLON.Quaternion.RotationYawPitchRoll(0, pitch, 0);
                if (!this.mesh.rotationQuaternion) {
                    this.mesh.rotationQuaternion = BABYLON.Quaternion.Identity();
                }
                this.mesh.rotationQuaternion = BABYLON.Quaternion.Slerp(
                    this.mesh.rotationQuaternion,
                    targetRotation,
                    0.1 // Smoothing factor
                );
                // ----------------------------------------------

                const distance = BABYLON.Vector3.Distance(this.mesh.position, this.targetMesh.position);
                if (distance <= 0.5) {
                    this.hitTarget();
                }
            }
        });
    }

    // AoE damage à l'impact
    hitTarget() {
        console.log("🍄 MushroomBombProjectile a touché la cible !");
        this.createHitEffect();

        // --- Visualisation de la zone d'impact ---
        const aoeRadius = MushroomBombProjectile.AOE_RADIUS;
        const impactPosition = this.targetMesh?.position.clone();
        if (impactPosition) {
            const aoeMesh = BABYLON.MeshBuilder.CreateSphere("aoeImpact", { diameter: aoeRadius * 2 }, this.scene);
            aoeMesh.position = impactPosition;
            aoeMesh.isPickable = false;
            aoeMesh.renderingGroupId = 2;

            // Matériau rouge, alpha 0.5, émissif
            const aoeMat = new BABYLON.StandardMaterial("aoeMat", this.scene);
            aoeMat.diffuseColor = new BABYLON.Color3(1, 0, 0);
            aoeMat.emissiveColor = new BABYLON.Color3(1, 0.2, 0.2);
            aoeMat.alpha = 0.1;
            aoeMesh.material = aoeMat;

            // Ajoute un contour blanc pour la visibilité
            aoeMesh.enableEdgesRendering();
            aoeMesh.edgesWidth = 4.0;
            aoeMesh.edgesColor = new BABYLON.Color4(1, 1, 1, 0.8);

            // Animation de scaling (pop effect)
            aoeMesh.scaling.set(0.7, 0.7, 0.7);
            const scaleAnim = new BABYLON.Animation(
                "aoeScale",
                "scaling",
                60,
                BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );
            const keys = [
                { frame: 0, value: new BABYLON.Vector3(0.7, 0.7, 0.7) },
                { frame: 10, value: new BABYLON.Vector3(1.1, 1.1, 1.1) },
                { frame: 20, value: new BABYLON.Vector3(1, 1, 1) },
                { frame: 30, value: new BABYLON.Vector3(1, 1, 1) }
            ];
            scaleAnim.setKeys(keys);
            aoeMesh.animations = [scaleAnim];
            this.scene.beginAnimation(aoeMesh, 0, 30, false);

            // Fade out alpha
            let fadeTimeout = setTimeout(() => {
                let fadeStep = 0;
                const fadeInterval = setInterval(() => {
                    aoeMat.alpha -= 0.05;
                    fadeStep++;
                    if (fadeStep > 10) {
                        clearInterval(fadeInterval);
                        aoeMesh.dispose();
                    }
                }, 20);
            }, 350);

        }
        // ------------------------------------------

        // Inflige des dégâts à tous les ennemis proches
        if (this.targetMesh && this.targetMesh.position && this.scene.meshes) {
            for (const mesh of this.scene.meshes) {
                if (mesh.metadata?.enemyInstance) {
                    const enemy: Enemy = mesh.metadata.enemyInstance;
                    const dist = BABYLON.Vector3.Distance(mesh.position, this.targetMesh.position);
                    if (dist <= aoeRadius) {
                        enemy.damage(this.damageValue);
                        if (enemy.health <= 0) {
                            this.createDeathEffect(enemy.mesh.position);
                        }
                    }
                }
            }
        }

        this.dispose();
    }
}
