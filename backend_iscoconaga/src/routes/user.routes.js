const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { permit } = require('../middleware/role.middleware');
const userController = require('../controllers/user.controller');

// Todas las rutas requieren autenticación y rol de admin
router.get('/', auth, permit('admin'), userController.listUsers);
router.post('/', auth, permit('admin'), userController.createUser);
router.put('/:id', auth, permit('admin'), userController.updateUser);
router.delete('/:id', auth, permit('admin'), userController.deleteUser);

module.exports = router;
// Agregar esta ruta en user.routes.js
router.get('/:id', auth, permit('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});