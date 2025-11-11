const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    email: { type: DataTypes.STRING, unique: true, allowNull: false, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin','personal'), allowNull: false, defaultValue: 'personal' }
  }, { 
    tableName: 'users',
    timestamps: true,       // ✅ Habilita createdAt y updatedAt
    createdAt: 'created_at',// ✅ Opcional: renombrar createdAt a created_at
    updatedAt: 'updated_at' // ✅ Opcional: renombrar updatedAt a updated_at
  });

  User.beforeCreate(async (user) => {
    if (user.password) user.password = await bcrypt.hash(user.password, 10);
  });

  User.beforeUpdate(async (user) => {
    if (user.changed('password')) user.password = await bcrypt.hash(user.password, 10);
  });

  User.prototype.validatePassword = function(password) {
    return bcrypt.compare(password, this.password);
  };

  return User;
};
