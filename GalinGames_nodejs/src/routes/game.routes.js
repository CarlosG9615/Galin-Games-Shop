const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const gameController = require('../controllers/gameController');

const router = express.Router();

// /destacados y /plataforma/:plataforma van antes de /:id para que Express no las
// interprete como un id de juego (coinciden en posición de segmento de ruta).
router.get('/destacados', gameController.listDestacados);
router.get('/plataforma/:plataforma', gameController.listPorPlataforma);
router.get('/:id', gameController.getDetalle);
router.post('/:id/notificarme', requireAuth, gameController.suscribirNotificacion);

module.exports = router;
