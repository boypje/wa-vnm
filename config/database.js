// config/database.js
const { Sequelize } = require('sequelize');

// Ganti dengan konfigurasi database Anda
const sequelize = new Sequelize('venom', 'root', '', { 
    host: 'localhost',
    dialect: 'mysql',
    logging: false, // Set ke true untuk melihat query SQL di console
});

module.exports = sequelize;
