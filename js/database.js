/**
 * Zentrale Datenverwaltung für den Burg Hochosterwitz Dienstplan
 * Version 2025.2
 */
class Database {
    constructor() {
        this.initializeDatabase();
    }

    initializeDatabase() {
        // Standard-Benutzer immer neu erstellen
        const defaultMitarbeiter = [
            {
                id: '1',
                username: 'kastellan',
                password: 'burg2025',
                vorname: 'Martin',
                nachname: 'Steindorfer',
                rolle: 'admin',
                aktiv: true
            },
            {
                id: '2',
                username: 'test',
                password: 'test',
                vorname: 'Test',
                nachname: 'Benutzer',
                rolle: 'mitarbeiter',
                aktiv: true
            }
        ];
        localStorage.setItem('mitarbeiter', JSON.stringify(defaultMitarbeiter));

        // Feiertage 2025
        const feiertage2025 = [
            { datum: '2025-01-01', name: 'Neujahr' },
            { datum: '2025-01-06', name: 'Heilige Drei Könige' },
            { datum: '2025-04-21', name: 'Ostermontag' },
            { datum: '2025-05-01', name: 'Staatsfeiertag' },
            { datum: '2025-05-29', name: 'Christi Himmelfahrt' },
            { datum: '2025-06-09', name: 'Pfingstmontag' },
            { datum: '2025-06-19', name: 'Fronleichnam' },
            { datum: '2025-08-15', name: 'Mariä Himmelfahrt' },
            { datum: '2025-10-26', name: 'Nationalfeiertag' }
        ];
        localStorage.setItem('feiertage', JSON.stringify(feiertage2025));

        // Leere Arrays für andere Daten initialisieren
        if (!localStorage.getItem('shifts')) {
            localStorage.setItem('shifts', JSON.stringify([]));
        }
        if (!localStorage.getItem('urlaube')) {
            localStorage.setItem('urlaube', JSON.stringify([]));
        }
    }

    // Basis-Funktionen
    getItem(key) {
        return JSON.parse(localStorage.getItem(key));
    }

    setItem(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    removeItem(key) {
        localStorage.removeItem(key);
    }

    // Mitarbeiter-Funktionen
    getMitarbeiter() {
        return this.getItem('mitarbeiter') || [];
    }

    addMitarbeiter(mitarbeiter) {
        const mitarbeiterListe = this.getMitarbeiter();
        mitarbeiterListe.push(mitarbeiter);
        this.setItem('mitarbeiter', mitarbeiterListe);
    }

    updateMitarbeiter(id, updates) {
        const mitarbeiterListe = this.getMitarbeiter();
        const index = mitarbeiterListe.findIndex(m => m.id === id);
        if (index !== -1) {
            mitarbeiterListe[index] = { ...mitarbeiterListe[index], ...updates };
            this.setItem('mitarbeiter', mitarbeiterListe);
        }
    }

    // Schicht-Funktionen
    getShifts(startDate, endDate) {
        const shifts = this.getItem('shifts') || [];
        if (!startDate) return shifts;

        return shifts.filter(shift => {
            const shiftDate = new Date(shift.datum);
            const start = new Date(startDate);
            const end = endDate ? new Date(endDate) : start;
            return shiftDate >= start && shiftDate <= end;
        });
    }

    addShift(shift) {
        const shifts = this.getShifts();
        shift.id = crypto.randomUUID();
        shifts.push(shift);
        this.setItem('shifts', shifts);
        return shift;
    }

    updateShift(id, updates) {
        const shifts = this.getShifts();
        const index = shifts.findIndex(s => s.id === id);
        if (index !== -1) {
            shifts[index] = { ...shifts[index], ...updates };
            this.setItem('shifts', shifts);
        }
    }

    deleteShift(id) {
        const shifts = this.getShifts();
        const filteredShifts = shifts.filter(s => s.id !== id);
        this.setItem('shifts', filteredShifts);
    }

    // Urlaub-Funktionen
    getUrlaubsanfragen() {
        return this.getItem('urlaube') || [];
    }

    addUrlaubsanfrage(anfrage) {
        const urlaube = this.getUrlaubsanfragen();
        anfrage.id = crypto.randomUUID();
        urlaube.push(anfrage);
        this.setItem('urlaube', urlaube);
        return anfrage;
    }

    updateUrlaubsanfrage(id, status) {
        const urlaube = this.getUrlaubsanfragen();
        const index = urlaube.findIndex(u => u.id === id);
        if (index !== -1) {
            urlaube[index].status = status;
            this.setItem('urlaube', urlaube);
        }
    }

    // Feiertag-Funktionen
    getFeiertage() {
        return this.getItem('feiertage') || [];
    }

    addFeiertag(feiertag) {
        const feiertage = this.getFeiertage();
        feiertage.push(feiertag);
        this.setItem('feiertage', feiertage);
    }

    // Authentifizierung
    login(username, password) {
        const mitarbeiter = this.getMitarbeiter();
        const user = mitarbeiter.find(m => 
            m.username === username && 
            m.password === password && 
            m.aktiv
        );
        
        if (user) {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        return null;
    }
}

// Erstelle eine globale Instanz der Datenbank
const db = new Database();
