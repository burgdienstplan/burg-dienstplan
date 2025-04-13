// Admin-Mitarbeiter-Verwaltung

document.addEventListener('DOMContentLoaded', () => {
    // DOM-Elemente
    const mitarbeiterForm = document.getElementById('mitarbeiterForm');
    const mitarbeiterTable = document.getElementById('mitarbeiterTable').querySelector('tbody');
    const newMitarbeiterBtn = document.getElementById('newMitarbeiterBtn');

    // Event-Listener für "Neuer Mitarbeiter" Button
    newMitarbeiterBtn.addEventListener('click', () => {
        document.getElementById('mitarbeiterId').value = '';
        document.getElementById('name').value = '';
        document.getElementById('benutzername').value = '';
        document.getElementById('passwort').value = '';
        document.getElementById('rolle').value = 'mitarbeiter';
        openModal('mitarbeiterModal');
    });

    // Mitarbeiter laden und anzeigen
    function loadMitarbeiter() {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        mitarbeiterTable.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.benutzername}</td>
                <td>${user.rolle}</td>
                <td>
                    <button class="btn-icon" onclick="editMitarbeiter('${user.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteMitarbeiter('${user.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            mitarbeiterTable.appendChild(row);
        });

        // Dashboard-Statistik aktualisieren
        const aktiveMitarbeiter = document.getElementById('aktiveMitarbeiter');
        if (aktiveMitarbeiter) {
            aktiveMitarbeiter.textContent = users.filter(u => u.rolle === 'mitarbeiter').length;
        }
    }

    // Mitarbeiter erstellen/bearbeiten
    mitarbeiterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const id = document.getElementById('mitarbeiterId').value;
        
        const mitarbeiter = {
            id: id || Date.now().toString(),
            name: document.getElementById('name').value,
            benutzername: document.getElementById('benutzername').value,
            rolle: document.getElementById('rolle').value
        };

        // Passwort nur aktualisieren wenn eines eingegeben wurde
        const passwort = document.getElementById('passwort').value;
        if (passwort) {
            mitarbeiter.passwort = passwort;
        } else if (!id) {
            // Neuer Mitarbeiter braucht ein Passwort
            alert('Bitte ein Passwort eingeben!');
            return;
        }
        
        if (id) {
            // Bestehenden Mitarbeiter aktualisieren
            const index = users.findIndex(u => u.id === id);
            if (index !== -1) {
                // Bestehendes Passwort beibehalten wenn keines eingegeben wurde
                if (!passwort) {
                    mitarbeiter.passwort = users[index].passwort;
                }
                users[index] = mitarbeiter;
            }
        } else {
            // Prüfen ob Benutzername bereits existiert
            if (users.some(u => u.benutzername === mitarbeiter.benutzername)) {
                alert('Dieser Benutzername existiert bereits!');
                return;
            }
            users.push(mitarbeiter);
        }
        
        // Speichern
        localStorage.setItem('users', JSON.stringify(users));
        
        // Modal schließen und Formular zurücksetzen
        closeModal('mitarbeiterModal');
        mitarbeiterForm.reset();
        
        // Tabelle aktualisieren
        loadMitarbeiter();
    });

    // Mitarbeiter bearbeiten
    window.editMitarbeiter = function(id) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const mitarbeiter = users.find(u => u.id === id);
        
        if (mitarbeiter) {
            document.getElementById('mitarbeiterId').value = mitarbeiter.id;
            document.getElementById('name').value = mitarbeiter.name;
            document.getElementById('benutzername').value = mitarbeiter.benutzername;
            document.getElementById('passwort').value = '';
            document.getElementById('rolle').value = mitarbeiter.rolle;
            
            openModal('mitarbeiterModal');
        }
    };

    // Mitarbeiter löschen
    window.deleteMitarbeiter = function(id) {
        if (!confirm('Möchten Sie diesen Mitarbeiter wirklich löschen?')) {
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.filter(user => user.id !== id);
        
        // Auch alle Dienste und Anfragen des Mitarbeiters löschen
        const dienstAnfragen = JSON.parse(localStorage.getItem('dienstAnfragen') || '[]');
        const updatedDienstAnfragen = dienstAnfragen.filter(a => a.mitarbeiterId !== id);
        
        const urlaubsAnfragen = JSON.parse(localStorage.getItem('urlaubsAnfragen') || '[]');
        const updatedUrlaubsAnfragen = urlaubsAnfragen.filter(a => a.mitarbeiterId !== id);
        
        // Alles speichern
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        localStorage.setItem('dienstAnfragen', JSON.stringify(updatedDienstAnfragen));
        localStorage.setItem('urlaubsAnfragen', JSON.stringify(updatedUrlaubsAnfragen));
        
        // Tabelle aktualisieren
        loadMitarbeiter();
    };

    // Initial laden
    loadMitarbeiter();
});
