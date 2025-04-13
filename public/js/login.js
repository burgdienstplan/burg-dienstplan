document.addEventListener('DOMContentLoaded', () => {
    let pin = '';
    const maxVersuche = 3;
    let versuche = maxVersuche;
    const sperrzeit = 5; // Minuten
    let gesperrtBis = localStorage.getItem('gesperrtBis');

    // Prüfe ob der Benutzer gesperrt ist
    if (gesperrtBis && new Date(gesperrtBis) > new Date()) {
        zeigeSperrung();
    }

    // PIN-Pad Event Listener
    document.querySelectorAll('.pin-button').forEach(button => {
        button.addEventListener('click', () => {
            const value = button.dataset.value;

            // Wenn gesperrt, keine Eingabe erlauben
            if (gesperrtBis && new Date(gesperrtBis) > new Date()) {
                return;
            }

            if (value === 'clear') {
                pin = '';
                updatePinDisplay();
            } else if (value === 'enter') {
                if (pin.length === 4) {
                    login();
                }
            } else if (pin.length < 4) {
                pin += value;
                updatePinDisplay();
                if (pin.length === 4) {
                    login();
                }
            }
        });
    });

    // PIN-Display aktualisieren
    function updatePinDisplay() {
        const digits = document.querySelectorAll('.pin-digit');
        digits.forEach((digit, index) => {
            digit.classList.toggle('filled', index < pin.length);
        });
    }

    // Login-Funktion
    async function login() {
        try {
            const response = await fetch(`${window.config.API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pin })
            });

            const data = await response.json();

            if (response.ok) {
                // Login erfolgreich
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('userId', data.userId);
                
                // Zurücksetzen der Versuche
                versuche = maxVersuche;
                localStorage.removeItem('gesperrtBis');
                
                // Weiterleitung basierend auf Rolle
                if (data.role === 'admin') {
                    window.location.href = '/admin/';
                } else {
                    window.location.href = '/mitarbeiter/';
                }
            } else {
                // Login fehlgeschlagen
                versuche--;
                document.getElementById('versuche').textContent = versuche;
                document.getElementById('errorMessage').style.display = 'block';
                
                if (versuche <= 0) {
                    // Account sperren
                    const sperrBis = new Date(Date.now() + sperrzeit * 60000);
                    localStorage.setItem('gesperrtBis', sperrBis.toISOString());
                    zeigeSperrung();
                }
                
                // PIN zurücksetzen
                pin = '';
                updatePinDisplay();
            }
        } catch (error) {
            console.error('Login-Fehler:', error);
            document.getElementById('errorMessage').style.display = 'block';
            pin = '';
            updatePinDisplay();
        }
    }

    // Sperrung anzeigen
    function zeigeSperrung() {
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('lockoutMessage').style.display = 'block';
        
        // Timer für die Sperrzeit
        const updateTimer = () => {
            const jetzt = new Date();
            const sperrBis = new Date(localStorage.getItem('gesperrtBis'));
            const diffMinuten = Math.ceil((sperrBis - jetzt) / 60000);
            
            if (diffMinuten <= 0) {
                localStorage.removeItem('gesperrtBis');
                document.getElementById('lockoutMessage').style.display = 'none';
                versuche = maxVersuche;
            } else {
                document.getElementById('lockoutTime').textContent = diffMinuten;
                setTimeout(updateTimer, 1000);
            }
        };
        
        updateTimer();
    }
});

// Logout-Funktion
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    window.location.href = '/index.html';
}
