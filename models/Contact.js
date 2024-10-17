// models/Contact.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contact = sequelize.define('Contact', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    isGroup: { // Sequelize akan mengkonversi ini ke 'is_group' di database
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'contacts',
    timestamps: true,
    underscored: true // Menggunakan snake_case untuk kolom di database
});

module.exports = Contact;
