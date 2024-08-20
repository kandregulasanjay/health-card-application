const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    mobileNo: {type : String, required: true},
    hospitalName: { type: String, required: true },
    password: { type: String, required: true },
    branch:{type: String, required: true},
    specilization: {type: String},
    state: { type: String, required: true },
    district: { type: String, required: true },
    constituency: { type: String, required: true },
    mandal: { type: String, required: true },
    village: { type: String, required: true },
    address: { type: String, required: true },
},{timestamps:true});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;