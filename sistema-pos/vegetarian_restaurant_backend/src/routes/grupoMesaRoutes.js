const express = require('express');
const router = express.Router();
const grupoMesaController = require('../controllers/grupoMesaController');
const { authenticateToken, authorizeRoles, ensureTenantContext } = require('../middlewares/authMiddleware');

// Crear grupo de mesas (unir varias mesas)
router.post('/', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin', 'mesero'), ensureTenantContext, grupoMesaController.crearGrupo);

// Agregar una mesa a un grupo existente
router.post('/:id/mesas', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin', 'mesero'), ensureTenantContext, grupoMesaController.agregarMesa);

// Remover una mesa de un grupo
router.delete('/:id/mesas/:idMesa', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin', 'mesero'), ensureTenantContext, grupoMesaController.removerMesa);

// Cerrar grupo de mesas
router.post('/:id/cerrar', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin', 'mesero'), ensureTenantContext, grupoMesaController.cerrarGrupo);

// Listar grupos activos
router.get('/activos', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin', 'mesero'), ensureTenantContext, grupoMesaController.listarGruposActivos);

// Consultar grupo por mesa
router.get('/mesa/:idMesa', authenticateToken, authorizeRoles('admin', 'cajero', 'super_admin', 'mesero'), ensureTenantContext, grupoMesaController.grupoPorMesa);

module.exports = router; 