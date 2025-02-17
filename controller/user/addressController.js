const Address=require("../../model/addressSchema");
const mongoose = require('mongoose');
const User = require("../../model/usersSchema");

const loadAddress = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.redirect("/login"); // Redirect if user is not logged in
        }

        const addreses = await Address.findOne({ userId });
        const user = await User.findById(userId); // Fetch user details

        res.render("user/address", { firstLetter: "", user, addreses,users:"" });
    } catch (error) {
        console.error("loadAddress function error", error);
        res.status(500).send("Internal Server Error");
    }
};


const addAddres=async(req,res)=>{
    try {
        const userId=req.session.user;
        
        res.render("user/addAddress",{firstLetter:"",userId,users:""})
    } catch (error) {
        console.log("error in addAddress route ")
    }
}

const editAddress = async (req, res) => {     
    try {     
        const userId=req.session.user;    
        const addressId = req.params.id;        
        const address = await Address.findOne({userId:userId})
      
        const totalAddress = address.address.filter(element=>{
            return element._id == addressId
        })
     
        if (!address) {             
            return res.redirect('/user/profile');         
        }                  
        
        res.render("user/editAddress", {             
            firstLetter: "",             
            users: "",             
            address: address ,
            totalAddress        
        });     
    } catch (error) {         
        console.error(error);         
        res.redirect('/user/profile');     
    } 
};
const updateAddress = async (req, res) => {
    try {
        console.log("hAI")
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
            addressIds
        } = req.body;
       
             
                await Address.findOneAndUpdate(
                    { _id: addressId, "address._id": addressIds }, // Find document where address._id matches
                    {
                      $set: {
                        "address.$.addressType": addressType,
                        "address.$.name": name,
                        "address.$.city": city,
                        "address.$.landmark": landmark,
                        "address.$.state": state,
                        "address.$.pincode": pincode,
                        "address.$.phone": phone,
                        "address.$.altPhone": altPhone
                      }
                    },
                    { new: true } // Returns the updated document
                  );
                  

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
};



const deleteAddress = async (req, res) => {
    const { id } = req.body;
    const userId = req.session.user; // Get user ID from session

 

    if (!id) {
        return res.status(400).json({ error: "Address ID is missing" });
    }

    try {
       
        const updatedAddress = await Address.findOneAndUpdate(
            { userId: userId }, 
            { $pull: { address: { _id: id } } }, 
            { new: true }
        );

        

        if (!updatedAddress) {
            return res.status(404).json({ error: "Address not found" });
        }

        return res.status(200).json({ message: "Address deleted successfully" });
    } catch (error) {
        console.error("Delete error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};




module.exports={
    loadAddress,
    addAddres,
    editAddress,
    updateAddress,
    deleteAddress
}