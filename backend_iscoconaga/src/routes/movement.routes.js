const express = require('express');
const router = express.Router();
const { Movement, MovementItem, sequelize } = require('../models');

// Registrar ingreso
router.post('/', async (req, res) => {
  const { merchant_id, truck_id, items, note } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Debe agregar al menos un ítem' });
  }

  const t = await sequelize.transaction();

  try {
    let total = 0;
    items.forEach(item => {
      const subtotal = (item.qty_in || 0) * (item.unit_price || 0);
      total += subtotal;
      item.subtotal = subtotal;
    });

    const movement = await Movement.create({
      type: 'I',
      merchant_id,
      truck_id: truck_id || null,
      total,
      note: note || null,
      date: new Date()
    }, { transaction: t });

    for (const item of items) {
      await MovementItem.create({
        movement_id: movement.id,
        category: item.category,
        type: item.type,
        breed: item.breed || null,
        note: item.note || null,
        qty_in: item.qty_in,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      }, { transaction: t });
    }

    await t.commit();
    res.json({ message: 'Ingreso registrado correctamente' });
  } catch (error) {
    await t.rollback();
    console.error('Error al registrar ingreso:', error);
    res.status(500).json({ message: 'Error al registrar ingreso' });
  }
});

// Listar ingresos
router.get('/', async (req, res) => {
  try {
    const movements = await Movement.findAll({
      include: [{ model: MovementItem, as: 'items' }],
      order: [['date', 'DESC']]
    });
    res.json(movements);
  } catch (error) {
    console.error('Error al obtener ingresos:', error);
    res.status(500).json({ message: 'Error al obtener ingresos' });
  }
});

module.exports = router;
