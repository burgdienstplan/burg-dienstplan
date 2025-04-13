// Chat-Funktionalität für Mitarbeiter

document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');

    // Chat-Nachrichten laden und anzeigen
    function loadChatMessages() {
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

    // Neue Nachricht senden
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const messages = JSON.parse(localStorage.getItem('chatNachrichten') || '[]');
        
        // Leere Nachrichten verhindern
        const messageText = messageInput.value.trim();
        if (!messageText) return;

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
        
        // Formular zurücksetzen
        messageForm.reset();
        
        // Chat aktualisieren
        loadChatMessages();
    });

    // Regelmäßiges Aktualisieren des Chats
    function startChatRefresh() {
        // Initial laden
        loadChatMessages();
        
        // Alle 5 Sekunden aktualisieren
        setInterval(loadChatMessages, 5000);
    }

    // Chat-Aktualisierung starten
    startChatRefresh();
});
