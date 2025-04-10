class AdminDashboard {
    constructor() {
        this.checkAuth();
        this.bindEvents();
        this.loadContent();
        this.showSection('dienstplan'); // Zeige initial Dienstplan
    }

    checkAuth() {
        const user = JSON.parse(localStorage.getItem('aktuellerBenutzer'));
        if (!user || user.rolle !== CONFIG.ROLLEN.ADMIN) {
            window.location.href = '../index.html';
        }
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(link.dataset.section);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('aktuellerBenutzer');
            window.location.href = '../index.html';
        });
    }

    showSection(sectionId) {
        // Update active navigation
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionId);
        });

        // Show selected section
        document.querySelectorAll('main section').forEach(section => {
            section.classList.toggle('active', section.id === sectionId);
        });
    }

    loadContent() {
        // Lade offene Anfragen
        this.loadAnfragen();
    }

    loadAnfragen() {
        const dienstvorschlaege = JSON.parse(localStorage.getItem('dienstvorschlaege') || '[]')
            .filter(v => v.status === 'offen');
        const urlaubsanfragen = JSON.parse(localStorage.getItem('urlaubsanfragen') || '[]')
            .filter(a => a.status === 'offen');
        const fuehrungsablehnungen = JSON.parse(localStorage.getItem('fuehrungen') || '[]')
            .filter(f => f.status === 'abgelehnt');

        const anzahlAnfragen = dienstvorschlaege.length + urlaubsanfragen.length + fuehrungsablehnungen.length;
        document.getElementById('anfragenBadge').textContent = anzahlAnfragen;
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});
