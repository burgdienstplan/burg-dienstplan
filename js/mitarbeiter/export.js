class DienstplanExport {
    constructor() {
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportMeineDienste();
        });
    }

    exportMeineDienste() {
        const user = JSON.parse(localStorage.getItem('aktuellerBenutzer'));
        if (!user) return;

        const dienste = JSON.parse(localStorage.getItem('dienste') || '{}');
        const today = new Date();
        const year = today.getFullYear();
        
        let csv = 'Datum;Tag;Position\n';
        
        // Gehe durch alle Monate
        for (let month = 0; month < 12; month++) {
            const date = new Date(year, month, 1);
            const monthKey = date.toISOString().substring(0, 7);
            const monthDienste = dienste[monthKey] || {};

            // Finde alle Dienste des Mitarbeiters
            Object.entries(monthDienste).sort().forEach(([date, dienste]) => {
                const dateObj = new Date(date);
                const day = dateObj.toLocaleDateString('de-DE', { weekday: 'long' });
                
                Object.entries(dienste).forEach(([position, mitarbeiter]) => {
                    if (mitarbeiter === user.benutzername) {
                        csv += `${date};${day};${position}\n`;
                    }
                });
            });
        }

        // Erstelle Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `meine_dienste_${user.benutzername}_${today.toISOString().substring(0, 10)}.csv`;
        link.click();
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    new DienstplanExport();
});
