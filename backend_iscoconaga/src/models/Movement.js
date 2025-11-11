module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Movement', {
    type: { 
      type: DataTypes.ENUM('I', 'S'), 
      allowNull: false, 
      defaultValue: 'I' 
    }, // solo ingresos

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

    // 👇 CAMBIO AQUÍ
    date: { type: DataTypes.DATEONLY, allowNull: true, defaultValue: DataTypes.NOW }

  }, { 
    tableName: 'movements' 
  });
};
