// Dienst-Anfragen-Funktionalität für Mitarbeiter

document.addEventListener('DOMContentLoaded', () => {
    const dienstAnfrageForm = document.getElementById('dienstAnfrageForm');
    const dienstAnfragenTable = document.getElementById('dienstAnfragenTable');

    // Dienst-Anfragen laden und anzeigen
    function loadDienstAnfragen() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const dienstAnfragen = JSON.parse(localStorage.getItem('dienstAnfragen') || '[]');
        
        // Tabelle leeren
        dienstAnfragenTable.innerHTML = '';
        
        // Anfragen des aktuellen Benutzers filtern und sortieren
        const meineAnfragen = dienstAnfragen
            .filter(anfrage => anfrage.mitarbeiterId === currentUser.id)
            .sort((a, b) => new Date(b.datum) - new Date(a.datum));

        // Anfragen in Tabelle einfügen
        meineAnfragen.forEach(anfrage => {
            const row = document.createElement('tr');
            
            // Formatiere Datum
            const datum = new Date(anfrage.datum).toLocaleDateString('de-DE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });

            row.innerHTML = `
                <td>${datum}</td>
                <td>${anfrage.position}</td>
                <td><span class="status-badge ${anfrage.status}">${anfrage.status}</span></td>
                <td>
                    ${anfrage.status === 'offen' ? `
                        <button class="btn-icon" onclick="deleteDienstAnfrage('${anfrage.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            `;
            
            dienstAnfragenTable.appendChild(row);
        });
    }

    // Neue Dienst-Anfrage erstellen
    dienstAnfrageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const dienstAnfragen = JSON.parse(localStorage.getItem('dienstAnfragen') || '[]');
        
        // Neue Anfrage erstellen
        const newAnfrage = {
            id: Date.now().toString(),
            mitarbeiterId: currentUser.id,
            datum: document.getElementById('dienstDatum').value,
            position: document.getElementById('dienstPosition').value,
            status: 'offen'
        };
        
        // Anfrage speichern
        dienstAnfragen.push(newAnfrage);
        localStorage.setItem('dienstAnfragen', JSON.stringify(dienstAnfragen));
        
        // Modal schließen und Formular zurücksetzen
        closeModal('dienstAnfrageModal');
        dienstAnfrageForm.reset();
        
        // Tabelle aktualisieren
        loadDienstAnfragen();
    });

    // Dienst-Anfrage löschen
    window.deleteDienstAnfrage = function(anfrageId) {
        if (!confirm('Möchten Sie diese Anfrage wirklich löschen?')) {
            return;
        }

        const dienstAnfragen = JSON.parse(localStorage.getItem('dienstAnfragen') || '[]');
        
        // Anfrage entfernen
        const updatedAnfragen = dienstAnfragen.filter(anfrage => anfrage.id !== anfrageId);
        localStorage.setItem('dienstAnfragen', JSON.stringify(updatedAnfragen));
        
        // Tabelle aktualisieren
        loadDienstAnfragen();
    };

    // Initiale Anzeige
    loadDienstAnfragen();
});
