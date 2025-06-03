import { ObjectManager } from "./ObjectManager";
import { ModelLoader } from "./ModelLoader";
import { Game } from "../game";
import { int } from "babylonjs";
import { WaveManager } from "./WaveManager";


const ASSET_BASE_URL = "assets/";

export class UIManager {
    private static instance: UIManager | null = null;

    public static getInstance(scene?: BABYLON.Scene, canvas?: HTMLCanvasElement, game?: Game): UIManager {
        if (!UIManager.instance) {
            if (!scene || !canvas || !game) {
                throw new Error("UIManager has not been initialized. Please provide scene, canvas, and game arguments.");
            }
            UIManager.instance = new UIManager(scene, canvas, game);
        }
        return UIManager.instance;
    }

    private scene: BABYLON.Scene;
    private canvas: HTMLCanvasElement;
    private isPlacingObject: boolean = false;
    private previewMesh: BABYLON.Mesh | null = null;
    private rangeIndicator: BABYLON.Mesh | null = null;
    private objectManager: ObjectManager;
    private waypoints: BABYLON.Vector3[] = [];
    private isPlacingWaypoints: boolean = false;
    private topBar: HTMLDivElement | null = null;
    private bottomBar: HTMLDivElement | null = null;
    private coinDisplay: HTMLDivElement | null = null;
    private healthDisplay: HTMLDivElement | null = null;
    private game: Game;
    private startWaveButton: HTMLButtonElement | null = null;
    private enemyCountDisplay: HTMLDivElement | null = null;

    // Ajout : états de déblocage des tourelles
    private turretUnlockState = {
        garden_turret: true,
        snow_turret: false,
        mushroom_tree: false,
    };
    private turretPlaceholders: { [key: string]: HTMLDivElement } = {};

    // Nouveau : référence au message d'aide de placement
    private placementHelpContainer: HTMLDivElement | null = null;

    private tutorialButton: HTMLButtonElement | null = null; // Add this line

    // Ajout : prix dynamiques des tourelles
    private turretPrices: { [key: string]: number } = {
        garden_turret: 5,
        snow_turret: 10,
        mushroom_tree: 15,
    };

    // Ajout : compteur d'achats par tourelle
    private turretPurchaseCount: { [key: string]: number } = {
        garden_turret: 0,
        snow_turret: 0,
        mushroom_tree: 0,
    };

    // Ajout : incrément dynamique d'augmentation de prix par tourelle
    private turretPriceIncrement: { [key: string]: number } = {
        garden_turret: 2,
        snow_turret: 2,
        mushroom_tree: 2,
    };

    constructor(scene: BABYLON.Scene, canvas: HTMLCanvasElement, game: Game) {
        this.scene = scene;
        this.canvas = canvas;
        this.game = game;
        this.objectManager = new ObjectManager(scene);

        this.createUI();
        this.createTutorialButton(); // Add this line
        this.setupMouseEvents();
    }

    private createUI(): void {
        // Create a container for the UI
        const uiContainer = document.createElement("div");
        uiContainer.id = "uiContainer";
        uiContainer.style.position = "absolute";
        uiContainer.style.bottom = "12%";
        uiContainer.style.left = "50%";
        uiContainer.style.transform = "translateX(-50%) scale(0.75)"; // scale -25%
        uiContainer.style.transformOrigin = "bottom center"; // pour bien réduire depuis le bas
        uiContainer.style.display = "flex";
        uiContainer.style.gap = "24px"; // More space between turrets
        uiContainer.style.padding = "16px 24px";
        uiContainer.style.background = "rgba(30, 32, 40, 0.97)";
        uiContainer.style.borderRadius = "22px";
        uiContainer.style.boxShadow = "0 8px 32px #00bfff33, 0 2px 8px #0008";
        uiContainer.style.backdropFilter = "blur(2px)";
        uiContainer.style.alignItems = "center";
        uiContainer.style.zIndex = "1200";
        document.body.appendChild(uiContainer);

        // GardenTreeTurret (Tourelle 1) - toujours débloquée
        this.createPlaceholder(
            uiContainer,
            "garden_turret",
            ASSET_BASE_URL + "Turret1Image.png",
            "Sylve Gardienne",
            `
            <div style="text-align: left;">
                <strong style="font-size: 14px; color: #4CAF50;">Sylve Gardienne</strong><br>
                <span style="font-size: 12px;">Portée : <strong>15</strong></span><br>
                <span style="font-size: 12px;">Vitesse du projectile : <strong>40</strong></span><br>
                <span style="font-size: 12px;">Délai d'attaque : <strong>2s</strong></span><br>
                <span style="font-size: 12px; color: #FFD700;">Prix : <strong>5 Éclats de Rêves</strong></span><br>
                <span style="font-size: 12px; color: #4CAF50;">Rôle : Inflige des dégâts directs aux ennemis.</span><br>
                <span style="font-size: 11px; color: #bbb;">Astuce : Placez-la près des virages pour maximiser les tirs.</span>
            </div>
            `
        );

        // SnowTreeTurret (Tourelle 2) - bloqué au début
        this.createPlaceholder(
            uiContainer,
            "snow_turret",
            ASSET_BASE_URL + "Turret2Image.png",
            "Cristal de Givre",
            `
            <div style="text-align: left;">
                <strong style="font-size: 14px; color: #2196F3;">Cristal de Givre</strong><br>
                <span style="font-size: 12px;">Portée : <strong>25</strong></span><br>
                <span style="font-size: 12px;">Vitesse du projectile : <strong>35</strong></span><br>
                <span style="font-size: 12px;">Délai d'attaque : <strong>3s</strong></span><br>
                <span style="font-size: 12px; color: #FFD700;">Prix : <strong>10 Éclats de Rêves</strong></span><br>
                <span style="font-size: 12px; color: #2196F3;">Rôle : Ralentit les ennemis touchés.</span><br>
                <span style="font-size: 11px; color: #bbb;">Astuce : Combinez-la avec d'autres tourelles pour plus d'efficacité.</span>
            </div>
            `,
            !this.turretUnlockState.snow_turret // locked
        );

        // MushroomTreeTurret (Tourelle 3) - bloqué au début
        this.createPlaceholder(
            uiContainer,
            "mushroom_tree",
            ASSET_BASE_URL + "MushroomTreeImage.png",
            "Champi Explosif",
            `
            <div style="text-align: left;">
                <strong style="font-size: 14px; color: #8D5C2B;">Champi Explosif</strong><br>
                <span style="font-size: 12px;">Portée : <strong>25</strong></span><br>
                <span style="font-size: 12px;">Vitesse du projectile : <strong>40</strong></span><br>
                <span style="font-size: 12px;">Délai d'attaque : <strong>4s</strong></span><br>
                <span style="font-size: 12px; color: #FFD700;">Prix : <strong>15 Éclats de Rêves</strong></span><br>
                <span style="font-size: 12px; color: #8D5C2B;">Rôle : Explose et inflige des dégâts de zone aux ennemis proches.</span><br>
                <span style="font-size: 11px; color: #bbb;">Astuce : Placez-la là où les ennemis sont regroupés.</span>
            </div>
            `,
            !this.turretUnlockState.mushroom_tree // locked
        );


        // Ajout d'un style global pour les animations UI
        const style = document.createElement("style");
        style.innerHTML = `
        .ui-counter {
            transition: box-shadow 0.3s, background 0.3s, transform 0.2s;
            box-shadow: 0 4px 16px #0006;
            background: linear-gradient(90deg, #232526 0%, #414345 100%);
            border-radius: 8px;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-weight: bold;
            letter-spacing: 1px;
        }
        .ui-counter:hover {
            background: linear-gradient(90deg, #00ffd0 0%, #00bfff 100%);
            color: #232526;
            transform: scale(1.05);
        }
        .ui-pulse {
            animation: uiPulse 0.5s;
        }
        @keyframes uiPulse {
            0% { transform: scale(1); box-shadow: 0 0 0 #00ffd0; }
            50% { transform: scale(1.12); box-shadow: 0 0 16px #00ffd0; }
            100% { transform: scale(1); box-shadow: 0 0 0 #00ffd0; }
        }
        `;
        document.head.appendChild(style);

        // Add coin display container
        const coinContainer = document.createElement("div");
        coinContainer.style.position = "absolute";
        coinContainer.style.top = "12%";
        coinContainer.style.left = "10px";
        coinContainer.style.transform = "scale(0.75)"; // scale -25%
        coinContainer.style.transformOrigin = "top left";
        coinContainer.style.display = "flex";
        coinContainer.style.alignItems = "center";
        coinContainer.style.padding = "10px";
        coinContainer.style.fontSize = "16px";
        coinContainer.style.color = "white";
        coinContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        coinContainer.style.borderRadius = "5px";
        coinContainer.style.zIndex = "1001";
        coinContainer.style.marginBottom = "15px"; // Add spacing from the health display
        coinContainer.classList.add("ui-counter");

        // Add coin image
        const coinImage = document.createElement("img");
        coinImage.src = ASSET_BASE_URL + "UI_Diamond.PNG"; // Path to the coin image
        coinImage.alt = "Éclats de Rêves";
        coinImage.style.width = "20px";
        coinImage.style.height = "20px";
        coinImage.style.marginRight = "8px";
        coinContainer.appendChild(coinImage);

        // Add coin text
        this.coinDisplay = document.createElement("div");
        this.coinDisplay.innerText = `Éclats de Rêves: ${this.game.getCoins()}`;
        coinContainer.appendChild(this.coinDisplay);

        document.body.appendChild(coinContainer);

        // Add health display container
        const healthContainer = document.createElement("div");
        healthContainer.style.position = "absolute";
        healthContainer.style.top = "calc(12% + 50px * 0.75)"; // ajusté pour scale
        healthContainer.style.left = "10px";
        healthContainer.style.transform = "scale(0.75)";
        healthContainer.style.transformOrigin = "top left";
        healthContainer.style.display = "flex";
        healthContainer.style.alignItems = "center";
        healthContainer.style.padding = "10px";
        healthContainer.style.fontSize = "16px";
        healthContainer.style.color = "white";
        healthContainer.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
        healthContainer.style.borderRadius = "5px";
        healthContainer.style.zIndex = "1001";
        healthContainer.classList.add("ui-counter");

        // Add heart image
        const heartImage = document.createElement("img");
        heartImage.src = ASSET_BASE_URL + "UI_Heart.png"; // Path to the heart image
        heartImage.alt = "Heart";
        heartImage.style.width = "20px";
        heartImage.style.height = "20px";
        heartImage.style.marginRight = "8px"; // Add spacing between the image and text
        healthContainer.appendChild(heartImage);

        // Add health text
        this.healthDisplay = document.createElement("div");
        this.healthDisplay.innerText = `Santé: ${Game.health}`; // Initial health
        healthContainer.appendChild(this.healthDisplay);

        document.body.appendChild(healthContainer);

        // Ajout : affichage du nombre d'ennemis dans la vague courante
        const enemyCountContainer = document.createElement("div");
        enemyCountContainer.style.position = "absolute";
        enemyCountContainer.style.top = "calc(12% + 100px * 0.75)"; // ajusté pour scale
        enemyCountContainer.style.left = "10px";
        enemyCountContainer.style.transform = "scale(0.75)";
        enemyCountContainer.style.transformOrigin = "top left";
        enemyCountContainer.style.display = "flex";
        enemyCountContainer.style.alignItems = "center";
        enemyCountContainer.style.padding = "10px";
        enemyCountContainer.style.fontSize = "16px";
        enemyCountContainer.style.color = "white";
        enemyCountContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        enemyCountContainer.style.borderRadius = "5px";
        enemyCountContainer.style.zIndex = "1001";
        enemyCountContainer.classList.add("ui-counter");
        // Ajout icône ennemi (optionnel)
        const enemyIcon = document.createElement("img");
        enemyIcon.src = ASSET_BASE_URL + "enemy_icon.png"; // Remplace par le chemin de ton icône
        enemyIcon.alt = "Nombre d'ennemis dans la vague";
        enemyIcon.style.width = "20px";
        enemyIcon.style.height = "20px";
        enemyIcon.style.marginRight = "8px";
        enemyCountContainer.appendChild(enemyIcon);

        this.enemyCountDisplay = document.createElement("div");
        // Affiche la valeur réelle de la vague courante si possible
        try {
            // Dynamique si WaveManager déjà instancié
            const waveManager = (window as any).waveManagerInstance || undefined;
            let count = 0;
            if (waveManager && waveManager.waveConfigurations && waveManager.currentWave) {
                const config = waveManager.waveConfigurations[waveManager.currentWave];
                count = config ? config.length : 0;
            }
            this.enemyCountDisplay.innerText = `Ennemis: ${count}`;
        } catch {
            this.enemyCountDisplay.innerText = `Ennemis: 0`;
        }
        enemyCountContainer.appendChild(this.enemyCountDisplay);

        document.body.appendChild(enemyCountContainer);

        // Add mouse trail effect
        this.addMouseTrailEffect();


            this.canvas.addEventListener("enemyReachedEnd", this.enemyReachedEnd.bind(this));

            
    }

