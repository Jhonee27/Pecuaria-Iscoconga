const { Movement, MovementItem, Expense, Truck, sequelize } = require('../models');
const { Op } = require('sequelize');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');

const parseDate = d => new Date(d);

const buildDateRange = (desde, hasta) => {
  console.log('Building date range:', { desde, hasta });
  const where = {};

  if (desde) {
    // Forzar inicio del día en hora Perú (GMT-5)
    // Si desde es '2025-12-03', esto crea '2025-12-03T00:00:00-05:00'
    const from = new Date(`${desde}T00:00:00-05:00`);
    where[Op.gte] = from;
    console.log('From Date (Peru Start):', from);
  }

  if (hasta) {
    // Forzar fin del día en hora Perú (GMT-5)
    const to = new Date(`${hasta}T23:59:59.999-05:00`);
    where[Op.lte] = to;
    console.log('To Date (Peru End):', to);
  }

  return where;
};

// === INGRESOS ===
const ingresosBetween = async (desde, hasta) => {
  const where = { type: 'I' };
  if (desde || hasta) where.createdAt = buildDateRange(desde, hasta);

  const total = await Movement.sum('total', { where });
  return parseFloat(total || 0);
};

// === GASTOS ===
const gastosBetween = async (desde, hasta) => {
  const where = {};
  if (desde || hasta) where.createdAt = buildDateRange(desde, hasta);

  const total = await Expense.sum('amount', { where });
  return parseFloat(total || 0);
};

// === GANANCIAS ===
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

// === REPORTE DÍA ===
const reportDay = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ingresos = await ingresosBetween(today.toISOString());
  const gastos = await gastosBetween(today.toISOString());

  res.json({
    date: today.toISOString().slice(0, 10),
    ingresos,
    gastos,
    neto: ingresos - gastos
  });
};

// === REPORTE MES ===
const reportMonth = async (req, res) => {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const ingresos = await ingresosBetween(start.toISOString());
  const gastos = await gastosBetween(start.toISOString());

  res.json({
    month: start.getMonth() + 1,
    year: start.getFullYear(),
    ingresos,
    gastos,
    neto: ingresos - gastos
  });
};

// === REPORTE AÑO ===
const reportYear = async (req, res) => {
  const start = new Date(new Date().getFullYear(), 0, 1);

  const ingresos = await ingresosBetween(start.toISOString());
  const gastos = await gastosBetween(start.toISOString());

  res.json({
    year: start.getFullYear(),
    ingresos,
    gastos,
    neto: ingresos - gastos
  });
};

// === INGRESOS POR ESPECIE ===
const ingresosPorEspecie = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const whereMovement = { type: 'I' };
    if (desde || hasta) whereMovement.createdAt = buildDateRange(desde, hasta);

    const data = await MovementItem.findAll({
      attributes: ['species', [sequelize.fn('SUM', sequelize.col('subtotal')), 'total']],
      include: [{
        model: Movement,
        attributes: [],
        required: true,
        where: whereMovement
      }],
      group: ['species']
    });

    res.json(data.map(r => ({
      species: r.species,
      total: parseFloat(r.dataValues.total)
    })));

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === INGRESOS POR VEHÍCULO ===
const ingresosPorVehiculo = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const where = { type: 'I' };
    if (desde || hasta) where.createdAt = buildDateRange(desde, hasta);

    const rows = await Movement.findAll({
      attributes: [
        [sequelize.col('Truck.vehicle_type'), 'vehicle_type'],
        [sequelize.fn('COUNT', sequelize.col('Movement.id')), 'count']
      ],
      include: [{ model: Truck, attributes: [] }],
      where,
      group: ['Truck.vehicle_type']
    });

    res.json(rows);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// === HELPER: Format date for display ===
const formatDateForDisplay = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// === HELPER: Get user-friendly column names ===
const getColumnLabel = (key) => {
  const labels = {
    movement_id: 'ID Movimiento',
    date: 'Fecha y Hora',
    merchant_id: 'ID Comerciante',
    truck_plate: 'Placa Vehículo',
    vehicle_type: 'Tipo Vehículo',
    species: 'Especie',
    breed: 'Raza',
    qty_in: 'Cantidad Ingreso',
    qty_sold: 'Cantidad Vendida',
    unit_price: 'Precio Unitario (S/)',
    subtotal_item: 'Subtotal Item (S/)',
    movement_subtotal: 'Subtotal Animales (S/)',
    cochera: 'Cochera (S/)',
    movement_total: 'Total Movimiento (S/)',
    verified_exit: 'Salida Verificada'
  };
  return labels[key] || key;
};

