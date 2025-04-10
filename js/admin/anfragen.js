class Anfragen {
    constructor() {
        this.loadAnfragen();
    }

    loadAnfragen() {
        this.loadUrlaubsanfragen();
        this.loadDienstvorschlaege();
    }

    loadDienstvorschlaege() {
        const liste = document.getElementById('dienstvorschlaegeListe');
        if (!liste) return;

        const vorschlaege = JSON.parse(localStorage.getItem('dienstvorschlaege') || '[]')
            .filter(v => v.status === 'offen');

        liste.innerHTML = vorschlaege.length ? vorschlaege.map(v => `
            <div class="anfrage-card">
                <div class="anfrage-header">
                    <h3>Dienstvorschlag</h3>
                    <span class="datum">${this.formatDate(v.datum)}</span>
                </div>
                <div class="anfrage-body">
                    <p><strong>Von:</strong> ${v.mitarbeiter}</p>
                    <p><strong>Position:</strong> ${v.position}</p>
                </div>
                <div class="anfrage-actions">
                    <button class="btn-approve" data-id="${v.id}">
                        <i class="fas fa-check"></i> Genehmigen
                    </button>
                    <button class="btn-reject" data-id="${v.id}">
                        <i class="fas fa-times"></i> Ablehnen
                    </button>
                </div>
            </div>
        `).join('') : '<div class="keine-anfragen">Keine offenen Dienstvorschläge</div>';

        // Event Listener für Aktionen
        liste.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', () => this.handleDienstvorschlag(btn.dataset.id, 'genehmigt'));
        });

        liste.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', () => this.handleDienstvorschlag(btn.dataset.id, 'abgelehnt'));
        });
    }

    loadUrlaubsanfragen() {
        const liste = document.getElementById('urlaubsanfragenListe');
        if (!liste) return;

        const anfragen = JSON.parse(localStorage.getItem('urlaubsanfragen') || '[]')
            .filter(a => a.status === 'offen');

        liste.innerHTML = anfragen.length ? anfragen.map(a => `
            <div class="anfrage-card">
                <div class="anfrage-header">
                    <h3>Urlaubsanfrage</h3>
                    <span class="datum">${this.formatDate(a.von)} - ${this.formatDate(a.bis)}</span>
                </div>
                <div class="anfrage-body">
                    <p><strong>Von:</strong> ${a.mitarbeiter}</p>
                    <p><strong>Tage:</strong> ${this.calculateDays(a.von, a.bis)}</p>
                </div>
                <div class="anfrage-actions">
                    <button class="btn-approve" data-id="${a.id}">
                        <i class="fas fa-check"></i> Genehmigen
                    </button>
                    <button class="btn-reject" data-id="${a.id}">
                        <i class="fas fa-times"></i> Ablehnen
                    </button>
                </div>
            </div>
        `).join('') : '<div class="keine-anfragen">Keine offenen Urlaubsanfragen</div>';

        // Event Listener für Aktionen
        liste.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', () => this.handleUrlaubsanfrage(btn.dataset.id, 'genehmigt'));
        });

        liste.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', () => this.handleUrlaubsanfrage(btn.dataset.id, 'abgelehnt'));
        });
    }

    handleDienstvorschlag(id, status) {
        const vorschlaege = JSON.parse(localStorage.getItem('dienstvorschlaege') || '[]');
        const index = vorschlaege.findIndex(v => v.id === id);
        
        if (index !== -1) {
            vorschlaege[index].status = status;
            
            if (status === 'genehmigt') {
                // Füge zum Dienstplan hinzu
                const vorschlag = vorschlaege[index];
                const monthKey = vorschlag.datum.substring(0, 7);
                const dienste = JSON.parse(localStorage.getItem('dienste') || '{}');
                
                dienste[monthKey] = dienste[monthKey] || {};
                dienste[monthKey][vorschlag.datum] = dienste[monthKey][vorschlag.datum] || {};
                dienste[monthKey][vorschlag.datum][vorschlag.position] = vorschlag.mitarbeiter;
                
                localStorage.setItem('dienste', JSON.stringify(dienste));
            }
            
            localStorage.setItem('dienstvorschlaege', JSON.stringify(vorschlaege));
            this.loadDienstvorschlaege();
        }
    }

    handleUrlaubsanfrage(id, status) {
        const anfragen = JSON.parse(localStorage.getItem('urlaubsanfragen') || '[]');
        const index = anfragen.findIndex(a => a.id === id);
        
        if (index !== -1) {
            anfragen[index].status = status;
            localStorage.setItem('urlaubsanfragen', JSON.stringify(anfragen));
            this.loadUrlaubsanfragen();
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('de-DE');
    }

    calculateDays(von, bis) {
        const start = new Date(von);
        const end = new Date(bis);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return days + (days === 1 ? ' Tag' : ' Tage');
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    new Anfragen();
});
