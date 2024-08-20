const User = require("../models/User");
const Coupon = require('../models/Coupon');
const SentEmail = require('../models/SentEmail');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const dotenv = require('dotenv').config();

module.exports = {
    registerUser: async (req, res, next) => {
        try {
            const { name, email, password, confirmPassword, gender, dob, mobileNo, aadharNo, state, district, constituency, mandal, village, address } = req.body;

            // if (!name || !email || !password || !confirmPassword || !aadharNo || !dob || !gender || !mobileNo || !state || !district || !constituency || !mandal || !village || !address) {
            //     return res.status(400).send('All fields are required');
            // }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).send('Invalid email format');
            }

            if (password !== confirmPassword) {
                return res.status(400).send('Passwords do not match');
            }

            const existingUser = await User.findOne({ email: email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already registered' });
            }

            const coupon = await Coupon.aggregate([{ $sample: { size: 1 } }]).then(coupons => coupons[0]);
            if (!coupon) {
                return res.status(500).json({ message: 'No coupons available' });
            }

            console.log('Fetched coupon:', coupon);

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await User.create({
                name,
                gender,
                dob,
                email,
                password: hashedPassword,
                aadharNo,
                mobileNo,
                photo: req.files['photo'] ? req.files['photo'][0].path : undefined,
                aadharCardFront: req.files['aadharCardFront'] ? req.files['aadharCardFront'][0].path : undefined,
                aadharCardBack: req.files['aadharCardBack'] ? req.files['aadharCardBack'][0].path : undefined,
                state,
                district,
                constituency,
                mandal,
                village,
                address,
                couponNumber: coupon.couponNumber,
                couponValidityDate: coupon.validityDate
            });
            console.log(`User created ${user}`);

            if (user) {
                res.status(201).json({ _id: user.id, email: user.email });
            } else {
                return res.status(400).json({ message: "User data is not valid" });
            }

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
                subject: 'Registration Successful',
                html: `<p>Hello ${name},</p><br>
                        <p>Thank you for registering with us!</p>
                        <p>We are thrilled to have you as a member of our Medical Discount Card program.</p>
                        <p>Your medical card is now active and ready to use.</p><br>
                        <p>Introducing our exclusive Medical Discount Card, designed to provide you with a 10% discount on medical services at numerous specialty hospitals in your area. 
                        Whether you need routine check-ups, advanced treatments, or specialized care, our card ensures you receive the best healthcare at reduced costs.</p><br>
                        <p><u><b>Medical Crad Details:</b></u></p>
                        <p><b>Name:</b> ${name}</p>
                        <p><b>Medical Card Number:</b> ${coupon.couponNumber}</p>
                        <p><b>Validity Date:</b> ${coupon.validityDate}</p>
                        <p>To learn more and take advantage of this offer, log in to our exclusive web application today:</p>
                        <p>Your health and savings are just a click away!</p><br><br>
                        <p>To learn more about your Medical Discount Card and the benefits itt offers, please visit our officil website:</p><br>
                        <p>Thank you for choosing us as you healthcare partner.</p>`
            };

            // Send the email
            await transporter.sendMail(mailOptions);
            console.log('Email sent to', email);

            const sentEmail = await SentEmail.create({
                name,
                email,
                couponNumber: coupon.couponNumber,
            });

        } catch (error) {
            if (!res.headersSent) {
                res.status(500).json({ message: 'An error occurred!', error: error.message });
            } else {
                console.error('Error occurred after headers sent:', error.message);
            }
        }
    },

    loginUser: async (req, res, next) => {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: 'All field are required' });
        }

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            let accessToken = jwt.sign({
                user: {
                    name: user.name,
                    email: user.email,
                    id: user.id,
                }
            }, process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_TIME }
            );            
            res.status(200).json({ accessToken });
        } else {
            res.status(401).json({ message: 'email or password is not valid' });
        }
    },

    loginCurrent : async(req,res)=>{
        res.json(req.user);
    }
}

