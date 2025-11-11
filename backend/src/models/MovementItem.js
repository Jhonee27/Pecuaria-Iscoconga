module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define('MovementItem', {
    category: { type: DataTypes.ENUM('ganado','vehículo','cochera'), allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false },
    breed: { type: DataTypes.STRING, allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    qty_in: { type: DataTypes.INTEGER, defaultValue: 1 },
    unit_price: { type: DataTypes.DECIMAL(12,2), defaultValue: 0.0 },
    subtotal: { type: DataTypes.DECIMAL(12,2), defaultValue: 0.0 }
  }, { tableName: 'movement_items' });

  Model.beforeCreate(item => item.subtotal = (item.qty_in || 0) * (item.unit_price || 0));
  Model.beforeUpdate(item => item.subtotal = (item.qty_in || 0) * (item.unit_price || 0));

  return Model;
};
