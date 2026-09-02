export async function fetchSpawnMarks() {
    try {
        const response = await fetch('spawn_kanto.json');
        if (!response.ok) throw new Error("Erro no carregamento do arquivo");
        return await response.json();
    } catch (error) {
        console.error("Erro ao carregar o json de SpawnMark:", error);
        return [];
    }
}