// === EXPORTAR REPORTES ===
const exportReport = async (req, res) => {
  try {
    const { desde, hasta, format = 'csv' } = req.query;

    const where = {};
    if (desde || hasta) where.createdAt = buildDateRange(desde, hasta);

    const movements = await Movement.findAll({
      where,
      include: [
        { model: MovementItem, as: 'items' },
        { model: Truck }
      ],
      order: [['createdAt', 'ASC']]
    });

    const rows = [];
    let totalIncome = 0;

    for (const m of movements) {
      for (const it of m.items) {
        rows.push({
          movement_id: m.id,
          date: m.createdAt,
          merchant_id: m.merchant_id,
          truck_plate: m.truck?.plate || '-',
          vehicle_type: m.truck?.vehicle_type || '-',
          species: it.species,
          breed: it.breed || '-',
          qty_in: it.qty_in,
          qty_sold: it.qty_sold,
          unit_price: parseFloat(it.unit_price),
          subtotal_item: parseFloat(it.subtotal),
          movement_subtotal: parseFloat(m.subtotal_animals),
          cochera: parseFloat(m.cochera_value),
          movement_total: parseFloat(m.total),
          verified_exit: m.verified_exit ? 'Sí' : 'No'
        });
        totalIncome += parseFloat(m.total);
      }
    }

    // === CSV ===
    if (format === 'csv') {
      // Prepare data with formatted dates and Spanish headers
      const csvData = rows.map(row => ({
        'ID Movimiento': row.movement_id,
        'Fecha y Hora': formatDateForDisplay(row.date),
        'ID Comerciante': row.merchant_id,
        'Placa Vehículo': row.truck_plate,
        'Tipo Vehículo': row.vehicle_type,
        'Especie': row.species,
        'Raza': row.breed,
        'Cantidad Ingreso': row.qty_in,
        'Cantidad Vendida': row.qty_sold,
        'Precio Unitario (S/)': row.unit_price.toFixed(2),
        'Subtotal Item (S/)': row.subtotal_item.toFixed(2),
        'Subtotal Animales (S/)': row.movement_subtotal.toFixed(2),
        'Cochera (S/)': row.cochera.toFixed(2),
        'Total Movimiento (S/)': row.movement_total.toFixed(2),
        'Salida Verificada': row.verified_exit
      }));

      const parser = new Parser({ withBOM: true });
      let csv = '';

      // Add header metadata
      csv += `PECUARIA ISCOCONGA - REPORTE DE ESTADÍSTICAS\n`;
      csv += `Fecha de generación: ${formatDateForDisplay(new Date())}\n`;
      if (desde || hasta) {
        csv += `Período: ${desde ? formatDateForDisplay(desde) : 'Inicio'} - ${hasta ? formatDateForDisplay(hasta) : 'Hasta hoy'}\n`;
      }
      csv += `Total de registros: ${rows.length}\n`;
      csv += `Total ingresos: S/ ${totalIncome.toFixed(2)}\n`;
      csv += `\n`;

      // Add data table
      csv += parser.parse(csvData);

      res.header('Content-Type', 'text/csv; charset=utf-8');
      res.attachment(`Reporte_Estadisticas_PECUARIA_${Date.now()}.csv`);
      return res.send('\ufeff' + csv); // Add BOM for Excel compatibility
    }

    // === XLSX ===
    if (format === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Reporte Estadísticas');

      // Company colors
      const primaryColor = '1e3a8a'; // Dark blue
      const secondaryColor = '3b82f6'; // Blue
      const headerBg = 'dbeafe'; // Light blue
      const summaryBg = 'fef3c7'; // Light yellow

      let currentRow = 1;

      // === HEADER SECTION ===
      ws.mergeCells(`A${currentRow}:O${currentRow}`);
      ws.getCell(`A${currentRow}`).value = 'PECUARIA ISCOCONGA';
      ws.getCell(`A${currentRow}`).font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      ws.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
      ws.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(currentRow).height = 30;
      currentRow++;

      ws.mergeCells(`A${currentRow}:O${currentRow}`);
      ws.getCell(`A${currentRow}`).value = 'REPORTE DE ESTADÍSTICAS Y MOVIMIENTOS';
      ws.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      ws.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: secondaryColor } };
      ws.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(currentRow).height = 25;
      currentRow++;

      // Metadata
      currentRow++;
      ws.getCell(`A${currentRow}`).value = 'Fecha de generación:';
      ws.getCell(`A${currentRow}`).font = { bold: true };
      ws.getCell(`B${currentRow}`).value = formatDateForDisplay(new Date());
      ws.mergeCells(`B${currentRow}:D${currentRow}`);
      currentRow++;

      if (desde || hasta) {
        ws.getCell(`A${currentRow}`).value = 'Período filtrado:';
        ws.getCell(`A${currentRow}`).font = { bold: true };
        ws.getCell(`B${currentRow}`).value = `${desde ? formatDateForDisplay(desde) : 'Inicio'} - ${hasta ? formatDateForDisplay(hasta) : 'Hasta hoy'}`;
        ws.mergeCells(`B${currentRow}:D${currentRow}`);
        currentRow++;
      }

      // === SUMMARY SECTION ===
      currentRow++;
      ws.mergeCells(`A${currentRow}:O${currentRow}`);
      ws.getCell(`A${currentRow}`).value = 'RESUMEN EJECUTIVO';
      ws.getCell(`A${currentRow}`).font = { size: 12, bold: true };
      ws.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: summaryBg } };
      ws.getCell(`A${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(currentRow).height = 20;
      currentRow++;

      const summaryData = [
        { label: 'Total de Movimientos:', value: movements.length },
        { label: 'Total de Items:', value: rows.length },
        { label: 'Total Ingresos:', value: `S/ ${totalIncome.toFixed(2)}` },
        { label: 'Promedio por Movimiento:', value: movements.length > 0 ? `S/ ${(totalIncome / movements.length).toFixed(2)}` : 'S/ 0.00' }
      ];

      summaryData.forEach(item => {
        ws.getCell(`A${currentRow}`).value = item.label;
        ws.getCell(`A${currentRow}`).font = { bold: true };
        ws.getCell(`B${currentRow}`).value = item.value;
        ws.getCell(`B${currentRow}`).font = { bold: true, color: { argb: primaryColor } };
        ws.mergeCells(`B${currentRow}:D${currentRow}`);
        currentRow++;
      });

      // === DATA TABLE ===
      currentRow++;
      const headerRow = currentRow;

      // Define columns with Spanish labels
      const columns = [
        { key: 'movement_id', width: 12 },
        { key: 'date', width: 18 },
        { key: 'merchant_id', width: 14 },
        { key: 'truck_plate', width: 14 },
        { key: 'vehicle_type', width: 14 },
        { key: 'species', width: 12 },
        { key: 'breed', width: 12 },
        { key: 'qty_in', width: 12 },
        { key: 'qty_sold', width: 12 },
        { key: 'unit_price', width: 14 },
        { key: 'subtotal_item', width: 14 },
        { key: 'movement_subtotal', width: 16 },
        { key: 'cochera', width: 12 },
        { key: 'movement_total', width: 16 },
        { key: 'verified_exit', width: 14 }
      ];

      // Set column widths
      columns.forEach((col, idx) => {
        ws.getColumn(idx + 1).width = col.width;
      });

      // Header row
      columns.forEach((col, idx) => {
        const cell = ws.getCell(headerRow, idx + 1);
        cell.value = getColumnLabel(col.key);
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      ws.getRow(headerRow).height = 30;
      currentRow++;

      // Data rows
      rows.forEach((row, idx) => {
        const isEvenRow = idx % 2 === 0;
        const rowData = [
          row.movement_id,
          formatDateForDisplay(row.date),
          row.merchant_id,
          row.truck_plate,
          row.vehicle_type,
          row.species,
          row.breed,
          row.qty_in,
          row.qty_sold,
          row.unit_price,
          row.subtotal_item,
          row.movement_subtotal,
          row.cochera,
          row.movement_total,
          row.verified_exit
        ];

        rowData.forEach((value, colIdx) => {
          const cell = ws.getCell(currentRow, colIdx + 1);
          cell.value = value;

          // Alternating row colors
          if (isEvenRow) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf3f4f6' } };
          }

          // Number formatting for currency columns
          if (colIdx >= 9 && colIdx <= 13) {
            cell.numFmt = '"S/ "#,##0.00';
            cell.alignment = { horizontal: 'right' };
          } else if (colIdx === 7 || colIdx === 8) {
            cell.alignment = { horizontal: 'center' };
          } else {
            cell.alignment = { horizontal: 'left' };
          }

          // Borders
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFd1d5db' } },
            left: { style: 'thin', color: { argb: 'FFd1d5db' } },
            bottom: { style: 'thin', color: { argb: 'FFd1d5db' } },
            right: { style: 'thin', color: { argb: 'FFd1d5db' } }
          };
        });

        currentRow++;
      });

      // Freeze header panes
      ws.views = [
        { state: 'frozen', xSplit: 0, ySplit: headerRow }
      ];

      // Auto-filter
      ws.autoFilter = {
        from: { row: headerRow, column: 1 },
        to: { row: headerRow, column: columns.length }
      };

      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment(`Reporte_Estadisticas_PECUARIA_${Date.now()}.xlsx`);
      await wb.xlsx.write(res);
      return res.end();
    }

    return res.status(400).json({ message: 'format must be csv or xlsx' });

  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  ganancias,
  reportDay,
  reportMonth,
  reportYear,
  ingresosPorEspecie,
  ingresosPorVehiculo,
  exportReport
};
