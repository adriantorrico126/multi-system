// ARCHIVO PUENTE PARA DIGITALOCEAN
// Resuelve el error: Cannot find module '../controllers/PlanController'

const planController = require('./planController');

// Exportar la clase PlanController tal como la espera planesRoutes.js
module.exports = class PlanController extends planController {
    constructor() {
        super();
    }
};
