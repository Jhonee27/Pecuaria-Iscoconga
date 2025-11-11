const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Faltan credenciales' });
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(400).json({ message: 'Usuario o contraseña inválidos' });
  const valid = await user.validatePassword(password);
  if (!valid) return res.status(400).json({ message: 'Usuario o contraseña inválidos' });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
};

module.exports = { login };

  