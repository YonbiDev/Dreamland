import * as BABYLON from 'babylonjs';
import "babylonjs-loaders"
import { CameraController } from "./core/CameraController";
import { Grid } from "./core/Grid";
import { BoxManager } from "./core/BoxManager";
import { ModelLoader } from "./core/ModelLoader";
import { Ground } from './core/ground';

export class Game {
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private canvas: HTMLCanvasElement;

    constructor() {
        this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = new BABYLON.Scene(this.engine);

        this.init();
        
    }

    private init(): void {
        // Ajout de la caméra
        new CameraController(this.scene, this.canvas);

        // Ajout de la grille
        const grid = new Grid(this.scene, 5, 20, 20);

      //  const ground = new Ground(this.scene);

        // Gestion des boîtes
        new BoxManager(this.scene, grid.getMesh());

        // Chargement des modèles
        new ModelLoader(this.scene);

        // Ajout d'une lumière
        new BABYLON.HemisphericLight("light", new BABYLON.Vector3(2, 10, 10), this.scene);

        // Lancement de la boucle de rendu
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
}
