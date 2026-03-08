// src/models/SuperAdmin.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const SuperAdmin = sequelize.define('SuperAdmin', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'super_admins',
  hooks: {
    beforeCreate: async (sa) => {
      if (sa.password) sa.password = await bcrypt.hash(sa.password, 10);
    },
    beforeUpdate: async (sa) => {
      if (sa.changed('password')) {
        const isHashed = sa.password.startsWith('$2');
        if (!isHashed) sa.password = await bcrypt.hash(sa.password, 10);
      }
    }
  }
});

SuperAdmin.prototype.validatePassword = async function(password) {
  return require('bcryptjs').compare(password, this.password);
};

module.exports = SuperAdmin;
