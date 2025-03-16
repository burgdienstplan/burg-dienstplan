// Verschlüsselungsfunktionen
function encryptData(data, key) {
    // Einfache Verschlüsselung für localStorage (in Produktion sollte eine stärkere Methode verwendet werden)
    return btoa(JSON.stringify(data));
}

function decryptData(encryptedData, key) {
    try {
        return JSON.parse(atob(encryptedData));
    } catch (e) {
        return null;
    }
}

// Passwort-Hashing (in Produktion sollte bcrypt oder ähnliches verwendet werden)
function hashPassword(password) {
    return btoa(password);
}

// Mitarbeiter-Klasse
class MitarbeiterManager {
    constructor() {
        this.mitarbeiter = this.loadMitarbeiter();
        this.initializeEventListeners();
    }

    loadMitarbeiter() {
        return JSON.parse(localStorage.getItem('mitarbeiter')) || [];
    }

    saveMitarbeiter() {
        localStorage.setItem('mitarbeiter', JSON.stringify(this.mitarbeiter));
    }

    addMitarbeiter(vorname, nachname, positionen) {
        const id = vorname.toLowerCase().replace(/\s+/g, '');
        const mitarbeiter = {
            id,
            vorname,
            nachname,
            name: `${vorname} ${nachname}`,
            positionen
        };
        this.mitarbeiter.push(mitarbeiter);
        this.saveMitarbeiter();
        this.updateMitarbeiterListe();
        return mitarbeiter;
    }

    deleteMitarbeiter(id) {
        // Prüfe ob Mitarbeiter noch Schichten hat
        const shifts = JSON.parse(localStorage.getItem('shifts')) || {};
        let hasShifts = false;
        
        Object.values(shifts).forEach(dayShifts => {
            if (dayShifts.some(shift => shift.mitarbeiterId === id)) {
                hasShifts = true;
            }
        });

        if (hasShifts) {
            alert('Dieser Mitarbeiter hat noch Schichten im Dienstplan. Bitte zuerst alle Schichten löschen.');
            return false;
        }

        this.mitarbeiter = this.mitarbeiter.filter(m => m.id !== id);
        this.saveMitarbeiter();
        this.updateMitarbeiterListe();
        return true;
    }

    updateMitarbeiterListe() {
        const liste = document.getElementById('mitarbeiterListe');
        if (!liste) return;

        liste.innerHTML = '';
        this.mitarbeiter.forEach(m => {
            const div = document.createElement('div');
            div.className = 'mitarbeiter-item';
            
            const info = document.createElement('span');
            info.textContent = `${m.name} (${m.positionen.join(', ')})`;
            div.appendChild(info);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.onclick = () => this.deleteMitarbeiter(m.id);
            div.appendChild(deleteBtn);

            liste.appendChild(div);
        });
    }

    initializeEventListeners() {
        const addForm = document.getElementById('addMitarbeiterForm');
        if (addForm) {
            addForm.onsubmit = (e) => {
                e.preventDefault();
                const vorname = document.getElementById('vorname').value;
                const nachname = document.getElementById('nachname').value;
                const positionen = Array.from(document.getElementById('positionen').selectedOptions)
                    .map(option => option.value);
                
                if (vorname && nachname && positionen.length > 0) {
                    this.addMitarbeiter(vorname, nachname, positionen);
                    addForm.reset();
                }
            };
        }
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    window.mitarbeiterManager = new MitarbeiterManager();
});

// UI Funktionen
function toggleHistory(id) {
    const historyDiv = document.getElementById(`history-${id}`);
    historyDiv.style.display = historyDiv.style.display === 'none' ? 'block' : 'none';
}

function showEditDialog(mitarbeiter = null) {
    const dialog = document.createElement('div');
    dialog.className = 'edit-dialog';
    dialog.innerHTML = `
        <form id="editForm">
            <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" value="${mitarbeiter?.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="telefon">Telefon</label>
                <input type="tel" id="telefon" value="${mitarbeiter?.telefon || ''}">
            </div>
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" value="${mitarbeiter?.email || ''}">
            </div>
            ${!mitarbeiter ? `
                <div class="form-group">
                    <label for="username">Benutzername</label>
                    <input type="text" id="username" required>
                </div>
                <div class="form-group">
                    <label for="password">Passwort</label>
                    <input type="password" id="password" required>
                </div>
                <div class="form-group">
                    <label for="role">Rolle</label>
                    <select id="role" required>
                        <option value="hausmeister">Hausmeister</option>
                        <option value="shop">Shop</option>
                        <option value="museumsfuehrer">Museumsführer</option>
                    </select>
                </div>
            ` : ''}
            <div class="form-actions">
                <button type="submit">Speichern</button>
                <button type="button" onclick="closeDialog()">Abbrechen</button>
            </div>
        </form>
    `;
    document.body.appendChild(dialog);

    document.getElementById('editForm').onsubmit = (e) => {
        e.preventDefault();
        const formData = {
            name: document.getElementById('name').value,
            telefon: document.getElementById('telefon').value,
            email: document.getElementById('email').value
        };

        if (!mitarbeiter) {
            formData.username = document.getElementById('username').value;
            formData.password = document.getElementById('password').value;
            formData.role = document.getElementById('role').value;
            mitarbeiterManager.addMitarbeiter(formData);
        } else {
            mitarbeiterManager.updateMitarbeiter(
                mitarbeiter.id,
                formData,
                JSON.parse(localStorage.getItem('currentUser')).username
            );
        }
        closeDialog();
    };
}

function closeDialog() {
    const dialog = document.querySelector('.edit-dialog');
    if (dialog) dialog.remove();
}

function editMitarbeiter(id) {
    const mitarbeiter = mitarbeiterManager.mitarbeiter.find(m => m.id === id);
    if (mitarbeiter) showEditDialog(mitarbeiter);
}

function editSelfInfo() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const mitarbeiter = mitarbeiterManager.mitarbeiter.find(m => m.id === currentUser.id);
    if (mitarbeiter) {
        showEditDialog(mitarbeiter);
    }
}

function resetPassword(id) {
    const newPassword = prompt('Neues Passwort eingeben:');
    if (newPassword) {
        mitarbeiterManager.updateMitarbeiter(
            id,
            { password: newPassword },
            JSON.parse(localStorage.getItem('currentUser')).username
        );
    }
}

function changePassword() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const oldPassword = prompt('Altes Passwort eingeben:');
    if (oldPassword && hashPassword(oldPassword) === currentUser.password) {
        const newPassword = prompt('Neues Passwort eingeben:');
        if (newPassword) {
            mitarbeiterManager.updateMitarbeiter(
                currentUser.id,
                { password: newPassword },
                currentUser.username
            );
        }
    } else {
        alert('Falsches Passwort!');
    }
}

function deleteMitarbeiter(id) {
    if (confirm('Mitarbeiter wirklich löschen?')) {
        mitarbeiterManager.deleteMitarbeiter(id);
    }
}
