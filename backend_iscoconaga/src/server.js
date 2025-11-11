require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const db = require('./models'); // User, Merchant, Truck, Movement, MovementItem, Expense

// Rutas
const authRoutes = require('./routes/auth.routes');
const merchantRoutes = require('./routes/merchant.routes');
const ingresoRoutes = require('./routes/ingreso.routes');
const reportRoutes = require('./routes/report.routes');
const userRoutes = require('./routes/user.routes');
const movementRoutes = require('./routes/movement.routes'); // Movimientos

const app = express();
app.use(cors());
app.use(express.json());

// Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/ingresos', ingresoRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movements', movementRoutes); // Movimientos

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // 1️⃣ Crear DB si no existe
    const tempSequelize = new Sequelize('', process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      dialect: 'mysql',
      logging: false,
    });
    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`Database '${process.env.DB_NAME}' checked/created.`);

    // 2️⃣ Conectar Sequelize con la DB ya creada
    await db.sequelize.authenticate();
    console.log('DB connected.');

    // 3️⃣ Sincronizar modelos
    await db.sequelize.sync({ alter: true });
    console.log('Models synchronized.');

    // 4️⃣ Crear admin si no existe (solo en dev)
    if (process.env.NODE_ENV !== 'production') {
      const adminEmail = process.env.ADMIN_EMAIL || 'guadalupe.solorzano@municajamarca.gob.pe';
      const adminPass = process.env.ADMIN_PASS || 'RíoAndino_739';
      const adminUser = await db.User.findOne({ where: { email: adminEmail } });
      if (!adminUser) {
        await db.User.create({ email: adminEmail, password: adminPass, role: 'admin' });
        console.log(`Admin creado: ${adminEmail} / ${adminPass}`);
      } else {
        console.log(`Admin existe: ${adminEmail}`);
      }
    }

    // 5️⃣ Crear comerciante por defecto (ID 1) si no existe
    const defaultMerchant = await db.Merchant.findByPk(1);
    if (!defaultMerchant) {
      await db.Merchant.create({
        id: 1,
        firstName: 'Comerciante',
        lastName: 'Por Defecto',
        dni: '00000000',
        phone: 'No disponible'
      });
      console.log('Comerciante por defecto (ID 1) creado exitosamente');
    } else {
      console.log('Comerciante por defecto (ID 1) ya existe');
    }

    // 6️⃣ Levantar servidor
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Unable to start server:', err);
  }
})();