const socket = io();

const chatListEl = document.getElementById('chat-list');
const chatNameEl = document.getElementById('chat-name');
const chatMessagesEl = document.getElementById('chat-messages');
const messageInputEl = document.getElementById('message-input');
const sendButtonEl = document.getElementById('send-button');

const loadingIndicator = document.createElement('div');
loadingIndicator.textContent = 'Memuat pesan...';
loadingIndicator.style.textAlign = 'center';
loadingIndicator.style.padding = '10px';
loadingIndicator.style.color = '#888';

let currentChatId = null;

const searchInputEl = document.getElementById('search-input');
let allChats = [];

function addChat(chat) {
    const li = document.createElement('li');
    li.textContent = chat.name || 'Unnamed Chat';
    li.dataset.chatId = chat.id;
    li.dataset.searchName = (chat.name || '').toLowerCase(); // Gunakan string kosong jika name undefined
    li.addEventListener('click', () => {
        selectChat(chat.id, chat.name);
    });
    chatListEl.appendChild(li);
}

function selectChat(chatId, chatName) {
    if (currentChatId === chatId) return;

    currentChatId = chatId;
    chatNameEl.textContent = chatName;
    chatMessagesEl.innerHTML = '';
    messageInputEl.disabled = false;
    sendButtonEl.disabled = false;

    chatMessagesEl.appendChild(loadingIndicator);

    socket.emit('selectChat', chatId);
}

function addMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message');
    messageEl.classList.add(message.fromMe ? 'sent' : 'received');
    messageEl.textContent = message.body;
    chatMessagesEl.appendChild(messageEl);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function filterChats(searchTerm) {
    const lowercasedTerm = searchTerm.toLowerCase();
    const chatItems = chatListEl.getElementsByTagName('li');
    
    for (let item of chatItems) {
        const searchName = item.dataset.searchName;
        if (searchName) {
            const shouldShow = searchName.includes(lowercasedTerm);
            item.style.display = shouldShow ? '' : 'none';
        } else {
            console.warn('Chat item tidak memiliki dataset.searchName:', item);
            item.style.display = ''; // Tampilkan item jika tidak ada searchName
        }
    }
}

searchInputEl.addEventListener('input', (e) => {
    filterChats(e.target.value);
});

socket.on('chats', (chats) => {
    if (Array.isArray(chats)) {
        chatListEl.innerHTML = '';
        chats.forEach(chat => addChat(chat));
    } else {
        console.error('Data chats tidak valid:', chats);
    }
});

socket.on('messages', ({ chatId, messages }) => {
    if (chatId === currentChatId) {
        if (chatMessagesEl.contains(loadingIndicator)) {
            chatMessagesEl.removeChild(loadingIndicator);
        }

        if (Array.isArray(messages)) {
            chatMessagesEl.innerHTML = '';
            messages.forEach(message => addMessage(message));
        } else {
            console.error('Data messages tidak valid:', messages);
        }
    }
});

socket.on('newMessage', ({ chatId, message }) => {
    if (chatId === currentChatId) {
        addMessage(message);
    } else {
        const chatItem = document.querySelector(`li[data-chat-id="${chatId}"]`);
        if (chatItem) {
            chatItem.style.fontWeight = 'bold';
        }
    }
});

sendButtonEl.addEventListener('click', () => {
    const message = messageInputEl.value.trim();
    if (message && currentChatId) {
        socket.emit('sendMessage', { chatId: currentChatId, message });
        messageInputEl.value = '';
    }
});

messageInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendButtonEl.click();
    }
});

socket.on('error', (msg) => {
    alert(msg);
});

