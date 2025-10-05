
import { asyncHandler } from "../utils/asyncHandler.js";
import { Apierror } from "../utils/Apierror.js";
import { UploadOnCloudinary ,deletefromCloudinary} from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResonse.js";
// import { https } from "winston";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";




try { 
    const generateRefreshAccessToken = async (userId) =>{
        const user = await User.findById(userId)
        if(!user) 
            throw new Apierror(404,"User Not Found")
    
        const refreshToken = user.generateRefreshToken;
        const accesstoken = user.generateAccessToken;
    
    
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})
        return {refreshToken,accesstoken}
    }
} catch (error) {
    throw Apierror(500,"Something went wrong while genating refresh token and access token")
}


const registerUser = asyncHandler(async(req,res) =>{
    //to do
    const {fullname,email,password,username} = req.body

    // validation
    if(
        [fullname,email ,password,username].some((field) => field?.trim ==="")
        ) {       throw new Apierror(400,"All field are required")
        }
        const existedUser = await User.findOne({
        $or : [{email},{username: username.toLowerCase()}]
        })
        if(existedUser){
            throw new Apierror(409,"User already exists with this email or username")
        }

        console.warn(req.files);
        
        const avatarLocalpath = req.files?.avatar?.[0]?.path
        const coverLocalpath = req.files?.coverImage?.[0]?.path
          

        if(!avatarLocalpath){
            throw new Apierror(409,"Avatar file is missing")
        }
        // const avatar = await UploadOnCloudinary(avatarLocalpath)
        // let coverImage = ""
        // if(coverLocalpath){
        //     coverImage = await UploadOnCloudinary(coverLocalpath)
        // }
        let avatar;
        try{
            avatar = await UploadOnCloudinary(avatarLocalpath)
            console.log("Upload avatar",avatar);
            
        }catch (error) {
            console.log("avatar uploading error",error);
            throw new Apierror(500,"Failed to upload error")
            
            
        }

        let coverImage;
        try{
            coverImage = await UploadOnCloudinary(coverLocalpath)
            console.log("Uploaded  coverImage",coverImage);
            
        }catch (error) {
            console.log("coverImage uploading error",error);
            throw new Apierror(500,"Failed to upload error")
            
            
        }
        try {
            const user = await User.create({
                fullname,
                avatar : avatar.url,
                coverImage: coverImage?.url || "",
                email,
                password,
                username: username.toLowerCase()
            })
    
            const CreatedUser = await User.findById(user._id).select(
                "-password" 
            )
            if(!CreatedUser){
                throw new Apierror(500,"Something is went Wrong while Registering user")
            }
    
            return res
            .status(201)
            .json( new ApiResponse(200,CreatedUser,"User Registered Successfully"))
        } catch (error) {
            console.log("User creation failed");

            if(avatar){
               await deletefromCloudinary(avatar.public_id)
            }
            if(coverImage){
                await deletefromCloudinary(coverImage.public_id)
            }
             throw new Apierror(500,"Something is went Wrong while Registering user and images were delelted")

        }
})

const logoutUser = asyncHandler(async (req,res) =>{
  await User.findByIdAndUpdate(req.user._id,{
    $set: {
        refreshToken: undefined
    }

},{new: true})

const option = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
    // expires: new Date(Date.now())
}
return res.status(200)
.clearCookie("refreshToken",option)
.clearCookie("accessToken",option)
.json(new ApiResponse(200,"User Logged out Successfully"))
})

const loginUser = asyncHandler(async (req,res) =>{
    //get data from body
    const {email,username,password} = req.body 
    if(!email && !username){
        throw new Apierror(400,"Email or username is required to login")
    }
    if(!password?.trim()){
        throw new Apierror(400,"Password is required to login")
    }
    //find user
    const currentUser = await User.findOne({
        $or : [{email},{username: username.toLowerCase()}]
        })
       if(!currentUser){
           throw new Apierror(404,"User Not Found")
       }

       //validate password
       const isPasswordValid = await currentUser.isPasswordCorrect(password)
       if(!isPasswordValid){
           throw new Apierror(401,"Password is incorrect")
       }

       const {refreshToken,accesstoken} = await generateRefreshAccessToken(currentUser._id)
       const loggedInUser = await User.findById(currentUser._id).select("-password -refreshToken");


    const option = {
               httpOnly: true,
               secure: process.env.NODE_ENV === "production",
           }

           return res.status(200)
           .cookie("refreshToken",refreshToken,option)
           .cookie("accessToken",accesstoken,option)
           .json(new ApiResponse(200,{
               user: loggedInUser,
               accesstoken
           },"User Logged in Successfully"))
})

