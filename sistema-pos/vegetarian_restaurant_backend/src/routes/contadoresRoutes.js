const express = require('express');
const router = express.Router();
const ContadorUsoController = require('../controllers/ContadorUsoController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const {
    validateActiveSubscriptionPlan,
    getCurrentLimits
} = require('../middleware');

// =====================================================
// INSTANCIA DEL CONTROLADOR
// =====================================================

const contadorUsoController = new ContadorUsoController();

// =====================================================
// RUTAS DE CONSULTA DE CONTADORES
// =====================================================

/**
 * @route GET /api/contadores/estadisticas-globales
 * @desc Obtener estadísticas globales de uso
 * @access Admin
 */
router.get('/estadisticas-globales', contadorUsoController.getGlobalUsageStats.bind(contadorUsoController));

/**
 * @route GET /api/contadores/estadisticas-por-plan
 * @desc Obtener estadísticas de uso por plan
 * @access Admin
 */
router.get('/estadisticas-por-plan', contadorUsoController.getUsageStatsByPlan.bind(contadorUsoController));

/**
 * @route GET /api/contadores/con-alertas
 * @desc Obtener contadores con alertas
 * @access Admin
 */
router.get('/con-alertas', contadorUsoController.getCountersWithAlerts.bind(contadorUsoController));

/**
 * @route GET /api/contadores/plan/:idPlan
 * @desc Obtener contadores por plan
 * @access Admin
 */
router.get('/plan/:idPlan', contadorUsoController.getCountersByPlan.bind(contadorUsoController));

// =====================================================
// RUTAS DE RESTAURANTES
// =====================================================

/**
 * @route GET /api/contadores/restaurante/:idRestaurante/actual
 * @desc Obtener contador actual de un restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante/actual',
    authenticateToken,
    validateActiveSubscriptionPlan,
    getCurrentLimits,
    contadorUsoController.getCurrentUsage.bind(contadorUsoController)
);

/**
 * @route GET /api/contadores/restaurante/:idRestaurante/historial
 * @desc Obtener historial de uso de un restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante/historial',
    authenticateToken,
    validateActiveSubscriptionPlan,
    contadorUsoController.getUsageHistory.bind(contadorUsoController)
);

/**
 * @route GET /api/contadores/restaurante/:idRestaurante/limites
 * @desc Verificar límites de un restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante/limites',
    authenticateToken,
    validateActiveSubscriptionPlan,
    getCurrentLimits,
    contadorUsoController.checkLimits.bind(contadorUsoController)
);

/**
 * @route GET /api/contadores/restaurante/:idRestaurante/puede-agregar/:tipoRecurso
 * @desc Verificar si se puede agregar un recurso
 * @access Private
 */
router.get('/restaurante/:idRestaurante/puede-agregar/:tipoRecurso',
    authenticateToken,
    validateActiveSubscriptionPlan,
    contadorUsoController.canAddResource.bind(contadorUsoController)
);

// =====================================================
// RUTAS DE ACTUALIZACIÓN DE CONTADORES
// =====================================================

/**
 * @route PUT /api/contadores/restaurante/:idRestaurante/sucursales
 * @desc Actualizar contador de sucursales
 * @access Private
 */
router.put('/restaurante/:idRestaurante/sucursales',
    validateActiveSubscriptionPlan,
    contadorUsoController.updateSucursalesCount.bind(contadorUsoController)
);

/**
 * @route PUT /api/contadores/restaurante/:idRestaurante/usuarios
 * @desc Actualizar contador de usuarios
 * @access Private
 */
router.put('/restaurante/:idRestaurante/usuarios',
    validateActiveSubscriptionPlan,
    contadorUsoController.updateUsuariosCount.bind(contadorUsoController)
);

/**
 * @route PUT /api/contadores/restaurante/:idRestaurante/productos
 * @desc Actualizar contador de productos
 * @access Private
 */
