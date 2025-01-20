const mongoose=require("mongoose")
const {Schema}=mongoose;
const{v4:uuidv4}=require('uuid');

const orderSchema=new schema({
    orderId:{
        type:String,
        default:()=>uuidv4(),
            unique:true
        
    },
    orderItem:[{

        product:{
            type:schema.Types.objectId,
            ref:"product",
            required:true,
        },
        quantity:{
            type:number,
            required:true,

        },
        price:{
            type:number,
            default:0,

        },
    }],
    totalPrice:{
        type:number,
        required:true
    },
    discount:{
        type:number,
        default:0
    },
    finalAmount:{
        type:number,
        required:true
    },
    address:{
        type:string.types.objectId,
        ref:"user",
        required:true,
    },
    invoiceDate:{
        type:Date,
    },
    status:{
        type:String,
        required:true,
        enum:["pending","processing","shipped","Delivered","Cancelled","Return Request","Returned"]

    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    couponApplied:{
        type:Boolean,
        default:false
    }

})
const order=mongoose.model("order",orderSchema);
module.exports=order;