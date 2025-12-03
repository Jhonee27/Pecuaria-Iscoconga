module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Movement', {
    type: {
      type: DataTypes.ENUM('I', 'S'),
      allowNull: false,
      defaultValue: 'I'
    }, // I = Ingreso, S = Salida

    merchant_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    truck_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    total: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0
    },

    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },

    // Campos de cochera
    cochera_applied: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    cochera_value: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0
    },

    // Subtotal de animales (sin cochera)
    subtotal_animals: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0
    },

    // Verificación de salida
    verified_exit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }

  }, {
    tableName: 'movements'
  });
};