    private enemyReachedEnd(event: Event): void {
   this.decreaseHealth(1);
}
private addMouseTrailEffect(): void {
    const trailMeshes: BABYLON.Mesh[] = [];
    const trailMaterial = new BABYLON.StandardMaterial("trailMaterial", this.scene);
    trailMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0); // Bright red color for visibility
    trailMaterial.alpha = 0.8; // Slight transparency for better effect

    const createTrailMesh = (position: BABYLON.Vector3) => {
        const trailMesh = BABYLON.MeshBuilder.CreateSphere("trail", { diameter: 0.5 }, this.scene); // Increased size for visibility
        trailMesh.material = trailMaterial;
        trailMesh.position = position.clone();
        trailMesh.isPickable = false;
        trailMesh.renderingGroupId = 2; // Ensure it renders above other elements
        trailMeshes.push(trailMesh);

        // Fade out and dispose of the trail mesh over time
        setTimeout(() => {
            trailMesh.dispose();
            const index = trailMeshes.indexOf(trailMesh);
            if (index > -1) {
                trailMeshes.splice(index, 1);
            }
        }, 500); // Adjust the duration as needed
    };

    this.scene.onPointerMove = (evt, pickResult) => {
        if (pickResult?.hit && pickResult.pickedPoint) {
            createTrailMesh(pickResult.pickedPoint);
        }
    };

