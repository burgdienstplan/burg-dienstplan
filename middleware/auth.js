// Prüft ob der Benutzer eingeloggt ist
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// Prüft ob der Benutzer die richtige Rolle hat
const requireRole = (role) => {
    return (req, res, next) => {
        if (req.session.role !== role) {
            return res.status(403).render('error', {
                message: 'Keine Berechtigung für diese Seite'
            });
        }
        next();
    };
};

module.exports = {
    requireAuth,
    requireRole
};
