// Hausmeister Dashboard

document.addEventListener('DOMContentLoaded', () => {
    // Prüfe Authentication
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = '../index.html';
        return;
    }

    // Setze Benutzername
    document.getElementById('userName').textContent = currentUser.name;

    // DOM-Elemente
    const offeneAufgaben = document.getElementById('offeneAufgaben');
    const liftReparaturen = document.getElementById('liftReparaturen');
    const aufgabenListe = document.getElementById('aufgabenListe');
    const statusForm = document.getElementById('statusForm');
    const filterButtons = document.querySelectorAll('.task-filters button');

    // Filter-Status
    let currentFilter = 'all';

    // Lade und zeige Aufgaben
    function loadDashboard() {
        const aufgaben = JSON.parse(localStorage.getItem('aufgaben') || '[]');
        const liftAufgaben = JSON.parse(localStorage.getItem('liftReparaturen') || '[]');
        
        // Offene Aufgaben anzeigen
        offeneAufgaben.innerHTML = '';
        aufgaben
            .filter(a => a.status !== 'erledigt')
            .sort((a, b) => new Date(a.termin) - new Date(b.termin))
            .forEach(aufgabe => {
                const termin = new Date(aufgabe.termin);
                const istUeberfaellig = termin < new Date();
                
                const div = document.createElement('div');
                div.className = 'task-item';
                div.innerHTML = `
                    <div class="task-info">
                        <div class="task-title">${aufgabe.titel}</div>
                        <div class="task-meta">
                            <i class="far fa-calendar"></i> ${termin.toLocaleDateString()}
                            ${istUeberfaellig ? '<span class="status-badge ueberfaellig">Überfällig</span>' : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn-icon" onclick="updateStatus('${aufgabe.id}')">
                            <i class="fas fa-tasks"></i>
                        </button>
                    </div>
                `;
                offeneAufgaben.appendChild(div);
            });

        // Lift Reparaturen anzeigen
        liftReparaturen.innerHTML = '';
        liftAufgaben
            .filter(a => a.status !== 'erledigt')
            .forEach(aufgabe => {
                const div = document.createElement('div');
                div.className = 'task-item';
                div.innerHTML = `
                    <div class="task-info">
                        <div class="task-title">${aufgabe.titel}</div>
                        <div class="task-meta">
                            <span class="status-badge ${aufgabe.status}">${aufgabe.status}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn-icon" onclick="updateLiftStatus('${aufgabe.id}')">
                            <i class="fas fa-tools"></i>
                        </button>
                    </div>
                `;
                liftReparaturen.appendChild(div);
            });

        // Aufgabenliste filtern und anzeigen
        aufgabenListe.innerHTML = '';
        aufgaben
            .filter(aufgabe => {
                if (currentFilter === 'all') return true;
                return aufgabe.status === currentFilter;
            })
            .forEach(aufgabe => {
                const termin = new Date(aufgabe.termin);
                const istUeberfaellig = termin < new Date() && aufgabe.status !== 'erledigt';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${aufgabe.titel}</td>
                    <td>${aufgabe.beschreibung}</td>
                    <td>${termin.toLocaleString()}</td>
                    <td>
                        <span class="status-badge ${aufgabe.status} ${istUeberfaellig ? 'ueberfaellig' : ''}">
                            ${aufgabe.status}
                        </span>
                    </td>
                    <td>
                        <div class="aufgabe-fotos">
                            ${aufgabe.fotos.map(foto => `
                                <img src="${foto}" alt="Foto" onclick="showFoto('${foto}')">
                            `).join('')}
                        </div>
                    </td>
                    <td>
                        <button class="btn-icon" onclick="updateStatus('${aufgabe.id}')">
                            <i class="fas fa-tasks"></i>
                        </button>
                    </td>
                `;
                aufgabenListe.appendChild(tr);
            });
    }

    // Filter-Buttons Event-Listener
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            loadDashboard();
        });
    });

    // Status aktualisieren
    window.updateStatus = function(id) {
        const aufgaben = JSON.parse(localStorage.getItem('aufgaben') || '[]');
        const aufgabe = aufgaben.find(a => a.id === id);
        
        if (aufgabe) {
            document.getElementById('statusAufgabeId').value = aufgabe.id;
            document.getElementById('aufgabeStatus').value = aufgabe.status;
            document.getElementById('statusKommentar').value = '';
            document.getElementById('statusFotoPreview').innerHTML = '';
            
            openModal('statusModal');
        }
    };

    // Lift-Status aktualisieren
    window.updateLiftStatus = function(id) {
        const aufgaben = JSON.parse(localStorage.getItem('liftReparaturen') || '[]');
        const aufgabe = aufgaben.find(a => a.id === id);
        
        if (aufgabe) {
            document.getElementById('statusAufgabeId').value = aufgabe.id;
            document.getElementById('aufgabeStatus').value = aufgabe.status;
            document.getElementById('statusKommentar').value = '';
            document.getElementById('statusFotoPreview').innerHTML = '';
            
            openModal('statusModal');
        }
    };

    // Status-Formular
    statusForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('statusAufgabeId').value;
        const isLiftAufgabe = document.getElementById('statusAufgabeId').dataset.type === 'lift';
        
        const storageKey = isLiftAufgabe ? 'liftReparaturen' : 'aufgaben';
        const aufgaben = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const index = aufgaben.findIndex(a => a.id === id);
        
        if (index === -1) return;

        // Fotos in Base64 konvertieren
        const fotoPromises = Array.from(document.getElementById('statusFotos').files)
            .map(file => new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            }));
        
        const fotos = await Promise.all(fotoPromises);
        
        // Status-Update zur Historie hinzufügen
        const statusUpdate = {
            datum: new Date().toISOString(),
            status: document.getElementById('aufgabeStatus').value,
            kommentar: document.getElementById('statusKommentar').value,
            fotos: fotos
        };
        
        aufgaben[index].status = statusUpdate.status;
        aufgaben[index].historie = aufgaben[index].historie || [];
        aufgaben[index].historie.push(statusUpdate);
        aufgaben[index].fotos = [...(aufgaben[index].fotos || []), ...fotos];
        
        localStorage.setItem(storageKey, JSON.stringify(aufgaben));
        closeModal('statusModal');
        statusForm.reset();
        document.getElementById('statusFotoPreview').innerHTML = '';
        loadDashboard();
    });

    // Foto in Vollbild anzeigen
    window.showFoto = function(foto) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 90%; text-align: center;">
                <img src="${foto}" alt="Foto" style="max-width: 100%; max-height: 80vh;">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">
                    Schließen
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    };

    // Initial laden
    loadDashboard();
});
