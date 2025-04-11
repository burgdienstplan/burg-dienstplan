const { MaintenanceTask, LiftTask, MaterialInventory, MaterialLog } = require('../models/maintenance');
const Maintenance = require('../models/maintenance');
const Schedule = require('../models/schedule');
const User = require('../models/user');
const { sendNotification } = require('../services/notification');

// Dashboard-Statistiken abrufen
exports.getDashboardStats = async (req, res) => {
    try {
        // Aktuelle Aufgaben abrufen (nicht abgeschlossen/abgebrochen)
        const currentTasks = await MaintenanceTask.find({
            status: { $nin: ['completed', 'cancelled'] }
        })
        .sort({ priority: -1, dueDate: 1 })
        .limit(5)
        .populate('assignedTo', 'firstName lastName');

        // Aktuelle Lift-Aufgaben
        const liftTasks = await LiftTask.find({
            status: { $nin: ['completed', 'cancelled'] }
        })
        .sort({ scheduledDate: 1 })
        .limit(5)
        .populate('assignedTo', 'firstName lastName');

        // Materialien mit niedrigem Bestand
        const materials = await MaterialInventory.find({
            $or: [
                { quantity: { $lte: '$minQuantity' } },
                { quantity: { $lt: 5 } }
            ]
        })
        .sort({ quantity: 1 })
        .limit(5);

        res.json({
            currentTasks,
            liftTasks,
            materials
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der Dashboard-Statistiken:', error);
        res.status(500).json({ error: 'Ein Fehler ist aufgetreten' });
    }
};

// Aufgabenstatus aktualisieren
exports.updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status, comment } = req.body;

        const task = await MaintenanceTask.findById(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Aufgabe nicht gefunden' });
        }

        task.status = status;
        if (status === 'completed') {
            task.completedAt = new Date();
        }

        if (comment) {
            task.comments.push({
                text: comment,
                author: req.session.user._id
            });
        }

        await task.save();
        res.json(task);
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Aufgabenstatus:', error);
        res.status(500).json({ error: 'Ein Fehler ist aufgetreten' });
    }
};

// Lift-Aufgabenstatus aktualisieren
exports.updateLiftTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status, notes, materials } = req.body;

        const task = await LiftTask.findById(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Aufgabe nicht gefunden' });
        }

        task.status = status;
        if (status === 'completed') {
            task.completedDate = new Date();
        }

        if (notes) {
            task.notes = notes;
        }

        // Materialverbrauch protokollieren
        if (materials && materials.length > 0) {
            for (const material of materials) {
                const inventory = await MaterialInventory.findById(material.materialId);
                if (!inventory) {
                    continue;
                }

                // Bestand aktualisieren
                inventory.quantity -= material.quantity;
                await inventory.save();

                // Verbrauch protokollieren
                await MaterialLog.create({
                    material: material.materialId,
                    quantity: material.quantity,
                    type: 'out',
                    task: taskId,
                    taskType: 'LiftTask',
                    updatedBy: req.session.user._id
                });
            }
        }

        await task.save();
        res.json(task);
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Lift-Aufgabenstatus:', error);
        res.status(500).json({ error: 'Ein Fehler ist aufgetreten' });
    }
};

// Material-Bestand aktualisieren
exports.updateMaterialInventory = async (req, res) => {
    try {
        const { materialId } = req.params;
        const { quantity, type, notes } = req.body;

        const material = await MaterialInventory.findById(materialId);
        if (!material) {
            return res.status(404).json({ error: 'Material nicht gefunden' });
        }

        const oldQuantity = material.quantity;
        if (type === 'in') {
            material.quantity += quantity;
        } else if (type === 'out') {
            if (material.quantity < quantity) {
                return res.status(400).json({ error: 'Nicht genügend Material verfügbar' });
            }
            material.quantity -= quantity;
        }

        material.lastUpdated = new Date();
        material.updatedBy = req.session.user._id;
        await material.save();

        // Änderung protokollieren
        await MaterialLog.create({
            material: materialId,
            quantity,
            type,
            updatedBy: req.session.user._id,
            notes
        });

        res.json(material);
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Material-Bestands:', error);
        res.status(500).json({ error: 'Ein Fehler ist aufgetreten' });
    }
};

