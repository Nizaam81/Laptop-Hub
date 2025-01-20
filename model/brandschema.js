const mongoose=require("mongoose")
const {Schema}=mongoose;

const brandSchema=new Schema({
    brandName:{
        type:string,
        required:true,

    },
    brandImage:{
        type:[string],
        requied:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    createAt:{
        type:Date,
        default:Date.now
    }
})
const Brand=mongoose.model("Brand",brandSchema)
module.exports=Brand;