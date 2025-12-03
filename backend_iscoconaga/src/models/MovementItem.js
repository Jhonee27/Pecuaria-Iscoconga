module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define('MovementItem', {
    // Soporte para ambos formatos: species (nuevo) o category+type (legacy)
    species: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Especie del animal (vacuno, ovino, porcino, etc.)'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Categoría legacy (ganado, vehículo, cochera)'
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tipo legacy'
    },
    breed: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Raza del animal'
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    qty_in: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Cantidad de animales/items'
    },
    unit_price: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
      comment: 'Precio por unidad'
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
      comment: 'Subtotal = qty_in * unit_price'
    }
  }, { tableName: 'movement_items' });

  // Hook para normalizar species desde category si está disponible
  Model.beforeCreate(item => {
    // Si no hay species pero sí category+type, usar category como species
    if (!item.species && item.category) {
      item.species = item.type || item.category;
    }
    // Calcular subtotal
    item.subtotal = (item.qty_in || 0) * (item.unit_price || 0);
  });

  Model.beforeUpdate(item => {
    // Normalizar species
    if (!item.species && item.category) {
      item.species = item.type || item.category;
    }
    // Calcular subtotal
    item.subtotal = (item.qty_in || 0) * (item.unit_price || 0);
  });

  return Model;
};