// Wartung erstellen
exports.createMaintenance = async (req, res) => {
    try {
        const { type, description, dueDate, assignedTo } = req.body;

        // Prüfe Hausmeister-Verfügbarkeit
        const existingSchedule = await Schedule.findOne({
            date: new Date(dueDate),
            employee: assignedTo
        });

        if (existingSchedule) {
            return res.status(400).json({
                error: 'Hausmeister ist an diesem Tag bereits eingeplant'
            });
        }

        // Erstelle Wartungsaufgabe
        const maintenance = new Maintenance({
            type,
            description,
            dueDate: new Date(dueDate),
            assignedTo,
            status: 'geplant',
            createdBy: req.user._id
        });

        await maintenance.save();

        // Erstelle Schicht für den Hausmeister
        const schedule = new Schedule({
            date: new Date(dueDate),
            employee: assignedTo,
            type: 'maintenance',
            reference: maintenance._id
        });

        await schedule.save();

        // Benachrichtige den Hausmeister
        const hausmeister = await User.findById(assignedTo);
        if (hausmeister) {
            await sendNotification({
                userId: hausmeister._id,
                title: 'Neue Wartungsaufgabe',
                message: `Sie wurden für eine ${type} Wartung am ${new Date(dueDate).toLocaleDateString('de-DE')} eingeteilt.`,
                type: 'maintenance'
            });
        }

        res.status(201).json({ maintenance, schedule });
    } catch (error) {
        console.error('Fehler beim Erstellen der Wartung:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
};

// Wartungsstatus aktualisieren
exports.updateMaintenanceStatus = async (req, res) => {
    try {
        const { maintenanceId } = req.params;
        const { status, notes, images } = req.body;

        const maintenance = await Maintenance.findById(maintenanceId);
        if (!maintenance) {
            return res.status(404).json({ error: 'Wartung nicht gefunden' });
        }

        maintenance.status = status;
        if (notes) {
            maintenance.notes.push({
                content: notes,
                createdAt: new Date(),
                createdBy: req.user._id
            });
        }

        if (images && images.length > 0) {
            maintenance.images.push(...images.map(image => ({
                data: image,
                uploadedAt: new Date(),
                uploadedBy: req.user._id
            })));
        }

        await maintenance.save();

        // Benachrichtige den Kastellan bei Statusänderungen
        const kastellan = await User.findOne({ role: 'kastellan' });
        if (kastellan) {
            await sendNotification({
                userId: kastellan._id,
                title: 'Wartungsstatus aktualisiert',
                message: `Die Wartung #${maintenance._id} wurde auf "${status}" gesetzt.`,
                type: 'maintenance-update'
            });
        }

        res.json(maintenance);
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Wartung:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
};

// Wartungsplan abrufen
exports.getMaintenanceSchedule = async (req, res) => {
    try {
        const { start, end } = req.query;
        const query = {
            dueDate: {}
        };

        if (start) {
            query.dueDate.$gte = new Date(start);
        }
        if (end) {
            query.dueDate.$lte = new Date(end);
        }

        const maintenances = await Maintenance.find(query)
            .populate('assignedTo', 'name')
            .populate('createdBy', 'name')
            .sort({ dueDate: 1 });

        res.json(maintenances);
    } catch (error) {
        console.error('Fehler beim Abrufen des Wartungsplans:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
};

// Wartungsdetails abrufen
exports.getMaintenanceDetails = async (req, res) => {
    try {
        const { maintenanceId } = req.params;
        const maintenance = await Maintenance.findById(maintenanceId)
            .populate('assignedTo', 'name')
            .populate('createdBy', 'name')
            .populate('notes.createdBy', 'name');

        if (!maintenance) {
            return res.status(404).json({ error: 'Wartung nicht gefunden' });
        }

        res.json(maintenance);
    } catch (error) {
        console.error('Fehler beim Abrufen der Wartungsdetails:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
};

// Wartung löschen
exports.deleteMaintenance = async (req, res) => {
    try {
        const { maintenanceId } = req.params;

        // Prüfe Berechtigung (nur Kastellan darf löschen)
        if (req.user.role !== 'kastellan') {
            return res.status(403).json({
                error: 'Keine Berechtigung zum Löschen von Wartungen'
            });
        }

        const maintenance = await Maintenance.findById(maintenanceId);
        if (!maintenance) {
            return res.status(404).json({ error: 'Wartung nicht gefunden' });
        }

        // Lösche zugehörige Schicht
        await Schedule.deleteOne({
            type: 'maintenance',
            reference: maintenanceId
        });

        // Lösche die Wartung
        await maintenance.remove();

        // Benachrichtige den zugewiesenen Hausmeister
        const hausmeister = await User.findById(maintenance.assignedTo);
        if (hausmeister) {
            await sendNotification({
                userId: hausmeister._id,
                title: 'Wartung gelöscht',
                message: `Die Wartung am ${maintenance.dueDate.toLocaleDateString('de-DE')} wurde storniert.`,
                type: 'maintenance-cancelled'
            });
        }

        res.json({ message: 'Wartung erfolgreich gelöscht' });
    } catch (error) {
        console.error('Fehler beim Löschen der Wartung:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
};
