const Client = require('../models/Client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

require('dotenv').config();

module.exports = {
    ClientRegister: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            const hashedPassword = await bcrypt.hash(password, 10);

            const client = await Client.create({
                email,
                password : hashedPassword
            });
            console.log(`client created ${client}`);

            if (client) {
                res.status(201).json({ _id: client.id, email: client.email });
            } else {
                return res.status(400).json({ message: "Client data is not valid" });
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
                subject: ' Registration Successful',
                text: `You have successfully registered.\n\nHospital Name: ${mail}\nPlease keep this information secure.`,
            };

            // Send the email
            await transporter.sendMail(mailOptions);
            console.log('Email sent to', email);

            // Respond with a success message
            res.status(201).json({ message: 'Client Added Successfully!', data: client });

        } catch (error) {
            if (!res.headersSent) {
                res.status(500).json({ message: 'An error occurred!', error: error.message });
            } else {
                console.error('Error occurred after headers sent:', error.message);
            }
        }

    },

    ClientLogin: async (req, res, next) => {
        const {  password, email } = req.body;

        if (!email || !password ) {
            res.status(400).json({ message: 'All field are required' });
        }
        const client = await Client.findOne({ email });

        if (client && (await bcrypt.compare(password, client.password))) {
            let accessToken = jwt.sign({
                client: {
                    email: client.email,
                    id: client.id,
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
        res.json(req.client);
    }
}