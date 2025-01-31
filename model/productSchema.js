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
        ref: 'category',
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
    quantity: {
        type: Number,
        required: true,
    },
    images: [{
        type: String,
        required: true,
    }],
    variants: [{
        color: String,
        quantity: Number,
    }],
    isBlocked: {
        type: Boolean,
        default: false,
    }
 
},{timestamp:true});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;