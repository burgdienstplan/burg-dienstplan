document.addEventListener('DOMContentLoaded', () => {
    // API-Status prüfen
    checkApiStatus();
    
    // Login-Formular Handler
    setupLoginForm();
});

async function checkApiStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        console.log('API Status:', data);
    } catch (error) {
        console.error('API Error:', error);
    }
}

function setupLoginForm() {
    const form = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: document.getElementById('username').value,
                    password: document.getElementById('password').value
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Erfolgreiche Anmeldung
                window.location.href = '/dashboard';
            } else {
                // Fehler anzeigen
                showError(data.message || 'Anmeldung fehlgeschlagen');
            }
        } catch (error) {
            showError('Ein Fehler ist aufgetreten');
        }
    });
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Nach 5 Sekunden ausblenden
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
}
