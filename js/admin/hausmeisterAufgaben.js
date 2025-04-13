// Admin Hausmeister-Aufgaben Verwaltung

document.addEventListener('DOMContentLoaded', () => {
    // DOM-Elemente
    const aufgabeForm = document.getElementById('aufgabeForm');
    const hausmeisterTable = document.getElementById('hausmeisterTable').querySelector('tbody');
    const ueberfaelligeAufgaben = document.getElementById('ueberfaelligeAufgaben');
    const offeneAufgabenCount = document.getElementById('offeneAufgabenCount');
    const erledigteAufgabenCount = document.getElementById('erledigteAufgabenCount');

    // Foto-Upload Vorschau
    function handleFotoUpload(input, previewContainer) {
        const files = input.files;
        previewContainer.innerHTML = '';

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            const container = document.createElement('div');
            container.className = 'foto-container';

            reader.onload = e => {
                container.innerHTML = `
                    <img src="${e.target.result}" alt="Vorschau">
                    <div class="foto-actions">
                        <button type="button" class="btn-icon" onclick="this.closest('.foto-container').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            };

            reader.readAsDataURL(file);
            previewContainer.appendChild(container);
        });
    }

    // Foto-Upload Event-Listener
    document.getElementById('aufgabeFotos')?.addEventListener('change', e => {
        handleFotoUpload(e.target, document.getElementById('fotoPreview'));
    });

    // Aufgaben laden und anzeigen
    function loadAufgaben() {
        const aufgaben = JSON.parse(localStorage.getItem('aufgaben') || '[]');
        hausmeisterTable.innerHTML = '';
        ueberfaelligeAufgaben.innerHTML = '';
        
        let offen = 0;
        let erledigt = 0;

        aufgaben.forEach(aufgabe => {
            const termin = new Date(aufgabe.termin);
            const istUeberfaellig = termin < new Date() && aufgabe.status !== 'erledigt';
            
            // Zähler aktualisieren
            if (aufgabe.status === 'erledigt') {
                erledigt++;
            } else {
                offen++;
            }

            // Überfällige Aufgaben anzeigen
            if (istUeberfaellig) {
                const li = document.createElement('li');
                li.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    ${aufgabe.titel} (${termin.toLocaleDateString()})
                `;
                ueberfaelligeAufgaben.appendChild(li);
            }

            // Aufgabe in Tabelle einfügen
            const row = document.createElement('tr');
            row.innerHTML = `
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
                        ${aufgabe.fotos?.map(foto => `
                            <img src="${foto}" alt="Foto" onclick="showFoto('${foto}')">
                        `).join('') || ''}
                    </div>
                </td>
                <td>
                    <button class="btn-icon" onclick="editAufgabe('${aufgabe.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteAufgabe('${aufgabe.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            hausmeisterTable.appendChild(row);
        });

        // Statistik aktualisieren
        offeneAufgabenCount.textContent = offen;
        erledigteAufgabenCount.textContent = erledigt;
    }

    // Aufgabe speichern
    aufgabeForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const aufgaben = JSON.parse(localStorage.getItem('aufgaben') || '[]');
        const id = document.getElementById('aufgabeId').value;
        
        // Fotos in Base64 konvertieren
        const fotoPromises = Array.from(document.getElementById('aufgabeFotos').files)
            .map(file => new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            }));
        
        const fotos = await Promise.all(fotoPromises);
        
        const aufgabe = {
            id: id || Date.now().toString(),
            titel: document.getElementById('aufgabeTitel').value,
            beschreibung: document.getElementById('aufgabeBeschreibung').value,
            termin: document.getElementById('aufgabeTermin').value,
            prioritaet: document.getElementById('aufgabePrioritaet').value,
            status: 'offen',
            fotos: fotos,
            historie: []
        };
        
        if (id) {
            // Bestehende Aufgabe aktualisieren
            const index = aufgaben.findIndex(a => a.id === id);
            if (index !== -1) {
                aufgabe.status = aufgaben[index].status;
                aufgabe.historie = aufgaben[index].historie;
                aufgabe.fotos = [...(aufgaben[index].fotos || []), ...fotos];
                aufgaben[index] = aufgabe;
            }
        } else {
            aufgaben.push(aufgabe);
        }
        
        localStorage.setItem('aufgaben', JSON.stringify(aufgaben));
        closeModal('aufgabeModal');
        aufgabeForm.reset();
        document.getElementById('fotoPreview').innerHTML = '';
        loadAufgaben();
    });

    // Aufgabe bearbeiten
    window.editAufgabe = function(id) {
        const aufgaben = JSON.parse(localStorage.getItem('aufgaben') || '[]');
        const aufgabe = aufgaben.find(a => a.id === id);
        
        if (aufgabe) {
            document.getElementById('aufgabeId').value = aufgabe.id;
            document.getElementById('aufgabeTitel').value = aufgabe.titel;
            document.getElementById('aufgabeBeschreibung').value = aufgabe.beschreibung;
            document.getElementById('aufgabeTermin').value = aufgabe.termin;
            document.getElementById('aufgabePrioritaet').value = aufgabe.prioritaet;
            
            // Fotos anzeigen
            const preview = document.getElementById('fotoPreview');
            preview.innerHTML = aufgabe.fotos?.map(foto => `
                <div class="foto-container">
                    <img src="${foto}" alt="Foto">
                </div>
            `).join('') || '';
            
            openModal('aufgabeModal');
        }
    };

    // Aufgabe löschen
    window.deleteAufgabe = function(id) {
        if (!confirm('Möchten Sie diese Aufgabe wirklich löschen?')) return;
        
        const aufgaben = JSON.parse(localStorage.getItem('aufgaben') || '[]');
        const updatedAufgaben = aufgaben.filter(a => a.id !== id);
        
        localStorage.setItem('aufgaben', JSON.stringify(updatedAufgaben));
        loadAufgaben();
    };

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
    if (document.getElementById('hausmeisterAufgaben')) {
        loadAufgaben();
    }
});
