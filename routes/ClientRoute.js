const express = require('express');
const router = express.Router();

const ClientController = require('../controllers/ClientController');
const validateToken = require('../middleware/validateToken');

router.post('/ClientRegister', ClientController.ClientRegister)
router.post('/ClientLogin',  ClientController.ClientLogin);
router.get('/ClientCurrent', validateToken, ClientController.loginCurrent);

module.exports = router;