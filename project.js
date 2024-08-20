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
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/formData', { })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// User schema and model
const userSchema = new mongoose.Schema({
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
});

const User = mongoose.model('User', userSchema);

// Coupon schema and model
const couponSchema = new mongoose.Schema({
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    couponNumber: { type: String, required: true },
    hospitalName: { type: String, required: true },    
    discountPercentage: { type: Number, required: true },
    availabilityLocation: { type: String, required: true },
    validityDate: { type: Date, required: true },    
});

const Coupon = mongoose.model('Coupon', couponSchema, 'coupons');

// SentEmail schema and model
const sentEmailSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    couponNumber: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
});

const SentEmail = mongoose.model('SentEmail', sentEmailSchema, 'sent_emails');

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send('Invalid email format');
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

        // Fetch a random coupon from the collection
        const coupon = await Coupon.aggregate([{ $sample: { size: 1 } }]).then(coupons => coupons[0]);

        if (!coupon) {
            return res.status(500).json({ message: 'No coupons available' });
        }

        console.log('Fetched coupon:', coupon);

        // Save form data to MongoDB using the User model
        const newUser = new User({ 
            name, 
            email, 
            password, 
            governmentID, 
            governmentIDNumber,
            couponNumber: coupon.couponNumber,
            couponValidityDate: coupon.validityDate
        });
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
            html: `<img src="/assets/discount-email.png" alt="Discount Coupon Image" style="width: 100%; height: auto;">
                    <p>Hello ${name},</p>
                   <p>Thank you for registering with us...</p>
                   <p> Here are our Digital Discount Medical Card Details:</p>
                   <p>Introducing our exclusive Medical Discount Card, designed to provide you with a 10% discount on medical services at numerous specialty hospitals in your area. 
                   Whether you need routine check-ups, advanced treatments, or specialized care, our card ensures you receive the best healthcare at reduced costs.<br><br>
                   To learn more and take advantage of this offer, log in to our exclusive web application today. Your health and savings are just a click away!</p>
                   <p><b>Name:</b> ${name}</p>
                   <p><b>Here are our Digital Discount Medical Card Details:</b> ${coupon.couponNumber}</p>
                   <p><b>Validity Date:</b> ${coupon.validityDate}</p>`
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log('Email sent to', email);

        // Save sent email data to MongoDB
        const sentEmail = new SentEmail({
            name,
            email,
            couponNumber: coupon.couponNumber,
        });
        await sentEmail.save();

        res.status(200).json({ message: 'Registration successful, email sent' });
    } catch (error) {
        console.error('Error processing registration:', error);
        res.status(500).json({ message: 'Error processing registration', error: error.message });
    }
});

// Serve HTML login form
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle login submission
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Perform authentication logic
    if (email === 'email' && password === 'password') {
        // Successful login, redirect to web.html
        res.redirect('/web.html');
    } else {
        // Failed login, redirect back to login page (or handle errors)
        res.redirect('/login.html');
    }
});
// Serve HTML web page
app.get('/web.html', (req, res) => {
    res.sendFile(__dirname ,'public', '/web.html');
});
// Serve HTML success page
app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
