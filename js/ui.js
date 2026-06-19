/**
 * js/ui.js
 * Controlador maestro de la Interfaz de Usuario (UI).
 * Administra el estado global de renderizado, paginación local, filtros en tiempo real y accesibilidad.
 */

let datosActuales = [];
let datosFiltrados = [];
let paginaActual = 1;
const ITEMS_POR_PAGINA = 10;

// --- CONTROL CENTRALIZADO DE COMPONENTES DE UI ---
function mostrarLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.remove('d-none');
    document.querySelectorAll('button, input, select, a.btn').forEach(elem => {
        elem.setAttribute('disabled', 'true');
        elem.classList.add('disabled');
    });
}

/**
 * Oculta el spinner de carga y reactiva los controles interactivos.
 */
function ocultarLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('d-none');
    document.querySelectorAll('button, input, select, a.btn').forEach(elem => {
        elem.removeAttribute('disabled');
        elem.classList.remove('disabled');
    });
}

function mostrarAlerta(mensaje, tipo = 'danger') {
    const alerta = document.getElementById('mensaje-alerta');
    if (alerta) {
        alerta.className = `alert alert-${tipo} mt-3 d-block`;
        alerta.textContent = mensaje;
        alerta.setAttribute('role', 'alert');
    }
}

function ocultarAlerta() {
    const alerta = document.getElementById('mensaje-alerta');
    if (alerta) {
        alerta.className = 'alert d-none';
        alerta.textContent = '';
    }
}


// --- MÓDULO VISUAL: LISTADO DE LICITACIONES ---
function inicializarVistaLicitaciones() {
    const formFiltros = document.getElementById('form-filtros');
    if (!formFiltros) return;

    formFiltros.addEventListener('submit', async (e) => {
        e.preventDefault();
        ocultarAlerta();

        const contenedorResultados = document.getElementById('contenedor-resultados');
        if (contenedorResultados) contenedorResultados.classList.add('d-none');

        const fechaValue = document.getElementById('input-fecha').value;
        const estadoValue = document.getElementById('select-estado').value;

        mostrarLoader();
        try {
            const respuesta = await apiObtenerLicitaciones(fechaValue, estadoValue);
            datosActuales = respuesta.Listado || [];
            datosFiltrados = [...datosActuales];
            paginaActual = 1;

            if (datosFiltrados.length > 0) {
                renderizarTablaPaginada();
                if (contenedorResultados) contenedorResultados.classList.remove('d-none');
            }
        } catch (error) {
            mostrarAlerta(error.message, 'warning');
        } finally {
            ocultarLoader();
        }
    });

    const inputFiltro = document.getElementById('input-filtro-palabra');
    if (inputFiltro) {
        inputFiltro.addEventListener('input', (e) => {
            const termino = e.target.value.toLowerCase().trim();
            datosFiltrados = datosActuales.filter(item => {
                const nombre = (item.Nombre || '').toLowerCase();
                const codigo = (item.CodigoExterno || '').toLowerCase();
                return nombre.includes(termino) || codigo.includes(termino);
            });
            paginaActual = 1;
            renderizarTablaPaginada();
        });
    }

    const btnAnterior = document.getElementById('btn-anterior');
    const btnSiguiente = document.getElementById('btn-siguiente');

    if (btnAnterior) {
        btnAnterior.addEventListener('click', () => {
            if (paginaActual > 1) {
                paginaActual--;
                renderizarTablaPaginada();
            }
        });
    }

    if (btnSiguiente) {
        btnSiguiente.addEventListener('click', () => {
            const totalPaginas = Math.ceil(datosFiltrados.length / ITEMS_POR_PAGINA);
            if (paginaActual < totalPaginas) {
                paginaActual++;
                renderizarTablaPaginada();
            }
        });
    }
}

