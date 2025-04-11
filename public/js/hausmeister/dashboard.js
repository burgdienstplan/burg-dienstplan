// Hausmeister Dashboard

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.rolle !== 'hausmeister') {
        window.location.href = '/index.html';
        return;
    }

    // Aufgaben laden
    loadAufgaben();

    // Chat initialisieren
    initChat();
});

// Aufgaben laden
async function loadAufgaben() {
    try {
        const response = await fetch('/.netlify/functions/api/aufgaben');
        const aufgaben = await response.json();
        
        const aufgabenListe = document.getElementById('aufgabenListe');
        aufgabenListe.innerHTML = '';

        aufgaben.forEach(aufgabe => {
            const aufgabenElement = document.createElement('div');
            aufgabenElement.className = `aufgabe ${aufgabe.status}`;
            aufgabenElement.innerHTML = `
                <div class="aufgabe-header">
                    <h3>${aufgabe.titel}</h3>
                    <span class="datum">${formatDate(new Date(aufgabe.datum))}</span>
                </div>
                <p>${aufgabe.beschreibung}</p>
                <div class="aufgabe-footer">
                    <select class="status-select" onchange="updateAufgabenStatus('${aufgabe._id}', this.value)">
                        <option value="offen" ${aufgabe.status === 'offen' ? 'selected' : ''}>Offen</option>
                        <option value="in_arbeit" ${aufgabe.status === 'in_arbeit' ? 'selected' : ''}>In Arbeit</option>
                        <option value="erledigt" ${aufgabe.status === 'erledigt' ? 'selected' : ''}>Erledigt</option>
                    </select>
                    <span class="prioritaet ${aufgabe.prioritaet}">
                        ${aufgabe.prioritaet.charAt(0).toUpperCase() + aufgabe.prioritaet.slice(1)}
                    </span>
                </div>
            `;
            aufgabenListe.appendChild(aufgabenElement);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Aufgaben:', error);
    }
}

// Aufgabenstatus aktualisieren
async function updateAufgabenStatus(aufgabenId, neuerStatus) {
    try {
        const response = await fetch(`/.netlify/functions/api/aufgaben/${aufgabenId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: neuerStatus })
        });

        if (!response.ok) throw new Error('Fehler beim Aktualisieren des Status');

        // Aufgaben neu laden
        loadAufgaben();
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Aktualisieren des Status');
    }
}

// Chat initialisieren
function initChat() {
    const chatContainer = document.getElementById('chatContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendMessage');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    loadMessages();

    // Nachrichten alle 10 Sekunden aktualisieren
    setInterval(loadMessages, 10000);

    // Nachricht senden
    sendButton.addEventListener('click', async () => {
        const message = messageInput.value.trim();
        if (!message) return;

        try {
            await fetch('/.netlify/functions/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: currentUser.id,
                    userName: currentUser.name,
                    message: message
                })
            });

            messageInput.value = '';
            loadMessages();
        } catch (error) {
            console.error('Fehler beim Senden der Nachricht:', error);
        }
    });

    // Nachrichten laden
    async function loadMessages() {
        try {
            const response = await fetch('/.netlify/functions/api/chat');
            const messages = await response.json();
            
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = '';

            messages.forEach(msg => {
                const messageElement = document.createElement('div');
                messageElement.className = `chat-message ${msg.userId === currentUser.id ? 'sent' : 'received'}`;
                messageElement.innerHTML = `
                    <strong>${msg.userName}</strong>
                    <p>${msg.message}</p>
                    <span class="time">${formatTime(new Date(msg.timestamp))}</span>
                `;
                chatMessages.appendChild(messageElement);
            });

            // Zum neuesten Nachrichten scrollen
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) {
            console.error('Fehler beim Laden der Nachrichten:', error);
        }
    }
}

// Datum formatieren (DD.MM.YYYY)
function formatDate(date) {
    return date.toLocaleDateString('de-DE');
}

// Zeit formatieren (HH:MM)
function formatTime(date) {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}
