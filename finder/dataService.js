export async function fetchSpawnMarks(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Erro ao carregar Spawns: ${path}`);
        return await response.json();
    } catch (error) {
        console.error("Falha no JSON de spawns:", error);
        return [];
    }
}