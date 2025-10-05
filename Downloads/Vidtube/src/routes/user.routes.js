import { Router } from "express";
import {registerUser,logoutUser, loginUser,
     refreshAccessToken, updateUserProfile , 
     changeCurrentPassword,getUserChannelProfile,
     updateUseravatar,updateUserCoverImage ,getWatchHistory} from "../controller/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { get } from "mongoose";


const router = Router()
// router.route("/register").post(
//     upload.fields([
//     {
//         name: "avatar",
//         maxCount : 1
//     },{
//         name: "coverImage",
//         maxCount : 1
//     }
// ]),registerUser)
router.post("/register",upload.fields([
    {name:"avatar", maxCount:1},{name:"coverImage",maxCount:1}
]),
registerUser
);

router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)

router.route("/logout").post(verifyJWT,logoutUser)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getUserChannelProfile)
router.route("/c/username").get(verifyJWT,getUserChannelProfile)
router.route("/update-account").patch(verifyJWT,updateUserProfile)
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUseravatar)
router.route("/coverimage").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage) 
router.route("/history").get(verifyJWT,getWatchHistory)

export default router
