const express = require('express');
const router = express.Router();

const {registerUser,loginUser,loginCurrent} = require('../controllers/UserController');
const upload = require('../middleware/upload.js');
const validateToken = require('../middleware/validateToken.js');

router.post('/UserRegister', upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'aadharCardFront', maxCount: 1 },
    { name: 'aadharCardBack', maxCount: 1 }
]), registerUser);

router.post('/UserLogin', upload.none(), loginUser);
router.get('/UserCurrent',validateToken, loginCurrent);


module.exports =router;