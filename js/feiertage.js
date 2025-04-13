// Österreichische Feiertage

function getOsterSonntag(jahr) {
    // Gaussche Osterformel
    const a = jahr % 19;
    const b = jahr % 4;
    const c = jahr % 7;
    const k = Math.floor(jahr / 100);
    const p = Math.floor((13 + 8 * k) / 25);
    const q = Math.floor(k / 4);
    const M = (15 - p + k - q) % 30;
    const N = (4 + k - q) % 7;
    const d = (19 * a + M) % 30;
    const e = (2 * b + 4 * c + 6 * d + N) % 7;
    const days = (22 + d + e);

    // Sonderfälle berücksichtigen
    if (d === 29 && e === 6) {
        return new Date(jahr, 3, 19); // 19. April
    } else if (d === 28 && e === 6) {
        return new Date(jahr, 3, 18); // 18. April
    } else if (days > 31) {
        return new Date(jahr, 3, days - 31); // April
    } else {
        return new Date(jahr, 2, days); // März
    }
}

function getFeiertage(jahr) {
    // Festes Datum für Feiertage
    const feiertage = {
        'Neujahr': new Date(jahr, 0, 1),
        'Heilige Drei Könige': new Date(jahr, 0, 6),
        'Staatsfeiertag': new Date(jahr, 4, 1),
        'Maria Himmelfahrt': new Date(jahr, 7, 15),
        'Nationalfeiertag': new Date(jahr, 9, 26),
        'Allerheiligen': new Date(jahr, 10, 1),
        'Maria Empfängnis': new Date(jahr, 11, 8),
        'Christtag': new Date(jahr, 11, 25),
        'Stefanitag': new Date(jahr, 11, 26)
    };

    // Bewegliche Feiertage basierend auf Ostern
    const osterSonntag = getOsterSonntag(jahr);
    
    // Karfreitag (2 Tage vor Ostersonntag)
    const karfreitag = new Date(osterSonntag);
    karfreitag.setDate(osterSonntag.getDate() - 2);
    feiertage['Karfreitag'] = karfreitag;

    // Ostermontag (1 Tag nach Ostersonntag)
    const ostermontag = new Date(osterSonntag);
    ostermontag.setDate(osterSonntag.getDate() + 1);
    feiertage['Ostermontag'] = ostermontag;

    // Christi Himmelfahrt (39 Tage nach Ostersonntag)
    const christiHimmelfahrt = new Date(osterSonntag);
    christiHimmelfahrt.setDate(osterSonntag.getDate() + 39);
    feiertage['Christi Himmelfahrt'] = christiHimmelfahrt;

    // Pfingstmontag (50 Tage nach Ostersonntag)
    const pfingstmontag = new Date(osterSonntag);
    pfingstmontag.setDate(osterSonntag.getDate() + 50);
    feiertage['Pfingstmontag'] = pfingstmontag;

    // Fronleichnam (60 Tage nach Ostersonntag)
    const fronleichnam = new Date(osterSonntag);
    fronleichnam.setDate(osterSonntag.getDate() + 60);
    feiertage['Fronleichnam'] = fronleichnam;

    return feiertage;
}

// Prüft ob ein Datum ein Feiertag ist
function isFeiertag(datum) {
    const jahr = datum.getFullYear();
    const feiertage = getFeiertage(jahr);
    
    for (const [name, feiertag] of Object.entries(feiertage)) {
        if (datum.getDate() === feiertag.getDate() &&
            datum.getMonth() === feiertag.getMonth() &&
            datum.getFullYear() === feiertag.getFullYear()) {
            return name;
        }
    }
    
    return false;
}

// Exportiere die Funktionen
window.getFeiertage = getFeiertage;
window.isFeiertag = isFeiertag;
