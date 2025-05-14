import { ObjectManager } from "./ObjectManager";
import { ModelLoader } from "./ModelLoader";
import { Game } from "../game";
import { int } from "babylonjs";


const ASSET_BASE_URL = "https://yonbidev.github.io/Dreamland/assets/";

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

    constructor(scene: BABYLON.Scene, canvas: HTMLCanvasElement, game: Game) {
        this.scene = scene;
        this.canvas = canvas;
        this.game = game;
        this.objectManager = new ObjectManager(scene);

        this.createUI();
        this.setupMouseEvents();
    }

    private createUI(): void {
        // Create a container for the UI
        const uiContainer = document.createElement("div");
        uiContainer.id = "uiContainer"; // Added ID for reference
        uiContainer.style.position = "absolute";
        uiContainer.style.bottom = "12%"; // Adjusted to place above the black bar
        uiContainer.style.left = "50%";
        uiContainer.style.transform = "translateX(-50%)";
        uiContainer.style.display = "flex";
        uiContainer.style.gap = "8px";
        uiContainer.style.padding = "8px";
        uiContainer.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
        uiContainer.style.borderRadius = "12px";
        uiContainer.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
        document.body.appendChild(uiContainer);

        // Add placeholders for objects
        this.createPlaceholder(uiContainer, "turret", ASSET_BASE_URL + "Turret1Image.png", "Turret", `
        <div style="text-align: left;">
    <strong style="font-size: 14px; color: #4CAF50;">Tourelle</strong><br>
    <span style="font-size: 12px;">Portée : <strong>30</strong></span><br>
    <span style="font-size: 12px;">Vitesse d'attaque : <strong>2s</strong></span><br>
    <span style="font-size: 12px;">Vitesse du projectile : <strong>50</strong></span><br>
    <span style="font-size: 12px; color: #FFD700;">Prix : <strong>5 Éclats de Rêves</strong></span>
</div>
        `);

        this.createPlaceholder(uiContainer, "placeholder2", ASSET_BASE_URL + "Placeholder2Image.png", "Placeholder 2", `
            <div style="text-align: left;">
                <strong style="font-size: 14px; color: #FF9800;">Placeholder 2</strong><br>
                <span style="font-size: 12px;">Coming Soon...</span>
            </div>
        `);

        this.createPlaceholder(uiContainer, "placeholder3", ASSET_BASE_URL + "Placeholder3Image.png", "Placeholder 3", `
            <div style="text-align: left;">
                <strong style="font-size: 14px; color: #FF5722;">Placeholder 3</strong><br>
                <span style="font-size: 12px;">Coming Soon...</span>
            </div>
        `);

        // Add coin display container
        const coinContainer = document.createElement("div");
        coinContainer.style.position = "absolute";
        coinContainer.style.top = "12%"; // Ensure it is below the black bar
        coinContainer.style.left = "10px";
        coinContainer.style.display = "flex";
        coinContainer.style.alignItems = "center";
        coinContainer.style.padding = "10px";
        coinContainer.style.fontSize = "16px";
        coinContainer.style.color = "white";
        coinContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        coinContainer.style.borderRadius = "5px";
        coinContainer.style.zIndex = "1001";
        coinContainer.style.marginBottom = "15px"; // Add spacing from the health display

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
        healthContainer.style.top = "calc(12% + 50px)"; // Ensure it is below the coin display
        healthContainer.style.left = "10px";
        healthContainer.style.display = "flex";
        healthContainer.style.alignItems = "center";
        healthContainer.style.padding = "10px";
        healthContainer.style.fontSize = "16px";
        healthContainer.style.color = "white";
        healthContainer.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
        healthContainer.style.borderRadius = "5px";
        healthContainer.style.zIndex = "1001";

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
        }
    }

    public updateHealthDisplay(): void {
        if (this.healthDisplay) {
            this.healthDisplay.innerText = `Santé: ${Game.health}`;
        }
        if (Game.health <= 0) {
            this.showGameOverMenu();
        }
      
    }

    public decreaseHealth(amount: number): void {
        Game.health = Game.health  - amount; // Assuming 'health' is a static property of the Game class
        this.updateHealthDisplay();
    }

    private showGameOverMenu(): void {
        // Create game over container
        const gameOverContainer = document.createElement("div");
        gameOverContainer.style.position = "absolute";
        gameOverContainer.style.top = "0";
        gameOverContainer.style.left = "0";
        gameOverContainer.style.width = "100%";
        gameOverContainer.style.height = "100%";
        gameOverContainer.style.display = "flex";
        gameOverContainer.style.flexDirection = "column";
        gameOverContainer.style.justifyContent = "center";
        gameOverContainer.style.alignItems = "center";
        gameOverContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        gameOverContainer.style.zIndex = "1000";
        document.body.appendChild(gameOverContainer);

        // Add "Game Over" text
        const gameOverText = document.createElement("div");
        gameOverText.innerText = "Game Over";
        gameOverText.style.color = "red";
        gameOverText.style.fontSize = "48px";
        gameOverText.style.marginBottom = "20px";
        gameOverContainer.appendChild(gameOverText);

        // Add button to return to main menu
        const mainMenuButton = document.createElement("button");
        mainMenuButton.innerText = "Retour au menu principal";
        mainMenuButton.style.padding = "10px 20px";
        mainMenuButton.style.fontSize = "24px";
        mainMenuButton.style.color = "white";
        mainMenuButton.style.backgroundColor = "blue";
        mainMenuButton.style.border = "none";
        mainMenuButton.style.borderRadius = "5px";
        mainMenuButton.style.cursor = "pointer";
        gameOverContainer.appendChild(mainMenuButton);

        mainMenuButton.onclick = () => {
            // Logic to navigate to the main menu
            window.location.reload(); // Example: Reload the page to simulate returning to the main menu
        };
    }

    public showVictoryMenu(): void {
        // Create victory container
        const victoryContainer = document.createElement("div");
        victoryContainer.style.position = "absolute";
        victoryContainer.style.top = "0";
        victoryContainer.style.left = "0";
        victoryContainer.style.width = "100%";
        victoryContainer.style.height = "100%";
        victoryContainer.style.display = "flex";
        victoryContainer.style.flexDirection = "column";
        victoryContainer.style.justifyContent = "center";
        victoryContainer.style.alignItems = "center";
        victoryContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        victoryContainer.style.zIndex = "1000";
        document.body.appendChild(victoryContainer);

        // Add "Victory" text
        const victoryText = document.createElement("div");
        victoryText.innerText = "Victoire!";
        victoryText.style.color = "gold";
        victoryText.style.fontSize = "48px";
        victoryText.style.marginBottom = "20px";
        victoryContainer.appendChild(victoryText);

        // Add button to return to main menu
        const mainMenuButton = document.createElement("button");
        mainMenuButton.innerText = "Retour au menu principal";
        mainMenuButton.style.padding = "10px 20px";
        mainMenuButton.style.fontSize = "24px";
        mainMenuButton.style.color = "white";
        mainMenuButton.style.backgroundColor = "blue";
        mainMenuButton.style.border = "none";
        mainMenuButton.style.borderRadius = "5px";
        mainMenuButton.style.cursor = "pointer";
        victoryContainer.appendChild(mainMenuButton);

        mainMenuButton.onclick = () => {
            // Logic to navigate to the main menu
            window.location.reload(); // Example: Reload the page to simulate returning to the main menu
        };
    }

    private createPlaceholder(container: HTMLElement, objectType: string, imagePath: string, altText: string, tooltipContent: string): void {
        // Create a container for the placeholder
        const placeholderContainer = document.createElement("div");
        placeholderContainer.style.position = "relative";
        placeholderContainer.style.width = "80px";
        placeholderContainer.style.height = "80px";
        placeholderContainer.style.borderRadius = "10px";
        placeholderContainer.style.backgroundColor = "#f9f9f9";
        placeholderContainer.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.1)";
        placeholderContainer.style.cursor = "pointer";
        placeholderContainer.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
        placeholderContainer.onmouseover = () => {
            placeholderContainer.style.transform = "scale(1.1)";
            placeholderContainer.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
            tooltip.style.display = "block";
        };
        placeholderContainer.onmouseout = () => {
            placeholderContainer.style.transform = "scale(1)";
            placeholderContainer.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.1)";
            tooltip.style.display = "none";
        };
        placeholderContainer.onclick = () => this.startPlacingObject(objectType);
        container.appendChild(placeholderContainer);

        // Add image to the placeholder
        const placeholderImage = document.createElement("img");
        placeholderImage.src = imagePath; // Replace with the actual image path
        placeholderImage.alt = altText;
        placeholderImage.style.width = "100%";
        placeholderImage.style.height = "100%";
        placeholderImage.style.borderRadius = "10px";
        placeholderImage.style.objectFit = "cover";
        placeholderContainer.appendChild(placeholderImage);

        // Add tooltip for the placeholder
        const tooltip = document.createElement("div");
        tooltip.style.position = "absolute";
        tooltip.style.bottom = "90%";
        tooltip.style.left = "50%";
        tooltip.style.transform = "translateX(-50%)";
        tooltip.style.padding = "10px"; // Increased padding for better spacing
        tooltip.style.width = "150px"; // Increased width for better readability
        tooltip.style.backgroundColor = "#333";
        tooltip.style.color = "#fff";
        tooltip.style.borderRadius = "6px";
        tooltip.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.2)";
        tooltip.style.display = "none";
        tooltip.style.textAlign = "center";
        tooltip.style.fontSize = "12px"; // Slightly larger font size
        tooltip.style.lineHeight = "1.5"; // Improved line spacing
        tooltip.innerHTML = tooltipContent;
        placeholderContainer.appendChild(tooltip);
    }

    private startPlacingObject(objectType: string): void {
        const objectConfig = this.objectManager.getObjectConfig(objectType);
        if (!objectConfig) return;

        if (objectType === "turret") {
            const turretCost = 5; // Cost of a turret
            if (this.game.getCoins() < turretCost) {
                this.showTemporaryText("Pas assez de pièces!", 2000); // Show error message in French
                return;
            }
        }

        this.isPlacingObject = true;

        if (objectType === "turret") {
            ModelLoader.loadModel(this.scene, "garden_tree_2", (result) => {
                this.previewMesh = result.meshes[0] as BABYLON.Mesh;
                this.previewMesh.name = `preview_${objectType}`; // Set the correct name
                this.previewMesh.scaling = new BABYLON.Vector3(2, 2, 2); // Adjust scale as needed

                // Configure material for transparency
                const previewMaterial = new BABYLON.StandardMaterial("previewMat", this.scene);
                previewMaterial.alpha = 0.3; // Set lower alpha for transparency
                previewMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
                this.previewMesh.material = previewMaterial;

                this.previewMesh.isPickable = false;

                // Create a range indicator for the turret
                this.rangeIndicator = BABYLON.MeshBuilder.CreateSphere("rangeIndicator", { diameter: 60, segments: 16 }, this.scene);
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
                    const objectType = this.previewMesh.name.replace("preview_", ""); // Extract object type
                    if (objectType === "turret") {
                        const turretCost = 5; // Cost of a turret
                        //this.game.increaseCoins(turretCost); // Refund the cost
                    }

                    // Dispose of the preview mesh and range indicator
                    this.previewMesh.dispose();
                    this.previewMesh = null;

                    if (this.rangeIndicator) {
                        this.rangeIndicator.dispose();
                        this.rangeIndicator = null;
                    }

                    this.isPlacingObject = false;
                    this.showTemporaryText("Placement annulé!", 2000); // Notifier l'annulation en français
                }
                return; // Prevent further processing for right-click
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
                const objectType = this.previewMesh.name.replace("preview_", ""); // Extract object type
                if (objectType === "turret") {
                    const turretCost = 5; // Cost of a turret
                    this.game.decreaseCoins(turretCost); // Deduct the cost when placed
                }

                snappedPosition.y += 0; // Adjust the Y position to place the object above the ground
                console.log(`Création d'un objet de type : ${objectType} à la position : ${snappedPosition}`); // Journal en français
                this.objectManager.createObject(objectType, snappedPosition);

                // Dispose of the preview mesh and range indicator, and reset placement state
                this.previewMesh.dispose();
                this.previewMesh = null;

                if (this.rangeIndicator) {
                    this.rangeIndicator.dispose();
                    this.rangeIndicator = null;
                }

                this.isPlacingObject = false;
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
        this.startWaveButton.style.top = "calc(12% + 110px)"; // 50px du heart + ~60px de marge
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

    public showPreparationPhase(onStartWave: () => void): void {
        // Show cinematic bars during preparation phase
        this.showCinematicBars();

        // Create a container for the UI
        const uiContainer = document.createElement("div");
        uiContainer.style.position = "absolute";
        uiContainer.style.top = "0";
        uiContainer.style.left = "0";
        uiContainer.style.width = "100%";
        uiContainer.style.height = "100%";
        uiContainer.style.display = "flex";
        uiContainer.style.flexDirection = "column";
        uiContainer.style.justifyContent = "center";
        uiContainer.style.alignItems = "center";
        uiContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        uiContainer.style.zIndex = "1000";
        document.body.appendChild(uiContainer);

        // Add preparation phase text
        const preparationText = document.createElement("div");
        preparationText.innerText = "Phase de préparation...";
        preparationText.style.color = "white";
        preparationText.style.fontSize = "48px";
        preparationText.style.marginBottom = "20px";
        uiContainer.appendChild(preparationText);

        // Add start button immediately
        const startButton = document.createElement("button");
        startButton.innerText = "Démarrer la vague";
        startButton.style.padding = "10px 20px";
        startButton.style.fontSize = "24px";
        startButton.style.color = "white";
        startButton.style.backgroundColor = "green";
        startButton.style.border = "none";
        startButton.style.borderRadius = "5px";
        startButton.style.cursor = "pointer";
        uiContainer.appendChild(startButton);

        startButton.onclick = () => {
            // Remove preparation phase UI
            document.body.removeChild(uiContainer);

            // Show wave start animation
            const waveStartContainer = document.createElement("div");
            waveStartContainer.style.position = "absolute";
            waveStartContainer.style.top = "0";
            waveStartContainer.style.left = "0";
            waveStartContainer.style.width = "150px";
            waveStartContainer.style.height = "100%";
            waveStartContainer.style.display = "flex";
            waveStartContainer.style.justifyContent = "center";
            waveStartContainer.style.alignItems = "center";
            waveStartContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
            waveStartContainer.style.zIndex = "1000";
            document.body.appendChild(waveStartContainer);

            const waveStartText = document.createElement("div");
            waveStartText.innerText = "Vague commencée!";
            waveStartText.style.color = "yellow";
            waveStartText.style.fontSize = "48px";
            waveStartContainer.appendChild(waveStartText);

            setTimeout(() => {
                document.body.removeChild(waveStartContainer);
                this.hideCinematicBars(); // Hide cinematic bars after wave starts
                onStartWave(); // Trigger the wave start
            }, 2000); // Display "Wave Started!" for 2 seconds
        };
    }
}
