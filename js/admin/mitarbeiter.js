class MitarbeiterVerwaltung {
    constructor() {
        this.mitarbeiter = JSON.parse(localStorage.getItem('mitarbeiter') || '[]');
        this.bindEvents();
        this.renderListe();
    }

    bindEvents() {
        // Neuer Mitarbeiter Button
        const addBtn = document.getElementById('addMitarbeiterBtn');
        if (addBtn) {
            addBtn.onclick = () => {
                const modal = document.getElementById('mitarbeiterModal');
                document.getElementById('mitarbeiterForm').reset();
                modal.style.display = 'block';
            };
        }

        // X-Button zum Schließen
        document.querySelectorAll('#mitarbeiterModal .modal-close').forEach(btn => {
            btn.onclick = () => {
                const modal = document.getElementById('mitarbeiterModal');
                document.getElementById('mitarbeiterForm').reset();
                modal.style.display = 'none';
            };
        });

        // Abbrechen-Button im Formular
        const form = document.getElementById('mitarbeiterForm');
        if (form) {
            const cancelBtn = form.querySelector('.btn-secondary');
            if (cancelBtn) {
                cancelBtn.onclick = (e) => {
                    e.preventDefault();
                    const modal = document.getElementById('mitarbeiterModal');
                    form.reset();
                    modal.style.display = 'none';
                };
            }

            // Speichern
            form.onsubmit = (e) => {
                e.preventDefault();
                this.speichern();
            };
        }

        // Wenn man außerhalb des Modals klickt
        window.onclick = (e) => {
            const modal = document.getElementById('mitarbeiterModal');
            if (e.target === modal) {
                document.getElementById('mitarbeiterForm').reset();
                modal.style.display = 'none';
            }
        };
    }

    speichern() {
        const name = document.getElementById('name').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const rolle = document.getElementById('rolle').value;

        if (!name || !username || !password || !rolle) {
            alert('Bitte füllen Sie alle Felder aus.');
            return;
        }

        const mitarbeiter = {
            id: Date.now().toString(),
            name,
            username,
            password,
            rolle
        };

        this.mitarbeiter.push(mitarbeiter);
        localStorage.setItem('mitarbeiter', JSON.stringify(this.mitarbeiter));

        const modal = document.getElementById('mitarbeiterModal');
        document.getElementById('mitarbeiterForm').reset();
        modal.style.display = 'none';

        this.renderListe();
    }

    renderListe() {
        const liste = document.getElementById('mitarbeiterListe');
        if (!liste) return;

        liste.innerHTML = this.mitarbeiter.map(m => `
            <div class="mitarbeiter-card">
                <div class="mitarbeiter-info">
                    <h3>${m.name}</h3>
                    <p><strong>Benutzername:</strong> ${m.username}</p>
                    <p><strong>Rolle:</strong> ${m.rolle}</p>
                </div>
                <div class="mitarbeiter-actions">
                    <button onclick="mitarbeiterVerwaltung.bearbeiten('${m.id}')" class="btn-icon">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="mitarbeiterVerwaltung.loeschen('${m.id}')" class="btn-icon delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    bearbeiten(id) {
        const mitarbeiter = this.mitarbeiter.find(m => m.id === id);
        if (!mitarbeiter) return;

        const modal = document.getElementById('mitarbeiterModal');
        document.getElementById('name').value = mitarbeiter.name;
        document.getElementById('username').value = mitarbeiter.username;
        document.getElementById('password').value = mitarbeiter.password;
        document.getElementById('rolle').value = mitarbeiter.rolle;

        modal.dataset.editId = id;
        modal.style.display = 'block';
    }

    loeschen(id) {
        if (!confirm('Möchten Sie diesen Mitarbeiter wirklich löschen?')) return;

        this.mitarbeiter = this.mitarbeiter.filter(m => m.id !== id);
        localStorage.setItem('mitarbeiter', JSON.stringify(this.mitarbeiter));
        this.renderListe();
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    window.mitarbeiterVerwaltung = new MitarbeiterVerwaltung();
});
