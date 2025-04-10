// Navigation Handler
document.addEventListener('DOMContentLoaded', () => {
    // Prüfe ob Benutzer eingeloggt ist
    const user = JSON.parse(localStorage.getItem('aktuellerBenutzer'));
    if (!user || user.rolle !== CONFIG.ROLLEN.ADMIN) {
        window.location.href = '../index.html';
        return;
    }

    // Navigation
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const sections = document.querySelectorAll('main section');

    // Initial state - show first section
    if (sections.length > 0) {
        sections[0].classList.add('active');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Aktiven Link ändern
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Aktive Section ändern
            const targetSection = link.getAttribute('data-section');
            sections.forEach(section => {
                if (section.id === targetSection) {
                    section.style.display = 'block';
                    section.classList.add('active');
                } else {
                    section.style.display = 'none';
                    section.classList.remove('active');
                }
            });

            // Aktualisiere den Kalender wenn der Dienstplan angezeigt wird
            if (targetSection === 'dienstplan' && window.renderKalender) {
                window.renderKalender();
            }
        });
    });

    // Logout Handler
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('aktuellerBenutzer');
        window.location.href = '../index.html';
    });
});
