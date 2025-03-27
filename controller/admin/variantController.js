const product = require("../../model/productSchema");
const { findById } = require("../../model/usersSchema");
const variant = require("../../model/varient");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const loadvarient = async (req, res) => {
  try {
    const productId = req.params.id;
    const products = await product.findById(productId);
    const varients = await variant.aggregate([
      { $match: { product: new ObjectId(productId) } },

      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
    ]);

    res.render("admin/varients", { varients, products });
  } catch (error) {
    console.error(error);
    console.log("error in loadvarient");
  }
};

const addVarient = async (req, res) => {
  try {
    const { productId, ramSize, variantPrice, variantQuantity } = req.body;

    if (!productId || !ramSize || !variantPrice || !variantQuantity) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const NewVarient = new variant({
      product: productId, // This matches schema
      ramSize: ramSize, // This matches schema
      price: variantPrice, // Changed from variantPrice to price to match schema
      quantity: variantQuantity, // Changed from variantQuantity to quantity to match schema
    });
    await NewVarient.save();
    return res.json({ message: "Added Successfully" });
  } catch (error) {
    console.error("Error in AddVariant POST request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const toggleStatus = async (req, res) => {
  const { id } = req.body;
  try {
    const varient = await variant.findById(id);
    if (!varient) {
      return res.status(404).json({ error: "Variant not found" });
    }

    varient.isAvailable = !varient.isAvailable;
    await varient.save();

    return res.status(200).json({
      message: "Status updated successfully",
      status: varient.isAvailable,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const updatevariant = async (req, res) => {
  try {
    const { productName, editVariant, editVariantPrice, quantity, variantId } =
      req.body;

    if (
      !productName ||
      !editVariant ||
      !editVariantPrice ||
      !quantity ||
      !variantId
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    const updatedVariant = await variant.findByIdAndUpdate(
      variantId,
      {
        $set: {
          "productDetails.0.name": productName,
          ramSize: editVariant,
          price: editVariantPrice,
          quantity: quantity,
        },
      },
      { new: true }
    );

    if (!updatedVariant) {
      return res
        .status(404)
        .json({ success: false, message: "Variant not found." });
    }

    res.json({
      success: true,
      message: "Variant updated successfully.",
      updatedVariant,
    });
  } catch (error) {
    console.error("Error updating variant:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  loadvarient,
  addVarient,
  toggleStatus,
  updatevariant,
};
