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

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/formData', { })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// User schema and model
const userSchema =  new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    governmentID: { type: String, required: true },
    governmentIDNumber: { type: String, required: true },
    password: { type: String, required: true },
});

// Pre-save hook to hash the password
userSchema.pre('save', async function (next) {
    try {
        if (!this.isModified('password')) {
            return next();
        }
        const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
    next();
});

const User = mongoose.model('User', userSchema);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error caught by error handling middleware:', err);
    res.status(500).send('Something went wrong');
});

// Serve HTML registration form
app.get('/', (req, res) => {
    res.redirect('/register');
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Handle registration submission
app.post('/register', async (req, res) => {
    const { name, email, password, confirmPassword, governmentID, governmentIDNumber } = req.body;

    // Validate required fields
    if (!name || !email || !password || !confirmPassword || !governmentID || !governmentIDNumber) {
        return res.status(400).send('All fields are required');
    }

    // Validate password and confirm password match
    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }

    try {
        // Check if the email is already registered
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Save form data to MongoDB using the User model
        const newUser = new User({ name, email, password, governmentID, governmentIDNumber });
        await newUser.save();
        console.log('User data saved to database');

        // Configure ZeptoMail SMTP transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.zeptomail.in',
            port: 587, // Use TLS port
            secure: false, // true for 465, false for other ports
            auth: {
                user: 'emailappsmtp.1e64f40e8d6b0109',
                pass: 'h3j1a9Bs7duu',
            },
        });

        // Email message options
        const mailOptions = {
            from: 'info@kcspro.in', // Sender address
            to: email, // Receiver address (email provided in the form)
            subject: 'Registration Success',
            text: `Hello ${name},\n\nThank you for registering.`,
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log('Email sent to', email);
        res.status(200).json({ message: 'Registration successful, email sent' });
    } catch (error) {
        console.error('Error processing registration:', error);
        res.status(500).json({ message: 'Error processing registration' });
    }
});

// Serve HTML login form
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle login submission
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists in database
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).send('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).send('Invalid email or password');
        }
        return res.status(200).redirect('/success');
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Error logging in');
    }
});

// Serve HTML success page
app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
