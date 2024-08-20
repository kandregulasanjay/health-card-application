const express = require('express');
const router = express.Router();

const AdminAuthController = require('../controllers/AdminAuthController');
const validateToken = require('../middleware/validateToken');

router.post('/AdminRegister', AdminAuthController.AdminRegister)
router.post('/AdminLogin',  AdminAuthController.AdminLogin);
router.get('/AdminCurrent', validateToken, AdminAuthController.loginCurrent);

module.exports = router;