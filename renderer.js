const searchInput = document.getElementById("searchInput");
const resultsList = document.getElementById("resultsList");

// Lista de sitios web predefinidos
const websites = [
	{ name: "Google", url: "https://www.google.com" },
	{ name: "GitHub", url: "https://www.github.com" },
	{ name: "Stack Overflow", url: "https://stackoverflow.com" },
	{ name: "Mozilla Developer Network", url: "https://developer.mozilla.org" },
	{ name: "Electron", url: "https://www.electronjs.org" },
];

// Función para filtrar los sitios web según el término de búsqueda
function searchWebsites(query) {
	const results = websites.filter((site) =>
		site.name.toLowerCase().includes(query.toLowerCase())
	);
	displayResults(results);
}

// Función para mostrar los resultados en la lista
function displayResults(results) {
	resultsList.innerHTML = ""; // Limpiar resultados anteriores
	results.forEach((result) => {
		const li = document.createElement("li");
		li.classList.add("p-2", "bg-white", "rounded", "shadow");
		li.innerHTML = `<a href="${result.url}"class="text-blue-600">${result.name}</a>`;
		resultsList.appendChild(li);
	});
}

// Agregar un evento de entrada para actualizar los resultados en tiempo real
searchInput.addEventListener("input", (e) => {
	const query = e.target.value;
	searchWebsites(query);
});
