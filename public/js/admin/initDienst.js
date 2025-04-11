// Initialisiere Test-Dienst
const testDienst = {
    id: 'test-1',
    mitarbeiterId: '2', // Max Mustermann
    datum: '2025-04-18',
    position: 'kassa',
    status: 'genehmigt'
};

// Speichern in localStorage
const dienste = JSON.parse(localStorage.getItem('dienstAnfragen') || '[]');
if (!dienste.find(d => d.id === testDienst.id)) {
    dienste.push(testDienst);
    localStorage.setItem('dienstAnfragen', JSON.stringify(dienste));
    console.log('Test-Dienst wurde hinzugefügt');
}
