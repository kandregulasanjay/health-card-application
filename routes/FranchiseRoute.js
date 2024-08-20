const express = require('express');
const router = express.Router();

const {registerFranchise,loginFranchise, loginCurrent,} = require('../controllers/FranchiseController');
const upload = require('../middleware/upload.js');
const validateToken = require('../middleware/validateToken.js');

router.post('/FranchiseRegister', upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'aadharCardFront', maxCount: 1 },
    { name: 'aadharCardBack', maxCount: 1 }
]),registerFranchise);

router.post('/FranchiseLogin', upload.none(), loginFranchise);
router.post('/FranchiseCurrent', validateToken, loginCurrent);

module.exports =router;