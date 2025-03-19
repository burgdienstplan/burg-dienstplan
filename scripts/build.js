const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const packageJson = require('../package.json');

// Erstelle public Verzeichnis
if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
}

// Template Variablen
const templateVars = {
    title: 'Burg Hochosterwitz Dienstplan',
    message: '',
    error: '',
    user: null,
    Version: packageJson.version,
    Entwickler: 'Martin Steindorfer'
};

// Liste der EJS-Dateien zum Konvertieren
const files = ['index.ejs', 'login.ejs', 'error.ejs'];

files.forEach(file => {
    const template = fs.readFileSync(path.join('views', file), 'utf-8');
    const html = ejs.render(template, templateVars);
    
    const outputFile = file.replace('.ejs', '.html');
    fs.writeFileSync(path.join('public', outputFile), html);
});
