const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./User')(sequelize, Sequelize);
db.Merchant = require('./Merchant')(sequelize, Sequelize);
db.Truck = require('./Truck')(sequelize, Sequelize);
db.Movement = require('./Movement')(sequelize, Sequelize);
db.MovementItem = require('./MovementItem')(sequelize, Sequelize);

// Relaciones
db.Merchant.hasMany(db.Truck, { foreignKey: 'merchant_id' });
db.Truck.belongsTo(db.Merchant, { foreignKey: 'merchant_id' });

db.Merchant.hasMany(db.Movement, { foreignKey: 'merchant_id' });
db.Movement.belongsTo(db.Merchant, { foreignKey: 'merchant_id' });

db.Truck.hasMany(db.Movement, { foreignKey: 'truck_id' });
db.Movement.belongsTo(db.Truck, { foreignKey: 'truck_id' });

db.Movement.hasMany(db.MovementItem, { foreignKey: 'movement_id', as: 'items' });
db.MovementItem.belongsTo(db.Movement, { foreignKey: 'movement_id' });

module.exports = db;
