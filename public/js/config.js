// Konfigurationsdatei

const CONFIG = {
    // Benutzerrollen
    ROLLEN: {
        ADMIN: 'admin',
        MITARBEITER: 'mitarbeiter',
        HAUSMEISTER: 'hausmeister'
    },

    // Positionen im Dienstplan
    POSITIONEN: [
        'Shop',
        'Museum',
        'Eintritt',
        'Führungen'
    ],

    // Ruhetage
    RUHETAGE: {
        WOCHENTAGE: [0],     // Standard: Montag ist Ruhetag
        EXTRA: []            // Zusätzliche manuelle Ruhetage (Format: "YYYY-MM-DD")
    },

    // Status für Anfragen
    ANFRAGE_STATUS: {
        OFFEN: 'offen',
        GENEHMIGT: 'genehmigt',
        ABGELEHNT: 'abgelehnt'
    },

    // Standard-Benutzer (für Entwicklung)
    DEFAULT_USERS: [
        {
            id: '1',
            name: 'Admin',
            benutzername: 'admin',
            passwort: 'admin123',
            rolle: 'admin'
        },
        {
            id: '2',
            name: 'Test Mitarbeiter',
            benutzername: 'test',
            passwort: 'test123',
            rolle: 'mitarbeiter'
        }
    ],

    // Lift-Wartungsintervalle
    LIFT_WARTUNG: {
        INTERVALLE: {
            WOECHENTLICH: {
                name: 'Wöchentliche Kontrolle',
                tage: 7
            },
            MONATLICH: {
                name: 'Monatliche Wartung',
                tage: 30
            },
            QUARTALSWEISE: {
                name: 'Quartalsinspektion',
                tage: 90
            },
            JAEHRLICH: {
                name: 'Jahreshauptprüfung',
                tage: 365
            }
        }
    },

    // Wartungstypen
    WARTUNGSTYPEN: [
        'Wöchentliche Kontrolle',
        'Monatliche Wartung',
        'Quartalsinspektion',
        'Jahreshauptprüfung',
        'Störungsbehebung',
        'Sonstiges'
    ],

    // Material-Kategorien
    MATERIAL_KATEGORIEN: [
        'Mechanik',
        'Elektronik',
        'Hydraulik',
        'Sicherheit',
        'Verschleißteile'
    ],

    // Lagerorte
    LAGERORTE: [
        'Lager Kasten K1',
        'Lager Kasten L1',
        'Lager Werkstatt'
    ],

    // Standard-Material mit Mindestbestand
    STANDARD_MATERIAL: [
        {
            name: 'Hydrauliköl',
            kategorie: 'Hydraulik',
            einheit: 'Liter',
            mindestbestand: 20,
            lagerort: 'Lager Werkstatt'
        },
        {
            name: 'Bremsbeläge',
            kategorie: 'Mechanik',
            einheit: 'Paar',
            mindestbestand: 2,
            lagerort: 'Lager Kasten K1'
        },
        {
            name: 'Notlicht-Akkus',
            kategorie: 'Elektronik',
            einheit: 'Stück',
            mindestbestand: 4,
            lagerort: 'Lager Kasten L1'
        },
        {
            name: 'Türsensoren',
            kategorie: 'Sicherheit',
            einheit: 'Stück',
            mindestbestand: 2,
            lagerort: 'Lager Kasten L1'
        },
        {
            name: 'Schmierfett',
            kategorie: 'Verschleißteile',
            einheit: 'Kartusche',
            mindestbestand: 3,
            lagerort: 'Lager Werkstatt'
        }
    ]
};

// API-Konfiguration
const API_URL = '/api';

// Exportiere Konfiguration
window.config = {
    API_URL
};

// Ruhetage-Funktionen
function isRuhetag(date) {
    // Prüfe Standard-Wochentage
    if (CONFIG.RUHETAGE.WOCHENTAGE.includes(date.getDay())) {
        return true;
    }
    
    // Prüfe zusätzliche Ruhetage
    const dateStr = date.toISOString().split('T')[0];
    return CONFIG.RUHETAGE.EXTRA.includes(dateStr);
}

function addRuhetag(dateStr) {
    if (!CONFIG.RUHETAGE.EXTRA.includes(dateStr)) {
        CONFIG.RUHETAGE.EXTRA.push(dateStr);
        localStorage.setItem('ruhetage', JSON.stringify(CONFIG.RUHETAGE.EXTRA));
        return true;
    }
    return false;
}

function removeRuhetag(dateStr) {
    const index = CONFIG.RUHETAGE.EXTRA.indexOf(dateStr);
    if (index > -1) {
        CONFIG.RUHETAGE.EXTRA.splice(index, 1);
        localStorage.setItem('ruhetage', JSON.stringify(CONFIG.RUHETAGE.EXTRA));
        return true;
    }
    return false;
}

// Lade gespeicherte Ruhetage
const savedRuhetage = localStorage.getItem('ruhetage');
if (savedRuhetage) {
    CONFIG.RUHETAGE.EXTRA = JSON.parse(savedRuhetage);
}

// Global verfügbar machen
window.CONFIG = CONFIG;
window.isRuhetag = isRuhetag;
window.addRuhetag = addRuhetag;
window.removeRuhetag = removeRuhetag;
