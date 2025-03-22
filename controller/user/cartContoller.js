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
        $match: { userId: new ObjectId(userId) },
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $lookup: {
          from: "variants",
          localField: "VariantId",
          foreignField: "_id",
          as: "variantDetails",
        },
      },
    ]);
    const totalPrice = carts.reduce((sum, num) => {
      return (sum += num.totalPrice);
    }, 0);
    res.render("user/cart", { carts, totalPrice, firstLetter: "", users: "" });
  } catch (error) {
    console.log("Error in loadCart");
    console.error(error);
  }
};

const AddCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, varientId, quantities, price } = req.body;
    console.log("when i click wishlist add to cart btn", req.body);

    const existingCartItem = await cart.findOne({
      userId,
      VariantId: varientId,
    });

    if (existingCartItem) {
      return res.json({
        existingCartItem: "This variant is already in your cart.",
      });
    }

    const variantDetails = await variant.findOne({ _id: varientId });

    if (!variantDetails) {
      return res.json({ variantDetails: "Variant not found." });
    }

    const TotalPrice = quantities * price;

    let NewCart = new cart({
      userId: userId,
      productId: productId,
      quantity: quantities,
      price: Math.round(price),
      totalPrice: TotalPrice,
      VariantId: varientId,
    });

    await NewCart.save();

    return res.json({ success: "Cart Added Successfully" });
  } catch (error) {
    console.log("Error in addCart controller:", error);
    return res.status(500).json({ Wrong: "Something went wrong" });
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
      message: "Cart item deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  loadCart,
  AddCart,
  deleteCart,
};
