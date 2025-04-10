class MitarbeiterDienstplan {
    constructor() {
        this.currentDate = new Date();
        this.user = JSON.parse(localStorage.getItem('aktuellerBenutzer'));
        this.dienste = JSON.parse(localStorage.getItem('dienste') || '{}');
        this.initializeCalendar();
        this.bindEvents();
        this.startAutoRefresh();
    }

    initializeCalendar() {
        const calendar = document.getElementById('dienstplanKalender');
        if (!calendar) return;

        // Aktualisiere Monatsanzeige
        document.getElementById('currentMonth').textContent = this.formatMonth(this.currentDate);

        calendar.innerHTML = this.generateCalendarHTML();
        this.loadDienste();
    }

    generateCalendarHTML() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        let html = `
            <div class="calendar-header">
                <div>Mo</div><div>Di</div><div>Mi</div><div>Do</div>
                <div>Fr</div><div>Sa</div><div>So</div>
            </div>
            <div class="calendar-body">
        `;

        // Leere Zellen für Tage vor Monatsbeginn
        let firstDayOfWeek = firstDay.getDay() || 7;
        for (let i = 1; i < firstDayOfWeek; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Kalendertage
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateString = this.formatDate(date);
            const isFeiertag = this.isFeiertag(dateString);
            const isInSaison = this.isInSaison(dateString);
            
            html += `
                <div class="calendar-day ${isFeiertag ? 'feiertag' : ''} ${!isInSaison ? 'ausser-saison' : ''}"
                     data-date="${dateString}">
                    <div class="day-header">
                        <span class="day-number">${day}</span>
                        ${isFeiertag ? `<span class="feiertag-name">${this.getFeiertag(dateString)}</span>` : ''}
                    </div>
                    <div class="dienst-info"></div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    loadDienste() {
        const monthKey = this.formatDate(this.currentDate).substring(0, 7); // YYYY-MM
        const monthDienste = this.dienste[monthKey] || {};

        Object.entries(monthDienste).forEach(([date, dienste]) => {
            const dayElement = document.querySelector(`.calendar-day[data-date="${date}"]`);
            if (!dayElement) return;

            const dienstInfo = dayElement.querySelector('.dienst-info');
            Object.entries(dienste).forEach(([position, mitarbeiter]) => {
                if (mitarbeiter === this.user.name) {
                    dienstInfo.innerHTML += `
                        <div class="dienst">
                            <i class="fas fa-clock"></i> ${this.formatPosition(position)}
                        </div>
                    `;
                    dayElement.classList.add('dienst');
                }
            });
        });
    }

    bindEvents() {
        // Monat wechseln
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.initializeCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.initializeCalendar();
        });
    }

    startAutoRefresh() {
        // Überwache Änderungen im localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'dienste' || e.key === 'einstellungen') {
                this.dienste = JSON.parse(localStorage.getItem('dienste') || '{}');
                this.initializeCalendar();
            }
        });

        // Regelmäßige Aktualisierung alle 30 Sekunden
        setInterval(() => {
            this.dienste = JSON.parse(localStorage.getItem('dienste') || '{}');
            this.initializeCalendar();
        }, 30000);
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    formatMonth(date) {
        return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    }

    formatPosition(position) {
        switch (position) {
            case CONFIG.POSITIONEN.SHOP_EINTRITT:
                return 'Shop Eintritt';
            case CONFIG.POSITIONEN.MUSEUMS_SHOP:
                return 'Museums Shop';
            case CONFIG.POSITIONEN.EINTRITT_FUEHRUNGEN:
                return 'Eintritt Führungen';
            default:
                return position;
        }
    }

    isFeiertag(dateString) {
        return CONFIG.FEIERTAGE.some(f => f.datum === dateString);
    }

    getFeiertag(dateString) {
        const feiertag = CONFIG.FEIERTAGE.find(f => f.datum === dateString);
        return feiertag ? feiertag.name : '';
    }

    isInSaison(dateString) {
        return dateString >= CONFIG.SAISON.START && dateString <= CONFIG.SAISON.ENDE;
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    new MitarbeiterDienstplan();
});
