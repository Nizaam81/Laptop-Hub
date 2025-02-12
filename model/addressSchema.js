const mongoose = require("mongoose");
const { Schema } = mongoose; // ✅ Corrected import

const addressSchema = new Schema({ // ✅ Use Schema instead of schema
    userId: {
        type: Schema.Types.ObjectId, // ✅ Corrected reference
        ref: "user",
        required: true 
    },
    address: [{
       addressType: {
        type: String,
        required: true
       }, 
       name: {
        type: String,
        required: true,
       },
       city: {
        type: String,
        required: true,
       },
       landMark: {
        type: String,
        required: true,
       },
       state: {
        type: String,
        required: true,
       },
       pincode: {
        type: Number,
        required: true
       },
       phone: {
        type: Number,
        required: true,
       },
       altPhone: {
        type: String,
        required: true
       }
    }]
});

const Address = mongoose.model("Address", addressSchema);
module.exports = Address;
