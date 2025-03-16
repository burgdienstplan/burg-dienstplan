/**
 * Zentrale Datenverwaltung für den Burg Hochosterwitz Dienstplan
 * Version 2025.1.2
 */
class Database {
    constructor() {
        this.initializeDatabase();
    }

    // Initialisierung der Datenbank
    initializeDatabase() {
        // Prüfe ob Kastellan existiert
        const mitarbeiter = this.getMitarbeiter();
        if (!mitarbeiter.find(m => m.username === 'kastellan')) {
            this.addMitarbeiter({
                id: 'kastellan-2025',
                vorname: 'Kastellan',
                nachname: 'Burg Hochosterwitz',
                username: 'kastellan',
                password: btoa('burg2025'),
                position: 'kastellan',
                role: 'kastellan',
                status: 'aktiv',
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            });
        }
    }

    // Mitarbeiter-Verwaltung
    getMitarbeiter() {
        return JSON.parse(localStorage.getItem('mitarbeiter')) || [];
    }

    addMitarbeiter(mitarbeiter) {
        const mitarbeiterListe = this.getMitarbeiter();
        mitarbeiterListe.push(mitarbeiter);
        localStorage.setItem('mitarbeiter', JSON.stringify(mitarbeiterListe));
    }

    updateMitarbeiter(mitarbeiter) {
        const mitarbeiterListe = this.getMitarbeiter();
        const index = mitarbeiterListe.findIndex(m => m.id === mitarbeiter.id);
        if (index !== -1) {
            mitarbeiterListe[index] = mitarbeiter;
            localStorage.setItem('mitarbeiter', JSON.stringify(mitarbeiterListe));
        }
    }

    // Dienstplan-Verwaltung
    getDienste() {
        return JSON.parse(localStorage.getItem('dienste')) || [];
    }

    addDienst(dienst) {
        const dienste = this.getDienste();
        dienste.push(dienst);
        localStorage.setItem('dienste', JSON.stringify(dienste));
    }

    updateDienst(dienst) {
        const dienste = this.getDienste();
        const index = dienste.findIndex(d => d.id === dienst.id);
        if (index !== -1) {
            dienste[index] = dienst;
            localStorage.setItem('dienste', JSON.stringify(dienste));
        }
    }

    // Urlaub-Verwaltung
    getUrlaube() {
        return JSON.parse(localStorage.getItem('urlaube')) || [];
    }

    addUrlaub(urlaub) {
        const urlaube = this.getUrlaube();
        urlaube.push(urlaub);
        localStorage.setItem('urlaube', JSON.stringify(urlaube));
    }

    updateUrlaub(urlaub) {
        const urlaube = this.getUrlaube();
        const index = urlaube.findIndex(u => u.id === urlaub.id);
        if (index !== -1) {
            urlaube[index] = urlaub;
            localStorage.setItem('urlaube', JSON.stringify(urlaube));
        }
    }

    // Aufzug-Verwaltung
    getAufzugDaten() {
        return JSON.parse(localStorage.getItem('aufzug')) || {
            wartungen: [],
            ersatzteile: [],
            status: 'aktiv'
        };
    }

    updateAufzugDaten(daten) {
        localStorage.setItem('aufzug', JSON.stringify(daten));
    }

    // Hausmeister-Aufgaben
    getAufgaben() {
        return JSON.parse(localStorage.getItem('aufgaben')) || [];
    }

    addAufgabe(aufgabe) {
        const aufgaben = this.getAufgaben();
        aufgaben.push(aufgabe);
        localStorage.setItem('aufgaben', JSON.stringify(aufgaben));
    }

    updateAufgabe(aufgabe) {
        const aufgaben = this.getAufgaben();
        const index = aufgaben.findIndex(a => a.id === aufgabe.id);
        if (index !== -1) {
            aufgaben[index] = aufgabe;
            localStorage.setItem('aufgaben', JSON.stringify(aufgaben));
        }
    }

    // Führungen-Verwaltung
    getFuehrungen() {
        return JSON.parse(localStorage.getItem('fuehrungen')) || [];
    }

    addFuehrung(fuehrung) {
        const fuehrungen = this.getFuehrungen();
        fuehrungen.push(fuehrung);
        localStorage.setItem('fuehrungen', JSON.stringify(fuehrungen));
    }

    updateFuehrung(fuehrung) {
        const fuehrungen = this.getFuehrungen();
        const index = fuehrungen.findIndex(f => f.id === fuehrung.id);
        if (index !== -1) {
            fuehrungen[index] = fuehrung;
            localStorage.setItem('fuehrungen', JSON.stringify(fuehrungen));
        }
    }

    // Authentifizierung
    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser'));
    }

    setCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    logout() {
        localStorage.removeItem('currentUser');
    }

    // Hilfsfunktionen
    generateId() {
        return Date.now().toString();
    }

    getCurrentTimestamp() {
        return new Date().toISOString();
    }
}

// Erstelle eine globale Instanz der Datenbank
const db = new Database();
