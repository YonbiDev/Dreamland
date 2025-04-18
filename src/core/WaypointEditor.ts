import { WaypointManager } from "./WaypointManager";

export class WaypointEditor {
    private scene: BABYLON.Scene;
    private waypoints: BABYLON.Vector3[] = [];
    private spawnPositions: BABYLON.Vector3[] = [];
    private isPlacingWaypoints: boolean = false;
    private isPlacingSpawns: boolean = false;
    private level: number = 1; // Default level
    private spawnPositionNumber: number = 1; // Default spawn position number
    private currentKey: string = `level${this.level}_spawnpoint${this.spawnPositionNumber}`; // Global key
    private spawnLabel: string = "default"; // Default spawn label
    private waypointsByLevelAndSpawn: Map<string, BABYLON.Vector3[][]> = new Map(); // Map "level_spawn" to lists of waypoints
    private spawnToWaypoints: Map<string, BABYLON.Vector3[]> = new Map(); // Map spawn label to waypoints
    private waypointListIndex: number = 0; // Default waypoint list index

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this.setupUI();
        this.setupMouseEvents();

        // Load waypoints for the default level and spawn position
        this.loadWaypoints(this.level, this.spawnPositionNumber);

        // Populate the waypoint list selector with existing data
        const waypointListSelector = document.querySelector<HTMLSelectElement>("select");
        this.waypointsByLevelAndSpawn.get(this.currentKey);
    }

    private updateCurrentKey(): void {
        this.currentKey = `level${this.level}_spawnpoint${this.spawnPositionNumber}`;
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
            this.updateCurrentKey();
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
            this.updateCurrentKey();
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

        // Bouton pour charger les waypoints
        const loadWaypointsButton = document.createElement("button");
        loadWaypointsButton.innerText = "Load Waypoints";
        loadWaypointsButton.style.width = "100%";
        loadWaypointsButton.style.padding = "10px";
        loadWaypointsButton.style.marginBottom = "15px";
        loadWaypointsButton.style.border = "none";
        loadWaypointsButton.style.borderRadius = "5px";
        loadWaypointsButton.style.backgroundColor = "#8BC34A"; // Vert clair pour charger
        loadWaypointsButton.style.color = "#fff";
        loadWaypointsButton.style.cursor = "pointer";
        loadWaypointsButton.onclick = () => {
            this.updateWaypointListSelector(waypointListSelector);
            this.loadWaypoints(this.level, this.spawnPositionNumber);
        };
        controlPanel.appendChild(loadWaypointsButton);

        // Bouton pour charger les spawns
        const loadSpawnsButton = document.createElement("button");
        loadSpawnsButton.innerText = "Load Spawns";
        loadSpawnsButton.style.width = "100%";
        loadSpawnsButton.style.padding = "10px";
        loadSpawnsButton.style.marginBottom = "15px";
        loadSpawnsButton.style.border = "none";
        loadSpawnsButton.style.borderRadius = "5px";
        loadSpawnsButton.style.backgroundColor = "#8BC34A"; // Vert clair pour charger
        loadSpawnsButton.style.color = "#fff";
        loadSpawnsButton.style.cursor = "pointer";
        loadSpawnsButton.onclick = () => {
            this.loadSpawnPositions(this.level, this.spawnPositionNumber);
            this.updateWaypointListSelector(waypointListSelector);
        };
        controlPanel.appendChild(loadSpawnsButton);

        // Bouton pour effacer les waypoints
        const clearWaypointsButton = document.createElement("button");
        clearWaypointsButton.innerText = "Clear Waypoints";
        clearWaypointsButton.style.width = "100%";
        clearWaypointsButton.style.padding = "10px";
        clearWaypointsButton.style.marginBottom = "15px";
        clearWaypointsButton.style.border = "none";
        clearWaypointsButton.style.borderRadius = "5px";
        clearWaypointsButton.style.backgroundColor = "#F44336"; // Rouge foncé pour effacer
        clearWaypointsButton.style.color = "#fff";
        clearWaypointsButton.style.cursor = "pointer";
        clearWaypointsButton.onclick = () => this.clearCurrentWaypointList();
        controlPanel.appendChild(clearWaypointsButton);

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
        const waypointLists = this.waypointsByLevelAndSpawn.get(this.currentKey) || [];
        selector.innerHTML = ""; // Clear existing options

        waypointLists.forEach((list, index) => {
            const option = document.createElement("option");
            option.value = index.toString();
            option.innerText = `List ${index + 1} (${list.length} waypoints)`; // Display waypoint count
            selector.appendChild(option);
        });

        // Automatically select the first list if it exists
        if (waypointLists.length > 0) {
            selector.value = "0";
            this.waypointListIndex = 0;
            this.displayWaypointsOfCurrentList(); // Display waypoints of the first list
        }

        selector.onchange = () => {
            this.waypointListIndex = parseInt(selector.value, 10);
            this.displayWaypointsOfCurrentList(); // Display waypoints of the newly selected list
        };
    }

    private displayWaypointsOfCurrentList(): void {
        // Clear existing waypoint meshes
        this.scene.meshes
            .filter(mesh => mesh.name === "waypoint")
            .forEach(mesh => mesh.dispose());

        const waypointLists = this.waypointsByLevelAndSpawn.get(this.currentKey) || [];
        const currentList = waypointLists[this.waypointListIndex] || [];

        // Visualize waypoints of the current list
        currentList.forEach(waypoint => {
            const sphere = BABYLON.MeshBuilder.CreateSphere("waypoint", { diameter: 1 }, this.scene);
            sphere.position = waypoint;
            sphere.material = new BABYLON.StandardMaterial("waypointMat", this.scene);
            (sphere.material as BABYLON.StandardMaterial).diffuseColor = BABYLON.Color3.Red();
        });

        console.log(`Displayed waypoints for list ${this.waypointListIndex + 1}:`, currentList);
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
                const sphere = BABYLON.MeshBuilder.CreateSphere(`spawn_${this.spawnPositions.length - 1}`, { diameter: 1.5 }, this.scene); // Unique name
                sphere.position = spawnPosition;
                sphere.material = new BABYLON.StandardMaterial(`spawnMat_${this.spawnPositions.length - 1}`, this.scene); // Unique material name
                (sphere.material as BABYLON.StandardMaterial).diffuseColor = BABYLON.Color3.Blue(); // Ensure blue color

                this.displayExistingData();
                console.log("Spawn position added:", spawnPosition);
            }

            if (this.isPlacingWaypoints && evt.button === 0 && pickResult.hit && pickResult.pickedMesh?.name === "Ground") {
                const waypoint = pickResult.pickedPoint.clone();
                if (!this.waypointsByLevelAndSpawn.has(this.currentKey)) {
                    this.waypointsByLevelAndSpawn.set(this.currentKey, [[]]); // Initialize with an empty list of waypoint lists
                }
                const waypointLists = this.waypointsByLevelAndSpawn.get(this.currentKey);
                if (waypointLists) {
                    waypointLists[this.waypointListIndex].push(waypoint); // Add to the selected list
                }

                // Visualize the waypoint
                const sphere = BABYLON.MeshBuilder.CreateSphere(`waypoint_${this.currentKey}_${this.waypointListIndex}_${waypointLists![this.waypointListIndex].length - 1}`, { diameter: 1 }, this.scene); // Unique name
                waypoint.y += 1; // Adjust height for visibility
                sphere.position = waypoint;
                sphere.material = new BABYLON.StandardMaterial(`waypointMat_${this.currentKey}_${this.waypointListIndex}`, this.scene); // Unique material name
                (sphere.material as BABYLON.StandardMaterial).diffuseColor = BABYLON.Color3.Red();

                this.displayExistingData();
                console.log(`Waypoint added to ${this.currentKey}, list ${this.waypointListIndex + 1}:`, waypoint);
            }
        };
    }

    public saveWaypoints(): void {
        const waypointLists = this.waypointsByLevelAndSpawn.get(this.currentKey) || [];
        waypointLists.forEach((list, index) => {
            const filename = `${this.currentKey}_waypoint${index + 1}.json`;
            const waypointData = JSON.stringify(list.map(wp => ({ x: wp.x, y: wp.y, z: wp.z })));
            localStorage.setItem(filename, waypointData);
            console.log(`Waypoints saved to ${filename}:`, waypointData);
        });
        console.log(this.currentKey);

        this.displayExistingData();
    }

    public saveSpawnPositions(): void {
        const filename = `level${this.level}_spawnpoint${this.spawnPositionNumber}.json`;
        const spawnData = JSON.stringify(this.spawnPositions.map(sp => ({ x: sp.x, y: sp.y, z: sp.z })));
        localStorage.setItem(filename, spawnData);
        console.log(`Spawn positions saved to ${filename}:`, spawnData);
        this.displayExistingData();
    }

    public loadWaypoints(level: number, spawnPositionNumber: number): BABYLON.Vector3[][] {
        this.level = level;
        this.spawnPositionNumber = spawnPositionNumber;
        this.updateCurrentKey();

        const waypointLists: BABYLON.Vector3[][] = [];
        let index = 1;
        while (true) {
            const filename = `${this.currentKey}_waypoint${index}.json`;
            const waypointData = localStorage.getItem(filename);
            if (!waypointData) break;
            const waypoints = JSON.parse(waypointData).map((wp: { x: number; y: number; z: number }) =>
                new BABYLON.Vector3(wp.x, wp.y, wp.z)
            );
            waypointLists.push(waypoints);
            index++;
        }
        this.waypointsByLevelAndSpawn.set(this.currentKey, waypointLists);
        console.log(`Waypoints loaded for ${this.currentKey}:`, waypointLists);
        this.displayExistingData(); //  pour le text
        this.displayWaypointsOfCurrentList(); // Display loaded waypoints
        return waypointLists;
    }

    public loadSpawnPositions(level: number, spawnPositionNumber: number): BABYLON.Vector3[] {
        const filename = `level${level}_spawnpoint${spawnPositionNumber}.json`;
        const spawnData = localStorage.getItem(filename);
        if (spawnData) {
            this.spawnPositions = JSON.parse(spawnData).map((sp: { x: number; y: number; z: number }) =>
                new BABYLON.Vector3(sp.x, sp.y, sp.z)
            );
            console.log(`Spawn positions loaded from ${filename}:`, this.spawnPositions);
        }

        // Clear and re-visualize spawn positions to ensure correct color and naming
        this.visualizeSpawnPositions();

        this.displayExistingData();
        return this.spawnPositions;
    }

    public startNewWaypointList(): void {
        if (!this.waypointsByLevelAndSpawn.has(this.currentKey)) {
            this.waypointsByLevelAndSpawn.set(this.currentKey, []);
        }
        this.waypointsByLevelAndSpawn.get(this.currentKey)?.push([]); // Start a new list of waypoints

        // Update the waypoint list selector
        const waypointListSelector = document.querySelector<HTMLSelectElement>("select");
        if (waypointListSelector) {
            this.updateWaypointListSelector(waypointListSelector);
        }

        console.log(`Started a new waypoint list for ${this.currentKey}`);
        this.displayExistingData();
    }

    private clearWaypoints(): void {
        // Remove all waypoint meshes from the scene
        this.scene.meshes
            .filter(mesh => mesh.name.startsWith("waypoint_")) // Ensure it matches the waypoint naming convention
            .forEach(mesh => mesh.dispose());

        // Clear the waypoints data structure
        this.waypointsByLevelAndSpawn.clear();
        this.displayExistingData();
        console.log("All waypoints cleared.");
    }

    private clearCurrentWaypointList(): void {
        const waypointLists = this.waypointsByLevelAndSpawn.get(this.currentKey) || [];
        if (waypointLists[this.waypointListIndex]) {
            waypointLists[this.waypointListIndex] = []; // Clear the current list
            this.displayWaypointsOfCurrentList(); // Refresh the display
            this.displayExistingData();
            console.log(`Cleared waypoints for list ${this.waypointListIndex + 1} in ${this.currentKey}`);
        }
    }

    private visualizeSpawnPositions(): void {
        // Clear existing spawn meshes
        this.scene.meshes
            .filter(mesh => mesh.name.startsWith("spawn_")) // Use a unique prefix
            .forEach(mesh => mesh.dispose());

        // Visualize spawn positions
        this.spawnPositions.forEach((spawn, index) => {
            const sphere = BABYLON.MeshBuilder.CreateSphere(`spawn_${index}`, { diameter: 1.5 }, this.scene); // Unique name
            sphere.position = spawn.clone();
            sphere.position.y += 1; // Adjust height to avoid conflicts with other objects
            sphere.material = new BABYLON.StandardMaterial(`spawnMat_${index}`, this.scene); // Unique material name
            (sphere.material as BABYLON.StandardMaterial).diffuseColor = BABYLON.Color3.Blue(); // Ensure blue color
        });

        console.log("Spawn positions visualized:", this.spawnPositions);
    }

    private clearSpawns(): void {
        // Remove all spawn meshes from the scene
        this.scene.meshes
            .filter(mesh => mesh.name.startsWith("spawn_")) // Ensure it matches the spawn naming convention
            .forEach(mesh => mesh.dispose());

        // Clear the spawn positions array
        this.spawnPositions = [];
        this.displayExistingData();
        console.log("All spawn positions cleared.");
    }

    public clearAllData(): void {
        // Clear all waypoints
        this.waypointsByLevelAndSpawn.clear();
        this.scene.meshes
            .filter(mesh => mesh.name === "waypoint")
            .forEach(mesh => mesh.dispose());

        // Clear all spawn positions
        this.spawnPositions = [];
        this.scene.meshes
            .filter(mesh => mesh.name === "spawn")
            .forEach(mesh => mesh.dispose());

        // Clear localStorage data
        localStorage.clear();

        // Refresh UI
        this.displayExistingData();
        console.log("All waypoints and spawn points have been cleared.");
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