async function mostrarTablaDeActivas() {
    try {
        // 1. Esperamos los datos de la API (Retorna tu objeto completo)
        const data = await apiObtenerLicitacionesActivas('activas');

        const totalCantidad = data.Cantidad; // Aquí capturamos el 4653

        // 2. Buscamos el elemento HTML con id="numero"
        const numeroElemento = document.getElementById('numero');
        if (numeroElemento && totalCantidad > 0) {

            // ¡MÁGIA!: Llamamos a la animación (durará 1.5 segundos / 1500ms)
            animarContador(numeroElemento, totalCantidad, 1500);

        } else if (numeroElemento) {
            numeroElemento.textContent = '0';
        }

        // 3. Seguimos con la renderización normal de tu tabla
        licitacionesGuardadas = data.Listado || [];
        construirTablaHTML(licitacionesGuardadas);

    } catch (error) {
        console.error("Error al cargar datos y animar contador:", error.message);
    }
}

function renderizarTablaPaginada() {
    const tbody = document.getElementById('tabla-licitaciones');
    if (!tbody) return;
    tbody.innerHTML = '';

    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    const fin = inicio + ITEMS_POR_PAGINA;
    const registrosPagina = datosFiltrados.slice(inicio, fin);

    registrosPagina.forEach(item => {
        const tr = document.createElement('tr');
        const codigoLimpio = limpiarTexto(item.CodigoExterno);
        const nombreLimpio = limpiarTexto(item.Nombre);
        const badgeEstado = obtenerBadgeEstado(item.CodigoEstado);

        const fechaLimpio = formatearFecha(item.FechaCierre);

        tr.innerHTML = `
            <td class="fw-medium">${codigoLimpio}</td>
            <td>${nombreLimpio}</td>
            <td class="text-center" >${fechaLimpio}</td>
            <td>${badgeEstado}</td>
            <td class="text-end">
                <a href="detalle.html?codigo=${codigoLimpio}" class="btn btn-sm btn-outline-primary" aria-label="Consultar desglose del proceso ${codigoLimpio}">Ver Detalle</a>
            </td>
        `;
        tbody.appendChild(tr);
    });
    actualizarControlesPaginacion();
}

function actualizarControlesPaginacion() {
    const infoPaginacion = document.getElementById('info-paginacion');
    const totalPaginas = Math.ceil(datosFiltrados.length / ITEMS_POR_PAGINA);
    if (infoPaginacion) {
        infoPaginacion.textContent = `Página ${paginaActual} de ${totalPaginas || 1}`;
    }
    const itemAnterior = document.getElementById('btn-anterior');
    const itemSiguiente = document.getElementById('btn-siguiente');

    if (itemAnterior) {
        if (paginaActual === 1) {
            itemAnterior.classList.add('disabled');
            itemAnterior.querySelector('button').setAttribute('disabled', 'true');
        } else {
            itemAnterior.classList.remove('disabled');
            itemAnterior.querySelector('button').removeAttribute('disabled');
        }
    }
    if (itemSiguiente) {
        if (paginaActual >= totalPaginas || totalPaginas === 0) {
            itemSiguiente.classList.add('disabled');
            itemSiguiente.querySelector('button').setAttribute('disabled', 'true');
        } else {
            itemSiguiente.classList.remove('disabled');
            itemSiguiente.querySelector('button').removeAttribute('disabled');
        }
    }
}

// --- NUEVO MÓDULO VISUAL: DETALLE DE LICITACIONES (detalle.html) ---
async function inicializarVistaDetalle() {
    const urlParams = new URLSearchParams(window.location.search);
    const codigoUrl = urlParams.get('codigo');

    // Si no hay código en la URL o no estamos en la página de detalle, salir pacíficamente
    if (!codigoUrl || !document.getElementById('detalle-licitacion')) return;

    ocultarAlerta();
    mostrarLoader();

    try {
        const respuesta = await apiObtenerDetalleLicitacion(codigoUrl);
        if (respuesta && respuesta.Listado && respuesta.Listado.length > 0) {
            renderizarDetalleLicitacion(respuesta.Listado[0]);
        } else {
            // Caso: Respuesta exitosa pero vacía (Tarea 6)
            mostrarAlerta("No se encontró información estructurada para esta licitación. Volviendo al buscador...", "warning");
            
            setTimeout(() => {
                window.location.href = 'licitaciones.html';
            }, 3500);
        }
    } catch (error) {
        // Caso: Captura el Error 500 controlado o caídas de servidor (Tarea 6)
        // Concatenamos una frase amigable para avisar del retorno automático
        mostrarAlerta(`${error.message} Será redirigido al buscador automáticamente...`, "danger");
        
        // Esperamos 3000 milisegundos (3 segundos) para permitir la lectura del feedback antes de la redirección
        setTimeout(() => {
            window.location.href = 'licitaciones.html';
        }, 3000);
    } finally {
        ocultarLoader();
    }
}

