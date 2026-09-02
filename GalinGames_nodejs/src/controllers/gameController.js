const mongoose = require('mongoose');
const defaultGame = require('../models/Game');
const defaultGameStockSubscription = require('../models/GameStockSubscription');
const { AppError } = require('../utils/nullGuard');
const { resolvePlatform } = require('../utils/platformSlug');

// Nunca incluye descripcion/especificaciones/caracteristicas: Mongo no transmite por
// red los campos excluidos de un .select() (Requisito 19.5, design.md → API Design).
const LISTADO_SELECT = 'nombre slug imagenPortada plataformaDestacada plataformas.plataforma plataformas.precio';

// Inyección de dependencias: mismo patrón que createAddressController.
function createGameController({ Game, GameStockSubscription }) {
  async function listDestacados(req, res, next) {
    try {
      const games = await Game.find({ plataformaDestacada: { $ne: null } }).select(LISTADO_SELECT);

      const destacados = games.map((game) => {
        const disponibilidad = game.plataformas.find((p) => p.plataforma === game.plataformaDestacada);
        return {
          id: game._id,
          nombre: game.nombre,
          slug: game.slug,
          imagenPortada: game.imagenPortada,
          plataforma: game.plataformaDestacada,
          precio: disponibilidad ? disponibilidad.precio : null,
        };
      });

      return res.status(200).json(destacados);
    } catch (err) {
      return next(err);
    }
  }

  async function listPorPlataforma(req, res, next) {
    try {
      const plataforma = resolvePlatform(req.params.plataforma);
      if (!plataforma) return next(new AppError('Plataforma no encontrada', 404));

      const games = await Game.find({ 'plataformas.plataforma': plataforma }).select(LISTADO_SELECT);

      const resultado = games.map((game) => {
        const disponibilidad = game.plataformas.find((p) => p.plataforma === plataforma);
        return {
          id: game._id,
          nombre: game.nombre,
          slug: game.slug,
          imagenPortada: game.imagenPortada,
          precio: disponibilidad.precio,
        };
      });

      return res.status(200).json(resultado);
    } catch (err) {
      return next(err);
    }
  }

  async function getDetalle(req, res, next) {
    try {
      const { id } = req.params;
      // ObjectId inválido tratado igual que "no existe" (404), no como 400: el :id
      // llega directamente en la URL pública, sin formulario que lo valide antes
      // (design.md → API Design: "404 (id inexistente o inválido)").
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Juego no encontrado', 404));
      }

      const game = await Game.findById(id);
      if (!game) return next(new AppError('Juego no encontrado', 404));

      const estrenado = game.fechaEstreno <= new Date();

      return res.status(200).json({
        id: game._id,
        nombre: game.nombre,
        slug: game.slug,
        descripcion: game.descripcion,
        imagenPortada: game.imagenPortada,
        imagenWallpaper: game.imagenWallpaper,
        videoPreviewUrl: game.videoPreviewUrl,
        fechaEstreno: game.fechaEstreno,
        estrenado,
        caracteristicas: game.caracteristicas,
        plataformas: game.plataformas.map((disponibilidad) => ({
          plataforma: disponibilidad.plataforma,
          formatos: disponibilidad.formatos,
          precio: disponibilidad.precio,
          stock: disponibilidad.stock,
          especificacionesPC: disponibilidad.especificacionesPC,
          especificacionesConsola: disponibilidad.especificacionesConsola,
        })),
      });
    } catch (err) {
      return next(err);
    }
  }

  async function suscribirNotificacion(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Juego no encontrado', 404));
      }

      const game = await Game.findById(id).select('plataformas.plataforma plataformas.stock');
      if (!game) return next(new AppError('Juego no encontrado', 404));

      const { plataforma } = req.body;
      const disponibilidad = game.plataformas.find((p) => p.plataforma === plataforma);
      if (!disponibilidad) {
        return next(new AppError('Plataforma no válida para este juego', 400));
      }
      if (disponibilidad.stock > 0) {
        return next(new AppError('Esta combinación ya tiene stock disponible', 400));
      }

      try {
        await GameStockSubscription.create({ userId: req.user.userId, gameId: id, plataforma });
        return res.status(201).json({ message: 'Te avisaremos cuando haya stock disponible' });
      } catch (err) {
        // Índice único compuesto (userId, gameId, plataforma): responde éxito
        // idempotente en vez de un error (Requisito 13.3), mismo criterio de
        // globalErrorHandler para username/email pero resuelto aquí porque el
        // status de éxito (200, no 409) es específico de este endpoint.
        if (err.code === 11000) {
          return res.status(200).json({ message: 'Ya estás apuntado a esta combinación', yaSuscrito: true });
        }
        throw err;
      }
    } catch (err) {
      return next(err);
    }
  }

  return { listDestacados, listPorPlataforma, getDetalle, suscribirNotificacion };
}

module.exports = createGameController({ Game: defaultGame, GameStockSubscription: defaultGameStockSubscription });
module.exports.createGameController = createGameController;
