// Authentifizierung für das Mitarbeiter-Dashboard

document.addEventListener('DOMContentLoaded', () => {
    // Prüfe ob Benutzer eingeloggt ist
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        // Nicht eingeloggt -> zurück zur Login-Seite
        window.location.href = '/';
        return;
    }

    if (currentUser.rolle !== 'mitarbeiter') {
        // Kein Mitarbeiter -> zurück zur Login-Seite
        localStorage.removeItem('currentUser');
        window.location.href = '/';
        return;
    }

    // Zeige Benutzername an
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = currentUser.name;
    }
});

// Abmelden
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
}
