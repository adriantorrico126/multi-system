const express = require('express');
const router = express.Router();
const arqueoController = require('../controllers/arqueoController');
const { authenticateToken, authorizeRoles, ensureTenantContext } = require('../middlewares/authMiddleware');

router.use(authenticateToken, ensureTenantContext);

router.get('/actual', authorizeRoles('admin','cajero','super_admin','cocinero','mesero'), arqueoController.getArqueoActual);
router.post('/abrir', authorizeRoles('admin','cajero','super_admin'), arqueoController.abrirArqueo);
router.post('/cerrar', authorizeRoles('admin','cajero','super_admin'), arqueoController.cerrarArqueo);

module.exports = router;


