const user = require("../../model/usersSchema");
const variant = require("../../model/varient");
const products = require("../../model/productSchema");
const walletModel = require("../../model/walletSchema");

const loadWallet = async (req, res) => {
  try {
    const user = req.session.user;

    const walletData = await walletModel.findOne({ userId: user });
    const userid = req.session.user;

    const users = await user.findOne({ _id: userid });
    const firstLetter = users.FirstName.charAt(0);
    res.render("user/wallet", { walletData, users, firstLetter });
  } catch (error) {
    console.error(error);
    console.log("error in loadcontroller");
  }
};

module.exports = {
  loadWallet,
};
