const { Merchant } = require('../models');

// Crear un comerciante
exports.createMerchant = async (req, res) => {
  try {
    const { firstName, lastName, dni, phone } = req.body;

    if (!firstName || !lastName || !dni) {
      return res.status(400).json({ message: 'Nombre, Apellido y DNI son requeridos' });
    }

    const existing = await Merchant.findOne({ where: { dni } });
    if (existing) {
      return res.status(400).json({ message: 'El DNI ya está registrado' });
    }

    const merchant = await Merchant.create({ firstName, lastName, dni, phone });
    res.status(201).json(merchant);
  } catch (error) {
    console.error('Error al crear comerciante:', error);
    res.status(500).json({ message: 'Error al crear comerciante' });
  }
};

// Listar comerciantes
exports.listMerchants = async (req, res) => {
  try {
    const merchants = await Merchant.findAll({ order: [['id', 'ASC']] });
    res.json(merchants);
  } catch (error) {
    console.error('Error al obtener comerciantes:', error);
    res.status(500).json({ message: 'Error al obtener comerciantes' });
  }
};

// Actualizar comerciante
exports.updateMerchant = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, dni, phone } = req.body;

    const merchant = await Merchant.findByPk(id);
    if (!merchant) return res.status(404).json({ message: 'Comerciante no encontrado' });

    await merchant.update({ firstName, lastName, dni, phone });
    res.json(merchant);
  } catch (error) {
    console.error('Error al actualizar comerciante:', error);
    res.status(500).json({ message: 'Error al actualizar comerciante' });
  }
};
