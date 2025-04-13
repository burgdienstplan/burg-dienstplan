// Reparaturen Verwaltung

let reparaturen = JSON.parse(localStorage.getItem('reparaturen')) || [];
let signaturePad;

document.addEventListener('DOMContentLoaded', () => {
    // Signature Pad initialisieren
    const canvas = document.getElementById('signaturePad');
    if (canvas) {
        signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)'
        });
    }

    // Formular-Handler
    const reparaturForm = document.getElementById('reparaturForm');
    if (reparaturForm) {
        reparaturForm.addEventListener('submit', handleReparaturSubmit);
    }

    // Ersatzteil-Button
    const addErsatzteilBtn = document.getElementById('addErsatzteil');
    if (addErsatzteilBtn) {
        addErsatzteilBtn.addEventListener('click', addErsatzteil);
    }

    // Initial anzeigen
    displayReparaturen();
});

// Reparaturen anzeigen
function displayReparaturen() {
    const tbody = document.querySelector('#reparaturTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    reparaturen.forEach((reparatur, index) => {
        const tr = document.createElement('tr');
        const startDate = new Date(reparatur.startzeit);
        const endDate = reparatur.endzeit ? new Date(reparatur.endzeit) : null;
        
        tr.innerHTML = `
            <td>${formatDate(startDate)}</td>
            <td>${endDate ? formatDate(endDate) : '-'}</td>
            <td>${reparatur.art}</td>
            <td>${reparatur.beschreibung}</td>
            <td>${getMitarbeiterName(reparatur.durchgefuehrt_von)}</td>
            <td>
                <button onclick="editReparatur(${index})" class="btn-icon" title="Bearbeiten">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="printReparatur(${index})" class="btn-icon" title="Drucken">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Reparatur bearbeiten
window.editReparatur = function(index) {
    const reparatur = reparaturen[index];
    const form = document.getElementById('reparaturForm');
    if (!form) return;

    // Formular mit Daten füllen
    form.querySelector('[name="art"]').value = reparatur.art;
    form.querySelector('[name="startzeit"]').value = formatDateTimeForInput(reparatur.startzeit);
    if (reparatur.endzeit) {
        form.querySelector('[name="endzeit"]').value = formatDateTimeForInput(reparatur.endzeit);
    }
    form.querySelector('[name="beschreibung"]').value = reparatur.beschreibung;
    form.querySelector('[name="durchgefuehrt_von"]').value = reparatur.durchgefuehrt_von;

    // Verwendete Ersatzteile füllen
    if (reparatur.ersatzteile) {
        const container = document.getElementById('ersatzteile-liste');
        if (container) {
            container.innerHTML = '';
            reparatur.ersatzteile.forEach(teil => {
                addErsatzteil(teil);
            });
        }
    }

    // Index für Update speichern
    form.dataset.editIndex = index;

    // Modal öffnen
    openModal('reparaturModal');
}

// Reparatur drucken
window.printReparatur = function(index) {
    const reparatur = reparaturen[index];
    
    // Druckbares HTML erstellen
    const printContent = `
        <html>
        <head>
            <title>Reparaturbericht</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 20px; }
                .section { margin-bottom: 15px; }
                .label { font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; }
                @media print {
                    body { padding: 20px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Reparaturbericht</h1>
                <h2>Burg Hochosterwitz</h2>
            </div>
            
            <div class="section">
                <p><span class="label">Art der Reparatur:</span> ${reparatur.art}</p>
                <p><span class="label">Datum:</span> ${formatDate(new Date(reparatur.startzeit))}</p>
                <p><span class="label">Durchgeführt von:</span> ${getMitarbeiterName(reparatur.durchgefuehrt_von)}</p>
            </div>
            
            <div class="section">
                <p class="label">Beschreibung:</p>
                <p>${reparatur.beschreibung}</p>
            </div>
            
            ${reparatur.ersatzteile && reparatur.ersatzteile.length > 0 ? `
            <div class="section">
                <p class="label">Verwendete Ersatzteile:</p>
                <table>
                    <thead>
                        <tr>
                            <th>Material</th>
                            <th>Menge</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reparatur.ersatzteile.map(teil => {
                            const item = getLagerItem(teil.id);
                            return `
                            <tr>
                                <td>${item ? item.bezeichnung : 'Unbekannt'}</td>
                                <td>${teil.menge} ${item ? item.einheit : ''}</td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
            
            ${reparatur.unterschrift ? `
            <div class="section">
                <p class="label">Unterschrift:</p>
                <img src="${reparatur.unterschrift}" style="max-width: 300px; margin-top: 10px;">
            </div>
            ` : ''}
        </body>
        </html>
    `;
    
    // Druckfenster öffnen
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Kurz warten, bis das Dokument geladen ist
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

// Formular-Handler
function handleReparaturSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    // Reparatur-Objekt erstellen
    const reparatur = {
        art: formData.get('art'),
        startzeit: formData.get('startzeit'),
        endzeit: formData.get('endzeit') || null,
        beschreibung: formData.get('beschreibung'),
        durchgefuehrt_von: formData.get('durchgefuehrt_von'),
        ersatzteile: getSelectedErsatzteile(),
        unterschrift: signaturePad ? signaturePad.toDataURL() : null
    };

    const editIndex = form.dataset.editIndex;
    if (editIndex !== undefined) {
        // Update existierende Reparatur
        reparaturen[editIndex] = {
            ...reparaturen[editIndex],
            ...reparatur
        };
        delete form.dataset.editIndex;
    } else {
        // Neue Reparatur hinzufügen
        reparaturen.push({
            id: Date.now(),
            ...reparatur,
            erstellt_am: new Date().toISOString()
        });
    }

    // Lagerbestand aktualisieren
    if (reparatur.ersatzteile) {
        updateLagerbestand(reparatur.ersatzteile);
    }

    // Speichern und aktualisieren
    localStorage.setItem('reparaturen', JSON.stringify(reparaturen));
    displayReparaturen();

    // Modal schließen und Formular zurücksetzen
    closeModal('reparaturModal');
    form.reset();
    if (signaturePad) {
        signaturePad.clear();
    }
    const ersatzteileContainer = document.getElementById('ersatzteile-liste');
    if (ersatzteileContainer) {
        ersatzteileContainer.innerHTML = '';
    }
}

// Ersatzteil zum Formular hinzufügen
function addErsatzteil(existingTeil = null) {
    const liste = document.getElementById('ersatzteile-liste');
    if (!liste) return;

    const div = document.createElement('div');
    div.className = 'ersatzteil-item';
    
    // Hole die Lager-Daten
    const lagerItems = JSON.parse(localStorage.getItem('lager')) || [];
    const optionsHtml = lagerItems.map(item => 
        `<option value="${item.id}" ${existingTeil && existingTeil.id === item.id ? 'selected' : ''}>${item.bezeichnung}</option>`
    ).join('');

    div.innerHTML = `
        <select name="ersatzteil" required>
            <option value="">Bitte wählen...</option>
            ${optionsHtml}
        </select>
        <input type="number" name="menge" value="${existingTeil ? existingTeil.menge : '1'}" min="1" required>
        <button type="button" onclick="this.parentElement.remove()" class="btn-icon">
            <i class="fas fa-trash"></i>
        </button>
    `;

    liste.appendChild(div);
}

// Ausgewählte Ersatzteile sammeln
function getSelectedErsatzteile() {
    const container = document.getElementById('ersatzteile-liste');
    if (!container) return [];

    const ersatzteile = [];
    container.querySelectorAll('.ersatzteil-item').forEach(item => {
        const select = item.querySelector('select');
        const menge = item.querySelector('input[type="number"]');
        if (select.value && menge.value) {
            ersatzteile.push({
                id: select.value,
                menge: parseInt(menge.value)
            });
        }
    });
    
    return ersatzteile;
}

// Lager-Item anhand ID finden
function getLagerItem(id) {
    const lagerItems = JSON.parse(localStorage.getItem('lager')) || [];
    return lagerItems.find(item => item.id === id);
}

// Lagerbestand nach Entnahme aktualisieren
function updateLagerbestand(verwendeteTeile) {
    const lagerItems = JSON.parse(localStorage.getItem('lager')) || [];
    
    verwendeteTeile.forEach(teil => {
        const lagerItem = lagerItems.find(item => item.id === teil.id);
        if (lagerItem) {
            lagerItem.bestand = Math.max(0, lagerItem.bestand - teil.menge);
        }
    });
    
    localStorage.setItem('lager', JSON.stringify(lagerItems));
}

// Helfer-Funktionen
function formatDate(date) {
    return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTimeForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
}

function getMitarbeiterName(id) {
    const mitarbeiter = {
        'steindorfer': 'Martin Steindorfer',
        'gruber': 'Patrik Gruber',
        'dobraunig': 'Dobraunig (Elektriker)',
        'nast': 'Nast (Mechaniker)'
    };
    return mitarbeiter[id] || id;
}
