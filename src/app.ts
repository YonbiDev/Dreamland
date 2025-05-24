import { Game } from "./game";
import { MenuManager } from "./core/MenuManager";
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder } from "@babylonjs/core";
import "@babylonjs/loaders"; // si tu charges des .glb/.gltf


window.addEventListener("DOMContentLoaded", () => {
    const menuManager = new MenuManager();
    menuManager.showMainMenu((selectedLevel: string) => {
        if (selectedLevel === "level1") {
            new Game(); // Start the game for level 1
        } else {
            menuManager.showTemporaryText("Niveau indisponible pour l'instant!", 3000);
        }
    });
});