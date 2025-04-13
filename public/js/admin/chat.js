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
    
    // Lade initial die Nachrichten
    loadChatMessages();
    
    // Aktualisiere Chat alle 10 Sekunden
    setInterval(loadChatMessages, 10000);
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
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessageBtn.click();
        }
    });
}

async function addChatMessage(messageText) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    try {
        // Sende Nachricht an API
        const response = await fetch('/.netlify/functions/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                von: currentUser.id,
                nachricht: messageText
            })
        });
        
        if (!response.ok) {
            throw new Error('Fehler beim Senden der Nachricht');
        }
        
        // Lade Chat neu
        loadChatMessages();
    } catch (error) {
        console.error('Chat-Fehler:', error);
        alert('Nachricht konnte nicht gesendet werden');
    }
}

async function loadChatMessages() {
    const chatMessages = document.getElementById('chatMessages');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    try {
        // Lade Nachrichten von API
        const [messagesResponse, usersResponse] = await Promise.all([
            fetch('/.netlify/functions/api/chat'),
            fetch('/.netlify/functions/api/users')
        ]);
        
        if (!messagesResponse.ok || !usersResponse.ok) {
            throw new Error('Fehler beim Laden der Daten');
        }
        
        const messages = await messagesResponse.json();
        const users = await usersResponse.json();
        
        // Chat-Container leeren
        chatMessages.innerHTML = '';
        
        // Nachrichten anzeigen
        messages.forEach(message => {
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
    } catch (error) {
        console.error('Chat-Fehler:', error);
        chatMessages.innerHTML = '<div class="error-message">Fehler beim Laden der Nachrichten</div>';
    }
}

// Einkaufsliste Funktionalität
function initializeShoppingList() {
    const addItemBtn = document.getElementById('addItemBtn');
    const itemInput = document.getElementById('itemInput');
    
    if (addItemBtn && itemInput) {
        addItemBtn.addEventListener('click', addShoppingItem);
        itemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addShoppingItem();
            }
        });
    }
    
    loadShoppingList();
}

function addShoppingItem() {
    const itemInput = document.getElementById('itemInput');
    const item = itemInput.value.trim();
    
    if (item) {
        const items = JSON.parse(localStorage.getItem('einkaufsliste') || '[]');
        items.push({
            id: Date.now().toString(),
            text: item,
            erledigt: false
        });
        
        localStorage.setItem('einkaufsliste', JSON.stringify(items));
        itemInput.value = '';
        loadShoppingList();
    }
}

function removeShoppingItem(item) {
    const items = JSON.parse(localStorage.getItem('einkaufsliste') || '[]');
    const updatedItems = items.filter(i => i.id !== item.id);
    localStorage.setItem('einkaufsliste', JSON.stringify(updatedItems));
    loadShoppingList();
}

function loadShoppingList() {
    const shoppingList = document.getElementById('shoppingList');
    const items = JSON.parse(localStorage.getItem('einkaufsliste') || '[]');
    
    shoppingList.innerHTML = '';
    items.forEach(item => {
        const itemElement = createShoppingListItem(item);
        shoppingList.appendChild(itemElement);
    });
}

function createShoppingListItem(item) {
    const itemElement = document.createElement('div');
    itemElement.classList.add('shopping-item');
    if (item.erledigt) itemElement.classList.add('done');
    
    itemElement.innerHTML = `
        <span class="item-text">${item.text}</span>
        <button class="remove-btn" onclick="removeShoppingItem(${JSON.stringify(item)})">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    return itemElement;
}

// Hilfsfunktionen
function addSystemMessage(message) {
    const messages = JSON.parse(localStorage.getItem('chatNachrichten') || '[]');
    
    const systemMessage = {
        id: Date.now().toString(),
        von: 'system',
        nachricht: message,
        zeitstempel: new Date().toISOString()
    };
    
    messages.push(systemMessage);
    localStorage.setItem('chatNachrichten', JSON.stringify(messages));
    
    loadChatMessages();
}

function getCurrentTime() {
    return new Date().toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
    });
}
