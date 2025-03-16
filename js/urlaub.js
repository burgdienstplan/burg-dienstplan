// Burg Hochosterwitz Urlaubsverwaltung - Version 2025.2
// Letzte Aktualisierung: 16.03.2025

class UrlaubManager {
    constructor() {
        this.db = new Database();
        this.initializeEventListeners();
        this.loadUrlaubsanfragen();
    }

    initializeEventListeners() {
        document.getElementById('urlaubsanfrageForm')?.addEventListener('submit', (e) => this.handleUrlaubsanfrage(e));
    }

    async handleUrlaubsanfrage(event) {
        event.preventDefault();
        const startDatum = document.getElementById('urlaubStart').value;
        const endDatum = document.getElementById('urlaubEnde').value;

        if (!this.validateUrlaubsDaten(startDatum, endDatum)) return;

        try {
            const currentUser = await this.db.getItem('currentUser');
            if (!currentUser) {
                this.showNotification('Bitte melden Sie sich an', 'error');
                return;
            }

            await this.db.addUrlaubsanfrage({
                mitarbeiterId: currentUser.id,
                mitarbeiterName: `${currentUser.vorname} ${currentUser.nachname}`,
                startDatum,
                endDatum,
                status: 'pending'
            });

            this.showNotification('Urlaubsanfrage erfolgreich eingereicht', 'success');
            event.target.reset();
            this.loadUrlaubsanfragen();
        } catch (error) {
            this.showNotification('Fehler beim Einreichen der Urlaubsanfrage', 'error');
            console.error('Fehler:', error);
        }
    }

    validateUrlaubsDaten(start, end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const today = new Date();

        if (startDate < today) {
            this.showNotification('Das Startdatum muss in der Zukunft liegen', 'error');
            return false;
        }

        if (endDate < startDate) {
            this.showNotification('Das Enddatum muss nach dem Startdatum liegen', 'error');
            return false;
        }

        // Prüfe ob der Urlaub in der Saison liegt
        const saisonStart = new Date(2025, 3, 1); // 1. April
        const saisonEnde = new Date(2025, 10, 1); // 1. November

        if (startDate < saisonStart || endDate > saisonEnde) {
            this.showNotification('Urlaub muss innerhalb der Saison (1. April - 1. November) liegen', 'error');
            return false;
        }

        return true;
    }

    async loadUrlaubsanfragen() {
        const currentUser = await this.db.getItem('currentUser');
        const anfragen = await this.db.getUrlaubsanfragen();
        const liste = document.getElementById('urlaubsanfragenListe');
        
        if (!liste) return;
        liste.innerHTML = '';

        // Filtere nach Rolle
        const relevantAnfragen = currentUser.rolle === 'admin' 
            ? anfragen 
            : anfragen.filter(a => a.mitarbeiterId === currentUser.id);

        relevantAnfragen.forEach(anfrage => {
            const item = document.createElement('div');
            item.className = `urlaub-item ${anfrage.status}`;
            
            const startDatum = new Date(anfrage.startDatum).toLocaleDateString('de-DE');
            const endDatum = new Date(anfrage.endDatum).toLocaleDateString('de-DE');
            
            item.innerHTML = `
                <div class="urlaub-info">
                    <strong>${anfrage.mitarbeiterName}</strong>
                    <span>${startDatum} - ${endDatum}</span>
                    <span class="status-badge ${anfrage.status}">${this.getStatusText(anfrage.status)}</span>
                </div>
                ${currentUser.rolle === 'admin' && anfrage.status === 'pending' ? `
                    <div class="urlaub-actions">
                        <button onclick="urlaubManager.handleUrlaubsanfrage('${anfrage.id}', 'approved')" 
                                class="approve-btn">✓</button>
                        <button onclick="urlaubManager.handleUrlaubsanfrage('${anfrage.id}', 'rejected')" 
                                class="reject-btn">✗</button>
                    </div>
                ` : ''}
            `;
            
            liste.appendChild(item);
        });
    }

    getStatusText(status) {
        const statusTexte = {
            'pending': 'Ausstehend',
            'approved': 'Genehmigt',
            'rejected': 'Abgelehnt'
        };
        return statusTexte[status] || status;
    }

    async handleUrlaubsanfrage(id, newStatus) {
        try {
            await this.db.updateUrlaubsanfrage(id, newStatus);
            this.showNotification(
                `Urlaubsanfrage ${this.getStatusText(newStatus).toLowerCase()}`,
                'success'
            );
            this.loadUrlaubsanfragen();
        } catch (error) {
            this.showNotification('Fehler bei der Bearbeitung der Urlaubsanfrage', 'error');
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
}

// Initialisierung
const urlaubManager = new UrlaubManager();
