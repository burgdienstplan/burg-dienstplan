const { MaintenanceTask, LiftTask, MaterialInventory, MaterialLog } = require('../models/maintenance');

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