router.put('/restaurante/:idRestaurante/productos',
    validateActiveSubscriptionPlan,
    contadorUsoController.updateProductosCount.bind(contadorUsoController)
);

/**
 * @route PUT /api/contadores/restaurante/:idRestaurante/transacciones
 * @desc Actualizar contador de transacciones
 * @access Private
 */
router.put('/restaurante/:idRestaurante/transacciones',
    validateActiveSubscriptionPlan,
    contadorUsoController.updateTransaccionesCount.bind(contadorUsoController)
);

/**
 * @route PUT /api/contadores/restaurante/:idRestaurante/almacenamiento
 * @desc Actualizar contador de almacenamiento
 * @access Private
 */
router.put('/restaurante/:idRestaurante/almacenamiento',
    validateActiveSubscriptionPlan,
    contadorUsoController.updateAlmacenamientoCount.bind(contadorUsoController)
);

/**
 * @route PUT /api/contadores/restaurante/:idRestaurante/todos
 * @desc Actualizar todos los contadores de un restaurante
 * @access Private
 */
router.put('/restaurante/:idRestaurante/todos',
    validateActiveSubscriptionPlan,
    contadorUsoController.updateAllCounters.bind(contadorUsoController)
);

// =====================================================
// RUTAS DE INFORMACIÓN DE USO
// =====================================================

/**
 * @route GET /api/contadores/restaurante/:idRestaurante/resumen
 * @desc Obtener resumen de uso del restaurante
 * @access Private
 */
router.get('/restaurante/:idRestaurante/resumen',
    authenticateToken,
    validateActiveSubscriptionPlan,
    getCurrentLimits,
    (req, res) => {
        const { idRestaurante } = req.params;
        const suscripcion = req.suscripcion;
        const limites = req.currentLimits;
        
        // Calcular porcentajes de uso
        const resumen = {
            plan_actual: suscripcion.nombre_plan,
            fecha_actualizacion: new Date().toISOString(),
            uso: {
                sucursales: {
                    actual: limites.sucursales_actuales || 0,
                    limite: suscripcion.max_sucursales,
                    porcentaje: suscripcion.max_sucursales > 0 ? 
                        Math.round(((limites.sucursales_actuales || 0) / suscripcion.max_sucursales) * 100) : 0,
                    estado: suscripcion.max_sucursales > 0 ? 
                        ((limites.sucursales_actuales || 0) / suscripcion.max_sucursales) >= 0.8 ? 'alto' : 'normal' : 'normal'
                },
                usuarios: {
                    actual: limites.usuarios_actuales || 0,
                    limite: suscripcion.max_usuarios,
                    porcentaje: suscripcion.max_usuarios > 0 ? 
                        Math.round(((limites.usuarios_actuales || 0) / suscripcion.max_usuarios) * 100) : 0,
                    estado: suscripcion.max_usuarios > 0 ? 
                        ((limites.usuarios_actuales || 0) / suscripcion.max_usuarios) >= 0.8 ? 'alto' : 'normal' : 'normal'
                },
                productos: {
                    actual: limites.productos_actuales || 0,
                    limite: suscripcion.max_productos,
                    porcentaje: suscripcion.max_productos > 0 ? 
                        Math.round(((limites.productos_actuales || 0) / suscripcion.max_productos) * 100) : 0,
                    estado: suscripcion.max_productos > 0 ? 
                        ((limites.productos_actuales || 0) / suscripcion.max_productos) >= 0.8 ? 'alto' : 'normal' : 'normal'
                },
                transacciones: {
                    actual: limites.transacciones_mes_actual || 0,
                    limite: suscripcion.max_transacciones_mes,
                    porcentaje: suscripcion.max_transacciones_mes > 0 ? 
                        Math.round(((limites.transacciones_mes_actual || 0) / suscripcion.max_transacciones_mes) * 100) : 0,
                    estado: suscripcion.max_transacciones_mes > 0 ? 
                        ((limites.transacciones_mes_actual || 0) / suscripcion.max_transacciones_mes) >= 0.8 ? 'alto' : 'normal' : 'normal'
                },
                almacenamiento: {
                    actual: limites.almacenamiento_usado_mb || 0,
                    limite: suscripcion.almacenamiento_gb * 1024,
                    porcentaje: suscripcion.almacenamiento_gb > 0 ? 
                        Math.round(((limites.almacenamiento_usado_mb || 0) / (suscripcion.almacenamiento_gb * 1024)) * 100) : 0,
                    estado: suscripcion.almacenamiento_gb > 0 ? 
                        ((limites.almacenamiento_usado_mb || 0) / (suscripcion.almacenamiento_gb * 1024)) >= 0.8 ? 'alto' : 'normal' : 'normal'
                }
            },
            alertas: [],
            recomendaciones: []
        };
        
        // Generar alertas y recomendaciones
        Object.keys(resumen.uso).forEach(recurso => {
            const data = resumen.uso[recurso];
            
            if (data.porcentaje >= 100) {
                resumen.alertas.push({
                    tipo: 'error',
                    recurso: recurso,
                    mensaje: `Límite de ${recurso} excedido (${data.porcentaje}%)`,
                    accion: 'upgrade_required'
                });
            } else if (data.porcentaje >= 90) {
                resumen.alertas.push({
                    tipo: 'warning',
                    recurso: recurso,
                    mensaje: `Límite de ${recurso} casi excedido (${data.porcentaje}%)`,
                    accion: 'monitor'
                });
            } else if (data.porcentaje >= 80) {
                resumen.alertas.push({
                    tipo: 'info',
                    recurso: recurso,
                    mensaje: `Uso alto de ${recurso} (${data.porcentaje}%)`,
                    accion: 'monitor'
                });
            }
            
            // Generar recomendaciones
            if (data.porcentaje >= 80) {
                resumen.recomendaciones.push({
                    tipo: 'upgrade',
                    recurso: recurso,
                    mensaje: `Considere actualizar su plan para aumentar el límite de ${recurso}`,
                    beneficio: `Mayor capacidad para ${recurso}`
                });
            }
        });
        
        res.status(200).json({
            success: true,
            message: 'Resumen de uso obtenido exitosamente',
            data: resumen
        });
    }
);

