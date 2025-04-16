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
        // Button for placing the green box
        const greenBoxButton = document.createElement("div");
        greenBoxButton.innerText = "Place Green Box";
        greenBoxButton.style.position = "absolute";
        greenBoxButton.style.bottom = "60px";
        greenBoxButton.style.left = "50%";
        greenBoxButton.style.transform = "translateX(-50%)";
        greenBoxButton.style.padding = "10px 20px";
        greenBoxButton.style.backgroundColor = "#333";
        greenBoxButton.style.color = "#fff";
        greenBoxButton.style.borderRadius = "5px";
        greenBoxButton.style.cursor = "pointer";
        greenBoxButton.onclick = () => this.startPlacingObject("greenBox");
        document.body.appendChild(greenBoxButton);

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

        // Button for placing waypoints
        const waypointButton = document.createElement("div");
        waypointButton.innerText = "Place Waypoints";
        waypointButton.style.position = "absolute";
        waypointButton.style.bottom = "100px";
        waypointButton.style.left = "50%";
        waypointButton.style.transform = "translateX(-50%)";
        waypointButton.style.padding = "10px 20px";
        waypointButton.style.backgroundColor = "#333";
        waypointButton.style.color = "#fff";
        waypointButton.style.borderRadius = "5px";
        waypointButton.style.cursor = "pointer";
        waypointButton.onclick = () => this.toggleWaypointPlacement();
        document.body.appendChild(waypointButton);

        // Button for saving waypoints
        const saveButton = document.createElement("div");
        saveButton.innerText = "Save Waypoints";
        saveButton.style.position = "absolute";
        saveButton.style.bottom = "140px";
        saveButton.style.left = "50%";
        saveButton.style.transform = "translateX(-50%)";
        saveButton.style.padding = "10px 20px";
        saveButton.style.backgroundColor = "#333";
        saveButton.style.color = "#fff";
        saveButton.style.borderRadius = "5px";
        saveButton.style.cursor = "pointer";
        saveButton.onclick = () => this.saveWaypoints();
        document.body.appendChild(saveButton);
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

    private toggleWaypointPlacement(): void {
        this.isPlacingWaypoints = !this.isPlacingWaypoints;
        console.log(`Waypoint placement mode: ${this.isPlacingWaypoints}`);
    }

    private setupMouseEvents(): void {
        this.scene.onPointerDown = (evt, pickResult) => {
            if (this.isPlacingObject && evt.button === 0 && pickResult.hit && this.previewMesh) {
                const snappedPosition = pickResult.pickedPoint;
                snappedPosition.y = pickResult.pickedPoint.y;

                const isPositionFree = !this.scene.meshes.some(mesh => mesh !== this.previewMesh && mesh.position.equals(snappedPosition));
                const isGround = pickResult.pickedMesh?.name === "Ground";

                if (isPositionFree || isGround) {
                    const objectType = this.previewMesh.name.replace("preview_", "");
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
            }

            // Handle waypoint placement
            if (this.isPlacingWaypoints && evt.button === 0 && pickResult.hit && pickResult.pickedMesh?.name === "Ground") {
                const waypoint = pickResult.pickedPoint.clone();
                this.waypoints.push(waypoint);

                // Visualize the waypoint
                const sphere = BABYLON.MeshBuilder.CreateSphere("waypoint", { diameter: 1 }, this.scene);
                sphere.position = waypoint;
                sphere.material = new BABYLON.StandardMaterial("waypointMat", this.scene);
                (sphere.material as BABYLON.StandardMaterial).diffuseColor = BABYLON.Color3.Red();

                console.log("Waypoint added:", waypoint);
            }
        };
    }

    private saveWaypoints(): void {
        const waypointData = JSON.stringify(this.waypoints.map(wp => ({ x: wp.x, y: wp.y, z: wp.z })));
        console.log("Waypoints saved:", waypointData);

        // Optionally save to localStorage
        localStorage.setItem("waypoints", waypointData);
    }

    public loadWaypoints(): void {
        const waypointData = localStorage.getItem("waypoints");
        if (waypointData) {
            this.waypoints = JSON.parse(waypointData).map((wp: { x: number; y: number; z: number }) =>
                new BABYLON.Vector3(wp.x, wp.y, wp.z)
            );

            // Visualize loaded waypoints
            this.waypoints.forEach(waypoint => {
                const sphere = BABYLON.MeshBuilder.CreateSphere("waypoint", { diameter: 1 }, this.scene);
                sphere.position = waypoint;
                sphere.material = new BABYLON.StandardMaterial("waypointMat", this.scene);
                (sphere.material as BABYLON.StandardMaterial).diffuseColor = BABYLON.Color3.Red();
            });

            console.log("Waypoints loaded:", this.waypoints);
        }
    }

    public getWaypoints(): BABYLON.Vector3[] {
        return this.waypoints;
    }
}
