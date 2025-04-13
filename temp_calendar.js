// Kalender für Admin-Bereich
class AdminKalender {
    constructor() {
        this.heute = new Date();
        this.aktuellerMonat = new Date();
        this.mitarbeiter = [];
        this.dienste = [];
        this.feiertage = [];
        
        // DOM-Elemente
        this.kalenderContainer = document.getElementById('kalender');
        this.monatsAnzeige = document.getElementById('aktuellerMonat');
        this.vorMonatBtn = document.getElementById('vorMonat');
        this.nachMonatBtn = document.getElementById('nachMonat');
        
        // Event Listener
        this.vorMonatBtn.addEventListener('click', () => this.monatsWechsel(-1));
        this.nachMonatBtn.addEventListener('click', () => this.monatsWechsel(1));
        
        // Initialisierung
        this.initFeiertage();
        this.loadMitarbeiter();
        this.render();
    }
    
    // Österreichische Feiertage initialisieren
    async initFeiertage() {
        const year = this.aktuellerMonat.getFullYear();
        const feiertageDaten = {
            "Neujahr": `${year}-01-01`,
            "Heilige Drei Könige": `${year}-01-06`,
            "Staatsfeiertag": `${year}-05-01`,
            "Mariä Himmelfahrt": `${year}-08-15`,
            "Nationalfeiertag": `${year}-10-26`,
            "Allerheiligen": `${year}-11-01`,
            "Mariä Empfängnis": `${year}-12-08`,
            "Christtag": `${year}-12-25`,
            "Stefanitag": `${year}-12-26`
        };
        
        // Bewegliche Feiertage berechnen
        const ostern = this.berechneOstern(year);
        const ostermontag = new Date(ostern);
        ostermontag.setDate(ostern.getDate() + 1);
        
        const christiHimmelfahrt = new Date(ostern);
        christiHimmelfahrt.setDate(ostern.getDate() + 39);
        
        const pfingstmontag = new Date(ostern);
        pfingstmontag.setDate(ostern.getDate() + 50);
        
        const fronleichnam = new Date(ostern);
        fronleichnam.setDate(ostern.getDate() + 60);
        
        // Bewegliche Feiertage hinzufügen
        feiertageDaten["Ostermontag"] = this.formatDate(ostermontag);
        feiertageDaten["Christi Himmelfahrt"] = this.formatDate(christiHimmelfahrt);
        feiertageDaten["Pfingstmontag"] = this.formatDate(pfingstmontag);
        feiertageDaten["Fronleichnam"] = this.formatDate(fronleichnam);
        
        this.feiertage = feiertageDaten;
    }
    
    // Mitarbeiter laden
    async loadMitarbeiter() {
        try {
            const response = await fetch('/.netlify/functions/api/mitarbeiter');
            this.mitarbeiter = await response.json();
        } catch (error) {
            console.error('Fehler beim Laden der Mitarbeiter:', error);
        }
    }
    
    // Dienste für aktuellen Monat laden
    async loadDienste() {
        const ersterTag = new Date(this.aktuellerMonat.getFullYear(), this.aktuellerMonat.getMonth(), 1);
        const letzterTag = new Date(this.aktuellerMonat.getFullYear(), this.aktuellerMonat.getMonth() + 1, 0);
        
        try {
            const response = await fetch(`/.netlify/functions/api/dienste?start=${this.formatDate(ersterTag)}&end=${this.formatDate(letzterTag)}`);
            this.dienste = await response.json();
        } catch (error) {
            console.error('Fehler beim Laden der Dienste:', error);
        }
    }
    
