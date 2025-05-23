const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const coupon = require("../model/couponSchema");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);

    console.log("MongoDB connected");
  } catch (error) {
    console.log("mongoDB connection failed!!!", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
