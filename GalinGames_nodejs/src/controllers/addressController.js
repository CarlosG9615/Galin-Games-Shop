const defaultAddress = require('../models/Address');
const { AppError } = require('../utils/nullGuard');

const ADDRESS_FIELDS = ['tipo', 'titulo', 'calle', 'numero', 'pisoPuerta', 'ciudad', 'provincia', 'codigoPostal', 'pais'];

function otherTypeOf(tipo) {
  return tipo === 'envio' ? 'facturacion' : 'envio';
}

// Inyección de dependencias: mismo patrón que authController/userController.
function createAddressController({ Address }) {
  async function listAddresses(req, res, next) {
    try {
      // Predeterminada primero (Requisito 14.2): un único sort cubre ambos tipos, se
      // reparten después en dos arrays.
      const addresses = await Address.find({ userId: req.user.userId }).sort({ esPredeterminada: -1, createdAt: 1 });

      const envio = addresses.filter((address) => address.tipo === 'envio');
      const facturacion = addresses.filter((address) => address.tipo === 'facturacion');

      return res.status(200).json({ envio, facturacion });
    } catch (err) {
      return next(err);
    }
  }

  async function createAddress(req, res, next) {
    try {
      const data = {};
      for (const field of ADDRESS_FIELDS) {
        data[field] = req.body[field];
      }

      // Requisito 13.2/13.3: solo se ofrece reutilizar para el otro tipo si el usuario
      // no tiene ya ninguna dirección de ese otro tipo.
      const otherTypeCount = await Address.countDocuments({ userId: req.user.userId, tipo: otherTypeOf(data.tipo) });

      // La primera dirección de cada tipo (envío o facturación) se marca predeterminada
      // automáticamente — sin esto, un usuario con una única dirección de un tipo no
      // tendría forma de que apareciera como predeterminada sin un paso manual extra
      // (petición directa de usuario, ver Design Decisions). Cubre tanto la creación
      // normal (modal) como la reutilización para el otro tipo: ambas pasan por aquí.
      const sameTypeCount = await Address.countDocuments({ userId: req.user.userId, tipo: data.tipo });

      const address = await Address.create({ ...data, userId: req.user.userId, esPredeterminada: sameTypeCount === 0 });

      return res.status(201).json({ address, offerReuseForOtherType: otherTypeCount === 0 });
    } catch (err) {
      return next(err);
    }
  }

  async function updateAddress(req, res, next) {
    try {
      const { id } = req.params;

      // findOne({ _id, userId }) en vez de findById: nunca se confía en un :id ajeno
      // (Requisito 16.2/16.3) — si no es del usuario autenticado, se trata igual que
      // si no existiera (404), sin distinguir el motivo para no filtrar existencia.
      const address = await Address.findOne({ _id: id, userId: req.user.userId });
      if (!address) return next(new AppError('Dirección no encontrada', 404));

      // El formulario de edición reenvía siempre el objeto completo (mismo componente
      // que el de creación), así que validateAddressInput ya garantiza que todos los
      // campos obligatorios están presentes.
      for (const field of ADDRESS_FIELDS) {
        address[field] = req.body[field];
      }

      await address.save();

      return res.status(200).json({ address });
    } catch (err) {
      return next(err);
    }
  }

  async function setDefaultAddress(req, res, next) {
    try {
      const { id } = req.params;

      const address = await Address.findOne({ _id: id, userId: req.user.userId });
      if (!address) return next(new AppError('Dirección no encontrada', 404));

      // Dos updates secuenciales, no una transacción Mongo (design.md → Design
      // Decisions): el recurso es privado por usuario, sin observabilidad externa
      // entre ambos pasos.
      await Address.updateMany(
        { userId: req.user.userId, tipo: address.tipo, esPredeterminada: true },
        { esPredeterminada: false },
      );

      address.esPredeterminada = true;
      await address.save();

      return res.status(200).json({ address });
    } catch (err) {
      return next(err);
    }
  }

  async function deleteAddress(req, res, next) {
    try {
      const { id } = req.params;

      // findOne({ _id, userId }) antes de borrar, mismo criterio que updateAddress/
      // setDefaultAddress: nunca se confía en un :id ajeno (Requisito 16.2/16.3).
      const address = await Address.findOne({ _id: id, userId: req.user.userId });
      if (!address) return next(new AppError('Dirección no encontrada', 404));

      await Address.deleteOne({ _id: id });

      return res.status(200).json({ message: 'Dirección eliminada correctamente' });
    } catch (err) {
      return next(err);
    }
  }

  return { listAddresses, createAddress, updateAddress, setDefaultAddress, deleteAddress };
}

module.exports = createAddressController({ Address: defaultAddress });
module.exports.createAddressController = createAddressController;
