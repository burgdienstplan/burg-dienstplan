// Standard-Benutzer für das System

const defaultUsers = [
    {
        id: '1',
        name: 'Admin',
        benutzername: 'admin',
        passwort: 'admin123',
        rolle: 'admin'
    },
    {
        id: '2',
        name: 'Max Mustermann',
        benutzername: 'max',
        passwort: 'max123',
        rolle: 'mitarbeiter'
    },
    {
        id: '3',
        name: 'Hans Hausmeister',
        benutzername: 'hans',
        passwort: 'hans123',
        rolle: 'hausmeister'
    }
];

// Initialisiere Benutzer in localStorage, falls noch nicht vorhanden
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(defaultUsers));
}
