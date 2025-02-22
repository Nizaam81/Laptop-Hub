const mongoose = require("mongoose");
const Variant = require("./varient");
const { Schema } = mongoose;

const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
        productId: { 
            type: Schema.Types.ObjectId, 
            ref: "products",
            required: true,
        },
        quantity: {
            type: Number, 
            default: 1
        },
        price: {
            type: Number,  
            required: true
        },
        totalPrice: {
            type: Number,  
            required: true
        },
        status: {
            type: String,  
            default: "Placed" 
        },
        VariantId:{
      type:Schema.Types.ObjectId,
      ref:"variants",
      require:true,
        },
        cancellationReason: {
            type: String,  
            default: "none" 
        }
});

const Cart = mongoose.model("Cart", cartSchema);  
module.exports = Cart;
