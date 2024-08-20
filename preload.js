const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
 
mongoose.connect('mongodb://localhost:27017/formData', {});
 
const clientSchema = new mongoose.Schema({
    email: { type: String, required: true,unique: true,},
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
 
const Client = mongoose.model('Client', clientSchema, 'client');
 
const preloadData = async () => {
    try {
      await Client.deleteMany({});
      await Client.create({ email: 'admin@example.com', password: '123' });
      console.log('Data preloaded');
      mongoose.connection.close();
    } catch (err) {
      console.error(err);
    }
  };
 
  preloadData();