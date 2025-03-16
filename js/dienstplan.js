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
        this.selectedDate = new Date();
        this.shifts = this.initializeDemoShifts();
        this.shiftRequests = JSON.parse(localStorage.getItem('shiftRequests')) || {};
        this.holidays = JSON.parse(localStorage.getItem('holidays')) || {};
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

    isInSaison(date) {
        const d = new Date(date);
        const start = new Date(SAISON.start);
        const end = new Date(SAISON.end);
        return d >= start && d <= end;
    }

    isFeiertag(dateStr) {
        return FEIERTAGE_2025[dateStr];
    }

    isRuhetag(dateStr) {
        return this.ruhetage.includes(dateStr);
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
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
        const month = this.selectedDate.getMonth();
        const year = this.selectedDate.getFullYear();
        
        document.getElementById('currentMonth').textContent = 
            new Date(year, month).toLocaleString('de-DE', { month: 'long', year: 'numeric' });

        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';

        // Wochentage
        const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        weekdays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendar.appendChild(dayHeader);
        });

        // Tage
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Leere Tage am Anfang
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendar.appendChild(this.createEmptyDay());
        }

        // Kalendertage
        for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
            calendar.appendChild(this.createDayElement(new Date(date)));
        }
    }

    createDayElement(date) {
        const dateStr = this.formatDate(date);
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.dataset.date = dateStr;
        
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const isKastellan = user?.role === 'kastellan';

        // Datum-Header
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = date.getDate();
        div.appendChild(header);

        // Verschiedene Zustände
        if (!this.isInSaison(date)) {
            div.classList.add('outside-season');
        } else {
            // Klickbar für Dienstanfragen (nur für Mitarbeiter)
            if (!isKastellan && this.isInSaison(date)) {
                div.style.cursor = 'pointer';
                div.onclick = () => this.showShiftRequestDialog(dateStr);
            }
        }

        if (this.isFeiertag(dateStr)) {
            div.classList.add('holiday');
            const holiday = document.createElement('div');
            holiday.className = 'holiday-name';
            holiday.textContent = this.isFeiertag(dateStr);
            div.appendChild(holiday);
        }

        if (this.isRuhetag(dateStr)) {
            div.classList.add('ruhetag');
            const ruhetag = document.createElement('div');
            ruhetag.className = 'ruhetag-marker';
            ruhetag.textContent = 'Ruhetag';
            div.appendChild(ruhetag);
        }

        // Schichten anzeigen
        const shiftsDiv = document.createElement('div');
        shiftsDiv.className = 'shifts';
        
        // Genehmigte Schichten
        if (this.shifts[dateStr]) {
            this.shifts[dateStr].forEach(shift => {
                const shiftDiv = document.createElement('div');
                shiftDiv.className = `shift ${shift.position}`;
                shiftDiv.dataset.date = dateStr;
                shiftDiv.dataset.mitarbeiterId = shift.mitarbeiterId;
                shiftDiv.dataset.position = shift.position;
                const mitarbeiter = this.getMitarbeiterName(shift.mitarbeiterId);
                shiftDiv.textContent = `${this.getPositionName(shift.position)}: ${mitarbeiter}`;
                shiftDiv.draggable = true;
                shiftsDiv.appendChild(shiftDiv);
            });
        }

        // Ausstehende Anfragen (nur für Kastellan sichtbar)
        if (isKastellan && this.shiftRequests[dateStr]) {
            this.shiftRequests[dateStr].forEach(request => {
                if (request.status === 'pending') {
                    const requestDiv = document.createElement('div');
                    requestDiv.className = 'shift-request pending';
                    requestDiv.textContent = `${request.mitarbeiterName} (${this.getPositionName(request.position)}) ⏳`;
                    shiftsDiv.appendChild(requestDiv);
                }
            });
        }

        div.appendChild(shiftsDiv);
        return div;
    }

    showShiftRequestDialog(date) {
        const positions = ['shop', 'shop_museum', 'kasse', 'fuehrung'];
        const dialog = document.createElement('div');
        dialog.className = 'shift-request-dialog';
        dialog.innerHTML = `
            <h3>Dienst vorschlagen für ${new Date(date).toLocaleDateString('de-DE')}</h3>
            <select id="requestPosition">
                ${positions.map(pos => `<option value="${pos}">${this.getPositionName(pos)}</option>`).join('')}
            </select>
            <button onclick="dienstplan.requestShift('${date}', document.getElementById('requestPosition').value)">
                Anfragen
            </button>
            <button onclick="this.parentElement.remove()">Abbrechen</button>
        `;
        document.body.appendChild(dialog);
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
        this.selectedDate.setMonth(this.selectedDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.selectedDate.setMonth(this.selectedDate.getMonth() + 1);
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
