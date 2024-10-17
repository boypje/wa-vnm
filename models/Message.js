// models/Message.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    chatId: { // Sequelize akan mengkonversi ini ke 'chat_id' di database
        type: DataTypes.STRING(50),
        allowNull: false,
        index: true
    },
    body: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    fromMe: { // Sequelize akan mengkonversi ini ke 'from_me' di database
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'messages',
    timestamps: true,
    underscored: true // Menggunakan snake_case untuk kolom di database
});

module.exports = Message;
