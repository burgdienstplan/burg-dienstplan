// Admin-Anfragen-Verwaltung

document.addEventListener('DOMContentLoaded', () => {
    const anfragenTable = document.getElementById('anfragenTable');
    
    function loadAnfragen() {
        const dienstAnfragen = JSON.parse(localStorage.getItem('dienstAnfragen') || '[]');
        const urlaubsAnfragen = JSON.parse(localStorage.getItem('urlaubsAnfragen') || '[]');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Tabelle leeren
        anfragenTable.innerHTML = '';
        
        // Alle Anfragen zusammenführen und sortieren
        const alleAnfragen = [
            ...dienstAnfragen.map(a => ({...a, typ: 'Dienst'})),
            ...urlaubsAnfragen.map(a => ({...a, typ: 'Urlaub'}))
        ].sort((a, b) => {
            // Offene Anfragen zuerst
            if (a.status === 'offen' && b.status !== 'offen') return -1;
            if (b.status === 'offen' && a.status !== 'offen') return 1;
            
            // Dann nach Datum
            return new Date(b.datum || b.von) - new Date(a.datum || a.von);
        });

        // Anfragen in Tabelle einfügen
        alleAnfragen.forEach(anfrage => {
            const row = document.createElement('tr');
            
            // Mitarbeiter finden
            const mitarbeiter = users.find(u => u.id === anfrage.mitarbeiterId);
            const mitarbeiterName = mitarbeiter ? mitarbeiter.name : 'Unbekannt';
            
            // Datum formatieren
            const datum = anfrage.typ === 'Dienst' 
                ? new Date(anfrage.datum).toLocaleDateString('de-DE')
                : `${new Date(anfrage.von).toLocaleDateString('de-DE')} - ${new Date(anfrage.bis).toLocaleDateString('de-DE')}`;

            row.innerHTML = `
                <td>${mitarbeiterName}</td>
                <td>${anfrage.typ}</td>
                <td>${datum}</td>
                <td>${anfrage.typ === 'Dienst' ? anfrage.position : '-'}</td>
                <td><span class="status-badge ${anfrage.status}">${anfrage.status}</span></td>
                <td>
                    ${anfrage.status === 'offen' ? `
                        <button class="btn-icon" onclick="genehmigenAnfrage('${anfrage.id}', '${anfrage.typ}')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-icon" onclick="ablehnenAnfrage('${anfrage.id}', '${anfrage.typ}')">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </td>
            `;
            
            anfragenTable.appendChild(row);
        });
    }

    // Anfrage genehmigen
    window.genehmigenAnfrage = function(id, typ) {
        const key = typ === 'Dienst' ? 'dienstAnfragen' : 'urlaubsAnfragen';
        const anfragen = JSON.parse(localStorage.getItem(key) || '[]');
        
        const index = anfragen.findIndex(a => a.id === id);
        if (index !== -1) {
            anfragen[index].status = 'genehmigt';
            localStorage.setItem(key, JSON.stringify(anfragen));
            loadAnfragen();
        }
    };

    // Anfrage ablehnen
    window.ablehnenAnfrage = function(id, typ) {
        const key = typ === 'Dienst' ? 'dienstAnfragen' : 'urlaubsAnfragen';
        const anfragen = JSON.parse(localStorage.getItem(key) || '[]');
        
        const index = anfragen.findIndex(a => a.id === id);
        if (index !== -1) {
            anfragen[index].status = 'abgelehnt';
            localStorage.setItem(key, JSON.stringify(anfragen));
            loadAnfragen();
        }
    };

    // Initial laden
    loadAnfragen();
});
