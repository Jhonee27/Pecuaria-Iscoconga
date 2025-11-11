const express = require('express');
const router = express.Router();
const { createMerchant, listMerchants, updateMerchant } = require('../controllers/merchant.controller');
const auth = require('../middleware/auth.middleware');
const { permit } = require('../middleware/role.middleware');

// Crear comerciante → admin o personal
router.post('/', auth, permit('admin', 'personal'), createMerchant);

// Listar comerciantes → admin o personal
router.get('/', auth, permit('admin', 'personal'), listMerchants);

// Actualizar comerciante → admin o personal
router.put('/:id', auth, permit('admin', 'personal'), updateMerchant);

// Opcional: eliminar comerciante → solo admin
router.delete('/:id', auth, permit('admin'), async (req, res) => {
  // lógica de eliminación
});

module.exports = router;
