export class MenuManager {
    public showMainMenu(onLevelSelect: (level: string) => void): void {
        // Create a container for the menu
        const menuContainer = document.createElement("div");
        menuContainer.style.position = "absolute";
        menuContainer.style.top = "0";
        menuContainer.style.left = "0";
        menuContainer.style.width = "100%";
        menuContainer.style.height = "100%";
        menuContainer.style.display = "flex";
        menuContainer.style.flexDirection = "column";
        menuContainer.style.justifyContent = "center";
        menuContainer.style.alignItems = "center";
        menuContainer.style.backgroundImage = "url('mainmenuImage.png')"; // Add background image
        menuContainer.style.backgroundSize = "cover";
        menuContainer.style.backgroundPosition = "center";
        menuContainer.style.zIndex = "1000";
        menuContainer.style.overflow = "hidden"; // Prevent overflow for mouse effects

        // Add title
        const title = document.createElement("h1");
        title.innerText = "Sélection de Niveau";
        title.style.color = "white";
        title.style.marginBottom = "20px";
        title.style.fontSize = "48px";
        title.style.textShadow = "2px 2px 8px rgba(0, 0, 0, 0.7)";
        menuContainer.appendChild(title);

        // Add level buttons
        const levels = [
            { id: "level1", name: "Niveau 1" },
            { id: "level2", name: "Niveau 2 (Coming Soon)" },
            { id: "level3", name: "Niveau 3 (Coming Soon)" }
        ];

        levels.forEach(level => {
            const button = document.createElement("button");
            button.innerText = level.name;
            button.style.padding = "15px 30px";
            button.style.margin = "10px";
            button.style.fontSize = "20px";
            button.style.color = "white";
            button.style.backgroundColor = level.id === "level1" ? "green" : "gray";
            button.style.border = "none";
            button.style.borderRadius = "10px";
            button.style.cursor = level.id === "level1" ? "pointer" : "not-allowed";
            button.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
            button.style.transition = "transform 0.2s, box-shadow 0.2s";

            // Add hover effect
            button.onmouseover = () => {
                if (level.id === "level1") {
                    button.style.transform = "scale(1.1)";
                    button.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.5)";
                }
            };
            button.onmouseout = () => {
                button.style.transform = "scale(1)";
                button.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
            };

            button.onclick = () => {
                if (level.id === "level1") {
                    document.body.removeChild(menuContainer);
                    onLevelSelect(level.id);
                }
            };

            menuContainer.appendChild(button);
        });

        // Add mouse effect
        const mouseEffect = document.createElement("div");
        mouseEffect.style.position = "absolute";
        mouseEffect.style.width = "20px";
        mouseEffect.style.height = "20px";
        mouseEffect.style.borderRadius = "50%";
        mouseEffect.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
        mouseEffect.style.pointerEvents = "none";
        mouseEffect.style.transition = "transform 0.1s, opacity 0.1s";
        menuContainer.appendChild(mouseEffect);

        menuContainer.onmousemove = (event) => {
            mouseEffect.style.transform = `translate(${event.clientX - 10}px, ${event.clientY - 10}px) scale(1)`;
            mouseEffect.style.opacity = "1";
        };

        menuContainer.onmouseleave = () => {
            mouseEffect.style.opacity = "0";
        };

        document.body.appendChild(menuContainer);
    }

    public showTemporaryText(message: string, duration: number): void {
        const textContainer = document.createElement("div");
        textContainer.innerText = message;
        textContainer.style.position = "absolute";
        textContainer.style.top = "20px";
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
}
