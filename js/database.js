/**
 * Zentrale Datenverwaltung für den Burg Hochosterwitz Dienstplan
 * Version 2025.2
 */
class Database {
    constructor() {
        this.initializeDatabase();
    }

    async initializeDatabase() {
        // Initialisiere Standarddaten, falls nicht vorhanden
        if (!localStorage.getItem('mitarbeiter')) {
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
        }

        // Initialisiere Feiertage 2025
        if (!localStorage.getItem('feiertage')) {
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
        }
    }

    // Basis-Funktionen
    async getItem(key) {
        return JSON.parse(localStorage.getItem(key));
    }

    async setItem(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    async removeItem(key) {
        localStorage.removeItem(key);
    }

    // Mitarbeiter-Funktionen
    async getMitarbeiter() {
        return this.getItem('mitarbeiter') || [];
    }

    async addMitarbeiter(mitarbeiter) {
        const mitarbeiterListe = await this.getMitarbeiter();
        mitarbeiterListe.push(mitarbeiter);
        await this.setItem('mitarbeiter', mitarbeiterListe);
    }

    async updateMitarbeiter(id, updates) {
        const mitarbeiterListe = await this.getMitarbeiter();
        const index = mitarbeiterListe.findIndex(m => m.id === id);
        if (index !== -1) {
            mitarbeiterListe[index] = { ...mitarbeiterListe[index], ...updates };
            await this.setItem('mitarbeiter', mitarbeiterListe);
        }
    }

    // Schicht-Funktionen
    async getShifts(startDate, endDate) {
        const shifts = await this.getItem('shifts') || [];
        if (!startDate) return shifts;

        return shifts.filter(shift => {
            const shiftDate = new Date(shift.datum);
            const start = new Date(startDate);
            const end = endDate ? new Date(endDate) : start;
            return shiftDate >= start && shiftDate <= end;
        });
    }

    async addShift(shift) {
        const shifts = await this.getShifts();
        shift.id = crypto.randomUUID();
        shifts.push(shift);
        await this.setItem('shifts', shifts);
        return shift;
    }

    async updateShift(id, updates) {
        const shifts = await this.getShifts();
        const index = shifts.findIndex(s => s.id === id);
        if (index !== -1) {
            shifts[index] = { ...shifts[index], ...updates };
            await this.setItem('shifts', shifts);
        }
    }

    async deleteShift(id) {
        const shifts = await this.getShifts();
        const filteredShifts = shifts.filter(s => s.id !== id);
        await this.setItem('shifts', filteredShifts);
    }

    // Urlaub-Funktionen
    async getUrlaubsanfragen() {
        return this.getItem('urlaube') || [];
    }

    async addUrlaubsanfrage(anfrage) {
        const urlaube = await this.getUrlaubsanfragen();
        anfrage.id = crypto.randomUUID();
        urlaube.push(anfrage);
        await this.setItem('urlaube', urlaube);
        return anfrage;
    }

    async updateUrlaubsanfrage(id, status) {
        const urlaube = await this.getUrlaubsanfragen();
        const index = urlaube.findIndex(u => u.id === id);
        if (index !== -1) {
            urlaube[index].status = status;
            await this.setItem('urlaube', urlaube);
        }
    }

    // Feiertag-Funktionen
    async getFeiertage() {
        return this.getItem('feiertage') || [];
    }

    async addFeiertag(feiertag) {
        const feiertage = await this.getFeiertage();
        feiertage.push(feiertag);
        await this.setItem('feiertage', feiertage);
    }

    // Authentifizierung
    async login(username, password) {
        const mitarbeiter = await this.getMitarbeiter();
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
