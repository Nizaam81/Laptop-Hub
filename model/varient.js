const mongoose = require("mongoose");
const { Schema } = mongoose;

const variantSchema = new Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    ramSize: {
        type: String, 
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

const Variant = mongoose.model("Variant", variantSchema);
module.exports = Variant;
