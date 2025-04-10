const CONFIG = {
    // Benutzerrollen
    ROLLEN: {
        ADMIN: 'admin',
        MITARBEITER: 'mitarbeiter',
        MUSEUMSFUEHRER: 'museumsfuehrer'
    },

    // Arbeitspositionen
    POSITIONEN: {
        SHOP_EINTRITT: 'Shop Eintritt',
        MUSEUMS_SHOP: 'Museums Shop',
        EINTRITT_FUEHRUNGEN: 'Eintritt Führungen'
    },

    // Farben für die Positionen
    POSITIONS_COLORS: {
        'Shop Eintritt': '#4CAF50',      // Grün
        'Museums Shop': '#2196F3',       // Blau
        'Eintritt Führungen': '#FF9800'  // Orange
    },

    // Österreichische Feiertage 2025
    FEIERTAGE: [
        { datum: '2025-01-01', name: 'Neujahr' },
        { datum: '2025-01-06', name: 'Heilige Drei Könige' },
        { datum: '2025-04-20', name: 'Ostersonntag' },
        { datum: '2025-04-21', name: 'Ostermontag' },
        { datum: '2025-05-01', name: 'Staatsfeiertag' },
        { datum: '2025-05-29', name: 'Christi Himmelfahrt' },
        { datum: '2025-06-08', name: 'Pfingstsonntag' },
        { datum: '2025-06-09', name: 'Pfingstmontag' },
        { datum: '2025-06-19', name: 'Fronleichnam' },
        { datum: '2025-08-15', name: 'Mariä Himmelfahrt' },
        { datum: '2025-10-26', name: 'Nationalfeiertag' },
        { datum: '2025-11-01', name: 'Allerheiligen' },
        { datum: '2025-12-08', name: 'Mariä Empfängnis' },
        { datum: '2025-12-25', name: 'Christtag' },
        { datum: '2025-12-26', name: 'Stefanitag' }
    ],

    // Saison
    SAISON: {
        START: '2025-04-01',
        ENDE: '2025-11-01'
    }
};