    // Kalender rendern
    async render() {
        await this.loadDienste();
        
        // Monat und Jahr anzeigen
        this.monatsAnzeige.textContent = this.aktuellerMonat.toLocaleDateString('de-AT', { 
            month: 'long', 
            year: 'numeric' 
        });
        
        // Kalender-Grid erstellen
        const kalenderGrid = document.createElement('div');
        kalenderGrid.className = 'kalender-grid';
        
        // Wochentage
        const wochentage = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
        wochentage.forEach(tag => {
            const wochentagElement = document.createElement('div');
            wochentagElement.className = 'wochentag';
            wochentagElement.textContent = tag;
            kalenderGrid.appendChild(wochentagElement);
        });
        
        // Tage rendern
        const ersterTag = new Date(this.aktuellerMonat.getFullYear(), this.aktuellerMonat.getMonth(), 1);
        const letzterTag = new Date(this.aktuellerMonat.getFullYear(), this.aktuellerMonat.getMonth() + 1, 0);
        
        // Leere Zellen für Tage vor dem ersten Tag des Monats
        let ersterWochentag = ersterTag.getDay() || 7; // Sonntag = 7 statt 0
        for (let i = 1; i < ersterWochentag; i++) {
            const leerZelle = document.createElement('div');
            leerZelle.className = 'tag leer';
            kalenderGrid.appendChild(leerZelle);
        }
        
        // Tage des Monats
        for (let tag = 1; tag <= letzterTag.getDate(); tag++) {
            const datum = new Date(this.aktuellerMonat.getFullYear(), this.aktuellerMonat.getMonth(), tag);
            const tagElement = this.erstelleTagElement(datum);
            kalenderGrid.appendChild(tagElement);
        }
        
        // Kalender aktualisieren
        this.kalenderContainer.innerHTML = '';
        this.kalenderContainer.appendChild(kalenderGrid);
    }
    
    // Tag-Element erstellen
    erstelleTagElement(datum) {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag';
        
        // Datum
        const datumElement = document.createElement('div');
        datumElement.className = 'datum';
        datumElement.textContent = datum.getDate();
        
        // Prüfen ob heute
        if (this.istHeute(datum)) {
            tagElement.classList.add('heute');
        }
        
        // Prüfen ob Feiertag
        const datumString = this.formatDate(datum);
        if (Object.values(this.feiertage).includes(datumString)) {
            tagElement.classList.add('feiertag');
            const feiertagName = Object.keys(this.feiertage).find(key => this.feiertage[key] === datumString);
            datumElement.title = feiertagName;
        }
        
        // Prüfen ob Sonntag
        if (datum.getDay() === 0) {
            tagElement.classList.add('sonntag');
        }
        
        tagElement.appendChild(datumElement);
        
        // Positionen
        const positionenContainer = document.createElement('div');
        positionenContainer.className = 'positionen';
        
        CONFIG.POSITIONEN.forEach(position => {
            const positionElement = this.erstellePositionElement(datum, position);
            positionenContainer.appendChild(positionElement);
        });
        
        tagElement.appendChild(positionenContainer);
        return tagElement;
    }
    
    // Position-Element erstellen
    erstellePositionElement(datum, position) {
        const positionElement = document.createElement('div');
        positionElement.className = 'position';
        
        const dienst = this.getDienst(datum, position);
        if (dienst) {
            const mitarbeiter = this.getMitarbeiter(dienst.mitarbeiterId);
            positionElement.textContent = mitarbeiter ? mitarbeiter.name : 'Unbekannt';
            positionElement.classList.add(dienst.status);
        } else {
            positionElement.textContent = '---';
        }
        
        // Click-Handler für Position
        positionElement.addEventListener('click', () => {
            if (!this.istFeiertag(datum) && datum.getDay() !== 0) {
                this.openDienstDialog(datum, position, dienst);
            }
        });
        
        return positionElement;
    }
    
