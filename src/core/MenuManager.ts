export class MenuManager {
    public async showMainMenu(onLevelSelect: (level: string) => void): Promise<void> {
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
        menuContainer.style.zIndex = "1000";
        menuContainer.style.overflow = "hidden"; // Prevent overflow for mouse effects

        // Add background video
       const backgroundVideo = document.createElement("video");
backgroundVideo.src = "https://yonbidev.github.io/Dreamland/assets/mainmenu_video.mp4"; // .mp4, not .mp3
backgroundVideo.autoplay = true;
        backgroundVideo.loop = true;
        backgroundVideo.muted = true;
        backgroundVideo.style.position = "absolute";
        backgroundVideo.style.top = "0";
        backgroundVideo.style.left = "0";
        backgroundVideo.style.width = "100%";
        backgroundVideo.style.height = "100%";
        backgroundVideo.style.objectFit = "cover";
        backgroundVideo.style.zIndex = "-1"; // Ensure it stays behind other elements
        menuContainer.appendChild(backgroundVideo);

        // Add background music
        const audioEngine = await BABYLON.CreateAudioEngineAsync();

        const backgroundMusic = await BABYLON.CreateSoundAsync("backgroundMusic", 
            "https://yonbidev.github.io/Dreamland/assets/mainmenu_music.mp3"
    
        );
       await audioEngine.unlock();

        backgroundMusic.play();


        // Add title
        const title = document.createElement("h1");
        title.innerText = "Les Défenseurs de Dreamfall";
        title.style.color = "white";
        title.style.marginBottom = "20px";
        title.style.fontSize = "48px";
        title.style.textShadow = "2px 2px 8px rgba(0, 0, 0, 0.7)";
        menuContainer.appendChild(title);

        // Add level buttons
        const levels = [
            { id: "level1", name: "Niveau 1" },
            { id: "level2", name: "Niveau 2 (Bientôt)" },
            { id: "level3", name: "Niveau 3 (Bientôt)" }
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
                            backgroundMusic.stop();

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

        menuContainer.onmouseleave = () => {
            mouseEffect.style.opacity = "0";
        };

        menuContainer.onmousemove = (event) => {
            // Update main cursor effect
            const size = 20;
            mouseEffect.style.left = `${event.clientX - size / 2}px`;
            mouseEffect.style.top = `${event.clientY - size / 2}px`;
            mouseEffect.style.opacity = "1";

            // Create a particle
            const particle = document.createElement("div");
            const particleSize = Math.random() * 6 + 4; // 4px to 10px
            particle.style.position = "absolute";
            particle.style.left = `${event.clientX - particleSize / 2}px`;
            particle.style.top = `${event.clientY - particleSize / 2}px`;
            particle.style.width = `${particleSize}px`;
            particle.style.height = `${particleSize}px`;
            particle.style.borderRadius = "50%";
            particle.style.backgroundColor = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`;
            particle.style.pointerEvents = "none";
            particle.style.zIndex = "1001";
            particle.style.opacity = "1";
            particle.style.transition = "all 0.5s ease-out";

            // Slight movement (optional)
            const offsetX = (Math.random() - 0.5) * 30;
            const offsetY = (Math.random() - 0.5) * 30;
            requestAnimationFrame(() => {
                particle.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                particle.style.opacity = "0";
            });

            menuContainer.appendChild(particle);

            // Remove after fade
            setTimeout(() => {
                menuContainer.removeChild(particle);
            }, 500);
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
