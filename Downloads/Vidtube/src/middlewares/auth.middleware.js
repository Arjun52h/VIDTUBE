import jwt from 'jsonwebtoken';
import { Apierror } from '../utils/Apierror.js';
import { User } from '../models/user.models.js';
import {asyncHandler} from '../utils/asyncHandler.js';

export const verifyJWT = asyncHandler(async (req,_,next)=>{
    const token = req.cookies.accessToken || req.header('Authorization')?.replace('Bearer ','');
    if(!token){
        return next(new Apierror(401,"you are not logged in, please log in to get access"))
    }
    try {
        const decodedToken = jwt.verify(token,
            process.env.ACCESS_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken._id).select("-password,-refreshToken")
        if(!user){
            return next(new Apierror(401,"the user belonging to this token no longer exist"))
        }
        req.user = user
        next()
    } catch (error) {
        throw new Apierror(401,error?.message || "invalid token, please log in again")
    }
})