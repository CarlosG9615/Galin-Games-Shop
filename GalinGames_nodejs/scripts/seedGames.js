// Script de seed: sube las portadas reales de los 6 juegos a Cloudinary y crea/actualiza
// sus documentos Game con los datos fijados en requirements.md (Requisito 18).
// Ejecutar: node scripts/seedGames.js
const path = require('path');
const fs = require('fs/promises');
const mongoose = require('mongoose');
require('../src/config/env'); // valida variables de entorno y carga dotenv antes de conectar.
const connectDB = require('../src/config/db');
const Game = require('../src/models/Game');
const cloudinaryService = require('../src/services/cloudinaryService');

const PORTADAS_DIR = path.join(__dirname, '..', '..', 'GalinGames_react', 'public');

// Wallpaper de cada juego, cuando ya esté disponible localmente en
// scripts/assets/wallpapers/<slug>.jpg (Tarea 11 de tasks.md, Requisito 18.5). Mientras
// no exista, el campo se deja explícitamente en null (Requisito 18.7): nunca se
// reutiliza la portada ni una imagen no verificada por el equipo como wallpaper.
const WALLPAPERS_DIR = path.join(__dirname, 'assets', 'wallpapers');

const JUEGOS = [
  {
    slug: 'assassins-creed-black-flag-resynced',
    nombre: "Assassin's Creed Black Flag Resynced",
    imagenLocal: 'assassins.jpg',
    fechaEstreno: new Date('2026-07-09'),
    plataformaDestacada: 'Xbox',
    descripcion:
      "Vuelve a navegar los mares del Caribe en la piel de Edward Kenway en esta reedición remasterizada de Assassin's Creed IV: Black Flag, con gráficos renovados, mejoras de jugabilidad y todo el contenido de la aventura pirata original.",
    caracteristicas: {
      jugadores: { tipo: 'individual' },
      online: false,
      crossplay: false,
      hdr: true,
      mandosCompatibles: ['DualSense', 'Xbox Wireless Controller'],
    },
    plataformas: [
      {
        plataforma: 'PC',
        formatos: ['digital'],
        precio: 49.99,
        stock: 25,
        especificacionesPC: {
          minimas: {
            cpu: 'Intel Core i5-4460 / AMD FX-6300',
            ram: '8 GB',
            gpu: 'NVIDIA GTX 760 / AMD R9 270',
            almacenamiento: '50 GB SSD',
            sistemaOperativo: 'Windows 10 64-bit',
          },
          recomendadas: {
            cpu: 'Intel Core i7-8700 / AMD Ryzen 5 3600',
            ram: '16 GB',
            gpu: 'NVIDIA RTX 2060 / AMD RX 5700',
            almacenamiento: '50 GB SSD',
            sistemaOperativo: 'Windows 11 64-bit',
          },
        },
      },
      {
        plataforma: 'PlayStation',
        formatos: ['fisico', 'digital'],
        precio: 59.99,
        stock: 40,
        especificacionesConsola: { almacenamiento: '50 GB', notas: ['PS5 Pro Enhanced'] },
      },
      {
        plataforma: 'Xbox',
        formatos: ['fisico', 'digital'],
        precio: 59.99,
        stock: 30,
        especificacionesConsola: { almacenamiento: '50 GB', notas: ['Optimizado para Xbox Series X|S'] },
      },
    ],
  },
  {
    slug: 'blood-of-dawnwalker',
    nombre: 'The Blood of Dawnwalker',
    imagenLocal: 'blooddownwalker.jpg',
    fechaEstreno: new Date('2026-09-03'),
    plataformaDestacada: 'PC',
    descripcion:
      'Un RPG de acción y mundo abierto ambientado en un reino gótico marcado por la maldición del vampirismo, donde cada decisión moral condiciona el destino de sus habitantes y el propio poder del protagonista.',
    caracteristicas: {
      jugadores: { tipo: 'individual' },
      online: false,
      crossplay: false,
      hdr: true,
      mandosCompatibles: ['DualSense', 'Xbox Wireless Controller'],
    },
    plataformas: [
      {
        plataforma: 'PC',
        formatos: ['digital'],
        precio: 59.99,
        stock: 0,
        especificacionesPC: {
          minimas: {
            cpu: 'Intel Core i5-9600K / AMD Ryzen 5 3600',
            ram: '12 GB',
            gpu: 'NVIDIA GTX 1660 Ti / AMD RX 5600 XT',
            almacenamiento: '80 GB SSD',
            sistemaOperativo: 'Windows 10 64-bit',
          },
          recomendadas: {
            cpu: 'Intel Core i7-10700K / AMD Ryzen 7 5800X',
            ram: '16 GB',
            gpu: 'NVIDIA RTX 3070 / AMD RX 6800',
            almacenamiento: '80 GB SSD',
            sistemaOperativo: 'Windows 11 64-bit',
          },
        },
      },
      {
        plataforma: 'PlayStation',
        formatos: ['fisico', 'digital'],
        precio: 69.99,
        stock: 0,
        especificacionesConsola: { almacenamiento: '80 GB', notas: ['PS5 Pro Enhanced'] },
      },
      {
        plataforma: 'Xbox',
        formatos: ['fisico', 'digital'],
        precio: 69.99,
        stock: 0,
        especificacionesConsola: { almacenamiento: '80 GB', notas: ['Optimizado para Xbox Series X|S'] },
      },
    ],
  },
  {
    slug: 'dragon-ball-sparking-zero',
    nombre: 'Dragon Ball: Sparking! Zero',
    imagenLocal: 'dragonball.jpg',
    fechaEstreno: new Date('2024-10-11'),
    plataformaDestacada: 'Nintendo',
    descripcion:
      'El regreso de la saga Budokai Tenkaichi con más de 180 personajes jugables del universo Dragon Ball, combates aéreos espectaculares y escenarios destructibles a gran escala.',
    caracteristicas: {
      jugadores: { tipo: 'multijugador', maximo: 2 },
      online: true,
      crossplay: false,
      hdr: true,
      mandosCompatibles: ['DualSense', 'Xbox Wireless Controller', 'Mando Nintendo Switch Pro'],
    },
    plataformas: [
      {
        plataforma: 'PC',
        formatos: ['digital'],
        precio: 59.99,
        stock: 0,
        especificacionesPC: {
          minimas: {
            cpu: 'Intel Core i5-3470 / AMD FX-8350',
            ram: '8 GB',
            gpu: 'NVIDIA GTX 760 / AMD R7 260X',
            almacenamiento: '90 GB SSD',
            sistemaOperativo: 'Windows 10 64-bit',
          },
          recomendadas: {
            cpu: 'Intel Core i7-9700K / AMD Ryzen 5 3600',
            ram: '16 GB',
            gpu: 'NVIDIA RTX 2070 / AMD RX 5700 XT',
            almacenamiento: '90 GB SSD',
            sistemaOperativo: 'Windows 11 64-bit',
          },
        },
      },
      {
        plataforma: 'PlayStation',
        formatos: ['fisico', 'digital'],
        precio: 69.99,
        stock: 0,
        especificacionesConsola: { almacenamiento: '90 GB', notas: ['PS5 Pro Enhanced'] },
      },
      {
        plataforma: 'Xbox',
        formatos: ['fisico', 'digital'],
        precio: 69.99,
        stock: 0,
        especificacionesConsola: { almacenamiento: '90 GB', notas: ['Optimizado para Xbox Series X|S'] },
      },
      {
        plataforma: 'Nintendo',
        formatos: ['fisico', 'digital'],
        precio: 59.99,
        stock: 0,
        especificacionesConsola: { almacenamiento: '90 GB', notas: ['Requiere tarjeta microSD adicional recomendada'] },
      },
    ],
  },
  {
    slug: 'ea-sports-fc-27',
    nombre: 'EA Sports FC 27',
    imagenLocal: 'fc27.jpg',
    fechaEstreno: new Date('2026-09-25'),
    plataformaDestacada: 'PlayStation',
    descripcion:
      'La simulación de fútbol más completa del año, con las principales ligas y competiciones oficiales, el modo Ultimate Team y mejoras de motor de juego HyperMotion para una experiencia aún más realista.',
    caracteristicas: {
      jugadores: { tipo: 'multijugador', maximo: 22 },
      online: true,
      crossplay: true,
      hdr: true,
      mandosCompatibles: ['DualSense', 'Xbox Wireless Controller', 'Mando Nintendo Switch Pro'],
    },
    plataformas: [
      {
        plataforma: 'PC',
        formatos: ['digital'],
        precio: 69.99,
        stock: 0,
        especificacionesPC: {
          minimas: {
            cpu: 'Intel Core i3-6100 / AMD Athlon 200GE',
            ram: '8 GB',
            gpu: 'NVIDIA GTX 660 / AMD R9 270',
            almacenamiento: '100 GB SSD',
            sistemaOperativo: 'Windows 10 64-bit',
          },
          recomendadas: {
            cpu: 'Intel Core i5-9600K / AMD Ryzen 5 3600',
            ram: '12 GB',
            gpu: 'NVIDIA GTX 1660 / AMD RX 590',
            almacenamiento: '100 GB SSD',
            sistemaOperativo: 'Windows 11 64-bit',
          },
        },
      },
      {
        plataforma: 'PlayStation',
        formatos: ['fisico', 'digital'],
        precio: 79.99,
        stock: 0,
        especificacionesConsola: { almacenamiento: '100 GB', notas: ['PS5 Pro Enhanced'] },
      },
      {
        plataforma: 'Xbox',
        formatos: ['fisico', 'digital'],
        precio: 79.99,
        stock: 0,
        especificacionesConsola: { almacenamiento: '100 GB', notas: ['Optimizado para Xbox Series X|S'] },
      },
      {
        plataforma: 'Nintendo',
        formatos: ['fisico', 'digital'],
        precio: 49.99,
        stock: 0,
        especificacionesConsola: { almacenamiento: '15 GB', notas: ['Edición Legacy con gráficos reducidos'] },
      },
    ],
  },
  {
    slug: 'grand-theft-auto-vi',
    nombre: 'Grand Theft Auto VI',
    imagenLocal: 'gta.jpg',
    fechaEstreno: new Date('2026-11-19'),
    plataformaDestacada: 'Xbox',
    descripcion:
      'Regresa a Vice City en la aventura de mundo abierto más ambiciosa de Rockstar Games, con una ciudad viva, una historia de ambición y traición, y el universo de Grand Theft Auto Online ampliado.',
    caracteristicas: {
      jugadores: { tipo: 'multijugador', maximo: 30 },
      online: true,
      crossplay: false,
      hdr: true,
      mandosCompatibles: ['DualSense', 'Xbox Wireless Controller'],
    },
    // Sin versión de PC anunciada (Requisito 18.8): no lleva especificacionesPC.
    plataformas: [
      {
        plataforma: 'PlayStation',
        formatos: ['fisico', 'digital'],
        precio: 79.99,
        stock: 0,
        especificacionesConsola: { almacenamiento: '150 GB', notas: ['PS5 Pro Enhanced'] },
      },
      {
        plataforma: 'Xbox',
        formatos: ['fisico', 'digital'],
        precio: 79.99,
        stock: 0,
        especificacionesConsola: { almacenamiento: '150 GB', notas: ['Optimizado para Xbox Series X|S'] },
      },
    ],
  },
  {
    slug: 'marvels-wolverine',
    nombre: "Marvel's Wolverine",
    imagenLocal: 'wolverine.jpg',
    fechaEstreno: new Date('2026-09-15'),
    plataformaDestacada: 'PlayStation',
    descripcion:
      'Logan se enfrenta a su pasado más oscuro en una aventura de acción brutal y visceral desarrollada por Insomniac Games, con un combate cuerpo a cuerpo despiadado y un factor curativo único en el género.',
    caracteristicas: {
      jugadores: { tipo: 'individual' },
      online: false,
      crossplay: false,
      hdr: true,
      mandosCompatibles: ['DualSense'],
    },
    // Sin versión de PC anunciada (Requisito 18.8): no lleva especificacionesPC.
    plataformas: [
      {
        plataforma: 'PlayStation',
        formatos: ['fisico', 'digital'],
        precio: 69.99,
        stock: 0,
        especificacionesConsola: { almacenamiento: '75 GB', notas: ['PS5 Pro Enhanced'] },
      },
    ],
  },
];

