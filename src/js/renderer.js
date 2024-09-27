require('./js/search.js');
require('./js/results.js');

const { ipcRenderer } = require('electron');
const { navigate } = require('../../electron.js');

function navigate(url) {
  navigate(url);
}

let startX = 0;
let endX = 0;

// Detectar el inicio del toque
window.addEventListener('touchstart', (event) => {
  console.log(event.touches[0].clientX);
  startX = event.touches[0].clientX;
});

// Detectar el movimiento del toque
window.addEventListener('touchmove', (event) => {
  console.log(event.touches[0].clientX);
  endX = event.touches[0].clientX;
});

// Detectar el final del toque y verificar si fue un deslizamiento hacia la izquierda
window.addEventListener('touchend', () => {
  if (startX - endX > 50) {
    // Ajusta el umbral para el deslizamiento
    if (window.history.length > 1) {
      window.history.back(); // O también puedes usar el método de Electron
      // require('electron').remote.getCurrentWindow().webContents.goBack();
    }
  }
});
