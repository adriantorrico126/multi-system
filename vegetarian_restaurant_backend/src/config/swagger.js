const swaggerJsdoc = require('swagger-jsdoc');
const envConfig = require('./envConfig');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API del Sistema de Restaurante Vegetariano',
      version: '1.0.0',
      description:
        'Documentación de la API para el sistema de gestión de un restaurante vegetariano. ' +
        'Incluye módulos para autenticación, productos, categorías, ventas, mesas y sucursales.',
      contact: {
        name: 'Soporte API',
        url: 'http://localhost:3000/support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${envConfig.PORT}${envConfig.API_PREFIX}`,
        description: 'Servidor de Desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token de autenticación JWT (Bearer Token)',
        },
      },
      schemas: {
        // Definiciones de esquemas comunes (ej. para validación de entrada/salida)
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensaje de error',
            },
            status: {
              type: 'integer',
              description: 'Código de estado HTTP',
            },
          },
          required: ['message', 'status'],
        },
        // Esquemas para Producto
        Producto: {
          type: 'object',
          properties: {
            id_producto: { type: 'integer', description: 'ID único del producto' },
            nombre: { type: 'string', description: 'Nombre del producto' },
            precio: { type: 'number', format: 'float', description: 'Precio del producto' },
            id_categoria: { type: 'integer', description: 'ID de la categoría a la que pertenece el producto' },
            stock_actual: { type: 'integer', description: 'Cantidad actual en stock' },
            activo: { type: 'boolean', description: 'Indica si el producto está activo' },
            imagen_url: { type: 'string', description: 'URL de la imagen del producto' },
            created_at: { type: 'string', format: 'date-time', description: 'Fecha de creación' },
          },
          required: ['nombre', 'precio', 'id_categoria'],
        },
        NewProducto: {
          type: 'object',
          properties: {
            nombre: { type: 'string', description: 'Nombre del producto' },
            precio: { type: 'number', format: 'float', description: 'Precio del producto' },
            id_categoria: { type: 'integer', description: 'ID de la categoría' },
            stock_actual: { type: 'integer', description: 'Cantidad en stock' },
            imagen_url: { type: 'string', description: 'URL de la imagen' },
          },
          required: ['nombre', 'precio', 'id_categoria'],
        },
        UpdateProducto: {
          type: 'object',
          properties: {
            nombre: { type: 'string', description: 'Nombre del producto' },
            precio: { type: 'number', format: 'float', description: 'Precio del producto' },
            id_categoria: { type: 'integer', description: 'ID de la categoría' },
            stock_actual: { type: 'integer', description: 'Cantidad en stock' },
            activo: { type: 'boolean', description: 'Estado activo/inactivo' },
            imagen_url: { type: 'string', description: 'URL de la imagen' },
          },
        },
        // Esquemas para Categoría
        Categoria: {
          type: 'object',
          properties: {
            id_categoria: { type: 'integer', description: 'ID único de la categoría' },
            nombre: { type: 'string', description: 'Nombre de la categoría' },
            activo: { type: 'boolean', description: 'Indica si la categoría está activa' },
            created_at: { type: 'string', format: 'date-time', description: 'Fecha de creación' },
          },
          required: ['nombre'],
        },
        NewCategoria: {
          type: 'object',
          properties: {
            nombre: { type: 'string', description: 'Nombre de la categoría' },
          },
          required: ['nombre'],
        },
        UpdateCategoria: {
          type: 'object',
          properties: {
            nombre: { type: 'string', description: 'Nombre de la categoría' },
            activo: { type: 'boolean', description: 'Estado activo/inactivo' },
          },
        },
        // Esquemas para Vendedor (Usuario)
        Vendedor: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'ID único del vendedor' },
            nombre: { type: 'string', description: 'Nombre completo del vendedor' },
            username: { type: 'string', description: 'Nombre de usuario único' },
            email: { type: 'string', format: 'email', description: 'Correo electrónico del vendedor' },
            rol: { type: 'string', enum: ['cajero', 'gerente', 'admin', 'cocinero'], description: 'Rol del vendedor' },
            activo: { type: 'boolean', description: 'Indica si el vendedor está activo' },
            id_sucursal: { type: 'integer', description: 'ID de la sucursal a la que pertenece' },
            sucursal_nombre: { type: 'string', description: 'Nombre de la sucursal' },
            created_at: { type: 'string', format: 'date-time', description: 'Fecha de creación' },
          },
          required: ['nombre', 'username', 'rol', 'id_sucursal'],
        },
        LoginRequest: {
          type: 'object',
          properties: {
            username: { type: 'string' },
            password: { type: 'string' },
          },
          required: ['username', 'password'],
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token: { type: 'string' },
            data: { $ref: '#/components/schemas/Vendedor' },
          },
        },
        NewVendedor: {
          type: 'object',
          properties: {
            nombre: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
            rol: { type: 'string', enum: ['cajero', 'gerente', 'admin', 'cocinero'] },
            id_sucursal: { type: 'integer' },
          },
          required: ['nombre', 'username', 'password', 'rol', 'id_sucursal'],
        },
        // Esquemas para Venta
        Venta: {
          type: 'object',
          properties: {
            id_venta: { type: 'integer' },
            fecha: { type: 'string', format: 'date-time' },
            id_vendedor: { type: 'integer' },
            id_pago: { type: 'integer' },
            id_sucursal: { type: 'integer' },
            tipo_servicio: { type: 'string', enum: ['Mesa', 'Delivery', 'Para Llevar'] },
            total: { type: 'number', format: 'float' },
            mesa_numero: { type: 'integer', nullable: true },
            estado: { type: 'string', enum: ['recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado'] },
            created_at: { type: 'string', format: 'date-time' },
          },
          required: ['id_vendedor', 'id_pago', 'id_sucursal', 'tipo_servicio', 'total'],
        },
        DetalleVentaItem: {
          type: 'object',
          properties: {
            id_producto: { type: 'integer' },
            cantidad: { type: 'integer' },
            precio_unitario: { type: 'number', format: 'float' },
            observaciones: { type: 'string', nullable: true },
          },
          required: ['id_producto', 'cantidad', 'precio_unitario'],
        },
        NewVentaRequest: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/DetalleVentaItem' },
            },
            total: { type: 'number', format: 'float' },
            paymentMethod: { type: 'string' },
            cashier: { type: 'string' },
            branch: { type: 'string' },
            tipo_servicio: { type: 'string', enum: ['Mesa', 'Delivery', 'Para Llevar'], default: 'Mesa' },
            mesa_numero: { type: 'integer', nullable: true },
            invoiceData: {
              type: 'object',
              properties: {
                nit: { type: 'string' },
                businessName: { type: 'string' },
              },
              required: ['nit', 'businessName'],
            },
          },
          required: ['items', 'total', 'paymentMethod', 'cashier', 'branch'],
        },
        UpdateEstadoPedidoRequest: {
          type: 'object',
          properties: {
            estado: { type: 'string', enum: ['recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado'] },
          },
          required: ['estado'],
        },
        // Esquemas para Mesa
        Mesa: {
          type: 'object',
          properties: {
            id_mesa: { type: 'integer' },
            numero: { type: 'integer' },
            id_sucursal: { type: 'integer' },
            capacidad: { type: 'integer' },
            estado: { type: 'string', enum: ['libre', 'en_uso', 'pendiente_cobro', 'reservada', 'mantenimiento'] },
            id_venta_actual: { type: 'integer', nullable: true },
            hora_apertura: { type: 'string', format: 'date-time', nullable: true },
            hora_cierre: { type: 'string', format: 'date-time', nullable: true },
            total_acumulado: { type: 'number', format: 'float' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
          required: ['numero', 'id_sucursal'],
        },
        NewMesaRequest: {
          type: 'object',
          properties: {
            numero: { type: 'integer' },
            id_sucursal: { type: 'integer' },
            capacidad: { type: 'integer', default: 4 },
            estado: { type: 'string', enum: ['libre', 'en_uso', 'pendiente_cobro', 'reservada', 'mantenimiento'], default: 'libre' },
          },
          required: ['numero', 'id_sucursal'],
        },
        UpdateMesaRequest: {
          type: 'object',
          properties: {
            numero: { type: 'integer' },
            capacidad: { type: 'integer' },
            estado: { type: 'string', enum: ['libre', 'en_uso', 'pendiente_cobro', 'reservada', 'mantenimiento'] },
          },
        },
        AbrirMesaRequest: {
          type: 'object',
          properties: {
            numero: { type: 'integer' },
            id_sucursal: { type: 'integer' },
          },
          required: ['numero', 'id_sucursal'],
        },
        AgregarProductosAMesaRequest: {
          type: 'object',
          properties: {
            numero: { type: 'integer' },
            id_sucursal: { type: 'integer' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/DetalleVentaItem' },
            },
            total: { type: 'number', format: 'float' },
          },
          required: ['numero', 'id_sucursal', 'items', 'total'],
        },
        CerrarMesaConFacturaRequest: {
          type: 'object',
          properties: {
            mesa_numero: { type: 'integer' },
            id_sucursal: { type: 'integer' },
            paymentMethod: { type: 'string' },
            invoiceData: {
              type: 'object',
              properties: {
                nit: { type: 'string' },
                businessName: { type: 'string' },
              },
              required: ['nit', 'businessName'],
            },
          },
          required: ['mesa_numero', 'id_sucursal', 'paymentMethod'],
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // Rutas donde se encuentran las anotaciones JSDoc
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