    // Dialog zum Bearbeiten/Erstellen eines Dienstes
    async openDienstDialog(datum, position, dienst) {
        const verfuegbareMitarbeiter = await this.getVerfuegbareMitarbeiter(datum, position, dienst?.mitarbeiterId);
        
        const dialog = document.createElement('dialog');
        dialog.className = 'dienst-dialog';
        
        dialog.innerHTML = `
            <h3>${this.formatDate(datum)} - ${position}</h3>
            <form method="dialog">
                <select id="mitarbeiter" required>
                    <option value="">Mitarbeiter auswählen</option>
                    ${verfuegbareMitarbeiter.map(m => 
                        `<option value="${m._id}" ${dienst?.mitarbeiterId === m._id ? 'selected' : ''}>
                            ${m.name}
                        </option>`
                    ).join('')}
                </select>
                
                <select id="status" required>
                    ${Object.entries(CONFIG.ANFRAGE_STATUS).map(([key, value]) =>
                        `<option value="${value}" ${dienst?.status === value ? 'selected' : ''}>
                            ${value}
                        </option>`
                    ).join('')}
                </select>
                
                <div class="buttons">
                    ${dienst ? '<button type="button" class="delete">Löschen</button>' : ''}
                    <button type="button" class="cancel">Abbrechen</button>
                    <button type="submit">Speichern</button>
                </div>
            </form>
        `;
        
        document.body.appendChild(dialog);
        dialog.showModal();
        
        // Event Listener
        dialog.querySelector('.cancel').addEventListener('click', () => dialog.close());
        
        if (dienst) {
            dialog.querySelector('.delete').addEventListener('click', async () => {
                await this.deleteDienst(dienst._id);
                dialog.close();
                this.render();
            });
        }
        
        dialog.querySelector('form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const mitarbeiterId = dialog.querySelector('#mitarbeiter').value;
            const status = dialog.querySelector('#status').value;
            
            if (dienst) {
                await this.updateDienst(dienst._id, { mitarbeiterId, status });
            } else {
                await this.createDienst({ 
                    datum: this.formatDate(datum),
                    position,
                    mitarbeiterId,
                    status
                });
            }
            
            dialog.close();
            this.render();
        });
    }
    
    // Hilfsfunktionen
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    istHeute(date) {
        return this.formatDate(date) === this.formatDate(this.heute);
    }
    
    istFeiertag(date) {
        return Object.values(this.feiertage).includes(this.formatDate(date));
    }
    
    getDienst(datum, position) {
        return this.dienste.find(d => 
            d.datum === this.formatDate(datum) && 
            d.position === position
        );
    }
    
    getMitarbeiter(id) {
        return this.mitarbeiter.find(m => m._id === id);
    }
    
    async getVerfuegbareMitarbeiter(datum, position, ausgenommenerId = null) {
        const datumStr = this.formatDate(datum);
        const tagesDienste = this.dienste.filter(d => 
            d.datum === datumStr && 
            d.mitarbeiterId !== ausgenommenerId
        );
        
        const belegteMitarbeiter = tagesDienste.map(d => d.mitarbeiterId);
        
        return this.mitarbeiter.filter(m => !belegteMitarbeiter.includes(m._id));
    }
    
    monatsWechsel(delta) {
        this.aktuellerMonat.setMonth(this.aktuellerMonat.getMonth() + delta);
        this.render();
    }
    
    // Ostern berechnen (Gaußsche Osterformel)
    berechneOstern(jahr) {
        const a = jahr % 19;
        const b = Math.floor(jahr / 100);
        const c = jahr % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const monat = Math.floor((h + l - 7 * m + 114) / 31);
        const tag = ((h + l - 7 * m + 114) % 31) + 1;
        
        return new Date(jahr, monat - 1, tag);
    }
    
    // API-Aufrufe
    async createDienst(dienstDaten) {
        try {
            const response = await fetch('/.netlify/functions/api/dienste', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dienstDaten)
            });
            
            if (!response.ok) {
                throw new Error('Fehler beim Erstellen des Dienstes');
            }
        } catch (error) {
            console.error('API-Fehler:', error);
            alert('Fehler beim Speichern: ' + error.message);
        }
    }
    
    async updateDienst(id, dienstDaten) {
        try {
            const response = await fetch(`/.netlify/functions/api/dienste/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dienstDaten)
            });
            
            if (!response.ok) {
                throw new Error('Fehler beim Aktualisieren des Dienstes');
            }
        } catch (error) {
            console.error('API-Fehler:', error);
            alert('Fehler beim Speichern: ' + error.message);
        }
    }
    
    async deleteDienst(id) {
        try {
            const response = await fetch(`/.netlify/functions/api/dienste/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Fehler beim Löschen des Dienstes');
            }
        } catch (error) {
            console.error('API-Fehler:', error);
            alert('Fehler beim Löschen: ' + error.message);
        }
    }
}

// Kalender initialisieren
document.addEventListener('DOMContentLoaded', () => {
    new AdminKalender();
});
