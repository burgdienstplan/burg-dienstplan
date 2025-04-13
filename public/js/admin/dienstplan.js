// Admin-Dienstplan-Verwaltung

document.addEventListener('DOMContentLoaded', () => {
    // Globale Variablen
    let currentDate = new Date();
    let dienste = [];
    let mitarbeiter = [];
    let selectedDienst = null;

    // Kalender initialisieren
    updateCalendar();
    loadMitarbeiter();

    // Event Listener
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });

    document.getElementById('exportBtn').addEventListener('click', exportDienstplan);

    // Dialog Event Listener
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.dialog').forEach(dialog => dialog.classList.remove('active'));
        });
    });

    document.getElementById('saveBtn').addEventListener('click', saveDienst);
    document.getElementById('deleteBtn').addEventListener('click', deleteDienst);
    document.getElementById('saveFuehrungBtn').addEventListener('click', saveFuehrung);
    document.getElementById('deleteFuehrungBtn').addEventListener('click', deleteFuehrung);

    // Kalender aktualisieren
    async function updateCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Monatstitel aktualisieren
        document.getElementById('currentMonth').textContent = 
            new Date(year, month).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

        // Dienste laden
        await loadDienste(year, month);

        // Kalender aufbauen
        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';

        // Tabellenkopf
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>MO</th><th>DI</th><th>MI</th><th>DO</th><th>FR</th><th>SA</th><th>SO</th>
            </tr>
        `;
        calendar.appendChild(thead);

        // Kalender-Body
        const tbody = document.createElement('tbody');
        let date = new Date(year, month, 1);
        date.setDate(1 - (date.getDay() || 7) + 1);

        while (true) {
            const tr = document.createElement('tr');
            
            for (let i = 0; i < 7; i++) {
                const td = document.createElement('td');
                
                if (date.getMonth() === month) {
                    // Tag-Nummer
                    const dayNumber = document.createElement('div');
                    dayNumber.className = 'day-number';
                    dayNumber.textContent = date.getDate();
                    td.appendChild(dayNumber);

                    // CSS-Klassen
                    if (date.getDay() === 0) td.classList.add('sunday');
                    if (isHoliday(date)) td.classList.add('holiday');
                    if (isToday(date)) td.classList.add('today');

                    // Dienste für diesen Tag
                    const tagDienste = getDiensteForDate(date);
                    tagDienste.forEach(dienst => {
                        const dienstDiv = createDienstElement(dienst);
                        td.appendChild(dienstDiv);
                    });

                    // Neuer Dienst Button (nur für aktuelle/zukünftige Tage)
                    if (date >= new Date().setHours(0,0,0,0)) {
                        const addBtn = document.createElement('button');
                        addBtn.className = 'btn-secondary add-dienst';
                        addBtn.innerHTML = '<i class="fas fa-plus"></i>';
                        addBtn.addEventListener('click', () => openDienstDialog(null, date));
                        td.appendChild(addBtn);
                    }
                }

                tr.appendChild(td);
                date.setDate(date.getDate() + 1);
            }

            tbody.appendChild(tr);
            
            if (date.getMonth() !== month) break;
        }

        calendar.appendChild(tbody);
    }

    // Dienste laden
    async function loadDienste(year, month) {
        try {
            const response = await fetch(`/.netlify/functions/api/dienste?year=${year}&month=${month}`);
            if (!response.ok) throw new Error('Fehler beim Laden der Dienste');
            dienste = await response.json();
        } catch (error) {
            console.error('Fehler:', error);
            alert('Dienste konnten nicht geladen werden');
        }
    }

    // Mitarbeiter laden
    async function loadMitarbeiter() {
        try {
            const response = await fetch('/.netlify/functions/api/mitarbeiter');
            if (!response.ok) throw new Error('Fehler beim Laden der Mitarbeiter');
            mitarbeiter = await response.json();
            
            // Mitarbeiter-Select aktualisieren
            const select = document.getElementById('mitarbeiter');
            select.innerHTML = '<option value="">Bitte wählen...</option>' +
                mitarbeiter.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        } catch (error) {
            console.error('Fehler:', error);
            alert('Mitarbeiter konnten nicht geladen werden');
        }
    }

    // Dienst-Dialog öffnen
    function openDienstDialog(dienst, date) {
        selectedDienst = dienst;
        const dialog = document.getElementById('dienstDialog');
        
        // Formulardaten setzen
        document.getElementById('dienstId').value = dienst ? dienst.id : '';
        document.getElementById('dienstDatum').value = formatDate(date);
        document.getElementById('position').value = dienst ? dienst.position : '';
        document.getElementById('mitarbeiter').value = dienst ? dienst.mitarbeiterId : '';
        document.getElementById('status').value = dienst ? dienst.status : 'geplant';

        dialog.classList.add('active');
    }

    // Dienst speichern
    async function saveDienst() {
        const dienstData = {
            id: document.getElementById('dienstId').value,
            datum: document.getElementById('dienstDatum').value,
            position: document.getElementById('position').value,
            mitarbeiterId: document.getElementById('mitarbeiter').value,
            status: document.getElementById('status').value
        };

        try {
            const url = '/.netlify/functions/api/dienste' + (dienstData.id ? `/${dienstData.id}` : '');
            const method = dienstData.id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dienstData)
            });

            if (!response.ok) throw new Error('Fehler beim Speichern');

            document.getElementById('dienstDialog').classList.remove('active');
            updateCalendar();
        } catch (error) {
            console.error('Fehler:', error);
            alert('Dienst konnte nicht gespeichert werden');
        }
    }

    // Dienst löschen
    async function deleteDienst() {
        if (!selectedDienst || !confirm('Dienst wirklich löschen?')) return;

        try {
            const response = await fetch(`/.netlify/functions/api/dienste/${selectedDienst.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Fehler beim Löschen');

            document.getElementById('dienstDialog').classList.remove('active');
            updateCalendar();
        } catch (error) {
            console.error('Fehler:', error);
            alert('Dienst konnte nicht gelöscht werden');
        }
    }

    // Führungs-Dialog öffnen
    function openFuehrungDialog(fuehrung, date) {
        const dialog = document.getElementById('fuehrungDialog');
        
        // Formulardaten setzen
        document.getElementById('fuehrungId').value = fuehrung ? fuehrung.id : '';
        document.getElementById('fuehrungDatum').value = formatDate(date);
        document.getElementById('gruppenname').value = fuehrung ? fuehrung.gruppenname : '';
        document.getElementById('personenanzahl').value = fuehrung ? fuehrung.personenanzahl : '';
        document.getElementById('sprache').value = fuehrung ? fuehrung.sprache : 'deutsch';
        document.getElementById('uhrzeit').value = fuehrung ? fuehrung.uhrzeit : '';
        document.getElementById('fuehrer').value = fuehrung ? fuehrung.fuehrerId : '';

        dialog.classList.add('active');
    }

    // Führung speichern
    async function saveFuehrung() {
        const fuehrungData = {
            id: document.getElementById('fuehrungId').value,
            datum: document.getElementById('fuehrungDatum').value,
            gruppenname: document.getElementById('gruppenname').value,
            personenanzahl: document.getElementById('personenanzahl').value,
            sprache: document.getElementById('sprache').value,
            uhrzeit: document.getElementById('uhrzeit').value,
            fuehrerId: document.getElementById('fuehrer').value
        };

        try {
            const url = '/.netlify/functions/api/fuehrungen' + (fuehrungData.id ? `/${fuehrungData.id}` : '');
            const method = fuehrungData.id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fuehrungData)
            });

            if (!response.ok) throw new Error('Fehler beim Speichern');

            document.getElementById('fuehrungDialog').classList.remove('active');
            updateCalendar();
        } catch (error) {
            console.error('Fehler:', error);
            alert('Führung konnte nicht gespeichert werden');
        }
    }

    // Führung löschen
    async function deleteFuehrung() {
        if (!confirm('Führung wirklich löschen?')) return;

        try {
            const fuehrungId = document.getElementById('fuehrungId').value;
            const response = await fetch(`/.netlify/functions/api/fuehrungen/${fuehrungId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Fehler beim Löschen');

            document.getElementById('fuehrungDialog').classList.remove('active');
            updateCalendar();
        } catch (error) {
            console.error('Fehler:', error);
            alert('Führung konnte nicht gelöscht werden');
        }
    }

    // Dienstplan exportieren
    function exportDienstplan() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthName = new Date(year, month).toLocaleDateString('de-DE', { month: 'long' });
        
        let csv = 'Datum;Position;Mitarbeiter;Status\n';
        
        dienste.forEach(dienst => {
            const mitarbeiterName = mitarbeiter.find(m => m.id === dienst.mitarbeiterId)?.name || '';
            csv += `${dienst.datum};${dienst.position};${mitarbeiterName};${dienst.status}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Dienstplan_${monthName}_${year}.csv`;
        link.click();
    }

    // Hilfsfunktionen
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    function isHoliday(date) {
        // Österreichische Feiertage prüfen
        const holidays = window.FEIERTAGE || [];
        return holidays.some(h => 
            h.datum === formatDate(date)
        );
    }

    function isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    function getDiensteForDate(date) {
        return dienste.filter(d => d.datum === formatDate(date));
    }

    function createDienstElement(dienst) {
        const div = document.createElement('div');
        div.className = `dienst ${dienst.status}`;
        
        const mitarbeiterName = mitarbeiter.find(m => m.id === dienst.mitarbeiterId)?.name || '';
        div.textContent = `${dienst.position}: ${mitarbeiterName}`;
        
        div.addEventListener('click', () => openDienstDialog(dienst, new Date(dienst.datum)));
        
        return div;
    }
});
