export class MenuManager {
    public async showMainMenu(onLevelSelect: (level: string) => void): Promise<void> {
        // Affiche la vidéo d'intro avant le menu
        await new Promise<void>((resolve) => {
            // Ajoute une barre noire en haut (cinématique)
            const cineBarTop = document.createElement("div");
            cineBarTop.style.position = "fixed";
            cineBarTop.style.top = "0";
            cineBarTop.style.left = "0";
            cineBarTop.style.width = "100vw";
            cineBarTop.style.height = "3vh";
            cineBarTop.style.background = "black";
            cineBarTop.style.zIndex = "10000";
            cineBarTop.style.pointerEvents = "none";
            document.body.appendChild(cineBarTop);

            // Ajoute une barre noire en bas (cinématique)
            const cineBarBot = document.createElement("div");
            cineBarBot.style.position = "fixed";
            cineBarBot.style.bottom = "0";
            cineBarBot.style.left = "0";
            cineBarBot.style.width = "100vw";
            cineBarBot.style.height = "3vh";
            cineBarBot.style.background = "black";
            cineBarBot.style.zIndex = "10000";
            cineBarBot.style.pointerEvents = "none";
            document.body.appendChild(cineBarBot);

            // Ajoute un texte pour inciter à cliquer si la vidéo ne démarre pas
            const clickToStartText = document.createElement("div");
            clickToStartText.innerText = "Cliquez pour démarrer la vidéo";
            clickToStartText.style.position = "fixed";
            clickToStartText.style.bottom = "4vh";
            clickToStartText.style.left = "50%";
            clickToStartText.style.transform = "translateX(-50%)";
            clickToStartText.style.color = "white";
            clickToStartText.style.fontSize = "20px";
            clickToStartText.style.background = "rgba(0,0,0,0.5)";
            clickToStartText.style.padding = "8px 18px";
            clickToStartText.style.borderRadius = "8px";
            clickToStartText.style.zIndex = "10001";
            clickToStartText.style.pointerEvents = "none";
            document.body.appendChild(clickToStartText);

            // Prépare le texte "Appuyez sur ESPACE..." mais ne l'affiche pas tout de suite
            const skipText = document.createElement("div");
            skipText.innerText = "Appuyez sur ESPACE pour passer la cinématique";
            skipText.style.position = "fixed";
            skipText.style.bottom = "4vh";
            skipText.style.left = "50%";
            skipText.style.transform = "translateX(-50%)";
            skipText.style.color = "white";
            skipText.style.fontSize = "20px";
            skipText.style.background = "rgba(0,0,0,0.5)";
            skipText.style.padding = "8px 18px";
            skipText.style.borderRadius = "8px";
            skipText.style.zIndex = "10001";
            skipText.style.pointerEvents = "none";
            skipText.style.display = "none"; // caché au début
            document.body.appendChild(skipText);

            let skipTextTimeout: any = null;

            const video = document.createElement("video");
            video.src = "assets/intro.mp4";
            video.style.position = "fixed";
            video.style.top = "50%";
            video.style.left = "50%";
            video.style.transform = "translate(-50%, -50%)";
            video.style.width = "100vw";
            video.style.height = "100vh";
            video.style.objectFit = "contain";
            video.style.background = "black";
            video.style.zIndex = "9999";
            video.autoplay = true;
            video.muted = false; // Son activé
            video.playsInline = true;
            video.controls = false;
            document.body.appendChild(video);

            // Pour forcer le son sur certains navigateurs, il faut parfois un clic utilisateur
            let videoUnlocked = false;
            const unlockAudio = () => {
                if (videoUnlocked) return;
                videoUnlocked = true;
                video.muted = false;
                video.volume = 1;
                video.play();
                window.removeEventListener("click", unlockAudio);
            };
            window.addEventListener("click", unlockAudio);

            // Affiche le texte "Cliquez pour démarrer la vidéo" tant que la vidéo n'a pas commencé
            let videoStarted = false;
            const showSkipText = () => {
                if (!videoStarted) {
                    videoStarted = true;
                    // Empêche tout clic ultérieur de relancer la vidéo
                    window.removeEventListener("click", unlockAudio);
                    clickToStartText.parentElement?.removeChild(clickToStartText);
                    skipText.style.display = "block";
                    skipTextTimeout = setTimeout(() => {
                        skipText.parentElement?.removeChild(skipText);
                    }, 5000);
                }
            };

            video.addEventListener("play", showSkipText);
            // Si la vidéo démarre suite à un clic, retire le texte "cliquez..."
            video.addEventListener("playing", showSkipText);

            // Skip avec espace
            const skipHandler = (e: KeyboardEvent) => {
                if (e.code === "Space" || e.key === " ") {
                    video.pause();
                    video.onended?.(null as any);
                }
            };
            window.addEventListener("keydown", skipHandler);

            video.onended = () => {
                video.parentElement?.removeChild(video);
                cineBarTop.parentElement?.removeChild(cineBarTop);
                cineBarBot.parentElement?.removeChild(cineBarBot);
                if (skipText.parentElement) skipText.parentElement.removeChild(skipText);
                if (clickToStartText.parentElement) clickToStartText.parentElement.removeChild(clickToStartText);
                window.removeEventListener("keydown", skipHandler);
                if (skipTextTimeout) clearTimeout(skipTextTimeout);
                resolve();
            };
            video.onerror = () => {
                video.parentElement?.removeChild(video);
                cineBarTop.parentElement?.removeChild(cineBarTop);
                cineBarBot.parentElement?.removeChild(cineBarBot);
                if (skipText.parentElement) skipText.parentElement.removeChild(skipText);
                if (clickToStartText.parentElement) clickToStartText.parentElement.removeChild(clickToStartText);
                window.removeEventListener("keydown", skipHandler);
                if (skipTextTimeout) clearTimeout(skipTextTimeout);
                resolve();
            };
        });

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
        menuContainer.style.overflow = "hidden";
        menuContainer.style.background = "rgba(10, 20, 40, 0.65)"; // fond semi-transparent pour effet pro

        // Add background video
        const backgroundVideo = document.createElement("video");
        backgroundVideo.src = "assets/mainmenu_video.mp4";
        backgroundVideo.autoplay = true;
        backgroundVideo.loop = true;
        backgroundVideo.muted = true;
        backgroundVideo.style.position = "absolute";
        backgroundVideo.style.top = "0";
        backgroundVideo.style.left = "0";
        backgroundVideo.style.width = "100%";
        backgroundVideo.style.height = "100%";
        backgroundVideo.style.objectFit = "cover";
        backgroundVideo.style.zIndex = "-1";
        menuContainer.appendChild(backgroundVideo);

        // Add background music
        const audioEngine = await BABYLON.CreateAudioEngineAsync();
        const backgroundMusic = await BABYLON.CreateSoundAsync("backgroundMusic", "assets/mainmenu_music.mp3");
        await audioEngine.unlock();
        backgroundMusic.play();

        // Add title
        const title = document.createElement("h1");
        title.innerText = "Guardians of Dreamland";
        title.style.color = "#fff";
        title.style.marginBottom = "30px";
        title.style.fontSize = "64px";
        title.style.letterSpacing = "4px";
        title.style.fontFamily = "'Segoe UI', Arial, sans-serif";
        title.style.textShadow = "0 8px 32px #000, 0 2px 12px #1a1a1a";
        title.style.fontWeight = "bold";
        title.style.textAlign = "center";
        title.style.textTransform = "uppercase";
        title.style.opacity = "0";
        title.style.transform = "translateY(-40px) scale(0.95)";
        title.style.transition = "opacity 1.2s cubic-bezier(.77,0,.18,1), transform 1.2s cubic-bezier(.77,0,.18,1)";
        menuContainer.appendChild(title);

        setTimeout(() => {
            title.style.opacity = "1";
            title.style.transform = "translateY(0) scale(1)";
        }, 200);

        // Menu panel
        const panel = document.createElement("div");
        panel.style.display = "flex";
        panel.style.flexDirection = "column";
        panel.style.alignItems = "center";
        panel.style.background = "rgba(20, 30, 60, 0.85)";
        panel.style.padding = "40px 60px";
        panel.style.borderRadius = "18px";
        panel.style.boxShadow = "0 8px 32px rgba(0,0,0,0.45)";
        panel.style.gap = "24px";
        panel.style.opacity = "0";
        panel.style.transform = "translateY(40px) scale(0.97)";
        panel.style.transition = "opacity 1.2s cubic-bezier(.77,0,.18,1) 0.2s, transform 1.2s cubic-bezier(.77,0,.18,1) 0.2s";
        menuContainer.appendChild(panel);

        setTimeout(() => {
            panel.style.opacity = "1";
            panel.style.transform = "translateY(0) scale(1)";
        }, 400);

        // Nouvelle Partie button
        const newGameBtn = document.createElement("button");
        newGameBtn.innerText = "Nouvelle Partie";
        newGameBtn.style.padding = "18px 48px";
        newGameBtn.style.margin = "10px";
        newGameBtn.style.fontSize = "24px";
        newGameBtn.style.color = "#fff";
        newGameBtn.style.background = "linear-gradient(90deg, #1e9600 0%, #57d600 100%)";
        newGameBtn.style.border = "none";
        newGameBtn.style.borderRadius = "12px";
        newGameBtn.style.cursor = "pointer";
        newGameBtn.style.fontWeight = "bold";
        newGameBtn.style.boxShadow = "0 4px 16px rgba(30,150,0,0.25)";
        newGameBtn.style.transition = "transform 0.2s, box-shadow 0.2s, background 0.2s, filter 0.2s";
        newGameBtn.style.filter = "drop-shadow(0 0 8px #baffc9)";
        newGameBtn.onmouseover = () => {
            newGameBtn.style.transform = "scale(1.12) rotate(-2deg)";
            newGameBtn.style.background = "linear-gradient(90deg, #57d600 0%, #1e9600 100%)";
            newGameBtn.style.boxShadow = "0 8px 32px 0 #baffc9";
            newGameBtn.style.filter = "drop-shadow(0 0 18px #baffc9)";
        };
        newGameBtn.onmouseout = () => {
            newGameBtn.style.transform = "scale(1)";
            newGameBtn.style.background = "linear-gradient(90deg, #1e9600 0%, #57d600 100%)";
            newGameBtn.style.boxShadow = "0 4px 16px rgba(30,150,0,0.25)";
            newGameBtn.style.filter = "drop-shadow(0 0 8px #baffc9)";
        };
        // Button entrance animation
        newGameBtn.style.opacity = "0";
        newGameBtn.style.transform = "translateY(30px) scale(0.95)";
        setTimeout(() => {
            newGameBtn.style.opacity = "1";
            newGameBtn.style.transform = "translateY(0) scale(1)";
        }, 700);
        newGameBtn.onclick = () => {
            document.body.removeChild(menuContainer);
            backgroundMusic.stop();
            onLevelSelect("level1");
        };
        panel.appendChild(newGameBtn);

        // Crédits button
        const creditsBtn = document.createElement("button");
        creditsBtn.innerText = "Crédits";
        creditsBtn.style.padding = "14px 38px";
        creditsBtn.style.margin = "10px";
        creditsBtn.style.fontSize = "20px";
        creditsBtn.style.color = "#fff";
        creditsBtn.style.background = "linear-gradient(90deg, #232526 0%, #414345 100%)";
        creditsBtn.style.border = "none";
        creditsBtn.style.borderRadius = "10px";
        creditsBtn.style.cursor = "pointer";
        creditsBtn.style.fontWeight = "bold";
        creditsBtn.style.boxShadow = "0 2px 8px rgba(30,30,30,0.25)";
        creditsBtn.style.transition = "transform 0.2s, box-shadow 0.2s, background 0.2s, filter 0.2s";
        creditsBtn.style.filter = "drop-shadow(0 0 8px #b2bec3)";
        creditsBtn.onmouseover = () => {
            creditsBtn.style.transform = "scale(1.09) rotate(1deg)";
            creditsBtn.style.background = "linear-gradient(90deg, #414345 0%, #232526 100%)";
            creditsBtn.style.boxShadow = "0 4px 16px #b2bec3";
            creditsBtn.style.filter = "drop-shadow(0 0 16px #b2bec3)";
        };
        creditsBtn.onmouseout = () => {
            creditsBtn.style.transform = "scale(1)";
            creditsBtn.style.background = "linear-gradient(90deg, #232526 0%, #414345 100%)";
            creditsBtn.style.boxShadow = "0 2px 8px rgba(30,30,30,0.25)";
            creditsBtn.style.filter = "drop-shadow(0 0 8px #b2bec3)";
        };
        // Button entrance animation
        creditsBtn.style.opacity = "0";
        creditsBtn.style.transform = "translateY(30px) scale(0.95)";
        setTimeout(() => {
            creditsBtn.style.opacity = "1";
            creditsBtn.style.transform = "translateY(0) scale(1)";
        }, 900);
        panel.appendChild(creditsBtn);

        // Crédits modal (fade in/out animation)
        const creditsModal = document.createElement("div");
        creditsModal.style.position = "fixed";
        creditsModal.style.top = "0";
        creditsModal.style.left = "0";
        creditsModal.style.width = "100vw";
        creditsModal.style.height = "100vh";
        creditsModal.style.background = "rgba(0,0,0,0.85)";
        creditsModal.style.display = "flex";
        creditsModal.style.flexDirection = "column";
        creditsModal.style.justifyContent = "center";
        creditsModal.style.alignItems = "center";
        creditsModal.style.zIndex = "2000";
        creditsModal.style.visibility = "hidden";
        creditsModal.style.opacity = "0";
        creditsModal.style.transition = "opacity 0.4s cubic-bezier(.77,0,.18,1)";
        document.body.appendChild(creditsModal);

        const creditsContent = document.createElement("div");
        creditsContent.style.background = "rgba(30,40,60,0.98)";
        creditsContent.style.padding = "40px 60px";
        creditsContent.style.borderRadius = "16px";
        creditsContent.style.boxShadow = "0 8px 32px rgba(0,0,0,0.55)";
        creditsContent.style.display = "flex";
        creditsContent.style.flexDirection = "column";
        creditsContent.style.alignItems = "center";
        creditsContent.style.gap = "24px";
        creditsContent.style.transform = "scale(0.92)";
        creditsContent.style.opacity = "0";
        creditsContent.style.transition = "opacity 0.4s cubic-bezier(.77,0,.18,1), transform 0.4s cubic-bezier(.77,0,.18,1)";
        creditsModal.appendChild(creditsContent);

        creditsBtn.onclick = () => {
            creditsModal.style.visibility = "visible";
            setTimeout(() => {
                creditsModal.style.opacity = "1";
                creditsContent.style.opacity = "1";
                creditsContent.style.transform = "scale(1)";
            }, 10);
        };

        // Logo de la fac
        const facLogo = document.createElement("img");
        facLogo.src = "assets/Logo_Universite.png"; // Remplacez par le chemin réel
        facLogo.alt = "Logo Université de Haute-Alsace";
        facLogo.style.width = "200px"; // plus grand
        facLogo.style.marginBottom = "18px";
        creditsContent.appendChild(facLogo);

        // Votre nom
        const yourName = document.createElement("div");
        yourName.innerText = "Développé par : Fouad BENAMARA";
        yourName.style.color = "#fff";
        yourName.style.fontSize = "22px";
        yourName.style.fontWeight = "bold";
        yourName.style.marginBottom = "10px";
        creditsContent.appendChild(yourName);

        // Nom de l'événement
        const eventName = document.createElement("div");
        eventName.innerText = "Événement : GamesOnWeb 2025";
        eventName.style.color = "#fff";
        eventName.style.fontSize = "20px";
        eventName.style.fontWeight = "normal";
        eventName.style.marginBottom = "10px";
        creditsContent.appendChild(eventName);

        // Bouton fermer
        const closeCreditsBtn = document.createElement("button");
        closeCreditsBtn.innerText = "Fermer";
        closeCreditsBtn.style.padding = "10px 30px";
        closeCreditsBtn.style.fontSize = "18px";
        closeCreditsBtn.style.background = "#d32f2f";
        closeCreditsBtn.style.color = "#fff";
        closeCreditsBtn.style.border = "none";
        closeCreditsBtn.style.borderRadius = "8px";
        closeCreditsBtn.style.cursor = "pointer";
        closeCreditsBtn.style.marginTop = "18px";
        closeCreditsBtn.style.transition = "background 0.2s, transform 0.2s";
        closeCreditsBtn.onmouseover = () => {
            closeCreditsBtn.style.background = "#b71c1c";
            closeCreditsBtn.style.transform = "scale(1.08)";
        };
        closeCreditsBtn.onmouseout = () => {
            closeCreditsBtn.style.background = "#d32f2f";
            closeCreditsBtn.style.transform = "scale(1)";
        };
        closeCreditsBtn.onclick = () => {
            creditsModal.style.opacity = "0";
            creditsContent.style.opacity = "0";
            creditsContent.style.transform = "scale(0.92)";
            setTimeout(() => { creditsModal.style.visibility = "hidden"; }, 400);
        };
        creditsContent.appendChild(closeCreditsBtn);

        // === Enemy Info button ===
        const enemyInfoBtn = document.createElement("button");
        enemyInfoBtn.innerHTML = `<span style="margin-right:10px;vertical-align:middle;">🧟‍♂️</span>Infos Ennemis`;
        enemyInfoBtn.style.padding = "16px 48px";
        enemyInfoBtn.style.margin = "10px";
        enemyInfoBtn.style.fontSize = "22px";
        enemyInfoBtn.style.color = "#fff";
        enemyInfoBtn.style.background = "linear-gradient(90deg, #005bea 0%, #3ec6e0 100%)";
        enemyInfoBtn.style.border = "none";
        enemyInfoBtn.style.borderRadius = "14px";
        enemyInfoBtn.style.cursor = "pointer";
        enemyInfoBtn.style.fontWeight = "bold";
        enemyInfoBtn.style.boxShadow = "0 4px 18px rgba(30,30,100,0.25)";
        enemyInfoBtn.style.transition = "transform 0.2s, box-shadow 0.2s, background 0.2s, filter 0.2s";
        enemyInfoBtn.style.filter = "drop-shadow(0 0 10px #b2bec3)";
        enemyInfoBtn.onmouseover = () => {
            enemyInfoBtn.style.transform = "scale(1.11) rotate(-2deg)";
            enemyInfoBtn.style.background = "linear-gradient(90deg, #3ec6e0 0%, #005bea 100%)";
            enemyInfoBtn.style.boxShadow = "0 8px 32px #b2bec3";
            enemyInfoBtn.style.filter = "drop-shadow(0 0 20px #b2bec3)";
        };
        enemyInfoBtn.onmouseout = () => {
            enemyInfoBtn.style.transform = "scale(1)";
            enemyInfoBtn.style.background = "linear-gradient(90deg, #005bea 0%, #3ec6e0 100%)";
            enemyInfoBtn.style.boxShadow = "0 4px 18px rgba(30,30,100,0.25)";
            enemyInfoBtn.style.filter = "drop-shadow(0 0 10px #b2bec3)";
        };
        enemyInfoBtn.style.opacity = "0";
        enemyInfoBtn.style.transform = "translateY(30px) scale(0.95)";
        setTimeout(() => {
            enemyInfoBtn.style.opacity = "1";
            enemyInfoBtn.style.transform = "translateY(0) scale(1)";
        }, 800);
        panel.appendChild(enemyInfoBtn);

        // === Enemy Info Modal ===
        const enemyInfoModal = document.createElement("div");
        enemyInfoModal.style.position = "fixed";
        enemyInfoModal.style.top = "0";
        enemyInfoModal.style.left = "0";
        enemyInfoModal.style.width = "100vw";
        enemyInfoModal.style.height = "100vh";
        enemyInfoModal.style.background = "rgba(0,0,0,0.92)";
        enemyInfoModal.style.display = "flex";
        enemyInfoModal.style.flexDirection = "column";
        enemyInfoModal.style.justifyContent = "center";
        enemyInfoModal.style.alignItems = "center";
        enemyInfoModal.style.zIndex = "2100";
        enemyInfoModal.style.visibility = "hidden";
        enemyInfoModal.style.opacity = "0";
        enemyInfoModal.style.transition = "opacity 0.4s cubic-bezier(.77,0,.18,1)";
        document.body.appendChild(enemyInfoModal);

        const enemyInfoContent = document.createElement("div");
        enemyInfoContent.style.background = "linear-gradient(135deg, #232526 0%, #414345 100%)";
        enemyInfoContent.style.padding = "48px 70px";
        enemyInfoContent.style.borderRadius = "22px";
        enemyInfoContent.style.boxShadow = "0 12px 48px rgba(0,0,0,0.65)";
        enemyInfoContent.style.display = "flex";
        enemyInfoContent.style.flexDirection = "column";
        enemyInfoContent.style.alignItems = "center";
        enemyInfoContent.style.gap = "32px";
        enemyInfoContent.style.transform = "scale(0.92)";
        enemyInfoContent.style.opacity = "0";
        enemyInfoContent.style.transition = "opacity 0.4s cubic-bezier(.77,0,.18,1), transform 0.4s cubic-bezier(.77,0,.18,1)";
        enemyInfoModal.appendChild(enemyInfoContent);

        // Title with icon
        const enemyInfoTitle = document.createElement("h2");
        enemyInfoTitle.innerHTML = `<span style="font-size:36px;vertical-align:middle;margin-right:10px;">🧟‍♂️</span>Ennemis`;
        enemyInfoTitle.style.color = "#fff";
        enemyInfoTitle.style.fontSize = "36px";
        enemyInfoTitle.style.marginBottom = "10px";
        enemyInfoTitle.style.textAlign = "center";
        enemyInfoTitle.style.letterSpacing = "2px";
        enemyInfoContent.appendChild(enemyInfoTitle);

        // Enemy data
        const enemies = [
            {
                name: "Slime",
                img: "assets/enemies/slime.png",
                desc: "Un fantôme basique, lent mais nombreux.",
                health: 10,
                speed: 10,
                icon: "🟢"
            },
            {
                name: "Bunny",
                img: "assets/enemies/bunny.png",
                desc: "Fantôme lapin, rapide et agile, il bondit vers la sortie.",
                health: 20,
                speed: 10,
                icon: "🐰"
            },
            {
                name: "Knight",
                img: "assets/enemies/knight.png",
                desc: "Fantôme chevalier, protégé par une armure, il résiste mieux.",
                health: 20,
                speed: 12,
                icon: "🛡️"
            },
            {
                name: "Viking",
                img: "assets/enemies/viking.png",
                desc: "Fantôme viking, robuste et déterminé.",
                health: 30,
                speed: 12,
                icon: "⚔️"
            },
            {
                name: "Small Leaf",
                img: "assets/enemies/smallleaf.png",
                desc: "Petit fantôme feuillu, discret mais rapide.",
                health: 30,
                speed: 12,
                icon: "🍃"
            },
            {
                name: "Big Leaf",
                img: "assets/enemies/bigleaf.png",
                desc: "Grand fantôme feuillu, très résistant.",
                health: 40,
                speed: 15,
                icon: "🌿"
            },
            {
                name: "King",
                img: "assets/enemies/king.png",
                desc: "Le roi des fantômes, rapide et dangereux.",
                health: 40,
                speed: 18,
                icon: "👑"
            },
            {
                name: "Big King",
                img: "assets/enemies/bigking.png",
                desc: "Le boss final, un fantôme colossal et extrêmement résistant.",
                health: 400,
                speed: 6,
                icon: "🦁"
            }
        ];

        // Enemy list container
        const enemyList = document.createElement("div");
        enemyList.style.display = "flex";
        enemyList.style.flexDirection = "column";
        enemyList.style.justifyContent = "center";
        enemyList.style.alignItems = "center";
        enemyList.style.gap = "18px";
        enemyList.style.marginTop = "10px";
        enemyInfoContent.appendChild(enemyList);

        // Split enemies in two rows of 4
        const topRow = document.createElement("div");
        topRow.style.display = "flex";
        topRow.style.flexDirection = "row";
        topRow.style.justifyContent = "center";
        topRow.style.alignItems = "center";
        topRow.style.gap = "18px";
        enemyList.appendChild(topRow);

        const bottomRow = document.createElement("div");
        bottomRow.style.display = "flex";
        bottomRow.style.flexDirection = "row";
        bottomRow.style.justifyContent = "center";
        bottomRow.style.alignItems = "center";
        bottomRow.style.gap = "18px";
        enemyList.appendChild(bottomRow);

        enemies.forEach((enemy, idx) => {
            const card = document.createElement("div");
            card.style.display = "flex";
            card.style.flexDirection = "column";
            card.style.alignItems = "center";
            card.style.background = "linear-gradient(135deg, #1e2838 0%, #2c3e50 100%)";
            card.style.borderRadius = "12px";
            card.style.padding = "12px 10px";
            card.style.width = "120px";
            card.style.boxShadow = "0 2px 10px rgba(0,0,0,0.25)";
            card.style.transition = "transform 0.18s, box-shadow 0.18s";
            card.onmouseover = () => {
                card.style.transform = "scale(1.06)";
                card.style.boxShadow = "0 4px 18px #3ec6e0";
            };
            card.onmouseout = () => {
                card.style.transform = "scale(1)";
                card.style.boxShadow = "0 2px 10px rgba(0,0,0,0.25)";
            };

            // Icon
            const icon = document.createElement("div");
            icon.innerText = enemy.icon;
            icon.style.fontSize = "26px";
            icon.style.marginBottom = "2px";
            card.appendChild(icon);

            // Image
            const img = document.createElement("img");
            img.src = enemy.img;
            img.alt = enemy.name;
            img.style.width = "60px";
            img.style.height = "60px";
            img.style.objectFit = "contain";
            img.style.marginBottom = "6px";
            img.style.borderRadius = "8px";
            img.style.boxShadow = "0 1px 6px #005bea33";
            card.appendChild(img);

            // Name
            const name = document.createElement("div");
            name.innerText = enemy.name;
            name.style.color = "#fff";
            name.style.fontWeight = "bold";
            name.style.fontSize = "15px";
            name.style.marginBottom = "2px";
            name.style.letterSpacing = "0.5px";
            card.appendChild(name);

            // Stats
            const stats = document.createElement("div");
            stats.style.display = "flex";
            stats.style.justifyContent = "center";
            stats.style.alignItems = "center";
            stats.style.gap = "6px";
            stats.style.marginBottom = "3px";
            stats.innerHTML = `
                <span title="Vie" style="color:#ff5252;font-size:13px;vertical-align:middle;">❤️</span>
                <span style="color:#fff;font-size:12px;">${enemy.health}</span>
                <span title="Vitesse" style="color:#00e6e6;font-size:13px;vertical-align:middle;margin-left:5px;">⚡</span>
                <span style="color:#fff;font-size:12px;">${enemy.speed}</span>
            `;
            card.appendChild(stats);

            // Description
            const desc = document.createElement("div");
            desc.innerText = enemy.desc;
            desc.style.color = "#b2bec3";
            desc.style.fontSize = "11px";
            desc.style.textAlign = "center";
            desc.style.marginBottom = "1px";
            card.appendChild(desc);

            if (idx < 4) {
                topRow.appendChild(card);
            } else {
                bottomRow.appendChild(card);
            }
        });

        // Close button
        const closeEnemyInfoBtn = document.createElement("button");
        closeEnemyInfoBtn.innerHTML = `<span style="font-size:18px;vertical-align:middle;margin-right:6px;">✖️</span>Fermer`;
        closeEnemyInfoBtn.style.padding = "12px 36px";
        closeEnemyInfoBtn.style.fontSize = "20px";
        closeEnemyInfoBtn.style.background = "linear-gradient(90deg, #d32f2f 0%, #b71c1c 100%)";
        closeEnemyInfoBtn.style.color = "#fff";
        closeEnemyInfoBtn.style.border = "none";
        closeEnemyInfoBtn.style.borderRadius = "10px";
        closeEnemyInfoBtn.style.cursor = "pointer";
        closeEnemyInfoBtn.style.marginTop = "22px";
        closeEnemyInfoBtn.style.transition = "background 0.2s, transform 0.2s";
        closeEnemyInfoBtn.onmouseover = () => {
            closeEnemyInfoBtn.style.background = "linear-gradient(90deg, #b71c1c 0%, #d32f2f 100%)";
            closeEnemyInfoBtn.style.transform = "scale(1.08)";
        };
        closeEnemyInfoBtn.onmouseout = () => {
            closeEnemyInfoBtn.style.background = "linear-gradient(90deg, #d32f2f 0%, #b71c1c 100%)";
            closeEnemyInfoBtn.style.transform = "scale(1)";
        };
        closeEnemyInfoBtn.onclick = () => {
            enemyInfoModal.style.opacity = "0";
            enemyInfoContent.style.opacity = "0";
            enemyInfoContent.style.transform = "scale(0.92)";
            setTimeout(() => { enemyInfoModal.style.visibility = "hidden"; }, 400);
        };
        enemyInfoContent.appendChild(closeEnemyInfoBtn);

        // Open modal on button click
        enemyInfoBtn.onclick = () => {
            enemyInfoModal.style.visibility = "visible";
            setTimeout(() => {
                enemyInfoModal.style.opacity = "1";
                enemyInfoContent.style.opacity = "1";
                enemyInfoContent.style.transform = "scale(1)";
            }, 10);
        };

        // Add animated particles in menu background
        function createAnimatedParticle() {
            const p = document.createElement("div");
            const size = Math.random() * 10 + 8;
            p.style.position = "absolute";
            p.style.left = Math.random() * 100 + "vw";
            p.style.top = Math.random() * 100 + "vh";
            p.style.width = size + "px";
            p.style.height = size + "px";
            p.style.borderRadius = "50%";
            p.style.background = "radial-gradient(circle, #baffc9 0%, #57d600 80%, transparent 100%)";
            p.style.opacity = "0.18";
            p.style.pointerEvents = "none";
            p.style.zIndex = "-2";
            p.style.transition = "opacity 1s";
            menuContainer.appendChild(p);

            // Animate
            const duration = Math.random() * 4000 + 4000;
            const startX = Math.random() * 100;
            const endX = startX + (Math.random() - 0.5) * 30;
            const startY = Math.random() * 100;
            const endY = startY + (Math.random() - 0.5) * 30;
            p.animate([
                { left: `${startX}vw`, top: `${startY}vh`, opacity: 0.18 },
                { left: `${endX}vw`, top: `${endY}vh`, opacity: 0.05 }
            ], {
                duration: duration,
                easing: "ease-in-out"
            });
            setTimeout(() => {
                menuContainer.removeChild(p);
            }, duration);
        }
        setInterval(() => {
            if (document.body.contains(menuContainer)) createAnimatedParticle();
        }, 600);

        // Add mouse effect (keep as before)
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
            const size = 20;
            mouseEffect.style.left = `${event.clientX - size / 2}px`;
            mouseEffect.style.top = `${event.clientY - size / 2}px`;
            mouseEffect.style.opacity = "1";

            const particle = document.createElement("div");
            const particleSize = Math.random() * 6 + 4;
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

            const offsetX = (Math.random() - 0.5) * 30;
            const offsetY = (Math.random() - 0.5) * 30;
            requestAnimationFrame(() => {
                particle.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                particle.style.opacity = "0";
            });

            menuContainer.appendChild(particle);
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
