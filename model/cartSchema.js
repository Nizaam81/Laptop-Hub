const mongoose=require("mongoose")
const {Schema}=mongoose;

const caetSchema=new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    items:[{
        producrId:{
            type:SchemaTypes.Types.ObjectId,
            ref:"products",
            required:true,
        },
        quantity:{
            type:Number,
            default:1
        },
        price:{
            type:number,
            required:true
        },
        totalPrice:{
            type:number,
            required:true
        },
        status:{
            type:string,
            default:"[laced"
        },
        cancellationReason:{
            type:string,
            defult:"none"
        }
    }]
})
const cart=mongoose.model("cart",cartSchema)
module.exports=cart;