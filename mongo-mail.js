const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');

const app = express();
app.use(bodyParser.json());

const uri = 'mongodb://localhost:27017/';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.post('/register', async (req, res) => {
  try {
    await client.connect();
    const database = client.db('formData');
    const registrationCollection = database.collection('registrations');
    const couponsCollection = database.collection('coupons');
    const sentEmailsCollection = database.collection('sent_emails');

    const { name, email } = req.body;

    // Fetch a random coupon from the collection
    const coupon = await couponsCollection.aggregate([{ $sample: { size: 1 } }]).next();

    if (!coupon) {
      return res.status(500).json({ message: 'No coupons available' });
    }

    // Send email with coupon details
    const transporter = nodemailer.createTransport({
      host: 'smtp.zeptomail.in',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'emailappsmtp.1e64f40e8d6b0109',
        pass: 'h3j1a9Bs7duu',
      },
    });

    const mailOptions = {
      from: 'info@kcspro.in',
      to: email,
      subject: 'Your Coupon Details',
      html: `<p>Dear ${name},</p>
             <p>Thank you for registering. Here are your coupon details:</p>
             <p><b>Coupon Number:</b> ${coupon.couponNumber}</p>
             <p><b>Hospital Name:</b> ${coupon.hospitalName}</p>
             <p><b>Description:</b> ${coupon.description}</p>
             <p><b>Discount Percentage:</b> ${coupon.discountPercentage}%</p>
             <p><b>Location:</b> ${coupon.availabilityLocation}</p>
             <p>Best regards,<br>Our Team</p>`,
    };

    await transporter.sendMail(mailOptions);

    // Store registration details and sent email data in MongoDB
    const registrationData = {
      name,
      email,
      couponNumber: coupon.couponNumber,
      sentAt: new Date(),
    };

    await registrationCollection.insertOne({ name, email });
    await sentEmailsCollection.insertOne(registrationData);

    res.json({ message: 'Registration successful and email sent with coupon details.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred during registration.' });
  } finally {
    await client.close();
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
