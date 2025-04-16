export class WaypointEditor {
    private scene: BABYLON.Scene;
    private waypoints: BABYLON.Vector3[] = [];
    private spawnPositions: BABYLON.Vector3[] = [];
    private isPlacingWaypoints: boolean = false;
    private isPlacingSpawns: boolean = false;
    private level: number = 1; // Default level
    private spawnPositionNumber: number = 1; // Default spawn position number
    private spawnLabel: string = "default"; // Default spawn label
    private waypointsByLevelAndSpawn: Map<string, BABYLON.Vector3[][]> = new Map(); // Map "level_spawn" to lists of waypoints
    private spawnToWaypoints: Map<string, BABYLON.Vector3[]> = new Map(); // Map spawn label to waypoints
    private waypointListIndex: number = 0; // Default waypoint list index

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this.setupUI();
        this.setupMouseEvents();
        this.displayExistingData();
    }

    private setupUI(): void {
        // Conteneur principal pour les contrôles
        const controlPanel = document.createElement("div");
        controlPanel.style.position = "absolute";
        controlPanel.style.bottom = "20px";
        controlPanel.style.left = "20px";
        controlPanel.style.padding = "20px";
        controlPanel.style.backgroundColor = "#1e1e2f"; // Couleur de fond sombre
        controlPanel.style.color = "#ffffff"; // Texte blanc
        controlPanel.style.borderRadius = "10px";
        controlPanel.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
        controlPanel.style.maxWidth = "320px";
        controlPanel.style.fontFamily = "Arial, sans-serif";
        document.body.appendChild(controlPanel);

        // Titre du panneau
        const panelTitle = document.createElement("h3");
        panelTitle.innerText = "Waypoint & Spawn Editor";
        panelTitle.style.marginBottom = "15px";
        panelTitle.style.textAlign = "center";
        panelTitle.style.color = "#4CAF50"; // Vert pour le titre
        controlPanel.appendChild(panelTitle);

        // Section pour sélectionner le niveau
        const levelLabel = document.createElement("label");
        levelLabel.innerText = "Select Level:";
        levelLabel.style.display = "block";
        levelLabel.style.marginBottom = "5px";
        levelLabel.style.color = "#FF9800"; // Orange pour les labels
        controlPanel.appendChild(levelLabel);

        const levelSelector = document.createElement("select");
        levelSelector.style.width = "100%";
        levelSelector.style.padding = "8px";
        levelSelector.style.marginBottom = "15px";
        levelSelector.style.border = "1px solid #555";
        levelSelector.style.borderRadius = "5px";
        levelSelector.style.backgroundColor = "#333";
        levelSelector.style.color = "#fff";
        levelSelector.onchange = (e) => {
            this.level = parseInt((e.target as HTMLSelectElement).value, 10);
            console.log(`Level selected: ${this.level}`);
        };
        for (let i = 1; i <= 10; i++) {
            const option = document.createElement("option");
            option.value = i.toString();
            option.innerText = `Level ${i}`;
            levelSelector.appendChild(option);
        }
        controlPanel.appendChild(levelSelector);

        // Section pour sélectionner le spawn
        const spawnLabel = document.createElement("label");
        spawnLabel.innerText = "Select Spawn Point:";
        spawnLabel.style.display = "block";
        spawnLabel.style.marginBottom = "5px";
        spawnLabel.style.color = "#FF9800";
        controlPanel.appendChild(spawnLabel);

        const spawnSelector = document.createElement("select");
        spawnSelector.style.width = "100%";
        spawnSelector.style.padding = "8px";
        spawnSelector.style.marginBottom = "15px";
        spawnSelector.style.border = "1px solid #555";
        spawnSelector.style.borderRadius = "5px";
        spawnSelector.style.backgroundColor = "#333";
        spawnSelector.style.color = "#fff";
        spawnSelector.onchange = (e) => {
            this.spawnPositionNumber = parseInt((e.target as HTMLSelectElement).value, 10);
            console.log(`Spawn position selected: ${this.spawnPositionNumber}`);
        };
        for (let i = 1; i <= 10; i++) {
            const option = document.createElement("option");
            option.value = i.toString();
            option.innerText = `Spawn ${i}`;
            spawnSelector.appendChild(option);
        }
        controlPanel.appendChild(spawnSelector);

        // Section pour sélectionner la liste de waypoints
        const waypointListLabel = document.createElement("label");
        waypointListLabel.innerText = "Select Waypoint List:";
        waypointListLabel.style.display = "block";
        waypointListLabel.style.marginBottom = "5px";
        waypointListLabel.style.color = "#FF9800";
        controlPanel.appendChild(waypointListLabel);

        const waypointListSelector = document.createElement("select");
        waypointListSelector.style.width = "100%";
        waypointListSelector.style.padding = "8px";
        waypointListSelector.style.marginBottom = "15px";
        waypointListSelector.style.border = "1px solid #555";
        waypointListSelector.style.borderRadius = "5px";
        waypointListSelector.style.backgroundColor = "#333";
        waypointListSelector.style.color = "#fff";
        waypointListSelector.onchange = (e) => {
            this.waypointListIndex = parseInt((e.target as HTMLSelectElement).value, 10);
            console.log(`Waypoint list selected: ${this.waypointListIndex}`);
        };
        this.updateWaypointListSelector(waypointListSelector);
        controlPanel.appendChild(waypointListSelector);

        // Bouton pour créer une nouvelle liste de waypoints
        const newWaypointListButton = document.createElement("button");
        newWaypointListButton.innerText = "New Waypoint List";
        newWaypointListButton.style.width = "100%";
        newWaypointListButton.style.padding = "10px";
        newWaypointListButton.style.marginBottom = "15px";
        newWaypointListButton.style.border = "none";
        newWaypointListButton.style.borderRadius = "5px";
        newWaypointListButton.style.backgroundColor = "#4CAF50";
        newWaypointListButton.style.color = "#fff";
        newWaypointListButton.style.cursor = "pointer";
        newWaypointListButton.onclick = () => {
            this.startNewWaypointList();
            this.updateWaypointListSelector(waypointListSelector);
        };
        controlPanel.appendChild(newWaypointListButton);

        // Bouton pour sauvegarder les waypoints
        const saveButton = document.createElement("button");
        saveButton.innerText = "Save Waypoints";
        saveButton.style.width = "100%";
        saveButton.style.padding = "10px";
        saveButton.style.marginBottom = "15px";
        saveButton.style.border = "none";
        saveButton.style.borderRadius = "5px";
        saveButton.style.backgroundColor = "#2196F3";
        saveButton.style.color = "#fff";
        saveButton.style.cursor = "pointer";
        saveButton.onclick = () => this.saveWaypoints();
        controlPanel.appendChild(saveButton);

        // Bouton pour activer/désactiver le placement des waypoints
        const toggleWaypointButton = document.createElement("button");
        toggleWaypointButton.innerText = "Toggle Waypoint Placement";
        toggleWaypointButton.style.width = "100%";
        toggleWaypointButton.style.padding = "10px";
        toggleWaypointButton.style.marginBottom = "15px";
        toggleWaypointButton.style.border = "none";
        toggleWaypointButton.style.borderRadius = "5px";
        toggleWaypointButton.style.backgroundColor = "#FF9800";
        toggleWaypointButton.style.color = "#fff";
        toggleWaypointButton.style.cursor = "pointer";
        toggleWaypointButton.onclick = () => this.toggleWaypointPlacement();
        controlPanel.appendChild(toggleWaypointButton);

        // Bouton pour activer/désactiver le placement des spawns
        const toggleSpawnButton = document.createElement("button");
        toggleSpawnButton.innerText = "Toggle Spawn Placement";
        toggleSpawnButton.style.width = "100%";
        toggleSpawnButton.style.padding = "10px";
        toggleSpawnButton.style.marginBottom = "15px";
        toggleSpawnButton.style.border = "none";
        toggleSpawnButton.style.borderRadius = "5px";
        toggleSpawnButton.style.backgroundColor = "#FF5722"; // Rouge pour les spawns
        toggleSpawnButton.style.color = "#fff";
        toggleSpawnButton.style.cursor = "pointer";
        toggleSpawnButton.onclick = () => this.toggleSpawnPlacement();
        controlPanel.appendChild(toggleSpawnButton);

        // Bouton pour sauvegarder les spawns
        const saveSpawnButton = document.createElement("button");
        saveSpawnButton.innerText = "Save Spawns";
        saveSpawnButton.style.width = "100%";
        saveSpawnButton.style.padding = "10px";
        saveSpawnButton.style.marginBottom = "15px";
        saveSpawnButton.style.border = "none";
        saveSpawnButton.style.borderRadius = "5px";
        saveSpawnButton.style.backgroundColor = "#2196F3"; // Bleu pour sauvegarder
        saveSpawnButton.style.color = "#fff";
        saveSpawnButton.style.cursor = "pointer";
        saveSpawnButton.onclick = () => this.saveSpawnPositions();
        controlPanel.appendChild(saveSpawnButton);

        // Bouton pour effacer les spawns
        const clearSpawnButton = document.createElement("button");
        clearSpawnButton.innerText = "Clear Spawns";
        clearSpawnButton.style.width = "100%";
        clearSpawnButton.style.padding = "10px";
        clearSpawnButton.style.marginBottom = "15px";
        clearSpawnButton.style.border = "none";
        clearSpawnButton.style.borderRadius = "5px";
        clearSpawnButton.style.backgroundColor = "#F44336"; // Rouge foncé pour effacer
        clearSpawnButton.style.color = "#fff";
        clearSpawnButton.style.cursor = "pointer";
        clearSpawnButton.onclick = () => this.clearSpawns();
        controlPanel.appendChild(clearSpawnButton);

        // Conteneur pour afficher les données existantes
        const dataContainer = document.createElement("div");
        dataContainer.id = "dataContainer";
        dataContainer.style.position = "absolute";
        dataContainer.style.top = "20px";
        dataContainer.style.right = "20px";
        dataContainer.style.padding = "20px";
        dataContainer.style.backgroundColor = "#f4f4f4";
        dataContainer.style.border = "1px solid #ccc";
        dataContainer.style.borderRadius = "10px";
        dataContainer.style.maxHeight = "400px";
        dataContainer.style.overflowY = "auto";
        dataContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
        dataContainer.style.fontFamily = "Arial, sans-serif";
        document.body.appendChild(dataContainer);
    }

    private updateWaypointListSelector(selector: HTMLSelectElement): void {
        const key = `${this.level}_spawn_${this.spawnPositionNumber}`;
        const waypointLists = this.waypointsByLevelAndSpawn.get(key) || [];
        selector.innerHTML = ""; // Clear existing options

        waypointLists.forEach((_, index) => {
            const option = document.createElement("option");
            option.value = index.toString();
            option.innerText = `List ${index + 1}`;
            selector.appendChild(option);
        });

        // Automatically select the last list if a new one is added
        if (waypointLists.length > 0) {
            selector.value = (waypointLists.length - 1).toString();
            this.waypointListIndex = waypointLists.length - 1;
        }
    }

    private toggleWaypointPlacement(): void {
        this.isPlacingWaypoints = !this.isPlacingWaypoints;

        // Désactiver le mode de placement des spawns si le mode waypoint est activé
        if (this.isPlacingWaypoints) {
            this.isPlacingSpawns = false;
        }

        console.log(`Waypoint placement mode: ${this.isPlacingWaypoints}`);
    }

    private toggleSpawnPlacement(): void {
        this.isPlacingSpawns = !this.isPlacingSpawns;

        // Désactiver le mode de placement des waypoints si le mode spawn est activé
        if (this.isPlacingSpawns) {
            this.isPlacingWaypoints = false;
        }

        console.log(`Spawn placement mode: ${this.isPlacingSpawns}`);
    }

    private setupMouseEvents(): void {
        this.scene.onPointerDown = (evt, pickResult) => {
            if (this.isPlacingSpawns && evt.button === 0 && pickResult.hit && pickResult.pickedMesh?.name === "Ground") {
                // Clear existing spawn points to ensure only one spawn point
                this.clearSpawns();

                const spawnPosition = pickResult.pickedPoint.clone();
                this.spawnPositions.push(spawnPosition);

                // Visualize the spawn position
                const sphere = BABYLON.MeshBuilder.CreateSphere("spawn", { diameter: 1.5 }, this.scene);
                sphere.position = spawnPosition;
                sphere.material = new BABYLON.StandardMaterial("spawnMat", this.scene);
                (sphere.material as BABYLON.StandardMaterial).diffuseColor = BABYLON.Color3.Blue();

                this.displayExistingData();
                console.log("Spawn position added:", spawnPosition);
            }

            if (this.isPlacingWaypoints && evt.button === 0 && pickResult.hit && pickResult.pickedMesh?.name === "Ground") {
                const waypoint = pickResult.pickedPoint.clone();
                const key = `${this.level}_spawn_${this.spawnPositionNumber}`;
                if (!this.waypointsByLevelAndSpawn.has(key)) {
                    this.waypointsByLevelAndSpawn.set(key, [[]]); // Initialize with an empty list of waypoint lists
                }
                const waypointLists = this.waypointsByLevelAndSpawn.get(key);
                if (waypointLists) {
                    waypointLists[this.waypointListIndex].push(waypoint); // Add to the selected list
                }

                // Visualize the waypoint
                const sphere = BABYLON.MeshBuilder.CreateSphere("waypoint", { diameter: 1 }, this.scene);
                sphere.position = waypoint;
                sphere.material = new BABYLON.StandardMaterial("waypointMat", this.scene);
                (sphere.material as BABYLON.StandardMaterial).diffuseColor = BABYLON.Color3.Red();

                this.displayExistingData();
                console.log(`Waypoint added to ${key}, list ${this.waypointListIndex + 1}:`, waypoint);
            }
        };
    }

    public saveWaypoints(): void {
        const key = `${this.level}_spawn_${this.spawnPositionNumber}`;
        const filename = `${key}_waypoints.json`;
        const waypointData = JSON.stringify(
            this.waypointsByLevelAndSpawn.get(key)?.map(list => list.map(wp => ({ x: wp.x, y: wp.y, z: wp.z }))) || []
        );
        console.log(`Waypoints saved to ${filename}:`, waypointData);

        localStorage.setItem(filename, waypointData);
        this.displayExistingData();
    }

    public saveSpawnPositions(): void {
        const filename = `${this.spawnLabel}_spawns.json`;
        const spawnData = JSON.stringify(this.spawnPositions.map(sp => ({ x: sp.x, y: sp.y, z: sp.z })));
        console.log(`Spawn positions saved to ${filename}:`, spawnData);

        localStorage.setItem(filename, spawnData);
        this.displayExistingData();
    }

    public loadWaypoints(level: number, spawnPositionNumber: number): BABYLON.Vector3[][] {
        const key = `${level}_spawn_${spawnPositionNumber}`;
        const filename = `${key}_waypoints.json`;
        const waypointData = localStorage.getItem(filename);
        if (waypointData) {
            const waypointLists = JSON.parse(waypointData).map((list: { x: number; y: number; z: number }[]) =>
                list.map(wp => new BABYLON.Vector3(wp.x, wp.y, wp.z))
            );
            this.waypointsByLevelAndSpawn.set(key, waypointLists);

            // Visualize loaded waypoints
            waypointLists.forEach(list => {
                list.forEach(waypoint => {
                    const sphere = BABYLON.MeshBuilder.CreateSphere("waypoint", { diameter: 1 }, this.scene);
                    sphere.position = waypoint;
                    sphere.material = new BABYLON.StandardMaterial("waypointMat", this.scene);
                    (sphere.material as BABYLON.StandardMaterial).diffuseColor = BABYLON.Color3.Red();
                });
            });

            console.log(`Waypoints loaded for ${key}:`, waypointLists);
        }
        this.displayExistingData();
        return this.waypointsByLevelAndSpawn.get(key) || [];
    }

    public loadSpawnPositions(label: string): BABYLON.Vector3[] {
        const filename = `${label}_spawns.json`;
        const spawnData = localStorage.getItem(filename);
        if (spawnData) {
            this.spawnPositions = JSON.parse(spawnData).map((sp: { x: number; y: number; z: number }) =>
                new BABYLON.Vector3(sp.x, sp.y, sp.z)
            );

            // Visualize loaded spawn positions
            this.spawnPositions.forEach(spawn => {
                const sphere = BABYLON.MeshBuilder.CreateSphere("spawn", { diameter: 1.5 }, this.scene);
                sphere.position = spawn;
                sphere.material = new BABYLON.StandardMaterial("spawnMat", this.scene);
                (sphere.material as BABYLON.StandardMaterial).diffuseColor = BABYLON.Color3.Blue();
            });

            console.log(`Spawn positions loaded from ${filename}:`, this.spawnPositions);
        }
        this.displayExistingData();
        return this.spawnPositions;
    }

    public startNewWaypointList(): void {
        const key = `${this.level}_spawn_${this.spawnPositionNumber}`;
        if (!this.waypointsByLevelAndSpawn.has(key)) {
            this.waypointsByLevelAndSpawn.set(key, []);
        }
        this.waypointsByLevelAndSpawn.get(key)?.push([]); // Start a new list of waypoints
        console.log(`Started a new waypoint list for ${key}`);
        this.displayExistingData();
    }

    private clearWaypoints(): void {
        // Remove all waypoint meshes from the scene
        this.scene.meshes
            .filter(mesh => mesh.name === "waypoint")
            .forEach(mesh => mesh.dispose());

        // Clear the waypoints array
        this.waypointsByLevelAndSpawn.clear();
        this.displayExistingData();
        console.log("All waypoints cleared.");
    }

    private clearSpawns(): void {
        // Remove all spawn meshes from the scene
        this.scene.meshes
            .filter(mesh => mesh.name === "spawn")
            .forEach(mesh => mesh.dispose());

        // Clear the spawn positions array
        this.spawnPositions = [];
        this.displayExistingData();
        console.log("All spawn positions cleared.");
    }

    private displayExistingData(): void {
        const dataContainer = document.getElementById("dataContainer");
        if (!dataContainer) return;

        dataContainer.innerHTML = "<h3>Existing Data</h3>";

        // Display waypoints grouped by level, spawn position, and waypoint list
        this.waypointsByLevelAndSpawn.forEach((waypointLists, key) => {
            const header = document.createElement("h4");
            header.innerText = `Level and Spawn: ${key}`;
            dataContainer.appendChild(header);

            waypointLists.forEach((list, listIndex) => {
                const listHeader = document.createElement("h5");
                listHeader.innerText = `Waypoint List ${listIndex + 1}`;
                dataContainer.appendChild(listHeader);

                list.forEach((wp, index) => {
                    const waypointItem = document.createElement("div");
                    waypointItem.innerText = `Waypoint ${index + 1}: (${wp.x.toFixed(2)}, ${wp.y.toFixed(2)}, ${wp.z.toFixed(2)})`;
                    waypointItem.style.marginBottom = "5px";

                    const deleteButton = document.createElement("button");
                    deleteButton.innerText = "Delete";
                    deleteButton.style.marginLeft = "10px";
                    deleteButton.onclick = () => {
                        list.splice(index, 1);
                        this.displayExistingData();
                        console.log(`Waypoint ${index + 1} deleted from ${key}, list ${listIndex + 1}.`);
                    };
                    waypointItem.appendChild(deleteButton);

                    dataContainer.appendChild(waypointItem);
                });
            });
        });

        // Display spawn positions
        const spawnHeader = document.createElement("h4");
        spawnHeader.innerText = "Spawn Positions:";
        dataContainer.appendChild(spawnHeader);

        this.spawnPositions.forEach((sp, index) => {
            const spawnItem = document.createElement("div");
            spawnItem.innerText = `Spawn ${index + 1}: (${sp.x.toFixed(2)}, ${sp.y.toFixed(2)}, ${sp.z.toFixed(2)})`;
            spawnItem.style.marginBottom = "5px";

            const deleteButton = document.createElement("button");
            deleteButton.innerText = "Delete";
            deleteButton.style.marginLeft = "10px";
            deleteButton.onclick = () => this.deleteSpawn(index);
            spawnItem.appendChild(deleteButton);

            dataContainer.appendChild(spawnItem);
        });
    }

    private deleteWaypoint(index: number): void {
        this.waypoints.splice(index, 1);
        this.scene.meshes
            .filter(mesh => mesh.name === "waypoint")
            [index]?.dispose();
        this.displayExistingData();
        console.log(`Waypoint ${index + 1} deleted.`);
    }

    private deleteSpawn(index: number): void {
        this.spawnPositions.splice(index, 1);
        this.scene.meshes
            .filter(mesh => mesh.name === "spawn")
            [index]?.dispose();
        this.displayExistingData();
        console.log(`Spawn position ${index + 1} deleted.`);
    }
}
