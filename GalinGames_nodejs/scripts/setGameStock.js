// Única forma de mutar el stock de un juego en esta feature (design.md → Security):
// no existe ningún endpoint HTTP para esto. Uso:
//   node scripts/setGameStock.js <slugJuego> <plataforma> <nuevoStock>
const mongoose = require('mongoose');
require('../src/config/env'); // valida variables de entorno y carga dotenv antes de conectar.
const connectDB = require('../src/config/db');
const Game = require('../src/models/Game');
const gameStockService = require('../src/services/gameStockService');

async function main() {
  const [, , slug, plataforma, nuevoStockArg] = process.argv;

  if (!slug || !plataforma || nuevoStockArg === undefined) {
    console.error('Uso: node scripts/setGameStock.js <slugJuego> <plataforma> <nuevoStock>');
    process.exitCode = 1;
    return;
  }

  const nuevoStock = Number(nuevoStockArg);
  if (!Number.isInteger(nuevoStock) || nuevoStock < 0) {
    console.error('<nuevoStock> debe ser un número entero mayor o igual que 0');
    process.exitCode = 1;
    return;
  }

  await connectDB();

  try {
    // Se lee el stock anterior antes de actualizar para saber si hay que notificar
    // (transición de 0 a >0, Requisito 13.4).
    const gameAntes = await Game.findOne({ slug, 'plataformas.plataforma': plataforma }, { 'plataformas.$': 1 });

    if (!gameAntes) {
      console.error(`No se encontró el juego "${slug}" con la plataforma "${plataforma}"`);
      process.exitCode = 1;
      return;
    }

    const stockAnterior = gameAntes.plataformas[0].stock;

    // findOneAndUpdate + $ posicional: operación atómica sobre el subdocumento de esa
    // combinación juego+plataforma (Requisito 14.5), sin transacción multi-documento.
    const game = await Game.findOneAndUpdate(
      { slug, 'plataformas.plataforma': plataforma },
      { $set: { 'plataformas.$.stock': nuevoStock } },
      { new: true },
    );

    console.log(`[setGameStock] "${slug}" (${plataforma}): stock ${stockAnterior} -> ${nuevoStock}`);

    if (stockAnterior === 0 && nuevoStock > 0) {
      await gameStockService.notifySubscribers(game._id, plataforma);
      console.log('[setGameStock] Suscriptores notificados.');
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('[setGameStock] Error:', err);
  process.exitCode = 1;
});
