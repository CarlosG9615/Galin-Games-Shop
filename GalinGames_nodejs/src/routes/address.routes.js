const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateAddressInput } = require('../middleware/validator');
const addressController = require('../controllers/addressController');

const router = express.Router();

router.get('/', requireAuth, addressController.listAddresses);
router.post('/', requireAuth, validateAddressInput, addressController.createAddress);
router.put('/:id', requireAuth, validateAddressInput, addressController.updateAddress);
router.patch('/:id/predeterminada', requireAuth, addressController.setDefaultAddress);
router.delete('/:id', requireAuth, addressController.deleteAddress);

module.exports = router;
