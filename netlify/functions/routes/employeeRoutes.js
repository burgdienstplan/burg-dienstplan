const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// Middleware für Authentifizierung
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Nicht angemeldet' });
  }
  next();
};

// Middleware für Kastellan-Berechtigung
const requireKastellan = (req, res, next) => {
  if (req.session.user.role !== 'kastellan') {
    return res.status(403).json({ error: 'Keine Berechtigung' });
  }
  next();
};

// Routen
router.post('/employees', requireAuth, requireKastellan, employeeController.createEmployee);
router.get('/employees', requireAuth, requireKastellan, employeeController.listEmployees);
router.get('/employees/:id', requireAuth, employeeController.getEmployee);
router.put('/employees/:id', requireAuth, employeeController.updateEmployee);
router.patch('/employees/:id/toggle-status', requireAuth, requireKastellan, employeeController.toggleEmployeeStatus);
router.post('/employees/:id/reset-password', requireAuth, requireKastellan, employeeController.resetPassword);

module.exports = router;
