// Dienstplan-Funktionalität für Mitarbeiter

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
    function renderCalendar(date) {
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

        // Tage des vorherigen Monats
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

            dayElement.innerHTML = `<div class="day-number">${day}</div>`;

            // Dienste für diesen Tag laden
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dienste = getDiensteForDate(dateStr);
            
            dienste.forEach(dienst => {
                const dienstElement = document.createElement('div');
                dienstElement.className = `dienst ${dienst.status}`;
                dienstElement.innerHTML = `
                    <strong>${dienst.position}</strong>
                    <span class="status-badge ${dienst.status}">${dienst.status}</span>
                `;
                dayElement.appendChild(dienstElement);
            });

            calendarGrid.appendChild(dayElement);
        }

        // Tage des nächsten Monats
        const totalDays = calendarGrid.childElementCount;
        const remainingDays = 42 - totalDays; // 6 Wochen × 7 Tage = 42
        
        for (let i = 1; i <= remainingDays; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day other-month';
            dayElement.innerHTML = `<div class="day-number">${i}</div>`;
            calendarGrid.appendChild(dayElement);
        }
    }

    // Dienste für ein bestimmtes Datum laden
    function getDiensteForDate(date) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const dienstAnfragen = JSON.parse(localStorage.getItem('dienstAnfragen') || '[]');
        
        return dienstAnfragen.filter(dienst => 
            dienst.mitarbeiterId === currentUser.id && 
            dienst.datum === date
        );
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

    // Initialen Kalender rendern
    renderCalendar(currentDate);
});
