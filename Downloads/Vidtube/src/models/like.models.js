import mongoose, { Schema } from "mongoose";
const LikeSchema = new Schema({
 likedby: {
    type: Schema.Types.ObjectId,
    ref: "User"
 },
 tweet: {
    type: Schema.Types.ObjectId,
    ref: "tweet"
 },video:{
    type: Schema.Types.ObjectId,
    ref: "video"
 },
 comment:{
    type: Schema.Types.ObjectId,
    ref: "comment"
 },
},{timestamps : true})
export const Like = mongoose.model("Like" , LikeSchema)