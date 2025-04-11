const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { isAuthenticated, hasRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Wartungsplan-Routen
router.get('/schedule', 
    isAuthenticated,
    hasRole(['kastellan', 'hausmeister']),
    maintenanceController.getMaintenanceSchedule
);

router.post('/schedule',
    isAuthenticated,
    hasRole(['kastellan']),
    maintenanceController.createMaintenance
);

router.get('/schedule/:maintenanceId',
    isAuthenticated,
    hasRole(['kastellan', 'hausmeister']),
    maintenanceController.getMaintenanceDetails
);

router.put('/schedule/:maintenanceId/status',
    isAuthenticated,
    hasRole(['kastellan', 'hausmeister']),
    maintenanceController.updateMaintenanceStatus
);

router.delete('/schedule/:maintenanceId',
    isAuthenticated,
    hasRole(['kastellan']),
    maintenanceController.deleteMaintenance
);

// Bildupload für Wartungsdokumentation
router.post('/schedule/:maintenanceId/images',
    isAuthenticated,
    hasRole(['kastellan', 'hausmeister']),
    upload.array('images', 5),
    maintenanceController.uploadMaintenanceImages
);

// Dashboard-Statistiken
router.get('/stats',
    isAuthenticated,
    hasRole(['kastellan', 'hausmeister']),
    maintenanceController.getDashboardStats
);

// Materiallager-Routen
router.get('/inventory',
    isAuthenticated,
    hasRole(['kastellan', 'hausmeister']),
    maintenanceController.getInventory
);

router.post('/inventory',
    isAuthenticated,
    hasRole(['kastellan', 'hausmeister']),
    maintenanceController.addInventoryItem
);

router.put('/inventory/:itemId',
    isAuthenticated,
    hasRole(['kastellan', 'hausmeister']),
    maintenanceController.updateInventoryItem
);

router.delete('/inventory/:itemId',
    isAuthenticated,
    hasRole(['kastellan']),
    maintenanceController.deleteInventoryItem
);

// Materialverbrauch
router.post('/inventory/:itemId/usage',
    isAuthenticated,
    hasRole(['kastellan', 'hausmeister']),
    maintenanceController.logMaterialUsage
);

module.exports = router;
