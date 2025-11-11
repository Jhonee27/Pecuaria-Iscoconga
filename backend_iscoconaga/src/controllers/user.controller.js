const { User } = require('../models');
const bcrypt = require('bcryptjs');

// Listar todos los usuarios (solo admin)
const listUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }, // Excluir contraseñas
      order: [['created_at', 'DESC']]
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Crear nuevo usuario (solo admin)
const createUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validaciones
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password y role son requeridos' });
    }

    if (!['admin', 'personal'].includes(role)) {
      return res.status(400).json({ message: 'Role debe ser admin o personal' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Crear usuario (el hook beforeCreate en el modelo encriptará la password)
    const user = await User.create({
      email,
      password,
      role
    });

    // Devolver usuario sin password
    const userResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    res.status(201).json(userResponse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Actualizar usuario (solo admin)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, password } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar campos
    if (email) user.email = email;
    if (role) {
      if (!['admin', 'personal'].includes(role)) {
        return res.status(400).json({ message: 'Role debe ser admin o personal' });
      }
      user.role = role;
    }
    if (password) user.password = password;

    await user.save();

    // Devolver usuario sin password
    const userResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    res.json(userResponse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Eliminar usuario (solo admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminarse a sí mismo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await user.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser
};