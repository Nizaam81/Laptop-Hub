const Coupon = require("../../model/couponSchema");
const User = require("../../model/usersSchema");
const getAvailableCoupons = async (req, res) => {
  try {
    const userId = req.session.user;
    const { totalPrice } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const coupons = await Coupon.find({
      isList: true,
      expireOn: { $gt: new Date() },
    });

    const eligibleCoupons = coupons.filter(
      (coupon) => totalPrice >= coupon.minimumPrice
    );

    const user = await User.findById(userId);

    if (!user.usedCoupons) {
      user.usedCoupons = [];
      await user.save();
    }

    const availableCoupons = eligibleCoupons.filter(
      (coupon) => !user.usedCoupons.includes(coupon._id)
    );

    return res.status(200).json({
      success: true,
      coupons: availableCoupons,
    });
  } catch (error) {
    console.error("Error fetching available coupons:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const userId = req.session.user;
    const { couponCode, totalPrice } = req.body;

    const coupon = await Coupon.findOne({ name: couponCode, isList: true });

    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid coupon code" });
    }

    if (new Date() > coupon.expireOn) {
      return res
        .status(400)
        .json({ success: false, message: "This coupon has expired" });
    }

    if (totalPrice < coupon.minimumPrice) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase of ₹${coupon.minimumPrice} required`,
      });
    }

    let discount = Math.min(coupon.offerPrice, totalPrice);

    await User.findByIdAndUpdate(userId, {
      $addToSet: { usedCoupons: coupon._id },
    });

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      discount,
      couponId: coupon._id,
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

module.exports = { getAvailableCoupons, applyCoupon };
