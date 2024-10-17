// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/database');
const { startVenom, sendMessage, getChatsList, getMessages } = require('./venom');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const Contact = require('./models/Contact');
const Message = require('./models/Message');

sequelize.sync({ alter: true })
    .then(() => {
        console.log('Database & tables created or altered!');
        startVenom(io);
    })
    .catch(err => {
        console.error('Error sinkronisasi database:', err);
    });

io.on('connection', (socket) => {
    console.log('Seorang user terhubung');

    getChatsList().then(chats => {
        console.log('Mengirim daftar chat saat koneksi:', chats);
        socket.emit('chats', chats);
    }).catch(err => {
        console.error('Error mengambil daftar chat:', err);
        socket.emit('chats', []);
    });

    socket.on('selectChat', async (chatId) => {
        try {
            const messages = await getMessages(chatId);
            console.log(`Mengirim pesan untuk chat ${chatId}:`, messages);
            socket.emit('messages', { chatId, messages });
        } catch (error) {
            console.error('Error mengambil pesan:', error);
            socket.emit('messages', { chatId, messages: [] });
        }
    });

    socket.on('sendMessage', ({ chatId, message }) => {
        console.log(`Mengirim pesan ke ${chatId}: ${message}`);
        sendMessage(chatId, message).then(() => {
            console.log(`Pesan berhasil dikirim ke ${chatId}`);
        }).catch(error => {
            console.error('Error mengirim pesan:', error);
            socket.emit('error', 'Gagal mengirim pesan');
        });
    });

    socket.on('disconnect', () => {
        console.log('Seorang user terputus');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
