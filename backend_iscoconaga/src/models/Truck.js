module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Truck', {
    plate: { type: DataTypes.STRING, unique: true, allowNull: true },
    vehicle_type: { type: DataTypes.ENUM('moto','auto','camion','trailer','otro'), defaultValue: 'otro' },
    capacity_est: { type: DataTypes.INTEGER, allowNull: true },
    owner_name: { type: DataTypes.STRING, allowNull: true },
    owner_dni: { type: DataTypes.STRING, allowNull: true }
  }, { tableName: 'trucks' });
};

