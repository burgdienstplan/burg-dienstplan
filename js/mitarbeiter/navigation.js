// Navigation für das Mitarbeiter-Dashboard

document.addEventListener('DOMContentLoaded', () => {
    // Event-Listener für Navigation
    const navLinks = document.querySelectorAll('.sidebar nav a');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Aktiven Link aktualisieren
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            link.parentElement.classList.add('active');
            
            // Aktive Section aktualisieren
            const targetId = link.getAttribute('href').substring(1) + '-section';
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });

            // URL-Hash aktualisieren
            history.pushState(null, null, link.getAttribute('href'));
        });
    });

    // Initialen Zustand basierend auf URL-Hash setzen
    const hash = window.location.hash || '#dienstplan';
    const activeLink = document.querySelector(`a[href="${hash}"]`);
    if (activeLink) {
        activeLink.click();
    }
});

// Modal-Funktionen
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Event-Listener für Modal-Schließen bei Klick außerhalb
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Öffnen der Modals
function openNewDienstAnfrageModal() {
    openModal('dienstAnfrageModal');
}

function openNewUrlaubsantragModal() {
    openModal('urlaubsantragModal');
}
