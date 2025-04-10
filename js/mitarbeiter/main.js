class MitarbeiterDashboard {
    constructor() {
        this.checkAuth();
        this.bindEvents();
        this.loadUserInfo();
        this.showSection('dienstplan'); // Initial Dienstplan anzeigen
    }

    checkAuth() {
        const user = JSON.parse(localStorage.getItem('aktuellerBenutzer'));
        if (!user || user.rolle === CONFIG.ROLLEN.ADMIN) {
            window.location.href = '../index.html';
        }
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-menu li').forEach(item => {
            item.addEventListener('click', () => {
                this.showSection(item.dataset.section);
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
        document.querySelectorAll('.nav-menu li').forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionId);
        });

        // Show selected section
        document.querySelectorAll('main section').forEach(section => {
            section.classList.toggle('hidden', section.id !== sectionId);
        });

        // Aktualisiere Inhalte wenn nötig
        switch(sectionId) {
            case 'dienstplan':
                if (window.dienstplanKalender) {
                    window.dienstplanKalender.render();
                }
                break;
            case 'vorschlaege':
                if (window.vorschlaege) {
                    window.vorschlaege.loadVorschlaege();
                }
                break;
            case 'urlaub':
                if (window.urlaub) {
                    window.urlaub.loadUrlaub();
                }
                break;
        }
    }

    loadUserInfo() {
        const user = JSON.parse(localStorage.getItem('aktuellerBenutzer'));
        document.getElementById('userName').textContent = user.name;
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    new MitarbeiterDashboard();
});
