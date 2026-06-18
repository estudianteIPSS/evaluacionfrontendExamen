/**
 * js/api.js
 * Capa de conectividad con los servicios de Mercado Público.
 * Implementa el manejo controlado de códigos de estado HTTP y la sanitización de cadenas.
 */

const API_TICKET = 'AC3A098B-4CD0-41AF-81A5-41284248419B';
const BASE_URL = 'https://api.mercadopublico.cl/servicios/v1/publico';
const PROV_URL = `${BASE_URL}/Empresas/BuscarProveedor`;

function limpiarTexto(texto) {
    if (texto === null || texto === undefined || texto.toString().trim() === '') {
        return '--';
    }
    let textoLimpio = texto.toString().trim();
    textoLimpio = textoLimpio
        .replace(/&Aacute;/g, 'Á').replace(/&aaaa;/g, 'á').replace(/&aacute;/g, 'á')
        .replace(/&Eacute;/g, 'É').replace(/&eacute;/g, 'é')
        .replace(/&Iacute;/g, 'Í').replace(/&iacute;/g, 'í')
        .replace(/&Oacute;/g, 'Ó').replace(/&oacute;/g, 'ó')
        .replace(/&Uacute;/g, 'Ú').replace(/&uacute;/g, 'ú')
        .replace(/&Ntilde;/g, 'Ñ').replace(/&ntilde;/g, 'ñ')
        .replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        
    return textoLimpio;
}

async function fetchConManejoErrores(url) {
    try {
        const respuesta = await fetch(url);
        if (respuesta.status === 429) {
            throw new Error('Error 429: Demasiadas solicitudes simultáneas. El servicio de ChileCompra está saturado.');
        }
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status} - ${respuesta.statusText}`);
        }
        return await respuesta.json();
    } catch (error) {
        console.error("Falla en la infraestructura Fetch:", error);
        throw error;
    }
}

/**
 * Obtiene el listado de procesos por fecha y estado.
 */
async function apiObtenerLicitaciones(fecha, estado) {
    if (!fecha) throw new Error('Criterio Inválido: La fecha es mandatoria para indexar licitaciones.');
    
    let fechaFormateada = fecha;
    if (fecha.includes('-')) {
        const partes = fecha.split('-');
        fechaFormateada = `${partes[2]}${partes[1]}${partes[0]}`; // Convierte YYYY-MM-DD a DDMMYYYY
    }
    
    const url = `${BASE_URL}/licitaciones.json?fecha=${fechaFormateada}&estado=${estado}&ticket=${API_TICKET}`;
    const data = await fetchConManejoErrores(url);
    
    if (!data || !data.Listado || data.Listado.length === 0 || data.Cantidad === 0) {
        throw new Error('Respuesta Vacía: No se registran procesos de licitación pública para los filtros indicados.');
    }
    return data;
}

/**
 * Solicita el desglose de campos para una licitación específica.
 */
async function apiObtenerDetalleLicitacion(codigo) {
    if (!codigo) throw new Error('Criterio Inválido: Se requiere el código externo de la licitación.');
    
    const url = `${BASE_URL}/licitaciones.json?codigo=${codigo}&ticket=${API_TICKET}`;
    const data = await fetchConManejoErrores(url);
    
    if (!data || !data.Listado || data.Listado.length === 0) {
        throw new Error('Detalle No Encontrado: El código externo provisto no coincide con ningún proceso registrado.');
    }
    return data;
}

/**
 * Obtiene la información comercial consolidada de un proveedor mediante su RUT.
 */
async function apiObtenerProveedor(rut) {
    if (!rut) throw new Error('Criterio Inválido: Es obligatorio suministrar un RUT de proveedor.');
    
    // CORRECCIÓN: codificación explícita del parámetro formateado con puntos y guion
    const url = `${PROV_URL}?rutempresaproveedor=${encodeURIComponent(rut)}&ticket=${API_TICKET}`;
    const data = await fetchConManejoErrores(url);
    
    if (!data || !data.listaEmpresas || data.listaEmpresas.length === 0 || data.Cantidad === 0) {
        throw new Error('Proveedor No Encontrado: El RUT indicado no figura en el registro simplificado de la API.');
    }
    return data;
}

async function apiObtenerLicitacionesActivas(estado) {
    // 1. Eliminamos el validador de fecha. El estado sigue siendo obligatorio.
    if (!estado) throw new Error('Criterio Inválido: El estado es requerido.');
        
    // 2. Construimos el link perfecto (sin el parámetro &fecha)
    const url = `${BASE_URL}/licitaciones.json?estado=${estado}&ticket=${API_TICKET}`;
    
    // 3. Viajamos a internet
    const data = await fetchConManejoErrores(url);
    
    // 4. Validamos que la API haya respondido algo útil antes de retornar
    if (!data) {
        throw new Error('Error de conexión: No se recibieron datos de la API.');
    }
    
    // Retornamos el objeto completo (que adentro trae .Cantidad y .Listado)
    return data;
}