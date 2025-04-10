// Prüfe ob Benutzer angemeldet ist
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Wenn kein Benutzer angemeldet ist oder kein Admin
    if (!user.id || user.rolle !== 'admin') {
        // Zurück zur Login-Seite
        window.location.href = '../index.html';
        return;
    }
}

// Prüfe Auth beim Laden
window.onload = checkAuth;

// Logout-Button
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
});
