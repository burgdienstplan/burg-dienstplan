// Chat & Einkaufsliste Funktionalität

document.addEventListener('DOMContentLoaded', () => {
    // Setze den aktuellen Benutzer
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        document.getElementById('currentUserName').textContent = currentUser.name || 'Admin';
    }

    initializeChat();
    initializeShoppingList();
    initializeNavigation();
});

// Navigation
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.chat-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Deaktiviere alle Tabs
            navLinks.forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.chat-container').forEach(c => c.classList.remove('active'));
            
            // Aktiviere ausgewählten Tab
            link.classList.add('active');
            const target = link.getAttribute('data-target');
            document.getElementById(target).classList.add('active');
        });
    });
}

// Chat Funktionalität
function initializeChat() {
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const chatMessages = document.getElementById('chatMessages');

    if (!messageInput || !sendMessageBtn || !chatMessages) {
        console.error('Chat-Elemente nicht gefunden');
        return;
    }

    // Senden-Button
    sendMessageBtn.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message) {
            addChatMessage(message);
            messageInput.value = '';
            messageInput.focus();
        }
    });

    // Enter-Taste
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const message = messageInput.value.trim();
            if (message) {
                addChatMessage(message);
                messageInput.value = '';
                messageInput.focus();
            }
        }
    });

    // Lade gespeicherte Nachrichten
    loadChatMessages();
    
    // Regelmäßiges Aktualisieren
    setInterval(loadChatMessages, 5000);
}

function addChatMessage(messageText) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const messages = JSON.parse(localStorage.getItem('chatNachrichten') || '[]');
    
    // Neue Nachricht erstellen
    const newMessage = {
        id: Date.now().toString(),
        von: currentUser.id,
        nachricht: messageText,
        zeitstempel: new Date().toISOString()
    };
    
    // Nachricht speichern
    messages.push(newMessage);
    localStorage.setItem('chatNachrichten', JSON.stringify(messages));
    
    // Chat aktualisieren
    loadChatMessages();
}

function loadChatMessages() {
    const chatMessages = document.getElementById('chatMessages');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const messages = JSON.parse(localStorage.getItem('chatNachrichten') || '[]');
    
    // Chat-Container leeren
    chatMessages.innerHTML = '';
    
    // Nachrichten sortieren (älteste zuerst)
    const sortedMessages = messages.sort((a, b) => 
        new Date(a.zeitstempel) - new Date(b.zeitstempel)
    );

    // Nachrichten anzeigen
    sortedMessages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        
        // Eigene Nachrichten anders stylen
        if (message.von === currentUser.id) {
            messageElement.classList.add('own-message');
        }

        // Formatiere Zeitstempel
        const zeit = new Date(message.zeitstempel).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Hole Benutzernamen
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const sender = users.find(user => user.id === message.von);
        const senderName = sender ? sender.name : 'Unbekannt';

        messageElement.innerHTML = `
            <div class="message-header">
                <span class="sender">${senderName}</span>
                <span class="time">${zeit}</span>
            </div>
            <div class="message-content">${message.nachricht}</div>
        `;
        
        chatMessages.appendChild(messageElement);
    });

    // Scroll zum Ende
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Einkaufsliste Funktionalität
function initializeShoppingList() {
    const newShoppingItem = document.getElementById('newShoppingItem');
    const addShoppingItemBtn = document.getElementById('addShoppingItemBtn');

    if (!newShoppingItem || !addShoppingItemBtn) {
        console.error('Einkaufslisten-Elemente nicht gefunden');
        return;
    }

    // Plus-Button
    addShoppingItemBtn.addEventListener('click', () => {
        addShoppingItem();
    });

    // Enter-Taste
    newShoppingItem.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addShoppingItem();
        }
    });

    // Lade gespeicherte Einträge
    loadShoppingList();
}

function addShoppingItem() {
    const input = document.getElementById('newShoppingItem');
    const item = input.value.trim();
    
    if (item) {
        const items = JSON.parse(localStorage.getItem('shoppingList') || '[]');
        if (!items.includes(item)) {
            items.push(item);
            localStorage.setItem('shoppingList', JSON.stringify(items));
            
            const shoppingList = document.getElementById('shoppingList');
            const li = createShoppingListItem(item);
            shoppingList.appendChild(li);

            // System-Nachricht im Chat
            addSystemMessage(`[Einkaufsliste] Neuer Eintrag: ${item}`);
        }
        
        input.value = '';
        input.focus();
    }
}

function removeShoppingItem(item) {
    const items = JSON.parse(localStorage.getItem('shoppingList') || '[]');
    const index = items.indexOf(item);
    
    if (index > -1) {
        items.splice(index, 1);
        localStorage.setItem('shoppingList', JSON.stringify(items));
        loadShoppingList();
        addSystemMessage(`[Einkaufsliste] Eintrag entfernt: ${item}`);
    }
}

function loadShoppingList() {
    const shoppingList = document.getElementById('shoppingList');
    if (!shoppingList) return;

    const items = JSON.parse(localStorage.getItem('shoppingList') || '[]');
    shoppingList.innerHTML = '';
    
    items.forEach(item => {
        const li = createShoppingListItem(item);
        shoppingList.appendChild(li);
    });
}

function createShoppingListItem(item) {
    const li = document.createElement('li');
    const itemSpan = document.createElement('span');
    itemSpan.textContent = item;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.type = 'button';
    deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
    deleteBtn.onclick = () => removeShoppingItem(item);
    
    li.appendChild(itemSpan);
    li.appendChild(deleteBtn);
    return li;
}

// Hilfsfunktionen
function addSystemMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';
    messageDiv.innerHTML = `
        <span>${getCurrentTime()}</span>
        <p>${message}</p>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Speichern
    const messages = JSON.parse(localStorage.getItem('chatNachrichten') || '[]');
    messages.push({
        time: getCurrentTime(),
        message: message,
        type: 'system'
    });
    localStorage.setItem('chatNachrichten', JSON.stringify(messages));
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit'
    });
}
