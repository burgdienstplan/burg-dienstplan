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
        this.loadMitarbeiter();
    }

    loadMitarbeiter() {
        const encryptedData = localStorage.getItem('mitarbeiter');
        if (encryptedData) {
            this.mitarbeiter = decryptData(encryptedData);
        } else {
            this.mitarbeiter = [];
        }
        this.renderMitarbeiterListe();
    }

    saveMitarbeiter() {
        const encryptedData = encryptData(this.mitarbeiter);
        localStorage.setItem('mitarbeiter', encryptedData);
    }

    addMitarbeiter(mitarbeiterData) {
        const timestamp = new Date().toISOString();
        const newMitarbeiter = {
            ...mitarbeiterData,
            id: Date.now().toString(),
            password: hashPassword(mitarbeiterData.password),
            loginCount: 0,
            lastLogin: null,
            changeHistory: [{
                timestamp,
                type: 'created',
                changes: 'Mitarbeiter angelegt'
            }]
        };
        this.mitarbeiter.push(newMitarbeiter);
        this.saveMitarbeiter();
        this.renderMitarbeiterListe();
    }

    updateMitarbeiter(id, updates, updatedBy) {
        const index = this.mitarbeiter.findIndex(m => m.id === id);
        if (index === -1) return false;

        const oldData = { ...this.mitarbeiter[index] };
        const changes = [];

        // Vergleiche und dokumentiere Änderungen
        Object.keys(updates).forEach(key => {
            if (key !== 'password' && oldData[key] !== updates[key]) {
                changes.push(`${key}: ${oldData[key]} → ${updates[key]}`);
            }
        });

        if (updates.password) {
            updates.password = hashPassword(updates.password);
            changes.push('Passwort geändert');
        }

        // Füge Änderung zur Historie hinzu
        const changeRecord = {
            timestamp: new Date().toISOString(),
            type: 'update',
            changes: changes.join(', '),
            updatedBy
        };

        this.mitarbeiter[index] = {
            ...oldData,
            ...updates,
            changeHistory: [...oldData.changeHistory, changeRecord]
        };

        this.saveMitarbeiter();
        this.renderMitarbeiterListe();
        return true;
    }

    deleteMitarbeiter(id) {
        this.mitarbeiter = this.mitarbeiter.filter(m => m.id !== id);
        this.saveMitarbeiter();
        this.renderMitarbeiterListe();
    }

    incrementLoginCount(username) {
        const mitarbeiter = this.mitarbeiter.find(m => m.username === username);
        if (mitarbeiter) {
            mitarbeiter.loginCount = (mitarbeiter.loginCount || 0) + 1;
            mitarbeiter.lastLogin = new Date().toISOString();
            this.saveMitarbeiter();
        }
    }

    renderMitarbeiterListe() {
        const liste = document.getElementById('mitarbeiterListe');
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const isKastellan = currentUser?.role === 'kastellan';

        liste.innerHTML = '';
        
        this.mitarbeiter.forEach(m => {
            // Wenn nicht Kastellan, zeige nur eigene Daten
            if (!isKastellan && m.id !== currentUser.id) return;

            const div = document.createElement('div');
            div.className = 'mitarbeiter-item';
            
            const lastLoginDate = m.lastLogin ? new Date(m.lastLogin).toLocaleString('de-DE') : 'Nie';
            
            if (isKastellan) {
                div.innerHTML = `
                    <div class="mitarbeiter-info">
                        <div class="mitarbeiter-hauptinfo">
                            <strong>${m.name}</strong>
                            <span class="rolle">${m.role}</span>
                        </div>
                        <div class="mitarbeiter-kontakt">
                            <div>Tel: ${m.telefon || '-'}</div>
                            <div>Email: ${m.email || '-'}</div>
                        </div>
                        <div class="login-statistik">
                            <div class="login-count">
                                <strong>Anzahl Logins:</strong> ${m.loginCount || 0}
                            </div>
                            <div class="last-login">
                                <strong>Letzter Login:</strong> ${lastLoginDate}
                            </div>
                        </div>
                    </div>
                    <div class="mitarbeiter-history">
                        <button onclick="toggleHistory('${m.id}')" class="history-btn">Historie</button>
                        <div id="history-${m.id}" class="history-content" style="display:none">
                            ${m.changeHistory.map(h => `
                                <div class="history-item">
                                    ${new Date(h.timestamp).toLocaleString('de-DE')}: ${h.changes}
                                    ${h.updatedBy ? `<br><em>Geändert von: ${h.updatedBy}</em>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="mitarbeiter-actions">
                        <button onclick="editMitarbeiter('${m.id}')" class="edit-btn">Bearbeiten</button>
                        <button onclick="resetPassword('${m.id}')" class="reset-btn">Passwort zurücksetzen</button>
                        <button onclick="deleteMitarbeiter('${m.id}')" class="delete-btn">Löschen</button>
                    </div>
                `;
            } else {
                // Mitarbeiter sieht nur seine eigenen Daten
                div.innerHTML = `
                    <div class="mitarbeiter-info">
                        <div class="mitarbeiter-hauptinfo">
                            <strong>${m.name}</strong>
                            <span class="rolle">${m.role}</span>
                        </div>
                        <div class="mitarbeiter-kontakt">
                            <div>Tel: ${m.telefon || '-'}</div>
                            <div>Email: ${m.email || '-'}</div>
                        </div>
                        <div class="login-statistik">
                            <div class="login-count">
                                <strong>Meine Logins:</strong> ${m.loginCount || 0}
                            </div>
                            <div class="last-login">
                                <strong>Letzter Login:</strong> ${lastLoginDate}
                            </div>
                        </div>
                    </div>
                    <div class="mitarbeiter-actions">
                        <button onclick="editSelfInfo()" class="edit-btn">Daten ändern</button>
                        <button onclick="changePassword()" class="edit-btn">Passwort ändern</button>
                    </div>
                `;
            }
            
            liste.appendChild(div);
        });
    }
}

// Globale Instanz
const mitarbeiterManager = new MitarbeiterManager();

// Demo-Mitarbeiter für die Burg
const demoMitarbeiter = [
    {
        id: 'anna',
        name: 'Anna Müller',
        position: ['shop', 'shop_museum', 'kasse'],
        role: 'mitarbeiter'
    },
    {
        id: 'peter',
        name: 'Peter Wagner',
        position: ['shop', 'fuehrung'],
        role: 'museumsfuehrer'
    },
    {
        id: 'maria',
        name: 'Maria Huber',
        position: ['shop', 'shop_museum', 'kasse'],
        role: 'mitarbeiter'
    },
    {
        id: 'josef',
        name: 'Josef Bauer',
        position: ['shop', 'fuehrung'],
        role: 'museumsfuehrer'
    },
    {
        id: 'lisa',
        name: 'Lisa Berger',
        position: ['shop', 'shop_museum'],
        role: 'mitarbeiter'
    },
    {
        id: 'kastellan',
        name: 'Hans Burgverwalter',
        position: ['all'],
        role: 'kastellan'
    }
];

// Speichere Demo-Mitarbeiter im localStorage
localStorage.setItem('mitarbeiter', JSON.stringify(demoMitarbeiter));

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
