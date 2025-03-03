const Coupon = require("../../model/couponSchema");

const loadcoupon = async (req, res) => {
  try {
    const Coupons = await Coupon.find();

    res.render("admin/couponManagment", { Coupons });
  } catch (error) {
    console.error("Error in coupon management:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const addCoupon = async (req, res) => {
  try {
    const { couponName, startDate, endDate, offerPrice, minimumPrice } =
      req.body;
    console.log("Coupon Data Received:", req.body);

    if (!couponName || !startDate || !endDate || !offerPrice || !minimumPrice) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const existingCoupon = await Coupon.findOne({ name: couponName });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon already exists!" });
    }

    const offerPriceNum = Number(offerPrice);
    const minimumPriceNum = Number(minimumPrice);

    if (isNaN(offerPriceNum) || isNaN(minimumPriceNum)) {
      return res
        .status(400)
        .json({ message: "Offer price and minimum price must be numbers!" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start > end) {
      return res
        .status(400)
        .json({ message: "Start date cannot be after end date." });
    }

    if (end < now) {
      return res
        .status(400)
        .json({ message: "End date cannot be in the past." });
    }

    const newCoupon = new Coupon({
      name: couponName,
      createdOn: now,
      expireOn: end,
      offerPrice: offerPriceNum,
      minimumPrice: minimumPriceNum,
    });

    await newCoupon.save();
    res
      .status(201)
      .json({ message: "Coupon added successfully!", coupon: newCoupon });
  } catch (error) {
    console.error("Error adding coupon:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const toggleBlockCoupon = async (req, res) => {
  try {
    const { CouponId } = req.body;

    const Couponss = await Coupon.findById(CouponId);
    Couponss.isList = !Couponss.isList;
    await Couponss.save();
    res.json({ success: true, isList: Couponss.isList });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to toggle Coupon status" });
  }
};

module.exports = {
  loadcoupon,
  addCoupon,
  toggleBlockCoupon,
};
