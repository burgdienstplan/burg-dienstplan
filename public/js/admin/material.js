// Material-Verwaltung
document.addEventListener('DOMContentLoaded', () => {
    // DOM-Elemente
    const materialTable = document.getElementById('materialTable');
    const materialForm = document.getElementById('materialForm');
    const materialBewegungForm = document.getElementById('materialBewegungForm');
    const warningList = document.getElementById('warningList');
    const materialKategorie = document.getElementById('materialKategorie');
    const materialSuche = document.getElementById('materialSuche');
    const materialKategorieSelect = document.getElementById('materialKategorieSelect');
    const materialLagerortSelect = document.getElementById('materialLagerort');
    const bewegungMaterial = document.getElementById('bewegungMaterial');

    // Kategorien laden
    CONFIG.MATERIAL_KATEGORIEN.forEach(kategorie => {
        // Für Filter
        const filterOption = document.createElement('option');
        filterOption.value = kategorie;
        filterOption.textContent = kategorie;
        materialKategorie.appendChild(filterOption);

        // Für Material-Form
        const formOption = document.createElement('option');
        formOption.value = kategorie;
        formOption.textContent = kategorie;
        materialKategorieSelect.appendChild(formOption);
    });

    // Lagerorte laden
    CONFIG.LAGERORTE.forEach(lagerort => {
        const option = document.createElement('option');
        option.value = lagerort;
        option.textContent = lagerort;
        materialLagerortSelect.appendChild(option);
    });

    // Standard-Material initialisieren wenn noch nicht vorhanden
    if (!localStorage.getItem('material')) {
        const initialMaterial = CONFIG.STANDARD_MATERIAL.map(item => ({
            ...item,
            id: Date.now() + Math.random(),
            bestand: 0,
            bewegungen: []
        }));
        localStorage.setItem('material', JSON.stringify(initialMaterial));
    }

    // Material-Liste aktualisieren
    function updateMaterialListe(filter = '', kategorie = '') {
        const material = JSON.parse(localStorage.getItem('material') || '[]');
        const tbody = materialTable.querySelector('tbody');
        tbody.innerHTML = '';
        warningList.innerHTML = ''; // Warnliste leeren

        material
            .filter(item => {
                const matchesFilter = filter === '' || 
                    item.bezeichnung.toLowerCase().includes(filter.toLowerCase()) ||
                    item.intern_nr.toLowerCase().includes(filter.toLowerCase()) ||
                    item.doppelmayr_nr.toLowerCase().includes(filter.toLowerCase());
                const matchesKategorie = kategorie === '' || item.kategorie === kategorie;
                return matchesFilter && matchesKategorie;
            })
            .forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.bezeichnung}</td>
                    <td>${item.kategorie}</td>
                    <td>${item.intern_nr}</td>
                    <td>${item.doppelmayr_nr}</td>
                    <td>${item.bestand} ${item.einheit}</td>
                    <td>${item.mindestbestand} ${item.einheit}</td>
                    <td>${item.lagerort}</td>
                    <td>
                        <button onclick="editMaterial('${item.id}')" class="btn-icon">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="showBewegungen('${item.id}')" class="btn-icon">
                            <i class="fas fa-history"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);

                // Warnung wenn unter Mindestbestand
                if (item.bestand < item.mindestbestand) {
                    const li = document.createElement('li');
                    li.textContent = `${item.bezeichnung} (${item.lagerort}): ${item.bestand}/${item.mindestbestand}`;
                    warningList.appendChild(li);
                }
            });

        // Material-Liste für Bewegungen aktualisieren
        bewegungMaterial.innerHTML = '<option value="">Bitte wählen...</option>';
        material.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.bezeichnung} (${item.lagerort}) - ${item.bestand}`;
            bewegungMaterial.appendChild(option);
        });
    }

    // Material-Form Handler
    materialForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const material = JSON.parse(localStorage.getItem('material') || '[]');
        
        const newItem = {
            id: Date.now().toString(),
            bezeichnung: formData.get('bezeichnung'),
            kategorie: formData.get('kategorie'),
            einheit: formData.get('einheit'),
            intern_nr: formData.get('intern_nr'),
            doppelmayr_nr: formData.get('doppelmayr_nr'),
            mindestbestand: parseInt(formData.get('mindestbestand') || '0'),
            bestand: parseInt(formData.get('bestand') || '0'),
            lagerort: formData.get('lagerort'),
            bewegungen: []
        };

        material.push(newItem);
        localStorage.setItem('material', JSON.stringify(material));
        
        updateMaterialListe();
        closeModal('materialModal');
        e.target.reset();
    });

    // Material-Bewegung Form Handler
    materialBewegungForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const material = JSON.parse(localStorage.getItem('material') || '[]');
        
        const materialId = formData.get('material');
        const menge = parseInt(formData.get('menge'));
        const typ = formData.get('typ');
        const bemerkung = formData.get('bemerkung');

        const item = material.find(m => m.id === materialId);
        if (item) {
            // Bewegung hinzufügen
            item.bewegungen.push({
                datum: new Date().toISOString(),
                typ,
                menge,
                bemerkung
            });

            // Bestand aktualisieren
            if (typ === 'eingang') {
                item.bestand += menge;
            } else {
                item.bestand = Math.max(0, item.bestand - menge);
            }

            localStorage.setItem('material', JSON.stringify(material));
            updateMaterialListe();
            closeModal('materialBewegungModal');
            e.target.reset();
        }
    });

    // Filter-Event-Listener
    materialSuche.addEventListener('input', () => {
        updateMaterialListe(materialSuche.value, materialKategorie.value);
    });

    materialKategorie.addEventListener('change', () => {
        updateMaterialListe(materialSuche.value, materialKategorie.value);
    });

    // Material bearbeiten
    window.editMaterial = function(id) {
        const material = JSON.parse(localStorage.getItem('material') || '[]');
        const item = material.find(m => m.id === id);
        if (!item) return;

        document.getElementById('bezeichnung').value = item.bezeichnung;
        document.getElementById('intern_nr').value = item.intern_nr;
        document.getElementById('doppelmayr_nr').value = item.doppelmayr_nr;
        document.getElementById('kategorie').value = item.kategorie;
        document.getElementById('lagerort').value = item.lagerort;
        document.getElementById('bestand').value = item.bestand;
        document.getElementById('mindestbestand').value = item.mindestbestand;

        materialForm.dataset.id = id;
        openModal('materialModal');
    };

    // Bewegungen anzeigen
    window.showBewegungen = function(id) {
        const material = JSON.parse(localStorage.getItem('material') || '[]');
        const item = material.find(m => m.id === id);
        if (!item) return;

        const bewegungen = item.bewegungen.sort((a, b) => new Date(b.datum) - new Date(a.datum));
        let message = `Bewegungen für ${item.bezeichnung} (${item.lagerort}):\n\n`;
        
        bewegungen.forEach(b => {
            message += `${new Date(b.datum).toLocaleString()}: `;
            message += `${b.typ === 'eingang' ? '+' : '-'}${b.menge}`;
            message += ` (Bestand: ${b.bestandNach})`;
            if (b.bemerkung) message += `\nBemerkung: ${b.bemerkung}`;
            message += '\n\n';
        });

        if (bewegungen.length === 0) {
            message += 'Keine Bewegungen vorhanden.';
        }

        alert(message);
    };

    // Scanner-Funktionalität
    window.startScanner = async function(inputId) {
        const scannerPreview = document.getElementById('scanner-preview');

        try {
            // Kamera-Stream starten
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" } 
            });
            scannerPreview.srcObject = stream;
            await scannerPreview.play();

            // QR-Code und Barcode Scanner initialisieren
            if ('BarcodeDetector' in window) {
                const barcodeDetector = new BarcodeDetector({
                    formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39']
                });

                // Scanner-Loop starten
                window.currentScanner = setInterval(async () => {
                    try {
                        const barcodes = await barcodeDetector.detect(scannerPreview);
                        if (barcodes.length > 0) {
                            // Code gefunden
                            const code = barcodes[0].rawValue;
                            document.getElementById(inputId).value = code;
                            closeScanner();
                        }
                    } catch (error) {
                        console.error('Fehler beim Scannen:', error);
                    }
                }, 100);

            } else {
                // Fallback für Browser ohne BarcodeDetector
                alert('Ihr Browser unterstützt leider keine Barcode-Erkennung. Bitte Chrome oder Edge verwenden.');
                closeScanner();
                return;
            }

            openModal('scannerModal');
        } catch (error) {
            console.error('Fehler beim Starten der Kamera:', error);
            alert('Kamera konnte nicht gestartet werden. Bitte Berechtigungen prüfen.');
        }
    }

    window.closeScanner = function() {
        if (window.currentScanner) {
            clearInterval(window.currentScanner);
            window.currentScanner = null;
        }

        const scannerPreview = document.getElementById('scanner-preview');
        if (scannerPreview.srcObject) {
            scannerPreview.srcObject.getTracks().forEach(track => track.stop());
            scannerPreview.srcObject = null;
        }

        closeModal('scannerModal');
    }

    // Initial laden
    updateMaterialListe();
});