/**
 * @route GET /api/contadores/restaurante/:idRestaurante/graficos
 * @desc Obtener datos para gráficos de uso
 * @access Private
 */
router.get('/restaurante/:idRestaurante/graficos',
    authenticateToken,
    validateActiveSubscriptionPlan,
    contadorUsoController.getUsageHistory.bind(contadorUsoController),
    (req, res) => {
        const historial = req.historial || [];
        const suscripcion = req.suscripcion;
        
        // Procesar datos para gráficos
        const datosGraficos = {
            uso_por_mes: historial.map(registro => ({
                mes: `${registro.año_medicion}-${registro.mes_medicion.toString().padStart(2, '0')}`,
                sucursales: registro.sucursales_actuales,
                usuarios: registro.usuarios_actuales,
                productos: registro.productos_actuales,
                transacciones: registro.transacciones_mes_actual,
                almacenamiento: registro.almacenamiento_usado_mb
            })),
            porcentajes_uso: historial.map(registro => ({
                mes: `${registro.año_medicion}-${registro.mes_medicion.toString().padStart(2, '0')}`,
                porcentaje_sucursales: registro.porcentaje_sucursales,
                porcentaje_usuarios: registro.porcentaje_usuarios,
                porcentaje_productos: registro.porcentaje_productos,
                porcentaje_transacciones: registro.porcentaje_transacciones,
                porcentaje_almacenamiento: registro.porcentaje_almacenamiento
            })),
            tendencias: {
                crecimiento_sucursales: calcularTendencia(historial, 'sucursales_actuales'),
                crecimiento_usuarios: calcularTendencia(historial, 'usuarios_actuales'),
                crecimiento_productos: calcularTendencia(historial, 'productos_actuales'),
                crecimiento_transacciones: calcularTendencia(historial, 'transacciones_mes_actual'),
                crecimiento_almacenamiento: calcularTendencia(historial, 'almacenamiento_usado_mb')
            }
        };
        
        res.status(200).json({
            success: true,
            message: 'Datos para gráficos obtenidos exitosamente',
            data: datosGraficos
        });
    }
);

