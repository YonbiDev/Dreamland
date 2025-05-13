export class WaypointManager {
    public static saveWaypoints(key: string, waypointLists: BABYLON.Vector3[][]): void {
        waypointLists.forEach((list, index) => {
            const filename = `${key}_waypoint${index + 1}.json`;
            const waypointData = JSON.stringify(list.map(wp => ({ x: wp.x, y: wp.y, z: wp.z })));
            localStorage.setItem(filename, waypointData);
            console.log(`Waypoints saved to ${filename}:`, waypointData);
        });
    }

    public static loadWaypoints(key: string): BABYLON.Vector3[][] {
        const waypointLists: BABYLON.Vector3[][] = [];
        let index = 1;

        while (true) {
            const filename = `${key}_waypoint${index}.json`;
            const waypointData = localStorage.getItem(filename);
            if (!waypointData) break;

            const waypoints = JSON.parse(waypointData).map((wp: { x: number; y: number; z: number }) =>
                new BABYLON.Vector3(wp.x, wp.y, wp.z)
            );
            waypointLists.push(waypoints);
            index++;
        }

        console.log(`Waypoints loaded for ${key}:`, waypointLists);
        return waypointLists;
    }

    public static saveSpawnPositions(key: string, spawnPositions: BABYLON.Vector3[]): void {
        const filename = `${key}_spawns.json`;
        const spawnData = JSON.stringify(spawnPositions.map(sp => ({ x: sp.x, y: sp.y, z: sp.z })));
        localStorage.setItem(filename, spawnData);
        console.log(`Spawn positions saved to ${filename}:`, spawnData);
    }

    public static loadSpawnPositions(level: number, spawnPositionNumber: number, key: string): BABYLON.Vector3[] {
        const filename = `${key}_spawns.json`;
        const spawnData = localStorage.getItem(filename);
        if (!spawnData) {
            console.warn(`No spawn positions found for ${key}.`);
            return [];
        }

        const spawnPositions = JSON.parse(spawnData).map((sp: { x: number; y: number; z: number }) =>
            new BABYLON.Vector3(sp.x, sp.y, sp.z)
        );

        console.log(`Spawn positions loaded for ${key}:`, spawnPositions);
        return spawnPositions;
    }

    
}
