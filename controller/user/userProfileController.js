const user = require("../../model/usersSchema");
const bcrypt = require("bcrypt");
const address = require("../../model/addressSchema");

const userprofile = async (req, res) => {
  try {
    const userid = req.session.user;
    const users = await user.findOne({ _id: userid });

    res.render("user/userProfile", { users, firstLetter: "" });
  } catch (error) {
    console.log("error in userprofile");
    console.error(error);
  }
};

const changeProfile = async (req, res) => {
  try {
    const {
      userId,
      fname,
      lname,
      phone,
      currentpassword,
      NewPassword,
      Cpassword,
    } = req.body;

    // Find user by ID
    const User = await user.findById(userId);
    if (!User) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Validate phone number (must be 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number. Must be 10 digits.",
      });
    }

    if (currentpassword || NewPassword || Cpassword) {
      if (!currentpassword || !NewPassword || !Cpassword) {
        return res.status(400).json({
          success: false,
          message: "All password fields are required.",
        });
      }

      const passwordMatch = await bcrypt.compare(
        currentpassword,
        User.password
      );
      if (!passwordMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Current password is incorrect." });
      }

      if (NewPassword !== Cpassword) {
        return res.status(400).json({
          success: false,
          message: "New password and confirm password do not match.",
        });
      }

      const salt = await bcrypt.genSalt(10);
      User.password = await bcrypt.hash(NewPassword, salt);
    }

    User.FirstName = fname;
    User.LastName = lname;
    User.phone = phone;

    await User.save();

    return res
      .status(200)
      .json({ success: true, message: "Profile updated successfully!" });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const Addaddress = async (req, res) => {
  try {
    const {
      userId,
      address_type,
      name,
      city,
      landmark,
      state,
      pincode,
      phone,
      alt_phone,
    } = req.body;

    const neWaddress = new address({
      userId: userId,
      addressType: address_type,
      name: name,
      city: city,
      landMark: landmark,
      state: state,
      pincode: pincode,
      phone: phone,
      altPhone: alt_phone,
    });
    await neWaddress.save();
    res.json({ message: "Added succesfully" });
  } catch {
    console.log(error);
    console.log("error in add address controller in userProfileController");
  }
};

const userPersonalInformation = async (req, res) => {
  try {
    const userid = req.session.user;
    const userData = await user.findById(userid);
    const users = await user.findById({ _id: userid });
    const firstLetter = users.FirstName.charAt(0);
    res.render("user/Personalnformation.ejs", { users, firstLetter, userData });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  userprofile,
  Addaddress,
  changeProfile,
  userPersonalInformation,
};