/**
 * Captura el código introducido por el usuario y lo redirige
 * a la vista de detalles tras aplicar validaciones robustas en el cliente.
 */
function procesarBusquedaDirectaPorCodigo() {
    const input = document.getElementById('input-codigo-directo');
    const errorDiv = document.getElementById('error-codigo-directo');
    if (!input) return;

    // Sanitizamos la entrada eliminando espacios en los extremos
    const codigo = input.value.trim();

    // --- CONTROL DE ESTADO 1: Campo estrictamente vacío (Indicador 2.1.2) ---
    if (codigo === '') {
        input.classList.add('is-invalid');
        if (errorDiv) {
            // Inyectamos un mensaje detallado para este caso específico (Tarea 3)
            errorDiv.textContent = 'El código de licitación es obligatorio para realizar la búsqueda.';
            errorDiv.classList.remove('d-none');
        }
        return;
    }

    // --- CONTROL DE ESTADO 2: Validación de longitud mínima o formato ---
    // Las licitaciones de Mercado Público suelen tener estructuras definidas (ej: 4501-122-L126). 
    // Como mínimo, un código menor a 3 caracteres no será válido.
    if (codigo.length < 3) {
        input.classList.add('is-invalid');
        if (errorDiv) {
            // Mensaje de error personalizado para el segundo caso (Tarea 3)
            errorDiv.textContent = 'El código ingresado es demasiado corto para ser una licitación válida.';
            errorDiv.classList.remove('d-none');
        }
        return;
    }

    // Si supera los filtros del cliente, limpiamos todos los estilos de error anteriores
    input.classList.remove('is-invalid');
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.classList.add('d-none');
    }

    // Redirección inteligente hacia la vista de detalles reutilizando la lógica del sistema
    window.location.href = `detalle.html?codigo=${encodeURIComponent(codigo)}`;
}

