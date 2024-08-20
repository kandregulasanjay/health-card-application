const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/formData', { })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// User schema and model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    gender: { type: String, required: true },
    dob: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    governmentID: { type: String, required: true },
    governmentIDNumber: { type: String, required: true },
    password: { type: String, required: true },
    couponNumber: { type: String, required: true },
    couponValidityDate: { type: Date, required: true },

});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
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

// Admin schema and model
const adminSchema = new mongoose.Schema({
    email: { type: String, required: true},
    username: { type: String, required: true },
    hospital: { type: String, required: true },
    password: { type: String, required: true }
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

// client schema and model
const clientSchema = new mongoose.Schema({
    email: { type: String, required: true},
    password: { type: String, required: true }
});

clientSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});
const  Client= mongoose.model('Client', clientSchema, 'client');

// appointment schema and model
/*const appointmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    doctor: { type: String, required: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    notes: { type: String },
});
const AppointmentA = mongoose.model('AppointmentA', appointmentSchema, 'appointmentsA');
const AppointmentB = mongoose.model('AppointmentB', appointmentSchema, 'appointmentsB');
const AppointmentC = mongoose.model('AppointmentC', appointmentSchema, 'appointmentsC');
const AppointmentD = mongoose.model('AppointmentD', appointmentSchema, 'appointmentsD');

const Appointment = mongoose.model('Appointment', appointmentSchema, 'appointments');

// Handle appointment form submission
app.post('/api/appointment', async (req, res) => {
    const { name, email, date, time, doctor,district,state,country, notes, hospital } = req.body;

    // Validate required fields
    if (!name || !email || !date || !time || !doctor ||!district || !state ||!country||! notes||!hospital) {
        return res.status(400).json({ message : 'All fields except notes are required'});
    }

    let AppointmentModel;
    switch (hospital) {
        case 'A':
            AppointmentModel = AppointmentA;
            break;
        case 'B':
            AppointmentModel = AppointmentB;
            break;
        case 'C':
            AppointmentModel = AppointmentC;
            break;
        case 'D':
            AppointmentModel = AppointmentD;
            break;
        default:
            return res.status(400).json({ message:'Invalid hospital selected.'});
    }
    

    try {
        // Save appointment data to MongoDB
        const newAppointment = new Appointment({
            name,
            email,
            date,
            time,
            doctor,
            district,
            state,
            country,
            notes,
        });
        await newAppointment.save();
        res.status(200).json({message: 'Appointment scheduled successfully'});
    } catch (error) {
        console.error('Error saving appointment:', error);
        res.status(500).json({message :'Error scheduling appointment: ' + error.message});
    }
});
*/
const createAppointmentSchema = (hospital) => {
    return new mongoose.Schema({
        name: String,
        email: String,
        date: String,
        time: String,
        department: String,
        country: String,
        state: String,
        district: String,
        notes: String,
        hospital: {
            type: String,
            default: hospital
        }
    }, { collection: hospital });
};

const appointmentSchemas = {
    "hospital-A": createAppointmentSchema("hospital-A"),
    "hospital-B": createAppointmentSchema("hospital-B"),
    "hospital-C": createAppointmentSchema("hospital-C"),
    "hospital-D": createAppointmentSchema("hospital-D")
};

const appointmentModels = {
    "hospital-A": mongoose.model("hospital-A", appointmentSchemas["hospital-A"]),
    "hospital-B": mongoose.model("hospital-B", appointmentSchemas["hospital-B"]),
    "hospital-C": mongoose.model("hospital-C", appointmentSchemas["hospital-C"]),
    "hospital-D": mongoose.model("hospital-D", appointmentSchemas["hospital-D"])
};

//billingSchema
const billingSchema = new mongoose.Schema({
    patientName: String,
    billingAmount: String,
    paymentMethod: String,
    billingDate: Date,
    diagnosis: String,
    treatmentDate: Date,
    treatmentDescription: String,
    hospitalName:String,
});

const Billing = mongoose.model('Billing', billingSchema);

