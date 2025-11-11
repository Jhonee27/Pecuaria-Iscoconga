const { Merchant, Truck, Movement, MovementItem, sequelize } = require('../models');
const { lookupByDNI } = require('../helpers/reniec');
const fs = require('fs');

const loadTariffs = () => {
  try {
    const p = process.env.TARIFFS_JSON_PATH || './data/tarifas.json';
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {}
  return { cochera: { moto:2, auto:5, camion:50, trailer:80, otro:10 }, animal: {} };
};
const tariffs = loadTariffs();

const ingresoCompleto = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { person = {}, vehicle = {}, items = [], use_tariffs = true, cochera_applied = true, note } = req.body;

    // (1) Merchant
    let merchant;
    if (person.id) merchant = await Merchant.findByPk(person.id, { transaction: t });
    else if (person.dni) merchant = await Merchant.findOne({ where: { dni: person.dni } }, { transaction: t });

    if (!merchant) {
      merchant = await Merchant.create({
        name: person.name || `Sin nombre ${person.dni || ''}`,
        dni: person.dni || null,
        ruc: person.ruc || null,
        address: person.address || null
      }, { transaction: t });
    }

    // (2) Truck
    let truck = null;
    if (vehicle.plate) truck = await Truck.findOne({ where: { plate: vehicle.plate } }, { transaction: t });

    if (!truck) {
      let ownerInfo = null;
      if (vehicle.owner_dni) ownerInfo = await lookupByDNI(vehicle.owner_dni);
      truck = await Truck.create({
        plate: vehicle.plate || null,
        vehicle_type: vehicle.vehicle_type || 'otro',
        owner_dni: vehicle.owner_dni || (ownerInfo && ownerInfo.dni) || null,
        owner_name: (ownerInfo && ownerInfo.full_name) || vehicle.owner_name || null,
        merchant_id: merchant.id
      }, { transaction: t });
    }

    // (3) Movement
    const movement = await Movement.create({
      type: 'I',
      merchant_id: merchant.id,
      truck_id: truck ? truck.id : null,
      cochera_applied,
      cochera_value: 0,
      note: note || null
    }, { transaction: t });

    // (4) Items
    let subtotal_animals = 0;
    for (const it of items) {
      let unit_price = it.price_per_unit || it.unit_price || 0;
      if ((!unit_price || unit_price === 0) && use_tariffs && tariffs.animal[it.species]) {
        unit_price = tariffs.animal[it.species].default_price || 0;
      }
      if (!unit_price) unit_price = 0;

      const mvItem = await MovementItem.create({
        movement_id: movement.id,
        species: it.species,
        breed: it.breed || null,
        qty_in: it.qty || it.quantity || 0,
        unit_price
      }, { transaction: t });

      subtotal_animals += parseFloat(mvItem.subtotal || 0);
    }

    // (5) Cochera
    let cochera_value = 0;
    const vtype = vehicle.vehicle_type || (truck && truck.vehicle_type) || 'otro';
    if (cochera_applied) {
      cochera_value = (tariffs.cochera && tariffs.cochera[vtype]) ? tariffs.cochera[vtype] : 0;
    }

    movement.subtotal_animals = subtotal_animals;
    movement.cochera_value = cochera_value;
    movement.total = subtotal_animals + parseFloat(cochera_value || 0);
    await movement.save({ transaction: t });

    await t.commit();

    const saved = await Movement.findByPk(movement.id, { include: ['items'] });
    return res.status(201).json({ movement: saved, truck, merchant });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { ingresoCompleto };
