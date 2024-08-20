const mongoose = require("mongoose")
const bcrypt = require('bcrypt')

const franchiseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    gender: { type: String, required: true },
    dob: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobileNo: { type: String, required: true },
    aadharNo: { type: String, required: true },
    photo: { type: String, required: true },
    aadharCardFront: { type: String, required: true },
    aadharCardBack: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    mandal: { type: String, required: true },
    village: { type: String, required: true },
    constituency: { type: String, required: true },
    address: { type: String, required: true },
    franchiseName: { type: String, required: true },
    franchiseLocation: { type: String, required: true },
    isActive: { type: Boolean },
},{timestamps:true});

module.exports = mongoose.model('Franchise',franchiseSchema);