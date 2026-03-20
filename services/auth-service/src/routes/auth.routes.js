const express = require('express');
const { register, login, me, updateMe, logout } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, me);
router.patch('/me', authenticateToken, updateMe);

module.exports = router;
