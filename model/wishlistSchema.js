const mongoose = require("mongoose");
const { Schema } = mongoose;

const wishlistSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  products: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product", // Ensure consistency with your Product model
        required: true,
      },
      productImage: {
        type: String,
        required: true,
      },
      productName: {
        type: String,
        required: true,
      },
      addedOn: {
        // Changed 'addedOne' to 'addedOn' (if this was the intended meaning)
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const Wishlist = mongoose.model("Wishlist", wishlistSchema); // Capitalized 'Wishlist' for consistency
module.exports = Wishlist;
