const { MongoClient } = require('mongodb');

async function generateCoupons() {
  const uri = 'mongodb://localhost:27017/'; // Replace with your MongoDB connection string
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  function generateRandom16DigitNumber() {
    const number= Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
    return number.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  try {
    await client.connect();
    const database = client.db('formData'); // Replace with your database name
    const couponsCollection = database.collection('coupons');

    const couponData = [];
    for (let i = 0; i < 1000000; i++) {
      const coupon = {
        couponNumber: generateRandom16DigitNumber(),
        hospitalName: `Hospital ${i}`,
        description: `Description for Hospital ${i}`,
        discountPercentage: Math.floor(Math.random() * 50) + 1, // Random discount between 1 and 50%
        availabilityLocation: `Location ${i}`,
        imageUrl: 'assets/discount-email.png', // Add image URL
        validityDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year validity
      };
      couponData.push(coupon);
    }

    await couponsCollection.insertMany(couponData);
    console.log('Coupons generated and stored in the database.');
  } finally {
    await client.close();
  }
}

generateCoupons().catch(console.dir);
