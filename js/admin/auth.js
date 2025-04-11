// Admin-Authentifizierung

document.addEventListener('DOMContentLoaded', () => {
    // Prüfe ob Benutzer eingeloggt ist
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.rolle !== 'admin') {
        window.location.href = '../index.html';
        return;
    }

    // Setze Benutzername
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = currentUser.name;
    }
});

// Logout-Funktion
window.logout = function() {
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
};
