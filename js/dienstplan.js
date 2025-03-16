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
        this.shifts = JSON.parse(localStorage.getItem('shifts')) || {};
        this.holidays = JSON.parse(localStorage.getItem('holidays')) || {};
        this.urlaubsanfragen = JSON.parse(localStorage.getItem('urlaubsanfragen')) || [];
        this.fuehrungsvorschlaege = JSON.parse(localStorage.getItem('fuehrungsvorschlaege')) || [];
        this.ruhetage = JSON.parse(localStorage.getItem('ruhetage')) || [];
        
        this.initializeEventListeners();
        this.loadMitarbeiter();
        this.renderCalendar();
    }

    initializeEventListeners() {
        // Navigations-Listener
        document.getElementById('prevMonth').addEventListener('click', () => this.prevMonth());
        document.getElementById('nextMonth').addEventListener('click', () => this.nextMonth());
        
        // Admin-Funktionen
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user?.role === 'kastellan') {
            document.getElementById('adminControls').style.display = 'block';
            document.getElementById('addShift').addEventListener('click', () => this.addShift());
            document.getElementById('markRuhetag').addEventListener('click', () => this.markRuhetag());
        }

        // Mitarbeiter-spezifische Funktionen
        if (user?.role === 'museumsfuehrer') {
            document.getElementById('fuehrungControls').style.display = 'block';
        }
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

    addShift() {
        const mitarbeiterId = document.getElementById('mitarbeiter').value;
        const position = document.getElementById('position').value;
        const datum = document.getElementById('datum').value;

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

        const shifts = this.shifts[datum] || [];
        shifts.push({ mitarbeiterId, position });
        this.shifts[datum] = shifts;
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

    addUrlaubsanfrage(mitarbeiterId, startDatum, endDatum) {
        this.urlaubsanfragen.push({
            id: Date.now(),
            mitarbeiterId,
            startDatum,
            endDatum,
            status: 'pending'
        });
        localStorage.setItem('urlaubsanfragen', JSON.stringify(this.urlaubsanfragen));
    }

    addFuehrungsvorschlag(mitarbeiterId, datum, zeit) {
        this.fuehrungsvorschlaege.push({
            id: Date.now(),
            mitarbeiterId,
            datum,
            zeit,
            status: 'pending'
        });
        localStorage.setItem('fuehrungsvorschlaege', JSON.stringify(this.fuehrungsvorschlaege));
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

        // Verschiedene Zustände
        if (!this.isInSaison(date)) {
            div.classList.add('outside-season');
        }
        if (this.isFeiertag(dateStr)) {
            div.classList.add('holiday');
        }
        if (this.isRuhetag(dateStr)) {
            div.classList.add('ruhetag');
        }
        if (this.formatDate(new Date()) === dateStr) {
            div.classList.add('today');
        }

        // Tag und Info
        div.innerHTML = `
            <div class="day-header">
                ${date.getDate()}
                ${this.isFeiertag(dateStr) ? `<div class="holiday-name">${FEIERTAGE_2025[dateStr]}</div>` : ''}
                ${this.isRuhetag(dateStr) ? '<div class="ruhetag-marker">Ruhetag</div>' : ''}
            </div>
        `;

        // Schichten
        const shifts = this.shifts[dateStr] || [];
        const shiftsDiv = document.createElement('div');
        shiftsDiv.className = 'shifts';
        
        shifts.forEach(shift => {
            const mitarbeiter = this.getMitarbeiter(shift.mitarbeiterId);
            const shiftDiv = document.createElement('div');
            shiftDiv.className = `shift ${shift.position}`;
            shiftDiv.textContent = `${mitarbeiter?.name || 'Unbekannt'} (${this.getPositionName(shift.position)})`;
            shiftsDiv.appendChild(shiftDiv);
        });

        div.appendChild(shiftsDiv);
        return div;
    }

    getMitarbeiter(id) {
        const mitarbeiter = JSON.parse(localStorage.getItem('mitarbeiter')) || [];
        return mitarbeiter.find(m => m.id === id);
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

    prevMonth() {
        this.selectedDate.setMonth(this.selectedDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.selectedDate.setMonth(this.selectedDate.getMonth() + 1);
        this.renderCalendar();
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    const dienstplan = new DienstplanManager();
});
