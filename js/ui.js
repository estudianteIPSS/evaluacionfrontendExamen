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
        const estadoLimpio = limpiarTexto(item.CodigoEstado);

        tr.innerHTML = `
            <td class="fw-medium">${codigoLimpio}</td>
            <td>${nombreLimpio}</td>
            <td><span class="badge bg-secondary">${estadoLimpio}</span></td>
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
            mostrarAlerta("No se encontró información estructurada para esta licitación.", "warning");
        }
    } catch (error) {
        mostrarAlerta(error.message, "danger");
    } finally {
        ocultarLoader();
    }
}

function renderizarDetalleLicitacion(lic) {
    // Inyección segura evaluando la existencia previa de los nodos ID
    const elNombre = document.getElementById('detalle-nombre');
    const elCodigo = document.getElementById('detalle-codigo');
    const elDescripcion = document.getElementById('detalle-descripcion');
    const elEstado = document.getElementById('detalle-estado');
    const elOrganismo = document.getElementById('detalle-organismo');
    const elRutComprador = document.getElementById('detalle-rut-comprador');
    const elMonto = document.getElementById('detalle-monto');
    const elFechaCierre = document.getElementById('detalle-fecha-cierre');

    if (elNombre) elNombre.textContent = limpiarTexto(lic.Nombre);
    if (elCodigo) elCodigo.textContent = limpiarTexto(lic.CodigoExterno);
    if (elDescripcion) elDescripcion.textContent = limpiarTexto(lic.Descripcion);
    if (elEstado) elEstado.textContent = limpiarTexto(lic.Estado);
    if (elFechaCierre) elFechaCierre.textContent = limpiarTexto(lic.FechaCierre);

    if (elOrganismo && lic.Comprador) elOrganismo.textContent = limpiarTexto(lic.Comprador.NombreOrganismo);
    if (elRutComprador && lic.Comprador) elRutComprador.textContent = limpiarTexto(lic.Comprador.RutCartola);

    if (elMonto) {
        const montoNum = parseFloat(lic.MontoEstimado);
        elMonto.textContent = !isNaN(montoNum) && montoNum > 0 
            ? `$${montoNum.toLocaleString('es-CL')}` 
            : 'Consultar bases adjuntas';
    }

    // Renderizar la tabla interna de ítems requeridos
    const tbodyItems = document.getElementById('tabla-detalle-items');
    if (tbodyItems && lic.Items && lic.Items.Listado) {
        tbodyItems.innerHTML = '';
        lic.Items.Listado.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <th scope="row">${index + 1}</th>
                <td class="fw-semibold">${limpiarTexto(item.NombreProducto)}</td>
                <td class="small text-muted">${limpiarTexto(item.Descripcion)}</td>
                <td class="text-center fw-bold">${item.Cantidad || 0}</td>
                <td>${limpiarTexto(item.UnidadMedida)}</td>
            `;
            tbodyItems.appendChild(tr);
        });
    }

    // Procesar información sobre adjudicaciones si existen
    const elProvRut = document.getElementById('detalle-rut-proveedor');
    const btnProv = document.getElementById('btn-ver-proveedor');

    if (lic.Items && lic.Items.Listado && lic.Items.Listado[0] && lic.Items.Listado[0].Adjudicacion) {
        const adj = lic.Items.Listado[0].Adjudicacion;
        if (elProvRut) elProvRut.textContent = `RUT Adjudicado: ${limpiarTexto(adj.RutProveedor)}`;
        if (btnProv && adj.RutProveedor) {
            btnProv.classList.remove('d-none');
            btnProv.onclick = () => { window.location.href = `proveedores.html?rut=${adj.RutProveedor}`; };
        }
    } else {
        if (elProvRut) elProvRut.textContent = "Proceso sin proveedor adjudicado registrado.";
        if (btnProv) btnProv.classList.add('d-none');
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

// --- HILO PRINCIPAL DE INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    inicializarMecanismoAccesibilidad();
    inicializarVistaLicitaciones();
    inicializarVistaDetalle(); // <-- ACTIVADO: Carga el módulo de detalles dinámicamente si aplica
    
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