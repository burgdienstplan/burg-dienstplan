// Standardbenutzer
const defaultUsers = [
    {
        username: 'kastellan',
        password: 'burg2025',
        rolle: 'admin',
        vorname: 'Martin',
        nachname: 'Steindorfer'
    },
    {
        username: 'test',
        password: 'test',
        rolle: 'mitarbeiter',
        vorname: 'Test',
        nachname: 'Benutzer'
    }
];

// Initialisiere Benutzer
function initUsers() {
    // Immer die Standard-Benutzer neu setzen
    localStorage.setItem('users', JSON.stringify(defaultUsers));
}

// Login-Funktion
function login(username, password) {
    initUsers(); // Stelle sicher, dass die Benutzer immer verfügbar sind
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    }
    return false;
}

// Logout-Funktion
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Prüfe ob eingeloggt
function isLoggedIn() {
    return localStorage.getItem('currentUser') !== null;
}

// Hole aktuellen Benutzer
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

// Initialisiere beim Laden
initUsers();
