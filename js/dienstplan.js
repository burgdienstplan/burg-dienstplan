// Österreichische Feiertage 2025
const FEIERTAGE_2025 = {
    '2025-01-01': 'Neujahr',
    '2025-01-06': 'Heilige Drei Könige',
    '2025-04-21': 'Ostermontag',
    '2025-05-01': 'Staatsfeiertag',
    '2025-05-29': 'Christi Himmelfahrt',
    '2025-06-09': 'Pfingstmontag',
    '2025-06-19': 'Fronleichnam',
    '2025-08-15': 'Mariä Himmelfahrt',
    '2025-10-26': 'Nationalfeiertag',
    '2025-11-01': 'Allerheiligen'
};

// Saisondaten
const SAISON = {
    start: '2025-04-01',
    end: '2025-11-01'
};

class DienstplanManager {
    constructor() {
        this.currentDate = new Date();
        // Starte mit April 2025 als Standardmonat
        this.selectedDate = new Date(2025, 3, 1); // April ist Monat 3 (0-basiert)
        this.shifts = this.initializeDemoShifts();
        this.shiftRequests = JSON.parse(localStorage.getItem('shiftRequests')) || {};
        this.holidays = FEIERTAGE_2025;
        this.urlaubsanfragen = JSON.parse(localStorage.getItem('urlaubsanfragen')) || [];
        this.fuehrungsvorschlaege = JSON.parse(localStorage.getItem('fuehrungsvorschlaege')) || [];
        this.ruhetage = JSON.parse(localStorage.getItem('ruhetage')) || [];
        this.lastModified = JSON.parse(localStorage.getItem('lastModified')) || {};
        
        this.initializeEventListeners();
        this.loadMitarbeiter();
        this.renderCalendar();
        this.checkPlanningStatus();
    }

    initializeDemoShifts() {
        // Demo-Schichten für April 2025
        const demoShifts = {
            '2025-04-01': [
                { mitarbeiterId: 'anna', position: 'shop' },
                { mitarbeiterId: 'peter', position: 'fuehrung' }
            ],
            '2025-04-02': [
                { mitarbeiterId: 'maria', position: 'shop' },
                { mitarbeiterId: 'lisa', position: 'shop_museum' }
            ],
            '2025-04-03': [
                { mitarbeiterId: 'josef', position: 'shop' },
                { mitarbeiterId: 'peter', position: 'fuehrung' }
            ],
            '2025-04-04': [
                { mitarbeiterId: 'lisa', position: 'shop' },
                { mitarbeiterId: 'maria', position: 'kasse' }
            ],
            '2025-04-05': [
                { mitarbeiterId: 'anna', position: 'shop' },
                { mitarbeiterId: 'josef', position: 'fuehrung' },
                { mitarbeiterId: 'maria', position: 'kasse' }
            ],
            '2025-04-06': [
                { mitarbeiterId: 'peter', position: 'shop' },
                { mitarbeiterId: 'lisa', position: 'shop_museum' }
            ]
        };

        // Speichere die Demo-Schichten
        localStorage.setItem('shifts', JSON.stringify(demoShifts));
        return demoShifts;
    }

    initializeEventListeners() {
        // Navigations-Listener
        document.getElementById('prevMonth').addEventListener('click', () => this.prevMonth());
        document.getElementById('nextMonth').addEventListener('click', () => this.nextMonth());
        
        const user = JSON.parse(localStorage.getItem('currentUser'));
        
        // Admin-Funktionen
        if (user?.role === 'kastellan') {
            document.getElementById('adminControls').style.display = 'block';
            document.getElementById('addShift').addEventListener('click', () => this.addShift());
            document.getElementById('markRuhetag').addEventListener('click', () => this.markRuhetag());
            this.loadPendingRequests();
            
            // Drag & Drop für Schichten
            this.initializeDragAndDrop();
        } else {
            // Mitarbeiter können Dienste vorschlagen
            document.getElementById('mitarbeiterControls').style.display = 'block';
            this.checkForUpdates(user.id);
        }

        // Mitarbeiter-spezifische Funktionen
        if (user?.role === 'museumsfuehrer') {
            document.getElementById('fuehrungControls').style.display = 'block';
        }
    }

    initializeDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('shift')) {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    date: e.target.dataset.date,
                    mitarbeiterId: e.target.dataset.mitarbeiterId,
                    position: e.target.dataset.position
                }));
            }
        });

        document.addEventListener('dragover', (e) => {
            if (e.target.classList.contains('calendar-day')) {
                e.preventDefault();
            }
        });

        document.addEventListener('drop', (e) => {
            if (e.target.classList.contains('calendar-day')) {
                e.preventDefault();
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                const newDate = e.target.dataset.date;
                
                if (this.canMoveShift(data, newDate)) {
                    this.moveShift(data, newDate);
                }
            }
        });
    }

    canMoveShift(shiftData, newDate) {
        // Prüfen ob das neue Datum in der Saison liegt
        if (!this.isInSaison(newDate)) {
            alert('Dieses Datum liegt außerhalb der Saison!');
            return false;
        }

        // Prüfen ob es ein Ruhetag ist
        if (this.isRuhetag(newDate)) {
            alert('An diesem Tag ist Ruhetag!');
            return false;
        }

        // Wenn es Shop Eingang ist, prüfen ob andere Positionen betroffen sind
        if (shiftData.position === 'shop') {
            const shifts = this.shifts[shiftData.date] || [];
            if (shifts.length > 1) {
                alert('Shop Eingang kann nicht verschoben werden, wenn andere Positionen besetzt sind!');
                return false;
            }
        }

        return true;
    }

    moveShift(shiftData, newDate) {
        // Alte Schicht entfernen
        const oldShifts = this.shifts[shiftData.date] || [];
        const index = oldShifts.findIndex(s => 
            s.mitarbeiterId === shiftData.mitarbeiterId && 
            s.position === shiftData.position
        );
        
        if (index > -1) {
            oldShifts.splice(index, 1);
            if (oldShifts.length === 0) {
                delete this.shifts[shiftData.date];
            } else {
                this.shifts[shiftData.date] = oldShifts;
            }
        }

        // Neue Schicht hinzufügen
        if (!this.shifts[newDate]) {
            this.shifts[newDate] = [];
        }
        this.shifts[newDate].push({
            mitarbeiterId: shiftData.mitarbeiterId,
            position: shiftData.position
        });

        // Änderungen speichern
        this.lastModified[newDate] = new Date().toISOString();
        localStorage.setItem('shifts', JSON.stringify(this.shifts));
        localStorage.setItem('lastModified', JSON.stringify(this.lastModified));
        
        this.renderCalendar();
    }

    checkPlanningStatus() {
        const warningDiv = document.getElementById('planningWarning');
        if (!warningDiv) return;

        const today = new Date();
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(today.getDate() + 14);

        let isFullyPlanned = true;
        let currentDate = new Date(today);

        while (currentDate <= twoWeeksFromNow) {
            const dateStr = this.formatDate(currentDate);
            if (this.isInSaison(dateStr) && !this.isRuhetag(dateStr)) {
                const shifts = this.shifts[dateStr] || [];
                if (!shifts.some(s => s.position === 'shop')) {
                    isFullyPlanned = false;
                    break;
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        warningDiv.innerHTML = isFullyPlanned ? 
            '<div class="success">✓ Dienstplan ist für die nächsten 14 Tage vollständig</div>' :
            '<div class="warning">⚠ Bitte den Dienstplan für die nächsten 14 Tage vervollständigen!</div>';
    }

    checkForUpdates(mitarbeiterId) {
        const lastCheck = localStorage.getItem(`lastCheck_${mitarbeiterId}`) || '2000-01-01';
        let hasUpdates = false;

        Object.entries(this.lastModified).forEach(([date, modifiedDate]) => {
            if (modifiedDate > lastCheck) {
                const shifts = this.shifts[date] || [];
                if (shifts.some(s => s.mitarbeiterId === mitarbeiterId)) {
                    hasUpdates = true;
                }
            }
        });

        if (hasUpdates) {
            const updateDiv = document.createElement('div');
            updateDiv.className = 'update-notification';
            updateDiv.innerHTML = '⚠ Es gibt Änderungen in Ihrem Dienstplan!';
            document.querySelector('.content').insertBefore(updateDiv, document.querySelector('.calendar'));
        }

        localStorage.setItem(`lastCheck_${mitarbeiterId}`, new Date().toISOString());
    }

    loadPendingRequests() {
        const requestsDiv = document.getElementById('dienstAnfragen');
        requestsDiv.innerHTML = '<h3>Dienstanfragen</h3>';
        
        Object.entries(this.shiftRequests).forEach(([date, requests]) => {
            requests.forEach(request => {
                if (request.status === 'pending') {
                    const requestElement = document.createElement('div');
                    requestElement.className = 'dienstanfrage';
                    requestElement.innerHTML = `
                        <p>${request.mitarbeiterName} möchte am ${new Date(date).toLocaleDateString('de-DE')} 
                           als ${request.position} arbeiten</p>
                        <button onclick="dienstplan.approveShiftRequest('${date}', ${request.id})">Genehmigen</button>
                        <button onclick="dienstplan.rejectShiftRequest('${date}', ${request.id})">Ablehnen</button>
                    `;
                    requestsDiv.appendChild(requestElement);
                }
            });
        });
    }

    requestShift(date, position) {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) return;

        if (!this.isInSaison(date)) {
            alert('Dieses Datum liegt außerhalb der Saison!');
            return;
        }

        if (this.isRuhetag(date)) {
            alert('An diesem Tag ist Ruhetag!');
            return;
        }

        const request = {
            id: Date.now(),
            mitarbeiterId: user.id,
            mitarbeiterName: `${user.vorname} ${user.nachname}`,
            position: position,
            status: 'pending',
            requestDate: new Date().toISOString()
        };

        if (!this.shiftRequests[date]) {
            this.shiftRequests[date] = [];
        }
        
        this.shiftRequests[date].push(request);
        localStorage.setItem('shiftRequests', JSON.stringify(this.shiftRequests));
        alert('Ihre Dienstanfrage wurde eingereicht und wird vom Kastellan geprüft.');
    }

    approveShiftRequest(date, requestId) {
        const request = this.shiftRequests[date].find(r => r.id === requestId);
        if (!request) return;

        request.status = 'approved';
        this.addShift(request.mitarbeiterId, request.position, date);
        localStorage.setItem('shiftRequests', JSON.stringify(this.shiftRequests));
        this.loadPendingRequests();
        this.renderCalendar();
    }

    rejectShiftRequest(date, requestId) {
        const request = this.shiftRequests[date].find(r => r.id === requestId);
        if (!request) return;

        request.status = 'rejected';
        localStorage.setItem('shiftRequests', JSON.stringify(this.shiftRequests));
        this.loadPendingRequests();
    }

    loadMitarbeiter() {
        const mitarbeiter = JSON.parse(localStorage.getItem('mitarbeiter')) || [];
        const select = document.getElementById('mitarbeiter');
        select.innerHTML = '<option value="">Mitarbeiter auswählen...</option>';
        mitarbeiter.forEach(m => {
            const option = document.createElement('option');
            option.value = m.id;
            option.textContent = m.name;
            select.appendChild(option);
        });
    }

    isFeiertag(dateStr) {
        return this.holidays[dateStr];
    }

    isInSaison(dateStr) {
        const date = new Date(dateStr);
        const start = new Date(SAISON.start);
        const end = new Date(SAISON.end);

        // Setze Uhrzeiten auf Mitternacht für korrekten Vergleich
        date.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        return date >= start && date <= end;
    }

    isRuhetag(dateStr) {
        return this.ruhetage.includes(dateStr);
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    addShift(mitarbeiterId, position, datum) {
        if (!mitarbeiterId || !position || !datum) {
            alert('Bitte alle Felder ausfüllen!');
            return;
        }

        if (!this.isInSaison(datum)) {
            alert('Dieses Datum liegt außerhalb der Saison!');
            return;
        }

        if (this.isRuhetag(datum)) {
            alert('An diesem Tag ist Ruhetag!');
            return;
        }

        // Prüfen ob Shop Eingang besetzt ist
        if (position !== 'shop' && !this.isShopBesetzt(datum)) {
            alert('Shop Eingang muss zuerst besetzt werden!');
            return;
        }

        if (!this.shifts[datum]) {
            this.shifts[datum] = [];
        }
        
        this.shifts[datum].push({ mitarbeiterId, position });
        localStorage.setItem('shifts', JSON.stringify(this.shifts));
        this.renderCalendar();
    }

    isShopBesetzt(datum) {
        const shifts = this.shifts[datum] || [];
        return shifts.some(s => s.position === 'shop');
    }

    markRuhetag() {
        const datum = document.getElementById('datum').value;
        
        if (!this.isInSaison(datum)) {
            alert('Ruhetage können nur während der Saison markiert werden!');
            return;
        }

        if (!this.ruhetage.includes(datum)) {
            this.ruhetage.push(datum);
            localStorage.setItem('ruhetage', JSON.stringify(this.ruhetage));
            this.renderCalendar();
        }
    }

    renderCalendar() {
        const calendarDiv = document.getElementById('calendar');
        calendarDiv.innerHTML = '';
        
        // Wochentage-Header
        const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        weekdays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-header-day';
            dayHeader.textContent = day;
            calendarDiv.appendChild(dayHeader);
        });

        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth();
        
        // Aktualisiere Header
        document.getElementById('currentMonth').textContent = 
            new Date(year, month).toLocaleString('de-DE', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Leere Tage am Anfang
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarDiv.appendChild(emptyDay);
        }

        // Tage des Monats
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateStr = this.formatDate(date);
            const dayDiv = this.createDayElement(date);
            calendarDiv.appendChild(dayDiv);
        }

        // Leere Tage am Ende
        const remainingDays = 42 - (firstDay.getDay() + lastDay.getDate());
        for (let i = 0; i < remainingDays; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarDiv.appendChild(emptyDay);
        }

        // Prüfe Planungsstatus
        this.checkPlanningStatus();
    }

    createDayElement(date) {
        const dateStr = this.formatDate(date);
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.dataset.date = dateStr;
        
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const isKastellan = user?.role === 'kastellan';
        
        // Datum
        const dateDiv = document.createElement('div');
        dateDiv.className = 'date';
        dateDiv.textContent = date.getDate();

        // Status (Feiertag, Ruhetag, außerhalb Saison)
        if (!this.isInSaison(dateStr)) {
            div.classList.add('outside-season');
            dateDiv.textContent += ' (Außerhalb Saison)';
        } else if (this.isFeiertag(dateStr)) {
            div.classList.add('holiday');
            dateDiv.textContent += ` (${this.isFeiertag(dateStr)})`;
        } else if (this.isRuhetag(dateStr)) {
            div.classList.add('ruhetag');
            dateDiv.textContent += ' (Ruhetag)';
        }

        div.appendChild(dateDiv);

        // Schichten-Container
        const shiftsDiv = document.createElement('div');
        shiftsDiv.className = 'shifts';
        div.appendChild(shiftsDiv);

        // Schichten anzeigen
        if (this.shifts[dateStr]) {
            // Sortiere Schichten: Shop Eingang zuerst, dann nach Position
            const sortedShifts = [...this.shifts[dateStr]].sort((a, b) => {
                if (a.position === 'shop') return -1;
                if (b.position === 'shop') return 1;
                return a.position.localeCompare(b.position);
            });

            sortedShifts.forEach(shift => {
                const shiftDiv = document.createElement('div');
                shiftDiv.className = `shift ${shift.position}`;
                shiftDiv.dataset.date = dateStr;
                shiftDiv.dataset.mitarbeiterId = shift.mitarbeiterId;
                shiftDiv.dataset.position = shift.position;
                
                const mitarbeiter = this.getMitarbeiterName(shift.mitarbeiterId);
                shiftDiv.textContent = `${this.getPositionName(shift.position)}: ${mitarbeiter}`;
                
                if (isKastellan) {
                    shiftDiv.draggable = true;
                }
                
                shiftsDiv.appendChild(shiftDiv);
            });
        }

        // Dienstanfragen anzeigen (nur für Kastellan)
        if (isKastellan && this.shiftRequests[dateStr]) {
            const requestsDiv = document.createElement('div');
            requestsDiv.className = 'shift-requests';
            requestsDiv.innerHTML = '⏳ Dienstanfragen';
            div.appendChild(requestsDiv);
        }

        // Event-Listener für Dienstanfragen (für Mitarbeiter)
        if (!isKastellan && this.isInSaison(dateStr) && !this.isRuhetag(dateStr)) {
            div.addEventListener('click', () => this.showShiftRequestDialog(dateStr));
        }

        return div;
    }

    getPositionName(position) {
        const positions = {
            'shop': 'Shop Eingang',
            'shop_museum': 'Shop Museum',
            'kasse': 'Kasse',
            'fuehrung': 'Führung'
        };
        return positions[position] || position;
    }

    getMitarbeiterName(id) {
        const mitarbeiter = JSON.parse(localStorage.getItem('mitarbeiter')) || [];
        const found = mitarbeiter.find(m => m.id === id);
        return found ? found.name : 'Unbekannt';
    }

    prevMonth() {
        const newDate = new Date(this.selectedDate);
        newDate.setMonth(newDate.getMonth() - 1);
        this.selectedDate = newDate;
        this.renderCalendar();
    }

    nextMonth() {
        const newDate = new Date(this.selectedDate);
        newDate.setMonth(newDate.getMonth() + 1);
        this.selectedDate = newDate;
        this.renderCalendar();
    }

    createEmptyDay() {
        const div = document.createElement('div');
        div.className = 'calendar-day empty';
        return div;
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    window.dienstplan = new DienstplanManager();
});
