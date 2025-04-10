class Chat {
    constructor() {
        this.messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        this.bindEvents();
        this.loadMessages();
    }

    bindEvents() {
        const form = document.getElementById('chatForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendMessage();
            });
        }

        // Automatisches Nachladen alle 30 Sekunden
        setInterval(() => this.loadMessages(), 30000);
    }

    loadMessages() {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        // Lade aktuelle Nachrichten
        this.messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');

        container.innerHTML = this.messages.map(msg => `
            <div class="chat-message ${msg.userId === this.currentUser.id ? 'own-message' : ''} ${msg.type || ''}">
                <div class="message-header">
                    <span class="message-author">${msg.userName}</span>
                    <span class="message-time">${this.formatTime(msg.timestamp)}</span>
                </div>
                <div class="message-content">${this.escapeHtml(msg.text)}</div>
            </div>
        `).join('');

        // Scroll zum Ende
        container.scrollTop = container.scrollHeight;
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        if (!input || !input.value.trim()) return;

        const message = {
            id: Date.now(),
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            text: input.value.trim(),
            timestamp: new Date().toISOString()
        };

        this.addMessage(message);

        // Input leeren
        input.value = '';
    }

    sendSystemMessage(text) {
        const message = {
            id: Date.now(),
            userId: 'system',
            userName: 'System',
            text: text,
            timestamp: new Date().toISOString(),
            type: 'system-message'
        };

        this.addMessage(message);
    }

    addMessage(message) {
        // Nachricht zur Liste hinzufügen
        this.messages.push(message);
        if (this.messages.length > 100) {
            // Behalte nur die letzten 100 Nachrichten
            this.messages = this.messages.slice(-100);
        }

        // Speichern und neu laden
        localStorage.setItem('chatMessages', JSON.stringify(this.messages));
        this.loadMessages();
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    window.chat = new Chat();
});
