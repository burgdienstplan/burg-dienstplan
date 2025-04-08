document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardStats();
});

async function fetchDashboardStats() {
    try {
        const [shiftResponse, maintenanceResponse, employeeResponse] = await Promise.all([
            fetch('/api/schedule/next'),
            fetch('/api/maintenance/stats'),
            fetch('/api/employees/active')
        ]);

        const nextShift = await shiftResponse.json();
        const maintenance = await maintenanceResponse.json();
        const employees = await employeeResponse.json();

        updateDashboard(nextShift, maintenance, employees);
    } catch (error) {
        console.error('Fehler beim Laden der Dashboard-Daten:', error);
    }
}

function updateDashboard(shift, maintenance, employees) {
    // Nächste Schicht
    const nextShiftElement = document.getElementById('nextShift');
    if (shift && shift.date) {
        const date = new Date(shift.date);
        nextShiftElement.textContent = `${date.toLocaleDateString('de-DE')} - ${shift.employee.name}`;
    } else {
        nextShiftElement.textContent = 'Keine geplante Schicht';
    }

    // Wartungen
    const maintenanceElement = document.getElementById('maintenanceCount');
    if (maintenance) {
        maintenanceElement.textContent = `${maintenance.pending} ausstehend / ${maintenance.completed} abgeschlossen`;
    } else {
        maintenanceElement.textContent = 'Keine Daten verfügbar';
    }

    // Aktive Mitarbeiter
    const employeesElement = document.getElementById('activeEmployees');
    if (employees) {
        employeesElement.textContent = employees.count;
    } else {
        employeesElement.textContent = 'Keine Daten verfügbar';
    }
}
