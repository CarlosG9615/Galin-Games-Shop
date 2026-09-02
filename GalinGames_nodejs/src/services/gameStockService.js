const env = require('../config/env');
const defaultGame = require('../models/Game');
const defaultGameStockSubscription = require('../models/GameStockSubscription');
const defaultEmailService = require('../services/emailService');

// Inyección de dependencias: mismo patrón que createAddressController/createCloudinaryService.
function createGameStockService({ Game, GameStockSubscription, emailService }) {
  async function notifySubscribers(gameId, plataforma) {
    const game = await Game.findById(gameId).select('nombre');
    if (!game) return;

    const subscriptions = await GameStockSubscription.find({ gameId, plataforma }).populate('userId', 'username email');
    if (subscriptions.length === 0) return;

    const detailLink = `${env.FRONTEND_URL}/juegos/detalle/${gameId}?plataforma=${plataforma}`;

    for (const subscription of subscriptions) {
      const user = subscription.userId;
      if (!user) continue;

      try {
        await emailService.sendStockAvailableEmail(user.email, user.username, game.nombre, detailLink);
        // Se borra tras notificar (Requisito 13.5, design.md → Data Models): si el
        // envío falla, se deja la suscripción intacta para reintentarlo en la
        // próxima alta de stock en vez de perder al suscriptor silenciosamente.
        await GameStockSubscription.deleteOne({ _id: subscription._id });
      } catch (err) {
        console.error(`[${new Date().toISOString()}] gameStockService.notifySubscribers`, err);
      }
    }
  }

  return { notifySubscribers };
}

const { notifySubscribers } = createGameStockService({
  Game: defaultGame,
  GameStockSubscription: defaultGameStockSubscription,
  emailService: defaultEmailService,
});

module.exports = { notifySubscribers, createGameStockService };
