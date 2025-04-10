class Urlaub {
    constructor() {
        this.user = JSON.parse(localStorage.getItem('aktuellerBenutzer'));
        this.urlaubsanfragen = JSON.parse(localStorage.getItem('urlaubsanfragen') || '[]');
        this.bindEvents();
        this.loadUrlaub();
    }

    bindEvents() {
        // Neue Urlaubsanfrage Button
        document.getElementById('addUrlaubBtn').addEventListener('click', () => {
            this.showUrlaubDialog();
        });
    }

    loadUrlaub() {
        const liste = document.getElementById('urlaubListe');
        if (!liste) return;

        // Nur eigene Anfragen anzeigen
        const meineAnfragen = this.urlaubsanfragen.filter(a => a.mitarbeiter === this.user.name);
        
        liste.innerHTML = meineAnfragen.map(a => `
            <div class="urlaub-card">
                <div class="card-header">
                    <h3>${this.formatDate(a.von)} - ${this.formatDate(a.bis)}</h3>
                    <span class="status-badge ${a.status}">${this.formatStatus(a.status)}</span>
                </div>
                <div class="card-body">
                    <p><strong>Tage:</strong> ${this.calculateDays(a.von, a.bis)}</p>
                    ${a.status === 'abgelehnt' ? `<p class="ablehnungsgrund">${a.ablehnungsgrund || 'Kein Grund angegeben'}</p>` : ''}
                </div>
                ${a.status === 'offen' ? `
                    <div class="card-actions">
                        <button class="btn-delete" data-id="${a.id}">
                            <i class="fas fa-trash"></i> Löschen
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');

        // Event Listener für Löschen
        liste.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Urlaubsanfrage wirklich löschen?')) {
                    this.deleteUrlaub(btn.dataset.id);
                }
            });
        });
    }

    showUrlaubDialog() {
        const modal = document.getElementById('urlaubModal');
        const form = document.getElementById('urlaubForm');

        // Setze Mindestdatum auf heute
        const heute = new Date().toISOString().split('T')[0];
        form.von.min = heute;
        form.bis.min = heute;

        // Modal anzeigen
        modal.classList.add('active');

        // Form Handler
        const submitHandler = (e) => {
            e.preventDefault();
            
            const urlaubsanfrage = {
                id: Date.now().toString(),
                von: e.target.von.value,
                bis: e.target.bis.value,
                mitarbeiter: this.user.name,
                status: 'offen'
            };

            this.addUrlaub(urlaubsanfrage);

            // Modal schließen
            modal.classList.remove('active');
            form.removeEventListener('submit', submitHandler);
        };

        form.addEventListener('submit', submitHandler);

        // Modal schließen
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
            form.removeEventListener('submit', submitHandler);
        });

        // Validierung für Bis-Datum
        form.von.addEventListener('change', (e) => {
            form.bis.min = e.target.value;
        });
    }

    addUrlaub(urlaubsanfrage) {
        this.urlaubsanfragen.push(urlaubsanfrage);
        this.saveUrlaub();
    }

    deleteUrlaub(id) {
        this.urlaubsanfragen = this.urlaubsanfragen.filter(a => a.id !== id);
        this.saveUrlaub();
    }

    saveUrlaub() {
        localStorage.setItem('urlaubsanfragen', JSON.stringify(this.urlaubsanfragen));
        this.loadUrlaub();
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('de-DE');
    }

    calculateDays(von, bis) {
        const start = new Date(von);
        const end = new Date(bis);
        const diff = Math.abs(end - start);
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    }

    formatStatus(status) {
        switch (status) {
            case 'offen':
                return 'Offen';
            case 'genehmigt':
                return 'Genehmigt';
            case 'abgelehnt':
                return 'Abgelehnt';
            default:
                return status;
        }
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    new Urlaub();
});
