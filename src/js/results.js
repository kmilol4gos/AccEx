// Función para mostrar los resultados en el contenedor
function displayResults(results) {
  const resultsContainer = document.getElementById('resultsContainer');
  resultsContainer.innerHTML = ''; // Limpiar resultados anteriores

  if (results.length === 0) {
    const noResultsElement = document.createElement('div');
    noResultsElement.textContent = 'No se encontraron resultados';
    noResultsElement.classList.add('text-gray-500', 'text-center');
    resultsContainer.appendChild(noResultsElement);
    return;
  }

  results.forEach((result) => {
    console.log(result);
    if (result.FirstURL && result.Text) {
      const resultElement = document.createElement('div');
      resultElement.classList.add(
        'border',
        'p-4',
        'rounded-lg',
        'bg-white',
        'shadow-lg'
      );

      resultElement.innerHTML = `
        <a href="${result.FirstURL}" target="_blank" class="text-blue-500 text-lg font-semibold hover:underline">
          ${result.Text}
        </a>
      `;

      resultsContainer.appendChild(resultElement);
    }
  });
}

// Exportar la función
module.exports = displayResults;
