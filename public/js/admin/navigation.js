// Admin Navigation

document.addEventListener('DOMContentLoaded', () => {
    // Hausmeister Menü auf/zu
    const hausmeisterButton = document.querySelector('.has-submenu > a');
    hausmeisterButton.addEventListener('click', (e) => {
        e.preventDefault();
        hausmeisterButton.parentElement.classList.toggle('active');
    });

    // Sektionen anzeigen
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').slice(1);
            const section = document.getElementById(targetId);
            
            // Navigation aktiv setzen
            document.querySelectorAll('.admin-nav a').forEach(a => {
                a.parentElement.classList.remove('active');
            });
            link.parentElement.classList.add('active');
            
            // Sektion anzeigen
            if (section) {
                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                section.classList.add('active');
                
                // Wenn es ein Untermenü-Element ist, Eltern-Element auch aktiv setzen
                if (link.closest('.submenu')) {
                    link.closest('.has-submenu').classList.add('active');
                }
            }
        });
    });
});
