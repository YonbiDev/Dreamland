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
        title.style.marginBottom = "20.9px"; // 19px * 1.1
        title.style.fontSize = "45.1px"; // 41px * 1.1
        title.style.letterSpacing = "2.816px"; // 2.56px * 1.1
        title.style.fontFamily = "'Segoe UI', Arial, sans-serif";
        title.style.textShadow = "0 6.6px 27.5px #000, 0 1.76px 10.56px #1a1a1a";
        title.style.fontWeight = "bold";
        title.style.textAlign = "center";
        title.style.textTransform = "uppercase";
        title.style.opacity = "0";
        title.style.transform = "translateY(-35.2px) scale(0.95)"; // 32px * 1.1
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
        panel.style.padding = "28.6px 41.8px"; // 26px 38px * 1.1
        panel.style.borderRadius = "12.1px"; // 11px * 1.1
        panel.style.boxShadow = "0 5.28px 22.88px rgba(0,0,0,0.45)"; // 4.8px 20.8px * 1.1
        panel.style.gap = "16.5px"; // 15px * 1.1
        panel.style.opacity = "0";
        panel.style.transform = "translateY(35.2px) scale(0.97)"; // 32px * 1.1
        panel.style.transition = "opacity 1.2s cubic-bezier(.77,0,.18,1) 0.2s, transform 1.2s cubic-bezier(.77,0,.18,1) 0.2s";
        menuContainer.appendChild(panel);

        setTimeout(() => {
            panel.style.opacity = "1";
            panel.style.transform = "translateY(0) scale(1)";
        }, 400);

        // Nouvelle Partie button
        const newGameBtn = document.createElement("button");
        newGameBtn.innerText = "Nouvelle Partie";
        newGameBtn.style.padding = "12.1px 33px"; // 11px 30px * 1.1
        newGameBtn.style.margin = "6.6px"; // 6px * 1.1
        newGameBtn.style.fontSize = "13.2px"; // 12px * 1.1
        newGameBtn.style.color = "#fff";
        newGameBtn.style.background = "linear-gradient(90deg, #1e9600 0%, #57d600 100%)";
        newGameBtn.style.border = "none";
        newGameBtn.style.borderRadius = "6.6px"; // 6px * 1.1
        newGameBtn.style.cursor = "pointer";
        newGameBtn.style.fontWeight = "bold";
        newGameBtn.style.boxShadow = "0 2.816px 11.264px rgba(30,150,0,0.25)"; // 2.56px 10.24px * 1.1
        newGameBtn.style.transition = "transform 0.2s, box-shadow 0.2s, background 0.2s, filter 0.2s";
        newGameBtn.style.filter = "drop-shadow(0 0 5.632px #baffc9)"; // 5.12px * 1.1
        newGameBtn.onmouseover = () => {
            newGameBtn.style.transform = "scale(1.12) rotate(-2deg)";
            newGameBtn.style.background = "linear-gradient(90deg, #57d600 0%, #1e9600 100%)";
            newGameBtn.style.boxShadow = "0 5.632px 22.528px 0 #baffc9"; // 5.12px 20.48px * 1.1
            newGameBtn.style.filter = "drop-shadow(0 0 12.672px #baffc9)"; // 11.52px * 1.1
        };
        newGameBtn.onmouseout = () => {
            newGameBtn.style.transform = "scale(1)";
            newGameBtn.style.background = "linear-gradient(90deg, #1e9600 0%, #57d600 100%)";
            newGameBtn.style.boxShadow = "0 2.816px 11.264px rgba(30,150,0,0.25)";
            newGameBtn.style.filter = "drop-shadow(0 0 5.632px #baffc9)";
        };
        newGameBtn.style.opacity = "0";
        newGameBtn.style.transform = "translateY(26.4px) scale(0.95)"; // 24px * 1.1
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
        creditsBtn.style.padding = "9.68px 26.4px"; // 8.8px 24px * 1.1
        creditsBtn.style.margin = "6.6px"; // 6px * 1.1
        creditsBtn.style.fontSize = "11px"; // 10px * 1.1
        creditsBtn.style.color = "#fff";
        creditsBtn.style.background = "linear-gradient(90deg, #232526 0%, #414345 100%)";
        creditsBtn.style.border = "none";
        creditsBtn.style.borderRadius = "5.5px"; // 5px * 1.1
        creditsBtn.style.cursor = "pointer";
        creditsBtn.style.fontWeight = "bold";
        creditsBtn.style.boxShadow = "0 1.408px 5.632px rgba(30,30,30,0.25)"; // 1.28px 5.12px * 1.1
        creditsBtn.style.transition = "transform 0.2s, box-shadow 0.2s, background 0.2s, filter 0.2s";
        creditsBtn.style.filter = "drop-shadow(0 0 5.632px #b2bec3)";
        creditsBtn.onmouseover = () => {
            creditsBtn.style.transform = "scale(1.09) rotate(1deg)";
            creditsBtn.style.background = "linear-gradient(90deg, #414345 0%, #232526 100%)";
            creditsBtn.style.boxShadow = "0 2.816px 11.264px #b2bec3";
            creditsBtn.style.filter = "drop-shadow(0 0 11.264px #b2bec3)";
        };
        creditsBtn.onmouseout = () => {
            creditsBtn.style.transform = "scale(1)";
            creditsBtn.style.background = "linear-gradient(90deg, #232526 0%, #414345 100%)";
            creditsBtn.style.boxShadow = "0 1.408px 5.632px rgba(30,30,30,0.25)";
            creditsBtn.style.filter = "drop-shadow(0 0 5.632px #b2bec3)";
        };
        creditsBtn.style.opacity = "0";
        creditsBtn.style.transform = "translateY(26.4px) scale(0.95)";
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
        creditsContent.style.padding = "22px 33px"; // 20px 30px * 1.1
        creditsContent.style.borderRadius = "8.8px"; // 8px * 1.1
        creditsContent.style.boxShadow = "0 4.224px 18.304px rgba(0,0,0,0.55)"; // 3.84px 16.64px * 1.1
        creditsContent.style.gap = "13.2px"; // 12px * 1.1
        creditsContent.style.display = "flex";
        creditsContent.style.flexDirection = "column";
        creditsContent.style.alignItems = "center";
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
        facLogo.src = "assets/Logo_Universite.png";
        facLogo.alt = "Logo Université de Haute-Alsace";
        facLogo.style.width = "112.2px"; // 102px * 1.1
        facLogo.style.marginBottom = "9.9px"; // 9px * 1.1
        creditsContent.appendChild(facLogo);

        // Votre nom
        const yourName = document.createElement("div");
        yourName.innerText = "Développé par : Fouad BENAMARA";
        yourName.style.color = "#fff";
        yourName.style.fontSize = "12.65px"; // 11.5px * 1.1
        yourName.style.fontWeight = "bold";
        yourName.style.marginBottom = "6.6px"; // 6px * 1.1
        creditsContent.appendChild(yourName);

        // Nom de l'événement
        const eventName = document.createElement("div");
        eventName.innerText = "Événement : GamesOnWeb 2025";
        eventName.style.color = "#fff";
        eventName.style.fontSize = "11px"; // 10px * 1.1
        eventName.style.fontWeight = "normal";
        eventName.style.marginBottom = "6.6px"; // 6px * 1.1
        creditsContent.appendChild(eventName);

        // Bouton fermer
        const closeCreditsBtn = document.createElement("button");
        closeCreditsBtn.innerText = "Fermer";
        closeCreditsBtn.style.padding = "5.5px 16.5px"; // 5px 15px * 1.1
        closeCreditsBtn.style.fontSize = "9.9px"; // 9px * 1.1
        closeCreditsBtn.style.borderRadius = "4.18px"; // 3.8px * 1.1
        closeCreditsBtn.style.marginTop = "9.9px"; // 9px * 1.1
        closeCreditsBtn.style.background = "#d32f2f";
        closeCreditsBtn.style.color = "#fff";
        closeCreditsBtn.style.border = "none";
        closeCreditsBtn.style.cursor = "pointer";
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
        enemyInfoBtn.innerHTML = `<span style="margin-right:6.6px;vertical-align:middle;">🧟‍♂️</span>Infos Ennemis`; // 6px * 1.1
        enemyInfoBtn.style.padding = "8.8px 26.4px"; // 8px 24px * 1.1
        enemyInfoBtn.style.margin = "6.6px";
        enemyInfoBtn.style.fontSize = "11.99px"; // 10.9px * 1.1
        enemyInfoBtn.style.color = "#fff";
        enemyInfoBtn.style.background = "linear-gradient(90deg, #005bea 0%, #3ec6e0 100%)";
        enemyInfoBtn.style.border = "none";
        enemyInfoBtn.style.borderRadius = "7.7px"; // 7px * 1.1
        enemyInfoBtn.style.cursor = "pointer";
        enemyInfoBtn.style.fontWeight = "bold";
        enemyInfoBtn.style.boxShadow = "0 2.816px 12.672px rgba(30,30,100,0.25)"; // 2.56px 11.52px * 1.1
        enemyInfoBtn.style.transition = "transform 0.2s, box-shadow 0.2s, background 0.2s, filter 0.2s";
        enemyInfoBtn.style.filter = "drop-shadow(0 0 7.04px #b2bec3)"; // 6.4px * 1.1
        enemyInfoBtn.onmouseover = () => {
            enemyInfoBtn.style.transform = "scale(1.11) rotate(-2deg)";
            enemyInfoBtn.style.background = "linear-gradient(90deg, #3ec6e0 0%, #005bea 100%)";
            enemyInfoBtn.style.boxShadow = "0 5.632px 22.528px #b2bec3";
            enemyInfoBtn.style.filter = "drop-shadow(0 0 14.08px #b2bec3)";
        };
        enemyInfoBtn.onmouseout = () => {
            enemyInfoBtn.style.transform = "scale(1)";
            enemyInfoBtn.style.background = "linear-gradient(90deg, #005bea 0%, #3ec6e0 100%)";
            enemyInfoBtn.style.boxShadow = "0 2.816px 12.672px rgba(30,30,100,0.25)";
            enemyInfoBtn.style.filter = "drop-shadow(0 0 7.04px #b2bec3)";
        };
        enemyInfoBtn.style.opacity = "0";
        enemyInfoBtn.style.transform = "translateY(26.4px) scale(0.95)";
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
        enemyInfoContent.style.padding = "26.4px 39.6px"; // 24px 36px * 1.1
        enemyInfoContent.style.borderRadius = "12.65px"; // 11.5px * 1.1
        enemyInfoContent.style.boxShadow = "0 7.04px 26.752px rgba(0,0,0,0.65)"; // 6.4px 24.32px * 1.1
        enemyInfoContent.style.gap = "18.26px"; // 16.6px * 1.1
        enemyInfoContent.style.display = "flex";
        enemyInfoContent.style.flexDirection = "column";
        enemyInfoContent.style.alignItems = "center";
        enemyInfoContent.style.transition = "opacity 0.4s cubic-bezier(.77,0,.18,1), transform 0.4s cubic-bezier(.77,0,.18,1)";
        enemyInfoModal.appendChild(enemyInfoContent);

        // Title with icon
        const enemyInfoTitle = document.createElement("h2");
        enemyInfoTitle.innerHTML = `<span style="font-size:20.46px;vertical-align:middle;margin-right:5.5px;">🧟‍♂️</span>Ennemis`; // 18.6px * 1.1, 5px * 1.1
        enemyInfoTitle.style.fontSize = "20.46px"; // 18.6px * 1.1
        enemyInfoTitle.style.marginBottom = "5.5px"; // 5px * 1.1
        enemyInfoTitle.style.letterSpacing = "1.1px"; // 1px * 1.1
        enemyInfoTitle.style.color = "#fff";
        enemyInfoTitle.style.textAlign = "center";
        enemyInfoTitle.style.fontWeight = "bold";
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
                health: 1000,
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
        enemyList.style.width = "100%";
        enemyList.style.gap = "12.65px"; // 11.5px * 1.1
        enemyInfoContent.appendChild(enemyList);

        // Split enemies in two rows of 4, but use a grid for better look
        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "repeat(4, 1fr)";
        grid.style.gap = "19.8px"; // 18px * 1.1
        grid.style.justifyItems = "center";
        grid.style.alignItems = "center";
        grid.style.width = "100%";
        grid.style.maxWidth = "492.8px"; // 448px * 1.1
        enemyList.appendChild(grid);

        // Couleurs de bordure pour chaque ennemi (palette douce)
        const borderColors = [
            "#7cffb2", // Slime
            "#ffe082", // Bunny
            "#b2bec3", // Knight
            "#ffbfae", // Viking
            "#aee9ff", // Small Leaf
            "#baffc9", // Big Leaf
            "#ffd6e0", // King
            "#ffd700"  // Big King
        ];

        enemies.forEach((enemy, idx) => {
            const card = document.createElement("div");
            card.style.position = "relative";
            card.style.padding = "12.65px 8.47px 11.22px 8.47px"; // 11.5px 7.7px 10.2px 7.7px * 1.1
            card.style.width = "118.25px"; // 107.5px * 1.1
            card.style.height = "169px"; // 153.6px * 1.1
            card.style.maxWidth = "118.25px";
            card.style.borderRadius = "12.65px"; // 11.5px * 1.1
            card.style.background = "linear-gradient(135deg, #1e2838 0%, #2c3e50 100%)";
            card.style.boxShadow = "0 2.816px 12.672px 0 rgba(0,0,0,0.32)"; // 2.56px 11.52px * 1.1
            card.style.border = `1.76px solid ${borderColors[idx % borderColors.length]}`; // 1.6px * 1.1
            card.style.display = "flex";
            card.style.flexDirection = "column";
            card.style.alignItems = "center";
            card.style.justifyContent = "flex-start";
            card.style.transition = "transform 0.22s cubic-bezier(.77,0,.18,1), box-shadow 0.22s, border-color 0.22s";
            card.style.cursor = "pointer";
            card.style.opacity = "0";
            card.style.transform = "scale(0.92) translateY(20.9px)"; // 19px * 1.1
            card.style.overflow = "hidden";
            setTimeout(() => {
                card.style.opacity = "1";
                card.style.transform = "scale(1) translateY(0)";
            }, 100 + idx * 80);

            card.onmouseover = () => {
                card.style.transform = "scale(1.08) translateY(-2.86px)"; // 2.6px * 1.1
                card.style.boxShadow = `0 5.632px 22.528px 0 ${borderColors[idx % borderColors.length]}88`;
                card.style.borderColor = "#fff";
            };
            card.onmouseout = () => {
                card.style.transform = "scale(1) translateY(0)";
                card.style.boxShadow = "0 2.816px 12.672px 0 rgba(0,0,0,0.32)";
                card.style.borderColor = borderColors[idx % borderColors.length];
            };

            // Icon in a colored circle
            const iconCircle = document.createElement("div");
            iconCircle.style.width = "33.77px"; // 30.7px * 1.1
            iconCircle.style.height = "33.77px";
            iconCircle.style.borderRadius = "50%";
            iconCircle.style.background = `${borderColors[idx % borderColors.length]}22`;
            iconCircle.style.display = "flex";
            iconCircle.style.alignItems = "center";
            iconCircle.style.justifyContent = "center";
            iconCircle.style.marginBottom = "4.18px"; // 3.8px * 1.1
            iconCircle.style.boxShadow = `0 1.408px 5.632px ${borderColors[idx % borderColors.length]}55`;
            iconCircle.style.fontSize = "18.26px"; // 16.6px * 1.1
            iconCircle.innerText = enemy.icon;
            card.appendChild(iconCircle);

            // Enemy image in a circle
            const imgCircle = document.createElement("div");
            imgCircle.style.width = "43.67px"; // 39.7px * 1.1
            imgCircle.style.height = "43.67px";
            imgCircle.style.borderRadius = "50%";
            imgCircle.style.background = "#222c3a";
            imgCircle.style.display = "flex";
            imgCircle.style.alignItems = "center";
            imgCircle.style.justifyContent = "center";
            imgCircle.style.marginBottom = "5.61px"; // 5.1px * 1.1
            imgCircle.style.boxShadow = "0 0.704px 5.632px #005bea33";
            const img = document.createElement("img");
            img.style.width = "31.02px"; // 28.2px * 1.1
            img.style.height = "31.02px";
            img.style.objectFit = "contain";
            img.style.borderRadius = "50%";
            img.src = enemy.img;
            img.alt = enemy.name;
            imgCircle.appendChild(img);
            card.appendChild(imgCircle);

            // Name
            const name = document.createElement("div");
            name.style.fontSize = "10.56px"; // 9.6px * 1.1
            name.style.color = "#fff";
            name.style.fontWeight = "bold";
            name.style.marginBottom = "2.86px"; // 2.6px * 1.1
            name.style.letterSpacing = "0.495px"; // 0.45px * 1.1
            name.style.textAlign = "center";
            name.innerText = enemy.name;
            card.appendChild(name);

            // Stats (centered, with icons)
            const stats = document.createElement("div");
            stats.style.display = "flex";
            stats.style.justifyContent = "center";
            stats.style.alignItems = "center";
            stats.style.gap = "7.04px"; // 6.4px * 1.1
            stats.style.marginBottom = "2.86px"; // 2.6px * 1.1
            stats.innerHTML = `
                <span title="Vie" style="color:#ff5252;font-size:10.56px;vertical-align:middle;">❤️</span>
                <span style="color:#fff;font-size:9.13px;font-weight:bold;">${enemy.health}</span>
                <span title="Vitesse" style="color:#00e6e6;font-size:10.56px;vertical-align:middle;margin-left:4.18px;">⚡</span>
                <span style="color:#fff;font-size:9.13px;font-weight:bold;">${enemy.speed}</span>
            `;
            card.appendChild(stats);

            // Separator
            const sep = document.createElement("div");
            sep.style.width = "60%";
            sep.style.height = "1.1px"; // 1px * 1.1
            sep.style.background = "#b2bec355";
            sep.style.margin = "2.86px 0 4.18px 0"; // 2.6px 0 3.8px 0 * 1.1
            card.appendChild(sep);

            // Description
            const desc = document.createElement("div");
            desc.style.fontSize = "7.7px"; // 7px * 1.1
            desc.style.color = "#b2bec3";
            desc.style.textAlign = "center";
            desc.style.lineHeight = "1.3";
            desc.style.marginBottom = "1.43px"; // 1.3px * 1.1
            desc.style.wordBreak = "break-word";
            desc.style.overflowWrap = "break-word";
            desc.style.maxWidth = "104.17px"; // 94.7px * 1.1
            desc.innerText = enemy.desc;
            card.appendChild(desc);

            grid.appendChild(card);
        });

        // Close button
        const closeEnemyInfoBtn = document.createElement("button");
        closeEnemyInfoBtn.innerHTML = `<span style="font-size:10.89px;vertical-align:middle;margin-right:3.52px;">✖️</span>Fermer`; // 9.9px * 1.1, 3.2px * 1.1
        closeEnemyInfoBtn.style.padding = "7.04px 20.46px"; // 6.4px 18.6px * 1.1
        closeEnemyInfoBtn.style.fontSize = "11.22px"; // 10.2px * 1.1
        closeEnemyInfoBtn.style.borderRadius = "5.61px"; // 5.1px * 1.1
        closeEnemyInfoBtn.style.marginTop = "12.65px"; // 11.5px * 1.1
        closeEnemyInfoBtn.style.background = "linear-gradient(90deg, #d32f2f 0%, #b71c1c 100%)";
        closeEnemyInfoBtn.style.color = "#fff";
        closeEnemyInfoBtn.style.border = "none";
        closeEnemyInfoBtn.style.cursor = "pointer";
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
            const size = (Math.random() * 10 + 8) * 0.8; // -20%
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
        mouseEffect.style.width = "16px"; // -20%
        mouseEffect.style.height = "16px"; // -20%
        mouseEffect.style.borderRadius = "50%";
        mouseEffect.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
        mouseEffect.style.pointerEvents = "none";
        mouseEffect.style.transition = "transform 0.1s, opacity 0.1s";
        menuContainer.appendChild(mouseEffect);

        menuContainer.onmouseleave = () => {
            mouseEffect.style.opacity = "0";
        };

        menuContainer.onmousemove = (event) => {
            const size = 16; // -20%
            mouseEffect.style.left = `${event.clientX - size / 2}px`;
            mouseEffect.style.top = `${event.clientY - size / 2}px`;
            mouseEffect.style.opacity = "1";

            const particle = document.createElement("div");
            const particleSize = (Math.random() * 6 + 4) * 0.8; // -20%
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
