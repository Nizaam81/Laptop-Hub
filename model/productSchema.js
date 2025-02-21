const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand', 
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', 
        required: true,
    },
    regularPrice: {
        type: Number,
        required: true,
    },
    salePrice: {
        type: Number,
    },
    productOffer: {
        type: String,
    },
    images: [{
        type: String,
        required: true,
    }],
    isBlocked: {
        type: Boolean,
        default: false,
    },
    variants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Variant' 
    }]
}, { timestamps: true }); 

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
