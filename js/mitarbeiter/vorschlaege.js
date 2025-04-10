class Vorschlaege {
    constructor() {
        this.user = JSON.parse(localStorage.getItem('aktuellerBenutzer'));
        this.vorschlaege = JSON.parse(localStorage.getItem('dienstvorschlaege') || '[]');
        this.bindEvents();
        this.loadVorschlaege();
    }

    bindEvents() {
        // Neuer Vorschlag Button
        document.getElementById('addVorschlagBtn').addEventListener('click', () => {
            this.showVorschlagDialog();
        });
    }

    loadVorschlaege() {
        const liste = document.getElementById('vorschlaegeListe');
        if (!liste) return;

        // Nur eigene Vorschläge anzeigen
        const meineVorschlaege = this.vorschlaege.filter(v => v.mitarbeiter === this.user.name);
        
        liste.innerHTML = meineVorschlaege.map(v => `
            <div class="vorschlag-card">
                <div class="card-header">
                    <h3>${this.formatDate(v.datum)}</h3>
                    <span class="status-badge ${v.status}">${this.formatStatus(v.status)}</span>
                </div>
                <div class="card-body">
                    <p><strong>Position:</strong> ${this.formatPosition(v.position)}</p>
                    ${v.status === 'abgelehnt' ? `<p class="ablehnungsgrund">${v.ablehnungsgrund || 'Kein Grund angegeben'}</p>` : ''}
                </div>
                ${v.status === 'offen' ? `
                    <div class="card-actions">
                        <button class="btn-delete" data-id="${v.id}">
                            <i class="fas fa-trash"></i> Löschen
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');

        // Event Listener für Löschen
        liste.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Vorschlag wirklich löschen?')) {
                    this.deleteVorschlag(btn.dataset.id);
                }
            });
        });
    }

    showVorschlagDialog() {
        const modal = document.getElementById('vorschlagModal');
        const form = document.getElementById('vorschlagForm');

        // Modal anzeigen
        modal.classList.add('active');

        // Form Handler
        const submitHandler = (e) => {
            e.preventDefault();
            
            const vorschlag = {
                id: Date.now().toString(),
                datum: e.target.datum.value,
                position: e.target.position.value,
                mitarbeiter: this.user.name,
                status: 'offen'
            };

            this.addVorschlag(vorschlag);

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
    }

    addVorschlag(vorschlag) {
        this.vorschlaege.push(vorschlag);
        this.saveVorschlaege();
    }

    deleteVorschlag(id) {
        this.vorschlaege = this.vorschlaege.filter(v => v.id !== id);
        this.saveVorschlaege();
    }

    saveVorschlaege() {
        localStorage.setItem('dienstvorschlaege', JSON.stringify(this.vorschlaege));
        this.loadVorschlaege();
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('de-DE');
    }

    formatPosition(position) {
        switch (position) {
            case CONFIG.POSITIONEN.SHOP_EINTRITT:
                return 'Shop Eintritt';
            case CONFIG.POSITIONEN.MUSEUMS_SHOP:
                return 'Museums Shop';
            case CONFIG.POSITIONEN.EINTRITT_FUEHRUNGEN:
                return 'Eintritt Führungen';
            default:
                return position;
        }
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
    new Vorschlaege();
});
