const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

// Erstelle public Verzeichnis
if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
}

// Liste der EJS-Dateien zum Konvertieren
const files = ['index.ejs', 'login.ejs', 'error.ejs'];

files.forEach(file => {
    const template = fs.readFileSync(path.join('views', file), 'utf-8');
    const html = ejs.render(template, {
        title: 'Burg Hochosterwitz Dienstplan',
        message: '',
        error: '',
        user: null
    });
    
    const outputFile = file.replace('.ejs', '.html');
    fs.writeFileSync(path.join('public', outputFile), html);
});
