// DEBUG: Zeige localStorage Status
console.log('localStorage Status:');
console.log('Alle Mitarbeiter:', JSON.parse(localStorage.getItem('mitarbeiter') || '[]'));
console.log('Aktueller Benutzer:', JSON.parse(localStorage.getItem('currentUser') || '{}'));

// Safari localStorage Test
try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('localStorage funktioniert');
} catch (e) {
    console.error('localStorage Fehler:', e);
}

// Erstelle Admin-Account falls noch nicht vorhanden
try {
    const admin = {
        id: '1',
        name: 'Administrator',
        benutzername: 'admin',
        passwort: 'admin123',
        rolle: 'admin'
    };

    // Immer den Admin neu setzen
    localStorage.setItem('mitarbeiter', JSON.stringify([admin]));
} catch (e) {
    console.error('Fehler beim Speichern:', e);
}

// Login-Formular Handler
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Prüfe ob Mitarbeiter existiert
    const mitarbeiter = JSON.parse(localStorage.getItem('mitarbeiter') || '[]');
    const user = mitarbeiter.find(u => u.benutzername === username && u.passwort === password);
    
    if (user) {
        // Speichere angemeldeten Benutzer
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Weiterleitung basierend auf Rolle
        if (user.rolle === 'admin') {
            window.location.href = 'admin/index.html';
        } else {
            window.location.href = 'mitarbeiter/index.html';
        }
    } else {
        alert('Ungültiger Benutzername oder Passwort');
    }
});
