export class WaypointManager {
    public static async saveToFile(key: string, waypointLists: BABYLON.Vector3[][], spawnPositions: BABYLON.Vector3[]): Promise<void> {
        const data: Record<string, any> = {
            spawns: spawnPositions.map(sp => ({ x: sp.x, y: sp.y, z: sp.z }))
        };

        waypointLists.forEach((list, index) => {
            data[`waypoint${index + 1}`] = list.map(wp => ({ x: wp.x, y: wp.y, z: wp.z }));
        });

        const json = JSON.stringify(data, null, 2);

        // Crée un fichier téléchargeable
        const blob = new Blob([json], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${key}_mapData.json`;
        a.click();
        URL.revokeObjectURL(a.href);

        console.log(`Map data saved as file: ${key}_mapData.json`, data);
    }

    public static async loadFromFile(key: string): Promise<{
        waypoints: BABYLON.Vector3[][],
        spawns: BABYLON.Vector3[]
    }> {
        const filePath = `/maps/${key}_mapData.json`;

        try {
            const response = await fetch(filePath);
            const data = await response.json();

            const waypoints: BABYLON.Vector3[][] = Object.keys(data)
                .filter(k => k.startsWith("waypoint"))
                .map(k => data[k].map((wp: any) => new BABYLON.Vector3(wp.x, wp.y, wp.z)));

            const spawns: BABYLON.Vector3[] = data.spawns
                ? data.spawns.map((sp: any) => new BABYLON.Vector3(sp.x, sp.y, sp.z))
                : [];

            console.log(`Map data loaded from ${filePath}`, { waypoints, spawns });
            return { waypoints, spawns };
        } catch (error) {
            console.error("Erreur de chargement de la map :", error);
            return { waypoints: [], spawns: [] };
        }
    }
}