// =====================================================
// RUTAS DE ANÁLISIS DE USO
// =====================================================

/**
 * @route GET /api/contadores/restaurante/:idRestaurante/analisis
 * @desc Obtener análisis detallado del uso
 * @access Private
 */
router.get('/restaurante/:idRestaurante/analisis',
    authenticateToken,
    validateActiveSubscriptionPlan,
    getCurrentLimits,
    (req, res) => {
        const { idRestaurante } = req.params;
        const suscripcion = req.suscripcion;
        const limites = req.currentLimits;
        
        // Análisis de eficiencia
        const analisis = {
            plan_actual: suscripcion.nombre_plan,
            eficiencia_general: calcularEficienciaGeneral(limites, suscripcion),
            recursos_mas_utilizados: obtenerRecursosMasUtilizados(limites, suscripcion),
            recursos_subutilizados: obtenerRecursosSubutilizados(limites, suscripcion),
            proyecciones: {
                crecimiento_estimado: calcularProyeccionCrecimiento(limites, suscripcion),
                fecha_limite_estimada: calcularFechaLimiteEstimada(limites, suscripcion)
            },
            optimizaciones: generarOptimizaciones(limites, suscripcion),
            recomendaciones_plan: generarRecomendacionesPlan(limites, suscripcion)
        };
        
        res.status(200).json({
            success: true,
            message: 'Análisis de uso obtenido exitosamente',
            data: analisis
        });
    }
);

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Calcular tendencia de crecimiento
 */
function calcularTendencia(historial, campo) {
    if (historial.length < 2) return 0;
    
    const valores = historial.map(h => h[campo] || 0);
    const primerValor = valores[0];
    const ultimoValor = valores[valores.length - 1];
    
    if (primerValor === 0) return ultimoValor > 0 ? 100 : 0;
    
    return Math.round(((ultimoValor - primerValor) / primerValor) * 100);
}

/**
 * Calcular eficiencia general
 */
function calcularEficienciaGeneral(limites, suscripcion) {
    const recursos = ['sucursales', 'usuarios', 'productos', 'transacciones', 'almacenamiento'];
    let totalPorcentaje = 0;
    let recursosActivos = 0;
    
    recursos.forEach(recurso => {
        const actual = limites[`${recurso}_actuales`] || 0;
        const limite = suscripcion[`max_${recurso}`] || (recurso === 'almacenamiento' ? suscripcion.almacenamiento_gb * 1024 : 0);
        
        if (limite > 0) {
            totalPorcentaje += (actual / limite) * 100;
            recursosActivos++;
        }
    });
    
    return recursosActivos > 0 ? Math.round(totalPorcentaje / recursosActivos) : 0;
}

/**
 * Obtener recursos más utilizados
 */
function obtenerRecursosMasUtilizados(limites, suscripcion) {
    const recursos = [];
    
    // Sucursales
    if (suscripcion.max_sucursales > 0) {
        recursos.push({
            nombre: 'sucursales',
            porcentaje: Math.round(((limites.sucursales_actuales || 0) / suscripcion.max_sucursales) * 100)
        });
    }
    
    // Usuarios
    if (suscripcion.max_usuarios > 0) {
        recursos.push({
            nombre: 'usuarios',
            porcentaje: Math.round(((limites.usuarios_actuales || 0) / suscripcion.max_usuarios) * 100)
        });
    }
    
    // Productos
    if (suscripcion.max_productos > 0) {
        recursos.push({
            nombre: 'productos',
            porcentaje: Math.round(((limites.productos_actuales || 0) / suscripcion.max_productos) * 100)
        });
    }
    
    // Transacciones
    if (suscripcion.max_transacciones_mes > 0) {
        recursos.push({
            nombre: 'transacciones',
            porcentaje: Math.round(((limites.transacciones_mes_actual || 0) / suscripcion.max_transacciones_mes) * 100)
        });
    }
    
    // Almacenamiento
    if (suscripcion.almacenamiento_gb > 0) {
        recursos.push({
            nombre: 'almacenamiento',
            porcentaje: Math.round(((limites.almacenamiento_usado_mb || 0) / (suscripcion.almacenamiento_gb * 1024)) * 100)
        });
    }
    
    return recursos.sort((a, b) => b.porcentaje - a.porcentaje).slice(0, 3);
}

