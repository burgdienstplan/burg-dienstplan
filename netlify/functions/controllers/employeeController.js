const bcrypt = require('bcryptjs');
const Employee = require('../models/employee');

// Hilfsfunktion zum Hashen von Passwörtern
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Mitarbeiter erstellen (nur Kastellan)
exports.createEmployee = async (req, res) => {
  try {
    if (req.session.user.role !== 'kastellan') {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const hashedPassword = await hashPassword(req.body.password);
    
    const employee = new Employee({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      username: req.body.username,
      password: hashedPassword,
      role: req.body.role,
      positions: req.body.positions || [],
      languages: req.body.languages || [],
      specialTours: req.body.specialTours || []
    });

    await employee.save();
    res.status(201).json({ message: 'Mitarbeiter erstellt', id: employee._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Alle Mitarbeiter auflisten (nur Kastellan)
exports.listEmployees = async (req, res) => {
  try {
    if (req.session.user.role !== 'kastellan') {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const employees = await Employee.find({}, '-password');
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Einzelnen Mitarbeiter anzeigen
exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id, '-password');
    
    if (!employee) {
      return res.status(404).json({ error: 'Mitarbeiter nicht gefunden' });
    }

    // Nur Kastellan oder der Mitarbeiter selbst dürfen die Daten sehen
    if (req.session.user.role !== 'kastellan' && 
        req.session.user._id.toString() !== employee._id.toString()) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mitarbeiter aktualisieren
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Mitarbeiter nicht gefunden' });
    }

    // Prüfen der Berechtigungen
    if (req.session.user.role !== 'kastellan' && 
        req.session.user._id.toString() !== employee._id.toString()) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    // Mitarbeiter können nur bestimmte Felder ändern
    if (req.session.user.role !== 'kastellan') {
      const allowedUpdates = ['email', 'phone', 'password'];
      const updates = Object.keys(req.body);
      const isValidOperation = updates.every(update => allowedUpdates.includes(update));
      
      if (!isValidOperation) {
        return res.status(400).json({ error: 'Ungültige Aktualisierungen' });
      }
    }

    // Wenn das Passwort geändert wird, muss es gehasht werden
    if (req.body.password) {
      req.body.password = await hashPassword(req.body.password);
    }

    Object.assign(employee, req.body);
    await employee.save();

    res.json({ message: 'Mitarbeiter aktualisiert' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Mitarbeiter deaktivieren/aktivieren (nur Kastellan)
exports.toggleEmployeeStatus = async (req, res) => {
  try {
    if (req.session.user.role !== 'kastellan') {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Mitarbeiter nicht gefunden' });
    }

    employee.isActive = !employee.isActive;
    await employee.save();

    res.json({ 
      message: `Mitarbeiter ${employee.isActive ? 'aktiviert' : 'deaktiviert'}` 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Passwort zurücksetzen (nur Kastellan)
exports.resetPassword = async (req, res) => {
  try {
    if (req.session.user.role !== 'kastellan') {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Mitarbeiter nicht gefunden' });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    employee.password = await hashPassword(tempPassword);
    await employee.save();

    res.json({ 
      message: 'Passwort zurückgesetzt',
      tempPassword // In Produktion würde das per E-Mail versendet
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
