// Admin-Dashboard

document.addEventListener('DOMContentLoaded', () => {
    const dashboardStats = document.getElementById('dashboardStats');
    
    function updateDashboard() {
        const dienstAnfragen = JSON.parse(localStorage.getItem('dienstAnfragen') || '[]');
        const urlaubsAnfragen = JSON.parse(localStorage.getItem('urlaubsAnfragen') || '[]');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Statistiken berechnen
        const stats = {
            offeneDienstAnfragen: dienstAnfragen.filter(a => a.status === 'offen').length,
            offeneUrlaubsAnfragen: urlaubsAnfragen.filter(a => a.status === 'offen').length,
            mitarbeiterAnzahl: users.filter(u => u.rolle === 'mitarbeiter').length,
            aktiveDienste: dienstAnfragen.filter(a => 
                a.status === 'genehmigt' && 
                new Date(a.datum) >= new Date()
            ).length
        };
        
        // Dashboard aktualisieren
        dashboardStats.innerHTML = `
            <div class="stat-card">
                <i class="fas fa-clock"></i>
                <h3>Offene Dienst-Anfragen</h3>
                <p>${stats.offeneDienstAnfragen}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-calendar-alt"></i>
                <h3>Offene Urlaubsanträge</h3>
                <p>${stats.offeneUrlaubsAnfragen}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-users"></i>
                <h3>Mitarbeiter</h3>
                <p>${stats.mitarbeiterAnzahl}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-calendar-check"></i>
                <h3>Aktive Dienste</h3>
                <p>${stats.aktiveDienste}</p>
            </div>
        `;
    }

    // Dashboard initial aktualisieren
    updateDashboard();
    
    // Alle 30 Sekunden aktualisieren
    setInterval(updateDashboard, 30000);
});

// Aktualisiert die Tabelle mit aktuellen Anfragen
function updateAktuelleAnfragen() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const dienstAnfragen = JSON.parse(localStorage.getItem('dienstAnfragen') || '[]');
    const urlaubsAnfragen = JSON.parse(localStorage.getItem('urlaubsAnfragen') || '[]');
    
    // Kombiniere und sortiere alle Anfragen
    const alleAnfragen = [
        ...dienstAnfragen.map(a => ({...a, typ: 'Dienst'})),
        ...urlaubsAnfragen.map(a => ({...a, typ: 'Urlaub'}))
    ].sort((a, b) => {
        // Offene Anfragen zuerst
        if (a.status === 'offen' && b.status !== 'offen') return -1;
        if (b.status === 'offen' && a.status !== 'offen') return 1;
        
        // Dann nach Datum
        const dateA = new Date(a.datum || a.von);
        const dateB = new Date(b.datum || b.von);
        return dateA - dateB;
    });

    // Tabelle aktualisieren
    const tbody = document.querySelector('#aktuelleAnfragen tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    alleAnfragen.slice(0, 10).forEach(anfrage => {
        const mitarbeiter = users.find(u => u.id === anfrage.mitarbeiterId);
        if (!mitarbeiter) return;

        const tr = document.createElement('tr');
        
        const datum = anfrage.datum ? 
            new Date(anfrage.datum).toLocaleDateString('de-DE') :
            `${new Date(anfrage.von).toLocaleDateString('de-DE')} - ${new Date(anfrage.bis).toLocaleDateString('de-DE')}`;

        tr.innerHTML = `
            <td>${mitarbeiter.name}</td>
            <td>${anfrage.typ}</td>
            <td>${datum}</td>
            <td><span class="status-badge ${anfrage.status}">${anfrage.status}</span></td>
            <td>
                <div class="action-buttons">
                    ${anfrage.status === 'offen' ? `
                        <button class="btn-icon edit" onclick="genehmigenAnfrage('${anfrage.id}', '${anfrage.typ}')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-icon delete" onclick="ablehnenAnfrage('${anfrage.id}', '${anfrage.typ}')">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// Genehmigt eine Anfrage
function genehmigenAnfrage(id, typ) {
    const key = typ === 'Dienst' ? 'dienstAnfragen' : 'urlaubsAnfragen';
    const anfragen = JSON.parse(localStorage.getItem(key) || '[]');
    
    const index = anfragen.findIndex(a => a.id === id);
    if (index !== -1) {
        anfragen[index].status = 'genehmigt';
        localStorage.setItem(key, JSON.stringify(anfragen));
        updateDashboard();
        updateAktuelleAnfragen();
    }
}

// Lehnt eine Anfrage ab
function ablehnenAnfrage(id, typ) {
    const key = typ === 'Dienst' ? 'dienstAnfragen' : 'urlaubsAnfragen';
    const anfragen = JSON.parse(localStorage.getItem(key) || '[]');
    
    const index = anfragen.findIndex(a => a.id === id);
    if (index !== -1) {
        anfragen[index].status = 'abgelehnt';
        localStorage.setItem(key, JSON.stringify(anfragen));
        updateDashboard();
        updateAktuelleAnfragen();
    }
}
