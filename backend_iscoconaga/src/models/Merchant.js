module.exports = (sequelize, DataTypes) => {
  const Merchant = sequelize.define('Merchant', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    // Campos principales usados por ingreso.controller.js
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dni: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    ruc: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Campos alternativos para compatibilidad con merchant.controller.js
    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'merchants',
    timestamps: true
  });

  return Merchant;
};
