import * as BABYLON from 'babylonjs';
export class BoxManager {
    private scene: BABYLON.Scene;
    private grid: BABYLON.Mesh;
    private selectedObject: BABYLON.Mesh | null = null;

    constructor(scene: BABYLON.Scene, grid: BABYLON.Mesh) {
        this.scene = scene;
        this.grid = grid;

        this.scene.onPointerDown = (evt, pickResult) => {
            if (evt.button !== 0 || !pickResult.hit || pickResult.pickedMesh !== this.grid) return;

            const snappedPosition = this.snapToGrid(pickResult.pickedPoint, 5);
            const existingBox = this.scene.meshes.find(mesh => mesh.name.startsWith("box") && mesh.position.equals(snappedPosition));

            if (!existingBox) {
                this.createBox(snappedPosition);
            } else {
                this.selectBox(existingBox as BABYLON.Mesh);
            }
        };
    }

    private createBox(position: BABYLON.Vector3): void {
        const box = BABYLON.MeshBuilder.CreateBox("box", { size: 4 }, this.scene);
        box.position = position;
        box.material = new BABYLON.StandardMaterial("boxMaterial", this.scene);
        (box.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(1, 0, 0);
    }

    private selectBox(box: BABYLON.Mesh): void {
        if (this.selectedObject) {
            (this.selectedObject.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(1, 0, 0);
        }
        this.selectedObject = box;
        (box.material as BABYLON.StandardMaterial).diffuseColor = new BABYLON.Color3(0, 1, 0);
    }

    private snapToGrid(position: BABYLON.Vector3, cellSize: number): BABYLON.Vector3 {
        return new BABYLON.Vector3(
            Math.round(position.x / cellSize) * cellSize,
            2,
            Math.round(position.z / cellSize) * cellSize
        );
    }
}
