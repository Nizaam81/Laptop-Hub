const Address = require("../../model/addressSchema");
const mongoose = require("mongoose");
const User = require("../../model/usersSchema");

const loadAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) {
      return res.redirect("/login");
    }

    const addreses = await Address.find({ userId });
    console.log("address fata ", addreses);
    const user = await User.findById(userId); // Fetch user details

    const userid = req.session.user;

    const users = await User.findOne({ _id: userid });
    const firstLetter = users.FirstName.charAt(0);

    res.render("user/address", { firstLetter, user, addreses, users });
  } catch (error) {
    console.error("loadAddress function error", error);
    res.status(500).send("Internal Server Error");
  }
};

const addAddres = async (req, res) => {
  try {
    const userId = req.session.user;

    res.render("user/addAddress", { firstLetter: "", userId, users: "" });
  } catch (error) {
    console.log("error in addAddress route ");
  }
};

const editAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const addressId = req.params.id;
    console.log("adressId", addressId);
    const address = await Address.findOne({ userId: userId });
    console.log("edit address data", address);

    res.render("user/editAddress", {
      firstLetter: "",
      users: "",
      address: address,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/user/profile");
  }
};
const updateAddress = async (req, res) => {
  try {
    const {
      userId,
      addressId,
      addressType,
      name,
      city,
      landmark,
      state,
      pincode,
      phone,
      altPhone,
    } = req.body;
    console.log(req.body);

    await Address.findOneAndUpdate(
      { _id: addressId },
      {
        $set: {
          addressType: addressType,
          name: name,
          city: city,
          landmark: landmark,
          state: state,
          pincode: pincode,
          phone: phone,
          altPhone: altPhone,
        },
      },
      { new: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};

const deleteAddress = async (req, res) => {
  const { id } = req.body;

  const userId = req.session.user;

  if (!id) {
    return res.status(400).json({ error: "Address ID is missing" });
  }

  try {
    const updatedAddress = await Address.findByIdAndDelete({ _id: id });

    if (!updatedAddress) {
      return res.status(404).json({ error: "Address not found" });
    }

    return res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  loadAddress,
  addAddres,
  editAddress,
  updateAddress,
  deleteAddress,
};