// Route to handle appointment data
app.post('/api/appointment', async (req, res) => {
    try {
        const appointment = req.body;
        const newAppointment = new Billing({
            patientName: appointment.patientName,
            billingAmount: appointment.billingAmount,
            paymentMethod: appointment.paymentMethod,
            billingDate: appointment.billingDate
        });
        await newAppointment.save();
        res.status(201).json({ message: 'Appointment scheduled successfully', appointment });
    } catch (error) {
        res.status(500).json({ message: 'Error saving appointment', error });
    }
});

// Route to handle billing information
app.post('/billing', async (req, res) => {
    try {
        const billingInfo = req.body;
        const newBillingInfo = new Billing({
            patientName: billingInfo.patientName,
            billingAmount: billingInfo.billingAmount,
            paymentMethod: billingInfo.paymentMethod,
            billingDate: billingInfo.billingDate,
            diagnosis: billingInfo.diagnosis,
            treatmentDate: billingInfo.treatmentDate,
            hospitalName:billingInfo.hospitalName,
            treatmentDescription: billingInfo.treatmentDescription
        });
        await newBillingInfo.save();
        res.status(201).send({ message: 'successfull!' });
    } catch (error) {
        res.status(500).send({ message: 'Error saving billing info', error: error.message });
    }
});

// Route to get filtered billings
app.get('/billing', async (req, res) => {
    try {
        const { hospital, date } = req.query;
        const query = {};
        if (hospital) {
            query.hospitalName = hospital;
        }
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            query.billingDate = { $gte: startDate, $lt: endDate };
        }
        // Sort by billingDate in descending order
        const billings = await Billing.find(query).sort({ billingDate: -1 });
        res.status(200).json(billings);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching billings', error: error.message });
    }
});


app.post('/api/appointment', async (req, res) => {
    const { name, email, date, time, department, country, state, district, notes, hospital } = req.body;

    if (!appointmentModels[hospital]) {
        return res.status(400).send({ message: 'Invalid hospital selection' });
    }

    const Appointment = appointmentModels[hospital];

    const newAppointment = new Appointment({
        name,
        email,
        date,
        time,
        department,
        hospital,
        country,
        state,
        district,
        notes,
        
    });

    try {
        await newAppointment.save();
        res.status(201).send({ message: 'Appointment scheduled successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Failed to schedule appointment', error: error.message });
    }
});

