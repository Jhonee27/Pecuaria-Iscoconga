const { Movement, MovementItem, Expense, Truck, sequelize } = require('../models');
const { Op } = require('sequelize');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');

const parseDate = d => new Date(d);

const buildDateRange = (desde, hasta) => {
  const where = {};
  if (desde) where[Op.gte] = parseDate(desde);
  if (hasta) {
    const to = parseDate(hasta);
    to.setHours(23,59,59,999);
    where[Op.lte] = to;
  }
  return where;
};

const ingresosBetween = async (desde, hasta) => {
  const where = { type: 'I' };
  if (desde || hasta) where.created_at = buildDateRange(desde, hasta);
  const total = await Movement.sum('total', { where });
  return parseFloat(total || 0);
};

const gastosBetween = async (desde, hasta) => {
  const where = {};
  if (desde || hasta) where.date = buildDateRange(desde, hasta);
  const total = await Expense.sum('amount', { where });
  return parseFloat(total || 0);
};

const ganancias = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const ingresos = await ingresosBetween(desde, hasta);
    const gastos = await gastosBetween(desde, hasta);
    const neto = ingresos - gastos;
    res.json({ ingresos, gastos, neto });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const reportDay = async (req, res) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const ingresos = await ingresosBetween(today.toISOString());
  const gastos = await gastosBetween(today.toISOString());
  res.json({ date: today.toISOString().slice(0,10), ingresos, gastos, neto: ingresos-gastos });
};

const reportMonth = async (req, res) => {
  const start = new Date(); start.setDate(1); start.setHours(0,0,0,0);
  const ingresos = await ingresosBetween(start.toISOString());
  const gastos = await gastosBetween(start.toISOString());
  res.json({ month: start.getMonth()+1, year: start.getFullYear(), ingresos, gastos, neto: ingresos-gastos });
};

const reportYear = async (req, res) => {
  const start = new Date(new Date().getFullYear(),0,1);
  const ingresos = await ingresosBetween(start.toISOString());
  const gastos = await gastosBetween(start.toISOString());
  res.json({ year: start.getFullYear(), ingresos, gastos, neto: ingresos-gastos });
};

// breakdown by species
const ingresosPorEspecie = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const whereMovement = { type: 'I' };
    if (desde || hasta) whereMovement.created_at = buildDateRange(desde, hasta);

    const data = await MovementItem.findAll({
      attributes: ['species', [sequelize.fn('SUM', sequelize.col('subtotal')), 'total']],
      include: [{ model: Movement, attributes: [], where: whereMovement, required: true }],
      group: ['species']
    });

    res.json(data.map(r => ({ species: r.species, total: parseFloat(r.dataValues.total) })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// breakdown by vehicle type
const ingresosPorVehiculo = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const where = { type: 'I' };
    if (desde || hasta) where.created_at = buildDateRange(desde, hasta);

    const rows = await Movement.findAll({
      attributes: [[sequelize.col('Truck.vehicle_type'), 'vehicle_type'], [sequelize.fn('COUNT', sequelize.col('Movement.id')), 'count']],
      include: [{ model: Truck, attributes: [] }],
      where,
      group: ['Truck.vehicle_type']
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// export CSV/XLSX
const exportReport = async (req, res) => {
  try {
    const { desde, hasta, format='csv' } = req.query;
    const where = {};
    if (desde || hasta) where.created_at = buildDateRange(desde, hasta);

    const movements = await Movement.findAll({
      where,
      include: [{ model: MovementItem, as: 'items' }, { model: Truck }],
      order: [['created_at','ASC']]
    });

    const rows = [];
    for (const m of movements) {
      for (const it of m.items) {
        rows.push({
          movement_id: m.id,
          date: m.created_at,
          merchant_id: m.merchant_id,
          truck_plate: m.truck ? m.truck.plate : null,
          vehicle_type: m.truck ? m.truck.vehicle_type : null,
          species: it.species,
          breed: it.breed,
          qty_in: it.qty_in,
          qty_sold: it.qty_sold,
          unit_price: it.unit_price,
          subtotal_item: it.subtotal,
          movement_subtotal: m.subtotal_animals,
          cochera: m.cochera_value,
          movement_total: m.total,
          verified_exit: m.verified_exit
        });
      }
    }

    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(rows);
      res.header('Content-Type', 'text/csv');
      res.attachment(`report_${Date.now()}.csv`);
      return res.send(csv);
    } else if (format === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Report');
      if (rows.length > 0) {
        ws.columns = Object.keys(rows[0]).map(k => ({ header: k, key: k, width: 15 }));
        rows.forEach(r => ws.addRow(r));
      }
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment(`report_${Date.now()}.xlsx`);
      await wb.xlsx.write(res);
      return res.end();
    } else {
      return res.status(400).json({ message: 'format must be csv or xlsx' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  ganancias, reportDay, reportMonth, reportYear,
  ingresosPorEspecie, ingresosPorVehiculo, exportReport
};
