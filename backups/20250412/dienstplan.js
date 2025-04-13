// Admin-Dienstplan-Verwaltung

document.addEventListener('DOMContentLoaded', () => {
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');

    let currentDate = new Date();

    // Monatsnamen
    const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];

    // Österreichische Feiertage 2025
    const feiertage = {
        '2025-01-01': 'Neujahr',
        '2025-01-06': 'Heilige Drei Könige',
        '2025-04-21': 'Ostermontag',
        '2025-05-01': 'Staatsfeiertag',
        '2025-05-29': 'Christi Himmelfahrt',
        '2025-06-09': 'Pfingstmontag',
        '2025-06-19': 'Fronleichnam',
        '2025-08-15': 'Mariä Himmelfahrt',
        '2025-10-26': 'Nationalfeiertag',
        '2025-11-01': 'Allerheiligen',
        '2025-12-08': 'Mariä Empfängnis',
        '2025-12-25': 'Christtag',
        '2025-12-26': 'Stefanitag'
    };

    // Datum formatieren (deutsch)
    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    // Kalender rendern
    async function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();

        // Aktuellen Monat anzeigen
        currentMonthElement.textContent = `${monthNames[month]} ${year}`;

        // Ersten Tag des Monats ermitteln
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Tage des vorherigen Monats für die erste Woche
        const firstDayIndex = (firstDay.getDay() + 6) % 7; // Montag = 0
        
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

        // Lade alle Dienste und Mitarbeiter für den Monat
        const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
        
        try {
            const [dienste, mitarbeiter] = await Promise.all([
                fetch(`/.netlify/functions/api/dienste?start=${start}&end=${end}`).then(res => res.json()),
                fetch('/.netlify/functions/api/users').then(res => res.json())
            ]);

            // Tage des vorherigen Monats
            const prevLastDay = new Date(year, month, 0).getDate();
            for (let i = firstDayIndex - 1; i >= 0; i--) {
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day other-month';
                dayElement.innerHTML = `<div class="day-number">${prevLastDay - i}</div>`;
                calendarGrid.appendChild(dayElement);
            }

            // Tage des aktuellen Monats
            for (let i = 1; i <= lastDay.getDate(); i++) {
                const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                
                // Feiertag prüfen
                const feiertag = feiertage[currentDateStr];
                if (feiertag) {
                    dayElement.classList.add('feiertag');
                }
                
                // Dienste für diesen Tag finden
                const tagDienste = dienste.filter(d => d.datum === currentDateStr);
                
                let dienstHTML = `
                    <div class="day-number">
                        ${i}
                        ${feiertag ? `<div class="feiertag-name">${feiertag}</div>` : ''}
                    </div>
                    <button class="add-dienst-btn" onclick="openDienstDialog('${currentDateStr}')">
                        <i class="fas fa-plus"></i>
                    </button>
                `;
                
                if (tagDienste.length > 0) {
                    dienstHTML += '<div class="dienste">';
                    tagDienste.forEach(dienst => {
                        const mitarbeiterObj = mitarbeiter.find(m => m._id === dienst.mitarbeiterId);
                        const mitarbeiterName = mitarbeiterObj ? mitarbeiterObj.name : 'Unbekannt';
                        
                        dienstHTML += `
                            <div class="dienst ${dienst.status}" onclick="editDienst('${dienst._id}')">
                                <div class="dienst-zeit">${formatTime(dienst.startZeit)} - ${formatTime(dienst.endZeit)}</div>
                                <div class="dienst-info">
                                    <div class="mitarbeiter-name">${mitarbeiterName}</div>
                                    <div class="position">${dienst.position}</div>
                                </div>
                            </div>
                        `;
                    });
                    dienstHTML += '</div>';
                }
                
                dayElement.innerHTML = dienstHTML;
                calendarGrid.appendChild(dayElement);
            }

            // Tage des nächsten Monats
            const daysAfterLastDay = 42 - (firstDayIndex + lastDay.getDate());
            for (let i = 1; i <= daysAfterLastDay; i++) {
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day other-month';
                dayElement.innerHTML = `<div class="day-number">${i}</div>`;
                calendarGrid.appendChild(dayElement);
            }
        } catch (error) {
            console.error('Fehler beim Laden der Daten:', error);
            alert('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
        }
    }

    // Zeit formatieren (HH:MM)
    function formatTime(time) {
        if (!time) return '';
        return time.substring(0, 5);
    }

    // Event Listener für Monatswechsel
    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

    // Initial rendern
    renderCalendar(currentDate);

    // Dienst erstellen/bearbeiten Dialog
    window.openDienstDialog = async function(datum) {
        const users = await fetch('/.netlify/functions/api/users').then(res => res.json());
        const mitarbeiterOptions = users
            .filter(user => user.rolle !== 'admin')
            .map(user => `<option value="${user._id}">${user.name}</option>`)
            .join('');

        const [tag, monat, jahr] = formatDate(new Date(datum)).split('.');
        const formattedDate = `${tag}.${monat}.${jahr}`;

        const dialog = document.createElement('div');
        dialog.className = 'dienst-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Dienst für ${formattedDate}</h3>
                <form id="dienstForm">
                    <div class="form-group">
                        <label>Mitarbeiter:</label>
                        <select name="mitarbeiterId" required>
                            <option value="">Bitte wählen...</option>
                            ${mitarbeiterOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Von:</label>
                        <input type="time" name="startZeit" required>
                    </div>
                    <div class="form-group">
                        <label>Bis:</label>
                        <input type="time" name="endZeit" required>
                    </div>
                    <div class="form-group">
                        <label>Position:</label>
                        <select name="position" required>
                            <option value="kassa">Kassa</option>
                            <option value="führung">Führung</option>
                            <option value="shop">Shop</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Status:</label>
                        <select name="status" required>
                            <option value="geplant">Geplant</option>
                            <option value="angefragt">Angefragt</option>
                            <option value="genehmigt">Genehmigt</option>
                            <option value="abgelehnt">Abgelehnt</option>
                        </select>
                    </div>
                    <div class="button-group">
                        <button type="submit" class="btn-primary">Speichern</button>
                        <button type="button" class="btn-secondary" onclick="closeDialog()">Abbrechen</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(dialog);

        document.getElementById('dienstForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));

            const dienstData = {
                mitarbeiterId: formData.get('mitarbeiterId'),
                datum: datum,
                startZeit: formData.get('startZeit'),
                endZeit: formData.get('endZeit'),
                position: formData.get('position'),
                status: formData.get('status'),
                erstelltVon: currentUser.id
            };

            try {
                const response = await fetch('/.netlify/functions/api/dienste', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dienstData)
                });

                if (!response.ok) throw new Error('Fehler beim Speichern');

                closeDialog();
                renderCalendar(currentDate);
            } catch (error) {
                console.error('Fehler:', error);
                alert('Fehler beim Speichern des Dienstes');
            }
        });
    };

    // Dialog schließen
    window.closeDialog = function() {
        const dialog = document.querySelector('.dienst-dialog');
        if (dialog) {
            dialog.remove();
        }
    };
});
