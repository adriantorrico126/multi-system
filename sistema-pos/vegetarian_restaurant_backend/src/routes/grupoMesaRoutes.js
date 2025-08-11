const express = require('express');
const router = express.Router();
const grupoMesaController = require('../controllers/grupoMesaController');
const { authenticateToken, authorizeRoles, ensureTenantContext } = require('../middlewares/authMiddleware');

// Crear grupo de mesas (unir varias mesas)
router.post('/', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin', 'mesero', 'cocinero'), ensureTenantContext, grupoMesaController.crearGrupo);

// Agregar una mesa a un grupo existente
router.post('/:id/mesas', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin', 'mesero', 'cocinero'), ensureTenantContext, grupoMesaController.agregarMesa);

// Remover una mesa de un grupo
router.delete('/:id/mesas/:idMesa', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin', 'mesero', 'cocinero'), ensureTenantContext, grupoMesaController.removerMesa);

// Cerrar grupo de mesas
router.post('/:id/cerrar', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin', 'mesero', 'cocinero'), ensureTenantContext, grupoMesaController.cerrarGrupo);

// Listar grupos activos
router.get('/activos', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin', 'mesero', 'cocinero'), ensureTenantContext, grupoMesaController.listarGruposActivos);

// Consultar grupo por mesa
router.get('/mesa/:idMesa', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin', 'mesero', 'cocinero'), ensureTenantContext, grupoMesaController.grupoPorMesa);

// Obtener información completa de un grupo
router.get('/:id/completo', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin', 'mesero', 'cocinero'), ensureTenantContext, grupoMesaController.obtenerGrupoCompleto);

// Listar grupos activos con información completa
router.get('/activos/completos', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin', 'mesero', 'cocinero'), ensureTenantContext, grupoMesaController.listarGruposActivosCompletos);

// Generar prefactura para un grupo completo
router.get('/:id/prefactura', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin', 'mesero', 'cocinero'), ensureTenantContext, grupoMesaController.generarPrefacturaGrupo);

// Disolver un grupo de mesas
router.post('/:id/disolver', authenticateToken, authorizeRoles('admin', 'super_admin', 'mesero', 'cocinero'), ensureTenantContext, grupoMesaController.disolverGrupo);

module.exports = router;