function renderizarDetalleLicitacion(lic) {
    // Inyección segura evaluando la existencia previa de los nodos ID
    const elNombre = document.getElementById('detalle-nombre');
    const elCodigo = document.getElementById('detalle-codigo');
    const elDescripcion = document.getElementById('detalle-descripcion');
    const elEstado = document.getElementById('detalle-estado');
    const tipoLicitacion = document.getElementById('detalle-tipo-licitacion');
    const tipoConvocatoria = document.getElementById('detalle-tipo-convocatoria');
    const numeroEtapas = document.getElementById('detalle-etapa-apertura');
    const tomaRazon = document.getElementById('detalle-toma-razon');

    const tiposLicitacion = {
        L1: "Licitación Pública Menor a 100 UTM",
        LE: "Licitación Pública igual o superior a 100 UTM e inferior a 1.000 UTM",
        LP: "Licitación Pública igual o superior a 1.000 UTM e inferior a 2.000 UTM",
        LQ: "Licitación Pública igual o superior a 2.000 UTM e inferior a 5.000 UTM",
        LR: "Licitación Pública igual o superior a 5.000 UTM",
        E2: "Licitación Privada Menor a 100 UTM",
        CO: "Licitación Privada igual o superior a 100 UTM e inferior a 1.000 UTM",
        B2: "Licitación Privada igual o superior a 1.000 UTM e inferior a 2.000 UTM",
        H2: "Licitación Privada igual o superior a 2.000 UTM e inferior a 5.000 UTM",
        I2: "Licitación Privada Mayor a 5.000 UTM",
        LS: "Licitación Pública Servicios personales especializados"
    };

    const tiposConvocatoria = {
        1: "Abierto",
        2: "Cerrado"
    };

    const etapas = {
        1: "1 Etapa",
        2: "2 Etapas"
    };

    const tomaRazonMap = {
        1: "Si requiere Toma de Razón por Contraloría",
        0: "No requiere Toma de Razón por Contraloría"
    };

    if (tipoLicitacion) {
        const tipo = lic.CodigoTipo === 1 ? "Publica" : "Privada";
        tipoLicitacion.textContent = `${tipo} - ${tiposLicitacion[lic.Tipo] ?? "No especificado"}`;
    }

    if (tipoConvocatoria) {
        tipoConvocatoria.textContent =
            tiposConvocatoria[lic.TipoConvocatoria] ?? "No especificado";
    }

    if (numeroEtapas) {
        numeroEtapas.textContent =
            etapas[lic.Etapas] ?? "No especificado";
    }

    if (tomaRazon) {
        tomaRazon.textContent =
            tomaRazonMap[lic.TomaRazon] ?? "No especificado";
    }

    if (elNombre) elNombre.textContent = limpiarTexto(lic.Nombre);
    if (elCodigo) elCodigo.textContent = limpiarTexto(lic.CodigoExterno);
    if (elDescripcion) elDescripcion.textContent = limpiarTexto(lic.Descripcion);
    if (elEstado) elEstado.textContent = limpiarTexto(lic.Estado);

    const elOrganismo = document.getElementById('detalle-organismo');
    const elRutComprador = document.getElementById('detalle-rut-unidad');
    const regionUnidad = document.getElementById('detalle-region-unidad');
    const nombreUnidad = document.getElementById('detalle-nombre-unidad');
    const direccionUnidad = document.getElementById('detalle-direccion-unidad');
    const comunaUnidad = document.getElementById('detalle-comuna-unidad');
    const cantidadReclamos = document.getElementById('detalle-reclamos');

    if (elOrganismo) elOrganismo.textContent = limpiarTexto(lic.Comprador.NombreOrganismo);
    if (elRutComprador) elRutComprador.textContent = limpiarTexto(lic.Comprador.RutUnidad);
    if (nombreUnidad) nombreUnidad.textContent = limpiarTexto(lic.Comprador.NombreUnidad);
    if (direccionUnidad) direccionUnidad.textContent = limpiarTexto(lic.Comprador.DireccionUnidad);
    if (comunaUnidad) comunaUnidad.textContent = limpiarTexto(lic.Comprador.ComunaUnidad);
    if (regionUnidad) regionUnidad.textContent = limpiarTexto(lic.Comprador.RegionUnidad);
    if (cantidadReclamos) cantidadReclamos.textContent = lic.CantidadReclamos;

    const fechaCierre = document.getElementById('detalle-fecha-cierre');
    const fechaPublicacion = document.getElementById('detalle-fecha-creacion');
    const fechaInicio = document.getElementById('detalle-fecha-inicio');
    const fechaFinal = document.getElementById('detalle-fecha-final');
    const fechaPub = document.getElementById('detalle-fecha-pub');
    const fechaTecnica = document.getElementById('detalle-fecha-tecnica');
    const fechaEconomica = document.getElementById('detalle-fecha-economica');
    const fechaAdjudicacion = document.getElementById('detalle-fecha-adjudicacion');

    if (fechaCierre) fechaCierre.textContent = formatearFecha(lic.Fechas.FechaCierre);
    if (fechaPublicacion) fechaPublicacion.textContent = formatearFecha(lic.Fechas.FechaPublicacion);
    if (fechaInicio) fechaInicio.textContent = formatearFecha(lic.Fechas.FechaInicio);
    if (fechaFinal) fechaFinal.textContent = formatearFecha(lic.Fechas.FechaFinal);
    if (fechaPub) fechaPub.textContent = formatearFecha(lic.Fechas.FechaPubRespuestas);
    if (fechaTecnica) fechaTecnica.textContent = formatearFecha(lic.Fechas.FechaActoAperturaTecnica);
    if (fechaEconomica) fechaEconomica.textContent = formatearFecha(lic.Fechas.FechaActoAperturaEconomica);
    if (fechaAdjudicacion) fechaAdjudicacion.textContent = formatearFecha(lic.Fechas.FechaAdjudicacion);

    const estimacionBase = document.getElementById('detalle-estimacion-base')
    const fuenteFinanciamiento = document.getElementById('detalle-fuente-financiamiento')
    const elMonto = document.getElementById('detalle-monto-estimado');
    const renovacionContrato = document.getElementById('detalle-renovacion-contrato')
    const responsablePago = document.getElementById('detalle-responsable-pago');
    const responsableContrato = document.getElementById('detalle-responsable-contrato');

    const fuentesFinanciamiento = {
        1: "Presupuesto Disponible",
        2: "Precio Referencial",
        3: "Monto no es posible de estimar"
    };

    const contratoRenovable = {
        0: "No",
        1: "Si"
    }

    if (estimacionBase) estimacionBase.textContent = fuentesFinanciamiento[lic.Estimacion];
    if (fuenteFinanciamiento) fuenteFinanciamiento.textContent = lic.FuenteFinanciamiento || "No Especifica";
    if (renovacionContrato) renovacionContrato.textContent = contratoRenovable[lic.EsRenovable] || "No Especifica";
    if (responsablePago) responsablePago.textContent = limpiarTexto(lic.NombreResponsablePago);
    if (responsableContrato) responsableContrato.textContent = limpiarTexto(lic.NombreResponsableContrato);

    if (elMonto) {
        const montoNum = parseFloat(lic.MontoEstimado);
        elMonto.textContent = !isNaN(montoNum) && montoNum > 0
            ? `$${montoNum.toLocaleString('es-CL')} ${limpiarTexto(lic.Moneda)}  `
            : 'Monto no especificado';
    }

    // Renderizar la tabla interna de ítems requeridos
    const tbodyItems = document.getElementById('tabla-detalle-items');
    if (tbodyItems && lic.Items && lic.Items.Listado) {
        tbodyItems.innerHTML = '';
        lic.Items.Listado.forEach((item) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <th scope="row">${item.Correlativo}</th>
                <td class="fw-semibold">${limpiarTexto(item.CodigoProducto)}</td>
                <td class="fw-semibold">${limpiarTexto(item.CodigoCategoria)}</td>
                <td class="small">${limpiarTexto(item.Categoria)}</td>
                <td class="small">${limpiarTexto(item.NombreProducto)}</td>
                <td class="small">${limpiarTexto(item.Descripcion)}</td>
                <td class="text-center fw-bold">${item.Cantidad || 0}</td>
                <td>${limpiarTexto(item.UnidadMedida)}</td>
            `;
            tbodyItems.appendChild(tr);
        });
    }

    // Hacer visible el contenedor completo una vez poblado
    const contenedorDetalle = document.getElementById('detalle-licitacion');
    if (contenedorDetalle) contenedorDetalle.classList.remove('d-none');
}

// --- MÓDULO VISUAL DE PROVEEDORES ---
async function procesarBusquedaProveedor(rutFormateado) {
    ocultarAlerta();
    const moduloResultado = document.getElementById('resultado-proveedor');
    if (moduloResultado) moduloResultado.classList.add('d-none');

    mostrarLoader();
    try {
        const data = await apiObtenerProveedor(rutFormateado);
        const empresa = data.listaEmpresas[0];

        const elRazonSocial = document.getElementById('prov-razon-social');
        const elRut = document.getElementById('prov-rut');
        const elId = document.getElementById('prov-id');

        if (elRazonSocial) elRazonSocial.textContent = limpiarTexto(empresa.NombreEmpresa);
        if (elRut) elRut.textContent = rutFormateado;
        if (elId) elId.textContent = limpiarTexto(empresa.CodigoEmpresa);

        if (moduloResultado) moduloResultado.classList.remove('d-none');
    } catch (error) {
        if (error.message.includes('429')) {
            mostrarAlerta('El servicio de ChileCompra está temporalmente saturado (Error 429). Por favor, reintente en unos instantes.', 'warning');
        } else {
            mostrarAlerta(error.message, 'warning');
        }
    } finally {
        ocultarLoader();
    }
}

window.procesarBusquedaProveedor = procesarBusquedaProveedor;


// --- HILO PRINCIPAL DE INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    inicializarVistaLicitaciones();
    mostrarTablaDeActivas()
    inicializarVistaDetalle(); // <-- ACTIVADO: Carga el módulo de detalles dinámicamente si aplica


    // Escuchador para el botón de búsqueda directa
    const btnDirecto = document.getElementById('btn-buscar-directo');
    if (btnDirecto) {
        btnDirecto.addEventListener('click', procesarBusquedaDirectaPorCodigo);
    }

    // Verificación de parámetros URL de redirección
    const urlParams = new URLSearchParams(window.location.search);
    const rutUrl = urlParams.get('rut');

    if (rutUrl) {
        const inputRut = document.getElementById('input-rut');
        if (inputRut) {
            inputRut.value = rutUrl;
            inputRut.classList.add('is-valid');
        }
        window.procesarBusquedaProveedor(rutUrl);
    }

});

/**
 * Anima un elemento numérico desde 0 hasta su valor final de forma fluida.
 * @param {HTMLElement} elemento - El nodo HTML donde se pintará el número.
 * @param {number} valorFinal - El número de la API (ej: 4653).
 * @param {number} duracion - Tiempo en milisegundos que durará la animación.
 */
function animarContador(elemento, valorFinal, duracion = 2000) {
    let tiempoInicio = null;

    // Esta función interna se ejecutará en cada frame de la pantalla
    function actualizarNumero(tiempoActual) {
        if (!tiempoInicio) tiempoInicio = tiempoActual;

        // Calculamos cuánto tiempo ha pasado desde que empezó la animación
        const tiempoTranscurrido = tiempoActual - tiempoInicio;

        // Calculamos el progreso entre 0.0 y 1.0
        const progreso = Math.min(tiempoTranscurrido / duracion, 1);

        // Calculamos el número actual basado en el progreso
        const valorActual = Math.floor(progreso * valorFinal);

        // Inyectamos el número formateado con puntos de miles locales (ej: 4.653)
        elemento.textContent = valorActual.toLocaleString('es-CL');

        // Si no hemos llegado al 100% del tiempo, seguimos animando en el próximo frame
        if (progreso < 1) {
            requestAnimationFrame(actualizarNumero);
        }
    }

    // Arrancamos la animación
    requestAnimationFrame(actualizarNumero);
}

const estadosLicitacion = {
    5: { clase: "bg-success", icono: "fa-bullhorn", texto: "Publicada" },
    6: { clase: "bg-secondary", icono: "fa-lock", texto: "Cerrada" },
    7: { clase: "bg-dark", icono: "fa-ban", texto: "Desierta" },
    8: { clase: "bg-primary", icono: "fa-gavel", texto: "Adjudicada" },
    15: { clase: "bg-danger", icono: "fa-times-circle", texto: "Revocada" },
    19: { clase: "bg-warning text-dark", icono: "fa-exclamation-triangle", texto: "Suspendida" }
};

function obtenerBadgeEstado(codigo) {
    const estado = estadosLicitacion[codigo];

    if (!estado) {
        return `<span class="badge bg-light text-dark">Código ${codigo}</span>`;
    }

    return `
        <span class="badge ${estado.clase}">
            <i class="fas ${estado.icono} me-1"></i>
            ${estado.texto}
        </span>
    `;
}

function formatearFecha(fechaIso) {
    const [fecha, horas] = fechaIso.split('T');
    const fechaFormateada = fecha.split('-').reverse().join('-');
    const [hora, minuto] = horas.split(':');

    return `${fechaFormateada} ${hora}:${minuto}`;
}