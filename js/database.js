/**
 * Zentrale Datenverwaltung für den Burg Hochosterwitz Dienstplan
 * Version 2025.2
 */
class Database {
    constructor() {
        this.initializeDatabase();
    }

    initializeDatabase() {
        if (!localStorage.getItem('dbInitialized')) {
            // Standardwerte setzen
            this.setItem('mitarbeiter', []);
            this.setItem('shifts', {});
            this.setItem('feiertage', this.getDefaultFeiertage2025());
            this.setItem('ruhetage', []);
            this.setItem('urlaubsanfragen', []);
            this.setItem('fuehrungsvorschlaege', []);
            
            // Admin-Account erstellen
            this.addMitarbeiter({
                id: 'admin',
                vorname: 'Kastellan',
                nachname: 'Admin',
                username: 'kastellan',
                password: 'burg2025',
                rolle: 'admin',
                aktiv: true
            });

            localStorage.setItem('dbInitialized', 'true');
            localStorage.setItem('dbVersion', '2025.2');
        }
    }

    // Basis-Funktionen
    setItem(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    getItem(key) {
        return JSON.parse(localStorage.getItem(key));
    }

    // Mitarbeiter-Verwaltung
    async getMitarbeiter() {
        return this.getItem('mitarbeiter') || [];
    }

    async getMitarbeiterById(id) {
        const mitarbeiter = await this.getMitarbeiter();
        return mitarbeiter.find(m => m.id === id);
    }

    async addMitarbeiter(mitarbeiter) {
        const mitarbeiterListe = await this.getMitarbeiter();
        mitarbeiterListe.push(mitarbeiter);
        this.setItem('mitarbeiter', mitarbeiterListe);
    }

    async updateMitarbeiter(mitarbeiter) {
        const mitarbeiterListe = await this.getMitarbeiter();
        const index = mitarbeiterListe.findIndex(m => m.id === mitarbeiter.id);
        if (index !== -1) {
            mitarbeiterListe[index] = mitarbeiter;
            this.setItem('mitarbeiter', mitarbeiterListe);
        }
    }

    // Schicht-Verwaltung
    async getShifts(datum) {
        const shifts = this.getItem('shifts') || {};
        return shifts[datum] || [];
    }

    async addShift(datum, shift) {
        const shifts = this.getItem('shifts') || {};
        if (!shifts[datum]) shifts[datum] = [];
        shifts[datum].push(shift);
        this.setItem('shifts', shifts);
    }

    async updateShift(datum, shiftId, updatedShift) {
        const shifts = this.getItem('shifts') || {};
        if (shifts[datum]) {
            const index = shifts[datum].findIndex(s => s.id === shiftId);
            if (index !== -1) {
                shifts[datum][index] = updatedShift;
                this.setItem('shifts', shifts);
            }
        }
    }

    async deleteShift(datum, shiftId) {
        const shifts = this.getItem('shifts') || {};
        if (shifts[datum]) {
            shifts[datum] = shifts[datum].filter(s => s.id !== shiftId);
            this.setItem('shifts', shifts);
        }
    }

    // Urlaubs-Verwaltung
    async getUrlaubsanfragen() {
        return this.getItem('urlaubsanfragen') || [];
    }

    async addUrlaubsanfrage(anfrage) {
        const anfragen = await this.getUrlaubsanfragen();
        anfragen.push({
            ...anfrage,
            id: crypto.randomUUID(),
            status: 'pending',
            datum: new Date().toISOString()
        });
        this.setItem('urlaubsanfragen', anfragen);
    }

    async updateUrlaubsanfrage(id, status) {
        const anfragen = await this.getUrlaubsanfragen();
        const index = anfragen.findIndex(a => a.id === id);
        if (index !== -1) {
            anfragen[index].status = status;
            this.setItem('urlaubsanfragen', anfragen);
        }
    }

    // Feiertage 2025
    getDefaultFeiertage2025() {
        return [
            { datum: '2025-01-01', name: 'Neujahr' },
            { datum: '2025-01-06', name: 'Heilige Drei Könige' },
            { datum: '2025-04-21', name: 'Ostermontag' },
            { datum: '2025-05-01', name: 'Staatsfeiertag' },
            { datum: '2025-05-29', name: 'Christi Himmelfahrt' },
            { datum: '2025-06-09', name: 'Pfingstmontag' },
            { datum: '2025-06-19', name: 'Fronleichnam' },
            { datum: '2025-08-15', name: 'Mariä Himmelfahrt' },
            { datum: '2025-10-26', name: 'Nationalfeiertag' },
            { datum: '2025-11-01', name: 'Allerheiligen' },
            { datum: '2025-12-08', name: 'Mariä Empfängnis' },
            { datum: '2025-12-25', name: 'Christtag' },
            { datum: '2025-12-26', name: 'Stefanitag' }
        ];
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
