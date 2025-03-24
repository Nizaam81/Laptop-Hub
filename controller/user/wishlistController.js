const wishhlist = require("../../model/wishlistSchema");
const user = require("../../model/usersSchema");
const variant = require("../../model/varient");
const products = require("../../model/productSchema");
const mongoose = require("mongoose");
const cart = require("../../model/cartSchema");
const ObjectId = mongoose.Types.ObjectId;

const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const wish = await wishhlist.aggregate([
      {
        $match: { userId: new ObjectId(userId) },
      },
      { $unwind: "$products" },
    ]);
    console.log("wish", wish);

    res.render("user/wishlist", { wish, firstLetter: "", users: "" });
  } catch (error) {
    console.log("error in wishlist get route");
    console.error(error);
  }
};

const Wishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const { variantId, action } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const productVariant = await variant.findById(variantId);
    console.log("product variant details", productVariant);
    if (!productVariant) {
      return res.status(404).json({ error: "Product variant not found" });
    }

    const productDetails = await products.findById(productVariant.product);
    if (!productDetails) {
      return res.status(404).json({ error: "Product not found" });
    }

    let userWishlist = await wishhlist.findOne({ userId });

    if (action === "add") {
      if (!userWishlist) {
        userWishlist = new wishhlist({
          userId,
          products: [
            {
              productId: productDetails._id,
              varientId: productVariant._id,
              productImage: productDetails.images[0],
              productName: productDetails.name,
            },
          ],
        });

        console.log(userWishlist);
      } else {
        const productExists = userWishlist.products.some(
          (item) => item.productId.toString() === productDetails._id.toString()
        );

        if (!productExists) {
          userWishlist.products.push({
            productId: productDetails._id,
            varientId: productVariant._id,
            productImage: productDetails.images[0],
            productName: productDetails.name,
          });
        }
      }

      await userWishlist.save();
      return res.json({ success: true, action: "added" });
    } else if (action === "remove") {
      if (userWishlist) {
        userWishlist.products = userWishlist.products.filter(
          (item) => item.productId.toString() !== productDetails._id.toString()
        );

        await userWishlist.save();
        return res.json({ success: true, action: "removed" });
      } else {
        return res.status(404).json({ error: "Wishlist not found" });
      }
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }
  } catch (error) {
    console.error("Error updating wishlist:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const deleteWishlist = async (req, res) => {
  try {
    const { wishlistId, productId } = req.body;

    if (!wishlistId || !productId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing wishlist or product ID" });
    }

    const updatedWishlist = await wishhlist.findByIdAndUpdate(
      wishlistId,
      { $pull: { products: { _id: productId } } },
      { new: true }
    );

    if (!updatedWishlist) {
      return res
        .status(404)
        .json({ success: false, message: "Wishlist item not found" });
    }

    res.json({ success: true, message: "Product removed from wishlist" });
  } catch (error) {
    console.error("Error deleting wishlist:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const empty = async (req, res) => {
  try {
    res.render("user/EmptyWishlist", { firstLetter: "", users: "" });
  } catch (error) {
    console.log("error in empty wishlist");
    console.error(error);
  }
};

const WishlistAddCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, varientId, quantities } = req.body;
    console.log(req.body);

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

    const TotalPrice = quantities * variantDetails.price;

    let NewCart = new cart({
      userId: userId,
      productId: productId,
      quantity: quantities,
      price: Math.round(variantDetails.price),
      totalPrice: TotalPrice,
      VariantId: varientId,
    });

    await NewCart.save();
    const updatedWishlist = await wishhlist.findOneAndUpdate(
      {
        userId: userId,
      },
      { $pull: { products: { productId: productId } } },
      { new: true }
    );

    return res.json({ success: "Cart Added Successfully" });
  } catch (error) {
    console.log("Error in addCart controller:", error);
    return res.status(500).json({ Wrong: "Something went wrong" });
  }
};

module.exports = {
  loadWishlist,
  Wishlist,
  deleteWishlist,
  empty,
  WishlistAddCart,
};
