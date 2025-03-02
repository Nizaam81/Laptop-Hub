const user = require("../../model/usersSchema");
const variant = require("../../model/varient");
const products = require("../../model/productSchema");
const walletModel = require("../../model/walletSchema"); // Renamed import to avoid conflicts

const loadWallet = async (req, res) => {
    try {

        const userId = req.session.user
      
   
         const walletData = await walletModel.findOne({userId:userId})
       
         
        res.render("user/wallet", { firstLetter: "", users: "",walletData });
    } catch (error) {
        console.error(error);
        console.log("Error in loadWallet controller");
    }
};

const addMoney = async (req, res) => {
    const amount = Number(req.body.amount); 
    const userId = req.session.user;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount." });
    }

    try {
        let userWallet = await walletModel.findOne({ userId });

        if (!userWallet) {
         
            userWallet = new walletModel({
                userId,
                totalBalance: amount, 
                transactions: [
                    {
                        type: "Deposit",
                        amount: amount,
                        status: "Completed",
                        description: "Added money to wallet",
                        date: new Date(),
                    },
                ],
            });

            await userWallet.save();
        } else {
            
            userWallet.totalBalance += amount;
            userWallet.transactions.push({
                type: "Deposit",
                amount: amount,
                status: "Completed",
                description: "Added money to wallet",
                date: new Date(),
            });

            await userWallet.save();
        }

        res.json({
            message: "Money added successfully!",
            totalBalance: userWallet.totalBalance,
            transactions: userWallet.transactions,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error. Please try again later." });
    }
};


module.exports = {
    loadWallet,
    addMoney,
};
