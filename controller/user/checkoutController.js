const cart = require("../../model/cartSchema");
const user = require("../../model/usersSchema");
const variant = require("../../model/varient");
const mongoose = require("mongoose");
const address = require("../../model/addressSchema");
const ObjectId = mongoose.Types.ObjectId;
const coupon = require("../../model/couponSchema");
const loadcheckout = async (req, res) => {
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
      {
        $unwind: "$variantDetails",
      },
      {
        $match: {
          "variantDetails.quantity": { $gt: 0 },
        },
      },
    ]);
    console.log(carts);

    const Adress = await address.find({ userId: userId });

    const totalPrice = carts.reduce((sum, num) => sum + num.totalPrice, 0);

    const availableCoupons = await coupon.find({ isList: true });
    console.log("available coupons", availableCoupons);
    const userid = req.session.user;

    const users = await user.findOne({ _id: userid });
    const firstLetter = users.FirstName.charAt(0);

    res.render("user/checkout", {
      carts,
      totalPrice,
      firstLetter,
      users,
      Adress,
      availableCoupons,
    });
  } catch (error) {
    console.log("Error in loadCheckout");
    console.error(error);
  }
};

module.exports = {
  loadcheckout,
};
