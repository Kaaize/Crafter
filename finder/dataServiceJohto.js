export async function fetchSpawnMarks() {
    try {
        const response = await fetch('spawn_johto.json');
        if (!response.ok) throw new Error("Erro no carregamento do arquivo");
        return await response.json();
    } catch (error) {
        console.error("Erro ao carregar o json de SpawnMark:", error);
        return [];
    }
}

export async function loadIslandsGeoJSON(filePath = './islands_johto.geojson') {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Erro ao carregar ${filePath}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return data;
    } catch (error) {
        console.error("Falha ao carregar o GeoJSON das ilhas:", error);
        return []; 
    }
}