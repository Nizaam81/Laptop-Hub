
const cart = require("../../model/cartSchema");
const user = require("../../model/usersSchema");
const variant = require("../../model/varient");
const mongoose = require("mongoose");
const order = require('../../model/orderSchema')
const ObjectId = mongoose.Types.ObjectId;
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


const loadPlaceOrder = async (req, res) => {
    try {

        const userId = req.session.user;

        const carts = await cart.aggregate([
            {
                $match: { userId: new ObjectId(userId) } // Filter carts by userId
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productId", // Assuming productId is the correct field in the cart schema
                    foreignField: "_id",
                    as: "productDetails",
                }
            },
            {
                $lookup: {
                    from: "variants",
                    localField: "VariantId", // Assuming variantId is the correct field in the cart schema
                    foreignField: "_id",
                    as: "variantDetails",
                }
            }
        ]);

        
      
        const totalPrice=carts.reduce((sum,num)=>{
            return sum+=num.totalPrice},0)
            
        res.render("user/placeOrder", { carts,totalPrice ,firstLetter:"",users:""});
    
    } catch (error) {
        console.error(error);
        console.log("Error in place order GET function");
    }
};



const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user;
        const { orderItems, totalPrice, address, paymentMethod } = req.body;

        if (paymentMethod === 'razorpay') {
            const options = {
                amount: totalPrice * 100, // amount in the smallest currency unit (paise)
                currency: "INR",
                receipt: `order_rcptid_${userId}`,
                payment_capture: 1 // auto capture payment
            };

            const response = await razorpay.orders.create(options);

            const newOrder = new order({
                orderItem: orderItems,
                totalPrice: totalPrice,
                address: address,
                paymentMethod: paymentMethod,
                userId: userId,
                razorpayOrderId: response.id
            });

            await newOrder.save();

            return res.json({
                success: true,
                orderId: response.id,
                amount: response.amount,
                currency: response.currency,
                key: process.env.RAZORPAY_KEY_ID
            });
        } else {
            // Handle other payment methods (COD, Wallet, etc.)
            const newOrder = new order({
                orderItem: orderItems,
                totalPrice: totalPrice,
                address: address,
                paymentMethod: paymentMethod,
                userId: userId
            });

            await newOrder.save();
            return res.json({ success: "Order Placed successfully" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong!" });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpayOrderId + "|" + razorpayPaymentId)
            .digest('hex');

        if (generatedSignature === razorpaySignature) {
            // Payment is successful, update order status
            await order.findOneAndUpdate({ razorpayOrderId: razorpayOrderId }, { paymentStatus: 'Paid' });
            return res.json({ success: true });
        } else {
            return res.status(400).json({ error: "Invalid signature" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Something went wrong!" });
    }
};



module.exports={
    loadPlaceOrder,
    placeOrder,
    verifyPayment
}