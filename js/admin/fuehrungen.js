class Fuehrungen {
    constructor() {
        this.fuehrungen = JSON.parse(localStorage.getItem('fuehrungen') || '[]');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        this.bindEvents();
        this.loadFuehrungen();
    }

    bindEvents() {
        // Neue Führung Button (nur für Admin)
        const addBtn = document.getElementById('addFuehrungBtn');
        if (addBtn) {
            if (this.currentUser.rolle === CONFIG.ROLLEN.ADMIN) {
                addBtn.style.display = 'block';
                addBtn.onclick = () => this.showFuehrungDialog();
            } else {
                addBtn.style.display = 'none';
            }
        }

        // Modal schließen
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.onclick = () => {
                document.getElementById('fuehrungModal').style.display = 'none';
                document.getElementById('fuehrungForm').reset();
            };
        });

        // Abbrechen-Button im Formular
        document.getElementById('fuehrungForm').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-secondary')) {
                e.preventDefault();
                document.getElementById('fuehrungModal').style.display = 'none';
                document.getElementById('fuehrungForm').reset();
            }
        });

        // Wenn man außerhalb des Modals klickt
        window.onclick = (e) => {
            const modal = document.getElementById('fuehrungModal');
            if (e.target === modal) {
                document.getElementById('fuehrungForm').reset();
                modal.style.display = 'none';
            }
        };

        // Führung Form Submit
        document.getElementById('fuehrungForm').onsubmit = (e) => {
            e.preventDefault();
            
            const gruppenname = document.getElementById('gruppenname').value;
            const datum = document.getElementById('datum').value;
            const uhrzeit = document.getElementById('uhrzeit').value;
            const personenanzahl = document.getElementById('personenanzahl').value;
            const sprache = document.getElementById('sprache').value;

            if (!gruppenname || !datum || !uhrzeit || !personenanzahl || !sprache) {
                alert('Bitte füllen Sie alle Felder aus.');
                return;
            }

            // Neue Führung
            const fuehrung = {
                id: Date.now().toString(),
                gruppenname,
                datum,
                uhrzeit,
                personenanzahl: parseInt(personenanzahl),
                sprache,
                status: 'offen'
            };

            this.fuehrungen.push(fuehrung);
            localStorage.setItem('fuehrungen', JSON.stringify(this.fuehrungen));
            
            // Schließe Modal und lade Liste neu
            document.getElementById('fuehrungModal').style.display = 'none';
            document.getElementById('fuehrungForm').reset();
            this.loadFuehrungen();

            // Sende Chat-Nachricht
            const chat = window.chat;
            if (chat) {
                chat.sendSystemMessage(`Neue Führung am ${this.formatDate(fuehrung.datum)} um ${fuehrung.uhrzeit} Uhr für ${fuehrung.personenanzahl} Personen (${fuehrung.sprache})`);
            }
        };
    }

    loadFuehrungen() {
        const liste = document.getElementById('fuehrungenListe');
        if (!liste) return;

        // Sortiere nach Datum
        this.fuehrungen.sort((a, b) => new Date(a.datum) - new Date(b.datum));

        liste.innerHTML = this.fuehrungen.map(f => `
            <div class="fuehrung-card ${f.status || 'offen'}">
                <div class="fuehrung-header">
                    <h3>${f.gruppenname}</h3>
                    <span class="status-badge ${f.status || 'offen'}">${this.formatStatus(f.status)}</span>
                </div>
                <div class="fuehrung-body">
                    <p><i class="fas fa-calendar"></i> ${this.formatDate(f.datum)}</p>
                    <p><i class="fas fa-clock"></i> ${f.uhrzeit} Uhr</p>
                    <p><i class="fas fa-users"></i> ${f.personenanzahl} Personen</p>
                    <p><i class="fas fa-language"></i> ${f.sprache}</p>
                    ${f.fuehrer ? `<p><i class="fas fa-user"></i> ${f.fuehrer}</p>` : ''}
                </div>
                ${this.getActionButtons(f)}
            </div>
        `).join('');
    }

    getActionButtons(fuehrung) {
        // Nur Museumsführer und Admin können Führungen übernehmen
        if (this.currentUser.rolle === CONFIG.ROLLEN.MUSEUMSFUEHRER || 
            this.currentUser.rolle === CONFIG.ROLLEN.ADMIN) {
            if (!fuehrung.fuehrer) {
                return `
                    <div class="fuehrung-actions">
                        <button class="btn-primary" onclick="fuehrungen.assignFuehrer('${fuehrung.id}')">
                            <i class="fas fa-user-plus"></i> Führung übernehmen
                        </button>
                    </div>`;
            }
        }
        return '';
    }

    showFuehrungDialog() {
        const modal = document.getElementById('fuehrungModal');
        if (!modal) return;

        // Setze Mindestdatum auf heute
        const datumInput = document.getElementById('datum');
        const heute = new Date().toISOString().split('T')[0];
        datumInput.min = heute;
        
        modal.style.display = 'block';
    }

    assignFuehrer(fuehrungId) {
        const fuehrung = this.fuehrungen.find(f => f.id === fuehrungId);
        if (!fuehrung) return;

        fuehrung.fuehrer = this.currentUser.name;
        fuehrung.status = 'zugewiesen';
        localStorage.setItem('fuehrungen', JSON.stringify(this.fuehrungen));
        this.loadFuehrungen();

        // Sende Chat-Nachricht
        const chat = window.chat;
        if (chat) {
            chat.sendSystemMessage(`${this.currentUser.name} hat die Führung am ${this.formatDate(fuehrung.datum)} um ${fuehrung.uhrzeit} Uhr übernommen`);
        }
    }

    formatDate(dateStr) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('de-DE', options);
    }

    formatStatus(status) {
        switch(status) {
            case 'zugewiesen': return 'Zugewiesen';
            case 'abgeschlossen': return 'Abgeschlossen';
            default: return 'Offen';
        }
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    window.fuehrungen = new Fuehrungen();
});
