// --- CONFIGURACIÓN DE ACCESIBILIDAD UNIVERSAL ---
function inicializarMecanismoAccesibilidad() {
    const btnContraste = document.getElementById('btn-alto-contraste');
    if (!btnContraste) return;

    btnContraste.addEventListener('click', () => {
        document.body.classList.toggle('alto-contraste-activo');
        const estadoActivo = document.body.classList.contains('alto-contraste-activo');
        localStorage.setItem('preferencia-contraste', estadoActivo ? 'activo' : 'inactivo');
    });

    if (localStorage.getItem('preferencia-contraste') === 'activo') {
        document.body.classList.add('alto-contraste-activo');
    }
}

let currentFontSize = localStorage.getItem('fontSize') || 16;
document.documentElement.style.fontSize = currentFontSize + 'px';
function changeFontSize(action) {

    currentFontSize = parseInt(currentFontSize);

    switch (action) {
        case 'increase':
            currentFontSize += 2;
            break;

        case 'decrease':
            currentFontSize = Math.max(10, currentFontSize - 2);
            break;

        case 'reset':
            currentFontSize = 16;
            break;
    }

    document.documentElement.style.fontSize = currentFontSize + 'px';
    localStorage.setItem('fontSize', currentFontSize);
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarMecanismoAccesibilidad();
});