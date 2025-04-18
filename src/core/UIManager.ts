import { ObjectManager } from "./ObjectManager";

export class UIManager {
    private scene: BABYLON.Scene;
    private canvas: HTMLCanvasElement;
    private isPlacingObject: boolean = false;
    private previewMesh: BABYLON.Mesh | null = null;
    private rangeIndicator: BABYLON.Mesh | null = null;
    private objectManager: ObjectManager;
    private waypoints: BABYLON.Vector3[] = [];
    private isPlacingWaypoints: boolean = false;

    constructor(scene: BABYLON.Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        this.canvas = canvas;
        this.objectManager = new ObjectManager(scene);

        this.createUI();
        this.setupMouseEvents();
    }

    private createUI(): void {
        // Button for placing the turret
        const turretButton = document.createElement("div");
        turretButton.innerText = "Place Turret";
        turretButton.style.position = "absolute";
        turretButton.style.bottom = "20px";
        turretButton.style.left = "50%";
        turretButton.style.transform = "translateX(-50%)";
        turretButton.style.padding = "10px 20px";
        turretButton.style.backgroundColor = "#333";
        turretButton.style.color = "#fff";
        turretButton.style.borderRadius = "5px";
        turretButton.style.cursor = "pointer";
        turretButton.onclick = () => this.startPlacingObject("turret");
        document.body.appendChild(turretButton);
    }

    private startPlacingObject(objectType: string): void {
        this.isPlacingObject = true;

        const objectConfig = this.objectManager.getObjectConfig(objectType);
        if (!objectConfig) return;

        // Create a placeholder preview for the object
        this.previewMesh = BABYLON.MeshBuilder.CreateBox(`preview_${objectType}`, { size: objectConfig.size }, this.scene);
        this.previewMesh.material = new BABYLON.StandardMaterial("previewMat", this.scene);
        (this.previewMesh.material as BABYLON.StandardMaterial).alpha = 0.5;
        (this.previewMesh.material as BABYLON.StandardMaterial).diffuseColor = objectConfig.color;

        this.previewMesh.position = new BABYLON.Vector3(0, 0, 0);

        // Make the preview mesh non-pickable
        this.previewMesh.isPickable = false;

        // Create a range indicator for the turret
        if (objectType === "turret") {
            this.rangeIndicator = BABYLON.MeshBuilder.CreateSphere("rangeIndicator", { diameter: 60, segments: 16 }, this.scene);
            this.rangeIndicator.material = new BABYLON.StandardMaterial("rangeMat", this.scene);
            (this.rangeIndicator.material as BABYLON.StandardMaterial).alpha = 0.2;
            (this.rangeIndicator.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(1, 1, 1);
            this.rangeIndicator.position = new BABYLON.Vector3(0, 0, 0);

            // Make the range indicator non-pickable
            this.rangeIndicator.isPickable = false;
        }

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
    }

    private setupMouseEvents(): void {
        this.scene.onPointerDown = (evt, pickResult) => {
            if (!pickResult.pickedMesh) {
                console.warn("Pointer down event did not hit any mesh.");
                return;
            }

            const snappedPosition = pickResult.pickedPoint;
            snappedPosition.y = pickResult.pickedPoint.y;

            const isPositionFree = !this.scene.meshes.some(mesh => mesh !== this.previewMesh && mesh.position.equals(snappedPosition));
            const isGround = pickResult.pickedMesh.name === "Ground";

            if (isGround && isPositionFree && this.previewMesh) {
                const objectType = this.previewMesh.name.replace("preview_", "");
                snappedPosition.y += 1; // Adjust the Y position to place the object above the ground
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
}
