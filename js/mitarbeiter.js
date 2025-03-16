// Mitarbeiterverwaltung für Burg Hochosterwitz - Version 2025.2
// Letzte Aktualisierung: 16.03.2025

class MitarbeiterManager {
    constructor() {
        this.loadMitarbeiter();
    }

    // Lade Mitarbeiter aus localStorage
    loadMitarbeiter() {
        this.mitarbeiter = JSON.parse(localStorage.getItem('users')) || [];
    }

    // Speichere Mitarbeiter in localStorage
    saveMitarbeiter() {
        localStorage.setItem('users', JSON.stringify(this.mitarbeiter));
    }

    // Füge neuen Mitarbeiter hinzu
    addMitarbeiter(vorname, nachname, username, password, rolle = 'mitarbeiter') {
        const newMitarbeiter = {
            username,
            password,
            vorname,
            nachname,
            rolle,
            aktiv: true
        };

        this.mitarbeiter.push(newMitarbeiter);
        this.saveMitarbeiter();
        return newMitarbeiter;
    }

    // Aktualisiere Mitarbeiter
    updateMitarbeiter(username, updates) {
        const index = this.mitarbeiter.findIndex(m => m.username === username);
        if (index !== -1) {
            this.mitarbeiter[index] = { ...this.mitarbeiter[index], ...updates };
            this.saveMitarbeiter();
            return true;
        }
        return false;
    }

    // Lösche Mitarbeiter (deaktiviere)
    deleteMitarbeiter(username) {
        const index = this.mitarbeiter.findIndex(m => m.username === username);
        if (index !== -1) {
            this.mitarbeiter[index].aktiv = false;
            this.saveMitarbeiter();
            return true;
        }
        return false;
    }

    // Hole alle aktiven Mitarbeiter
    getAktiveMitarbeiter() {
        return this.mitarbeiter.filter(m => m.aktiv);
    }

    // Hole Mitarbeiter nach Rolle
    getMitarbeiterByRolle(rolle) {
        return this.mitarbeiter.filter(m => m.aktiv && m.rolle === rolle);
    }

    // Prüfe ob Mitarbeiter existiert
    existsMitarbeiter(username) {
        return this.mitarbeiter.some(m => m.username === username);
    }

    // Hole Mitarbeiter nach Username
    getMitarbeiter(username) {
        return this.mitarbeiter.find(m => m.username === username);
    }

    // Validiere Passwort
    validatePassword(username, password) {
        const user = this.getMitarbeiter(username);
        return user && user.password === password;
    }

    // Zeige Benachrichtigung
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = type;
        notification.textContent = message;
        
        const container = document.querySelector('.content');
        container.insertBefore(notification, container.firstChild);
        
        setTimeout(() => notification.remove(), 3000);
    }

    // Lade Mitarbeiterliste
    async loadMitarbeiterListe() {
        const liste = document.getElementById('mitarbeiterListe');
        if (!liste) return;

        liste.innerHTML = '';
        
        this.getAktiveMitarbeiter().forEach(ma => {
            const item = document.createElement('div');
            item.className = 'mitarbeiter-item';
            item.innerHTML = `
                <div>
                    <strong>${ma.vorname} ${ma.nachname}</strong>
                    <span class="positionen">${ma.rolle}</span>
                </div>
                <div>
                    <button onclick="mitarbeiterManager.bearbeiteMitarbeiter('${ma.username}')" 
                            class="edit-btn" title="Bearbeiten">✏️</button>
                    <button onclick="mitarbeiterManager.toggleMitarbeiterStatus('${ma.username}')" 
                            class="status-btn" title="${ma.aktiv ? 'Deaktivieren' : 'Aktivieren'}">
                            ${ma.aktiv ? '🟢' : '🔴'}
                    </button>
                </div>
            `;
            liste.appendChild(item);
        });
    }

    // Bearbeite Mitarbeiter
    async bearbeiteMitarbeiter(username) {
        const mitarbeiter = this.getMitarbeiter(username);
        if (!mitarbeiter) return;

        // Formular mit Mitarbeiterdaten füllen
        document.getElementById('vorname').value = mitarbeiter.vorname;
        document.getElementById('nachname').value = mitarbeiter.nachname;
        
        const rolleSelect = document.getElementById('rolle');
        Array.from(rolleSelect.options).forEach(option => {
            option.selected = mitarbeiter.rolle === option.value;
        });

        // Formular in Bearbeitungsmodus setzen
        const form = document.getElementById('addMitarbeiterForm');
        form.dataset.editId = username;
        document.querySelector('.save-btn').textContent = 'Aktualisieren';
    }

    // Toggle Mitarbeiter Status
    async toggleMitarbeiterStatus(username) {
        try {
            const mitarbeiter = this.getMitarbeiter(username);
            if (!mitarbeiter) return;

            mitarbeiter.aktiv = !mitarbeiter.aktiv;
            this.saveMitarbeiter();
            
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
