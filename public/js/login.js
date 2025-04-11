// Login-System

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    // Debug: Zeige gespeicherte Benutzer
    console.log('Gespeicherte Benutzer:', localStorage.getItem('users'));
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const benutzername = document.getElementById('benutzername').value;
            const passwort = document.getElementById('passwort').value;
            
            // Debug: Zeige Login-Versuch
            console.log('Login-Versuch:', { benutzername, passwort });
            
            // Benutzer aus localStorage laden
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            console.log('Gefundene Benutzer:', users);
            
            const user = users.find(u => u.benutzername === benutzername && u.passwort === passwort);
            
            if (user) {
                // Login erfolgreich
                console.log('Login erfolgreich:', user);
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                // Weiterleitung basierend auf Rolle
                if (user.rolle === 'admin') {
                    window.location.href = '/admin/index.html';
                } else if (user.rolle === 'hausmeister') {
                    window.location.href = '/hausmeister/index.html';
                } else {
                    window.location.href = '/mitarbeiter/index.html';
                }
            } else {
                // Login fehlgeschlagen
                console.log('Login fehlgeschlagen');
                alert('Falscher Benutzername oder Passwort');
            }
        });
    }
});

// Logout-Funktion (wird von anderen Seiten aufgerufen)
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/index.html';
}
