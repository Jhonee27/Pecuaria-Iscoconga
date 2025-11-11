const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { permit } = require('../middleware/role.middleware');
const report = require('../controllers/report.controller');

// Rutas existentes
router.get('/ganancias', auth, permit('admin'), report.ganancias);
router.get('/daily', auth, permit('admin'), report.reportDay);
router.get('/monthly', auth, permit('admin'), report.reportMonth);
router.get('/yearly', auth, permit('admin'), report.reportYear);
router.get('/por_especie', auth, permit('admin'), report.ingresosPorEspecie);
router.get('/por_vehiculo', auth, permit('admin'), report.ingresosPorVehiculo);
router.get('/export', auth, permit('admin'), report.exportReport);

// NUEVA RUTA - Dashboard statistics
router.get('/dashboard-stats', auth, permit('admin','personal'), async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { Merchant, Movement } = require('../models');

    // Total de comerciantes
    const totalMerchants = await Merchant.count();
    
    // Fecha de hoy (inicio del día)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Movimientos de hoy
    const totalMovements = await Movement.count({
      where: {
        created_at: {
          [Op.gte]: today
        }
      }
    });

    // Ingresos de hoy (solo movimientos tipo 'I' - Ingreso)
    const todayIncome = await Movement.sum('total', {
      where: {
        type: 'I',
        created_at: {
          [Op.gte]: today
        }
      }
    });

    // Ingresos del mes actual
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyIncome = await Movement.sum('total', {
      where: {
        type: 'I',
        created_at: {
          [Op.gte]: startOfMonth
        }
      }
    });

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

module.exports = router;