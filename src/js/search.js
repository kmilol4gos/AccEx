const displayResults = require("./results.js");

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

// Función para realizar la búsqueda en DuckDuckGo
async function searchDuckDuckGo(query) {
	try {
		const response = await fetch(
			`https://api.duckduckgo.com/?q=${encodeURIComponent(
				query
			)}&format=json&pretty=1`
		);
		const data = await response.json();
		return data.RelatedTopics; // Devuelve los resultados relacionados
	} catch (error) {
		console.error("Error al realizar la búsqueda:", error);
	}
}

// Evento para manejar la búsqueda cuando se presiona el botón
searchButton.addEventListener("click", async () => {
	const query = searchInput.value;

	if (query) {
		const results = await searchDuckDuckGo(query);
		displayResults(results); // Asegúrate de que esta función esté disponible
	} else {
		console.log("Por favor ingresa un término de búsqueda.");
	}
});
