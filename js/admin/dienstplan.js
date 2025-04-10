class Dienstplan {
    constructor() {
        this.currentDate = new Date();
        this.dienste = JSON.parse(localStorage.getItem('dienste') || '{}');
        this.initializeCalendar();
        this.bindEvents();
    }

    initializeCalendar() {
        const calendar = document.getElementById('dienstplanKalender');
        if (!calendar) return;

        // Legende hinzufügen
        const legend = document.createElement('div');
        legend.className = 'position-legend';
        legend.innerHTML = Object.entries(CONFIG.POSITIONS_COLORS).map(([position, color]) => `
            <div class="legend-item">
                <span class="color-dot" style="background-color: ${color}"></span>
                <span class="position-name">${position}</span>
            </div>
        `).join('');
        
        calendar.parentElement.insertBefore(legend, calendar);

        document.getElementById('currentMonth').textContent = this.formatMonth(this.currentDate);
        this.renderCalendar();
    }

    renderCalendar() {
        const calendar = document.getElementById('dienstplanKalender');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        let html = `
            <div class="calendar-header">
                <div>Mo</div><div>Di</div><div>Mi</div><div>Do</div>
                <div>Fr</div><div>Sa</div><div>So</div>
            </div>
            <div class="calendar-body">
        `;

        // Erster und letzter Tag des Monats
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Berechne den Wochentag des ersten Tags (0 = Sonntag)
        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;

        // Füge leere Tage am Anfang ein
        let currentRow = '<div class="calendar-row">';
        for (let i = 0; i < startDay; i++) {
            currentRow += '<div class="calendar-day empty"></div>';
        }

        // Füge die Tage des Monats ein
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateString = this.formatDate(date);
            const isToday = this.isToday(date);

            if ((startDay + day - 1) % 7 === 0 && day !== 1) {
                html += currentRow + '</div>';
                currentRow = '<div class="calendar-row">';
            }

            const dienste = this.getDienste(dateString);
            let diensteHtml = '';
            
            if (dienste) {
                diensteHtml = Object.entries(dienste).map(([position, mitarbeiter]) => {
                    const color = CONFIG.POSITIONS_COLORS[position] || '#999';
                    return `
                        <div class="dienst" style="border-left: 4px solid ${color}">
                            <span class="mitarbeiter">${mitarbeiter}</span>
                            <div class="dienst-menu">
                                <i class="fas fa-ellipsis-v" onclick="event.stopPropagation(); this.nextElementSibling.classList.toggle('active')"></i>
                                <div class="dienst-menu-options">
                                    <button onclick="event.stopPropagation(); dienstplan.editDienst('${dateString}', '${position}')">
                                        <i class="fas fa-edit"></i> Bearbeiten
                                    </button>
                                    <button class="delete-dienst" onclick="event.stopPropagation(); dienstplan.deleteDienst('${dateString}', '${position}')">
                                        <i class="fas fa-trash"></i> Löschen
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            const dayClasses = ['calendar-day'];
            if (isToday) dayClasses.push('today');

            currentRow += `
                <div class="${dayClasses.join(' ')}" onclick="dienstplan.openDienstModal('${dateString}')">
                    <div class="day-header">
                        <span class="day-number">${day}</span>
                    </div>
                    <div class="dienste">
                        ${diensteHtml}
                    </div>
                    <div class="add-dienst">
                        <i class="fas fa-plus"></i>
                    </div>
                </div>
            `;
        }

        // Fülle die letzte Reihe mit leeren Tagen
        const remainingDays = 7 - ((startDay + lastDay.getDate()) % 7);
        if (remainingDays < 7) {
            for (let i = 0; i < remainingDays; i++) {
                currentRow += '<div class="calendar-day empty"></div>';
            }
        }

        html += currentRow + '</div></div>';
        calendar.innerHTML = html;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatMonth(date) {
        const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                       'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    getDienste(dateString) {
        const [year, month] = dateString.split('-');
        return this.dienste[`${year}-${month}`]?.[dateString] || null;
    }

    openDienstModal(dateString) {
        const modal = document.getElementById('dienstModal');
        modal.style.display = 'block';
        modal.dataset.date = dateString;

        // Position Select
        const positionSelect = document.getElementById('position');
        positionSelect.innerHTML = `
            <option value="">Bitte wählen...</option>
            ${Object.values(CONFIG.POSITIONEN).map(pos => 
                `<option value="${pos}">${pos}</option>`
            ).join('')}
        `;

        // Mitarbeiter Select
        const mitarbeiterSelect = document.getElementById('mitarbeiter');
        const mitarbeiter = JSON.parse(localStorage.getItem('mitarbeiter') || '[]');
        mitarbeiterSelect.innerHTML = `
            <option value="">Bitte wählen...</option>
            ${mitarbeiter.filter(m => m.rolle !== 'admin').map(m => 
                `<option value="${m.name}">${m.name}</option>`
            ).join('')}
        `;

        // Vorhandene Dienste laden
        const dienste = this.getDienste(dateString);
        if (dienste) {
            const position = Object.keys(dienste)[0];
            const mitarbeiter = dienste[position];
            
            positionSelect.value = position;
            mitarbeiterSelect.value = mitarbeiter;
        }
    }

    bindEvents() {
        // X-Button zum Schließen
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.onclick = () => {
                const modal = document.getElementById('dienstModal');
                document.getElementById('dienstForm').reset();
                modal.style.display = 'none';
            };
        });

        // Abbrechen-Button im Formular
        document.getElementById('dienstForm').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-secondary')) {
                e.preventDefault();
                const modal = document.getElementById('dienstModal');
                document.getElementById('dienstForm').reset();
                modal.style.display = 'none';
            }
        });

        // Wenn man außerhalb des Modals klickt
        window.onclick = (e) => {
            const modal = document.getElementById('dienstModal');
            if (e.target === modal) {
                document.getElementById('dienstForm').reset();
                modal.style.display = 'none';
            }
        };

        // Dienst speichern
        document.getElementById('dienstForm').onsubmit = (e) => {
            e.preventDefault();
            const modal = document.getElementById('dienstModal');
            const dateString = modal.dataset.date;
            const [year, month] = dateString.split('-');
            const yearMonth = `${year}-${month}`;

            const position = document.getElementById('position').value;
            const mitarbeiter = document.getElementById('mitarbeiter').value;

            if (!position || !mitarbeiter) {
                alert('Bitte wählen Sie Position und Mitarbeiter aus.');
                return;
            }

            if (!this.dienste[yearMonth]) {
                this.dienste[yearMonth] = {};
            }
            if (!this.dienste[yearMonth][dateString]) {
                this.dienste[yearMonth][dateString] = {};
            }

            this.dienste[yearMonth][dateString][position] = mitarbeiter;
            localStorage.setItem('dienste', JSON.stringify(this.dienste));

            document.getElementById('dienstForm').reset();
            modal.style.display = 'none';
            this.renderCalendar();
        };

        // Navigation
        document.getElementById('prevMonth').onclick = () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            document.getElementById('currentMonth').textContent = this.formatMonth(this.currentDate);
            this.renderCalendar();
        };

        document.getElementById('nextMonth').onclick = () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            document.getElementById('currentMonth').textContent = this.formatMonth(this.currentDate);
            this.renderCalendar();
        };
    }

    editDienst(dateString, position) {
        this.openDienstModal(dateString);
        document.getElementById('position').value = position;
        
        const [year, month] = dateString.split('-');
        const dienst = this.dienste[`${year}-${month}`]?.[dateString]?.[position];
        if (dienst) {
            document.getElementById('mitarbeiter').value = dienst;
        }
    }

    deleteDienst(dateString, position) {
        if (!confirm('Möchten Sie diesen Dienst wirklich löschen?')) return;

        const [year, month] = dateString.split('-');
        const yearMonth = `${year}-${month}`;

        if (this.dienste[yearMonth]?.[dateString]?.[position]) {
            delete this.dienste[yearMonth][dateString][position];
            
            // Aufräumen
            if (Object.keys(this.dienste[yearMonth][dateString]).length === 0) {
                delete this.dienste[yearMonth][dateString];
            }
            if (Object.keys(this.dienste[yearMonth]).length === 0) {
                delete this.dienste[yearMonth];
            }

            localStorage.setItem('dienste', JSON.stringify(this.dienste));
            this.renderCalendar();
        }
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    window.dienstplan = new Dienstplan();
});
