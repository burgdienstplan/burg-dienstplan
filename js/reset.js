// Storage zurücksetzen
localStorage.clear();

// Initiale Daten setzen
const staff = [{
    vorname: 'Kastellan',
    nachname: 'Admin',
    rolle: 'kastellan',
    username: 'kastellan',
    password: 'burg2025'
}];

localStorage.setItem('staff', JSON.stringify(staff));
