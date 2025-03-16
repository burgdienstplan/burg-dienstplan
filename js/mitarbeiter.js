// Mitarbeiterverwaltung für Burg Hochosterwitz - Version 2025.2
// Letzte Aktualisierung: 16.03.2025

class MitarbeiterManager {
    constructor() {
        this.db = new Database();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('addMitarbeiterForm')?.addEventListener('submit', (e) => this.handleAddMitarbeiter(e));
    }

    async handleAddMitarbeiter(event) {
        event.preventDefault();
        const vorname = document.getElementById('vorname').value;
        const nachname = document.getElementById('nachname').value;
        const positionen = Array.from(document.getElementById('positionen').selectedOptions).map(option => option.value);

        try {
            await this.db.addMitarbeiter({
                id: crypto.randomUUID(),
                vorname,
                nachname,
                positionen,
                aktiv: true,
                urlaubsTage: 25,
                genommenerUrlaub: []
            });

            this.showNotification('Mitarbeiter erfolgreich hinzugefügt', 'success');
            this.loadMitarbeiterListe();
            event.target.reset();
        } catch (error) {
            this.showNotification('Fehler beim Hinzufügen des Mitarbeiters', 'error');
            console.error('Fehler:', error);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = type;
        notification.textContent = message;
        
        const container = document.querySelector('.content');
        container.insertBefore(notification, container.firstChild);
        
        setTimeout(() => notification.remove(), 3000);
    }

    async loadMitarbeiterListe() {
        const mitarbeiter = await this.db.getMitarbeiter();
        const liste = document.getElementById('mitarbeiterListe');
        if (!liste) return;

        liste.innerHTML = '';
        
        mitarbeiter.forEach(ma => {
            const item = document.createElement('div');
            item.className = 'mitarbeiter-item';
            item.innerHTML = `
                <div>
                    <strong>${ma.vorname} ${ma.nachname}</strong>
                    <span class="positionen">${ma.positionen.join(', ')}</span>
                </div>
                <div>
                    <button onclick="mitarbeiterManager.bearbeiteMitarbeiter('${ma.id}')" 
                            class="edit-btn" title="Bearbeiten">✏️</button>
                    <button onclick="mitarbeiterManager.toggleMitarbeiterStatus('${ma.id}')" 
                            class="status-btn" title="${ma.aktiv ? 'Deaktivieren' : 'Aktivieren'}">
                            ${ma.aktiv ? '🟢' : '🔴'}
                    </button>
                </div>
            `;
            liste.appendChild(item);
        });
    }

    async bearbeiteMitarbeiter(id) {
        const mitarbeiter = await this.db.getMitarbeiterById(id);
        if (!mitarbeiter) return;

        // Formular mit Mitarbeiterdaten füllen
        document.getElementById('vorname').value = mitarbeiter.vorname;
        document.getElementById('nachname').value = mitarbeiter.nachname;
        
        const positionenSelect = document.getElementById('positionen');
        Array.from(positionenSelect.options).forEach(option => {
            option.selected = mitarbeiter.positionen.includes(option.value);
        });

        // Formular in Bearbeitungsmodus setzen
        const form = document.getElementById('addMitarbeiterForm');
        form.dataset.editId = id;
        document.querySelector('.save-btn').textContent = 'Aktualisieren';
    }

    async toggleMitarbeiterStatus(id) {
        try {
            const mitarbeiter = await this.db.getMitarbeiterById(id);
            if (!mitarbeiter) return;

            mitarbeiter.aktiv = !mitarbeiter.aktiv;
            await this.db.updateMitarbeiter(mitarbeiter);
            
            this.showNotification(
                `Mitarbeiter ${mitarbeiter.aktiv ? 'aktiviert' : 'deaktiviert'}`,
                'success'
            );
            this.loadMitarbeiterListe();
        } catch (error) {
            this.showNotification('Fehler beim Ändern des Status', 'error');
            console.error('Fehler:', error);
        }
    }
}

// Initialisierung
const mitarbeiterManager = new MitarbeiterManager();
document.addEventListener('DOMContentLoaded', () => mitarbeiterManager.loadMitarbeiterListe());
