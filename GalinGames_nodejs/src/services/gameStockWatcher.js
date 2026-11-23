const defaultGame = require('../models/Game');
const defaultGameStockService = require('../services/gameStockService');

// Inyección de dependencias: mismo patrón que createGameStockService.
//
// Esta app nunca escribe en Game.plataformas.stock (ni por HTTP ni por script): el
// stock se edita fuera de la aplicación (a mano en MongoDB Compass hoy; desde la
// futura app de administración más adelante). Este watcher usa un MongoDB Change
// Stream para reaccionar a esos cambios sin ser quien los provoca — requiere que
// MongoDB corra como replica set (los Change Streams no funcionan sobre un servidor
// standalone).
//
// No intenta comparar el stock "antes" con el "después": cada vez que un documento
// Game cambia, revisa su estado actual y, para cada plataforma con stock > 0, llama a
// gameStockService.notifySubscribers. Esa llamada ya es un no-op si no hay
// suscripciones pendientes (y solo puede haberlas si esa combinación tenía stock 0
// cuando el cliente se suscribió — el propio endpoint POST /notificarme lo exige), así
// que el resultado es idéntico a "reaccionar solo a la transición 0 -> >0" sin
// necesitar guardar el valor anterior en ningún sitio.
function createGameStockWatcher({ Game, gameStockService }) {
  let changeStream = null;

  function start() {
    changeStream = Game.watch([{ $match: { operationType: { $in: ['insert', 'update', 'replace'] } } }], {
      fullDocument: 'updateLookup',
    });

    changeStream.on('change', async (event) => {
      const game = event.fullDocument;
      if (!game || !Array.isArray(game.plataformas)) return;

      for (const disponibilidad of game.plataformas) {
        if (disponibilidad.stock > 0) {
          try {
            await gameStockService.notifySubscribers(game._id, disponibilidad.plataforma);
          } catch (err) {
            console.error(`[${new Date().toISOString()}] gameStockWatcher.notifySubscribers`, err);
          }
        }
      }
    });

    changeStream.on('error', (err) => {
      console.error(`[${new Date().toISOString()}] gameStockWatcher change stream error`, err);
    });

    return changeStream;
  }

  async function stop() {
    if (changeStream) {
      await changeStream.close();
      changeStream = null;
    }
  }

  return { start, stop };
}

module.exports = createGameStockWatcher({ Game: defaultGame, gameStockService: defaultGameStockService });
module.exports.createGameStockWatcher = createGameStockWatcher;
