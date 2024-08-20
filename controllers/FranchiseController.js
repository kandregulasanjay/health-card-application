const Franchise = require("../models/Franchise");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const dotenv = require('dotenv');
dotenv.config();

module.exports = {

    registerFranchise: async (req, res, next) => {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const franchise = new Franchise.create({
                franchiseName: req.body.franchiseName,
                franchiseLocation: req.body.franchiseLocation,
                name: req.body.name,
                gender: req.body.gender,
                dob: req.body.dob,
                email: req.body.email,
                password: hashedPassword,
                mobileNo: req.body.mobileNo,
                aadharNo: req.body.aadharNo,
                state: req.body.state,
                district: req.body.district,
                constituency: req.body.constituency,
                mandal: req.body.mandal,
                village: req.body.village,
                address: req.body.address,
                photo: req.files['photo'] ? req.files['photo'][0].path : undefined,
                aadharCardFront: req.files['aadharCardFront'] ? req.files['aadharCardFront'][0].path : undefined,
                aadharCardBack: req.files['aadharCardBack'] ? req.files['aadharCardBack'][0].path : undefined,
            })

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
                subject: 'Franchise Registration Successful',
                text: `You have successfully registered as an Franchise Partner.\n\nFranchise Name: ${franchise.franchiseName}\n Franchise Location: ${franchise.franchiseLocation}\n\nPlease keep this information secure.`,
            };

            // Send the email
            await transporter.sendMail(mailOptions);
            console.log('Email sent to', email);

            // Respond with a success message
            res.status(201).json({ message: 'Franchise Added Successfully!', data: franchise });

        } catch (error) {
            res.status(500).json({ message: 'An error occurred!', error: error.message });
        }
    },

    loginFranchise: async (req, res, next) => {
        const { franchiseName, email, franchiseLocation, password, district, mandal, village, constituency } = req.body;
    
        try {
            const franchise = await Franchise.findOne({ $and: [{ email: email }, { franchiseLocation: franchiseLocation }, { franchiseName: franchiseName }] });
    
            if (franchise && (await bcrypt.compare(password, franchise.password))) {
                let accessToken = jwt.sign({
                    franchise: {
                        franchiseName: franchise.franchiseName,
                        franchiseLocation: franchise.franchiseLocation,
                        email: franchise.email,
                        id: franchise.id,
                    }
                }, process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_TIME }
                );
    
                let redirectPath = '';
    
                if (franchiseLocation === 'District' && franchise.district === district) {
                    redirectPath = '/districtDashboard';
                } else if (franchiseLocation === 'Mandal' && franchise.mandal === mandal) {
                    redirectPath = '/mandalDashboard';
                } else if (franchiseLocation === 'Village' && franchise.village === village) {
                    redirectPath = '/villageDashboard';
                } else if (franchiseLocation === 'Constituency' && franchise.constituency === constituency) {
                    redirectPath = '/constituencyDashboard';
                } else {
                    return res.status(400).json({ message: 'No matching franchise found for the provided location details.' });
                }
    
                return res.status(200).json({
                    message: 'Login Successful!',
                    accessToken,
                    redirectPath
                });
    
            } else {
                return res.status(400).json({ message: 'Invalid credentials or franchise not found.' });
            }
    
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    loginCurrent : async(req,res)=>{
        res.json(req.franchise);
    }
}

