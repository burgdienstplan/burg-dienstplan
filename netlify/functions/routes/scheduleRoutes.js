const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

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

// Dienstplan Routen
router.get('/schedule', requireAuth, scheduleController.getMonthSchedule);
router.post('/schedule/:employeeId', requireAuth, scheduleController.updateScheduleEntry);
router.patch('/schedule/entries/:entryId/status', requireAuth, requireKastellan, scheduleController.updateEntryStatus);

// Feiertage Routen
router.post('/holidays', requireAuth, requireKastellan, scheduleController.updateHoliday);
router.delete('/holidays/:holidayId', requireAuth, requireKastellan, scheduleController.deleteHoliday);

module.exports = router;
