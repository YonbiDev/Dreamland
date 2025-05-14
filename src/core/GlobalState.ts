import { Game } from "../game";
import { Enemy } from "./Enemy";


export const enemies: Enemy[] = [];

// Nettoyez les ennemis invalides périodiquement
setInterval(() => {
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i].mesh || enemies[i].mesh.isDisposed()) {
            enemies.splice(i, 1); // Remove invalid enemy
        }
    }
}, 1000); // Check every second

// Enemies now handle their own updates, no need to call update globally

const canvas = document.querySelector("canvas");
if (canvas) {
    canvas.addEventListener("enemyReachedEnd", () => {
        const currentHealth = Game.getHealth();
        Game.setHealth(currentHealth - 1);
        console.log(`Health decreased. Current health: ${Game.getHealth()}`);
    });
}
