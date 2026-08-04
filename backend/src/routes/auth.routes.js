const express = require('express');
const { candidateStart, adminLogin, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/candidate-start', candidateStart);
router.post('/admin/login', adminLogin);
router.get('/me', protect, getMe);

module.exports = router;
