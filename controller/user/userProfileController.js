const user= require("../../model/usersSchema")
const bcrypt = require("bcrypt");
const address = require("../../model/addressSchema")



const userprofile=async(req,res)=>{
    try {
        const userid =req.session.user
        const users= await user.findOne({_id:userid});

      res.render("user/userProfile",{users,firstLetter:""})  
    } catch (error) {
        console.log("error in userprofile")
        console.error(error)
    }
}

const updateEmail = async (req, res) => {
    try {
        const { email, userId } = req.body; 
      

       
        if (!email || !userId) {
            return res.status(400).json({ error: "Email and userId are required" });
        }

        const existingUser = await user.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ existError: "This email already exists" });
        }

    
        const updatedUser = await user.findByIdAndUpdate(
            userId, 
            { email: email.toLowerCase() }, 
            { new: true, runValidators: true } 
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({ success: "Email updated successfully", user: updatedUser });

    } catch (error) {
        console.error("Error updating email:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


 
const updatePassword = async (req, res) => {
    try {
        console.log("Update function is working");
        const { currentPassword, newPassword, userId } = req.body;
        console.log("Received data:", req.body);

       
        const User = await user.findById(userId);
        if (!User) {
            return res.status(404).json({ message: "User not found!" });
        }

       
        const isMatch = await bcrypt.compare(currentPassword, User.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect!" });
        }

     
        const hashedPassword = await bcrypt.hash(newPassword, 10);

       
        User.password = hashedPassword;
        await User.save();

      
        res.status(200).json({ message: "Password updated successfully!" });

    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
};




const Addaddress = async (req, res) => {
    try {
        const { userId, address_type, name, city, landmark, state, pincode, phone, alt_phone } = req.body;

      
        let userAddress = await address.findOne({ userId });

        const newAddress = {
            addressType: address_type,
            name,
            city,
            landMark: landmark,
            state,
            pincode,
            phone,
            altPhone: alt_phone
        };

        if (!userAddress) {
           
            userAddress = new address({
                userId,
                address: [newAddress]
            });
        } else {
            
            const isDuplicate = userAddress.address.some(addr => 
                addr.city === city && 
                addr.state === state &&
                addr.pincode === pincode &&
                addr.landMark === landmark &&
                addr.phone === phone
            );

            if (isDuplicate) {
                return res.status(400).json({ message: "Address already exists" });
            }

           
            userAddress.address.push(newAddress);
        }

       
        await userAddress.save();

        res.status(201).json({ message: "Address added successfully", userAddress });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};




module.exports={
    userprofile,
    updateEmail,
    updatePassword,
    Addaddress
}