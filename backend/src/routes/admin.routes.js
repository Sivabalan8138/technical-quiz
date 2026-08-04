const express = require('express');
const { getStats, getQuizResults, getQuizAnalytics } = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes below this middleware are protected and require Admin role
router.use(protect);
router.use(authorize('Admin'));

router.get('/stats', getStats);
router.get('/quizzes/:quizId/results', getQuizResults);
router.get('/quizzes/:quizId/analytics', getQuizAnalytics);

module.exports = router;
