const { Movement, MovementItem } = require('../models');

// Crear un movimiento con items
exports.createMovement = async (req, res) => {
  try {
    const { type, cochera_applied, cochera_value, note, items } = req.body;

    const movement = await Movement.create({ type, cochera_applied, cochera_value, note });

    // Crear items asociados
    if (items && items.length) {
      for (const item of items) {
        await MovementItem.create({ ...item, movement_id: movement.id });
      }
    }

    // Recalcular totales
    const movementWithItems = await Movement.findByPk(movement.id, { include: 'items' });
    const subtotal_animals = movementWithItems.items.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);
    const total = subtotal_animals + (cochera_applied ? parseFloat(cochera_value) : 0);

    movement.subtotal_animals = subtotal_animals;
    movement.total = total;
    await movement.save();

    res.status(201).json(movementWithItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear el movimiento' });
  }
};

// Obtener todos los movimientos con items
exports.getMovements = async (req, res) => {
  try {
    const movements = await Movement.findAll({ include: 'items', order: [['createdAt', 'DESC']] });
    res.json(movements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener movimientos' });
  }
};

// Obtener un movimiento por ID
exports.getMovementById = async (req, res) => {
  try {
    const movement = await Movement.findByPk(req.params.id, { include: 'items' });
    if (!movement) return res.status(404).json({ message: 'Movimiento no encontrado' });
    res.json(movement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener el movimiento' });
  }
};

// Actualizar un movimiento (incluye items)
exports.updateMovement = async (req, res) => {
  try {
    const { type, cochera_applied, cochera_value, note, items } = req.body;
    const movement = await Movement.findByPk(req.params.id, { include: 'items' });
    if (!movement) return res.status(404).json({ message: 'Movimiento no encontrado' });

    movement.type = type;
    movement.cochera_applied = cochera_applied;
    movement.cochera_value = cochera_value;
    movement.note = note;
    await movement.save();

    // Actualizar items
    if (items && items.length) {
      // Eliminar items antiguos
      await MovementItem.destroy({ where: { movement_id: movement.id } });
      // Crear nuevos
      for (const item of items) {
        await MovementItem.create({ ...item, movement_id: movement.id });
      }
    }

    // Recalcular totales
    const movementWithItems = await Movement.findByPk(movement.id, { include: 'items' });
    const subtotal_animals = movementWithItems.items.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);
    const total = subtotal_animals + (cochera_applied ? parseFloat(cochera_value) : 0);

    movement.subtotal_animals = subtotal_animals;
    movement.total = total;
    await movement.save();

    res.json(movementWithItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar el movimiento' });
  }
};

// Eliminar un movimiento
exports.deleteMovement = async (req, res) => {
  try {
    const movement = await Movement.findByPk(req.params.id);
    if (!movement) return res.status(404).json({ message: 'Movimiento no encontrado' });

    await movement.destroy();
    res.json({ message: 'Movimiento eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar movimiento' });
  }
};
