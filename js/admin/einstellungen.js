class Einstellungen {
    constructor() {
        this.loadEinstellungen();
        this.bindEvents();
    }

    loadEinstellungen() {
        // Lade gespeicherte Einstellungen
        const settings = JSON.parse(localStorage.getItem('einstellungen') || '{}');
        
        // Ruhetage
        const ruhetage = settings.ruhetage || [];
        document.querySelectorAll('input[name="ruhetage"]').forEach(checkbox => {
            checkbox.checked = ruhetage.includes(parseInt(checkbox.value));
        });

        // Logo
        const logoUrl = settings.logoUrl || '../img/logo.svg';
        document.getElementById('logoPreview').src = logoUrl;
        document.querySelectorAll('.logo').forEach(logo => {
            logo.src = logoUrl;
        });

        // Benutzerdefinierte Einstellungen
        const customSettings = settings.custom || {};
        this.renderCustomSettings(customSettings);
    }

    bindEvents() {
        // Logo Upload
        const logoUpload = document.getElementById('logoUpload');
        if (logoUpload) {
            logoUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && (file.type === 'image/png' || file.type === 'image/svg+xml') && file.size <= 1024 * 1024) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const logoUrl = e.target.result;
                        document.getElementById('logoPreview').src = logoUrl;
                        document.querySelectorAll('.logo').forEach(logo => {
                            logo.src = logoUrl;
                        });
                        
                        // Speichere Logo URL
                        const settings = JSON.parse(localStorage.getItem('einstellungen') || '{}');
                        settings.logoUrl = logoUrl;
                        localStorage.setItem('einstellungen', JSON.stringify(settings));
                    };
                    reader.readAsDataURL(file);
                } else {
                    alert('Bitte nur PNG oder SVG-Dateien bis 1MB Größe hochladen.');
                    logoUpload.value = '';
                }
            });
        }

        // Ruhetage
        document.querySelectorAll('input[name="ruhetage"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.saveRuhetage());
        });

        // Neue Einstellung hinzufügen
        const addSettingBtn = document.getElementById('addSettingBtn');
        if (addSettingBtn) {
            addSettingBtn.addEventListener('click', () => this.showAddSettingDialog());
        }

        // Modal schließen
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('settingModal').style.display = 'none';
            });
        });

        // Neue Einstellung speichern
        document.getElementById('settingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('settingName').value;
            const value = document.getElementById('settingValue').value;
            
            const settings = JSON.parse(localStorage.getItem('einstellungen') || '{}');
            settings.custom = settings.custom || {};
            settings.custom[name] = value;
            
            localStorage.setItem('einstellungen', JSON.stringify(settings));
            this.renderCustomSettings(settings.custom);
            
            // Modal schließen und Form zurücksetzen
            document.getElementById('settingModal').style.display = 'none';
            document.getElementById('settingForm').reset();
        });

        // Einstellungen speichern
        document.getElementById('settingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCustomSettings();
        });
    }

    saveRuhetage() {
        const ruhetage = Array.from(document.querySelectorAll('input[name="ruhetage"]:checked'))
            .map(cb => parseInt(cb.value));
        
        const settings = JSON.parse(localStorage.getItem('einstellungen') || '{}');
        settings.ruhetage = ruhetage;
        localStorage.setItem('einstellungen', JSON.stringify(settings));
    }

    showAddSettingDialog() {
        const modal = document.getElementById('settingModal');
        const form = document.getElementById('settingForm');
        form.reset();
        modal.style.display = 'block';
    }

    renderCustomSettings(settings) {
        const container = document.getElementById('customSettings');
        if (!container) return;

        container.innerHTML = Object.entries(settings).map(([key, value]) => `
            <div class="setting-item" data-key="${key}">
                <div class="setting-header">
                    <label>${key}</label>
                    <div class="setting-actions">
                        <button type="button" class="btn-edit" onclick="einstellungen.editSetting('${key}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn-delete" onclick="einstellungen.deleteSetting('${key}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <input type="text" class="form-control" value="${value}" 
                       onchange="einstellungen.updateSetting('${key}', this.value)">
            </div>
        `).join('');
    }

    saveCustomSettings() {
        const settings = JSON.parse(localStorage.getItem('einstellungen') || '{}');
        settings.custom = settings.custom || {};

        // Sammle alle benutzerdefinierten Einstellungen
        document.querySelectorAll('.setting-item').forEach(item => {
            const key = item.dataset.key;
            const value = item.querySelector('input').value;
            settings.custom[key] = value;
        });

        localStorage.setItem('einstellungen', JSON.stringify(settings));
        this.renderCustomSettings(settings.custom);
    }

    editSetting(key) {
        const item = document.querySelector(`.setting-item[data-key="${key}"]`);
        if (!item) return;

        const input = item.querySelector('input');
        input.focus();
    }

    deleteSetting(key) {
        if (!confirm('Möchten Sie diese Einstellung wirklich löschen?')) return;

        const settings = JSON.parse(localStorage.getItem('einstellungen') || '{}');
        if (settings.custom && settings.custom[key]) {
            delete settings.custom[key];
            localStorage.setItem('einstellungen', JSON.stringify(settings));
            this.renderCustomSettings(settings.custom);
        }
    }

    updateSetting(key, value) {
        const settings = JSON.parse(localStorage.getItem('einstellungen') || '{}');
        settings.custom = settings.custom || {};
        settings.custom[key] = value;
        localStorage.setItem('einstellungen', JSON.stringify(settings));
    }

    exportMonth() {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        this.exportDienste(`${year}-${month.toString().padStart(2, '0')}`);
    }

    exportYear() {
        const year = new Date().getFullYear();
        this.exportDienste(year.toString());
    }

    exportDienste(period) {
        const dienste = JSON.parse(localStorage.getItem('dienste') || '{}');
        const data = dienste[period] || {};
        
        // Erstelle CSV
        let csv = 'Datum,Position,Mitarbeiter\n';
        
        Object.entries(data).forEach(([date, positions]) => {
            Object.entries(positions).forEach(([position, mitarbeiter]) => {
                csv += `${date},${position},${mitarbeiter}\n`;
            });
        });
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `dienstplan_${period}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    window.einstellungen = new Einstellungen();
});
