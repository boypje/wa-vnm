const venom = require('venom-bot');
const Contact = require('./models/Contact');
const Message = require('./models/Message');

let venomClient = null;
let ioInstance = null;

const nomorList = [
    '628819810368',
    '628992897711',
    '6289699964780',
    '6281240305461',
    '6285856105130',
    '62881027117002',
    '6282131470771',
    '6289609446829'
];

const pesan = "Jangan lupa buat daily report ya!";

function kirimPesan(client) {
    nomorList.forEach(nomor => {
        let formattedNumber = `${nomor}@c.us`;

        client.sendText(formattedNumber, pesan)
            .then(async (result) => {
                console.log(`[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Pesan terkirim ke ${nomor}`);
                
                const [contact, created] = await Contact.findOrCreate({
                    where: { number: formattedNumber },
                    defaults: { name: nomor }
                });

                if (created) {
                    console.log(`Kontak baru ${nomor} ditambahkan ke database.`);
                } else {
                    console.log(`Kontak ${nomor} sudah ada di database.`);
                }

                await Message.create({
                    chatId: formattedNumber,
                    body: pesan,
                    fromMe: true,
                    timestamp: new Date()
                });
                console.log(`Pesan ke ${nomor} berhasil disimpan di database.`);

                ioInstance.emit('newMessage', {
                    chatId: formattedNumber,
                    message: {
                        body: pesan,
                        fromMe: true,
                        timestamp: new Date()
                    }
                });
                console.log(`Pesan ke ${nomor} dikirim ke frontend.`);
            })
            .catch((error) => {
                console.error(`[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Gagal mengirim pesan ke ${nomor}: `, error);
            });
    });
}

async function getChatsList() {
    if (venomClient) {
        try {
            const chats = await venomClient.getAllChats();
            const personalChats = chats.filter(chat => !chat.isGroup);

            for (const chat of personalChats) {
                const [contact, created] = await Contact.findOrCreate({
                    where: { number: chat.id._serialized },
                    defaults: { name: chat.name || chat.id.user, isGroup: chat.isGroup }
                });

                if (created) {
                    console.log(`Kontak baru ${chat.id._serialized} ditambahkan ke database.`);
                } else {
                    console.log(`Kontak ${chat.id._serialized} sudah ada di database.`);
                }
            }

            return personalChats.map(chat => ({
                id: chat.id._serialized,
                name: chat.name || chat.id.user,
            }));
        } catch (error) {
            console.error('Error mengambil daftar chat:', error);
            return [];
        }
    } else {
        console.error('Client belum siap');
        return [];
    }
}

async function getMessages(chatId) {
    if (venomClient) {
        try {
            const messages = await Message.findAll({
                where: { chatId },
                order: [['timestamp', 'ASC']]
            });
            console.log(`Pesan untuk chatId ${chatId} diambil dari database.`);
            return messages.map(msg => ({
                body: msg.body,
                fromMe: msg.fromMe,
                timestamp: msg.timestamp
            }));
        } catch (error) {
            console.error('Error mengambil pesan:', error);
            return [];
        }
    } else {
        console.error('Client belum siap');
        return [];
    }
}

async function sendMessage(chatId, message) {
    if (venomClient) {
        try {
            await venomClient.sendText(chatId, message);
            const msg = await Message.create({
                chatId: chatId,
                body: message,
                fromMe: true,
                timestamp: new Date()
            });
            console.log(`Pesan ke ${chatId} berhasil disimpan di database.`);

            ioInstance.emit('newMessage', {
                chatId: chatId,
                message: {
                    body: message,
                    fromMe: true,
                    timestamp: msg.timestamp
                }
            });
            console.log(`Pesan ke ${chatId} dikirim ke frontend.`);
        } catch (error) {
            console.error('Error mengirim pesan:', error);
            throw error;
        }
    } else {
        throw new Error('Client belum siap');
    }
}

function monitorChatChanges() {
    setInterval(async () => {
        try {
            const chats = await getChatsList();
            console.log('Daftar chat diperbarui:', chats);
            ioInstance.emit('chats', chats);
        } catch (error) {
            console.error('Error memonitor perubahan chat:', error);
        }
    }, 30000);
}

function startVenom(io) {
    ioInstance = io;
    venom.create({
        session: 'my-session',
        headless: true,
    }).then(client => {
        venomClient = client;
        console.log('Bot WhatsApp berhasil dijalankan!');

        client.onMessage(async (message) => {
            console.log(`[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Pesan diterima dari ${message.from}: ${message.body}`);
            
            try {
                const [contact, created] = await Contact.findOrCreate({
                    where: { number: message.from },
                    defaults: { name: message.sender.name || message.from, isGroup: message.isGroup }
                });
                if (created) {
                    console.log(`Kontak baru ${message.from} ditambahkan ke database.`);
                } else {
                    console.log(`Kontak ${message.from} sudah ada di database.`);
                }

                const msg = await Message.create({
                    chatId: message.from,
                    body: message.body,
                    fromMe: message.fromMe,
                    timestamp: new Date(message.timestamp * 1000)
                });
                console.log(`Pesan dari ${message.from} disimpan ke database.`);

                if (ioInstance) {
                    ioInstance.emit('newMessage', {
                        chatId: message.from,
                        message: {
                            body: message.body,
                            fromMe: message.fromMe,
                            timestamp: msg.timestamp
                        }
                    });
                    console.log(`Pesan dari ${message.from} dikirim ke frontend.`);
                }

                if (ioInstance) {
                    const chats = await getChatsList();
                    ioInstance.emit('chats', chats);
                    console.log('Daftar chat diperbarui di frontend.');
                }

            } catch (error) {
                console.error('Error dalam menangani pesan masuk:', error);
            }
            
        });

        monitorChatChanges();

        const cron = require('node-cron');

        cron.schedule('15 17 * * *', () => {
            console.log(`[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Mengirim pesan pada jam 17:15 WIB`);
            kirimPesan(client);
        }, {
            timezone: 'Asia/Jakarta'
        });

        cron.schedule('0 20 * * *', () => {
            console.log(`[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Mengirim pesan pada jam 20:00 WIB`);
            kirimPesan(client);
        }, {
            timezone: 'Asia/Jakarta'
        });

        cron.schedule('0 22 * * *', () => {
            console.log(`[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}] Mengirim pesan pada jam 22:00 WIB`);
            kirimPesan(client);
        }, {
            timezone: 'Asia/Jakarta'
        });

    }).catch(error => {
        console.error('Gagal memulai bot WhatsApp: ', error);
    });
}

module.exports = { startVenom, sendMessage, getChatsList, getMessages };
