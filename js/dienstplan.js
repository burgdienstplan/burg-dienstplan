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

// Burg Hochosterwitz Dienstplan - Version 2025.2
// Letzte Aktualisierung: 16.03.2025

class DienstplanManager {
    constructor() {
        this.db = new Database();
        this.currentDate = new Date();
        this.selectedDate = new Date(2025, 3, 1); // Start mit 1. April 2025
        this.positions = [
            { id: 'shop_eingang', name: 'Shop Eingang', required: true },
            { id: 'shop_museum', name: 'Shop Museum', required: false },
            { id: 'kasse', name: 'Kasse', required: false },
            { id: 'fuehrung', name: 'Führung', required: false }
        ];
        this.initializeEventListeners();
        this.loadDienstplan();
    }

    async initializeEventListeners() {
        // Kalender-Navigation
        document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));
        
        // Schicht-Verwaltung
        document.getElementById('addShiftForm')?.addEventListener('submit', (e) => this.handleAddShift(e));
        
        // Drag & Drop für Schichten
        this.initializeDragAndDrop();
    }

    initializeDragAndDrop() {
        const cells = document.querySelectorAll('.shift-cell');
        cells.forEach(cell => {
            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                cell.classList.add('dragover');
            });

            cell.addEventListener('dragleave', () => {
                cell.classList.remove('dragover');
            });

            cell.addEventListener('drop', async (e) => {
                e.preventDefault();
                cell.classList.remove('dragover');
                
                const shiftId = e.dataTransfer.getData('text/plain');
                const targetDate = cell.dataset.date;
                const targetPosition = cell.dataset.position;
                
                await this.moveShift(shiftId, targetDate, targetPosition);
            });
        });

        const shifts = document.querySelectorAll('.shift');
        shifts.forEach(shift => {
            shift.setAttribute('draggable', true);
            shift.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', shift.dataset.shiftId);
            });
        });
    }

    async handleAddShift(event) {
        event.preventDefault();
        const date = document.getElementById('shiftDate').value;
        const position = document.getElementById('shiftPosition').value;
        const mitarbeiterId = document.getElementById('shiftMitarbeiter').value;

        if (!this.validateShiftDate(date)) return;

        try {
            await this.db.addShift({
                datum: date,
                position: position,
                mitarbeiterId: mitarbeiterId
            });

            this.showNotification('Schicht erfolgreich hinzugefügt', 'success');
            this.loadDienstplan();
            event.target.reset();
        } catch (error) {
            this.showNotification('Fehler beim Hinzufügen der Schicht', 'error');
            console.error('Fehler:', error);
        }
    }

    validateShiftDate(date) {
        const shiftDate = new Date(date);
        const saisonStart = new Date(2025, 3, 1); // 1. April
        const saisonEnde = new Date(2025, 10, 1); // 1. November

        if (shiftDate < saisonStart || shiftDate > saisonEnde) {
            this.showNotification('Schichten müssen innerhalb der Saison (1. April - 1. November) liegen', 'error');
            return false;
        }

        return true;
    }

    async moveShift(shiftId, targetDate, targetPosition) {
        if (!this.validateShiftDate(targetDate)) return;

        try {
            await this.db.updateShift(shiftId, {
                datum: targetDate,
                position: targetPosition
            });

            this.showNotification('Schicht erfolgreich verschoben', 'success');
            this.loadDienstplan();
        } catch (error) {
            this.showNotification('Fehler beim Verschieben der Schicht', 'error');
            console.error('Fehler:', error);
        }
    }

    async loadDienstplan() {
        const calendar = document.getElementById('dienstplanCalendar');
        if (!calendar) return;

        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Hole alle relevanten Daten
        const shifts = await this.db.getShifts(firstDay.toISOString(), lastDay.toISOString());
        const mitarbeiter = await this.db.getMitarbeiter();
        const urlaube = await this.db.getUrlaubsanfragen();
        const feiertage = await this.db.getFeiertage();

        // Erstelle Kalender-Header
        let html = this.createCalendarHeader();

        // Erstelle Kalender-Body
        html += '<div class="calendar-body">';
        
        for (let day = new Date(firstDay); day <= lastDay; day.setDate(day.getDate() + 1)) {
            const dateStr = day.toISOString().split('T')[0];
            const dayShifts = shifts.filter(s => s.datum === dateStr);
            const dayUrlaube = urlaube.filter(u => 
                u.status === 'approved' &&
                new Date(u.startDatum) <= day &&
                new Date(u.endDatum) >= day
            );
            const isFeiertagOrRuhetag = this.isFeiertagOrRuhetag(day, feiertage);

            html += this.createDayCell(day, dayShifts, dayUrlaube, isFeiertagOrRuhetag, mitarbeiter);
        }

        html += '</div>';
        calendar.innerHTML = html;

        // Initialisiere Drag & Drop nach dem Rendern
        this.initializeDragAndDrop();
    }

    createCalendarHeader() {
        const monthNames = [
            'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
            'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
        ];

        return `
            <div class="calendar-header">
                <button id="prevMonth">&lt;</button>
                <h2>${monthNames[this.selectedDate.getMonth()]} ${this.selectedDate.getFullYear()}</h2>
                <button id="nextMonth">&gt;</button>
            </div>
            <div class="positions-header">
                <div class="date-column">Datum</div>
                ${this.positions.map(pos => `
                    <div class="position-column">
                        ${pos.name}
                        ${pos.required ? '<span class="required-badge">Pflicht</span>' : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    createDayCell(day, shifts, urlaube, isFeiertagOrRuhetag, mitarbeiter) {
        const dateStr = day.toISOString().split('T')[0];
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const cellClass = isFeiertagOrRuhetag ? 'feiertag' : isWeekend ? 'weekend' : '';

        let html = `
            <div class="calendar-row ${cellClass}">
                <div class="date-cell">
                    <span class="date">${day.getDate()}</span>
                    <span class="day">${this.getDayName(day)}</span>
                    ${isFeiertagOrRuhetag ? `<span class="tag">${isFeiertagOrRuhetag}</span>` : ''}
                </div>
        `;

        // Füge Zellen für jede Position hinzu
        this.positions.forEach(position => {
            const positionShifts = shifts.filter(s => s.position === position.id);
            const urlaubeHtml = this.createUrlaubeHtml(urlaube, mitarbeiter);

            html += `
                <div class="shift-cell" data-date="${dateStr}" data-position="${position.id}">
                    ${positionShifts.map(shift => {
                        const mitarbeiter = mitarbeiter.find(m => m.id === shift.mitarbeiterId);
                        return `
                            <div class="shift" data-shift-id="${shift.id}" draggable="true">
                                <span class="mitarbeiter-name">${mitarbeiter?.vorname} ${mitarbeiter?.nachname}</span>
                                <button class="delete-shift" onclick="dienstplanManager.deleteShift('${shift.id}')">×</button>
                            </div>
                        `;
                    }).join('')}
                    ${urlaubeHtml}
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    createUrlaubeHtml(urlaube, mitarbeiter) {
        if (!urlaube.length) return '';

        return `
            <div class="urlaube-info">
                ${urlaube.map(urlaub => {
                    const mitarbeiter = mitarbeiter.find(m => m.id === urlaub.mitarbeiterId);
                    return `<span class="urlaub-tag">${mitarbeiter?.vorname} ${mitarbeiter?.nachname} (Urlaub)</span>`;
                }).join('')}
            </div>
        `;
    }

    async deleteShift(shiftId) {
        try {
            await this.db.deleteShift(shiftId);
            this.showNotification('Schicht erfolgreich gelöscht', 'success');
            this.loadDienstplan();
        } catch (error) {
            this.showNotification('Fehler beim Löschen der Schicht', 'error');
            console.error('Fehler:', error);
        }
    }

    changeMonth(delta) {
        this.selectedDate.setMonth(this.selectedDate.getMonth() + delta);
        this.loadDienstplan();
    }

    getDayName(date) {
        const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        return days[date.getDay()];
    }

    isFeiertagOrRuhetag(date, feiertage) {
        const dateStr = date.toISOString().split('T')[0];
        const feiertag = feiertage.find(f => f.datum === dateStr);
        return feiertag ? feiertag.name : '';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const container = document.querySelector('.content');
        container.insertBefore(notification, container.firstChild);
        
        setTimeout(() => notification.remove(), 3000);
    }
}

// Initialisierung
const dienstplanManager = new DienstplanManager();
