// Urlaubsanträge-Funktionalität für Mitarbeiter

document.addEventListener('DOMContentLoaded', () => {
    const urlaubsantragForm = document.getElementById('urlaubsantragForm');
    const urlaubsantraegeTable = document.getElementById('urlaubsantraegeTable');

    // Urlaubsanträge laden und anzeigen
    function loadUrlaubsantraege() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const urlaubsantraege = JSON.parse(localStorage.getItem('urlaubsAnfragen') || '[]');
        
        // Tabelle leeren
        urlaubsantraegeTable.innerHTML = '';
        
        // Anträge des aktuellen Benutzers filtern und sortieren
        const meineAntraege = urlaubsantraege
            .filter(antrag => antrag.mitarbeiterId === currentUser.id)
            .sort((a, b) => new Date(b.von) - new Date(a.von));

        // Anträge in Tabelle einfügen
        meineAntraege.forEach(antrag => {
            const row = document.createElement('tr');
            
            // Formatiere Datum
            const von = new Date(antrag.von).toLocaleDateString('de-DE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const bis = new Date(antrag.bis).toLocaleDateString('de-DE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });

            // Berechne Anzahl der Tage
            const tage = Math.ceil(
                (new Date(antrag.bis) - new Date(antrag.von)) / (1000 * 60 * 60 * 24)
            ) + 1;

            row.innerHTML = `
                <td>${von}</td>
                <td>${bis}</td>
                <td>${tage}</td>
                <td><span class="status-badge ${antrag.status}">${antrag.status}</span></td>
                <td>
                    ${antrag.status === 'offen' ? `
                        <button class="btn-icon" onclick="deleteUrlaubsantrag('${antrag.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            `;
            
            urlaubsantraegeTable.appendChild(row);
        });
    }

    // Neuen Urlaubsantrag erstellen
    urlaubsantragForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const urlaubsantraege = JSON.parse(localStorage.getItem('urlaubsAnfragen') || '[]');
        
        const vonDate = new Date(document.getElementById('urlaubVon').value);
        const bisDate = new Date(document.getElementById('urlaubBis').value);

        // Validierung
        if (vonDate > bisDate) {
            alert('Das Enddatum muss nach dem Startdatum liegen.');
            return;
        }

        // Neuen Antrag erstellen
        const newAntrag = {
            id: Date.now().toString(),
            mitarbeiterId: currentUser.id,
            von: document.getElementById('urlaubVon').value,
            bis: document.getElementById('urlaubBis').value,
            status: 'offen'
        };
        
        // Antrag speichern
        urlaubsantraege.push(newAntrag);
        localStorage.setItem('urlaubsAnfragen', JSON.stringify(urlaubsantraege));
        
        // Modal schließen und Formular zurücksetzen
        closeModal('urlaubsantragModal');
        urlaubsantragForm.reset();
        
        // Tabelle aktualisieren
        loadUrlaubsantraege();
    });

    // Urlaubsantrag löschen
    window.deleteUrlaubsantrag = function(antragId) {
        if (!confirm('Möchten Sie diesen Urlaubsantrag wirklich löschen?')) {
            return;
        }

        const urlaubsantraege = JSON.parse(localStorage.getItem('urlaubsAnfragen') || '[]');
        
        // Antrag entfernen
        const updatedAntraege = urlaubsantraege.filter(antrag => antrag.id !== antragId);
        localStorage.setItem('urlaubsAnfragen', JSON.stringify(updatedAntraege));
        
        // Tabelle aktualisieren
        loadUrlaubsantraege();
    };

    // Initiale Anzeige
    loadUrlaubsantraege();
});
