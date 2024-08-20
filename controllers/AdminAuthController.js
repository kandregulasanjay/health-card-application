const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    AdminRegister: async (req, res, next) => {
        try {
            const { email, hospitalName, password, mobileNo, branch, specilization, state, district, constituency, mandal, village, address } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            const admin = new Admin.create({
                email,
                hospitalName,
                password : hashedPassword,
                mobileNo,
                branch,
                specilization,
                state,
                district,
                constituency,
                mandal,
                village,
                address,
            });
            console.log(`Admin created ${admin}`);

            if (admin) {
                res.status(201).json({ _id: admin.id, email: admin.email });
            } else {
                return res.status(400).json({ message: "Admin data is not valid" });
            }

            // Send registration email
            const transporter = nodemailer.createTransport({
                host: 'smtp.zeptomail.in',
                port: 587,
                secure: false,
                auth: {
                    user: 'emailappsmtp.1e64f40e8d6b0109',
                    pass: 'h3j1a9Bs7duu',
                },
            });

            const mailOptions = {
                from: 'info@kcspro.in',
                to: email,
                subject: 'Admin Registration Successful',
                text: `You have successfully registered as an admin.\n\nHospital Name: ${hospitalName}\nBranch: ${branch}\n\nPlease keep this information secure.`,
            };

            // Send the email
            await transporter.sendMail(mailOptions);
            console.log('Email sent to', email);

            // Respond with a success message
            res.status(201).json({ message: 'Hospital Branch Added Successfully!', data: admin });

        } catch (error) {
            if (!res.headersSent) {
                res.status(500).json({ message: 'An error occurred!', error: error.message });
            } else {
                console.error('Error occurred after headers sent:', error.message);
            }
        }

    },

    AdminLogin: async (req, res, next) => {
        const { branch, password, hospitalName, email } = req.body;

        if (!email || !password || !hospitalName ||!branch) {
            res.status(400).json({ message: 'All field are required' });
        }
        const admin = await Admin.findOne({ email, hospitalName, branch });

        if (admin && (await bcrypt.compare(password, admin.password))) {
            let accessToken = jwt.sign({
                admin: {
                    hospitalName: admin.hospitalName,
                    branch: admin.branch,
                    email: admin.email,
                    id: admin.id,
                }
            }, process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_TIME }
            );
            res.status(200).json({ accessToken });
        }else {
            res.status(401).json({ message: 'email or password is not valid' });
        }
    },
    
    loginCurrent : async(req,res)=>{
        res.json(req.admin);
    }
}