    // Add the trail effect to the render loop
    this.scene.onBeforeRenderObservable.add(() => {
        // Ensure the trail effect is updated in real-time
        if (trailMeshes.length > 0) {
            trailMeshes.forEach((mesh) => {
                mesh.visibility -= 0.02; // Gradually fade out the trail
                if (mesh.visibility <= 0) {
                    mesh.dispose();
                }
            });
        }
    });
}
    public updateCoinDisplay(): void {
        if (this.coinDisplay) {
            this.coinDisplay.innerText = `Éclats de Rêves: ${this.game.getCoins()}`;
            // Animation pulse à chaque update
            this.coinDisplay.classList.remove("ui-pulse");
            void this.coinDisplay.offsetWidth;
            this.coinDisplay.classList.add("ui-pulse");
        }
    }

    // Ajout : animation de gain/perte de pièces
    public showCoinGainAnimation(amount: number): void {
        if (!this.coinDisplay) return;
        const anim = document.createElement("div");
        anim.innerText = (amount > 0 ? "+" : "") + amount;
        anim.style.position = "absolute";
        // Centrer sur la jauge de pièces
        const rect = this.coinDisplay.getBoundingClientRect();
        anim.style.left = (rect.left + rect.width / 2 - 30) + "px";
        anim.style.top = (rect.top - 10) + "px";
        anim.style.color = amount > 0 ? "gold" : "red";
        anim.style.fontWeight = "bold";
        anim.style.fontSize = "38px";
        anim.style.pointerEvents = "none";
        anim.style.zIndex = "2000";
        anim.style.transition = "transform 1.2s cubic-bezier(.17,.67,.83,.67), opacity 1.2s cubic-bezier(.17,.67,.83,.67)";
        anim.style.transform = "scale(1.5) translateY(0px)";
        anim.style.opacity = "1";
        anim.style.textShadow = amount > 0
            ? "0 0 12px #FFD700, 0 0 24px #FFD700"
            : "0 0 12px #ff0000, 0 0 24px #ff0000";
        document.body.appendChild(anim);

        setTimeout(() => {
            anim.style.transform = amount > 0
                ? "scale(1) translateY(-70px)"
                : "scale(1) translateY(-70px)";
            anim.style.opacity = "0";
        }, 10);

        setTimeout(() => {
            document.body.removeChild(anim);
        }, 1300);
    }

    // Animation pour la perte de vie (rouge, sur la jauge de vie)
    public showHealthLossAnimation(amount: number): void {
        if (!this.healthDisplay) return;
        const anim = document.createElement("div");
        anim.innerText = `-${amount}`;
        anim.style.position = "absolute";
        // Centrer sur la jauge de vie
        const rect = this.healthDisplay.getBoundingClientRect();
        anim.style.left = (rect.left + rect.width / 2 - 30) + "px";
        anim.style.top = (rect.top - 10) + "px";
        anim.style.color = "red";
        anim.style.fontWeight = "bold";
        anim.style.fontSize = "38px";
        anim.style.pointerEvents = "none";
        anim.style.zIndex = "2000";
        anim.style.transition = "transform 1.2s cubic-bezier(.17,.67,.83,.67), opacity 1.2s cubic-bezier(.17,.67,.83,.67)";
        anim.style.transform = "scale(1.5) translateY(0px)";
        anim.style.opacity = "1";
        anim.style.textShadow = "0 0 12px #ff0000, 0 0 24px #ff0000";
        document.body.appendChild(anim);

        setTimeout(() => {
            anim.style.transform = "scale(1) translateY(-70px)";
            anim.style.opacity = "0";
        }, 10);

        setTimeout(() => {
            document.body.removeChild(anim);
        }, 1300);
    }

    public updateHealthDisplay(): void {
        if (this.healthDisplay) {
            this.healthDisplay.innerText = `Santé: ${Game.health}`;
            // Animation pulse à chaque update
            this.healthDisplay.classList.remove("ui-pulse");
            void this.healthDisplay.offsetWidth;
            this.healthDisplay.classList.add("ui-pulse");
        }
        if (Game.health <= 0) {
            this.showGameOverMenu();
        }
      
    }

    public decreaseHealth(amount: number): void {
        Game.health = Game.health  - amount; // Assuming 'health' is a static property of the Game class
        this.updateHealthDisplay();
        this.showHealthLossAnimation(amount*2); // Ajout animation perte de vie
    }

    private showGameOverMenu(): void {
        // Hide all other UI elements and block interaction
        document.body.querySelectorAll("div,button").forEach(el => {
            if (!(el as HTMLElement).classList.contains("gameover-victory-exclusive")) {
                (el as HTMLElement).style.display = "none";
            }
        });

        // Create game over container
        const gameOverContainer = document.createElement("div");
        gameOverContainer.classList.add("gameover-victory-exclusive");
        gameOverContainer.style.position = "fixed";
        gameOverContainer.style.top = "0";
        gameOverContainer.style.left = "0";
        gameOverContainer.style.width = "100vw";
        gameOverContainer.style.height = "100vh";
        gameOverContainer.style.display = "flex";
        gameOverContainer.style.flexDirection = "column";
        gameOverContainer.style.justifyContent = "center";
        gameOverContainer.style.alignItems = "center";
        gameOverContainer.style.background = "radial-gradient(ellipse at center, #1a1a2e 0%, #232526 100%)";
        gameOverContainer.style.zIndex = "99999";
        gameOverContainer.style.pointerEvents = "auto";
        gameOverContainer.style.backdropFilter = "blur(2.5px)";
        document.body.appendChild(gameOverContainer);

        // Add "Game Over" text with style
        const gameOverText = document.createElement("div");
        gameOverText.innerText = "L'Arbre Cristal s'est éteint...";
        gameOverText.style.color = "#ff3b3b";
        gameOverText.style.fontSize = "72px";
        gameOverText.style.fontWeight = "bold";
        gameOverText.style.letterSpacing = "2px";
        gameOverText.style.textShadow = "0 0 32px #ff3b3b, 0 0 64px #000";
        gameOverText.style.marginBottom = "32px";
        gameOverText.style.fontFamily = "'Segoe UI', Arial, sans-serif";
        gameOverContainer.appendChild(gameOverText);

        // Add lore-inspired phrase
        const lorePhrase = document.createElement("div");
        lorePhrase.innerText = "Les ténèbres ont englouti le dernier espoir du royaume. Mais chaque fin porte en elle la promesse d’un nouveau départ...";
        lorePhrase.style.color = "#fff";
        lorePhrase.style.fontSize = "2rem";
        lorePhrase.style.textAlign = "center";
        lorePhrase.style.maxWidth = "700px";
        lorePhrase.style.marginBottom = "48px";
        lorePhrase.style.textShadow = "0 0 16px #000";
        gameOverContainer.appendChild(lorePhrase);

        // Add animated crystal image (optional, if asset exists)
        const crystalImg = document.createElement("img");
        crystalImg.src = ASSET_BASE_URL + "UI_Heart.png";
        crystalImg.alt = "Cristal brisé";
        crystalImg.style.width = "110px";
        crystalImg.style.marginBottom = "32px";
        crystalImg.style.filter = "drop-shadow(0 0 32px #ff3b3b88)";
        crystalImg.style.animation = "crystalPulse 2s infinite alternate";
        gameOverContainer.appendChild(crystalImg);

        // Add button to return to main menu
        const mainMenuButton = document.createElement("button");
        mainMenuButton.innerText = "Recommencer l'aventure";
        mainMenuButton.style.padding = "18px 48px";
        mainMenuButton.style.fontSize = "2rem";
        mainMenuButton.style.color = "#fff";
        mainMenuButton.style.background = "linear-gradient(90deg,#ff3b3b,#232526 80%)";
        mainMenuButton.style.border = "none";
        mainMenuButton.style.borderRadius = "14px";
        mainMenuButton.style.cursor = "pointer";
        mainMenuButton.style.marginTop = "16px";
        mainMenuButton.style.fontWeight = "bold";
        mainMenuButton.style.boxShadow = "0 4px 32px #ff3b3b55";
        mainMenuButton.onmouseenter = () => {
            mainMenuButton.style.background = "linear-gradient(90deg,#ff7b7b,#232526 80%)";
            mainMenuButton.style.transform = "scale(1.04)";
        };
        mainMenuButton.onmouseleave = () => {
            mainMenuButton.style.background = "linear-gradient(90deg,#ff3b3b,#232526 80%)";
            mainMenuButton.style.transform = "scale(1)";
        };
        gameOverContainer.appendChild(mainMenuButton);

        mainMenuButton.onclick = () => {
            window.location.reload();
        };

        // Add CSS animation for crystal pulse
        const style = document.createElement("style");
        style.innerHTML = `
        @keyframes crystalPulse {
            0% { filter: drop-shadow(0 0 32px #ff3b3b88) brightness(1); }
            100% { filter: drop-shadow(0 0 64px #ff3b3b) brightness(1.2); }
        }
        `;
        document.head.appendChild(style);
    }

    public showVictoryMenu(): void {
        // Hide all other UI elements and block interaction
        document.body.querySelectorAll("div,button").forEach(el => {
            if (!(el as HTMLElement).classList.contains("gameover-victory-exclusive")) {
                (el as HTMLElement).style.display = "none";
            }
        });

        // Create victory container
        const victoryContainer = document.createElement("div");
        victoryContainer.classList.add("gameover-victory-exclusive");
        victoryContainer.style.position = "fixed";
        victoryContainer.style.top = "0";
        victoryContainer.style.left = "0";
        victoryContainer.style.width = "100vw";
        victoryContainer.style.height = "100vh";
        victoryContainer.style.display = "flex";
        victoryContainer.style.flexDirection = "column";
        victoryContainer.style.justifyContent = "center";
        victoryContainer.style.alignItems = "center";
        victoryContainer.style.background = "radial-gradient(ellipse at center, #00ffd0 0%, #232526 100%)";
        victoryContainer.style.zIndex = "99999";
        victoryContainer.style.pointerEvents = "auto";
        victoryContainer.style.backdropFilter = "blur(2.5px)";
        document.body.appendChild(victoryContainer);

        // Add "Victory" text with style
        const victoryText = document.createElement("div");
        victoryText.innerText = "L'Arbre Cristal rayonne à nouveau !";
        victoryText.style.color = "#FFD700";
        victoryText.style.fontSize = "72px";
        victoryText.style.fontWeight = "bold";
        victoryText.style.letterSpacing = "2px";
        victoryText.style.textShadow = "0 0 32px #FFD700, 0 0 64px #00ffd0";
        victoryText.style.marginBottom = "32px";
        victoryText.style.fontFamily = "'Segoe UI', Arial, sans-serif";
        victoryContainer.appendChild(victoryText);

        // Add lore-inspired phrase
        const lorePhrase = document.createElement("div");
        lorePhrase.innerText = "Grâce à votre bravoure, la lumière des rêves a triomphé des ténèbres. Le royaume est sauvé, et l’espoir fleurit à nouveau sous les branches du Cristal.";
        lorePhrase.style.color = "#fff";
        lorePhrase.style.fontSize = "2rem";
        lorePhrase.style.textAlign = "center";
        lorePhrase.style.maxWidth = "700px";
        lorePhrase.style.marginBottom = "48px";
        lorePhrase.style.textShadow = "0 0 16px #00ffd0";
        victoryContainer.appendChild(lorePhrase);

        // Add animated crystal image (optional, if asset exists)
        const crystalImg = document.createElement("img");
        crystalImg.src = ASSET_BASE_URL + "UI_Diamond.PNG";
        crystalImg.alt = "Cristal victorieux";
        crystalImg.style.width = "110px";
        crystalImg.style.marginBottom = "32px";
        crystalImg.style.filter = "drop-shadow(0 0 32px #FFD70088)";
        crystalImg.style.animation = "crystalVictoryPulse 2s infinite alternate";
        victoryContainer.appendChild(crystalImg);

        // Add button to return to main menu
        const mainMenuButton = document.createElement("button");
        mainMenuButton.innerText = "Rejouer";
        mainMenuButton.style.padding = "18px 48px";
        mainMenuButton.style.fontSize = "2rem";
        mainMenuButton.style.color = "#232526";
        mainMenuButton.style.background = "linear-gradient(90deg,#FFD700,#00FFD0 80%)";
        mainMenuButton.style.border = "none";
        mainMenuButton.style.borderRadius = "14px";
        mainMenuButton.style.cursor = "pointer";
        mainMenuButton.style.marginTop = "16px";
        mainMenuButton.style.fontWeight = "bold";
        mainMenuButton.style.boxShadow = "0 4px 32px #FFD70055";
        mainMenuButton.onmouseenter = () => {
            mainMenuButton.style.background = "linear-gradient(90deg,#fff700,#00FFD0 80%)";
            mainMenuButton.style.transform = "scale(1.04)";
        };
        mainMenuButton.onmouseleave = () => {
            mainMenuButton.style.background = "linear-gradient(90deg,#FFD700,#00FFD0 80%)";
            mainMenuButton.style.transform = "scale(1)";
        };
        victoryContainer.appendChild(mainMenuButton);

        mainMenuButton.onclick = () => {
            window.location.reload();
        };

        // Add CSS animation for crystal pulse
        const style = document.createElement("style");
        style.innerHTML = `
        @keyframes crystalVictoryPulse {
            0% { filter: drop-shadow(0 0 32px #FFD70088) brightness(1); }
            100% { filter: drop-shadow(0 0 64px #FFD700) brightness(1.2); }
        }
        `;
        document.head.appendChild(style);
    }

    // --- UI Turret Bar Show/Hide ---
    private showTurretBar() {
        const bar = document.getElementById("uiContainer");
        if (bar) bar.style.display = "flex";
    }
    private hideTurretBar() {
        const bar = document.getElementById("uiContainer");
        if (bar) bar.style.display = "none";
    }

    // --- Improved createPlaceholder ---
    private createPlaceholder(
        container: HTMLElement,
        objectType: string,
        imagePath: string,
        altText: string,
        tooltipContent: string,
        locked: boolean = false
    ): void {
        // Card style for turret
        const placeholderContainer = document.createElement("div");
        placeholderContainer.style.position = "relative";
        placeholderContainer.style.width = "92px";
        placeholderContainer.style.height = "120px";
        placeholderContainer.style.borderRadius = "18px";
        placeholderContainer.style.background = locked
            ? "linear-gradient(135deg, #bdbdbd 60%, #888 100%)"
            : "linear-gradient(135deg, #232526 60%, #00bfff 100%)";
        placeholderContainer.style.boxShadow = locked
            ? "0 2px 8px #8888"
            : "0 6px 24px #00bfff55, 0 2px 8px #0008";
        placeholderContainer.style.cursor = locked ? "not-allowed" : "pointer";
        placeholderContainer.style.transition = "transform 0.18s, box-shadow 0.18s";
        placeholderContainer.style.display = "flex";
        placeholderContainer.style.flexDirection = "column";
        placeholderContainer.style.alignItems = "center";
        placeholderContainer.style.justifyContent = "flex-start";
        placeholderContainer.style.padding = "8px 4px 4px 4px";
        placeholderContainer.onmouseover = () => {
            if (!locked) {
                placeholderContainer.style.transform = "scale(1.08)";
                placeholderContainer.style.boxShadow = "0 8px 32px #00bfff99, 0 2px 8px #0008";
            }
            tooltip.style.display = "block";
        };
        placeholderContainer.onmouseout = () => {
            placeholderContainer.style.transform = "scale(1)";
            placeholderContainer.style.boxShadow = locked
                ? "0 2px 8px #8888"
                : "0 6px 24px #00bfff55, 0 2px 8px #0008";
            tooltip.style.display = "none";
        };
        placeholderContainer.onclick = () => {
            if (this.turretUnlockState[objectType]) {
                // Correction : utiliser le prix dynamique
                const turretCost = this.turretPrices[objectType] ?? 0;
                if (
                    (objectType === "garden_turret" || objectType === "snow_turret" || objectType === "mushroom_tree") &&
                    this.game.getCoins() < turretCost
                ) {
                    // Pas assez de pièces, ne pas masquer la barre
                    this.showTemporaryText("Pas assez de pièces!", 2000);
                    return;
                }
                this.hideTurretBar(); // Hide bar on select
                this.startPlacingObject(objectType);
            }
        };
        if (locked) {
            placeholderContainer.style.filter = "grayscale(1) brightness(0.7)";
            placeholderContainer.style.opacity = "0.6";
            // Lock icon
            const lockIcon = document.createElement("div");
            lockIcon.innerHTML = "🔒";
            lockIcon.style.position = "absolute";
            lockIcon.style.top = "8px";
            lockIcon.style.right = "8px";
            lockIcon.style.fontSize = "22px";
            lockIcon.style.background = "rgba(0,0,0,0.5)";
            lockIcon.style.borderRadius = "50%";
            lockIcon.style.padding = "2px 6px";
            placeholderContainer.appendChild(lockIcon);
        } else {
            placeholderContainer.style.filter = "";
            placeholderContainer.style.opacity = "";
        }
        container.appendChild(placeholderContainer);

        // Turret image with border
        const placeholderImage = document.createElement("img");
        placeholderImage.src = imagePath;
        placeholderImage.alt = altText;
        placeholderImage.style.width = "64px";
        placeholderImage.style.height = "64px";
        placeholderImage.style.borderRadius = "12px";
        placeholderImage.style.objectFit = "cover";
        placeholderImage.style.border = locked
            ? "2.5px solid #bbb"
            : "2.5px solid #00ffd0";
        placeholderImage.style.marginBottom = "6px";
        placeholderContainer.appendChild(placeholderImage);

        // Turret name
        const nameDiv = document.createElement("div");
        nameDiv.innerText = altText;
        nameDiv.style.fontWeight = "bold";
        nameDiv.style.fontSize = "15px";
        nameDiv.style.color = locked ? "#888" : "#fff";
        nameDiv.style.textShadow = locked ? "" : "0 2px 8px #00bfff88";
        nameDiv.style.marginBottom = "2px";
        nameDiv.style.textAlign = "center";
        nameDiv.style.letterSpacing = "0.5px";
        placeholderContainer.appendChild(nameDiv);

        // Price badge (toujours affiché, même si locked)
        const priceBadge = document.createElement("div");
        // --- MODIF: prix dynamique ---
        priceBadge.innerHTML =
            `<span style="color:#FFD700;font-weight:bold;" class="turret-price" data-type="${objectType}">${this.turretPrices[objectType]}</span> <img src="${ASSET_BASE_URL}UI_Diamond.PNG" style="width:16px;vertical-align:middle;">`;
        priceBadge.style.background = locked ? "#bbb" : "#232526";
        priceBadge.style.color = "#FFD700";
        priceBadge.style.fontWeight = "bold";
        priceBadge.style.fontSize = "14px";
        priceBadge.style.padding = "2px 10px";
        priceBadge.style.borderRadius = "8px";
        priceBadge.style.margin = "2px auto 0 auto";
        priceBadge.style.display = "inline-block";
        priceBadge.style.boxShadow = locked ? "" : "0 2px 8px #00ffd055";
        priceBadge.style.textAlign = "center";
        placeholderContainer.appendChild(priceBadge);

        // Tooltip (toujours présent)
        const tooltip = document.createElement("div");
        tooltip.style.position = "absolute";
        tooltip.style.bottom = "110%";
        tooltip.style.left = "50%";
        tooltip.style.transform = "translateX(-50%)";
        tooltip.style.padding = "12px";
        tooltip.style.width = "180px";
        tooltip.style.background = "linear-gradient(90deg,#232526,#00bfff)";
        tooltip.style.color = "#fff";
        tooltip.style.borderRadius = "10px";
        tooltip.style.boxShadow = "0 4px 16px #00bfff55";
        tooltip.style.display = "none";
        tooltip.style.textAlign = "left";
        tooltip.style.fontSize = "13px";
        tooltip.style.lineHeight = "1.5";
        tooltip.innerHTML = tooltipContent;
        tooltip.style.zIndex = "2000";
        placeholderContainer.appendChild(tooltip);

        this.turretPlaceholders[objectType] = placeholderContainer;
    }

    // --- Ajout : méthode pour mettre à jour le prix affiché d'une tourelle ---
    private updateTurretPriceDisplay(objectType: string) {
        const placeholder = this.turretPlaceholders[objectType];
        if (!placeholder) return;
        const priceSpan = placeholder.querySelector('.turret-price[data-type="' + objectType + '"]');
        if (priceSpan) priceSpan.textContent = this.turretPrices[objectType].toString();
    }

    // Méthode pour débloquer une tourelle et prévenir le joueur
    public unlockTurret(objectType: "snow_turret" | "mushroom_tree") {
        if (!this.turretUnlockState[objectType]) {
            this.turretUnlockState[objectType] = true;
            const placeholder = this.turretPlaceholders[objectType];
            if (placeholder) {
                // Style comme la tourelle débloquée
                placeholder.style.filter = "";
                placeholder.style.opacity = "";
                placeholder.style.background = "linear-gradient(135deg, #232526 60%, #00bfff 100%)";
                placeholder.style.boxShadow = "0 6px 24px #00bfff55, 0 2px 8px #0008";
                placeholder.style.cursor = "pointer";
                placeholder.style.pointerEvents = "auto";
                // Retire le cadenas si présent (plus robuste)
                Array.from(placeholder.children).forEach(child => {
                    if (
                        child instanceof HTMLElement &&
                        child.tagName === "DIV" &&
                        child.innerHTML.trim() === "🔒"
                    ) {
                        child.remove();
                    }
                });
                // Met à jour le nom et la couleur du texte
                const nameDiv = placeholder.querySelector("div");
                if (nameDiv) {
                    nameDiv.style.color = "#fff";
                    nameDiv.style.textShadow = "0 2px 8px #00bfff88";
                }
                // Met à jour la bordure de l'image
                const img = placeholder.querySelector("img");
                if (img) {
                    (img as HTMLElement).style.border = "2.5px solid #00ffd0";
                }
        
                placeholder.classList.add("ui-pulse");
                setTimeout(() => placeholder.classList.remove("ui-pulse"), 800);
            }
            // Affiche une pop-up d'information
            this.showUnlockPopup(objectType);
        }
    }

    // Animation pop-up pour prévenir le joueur
    private showUnlockPopup(objectType: string) {
        const popup = document.createElement("div");
        popup.style.position = "fixed";
        popup.style.top = "50%";
        popup.style.left = "50%";
        popup.style.transform = "translate(-50%,-50%)";
        popup.style.background = "linear-gradient(90deg,#00ffd0,#00bfff)";
        popup.style.color = "#232526";
        popup.style.padding = "32px 48px";
        popup.style.fontSize = "2rem";
        popup.style.fontWeight = "bold";
        popup.style.borderRadius = "18px";
        popup.style.boxShadow = "0 8px 32px #00bfff88";
        popup.style.zIndex = "3000";
        popup.style.textAlign = "center";
        popup.style.animation = "uiPulse 0.7s";
        popup.style.display = "flex";
        popup.style.flexDirection = "column";
        popup.style.alignItems = "center";
        popup.innerText = ""; // On va ajouter le texte et le bouton séparément

        // Texte principal
        const text = document.createElement("div");
        text.innerText =
            objectType === "snow_turret"
                ? "Nouvelle tourelle débloquée !\nCristal de Givre disponible."
                : "Nouvelle tourelle débloquée !\nChampi Explosif disponible.";
        text.style.whiteSpace = "pre-line";
        popup.appendChild(text);

        // Bouton fermer
        const closeBtn = document.createElement("button");
        closeBtn.innerText = "Fermer";
        closeBtn.style.marginTop = "32px";
        closeBtn.style.padding = "12px 32px";
        closeBtn.style.fontSize = "1.2rem";
        closeBtn.style.background = "#232526";
        closeBtn.style.color = "#fff";
        closeBtn.style.border = "none";
        closeBtn.style.borderRadius = "8px";
        closeBtn.style.cursor = "pointer";
        popup.appendChild(closeBtn);

        closeBtn.onclick = () => {
            popup.style.transition = "opacity 0.5s";
            popup.style.opacity = "0";
            setTimeout(() => popup.remove(), 500);
        };

        document.body.appendChild(popup);
    }

    private startPlacingObject(objectType: string): void {
        const objectConfig = this.objectManager.getObjectConfig(objectType);
        if (!objectConfig) return;

        // --- MODIF: utiliser le prix dynamique ---
        let turretCost = this.turretPrices[objectType] ?? 0;
        let modelName = "";
        let previewScale = new BABYLON.Vector3(2, 2, 2);

        if (objectType === "garden_turret") {
            modelName = "garden_tree_2";
        } else if (objectType === "snow_turret") {
            modelName = "snow_tree";
        } else if (objectType === "mushroom_tree") {
            modelName = "mushroom_tree";
            previewScale = new BABYLON.Vector3(2, 2, 2);
        }

        if (objectType === "garden_turret" || objectType === "snow_turret" || objectType === "mushroom_tree") {
            if (this.game.getCoins() < turretCost) {
                this.showTemporaryText("Pas assez de pièces!", 2000);
                return;
            }
        }

        this.isPlacingObject = true;
        this.hideTurretBar(); // Hide bar when starting placement
        this.showPlacementHelp();

        if (objectType === "garden_turret" || objectType === "snow_turret" || objectType === "mushroom_tree") {
            ModelLoader.loadModel(this.scene, modelName, (result) => {
                this.previewMesh = result.meshes[0] as BABYLON.Mesh;
                this.previewMesh.name = `preview_${objectType}`;
                this.previewMesh.scaling = previewScale;

                // Configure material for transparency
                const previewMaterial = new BABYLON.StandardMaterial("previewMat", this.scene);
                previewMaterial.alpha = 0.3;
                previewMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
                this.previewMesh.material = previewMaterial;

                this.previewMesh.isPickable = false;
                let rangeDiameter = 0;
                // Create a range indicator for the turret
                if(objectType === "garden_turret"){
                    rangeDiameter = 15;
                } else if(objectType === "snow_turret"){
                 rangeDiameter = 25;
                }
                else if (objectType === "mushroom_tree") {
                    rangeDiameter = 25; // Zone d'effet plus petite pour le champignon
                }
                this.rangeIndicator = BABYLON.MeshBuilder.CreateSphere("rangeIndicator", { diameter: rangeDiameter*2, segments: 16 }, this.scene);
                this.rangeIndicator.material = new BABYLON.StandardMaterial("rangeMat", this.scene);
                (this.rangeIndicator.material as BABYLON.StandardMaterial).alpha = 0.2;
                (this.rangeIndicator.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(1, 1, 1);
                this.rangeIndicator.position = new BABYLON.Vector3(0, 0, 0);
                this.rangeIndicator.isPickable = false;

                const updateInterval = setInterval(() => {
                    if (this.isPlacingObject && this.previewMesh) {
                        const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
                        if (pickResult?.hit && pickResult.pickedMesh?.name === "Ground" && pickResult.pickedPoint) {
                            this.previewMesh.position = new BABYLON.Vector3(
                                pickResult.pickedPoint.x,
                                pickResult.pickedPoint.y + 1,
                                pickResult.pickedPoint.z
                            );

                            if (this.rangeIndicator) {
                                this.rangeIndicator.position = new BABYLON.Vector3(
                                    pickResult.pickedPoint.x,
                                    pickResult.pickedPoint.y + 1,
                                    pickResult.pickedPoint.z
                                );
                            }
                        }
                    } else {
                        clearInterval(updateInterval);
                    }
                }, 10);
            });
        } else {
            // Logic for other object types
        }
    }

    private setupMouseEvents(): void {
        this.scene.onPointerDown = (evt, pickResult) => {
            if (evt.button === 2) { // Right-click to cancel placement
                if (this.isPlacingObject && this.previewMesh) {
                    const objectType = this.previewMesh.name.replace("preview_", "");
                    // Pas de remboursement ici, mais logique possible à ajouter

                    // Dispose of the preview mesh and range indicator
                    this.previewMesh.dispose();
                    this.previewMesh = null;

                    if (this.rangeIndicator) {
                        this.rangeIndicator.dispose();
                        this.rangeIndicator = null;
                    }

                    this.isPlacingObject = false;
                    this.hidePlacementHelp();
                    this.showTurretBar(); // Show bar again
                    this.showTemporaryText("Placement annulé!", 2000);
                }
                return;
            }

            if (!pickResult.pickedMesh) {
                console.warn("L'événement de clic n'a touché aucun objet.");
                return;
            }

            const snappedPosition = pickResult.pickedPoint;
            snappedPosition.y = pickResult.pickedPoint.y;

            const isPositionFree = !this.scene.meshes.some(mesh => mesh !== this.previewMesh && mesh.position.equals(snappedPosition));
            const isGround = pickResult.pickedMesh.name === "Ground";

            if (isGround && isPositionFree && this.previewMesh) {
                const objectType = this.previewMesh.name.replace("preview_", "");
                let turretCost = this.turretPrices[objectType] ?? 0;
                if (objectType === "garden_turret" || objectType === "snow_turret" || objectType === "mushroom_tree") {
                    this.game.decreaseCoins(turretCost);

                    // --- AJOUT: gestion augmentation progressive du prix ---
                    this.turretPurchaseCount[objectType] = (this.turretPurchaseCount[objectType] ?? 0) + 1;

                    let shouldIncrease = false;
                    if (objectType === "garden_turret") {
                        // Pour Sylve, à partir du 2ème achat
                        if (this.turretPurchaseCount[objectType] >= 2) shouldIncrease = true;
                    } else {
                        // Pour les autres, dès le 1er achat
                        shouldIncrease = true;
                    }

                    if (shouldIncrease) {
                        this.turretPrices[objectType] += this.turretPriceIncrement[objectType];
                        this.updateTurretPriceDisplay(objectType);
                        this.turretPriceIncrement[objectType] += 1; // Incrément progressif
                    }
                }

                snappedPosition.y += 0;
                console.log(`Création d'un objet de type : ${objectType} à la position : ${snappedPosition}`);
                this.objectManager.createObject(objectType, snappedPosition);

                // Dispose of the preview mesh and range indicator, and reset placement state
                this.previewMesh.dispose();
                this.previewMesh = null;

                if (this.rangeIndicator) {
                    this.rangeIndicator.dispose();
                    this.rangeIndicator = null;
                }

                this.isPlacingObject = false;
                this.hidePlacementHelp();
                this.showTurretBar(); // Show bar again
            }
        };
    }

    public showTemporaryText(message: string, duration: number): void {
        const textContainer = document.createElement("div");
        textContainer.innerText = message;
        textContainer.style.position = "absolute";
        textContainer.style.top = "100px";
        textContainer.style.left = "50%";
        textContainer.style.transform = "translateX(-50%)";
        textContainer.style.padding = "10px 20px";
        textContainer.style.fontSize = "24px";
        textContainer.style.color = "white";
        textContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        textContainer.style.borderRadius = "5px";
        textContainer.style.zIndex = "1000";
        document.body.appendChild(textContainer);

        setTimeout(() => {
            document.body.removeChild(textContainer);
        }, duration);
    }

    public showCinematicBars(): void {
        // Create top bar
        this.topBar = document.createElement("div");
        this.topBar.style.position = "absolute";
        this.topBar.style.top = "0";
        this.topBar.style.left = "0";
        this.topBar.style.width = "100%";
        this.topBar.style.height = "10%";
        this.topBar.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        this.topBar.style.zIndex = "1000";
        this.topBar.style.transition = "transform 0.5s ease-in-out";
        this.topBar.style.transform = "translateY(-100%)"; // Initially hidden
        document.body.appendChild(this.topBar);

        // Create bottom bar
        this.bottomBar = document.createElement("div");
        this.bottomBar.style.position = "absolute";
        this.bottomBar.style.bottom = "0";
        this.bottomBar.style.left = "0";
        this.bottomBar.style.width = "100%";
        this.bottomBar.style.height = "10%";
        this.bottomBar.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        this.bottomBar.style.zIndex = "1000";
        this.bottomBar.style.transition = "transform 0.5s ease-in-out";
        this.bottomBar.style.transform = "translateY(100%)"; // Initially hidden
        document.body.appendChild(this.bottomBar);

        // Animate bars into view
        setTimeout(() => {
            this.topBar!.style.transform = "translateY(0)";
            this.bottomBar!.style.transform = "translateY(0)";
        }, 100);
    }

    public hideCinematicBars(): void {
        if (this.topBar && this.bottomBar) {
            // Animate bars out of view
            this.topBar.style.transform = "translateY(-100%)";
            this.bottomBar.style.transform = "translateY(100%)";

            // Remove bars after animation
            setTimeout(() => {
                this.topBar?.remove();
                this.bottomBar?.remove();
                this.topBar = null;
                this.bottomBar = null;
            }, 500);
        }
    }

    public addStartWaveButton(onStartWave: () => void): void {
        this.startWaveButton = document.createElement("button");
        this.startWaveButton.innerText = "Démarrer la vague";
        this.startWaveButton.style.position = "absolute";
        this.startWaveButton.style.top = "calc(12% + 150px)"; // Décalé plus bas pour voir le compteur
        this.startWaveButton.style.left = "10px";
        this.startWaveButton.style.display = "flex";
        this.startWaveButton.style.padding = "10px 20px";
        this.startWaveButton.style.fontSize = "16px";
        this.startWaveButton.style.color = "white";
        this.startWaveButton.style.backgroundColor = "green";
        this.startWaveButton.style.border = "none";
        this.startWaveButton.style.borderRadius = "5px";
        this.startWaveButton.style.cursor = "pointer";
        this.startWaveButton.style.zIndex = "1001"; // Above the cinematic bars
        this.startWaveButton.style.transform = "scale(0.75)";
        this.startWaveButton.style.transformOrigin = "top left";
        document.body.appendChild(this.startWaveButton);

        this.startWaveButton.onclick = () => {
            this.showTemporaryText("Vague commencée!", 2000); // Afficher le texte en français
            this.hideCinematicBars(); // Hide cinematic bars
            onStartWave(); // Trigger the wave start
            this.hideStartWaveButton(); // Hide the button instead of removing it
        };
    }

    public showStartWaveButton(): void {
        if (this.startWaveButton) {
            this.startWaveButton.style.display = "flex";
        }
    }

    public hideStartWaveButton(): void {
        if (this.startWaveButton) {
            this.startWaveButton.style.display = "none";
        }
    }

    // Affiche une animation stylée "Wave Cleared"
    public showWaveClearedAnimation(): void {
        const clearedContainer = document.createElement("div");
        clearedContainer.style.position = "absolute";
        clearedContainer.style.top = "0";
        clearedContainer.style.left = "0";
        clearedContainer.style.width = "100%";
        clearedContainer.style.height = "100%";
        clearedContainer.style.display = "flex";
        clearedContainer.style.justifyContent = "center";
        clearedContainer.style.alignItems = "center";
        clearedContainer.style.background = "rgba(0,0,0,0.4)";
        clearedContainer.style.zIndex = "2000";
        clearedContainer.style.pointerEvents = "none";

        const clearedText = document.createElement("div");
        clearedText.innerText = "Vague terminée !";
        clearedText.style.fontSize = "64px";
        clearedText.style.fontWeight = "bold";
        clearedText.style.color = "#00FFD0";
        clearedText.style.textShadow = "0 0 24px #00FFD0, 0 0 48px #000";
        clearedText.style.letterSpacing = "2px";
        clearedText.style.padding = "40px 80px";
        clearedText.style.borderRadius = "24px";
        clearedText.style.background = "rgba(0,0,0,0.7)";
        clearedText.style.animation = "waveClearedPop 1.2s cubic-bezier(.17,.67,.83,.67)";
        clearedContainer.appendChild(clearedText);

        // Animation CSS
        const style = document.createElement("style");
        style.innerHTML = `
        @keyframes waveClearedPop {
            0% { transform: scale(0.7); opacity: 0; }
            30% { transform: scale(1.1); opacity: 1; }
            60% { transform: scale(0.95); }
            100% { transform: scale(1); opacity: 1; }
        }`;
        document.head.appendChild(style);

        document.body.appendChild(clearedContainer);

        setTimeout(() => {
            clearedContainer.style.transition = "opacity 0.7s";
            clearedContainer.style.opacity = "0";
            setTimeout(() => {
                clearedContainer.remove();
                style.remove();
            }, 700);
        }, 1700);
    }

    // Affiche une animation stylée "Wave Start"
    public showWavePhase(waveNumber: number): void {
        const waveContainer = document.createElement("div");
        waveContainer.style.position = "absolute";
        waveContainer.style.top = "0";
        waveContainer.style.left = "0";
        waveContainer.style.width = "100%";
        waveContainer.style.height = "100%";
        waveContainer.style.display = "flex";
        waveContainer.style.justifyContent = "center";
        waveContainer.style.alignItems = "center";
        waveContainer.style.background = "rgba(0,0,0,0.3)";
        waveContainer.style.zIndex = "2000";
        waveContainer.style.pointerEvents = "none";

        const waveText = document.createElement("div");
        waveText.innerText = `Vague ${waveNumber}`;
        waveText.style.fontSize = "60px";
        waveText.style.fontWeight = "bold";
        waveText.style.color = "#FFD700";
        waveText.style.textShadow = "0 0 24px #FFD700, 0 0 48px #000";
        waveText.style.letterSpacing = "2px";
        waveText.style.padding = "32px 64px";
        waveText.style.borderRadius = "18px";
        waveText.style.background = "rgba(0,0,0,0.7)";
        waveText.style.animation = "waveStartPop 1.2s cubic-bezier(.17,.67,.83,.67)";
        waveContainer.appendChild(waveText);

        // Animation CSS
        const style = document.createElement("style");
        style.innerHTML = `
        @keyframes waveStartPop {
            0% { transform: scale(0.7); opacity: 0; }
            30% { transform: scale(1.1); opacity: 1; }
            60% { transform: scale(0.95); }
            100% { transform: scale(1); opacity: 1; }
        }`;
        document.head.appendChild(style);

        document.body.appendChild(waveContainer);

        setTimeout(() => {
            waveContainer.style.transition = "opacity 0.7s";
            waveContainer.style.opacity = "0";
            setTimeout(() => {
                waveContainer.remove();
                style.remove();
            }, 700);
        }, 1500);
    }

    // Amélioration de la phase de préparation
    public showPreparationPhase(onStartWave: () => void): void {
        this.showCinematicBars();

        // Met à jour l'affichage du nombre d'ennemis pour la prochaine vague
        this.updateEnemyCountDisplay((WaveManager.getInstance().currentWave ?? 0) + 1);

        // Ajout : animation "Préparation"
        this.showPreparationPhaseAnimation();

        const prepContainer = document.createElement("div");
        prepContainer.style.position = "absolute";
        prepContainer.style.top = "0";
        prepContainer.style.left = "0";
        prepContainer.style.width = "100%";
        prepContainer.style.height = "100%";
        prepContainer.style.display = "flex";
        prepContainer.style.flexDirection = "column";
        prepContainer.style.justifyContent = "center";
        prepContainer.style.alignItems = "center";
        prepContainer.style.background = "rgba(0,0,0,0.55)";
        prepContainer.style.zIndex = "1500";

        const prepText = document.createElement("div");
        prepText.innerText = "Phase de préparation";
        prepText.style.color = "#00BFFF";
        prepText.style.fontSize = "54px";
        prepText.style.fontWeight = "bold";
        prepText.style.textShadow = "0 0 18px #00BFFF, 0 0 36px #000";
        prepText.style.marginBottom = "30px";
        prepText.style.letterSpacing = "2px";
        prepText.style.animation = "prepPop 1.2s cubic-bezier(.17,.67,.83,.67)";
        prepContainer.appendChild(prepText);

        // Animation CSS
        const style = document.createElement("style");
        style.innerHTML = `
        @keyframes prepPop {
            0% { transform: scale(0.7); opacity: 0; }
            30% { transform: scale(1.1); opacity: 1; }
            60% { transform: scale(0.95); }
            100% { transform: scale(1); opacity: 1; }
        }`;
        document.head.appendChild(style);

        // Conseils
        const tips = document.createElement("div");
        tips.innerText = "Placez vos tourelles et préparez-vous à la prochaine vague !";
        tips.style.color = "#fff";
        tips.style.fontSize = "22px";
        tips.style.marginBottom = "40px";
        tips.style.textShadow = "0 0 8px #000";
        prepContainer.appendChild(tips);

        // Bouton démarrer
        const startButton = document.createElement("button");
        startButton.innerText = "Démarrer la vague";
        startButton.style.padding = "16px 40px";
        startButton.style.fontSize = "28px";
        startButton.style.color = "white";
        startButton.style.background = "linear-gradient(90deg,#00FFD0,#00BFFF)";
        startButton.style.border = "none";
        startButton.style.borderRadius = "10px";
        startButton.style.cursor = "pointer";
        startButton.style.fontWeight = "bold";
        startButton.style.boxShadow = "0 2px 12px #00BFFF88";
        prepContainer.appendChild(startButton);

        document.body.appendChild(prepContainer);

        startButton.onclick = () => {
            prepContainer.remove();
            style.remove();
            this.showWavePhase(WaveManager.getInstance().currentWave ?? 1);
            setTimeout(() => {
                this.hideCinematicBars();
                onStartWave();
            }, 1600);
        };
    }

    // Affiche une animation stylée "Préparation"
    public showPreparationPhaseAnimation(): void {
        const prepAnimContainer = document.createElement("div");
        prepAnimContainer.style.position = "absolute";
        prepAnimContainer.style.top = "0";
        prepAnimContainer.style.left = "0";
        prepAnimContainer.style.width = "100%";
        prepAnimContainer.style.height = "100%";
        prepAnimContainer.style.display = "flex";
        prepAnimContainer.style.justifyContent = "center";
        prepAnimContainer.style.alignItems = "center";
        prepAnimContainer.style.background = "rgba(0,0,0,0.3)";
        prepAnimContainer.style.zIndex = "2000";
        prepAnimContainer.style.pointerEvents = "none";

        const prepAnimText = document.createElement("div");
        prepAnimText.innerText = "Préparation";
        prepAnimText.style.fontSize = "60px";
        prepAnimText.style.fontWeight = "bold";
        prepAnimText.style.color = "#00BFFF";
        prepAnimText.style.textShadow = "0 0 24px #00BFFF, 0 0 48px #000";
        prepAnimText.style.letterSpacing = "2px";
        prepAnimText.style.padding = "32px 64px";
        prepAnimText.style.borderRadius = "18px";
        prepAnimText.style.background = "rgba(0,0,0,0.7)";
        prepAnimText.style.animation = "prepStartPop 1.2s cubic-bezier(.17,.67,.83,.67)";
        prepAnimContainer.appendChild(prepAnimText);

        // Animation CSS
        const style = document.createElement("style");
        style.innerHTML = `
        @keyframes prepStartPop {
            0% { transform: scale(0.7); opacity: 0; }
            30% { transform: scale(1.1); opacity: 1; }
            60% { transform: scale(0.95); }
            100% { transform: scale(1); opacity: 1; }
        }`;
        document.head.appendChild(style);

        document.body.appendChild(prepAnimContainer);

        setTimeout(() => {
            prepAnimContainer.style.transition = "opacity 0.7s";
            prepAnimContainer.style.opacity = "0";
            setTimeout(() => {
                prepAnimContainer.remove();
                style.remove();
            }, 700);
        }, 1500);
    }

    // Ajout : met à jour l'affichage du nombre d'ennemis pour la vague à venir
    public updateEnemyCountDisplay(waveNumber?: number): void {
        if (!this.enemyCountDisplay) return;
        try {
            const waveManager = WaveManager.getInstance();
            const currentWave = waveNumber ?? waveManager.currentWave ?? 1;
            const config = WaveManager.getInstance().waveConfigurations?.[currentWave];
            const count = Array.isArray(config) ? config.length : 0;
            this.enemyCountDisplay.innerText = `Ennemis: ${count}`;
        } catch {
            this.enemyCountDisplay.innerText = `Ennemis: 0`;
        }
    }

    // Permet à WaveManager de mettre à jour dynamiquement le nombre d'ennemis à afficher
    public setEnemyCount(count: number): void {
        if (this.enemyCountDisplay) {
            this.enemyCountDisplay.innerText = `Ennemis: ${count}`;
            // Animation pulse à chaque update
            this.enemyCountDisplay.classList.remove("ui-pulse");
            void this.enemyCountDisplay.offsetWidth; // force reflow
            this.enemyCountDisplay.classList.add("ui-pulse");
        }
    }

    // Affiche un message d'aide stylé pour le placement de tourelle
    private showPlacementHelp(): void {
        // Si déjà affiché, ne rien faire
        if (this.placementHelpContainer) return;
        const container = document.createElement("div");
        container.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                gap: 18px;
                background: linear-gradient(90deg,#232526 0%,#00bfff 100%);
                color: #fff;
                font-size: 1.25rem;
                font-weight: bold;
                padding: 18px 36px;
                border-radius: 14px;
                box-shadow: 0 6px 32px #00bfff55;
                position: fixed;
                top: 32px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 3000;
                letter-spacing: 1px;
                text-align: center;
                ">
                <span style="font-size:2rem;">🖱️</span>
                <span>
                    <span style="color:#FFD700;">Clique gauche</span> : placer la tourelle<br>
                    <span style="color:#FF8888;">Clique droit</span> : annuler le placement
                </span>
            </div>
        `;
        this.placementHelpContainer = container;
        document.body.appendChild(container);
    }

    // Retire le message d'aide de placement
    private hidePlacementHelp(): void {
        if (this.placementHelpContainer) {
            this.placementHelpContainer.remove();
            this.placementHelpContainer = null;
        }
    }

    // --- Add this new method ---
    private createTutorialButton(): void {
        this.tutorialButton = document.createElement("button");
        this.tutorialButton.innerText = "Tutoriel";
        this.tutorialButton.style.position = "fixed";
        this.tutorialButton.style.top = "18px";
        this.tutorialButton.style.right = "24px";
        this.tutorialButton.style.zIndex = "2001";
        this.tutorialButton.style.padding = "12px 28px";
        this.tutorialButton.style.fontSize = "1.1rem";
        this.tutorialButton.style.fontWeight = "bold";
        this.tutorialButton.style.background = "linear-gradient(90deg,#00FFD0,#00BFFF)";
        this.tutorialButton.style.color = "#232526";
        this.tutorialButton.style.border = "none";
        this.tutorialButton.style.borderRadius = "10px";
        this.tutorialButton.style.boxShadow = "0 2px 12px #00BFFF88";
        this.tutorialButton.style.cursor = "pointer";
        this.tutorialButton.style.transition = "background 0.2s, transform 0.15s";
        this.tutorialButton.onmouseenter = () => {
            this.tutorialButton!.style.background = "linear-gradient(90deg,#FFD700,#00BFFF)";
            this.tutorialButton!.style.transform = "scale(1.07)";
        };
        this.tutorialButton.onmouseleave = () => {
            this.tutorialButton!.style.background = "linear-gradient(90deg,#00FFD0,#00BFFF)";
            this.tutorialButton!.style.transform = "scale(1)";
        };
        this.tutorialButton.onclick = () => {
            UITutorial.getInstance(this).start();
        };
        document.body.appendChild(this.tutorialButton);
    }
}

// À la fin du fichier, ajoute la classe suivante :
export class UITutorial {
    private static instance: UITutorial | null = null;
    private currentStep = 0;
    private steps: (() => void)[];
    private overlay: HTMLDivElement | null = null;
    private skipButton: HTMLButtonElement | null = null;
    private nextButton: HTMLButtonElement | null = null;
    private highlightElement: HTMLElement | null = null;
    private ui: UIManager;

    private constructor(ui: UIManager) {
        this.ui = ui;
        this.steps = [
            this.stepCoins.bind(this),
            this.stepHealth.bind(this),
            this.stepEnemyCount.bind(this),
            this.stepTurret.bind(this),
            this.stepStartWave.bind(this), // Ajout de l'étape explicative pour démarrer la vague
            this.stepEnd.bind(this),
        ];
    }

    public static getInstance(ui: UIManager): UITutorial {
        if (!UITutorial.instance) {
            UITutorial.instance = new UITutorial(ui);
        }
        return UITutorial.instance;
    }

    public start() {
        this.currentStep = 0;
        this.showStep();
    }

    private showStep() {
        this.clearOverlay();
        if (this.currentStep < this.steps.length) {
            this.steps[this.currentStep]();
        }
    }

    private clearOverlay() {
        if (this.overlay) {
            // Nettoie la flèche SVG si présente
            if ((this.overlay as any).svgArrow) {
                (this.overlay as any).svgArrow.remove();
            }
            this.overlay.remove();
            this.overlay = null;
        }
        if (this.highlightElement) {
            this.highlightElement.style.boxShadow = "";
            this.highlightElement = null;
        }
    }

    private createOverlay(message: string, highlightSelector?: HTMLElement) {
        // Overlay
        this.overlay = document.createElement("div");
        this.overlay.style.position = "fixed";
        this.overlay.style.top = "0";
        this.overlay.style.left = "0";
        this.overlay.style.width = "100vw";
        this.overlay.style.height = "100vh";
        this.overlay.style.background = "rgba(0,0,0,0.55)";
        this.overlay.style.zIndex = "999999";
        this.overlay.style.display = "flex";
        this.overlay.style.flexDirection = "column";
        this.overlay.style.justifyContent = "center";
        this.overlay.style.alignItems = "center";
        document.body.appendChild(this.overlay);

        // Message centré classique
        const msg = document.createElement("div");
        msg.innerText = message;
        msg.style.background = "#fff";
        msg.style.color = "#232526";
        msg.style.padding = "32px 48px";
        msg.style.fontSize = "1.2rem"; // Réduit la taille du texte ici (au lieu de 2rem)
        msg.style.fontWeight = "bold";
        msg.style.borderRadius = "18px";
        msg.style.boxShadow = "0 8px 32px #00bfff88";
        msg.style.textAlign = "center";
        msg.style.marginBottom = "32px";
        msg.style.maxWidth = "90vw";
        msg.style.zIndex = "1000000";
        this.overlay.appendChild(msg);

        // Next button
        this.nextButton = document.createElement("button");
        this.nextButton.innerText = "Suivant";
        this.nextButton.style.margin = "8px";
        this.nextButton.style.padding = "12px 32px";
        this.nextButton.style.fontSize = "1.2rem";
        this.nextButton.style.background = "#232526";
        this.nextButton.style.color = "#fff";
        this.nextButton.style.border = "none";
        this.nextButton.style.borderRadius = "8px";
        this.nextButton.style.cursor = "pointer";
        this.nextButton.onclick = () => {
            this.currentStep++;
            this.showStep();
        };
        this.overlay.appendChild(this.nextButton);

        // Skip button
        this.skipButton = document.createElement("button");
        this.skipButton.innerText = "Passer le tutoriel";
        this.skipButton.style.margin = "8px";
        this.skipButton.style.padding = "12px 32px";
        this.skipButton.style.fontSize = "1.2rem";
        this.skipButton.style.background = "#bbb";
        this.skipButton.style.color = "#232526";
        this.skipButton.style.border = "none";
        this.skipButton.style.borderRadius = "8px";
        this.skipButton.style.cursor = "pointer";
        this.skipButton.onclick = () => {
            this.currentStep = this.steps.length - 1;
            this.showStep();
        };
        this.overlay.appendChild(this.skipButton);

        // Highlight (sans pointe de flèche)
        if (highlightSelector) {
            this.highlightElement = highlightSelector;
            this.highlightElement.style.boxShadow = "0 0 0 8px #fff, 0 0 32px 12px #fff8";
            this.highlightElement.style.transition = "box-shadow 0.2s";
            this.highlightElement.style.zIndex = "1000002";
            this.highlightElement.style.position = "relative";
            // Ajoute une ligne SVG du message vers l'élément (mais PAS la pointe de flèche)
            setTimeout(() => {
                const rectElem = highlightSelector.getBoundingClientRect();
                const rectMsg = msg.getBoundingClientRect();
                const startX = rectMsg.left + rectMsg.width / 2;
                const startY = rectMsg.bottom + 10;
                const endX = rectElem.left + rectElem.width / 2;
                const endY = rectElem.top;
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.style.position = "fixed";
                svg.style.left = "0";
                svg.style.top = "0";
                svg.style.width = "100vw";
                svg.style.height = "100vh";
                svg.style.pointerEvents = "none";
                svg.style.zIndex = "999999"; // Place la ligne SOUS le texte (overlay z-index 999999, msg 1000000)
                svg.setAttribute("width", window.innerWidth.toString());
                svg.setAttribute("height", window.innerHeight.toString());
                let pathD: string;
                if (Math.abs(startX - endX) < 80) {
                    const midY = (startY + endY) / 2;
                    pathD = `M${startX},${startY} C${startX},${midY} ${endX},${midY} ${endX},${endY}`;
                } else {
                    const midX = (startX + endX) / 2;
                    pathD = `M${startX},${startY} C${midX},${startY} ${midX},${endY} ${endX},${endY}`;
                }
                const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
                arrow.setAttribute("stroke", "#fff");
                arrow.setAttribute("stroke-width", "6");
                arrow.setAttribute("fill", "none");
                arrow.setAttribute("d", pathD);
                arrow.setAttribute("opacity", "0.7");
                svg.appendChild(arrow);
                // Ajoute la ligne AVANT le message pour que le texte soit au-dessus
                this.overlay!.insertBefore(svg, msg);
                this.overlay!.addEventListener("remove", () => svg.remove());
                (this.overlay as any).svgArrow = svg;
            }, 0);
            if (this.overlay) {
                this.overlay.style.background = "rgba(0,0,0,0.25)";
            }
        }
    }

    private stepHealth() {
        if (this.ui["healthDisplay"]) {
            this.createOverlay(
                "Voici votre jauge de santé. Si elle tombe à zéro, la partie est terminée.",
                this.ui["healthDisplay"]
            );
        } else {
            this.createOverlay("Voici votre jauge de santé. Si elle tombe à zéro, la partie est terminée.");
        }
    }

    private stepCoins() {
        if (this.ui["coinDisplay"]) {
            this.createOverlay(
                "Ici, vous voyez vos Éclats de Rêves. Ils servent à acheter des tourelles.",
                this.ui["coinDisplay"]
            );
        } else {
            this.createOverlay("Ici, vous voyez vos Éclats de Rêves. Ils servent à acheter des tourelles.");
        }
    }

    private stepEnemyCount() {
        if (this.ui["enemyCountDisplay"]) {
            this.createOverlay(
                "Ce compteur indique le nombre d'ennemis restants dans la vague actuelle.",
                this.ui["enemyCountDisplay"]
            );
        } else {
            this.createOverlay("Ce compteur indique le nombre d'ennemis restants dans la vague actuelle.");
        }
    }

    private stepTurret() {
        // Highlight la première tourelle
        const gardenTurret = this.ui["turretPlaceholders"]?.["garden_turret"];
        this.createOverlay(
            "Les ennemis vont apparaître à travers le portail et se diriger vers l'Arbre Cristal. Empêchez-les d'y parvenir en plaçant des tourelles.\n\n" +
            "Vous pouvez zoomer avec la molette de la souris, faire pivoter la carte avec le clic gauche, et vous déplacer avec le clic droit.",
            gardenTurret
        );
        if (this.nextButton) this.nextButton.disabled = false;
    }

    private stepStartWave() {
        // Cherche le bouton démarrer la vague
        const btn = this.ui["startWaveButton"];
        // Affiche le message sans flèche ni highlight
        this.createOverlay(
            "Quand vous avez placé vos tourelles, cliquez sur le bouton 'Démarrer la vague'"
        );
    }

    private stepEnd() {
        this.createOverlay(
            "Bravo, vous avez maîtrisé les bases ! La véritable épreuve commence maintenant, jusqu'à la vague 30. Bonne chance !"
        );
        if (this.nextButton) {
            this.nextButton.innerText = "Fermer";
            this.nextButton.onclick = () => {
                this.clearOverlay();
              UIManager.getInstance().showPreparationPhaseAnimation();
            };
        }
        if (this.skipButton) {
            this.skipButton.style.display = "none";
        }
    }
}

// CONSEIL : Pour lancer le tutoriel au début du jeu, ajoutez dans votre code d'initialisation principal :
// UITutorial.getInstance(UIManager.getInstance(/* ... */)).start();
