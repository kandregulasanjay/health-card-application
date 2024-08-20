const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Please add name"] },
    gender: { type: String, required: [true, "Please add gender"] },
    dob: { type: String, required: [true, "Please add dob"] },
    email: { type: String, required: [true, "Please add email"], unique: [true, "Email Address Already Taken"] },
    password: { type: String, required: [true, "Please add password"] },
    mobileNo: { type: String, required: [true, "Please add mobile Number"] },
    aadharNo: { type: String, required: [true, "Please add Aadhar Number"] },
    photo: { type: String, required: [true, "Please add photo"] },
    aadharCardFront: { type: String, required: [true, "Please add Aadhar Card front Photo"] },
    aadharCardBack: { type: String, required: [true, "Please add Aadhar card Back photo"] },
    state: { type: String, required: [true, "Please add state"] },
    district: { type: String, required: [true, "Please add district"] },
    constituency: { type: String, required: [true, "Please add constituency"] },
    mandal: { type: String, required: [true, "Please add Mandal"] },
    village: { type: String, required: [true, "Please add village"] },
    address: { type: String, required: [true, "Please add Address"] },
    couponNumber: { type: String, required: true },
    couponValidityDate: { type: Date, required: true },
    isActive: { type: Boolean },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
