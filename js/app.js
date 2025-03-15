// Konstanten
const STORAGE_KEYS = {
    USER: 'currentUser',
    STAFF: 'staff'
};

const ROLES = {
    ADMIN: 'kastellan',
    HAUSMEISTER: 'hausmeister',
    SHOP: 'shop',
    MUSEUMSFUEHRER: 'museumsfuehrer'
};

// Initial Admin-Account
const initializeAdmin = () => {
    const staff = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF)) || [];
    
    // Prüfen ob Admin existiert
    if (!staff.some(user => user.username === ROLES.ADMIN)) {
        staff.push({
            vorname: 'Kastellan',
            nachname: 'Admin',
            rolle: ROLES.ADMIN,
            username: ROLES.ADMIN,
            password: 'burg2025'
        });
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
    }
};

// Login Handler
const handleLogin = (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const staff = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF)) || [];
    const user = staff.find(u => u.username === username && u.password === password);
    
    if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        window.location.href = 'dashboard.html';
    } else {
        alert('Falscher Benutzername oder Passwort!');
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeAdmin();
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
});
