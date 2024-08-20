const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler')

const validateToken = asyncHandler(async (req, res, next) => {
    let token;
    let authHeader = req.headers.Authorization || req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer")) {
        token = authHeader.split(" ")[1]
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                res.status(401).json({ message: 'User is not authorized' });
            }
           req.user = decoded.user;
           next();
        });
        if(!token){
            res.status(401).json({message  : "User is not authorized or Token is missing"});
        }
    }
});
module.exports = validateToken;