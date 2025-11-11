module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Expense', {
    concept: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
    note: { type: DataTypes.TEXT, allowNull: true },
    date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW }
  }, { tableName: 'expenses' });
};
