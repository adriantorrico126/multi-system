const express = require('express');
const router = express.Router();
const inventarioLotesController = require('../controllers/inventarioLotesController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, authorizeRoles('admin', 'gerente'), inventarioLotesController.getAllLotes);
router.post('/', authenticateToken, authorizeRoles('admin', 'gerente'), inventarioLotesController.createLote);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'gerente'), inventarioLotesController.updateLote);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'gerente'), inventarioLotesController.deleteLote);

module.exports = router;
