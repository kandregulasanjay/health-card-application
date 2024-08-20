const mongoose = require('mongoose');

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

module.exports = appointmentModels = {
    "hospital-A": mongoose.model("hospital-A", appointmentSchemas["hospital-A"]),
    "hospital-B": mongoose.model("hospital-B", appointmentSchemas["hospital-B"]),
    "hospital-C": mongoose.model("hospital-C", appointmentSchemas["hospital-C"]),
    "hospital-D": mongoose.model("hospital-D", appointmentSchemas["hospital-D"])
};