const refreshAccessToken = asyncHandler(async (req,res) =>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new Apierror(400,"Refresh token is missing")
    }
    try {
        const findedcode = jwt.verify(incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET)
           const user  = await User.findById(findedcode?._id)
           if(!user) {
            throw new Apierror(404,"Failed to find user with this token")
           }
              if(incomingRefreshToken !== user?.refreshToken){
                throw new Apierror(403,"Refresh token is expired , not in database")
              }

              const option ={
                httpOnly:true,
                secure: process.env.NODE_ENV === "production"
              }
              const {refreshToken :newRefreshToken,accesstoken} = 
              await generateRefreshAccessToken(user._id)
              return res.status(200)
              .cookie("refreshToken",newRefreshToken,option)
              .cookie("accessToken",accesstoken,option)
              .json(new ApiResponse(200,{
                  accesstoken,
                  refreshToken : newRefreshToken
              },
              "Access token refreshed successfully"
            ));
    
            } catch (error) {
               throw new Apierror(403,"Invalid refresh token")
           }

})


const changeCurrentPassword = asyncHandler( async (req,res) =>{ 
    const {oldPassword,newPassword} = req.body
    if(!oldPassword?.trim() || !newPassword?.trim()){
        throw new Apierror(400,"Old password and new password are required")
    }
    const user = await User.findById(req.user._id)
    if(!user){
        throw new Apierror(404,"User not found")
    }
    const isPasswordValid =  await user.isPasswordCorrect(oldPassword) 
    if(!isPasswordValid){
        throw new Apierror(401,"Old password is incorrect")
    }
    user.password = newPassword
    await user.save()
    return res.status(200).json(new ApiResponse(200,{},"Password Changed Successfully"))
})

const updateUserProfile = asyncHandler(async (req,res) =>{
    const {fullname,email} = req.body
    if(!fullname?.trim() || !email?.trim()){
        throw new Apierror(400,"Fullname and email are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id, {
    // if(!user){
    //     throw new Apierror(404,"User not found")
    // }
    $set: {
        fullname, 
        email: email
    }
    },
    {new:true},
)
    // await user.save()
    return res.status(200).json(new ApiResponse(200,user,"Profile Updated Successfully"))
})
const updateUseravatar = asyncHandler(async (req,res) =>{
const avatarLocalpath = req.file?.path
if(!avatarLocalpath){
    throw new Apierror(400,"Avatar file is missing")
}
const avatar = await UploadOnCloudinary(avatarLocalpath) 
if(!avatar.url){
    throw new Apierror(500,"Failed to upload avatar")
}
await User.findByIdAndUpdate
(req.user?._id,
    {
    $set: {
        avatar: avatar.url,
    },
},
    {new: true}
).select("-password -refreshToken")
return res.status(200).json(new ApiResponse(200,{},"Avatar Updated Successfully"))
})

const updateUserCoverImage = asyncHandler(async (req,res) =>{
    const coverImageLocalpath = req.file?.path
    if(!coverImageLocalpath){
        throw new Apierror(400 ,"cover image file is missing")
    }
    const coverImage = await UploadOnCloudinary(coverImageLocalpath)
    if(!coverImage.url){
        throw new Apierror(500,"Failed to upload cover image")
    }
    await User.findByIdAndUpdate(
    req.file?._id, 
    {
        $set:
        {
            coverImage: coverImage.url
        }
    },
    {new: true}    
    ).select("-password -refreshToken")
    return res.status(200)
    .json(new ApiResponse(200,{},"Cover Image Updated Successfully"))

})
const getUserChannelProfile = asyncHandler(async (req,res) =>{
 const  {username} = User.params // url se username lena
 if(!username?.trim()){
    throw new Apierror(400,"Username is required")
 }
 const channel = await User.aggregate([
    {
        $match:{
            username:username?.toLowerCase()
        }
    },
   
    {
        $lookup:{
            from: "subscriber",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
    },
    {
        $lookup:{
            from: "subscriber",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedChannelto"
        }
    },
     {
            $addFields:{
                subscriberCount:{
                    $size: "$subscribers"
                },
                channelcount:{
                    $size: "$subscribedChannelto"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
                
            }
    },
        {
            $project:{
                password: 0,
                refreshToken: 0,
                subscribers: 0,
                subscribedChannelto: 1,
                fullname: 1,
                email: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                channelcount: 1
            }
        }

 ])
 if(!channel?.length){
    throw new Apierror(404,"Channel not found")
 }
 return res.status(200)
 .json(new ApiResponse(200,channel[0],"Channel profile fetched successfully"))
})

const getWatchHistory = asyncHandler (async (req,res)=>{
 const user = await User.aggregate([
    {
        $match:{
            _id : mongoose.Types.ObjectId(req.user?._id) 
        }
    },
   {
        $lookup:{
            from: "users",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory"
             ,
             pipeline: [{
            $lookup:{
                from: "user",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
                    ,pipeline: [{
                        $project:{  
                        fullname:1,
                        email:1,
                        avatar:1
                        }
                     }]
                    }
            },
         {
                $addFields: {
                    owner : {
                        $first :"$owner"
                    }
                }
            }
            ]
        }
           
            
        }
    
 ])
 return res.status(200)
 .json(new ApiResponse(200,user[0],"Watch History Ftech Succesfully"))
})

export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    updateUserProfile,
    changeCurrentPassword,
    getWatchHistory,
    updateUserCoverImage,
    updateUseravatar,
    getUserChannelProfile
   

}