import { DumpData } from "babylonjs/Misc/dumpTools";
import { deleteEnemey, getEnemies } from "../game";

export class Enemy {
    mesh: BABYLON.Mesh;
    scene: BABYLON.Scene;
    health: number;


    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, health: number = 10) {
        this.scene = scene;
        this.health = health;

        // Créer un cube ennemi
        this.mesh = BABYLON.MeshBuilder.CreateBox("enemy", { size: 3 }, scene);
        this.mesh.position = position;

        // Associer l'ennemi au mesh via `metadata`
        this.mesh.metadata = { enemyInstance: this };

      
    }

    damage(amount: number) {
        this.health -= amount;
        console.log(`⚠️ Ennemi touché ! HP restant : ${this.health}`);

        if (this.health <= 0) {
            this.destroy();
        }
    }

    destroy() {
        
        deleteEnemey(this);
        this.mesh.dispose();
      console.log("enemy supprimer de la liste");
        
    
    }
}
