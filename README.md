# Burg Hochosterwitz Dienstplan

Webbasierte Anwendung für die Verwaltung des Dienstplans der Burg Hochosterwitz.

## Features

### Admin (Kastellan)
- Dienstplan-Verwaltung
- Mitarbeiter-Verwaltung
- Führungen-Management
- Anfragen-Verwaltung (Urlaub, Dienstvorschläge)

### Mitarbeiter
- Persönlicher Dienstplan
- Dienstvorschläge einreichen
- Urlaubsanfragen stellen

### Technische Details
- Statische Webseite (HTML, CSS, JavaScript)
- Lokale Datenspeicherung (localStorage)
- Responsives Design für mobile Nutzung

## Installation

1. Repository klonen:
   ```bash
   git clone https://github.com/burgdienstplan/burg-dienstplan.git
   ```

2. In das Projektverzeichnis wechseln:
   ```bash
   cd burg-dienstplan
   ```

3. Einen lokalen Server starten (z.B. mit Python):
   ```bash
   python3 -m http.server 8000
   ```

4. Im Browser öffnen:
   ```
   http://localhost:8000
   ```

## Login-Daten

### Admin
- Benutzername: `kastellan`
- Passwort: `burg2025`

## Entwicklung

### Farben
- Burgrot: `#8B0000`
- Pergament: `#F5E6D3`
- Steingrau: `#4A4A4A`

### Hosting
Die Anwendung wird auf Netlify gehostet:
https://burg-hochosterwitz-diensplan.netlify.app
