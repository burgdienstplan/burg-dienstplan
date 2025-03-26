const { ScheduleEntry, Holiday } = require('../models/schedule');
const Employee = require('../models/employee');
const moment = require('moment');
const Holidays = require('date-holidays');

// Österreichische Feiertage
const hd = new Holidays('AT');

// Hilfsfunktion: Prüft ob ein Tag ein Feiertag ist
const isHoliday = (date) => {
  const holidays = hd.isHoliday(date);
  return holidays ? holidays[0].name : null;
};

// Hilfsfunktion: Prüft ob genug Personal für einen Tag eingeplant ist
const validateStaffing = async (date) => {
  const entries = await ScheduleEntry.find({ 
    date,
    status: 'approved',
    type: 'work'
  }).populate('employee');

  // Mindestens eine Person muss im Shop-Eintritt sein
  const hasShopEintritt = entries.some(entry => 
    entry.position === 'shop_eintritt' && entry.employee.isActive
  );

  return hasShopEintritt;
};

// Monatsplan abrufen
exports.getMonthSchedule = async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = moment(`${year}-${month}-01`).startOf('month');
    const endDate = moment(startDate).endOf('month');

    // Alle Einträge für den Monat laden
    const entries = await ScheduleEntry.find({
      date: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate()
      }
    }).populate('employee', 'firstName lastName role');

    // Feiertage für den Monat laden
    const holidays = await Holiday.find({
      date: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate()
      }
    });

    // Automatisch österreichische Feiertage hinzufügen
    const monthDays = endDate.diff(startDate, 'days') + 1;
    const autoHolidays = [];
    
    for (let i = 0; i < monthDays; i++) {
      const currentDate = moment(startDate).add(i, 'days');
      const holidayName = isHoliday(currentDate.toDate());
      
      if (holidayName && !holidays.some(h => 
        moment(h.date).format('YYYY-MM-DD') === currentDate.format('YYYY-MM-DD')
      )) {
        autoHolidays.push({
          date: currentDate.toDate(),
          name: holidayName,
          type: 'holiday'
        });
      }
    }

    if (autoHolidays.length > 0) {
      await Holiday.insertMany(autoHolidays);
      holidays.push(...autoHolidays);
    }

    res.json({ entries, holidays });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dienstplan-Eintrag erstellen/bearbeiten
exports.updateScheduleEntry = async (req, res) => {
  try {
    const { date, position, type } = req.body;
    const employeeId = req.params.employeeId || req.session.user._id;

    // Prüfen ob der Mitarbeiter aktiv ist
    const employee = await Employee.findById(employeeId);
    if (!employee || !employee.isActive) {
      return res.status(400).json({ error: 'Mitarbeiter nicht verfügbar' });
    }

    // Prüfen ob der Mitarbeiter die Position ausführen darf
    if (!employee.positions.includes(position)) {
      return res.status(400).json({ error: 'Position nicht erlaubt' });
    }

    // Existierenden Eintrag suchen oder neu erstellen
    let entry = await ScheduleEntry.findOne({
      employee: employeeId,
      date: new Date(date)
    });

    if (entry) {
      // Eintrag aktualisieren
      entry.position = position;
      entry.type = type;
      entry.status = req.session.user.role === 'kastellan' ? 'approved' : 'requested';
    } else {
      // Neuen Eintrag erstellen
      entry = new ScheduleEntry({
        employee: employeeId,
        date: new Date(date),
        position,
        type,
        status: req.session.user.role === 'kastellan' ? 'approved' : 'requested'
      });
    }

    await entry.save();

    // Wenn der Kastellan einen Eintrag erstellt/bearbeitet, Personalbesetzung prüfen
    if (req.session.user.role === 'kastellan') {
      const isValid = await validateStaffing(new Date(date));
      if (!isValid) {
        return res.status(200).json({
          entry,
          warning: 'Achtung: Keine Besetzung für Shop-Eintritt an diesem Tag!'
        });
      }
    }

    res.json({ entry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dienstplan-Eintrag genehmigen/ablehnen (nur Kastellan)
exports.updateEntryStatus = async (req, res) => {
  try {
    if (req.session.user.role !== 'kastellan') {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const entry = await ScheduleEntry.findById(req.params.entryId);
    if (!entry) {
      return res.status(404).json({ error: 'Eintrag nicht gefunden' });
    }

    entry.status = req.body.status;
    entry.approvedBy = req.session.user._id;
    entry.approvedAt = new Date();

    await entry.save();

    // Personalbesetzung prüfen
    const isValid = await validateStaffing(entry.date);
    if (!isValid) {
      return res.status(200).json({
        entry,
        warning: 'Achtung: Keine Besetzung für Shop-Eintritt an diesem Tag!'
      });
    }

    res.json({ entry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Feiertag erstellen/bearbeiten (nur Kastellan)
exports.updateHoliday = async (req, res) => {
  try {
    if (req.session.user.role !== 'kastellan') {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const { date, name, type } = req.body;

    let holiday = await Holiday.findOne({ date: new Date(date) });
    if (holiday) {
      holiday.name = name;
      holiday.type = type;
    } else {
      holiday = new Holiday({ date: new Date(date), name, type });
    }

    await holiday.save();
    res.json({ holiday });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Feiertag löschen (nur Kastellan)
exports.deleteHoliday = async (req, res) => {
  try {
    if (req.session.user.role !== 'kastellan') {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    await Holiday.findByIdAndDelete(req.params.holidayId);
    res.json({ message: 'Feiertag gelöscht' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
