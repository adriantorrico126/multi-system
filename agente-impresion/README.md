# Agente de Impresión Local

Este es un servicio de Node.js que se conecta al backend principal del sistema POS para gestionar la impresión de tickets de comandas en impresoras térmicas locales.

## Configuración

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Configurar el agente:**
    Abre el archivo `index.js` y modifica las siguientes constantes:
    - `BACKEND_URL`: La URL del servidor backend (ej: `http://localhost:3001`).
    - `RESTAURANTE_ID`: El ID numérico del restaurante donde este agente está operando.
    - `PRINTER_INTERFACE`: La conexión de la impresora. Puede ser `USB` o una dirección de red como `tcp://192.168.1.100`.

3.  **Iniciar el agente:**
    ```bash
    npm start
    ```

El agente se conectará automáticamente al backend y esperará trabajos de impresión.
