export class ObjectManager {
    private scene: BABYLON.Scene;
    private objectTypes: { [key: string]: { size: number; color: BABYLON.Color3 } } = {
        greenBox: { size: 3, color: BABYLON.Color3.Green() },
        turret: { size: 3, color: BABYLON.Color3.Gray() },
        // Add more object types here as needed
    };

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
    }

    public getObjectConfig(objectType: string): { size: number; color: BABYLON.Color3 } | null {
        return this.objectTypes[objectType] || null;
    }

    public createObject(objectType: string, position: BABYLON.Vector3): void {
        const objectConfig = this.getObjectConfig(objectType);
        if (!objectConfig) return;

        if (objectType === "turret") {
            import("./Turret").then(module => {
                const Turret = module.Turret;
                new Turret(this.scene, position, 30,50,2000); // Default range is 100
            });
        } else {
            const object = BABYLON.MeshBuilder.CreateBox(objectType, { size: objectConfig.size }, this.scene);
            object.position = position;
            object.material = new BABYLON.StandardMaterial("objectMat", this.scene);
            (object.material as BABYLON.StandardMaterial).diffuseColor = objectConfig.color;
        }
    }
}