// Route to search user
app.post('/search', async (req, res) => {
    const { searchQuery } = req.body;
    try {
        const user = await User.findOne({
            $or: [{ email: searchQuery }, { couponNumber: searchQuery }],
        });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Route to fetch all appointments (for admin and doctor views)
/*app.get('/api/admin/appointments', async (req, res) => {
    const { hospital } = req.query;

    if (!appointmentModels[hospital]) {
        return res.status(400).send({ message: 'Invalid hospital selection' });
    }

    const Appointment = appointmentModels[hospital];

    try {
        const appointments = await Appointment.find({});
        res.json(appointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).send('Internal server error');
    }
});*/


app.get('/api/admin/appointments', async (req, res) => {
    try {
        const { hospital, state, district, date } = req.query;
        const query = {};

        if (hospital) query.hospital = hospital;
        if (state) query.state = state;
        if (district) query.district = district;
        if (date) query.date = new Date(date);

        const Appointment = appointmentModels[hospital];

        // Fetch appointments from the correct collection based on hospital
        if (!Appointment) {
            return res.status(400).send({ message: 'Invalid hospital selection' });
        }
        const appointments = await Appointment.find(query).sort({ date: -1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});


// Route to fetch all Users (for admin view)
app.get('/api/admin/clients', async (req, res) => {
    try {
        const clients = await User.find({});
        res.json(clients);
    } catch (err) {
        console.error('Error fetching clients data:', err);
        res.status(500).send('Internal server error');
    }
});

// Route to fetch admin data
app.get('/api/admin/admins', async (req, res) => {
    try {
        const admins = await Admin.find({}, 'username email'); // Fetch username and email only
        res.json(admins);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong');
});

// Serve HTML registration form
app.get('/', (req, res) => {
    res.redirect('welcome.html');
});
// Serve HTML user register form
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Handle user registration submission
app.post('/register', async (req, res) => {
    const { name, email, password, confirmPassword, governmentID, governmentIDNumber, gender, dob } = req.body;

    if (!name || !email || !password || !confirmPassword || !governmentID || !governmentIDNumber || !dob || !gender) {
        return res.status(400).send('All fields are required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send('Invalid email format');
    }

    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }

    try {
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const coupon = await Coupon.aggregate([{ $sample: { size: 1 } }]).then(coupons => coupons[0]);
        if (!coupon) {
            return res.status(500).json({ message: 'No coupons available' });
        }

        console.log('Fetched coupon:', coupon);

        const newUser = new User({
            name,
            gender,
            dob,
            email,
            password,
            governmentID,
            governmentIDNumber,
            couponNumber: coupon.couponNumber,
            couponValidityDate: coupon.validityDate
        });
        await newUser.save();
        console.log('User data saved to database');

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
            subject: 'Registration Success',
            html: `<img src="/assets/discount-email.png" alt="Discount Coupon Image" style="width: 100%; height: auto;">
                    <p>Hello ${name},</p><br>
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

        await transporter.sendMail(mailOptions);
        console.log('Email sent to', email);

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

// Serve HTML user login form
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle user login submission
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).send('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).send('Invalid email or password');
        }
        res.json({ userData: user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal server error');
    }
});
// Serve HTML admin register form
app.get('/admin/admin-register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-register.html'));
});

// Handle admin register submission
app.post('/admin/admin-register', async (req, res) => {
    const { username, password, email, hospital } = req.body;

    if (!username || !email || !password || !hospital) {
        return res.status(400).send('Username and password are required');
    }

    try {
        const existingAdmin = await Admin.findOne({ email: email });
        if (existingAdmin) {
            res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({
            email,
            username,
            hospital,
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
// Serve HTML admin login form
app.get('/admin-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Handle admin login submission
app.post('/admin/admin-login', async (req, res) => {
    const { email,password,hospital} = req.body;

    if (!password || !email||!hospital ) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid email or hospital' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Serve HTML client login form
app.get('/client-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'client-login.html'));
});
// Handle client login submission
app.post('/client/client-login', async (req, res) => {
    const { email,password} = req.body;
 
    if (!password || !email ) {
        return res.status(400).json({ message: 'All fields are required' });
    }
 
    try {
        const client = await Client.findOne({ email });
        if (!client) {
            return res.status(401).json({ message: 'Invalid email or hospital' });
        }
 
        const isMatch = await bcrypt.compare(password, client.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }
 
        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Handle admin logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Internal server error');
        }
        res.redirect('/');
    });
});

// Serve HTML web page
app.get('/web.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'web.html'));
});

// Serve HTML admin page
app.get('/admin.html', (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin-login.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve HTML doctors page
app.get('/doctors.html', (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin-login.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'doctors.html'));
});

// Serve HTML success page
app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

app.get('/api/user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Assuming you have a way to authenticate and identify the logged-in admin
app.get('/api/admin/hospital', async (req, res) => {
    // Replace this with your actual logic to get the admin's hospital
    // For example, you might fetch this from the database based on the admin's ID
    const adminId = req.user.id; // assuming you have user information in req.user
    try {
        const admin = await Admin.findById(adminId);
        if (admin) {
            res.json({ hospital: admin.hospital });
        } else {
            res.status(404).json({ message: 'Admin not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
/*
// Example Node.js/Express login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    // Authenticate the user
    const user = await authenticateUser(email, password);
    if (user) {
        res.json({ userId: user.id });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Fetch user data route
app.get('/api/user/:id', async (req, res) => {
    const userId = req.params.id;
    const user = await getUserById(userId); // Implement this function to fetch user data by ID
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});
*/
  
// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
