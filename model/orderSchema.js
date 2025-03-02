const mongoose = require("mongoose");
const {Schema} = mongoose;

const orderSchema = new Schema({
    // User who placed the order
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users", // Reference to the "users" collection
        required: true,
    },

    // Items in the order
    orderItem: [{
        product: {
            type: Schema.Types.ObjectId, // Reference to the "product" collection
            ref: "product",
            required: true,
        },
        quantity: {
            type: Number, // Quantity of the product
            required: true,
        },
        price: {
            type: Number, // Price of the product at the time of purchase
            default: 0,
        },
        status: {
            type: String, // Status of the individual item (e.g., processing, shipped, delivered)
            required: true,
            enum: ["pending", "processing", "shipped", "Delivered", "Cancelled", "Return Request", "Returned"],
            default: "processing"
        },
    }],

    // Total price of the order
    totalPrice: {
        type: Number,
        required: true
    },

    // Shipping address for the order
    address: {
        type: Schema.Types.ObjectId, // Reference to the "user" collection (or "address" collection if you have one)
        ref: "user",
        required: true,
    },

    // Date when the invoice was generated
    invoiceDate: {
        type: Date,
    },

    // Date when the order was created
    createdOn: {
        type: Date,
        default: Date.now, // Automatically set to the current date and time
        required: true
    },

    // Indicates if a coupon was applied to the order
    couponApplied: {
        type: Boolean,
        default: false
    },

    // Payment method used for the order
    paymentMethod: {
        type: String,
        enum: ["cod", "razorpay"], // Allowed payment methods: Cash on Delivery (COD) or Razorpay
        required: true
    },

    // Razorpay order ID (generated when creating a Razorpay order)
    razorpayOrderId: {
        type: String, // Stores the Razorpay order ID
        default: null // Default is null (for non-Razorpay payments)
    },

    // Razorpay payment ID (generated after a successful payment)
    razorpayPaymentId: {
        type: String, // Stores the Razorpay payment ID
        default: null // Default is null (for non-Razorpay payments)
    },

    // Razorpay signature (used to verify the authenticity of the payment response)
    razorpaySignature: {
        type: String, // Stores the Razorpay signature
        default: null // Default is null (for non-Razorpay payments)
    },

    // Payment status of the order
    paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed"], // Allowed payment statuses
        default: "pending" // Default is "pending" (for Razorpay payments)
    }
});

// Create the Order model
const Order = mongoose.model("order", orderSchema);

// Export the Order model
module.exports = Order;