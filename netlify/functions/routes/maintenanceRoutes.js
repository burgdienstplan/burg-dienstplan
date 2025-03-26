const express = require('express');
const router = express.Router();
const { MaintenanceTask, LiftTask, MaterialInventory } = require('../models/maintenance');

// Middleware für Authentifizierung
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Nicht angemeldet' });
    }
    next();
};

// Middleware für Hausmeister-Rolle
const requireMaintenance = (req, res, next) => {
    if (req.session.user.role !== 'hausmeister') {
        return res.status(403).json({ error: 'Keine Berechtigung' });
    }
    next();
};

// Aufgaben abrufen
router.get('/tasks', requireAuth, requireMaintenance, async (req, res) => {
    try {
        const { priority, status, sort } = req.query;
        let query = {};

        if (priority && priority !== 'all') {
            query.priority = priority;
        }
        if (status && status !== 'all') {
            query.status = status;
        }

        let sortQuery = {};
        switch (sort) {
            case 'priority':
                sortQuery = { priority: -1, dueDate: 1 };
                break;
            case 'dueDate':
                sortQuery = { dueDate: 1 };
                break;
            case 'createdAt':
                sortQuery = { createdAt: -1 };
                break;
            default:
                sortQuery = { priority: -1, dueDate: 1 };
        }

        const tasks = await MaintenanceTask.find(query)
            .sort(sortQuery)
            .populate('assignedTo', 'firstName lastName')
            .populate('createdBy', 'firstName lastName');

        res.json(tasks);
    } catch (error) {
        console.error('Fehler beim Abrufen der Aufgaben:', error);
        res.status(500).json({ error: 'Ein Fehler ist aufgetreten' });
    }
});

// Lift-Status abrufen
router.get('/lift/status', requireAuth, requireMaintenance, async (req, res) => {
    try {
        const now = new Date();
        
        // Nächste Wartung finden
        const nextMaintenance = await LiftTask.findOne({
            type: 'maintenance',
            status: 'scheduled',
            scheduledDate: { $gt: now }
        }).sort({ scheduledDate: 1 });

        // Tage bis zur nächsten Wartung berechnen
        const daysUntilMaintenance = nextMaintenance 
            ? Math.ceil((nextMaintenance.scheduledDate - now) / (1000 * 60 * 60 * 24))
            : 0;

        // Statistiken abrufen
        const [completedTasks, pendingTasks] = await Promise.all([
            LiftTask.countDocuments({ status: 'completed' }),
            LiftTask.countDocuments({ status: { $in: ['scheduled', 'in_progress'] } })
        ]);

        res.json({
            daysUntilMaintenance,
            completedTasks,
            pendingTasks
        });
    } catch (error) {
        console.error('Fehler beim Abrufen des Lift-Status:', error);
        res.status(500).json({ error: 'Ein Fehler ist aufgetreten' });
    }
});

// Lift-Aufgaben für ein Datum abrufen
router.get('/lift/tasks', requireAuth, requireMaintenance, async (req, res) => {
    try {
        const date = new Date(req.query.date);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const tasks = await LiftTask.find({
            scheduledDate: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        })
        .populate('assignedTo', 'firstName lastName')
        .populate('createdBy', 'firstName lastName');

        res.json(tasks);
    } catch (error) {
        console.error('Fehler beim Abrufen der Lift-Aufgaben:', error);
        res.status(500).json({ error: 'Ein Fehler ist aufgetreten' });
    }
});

// Materialliste abrufen
router.get('/inventory', requireAuth, requireMaintenance, async (req, res) => {
    try {
        const materials = await MaterialInventory.find()
            .sort({ name: 1 })
            .populate('updatedBy', 'firstName lastName');

        res.json(materials);
    } catch (error) {
        console.error('Fehler beim Abrufen des Materialbestands:', error);
        res.status(500).json({ error: 'Ein Fehler ist aufgetreten' });
    }
});

// Material mit niedrigem Bestand abrufen
router.get('/inventory/low', requireAuth, requireMaintenance, async (req, res) => {
    try {
        const materials = await MaterialInventory.find({
            $or: [
                { quantity: { $lte: '$minQuantity' } },
                { quantity: { $lt: 5 } }
            ]
        })
        .sort({ quantity: 1 })
        .populate('updatedBy', 'firstName lastName');

        res.json(materials);
    } catch (error) {
        console.error('Fehler beim Abrufen des niedrigen Materialbestands:', error);
        res.status(500).json({ error: 'Ein Fehler ist aufgetreten' });
    }
});

module.exports = router;
