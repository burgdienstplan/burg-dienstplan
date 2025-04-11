// Admin-Dienstplan-Verwaltung

document.addEventListener('DOMContentLoaded', () => {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
    const exportButton = document.getElementById('exportDienstplanBtn');
    const newDienstButton = document.getElementById('newDienstBtn');

    let currentDate = new Date();

    // Monatsnamen
    const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];

    // Kalender rendern
    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();

        // Aktuellen Monat anzeigen
        currentMonthElement.textContent = `${monthNames[month]} ${year}`;

        // Grid leeren
        calendarGrid.innerHTML = '';

        // Wochentage hinzufügen
        const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
        weekdays.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day weekday';
            dayElement.textContent = day;
            calendarGrid.appendChild(dayElement);
        });

        // Ersten Tag des Monats ermitteln
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Tage des vorherigen Monats für die erste Woche
        const firstDayIndex = (firstDay.getDay() + 6) % 7; // Montag = 0
        const prevLastDay = new Date(year, month, 0).getDate();
        
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day other-month';
            dayElement.innerHTML = `<div class="day-number">${prevLastDay - i}</div>`;
            calendarGrid.appendChild(dayElement);
        }

        // Tage des aktuellen Monats
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            // Heute markieren
            const currentDay = new Date();
            if (day === currentDay.getDate() && 
                month === currentDay.getMonth() && 
                year === currentDay.getFullYear()) {
                dayElement.classList.add('today');
            }

            // Datum für diesen Tag
            const dateStr = formatDate(new Date(year, month, day));
            const currentDate = new Date(year, month, day);

            // Ruhetag prüfen
            const isRuhetagActive = isRuhetag(currentDate);
            if (isRuhetagActive) {
                dayElement.classList.add('ruhetag');
            }

            // Tag-Header mit Nummer und ggf. Feiertagsname oder Ruhetag
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.innerHTML = `
                <div class="day-number">${day}</div>
                ${isFeiertag(currentDate) ? `<div class="holiday-name">${isFeiertag(currentDate)}</div>` : ''}
                ${isRuhetagActive ? `
                    <div class="ruhetag-badge">
                        Ruhetag
                        <button class="btn-icon remove-ruhetag" onclick="handleRuhetag('${dateStr}', false)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                ` : `
                    <button class="btn-icon add-ruhetag" onclick="handleRuhetag('${dateStr}', true)">
                        <i class="fas fa-moon"></i>
                    </button>
                `}
            `;
            dayElement.appendChild(dayHeader);

            // Container für die Dienste
            const dienstContainer = document.createElement('div');
            dienstContainer.className = 'dienst-container';

            // Genehmigte Dienste für diesen Tag laden und anzeigen
            const dienste = getDiensteForDate(dateStr);
            dienste.forEach(dienst => {
                if (dienst.status === 'genehmigt') {
                    const dienstElement = document.createElement('div');
                    dienstElement.className = 'dienst-entry';
                    
                    // Mitarbeiter-Name laden
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const mitarbeiter = users.find(user => user.id === dienst.mitarbeiterId);
                    const mitarbeiterName = mitarbeiter ? mitarbeiter.name : 'Unbekannt';

                    dienstElement.innerHTML = `
                        <div class="dienst-info">
                            <span class="position">${dienst.position}</span>
                            <span class="mitarbeiter">${mitarbeiterName}</span>
                        </div>
                        <div class="dienst-actions">
                            <button class="btn-icon" onclick="editDienst('${dienst.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon" onclick="deleteDienst('${dienst.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    dienstContainer.appendChild(dienstElement);
                }
            });

            // "Dienst hinzufügen" Button
            if (!isRuhetagActive) {
                const addButton = document.createElement('button');
                addButton.className = 'add-dienst-btn';
                addButton.innerHTML = '<i class="fas fa-plus"></i> Dienst';
                addButton.onclick = () => addDienst(dateStr);
                dienstContainer.appendChild(addButton);
            }

            dayElement.appendChild(dienstContainer);
            calendarGrid.appendChild(dayElement);
        }

        // Tage des nächsten Monats
        const remainingDays = 42 - (firstDayIndex + lastDay.getDate());
        for (let i = 1; i <= remainingDays; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day other-month';
            dayElement.innerHTML = `<div class="day-number">${i}</div>`;
            calendarGrid.appendChild(dayElement);
        }
    }

    // Dienste für ein bestimmtes Datum laden
    function getDiensteForDate(date) {
        const dienste = JSON.parse(localStorage.getItem('dienstAnfragen') || '[]');
        return dienste.filter(dienst => dienst.datum === date);
    }

    // Datum formatieren (YYYY-MM-DD)
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Event-Listener für Monatswechsel
    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

    // Dienst hinzufügen
    window.addDienst = function(datum) {
        // Prüfen ob es ein Ruhetag ist
        const date = new Date(datum);
        if (isRuhetag(date)) {
            alert('An Ruhetagen können keine Dienste zugewiesen werden.');
            return;
        }
        
        document.getElementById('dienstDatum').value = datum;
        document.getElementById('dienstForm').dataset.editId = '';
        openModal('dienstModal');
    };

    // Dienst bearbeiten
    window.editDienst = function(id) {
        const dienste = JSON.parse(localStorage.getItem('dienstAnfragen') || '[]');
        const dienst = dienste.find(d => d.id === id);
        
        if (dienst) {
            // Prüfen ob es ein Ruhetag ist
            const date = new Date(dienst.datum);
            if (isRuhetag(date)) {
                alert('An Ruhetagen können keine Dienste zugewiesen werden.');
                return;
            }
            
            document.getElementById('dienstDatum').value = dienst.datum;
            document.getElementById('dienstPosition').value = dienst.position;
            document.getElementById('dienstMitarbeiter').value = dienst.mitarbeiterId;
            document.getElementById('dienstForm').dataset.editId = id;
            openModal('dienstModal');
        }
    };

    // Dienst löschen
    window.deleteDienst = function(id) {
        if (confirm('Möchten Sie diesen Dienst wirklich löschen?')) {
            const dienste = JSON.parse(localStorage.getItem('dienstAnfragen') || '[]');
            const index = dienste.findIndex(d => d.id === id);
            if (index !== -1) {
                dienste.splice(index, 1);
                localStorage.setItem('dienstAnfragen', JSON.stringify(dienste));
                renderCalendar(currentDate);
            }
        }
    };

    // Dienst speichern
    const dienstForm = document.getElementById('dienstForm');
    dienstForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const editId = dienstForm.dataset.editId;
        const datum = document.getElementById('dienstDatum').value;
        const position = document.getElementById('dienstPosition').value;
        const mitarbeiterId = document.getElementById('dienstMitarbeiter').value;
        
        const dienste = JSON.parse(localStorage.getItem('dienstAnfragen') || '[]');
        
        if (editId) {
            // Bestehenden Dienst aktualisieren
            const index = dienste.findIndex(d => d.id === editId);
            if (index !== -1) {
                dienste[index] = {
                    ...dienste[index],
                    datum,
                    position,
                    mitarbeiterId,
                    status: 'genehmigt'
                };
            }
        } else {
            // Neuen Dienst hinzufügen
            dienste.push({
                id: Date.now().toString(),
                datum,
                position,
                mitarbeiterId,
                status: 'genehmigt'
            });
        }
        
        localStorage.setItem('dienstAnfragen', JSON.stringify(dienste));
        closeModal('dienstModal');
        renderCalendar(currentDate);
    });

    // Mitarbeiter-Select füllen
    function loadMitarbeiterSelect() {
        const mitarbeiterSelect = document.getElementById('dienstMitarbeiter');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        mitarbeiterSelect.innerHTML = '<option value="">Mitarbeiter auswählen...</option>';
        users.forEach(user => {
            if (user.rolle === 'mitarbeiter') {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                mitarbeiterSelect.appendChild(option);
            }
        });
    }

    // Position-Select füllen
    function loadPositionSelect() {
        const positionSelect = document.getElementById('dienstPosition');
        const positionen = ['Shop', 'Museum', 'Eintritt', 'Führungen'];
        
        positionSelect.innerHTML = '<option value="">Position auswählen...</option>';
        positionen.forEach(position => {
            const option = document.createElement('option');
            option.value = position.toLowerCase();
            option.textContent = position;
            positionSelect.appendChild(option);
        });
    }

    // Ruhetag hinzufügen/entfernen
    window.handleRuhetag = function(dateStr, add) {
        if (add) {
            // Prüfen ob es Dienste an diesem Tag gibt
            const dienste = getDiensteForDate(dateStr);
            if (dienste.length > 0) {
                if (!confirm('Es gibt bereits Dienste an diesem Tag. Möchten Sie diese löschen und den Tag als Ruhetag markieren?')) {
                    return;
                }
                // Alle Dienste für diesen Tag löschen
                const alleDienste = JSON.parse(localStorage.getItem('dienstAnfragen') || '[]');
                const updatedDienste = alleDienste.filter(d => d.datum !== dateStr);
                localStorage.setItem('dienstAnfragen', JSON.stringify(updatedDienste));
            }
            addRuhetag(dateStr);
        } else {
            removeRuhetag(dateStr);
        }
        renderCalendar(currentDate);
    };

    // Ruhetage speichern
    function addRuhetag(dateStr) {
        const ruhetage = JSON.parse(localStorage.getItem('ruhetage') || '[]');
        ruhetage.push(dateStr);
        localStorage.setItem('ruhetage', JSON.stringify(ruhetage));
    }

    function removeRuhetag(dateStr) {
        const ruhetage = JSON.parse(localStorage.getItem('ruhetage') || '[]');
        const updatedRuhetage = ruhetage.filter(ruhetag => ruhetag !== dateStr);
        localStorage.setItem('ruhetage', JSON.stringify(updatedRuhetage));
    }

    // Ruhetag prüfen
    function isRuhetag(date) {
        const ruhetage = JSON.parse(localStorage.getItem('ruhetage') || '[]');
        const dateStr = formatDate(date);
        return ruhetage.includes(dateStr);
    }

    // Feiertags-Prüfung
    function isFeiertag(date) {
        // Hier müssen die Feiertage implementiert werden
        // Zum Beispiel:
        // const feiertage = [
        //     { date: new Date('2023-01-01'), name: 'Neujahr' },
        //     { date: new Date('2023-04-07'), name: 'Karfreitag' },
        //     // ...
        // ];
        // return feiertage.find(feiertag => feiertag.date.getTime() === date.getTime())?.name;
        return null;
    }

    // Initialisierung
    loadMitarbeiterSelect();
    loadPositionSelect();
    renderCalendar(currentDate);
});
