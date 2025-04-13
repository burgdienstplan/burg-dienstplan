// Demo-Daten für den Dienstplan
function initDemoData() {
    console.log('Initialisiere Demo-Daten...');

    // Admin-Mitarbeiter (Kastellan)
    const admin = {
        id: '1',
        name: 'Kastellan',
        benutzername: 'kastellan',
        passwort: 'burg2025',
        rolle: 'admin'
    };

    // Demo Mitarbeiter
    const mitarbeiter = [
        admin,
        {
            id: '2',
            name: 'Maria Huber',
            benutzername: 'maria.huber',
            passwort: 'burg2025',
            rolle: 'mitarbeiter'
        },
        {
            id: '3',
            name: 'Josef Maier',
            benutzername: 'josef.maier',
            passwort: 'burg2025',
            rolle: 'mitarbeiter'
        },
        {
            id: '4',
            name: 'Anna Müller',
            benutzername: 'anna.mueller',
            passwort: 'burg2025',
            rolle: 'mitarbeiter'
        },
        {
            id: '5',
            name: 'Thomas Weber',
            benutzername: 'thomas.weber',
            passwort: 'burg2025',
            rolle: 'museumsfuehrer'
        },
        {
            id: '6',
            name: 'Sarah Bauer',
            benutzername: 'sarah.bauer',
            passwort: 'burg2025',
            rolle: 'museumsfuehrer'
        }
    ];

    // Demo Dienste für April 2025
    const demoDienste = {
        '2025-04': {
            '2025-04-01': {
                'SHOP_EINTRITT': 'Maria Huber',
                'MUSEUMS_SHOP': 'Josef Maier',
                'EINTRITT_FUEHRUNGEN': 'Thomas Weber'
            },
            '2025-04-02': {
                'SHOP_EINTRITT': 'Anna Müller',
                'MUSEUMS_SHOP': 'Maria Huber',
                'EINTRITT_FUEHRUNGEN': 'Sarah Bauer'
            }
        }
    };

    // Speichere Mitarbeiter
    localStorage.setItem('mitarbeiter', JSON.stringify(mitarbeiter));

    // Speichere Dienste
    localStorage.setItem('dienste', JSON.stringify(demoDienste));

    // Setze Einstellungen falls nicht vorhanden
    if (!localStorage.getItem('einstellungen')) {
        const defaultEinstellungen = {
            ruhetage: [7] // Sonntag
        };
        localStorage.setItem('einstellungen', JSON.stringify(defaultEinstellungen));
        console.log('Standard-Einstellungen gespeichert:', defaultEinstellungen);
    }

    console.log('Demo-Daten initialisiert!');
}

// Initialisiere Demo-Daten beim Laden
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('mitarbeiter')) {
        initDemoData();
    }
});
