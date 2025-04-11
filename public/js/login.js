// Login-System

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const benutzername = document.getElementById('benutzername').value;
            const passwort = document.getElementById('passwort').value;
            
            try {
                // API-Login
                const response = await fetch('/.netlify/functions/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ benutzername, passwort })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Login erfolgreich
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    
                    // Weiterleitung basierend auf Rolle
                    if (data.user.rolle === 'admin') {
                        window.location.href = '/admin/index.html';
                    } else if (data.user.rolle === 'hausmeister') {
                        window.location.href = '/hausmeister/index.html';
                    } else {
                        window.location.href = '/mitarbeiter/index.html';
                    }
                } else {
                    // Login fehlgeschlagen
                    alert('Falscher Benutzername oder Passwort');
                }
            } catch (error) {
                console.error('Login-Fehler:', error);
                // Fallback auf localStorage wenn API nicht erreichbar
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const user = users.find(u => u.benutzername === benutzername && u.passwort === passwort);
                
                if (user) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    if (user.rolle === 'admin') {
                        window.location.href = '/admin/index.html';
                    } else if (user.rolle === 'hausmeister') {
                        window.location.href = '/hausmeister/index.html';
                    } else {
                        window.location.href = '/mitarbeiter/index.html';
                    }
                } else {
                    alert('Falscher Benutzername oder Passwort');
                }
            }
        });
    }
});

// Logout-Funktion
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/index.html';
}
