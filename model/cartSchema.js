const mongoose = require("mongoose");
const { Schema } = mongoose;

const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
        productId: {  // Fixed typo (producrId → productId)
            type: Schema.Types.ObjectId,  // Fixed incorrect SchemaTypes.Types.ObjectId
            ref: "products",
            required: true,
        },
        quantity: {
            type: Number,  // Fixed incorrect lowercase "number"
            default: 1
        },
        price: {
            type: Number,  // Fixed incorrect lowercase "number"
            required: true
        },
        totalPrice: {
            type: Number,  // Fixed incorrect lowercase "number"
            required: true
        },
        status: {
            type: String,  // Fixed incorrect lowercase "string"
            default: "Placed"  // Fixed typo "[laced"
        },
        cancellationReason: {
            type: String,  // Fixed incorrect lowercase "string"
            default: "none"  // Fixed typo (defult → default)
        }
});

const Cart = mongoose.model("Cart", cartSchema);  // Changed variable name to start with uppercase (convention)
module.exports = Cart;
