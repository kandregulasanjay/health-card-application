const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000; // Port number for your API

app.use(bodyParser.json()); // Middleware to parse JSON bodies

// MongoDB connection URL
const url = 'mongodb://localhost:27017';
const dbName = 'formData'; // Your database name

app.post('/import', async (req, res) => {
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('coupens'); // Your collection name

    const data = req.body; // JSON data from the request body

    // Insert JSON data into MongoDB
    await collection.insertMany(data);
    res.status(200).send('Data imported successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error importing data');
  } finally {
    await client.close();
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
