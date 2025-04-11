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

        // Lade alle Dienste für den Monat
        const start = firstDay.toISOString().split('T')[0];
        const end = lastDay.toISOString().split('T')[0];
        const dienste = await getDiensteForMonth(start, end);

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
            
            let dienstHTML = '<div class="day-number">' + i + '</div>';
            
            if (tagDienste.length > 0) {
                dienstHTML += '<div class="dienste">';
                tagDienste.forEach(dienst => {
                    const statusClass = dienst.status === 'genehmigt' ? 'genehmigt' : 
                                    dienst.status === 'abgelehnt' ? 'abgelehnt' : 
                                    dienst.status === 'angefragt' ? 'angefragt' : '';
                    
                    dienstHTML += `
                        <div class="dienst ${statusClass}">
                            <span class="zeit">${dienst.schicht}</span>
                            <span class="position">${dienst.position}</span>
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
