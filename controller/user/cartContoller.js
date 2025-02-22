const cart = require("../../model/cartSchema");
const user = require("../../model/usersSchema");
const variant = require("../../model/varient");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const loadCart = async (req, res) => {
    try {
        const userId = req.session.user;

        const carts = await cart.aggregate([
            {
                $match: { userId: userId } // Filter carts by userId
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
                    localField: "variantId", // Assuming variantId is the correct field in the cart schema
                    foreignField: "_id",
                    as: "variantDetails",
                }
            }
        ]);
console.log(" what is inside",carts)
        res.render("user/cart", { carts });
    } catch (error) {
        console.log("Error in loadCart");
        console.error(error);
    }
};




const AddCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const { productId, varientId } = req.body;

      
        const existingCartItem = await cart.findOne({ userId, VariantId: varientId });

        if (existingCartItem) {
            return res.json({ existingCartItem: "This variant is already in your cart." });
        }

       
        const variantDetails = await variant.findOne({ _id: varientId });
        if (!variantDetails) {
            return res.json({ variantDetails: "Variant not found." });
        }

        const { price, quantity } = variantDetails;
        const TotalPrice = quantity * price;

       
        let NewCart = new cart({
            userId: userId,
            productId: productId,
            quantity: quantity,
            price: price,
            totalPrice: TotalPrice,
            VariantId: varientId
        });

        await NewCart.save();

        return res.json({ success: "Cart Added Successfully" });

    } catch (error) {
        console.log("Error in addCart controller:", error);
        return res.status(500).json({Wrong: "Something went wrong" });
    }
};





 const deleteCart = async (req, res) => {
    const { id } = req.body;
    try {
        const cartItem = await cart.findById(id);
        if (!cartItem) {
            return res.status(404).json({ error: "Cart item not found" });
        }

        await cart.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Cart item deleted successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


module.exports={
    loadCart,
    AddCart,
    deleteCart
}