# LicitaSeguro 🇨🇱

LicitaSeguro es una aplicación web del lado del cliente (Frontend Vanilla JS) diseñada para interactuar de forma robusta con la **API de Mercado Público de Chile**. Permite buscar licitaciones en tiempo real por fecha/estado, inspeccionar el desglose detallado de cada proceso y consultar información comercial de proveedores mediante su RUT.

El proyecto está construido bajo estándares de accesibilidad **WCAG 2.1** y cuenta con una arquitectura defensiva contra la volatilidad de los datos públicos.

## 🔗 Demo en Vivo
Puedes probar la aplicación en tiempo real y completamente operativa aquí:
👉 **[Despliegue en GitHub Pages](https://estudianteipss.github.io/evaluacionfrontendExamen/)**

## 🚀 Características Clave

- **Buscador Avanzado de Licitaciones:** Filtra los procesos de ChileCompra por fecha y estados dinámicos (publicadas, adjudicadas, revocadas, etc.).
- **Visualizador de Detalles Inteligente:** Muestra el desglose de productos/ítems, montos estimados, fechas de cierre y datos de adjudicación.
- **Consultor de Proveedores:** Módulo integrado para buscar empresas utilizando el RUT.
- **Validación Avanzada de RUT:** Implementa el algoritmo oficial de **Módulo 11** para sanitizar, validar y formatear el RUT automáticamente en el formato estricto requerido por la API institucional (`XX.XXX.XXX-X`).
- **Accesibilidad Universal (WCAG 2.1):** Incluye un mecanismo nativo de alto contraste que persiste la preferencia del usuario mediante `localStorage`.
- **Arquitectura Defensiva (Data Shielding):** Control de errores HTTP críticos (como el Error 429 por exceso de solicitudes) y renderizado seguro contra campos nulos, vacíos o estructuras mutables en los JSON de la API.

## 📁 Estructura del Proyecto

```text
├── index.html                 # Página de bienvenida y acceso principal
├── licitaciones.html          # Interfaz del buscador de procesos
├── detalle.html               # Panel dinámico de desglose de licitación
├── proveedores.html           # Buscador comercial de proveedores por RUT
├── css/
│   └── styles.css             # Estilos personalizados y variables de alto contraste
└── js/
    ├── api.js                 # Capa de conectividad HTTP, Fetch y sanitización de caracteres ASCII
    ├── ui.js                  # Controlador maestro de la interfaz, paginación local y renderizado
    ├── Accesibilidad.js       # Controlador donde se maneja la Accesibilidad
    └── validaciones.js        # Lógica matemática del RUT y estados visuales de Bootstrap
