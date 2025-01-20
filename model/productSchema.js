const mongoose=require("mongoose")
const {Schema}=mongoose;

const productSchema=new Schema({
    productName:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    brand:{
        type:String,
        required:true,
    },
    category:{
        type:Schema.Types.ObjectId,
        ref:"category",
        required:true,
    },
    regularPrice:{
        type:number,
        required:true,
    },
    salePrice:{
        type:Number,
        required:true
    },
    productOffer:{
        type:Number,
        default:0,
    },
    quantity:{
        type:Number,
        default:true
    },
    color:{
        type:String,
        required:true,
    },
    producrImage:{
        type:[string],
        required:true,
    },
    isBlock:{
        type:Boolean,
        default:false,
    },
    status:{
        type:string,
        enum:["availabe","out of stock","Discountinued"],
        require:true,
        default:"Available",
    },
    
},{timestamp:true})
const product=mongoose.model("product",productSchema)
module.export=product;