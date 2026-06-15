/**
 * js/validaciones.js
 * Módulo especializado en la limpieza, lógica matemática y validación del RUT chileno.
 * Aplica el algoritmo oficial de Módulo 11 y gestiona las clases visuales de Bootstrap.
 */

/**
 * Elimina caracteres no numéricos del RUT, normalizando la 'K' a mayúscula.
 * Permite que las entradas del usuario sean flexibles (con o sin puntos/guiones).
 * @param {string} rut - Cadena de texto ingresada por el usuario.
 * @returns {string} - RUT normalizado compuesto únicamente por dígitos y/o 'K'.
 */
function limpiarRut(rut) {
    if (!rut) return '';
    return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

/**
 * Calcula el Dígito Verificador (DV) utilizando el algoritmo de Módulo 11.
 * @param {string} cuerpo - Componente numérico del RUT (sin el dígito verificador).
 * @returns {string} - Dígito verificador teórico calculado ('0'-'9' o 'K').
 */
function calcularDV(cuerpo) {
    let suma = 0;
    let multiplo = 2;

    // Recorrido inverso sobre la cadena numérica del cuerpo
    for (let i = 1; i <= cuerpo.length; i++) {
        let digito = parseInt(cuerpo.charAt(cuerpo.length - i), 10);
        suma += multiplo * digito;
        
        // El factor multiplicador cicla estrictamente entre los rangos 2 y 7
        multiplo = (multiplo < 7) ? multiplo + 1 : 2;
    }

    let dvEsperado = 11 - (suma % 11);
    
    // Tratamiento de excepciones según la norma del Módulo 11
    if (dvEsperado === 10) return 'K';
    if (dvEsperado === 11) return '0';
    return dvEsperado.toString();
}

/**
 * Valida la integridad estructural y matemática de un RUT completo.
 * @param {string} rut - El RUT completo provisto en el campo de texto.
 * @returns {boolean} - True si el RUT cumple con las especificaciones del algoritmo; de lo contrario, False.
 */
function esRutValido(rut) {
    const rutLimpio = limpiarRut(rut);
    
    // Un RUT nacional válido requiere un mínimo de 7 dígitos de cuerpo mas 1 dígito verificador
    if (rutLimpio.length < 8) return false;

    const cuerpo = rutLimpio.slice(0, -1);
    const dvIngresado = rutLimpio.slice(-1);
    
    // Verificación de consistencia del cuerpo numérico
    if (!/^\d+$/.test(cuerpo)) return false;

    const dvCalculado = calcularDV(cuerpo);
    return dvIngresado === dvCalculado;
}

// --- CONFIGURACIÓN DE LOS ESCUCHADORES DE EVENTOS EN EL DOM ---
document.addEventListener('DOMContentLoaded', () => {
    const formProveedor = document.getElementById('form-proveedor');
    const inputRut = document.getElementById('input-rut');
    const feedbackError = document.getElementById('rut-error-feedback');

    // Inicialización de escuchadores condicionada a la existencia de los elementos en la vista actual
    if (formProveedor && inputRut) {
        
        // Limpieza de estados visuales de error de forma reactiva mientras el usuario escribe
        inputRut.addEventListener('input', () => {
            inputRut.classList.remove('is-invalid', 'is-valid');
            if (feedbackError) feedbackError.textContent = '';
        });

        // Interceptación y validación formal previa al envío del formulario
        formProveedor.addEventListener('submit', (e) => {
            e.preventDefault(); // Suspensión del refresco de página nativo
            
            const valorOriginal = inputRut.value;

            // Control de Estado 1: Detección de campos requeridos vacíos
            if (!valorOriginal.trim()) {
                inputRut.classList.add('is-invalid');
                if (feedbackError) feedbackError.textContent = "El campo RUT es obligatorio para realizar la búsqueda.";
                return;
            }

            // Control de Estado 2: Validación matemática contra fallas de consistencia
            if (!esRutValido(valorOriginal)) {
                inputRut.classList.add('is-invalid');
                if (feedbackError) feedbackError.textContent = "El RUT ingresado es incorrecto o su dígito verificador es inválido.";
                return;
            }

            // Si pasa los controles anteriores, se establece el estado de éxito visual
            inputRut.classList.remove('is-invalid');
            inputRut.classList.add('is-valid');
            
            // CORRECCIÓN CRÍTICA: Formateo estricto agregando PUNTOS y GUION ya que la API institucional 
            // de búsqueda de proveedores requiere explícitamente este formato exacto (ej: 77.653.382-3) para procesar
            const rutNormalizado = limpiarRut(valorOriginal);
            const cuerpo = rutNormalizado.slice(0, -1);
            const dv = rutNormalizado.slice(-1);
            
            // Inserción dinámica de los puntos cada 3 dígitos
            const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            const rutFormateadoParaApi = `${cuerpoConPuntos}-${dv}`;
            
            // Invocación segura a la función global expuesta en ui.js
            if (typeof window.procesarBusquedaProveedor === 'function') {
                window.procesarBusquedaProveedor(rutFormateadoParaApi);
            } else {
                console.error("Error de integración: La función procesarBusquedaProveedor no está disponible en el entorno global.");
            }
        });
    }
});