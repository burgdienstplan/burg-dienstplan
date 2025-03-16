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
        this.currentDate = new Date();
        this.selectedDate = new Date(2025, 3, 1); // Start der Saison
        this.positions = ['Shop Eingang', 'Shop Museum', 'Kasse', 'Führung'];
        this.loadData();
        this.initializeEventListeners();
    }

    loadData() {
        // Lade Schichten
        this.shifts = JSON.parse(localStorage.getItem('shifts')) || [];
        
        // Lade Feiertage
        this.feiertage = JSON.parse(localStorage.getItem('feiertage')) || [];
        
        // Lade Ruhetage
        this.ruhetage = JSON.parse(localStorage.getItem('ruhetage')) || [];
        
        // Lade Mitarbeiter
        const users = JSON.parse(localStorage.getItem('users')) || [];
        this.mitarbeiter = users.filter(user => user.aktiv);
    }

    saveData() {
        localStorage.setItem('shifts', JSON.stringify(this.shifts));
        localStorage.setItem('ruhetage', JSON.stringify(this.ruhetage));
    }

    initializeEventListeners() {
        // Monat Navigation
        document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));
        
        // Schicht Formular
        document.getElementById('shiftForm')?.addEventListener('submit', (e) => this.handleShiftSubmit(e));
        
        // Ruhetag Toggle
        document.getElementById('dienstplanGrid')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('ruhetag-toggle')) {
                this.toggleRuhetag(e.target.dataset.date);
            }
        });
    }

    changeMonth(delta) {
        this.selectedDate.setMonth(this.selectedDate.getMonth() + delta);
        this.renderDienstplan();
    }

    // Prüfe ob ein Datum in der Saison liegt (1. April - 1. November)
    isInSaison(date) {
        const year = date.getFullYear();
        const start = new Date(year, 3, 1); // 1. April
        const end = new Date(year, 10, 1); // 1. November
        return date >= start && date <= end;
    }

    // Prüfe ob ein Datum ein Feiertag ist
    isFeiertag(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.feiertage.some(f => f.datum === dateStr);
    }

    // Prüfe ob ein Datum ein Ruhetag ist
    isRuhetag(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.ruhetage.includes(dateStr);
    }

    // Toggle Ruhetag Status
    toggleRuhetag(dateStr) {
        const index = this.ruhetage.indexOf(dateStr);
        if (index === -1) {
            this.ruhetage.push(dateStr);
        } else {
            this.ruhetage.splice(index, 1);
        }
        this.saveData();
        this.renderDienstplan();
    }

    // Hole Schichten für ein Datum
    getShiftsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.shifts.filter(s => s.datum === dateStr);
    }

    // Füge neue Schicht hinzu
    addShift(date, mitarbeiterId, position) {
        const shift = {
            id: crypto.randomUUID(),
            datum: date.toISOString().split('T')[0],
            mitarbeiterId,
            position
        };
        this.shifts.push(shift);
        this.saveData();
    }

    // Lösche Schicht
    deleteShift(shiftId) {
        this.shifts = this.shifts.filter(s => s.id !== shiftId);
        this.saveData();
    }

    // Handle Schicht Formular Submit
    handleShiftSubmit(event) {
        event.preventDefault();
        const date = new Date(document.getElementById('shiftDate').value);
        const mitarbeiterId = document.getElementById('mitarbeiter').value;
        const position = document.getElementById('position').value;

        if (!this.isInSaison(date)) {
            alert('Datum liegt außerhalb der Saison (1. April - 1. November)');
            return;
        }

        if (this.isRuhetag(date)) {
            alert('An Ruhetagen können keine Schichten eingetragen werden');
            return;
        }

        this.addShift(date, mitarbeiterId, position);
        this.renderDienstplan();
        event.target.reset();
    }

    // Render Dienstplan
    renderDienstplan() {
        const grid = document.getElementById('dienstplanGrid');
        if (!grid) return;

        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Update Monat/Jahr Anzeige
        document.getElementById('currentMonth').textContent = 
            new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(this.selectedDate);

        // Leere Grid
        grid.innerHTML = '';

        // Füge Wochentage hinzu
        const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        weekdays.forEach(day => {
            const cell = document.createElement('div');
            cell.className = 'weekday';
            cell.textContent = day;
            grid.appendChild(cell);
        });

        // Fülle leere Tage am Anfang
        for (let i = 0; i < firstDay.getDay(); i++) {
            const cell = document.createElement('div');
            cell.className = 'day empty';
            grid.appendChild(cell);
        }

        // Füge Tage hinzu
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const cell = document.createElement('div');
            cell.className = 'day';

            // Prüfe Saison
            if (!this.isInSaison(date)) {
                cell.classList.add('off-season');
            }

            // Prüfe Feiertag
            if (this.isFeiertag(date)) {
                cell.classList.add('holiday');
                const feiertag = this.feiertage.find(f => f.datum === dateStr);
                cell.title = feiertag.name;
            }

            // Prüfe Ruhetag
            if (this.isRuhetag(date)) {
                cell.classList.add('ruhetag');
            }

            // Füge Datum hinzu
            const dateDiv = document.createElement('div');
            dateDiv.className = 'date';
            dateDiv.textContent = day;
            cell.appendChild(dateDiv);

            // Füge Ruhetag Toggle hinzu (nur für Admins)
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser?.rolle === 'admin' && this.isInSaison(date)) {
                const ruhetagBtn = document.createElement('button');
                ruhetagBtn.className = 'ruhetag-toggle';
                ruhetagBtn.textContent = this.isRuhetag(date) ? '🔴' : '⚪';
                ruhetagBtn.title = this.isRuhetag(date) ? 'Ruhetag aufheben' : 'Als Ruhetag markieren';
                ruhetagBtn.dataset.date = dateStr;
                cell.appendChild(ruhetagBtn);
            }

            // Füge Schichten hinzu
            const shifts = this.getShiftsForDate(date);
            if (shifts.length > 0) {
                const shiftsDiv = document.createElement('div');
                shiftsDiv.className = 'shifts';
                shifts.forEach(shift => {
                    const shiftDiv = document.createElement('div');
                    shiftDiv.className = 'shift';
                    const mitarbeiter = this.mitarbeiter.find(m => m.id === shift.mitarbeiterId);
                    shiftDiv.textContent = `${shift.position}: ${mitarbeiter?.vorname || 'Unbekannt'}`;
                    
                    // Lösch-Button (nur für Admins)
                    if (currentUser?.rolle === 'admin') {
                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'delete-shift';
                        deleteBtn.textContent = '❌';
                        deleteBtn.onclick = () => {
                            this.deleteShift(shift.id);
                            this.renderDienstplan();
                        };
                        shiftDiv.appendChild(deleteBtn);
                    }
                    
                    shiftsDiv.appendChild(shiftDiv);
                });
                cell.appendChild(shiftsDiv);
            }

            grid.appendChild(cell);
        }
    }
}

// Initialisierung
const dienstplanManager = new DienstplanManager();
