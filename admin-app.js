const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const fs = require('fs');
const Stripe = require('stripe');
const multer = require('multer');
const stripe = Stripe('sk_test_51Pl3GNAcYgGvCluuAfh3BAmBygi1AopnboLe7YuGJy4ke1k9ofNXFpQqbd8XuXDdxWTVP3WwKPE0dkzHUbEjKafs00Xpsh1nY4');

const FranchiseRoute = require('./routes/FranchiseRoute');
const AdminRoute = require('./routes/AdminRoute');
const UserRoute = require('./routes/UserRoute');
const ClientRoute = require('./routes/ClientRoute');


const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Static files for uploaded images
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for parsing JSON and form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/formData')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});

// Handle appointment form submission
// app.post('/api/appointment', async (req, res) => {
//     const { name, email, date, time, doctor,district,state,country, notes, hospital } = req.body;

//     // Validate required fields
//     if (!name || !email || !date || !time || !doctor ||!district || !state ||!country||! notes||!hospital) {
//         return res.status(400).json({ message : 'All fields except notes are required'});
//     }

//     let AppointmentModel;
//     switch (hospital) {
//         case 'A':
//             AppointmentModel = AppointmentA;
//             break;
//         case 'B':
//             AppointmentModel = AppointmentB;
//             break;
//         case 'C':
//             AppointmentModel = AppointmentC;
//             break;
//         case 'D':
//             AppointmentModel = AppointmentD;
//             break;
//         default:
//             return res.status(400).json({ message:'Invalid hospital selected.'});
//     }
    

//     try {
//         // Save appointment data to MongoDB
//         const newAppointment = new Appointment({
//             name,
//             email,
//             date,
//             time,
//             doctor,
//             district,
//             state,
//             country,
//             notes,
//         });
//         await newAppointment.save();
//         res.status(200).json({message: 'Appointment scheduled successfully'});
//     } catch (error) {
//         console.error('Error saving appointment:', error);
//         res.status(500).json({message :'Error scheduling appointment: ' + error.message});
//     }
// });

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



// app.get('/api/user/:email', async (req, res) => {
//     try {
//         const { email } = req.params;
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         res.status(200).json(user);
//     } catch (error) {
//         console.error('Error fetching user:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

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

//purchase-card

app.post('/purchase-card', (req, res) => {
    const { totalCommission, distributionDetails } = req.body;

    if (!totalCommission || typeof totalCommission !== 'number') {
        return res.status(400).json({ error: 'Invalid total commission amount' });
    }

    if (!distributionDetails || typeof distributionDetails !== 'object') {
        return res.status(400).json({ error: 'Invalid distribution details' });
    }

    const distributedAmounts = distributeCommission(totalCommission, distributionDetails);

    fs.writeFile('distributedAmounts.json', JSON.stringify(distributedAmounts, null, 2), (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to write to JSON file' });
        }
        res.json({ distributedAmounts });
    });
});

function distributeCommission(totalCommission, distributionDetails) {
    const distributedAmounts = {};

    for (const level in distributionDetails) {
        if (distributionDetails.hasOwnProperty(level)) {
            const percentage = distributionDetails[level].percentage;
            const person = distributionDetails[level].person;

            const amount = (percentage / 100) * totalCommission;
            distributedAmounts[level] = { person, amount };
        }
    }

    return distributedAmounts;
}

app.get('/card-payment', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payment.html'));
});

// Endpoint to handle card payment
app.post('/card-payment', async (req, res) => {
    const { paymentMethodId, amount, currency, paymentType } = req.body;

    if (!paymentMethodId || !amount || !currency || !paymentType) {
        return res.status(400).json({ error: 'Payment details are required' });
    }

    try {
        // Process the payment using Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            payment_method: paymentMethodId,
            payment_method_types: [paymentType],
            confirmation_method: 'manual',
            confirm: true,
        });

        // Handle payment confirmation
        if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_source_action') {
            // Card requires authentication
            return res.json({
                requiresAction: true,
                paymentIntentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
            });
        } else if (paymentIntent.status === 'succeeded') {
            // Payment was successful
            const coupon = await activateCoupon();
            return res.json({ couponNumber: coupon.couponNumber, validityDate: coupon.validityDate });
        } else {
            return res.status(500).json({ error: 'Failed to process payment' });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

async function activateCoupon() {
    const coupon = await Coupon.findOne({ isActive: false });

    if (!coupon) {
        throw new Error('No available coupons');
    }

    // Activate the coupon and set the expiration date to one year from now
    coupon.isActive = true;
    coupon.validityDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    await coupon.save();

    return coupon;
}



app.get('/FranchiseRegister', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'FranchiseRegister.html'));
});

app.get('/FranchiseLogin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'FranchiseLogin.html'));
});

app.get('/franchiseSuccess', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'franchiseSuccess.html'));
});

app.get('/AdminLogin', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'HospitalAdminLogin.html'));
});

app.get('/AdminRegister', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'HospitalAdminRegister.html'));
});

app.get('/AdminSuccess', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'AdminSuccess.html'));
});

app.get('/UserLogin', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'UserLogin.html'));
});

app.get('/UserRegister', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'UserRegister.html'));
});

app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

app.get('/ClientLogin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ClientLogin.html'));
});

app.get('/ClientRegister', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ClientRegister.html'));
});

app.get('/ClientSuccess', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ClientSuccess.html'));
});

app.get('/website', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'website.html'));
});

app.get('/logout', (req, res) =>  {res.redirect('/')} );

// Route setup
app.use('/api/franchise', FranchiseRoute);
app.use('/api/admin', AdminRoute);
app.use('/api/user', UserRoute);
app.use('/api/client', ClientRoute);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