/**
 * Obtener recursos subutilizados
 */
function obtenerRecursosSubutilizados(limites, suscripcion) {
    const recursos = obtenerRecursosMasUtilizados(limites, suscripcion);
    return recursos.filter(r => r.porcentaje < 30).slice(0, 3);
}

/**
 * Calcular proyección de crecimiento
 */
function calcularProyeccionCrecimiento(limites, suscripcion) {
    // Esta es una implementación simplificada
    // En un sistema real, se usarían algoritmos más sofisticados
    return {
        crecimiento_mensual_estimado: 5, // 5% mensual
        recursos_en_riesgo: ['sucursales', 'usuarios'], // Recursos que podrían exceder límites
        tiempo_estimado_limite: '3 meses'
    };
}

/**
 * Calcular fecha límite estimada
 */
function calcularFechaLimiteEstimada(limites, suscripcion) {
    const fechaActual = new Date();
    const fechaLimite = new Date(fechaActual.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 días
    return fechaLimite.toISOString().split('T')[0];
}

/**
 * Generar optimizaciones
 */
function generarOptimizaciones(limites, suscripcion) {
    const optimizaciones = [];
    
    // Optimización de almacenamiento
    if (limites.almacenamiento_usado_mb > 0) {
        optimizaciones.push({
            tipo: 'almacenamiento',
            descripcion: 'Considere comprimir archivos o eliminar datos antiguos',
            ahorro_estimado: '20-30%'
        });
    }
    
    // Optimización de productos
    if (limites.productos_actuales > 0) {
        optimizaciones.push({
            tipo: 'productos',
            descripcion: 'Revise productos inactivos o duplicados',
            ahorro_estimado: '10-15%'
        });
    }
    
    return optimizaciones;
}

/**
 * Generar recomendaciones de plan
 */
function generarRecomendacionesPlan(limites, suscripcion) {
    const recomendaciones = [];
    
    // Verificar si necesita upgrade
    const recursosAltoUso = obtenerRecursosMasUtilizados(limites, suscripcion)
        .filter(r => r.porcentaje >= 80);
    
    if (recursosAltoUso.length > 0) {
        recomendaciones.push({
            tipo: 'upgrade',
            mensaje: 'Considere actualizar su plan para evitar límites',
            recursos_afectados: recursosAltoUso.map(r => r.nombre),
            planes_recomendados: ['Profesional', 'Avanzado', 'Enterprise']
        });
    }
    
    // Verificar si puede hacer downgrade
    const recursosBajoUso = obtenerRecursosSubutilizados(limites, suscripcion);
    
    if (recursosBajoUso.length >= 3 && suscripcion.nombre_plan !== 'Básico') {
        recomendaciones.push({
            tipo: 'downgrade',
            mensaje: 'Puede considerar un plan más económico',
            ahorro_estimado: '30-50%',
            planes_recomendados: ['Básico', 'Profesional']
        });
    }
    
    return recomendaciones;
}

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// Middleware para manejar errores específicos de contadores
router.use((error, req, res, next) => {
    if (error.message === 'No se encontró información de uso para este restaurante') {
        return res.status(404).json({
            success: false,
            message: 'No se encontró información de uso para este restaurante'
        });
    }
    
    next(error);
});

module.exports = router;
