export const MAP_CONFIGS = {
    kanto: {
        id: 'kanto',
        name: 'Kanto',
        bounds: [[2700, 2700], [7000, 7000]],
        limitX: 5000,
        limitY: 7000,
        basePathTile: 'tiles',
        islandsGeoJsonPath: 'data/islands_kanto.geojson',
        spawnsJsonPath: 'data/spawn_kanto.json',
        initPos: [3791, 4098, 7],
        excludeAreas: [
            [2360, 2680, 3308, 3472]
        ]
    },
    johto: {
        id: 'johto',
        name: 'Johto',
        bounds: [[28672, 0], [32768, 5120]], 
        limitX: 5120,
        limitY: 32768,
        basePathTile: 'tiles_johto',
        islandsGeoJsonPath: 'data/islands_johto.geojson',
        spawnsJsonPath: 'data/spawn_johto.json',
        initPos: [30356, 3230, 6],
        excludeAreas: []
    }
};

export const DEFAULT_MAP = 'kanto';