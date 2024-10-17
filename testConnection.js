// testConnection.js
const sequelize = require('./config/database');

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Koneksi ke MySQL berhasil.');
    } catch (error) {
        console.error('Gagal terhubung ke MySQL:', error);
    }
}

testConnection();
