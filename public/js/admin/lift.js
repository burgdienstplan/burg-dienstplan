// Lift-Wartungsverwaltung
document.addEventListener('DOMContentLoaded', () => {
    // DOM-Elemente
    const liftStundenElement = document.getElementById('liftStunden');
    const naechsteWartungElement = document.getElementById('naechsteWartung');
    const wartungTable = document.getElementById('wartungTable');
    const wartungForm = document.getElementById('wartungForm');
    const stoerungForm = document.getElementById('stoerungForm');
    const betriebsstundenForm = document.getElementById('betriebsstundenForm');
    const wartungTypSelect = document.getElementById('wartungTyp');
    const wartungDatum = document.getElementById('wartungDatum');

    // Aktuelles Datum als Standard setzen
    wartungDatum.valueAsDate = new Date();

    // Wartungstypen laden
    if (CONFIG && CONFIG.WARTUNGSTYPEN) {
        CONFIG.WARTUNGSTYPEN.forEach(typ => {
            const option = document.createElement('option');
            option.value = typ;
            option.textContent = typ;
            wartungTypSelect.appendChild(option);
        });
    } else {
        console.error('Wartungstypen konnten nicht geladen werden');
    }

    // Nächste Wartungen berechnen
    function updateNaechsteWartungen() {
        const wartungen = JSON.parse(localStorage.getItem('liftWartungen') || '[]');
        const heute = new Date();
        let naechsteText = '';

        // Für jeden Wartungstyp
        Object.entries(CONFIG.LIFT_WARTUNG.INTERVALLE).forEach(([key, intervall]) => {
            // Finde die letzte Wartung dieses Typs
            const letzteWartung = wartungen
                .filter(w => w.typ === intervall.name)
                .sort((a, b) => new Date(b.datum) - new Date(a.datum))[0];

            if (letzteWartung) {
                // Berechne wann die nächste Wartung fällig ist
                const letztesWartungsDatum = new Date(letzteWartung.datum);
                const naechsteWartungsDatum = new Date(letztesWartungsDatum);
                naechsteWartungsDatum.setDate(letztesWartungsDatum.getDate() + intervall.tage);

                // Berechne die Tage bis zur nächsten Wartung
                const tageBisWartung = Math.ceil((naechsteWartungsDatum - heute) / (1000 * 60 * 60 * 24));

                if (tageBisWartung <= 14) { // Zeige nur Wartungen die in den nächsten 2 Wochen fällig sind
                    naechsteText += `${intervall.name}: ${tageBisWartung} Tage\n`;
                }
            } else {
                // Wenn noch keine Wartung dieses Typs durchgeführt wurde
                naechsteText += `${intervall.name}: Noch nie durchgeführt\n`;
            }
        });

        naechsteWartungElement.textContent = naechsteText || 'Keine Wartung in den nächsten 2 Wochen fällig';
    }

    // Wartungshistorie laden und anzeigen
    function updateWartungshistorie() {
        const wartungen = JSON.parse(localStorage.getItem('liftWartungen') || '[]');
        const tbody = wartungTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        wartungen.sort((a, b) => new Date(b.datum) - new Date(a.datum)).forEach(wartung => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(wartung.datum).toLocaleDateString()}</td>
                <td>${wartung.typ}</td>
                <td>${wartung.betriebsstunden || '-'}</td>
                <td>${wartung.beschreibung}</td>
                <td>${wartung.techniker}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Betriebsstunden hinzufügen
    window.addBetriebsstunden = function() {
        openModal('betriebsstundenModal');
    };

    betriebsstundenForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const stunden = parseInt(document.getElementById('betriebsstundenAnzahl').value);
        const aktuelleStunden = parseInt(localStorage.getItem('liftBetriebsstunden') || '0');
        localStorage.setItem('liftBetriebsstunden', aktuelleStunden + stunden);
        
        liftStundenElement.textContent = aktuelleStunden + stunden;
        closeModal('betriebsstundenModal');
        betriebsstundenForm.reset();
    });

    // Wartung eintragen
    wartungForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const wartungen = JSON.parse(localStorage.getItem('liftWartungen') || '[]');
        const betriebsstunden = parseInt(localStorage.getItem('liftBetriebsstunden') || '0');
        
        const wartung = {
            id: Date.now().toString(),
            datum: document.getElementById('wartungDatum').value,
            typ: document.getElementById('wartungTyp').value,
            beschreibung: document.getElementById('wartungBeschreibung').value,
            techniker: document.getElementById('wartungTechniker').value,
            betriebsstunden: betriebsstunden
        };
        
        wartungen.push(wartung);
        localStorage.setItem('liftWartungen', JSON.stringify(wartungen));
        
        updateWartungshistorie();
        updateNaechsteWartungen();
        closeModal('wartungModal');
        wartungForm.reset();
        // Datum zurücksetzen auf heute
        wartungDatum.valueAsDate = new Date();
    });

    // Störung melden
    stoerungForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const stoerungen = JSON.parse(localStorage.getItem('liftStoerungen') || '[]');
        const betriebsstunden = parseInt(localStorage.getItem('liftBetriebsstunden') || '0');
        
        const stoerung = {
            id: Date.now().toString(),
            datum: new Date().toISOString(),
            beschreibung: document.getElementById('stoerungBeschreibung').value,
            prioritaet: document.getElementById('stoerungPrioritaet').value,
            status: 'offen',
            betriebsstunden: betriebsstunden
        };
        
        stoerungen.push(stoerung);
        localStorage.setItem('liftStoerungen', JSON.stringify(stoerungen));
        
        closeModal('stoerungModal');
        stoerungForm.reset();
        
        // Benachrichtigung anzeigen
        alert('Störung wurde gemeldet und wird bearbeitet.');
    });

    // Initialisierung
    updateNaechsteWartungen();
    updateWartungshistorie();
});
