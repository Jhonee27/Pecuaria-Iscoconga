// routes/ingreso.routes.js
const router = require('express').Router();
const db = require('../models');
const { Movement, MovementItem } = db;

router.post('/', async (req, res) => {
  const { type, items } = req.body;

  if (!type || !items || !items.length) {
    return res.status(400).json({ message: 'Datos incompletos' });
  }

  try {
    // 1️⃣ Crear movimiento
    const movement = await Movement.create({
      type,
      cochera_applied: false, // lo guardaremos como item
      cochera_value: 0,
      subtotal_animals: items
        .filter(i => i.category === 'ganado')
        .reduce((sum, i) => sum + i.subtotal, 0),
      total: items.reduce((sum, i) => sum + i.subtotal, 0),
      note: ''
    });

    // 2️⃣ Crear items
    const movementItemsData = items.map(i => ({
      movement_id: movement.id,
      species: i.category === 'ganado' ? i.type : i.category === 'vehículo' ? i.type : 'Cochera',
      breed: i.breed || i.note || '',
      qty_in: i.qty_in,
      unit_price: i.unit_price,
      subtotal: i.subtotal
    }));

    await MovementItem.bulkCreate(movementItemsData);

    res.json({ message: 'Ingreso registrado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al registrar ingreso' });
  }
});

module.exports = router;