async function resolveWallpaperBuffer(slug) {
  try {
    return await fs.readFile(path.join(WALLPAPERS_DIR, `${slug}.jpg`));
  } catch {
    return null;
  }
}

async function seedGame(juego) {
  const portadaBuffer = await fs.readFile(path.join(PORTADAS_DIR, juego.imagenLocal));
  const { url: imagenPortada } = await cloudinaryService.uploadImage(portadaBuffer, `games/${juego.slug}`);

  let imagenWallpaper = null;
  const wallpaperBuffer = await resolveWallpaperBuffer(juego.slug);
  if (wallpaperBuffer) {
    const uploaded = await cloudinaryService.uploadImage(wallpaperBuffer, `games/${juego.slug}/wallpaper`);
    imagenWallpaper = uploaded.url;
  } else {
    console.warn(`[seedGames] "${juego.slug}": sin wallpaper local (Tarea 11 de tasks.md) — imagenWallpaper queda en null`);
  }

  const documento = {
    nombre: juego.nombre,
    slug: juego.slug,
    descripcion: juego.descripcion,
    imagenPortada,
    imagenWallpaper,
    // Pendiente: el equipo aún no ha proporcionado URLs estables de vídeo de preview
    // (design.md → Design Decisions); se deja en null hasta entonces (Requisito 4.4).
    videoPreviewUrl: null,
    fechaEstreno: juego.fechaEstreno,
    plataformaDestacada: juego.plataformaDestacada,
    caracteristicas: juego.caracteristicas,
    plataformas: juego.plataformas,
  };

  // Se valida un documento completo aparte (en vez de runValidators en la query) porque
  // el validador de plataformaDestacada necesita `this.plataformas` del propio
  // documento, algo que Mongoose no resuelve de forma fiable durante la validación de
  // un findOneAndUpdate.
  new Game(documento).validateSync();

  await Game.findOneAndUpdate({ slug: juego.slug }, { $set: documento }, { upsert: true, new: true });

  console.log(`[seedGames] "${juego.slug}" insertado/actualizado`);
}

async function main() {
  await connectDB();

  try {
    for (const juego of JUEGOS) {
      await seedGame(juego);
    }
    console.log(`[seedGames] Completado: ${JUEGOS.length} juegos.`);
  } finally {
    await mongoose.disconnect();
  }
}

// Mismo guard que server.js: permite requerir este módulo (p. ej. para validar JUEGOS
// en un test) sin conectar a Mongo ni llamar a Cloudinary.
if (require.main === module) {
  main().catch((err) => {
    console.error('[seedGames] Error:', err);
    process.exitCode = 1;
  });
}

module.exports = { JUEGOS, seedGame, main };
