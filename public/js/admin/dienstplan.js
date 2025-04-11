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
        const start = firstDay.toISOString().split('T')[0];
        const end = lastDay.toISOString().split('T')[0];
        const [dienste, users] = await Promise.all([
            getDiensteForMonth(start, end),
            getUsers()
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
            
            // Dienste für diesen Tag finden
            const tagDienste = dienste.filter(d => d.datum === currentDateStr);
            
            let dienstHTML = `
                <div class="day-number">${i}</div>
                <button class="add-dienst-btn" onclick="openDienstDialog('${currentDateStr}')">
                    <i class="fas fa-plus"></i>
                </button>
            `;
            
            if (tagDienste.length > 0) {
                dienstHTML += '<div class="dienste">';
                tagDienste.forEach(dienst => {
                    const mitarbeiter = users.find(u => u.id === dienst.mitarbeiterId);
                    const mitarbeiterName = mitarbeiter ? mitarbeiter.name : 'Unbekannt';
                    const statusClass = dienst.status === 'genehmigt' ? 'genehmigt' : 
                                    dienst.status === 'abgelehnt' ? 'abgelehnt' : 
                                    dienst.status === 'angefragt' ? 'angefragt' : '';
                    
                    dienstHTML += `
                        <div class="dienst ${statusClass}" onclick="editDienst('${dienst._id}')">
                            <span class="zeit">${dienst.schicht}</span>
                            <span class="position">${dienst.position}</span>
                            <span class="mitarbeiter">${mitarbeiterName}</span>
                        </div>
                    `;
                });
                dienstHTML += '</div>';
            }
            
            dayElement.innerHTML = dienstHTML;
            calendarGrid.appendChild(dayElement);
        }

        // Tage des nächsten Monats
        const lastDayIndex = (lastDay.getDay() + 6) % 7;
        const remainingDays = 7 - lastDayIndex - 1;
        for (let i = 1; i <= remainingDays; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day other-month';
            dayElement.innerHTML = `<div class="day-number">${i}</div>`;
            calendarGrid.appendChild(dayElement);
        }
    }

    // Dienste für einen Monat laden
    async function getDiensteForMonth(start, end) {
        try {
            const response = await fetch(`/.netlify/functions/api/dienste?start=${start}&end=${end}`);
            if (!response.ok) throw new Error('Fehler beim Laden der Dienste');
            return await response.json();
        } catch (error) {
            console.error('Fehler:', error);
            return [];
        }
    }

    // Benutzer laden
    async function getUsers() {
        try {
            const response = await fetch('/.netlify/functions/api/users');
            if (!response.ok) throw new Error('Fehler beim Laden der Benutzer');
            return await response.json();
        } catch (error) {
            console.error('Fehler:', error);
            return [];
        }
    }

    // Dienst erstellen/bearbeiten Dialog
    window.openDienstDialog = async function(datum) {
        const users = await getUsers();
        const mitarbeiterOptions = users
            .filter(user => user.rolle !== 'admin')
            .map(user => `<option value="${user.id}">${user.name}</option>`)
            .join('');

        const dialog = document.createElement('div');
        dialog.className = 'dienst-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Dienst für ${datum}</h3>
                <form id="dienstForm">
                    <div class="form-group">
                        <label>Mitarbeiter:</label>
                        <select name="mitarbeiterId" required>
                            <option value="">Bitte wählen...</option>
                            ${mitarbeiterOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Schicht:</label>
                        <select name="schicht" required>
                            <option value="früh">Früh</option>
                            <option value="spät">Spät</option>
                            <option value="nacht">Nacht</option>
                        </select>
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
                schicht: formData.get('schicht'),
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

    // Dienst bearbeiten
    window.editDienst = async function(dienstId) {
        // Implementierung folgt...
        console.log('Dienst bearbeiten:', dienstId);
    };

    // Dialog schließen
    window.closeDialog = function() {
        const dialog = document.querySelector('.dienst-dialog');
        if (dialog) {
            dialog.remove();
        }
    };

    // Event-Listener für Monatswechsel
    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

    // Initialen Kalender rendern
    renderCalendar(currentDate);
});
