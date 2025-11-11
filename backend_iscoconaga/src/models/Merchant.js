module.exports = (sequelize, DataTypes) => {
  const Merchant = sequelize.define('Merchant', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dni: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    phone: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'merchants',
    timestamps: true
  });

  return Merchant;
};
