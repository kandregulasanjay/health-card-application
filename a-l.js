const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/formData', {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Admin schema and model
const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
});

adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

const Admin = mongoose.model('Admin', adminSchema, 'admin');

// Handle admin registration
app.post('/api/admin/register', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username|| !email || !password) {
        return res.status(400).send('Username and password are required');
    }

    try {
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            res.status(400).json({ message: 'already existed email' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({
            email,
            username,
            password: hashedPassword,
        });

        await newAdmin.save();
        console.log('User data saved to database');

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
            text: `You have successfully registered as an admin.\n\nUsername: ${username}\nPassword: ${password}\n\nPlease keep this information secure.`
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent to', email);

        res.status(201).json({ message: 'Successfully registered!' });
    } catch (error) {
        console.error('Error registering admin:', error);
        res.status(500).send('Internal server error');
    }
});

// Handle admin login
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed', error });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
