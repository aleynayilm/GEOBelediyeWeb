export async function getAllProjects() {
    try {
        const response = await fetch("http://localhost:7096/Point/GetAll");
        if (!response.ok) {
            throw new Error("Projeler alınamadı");
        }
        return await response.json();
    } catch (error) {
        console.error("Proje verisi çekilemedi:", error);
        throw error;
    }
}