const mongoose = require("mongoose")

const couponSchema = new mongoose.Schema({
    couponNumber: { type: String, required: true },
    validityDate: { type: Date, required: true },
    isActive: { type: Boolean },
});

const Coupon = mongoose.model('Coupon', couponSchema, 'coupons');

module.exports = Coupon;
