const express = require('express');
const router = express.Router();
const studentTestController = require('../controllers/studentTestController');
const resultController = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/auth');

// All student routes require authentication + student role
router.use(protect);
router.use(authorize('student'));

// Tests
router.get('/tests', studentTestController.getAvailableTests);
router.get('/tests/:id/start', studentTestController.getTestForAttempt);
router.post('/tests/:id/submit', studentTestController.submitTest);

// Results
router.get('/results', studentTestController.getMyResults);
router.get('/results/:id', studentTestController.getResultDetail);

// PDF export (reuses the shared controller — ownership check is inside)
router.get('/results/:id/pdf', resultController.exportSingleResultPDF);

module.exports = router;
