import mongoose,{Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber:{
        typeof: Schema.Types.ObjectId,   // One who is subscribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, //One to whom
        ref: "User"
    }
},{timestamps:true})



export const Subscription = mongoose.model("Subscription",subscriptionSchema)