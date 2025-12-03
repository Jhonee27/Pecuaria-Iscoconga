const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { permit } = require('../middleware/role.middleware');
const report = require('../controllers/report.controller');
const { Op } = require('sequelize');
const { Merchant, Movement } = require('../models');

// ================================
// RUTAS EXISTENTES DE REPORTES
// ================================

// Ganancias
router.get('/ganancias', auth, permit('admin'), report.ganancias);

// Reporte del día
router.get('/daily', auth, permit('admin'), report.reportDay);

// Reporte mensual
router.get('/monthly', auth, permit('admin'), report.reportMonth);

// Reporte anual
router.get('/yearly', auth, permit('admin'), report.reportYear);

// Ingresos por especie
router.get('/por_especie', auth, permit('admin'), report.ingresosPorEspecie);

// Ingresos por tipo de vehículo
router.get('/por_vehiculo', auth, permit('admin'), report.ingresosPorVehiculo);

// Exportar CSV o XLSX
router.get('/export', auth, permit('admin'), report.exportReport);


// ================================
// NUEVA RUTA PARA DASHBOARD
// ================================
router.get('/dashboard-stats', auth, permit('admin', 'personal'), async (req, res) => {
  try {
    // Total de comerciantes registrados
    const totalMerchants = await Merchant.count();

    // Fecha de inicio del día actual (en zona horaria local)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('=== Dashboard Stats Debug ===');
    console.log('Today start:', today);
    console.log('Current time:', new Date());

    // Movimientos realizados hoy
    const totalMovements = await Movement.count({
      where: {
        createdAt: { [Op.gte]: today }
      }
    });

    console.log('Total movements today:', totalMovements);

    // Ingresos de hoy (solo movimientos tipo 'I')
    const todayIncomeMovements = await Movement.findAll({
      where: {
        type: 'I',
        createdAt: { [Op.gte]: today }
      },
      attributes: ['id', 'total', 'createdAt', 'type']
    });

    console.log('Income movements found:', todayIncomeMovements.length);
    console.log('Income movements:', todayIncomeMovements.map(m => ({
      id: m.id,
      total: m.total,
      date: m.createdAt,
      type: m.type
    })));

    const todayIncome = await Movement.sum('total', {
      where: {
        type: 'I',
        createdAt: { [Op.gte]: today }
      }
    });

    console.log('Today income sum:', todayIncome);

    // Inicio del mes actual
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Ingresos del mes
    const monthlyIncome = await Movement.sum('total', {
      where: {
        type: 'I',
        createdAt: { [Op.gte]: startOfMonth }
      }
    });

    console.log('Monthly income sum:', monthlyIncome);
    console.log('=== End Debug ===');

    // Respuesta
    res.json({
      totalMerchants: totalMerchants || 0,
      totalMovements: totalMovements || 0,
      todayIncome: parseFloat(todayIncome || 0),
      monthlyIncome: parseFloat(monthlyIncome || 0)
    });

  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({
      message: 'Error al obtener estadísticas del dashboard',
      error: err.message
    });
  }
});


// Exportar el router
module.exports = router;
